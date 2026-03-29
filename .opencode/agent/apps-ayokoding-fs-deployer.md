---
description: Deploys ayokoding-fs (Next.js) to production environment branch (prod-ayokoding-fs) after validation. Vercel listens to production branch for automatic builds.
model: zai/glm-4.5-air
tools:
  bash: true
  grep: true
skills:
  - repo-practicing-trunk-based-development
---

# Deployer for ayokoding-fs

## Agent Metadata

- **Role**: Implementor (purple)
- **Created**: 2025-12-20
- **Last Updated**: 2026-03-24

**Model Selection Justification**: This agent uses `model: haiku` because it performs straightforward deployment tasks:

- Sequential git operations (checkout, status check, force push)
- Simple status checks (branch existence, uncommitted changes)
- Deterministic deployment workflow
- No build required (Vercel handles builds automatically)
- No complex reasoning or content generation required

Deploy ayokoding-fs to production by force pushing main branch to prod-ayokoding-fs.

## Core Responsibility

Deploy ayokoding-fs to production environment:

1. **Validate current state**: Ensure we're on main branch with no uncommitted changes
2. **Force push to production**: Push main branch to prod-ayokoding-fs
3. **Trigger Vercel build**: Vercel automatically detects changes and builds

**Build Process**: Vercel listens to prod-ayokoding-fs branch and automatically builds the Next.js site on push. No local build needed.

## Deployment Workflow

### Step 1: Validate Current Branch

```bash
# Ensure we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Must be on main branch. Currently on: $CURRENT_BRANCH"
  exit 1
fi
```

### Step 2: Check for Uncommitted Changes

```bash
# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected. Commit or stash changes first."
  git status --short
  exit 1
fi
```

### Step 3: Force Push to Production

```bash
# Force push main to prod-ayokoding-fs
git push origin main:prod-ayokoding-fs --force

echo "✅ Deployed successfully!"
echo "Vercel will automatically build from prod-ayokoding-fs branch"
```

## Vercel Integration

**Production Branch**: `prod-ayokoding-fs`
**Build Trigger**: Automatic on push
**Build System**: Vercel (Next.js)
**No Local Build**: Vercel handles all build operations

**Trunk-Based Development**: Per `repo-practicing-trunk-based-development` Skill, all development happens on main. Production branch is deployment-only (no direct commits).

## Safety Checks

**Pre-deployment Validation**:

- ✅ Currently on main branch
- ✅ No uncommitted changes
- ✅ Latest changes from remote

**Why Force Push**: Safe because prod-ayokoding-fs is deployment-only. We always want exact copy of main.

## Common Issues

### Issue 1: Not on Main Branch

```bash
# Error: Currently on feature-branch
# Solution: Switch to main first
git checkout main
```

### Issue 2: Uncommitted Changes

```bash
# Error: Modified files detected
# Solution: Commit or stash changes
git add -A && git commit -m "commit message"
# OR
git stash
```

### Issue 3: Behind Remote

```bash
# Warning: Local main behind origin/main
# Solution: Pull latest changes
git pull origin main
```

## When to Use This Agent

**Use when**:

- Deploying immediately outside the scheduled workflow window
- Want to trigger Vercel rebuild on-demand
- Need to rollback production (force push older commit)

**Do NOT use for**:

- Making changes to content (use maker agents)
- Validating content (use checker agents)
- Local development builds

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [Trunk Based Development](../../governance/development/workflow/trunk-based-development.md)

**Related Agents**:

- `apps-ayokoding-fs-general-checker` - Validates content before deployment

**Related Conventions**:

- [Trunk Based Development](../../governance/development/workflow/trunk-based-development.md)
