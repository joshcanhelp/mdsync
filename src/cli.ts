#!/usr/bin/env node

import { helpCommand } from "./commands/help.js";
import { configCommand } from "./commands/config.js";
import { scanCommand } from "./commands/scan.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { cleanCommand } from "./commands/clean.js";

async function main() {
  const command = process.argv[2] || "help";

  try {
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        await helpCommand();
        break;

      case "config":
        await configCommand();
        break;

      case "scan":
        await scanCommand();
        break;

      case "status":
        await statusCommand();
        break;

      case "sync":
        await syncCommand();
        break;

      case "clean":
        await cleanCommand();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "mdsync help" for usage');
        process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
