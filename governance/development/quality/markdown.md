---
title: "Markdown Quality Standards"
description: Automated markdown linting and formatting standards using Prettier and markdownlint-cli2
category: explanation
subcategory: development
tags:
  - markdown
  - linting
  - formatting
  - prettier
  - markdownlint
  - quality
created: 2026-01-17
---

# Markdown Quality Standards

**Purpose**: Ensure consistent, high-quality markdown files across the repository through automated linting and formatting.

**Status**: Active

## Overview

This repository uses two complementary tools to maintain markdown quality:

- **Prettier**: Handles formatting (line wrapping, whitespace, indentation)
- **markdownlint-cli2**: Handles linting (structure, syntax, best practices)

Both tools work together to ensure markdown files are well-formatted and follow best practices.

## Tools

### Prettier (v3.6.2)

**Purpose**: Code formatter for consistent styling

**Configuration**: `.prettierrc.json`

```json
{
  "printWidth": 120,
  "proseWrap": "preserve"
}
```

**Ignore patterns**: `.prettierignore` (matches `.markdownlintignore`)

**When it runs**:

- Pre-commit hook (via lint-staged)
- Claude Code hook (PostToolUse)
- Manual: `npm run format:md`

### markdownlint-cli2 (v0.20.0)

**Purpose**: Markdown linter for structural and syntactic quality

**Configuration**: `.markdownlint-cli2.jsonc`

**Ignore patterns**: Configured in `.markdownlint-cli2.jsonc` `ignores` array

**When it runs**:

- Pre-push hook (blocks push if violations detected)
- Claude Code hook (PostToolUse)
- Manual: `npm run lint:md`

## Running Linting Locally

### Check markdown files

```bash
# Lint all markdown files
npm run lint:md

# Auto-fix violations
npm run lint:md:fix
```

### Format markdown files

```bash
# Format all markdown files
npm run format:md

# Check if files need formatting (no changes)
npm run format:md:check
```

## Enabled Rules

### Structural Rules

- **MD022**: Headings should be surrounded by blank lines
- Ensures visual separation of sections

### Formatting Rules

- **MD004**: Unordered list style (use `-`)
- **MD007**: List indentation (2 spaces per level)
- **MD009**: No trailing spaces
- **MD010**: No hard tabs
- **MD012**: No multiple consecutive blank lines
- **MD047**: Files should end with a single newline character

### Link Rules

- **MD034**: No bare URLs (use proper markdown links)
- **MD042**: No empty links

### Code Rules

- **MD031**: Fenced code blocks should be surrounded by blank lines

## Disabled Rules

These rules are intentionally disabled to align with repository conventions:

- **MD001**: Heading increment (false positives with code blocks)
- **MD003**: Heading style (allow mixed atx/atx_closed)
- **MD013**: Line length (allow long links)
- **MD024**: Duplicate headings (common in long docs)
- **MD025**: Multiple H1s (some files intentionally have multiple)
- **MD033**: Inline HTML (allowed for Hugo frontmatter)
- **MD036**: Emphasis as heading (intentional styling pattern)
- **MD040**: Code language (many code blocks are plain text)
- **MD041**: First line H1 (conflicts with frontmatter)
- **MD051**: Link fragments (false positives with auto-generated anchors)
- **MD056**: Table column count (intentional table formatting)
- **MD059**: Descriptive link text (contextually clear links)
- **MD060**: Table column style (intentional styling)

## Common Violations and Fixes

### Bare URLs

**Violation**:

```markdown
Check out https://example.com for more info.
```

**Fix**:

```markdown
Check out [example.com](https://example.com) for more info.
```

### Trailing Spaces

**Violation**:

```markdown
This line has trailing spaces.
```

**Fix**: Remove trailing spaces (Prettier handles this automatically)

### Multiple Blank Lines

**Violation**:

```markdown
First paragraph.

Second paragraph.
```

**Fix**:

```markdown
First paragraph.

Second paragraph.
```

### Hard Tabs

**Violation**: Using tab characters for indentation

**Fix**: Use spaces instead (Prettier converts automatically)

### Missing Blank Lines Around Headings

**Violation**:

```markdown
Previous paragraph.

## Heading

Next paragraph.
```

**Fix**:

```markdown
Previous paragraph.

## Heading

Next paragraph.
```

## Git Hooks

### Pre-Commit Hook

Runs Prettier on staged markdown files via lint-staged.

**Location**: `.husky/pre-commit` (configured in `package.json` lint-staged)

**Action**: Automatically formats staged markdown files

### Pre-Push Hook

Runs markdownlint on all markdown files before pushing.

**Location**: `.husky/pre-push`

**Action**: Blocks push if any markdown violations detected

**To fix violations before push**:

```bash
npm run lint:md:fix
```

## Claude Code Integration

### PostToolUse Hook

Automatically runs after Edit/Write/MultiEdit operations on markdown files.

**Location**: `.claude/hooks/format-lint-markdown.sh`

**Configuration**: `.claude/settings.json`

**Actions**:

1. Runs Prettier to format the file
2. Runs markdownlint-cli2 to fix violations

**Requirements**: `jq` must be installed for JSON parsing

