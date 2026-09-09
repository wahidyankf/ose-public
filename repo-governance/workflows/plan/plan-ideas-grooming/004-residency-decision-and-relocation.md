---
description: The three fixed-order residency rules, and the fail-safe-toward-duplication relocation sequence used when residency changes.
when_to_use: Use when deciding which repo an idea belongs in, or moving an idea to its correct repo.
---

# Steps 4-5 — Residency Decision and Relocation

## 4. Residency decision

Apply the following three rules, in this fixed order, first match wins, to every surviving idea
(post-merge/split):

1. **Secrets check** — the idea inherently requires a real secret, credential, API key, or other
   infra-state value to be actionable → resident in the repo designated for infra-private content
   only, and in no other repo.
2. **Single-repo-only check** — the idea names a file, app, or concern that provably exists in
   exactly one of the `repos` in this run (verified via `Glob` / `Bash test -f` against that repo's
   own tree, never assumed from the idea's prose alone) → resident in that one repo only.
3. **Default (generalizable)** — neither of the above matches → resident in the repo designated as
   the generalizable, cross-cutting-governance default for this run's `repos` set.

Log the matched rule number for every decision, in every case — including "already correctly
resident, no relocation needed" — so the grooming log records a residency verdict for every
surviving idea, not only the ones that moved.

## 5. Relocation

When Step 4's determined target repo differs from an idea's current repo, relocate it using a
**fail-safe-toward-duplication, never-toward-loss** sequence:

1. Write the file at the destination repo's resolved quadrant folder (with the Step 6 reshape, any
   Step 9 rename, and the Step 7 provenance line already applied — the file that lands is the final
   file, not a draft to be touched again).
2. Commit that write per the fixed `delivery-mode` (`worktree-to-pr`, unconditional — see the
   frontmatter's `delivery-mode` input) and land it on the destination repo's `main`: open the PR and
   require exact-head/base PR CI, one clean current-head `pr-leak-review`, and applicable finite
   surface gates before it merges.
3. **Verify the commit landed** on the destination repo's `origin/main` before doing anything else.
4. **Only after verification succeeds**, delete the original file from the source repo, as its own
   separate commit and push.

If verification in step 3 fails or the run is interrupted before step 4 completes, **stop before
the delete** — the idea now legitimately exists in both repos. Log the duplication explicitly as an
unresolved follow-up in both repos' grooming logs; a future invocation resolves it. The idea is
never silently dropped from either repo as a side effect of an interrupted run.
