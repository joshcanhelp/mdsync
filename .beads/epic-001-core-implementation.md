# Epic 001: Core Implementation

Status: IN_PROGRESS
Started: 2026-01-09

## Goal
Build the core markdown-sync npm module with multi-user support and configurable routing.

## Tasks

### Completed
- [x] Project structure setup (package.json, tsconfig, gitignore)
- [x] TypeScript types defined (types.ts)
- [x] User ID detection (user.ts + tests)
- [x] Config loading skeleton (config.ts + basic tests)

### In Progress
- [ ] **NEXT**: Frontmatter parsing module (frontmatter.ts)

### Pending
- [ ] Route matching logic (routing.ts)
- [ ] File scanning and glob matching
- [ ] File syncing with collision detection (index.ts)
- [ ] Orphaned file cleanup
- [ ] CLI entry point (cli.ts)
- [ ] End-to-end testing with real files
- [ ] README documentation

## Notes
- Following CHOP: one module at a time with tests
- Code should be self-documenting, minimize comments
- Build passes, 18 tests passing
