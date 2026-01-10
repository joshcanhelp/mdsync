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
  routes: Route[];
  // Optional glob patterns to exclude from syncing
  exclude?: string[];
}

// User-specific configuration (not committed)
export interface UserConfig {
  // Override auto-detected user ID
  userId?: string;
  // Source directory containing markdown files
  sourceDir: string;
}

// Merged configuration with all required fields populated
export interface Config {
  userId: string;
  sourceDir: string;
  outputDir: string;
  routes: Route[];
  exclude: string[];
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
