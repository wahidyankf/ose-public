# Business Requirements — Accounting Courses

## Problem

AyoKoding (`apps/ayokoding-www`) offers two skills paths for software engineers who build accounting
systems: **Conventional Accounting** (19 courses) and **Sharia Accounting** (the same 19 plus 5
Islamic-finance courses). Today neither path can teach anyone:

- **Every course is an empty outline.** Each of the 24 courses has six short pages and 186 to 313
  words in total. There are no lessons, no worked examples, no exercises, and no code. A reader who
  follows either path learns nothing past the course titles.
- **The courses were planned as "paper" courses.** The 2026-08-15 accounting syllabus chose courses
  with no build step, which produced these outlines. Engineers who build ledgers need code they can
  run and reuse.
- **The Sharia material is risky if done carelessly.** Islamic finance has real differences between
  scholars, schools of law, and national authorities, and its standards change: AAOIFI FAS 9 (zakah)
  was replaced by FAS 39 from 1 January 2023, yet the 2026-08-16 Sharia syllabus still cited FAS 9.
  Content that presents one view as the only one, or reads like a ruling, could mislead an institution.
- **The path pages use internal jargon.** They say "Dangerous 1/2/3", "settle OI-2's doctrinal basis",
  and "no later plan appends courses". The skills landing promises a "ramp" with a
  "Dangerous / Comfortable / Confident" strip that no course delivers.
- **The paths have no shape.** After plan 02, each accounting path is one flat phase with a temporary
  marker that switches off the closure and no-outline-in-core rules, because its courses were outlines.

## Who This Is For

- **Readers:** software engineers who build or maintain accounting, ledger, or ERP systems (series
  decision 16). They know how to program and want to understand the accounting their code implements.
- **Readers in Islamic finance:** engineers building systems for Islamic banks, takaful operators,
  zakah institutions, or sukuk issuers, who need to know which standard applies, where opinions differ,
  and which questions only their Sharia board can answer.
- **Later plans:** plan 07 (ERP courses) builds on these courses and reuses this plan's Sharia rules
  and `psql` toolchain; plans 11–13 can reuse the toolchain too.

## User-Stated Requirements (verbatim intent)

- "make sure nanti semua coursenya harus lengkap ya. dan siap dipake" (every course complete and ready
  to use).
- "bikin sekalian. semua yang kerangka harus diisi" (do it all at once; every outline must be filled).
- "Skills path ikut plan konten" (skills paths follow the content plan): the accounting paths are
  restructured in the same PR as their filled courses.
- "semua jadi 2 aja" (2026-10-09): every quality gate and every maker-checker loop stops after 2
  cycles.
- "Delivery checklists: detailed, split by phase, with an explicit completion gate per phase or
  section."
- "jangan kerjain/implement plan ini sebelum gw kasih perintah buat eksekusi ya" (do not implement this
  plan until the user gives the command to execute).
- "semua plan tadi bakal kita lakuin sekuensial ya" (2026-10-09): all the series plans run one after
  another.

## Resolved Series Decisions This Plan Relies On

The user resolved these decisions on 2026-10-09. They are copied here so this plan stands alone.
Numbering follows the series decision list.

