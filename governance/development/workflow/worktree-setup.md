---
title: Worktree Setup
description: Practice for running npm install in the root repository worktree after creating a new git worktree
category: explanation
subcategory: development
tags:
  - development
  - git
  - worktree
  - npm
  - nx
  - dependencies
created: 2026-03-28
updated: 2026-03-28
---

# Worktree Setup

After creating a new git worktree in this repository, always run `npm install` in the **root repository worktree**. This ensures the Nx workspace and all its tools remain functional in the active worktree.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Every worktree operates with a consistent, verified dependency state. Running `npm install` eliminates divergence between the root worktree's `node_modules/` and the current `package-lock.json`, making builds deterministic regardless of which worktree is active.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The setup step is an explicit, required action rather than an assumed side effect of worktree creation. Developers and agents must perform this step deliberately.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Codifying this rule enables automated agents and tooling to apply it consistently, reducing the chance of cryptic build failures caused by missing or stale dependencies.

## Conventions Implemented/Respected

This practice does not directly implement Layer 2 documentation conventions. The operational context for this practice is governed by development practices referenced in the Related Documentation section.

## The Rule

**After every `git worktree add` or `EnterWorktree` invocation, run `npm install` in the root repository worktree.**

```bash
# Run this in the ROOT repository worktree path, not the new worktree
cd /path/to/root/open-sharia-enterprise
npm install
```

The root worktree is the primary checkout of the repository — the directory that contains the canonical `node_modules/` used by Nx across all worktrees. Replace `/path/to/root/open-sharia-enterprise` with the actual absolute path to the root checkout on the current machine.

## Why This Is Necessary

### Dependency Isolation in Git Worktrees

Git worktrees share the `.git` directory but each worktree has its own working tree — its own copies of tracked files. `node_modules/` is not tracked by git, so it is not automatically synchronized between worktrees.

When the Nx workspace resolves dependencies, it reads from `node_modules/` relative to the workspace root. If `package-lock.json` was updated in a worktree that is not the root, the root `node_modules/` becomes stale. Nx commands in any worktree then operate against dependency versions that do not match the lockfile.

### What Goes Wrong Without This Step

Without running `npm install` after worktree creation, these failures can occur:

- **Build failures**: A dependency that a new worktree's code requires may be absent or at the wrong version.
- **Test failures**: Test runners (Vitest, Jest, Playwright) may resolve the wrong module versions.
- **Lint failures**: ESLint plugins and Prettier may behave differently when versions mismatch.
- **Nx cache invalidation**: Nx computes cache keys based on inputs including resolved module versions. A stale `node_modules/` causes cache misses or, worse, incorrect cache hits.
- **Cryptic errors**: Dependency mismatches often surface as obscure runtime errors rather than clear "missing module" messages, making them harder to diagnose.

### Nx Workspace Dependency on node_modules State

Nx task caching, project graph resolution, and executor plugins all depend on a consistent `node_modules/` state in the workspace root. When `node_modules/` diverges from `package-lock.json`, the entire workspace behaves unpredictably — not just the files that changed.

## When This Applies

Run `npm install` in the root worktree after:

1. Running `git worktree add` to create a new worktree
2. Using the `EnterWorktree` tool in Claude Code, which creates a worktree automatically
3. Any other mechanism that creates a new git worktree in this repository

This step applies to both human developers and AI agents operating in this repository.

## Step-by-Step Procedure

1. Create the worktree using your preferred method:

   ```bash
   git worktree add .claude/worktrees/my-feature-branch my-feature-branch
   ```

2. Identify the root repository worktree path. This is the directory containing the canonical checkout — typically the parent of `.claude/worktrees/`.

3. Run `npm install` in the root worktree:

   ```bash
   cd /path/to/root/open-sharia-enterprise
   npm install
   ```

4. Confirm the install completed without errors before running any Nx commands in the new worktree.

## Notes for AI Agents

Agents that create worktrees via `git worktree add` or `EnterWorktree` must run `npm install` in the root repository worktree as an immediate follow-up step. The root worktree path is available from the environment context or can be confirmed with `git worktree list`. See the [Git Worktree Awareness](../agents/ai-agents.md#git-worktree-awareness) section of the AI Agents Convention for the full set of rules governing agent behavior in worktrees.

## Related Documentation

- [Reproducible Environments](./reproducible-environments.md) - Practices for consistent development environments, including Volta pinning and lockfile management
- [AI Agents Convention](../agents/ai-agents.md) - Git Worktree Awareness rules for agents operating across worktrees
- [Trunk Based Development](./trunk-based-development.md) - Branch and worktree workflow for this repository
- [Nx Targets](../infra/nx-targets.md) - Canonical Nx target names and caching rules that depend on a consistent dependency state
