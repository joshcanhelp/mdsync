# Claude Instructions for markdown-sync

This file contains project-specific instructions for AI agents working on this repository.

## Project Context

This is an npm module that syncs Markdown files from source directories into a target repository with multi-user support. Files are routed to different output locations based on configurable rules (folder patterns and frontmatter tags).

## Development Guidelines

### Code Style
- Use `//` for single-line comments, not `/** */`
- Minimize comments - code should be self-documenting
- Run `npm run format` after coding tasks

### Testing
- Write unit tests for each module using vitest
- One module at a time - build, test, verify before moving on
- All tests must pass before committing

### Configuration
- User config (`.markdown-sync.user.js`) - personal settings, not committed
- Repo config (`markdown-sync.config.js`) - shared settings, optional (has defaults)
- No `outputDir` in user config - that's repo-only

### File Operations
- Never modify source files
- Output files use format: `filename.userid.ext`
- Collision = error (two users, same output path)

## Task Management

See `.beads/` directory for current task state and progress tracking.

## Testing During Development

Run CLI with: `npx tsx src/cli.ts [command]`

## Additional Notes

Add project-specific instructions here as needed.
