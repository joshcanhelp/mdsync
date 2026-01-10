// Example configuration file
// Copy this to markdown-sync.config.js and customize for your repo

module.exports = {
  // REPO-SPECIFIC CONFIGURATION (commit this file to the repo)
  // These settings should be shared across all users of the repo

  // Required: output directory to sync to (relative to repo root)
  outputDir: "./notes",

  // Routing rules - evaluated in order, first match wins
  routes: [
    {
      sourcePath: "Logs/**/*.md",
      outputPath: "logs",
    },
    {
      tag: "working",
      outputPath: "projects",
    },
    {
      sourcePath: "**/*.md",
      outputPath: "notes",
    },
  ],

  // Optional: patterns to exclude from syncing
  exclude: ["**/templates/**", "**/drafts/**"],

  // Optional: require specific tags (files without ALL these tags are skipped)
  requireTags: ["public"],

  // Optional: require specific frontmatter props with values
  // Use "*" for any value, string for exact match, array for multiple allowed values
  requireProps: {
    status: ["published", "review"], // must be one of these values
    title: "*", // must exist with any value
  },
};
