import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";

describe("parseFrontmatter", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "frontmatter-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should parse tags from array format", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags:
  - work
  - project
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project"]);
  });

  it("should parse tags from string format with spaces", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags: work project meeting
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project", "meeting"]);
  });

  it("should parse tags from comma-separated string", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags: work, project, meeting
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project", "meeting"]);
  });

  it("should remove # prefix from tags", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags:
  - "#work"
  - "#project"
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project"]);
  });

  it("should return empty array when no tags", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
title: My Note
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual([]);
  });

  it("should return empty array when no frontmatter", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(filePath, "# Just a heading\n\nSome content");

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual([]);
  });

  it("should handle mixed format tags", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags:
  - work
  - "#project"
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project"]);
  });

  it("should trim whitespace from tags", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
tags:
  - " work "
  - " project "
---
# Content`
    );

    const tags = await parseFrontmatter(filePath);

    expect(tags).toEqual(["work", "project"]);
  });
});
