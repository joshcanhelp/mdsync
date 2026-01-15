# Claude Instructions for markdown-sync

This file contains project-specific instructions for AI agents working on this repository. Please acknowledge that you've read this when we start a session. 

## Project Context

This is an npm module that syncs Markdown files from source directories into a target repository with multi-user support. Files are routed to different output locations based on configurable rules (folder patterns and frontmatter tags).

- [Project design and architecture](./DESIGN.md)
- [Rules to follow when we code together](./CHOP.md)

## Development Workflow

### After Each Coding Block

Follow this checklist **in order** after implementing or modifying code:

1. **Write/Update Tests**
   - Create or update unit tests in `*.test.ts` files
   - Cover all new functionality and edge cases

2. **Build**
   - Run `npm run build` to compile TypeScript
   - Fix any compilation errors

3. **Run Tests**
   - Run `npm test` to execute all tests
   - All tests must pass - fix failures before proceeding

4. **Lint Code**
   - Run `npm run lint` to check TypeScript types and ESLint rules
   - Fix all linting errors before proceeding

5. **Format Code**
   - Run `npm run format` to apply prettier formatting
   - Commit formatted code only

6. **Update Documentation**
   - Update `DESIGN.md` if architecture changed
   - Update `CLAUDE.md` if workflow/conventions changed
   - Update `README.md` if user-facing tasks have changed
   - Update examples if config structure changed

7. **Task management**
   - See `.beads/AGENTS.md` for beads workflow
   - Run `bd prime` for current workflow context
   - Use `bd create` for strategic work (multi-session, dependencies, discovered issues)
   - Use `TodoWrite` tool for simple single-session task tracking
   - When in doubt, prefer bd—persistent tracking beats lost context

### Code Style

- Use `//` for single-line comments, not `/** */`
- Minimize comments - code should be self-documenting
- One module at a time - complete workflow before moving on
- Use guard clauses to return/break/continue early
- Bias towards more clear variable names rather than short ones

### Configuration

- User config (`.markdown-sync.user.js`) - personal settings, not committed
- Repo config (`markdown-sync.config.js`) - shared settings, optional (has defaults)
- No `outputDir` in user config - that's repo-only
- If the generic term "config" is used, that means both but clarify if there is ambiguity

### File Operations

- Never modify source files
- Never modify files in `.gitignore`
- Output files use format: `filename.userid.ext`
- Collision = error (two users, same output path)

## Testing During Development

Run CLI with: `npx tsx src/cli.ts [command]`
