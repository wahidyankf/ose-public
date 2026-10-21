---
description: "Defines authoritative state reconciliation and resume behaviour for the backlog-to-in-progress pure move that lands on origin/main as its own promotion PR or commit before Phase 0."
when_to_use: "Use before mutating a plan's lifecycle path, or when resuming an interrupted pure move."
---

# Starting Work — Promotion Recovery

The pure move from `backlog/` to `in-progress/` is the sole commit of its own short-lived promotion branch,
delivered to `origin/main` before Phase 0. Before any mutation of that branch or its lifecycle path, fetch
`origin` and reconcile the plan path, the promotion branch, and any matching pull request against remote
truth. Classify exactly one state:

1. **Unstarted** — `origin/main` contains only the backlog path, and no matching remote promotion branch or
   pull request exists. Make the pure move as the promotion branch's sole commit and open its promotion-only
   pull request (or push the direct commit); do not start Phase 0 or provision the plan's worktree yet.
2. **Branch pushed** — one matching remote promotion branch exists whose sole commit is the expected pure move,
   with no pull request. Verify its base and diff, then open the pull request; do not recreate the branch.
3. **Pull request open** — one matching open promotion-only pull request contains the expected pure move as its
   sole commit. Resume its review, CI, and merge path; do not open another pull request.
4. **Merged and verified** — `origin/main` contains only the in-progress path, and the matching merged promotion
   pull request or permitted direct-push commit is reachable from `origin/main`. Skip the mutation. For
   `worktree-to-pr`, fetch and provision the plan's one worktree from that fresh `origin/main` (or re-enter it
   if already provisioned after the merge), then begin Phase 0. A permitted main mode remains in its explicit
   `N/A` primary checkout.
5. **Anomalous** — both lifecycle paths exist, neither exists, remote artifacts disagree with the
   expected pure diff or base, the promotion commit holds a hunk outside the step 3 set (a ride-along),
   duplicate branches or pull requests match, or a reported merge is
   not reachable from `origin/main`. Stop and request reconciliation; never guess or replay.

The promotion branch is not the plan's worktree. For `worktree-to-pr`, the plan's worktree is provisioned only
in the merged-and-verified state, from the fresh `origin/main` that already holds the move; before that state
there is no plan worktree to re-enter, and the promotion pull request is resumed from its branch alone. Once
provisioned, resolve the declared repository-relative route against the selected repository root and reuse it
only when `git worktree` registers the resulting runtime path on the verified matching branch, its upstream
matches the verified remote branch where one exists, no duplicate checkout claims the branch, and the worktree
is clean and conflict-free. A missing recorded path after provisioning, mismatched path, branch, upstream,
dirty tree, conflict, or duplicate checkout is anomalous and stops recovery; preserve the evidence and escalate
for exact recovery or reattachment without another add. The plan's worktree is not discarded or replaced.

For `main-to-pr`, sync and remain in the primary checkout; never create or enter a worktree.
Direct-push modes likewise use their declared work location. After every push, pull-request open,
merge, or direct push, fetch and classify again before continuing.

This reconciliation precedes the move itself on both first entry and resume. Local branch state,
conversation history, and a missing backlog path are not evidence that the remote transition is
complete.
