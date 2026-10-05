---
description: Lists the 12 top-level actions (0-11) the calling context performs when a user asks it to execute a plan.
when_to_use: Use when tracing the exact ordered actions plan execution performs, from backlog promotion through worktree cleanup.
---

# How to Execute

**Continues** [Execution Mode](./001-execution-mode.md).

**How to Execute**:

```
User: "Execute plan plans/in-progress/new-feature/plan.md"
```

The calling context will:

0. **Promote from `plans/backlog/` first, if needed**: if `plan-path` resolves inside
   `plans/backlog/`, resolve the delivery mode and repository restrictions, then land the pure move
   through the mandatory `worktree-to-pr` route before step 1, using and retaining its designated
   worktree and merging the promotion PR. No other delivery mode is valid in `ose-public`. Follow the canonical
   [Starting Work procedure](../../../conventions/structure/plans/starting-and-completing-work.md#starting-work);
   never execute directly from `plans/backlog/`.
1. **Enter the designated worktree** (Step 0): require the plan's `## Worktree` declaration, then
   enter or first-provision that one worktree. An invocation may select a delivery-unit branch only
   inside this declared location; it cannot choose the primary checkout or another worktree. Sync
   the selected work branch with the latest `origin/main` before implementation
2. Read the delivery checklist from the plan's `delivery.md` to understand all items. This step is
   mandatory even when the workflow is first invoked after implementation started or is reinvoked
   mid-run; never trust a prior conversational task list over disk.
3. Reconstruct and audit the granular harness list using `TaskCreate`—one task per remaining action
   checkbox, including separate RED/GREEN/REFACTOR actions; outcome-section Input/Outcome/Proof
   remains context. Before implementation, prove the full 1:1 mapping: checked action ↔ completed
   task when retained, unchecked action ↔ open task, and zero task orphans/duplicates.
4. For each item: mark `in_progress`, **repo-ground its file paths and commands** (refuse-on-uncertainty if grounding fails), analyze it, **prefer the `_Suggested executor:_` annotation** if present (else fall back to Agent Selection heuristics), delegate to the chosen agent (or execute directly for trivial edits), verify the result
5. Perform the Atomic Sync Ritual after each item — tick `- [ ]` → `- [x]` in `delivery.md`, add implementation notes, `TaskUpdate completed`
6. Invoke `plan-execution-checker` via the Agent tool to validate the implementation
7. Repeat execution and validation, at most `max-cycles` times, until no blocking finding remains
8. Run the applicable pre-archival surface gates, API retest, and Knowledge Capture gate
9. Run the **preliminary** End-to-End Delivery Completeness Audit. Build every
   requirement-to-artifact/PR-to-proof row now; only final-delivery proof may remain explicitly
   pending. A missing or stale non-delivery row reopens the earliest affected action and returns to
   steps 4-8
10. Pass the infrastructure gate, archive through the resolved delivery-mode path, and honor the
    applicable commit/merge authority. Push the archival commit, require replacement exact-head/base
    CI and leak-review evidence where applicable, then merge or
    confirm the permitted direct push
11. Run the **terminal** End-to-End Delivery Completeness Audit against the delivered head. Fill the
    final-delivery rows, reopen any unsupported requirement, and assign `pass` only when the full
    requirement-to-proof trace is evidenced end to end
12. After the final delivery for each repository is pushed or merged, run the complete canonical
    [Worktree and Artifact Cleanup gate](../../../development/workflow/worktree-and-artifact-cleanup.md)
    immediately. Build the [Delivery Branch Inventory](../../../conventions/structure/plans/worktree-specification.md#delivery-branch-inventory), perform every mandatory pre-removal check, then clean all four eligible classes: dev container stacks this session started (first — they bind-mount the worktree), the exact worktree, eligible plan-created branches, and plan-local regenerable build output. Preserve diagnostics and shared caches, retain and escalate active/ambiguous/partial/fail state, and apply the bare-repository remote-branch-before-worktree ordering exception. Never force-remove, prune shared state, or remove a repository root, wildcard path, or another actor's worktree.
