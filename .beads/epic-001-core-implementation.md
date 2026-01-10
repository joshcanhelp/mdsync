# Epic 001: Core Implementation

Status: IN_PROGRESS
Started: 2026-01-09
Last Updated: 2026-01-10 06:58

## Goal
Build the core markdown-sync npm module with multi-user support and configurable routing.

## Tasks

### Completed
- [x] Project structure setup (package.json, tsconfig, gitignore)
- [x] TypeScript types defined (types.ts)
- [x] User ID detection from git config (user.ts + 11 tests)
- [x] Config loading with validation (config.ts + 7 tests)
- [x] Config validation (sourceDir, outputDir, routes, userId)
- [x] Frontmatter parsing with props extraction (frontmatter.ts + 9 tests)
- [x] Route matching logic (routing.ts + 9 tests)
- [x] File scanning with glob matching (scanner.ts + 12 tests)
- [x] CLI entry point for testing (cli.ts)
- [x] Prettier setup and formatting
- [x] Required frontmatter validation (requireTags, requireProps with value matching)

### In Progress
- [ ] **NEXT**: File syncing with collision detection (index.ts)

### Pending
- [ ] Orphaned file cleanup
- [ ] End-to-end testing with real files
- [ ] README documentation

## Current State
- Build: ✅ Passing
- Tests: ✅ 48/48 passing
- Modules: 7 implemented (types, user, config, frontmatter, routing, scanner, cli)
- Context: ~150k/200k (75%)

## Notes
- Following CHOP: one module at a time with tests
- Following CLAUDE.md workflow checklist
- Code is self-documenting with minimal comments
- Using `//` for single-line comments
