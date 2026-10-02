---
description: Defines exact-current-head/base PR CI and optional-review handling before merge.
when_to_use: Use when a *-to-pr plan approaches archival and must establish current PR evidence.
---

# Finalization and Archival — Exact-Head PR CI Gate

For `worktree-to-pr` and `main-to-pr`, finalization requires the `Quality gate` check from
`.github/workflows/pr-quality-gate.yml` to be green for the PR's exact current head SHA and current
base. Query the head, base, and check result together; an earlier head, different base, pending run,
or missing run does not count. Fix and push failures, then wait for the replacement run.

- Run one focused [`pr-leak-review`](../../quality/pr-leak-review.md) against that exact head. Require an
  authenticated `ose-pr-leak-review:v1` `pass`; missing, stale, failed, or findings-bearing evidence
  blocks finalization. Fixes that move the head require one replacement pass, never a clean streak.
- Semantic review is absent by default. Run [`pr-review`](../../quality/pr-review.md) or
  [`pr-review-quality-gate`](../../quality/pr-review-quality-gate.md) only when the user explicitly requested that
  named workflow for this PR. Do not infer it from `plans/**`, executable content, risk, or delivery
  mode. Resolve every conversation an invoked review created, but never require a review record
  when no review was requested.
- Run every finite surface gate required by the shipped UI, API, or other reachable behaviour.
  Record an explicit exemption only when no reachable surface exists.
- Commit the `git mv plans/in-progress/... plans/done/...` move and index updates inside the
  delivering PR, push it, and require a new exact-head `Quality gate` result for that archival
  commit.
- The merge remains outside the done-boundary. `[AI]` merges once the five hardened preconditions
  in the [PR Merge Protocol](../../../development/workflow/pr-merge-protocol.md) hold; a `[HUMAN]`
  step changes only the actor. Worktree cleanup follows the completed merge.
