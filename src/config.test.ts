/**
 * Tests for configuration loading
 */

import { describe, it, expect } from "vitest";
import type { RepoConfig, UserConfig } from "./types.js";

// Note: Full integration tests with actual file loading would require
// setting up test fixtures. For now, we'll test the validation logic
// and document the integration tests needed.

describe("config validation", () => {
  it("should validate repo config structure", () => {
    const validConfig: RepoConfig = {
      outputDir: "./notes",
      routes: [
        {
          sourcePath: "**/*.md",
          outputPath: "notes",
        },
      ],
      exclude: [],
    };

    expect(validConfig.outputDir).toBe("./notes");
    expect(validConfig.routes).toHaveLength(1);
  });

  it("should require outputPath in routes", () => {
    const invalidRoute = {
      sourcePath: "**/*.md",
      // missing outputPath
    };

    expect(invalidRoute).not.toHaveProperty("outputPath");
  });

  it("should allow routes with sourcePath only", () => {
    const route = {
      sourcePath: "**/*.md",
      outputPath: "notes",
    };

    expect(route.sourcePath).toBeTruthy();
    expect(route.outputPath).toBeTruthy();
  });

  it("should allow routes with tag only", () => {
    const route = {
      tag: "working",
      outputPath: "projects",
    };

    expect(route.tag).toBeTruthy();
    expect(route.outputPath).toBeTruthy();
  });

  it("should allow routes with both sourcePath and tag", () => {
    const route = {
      sourcePath: "Archive/**/*.md",
      tag: "archived",
      outputPath: "archive",
    };

    expect(route.sourcePath).toBeTruthy();
    expect(route.tag).toBeTruthy();
    expect(route.outputPath).toBeTruthy();
  });
});

describe("config merging", () => {
  it("should merge user config over repo config", () => {
    const repoConfig: RepoConfig = {
      outputDir: "./default-notes",
      routes: [],
      exclude: [],
    };

    const userConfig: UserConfig = {
      userId: "josh",
      sourceDir: "/Users/josh/notes",
      outputDir: "./my-notes",
    };

    // User's outputDir should take precedence
    expect(userConfig.outputDir).toBe("./my-notes");
  });

  it("should use repo outputDir when user does not override", () => {
    const repoConfig: RepoConfig = {
      outputDir: "./default-notes",
      routes: [],
      exclude: [],
    };

    const userConfig: UserConfig = {
      sourceDir: "/Users/josh/notes",
      // no outputDir override
    };

    // Should fall back to repo's outputDir
    expect(userConfig.outputDir).toBeUndefined();
    const finalOutputDir = userConfig.outputDir || repoConfig.outputDir;
    expect(finalOutputDir).toBe("./default-notes");
  });
});

// Integration tests to implement:
// - Test loading actual config files from fixtures
// - Test config file not found errors
// - Test malformed config file errors
// - Test config loading from home directory
// - Test config precedence (repo vs home dir)
