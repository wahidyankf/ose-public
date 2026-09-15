---
name: repo-practicing-trunk-based-development
description: "Trunk Based Development workflow - all development on main branch with small frequent commits, minimal branching, and continuous integration. Covers when branches are justified (exceptional cases only), commit patterns, feature flag usage for incomplete work, environment branch rules (deployment only), and AI agent default behaviour (the repo-wide default delivery mode is `worktree-to-pr` -- a short-lived plan branch in a disposable worktree pushed to a draft PR; direct push to main has no executable path in ose-public, main is branch-protected including for admins, and only the private sibling retains `main-to-origin-main` in exactly two categories: stateful IaC needing the primary checkout's real secrets/local state, or CI-IaC changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular). Essential for understanding repository git workflow and keeping branches short-lived"
---

# Trunk Based Development Skill

## Purpose

This Skill provides comprehensive guidance on **Trunk Based Development (TBD)** - the git workflow used throughout this repository: small, frequent commits integrated continuously into `main` through short-lived, single-purpose branches. The default delivery mode is `worktree-to-pr`; direct commit to `main` has no executable path in `ose-public` (branch-protected), and only the private sibling retains `main-to-origin-main` for stateful IaC needing the primary checkout's real secrets/local state or CI-IaC changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular.

**When to use this Skill:**

- Planning git workflow, deciding whether to create a branch
- Managing incomplete work via feature flags
- Navigating environment branches (deployment only)
- Creating plans with git workflow specs; implementing AI agent default behaviours

PRs follow natural cohesive seams, never numeric LOC or file-count boundaries. Keep every artifact
needed for internal consistency together, merge only an immediately production-deployable resulting
`main` state, and integrate each ready unit promptly. Incomplete behaviour must be
complete-and-inert behind a temporary production-disabled flag, with both paths tested and rollout,
rollback, and removal recorded.

## Core Concepts

See [Core Concepts](./reference/core-concepts.md) for what TBD requires (convergence on `main`, short-lived branches, feature flags) and why.

## Delivery Modes: How Work Reaches `main`

See [Delivery Modes: Default Behaviour](./reference/delivery-modes-default-behaviour.md) for the standard `worktree-to-pr` workflow, and [Delivery Modes: Direct Push](./reference/delivery-modes-direct-push.md) for the surviving the private sibling exception.

## Keeping Branches Short-Lived

See [Keeping Branches Short-Lived](./reference/keeping-branches-short-lived.md) for what TBD actually forbids, the four legitimate longer-lived categories, and reasons that do NOT justify a branch outliving its plan.

## Feature Flags for Incomplete Work

See [Feature Flags](./reference/feature-flags.md) for the basic pattern, the four-phase lifecycle, and DO/DON'T guidance.

## Environment Branches and AI Agent Default Behaviour

See [Environment Branches and AI Agent Behaviour](./reference/environment-branches-and-ai-agent-behaviour.md) for deployment-branch rules and how AI agents resolve/declare the Delivery Mode in plans.

## Common Patterns

See [Common Patterns](./reference/common-patterns.md) for three worked scenarios: multi-day feature development, experimental work, and external contribution.

## Commit Patterns in TBD

See [Commit Patterns](./reference/commit-patterns.md) for small/frequent commit targets, atomic commit rules, and this repo's Conventional Commits format.

## Common Mistakes and Best Practices

See [Common Mistakes and Best Practices](./reference/common-mistakes-and-best-practices.md) for recurring mistakes, the pre-push TBD checklist, and when-in-doubt questions.

## PR Is the Default; Direct Push Is an Explicit Selection

See [PR Default and Direct Push](./reference/pr-default-and-direct-push.md) for the three-tier mode-resolution precedence and what the default means for plans and AI agents.

## References

**Primary Convention**: [Trunk Based Development Convention](../../../repo-governance/development/workflow/trunk-based-development.md)

**Related Conventions**:

- [Git Push Default Convention](../../../repo-governance/development/workflow/git-push-default.md) - PR-branch default, direct-push as explicit selection
- [Commit Message Convention](../../../repo-governance/development/workflow/commit-messages.md) - Conventional Commits format
- [Implementation Workflow](../../../repo-governance/development/workflow/implementation.md) - Development workflow stages
- [Plans Organization](../../../repo-governance/conventions/structure/plans.md) - Git workflow in plans

**Related Skills**:

- `plan-writing-gherkin-criteria` - Testable acceptance criteria for TBD workflow
- `repo-understanding-repository-architecture` - Repository structure and principles

---

For comprehensive details, consult the primary convention document.
