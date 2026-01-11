# Epic 002: Built-in Content Transformations

Status: PENDING
Started: TBD
Last Updated: 2026-01-10 07:45

## Goal

Transform markdown content during sync with built-in transformations for links, frontmatter, and common conversions.

## Requirements

1. Build a link map from all source files (excluding `exclude` patterns)
   - Map: internal file path → URL from configurable frontmatter property
   - URL property name is configurable (e.g., `link_to`, `permalink`, `url`)
   - This map is used to resolve wikilinks during transformation

2. Transform wikilinks in content
   - `[[Internal Link]]` → markdown link `[Internal Link](url)` if URL found in map
   - `[[Internal Link]]` → removed if no URL in map
   - `[[Internal Link|Custom Text]]` → `[Custom Text](url)` if URL found
   - `[[Internal Link|Custom Text]]` → removed if no URL in map
   - Track count of unresolved wikilinks for reporting

3. Frontmatter property handling
   - **Content properties**: injected into content with wikilink transformation, then removed from frontmatter
   - **Passthrough properties**: copied to output frontmatter unchanged (e.g., `tags`)
   - All other properties are omitted from output

4. Obsidian-specific syntax conversions
   - Callouts: `> [!note]` → standard markdown blockquotes
   - Highlights: `==text==` → `<mark>text</mark>` or `**text**`
   - Footnotes: ensure standard markdown format

5. Image/asset link transformation
   - `![[image.png]]` → `![image](path/to/image.png)` using link map
   - Handle attachments directory references
   - Assets should be copied from source to output (even if the folders are excluded)

6. Output transformation statistics
   - Total count of unresolved wikilinks across all files
   - Optional `--verbose` flag to list all unresolved wikilinks with file locations
   - Report at end of sync operation

## Configuration

Configuration options control transformation behavior. See config example files and DESIGN.md for detailed specifications.

- `urlProperty` - Frontmatter property name containing URLs (default: "link_to")
- `contentProperties` - Properties to inject into content (with wikilink transformation)
- `passthroughProperties` - Properties to copy unchanged to output frontmatter
- `wikilinkBehavior` - How to handle wikilinks: "resolve", "remove", or "preserve"
- `linkOverrides` - Override URLs for specific files

## Technical Design

See DESIGN.md for detailed technical specifications including:
- Module structure
- Type definitions
- Transformation pipeline
- Link map building algorithm
- Wikilink transformation logic

## Tasks

### Completed

#### Phase 1: Link Resolution
- [x] Create transformations module structure
- [x] Implement link map builder
- [x] Write wikilink parser/transformer
- [x] Add transformation types
- [x] Unit tests for link resolution (16 tests)

### In Progress
(None yet)

### Pending

#### Phase 2: Frontmatter Transformation
- [ ] Implement content property injection (transform wikilinks in property values)
- [ ] Implement passthrough property handling
- [ ] Filter out non-configured properties
- [ ] Unit tests for frontmatter transformation (10+ tests)

#### Phase 3: Obsidian Syntax Conversion
- [ ] Convert callouts to blockquotes
- [ ] Convert highlights to mark/bold
- [ ] Transform image embeds
- [ ] Unit tests for syntax conversion (12+ tests)

#### Phase 4: Integration & Reporting
- [ ] Add transformation report to SyncResult
- [ ] Track unresolved wikilinks count during transformation
- [ ] Implement verbose reporting (list all unresolved wikilinks)
- [ ] Integrate transformer into sync pipeline
- [ ] Update index.ts to apply transformations during copy
- [ ] Add transformation config to types (urlProperty, contentProperties, passthroughProperties)
- [ ] Update config validation
- [ ] Update CLI to show transformation report
- [ ] Add --verbose flag to CLI commands
- [ ] End-to-end tests with transformations (8+ tests)

#### Phase 5: Documentation
- [ ] Update README with transformation docs
- [ ] Add transformation examples to config files
- [ ] Document transformation pipeline

## Notes

- Transformations happen DURING sync, not before or after
- Link map must be built from ALL source files, not just matched files
- Transformation is one-way: source files are never modified
- Each transformation should be independently testable
- Consider performance: build link map once, reuse for all files
- Handle edge cases: malformed wikilinks, circular references, missing files

## Open Questions

1. Should link map include files that don't match routing/filtering rules?
   - YES - need complete map to resolve any wikilink

2. What happens if wikilink target has multiple matches?
   - Use first match, warn about ambiguity

3. Should we transform wikilinks in code blocks?
   - NO - preserve code blocks as-is

4. How to handle relative vs absolute paths in link_to?
   - Store as-is, assume they're valid URLs or paths

5. Should image transformations copy images to output?
   - NOT IN THIS EPIC - just transform the links
   - Image copying could be Epic 004

## Success Criteria

- All wikilinks are resolved or removed based on configuration
- Frontmatter properties are injected and transformed correctly
- Obsidian-specific syntax converts to standard markdown
- Source files remain unchanged
- Comprehensive test coverage
- Performance: transform 1000 files in under 5 seconds
