import { loadConfig } from "../config.js";
import { getStatus } from "../index.js";

export async function statusCommand(): Promise<void> {
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
}
