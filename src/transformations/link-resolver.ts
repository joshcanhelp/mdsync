import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { minimatch } from "minimatch";
import { parseFrontmatter } from "../frontmatter.js";
import type { Config } from "../types.js";
import type { LinkMap, UnresolvedLink } from "./types.js";

export async function buildLinkMap(config: Config): Promise<LinkMap> {
  const linkMap: LinkMap = {};
  const allFiles = await findAllMarkdownFiles(config.sourceDir);
  const urlProperty = config.transformations.urlProperty || "link_to";

  for (const absolutePath of allFiles) {
    const relativePath = relative(config.sourceDir, absolutePath);

    // Check if file matches exclude patterns
    if (shouldExclude(relativePath, config.exclude)) {
      continue;
    }

    // Check for link override first
    if (config.transformations.linkOverrides?.[relativePath]) {
      linkMap[relativePath] = config.transformations.linkOverrides[relativePath];
      continue;
    }

    // Parse frontmatter to get URL
    const frontmatter = await parseFrontmatter(absolutePath);
    const url = frontmatter.props[urlProperty];

    if (url) {
      linkMap[relativePath] = String(url);
    }
  }

  return linkMap;
}

export function transformWikilinks(
  content: string,
  linkMap: LinkMap,
  behavior: "resolve" | "remove" | "preserve",
  currentFilePath: string
): { content: string; unresolvedLinks: UnresolvedLink[] } {
  // If preserving wikilinks, return content unchanged
  if (behavior === "preserve") {
    return { content, unresolvedLinks: [] };
  }

  const unresolvedLinks: UnresolvedLink[] = [];
  const wikilinkRegex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;

  const transformedContent = content.replace(wikilinkRegex, (match, target, _, displayText) => {
    const trimmedTarget = target.trim();
    const text = displayText ? displayText.trim() : trimmedTarget;

    // Try to find URL in link map
    // Add .md extension if not already present
    const lookupKey = trimmedTarget.endsWith(".md") ? trimmedTarget : trimmedTarget + ".md";
    const url = linkMap[lookupKey];

    if (!url) {
      unresolvedLinks.push({
        wikilink: match,
        filePath: currentFilePath,
      });

      return behavior === "remove" ? "" : match;
    }

    return `[${text}](${url})`;
  });

  return { content: transformedContent, unresolvedLinks };
}

async function findAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findAllMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Ignore directories we can't read
  }

  return files;
}

function shouldExclude(relativePath: string, excludePatterns: string[]): boolean {
  if (excludePatterns.length === 0) {
    return false;
  }

  return excludePatterns.some((pattern) => minimatch(relativePath, pattern));
}
