import { readdir, copyFile, mkdir, unlink } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { scanSourceFiles } from "./scanner.js";
import type { Config, SyncResult, SyncStatus } from "./types.js";

export async function syncFiles(config: Config): Promise<SyncResult> {
  const sourceFiles = await scanSourceFiles(config);
  const result: SyncResult = {
    copied: 0,
    deleted: 0,
    collisions: [],
    errors: [],
  };

  // Check for collisions with other users
  const collisions = await detectCollisions(sourceFiles, config.userId);
  if (collisions.length > 0) {
    result.collisions = collisions;
    throw new Error(
      `Collision detected: ${collisions.length} file(s) would conflict with other users. Resolve manually:\n${collisions.join("\n")}`
    );
  }

  // Copy source files to output locations
  for (const file of sourceFiles) {
    try {
      await mkdir(dirname(file.outputPath), { recursive: true });
      await copyFile(file.absolutePath, file.outputPath);
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
    } catch (error) {
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
    } catch (error) {
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
  } catch (error) {
    // Directory doesn't exist, no files to return
  }

  return files;
}
