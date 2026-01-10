import { readFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import type { RepoConfig, UserConfig, Config } from "./types.js";
import { detectUserId } from "./user.js";

const DEFAULT_CONFIG: RepoConfig = {
  outputDir: "./notes",
  routes: [
    {
      sourcePath: "**/*.md",
      outputPath: ".",
    },
  ],
  exclude: [],
};

export async function loadConfig(repoRoot: string = process.cwd()): Promise<Config> {
  const repoConfig = await loadRepoConfig(repoRoot);
  const userConfig = await loadUserConfig(repoRoot);
  return mergeConfig(repoConfig, userConfig);
}

async function loadRepoConfig(repoRoot: string): Promise<RepoConfig> {
  const configPath = join(repoRoot, "markdown-sync.config.js");

  try {
    await access(configPath);
    const configModule = await import(`file://${resolve(configPath)}`);
    const config = configModule.default || configModule;
    validateRepoConfig(config);
    return config;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return DEFAULT_CONFIG;
    }
    throw new Error(`Failed to load repository config: ${error}`);
  }
}

async function loadUserConfig(repoRoot: string): Promise<UserConfig | null> {
  const userConfigName = ".markdown-sync.user.js";

  const repoUserConfigPath = join(repoRoot, userConfigName);
  try {
    await access(repoUserConfigPath);
    const configModule = await import(`file://${resolve(repoUserConfigPath)}`);
    return configModule.default || configModule;
  } catch {
    // Continue to home directory
  }

  const homeUserConfigPath = join(homedir(), userConfigName);
  try {
    await access(homeUserConfigPath);
    const configModule = await import(`file://${resolve(homeUserConfigPath)}`);
    return configModule.default || configModule;
  } catch {
    return null;
  }
}

function validateRepoConfig(config: unknown): asserts config is RepoConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Repository config must be an object");
  }

  const c = config as Record<string, unknown>;

  if (!c.outputDir || typeof c.outputDir !== "string") {
    throw new Error("Repository config must specify outputDir");
  }

  if (!Array.isArray(c.routes) || c.routes.length === 0) {
    throw new Error("Repository config must specify at least one route");
  }

  for (const route of c.routes) {
    if (!route || typeof route !== "object") {
      throw new Error("Each route must be an object");
    }

    const r = route as Record<string, unknown>;

    if (!r.outputPath || typeof r.outputPath !== "string") {
      throw new Error("Each route must specify outputPath");
    }

    if (!r.sourcePath && !r.tag) {
      throw new Error("Each route must specify sourcePath, tag, or both");
    }
  }
}

function mergeConfig(repoConfig: RepoConfig, userConfig: UserConfig | null): Config {
  const userId = detectUserId(userConfig?.userId);

  if (!userConfig?.sourceDir) {
    throw new Error(
      "Source directory not configured. Please specify sourceDir in:\n" +
        "  - .markdown-sync.user.js (repo root or home directory)\n" +
        "  OR create this file from .markdown-sync.user.example.js"
    );
  }

  return {
    userId,
    sourceDir: userConfig.sourceDir,
    outputDir: userConfig.outputDir || repoConfig.outputDir,
    routes: repoConfig.routes,
    exclude: repoConfig.exclude || [],
  };
}
