---
description: Details the steps to promote a plan from backlog/ (its pure move lands on origin/main in its own promotion PR or commit before Phase 0) and provision its worktree, and the steps to complete and archive it to done/.
when_to_use: Use when moving a plan from backlog/ to in-progress/, or from in-progress/ to done/.
---

# Starting and Completing Work

## Starting Work

Never execute a plan directly from `plans/backlog/`. Deliver its pure promotion to `origin/main`
in its **own promotion PR** (`*-to-pr`) or **own direct commit** (permitted direct-push), before
**Phase 0** and any implementation. On the trunk first, promoted plans can each be worktreed in
parallel without waiting for a first unit.

1. **Resolve the delivery mode first.** Apply the
   [three-tier precedence](./delivery-mode-merge-authority-and-precedence.md#delivery-mode--merge-authority-and-resolution-precedence),
   then check the [per-repository restrictions](./per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).
2. **Reconcile remote state.** Apply the mandatory
   [Promotion Recovery](./starting-work-promotion-recovery.md) classifier (unstarted, branch
   pushed, PR open, merged-and-verified, or anomaly-stop) before mutation or on resume, and
   continue from that state. The classification is about the **promotion delivery alone**; a plan
   whose move is already `merged-and-verified` on `origin/main` skips steps 3–4 and goes straight
   to step 5.
3. **Make the pure move as one commit.** On its own short-lived promotion branch, move
   `plans/backlog/<identifier>/` to `plans/in-progress/<identifier>/` without a date prefix, and
   update the required `backlog/README.md` and `in-progress/README.md` indexes and the plan's node
   in the [Plan-Order Graph](./plan-order-graph-and-legend.md) in `plans/README.md` (its class,
   marker, and colour change with the move). Make no edit beyond what the move forces: its
   `Status` line and its forced link edits. Do not include implementation or other ride-along
   changes.
4. **Deliver the promotion before Phase 0.** For `*-to-pr`, open a promotion-only pull request
   carrying that one commit, pass its current-head/base gates and leak review, and merge it under
   the [PR Merge Protocol](../../../development/workflow/pr-merge-protocol.md). For a permitted
   direct-push mode, push that one commit on its own. Phase 0, provisioning of the plan's
   worktree, and every implementation commit wait until `origin/main` holds only the
   `plans/in-progress/` path.
   **Promotions serialize.** Every promotion touches the same three files (`backlog/README.md`,
   `in-progress/README.md`, `plans/README.md`), so only one promotion merges at a time. Open promotion
   PRs may coexist, but before merging, each one rebases onto the fresh `origin/main` and redraws its
   own index lines and Plan Order node against that trunk. Never merge a stale promotion.
5. **Provision and continue from fresh trunk.** Fetch, then resolve the plan at its new
   `plans/in-progress/` path and enter the mode-appropriate work location from that fresh
   `origin/main`. `worktree-to-pr` provisions its one designated worktree now (never a second one
   for the same plan); initialize only a newly provisioned worktree. The promotion branch is not
   the plan's worktree or work branch and is deleted after its merge. A permitted main mode
   remains in the primary checkout with `N/A`.

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
