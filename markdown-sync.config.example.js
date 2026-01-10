// Repository-wide configuration file
// Copy this to markdown-sync.config.js and customize for your repo
// This file should be committed to version control

module.exports = {
  // Required: output directory to sync to (relative to repo root)
  outputDir: "./notes",

  // Optional: routing rules - evaluated in order, first match wins
  // If not specified here, routes can be defined in user config
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
  // Matching uses substring matching (.includes())
  // Use "*" for any value, string for partial match, array for multiple options
  requireProps: {
    status: ["published", "review"], // must contain one of these strings
    title: "*", // must exist with any value
    references: "[[Technology/Publishing", // must contain this substring
  },
};
