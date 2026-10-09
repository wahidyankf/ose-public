# 006 — Path Restructure and Pending-Removal

Series decision 39 ties the restructure of each skills path to the PR that fills its courses. This file says what
the two ERP paths become, what this plan deletes, how the skills category landing is split with plan 06, and in
what order the work runs. All paths are relative to the repository root unless they start with `src/` or
`tests/`, which are relative to `apps/ayokoding-www/`.

## The Final Manifests

The exact JSON, the page copy, and the closure derivation for each path live in the syllabus corpus, so the
delivery applies them verbatim:

- [skills/conventional-erp](../syllabus/paths/manifest-skills-conventional-erp.md): 27 courses, 5 core phases,
  12 assumed courses.
- [skills/sharia-erp](../syllabus/paths/manifest-skills-sharia-erp.md): 30 courses, 6 core phases, 14 assumed
  courses.

What changes in each manifest file under `src/features/course-paths/manifests/skills/`:

| Field                  | Before (plan 02's mechanical shape)     | After                                                                                                            |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `restructurePendingIn` | `"plan-07"`                             | gone; the strict schema rejects the key                                                                          |
| `description`          | today's sentence                        | a sentence that names the audience (decision 16)                                                                 |
| `assumes`              | `[]`                                    | 12 (conventional) or 14 (Sharia) outside prerequisites, exact by rules R4 and R7                                 |
| `phases`               | one `all-courses` phase without outcome | 5 or 6 core phases, each with `outcome.can` and, where something follows or a limit applies, `outcome.cannotYet` |
| Extension phases       | none                                    | none (decision 17: skills paths are phases only)                                                                 |
| Course membership      | 27 and 30 courses                       | the same courses in the same order                                                                               |

Decisions applied: 16 (the description names the audience), 17 (every course is core, no extension, the closure
check applies), 18 (the jargon is replaced by per-phase outcomes: "After this phase you can ... / You cannot
yet ...").

The last phase of the conventional path states only what the reader `can` do, because nothing follows it. The
last phase of the Sharia path states a limit in its `cannotYet`: "issue Sharia rulings; that needs a qualified
Sharia board", which matches rule SC3 in [005](./005-sharia-policy-and-source-register.md#the-rules).
Plan 02's schema requires `outcome` (with `can`) on every core phase and lets `cannotYet` be absent.

## Recompute Rule

The two `assumes` lists derive from the prerequisites that the finished courses carry. They are not edited by
hand and not computed by an ad-hoc script.

1. The course frontmatter `prerequisites` are re-derived with the plan 02 rubric as each course is finished
   (slice S6 of the course loop).
2. After the last wave, Phase 3 compares the merged frontmatter with the "Closure Derivation" table in each
   path file under `syllabus/paths/`.
3. If they differ, edit the path file's `assumes` and the manifest together, then run the path-model integrity
   unit test over the real manifests. The test prints the expected values when `assumes` or the core drifts.
4. If a phase no longer fits the finished courses, change the phase boundary and outcome, and record the reason
   in `<plan>/evidence/phase-3-manifests.md`. Keep the course order unless rule R10 (prerequisite ordering)
   forces a move.

## Page Copy

| Page (`apps/ayokoding-www/content/en/learn/paths/skills/...`) | New copy                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `conventional-erp/_index.md`                                  | The "Page Copy" block of the conventional path file in `syllabus/paths/`                                                              |
| `sharia-erp/_index.md`                                        | The "Page Copy" block of the Sharia path file in `syllabus/paths/`                                                                    |
| `_index.md` (the skills hub)                                  | Set by plan 06 ("Skills paths for software engineers who build accounting and ERP systems."); Phase 0 verifies it and changes nothing |

Both ERP page bodies contain none of the words the path-copy test forbids ("Dangerous", "OI-2", "append",
"manifest", "from scratch"), repeat the manifest `description` in the frontmatter, and keep the page's existing
`date`, `draft: false`, and `weight`. The Sharia page also says, in its own words, that the courses explain
standards and design choices and do not issue Sharia rulings (rules SC3 and SC5 in
[005](./005-sharia-policy-and-source-register.md#the-rules)).

## Removal Inventory

Plan 02 added the pending-restructure mechanism for exactly this moment. Plan 06 removed its share (the two
accounting entries) and narrowed the rest to the two ERP entries: the manifest field accepts only `"plan-07"`,
the allowlist has exactly two entries, and both of its test files say so. Plan 04 added a flat branch to the
roadmap, which plan 06 left for this plan. Everything below must be gone at the end of
Phase 3. The "Find with" command runs from the execution worktree root; Phase 0 saves the output as the
baseline in `<plan>/evidence/phase-0-removal-baseline.md` so the executor deletes what exists, under the merged
names, and not what this table guessed.

| #   | Item                                                                                                                                                                                                                                                                                                                                                                           | Added by | Find with                                                                                                                                                                                           | Action                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Field `restructurePendingIn` and its allowlist refinement in the strict `PathManifestFileSchema` (`src/features/course-paths/core/schemas.ts`)                                                                                                                                                                                                                                 | 02       | `rtk git grep -n "restructurePendingIn" -- apps specs docs repo-governance .agents`                                                                                                                 | Delete the field and the refinement; an unknown key is then a parse error                                          |
| 2   | `src/features/course-paths/core/skills-restructure-allowlist.ts` (`SKILLS_RESTRUCTURE_ALLOWLIST`, `isMarkedShape`, `isPendingSkillsRestructure`, `checkMarkerUsage`)                                                                                                                                                                                                           | 02       | `rtk git grep -n -e SKILLS_RESTRUCTURE_ALLOWLIST -e isMarkedShape -e isPendingSkillsRestructure -e checkMarkerUsage -- apps`                                                                        | Delete the module after every import is gone                                                                       |
| 3   | Rule R9 and the `markerNotAllowed` field in `core/manifest-integrity.ts`, and the branch that skips R4 to R8 for a marked manifest                                                                                                                                                                                                                                             | 02       | `rtk git grep -n -e markerNotAllowed -e isPendingSkillsRestructure -- apps/ayokoding-www/src/features/course-paths/core`                                                                            | Delete; rules R1 to R8 and R10 now apply to every manifest                                                         |
| 4   | Tests: `tests/unit/features/course-paths/core/skills-restructure-allowlist.test.ts`; `manifests/skills-order.unit.test.ts`; `manifests/legacy-skills-order.ts`                                                                                                                                                                                                                 | 02       | `rtk git ls-files apps/ayokoding-www/tests/unit/features/course-paths` and read the three names                                                                                                     | Delete the three files                                                                                             |
| 5   | Marker cases in `core/schemas.test.ts` and `core/manifest-integrity.test.ts` (rejected on a career, unlisted, or wrong-plan path; R9; "marked manifest skips R4 to R8")                                                                                                                                                                                                        | 02       | `rtk git grep -n -i -e restructurePendingIn -e marked -e R9 -- apps/ayokoding-www/tests/unit/features/course-paths/core`                                                                            | Delete the cases; add one test that a manifest carrying the retired key fails to parse                             |
| 6   | Flat branches for marked manifests in `shell/path-landing.tsx`, `shell/path-rail.tsx`, and the path drawer, and their "marked skills paths" unit tests                                                                                                                                                                                                                         | 02       | `rtk git grep -n "isPendingSkillsRestructure" -- apps/ayokoding-www/src/features/course-paths/shell`                                                                                                | Delete the branch and the tests; the phase rendering is then the only rendering                                    |
| 7   | Plan 04 flat mode in `PathRoadmap`; scenario S26; the flat headline in `RoadmapProgressCard` (key `progressCoursesDone`); the flat copy in `LearnPathCard` (key `roadmapCoursesCount`); a pending fixture if present                                                                                                                                                           | 04       | `rtk git grep -n -e progressCoursesDone -e roadmapCoursesCount -e isPendingSkillsRestructure -e flat -- apps/ayokoding-www/src/features/learning` (adjust the directory to plan 04's merged layout) | Delete the branch, the scenario, the keys that nothing else reads, and the fixture; keep `roadmapHoursPlusOutline` |
| 8   | Gherkin: the five marker scenarios in `core-closure.feature`; the "outline in core" Given worded for the marker; the flat scenario in `path-phases.feature`; their step bindings                                                                                                                                                                                               | 02       | `rtk git grep -n -i -e marker -e pending -e flat -- specs/apps/ayokoding/www/behaviours/frontend/course-paths`                                                                                      | Delete the five scenarios and the flat scenario, reword the Given, add the retired-marker scenario                 |
| 9   | Manifest data: `restructurePendingIn` and the `all-courses` phase in `skills/conventional-erp.json` and `skills/sharia-erp.json`; any e2e fixture manifest that carries the key                                                                                                                                                                                                | 02       | `rtk git grep -n -e restructurePendingIn -e all-courses -- apps`                                                                                                                                    | Rewrite the two ERP manifests (Phase 3); fix any fixture and `fixtures/manifests/README.md`                        |
| 10  | Docs and rule text that describe the marker: `src/features/course-paths/manifests/README.md`, `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md`, `apps/ayokoding-www/README.md`, `specs/apps/ayokoding/www/README.md`, `specs/apps/ayokoding/www/architecture.md`, and `.agents/skills/apps-ayokoding-www-developing-content/reference/course-status-and-path-model.md` | 02       | `rtk git grep -n -i -e restructurePending -e pending-restructure -e skills-restructure -- apps specs docs repo-governance .agents`                                                                  | Edit each hit so no text describes a marker that no longer exists                                                  |

If Phase 0 finds an item already deleted (for example plan 06 removed a shared test), the row is marked
"already done" with the commit that did it. If Phase 0 finds a marker mechanism **not** in this table, the
executor adds a row, deletes it, and notes it in the evidence file; nothing is left to the end-state grep to
find.

The tRPC payload is checked, not changed: `rtk git grep -n "restructurePendingIn" -- apps/ayokoding-www/src/server`
should return nothing, because plan 02 kept the marker out of the router schema. If it returns a hit, the API
quality gate and the rule-16 retest apply to `coursePaths.getRouteData`
([README](./README.md#surfaces-and-quality-gates)).

## Landing Split With Plan 06

The skills category landing mixes accounting and ERP, so plan 02 left it to plans 06 and 07 and told both to
read the other's result. Plan 06 merges first, and its design (plan 06, file 005, "The Skills Landing and Hub")
already does every row below in words that name accounting **and** ERP. Phase 0 reads what plan 06 merged for each
row and does only what remains. This plan never reverts plan 06's choice of wording.

| #   | Item                                                                                               | Where                                                                                                                                                      | Plan 06's target (expected to be merged)                                                         | Phase 0 check                                                                                               |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| L1  | `RampMilestoneStrip` ("Dangerous / Comfortable / Confident" ticks) and its use per card            | `src/features/course-paths/shell/ramp-milestone-strip.tsx`, `category-landing.tsx`, `tests/unit/features/course-paths/shell/ramp-milestone-strip.test.tsx` | Deleted with its test and import                                                                 | `rtk git grep -n "RampMilestoneStrip" -- apps`                                                              |
| L2  | The category statement "Get up and running fast on the ramp ..." and the unit test that asserts it | `category-landing.tsx`, `tests/unit/features/course-paths/shell/category-landing.test.tsx`                                                                 | "For software engineers who build accounting and ERP systems. Work through each path in order."  | `rtk git grep -n "on the ramp" -- apps specs`                                                               |
| L3  | The E2E step that looks for the statement                                                          | `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts`                                                                                          | Looks for the new statement                                                                      | Same grep                                                                                                   |
| L4  | The hub strapline                                                                                  | `src/app/[locale]/(content)/[...slug]/page.tsx`                                                                                                            | "Accounting and ERP for software engineers"                                                      | `rtk git grep -n "Up and running fast" -- apps`                                                             |
| L5  | The hub description                                                                                | `content/en/learn/paths/skills/_index.md`                                                                                                                  | "Skills paths for software engineers who build accounting and ERP systems."                      | `rtk git grep -n "publishes as its" -- apps/ayokoding-www/content/en/learn/paths`                           |
| L6  | The scenario that pins the statement                                                               | `specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-fixed-arc-statement.feature` and its bindings                                            | Reworded ("... says who its paths are for, once, with no chooser"; "no milestone strip appears") | `rtk git grep -n "ramp promise" -- specs apps`                                                              |
| L7  | Path-card or hub text that names the ramp or an arc that no longer exists                          | `src/features/course-paths/shell/path-card.tsx` and the hub grid                                                                                           | No ramp wording                                                                                  | `rtk git grep -n -i -e ramp -e dangerous -e comfortable -- apps/ayokoding-www/src apps/ayokoding-www/tests` |

Decision rules for each row:

1. **Plan 06 did it, and the result names both accounting and ERP:** mark the row "done by plan 06" and change
   nothing. This is the expected outcome for every row.
2. **Plan 06 did it, but the text names only accounting:** extend the text to cover ERP in the same sentence
   style, and update the same test and scenario.
3. **Plan 06 did not do it:** do it here, using plan 06's target. Record the row, plan 06's merge commit, and what
   was done in `<plan>/evidence/phase-0-landing-split.md`.
4. **A row is partly done:** finish the missing part (for example the component is gone but the statement test
   still asserts the old text).

The TDD order for any row done here is in the delivery: the test or scenario changes first (RED), then the
component or content (GREEN).

## Outline-Example Tests (Handoff From Plan 06)

Plan 06 (its decision D16) re-pointed every test that used an accounting course as "an outline course" to
`erp-foundations-and-history`, because it expected that course to stay an outline until this plan. Wave 1 of this
plan fills that course, so the same tests would fail on the first checkpoint push. Phase 1 therefore re-points
them **before wave 1**:

1. Find them: `rtk git grep -n -e erp-foundations-and-history -- apps/ayokoding-www/tests apps/ayokoding-www-fe-e2e apps/ayokoding-www-be-e2e specs`.
   Run the same search with each other ERP slug to find tests that already named another ERP course as an outline.
2. Choose the replacement: a course that stays an outline after this PR merges. The capstone courses are still
   outlines until plan 08, so the choice is the first capstone course that
   `rtk git grep -l "status: outline" -- apps/ayokoding-www/content/en/learn/courses` lists. If no outline course
   would remain, stop at a `[HUMAN]` checkpoint: the Outline badge then needs a synthetic fixture, which is a user
   decision (plan 06 named this case too).
3. Re-point each hit, run its test, and record the old and new slug in `<plan>/evidence/phase-1-outline-tests.md`.

## Widening the Path-Copy Test

Plan 02 added `tests/unit/features/course-paths/content/path-copy.unit.test.ts` and `path-copy.feature`, which
guard `content/en/learn/paths/_index.md` and `content/en/learn/paths/careers/**`. Plan 06 added the skills hub page
and the two accounting path pages to the scope and a scenario that the accounting pages say the path is for
software engineers (Phase 0 reads the merged scope). This plan widens it to **every published page under
`content/en/learn/paths/**`\*\*:

- A page is "published" when its frontmatter has `draft: false` (or no `draft` key). The E2E fixture pages
  `skills/e2e-fixture-alpha` and `skills/e2e-fixture-beta` are drafts, so they stay out.
- Forbidden words (matched case-insensitively as whole words, in the body and the `description`): "Dangerous",
  "OI-2", "append", "manifest", "from scratch".
- The Gherkin scenario in `path-copy.feature` is reworded from "the career paths" to "the learning paths", and
  its unit binding reads the whole tree through the same repository helper that the app uses.

## What Turns On

Once the marker is gone, plan 02's rules apply to the ERP manifests, and nothing special-cases them:

| Rule | Effect on the ERP paths                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| R4   | Closure: every prerequisite of every ERP course is earlier in the path or in `assumes`                                   |
| R5   | No outline in core: no course in either path has `status: outline` (the real-corpus test prints the offending course)    |
| R6   | Goals: not used by skills paths (no `goals` key); the rule is skipped when none is declared                              |
| R7   | `assumes` is exact: each assumed course resolves, is outside the path, and is a prerequisite of at least one core course |
| R8   | Skills shape: no extension phase                                                                                         |
| R10  | Ordering across the full flattened order                                                                                 |

New and edited tests in this plan (all under `apps/ayokoding-www/tests/unit/features/course-paths/`):

| Test file                                                                  | Status | Proves                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifests/skills/erp-manifests.unit.test.ts`                              | edited | Both ERP manifests have the phases of the syllabus (ids, titles, course order), outcomes on every phase, the exact `assumes`, no `restructurePendingIn`, and every `erp-systems` course is absent from the outline set |
| `core/schemas.test.ts`                                                     | edited | A manifest file that carries `restructurePendingIn` fails to parse (the retired marker is rejected)                                                                                                                    |
| `core/manifest-integrity.test.ts`                                          | edited | R9 and the marked-manifest cases are gone; R4 to R8 each still have a passing and a failing synthetic manifest                                                                                                         |
| `content/path-copy.unit.test.ts`                                           | edited | The widened scope above                                                                                                                                                                                                |
| `shell/path-landing.test.tsx`, `shell/path-rail.test.tsx`, the drawer test | edited | Phase rendering for a skills path; no flat-branch cases remain                                                                                                                                                         |

The real-corpus guard (`CORPUS-GUARD`, plan 03's drift test) and the plan 02 real-manifest tests are the tests
that fail while any ERP course is still an outline or while `estimatedHours` drifts. They are the proof that the
end state holds.

## Order of Work Inside Phase 3

The delivery runs Phase 3 only after all 13 waves are `DONE` (or after the user decides on a `BLOCKED` course).
The order is fixed by the dependency between tests, data, and deletions:

1. RED: write the new and changed Gherkin scenarios and tests first. They fail because the manifests still carry
   the marker and the copy still has the jargon.
2. GREEN, data: rewrite the two ERP manifests and the two path pages; run the new tests.
3. GREEN, deletions: delete the mechanism in the order of the inventory (3, 6, 7, 4, 5, 2, 1) so that every step
   compiles: first the readers of the marker, then the module, then the field.
4. GREEN, landing: do the rows of the landing split that remain.
5. REFACTOR: remove dead imports and unused i18n keys, update the docs, regenerate nothing by hand.
6. Run the end-state grep list ([008](./008-testing-and-verification.md#end-state-gate)).

The whole phase is one commit group in one PR with the content waves, so `main` never shows a half-restructured
path ([D12](./009-decision-records.md#d12--one-pr-for-the-whole-plan)).
