import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function initCommand(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log("Welcome to mdsync initialization!\n");
  console.log("This will create your configuration files:");
  console.log("  - .markdown-sync.user.cjs (in your home directory)");
  console.log("  - markdown-sync.config.cjs (in this repository)\n");

  try {
    // Ask for source directory
    const sourceDir = await rl.question("Source directory (where your markdown files are): ");
    if (!sourceDir.trim()) {
      console.error("Error: Source directory is required");
      process.exit(1);
    }

    // Validate source directory exists
    try {
      const sourceStat = await fs.stat(sourceDir);
      if (!sourceStat.isDirectory()) {
        console.error(`Error: ${sourceDir} is not a directory`);
        process.exit(1);
      }
    } catch (_error) {
      console.error(`Error: Source directory ${sourceDir} does not exist`);
      process.exit(1);
    }

    // Ask for output directory
    const outputDir = await rl.question("Output directory (where synced files will go): ");
    if (!outputDir.trim()) {
      console.error("Error: Output directory is required");
      process.exit(1);
    }

    // Validate output directory exists
    try {
      const outputStat = await fs.stat(outputDir);
      if (!outputStat.isDirectory()) {
        console.error(`Error: ${outputDir} is not a directory`);
        process.exit(1);
      }
    } catch (_error) {
      console.error(`Error: Output directory ${outputDir} does not exist`);
      process.exit(1);
    }

    // Ask for routes
    console.log("\n--- Routes Configuration ---");
    console.log("Routes map source files to output locations.");
    console.log("Examples:");
    console.log("  - Tag-based: tag=#devlog, output=notes/logs");
    console.log("  - Path-based: source=daily-notes/**, output=notes/logs");
    console.log("");

    const routes: Array<{ tag?: string; sourcePath?: string; outputPath: string }> = [];
    let addMore = true;

    while (addMore) {
      const routeType = await rl.question("Route type (tag/path/done): ");

      if (routeType.toLowerCase() === "done" || !routeType.trim()) {
        addMore = false;
        break;
      }

      if (routeType.toLowerCase() === "tag") {
        const tag = await rl.question("  Tag (without #): ");
        const outputPath = await rl.question("  Output path: ");

        if (tag.trim() && outputPath.trim()) {
          routes.push({ tag: tag.trim(), outputPath: outputPath.trim() });
          console.log(`  ✓ Added tag route: #${tag} → ${outputPath}\n`);
        } else {
          console.log("  ⚠️  Skipped - tag and output path are required\n");
        }
      } else if (routeType.toLowerCase() === "path") {
        const sourcePath = await rl.question("  Source path (glob pattern): ");
        const outputPath = await rl.question("  Output path: ");

        if (sourcePath.trim() && outputPath.trim()) {
          routes.push({ sourcePath: sourcePath.trim(), outputPath: outputPath.trim() });
          console.log(`  ✓ Added path route: ${sourcePath} → ${outputPath}\n`);
        } else {
          console.log("  ⚠️  Skipped - source path and output path are required\n");
        }
      } else {
        console.log('  ⚠️  Invalid type. Use "tag", "path", or "done"\n');
      }
    }

    rl.close();

    // Create user config in home directory
    const userConfigPath = path.join(process.cwd(), ".markdown-sync.user.cjs");
    const userConfigContent = `// User-specific configuration for mdsync
// This file is NOT committed to git and contains your personal settings
// For all options, see: https://github.com/joshcanhelp/mdsync/blob/main/.markdown-sync.user.example.cjs

module.exports = {
  sourceDir: "${sourceDir}",
};
`;

    // Create repo config in current directory
    const repoConfigPath = path.join(process.cwd(), "markdown-sync.config.cjs");

    // Format routes for config file
    let routesString = "[]";
    if (routes.length > 0) {
      const formattedRoutes = routes.map((route) => {
        const parts: string[] = [];
        if (route.tag) parts.push(`tag: "${route.tag}"`);
        if (route.sourcePath) parts.push(`sourcePath: "${route.sourcePath}"`);
        parts.push(`outputPath: "${route.outputPath}"`);
        return `    { ${parts.join(", ")} }`;
      });
      routesString = `[\n${formattedRoutes.join(",\n")}\n  ]`;
    }

    const repoConfigContent = `// Repository-wide configuration for mdsync
// This file IS committed to git and shared by all users
// For all options, see: https://github.com/joshcanhelp/mdsync/blob/main/markdown-sync.config.example.cjs

module.exports = {
  outputDir: "${outputDir}",
  routes: ${routesString},
};
`;

    // Check if files already exist
    const userExists = await fs
      .access(userConfigPath)
      .then(() => true)
      .catch(() => false);
    const repoExists = await fs
      .access(repoConfigPath)
      .then(() => true)
      .catch(() => false);

    if (userExists) {
      console.log(`\n⚠️  User config already exists at: ${userConfigPath}`);
      console.log("Skipping user config creation.");
    } else {
      await fs.writeFile(userConfigPath, userConfigContent, "utf-8");
      console.log(`\n✓ Created user config: ${userConfigPath}`);
    }

    if (repoExists) {
      console.log(`⚠️  Repo config already exists at: ${repoConfigPath}`);
      console.log("Skipping repo config creation.");
    } else {
      await fs.writeFile(repoConfigPath, repoConfigContent, "utf-8");
      console.log(`✓ Created repo config: ${repoConfigPath}`);
    }

    console.log("\nNext steps:");
    if (routes.length === 0) {
      console.log("1. Edit markdown-sync.config.cjs to add routing rules");
      console.log("2. Run 'mdsync scan' to see what files would be synced");
    } else {
      console.log("1. Run 'mdsync scan' to see what files would be synced");
    }
    console.log(`${routes.length === 0 ? "3" : "2"}. Run 'mdsync status' to preview changes`);
    console.log(`${routes.length === 0 ? "4" : "3"}. Run 'mdsync sync' to perform the sync`);
  } catch (error) {
    rl.close();
    throw error;
  }
}
