---
description: "Forbids destructive git operations that can discard a concurrent actor's uncommitted work on a shared machine, and prescribes the safe equivalent."
when_to_use: "Read this index to find the right No Destructive Git Operations Convention child document."
---

# No Destructive Git Operations Convention

- [Authorized Task Branch Sync](001-authorized-task-branch-sync.md) — ongoing scoped authority with recovery and fresh gates.

- [The Same-Machine Assumption, Principles, and Conventions](./the-same-machine-assumption-principles-and-conventions.md) — Why this convention assumes concurrent actors share the same machine, and the principles and conventions it implements. Use when deciding whether a git operation is dangerous on a shared machine, or when tracing this convention back to what it implements.
- [Forbidden Operations](./forbidden-operations.md) — Local git operations requiring approval outside authorized task sync, what each one destroys, and the non-destructive equivalent. Use before running any git operation that could discard uncommitted work, rewrite history, or delete a branch or worktree.
- [Forbidden-Operations Caveats and Cross-Worktree Facts](./forbidden-operations-caveats-and-cross-worktree-facts.md) — Two forbidden-operation behaviours that are easy to misread as safe, and the git mechanics that already enforce isolation across worktrees. Use when tempted to treat bare --force-with-lease or --prune=now as safe, or when reasoning about what git already isolates between worktrees.
- [Whole-Tree Staging Is Forbidden](./whole-tree-staging-is-forbidden.md) — Why staging the entire working tree is forbidden on a shared machine, every forbidden spelling of it, and the explicit-paths procedure to use instead. Use before running git add or git commit -a, to confirm you are staging only paths you can account for.
- [No Corner-Cutting and Preferring Additive Operations](./no-corner-cutting-and-preferring-additive-operations.md) — Why weakening a failing gate is forbidden, what corner-cutting looks like, and the additive-and-own-worktree habits that prevent most destructive operations from ever arising. Use when a gate, test, lint, or CI job fails and there is pressure to make it pass quickly, or when choosing between a destructive and an additive git operation.
