---
description: "The trigger and procedure for rolling back the split."
when_to_use: "Use when deciding whether to roll back the discipline split."
---

# Rollback Trigger (D6)

The monitoring plan feeds exactly one decision: whether to roll the split back to the retired
monolith. That decision uses a **fixed absolute-threshold bar**, not a comparison against the
monolith's pre-cutover performance — the monolith was retired (deleted) at cutover and never ran
side-by-side with the split, so no pre-cutover baseline exists to compare against. **The bar
therefore needs no pre-cutover baseline**, which is what resolves the apparent contradiction between
retiring the monolith immediately and gating rollback on a baseline immediate retirement never
captures.

The rollback fires when any one of the following trips, evaluated over a rolling monitoring window
of the last **N post-cutover PRs** — N is maintainer-tunable at execution time, not fixed by this
convention:

- consolidated-finding **precision < 50%** over the window, OR
- **human-override-rate > 5%** over the window, OR
- any single **CRITICAL false-positive** reaches `pr-review-fixer` at all — this threshold carries no
  window; one occurrence trips it (see
  [CRITICAL-Requires-Reproduction](./quality-gate-enhancements-critical-reproduction-and-five-cycle-maximum.md) above for why a CRITICAL finding
  without a reproduction should never have reached the fixer as CRITICAL in the first place).

These three thresholds are proposed defaults, deliberately conservative and maintainer-tunable — they
exist so a rollback decision is a documented lookup, not a fresh judgment call made under the
pressure of a live incident.

**Restore procedure** — on a trip, the monolith comes back through a **non-destructive forward
operation**, never a history rewrite:

1. `git revert` (or `git checkout` of the pre-deletion commit) the change that removed
   `.claude/agents/pr-review/pr-review-maker.md` and its register/catalog entries, reintroducing them as a new
   commit on top of the current branch.
2. Move the restored file to `.agents/agents/pr-review-maker.md` with canonical metadata, then run
   `./rhino harness adapters generate` to regenerate every declared agent route from it.

No force-push and no history rewrite happen at any step — restoring the monolith is a forward commit
that reintroduces a previously deleted file, exactly like reverting any other change, per the
[No Destructive Git Operations](../../workflow/no-destructive-git-operations.md) practice.
