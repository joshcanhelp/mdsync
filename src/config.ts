import { access, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { constants } from "node:fs";
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
  requireTags: [],
  requireProps: {},
};

export async function loadConfig(repoRoot: string = process.cwd()): Promise<Config> {
  const repoConfig = await loadRepoConfig(repoRoot);
  const userConfig = await loadUserConfig(repoRoot);
  const config = mergeConfig(repoConfig, userConfig);
  await validateConfig(config, repoRoot);
  return config;
}

async function loadRepoConfig(repoRoot: string): Promise<RepoConfig> {
  const configPath = join(repoRoot, "markdown-sync.config.js");

  try {
    await access(configPath);
    const configModule = await import(`file://${resolve(configPath)}`);
    return configModule.default || configModule;
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

function mergeConfig(repoConfig: RepoConfig, userConfig: UserConfig | null): Config {
  const userId = detectUserId(userConfig?.userId);

  if (!userConfig?.sourceDir) {
    throw new Error(
      "Source directory not configured. Please specify sourceDir in:\n" +
        "  - .markdown-sync.user.js (repo root or home directory)\n" +
        "  OR create this file from .markdown-sync.user.example.js"
    );
  }

  // Merge logic: prefer repo config when defined, but allow user config as fallback
  // Even if repo config file exists, it might not define all fields
  const routes =
    repoConfig.routes && repoConfig.routes.length > 0
      ? repoConfig.routes
      : userConfig?.routes || [];
  const exclude = repoConfig.exclude || userConfig?.exclude || [];
  const requireTags = repoConfig.requireTags || userConfig?.requireTags || [];
  const requireProps = repoConfig.requireProps || userConfig?.requireProps || {};

  // Merge transformation configs
  const repoTransformations = repoConfig.transformations || {};
  const userTransformations = userConfig?.transformations || {};
  const transformations = {
    urlProperty: repoTransformations.urlProperty || userTransformations.urlProperty || "link_to",
    contentProperties:
      repoTransformations.contentProperties || userTransformations.contentProperties || [],
    passthroughProperties:
      repoTransformations.passthroughProperties || userTransformations.passthroughProperties || [],
    wikilinkBehavior:
      repoTransformations.wikilinkBehavior || userTransformations.wikilinkBehavior || "resolve",
    linkOverrides: {
      ...(userTransformations.linkOverrides || {}),
      ...(repoTransformations.linkOverrides || {}),
    },
  };

  return {
    userId,
    sourceDir: userConfig.sourceDir,
    outputDir: repoConfig.outputDir,
    routes,
    exclude,
    requireTags,
    requireProps,
    transformations,
  };
}

async function validateConfig(config: Config, repoRoot: string): Promise<void> {
  const errors: string[] = [];

  if (!config.userId) {
    errors.push("User ID is required");
  }

  if (!config.sourceDir) {
    errors.push("Source directory is required");
  } else {
    try {
      await access(config.sourceDir, constants.R_OK);
    } catch {
      errors.push(`Source directory not readable: ${config.sourceDir}`);
    }
  }

  if (!config.outputDir) {
    errors.push("Output directory is required");
  } else {
    const outputPath = resolve(repoRoot, config.outputDir);
    try {
      await access(outputPath, constants.W_OK);
    } catch {
      try {
        await mkdir(outputPath, { recursive: true });
      } catch (_error) {
        errors.push(`Output directory not writable and cannot be created: ${config.outputDir}`);
      }
    }
  }

  if (!config.routes || !Array.isArray(config.routes) || config.routes.length === 0) {
    errors.push("At least one route is required");
  }

  for (const route of config.routes) {
    if (!route || typeof route !== "object") {
      throw new Error("Each route must be an object");
    }

    if (!route.outputPath || typeof route.outputPath !== "string") {
      throw new Error("Each route must specify outputPath");
    }

    if (!route.sourcePath && !route.tag) {
      throw new Error("Each route must specify sourcePath, tag, or both");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n  - ${errors.join("\n  - ")}`);
  }
}
