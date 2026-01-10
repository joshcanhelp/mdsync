#!/usr/bin/env node

import { loadConfig } from "./config.js";

async function main() {
  const command = process.argv[2] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`
markdown-sync - Sync markdown files with multi-user support

Usage:
  markdown-sync config    Show current configuration
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

  console.error(`Unknown command: ${command}`);
  console.error('Run "markdown-sync help" for usage');
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
