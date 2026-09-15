---
description: The sequence after all commits are pushed under worktree-to-pr - current-head CI, surface gates, archival, and readiness.
when_to_use: Use when a worktree-to-pr plan branch has all its commits pushed and the AI needs to know what "done" requires before the merge.
---

# The `worktree-to-pr` Terminal Step

Under the repo-wide `worktree-to-pr` default (see the
[Plans Organization Convention — Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) and
the [Trunk Based Development Convention](../trunk-based-development/default-delivery-mode-worktree-to-pr.md#default-delivery-mode-worktree-to-pr)),
the AI's work on a plan branch does not end at "all commits pushed." The terminal step, run by `[AI]`,
is:

1. Confirm the **done-definition** is met:
   - The `Quality gate` check is green for the exact current PR head and base.
   - One authenticated `ose-pr-leak-review:v1` record passes for that exact head.
   - Every review conversation is resolved or explicitly dismissed by the user.
   - Every applicable finite surface gate passed, with an explicit exemption when no reachable
     surface exists.
   - Archival-in-PR is committed (ose-public only -- the plan folder's archival move lands in the same
     PR, since the plan folder lives solely in this repo).
2. If the user explicitly requested [`pr-review`](../../../workflows/pr/pr-review.md) or
   [`pr-review-cycle`](../../../workflows/pr/pr-review-cycle.md), complete that bounded request and
   resolve any conversations it created. Its absence is valid.
3. Flip the PR from draft to ready for review (`gh pr ready`).

**This done-definition is the AI's done-boundary.** Meeting it means the AI's work on the plan is
complete -- it does **not** by itself mean the plan is merged. The merge is a separate, subsequent
action gated on the five preconditions in [The Rule](./the-rule.md#the-rule) above and performed by `[AI]`.
"Done" is not "merged" -- the merge sits outside the done-boundary entirely.

## After the merge: two failures that mean something other than what they say

**`git merge --ff-only origin/main` in the worktree fails.** A squash merge produces a commit with
no ancestry shared with the branch it squashed, so a fast-forward is not refused — it is undefined.
Prove the branch carries nothing the merge dropped (`git diff HEAD origin/main` is empty), then
`git checkout -B <branch> origin/main`. Uncommitted edits survive `checkout -B`; check that they did
rather than assuming it, and never reach for `reset --hard`.

**`--force-with-lease` reports stale info.** After a merge this is usually not a lease conflict.
`ose-public` sets `delete_branch_on_merge: true`, which overrides `gh pr merge --delete-branch=false`,
so GitHub deletes the remote branch at merge and there is no ref left for the lease to compare
against — `git ls-remote` returns empty. `git fetch origin --prune` followed by a plain `git push -u`
is the whole fix; no force of any kind is needed. The private sibling sets `delete_branch_on_merge: false`,
so its branches survive the merge and must be deleted explicitly during cleanup.
