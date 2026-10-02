---
description: Defines the mandatory pull-latest-origin/main freshness gate that must pass before any implementation work begins.
when_to_use: Use when syncing a work branch or worktree with origin/main before starting implementation.
---

# Enter the Designated Worktree — Freshness Gate

**Continues** [Enter the Designated Worktree — Locate and Provision](./016-enter-worktree-locate-and-provision.md).

1. **Freshness gate — pull latest `origin/main` into the work branch FIRST, by default (MANDATORY)**: before ANY implementation work, bring the work branch up to date by pulling the newest `origin/main`. Pulling latest trunk first is the default — it minimizes merge collisions at push time:
   1. `git fetch origin` (from inside the work branch).
   2. If the work branch has uncommitted changes (`git status --porcelain` non-empty): do NOT auto-stash or discard. Surface the dirty state to the user and STOP until they decide (commit, stash, or discard explicitly).
   3. If the work branch has no local commits ahead of `origin/main`: `git merge --ff-only origin/main`.
   4. If the work branch has local commits not yet on `origin/main` (a resumed plan): `git rebase origin/main`. On conflict: `git rebase --abort`, surface the conflicting files to the user, and STOP — never auto-resolve.
   5. Verify sync: `git merge-base --is-ancestor origin/main HEAD` must succeed.
   6. If steps 3 or 4 introduced commits absent from the pre-sync branch, complete the
      [Integration Diff Review checkpoint](../../../development/workflow/integration-diff-review.md):
      read the full incoming diff and reconcile the current task, whole plan, assumptions,
      file-touch ledger, and verification before proceeding.
2. **Confirm gate passed**: emit `Worktree gate: passed (worktrees/<plan-identifier>/ @ <short-sha>, up to date with origin/main)` and proceed to Step 1. All subsequent steps run with the worktree as the execution root.