| No. | Decision                                                                                                                                                                                                                                                                                                                                                   | How this plan applies it                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Skeleton (`status: outline`) courses are never in a core.                                                                                                                                                                                                                                                                                                  | Every accounting course is core, so all 24 must be filled before the restructure can merge.                                                 |
| 16  | Skills paths' audience: software engineers building accounting/ERP systems. Titles are kept; descriptions say who the path is for.                                                                                                                                                                                                                         | The path pages, the skills landing statement, and every course overview name this reader.                                                   |
| 17  | Skills paths are phases only: every course is core, there is no extension, and the closure check applies.                                                                                                                                                                                                                                                  | Six and seven core phases; `assumes` lists the three outside courses.                                                                       |
| 18  | Skills jargon is replaced by per-phase outcomes ("After this phase you can … / cannot yet …").                                                                                                                                                                                                                                                             | Every phase has an outcome; the jargon and the ramp strip go.                                                                               |
| 19  | Sharia sources: cite AAOIFI and recognised fatwa bodies such as DSN-MUI, show madhhab and jurisdiction differences, never issue rulings, flag points needing a Sharia board decision.                                                                                                                                                                      | Rules SC1–SC8, a fixed callout, a fixed disclaimer, a source register, and human URL checks.                                                |
| 26  | Every course ends complete, pedagogically sound, and with solid code.                                                                                                                                                                                                                                                                                      | Two quality gates per course and the harness.                                                                                               |
| 27  | Course definition of done: the course meets the tutorial convention for its mode plus drilling; it passes its mode quality gate and the Content Quality Gate with no blocking finding; and every code example is green in the harness.                                                                                                                     | Each course states its mode and reason, meets the mode's targets, and is harness-green; `status: outline` goes and plan 03 metadata is set. |
| 29  | Per course: maker → mode quality gate (at most 2 cycles) → Content Quality Gate (at most 2 cycles) → harness green. A course still blocked at the cap is marked BLOCKED in the execution ledger, reported, and the batch moves on. Parallelism: N=3 background agents. The user set every cap in this plan to 2 cycles on 2026-10-09 ("semua jadi 2 aja"). | The pipeline in [tech-docs/006](./tech-docs/006-execution-model.md); the ledger records agent IDs and cycle counts.                         |
| 30  | Code contract: each example lives in `learning/code/ex-NN-<slug>/` with its code and a `run.yaml`; the harness also checks that Markdown code blocks match their files.                                                                                                                                                                                    | One unit per example, kata, and capstone.                                                                                                   |
| 31  | Determinism: every `run.yaml` is deterministic (fixed seeds, no wall clock, no real network, no uncontrolled thread order); simulations use a virtual clock and seeded faults over a fixed seed set.                                                                                                                                                       | Money, date, output, database, and simulation rules in [tech-docs/003](./tech-docs/003-code-harness-and-determinism.md).                    |
| 32  | Runtime: anything that runs in a container runs for real, including Postgres.                                                                                                                                                                                                                                                                              | The three database courses run against the real PostgreSQL service.                                                                         |
| 35  | Courses are English only; `content/id/**` stays untouched.                                                                                                                                                                                                                                                                                                 | Every run of index generation is followed by a check that `content/id` did not change.                                                      |
| 37  | Deterministic tooling lives in `apps/ayokoding-cli`; app checks stay in the app's tested TypeScript; never ad-hoc scripts.                                                                                                                                                                                                                                 | The content-shape test lives in the app's Unit suite; the harness is the CLI.                                                               |
| 39  | Skills paths ship with their content plans: their real restructuring (phases, outcomes, decisions 16–18, closure and no-outline-in-core enforcement) ships in the same PR as their filled courses: accounting in plan 06, ERP in plan 07.                                                                                                                  | One PR for the 24 courses, both manifests, the marker removal, and the copy.                                                                |
| 40  | Series end state: zero outline, skeleton, or filler courses; every path filled; no "Outline" badge; harness coverage at 100%. Plan 14 carries the terminal gate; each content plan measures its share.                                                                                                                                                     | The end-state gate: zero accounting outlines, both paths filled, 24 of 24 courses covered by the harness.                                   |
| 42  | The 14 plans run strictly one after another, 01 to 14, one plan, one worktree, and one PR at a time; the next plan starts only after the previous one is merged, deployed, verified, and cleaned up. Parallel agents inside a plan stay (N=3).                                                                                                             | Plans 01 to 05 are merged when this plan starts and plan 07 has not started; Phase 0 confirms both. No rebase between plans is planned.     |

## Evidence (measured 2026-10-09 at `origin/main` `bb7f90137`)

