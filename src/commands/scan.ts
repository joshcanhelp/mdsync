import { loadConfig } from "../config.js";
import { scanSourceFiles } from "../scanner.js";

export async function scanCommand(): Promise<void> {
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
}
