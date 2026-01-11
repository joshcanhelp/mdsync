import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { scanSourceFiles } from "./scanner.js";
import { buildLinkMap } from "./transformations/link-resolver.js";
import { transformFrontmatter } from "./transformations/frontmatter-transformer.js";
import { transformFileEmbeds } from "./transformations/file-embed-transformer.js";
import { parseFrontmatterFromString, stringifyFrontmatter } from "./frontmatter.js";
import type { Config, SyncResult, SyncStatus } from "./types.js";

export async function syncFiles(config: Config, verbose: boolean = false): Promise<SyncResult> {
  const sourceFiles = await scanSourceFiles(config);
  const result: SyncResult = {
    copied: 0,
    deleted: 0,
    collisions: [],
    errors: [],
    unresolvedLinksCount: 0,
    unresolvedLinks: verbose ? [] : undefined,
    filesCopied: 0,
  };

  // Check for collisions with other users
  const collisions = await detectCollisions(sourceFiles, config.userId);
  if (collisions.length > 0) {
    result.collisions = collisions;
    throw new Error(
      `Collision detected: ${collisions.length} file(s) would conflict with other users. Resolve manually:\n${collisions.join("\n")}`
    );
  }

  // Build link map for wikilink transformation
  const linkMap = await buildLinkMap(config);

  // Transform and copy source files to output locations
  for (const file of sourceFiles) {
    try {
      await mkdir(dirname(file.outputPath), { recursive: true });

      // Read file content
      const fileContent = await readFile(file.absolutePath, "utf-8");
      const { frontmatter, content } = parseFrontmatterFromString(fileContent);

      // Transform frontmatter and content
      const transformationResult = transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        config,
        file.relativePath
      );

      // Transform file embeds in main content
      const fileEmbedResult = await transformFileEmbeds(
        transformationResult.content,
        config.sourceDir,
        config.outputDir
      );

      // Check for file embed errors (missing files stop sync)
      if (fileEmbedResult.errors.length > 0) {
        result.errors.push(...fileEmbedResult.errors);
        throw new Error(`File embed errors in ${file.relativePath}. Stopping sync.`);
      }

      // Track copied files
      result.filesCopied += fileEmbedResult.copiedFiles.length;

      // Track unresolved links
      result.unresolvedLinksCount += transformationResult.unresolvedLinks.length;
      if (verbose && result.unresolvedLinks) {
        result.unresolvedLinks.push(...transformationResult.unresolvedLinks);
      }

      // Build output with transformed frontmatter and content
      const outputContent = stringifyFrontmatter(
        transformationResult.frontmatter,
        fileEmbedResult.content
      );

      // Write transformed content
      await writeFile(file.outputPath, outputContent, "utf-8");
      result.copied++;
    } catch (error) {
      result.errors.push(new Error(`Failed to copy ${file.relativePath}: ${error}`));
    }
  }

  // Clean up orphaned output files
  const outputPaths = new Set(sourceFiles.map((f) => f.outputPath));
  const orphanedFiles = await findOrphanedFiles(config.outputDir, config.userId, outputPaths);

  for (const orphanedFile of orphanedFiles) {
    try {
      await unlink(orphanedFile);
      result.deleted++;
    } catch (error) {
      result.errors.push(new Error(`Failed to delete ${orphanedFile}: ${error}`));
    }
  }

  return result;
}

export async function getStatus(config: Config): Promise<SyncStatus> {
  const sourceFiles = await scanSourceFiles(config);
  const collisions = await detectCollisions(sourceFiles, config.userId);
  const outputPaths = new Set(sourceFiles.map((f) => f.outputPath));
  const toDelete = await findOrphanedFiles(config.outputDir, config.userId, outputPaths);

  return {
    toCopy: sourceFiles,
    toDelete,
    collisions,
  };
}

export async function cleanFiles(config: Config): Promise<number> {
  const userFiles = await findUserFiles(config.outputDir, config.userId);
  let deleted = 0;

  for (const file of userFiles) {
    try {
      await unlink(file);
      deleted++;
    } catch (_error) {
      // Ignore errors during cleanup
    }
  }

  return deleted;
}

async function detectCollisions(
  sourceFiles: { outputPath: string }[],
  userId: string
): Promise<string[]> {
  const collisions: string[] = [];

  for (const file of sourceFiles) {
    const dir = dirname(file.outputPath);
    const filename = basename(file.outputPath);
    const name = basename(filename, extname(filename));
    const ext = extname(filename);

    // Extract base name without user ID (format: basename.userid.ext)
    const userIdSuffix = `.${userId}${ext}`;
    if (!filename.endsWith(userIdSuffix)) {
      continue;
    }
    const baseName = name.slice(0, -userId.length - 1);

    // Check if other users have files with same base name
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const entryName = basename(entry.name, extname(entry.name));
        // Check if this is the same base name but different user
        if (entryName.startsWith(`${baseName}.`) && entry.name !== filename) {
          collisions.push(file.outputPath);
          break;
        }
      }
    } catch (_error) {
      // Directory doesn't exist yet, no collision possible
    }
  }

  return collisions;
}

async function findOrphanedFiles(
  outputDir: string,
  userId: string,
  currentOutputPaths: Set<string>
): Promise<string[]> {
  const userFiles = await findUserFiles(outputDir, userId);
  return userFiles.filter((file) => !currentOutputPaths.has(file));
}

async function findUserFiles(dir: string, userId: string): Promise<string[]> {
  const files: string[] = [];
  const pattern = `.${userId}.md`;

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findUserFiles(fullPath, userId);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.includes(pattern)) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Directory doesn't exist, no files to return
  }

  return files;
}
