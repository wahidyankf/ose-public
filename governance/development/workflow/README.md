# Workflow Development

Development workflow standards covering implementation methodology, git workflows, commit messages, and reproducible environments.

## Purpose

These standards define **HOW to execute development workflows**, covering the three-stage implementation workflow (make it work, make it right, make it fast), Trunk Based Development for git, Conventional Commits for messages, and reproducible environment practices.

## Scope

**✅ Belongs Here:**

- Development workflow methodologies
- Git workflow standards (TBD, commits)
- Implementation progression (work → right → fast)
- Environment reproducibility practices
- Development process standards

**❌ Does NOT Belong:**

- Why we automate workflows (that's a principle)
- Multi-agent orchestration (that's workflows/)
- Code quality tools (that's quality/)

## Documents

- [Commit Message Convention](./commit-messages.md) - Understanding Conventional Commits, commit granularity, and why we use them
- [Implementation Workflow Convention](./implementation.md) - Three-stage development workflow: make it work, make it right, make it fast. Includes surgical changes (touch only what you must) and goal-driven execution (define success criteria, loop until verified)
- [Reproducible Environments Convention](./reproducible-environments.md) - Practices for creating consistent, reproducible development and build environments
- [Trunk Based Development Convention](./trunk-based-development.md) - Git workflow using Trunk Based Development for continuous integration
- [Worktree Setup](./worktree-setup.md) - Practice for running npm install in the root repository worktree after creating a new git worktree. Ensures Nx workspace and all tools remain functional across worktrees
- [Git Push Safety Convention](./git-push-safety.md) - Requires explicit per-instance user approval before any AI agent or automation executes `git push --force`, `--force-with-lease`, or `--no-verify`; prior approval does not carry forward

## Companion Documents

- [Anti-Patterns](./anti-patterns.md) - Common workflow mistakes to avoid (with examples and corrections)
- [Best Practices](./best-practices.md) - Recommended workflow patterns and techniques

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Simplicity Over Complexity Principle](../../principles/general/simplicity-over-complexity.md) - Why we start simple
- [Reproducibility First Principle](../../principles/software-engineering/reproducibility.md) - Why environments matter
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Trunk Based Development and Implementation Workflow start simple, avoiding over-engineering with complex branching or premature optimization.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Reproducible environments convention ensures consistent development and build environments across machines and team members.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Runtime versions pinned explicitly (Volta), required setup steps codified as deliberate actions rather than assumed side effects.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Automated CI triggers on every commit, automated environment setup through version managers, and codified worktree procedures replace manual, error-prone steps.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Commit Message Convention](./commit-messages.md)**: Conventional Commits format provides explicit commit metadata for automated changelog generation and version control.

- **[Nested Code Fences Convention](../../conventions/formatting/nested-code-fences.md)**: Workflow documentation uses proper code fence nesting when documenting markdown structure and patterns.

---

**Last Updated**: 2026-03-28
