import { readdir } from "node:fs/promises";
import { join, relative, basename, extname } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import { matchRoute } from "./routing.js";
import type { Config, SourceFile } from "./types.js";

export async function scanSourceFiles(config: Config): Promise<SourceFile[]> {
  const allFiles = await findMarkdownFiles(config.sourceDir);
  const filteredFiles = filterExcluded(allFiles, config.sourceDir, config.exclude);

  const sourceFiles: SourceFile[] = [];

  for (const absolutePath of filteredFiles) {
    const relativePath = relative(config.sourceDir, absolutePath);
    const tags = await parseFrontmatter(absolutePath);
    const route = matchRoute(relativePath, tags, config.routes);

    if (!route) {
      continue;
    }

    const outputPath = generateOutputPath(
      absolutePath,
      route.outputPath,
      config.outputDir,
      config.userId
    );

    sourceFiles.push({
      absolutePath,
      relativePath,
      tags,
      route,
      outputPath,
    });
  }

  return sourceFiles;
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to scan directory ${dir}: ${error}`);
  }

  return files;
}

function filterExcluded(files: string[], sourceDir: string, exclude: string[]): string[] {
  if (exclude.length === 0) {
    return files;
  }

  const { minimatch } = require("minimatch");

  return files.filter((file) => {
    const relativePath = relative(sourceDir, file);
    return !exclude.some((pattern) => minimatch(relativePath, pattern));
  });
}

function generateOutputPath(
  sourcePath: string,
  routeOutputPath: string,
  outputDir: string,
  userId: string
): string {
  const filename = basename(sourcePath);
  const name = basename(filename, extname(filename));
  const ext = extname(filename);
  const outputFilename = `${name}.${userId}${ext}`;

  return join(outputDir, routeOutputPath, outputFilename);
}
