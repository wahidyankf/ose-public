# 005 — Path Restructure and Integrity

Plan 02 gave every path phases, `assumes`, and integrity rules, but left the four skills paths in a
temporary "marked" shape: one flat `all-courses` phase with the field `restructurePendingIn`, listed in
a closed allowlist so the stricter rules skip them. Series decision 39 (user, 2026-10-09) puts the real
restructure of the two accounting paths in this PR, together with their filled courses. This page
says exactly what changes and how the change is proven.

## Plan 02's Rules, Restated

`checkPathModelIntegrity` (plan 02) applies these rules. While a path is marked, R4–R8 are skipped.

| Id  | Rule                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- |
| R1  | Every course ID resolves to a library course                                                                  |
| R2  | A course appears at most once across all phases                                                               |
| R3  | Phase IDs are unique; no phase is empty; every core phase comes before every extension phase                  |
| R4  | **Closure**: each prerequisite of a core course is earlier in the path or listed in `assumes`                 |
| R5  | **No outline in core**: no core course has `status: outline`                                                  |
| R6  | Goals sit in core phases and match the computed core (careers only; skills paths declare no goals)            |
| R7  | **Exact `assumes`**: each assumed course resolves, is not in the path, and is a prerequisite of a core course |
| R8  | **Skills shape**: a `skills/` path has no extension phase                                                     |
| R9  | **Closed marker**: only an allowlisted path carries the marker; every allowlist entry is used                 |
| R10 | **Ordering**: no course comes before one of its in-path prerequisites                                         |

After this PR the two accounting manifests carry no marker, so all ten rules apply to them. R5 is why
every one of the 24 courses must be filled before this PR can merge: one course left as an outline
fails R5 for both paths.

## Prerequisite Changes

