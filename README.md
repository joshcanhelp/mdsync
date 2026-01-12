# mdsync

Sync markdown files from personal note directories into a shared repository with multi-user support. Each user's files are identified by their user ID embedded in the filename, allowing multiple people to sync notes into the same repository without conflicts.

## Features

- Multi-user support with automatic user ID detection
- Configurable routing based on folder paths and frontmatter tags
- Filter files by required tags and frontmatter properties
- Built-in content transformations (wikilink resolution, frontmatter handling)
- Collision detection prevents conflicts
- Orphaned file cleanup

## Installation

### Global Installation

```bash
npm install -g mdsync
```

### Local Installation (from tarball for testing)

```bash
# From the project directory, create a package
npm pack

# In your target directory
npm install /path/to/markdown-sync-0.1.0.tgz

# Or install globally from tarball
npm install -g /path/to/markdown-sync-0.1.0.tgz
```

### Development Setup

```bash
npm install
npm run build
```

## Configuration

Two configuration files control behavior:

### User Config (required)

Create `.markdown-sync.user.cjs` in the repo root or your home directory. This file contains personal settings and should NOT be committed.

See [.markdown-sync.user.example.cjs](.markdown-sync.user.example.cjs) for a complete example.

Required fields:
- `sourceDir` - Path to your markdown files

Optional fields:
- `userId` - Override auto-detected user ID
- `routes` - Define routes if no repo config exists
- `exclude` - Patterns to exclude
- `requireTags` - Required frontmatter tags
- `requireProps` - Required frontmatter properties
- `transformations` - Content transformation settings

### Repo Config (optional)

Create `markdown-sync.config.cjs` in the repo root. This file defines shared settings and should be committed.

See [markdown-sync.config.example.cjs](markdown-sync.config.example.cjs) for a complete example.

Required fields:
- `outputDir` - Where to sync files (relative to repo root)

Optional fields:
- `routes` - Routing rules (first match wins)
- `exclude` - Patterns to exclude from syncing
- `requireTags` - Files must have ALL these tags
- `requireProps` - Files must have matching property values
- `transformations` - Content transformation settings

## User ID Detection

User ID is determined in this order:

1. Git config `user.email` (username portion before @)
2. Environment variable `MARKDOWN_SYNC_USER`
3. `userId` field in user config
4. Error if none found

## Output File Naming

User ID is injected before the file extension:

```
Source: vault/daily-notes/2024-01-09.md
Output: notes/logs/2024-01-09.username.md
```

Collision detection prevents multiple users from creating files with the same base name in the same location.

## Routing

Routes are evaluated in order. First match wins.

Each route can specify:
- `sourcePath` - Glob pattern to match source file paths
- `tag` - Frontmatter tag to match (without # prefix)
- `outputPath` - Subdirectory for matched files

If a route has both `sourcePath` and `tag`, the file must match BOTH conditions (AND logic).

Examples:
```javascript
// Match only files in Logs/ with artifact/devlog tag
{
  sourcePath: "Logs/**/*.md",
  tag: "artifact/devlog",
  outputPath: "devlog"
}

// Match any file with working tag
{
  tag: "working",
  outputPath: "projects"
}

// Match any file in Archive/
{
  sourcePath: "Archive/**/*.md",
  outputPath: "archive"
}
```

## Filtering

Files can be filtered by required fields:

### Required Tags

Files must have ALL specified tags:

```js
requireTags: ["public", "published"]
```

### Required Props

Files must have matching frontmatter properties. Matching uses substring matching:

```js
requireProps: {
  status: ["published", "review"],  // must contain one of these
  title: "*",                        // must exist with any value
  references: "[[Technology/Pub"     // must contain this substring
}
```

## Transformations

Content transformations are applied during sync to modify files before writing them to the output directory.

### Wikilink Resolution

Wikilinks (`[[internal-link]]`) are transformed based on frontmatter URL properties:

```
[[note.md]] → [note.md](https://example.com/note)
[[note.md|Display Text]] → [Display Text](https://example.com/note)
```

Configure behavior in [markdown-sync.config.example.cjs](markdown-sync.config.example.cjs):

- `urlProperty` - Frontmatter property containing the URL (default: `"link_to"`)
- `wikilinkBehavior` - How to handle wikilinks:
  - `"resolve"` (default) - Convert to markdown links, keep unresolved as wikilinks
  - `"remove"` - Remove wikilinks that can't be resolved
  - `"preserve"` - Keep all wikilinks unchanged
- `linkOverrides` - Manual URL mappings for specific files

### Frontmatter Handling

Control which frontmatter properties appear in synced files:

- `contentProperties` - Injected into file content (removed from frontmatter)
- `passthroughProperties` - Kept in frontmatter unchanged
- Properties not listed in either are omitted from output

See [markdown-sync.config.example.cjs](markdown-sync.config.example.cjs) for configuration examples.

### Transformation Reporting

Sync command shows unresolved wikilinks:

```bash
mdsync sync
# Output shows: Wikilinks: 3 unresolved

mdsync sync --verbose
# Shows each unresolved wikilink and its location
```

## Commands

### Show Current Configuration

```bash
mdsync config
```

### Scan Source Files

Show which files would be synced:

```bash
mdsync scan
```

### Check Status (Dry-run)

Show what would change without making modifications:

```bash
mdsync status
```

### Sync Files

Perform the actual sync:

```bash
mdsync sync
```

### Clean Up

Remove all synced files for the current user:

```bash
mdsync clean
```

## Workflow Example

```bash
# 1. Check current configuration
mdsync config

# 2. See which files would be synced
mdsync scan

# 3. Preview changes (dry-run)
mdsync status

# 4. Sync for real
mdsync sync

# 5. To start fresh, remove all synced files
mdsync clean
```

## Development

Run tests:

```bash
npm test
```

Build TypeScript:

```bash
npm run build
```

Format code:

```bash
npm run format
```

## License

MIT
