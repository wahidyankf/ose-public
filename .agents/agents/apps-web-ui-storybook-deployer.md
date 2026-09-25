---
name: apps-web-ui-storybook-deployer
description: >-
  Deploys web-ui Storybook to Vercel via force-push to prod-web-ui
when_to_use: >-
  Use when the web-ui Storybook must be published to Vercel through its production branch.
tier: fast
capabilities:
  - repository-read
  - shell
skills:
  - repo-practicing-trunk-based-development
  - repo-maintaining-task-lists
  - apps-deploying-vercel-branches
constraints:
  - no-glob
  - no-read
---

# Deployer for web-ui Storybook

## Agent Metadata

- **Role**: Implementor (blue)

**Model Selection Justification**: `model: haiku` — deterministic git operations and status checks,
no complex reasoning required.

## Target Parameters

- **Pattern**: Direct force-push (skill reference `01`)
- **Production branch**: `prod-web-ui`
- **Vercel project slug**: `web-ui` (team `wahidyan-kresna-fridayokas-projects`)
- **Build command**: `npx nx run web-ui:build-storybook`
- **Output directory**: `libs/web-ui/storybook-static`

## Core Responsibility

Deploy the shared Storybook to production by force-pushing `main` to `prod-web-ui`, then verify the
resulting Vercel build via the Vercel MCP protocol. Vercel reads `prod-web-ui`, runs the build
command above, and serves the output directory — no local build is needed before deploying.

## When to Use This Agent

**Use when**:

- Triggering an on-demand Storybook deploy outside the scheduled CI window
- Rolling back to an older Storybook build via force-push of an older commit

**Do NOT use for**:

- Creating or modifying components (use maker agents)
- Validating components (use checker agents)
- Local Storybook development (`nx run web-ui:storybook`)

## Reference Documentation

- [Trunk Based Development](../../repo-governance/development/workflow/trunk-based-development.md)
- [GitHub Actions Workflow Naming](../../repo-governance/development/infra/github-actions-workflow-naming.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md)

## Required Reading

Before acting, read every file in
`.agents/skills/apps-deploying-vercel-branches/reference/` — specifically `01-direct-force-push-workflow.md`
and `04-post-deploy-verification-vercel-mcp.md`. They hold the exact validate/push/verify commands
and troubleshooting steps; this file states only what is specific to web-ui Storybook.
