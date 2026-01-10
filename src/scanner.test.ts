import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanSourceFiles } from "./scanner.js";
import type { Config } from "./types.js";

describe("scanSourceFiles", () => {
  let testDir: string;
  let sourceDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "scanner-test-"));
    sourceDir = join(testDir, "source");
    outputDir = join(testDir, "output");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should scan and process markdown files", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("note.md");
    expect(files[0].outputPath).toContain("note.testuser.md");
  });

  it("should scan nested directories", async () => {
    await mkdir(join(sourceDir, "nested", "deep"), { recursive: true });
    await writeFile(join(sourceDir, "nested", "deep", "note.md"), "# Test");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("nested/deep/note.md");
  });

  it("should parse frontmatter tags", async () => {
    await writeFile(
      join(sourceDir, "note.md"),
      `---
tags:
  - work
  - project
---
# Content`
    );

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files[0].tags).toEqual(["work", "project"]);
  });

  it("should match routes correctly", async () => {
    await mkdir(join(sourceDir, "Logs"), { recursive: true });
    await writeFile(join(sourceDir, "Logs", "daily.md"), "# Log");
    await writeFile(join(sourceDir, "note.md"), "# Note");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [
        { sourcePath: "Logs/**/*.md", outputPath: "logs" },
        { sourcePath: "**/*.md", outputPath: "notes" },
      ],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(2);
    const logFile = files.find((f) => f.relativePath.startsWith("Logs"));
    const noteFile = files.find((f) => f.relativePath === "note.md");

    expect(logFile?.outputPath).toContain("logs");
    expect(noteFile?.outputPath).toContain("notes");
  });

  it("should exclude files matching exclude patterns", async () => {
    await mkdir(join(sourceDir, "templates"), { recursive: true });
    await writeFile(join(sourceDir, "templates", "template.md"), "# Template");
    await writeFile(join(sourceDir, "note.md"), "# Note");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: ["templates/**"],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("note.md");
  });

  it("should skip files with no matching route", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Note");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "Logs/**/*.md", outputPath: "logs" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(0);
  });

  it("should generate correct output paths with userId", async () => {
    await writeFile(join(sourceDir, "project.md"), "# Project");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir: "./output",
      routes: [{ sourcePath: "**/*.md", outputPath: "projects" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files[0].outputPath).toBe("output/projects/project.alice.md");
  });

  it("should handle multiple files", async () => {
    await writeFile(join(sourceDir, "note1.md"), "# Note 1");
    await writeFile(join(sourceDir, "note2.md"), "# Note 2");
    await writeFile(join(sourceDir, "note3.md"), "# Note 3");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: {},
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(3);
  });

  it("should filter files by required prop with partial match (includes)", async () => {
    await writeFile(
      join(sourceDir, "published.md"),
      `---
status: published
---
# Published`
    );
    await writeFile(
      join(sourceDir, "draft.md"),
      `---
status: draft
---
# Draft`
    );

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: { status: "publish" },
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("published.md");
  });

  it("should filter files by required prop matching substring in link", async () => {
    await writeFile(
      join(sourceDir, "with-link.md"),
      `---
references: "[[Technology/Publishing Obsidian notes]]"
---
# With Link`
    );
    await writeFile(
      join(sourceDir, "different-link.md"),
      `---
references: "[[Other/Random Topic]]"
---
# Different Link`
    );
    await writeFile(join(sourceDir, "no-link.md"), "# No Link");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: { references: "[[Technology/Publishing Obsidian" },
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("with-link.md");
  });

  it("should filter files by required prop with multiple partial matches", async () => {
    await writeFile(
      join(sourceDir, "published.md"),
      `---
status: published
---
# Published`
    );
    await writeFile(
      join(sourceDir, "reviewing.md"),
      `---
status: reviewing
---
# Reviewing`
    );
    await writeFile(
      join(sourceDir, "draft.md"),
      `---
status: draft
---
# Draft`
    );

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: { status: ["publish", "review"] },
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(2);
    expect(files.some((f) => f.relativePath === "published.md")).toBe(true);
    expect(files.some((f) => f.relativePath === "reviewing.md")).toBe(true);
  });

  it("should filter files by required prop with wildcard", async () => {
    await writeFile(
      join(sourceDir, "with-title.md"),
      `---
title: My Title
---
# Content`
    );
    await writeFile(join(sourceDir, "without-title.md"), "# Content");

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: [],
      requireProps: { title: "*" },
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("with-title.md");
  });

  it("should combine required tags and props", async () => {
    await writeFile(
      join(sourceDir, "match.md"),
      `---
status: published
tags:
  - public
---
# Match`
    );
    await writeFile(
      join(sourceDir, "no-tag.md"),
      `---
status: published
---
# No Tag`
    );
    await writeFile(
      join(sourceDir, "no-prop.md"),
      `---
tags:
  - public
---
# No Prop`
    );

    const config: Config = {
      userId: "testuser",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
      requireTags: ["public"],
      requireProps: { status: "published" },
    };

    const files = await scanSourceFiles(config);

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("match.md");
  });
});
