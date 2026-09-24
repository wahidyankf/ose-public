---
description: This repository's concrete automations and their benefits.
when_to_use: Use to find an existing automation to reuse or extend.
---

# Examples from This Repository

## Husky Git Hooks

**Location**: `.husky/`

**Files**:

- `pre-commit` - Format code with Prettier
- `commit-msg` - Screen the commit message with the public-safety check (Conventional Commits format is checked by review, not a hook)

**Automation benefits**:

- PASS: Runs on every commit (no forgetting)
- PASS: Fast (only staged files)
- PASS: Consistent across all developers
- PASS: Blocks invalid commits immediately

## AI Validation Agents

**Location**: `.claude/agents/`

**Agents**:

- `docs-checker.md` - Validate documentation
- `docs-link-checker.md` - Verify links with cache
- `rules-checker.md` - Check repository consistency
- `plan-checker.md` - Validate project plans

**Automation benefits**:

- PASS: Deep validation (beyond git hooks)
- PASS: Generates detailed reports
- PASS: Catches complex issues (contradictions, broken links)
- PASS: On-demand (not every commit)

## Prettier Configuration

**Location**: `.prettierrc.json`, run by the `format-staged` gate in `repo-config.yml`

**What it automates**:

- JavaScript/TypeScript formatting (2 spaces)
- JSON formatting
- Markdown formatting
- YAML formatting

**Automation benefits**:

- PASS: No style debates
- PASS: Consistent codebase
- PASS: Automatic on commit
- PASS: Fast (only changed files)

## Link Verification Cache

**Location**: `docs/metadata/external-links-status.yaml`

**What it automates**:

- External link checking
- 6-month cache per link
- Redirect chain tracking
- Status code recording

**Automation benefits**:

- PASS: Fast (cached results)
- PASS: Reduces external requests
- PASS: Timestamps for expiry
- PASS: Centralized link status
