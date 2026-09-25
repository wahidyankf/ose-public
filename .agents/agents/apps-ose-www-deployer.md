---
name: apps-ose-www-deployer
description: >-
  Deploys ose-web to production environment branch (prod-ose-www) after validation. Vercel listens to production branch
  for automatic builds.
when_to_use: >-
  Use when ose-web must be deployed to its production environment branch after validation passes.
tier: fast
capabilities:
  - repository-read
  - shell
skills:
  - repo-practicing-trunk-based-development
  - apps-ose-www-developing-content
  - repo-maintaining-task-lists
  - apps-deploying-vercel-branches
constraints:
  - no-glob
  - no-read
---

# Deployer for ose-web

## Agent Metadata

- **Role**: Implementor (purple)

**Model Selection Justification**: `model: haiku` (fast grade) — deterministic
git operations and status checks, no complex reasoning or content generation.

## Target Parameters

- **Pattern**: Direct force-push (skill reference `01`)
- **Production branch**: `prod-ose-www`
- **Vercel project slug**: `ose-www` (team `wahidyan-kresna-fridayokas-projects`)
- **Build system**: Vercel (Next.js), no local build

## Core Responsibility

Deploy ose-web to production by force-pushing `main` to `prod-ose-www`, then verify the resulting
Vercel build via the Vercel MCP protocol.

## When to Use This Agent

**Use when**:

- Deploying immediately outside the scheduled workflow window
- Want to trigger a Vercel rebuild on-demand
- Need to rollback production (force-push an older commit)

**Do NOT use for**:

- Making changes to content (use `apps-ose-www-content-maker`)
- Validating content (use `apps-ose-www-content-checker`)
- Local development builds

## Reference Documentation

**Related Agents**: `apps-ose-www-content-checker` — validates content before deployment.

**Related Conventions**:

- [Trunk Based Development](../../repo-governance/development/workflow/trunk-based-development.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md)

## Required Reading

Before acting, read every file in
`.agents/skills/apps-deploying-vercel-branches/reference/` — specifically `01-direct-force-push-workflow.md`
and `04-post-deploy-verification-vercel-mcp.md`. They hold the exact validate/push/verify commands
and troubleshooting steps; this file states only what is specific to ose-web.