**Install jq**:

```bash
# Linux
sudo apt-get install jq

# macOS
brew install jq
```

## Configuration Details

### Files Modified During Setup

- `.markdownlint-cli2.jsonc` - Linting rules
- `.markdownlintignore` - Files to ignore (deprecated, use `ignores` in config)
- `.prettierignore` - Files to ignore for formatting
- `package.json` - Added npm scripts
- `.husky/pre-push` - Added markdown linting step
- `.claude/settings.json` - PostToolUse hook configuration
- `.claude/hooks/format-lint-markdown.sh` - Hook execution script

### Ignored Directories

The following directories are excluded from linting and formatting:

- `node_modules/`
- `dist/`, `build/`, `.next/`, `.nx/`
- `apps/*/public/` (Hugo public directories)
- `apps-labs/` (experimental apps)
- `generated-reports/`
- `.vscode/`, `.idea/` (IDE files)

## Troubleshooting

### Pre-push hook blocks my push

```bash
# See violations
npm run lint:md

# Auto-fix most violations
npm run lint:md:fix

# Manually fix remaining violations
# Then try pushing again
```

### Claude Code hook not working

1. Verify `jq` is installed: `which jq`
2. Check hook script permissions: `ls -l .claude/hooks/format-lint-markdown.sh`
3. Should show `-rwxr-xr-x` (executable)
4. If not: `chmod +x .claude/hooks/format-lint-markdown.sh`

### Too many violations to fix

Configuration has been tuned to disable overly strict rules. If you still see many violations:

1. Review the violations: `npm run lint:md`
2. Run auto-fix: `npm run lint:md:fix`
3. Most violations should be automatically fixed
4. Remaining violations are usually intentional patterns

## Related Documentation

- [Content Quality Convention](../../conventions/writing/quality.md)
- [Indentation Convention](../../conventions/formatting/indentation.md)
- [Linking Convention](../../conventions/formatting/linking.md)
- [Code Quality Convention](./code.md)

## Maintenance

### Updating Rules

To modify linting rules:

1. Edit `.markdownlint-cli2.jsonc`
2. Test changes: `npm run lint:md`
3. Verify zero violations: `npm run lint:md:fix && npm run lint:md`
4. Commit configuration changes

### Updating Dependencies

```bash
# Update markdownlint-cli2
npm update markdownlint-cli2

# Update Prettier
npm update prettier
```

## Metrics

**Repository Status** (as of 2026-01-17):

- Total markdown files: 1,038 (after excluding node_modules)
- Violations before implementation: 17,903
- Violations after implementation: 0
- Auto-fix success rate: ~99.5%

## Principles Implemented/Respected

This practice implements and respects the following core principles:

### Automation Over Manual

**Implementation**: Markdown quality is enforced through automated tools rather than manual review:

- Pre-commit hooks automatically format staged markdown files
- Pre-push hooks prevent committing markdown violations
- Claude Code PostToolUse hooks format/lint markdown after Edit/Write operations
- Single command (`npm run lint:md:fix`) auto-fixes 99.5% of violations

See [Automation Over Manual Principle](../../principles/software-engineering/automation-over-manual.md) for foundational rationale.

### Explicit Over Implicit

**Implementation**: Quality rules are explicitly defined and transparent:

- Explicit configuration files (`.markdownlint-cli2.jsonc`, `.prettierrc.json`)
- Documented enabled/disabled rules with rationale
- Clear violation messages with fix guidance
- No "magic" formatting - all rules traceable to configuration

See [Explicit Over Implicit Principle](../../principles/software-engineering/explicit-over-implicit.md) for foundational rationale.

### Simplicity Over Complexity

**Implementation**: Minimal configuration, maximum automation:

- Only two complementary tools (Prettier + markdownlint-cli2)
- Intentionally disabled overly strict rules (18 disabled rules)
- Simple npm scripts (`lint:md`, `format:md`)
- Zero-config for most use cases

See [Simplicity Over Complexity Principle](../../principles/general/simplicity-over-complexity.md) for foundational rationale.

## Conventions Implemented/Respected

This practice enforces and aligns with the following documentation conventions:

### Content Quality Convention

**Alignment**: Markdown quality standards directly enforce content quality requirements:

- MD022: Ensures visual separation (readability)
- MD034/MD042: Enforces proper link formatting (accessibility)
- MD031: Ensures code block formatting (technical clarity)
- Disabled MD013: Allows long links (convention compliance)

See [Content Quality Convention](../../conventions/writing/quality.md) for quality standards.

### Indentation Convention

**Alignment**: Enforces 2-space indentation for markdown lists:

- MD007: List indentation must be 2 spaces per level
- MD010: No hard tabs (spaces only)
- Prettier auto-formats to 2-space indentation

See [Indentation Convention](../../conventions/formatting/indentation.md) for indentation standards.

### Linking Convention

**Alignment**: Enforces proper markdown linking:

- MD034: No bare URLs (use proper markdown links)
- MD042: No empty links
- Disabled MD041: Allows frontmatter before H1

See [Linking Convention](../../conventions/formatting/linking.md) for linking standards.
