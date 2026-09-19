---
description: "Development workflow conventions governing how contributors and agents execute work — TDD, commits, branching, environment reproducibility, grilling, and CI."
when_to_use: Use when looking for the standard covering a step of development work — implementation, git, commits, environment setup, CI, or grilling a design decision.
---

# Workflow Development

Use these standards to move a change from a fresh checkout to a safe delivery: implementation,
Git, verification, and reproducible environments.

## Documents

- [Anti-Patterns in Workflow Development](./anti-patterns.md) — Common workflow anti-patterns and their corrected pattern. Use when reviewing a workflow decision for a known anti-pattern.
- [Bare-Repo Base-Worktree Landing Method](./bare-repo-landing-method.md) — Base-worktree procedure for landing changes with no primary checkout. Use when landing from a bare repo or a side worktree.
- [Best Practices for Workflow Development](./best-practices.md) — Twelve recommended workflow patterns for branching, commits, and CI. Use when seeking the recommended pattern for a workflow decision.
- [CI Monitoring Convention](./ci-monitoring.md) — Standards for monitoring CI runs without exhausting the GitHub API rate limit. Use when polling a CI run to completion.
- [CI Post-Push Verification Convention](./ci-post-push-verification.md) — Trigger and verify related CI workflows after pushing app or lib code. Use immediately after pushing app or lib code.
- [Commit Message Convention](./commit-messages.md) — Conventional Commits format and why we use it. Use when writing or troubleshooting a commit message.
- [Cross-Repository Parity Identity](./cross-repository-parity-identity.md) — Aligns worktree basenames and corresponding short-lived branch names across repositories for one parity objective. Use before mutating a multi-repo parity set.
- [Dependency Bump Stability & Safety Policy](./dependency-bump-policy.md) — Three-path decision tree governing every dependency bump. Use when bumping a dependency, runtime, or base image.
- [Git Hook Lifecycle](./git-hook-lifecycle.md) — Registry-backed lifecycle for the three Husky hook shims. Use when a Husky hook fails or needs changing.
- [Git Identity From Global Config Convention](./git-identity-from-global-config.md) — Prohibits per-repo [user] overrides; identity comes from global git config. Use when auditing or setting git author identity.
- [Git Push Default Convention](./git-push-default.md) — Default push target is worktree-to-pr; direct push is restricted per-repo. Use before pushing, or to override the default delivery mode.
- [Git Push Safety Convention](./git-push-safety.md) — Requires explicit approval before any force-push or --no-verify. Use before running a force-push or --no-verify.
- [Grilling-With-Options Convention](./grilling-with-options.md) — Agents must resolve design decisions via structured multiple-choice questions. Use when resolving an open design decision with the user.
- [Implementation Workflow](./implementation.md) — Three-stage workflow: make it work, right, then fast. Use when planning or reviewing any code change.
- [Integration Diff Review Convention](./integration-diff-review.md) — Read the full incoming diff after a rebase/merge before continuing work. Use immediately after a rebase, pull, merge, or cherry-pick.
- [Native-First Toolchain Management](./native-first-toolchain.md) — Use native package managers and ./rhino toolchain validate, not Terraform/Docker. Use when deciding how to install or verify a toolchain.
- [No Destructive Git Operations Convention](./no-destructive-git-operations.md) — Forbids local destructive git operations; prescribes the safe equivalent. Use before any git operation that could discard uncommitted work.
- [PR Merge Protocol](./pr-merge-protocol.md) — Merge authority granted by hardened preconditions, not a prompt. Use whenever a pull request is about to be merged.
- [Reproducible Environments](./reproducible-environments.md) — Practices for consistent, reproducible development and build environments. Use when setting up or troubleshooting toolchain pinning.
- [Test-Driven Development Convention](./test-driven-development.md) — Mandates TDD (Red→Green→Refactor) for all code changes. Use when writing or starting a code delivery step.
- [Trunk Based Development Convention](./trunk-based-development.md) — Git workflow using Trunk Based Development for continuous integration. Use when deciding how a change reaches main.
- [Worktree and Artifact Cleanup Convention](./worktree-and-artifact-cleanup.md) — Mandatory post-merge gate to remove worktrees, branches, and build artifacts. Use when a merged PR needs teardown.
- [Worktree Toolchain Initialization](./worktree-setup.md) — Initialize the full polyglot toolchain immediately after creating a git worktree.

## Related Documentation

- [Development Index](../README.md) — All development practices.
- [Simplicity Over Complexity Principle](../../principles/general/simplicity-over-complexity.md) — Why we start simple.
- [Reproducibility First Principle](../../principles/software-engineering/reproducibility.md) — Why environments matter.
- [Repository Architecture](../../repository-governance-architecture.md) — Six-layer governance model.
