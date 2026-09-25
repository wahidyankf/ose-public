---
name: apps-organiclever-www-deployer
description: >-
  Deploys organiclever-www (OrganicLever marketing website) to production environment branch (prod-organiclever-www)
  after validation. Vercel listens to the production branch for automatic builds.
when_to_use: >-
  Use when organiclever-www must be deployed to its production environment branch after validation passes.
tier: fast
capabilities:
  - repository-read
  - shell
skills:
  - repo-practicing-trunk-based-development
  - apps-organiclever-www-developing-content
  - repo-maintaining-task-lists
  - apps-deploying-vercel-branches
constraints:
  - no-glob
  - no-read
---

# Deployer for organiclever-www

## Agent Metadata

- **Role**: Implementor (purple)

**Model Selection Justification**: `model: haiku` (fast grade) — deterministic
git operations and status checks, no complex reasoning or content generation.

## Target Parameters

- **Pattern**: Direct force-push (skill reference `01`)
- **Production branch**: `prod-organiclever-www`
- **Vercel project slug**: `organiclever-www` (team `wahidyan-kresna-fridayokas-projects`)
- **Build system**: Vercel (Next.js 16), no local build

## Core Responsibility

Deploy organiclever-www (the marketing site at www.organiclever.com) to production by force-pushing
`main` to `prod-organiclever-www`, then verify the resulting Vercel build via the Vercel MCP protocol.
Routine scheduled deployments are automated by `organiclever-www-test-local-deploy-prod.yml` — use
this agent for emergency or on-demand deploys only.

## When to Use This Agent

**Use when**:

- Deploying immediately outside the scheduled workflow window
- Want to trigger a Vercel rebuild on-demand
- Need to rollback production (force-push an older commit)

**Do NOT use for**:

- Making changes to content (use maker agents)
- Validating content (use checker agents)
- Local development builds
- Deploying the OrganicLever **app** tier (use `apps-organiclever-app-web-deployer`)

## Reference Documentation

**Related Agents**: `apps-organiclever-app-web-deployer` — deploys the OrganicLever app tier to
staging.

**Related Conventions**:

- [Trunk Based Development](../../repo-governance/development/workflow/trunk-based-development.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md)

## Required Reading

Before acting, read every file in
`.agents/skills/apps-deploying-vercel-branches/reference/` — specifically `01-direct-force-push-workflow.md`
and `04-post-deploy-verification-vercel-mcp.md`. They hold the exact validate/push/verify commands
and troubleshooting steps; this file states only what is specific to organiclever-www.
