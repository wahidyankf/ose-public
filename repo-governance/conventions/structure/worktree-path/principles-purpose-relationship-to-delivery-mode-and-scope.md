---
description: The principles this convention implements, why it exists, how it relates to the Delivery Mode concept, and what it covers versus delegates elsewhere
when_to_use: Read this when you need the rationale for the worktree path convention, how it relates to Delivery Mode, or whether a worktree topic falls inside its scope.
---

# Worktree Path: Principles, Purpose, Relationship to Delivery Mode, and Scope

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Worktree paths are explicitly routed via hook rather than relying on defaults. The routing behaviour is documented and reproducible.

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: Worktrees the hook creates land in a predictable location (`worktrees/<name>/`) with consistent naming, ensuring reliable git operations and CI/CD integration; a repository with its own project hook keeps that hook's creation, so the global hook defers rather than racing it.

## Purpose

Standardize worktree creation so that `claude --worktree <name>` routes to `worktrees/<name>/` in the repository root (not the default `.claude/worktrees/`) in every repository without its own project hook. This keeps worktrees visible at the repo root level while gitignoring both the conventional and custom paths.

## Relationship to Delivery Mode

A worktree is a **work location**, not the full picture of how a plan reaches `origin/main`. That
broader question — where work happens, what it integrates into, and who holds merge authority — is
the [Delivery Mode](../plans/delivery-mode-the-four-modes.md#delivery-mode) defined in the Plans Organization Convention. A
worktree (this convention) is used by two of the four delivery modes — `worktree-to-pr` (the
default) and `worktree-to-origin-main` — while the other two (`main-to-origin-main`, `main-to-pr`)
operate directly in the primary checkout with no worktree at all. Consult
[Delivery Mode](../plans/delivery-mode-the-four-modes.md#delivery-mode) to resolve which mode a given plan uses before
provisioning a worktree per this convention.

## Scope

### What This Convention Covers

- **Worktree routing** — Override default `.claude/worktrees/` path to `worktrees/<name>/`
- **Hook mechanism** — `WorktreeCreate` hook implementation
- **Naming convention** — Hook file naming (kebab-case `.sh`)
- **Gitignore requirements** — Both worktree directories gitignored
- **Worktree creation pattern** — How new worktree rules should be added

### What This Convention Does NOT Cover

- **Git worktree low-level operations** — Internal git mechanics (handled by git documentation)
- **Hook development standards** — General hook development (see separate conventions)
- **Worktree naming for users** — User-facing worktree naming guidance (handled by user documentation)
