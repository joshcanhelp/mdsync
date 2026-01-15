import { loadConfig } from "../config.js";
import { syncFiles } from "../index.js";

export async function syncCommand(): Promise<void> {
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
}
