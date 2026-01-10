#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { scanSourceFiles } from "./scanner.js";
import { syncFiles, getStatus, cleanFiles } from "./index.js";

async function main() {
  const command = process.argv[2] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
markdown-sync - Sync markdown files with multi-user support

Usage:
  markdown-sync config        Show current configuration
  markdown-sync scan          Scan source files and show what would be synced
  markdown-sync status        Show what would change (dry-run)
  markdown-sync sync          Sync files for real
  markdown-sync clean         Remove all synced files for current user
  markdown-sync help          Show this help message

Config files:
  - .markdown-sync.user.js (required, in repo root or home directory)
  - markdown-sync.config.js (optional, for custom routing)
`);
    return;
  }

  if (command === "config") {
    try {
      const config = await loadConfig();
      console.log("Current configuration:");
      console.log(JSON.stringify(config, null, 2));
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

      console.log(`\nNo changes will be made. Run "markdown-sync sync" to apply.`);
    } catch (error) {
      console.error("Error checking status:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  if (command === "sync") {
    try {
      const config = await loadConfig();
      console.log("Syncing files...\n");
      const result = await syncFiles(config);

      console.log(`✓ Copied: ${result.copied} file(s)`);
      console.log(`✓ Deleted: ${result.deleted} file(s)`);

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
  console.error('Run "markdown-sync help" for usage');
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
