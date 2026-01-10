import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncFiles, getStatus, cleanFiles } from "./index.js";
import type { Config } from "./types.js";

describe("syncFiles", () => {
  let testDir: string;
  let sourceDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "sync-test-"));
    sourceDir = join(testDir, "source");
    outputDir = join(testDir, "output");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should copy source files to output with user ID in filename", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test Note");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    const result = await syncFiles(config);

    expect(result.copied).toBe(1);
    expect(result.deleted).toBe(0);
    expect(result.collisions).toEqual([]);
    expect(result.errors).toEqual([]);

    const outputPath = join(outputDir, "notes", "note.alice.md");
    const content = await readFile(outputPath, "utf-8");
    expect(content).toBe("# Test Note");
  });

  it("should create nested output directories", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test");

    const config: Config = {
      userId: "bob",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "deep/nested/path" }],
      exclude: [],
    };

    const result = await syncFiles(config);

    expect(result.copied).toBe(1);
    const outputPath = join(outputDir, "deep", "nested", "path", "note.bob.md");
    const content = await readFile(outputPath, "utf-8");
    expect(content).toBe("# Test");
  });

  it("should delete orphaned output files", async () => {
    await writeFile(join(sourceDir, "current.md"), "# Current");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    // First sync creates output file
    await syncFiles(config);

    // Manually create an orphaned file
    const orphanedPath = join(outputDir, "notes", "deleted.alice.md");
    await writeFile(orphanedPath, "# Orphaned");

    // Second sync should delete orphaned file
    const result = await syncFiles(config);

    expect(result.copied).toBe(1);
    expect(result.deleted).toBe(1);

    // Verify orphaned file is gone
    await expect(readFile(orphanedPath, "utf-8")).rejects.toThrow();
  });

  it("should not delete files from other users", async () => {
    await writeFile(join(sourceDir, "alice-note.md"), "# Alice");

    const aliceConfig: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    // Alice syncs her file
    await syncFiles(aliceConfig);

    // Manually create Bob's file
    const bobPath = join(outputDir, "notes", "bob-note.bob.md");
    await mkdir(join(outputDir, "notes"), { recursive: true });
    await writeFile(bobPath, "# Bob");

    // Alice syncs again - should not delete Bob's file
    const result = await syncFiles(aliceConfig);

    expect(result.deleted).toBe(0);
    const bobContent = await readFile(bobPath, "utf-8");
    expect(bobContent).toBe("# Bob");
  });

  it("should detect collisions with other users", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Note");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    // Create existing file from another user with same base name
    const notesDir = join(outputDir, "notes");
    await mkdir(notesDir, { recursive: true });
    await writeFile(join(notesDir, "note.bob.md"), "# Bob's note");

    // Alice tries to sync - should detect collision
    await expect(syncFiles(config)).rejects.toThrow(/Collision detected/);
  });

  it("should sync multiple files from different routes", async () => {
    await mkdir(join(sourceDir, "logs"), { recursive: true });
    await writeFile(join(sourceDir, "logs", "daily.md"), "# Log");
    await writeFile(
      join(sourceDir, "project.md"),
      `---
tags:
  - work
---
# Project`
    );

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [
        { sourcePath: "logs/**/*.md", outputPath: "notes/logs" },
        { tag: "work", outputPath: "projects" },
      ],
      exclude: [],
    };

    const result = await syncFiles(config);

    expect(result.copied).toBe(2);

    const logContent = await readFile(join(outputDir, "notes", "logs", "daily.alice.md"), "utf-8");
    expect(logContent).toBe("# Log");

    const projectContent = await readFile(join(outputDir, "projects", "project.alice.md"), "utf-8");
    expect(projectContent).toContain("# Project");
  });

  it("should handle sync errors gracefully", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir: "/invalid/readonly/path",
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    const result = await syncFiles(config);

    expect(result.copied).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("getStatus", () => {
  let testDir: string;
  let sourceDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "status-test-"));
    sourceDir = join(testDir, "source");
    outputDir = join(testDir, "output");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should report files to copy", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    const status = await getStatus(config);

    expect(status.toCopy).toHaveLength(1);
    expect(status.toCopy[0].relativePath).toBe("note.md");
    expect(status.toDelete).toEqual([]);
    expect(status.collisions).toEqual([]);
  });

  it("should report orphaned files to delete", async () => {
    await writeFile(join(sourceDir, "current.md"), "# Current");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    // Create orphaned file
    const notesDir = join(outputDir, "notes");
    await mkdir(notesDir, { recursive: true });
    const orphanedPath = join(notesDir, "old.alice.md");
    await writeFile(orphanedPath, "# Old");

    const status = await getStatus(config);

    expect(status.toCopy).toHaveLength(1);
    expect(status.toDelete).toHaveLength(1);
    expect(status.toDelete[0]).toBe(orphanedPath);
  });

  it("should report collisions", async () => {
    await writeFile(join(sourceDir, "note.md"), "# Test");

    const config: Config = {
      userId: "alice",
      sourceDir,
      outputDir,
      routes: [{ sourcePath: "**/*.md", outputPath: "notes" }],
      exclude: [],
    };

    // Create collision
    const notesDir = join(outputDir, "notes");
    await mkdir(notesDir, { recursive: true });
    await writeFile(join(notesDir, "note.bob.md"), "# Bob");

    const status = await getStatus(config);

    expect(status.collisions).toHaveLength(1);
  });
});

describe("cleanFiles", () => {
  let testDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "clean-test-"));
    outputDir = join(testDir, "output");
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should delete all files for current user", async () => {
    const notesDir = join(outputDir, "notes");
    await mkdir(notesDir, { recursive: true });
    await writeFile(join(notesDir, "file1.alice.md"), "# File 1");
    await writeFile(join(notesDir, "file2.alice.md"), "# File 2");

    const config: Config = {
      userId: "alice",
      sourceDir: "/fake/source",
      outputDir,
      routes: [],
      exclude: [],
    };

    const deleted = await cleanFiles(config);

    expect(deleted).toBe(2);
    await expect(readFile(join(notesDir, "file1.alice.md"), "utf-8")).rejects.toThrow();
    await expect(readFile(join(notesDir, "file2.alice.md"), "utf-8")).rejects.toThrow();
  });

  it("should not delete files from other users", async () => {
    const notesDir = join(outputDir, "notes");
    await mkdir(notesDir, { recursive: true });
    await writeFile(join(notesDir, "file1.alice.md"), "# Alice");
    await writeFile(join(notesDir, "file2.bob.md"), "# Bob");

    const config: Config = {
      userId: "alice",
      sourceDir: "/fake/source",
      outputDir,
      routes: [],
      exclude: [],
    };

    const deleted = await cleanFiles(config);

    expect(deleted).toBe(1);
    const bobContent = await readFile(join(notesDir, "file2.bob.md"), "utf-8");
    expect(bobContent).toBe("# Bob");
  });

  it("should handle missing output directory gracefully", async () => {
    const config: Config = {
      userId: "alice",
      sourceDir: "/fake/source",
      outputDir: join(testDir, "nonexistent"),
      routes: [],
      exclude: [],
    };

    const deleted = await cleanFiles(config);

    expect(deleted).toBe(0);
  });
});