| Fact                                                                                                                                                       | How it was measured                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 24 accounting courses, each 6 Markdown files and 186–313 words, no code folder                                                                             | Listed each `content/en/learn/courses/<slug>/` and counted whitespace-separated words in every `.md` file |
| The 24 courses list 34 prerequisite edges in their frontmatter; 6 ERP courses require an accounting course                                                 | Parsed every course `_index.md` with a read-only script                                                   |
| Conventional path 19 courses, Sharia path 24 (the 19 plus 5); no career or ERP manifest contains an accounting course                                      | Read `src/features/course-paths/manifests/**/*.json`                                                      |
| The path pages say "Dangerous 1/2/3", "OI-2", "complete at nineteen courses", and "no later plan appends courses"                                          | Read `content/en/learn/paths/skills/{conventional,sharia}-accounting/_index.md`                           |
| The skills landing states a "ramp" and renders a "Dangerous / Comfortable / Confident" strip under every card                                              | Read `src/features/course-paths/shell/category-landing.tsx` and `ramp-milestone-strip.tsx`                |
| Exemplars: `sql-essentials` (By Example) 80 examples and 51,943 words; `statistics-for-evaluation` (Annotated Concept) 46 worked examples and 54,322 words | Counted example headings and words                                                                        |
| Plan 05's harness catalog plan has a `python` language toolchain and a `postgres` service, but no SQL client toolchain                                     | Read plan 05's toolchain catalog design                                                                   |
| AAOIFI FAS 39 replaced FAS 9 from 1 January 2023; FAS 51 (participatory ventures) and FAS 52 (deferred delivery sales) take effect 1 January 2027          | AAOIFI standards listing on `cis.aaoifi.com` and AAOIFI standard pages                                    |
| Indonesia's Sharia PSAK were renumbered to 401–412 and 459 from 1 January 2024; the old zakat "PSAK 109" is now PSAK 409                                   | IAI renumbering document                                                                                  |
| A web fetch of `aaoifi.com` returned an unrelated gambling page for every URL tried; `cis.aaoifi.com` returned AAOIFI's pages                              | Planning-time fetches; cause not found                                                                    |

The full source register, with links and access dates, is in
[tech-docs/004](./tech-docs/004-sharia-content-policy-and-sources.md#source-register).

## Business Goals and Success Measures

| Goal                                     | Measure at merge                                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every accounting course is complete      | 24 of 24 courses have no `status: outline`, declare `format`, reach their word floor (28,000 By Example, 22,000 Annotated Concept), and have the full drilling page; the content-shape test passes |
| Every course's code works                | `ayokoding-www:examples:check` exits 0; the harness coverage report shows `covered: true` for all 24 courses                                                                                       |
| Every course passed its quality gates    | The execution summary shows `PASS` or `PASS_WITH_FINDINGS` from both gates for all 24 courses, each within 2 cycles, and no BLOCKED course left unresolved                                         |
| The paths have a clear shape             | Conventional path 6 phases, Sharia path 7, every phase with a title and an outcome; plan 02's integrity rules R1–R10 report zero problems; the allowlist holds only the two ERP entries            |
| The paths speak plainly                  | Zero case-insensitive matches of `dangerous`, `oi-2`, `append`, `manifest`, or `from scratch` in the skills hub page and the two accounting path pages; no milestone strip on the skills landing   |
| Sharia content informs and does not rule | Each of the 5 Sharia courses has the disclaimer and at least 4 board-decision callouts; no superseded AAOIFI standard is named except as history; every AAOIFI link was checked by a person        |
| Readers see honest catalog data          | Each accounting card in the catalog shows a format and an estimated time and no Outline badge; the tRPC `outlineCourseIds` list has 24 fewer IDs than the Phase 0 baseline                         |

## Business Risks

| Risk                                                                                                   | Mitigation                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A course cannot pass a gate within 2 cycles                                                            | It is marked BLOCKED, recorded, and reported; the batch moves on. Before the paths are restructured the plan stops for the user, because one outline would break both paths (decision 6) |
| A reader treats course text as a Sharia ruling                                                         | Fixed disclaimer, attributed positions, board-decision callouts, and a content-shape test for the checkable parts                                                                        |
| A link sends readers to a harmful page posing as AAOIFI                                                | Makers use `cis.aaoifi.com`; a person checks every AAOIFI URL in a browser before merge; the content-shape test fails on any unchecked AAOIFI link                                       |
| Standards change while the plan waits in the backlog (FAS 51 and FAS 52 take effect on 1 January 2027) | The maker re-checks each source-register entry when writing and teaches the standard in force on that date; rule SC6 forbids naming a superseded standard except as history              |
| Plans 02, 03, or 05 merge with different names than this plan expects                                  | Phase 0 checks every name on `origin/main` and records the merged names before any change                                                                                                |
| The PR is very large                                                                                   | One commit per course, per-course gate reports, and a committed execution summary let a reviewer check each course on its own                                                            |
| Running many Docker-based examples overloads the machine                                               | Every command runs through HIPPO, which admits harness runs one resource budget at a time; at most 3 background agents                                                                   |
| Removing the strip also changes the ERP cards before plan 07                                           | The new statement is true for the ERP paths too; plan 07 adds their phases and outcomes                                                                                                  |
