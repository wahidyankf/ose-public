---
description: Forbids destructive git operations that can discard a concurrent actor's uncommitted work on a shared machine, and prescribes the safe equivalent.
when_to_use: Use before any local git operation that could discard uncommitted work, rewrite history, or delete a branch/worktree.
---

# No Destructive Git Operations Convention

This convention governs **local** git operations that destroy data or rewrite shared state. Its
companion, the [Git Push Safety Convention](../workflow/git-push-safety.md), owns the **remote** side —
force-push and hook-bypass approval. Together they cover both directions; neither is sufficient alone.

## Contents

- [Authorized Task Branch Sync](no-destructive-git-operations/001-authorized-task-branch-sync.md) — the bounded ongoing owned-task exception, including reviewed settled conflicts.

- [The Same-Machine Assumption, Principles, and Conventions](./no-destructive-git-operations/the-same-machine-assumption-principles-and-conventions.md) — Why concurrency makes these operations dangerous, and what this convention implements.
- [Forbidden Operations](./no-destructive-git-operations/forbidden-operations.md) — The table of forbidden operations, what they destroy, and their safe equivalents.
- [Forbidden-Operations Caveats and Cross-Worktree Facts](./no-destructive-git-operations/forbidden-operations-caveats-and-cross-worktree-facts.md) — Two easy-to-misread-as-safe behaviours, and what git already isolates.
- [Whole-Tree Staging Is Forbidden](./no-destructive-git-operations/whole-tree-staging-is-forbidden.md) — Every forbidden staging spelling, and the explicit-paths procedure to use instead.
- [No Corner-Cutting and Preferring Additive Operations](./no-destructive-git-operations/no-corner-cutting-and-preferring-additive-operations.md) — Why weakening a gate is forbidden, and the additive/own-worktree habits that prevent most destruction.

## Related Documentation

- [Git Push Safety Convention](../workflow/git-push-safety.md) — the remote-side companion (force-push,
  hook bypass, per-instance approval)
- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) — worktree provisioning and setup
- [Bare-Repo Base-Worktree Landing Method](../workflow/bare-repo-landing-method.md) — the procedure whose
  safety guarantees this convention supplies, for landing changes into a repository with no primary
  checkout
- [Commit Message Convention](../workflow/commit-messages.md) — Conventional Commits format
- [File-Touch Discipline](../practice/file-touch-discipline.md) — the touched-file ledger that makes
  "stage only the paths you can account for" actionable, and that survives context compaction
- [Agent Workflow Orchestration Convention](../agents/agent-workflow-orchestration.md) — the N+1
  model and the same-machine assumption this convention protects
