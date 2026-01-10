# markdown-sync

Sync markdown files from personal note directories into a shared repository with multi-user support. Each user's files are identified by their user ID embedded in the filename, allowing multiple people to sync notes into the same repository without conflicts.

## Features

- Multi-user support with automatic user ID detection
- Configurable routing based on folder paths and frontmatter tags
- Filter files by required tags and frontmatter properties
- Stateless operation - no manifest files
- Collision detection prevents conflicts
- Orphaned file cleanup
- Read-only source directory - never modifies your notes

## Installation

```bash
npm install
npm run build
```

## Configuration

Two configuration files control behavior:

### User Config (required)

Create `.markdown-sync.user.js` in the repo root or your home directory. This file contains personal settings and should NOT be committed.

See [.markdown-sync.user.example.js](.markdown-sync.user.example.js) for a complete example.

Required fields:
- `sourceDir` - Path to your markdown files

Optional fields:
- `userId` - Override auto-detected user ID
- `routes` - Define routes if no repo config exists
- `exclude` - Patterns to exclude
- `requireTags` - Required frontmatter tags
- `requireProps` - Required frontmatter properties

### Repo Config (optional)

Create `markdown-sync.config.js` in the repo root. This file defines shared settings and should be committed.

See [markdown-sync.config.example.js](markdown-sync.config.example.js) for a complete example.

Required fields:
- `outputDir` - Where to sync files (relative to repo root)

Optional fields:
- `routes` - Routing rules (first match wins)
- `exclude` - Patterns to exclude from syncing
- `requireTags` - Files must have ALL these tags
- `requireProps` - Files must have matching property values

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

If a route has both `sourcePath` and `tag`, the file matches if EITHER condition is true (OR logic).

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

## Commands

### Show Current Configuration

```bash
npm run mdsync config
```

### Scan Source Files

Show which files would be synced:

```bash
npm run mdsync scan
```

### Check Status (Dry-run)

Show what would change without making modifications:

```bash
npm run mdsync status
```

### Sync Files

Perform the actual sync:

```bash
npm run mdsync sync
```

### Clean Up

Remove all synced files for the current user:

```bash
npm run mdsync clean
```

## Workflow Example

```bash
# 1. Check current configuration
npm run mdsync config

# 2. See which files would be synced
npm run mdsync scan

# 3. Preview changes (dry-run)
npm run mdsync status

# 4. Sync for real
npm run mdsync sync

# 5. To start fresh, remove all synced files
npm run mdsync clean
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
