# Obsidian Sync Tool - Design Document

## Overview
An npm module that synchronizes Markdown files from source directories (like Obsidian vaults) into a target repository. Multiple users can sync their files independently, with files organized by configurable rules based on folder paths and frontmatter tags.

## Core Principles
1. **Read-only source**: Never modify files in source directories
2. **Stateless sync**: No manifest files - scan and sync on each run
3. **Multi-user support**: User ID embedded in output filenames
4. **Configurable routing**: Map source files to output locations based on folder patterns and tags

## User Identity Resolution
The tool determines user ID in this order:
1. `git config user.email` → extract username (portion before @)
2. Environment variable `OBSIDIAN_SYNC_USER`
3. Config file `userId` field
4. **Error if none found** - user must configure identity

## Output File Naming
User ID is injected before file extension:
```
Source: vault/daily-notes/2024-01-09.md
Output: notes/logs/2024-01-09.josh.md

Source: vault/projects/website.md (with #working tag)
Output: projects/website.josh.md
```

**Collision Detection**: If two users would produce the same output path, throw an error and stop the sync. Users must resolve conflicts manually.

## Configuration

Config file: `obsidian-sync.config.js`

```javascript
module.exports = {
  userId: 'josh', // Optional: override auto-detection
  sourceDir: '/Users/josh/Documents/Obsidian/MyVault',
  outputDir: './synced-notes',

  // Routing rules - evaluated in order, first match wins
  routes: [
    {
      // Match by source path pattern
      sourcePath: 'Logs/**/*.md',
      outputPath: 'notes/logs'
    },
    {
      // Match by frontmatter tag
      tag: 'working',
      outputPath: 'projects'
    },
    {
      // Match by source path OR tag
      sourcePath: 'Archive/**/*.md',
      tag: 'archived',
      outputPath: 'archive'
    },
    {
      // Default catch-all
      sourcePath: '**/*.md',
      outputPath: 'notes'
    }
  ],

  // Optional: patterns to exclude
  exclude: ['**/.obsidian/**', '**/templates/**']
};
```

## Routing Logic

For each source file:
1. Read file to check for frontmatter tags (YAML block at start)
2. Evaluate routes in order:
   - If route has `sourcePath`: check if file path matches glob pattern
   - If route has `tag`: check if file has that tag in frontmatter
   - If route has both: match if EITHER condition is true (OR logic)
3. Use first matching route's `outputPath`
4. Construct output filename: `<outputPath>/<basename>.<userId>.<ext>`

## Sync Algorithm

```
1. Load configuration
2. Detect user ID
3. Scan source directory for files matching route patterns
4. For each matched file:
   a. Parse frontmatter to extract tags
   b. Determine output path using routing rules
   c. Generate output filename with user ID
   d. Check for collision with existing files from other users
   e. Copy file to output location (create dirs as needed)
5. Scan output directories for files belonging to current user (*.userId.ext)
6. Delete any output files that don't have a corresponding source
7. Report summary: X files copied, Y files deleted, Z collisions
```

## Technology Stack

- **TypeScript**: Type safety and better developer experience
- **Node built-ins**:
  - `fs/promises`: File operations
  - `path`: Path manipulation
  - `child_process`: Execute `git config`
- **Minimal dependencies**:
  - `glob` or built-in Node glob (Node 18+): Pattern matching
  - `gray-matter` or similar: Parse frontmatter YAML

## CLI Interface

```bash
# Sync files
obsidian-sync sync

# Check what would change without syncing
obsidian-sync status

# Clean up all files for current user
obsidian-sync clean
```

## Project Structure

```
obsidian-convert/new/
├── src/
│   ├── index.ts           # Main sync logic
│   ├── config.ts          # Config loading
│   ├── user.ts            # User ID detection
│   ├── routing.ts         # Route matching logic
│   ├── frontmatter.ts     # Parse YAML frontmatter
│   └── cli.ts             # CLI entry point
├── dist/                  # Compiled JS
├── obsidian-sync.config.js  # Example config
├── package.json
├── tsconfig.json
├── DESIGN.md             # This file
├── CHOP.md               # AI coding best practices
└── README.md             # User documentation
```

## Future Enhancements (Post-v1)

- Watch mode for automatic syncing on file changes
- Git integration (auto-commit synced files)
- Support for non-Markdown files
- More sophisticated tag logic (AND/OR combinations)
- Conflict resolution strategies
- Plugin system for custom routing logic

## Error Handling

- **User ID not detected**: Clear error message with resolution steps
- **File collision**: List all collisions, stop sync, require manual resolution
- **Source directory not found**: Clear error with configured path
- **Output directory creation fails**: Report permission/path issues
- **Malformed frontmatter**: Log warning, skip tag matching for that file
- **Config file errors**: Report syntax errors with line numbers if possible

## Testing Strategy

- Unit tests for each module (config, user detection, routing, frontmatter)
- Integration tests with mock filesystem
- Test collision detection with multiple mock users
- Test all routing combinations (path only, tag only, both, neither)
