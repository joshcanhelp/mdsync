import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import yaml from "js-yaml";

export interface FrontmatterData {
  tags: string[];
  props: Record<string, unknown>;
}

export async function parseFrontmatter(filePath: string): Promise<FrontmatterData> {
  const content = await readFile(filePath, "utf-8");
  const { data } = matter(content);

  return {
    tags: extractTags(data),
    props: data,
  };
}

export function parseFrontmatterFromString(content: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const { data, content: bodyContent } = matter(content);
  return {
    frontmatter: data,
    content: bodyContent,
  };
}

export function stringifyFrontmatter(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  // If frontmatter is empty, just return the content
  if (Object.keys(frontmatter).length === 0) {
    return content;
  }

  // Configure gray-matter to use quoted strings instead of block literals
  return matter.stringify(content, frontmatter, {
    engines: {
      yaml: {
        parse: (input: string): object => yaml.load(input) as object,
        stringify: (data: object): string => {
          // Use js-yaml with custom options to prefer double-quoted style
          return yaml.dump(data, {
            quotingType: '"',
            forceQuotes: true,
            lineWidth: -1, // Disable line wrapping
          });
        },
      },
    },
  });
}

function extractTags(frontmatter: Record<string, unknown>): string[] {
  const tags = frontmatter.tags;

  if (!tags) {
    return [];
  }

  if (typeof tags === "string") {
    return parseTagString(tags);
  }

  if (Array.isArray(tags)) {
    return tags
      .filter((tag) => typeof tag === "string")
      .map((tag) => normalizeTag(tag))
      .filter((tag) => tag.length > 0);
  }

  return [];
}

function parseTagString(tagString: string): string[] {
  return tagString
    .split(/[\s,]+/)
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0);
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "").trim();
}
