import { readdir, copyFile, mkdir } from "node:fs/promises";
import { join, dirname, basename, extname, relative } from "node:path";
import type { FileEmbed, FileEmbedResult } from "../types.js";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico"];

// Find all file embeds in content
export function findFileEmbeds(content: string): FileEmbed[] {
  const embeds: FileEmbed[] = [];
  // Match ![[file]] or [[file]] where file has a non-.md extension
  const embedRegex = /(!?)\[\[([^\]|]+\.\w+)(\|([^\]]+))?\]\]/g;
  let match;

  while ((match = embedRegex.exec(content)) !== null) {
    const hasExclamation = match[1] === "!";
    const filename = match[2].trim();
    const displayText = match[4]?.trim();
    const ext = extname(filename).toLowerCase();

    // Skip .md files - they're handled by wikilink transformer
    if (ext === ".md") {
      continue;
    }

    const isImage = IMAGE_EXTENSIONS.includes(ext);

    embeds.push({
      originalSyntax: match[0],
      filename,
      isImage: hasExclamation || isImage, // Use image syntax if ! or recognized image ext
      displayText,
    });
  }

  return embeds;
}

// Find a file in the source directory by name
export async function findFileInSource(
  sourceDir: string,
  filename: string
): Promise<string | null> {
  const searchQueue: string[] = [sourceDir];

  while (searchQueue.length > 0) {
    const currentDir = searchQueue.shift()!;

    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          searchQueue.push(fullPath);
        } else if (entry.isFile() && entry.name === filename) {
          return fullPath;
        }
      }
    } catch (_error) {
      // Skip directories we can't read
      continue;
    }
  }

  return null;
}

// Copy file to output _files directory preserving relative path
export async function copyEmbeddedFile(
  sourceFilePath: string,
  sourceDir: string,
  outputDir: string
): Promise<string> {
  const relativePath = relative(sourceDir, sourceFilePath);
  const outputPath = join(outputDir, "_files", relativePath);
  const outputDirPath = dirname(outputPath);

  await mkdir(outputDirPath, { recursive: true });
  await copyFile(sourceFilePath, outputPath);

  // Return the relative path from output dir
  return join("_files", relativePath);
}

// Transform file embeds in content
export async function transformFileEmbeds(
  content: string,
  sourceDir: string,
  outputDir: string
): Promise<FileEmbedResult> {
  const embeds = findFileEmbeds(content);
  const copiedFiles: string[] = [];
  const errors: Error[] = [];
  let transformedContent = content;

  for (const embed of embeds) {
    // Find the file in source directory
    const sourceFilePath = await findFileInSource(sourceDir, embed.filename);

    if (!sourceFilePath) {
      errors.push(
        new Error(
          `File embed not found: ${embed.filename}. Searched in: ${sourceDir}. Stopping sync.`
        )
      );
      continue;
    }

    try {
      // Copy file to output _files directory
      const outputRelativePath = await copyEmbeddedFile(sourceFilePath, sourceDir, outputDir);
      copiedFiles.push(outputRelativePath);

      // Transform the syntax
      const displayText = embed.displayText || basename(embed.filename, extname(embed.filename));
      let replacement: string;

      if (embed.isImage) {
        replacement = `![${displayText}](/${outputRelativePath})`;
      } else {
        replacement = `[${displayText}](/${outputRelativePath})`;
      }

      // Replace the original syntax
      transformedContent = transformedContent.replace(embed.originalSyntax, replacement);
    } catch (error) {
      errors.push(new Error(`Failed to copy ${embed.filename}: ${error}`));
    }
  }

  return {
    content: transformedContent,
    copiedFiles,
    errors,
  };
}
