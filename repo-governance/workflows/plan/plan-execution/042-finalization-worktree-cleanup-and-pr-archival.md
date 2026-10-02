---
description: Defines safe direct-push cleanup and *-to-pr archival.
when_to_use: Use when cleaning up a plan's worktree after a direct push, or moving a plan folder to done/ inside a delivering PR.
---

# Finalization and Archival — Direct-Push Worktree Cleanup and PR-Mode Archival

1. **Direct-push worktree compatibility cleanup — only after terminal audit and `pass`**:
   `worktree-to-origin-main` is unavailable in both OSE repositories; `main-to-origin-main` creates
   no plan worktree. If this compatibility procedure is reused by a repository that permits such a
   worktree mode, require confirmed delivery, a passing workflow-owned terminal audit in
   `{final-report}`, and final `pass` before cleanup.
   1. Resolve the declared repository-relative route from the plan's Provisioned Worktree Identity
      against the selected repository root and reconcile the resulting runtime path with `git
worktree list --porcelain`. Inventory every plan-created/current branch; the initial
      identity branch may differ after normal switching. Missing identity, path conflict, or
      unclassified branch blocks removal; never derive ownership from a familiar path.
   2. Apply the canonical
      [mandatory pre-removal checks](../../../development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md):
      the exact worktree is clean and idle, every inventoried branch is pushed, and each direct-push
      delivery is present on `origin/main` with no open PR. For a PR-mode branch, its merged PR
      reviewed head must equal the inventory's recorded reviewed-head SHA, with either a matching
      current `origin/<branch>` or verified GitHub auto-deletion under enabled
      `delete_branch_on_merge`; retain and escalate any other missing/mismatched proof. A repository
      root, wildcard, missing identity, or another actor's worktree is never eligible.
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
      force removal or silently discard dirty or unpushed work.

**`worktree-to-pr` / `main-to-pr` (`*-to-pr` modes)** — archival-in-PR: the plan-folder move lands
inside the delivering PR itself, followed by exact-current-head/base PR CI, before the merge
(`[AI]` by default; `[HUMAN]` only where the plan's own step says so):

1. Resolve the actual repository-local completion date only after every pre-archival gate,
   including the preliminary end-to-end audit, passes:

   ```bash
   rtk date +%F
   ```

   Record the output as `<completion-date>`; never use an authoring-time or forecast date from a
   prospective checklist.

2. Move entire plan folder from current location to `plans/done/`:

   ```bash
   rtk git mv plans/in-progress/plan-name/ plans/done/<completion-date>__plan-name/
   ```

3. **Update `plans/in-progress/README.md`** — remove the plan entry from the list
4. **Update `plans/done/README.md`** — add the plan entry with the same resolved completion date and brief summary
   (same format as above)
5. **Update any other READMEs** that reference this plan
6. **Search for orphaned references** to the old `plans/in-progress/[plan-name]` path and fix them
7. **Commit the archival and push to the PR branch** (never to `main` directly):

   ```
   chore(plans): move [plan-identifier] to done
   ```

8. **Verify the replacement `Quality gate` run** is green for the archival commit's exact PR head
   and current base. Confirm conversations are resolved, applicable finite surface gates pass, the
   secrets check is clean, and the archival commit is present. Semantic-review evidence is required
   only when the user explicitly requested that workflow for this PR.
