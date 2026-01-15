# mdsync

Sync markdown files from personal note directories into a shared repository with multi-user support. This was created to manage devlogs, engineering notes, and ADRs in an Obsidian repo but still make them available to the rest of the team. It works by looking for files in specific routes, filtered by tags or other properties, then copying the found notes over, with optional tranfomrations. I use it here:

- [Devlogs in this repo](./notes/)
- [Devlogs and ADRs for this project](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/docs)

## Installation

### Globally

```bash
npm install -g @joshcanhelp/mdsync
```

### In an npm project

```bash
npm install --save-dev @joshcanhelp/mdsync
```

### For development

```bash
npm install
npm run build
npm run mdsync [COMMAND]
```

## Configuration

Two configuration files control behavior:

### Repo Config

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

### User Config

Create `.markdown-sync.user.cjs` in the repo root or your home directory. This file contains personal settings and should NOT be committed.

See [.markdown-sync.user.example.cjs](.markdown-sync.user.example.cjs) for a complete example.

**Required:**

- `sourceDir` - Path to your markdown files

Optional fields:

- `userId` - Override auto-detected user ID
- `routes` - Define routes if no repo config exists
- `exclude` - Patterns to exclude
- `requireTags` - Required frontmatter tags
- `requireProps` - Required frontmatter properties
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
mdsync sync --verbose
```

### Clean Up

Remove all synced files for the current user:

```bash
mdsync clean
```
