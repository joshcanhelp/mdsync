import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildLinkMap, transformWikilinks } from "./link-resolver.js";
import type { Config } from "../types.js";
import type { LinkMap } from "./types.js";

const createTestConfig = (
  sourceDir: string,
  urlProperty: string = "link_to",
  exclude: string[] = [],
  linkOverrides?: Record<string, string>
): Config => ({
  userId: "testuser",
  userIdEnabled: true,
  sourceDir,
  outputDir: "/tmp/output",
  routes: [],
  exclude,
  transformations: {
    urlProperty,
    contentProperties: [],
    passthroughProperties: [],
    wikilinkBehavior: "resolve",
    linkOverrides,
  },
});

describe("buildLinkMap", () => {
  let testDir: string;
  let sourceDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "link-test-"));
    sourceDir = join(testDir, "source");
    await mkdir(sourceDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should build link map from files with url property", async () => {
    await writeFile(
      join(sourceDir, "file1.md"),
      `---
link_to: https://example.com/file1
---
# File 1`
    );
    await writeFile(
      join(sourceDir, "file2.md"),
      `---
link_to: https://example.com/file2
---
# File 2`
    );

    const linkMap = await buildLinkMap(createTestConfig(sourceDir));

    expect(linkMap["file1.md"]).toBe("https://example.com/file1");
    expect(linkMap["file2.md"]).toBe("https://example.com/file2");
  });

  it("should use custom url property name", async () => {
    await writeFile(
      join(sourceDir, "file.md"),
      `---
permalink: https://custom.com/page
---
# Content`
    );

    const linkMap = await buildLinkMap(createTestConfig(sourceDir, "permalink"));

    expect(linkMap["file.md"]).toBe("https://custom.com/page");
  });

  it("should skip files without url property", async () => {
    await writeFile(join(sourceDir, "no-url.md"), "# No URL");
    await writeFile(
      join(sourceDir, "with-url.md"),
      `---
link_to: https://example.com/page
---
# With URL`
    );

    const linkMap = await buildLinkMap(createTestConfig(sourceDir));

    expect(linkMap["no-url.md"]).toBeUndefined();
    expect(linkMap["with-url.md"]).toBe("https://example.com/page");
  });

  it("should handle nested directories", async () => {
    await mkdir(join(sourceDir, "nested", "deep"), { recursive: true });
    await writeFile(
      join(sourceDir, "nested", "deep", "file.md"),
      `---
link_to: https://example.com/nested
---
# Nested`
    );

    const linkMap = await buildLinkMap(createTestConfig(sourceDir));

    expect(linkMap["nested/deep/file.md"]).toBe("https://example.com/nested");
  });

  it("should exclude files matching exclude patterns", async () => {
    await mkdir(join(sourceDir, "private"), { recursive: true });
    await writeFile(
      join(sourceDir, "private", "secret.md"),
      `---
link_to: https://example.com/secret
---
# Secret`
    );
    await writeFile(
      join(sourceDir, "public.md"),
      `---
link_to: https://example.com/public
---
# Public`
    );

    const linkMap = await buildLinkMap(createTestConfig(sourceDir, "link_to", ["private/**"]));

    expect(linkMap["private/secret.md"]).toBeUndefined();
    expect(linkMap["public.md"]).toBe("https://example.com/public");
  });

  it("should apply link overrides", async () => {
    await writeFile(
      join(sourceDir, "file.md"),
      `---
link_to: https://example.com/original
---
# File`
    );

    const linkOverrides = {
      "file.md": "https://override.com/custom",
    };

    const linkMap = await buildLinkMap(createTestConfig(sourceDir, "link_to", [], linkOverrides));

    expect(linkMap["file.md"]).toBe("https://override.com/custom");
  });

  it("should handle multiple exclude patterns", async () => {
    await mkdir(join(sourceDir, "drafts"), { recursive: true });
    await mkdir(join(sourceDir, "templates"), { recursive: true });

    await writeFile(
      join(sourceDir, "drafts", "draft.md"),
      `---
link_to: https://example.com/draft
---
# Draft`
    );
    await writeFile(
      join(sourceDir, "templates", "template.md"),
      `---
link_to: https://example.com/template
---
# Template`
    );
    await writeFile(
      join(sourceDir, "normal.md"),
      `---
link_to: https://example.com/normal
---
# Normal`
    );

    const linkMap = await buildLinkMap(
      createTestConfig(sourceDir, "link_to", ["drafts/**", "templates/**"])
    );

    expect(linkMap["drafts/draft.md"]).toBeUndefined();
    expect(linkMap["templates/template.md"]).toBeUndefined();
    expect(linkMap["normal.md"]).toBe("https://example.com/normal");
  });
});

