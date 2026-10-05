---
description: Defines PR-mode merge, immediate safe cleanup, and final status.
when_to_use: Use when merging a plan's delivering PR, cleaning up its worktree afterward, or determining the plan's final status.
---

# Finalization and Archival — PR Merge, Cleanup, and Final Status

1. **Merge — `[AI]` by default**: once exact-current-head/base PR CI, applicable surface gates,
   archival-in-PR, and the hardened merge preconditions (a)-(e) hold, surface the PR URL and checklist, then
   merge. A `[HUMAN]` merge gate applies only where the plan's own step says so explicitly — in
   that case, hand off the ready-to-merge PR and STOP instead of merging. The preconditions are
   identical in both cases; only the actor differs. See
   [Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode).
2. **Terminal End-to-End Delivery Completeness Audit — before final status or cleanup**: after the
   merge or permitted direct push is confirmed, replace every `Pending final delivery` row with
   proof from the delivered head and record the result in `{final-report}`. The terminal audit is a
   workflow-owned post-delivery gate, not a delivery checkbox that may be pre-ticked. Any missing,
   stale, inferred, or unsupported row reopens the earliest affected action, leaves status non-pass,
   retains the worktree, and blocks cleanup.
3. **Worktree cleanup — immediate (after terminal audit passes)**: once the delivery and terminal
   audit are confirmed,
   clean up a `worktree-to-pr` worktree in the same session. `main-to-pr` created no plan worktree,
   so this step is N/A for that mode.
   1. Resolve the Provisioned Worktree Identity's declared repository-relative route against the
      selected repository root, reconcile the resulting runtime path with `git worktree list --porcelain`,
      and inventory plan-created/current branches. Missing identity, path conflict, or unclassified
      branch blocks removal; never infer ownership from a familiar path.
   2. Apply the canonical
      [mandatory pre-removal checks](../../../development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md):
      GitHub reports every PR-mode branch merged with the inventory's exact reviewed head, and either
      its live `origin/<branch>` matches or its authoritative GitHub auto-deletion event proves the
      missing ref is expected under enabled `delete_branch_on_merge`. Every direct-push branch must
      be delivered with no open PR; the exact worktree must be clean/idle and no branch unpushed.
      Retain and escalate any other missing/mismatched proof; squash ancestry is not PR-merge proof.
   3. When every check passes, purge only plan-local regenerable build output, preserving diagnostic
      evidence and shared caches. If this is a bare repository whose pre-push hook requires a
      working tree, delete each verified live remote branch from inside the linked worktree before
      removal. Then remove the resolved runtime path immediately without another confirmation prompt, from the
      repository root:

      ```bash
      git worktree remove <resolved-runtime-path>
      ```

      Use the non-force command only, then complete the canonical
      [branch cleanup](../../../development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md)
      procedure for this plan's verified branches and run `git worktree prune`.

   4. If any check or removal fails, retain the worktree, surface the evidence, and escalate. Never
      force removal or silently discard dirty, unpushed, unmerged, or another actor's work.

- If status is `partial` or `fail`: Leave plan in current location, do NOT archive, and do NOT delete the worktree — in-flight work stays available for the next execution attempt

**Output**: `{final-status}`, `{cycles-completed}`, `{final-report}`

**Status determination**:

- PASS: **Success** (`pass`): The terminal end-to-end audit proves every requirement against the
  delivered head, no blocking finding remains, all requirements are met, and every infrastructure-apply
  step is verified from the primary checkout — plan moved to `plans/done/`
- **Partial** (`partial`): Blocking findings remain after max-cycles, OR an infrastructure-apply step (`terraform apply`, live Ansible converge, or equivalent per the Step 0 policy) remains unexecuted from the primary checkout — plan stays in current location
- FAIL: **Failure** (`fail`): Technical errors during execution or checking, plan stays in current location

**Depends on**: Reaching this step from step 4, 6, or 7
