// Repository-wide configuration file
// Copy this to markdown-sync.config.cjs and customize for your repo
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

  // Optional: transformation settings
  transformations: {
    // Frontmatter property containing URL for wikilink resolution (default: "link_to")
    urlProperty: "link_to",

    // Properties to inject into file content (removed from frontmatter)
    contentProperties: ["tags", "created"],

    // Properties to keep in frontmatter (passed through unchanged)
    passthroughProperties: ["title", "author"],

    // Properties not listed above are omitted from output

    // Wikilink transformation behavior (default: "resolve")
    // - "resolve": convert [[link]] to [link](url), keep if no URL found
    // - "remove": remove wikilinks that can't be resolved
    // - "preserve": keep all wikilinks unchanged
    wikilinkBehavior: "resolve",

    // Override specific links (useful for external references)
    linkOverrides: {
      "external-note.md": "https://example.com/external",
    },

    // Custom transformations for frontmatter properties
    // Only applies to passthroughProperties, works with strings and arrays
    propertyTransforms: {
      // Uppercase the title (string transform)
      title: (value) => value.toUpperCase(),

      // Capitalize author name (string transform)
      author: (value) =>
        value
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),

      // Transform tags array (array transform)
      tags: (value) => value.map(tag => `blog/${tag}`),

      // Transform with context (works with strings or arrays)
      modified: (value, context) => {
        // Access file path and frontmatter
        console.log(`Transforming ${context.filePath}`);
        return new Date(value).toISOString();
      },
    },

    // Custom transformation for main content
    // Applied after all built-in transformations
    contentTransform: (content, context) => {
      // Example: add header based on frontmatter
      const author = context.frontmatter.author;
      if (author) {
        return `> Author: ${author}\n\n${content}`;
      }
      return content;
    },

    // Custom transformation for filenames (applied before user ID is added)
    // Receives the filename without extension
    filenameTransform: (filename, context) => {
      // Example: convert dates to ISO format
      // "2024-01-09" → "2024-01-09"
      // Or add prefix based on frontmatter
      const category = context.frontmatter.category;
      if (category) {
        return `${category}-${filename}`;
      }
      return filename;
    },
  },
};
