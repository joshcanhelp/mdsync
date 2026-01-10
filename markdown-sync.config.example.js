// Example configuration file
// Copy this to markdown-sync.config.js and customize for your repo

module.exports = {
  // REPO-SPECIFIC CONFIGURATION (commit this file to the repo)
  // These settings should be shared across all users of the repo

  // Required: output directory to sync to (relative to repo root)
  outputDir: './notes',

  // Routing rules - evaluated in order, first match wins
  routes: [
    {
      // Files in Logs folder go to logs subdirectory
      sourcePath: 'Logs/**/*.md',
      outputPath: 'logs'
    },
    {
      // Files tagged #working go to projects subdirectory
      tag: 'working',
      outputPath: 'projects'
    },
    {
      // Files in Archive OR tagged #archived go to archive subdirectory
      sourcePath: 'Archive/**/*.md',
      tag: 'archived',
      outputPath: 'archive'
    },
  ],

  // Optional: patterns to exclude from syncing
  exclude: ['**/templates/**', '**/drafts/**']
};
