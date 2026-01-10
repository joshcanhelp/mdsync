#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { scanSourceFiles } from "./scanner.js";

async function main() {
  const command = process.argv[2] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
markdown-sync - Sync markdown files with multi-user support

Usage:
  markdown-sync config    Show current configuration
  markdown-sync scan      Scan source files and show what would be synced
  markdown-sync help      Show this help message

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

  console.error(`Unknown command: ${command}`);
  console.error('Run "markdown-sync help" for usage');
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
