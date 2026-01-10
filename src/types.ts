export interface Route {
  // Glob pattern to match source file paths (relative to sourceDir)
  sourcePath?: string;
  // Frontmatter tag to match (without the # prefix)
  tag?: string;
  // Output subdirectory (relative to outputDir)
  outputPath: string;
}

// Repo-wide configuration (committed to version control)
export interface RepoConfig {
  // Output directory relative to repo root
  outputDir: string;
  // Routing rules evaluated in order (first match wins)
  // Optional - can be provided by user config if not specified
  routes?: Route[];
  // Optional glob patterns to exclude from syncing
  exclude?: string[];
  // Optional required tags (files must have ALL these tags)
  requireTags?: string[];
  // Optional required props with values (files must have ALL these props with matching values)
  // Use "*" to require property exists with any value
  // Use array of strings to require property matches one of the values
  requireProps?: Record<string, string | string[]>;
}

// User-specific configuration (not committed)
export interface UserConfig {
  // Override auto-detected user ID
  userId?: string;
  // Source directory containing markdown files
  sourceDir: string;
  // Optional routes (used if no repo config exists)
  routes?: Route[];
  // Optional exclude patterns
  exclude?: string[];
  // Optional required tags
  requireTags?: string[];
  // Optional required props
  requireProps?: Record<string, string | string[]>;
}

// Merged configuration with all required fields populated
export interface Config {
  userId: string;
  sourceDir: string;
  outputDir: string;
  routes: Route[];
  exclude: string[];
  requireTags?: string[];
  requireProps?: Record<string, string | string[]>;
}

// Information about a source file to be synced
export interface SourceFile {
  // Absolute path to source file
  absolutePath: string;
  // Path relative to sourceDir
  relativePath: string;
  // Parsed frontmatter tags (without # prefix)
  tags: string[];
  // Matched route for this file
  route: Route;
  // Computed output path (absolute)
  outputPath: string;
}

// Result of a sync operation
export interface SyncResult {
  // Number of files copied
  copied: number;
  // Number of files deleted
  deleted: number;
  // Files that would collide with other users
  collisions: string[];
  // Any errors encountered
  errors: Error[];
}

// Status information about what would change
export interface SyncStatus {
  // Files that would be copied
  toCopy: SourceFile[];
  // Output files that would be deleted
  toDelete: string[];
  // Potential collisions
  collisions: string[];
}
