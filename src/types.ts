export interface Route {
  // Glob pattern to match source file paths (relative to sourceDir)
  sourcePath?: string;
  // Frontmatter tag to match (without the # prefix)
  tag?: string;
  // Output subdirectory (relative to outputDir)
  outputPath: string;
}

// Context passed to custom transform functions
export interface TransformContext {
  filePath: string;
  frontmatter: Record<string, unknown>;
}

// Custom transformer function type for frontmatter properties
export type PropertyTransformFunction = (
  value: string | string[],
  context: TransformContext
) => string | string[] | Promise<string | string[]>;

// Custom transformer function type for content
export type ContentTransformFunction = (
  value: string,
  context: TransformContext
) => string | Promise<string>;

// Custom transformer function type for filenames
export type FilenameTransformFunction = (
  filename: string,
  context: TransformContext
) => string | Promise<string>;

// Transformation configuration
export interface TransformationConfig {
  // Frontmatter property containing URLs for link resolution
  urlProperty?: string;
  // Properties to inject into content (with wikilink transformation)
  contentProperties?: string[];
  // Properties to copy unchanged to output frontmatter
  passthroughProperties?: string[];
  // How to handle wikilinks: "resolve", "remove", or "preserve"
  wikilinkBehavior?: "resolve" | "remove" | "preserve";
  // Override URLs for specific files
  linkOverrides?: Record<string, string>;
  // Custom transformers for specific frontmatter properties
  propertyTransforms?: Record<string, PropertyTransformFunction>;
  // Custom transformer for main content
  contentTransform?: ContentTransformFunction;
  // Custom transformer for filenames (before user ID is added)
  filenameTransform?: FilenameTransformFunction;
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
  // Transformation settings
  transformations?: TransformationConfig;
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
  // Transformation settings
  transformations?: TransformationConfig;
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
  transformations: TransformationConfig;
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
  // Number of unresolved wikilinks
  unresolvedLinksCount: number;
  // Unresolved wikilinks (when verbose)
  unresolvedLinks?: Array<{ wikilink: string; filePath: string }>;
  // Number of files copied to _files directory
  filesCopied: number;
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

// File embed information
export interface FileEmbed {
  originalSyntax: string;
  filename: string;
  isImage: boolean;
  displayText?: string;
}

// Result of file embed transformation
export interface FileEmbedResult {
  content: string;
  copiedFiles: string[];
  errors: Error[];
}
