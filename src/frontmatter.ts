import { readFile } from "node:fs/promises";
import matter from "gray-matter";

export async function parseFrontmatter(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf-8");
  const { data } = matter(content);

  return extractTags(data);
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
