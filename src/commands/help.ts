export async function helpCommand(): Promise<void> {
  console.log(`
mdsync - Sync markdown files with multi-user support

Usage:
  mdsync init              Initialize configuration files (interactive)
  mdsync config            Show current configuration
  mdsync scan              Scan source files and show what would be synced
  mdsync status            Show what would change (dry-run)
  mdsync sync [--verbose]  Sync files with transformation
  mdsync clean             Remove all synced files for current user
  mdsync help              Show this help message

Flags:
  --verbose, -v   Show detailed transformation reports (e.g., all unresolved wikilinks)

Config files:
  - .markdown-sync.user.cjs (required, in home directory)
  - markdown-sync.config.cjs (optional, in repo root for custom routing)
`);
}
