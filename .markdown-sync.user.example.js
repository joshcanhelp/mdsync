// User-specific configuration file
// Copy this to .markdown-sync.user.js in your home directory or repo root
// DO NOT commit this file - add it to .gitignore

module.exports = {
  // USER-SPECIFIC CONFIGURATION
  // These settings are personal to each developer

  // Optional: override auto-detected user ID (from git config)
  // userId: 'josh',

  // Required: your source directory containing markdown files
  sourceDir: "/Users/josh/Documents/notes",

  // Routing rules - evaluated in order, first match wins
  routes: [
    {
      // Files in Logs folder go to logs subdirectory
      sourcePath: "Logs/**/*.md",
      outputPath: "logs",
    },
    {
      // Files tagged #working go to projects subdirectory
      tag: "working",
      outputPath: "projects",
    },
    {
      // Files in Archive OR tagged #archived go to archive subdirectory
      sourcePath: "Archive/**/*.md",
      tag: "archived",
      outputPath: "archive",
    },
  ],

  // Optional: patterns to exclude from syncing
  exclude: ["**/templates/**", "**/drafts/**"],
};
