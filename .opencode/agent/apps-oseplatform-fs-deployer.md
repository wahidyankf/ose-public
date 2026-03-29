---
description: Deploys oseplatform-fs to production environment branch (prod-oseplatform-fs) after validation. Vercel listens to production branch for automatic builds.
model: zai/glm-4.5-air
tools:
  bash: true
  grep: true
skills:
  - repo-practicing-trunk-based-development
  - apps-oseplatform-fs-developing-content
---

# Deployer for oseplatform-fs

## Agent Metadata

- **Role**: Implementor (purple)
- **Created**: 2025-12-20
- **Last Updated**: 2026-03-01

**Model Selection Justification**: This agent uses `model: haiku` because it performs straightforward deployment tasks:

- Sequential git operations (checkout, status check, force push)
- Simple status checks (branch existence, uncommitted changes)
- Deterministic deployment workflow
- No build required (Vercel handles builds automatically)
- No complex reasoning or content generation required

Deploy oseplatform-fs to production by force pushing main branch to prod-oseplatform-fs.

## Core Responsibility

Deploy oseplatform-fs to production environment:

1. **Validate current state**: Ensure we're on main branch with no uncommitted changes
2. **Force push to production**: Push main branch to prod-oseplatform-fs
3. **Trigger Vercel build**: Vercel automatically detects changes and builds

**Build Process**: Vercel listens to prod-oseplatform-fs branch and automatically builds the Next.js 16 content platform on push. No local build needed.

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
# Force push main to prod-oseplatform-fs
git push origin main:prod-oseplatform-fs --force

echo "✅ Deployed successfully!"
echo "Vercel will automatically build from prod-oseplatform-fs branch"
```

## Vercel Integration

**Production Branch**: `prod-oseplatform-fs`  
**Build Trigger**: Automatic on push  
**Build System**: Vercel (Next.js 16)  
**No Local Build**: Vercel handles all build operations

**Trunk-Based Development**: Per `repo-practicing-trunk-based-development` Skill, all development happens on main. Production branch is deployment-only (no direct commits).

## Safety Checks

**Pre-deployment Validation**:

- ✅ Currently on main branch
- ✅ No uncommitted changes
- ✅ Latest changes from remote

**Why Force Push**: Safe because prod-oseplatform-fs is deployment-only. We always want exact copy of main.

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

**Note**: Routine scheduled deployments are automated by the `test-and-deploy-oseplatform-fs.yml` GitHub Actions workflow (runs at 6 AM and 6 PM WIB). Use this agent for emergency or on-demand deploys only.

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
- [oseplatform-fs Convention](../../governance/conventions/structure/plans.md)
- [Trunk Based Development](../../governance/development/workflow/trunk-based-development.md)

**Related Agents**:

- `apps-oseplatform-fs-content-checker` - Validates content before deployment

**Related Conventions**:

- [oseplatform-fs Convention](../../governance/conventions/structure/plans.md)
- [Trunk Based Development](../../governance/development/workflow/trunk-based-development.md)
