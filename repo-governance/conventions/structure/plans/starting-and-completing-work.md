---
description: Details the steps to promote a plan from backlog/ to in-progress/ and provision its worktree, and the steps to complete and archive it to done/.
when_to_use: Use when moving a plan from backlog/ to in-progress/, or from in-progress/ to done/.
---

# Starting and Completing Work

## Starting Work

Never execute a plan directly from `plans/backlog/`. Its pure promotion must reach `origin/main`
before implementation begins.

1. **Resolve the delivery mode first.** Apply the
   [three-tier precedence](./delivery-mode-merge-authority-and-precedence.md#delivery-mode--merge-authority-and-resolution-precedence),
   then check the [per-repository restrictions](./per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).
2. **Reconcile remote state, then choose the landing route.** Apply the mandatory
   [Promotion Recovery](./starting-work-promotion-recovery.md) classifier (unstarted, branch
   pushed, PR open, merged-and-verified, or anomaly-stop) before mutation or on resume, and
   continue from that state. `worktree-to-pr` uses the dedicated worktree; `main-to-pr` stays in
   the synced primary checkout with no worktree. Direct-push modes use their declared work
   location and remain available only when the repository permits them.
3. **Make a pure move.** Move `plans/backlog/<identifier>/` to
   `plans/in-progress/<identifier>/` without a date prefix, and update only the required
   `backlog/README.md` and `in-progress/README.md` indexes. Do not include implementation or other
   ride-along changes.
4. **Land or resume the promotion.** Continue from the reconciled state: push a not-yet-pushed
   branch, open a missing PR, or drive the matching PR's exact-current-head/base
   `Quality gate` green and merge under the
   [PR Merge Protocol](../../../development/workflow/pr-merge-protocol.md). A permitted
   direct-push route commits and pushes the pure move to `origin main`.
5. **Verify and continue.** Confirm the promotion exists on `origin/main`, refresh or provision the
   implementation work branch from that commit, resolve the plan at its new `plans/in-progress/`
   path, initialize the toolchain, and only then execute its delivery checklist. The promotion PR
   and implementation are separate delivery units.

For the worked route, see [Execute Plan from Backlog](../../../workflows/plan/plan-execution/046-example-usage-and-iteration-example.md#execute-plan-from-backlog).

## Completing Work

1. **Verify completion**: Ensure all deliverables and acceptance criteria met — for UI-bearing plans, this includes the production visual sign-off (rule 10 of the [User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md))
2. **Resolve the completion date at execution time**: only after completion proof passes, run
   `rtk date +%F`; record its repository-local output as `<completion-date>`. A prospective plan
   uses this placeholder and never pre-fills an authoring or forecast date.
3. **Add the resolved prefix and move**: rename
   `in-progress/[identifier]/` to `done/<completion-date>__[identifier]/` via `rtk git mv`, using the
   same resolved value in every index/reference.
4. **Update index**: Update both `in-progress/README.md` and `done/README.md`
5. **Git commit**: Commit the move with completion message
6. **Archive**: Plan is now archived for historical reference

**Checkbox lockstep (rule 13)**: tick each delivery checkbox only after the corresponding code, review, or evidence actually exists — not speculatively. See [User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md) rule 13 for the full checkbox-lockstep requirement.

**Reopen path (rule 14)**: if a production defect surfaces after archival, reopen the plan by moving it back from `done/` to `in-progress/`, stripping the completion-date prefix, and adding a dated note in `README.md` explaining the defect. See [User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md) rule 14 for the full reopen procedure.
