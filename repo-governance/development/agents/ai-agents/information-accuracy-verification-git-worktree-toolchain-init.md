---
description: "States the guarded-install and transactional-Doctor toolchain initialization required after creating a worktree."
when_to_use: Use when an agent has just created a git worktree and needs to converge the polyglot toolchain before running any gated task.
---

# Information Accuracy and Verification — Git Worktree Awareness: Toolchain Initialization Rule

1. **Initialize each worktree at its own root — two steps, in order** — After creating with
   `rtk git worktree add` (or another supported creation mechanism),
   immediately run `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` and then
   `rtk npm run doctor -- --fix` from its root. The guarded install creates its ignored
   `node_modules/` and runs `prepare`, activating Husky hooks; another checkout's install is not a
   substitute. The explicit Doctor call selects transactional admission and converges native
   toolchains because `postinstall` deliberately tolerates doctor drift. This applies to every new
   worktree, including docs-only work, because commit and pre-push hooks still execute repository
   tooling. Re-entering an existing worktree alone does not trigger setup. See
   [Worktree Toolchain Initialization](../../workflow/worktree-setup.md) for the full
   procedure and [Native-First Toolchain Management](../../workflow/native-first-toolchain.md).
