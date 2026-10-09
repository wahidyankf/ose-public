# 006 — The Series-Completion Gate

Series decision 40 (user, 2026-10-09: "yang penting nanti hasil akhirnya harus ada isinya", meaning "what
matters is that the end result has real content") says that when the series ends, zero courses carry
`status: outline`, zero courses are skeleton (fewer than 1,000 words) or filler, every learning path has
phases with filled courses only, and no "Outline" badge renders anywhere. It also says plan 14 carries the
terminal gate that measures this, and that the gate blocks archival if any check fails. This page is that
gate: 17 checks, each with its exact command, its threshold, the observation that means pass, and who owns
the fix when it fails.

The gate runs as Phase 10 of [../delivery.md](../delivery.md#phase-10-the-series-completion-gate), after the
pull request is open and green and after knowledge capture, so it measures the final head. Command names
(`UNIT-NODE`, `EX-COVERAGE`, and the rest) are defined in the Command Reference of
[../delivery.md](../delivery.md#command-reference).

## What the gate is and is not

- It **re-measures**. Every content plan (06 to 13) already ran its own completion test on its own share.
  This gate runs them again, once, on the final tree, and adds the global measures that no single plan owns.
- It **blocks archival**. Plan 14 moves itself to `plans/done/` inside its own pull request (the
  repository's archival-in-PR rule), so a failed gate means the move is not made, the pull request is not
  merged, and the series is not closed. The legacy tree stays live on `main` meanwhile, which is the safe
  state.
- It **changes no content**. A failing check about a course is reported to the user with the owning plan;
  this plan does not rewrite courses (see [Failure policy](#failure-policy)).
- It has **no waiver**. The only way to accept a failed end-state check is a new written decision from the
  user that amends decision 40. The one exception the series already defines is plan 11's
  `DEFERRED_BY_USER` list for audited courses (SC-06).
- A word floor by mode (By Example, Annotated-Concept, and so on) belongs to the owning plan's suite
  (SC-07). The gate adds one global floor, the filler guard's 1,000-word rule, because that is the number in
  decision 40.

## Inputs the gate depends on

| Input                                                              | From           | Phase 0 records                                                               |
| ------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------- |
| Filler guard: `scanCourseFiller`, `FILLER_BASELINE`, FG1 to FG6    | plan 09        | the as-merged test file name and that `FILLER_BASELINE` is empty              |
| Audited registry: `AUDITED_COURSES`, `DEFERRED_BY_USER`            | plans 11 to 13 | the registry file name, its row count, and the contents of `DEFERRED_BY_USER` |
| Path model rules R1 to R10 and `path-model-integrity.unit.test.ts` | plan 02        | the test file name and its test count                                         |
| Outline badge text and selector                                    | plan 02        | the exact rendered text, the i18n key, and any `data-testid`                  |
| Example harness: `EX-COVERAGE`, `EX-CHECK-ALL`                     | plan 05        | the summary line format of each command                                       |
| Share suites                                                       | plans 06 to 10 | the as-merged file name of each (see SC-07)                                   |

A renamed file changes the command in the evidence, never the threshold.

## The checks

Each check records its command, the exit status, and the observed values in the evidence file
`<plan>/evidence/phase-10-series-completion-gate.md`. A check passes only when **both** the exit status and the
observed values match. `rtk git grep` exits 1 when it finds nothing; for the "prints nothing" checks, exit 1
with empty output is the pass.

### Group A: content end state (decision 40)

**SC-01 Course count.**
Command: `find apps/ayokoding-www/content/en/learn/courses -mindepth 2 -maxdepth 2 -name _index.md | wc -l`.
Threshold: exactly 229 (181 at authoring plus the 48 courses of plan 10).
Expected: `229`. A different number passes only if a merged plan's ledger names the course added or removed
and the catalog count test (plan 10's `CORPUS-GUARD`) was updated in that plan; otherwise it fails.
Owner when failing: the plan that changed the count.

**SC-02 Zero outline courses.**
Command: `rtk git grep -l -E "^status:[[:space:]]*[\"']?outline" -- apps/ayokoding-www/content/en/learn`. It covers
course pages and path pages together.
Threshold: 0 files.
Expected: empty output, exit 1. A match inside a page with `draft: true` is an end-to-end fixture, not a
shipped course; it is listed in the evidence and not counted. Any other match fails.
Owner when failing: the plan that owns the course (06 accounting, 07 ERP, 08 capstones).

**SC-03 No skeleton and no filler course.**
Command: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts --reporter=verbose` (plan 09's guard).
Threshold: all six rules FG1 to FG6 fire on zero of the 229 courses; `FILLER_BASELINE` is empty; the global
floor FG5 (1,000 words) holds for every course.
Expected: exit 0; the scenario "The filler baseline is empty" (added in Phase 1 of this plan, as plan 09's
documentation asks) is listed as passed; the metrics table printed by `formatFillerReport` has no course in
its `fired` column and no total-word figure below 1,000.
Owner when failing: the plan named in the baseline entry's `owner` (09, 11, 12, or 13); a baseline that is
not empty means that plan did not finish.

**SC-04 Harness coverage is 100%.**
Command: `EX-COVERAGE`.
Threshold: every applicable course is covered.
Expected: exit 0; the printed summary shows `covered` equal to `applicable` and an empty uncovered list. A
course with no runnable code is not applicable and is listed as such by the command itself.
Owner when failing: plan 13 (it "ends with harness coverage at 100% of courses") or the plan that added the
course.

**SC-05 Every example runs green.**
Command: `EX-CHECK-ALL` (needs Docker; takes hours; run it in the background first and poll every 2 minutes).
Threshold: 0 failing units.
Expected: exit 0 and a summary with zero failures and zero skipped-for-error units; the unit count and the
elapsed time are recorded.
Owner when failing: the plan that owns the failing course; a flaky unit is fixed at its root cause by that
owner, never retried (the repository's flaky-test rule).

**SC-06 The audited share is complete.**
Command: `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` and
`rtk git grep -c "slug:" -- apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts` (the registry's row
count; the exact pattern follows the registry's real shape, recorded in Phase 0).
Threshold: the registry lists all 111 audited courses; `DEFERRED_BY_USER` is empty.
Expected: exit 0; 111 rows; an empty `DEFERRED_BY_USER`. If `DEFERRED_BY_USER` is not empty, each entry must
carry the user's written decision in the execution ledger; the gate then reports `PASS with N user-deferred
courses` and the final report names them. An entry with no recorded decision fails.
Owner when failing: plans 11, 12, or 13.

**SC-07 The share suites are green and the shares add up.**
Commands: `UNIT-NODE` on each of the following, as merged (Phase 0 records the names):
`tests/unit/be-steps/accounting-course-completion.steps.ts` (plan 06, 24 courses),
`tests/unit/be-steps/erp-course-completion.steps.ts` (plan 07, 30 courses),
`tests/unit/be-steps/capstone-course-completion.steps.ts` (plan 08, 8 courses),
`tests/unit/be-steps/filler-course-completion.steps.ts` (plan 09, 8 courses),
`tests/unit/be-steps/course-metadata.steps.ts` (plans 03 and 10: metadata, the 229 total, and the 48 migrated
courses), and the audited suite of SC-06 (111 courses).
Threshold: each exits 0, and 111 + 24 + 30 + 8 + 8 + 48 = 229.
Expected: six exit codes of 0 and the sum equal to SC-01's count. The arithmetic proves the shares agree with
the course count; it does not by itself prove the shares are disjoint, so the per-course proof is SC-02 to
SC-05, which are global.
Owner when failing: the plan whose suite fails.

### Group B: paths

**SC-08 Every path has phases with filled courses only.**
Command: `UNIT-NODE tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts`.
Threshold: rules R1 to R10 of plan 02 hold for all path manifests (the 8 path manifests; draft fixtures are
handled by the integrity test itself).
Expected: exit 0 and a test count at least equal to the count Phase 0 recorded. As a second reading, each of
the 8 path pages' manifests lists `phases` and no `assumes` entry that is an outline course (the test asserts
both; the evidence copies the test names).
Owner when failing: plans 02, 06, 07, or 08 (the plan that restructured the path).

**SC-09 No Outline badge renders anywhere.**
Command: with `START` running on port 3101 from the Phase 6 production build, request `/en/learn/courses`,
`/en/learn`, and the 8 path pages with `rtk curl -sS http://localhost:3101/<url>` and count the badge text
(or selector) recorded in Phase 0 in each response. Repeat for 13 course landing pages: the 1st, 20th,
39th, and so on, in sorted order of the directories under `courses/`.
Threshold: 0 occurrences in all 23 responses (10 fixed pages and 13 sampled courses).
Expected: `0` for each URL, recorded in a table of url and count. The Phase 7 browser pass checks the same pages
visually.
Owner when failing: plan 02 (the badge component) if SC-02 passed, otherwise the course owner.

### Group C: this plan's own result

**SC-10 Every mapping row is resolved and every destination exists.**
Commands: `wc -l apps/ayokoding-www/tests/unit/redirects/fixtures/legacy-url-inventory.tsv`,
`UNIT-NODE tests/unit/be-steps/legacy-url-redirect-inventory.steps.ts`, `UNIT-NODE tests/unit/redirects/legacy-removal.unit.test.ts`,
and `INTEGRATION` (which binds the scenario "The compiled redirect rules equal the table" against the real
build output).
Threshold: 1,150 inventory lines; 105 mapping rows accounted for (the Phase 2 evidence file records the parity
result: 104 path rows plus the navigation row); each of the 74 distinct course destinations is an existing
course directory; the compiled routes manifest carries the same number of redirects as `redirectRules`.
Expected: `1150`; both unit commands exit 0 with their assertions (2,298 redirect assertions, 2 non-capture
assertions, and the destination checks) passed; `INTEGRATION` exits 0 with that scenario listed as passed.
Owner when failing: this plan.

**SC-11 The redirect crawl passes on a real server.**
Command: `BE-E2E` (full), which includes the scenario that reads the inventory and requests every legacy and
pre-IA URL with redirects disabled.
Threshold: 2,298 redirect requests (1,150 legacy addresses and 1,148 pre-IA twins) all answer 308 with the expected `Location`; each of the 75 distinct
destinations (74 courses and the catalog) answers 200.
Expected: exit 0; the report shows the scenario passed; the evidence records the request counts the step logs.
The same command is run against production after deploy ([../delivery.md](../delivery.md#plan-archival-merge-deploy-and-series-closure)).
Owner when failing: this plan.

**SC-12 The `docs/` repoint is complete.**
Commands: `rtk git grep -n "learn/legacy" -- docs` (expect nothing), the 12 destination-census commands of
[003](./003-docs-repoint-and-link-validation.md#destination-census-grep-no-test-needed), and
`rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- ./rhino md internal-link validate`.
Threshold: 0 legacy links; each census count equals the value Phase 3 recorded (the as-merged expectation);
validator exit 0.
Expected: empty output for the first command; 12 matching counts; exit 0.
Owner when failing: this plan.

**SC-13 No reference to the legacy tree remains outside the redirect machinery.**
Commands: `rtk git grep -n -E "learn/legacy|learn-three-bucket|learnThreeBucket|isLegacySlug|homeLegacyPrompt" -- . ':!plans' ':!local-tmp' ':!apps/ayokoding-www/src/redirects' ':!apps/ayokoding-www/tests' ':!apps/ayokoding-www-fe-e2e/tests' ':!apps/ayokoding-www-be-e2e/tests' ':!specs'`,
then the same pattern with `-l` over only `apps/ayokoding-www/src/redirects`, `apps/ayokoding-www/tests`,
`apps/ayokoding-www-fe-e2e/tests`, `apps/ayokoding-www-be-e2e/tests`, and `specs`.
Threshold: the first command prints nothing; the second lists only files whose purpose is the redirect or the
absence (the redirect module, the permanent unit test, the inventory fixture, the new feature and its step
files, and the sitemap, robots, and navigation assertions), and every listed file is in the allowlist that
Phase 5 recorded.
Expected: empty output (exit 1), then a file list equal to the allowlist.
Owner when failing: this plan.

**SC-14 Sitemap, feed, search data, and robots hold no legacy URL.**
Commands: with `START` running, `rtk curl -sS http://localhost:3101/sitemap.xml`, `/feed.xml`, and
`/robots.txt`; and `grep -c "learn/legacy" apps/ayokoding-www/generated/search-data.json` after
`generate-search-data` (the file is gitignored, so it is read, not searched through git; Phase 0 confirms its
path).
Threshold: 0 occurrences of `learn/legacy` in the sitemap, the feed, and the search data; `robots.txt` still
contains `Allow: /` and no `Disallow:` line that covers `/en/learn`.
Expected: `0`, `0`, `0`; `robots.txt` as stated.
Owner when failing: this plan.

**SC-15 `id` is untouched.**
Command: `rtk git diff --stat origin/main...HEAD -- apps/ayokoding-www/content/id`.
Threshold: no changed file.
Expected: empty output.
Owner when failing: this plan.

### Group D: series state

**SC-16 Plans 01 to 13 are archived.**
Commands: `rtk git ls-tree -d --name-only origin/main plans/done/` and
`rtk git grep -c "ayokoding-learn-revamp-" -- plans/done/README.md`.
Threshold: a folder ending in each of the 13 suffixes (`01-navigation-and-display` through
`13-audit-product-security-ai`) and a README entry for each.
Expected: 13 matching folder names and 13 entries. Plan 14 is not yet archived at this point, because its own
move happens after the gate passes.
Owner when failing: the plan that is missing; execution stops and reports (this contradicts the series'
strict order, decision 42).

**SC-17 CI is green on the exact head.**
Commands: `rtk gh pr checks <number>` and the pull request's `leak-review` status.
Threshold: `Quality gate` (from `.github/workflows/pr-quality-gate.yml`) green for the exact current head and
base, and one posted `pr-leak-review` `pass` for that head.
Expected: both green on the SHA that the evidence file records (the measured head, defined under
[Evidence file](#evidence-file)). A push that changes any path outside `plans/` after the gate started makes
the gate start over. The evidence commit and the archival commit change only `plans/`, so they do not; they do
need their own green CI run, and SC-17 is read once more on the final head before the merge.
Owner when failing: this plan.

## Run order inside Phase 10

1. Record the head SHA (`rtk git rev-parse HEAD`) and today's date (`rtk date +%F`) at the top of the evidence
   file.
2. Start SC-05 (`EX-CHECK-ALL`) in the background, because it takes hours and uses Docker.
3. Run the fast checks SC-01 to SC-04, SC-06 to SC-08, SC-10, SC-12, SC-13, SC-15, SC-16 while it runs.
4. Start `START` (production build from Phase 6, rebuilt if any file changed since: compare
   `rtk git diff --stat <phase-6-head>..HEAD -- apps`), run SC-09 and the server part of SC-14, and stop
   `START`. Then run SC-11 (`BE-E2E` starts its own web server on the same port, so `START` must be stopped).
5. When SC-05 finishes, record it. Then SC-17 last, because it needs the final head.
6. Compute the verdict.

Compute that stays on a shared machine goes through HIPPO as the Command Reference states; SC-05 is the
`heavy` tier and the only check that needs Docker.

## Verdict and failure policy

| Verdict                             | When                                                                                   | What happens                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PASS`                              | all 17 checks pass                                                                     | the plan archives itself, merges, deploys, and runs the series closure |
| `PASS with N user-deferred courses` | all 17 pass and `DEFERRED_BY_USER` holds N entries, each with a recorded user decision | same, and the final report names the N courses                         |
| `FAIL`                              | any check fails, or the evidence is incomplete                                         | **no archival**, no merge; follow the policy below                     |

### Failure policy

On `FAIL` the plan folder stays in `plans/in-progress/`, the plan-folder move is not made, the pull request
stays open and unmerged, and the series is not closed. Then, per failing check, by owner:

1. **Owned by this plan** (SC-10 to SC-15, SC-17): fix the root cause in this pull request, with a regression
   test where the check is a test. At most 2 fix cycles. Each fix is a new commit, a new push, a new push leak
   review, and a new CI run; then the **whole** gate is run again, not only the failed check. A check still
   failing after cycle 2 is recorded as `BLOCKED` in the execution ledger and reported.
2. **Owned by an earlier plan** (SC-01 to SC-09, SC-16): this plan does not rewrite courses, tests, or paths.
   The check is recorded as `BLOCKED` in `local-tmp/ayokoding-learn/execution-ledger.md` under the heading
   `## Plan 14 — legacy removal` with the failing course or file, the owning plan, and the output. The report
   to the user names the options and does not choose among them:
   - reopen the owning plan's work (a new fix delivery for that plan);
   - authorize this pull request to carry a named fix as a separate commit (the user's explicit choice only);
   - amend decision 40 in writing for the named item.
3. The gate stays open until the user decides. The expensive evidence (SC-05) is kept; after a fix it is
   rerun only if the course, path, or harness trees changed (`rtk git diff --stat` against the head of the
   previous run).

The legacy tree is not deleted on `main` while the gate is failing, because deletion and archival merge
together. That is deliberate: a series that cannot prove its end state does not remove the last copy of the
old material.

## Evidence file

`<plan>/evidence/phase-10-series-completion-gate.md` holds, in this order: the head SHA, the date, one
section per check (`SC-01` to `SC-17`) with the command, the exit status, the observed values, and the
verdict of that check, then the overall verdict line and, for any `BLOCKED` check, the ledger heading and
row. Paths are repository-relative. The file is committed with the plan folder and moves to `plans/done/`
with it, so the proof outlives the worktree.

**The measured head.** The head SHA at the top of the file is the commit the gate measured. The evidence
file cannot name the commit that contains itself, so two more commits follow it: the evidence commit and the
archival move. Both change only paths under `plans/`. The rule that keeps the proof honest is checkable with
one command, `rtk git diff --stat <measured-head>..HEAD -- . ':!plans'`, which must print nothing on the
final head: nothing the gate measured changed after it measured. If a fix changes anything outside `plans/`,
the measured head moves and the whole gate runs again on the new one.

## Relationship to the checks that came earlier

| Earlier check                        | Measured at         | What the terminal gate adds                                                             |
| ------------------------------------ | ------------------- | --------------------------------------------------------------------------------------- |
| Each content plan's completion suite | that plan's Phase 4 | one rerun on the final tree (SC-07) so a later plan cannot have broken an earlier share |
| Plan 09's filler guard               | plan 09 Phase 1     | the baseline is empty, not merely not growing (SC-03)                                   |
| Plan 02's path-model integrity       | plan 02             | the same test on the final manifests, plus a rendered-page badge check (SC-08, SC-09)   |
| Plan 05's per-PR `examples:check`    | each PR             | one full run and 100% coverage on the whole catalog (SC-04, SC-05)                      |
| Plan 10's mapping-completeness test  | plan 10 Phase 2     | the same property proven by the permanent inventory, after the tree is gone (SC-10)     |
| This plan's own phases               | Phases 1 to 9       | one place where all of them are read together (SC-10 to SC-15, SC-17)                   |
