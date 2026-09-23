---
description: Practice governing PR merges — merge authority comes from hardened preconditions, not a per-instance prompt; `[AI]` merges by default.
when_to_use: Use whenever a pull request is about to be merged, or when checking whether this protocol applies.
---

# PR Merge Protocol

Merging a pull request requires a set of hardened preconditions to hold — not a per-instance prompt. Once they hold, `[AI]` merges by default; a `[HUMAN]` merge gate applies only where a plan's own step says so explicitly. All quality gates must pass before merge, and bypassing them without explicit user permission is forbidden.

## Contents

- [Principles and Conventions Implemented](./pr-merge-protocol/principles-and-conventions-implemented.md) — Why this protocol exists and its companion conventions.
- [The Rule](./pr-merge-protocol/the-rule.md) — The five hardened preconditions that must all hold.
- [Quality Gates](./pr-merge-protocol/quality-gates.md) — Exact-head PR CI, applicable surface gates, the secret check, and the no-bypass rule.
- [When This Applies and Scope](./pr-merge-protocol/when-this-applies-and-scope.md) — Which delivery modes and PR types this protocol governs, and which agents it binds.
- [The `worktree-to-pr` Terminal Step](./pr-merge-protocol/the-worktree-to-pr-terminal-step.md) — The CI-, surface-, and archival-based done-definition before merge.
- [Draft PR Lifecycle](./pr-merge-protocol/draft-pr-lifecycle.md) — Why every PR opens as a draft, and the four-step lifecycle to merge.
- [Before Merging](./pr-merge-protocol/before-merging.md) — The full (a)-(e) checklist immediately before merge.
- [Resolving Merge Conflicts in Generated Files](./pr-merge-protocol/resolving-merge-conflicts-in-generated-files.md) — Resolve at the generator's source, never hand-resolve the artifact.
- [Precondition Summary and When Gates Fail](./pr-merge-protocol/precondition-summary-and-when-gates-fail.md) — The status summary format, and the fix-then-re-evaluate procedure.
- [Examples](./pr-merge-protocol/examples.md) — Worked pass/fail examples of this protocol.

## Related Documentation

- [Git Push Safety Convention](../workflow/git-push-safety.md) -- Per-instance approval for destructive git operations; gated by a prompt because their safety is not mechanically checkable, unlike a PR merge's
- [Plans Organization Convention §Delivery Mode](../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) -- Establishes `[AI]` merge as the default and `[HUMAN]` as the explicit per-plan opt-in this protocol implements
- [Code Quality Convention](../quality/code.md) -- Quality gates enforced by git hooks
- [Trunk Based Development Convention](../workflow/trunk-based-development.md) -- The `worktree-to-pr` default delivery mode and how it relates to TBD
- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) -- Mandatory guarded install plus read-only Doctor validation after creating a worktree
- [Nx Target Standards](../infra/nx-targets.md) -- Canonical target names for quality gates
- [Git Push Default Convention](../workflow/git-push-default.md) -- Governs the default `worktree-to-pr` push target and the explicit direct-push modes; this convention governs what happens once a PR exists
- [`pr-review`](../../workflows/pr/pr-review.md) and [`pr-review-cycle`](../../workflows/pr/pr-review-cycle.md) -- Optional semantic-review workflows, invoked only on explicit user request
