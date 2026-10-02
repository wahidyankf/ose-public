---
description: The five hardened preconditions that must all hold before an AI agent or automation may merge a pull request.
when_to_use: Use immediately before merging any pull request, to confirm all five preconditions hold.
---

# The Rule

**AI agents and automation MUST NOT merge a pull request until all five hardened preconditions
hold.**

- **(a) Exact-head PR CI** — the `Quality gate` check from
  `.github/workflows/pr-quality-gate.yml` is green for the PR's current head SHA and current base
  branch. A run for an earlier head or different base does not count.
- **(b) Leak review** — every pushed commit passed the
  [push leak review](../../../workflows/quality/pr-leak-review/002-push-review.md), and one authenticated
  `ose-pr-leak-review:v1` pass covers the exact current head, shown by a `success` `leak-review`
  commit status on it, and reports no violation of [committed-secret](../../../conventions/security/secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md),
  [protected-environment](../anti-patterns/hardcoded-environment-configuration.md), or
  [machine-specific-path](../../quality/no-machine-specific-commits.md) rules. Missing, stale,
  failed, or findings-bearing evidence blocks merge. A fix that
  changes the head requires one new pass, never a clean streak.
- **(c) Branch currency** — the branch is up to date with the latest target branch, brought forward
  non-destructively when behind, and GitHub reports no merge conflict.
- **(d) Conversations** — every review conversation is resolved or explicitly dismissed by the
  user. Semantic review is optional, but conversations created by an invoked review still bind.
- **(e) Applicable surface gates** — every deterministic check the changed reachable behaviour requires has a passing
  result on the current head. A UI, API, or other surface quality gate is advisory under the
  [Quality Gate Contract](../quality-gate-contract.md): its verdict is recorded for the current head, and each open
  blocking row of a `FAIL` or `BLOCKED` verdict has an owner. A genuinely unreachable surface carries an explicit
  exemption.

For every PR merge -- without exception -- the agent must:

1. Confirm all five preconditions hold.
2. Surface the PR status, including which gates passed and how each precondition was satisfied.
3. Execute the merge -- `[AI]` is the default actor.

`[AI]` is the merge actor once the preconditions hold, unless the plan's merge step explicitly
selects a human gate. Neither `pr-review` nor `pr-review-quality-gate` is a default precondition; both run
only when the user explicitly requests them.

**Preconditions are evaluated per merge.** Satisfying them for one PR says nothing about the next;
each PR is assessed from zero against the full set.
