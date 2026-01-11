import { readdir } from "node:fs/promises";
import { join, relative, basename, extname } from "node:path";
import { minimatch } from "minimatch";
import { parseFrontmatter, type FrontmatterData } from "./frontmatter.js";
import { matchRoute } from "./routing.js";
import type { Config, SourceFile } from "./types.js";

export async function scanSourceFiles(config: Config): Promise<SourceFile[]> {
  const allFiles = await findMarkdownFiles(config.sourceDir);
  const filteredFiles = filterExcluded(allFiles, config.sourceDir, config.exclude);

  const sourceFiles: SourceFile[] = [];

  for (const absolutePath of filteredFiles) {
    const relativePath = relative(config.sourceDir, absolutePath);
    const frontmatter = await parseFrontmatter(absolutePath);

    if (!hasRequiredFields(frontmatter, config.requireTags || [], config.requireProps || {})) {
      continue;
    }

    const route = matchRoute(relativePath, frontmatter.tags, config.routes);

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
      tags: frontmatter.tags,
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

function hasRequiredFields(
  frontmatter: FrontmatterData,
  requireTags: string[],
  requireProps: Record<string, string | string[]>
): boolean {
  if (requireTags.length > 0) {
    const hasAllTags = requireTags.every((tag) => frontmatter.tags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  for (const [propName, requiredValue] of Object.entries(requireProps)) {
    const actualValue = frontmatter.props[propName];
    if (actualValue === undefined) {
      return false;
    }

    // "*" means any value is acceptable
    if (requiredValue === "*") {
      continue;
    }

    // Array means value must match one of the options
    const requiredValues = Array.isArray(requiredValue) ? requiredValue : [requiredValue];
    const actualString = String(actualValue);
    if (!requiredValues.some((value) => actualString.includes(value))) {
      return false;
    }
  }

  return true;
}
