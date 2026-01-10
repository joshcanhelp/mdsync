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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project"]);
    expect(result.props.tags).toBeDefined();
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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project", "meeting"]);
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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project", "meeting"]);
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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project"]);
  });

  it("should return empty tags when no tags", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
title: My Note
---
# Content`
    );

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual([]);
    expect(result.props.title).toBe("My Note");
  });

  it("should return empty when no frontmatter", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(filePath, "# Just a heading\n\nSome content");

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual([]);
    expect(result.props).toEqual({});
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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project"]);
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

    const result = await parseFrontmatter(filePath);

    expect(result.tags).toEqual(["work", "project"]);
  });

  it("should extract all frontmatter props", async () => {
    const filePath = join(testDir, "test.md");
    await writeFile(
      filePath,
      `---
title: My Note
date: 2024-01-01
author: Josh
tags:
  - work
---
# Content`
    );

    const result = await parseFrontmatter(filePath);

    expect(result.props.title).toBe("My Note");
    expect(result.props.date).toBeInstanceOf(Date);
    expect(result.props.author).toBe("Josh");
    expect(result.props.tags).toBeDefined();
  });
});
