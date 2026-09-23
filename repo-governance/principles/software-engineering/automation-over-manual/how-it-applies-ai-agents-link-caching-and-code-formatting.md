---
description: AI agent validation, cached link verification, and Prettier formatting examples.
when_to_use: Use when implementing an AI validation agent, link cache, or code formatter.
---

# How It Applies — AI Agents, Link Caching, and Code Formatting

Continues [How It Applies](./how-it-applies.md).

## AI Agent Validation

**Context**: Checking documentation quality and consistency.

**Automation**: `docs-checker.md` agent

**What it automates**:

- Validates file naming conventions
- Checks frontmatter completeness
- Verifies internal link validity
- Detects contradictions
- Generates audit reports

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual review - time-consuming, incomplete
# 1. Reviewer reads all documentation
# 2. Manually checks file names
# 3. Manually clicks all links
# 4. Tries to remember all conventions
# 5. Misses subtle issues
```

## Link Verification Cache

**Context**: Checking external links without redundant requests.

**Automation**: `docs-link-checker.md` agent with cache

**Location**: `docs/metadata/external-links-status.yaml`

**What it automates**:

- Verifies external links
- Caches results (6-month expiry per link)
- Tracks redirect chains
- Timestamps in UTC+7
- Generates consolidated report

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual link checking - impractical
# 1. Click every external link
# 2. Record status and redirects
# 3. Repeat for every documentation update
# 4. Links change, manual check becomes stale
```

## Code Formatting

**Context**: Consistent code style.

**Automation**: Prettier via the `format-staged` registry gate

**Configuration** (`scripts/format-staged`, called by the `format-staged` gate):

```bash
case "$path" in
  *.md | *.js | *.jsx | *.ts | *.tsx | *.mjs | *.cjs | *.json | *.yml | *.yaml)
    prettier_paths+=("$path")
    ;;
esac
```

**What it automates**:

- Formats code to consistent style
- Runs automatically on commit
- No debates about formatting
- Consistent codebase

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual formatting - waste of time
# 1. Developer manually formats code
# 2. Different developers format differently
# 3. Code review wastes time on style
# 4. Inconsistent codebase
```