describe("transformWikilinks", () => {
  it("should resolve simple wikilinks", () => {
    const content = "Check out [[file1.md]] for more info.";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("Check out [file1.md](https://example.com/file1) for more info.");
    expect(result.unresolvedLinks).toEqual([]);
  });

  it("should resolve wikilinks with display text", () => {
    const content = "See [[file1.md|My Article]] here.";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("See [My Article](https://example.com/file1) here.");
  });

  it("should remove unresolved wikilinks when behavior is remove", () => {
    const content = "Check [[missing.md]] and [[another.md|text]].";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "remove", "test.md");

    expect(result.content).toBe("Check  and .");
    expect(result.unresolvedLinks).toHaveLength(2);
    expect(result.unresolvedLinks[0].wikilink).toBe("[[missing.md]]");
    expect(result.unresolvedLinks[1].wikilink).toBe("[[another.md|text]]");
  });

  it("should preserve unresolved wikilinks when behavior is resolve", () => {
    const content = "Check [[missing.md]] here.";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("Check [[missing.md]] here.");
    expect(result.unresolvedLinks).toHaveLength(1);
  });

  it("should preserve all wikilinks when behavior is preserve", () => {
    const content = "[[file1.md]] and [[missing.md]]";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
    };

    const result = transformWikilinks(content, linkMap, "preserve", "test.md");

    expect(result.content).toBe("[[file1.md]] and [[missing.md]]");
    expect(result.unresolvedLinks).toEqual([]);
  });

  it("should handle multiple wikilinks in one line", () => {
    const content = "See [[file1.md]] and [[file2.md]] together.";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
      "file2.md": "https://example.com/file2",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe(
      "See [file1.md](https://example.com/file1) and [file2.md](https://example.com/file2) together."
    );
  });

  it("should trim whitespace from wikilink targets", () => {
    const content = "[[ file1.md ]] and [[ file2.md | Display Text ]]";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
      "file2.md": "https://example.com/file2",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe(
      "[file1.md](https://example.com/file1) and [Display Text](https://example.com/file2)"
    );
  });

  it("should track file path for unresolved links", () => {
    const content = "[[missing.md]]";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "resolve", "notes/test.md");

    expect(result.unresolvedLinks[0].filePath).toBe("notes/test.md");
  });

  it("should handle nested paths in link map", () => {
    const content = "See [[nested/deep/file.md]] here.";
    const linkMap: LinkMap = {
      "nested/deep/file.md": "https://example.com/nested",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("See [nested/deep/file.md](https://example.com/nested) here.");
  });

  it("should preserve unresolved wikilinks with custom text", () => {
    const content = "Check [[missing.md|Custom Text]] here.";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("Check [[missing.md|Custom Text]] here.");
    expect(result.unresolvedLinks).toHaveLength(1);
  });

  it("should preserve unresolved wikilinks with paths", () => {
    const content = "See [[folder/subfolder/note.md]] here.";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("See [[folder/subfolder/note.md]] here.");
    expect(result.unresolvedLinks).toHaveLength(1);
  });

  it("should preserve unresolved wikilinks with and without extensions", () => {
    const content = "Check [[simple-note.md]] and [[another]] here.";
    const linkMap: LinkMap = {};

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe("Check [[simple-note.md]] and [[another]] here.");
    expect(result.unresolvedLinks).toHaveLength(2);
  });

  it("should handle mixed resolved and unresolved wikilinks", () => {
    const content = "See [[file1.md]] and [[missing.md]] and [[file2.md|Custom]].";
    const linkMap: LinkMap = {
      "file1.md": "https://example.com/file1",
    };

    const result = transformWikilinks(content, linkMap, "resolve", "test.md");

    expect(result.content).toBe(
      "See [file1.md](https://example.com/file1) and [[missing.md]] and [[file2.md|Custom]]."
    );
    expect(result.unresolvedLinks).toHaveLength(2);
  });
});
