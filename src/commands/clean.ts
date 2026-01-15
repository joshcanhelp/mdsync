import { loadConfig } from "../config.js";
import { cleanFiles } from "../index.js";

export async function cleanCommand(): Promise<void> {
  const config = await loadConfig();
  console.log(`Cleaning all files for user: ${config.userId}\n`);
  const deleted = await cleanFiles(config);
  console.log(`✓ Deleted ${deleted} file(s)`);
}