The course briefs in [../syllabus/courses/](../syllabus/courses/README.md) re-run plan 02's
prerequisite rubric for the 24 courses, which plan 02 left untouched as outlines ("to be re-judged by
its rewrite plan"). Rubric, restated: an edge "A requires B" exists only when A uses something B teaches
and does not re-teach it (T1), A does not call B optional (T2), the edge is not tooling-only (T3), and
the edge is not just old path adjacency (T4). L1: a language primer is required when that language is
A's code medium. Plan 02's evidence is the course's own prose; for courses rewritten from scratch,
the evidence is the course brief's "Prior courses" line, which the maker must keep true in the
written course's `overview.md`.

Totals (computed 2026-10-09 from the current frontmatter and the briefs): **34 edges before, 85
after; 29 kept, 56 added, 5 removed.** 24 of the added edges are `just-enough-python` under L1, because
every course now uses Python as its code medium.

| Course                                         | Kept                                                                                                | Added (code)                                                                                                                                                                    | Removed (code)                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `accounting-foundations`                       | —                                                                                                   | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `chart-of-accounts-and-data-modeling`          | `accounting-foundations`, `sql-essentials`                                                          | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `journal-entries-and-posting-mechanics`        | —                                                                                                   | `accounting-foundations`, `chart-of-accounts-and-data-modeling` (A-PROSE); `just-enough-python` (L1)                                                                            | `financial-statements-and-close-cycle` (R-JOURNEY) |
| `financial-statements-and-close-cycle`         | `chart-of-accounts-and-data-modeling`                                                               | `journal-entries-and-posting-mechanics` (A-PROSE); `just-enough-python` (L1)                                                                                                    | —                                                  |
| `accrual-accounting-and-revenue-recognition`   | `journal-entries-and-posting-mechanics`                                                             | `financial-statements-and-close-cycle` (A-PROSE); `just-enough-python` (L1)                                                                                                     | —                                                  |
| `accounts-payable-and-procure-to-pay`          | `journal-entries-and-posting-mechanics`, `accrual-accounting-and-revenue-recognition`               | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `accounts-receivable-and-order-to-cash`        | `journal-entries-and-posting-mechanics`, `accrual-accounting-and-revenue-recognition`               | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `managerial-and-cost-accounting`               | `financial-statements-and-close-cycle`                                                              | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `fixed-assets-and-depreciation`                | —                                                                                                   | `journal-entries-and-posting-mechanics`, `accrual-accounting-and-revenue-recognition` (A-PROSE); `just-enough-python` (L1)                                                      | `financial-statements-and-close-cycle` (R-JOURNEY) |
| `inventory-and-cogs-accounting`                | `managerial-and-cost-accounting`                                                                    | `journal-entries-and-posting-mechanics` (A-PROSE); `just-enough-python` (L1)                                                                                                    | `chart-of-accounts-and-data-modeling` (R-SOURCE)   |
| `lease-and-intangible-asset-accounting`        | `fixed-assets-and-depreciation`                                                                     | `accrual-accounting-and-revenue-recognition` (A-PROSE); `just-enough-python` (L1)                                                                                               | —                                                  |
| `multi-currency-accounting-and-fx-translation` | `financial-statements-and-close-cycle`                                                              | `journal-entries-and-posting-mechanics` (A-PROSE); `just-enough-python` (L1)                                                                                                    | —                                                  |
| `consolidation-and-multi-entity-accounting`    | —                                                                                                   | `chart-of-accounts-and-data-modeling`, `financial-statements-and-close-cycle`, `multi-currency-accounting-and-fx-translation` (A-PROSE); `just-enough-python` (L1)              | —                                                  |
| `financial-reporting-standards-ifrs-vs-gaap`   | `accrual-accounting-and-revenue-recognition`, `lease-and-intangible-asset-accounting`               | `fixed-assets-and-depreciation`, `inventory-and-cogs-accounting`, `consolidation-and-multi-entity-accounting` (A-PROSE); `just-enough-python` (L1)                              | —                                                  |
| `audit-controls-and-compliance`                | `financial-statements-and-close-cycle`                                                              | `journal-entries-and-posting-mechanics` (A-PROSE); `just-enough-python` (L1)                                                                                                    | —                                                  |
| `payroll-and-tax-accounting-essentials`        | —                                                                                                   | `accrual-accounting-and-revenue-recognition`, `accounts-payable-and-procure-to-pay`, `accounts-receivable-and-order-to-cash` (A-PROSE); `just-enough-python` (L1)               | `chart-of-accounts-and-data-modeling` (R-SOURCE)   |
| `treasury-and-cash-management`                 | `accounts-payable-and-procure-to-pay`, `accounts-receivable-and-order-to-cash`                      | `multi-currency-accounting-and-fx-translation` (A-PROSE); `just-enough-python` (L1)                                                                                             | —                                                  |
| `financial-reporting-and-xbrl`                 | `financial-reporting-standards-ifrs-vs-gaap`                                                        | `financial-statements-and-close-cycle` (A-PROSE); `just-enough-python` (L1)                                                                                                     | —                                                  |
| `general-ledger-system-architecture`           | `chart-of-accounts-and-data-modeling`, `financial-statements-and-close-cycle`, `backend-essentials` | `journal-entries-and-posting-mechanics`, `multi-currency-accounting-and-fx-translation`, `audit-controls-and-compliance`, `sql-essentials` (A-PROSE); `just-enough-python` (L1) | —                                                  |
| `sharia-accounting-and-aaoifi-standards`       | `accrual-accounting-and-revenue-recognition`, `financial-reporting-standards-ifrs-vs-gaap`          | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `islamic-contract-modeling-for-systems`        | `sharia-accounting-and-aaoifi-standards`                                                            | `journal-entries-and-posting-mechanics`, `accounts-receivable-and-order-to-cash`, `lease-and-intangible-asset-accounting` (A-PROSE); `just-enough-python` (L1)                  | `chart-of-accounts-and-data-modeling` (R-SOURCE)   |
| `zakah-computation-and-reporting-for-systems`  | `islamic-contract-modeling-for-systems`                                                             | `financial-statements-and-close-cycle`, `inventory-and-cogs-accounting` (A-PROSE); `just-enough-python` (L1)                                                                    | —                                                  |
| `sukuk-and-islamic-capital-markets-accounting` | `islamic-contract-modeling-for-systems`, `multi-currency-accounting-and-fx-translation`             | `just-enough-python` (L1)                                                                                                                                                       | —                                                  |
| `sharia-ledger-system-architecture`            | `islamic-contract-modeling-for-systems`, `general-ledger-system-architecture`                       | `zakah-computation-and-reporting-for-systems`, `sql-essentials` (A-PROSE); `just-enough-python` (L1)                                                                            | —                                                  |

Codes (plan 02's): **A-PROSE** added because the brief names it as needed; **L1** the language
medium; **R-JOURNEY** removed because only old path order supported it (journal entries feed the
statements, not the other way round; fixed assets need postings and accrual, not statements);
**R-SOURCE** removed because the needed artifact (the chart of accounts) reaches the course through a
prerequisite that already requires it (the journal entries course or the transaction-cycle courses).

Plan 02's "no transitive reduction" rule holds: a course keeps every prior course its brief names.

The prerequisite list order in frontmatter follows the order of the course brief's "Prior courses"
line. Courses outside this plan that require an accounting course (six ERP courses, listed in
[001](./001-current-state-and-architecture.md#the-24-courses-today)) are not changed.

## Closure Proof

Checked on 2026-10-09 by walking each target manifest in order against the target prerequisites
above, with a read-only script in the planning scratchpad. The durable proof is plan 02's
`path-model-integrity.unit.test.ts`, which runs R1–R10 over the real manifests in `test:quick`.

| Path                             | Courses | Phases | R4 closure problems | R10 order problems | Unused `assumes` (R7) | Positions match the syllabus index |
| -------------------------------- | ------- | ------ | ------------------- | ------------------ | --------------------- | ---------------------------------- |
| `skills/conventional-accounting` | 19      | 6      | none                | none               | none                  | yes                                |
| `skills/sharia-accounting`       | 24      | 7      | none                | none               | none                  | yes                                |

`assumes` is `["backend-essentials", "just-enough-python", "sql-essentials"]` for both paths. Each is
used: `just-enough-python` by every course, `sql-essentials` by the chart, general-ledger, and
Sharia-ledger courses, and `backend-essentials` by the general-ledger course.

## Ordering

The only reorder is a swap: `journal-entries-and-posting-mechanics` moves to position 3 and
`financial-statements-and-close-cycle` to position 4, because statements are built from posted
entries. Course `weight` changes with it (journal 1102, statements 1103), so the catalog and the
sidebar show the same order as the path. Every other position is unchanged. The full manifests are
in [../syllabus/paths/](../syllabus/paths/README.md); the reasoning for the swap is decision D6 in
[008](./008-decision-records.md).

## Removing the Marker and the Allowlist Entries

Plan 02 names, restated (Phase 0 confirms them on `origin/main` and records any difference):

| Thing                                                                                                  | Change in this PR                                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `restructurePendingIn` in `manifests/skills/conventional-accounting.json` and `sharia-accounting.json` | Removed, with the new phases, outcomes, and `assumes`                                                                                      |
| `SKILLS_RESTRUCTURE_ALLOWLIST` in `src/features/course-paths/core/skills-restructure-allowlist.ts`     | The two accounting entries are deleted; the two ERP entries (`"plan-07"`) stay                                                             |
| `restructurePendingIn: z.enum(["plan-06", "plan-07"])` in `core/schemas.ts`                            | Narrowed to `z.enum(["plan-07"])`, so a stale `"plan-06"` value can never parse again                                                      |
| The allowlist map's value type `"plan-06" \| "plan-07"`                                                | Narrowed to `"plan-07"`                                                                                                                    |
| `tests/unit/features/course-paths/core/skills-restructure-allowlist.test.ts`                           | "Exactly four entries" becomes "exactly two entries, both `skills/*-erp`, both `plan-07`"                                                  |
| `tests/unit/features/course-paths/core/schemas.test.ts`                                                | Marker cases that used an accounting path or `"plan-06"` switch to an ERP path and `"plan-07"`; a new case: `"plan-06"` is rejected        |
| `tests/unit/features/course-paths/manifests/skills-order.unit.test.ts` and `legacy-skills-order.ts`    | If the test iterates the frozen keys, the two accounting keys are deleted from the frozen data; if it iterates marked manifests, no change |
| `tests/unit/features/course-paths/manifests/manifest-membership.unit.test.ts`                          | No change: the course sets are unchanged                                                                                                   |
| Plan 04's flat roadmap branch for marked paths                                                         | Stays: the ERP paths still use it until plan 07                                                                                            |

## Manifest Tests That Change

| File                                                                                              | Change                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/features/course-paths/manifests/skills/conventional-accounting-manifest.unit.test.ts` | Expected order with the swap; six phase IDs in order; every phase `kind: "core"` with an outcome; no marker; `assumes` as above |
| `tests/unit/features/course-paths/manifests/skills/sharia-accounting-manifest.unit.test.ts`       | The same with seven phases; the seventh phase's outcome includes the "cannot yet issue Sharia rulings" limit                    |
| `tests/unit/features/course-paths/manifests/skills/skills-path-composition.unit.test.ts`          | The Sharia path's first 19 courses still equal the conventional path's 19 (unchanged assertion, new order)                      |
| `tests/integration/fe-steps/skills-path-composition.steps.ts`                                     | `expectedCourseOrder` swaps the two courses; the new scenario below is bound                                                    |
| `specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-composition.feature`       | One new scenario outline for the phases and outcomes (see [007](./007-testing-strategy.md))                                     |

## Path Pages and the Path-Copy Test

- The two path pages `content/en/learn/paths/skills/conventional-accounting/_index.md` and
  `.../sharia-accounting/_index.md` get the description and body specified in the syllabus manifest
  files. The old bodies contain "Dangerous 1/2/3", "OI-2", "appended", and "complete at nineteen
  courses"; none survive.
- `content/en/learn/paths/skills/_index.md` loses the last sentence of its description, "Each path
  publishes as its manifest ships.", and keeps the rest: "Skills-oriented learning paths — routes
  organized around a capability such as accounting or ERP rather than a career." The skills landing
  shows this description directly above the new statement, so the description must not repeat who the
  paths are for; the statement says that once. Its generated body (four links) is unchanged.
- Plan 02's `tests/unit/features/course-paths/content/path-copy.unit.test.ts` scans
  `content/en/learn/paths/_index.md` and `content/en/learn/paths/careers/**` for internal jargon
  ("dangerous", "oi-2", "append", "manifest", "from scratch"). This PR adds the three files above to
  its scope. Plan 07 widens it to all of `content/en/learn/paths/**`.

## The Skills Landing and Hub

| Place                                                                   | Today                                                                                                                           | After                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/features/course-paths/shell/category-landing.tsx` (skills branch)  | "Get up and running fast on the ramp — every skills path starts safe, gets you productive quickly, and goes deeper from there." | "For software engineers who build accounting and ERP systems. Work through each path in order." |
| Same file                                                               | `<RampMilestoneStrip />` under every skills path card ("Dangerous", "Comfortable", "Confident")                                 | Removed, with its import and the doc comment's mention                                          |
| `src/features/course-paths/shell/ramp-milestone-strip.tsx` and its test | A component used only by the skills landing                                                                                     | Deleted                                                                                         |
| `src/app/[locale]/(content)/[...slug]/page.tsx` (paths hub)             | Skills strapline "Up and running fast, then deeper and deeper" (rendered `sr-only` by `CategorySection`: heard, not seen)       | "Accounting and ERP for software engineers"                                                     |

The strip goes because its three labels describe the old "ramp" model that decisions 16–18 replaced
with per-phase outcomes; the phase outcomes on each path page now say what a reader can do. The ERP
paths are still marked after this PR, but the new statement is true for them too, and plan 07 adds
their phases and outcomes. The statement stays English for both locales, as today's statement is.

Plan 04 merges before this plan (the series runs in order, decision 42). It makes the skills landing
render `LearnPathCard` instead of `PathCard` and keeps the statement and the strip (plan 04 decision
D11). This plan changes only the statement and removes the strip; the card stays as plan 04 left it.
The "Today" column above was measured on 2026-10-09, before plan 04; Phase 0 re-reads the file.

## The Wire Contract

The tRPC route data (`coursePaths.getRouteData`) changes only in data, not in shape: the two
accounting manifests arrive with six and seven phases, outcomes, `assumes`, and no
`restructurePendingIn`; `outlineCourseIds` loses the 24 accounting IDs. The manual check in
[../delivery.md](../delivery.md) asserts exactly this at the HTTP boundary on port 3101, plus the
existing failure case (an unknown locale returns HTTP 400 `BAD_REQUEST`).
