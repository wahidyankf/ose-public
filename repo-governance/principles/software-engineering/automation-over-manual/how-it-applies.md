---
description: Pre-commit hook and commit message validation examples, with manual alternatives.
when_to_use: Use when implementing or reviewing a pre-commit hook or commit message check.
---

# How It Applies

## Git Hooks (Pre-commit)

**Context**: Ensuring code quality before commits.

**Automation**: `.husky/pre-commit` hook

```sh
#!/usr/bin/env sh
set -eu

# Thin lifecycle adapter. Rhino applies declared mutations to the Git index.
export RHINO_GATE_SURFACE=pre-commit
exec ./hippo run --class transactional --resource-tier standard --disk-path . -- \
  ./rhino gate run --surface pre-commit
```

**What it automates**:

- Code formatting with Prettier
- Automatically stages formatted files
- Blocks commit if formatting fails
- Runs only on staged files (fast)

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual process - error-prone
# 1. Developer remembers to run Prettier
# 2. Developer runs on all files (slow)
# 3. Developer might forget
# 4. Inconsistent formatting in commits
```

## Commit Message Validation

**Context**: Ensuring commit messages follow convention.

**Automation**: `.husky/commit-msg` hook + Commitlint

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

**What it automates**:

- Validates commit message format
- Enforces Conventional Commits standard
- Provides helpful error messages
- Blocks invalid commits

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual review - inconsistent
# 1. Developer writes commit message
# 2. Reviewer checks format (maybe)
# 3. Format inconsistencies slip through
# 4. Git history becomes messy
```
