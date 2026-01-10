import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "markdown-sync-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("should use default config when no repo config exists", async () => {
    const sourceDir = join(testDir, "source");
    await mkdir(sourceDir);

    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { sourceDir: "${sourceDir}" };`
    );

    const config = await loadConfig(testDir);

    expect(config.outputDir).toBe("./notes");
    expect(config.routes).toHaveLength(1);
    expect(config.routes[0].sourcePath).toBe("**/*.md");
  });

  it("should load custom repo config when it exists", async () => {
    const sourceDir = join(testDir, "source");
    await mkdir(sourceDir);

    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { sourceDir: "${sourceDir}" };`
    );

    const repoConfigPath = join(testDir, "markdown-sync.config.js");
    await writeFile(
      repoConfigPath,
      `module.exports = {
        outputDir: "./custom-output",
        routes: [{ sourcePath: "notes/**/*.md", outputPath: "notes" }]
      };`
    );

    const config = await loadConfig(testDir);

    expect(config.outputDir).toBe("./custom-output");
    expect(config.routes).toHaveLength(1);
    expect(config.routes[0].outputPath).toBe("notes");
  });

  it("should throw error when sourceDir does not exist", async () => {
    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { sourceDir: "/nonexistent/path" };`
    );

    await expect(loadConfig(testDir)).rejects.toThrow("Source directory not readable");
  });

  it("should throw error when no user config exists", async () => {
    await expect(loadConfig(testDir)).rejects.toThrow("Source directory not configured");
  });

  it("should create output directory if it does not exist", async () => {
    const sourceDir = join(testDir, "source");
    await mkdir(sourceDir);

    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { sourceDir: "${sourceDir}" };`
    );

    const config = await loadConfig(testDir);

    expect(config.outputDir).toBeTruthy();
  });

  it("should detect user ID from config", async () => {
    const sourceDir = join(testDir, "source");
    await mkdir(sourceDir);

    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { userId: "test-user", sourceDir: "${sourceDir}" };`
    );

    const config = await loadConfig(testDir);

    expect(config.userId).toBe("test-user");
  });

  it("should validate routes exist", async () => {
    const sourceDir = join(testDir, "source");
    await mkdir(sourceDir);

    const userConfigPath = join(testDir, ".markdown-sync.user.js");
    await writeFile(
      userConfigPath,
      `module.exports = { sourceDir: "${sourceDir}" };`
    );

    const repoConfigPath = join(testDir, "markdown-sync.config.js");
    await writeFile(
      repoConfigPath,
      `module.exports = { outputDir: "./output", routes: [] };`
    );

    await expect(loadConfig(testDir)).rejects.toThrow("at least one route");
  });
});
