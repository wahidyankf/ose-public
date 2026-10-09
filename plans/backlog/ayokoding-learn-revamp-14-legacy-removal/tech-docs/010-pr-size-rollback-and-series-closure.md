# 010 — Pull Request Size, Rollback, and Series Closure

This page says how one pull request carries 1,161 deleted files and 153 changed or new ones without becoming
unreviewable, how the change is undone if it must be, and what happens after the merge to close the whole
14-plan series. Counts are from [009](./009-file-impact.md).

## PR-size strategy

**The facts.** The net diff has 1,161 deleted files, 137 edited files, and 16 new files, plus a few
regenerated files and the evidence folder. GitHub's diff view cannot show this changeset in one page, and no
reviewer should try to read it that way. The one-plan-one-pull-request rule stays ([D7](./007-decision-records.md#d7-one-pull-request-ordered-commits-no-feature-flag)).

**What makes it reviewable.**

1. **Ordered, single-purpose commits**, each green on its own (list below). A reviewer reads them in order.
2. **The deletion is one commit made of deletions.** Its 1,150 removed pages are not read; they are
   _counted_. The review recipe is two commands from the repository root:
   `rtk git show --stat --format= <deletion-commit> -- apps/ayokoding-www/content/en/learn/legacy | tail -1`
   (expect `1150 files changed`) and
   `rtk git show --stat --format= <deletion-commit> -- . ':!apps/ayokoding-www/content/en/learn/legacy'`
   (the small remainder, about 20 files, is what a person reads).
3. **The review surface is small and named.** The files worth reading are the redirect table (104 rows), the
   inventory fixture (1,150 generated lines, read once against the rule), the new feature files, the step
   files, and the rule edits. The 94 docs files are 158 changed lines, each with the same shape.
4. **Checkpoint pushes**, each after a push leak review of the outgoing range, read locally with git because
   the range exceeds GitHub's diff limit: after Phase 2 (the draft PR opens here), after Phase 3, and after
   Phase 5. A reviewer can read the pull request at each checkpoint; nothing deploys until the merge.
5. **The pull-request body** states the scope, the rollback, the new-code cost and benefit (the new code is one
   redirect module of 104 data rows plus builder, one aggregator, and tests; the benefit is that 1,150 old
   addresses keep working and the legacy tree can finally go; tests are exempt from the cost statement), the
   size, and how to review it.

**Commit list (planned messages).** Conventional Commits, imperative, no period, header at most 100 characters.

| #   | Phase  | Message                                                                      | Content                                                                                                                                                                                         |
| --- | ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 1      | `test(ayokoding-www): move rendering and search checks off legacy pages`     | fixture page, rendering and Mermaid rebinds, the surviving search title, mock slugs, S3, sidebar order                                                                                          |
| 2   | 1      | `test(specs): guard that the filler baseline stays empty`                    | N11 (only if not already present)                                                                                                                                                               |
| 3   | 2      | `test(ayokoding-www): extract the redirect simulator`                        | N2 and its tests, with the wildcard fix                                                                                                                                                         |
| 4   | 2      | `feat(ayokoding-www): redirect legacy and pre-IA addresses to their courses` | table, builder, aggregator, config, inventory fixture, features S2 and S10, N1 and N4 and N6 to N9 and N12 to N14, deletion of the old module, its tests and S6, S4 and S1 edits, be-e2e config |
| 5   | 3      | `test(ayokoding-www): add the docs repoint verifier`                         | N5 with an empty `ACTIVE_GROUPS`, so the commit is green (the all-red run is a working-tree observation saved to the evidence)                                                                  |
| 6   | 3      | `docs(software-engineering): repoint language prerequisites to courses`      | Batch A files and the `ACTIVE_GROUPS` edit                                                                                                                                                      |
| 7   | 3      | `docs(software-engineering): repoint testing prerequisites to courses`       | Batch B files and the `ACTIVE_GROUPS` edit                                                                                                                                                      |
| 8   | 3      | `docs(software-engineering): repoint architecture prerequisites to courses`  | Batch C files and the `ACTIVE_GROUPS` edit                                                                                                                                                      |
| 9   | 4      | `docs(governance): retire legacy-tree wording from conventions and skills`   | RC1 to RC6, generated routes, spec README lines                                                                                                                                                 |
| 10  | 5      | `feat(ayokoding-www): remove the legacy learn bucket`                        | the deletion commit ([below](#what-the-last-commit-removes))                                                                                                                                    |
| 11  | 6 to 8 | `fix(ayokoding-www): <finding summary>` (zero or more)                       | one per verified defect, each with its regression test                                                                                                                                          |
| 12  | 8, 10  | `docs(plans): record ayokoding-learn-revamp-14 evidence`                     | evidence files of phases 0 to 8; a second commit with the same message records the Phase 10 gate evidence                                                                                       |
| 13  | 9      | `docs(plans): record ayokoding-learn-revamp-14 learnings`                    | only if Knowledge Capture changed `learnings.md` or landed an inline edit                                                                                                                       |
| 14  | end    | `chore(plans): move ayokoding-learn-revamp-14-legacy-removal to done`        | the archival move, after the gate passes                                                                                                                                                        |

Commit 1 is a test commit whose tests pass: the rebinds are made while the legacy tree still exists, so they
are green before and after. Commit 4 is large (the whole redirect change) because the module, its tests, and
the removal of the old module cannot be separated without a red commit.

## What the last commit removes

"The last commit" is the deletion commit, number 10: the last commit that changes product, test, or document
files. Everything after it adds evidence, knowledge capture, or the archival move.

| Removed                                                                                                                     | Count       | Why now, not earlier                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/content/en/learn/legacy/`                                                                               | 1,150 files | every link and test that needed it has moved; the redirect rules already answer first                         |
| `tests/unit/redirects/legacy-removal-parity.unit.test.ts` (N4)                                                              | 1 file      | it needs the tree and the mapping; its job (writing the inventory and proving the table) is done and recorded |
| `tests/unit/redirects/docs-repoint.unit.test.ts` and `fixtures/docs-repoint-map.tsv` (N5)                                   | 2 files     | scaffolding for the repoint; the validator and the destination census remain as the permanent proof           |
| plan 10's `tests/unit/be-steps/legacy-mapping.steps.ts` and `backend/content/legacy-mapping-completeness.feature` (T17, S9) | 2 files     | they walk the real tree; the property they enforced is now carried by the inventory scenarios                 |
| the Legacy entry and six children in `content/en/learn/_index.md`                                                           | regenerated | the index is generated, so it changes by running the generator, not by editing                                |
| `isLegacySlug` and the `noindex` branch (A6), the Learn-home Legacy line and key (A8), two comments (A7)                    | code edits  | the pages they describe no longer exist                                                                       |
| six link targets in the 2023 rant (C3)                                                                                      | text edits  | the pages they pointed at are gone and have no equivalent                                                     |

It **keeps**: the redirect table, the aggregator, the inventory fixture (`legacy-url-inventory.tsv`), the shared
simulator, `legacy-removal.unit.test.ts`, the two new features and all their bindings, the rendering fixture
page, and every rule edit of Phase 4.

After the commit, three greps decide whether anything was missed, and their results go to the Phase 5 evidence
file with the allowlist that SC-13 later uses:

1. `rtk git grep -n "learn/legacy" -- docs` prints nothing.
2. `rtk git grep -n -E "learn-three-bucket|learnThreeBucket|isLegacySlug|homeLegacyPrompt" -- . ':!plans' ':!local-tmp'` prints nothing.
3. `rtk git grep -l "learn/legacy" -- . ':!plans' ':!local-tmp'` lists only the redirect machinery and the tests and specs that assert the redirect or the absence.

## Rollback

**What "rollback" must achieve.** Reverting restores the content **and** removes the redirects. Both halves
matter: restoring the 1,150 pages while the 418 new rules still run would leave the pages unreachable (a
redirect rule is checked before the file), and removing the rules while the pages stay deleted would 404 every
old link.

**How.** One revert pull request that reverts the merge (or squash) commit of this pull request. Because the
plan folder moves to `plans/done/` inside the same pull request, the revert also moves it back to
`plans/in-progress/`, which is the correct state for a plan whose delivery has been undone.

**What the revert restores, and how to prove it.** Run these on the revert branch before merging it:

| Restored                                            | Proof (from the repository root)                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| the 1,150 legacy pages                              | `find apps/ayokoding-www/content/en/learn/legacy -type f \| wc -l` prints `1150`                                                                |
| the old module with its 12 rules, and no new module | `legacy-removal.ts` and `redirects/index.ts` do not exist; `learn-three-bucket.ts` does; the redirect array has 86 rules (or 87 with plan 04's) |
| the 94 docs links                                   | `rtk git grep -c "learn/legacy" -- docs` sums to 158 lines in 94 files                                                                          |
| the old tests and features                          | `learn-three-bucket.feature` and its four bindings exist; `learn-legacy-removal.feature` does not                                               |
| the rule wording (RC1 to RC6)                       | `rtk git grep -n "learn/legacy" -- repo-governance` finds the original lines                                                                    |
| the Learn-home Legacy line and `isLegacySlug`       | `rtk git grep -n -E "homeLegacyPrompt\|isLegacySlug" -- apps/ayokoding-www/src` finds them                                                      |
| green checks                                        | `QUICK`, `E2E-QUICK`, `BE-E2E-QUICK`, and the link validator exit 0                                                                             |

After the revert is deployed: `rtk curl -sS -o /dev/null -w "%{http_code}\n" https://www.ayokoding.com/en/learn/legacy/business/accounting`
prints `200`, and `.../en/learn/software-engineering/overview` redirects once to the legacy address as it did before.

**What a revert cannot undo.** A 308 is a permanent redirect, and browsers and some intermediaries cache it.
A visitor whose browser followed a legacy URL to a course may keep being sent there after the revert until the
cache entry expires or is cleared. The pages return for everyone who has not cached the redirect. This is the
cost of using a permanent redirect for a permanent removal, and it is the reason the plan prefers a **forward
fix** over a rollback for a single problem:

- one wrong destination: change that row in `LEGACY_ROUTES` and its lines in the inventory fixture in one
  commit; the unit and crawl tests fail until both agree;
- one missing redirect: add a row the same way;
- a broken rendering fixture: fix the fixture.

**When to roll back instead.** The live checks (the sample and the crawl against production, the visual
check) fail in a way that harms readers broadly: the crawl shows a pattern of wrong destinations, redirects
loop, or the site returns 5xx. Otherwise fix forward.

**Before the merge.** Closing an unmerged pull request changes nothing on `main`; the working branch and
worktree are then cleaned per the closure steps below.

**No data or state.** The change has no database, migration, or stored user data; the only persistent state
is the content and code that git restores.

## Series closure

The series ends here. After this plan's pull request is merged, deployed, and checked on the live site, two
things remain, and nothing else: **every plan of the series is archived**, and **the temporary artifacts of the
series are cleaned**. No new plan is created. Plans archive themselves in their own pull requests, so
closure is mostly verification.

**Before the merge.** Plan 14 archives itself inside its own pull request, after the series-completion gate
has passed (commit 14 above): `rtk date +%F` gives the `<completion-date>`, the folder moves with `rtk git mv` to
`plans/done/<completion-date>__ayokoding-learn-revamp-14-legacy-removal/`, the `plans/in-progress/README.md` entry
is removed, the `plans/done/README.md` entry is added, and the push, the CI poll, and the leak review repeat for
the new head. If the gate fails, none of this happens ([006](./006-series-completion-gate.md#failure-policy)).

**Order, after the merge.**

1. **Merge** once the five merge preconditions hold
   ([Before Merging](../../../../repo-governance/development/workflow/pr-merge-protocol/before-merging.md)).
   Record the merge commit.
2. **Post-merge CI** on `origin/main` is green (polled every 2 minutes).
3. **Deploy**: run the deploy workflow and poll it to success
   (`rtk gh workflow run ayokoding-www-test-local-deploy-prod.yml --ref main`; it moves `main` to
   `prod-ayokoding-www`, which Vercel builds).
4. **Live HTTP check**: the 14-case sample of [002](./002-redirect-mechanism-and-url-inventory.md#http-checks-on-a-real-server)
   with `curl` against `https://www.ayokoding.com`, then `BE-E2E` against production with `BASE_URL` set,
   restricted to the scenarios "Every inventoried legacy URL redirects permanently to its destination" and
   "Every redirect destination is a live page" (2,298 redirect requests and 75 destination requests, one
   worker). Expected: all pass.
5. **Live visual check** with the Playwright MCP browser at 375 and 1280 px: `/en/learn`, `/en/learn/courses`,
   one legacy URL followed to its course, and one `/id` page. Compare with the Phase 7 screenshots; read the
   console. A mismatch reopens the work as a new fix delivery.
6. **Verify the series archive.** On the updated `origin/main`:
   - `rtk git ls-tree -d --name-only origin/main plans/done/` lists a folder ending in each of the 14
     suffixes (`01-navigation-and-display` through `14-legacy-removal`);
   - `plans/done/README.md` has an entry for each of the 14;
   - `plans/in-progress/` and `plans/backlog/` hold no `ayokoding-learn-revamp-*` folder, and their READMEs
     list none.
     **If any of plans 01 to 13 is missing from `plans/done/`, stop and report which one.** Do not create a
     catch-up plan and do not move another plan's folder: that plan's own pull request owns its archival, and
     a gap contradicts the strict order of decision 42, so the user decides.
7. **Final report** to the user, in this order: the gate verdict (and any user-deferred courses), the live
   check results, the flags that were not resolved (the list in [../README.md](../README.md#flags-for-the-user)),
   the report-only stale-path counts, any `BLOCKED` history, and the follow-ups from Knowledge Capture routed
   as reported-without-plan-authorization. It proposes no new plan; the user may authorize one.

8. **Clean temporary artifacts**, after the final report above is written, because the report uses them:
   - the execution ledger `local-tmp/ayokoding-learn/execution-ledger.md` and the rest of
     `local-tmp/ayokoding-learn/` (`blocked/`, `probe-content/`, `plan-14/`): summarize any `BLOCKED` history in
     the report first, then remove them per
     [Dev Artifact Clean-Up](../../../../repo-governance/workflows/maintenance/dev-artifact-clean-up.md). These
     are working files and are regenerated if ever needed, never protected;
   - the execution worktree `worktrees/ayokoding-learn-revamp-14-legacy-removal/`, after the checks in
     [Mandatory Pre-Removal Checks](../../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md):
     `rtk git worktree remove worktrees/ayokoding-learn-revamp-14-legacy-removal`;
   - this plan's branches, local and remote, per
     [Branch Cleanup](../../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md);
     then `rtk git worktree prune`;
   - verify the series left nothing behind: `rtk git worktree list --porcelain` shows no worktree named
     `ayokoding-learn-revamp-*`, and `rtk git branch --list` shows no branch whose name contains
     `ayokoding-learn-revamp`. The authoring worktree `.claude/worktrees/ayokoding-update` is removed after the
     plans PR merges (it was never an execution worktree); if it is still listed, report it to the user rather
     than removing it;
   - reconcile local `main` until `rtk git rev-list --left-right --count HEAD...origin/main` reads `0 0`.
     Stopping rule for the whole closure: any step that cannot complete (a missing earlier plan, a failed live
     check, a worktree that will not remove) is reported with its output, and the closure waits for the user.
