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

**Context**: Keeping commit messages safe to publish and in the agreed format.

**Automation**: `.husky/commit-msg` hook + the `public-safety-commit-message` gate

```sh
#!/usr/bin/env sh
set -eu

# Thin lifecycle adapter. The typed registry owns every quality entry.
exec ./hippo run --class ephemeral --resource-tier light --disk-path . -- \
  ./rhino gate run --surface commit-msg --message-file "$1"
```

**What it automates**:

- Screens every commit message for public-safety shapes
- Blocks the commit on a finding

**What it does not automate**: the Conventional Commits format. `commitlint.config.js` is kept so a
message can be checked on demand, but no hook or CI step runs it, so review catches format drift
today — the manual path this principle would otherwise avoid.
