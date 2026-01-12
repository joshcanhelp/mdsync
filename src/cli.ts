#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { scanSourceFiles } from "./scanner.js";
import { syncFiles, getStatus, cleanFiles } from "./index.js";

async function main() {
  const command = process.argv[2] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
mdsync - Sync markdown files with multi-user support

Usage:
  mdsync config            Show current configuration
  mdsync scan              Scan source files and show what would be synced
  mdsync status            Show what would change (dry-run)
  mdsync sync [--verbose]  Sync files with transformation
  mdsync clean             Remove all synced files for current user
  mdsync help              Show this help message

Flags:
  --verbose, -v   Show detailed transformation reports (e.g., all unresolved wikilinks)

Config files:
  - .markdown-sync.user.cjs (required, in repo root or home directory)
  - markdown-sync.config.cjs (optional, for custom routing)
`);
    return;
  }

  if (command === "config") {
    try {
      const config = await loadConfig();

      console.log("Current Configuration\n");

      console.log("User Settings:");
      console.log(`  User ID:     ${config.userId}`);
      console.log(`  Source:      ${config.sourceDir}`);
      console.log(`  Output:      ${config.outputDir}`);

      if (config.requireTags && config.requireTags.length > 0) {
        console.log(`\nRequired Tags: ${config.requireTags.map((t) => `#${t}`).join(", ")}`);
      }

      if (config.requireProps && Object.keys(config.requireProps).length > 0) {
        console.log("\nRequired Properties:");
        for (const [key, value] of Object.entries(config.requireProps)) {
          const displayValue = Array.isArray(value) ? value.join(" | ") : value;
          console.log(`  ${key}: ${displayValue}`);
        }
      }

      if (config.exclude.length > 0) {
        console.log("\nExclude Patterns:");
        for (const pattern of config.exclude) {
          console.log(`  ${pattern}`);
        }
      }

      console.log("\nRoutes:");
      if (config.routes.length === 0) {
        console.log("  (none configured)");
      } else {
        for (const route of config.routes) {
          const conditions = [];
          if (route.sourcePath) conditions.push(`path: ${route.sourcePath}`);
          if (route.tag) conditions.push(`tag: #${route.tag}`);
          const condition = conditions.length > 0 ? conditions.join(", ") : "all files";
          console.log(`  ${condition} → ${route.outputPath}`);
        }
      }

      console.log("\nTransformations:");
      const t = config.transformations;
      console.log(`  Wikilink behavior: ${t.wikilinkBehavior || "resolve"}`);
      if (t.urlProperty) {
        console.log(`  URL property:      ${t.urlProperty}`);
      }
      if (t.contentProperties && t.contentProperties.length > 0) {
        console.log(`  Content properties: ${t.contentProperties.join(", ")}`);
      }
      if (t.passthroughProperties && t.passthroughProperties.length > 0) {
        console.log(`  Passthrough props:  ${t.passthroughProperties.join(", ")}`);
      }
      if (t.linkOverrides && Object.keys(t.linkOverrides).length > 0) {
        console.log(`  Link overrides:     ${Object.keys(t.linkOverrides).length} configured`);
      }
      if (t.propertyTransforms && Object.keys(t.propertyTransforms).length > 0) {
        console.log(`  Property transforms: ${Object.keys(t.propertyTransforms).join(", ")}`);
      }
      if (t.contentTransform) {
        console.log("  Content transform:  custom function configured");
      }
      if (t.filenameTransform) {
        console.log("  Filename transform: custom function configured");
      }
    } catch (error) {
      console.error("Error loading config:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === "scan") {
    try {
      const config = await loadConfig();
      console.log("Scanning source files...\n");
      const files = await scanSourceFiles(config);

      if (files.length === 0) {
        console.log("No files found matching routes.");
        return;
      }

      console.log(`Found ${files.length} file(s):\n`);
      for (const file of files) {
        console.log(`  ${file.relativePath}`);
        if (file.tags.length > 0) {
          console.log(`    Tags: ${file.tags.join(", ")}`);
        }
        console.log(`    Route: ${file.route.outputPath}`);
        console.log(`    Output: ${file.outputPath}`);
        console.log();
      }
    } catch (error) {
      console.error("Error scanning files:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === "status") {
    try {
      const config = await loadConfig();
      console.log("Checking status (dry-run)...\n");
      const status = await getStatus(config);

      if (status.collisions.length > 0) {
        console.error("⚠️  COLLISIONS DETECTED:");
        for (const collision of status.collisions) {
          console.error(`  ${collision}`);
        }
        console.error("\nResolve collisions before syncing.");
        process.exit(1);
      }

      console.log(`Files to copy: ${status.toCopy.length}`);
      if (status.toCopy.length > 0) {
        for (const file of status.toCopy) {
          console.log(`  + ${file.relativePath} → ${file.outputPath}`);
        }
      }

      console.log(`\nFiles to delete: ${status.toDelete.length}`);
      if (status.toDelete.length > 0) {
        for (const file of status.toDelete) {
          console.log(`  - ${file}`);
        }
      }

      console.log(`\nNo changes will be made. Run "mdsync sync" to apply.`);
    } catch (error) {
      console.error("Error checking status:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === "sync") {
    try {
      const config = await loadConfig();
      const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");

      console.log("Syncing files...\n");
      const result = await syncFiles(config, verbose);

      console.log(`✓ Copied: ${result.copied} file(s)`);
      console.log(`✓ Deleted: ${result.deleted} file(s)`);
      if (result.filesCopied > 0) {
        console.log(`✓ Files copied to _files/: ${result.filesCopied}`);
      }

      if (result.unresolvedLinksCount > 0) {
        console.log(`\nWikilinks: ${result.unresolvedLinksCount} unresolved`);

        if (verbose && result.unresolvedLinks) {
          console.log("\nUnresolved wikilinks:");
          for (const link of result.unresolvedLinks) {
            console.log(`  ${link.wikilink} in ${link.filePath}`);
          }
        } else if (result.unresolvedLinksCount > 0) {
          console.log("  (use --verbose to see details)");
        }
      }

      if (result.errors.length > 0) {
        console.error(`\n⚠️  Errors encountered:`);
        for (const error of result.errors) {
          console.error(`  ${error.message}`);
        }
        process.exit(1);
      }

      console.log("\n✓ Sync complete!");
    } catch (error) {
      console.error("Error syncing files:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === "clean") {
    try {
      const config = await loadConfig();
      console.log(`Cleaning all files for user: ${config.userId}\n`);
      const deleted = await cleanFiles(config);
      console.log(`✓ Deleted ${deleted} file(s)`);
    } catch (error) {
      console.error("Error cleaning files:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error('Run "mdsync help" for usage');
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
