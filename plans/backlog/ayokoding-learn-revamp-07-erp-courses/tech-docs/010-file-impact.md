# 010 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated or recorded evidence
(written by running a command or recording a result, never by hand-editing product code). Plans 02, 03, 04, 05,
and 06 create some of the edited files; Phase 0 confirms each exists on `origin/main` under the name shown, and
records any difference in `<plan>/evidence/phase-0-contracts.md`. A file this plan deletes that plan 06 or plan 04
already deleted is marked "already done" in the Phase 0 removal baseline.

## File-Impact Analysis

```text
apps/
├── ayokoding-cli/                                                       (no change; plan 05 owns it, plan 06 added `psql`)
├── ayokoding-www/
│   ├── README.md                                                        [E] docs propagation: the marker no longer exists; the ERP paths are phase-structured
│   ├── content/en/learn/
│   │   ├── courses/<each of the 30 ERP slugs>/
│   │   │   ├── _index.md                                                [E] frontmatter: `status: outline` removed, `format`, `estimatedHours`, `prerequisites`; body [G]
│   │   │   ├── overview.md                                              [E] rewritten (150 to 400 words, then `## References`; the Sharia disclaimer in 3 courses)
│   │   │   ├── learning/
│   │   │   │   ├── _index.md                                            [G]
│   │   │   │   ├── overview.md                                          [E] Examples by Level, or the theme list
│   │   │   │   ├── beginner.md, intermediate.md, advanced.md            [N] 18 By Example courses
│   │   │   │   ├── theme-a-<slug>.md ... theme-i-<slug>.md              [N] 12 Annotated-Concept courses (9 pages each)
│   │   │   │   ├── capstone/{_index.md [G], overview.md [N], code/** [N]}
│   │   │   │   └── code/
│   │   │   │       ├── README.md                                        [N]
│   │   │   │       ├── requirements.in, requirements.lock               [N] only a course with a Python PostgreSQL unit
│   │   │   │       └── ex-NN-<slug>/{main.py|example.py|main.sql, run.yaml, expected/*.txt, test_*.py?}  [N] one unit per code-bearing example
│   │   │   └── drilling/
│   │   │       ├── _index.md                                            [G]
│   │   │       ├── overview.md                                          [E] the drill sections
│   │   │       └── code/kata-NN-<slug>/{before/**, after/**, run.yaml, expected/*.txt}  [N]
│   │   └── paths/skills/
│   │       ├── conventional-erp/_index.md                               [E] description and body (page copy in the syllabus path file)
│   │       └── sharia-erp/_index.md                                     [E] description and body
│   ├── src/features/
│   │   ├── course-paths/
│   │   │   ├── core/schemas.ts                                          [E] field `restructurePendingIn` and its refinement removed
│   │   │   ├── core/skills-restructure-allowlist.ts                     [D]
│   │   │   ├── core/manifest-integrity.ts                               [E] rule R9, `markerNotAllowed`, and the marked-manifest skip removed
│   │   │   ├── manifests/skills/conventional-erp.json                   [E] 5 core phases with outcomes, 12 assumed courses, no marker
│   │   │   ├── manifests/skills/sharia-erp.json                         [E] 6 core phases with outcomes, 14 assumed courses, no marker
│   │   │   ├── manifests/README.md                                      [E] the marker mechanism is gone
│   │   │   ├── shell/path-landing.tsx                                   [E] flat branch for marked manifests removed
│   │   │   ├── shell/path-rail.tsx                                      [E] flat branch removed (also covers the mobile drawer unless it has its own; found by the grep)
│   │   │   ├── shell/path-roadmap.tsx                                   [E] plan 04: flat mode removed
│   │   │   ├── shell/roadmap-progress-card.tsx                          [E] plan 04: flat headline removed
│   │   │   ├── shell/learn-path-card.tsx                                [E] plan 04: flat copy removed
│   │   │   └── shell/category-landing.tsx, ramp-milestone-strip.tsx     (plan 06 did these; verified only; edited here only if the Phase 0 landing split finds a row undone)
│   │   └── i18n/core/translations.ts                                    [E] unused keys (`progressCoursesDone`, `roadmapCoursesCount`) removed if nothing else reads them
│   └── tests/
│       ├── unit/be-steps/erp-course-completion.steps.ts                 [N] the content-shape test for the 30 courses
│       ├── unit/be-steps/helpers/<shared Sharia and course readers>.ts  [E] or [N]: plan 06's lists and word counter moved to one helper both step files import (REFACTOR)
│       ├── unit/be-steps/accounting-course-completion.steps.ts          [E] imports the shared helper; behaviour unchanged
│       ├── unit/fe-steps/skills-erp-path-structure.steps.ts             [N]
│       ├── unit/fe-steps/core-closure.steps.ts                          [E] marker scenarios deleted, "outline in core" Given reworded, retired-marker scenario added
│       ├── unit/fe-steps/path-phases.steps.tsx                          [E] flat scenario deleted
│       ├── unit/fe-steps/path-copy.steps.ts                             [E] widened scenario
│       ├── unit/fe-steps/skills-fixed-arc-statement.steps.tsx           [E] only if the Phase 0 landing split finds it undone
│       ├── unit/features/course-paths/
│       │   ├── content/path-copy.unit.test.ts                           [E] scope widened to every published page under `content/en/learn/paths/**`
│       │   ├── core/schemas.test.ts                                     [E] marker cases deleted; a manifest carrying the retired key fails to parse
│       │   ├── core/manifest-integrity.test.ts                          [E] R9 and the marked-manifest cases deleted
│       │   ├── core/skills-restructure-allowlist.test.ts                [D]
│       │   ├── manifests/skills/erp-manifests.unit.test.ts              [E] phases, outcomes, exact `assumes`, no marker
│       │   ├── manifests/skills-order.unit.test.ts, legacy-skills-order.ts  [D]
│       │   └── shell/path-landing.test.tsx, path-rail.test.tsx, path-roadmap tests, roadmap-progress-card and learn-path-card tests  [E] flat cases deleted
│       └── unit/<outline-example tests found by the Phase 1 search>     [E] re-pointed to a course that stays an outline
├── ayokoding-www-fe-e2e/
│   ├── fixtures/manifests/README.md                                     [E] no marker wording
│   ├── fixtures/manifests/skills/<pending fixture>.json                 [D] only if plan 04 or plan 02 added one that carries the marker
│   └── tests/e2e/steps/<steps that use an ERP course as an outline>     [E] re-pointed (Phase 1)
└── ayokoding-www-be-e2e/tests/e2e/steps/<steps that use an ERP course as an outline>  [E] re-pointed (Phase 1), if any
specs/apps/ayokoding/www/behaviours/
├── backend/content/erp-course-completion.feature                        [N] 7 scenarios
├── backend/content/README.md                                            [E] list the new feature
├── frontend/course-paths/skills-erp-path-structure.feature              [N] 4 scenarios
├── frontend/course-paths/core-closure.feature                           [E] 5 marker scenarios deleted, Given reworded, 1 scenario added
├── frontend/course-paths/path-phases.feature                            [E] flat scenario deleted
├── frontend/course-paths/path-copy.feature                              [E] "learning path pages"
├── frontend/course-paths/path-roadmap.feature                           [E] plan 04: scenario S26 deleted
├── frontend/course-paths/README.md                                      [E] list the new feature
└── README.md files above                                                [E] as listed
specs/apps/ayokoding/www/architecture.md                                 [E] only if the as-built document describes the marker (C4 reconciliation expects no change)
.agents/skills/apps-ayokoding-www-developing-content/
└── reference/course-status-and-path-model.md                            [E] rule PM2: the parenthetical about the skills restructure marker removed
<generated harness routes for the skill above>                           [G] `HARNESS-GENERATE`
plans/
├── backlog/README.md, in-progress/README.md, done/README.md             [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-07-erp-courses/
    ├── delivery.md, learnings.md                                        [E] ticks and entries
    ├── syllabus/courses/<30 slugs>.md                                   [E] slice S0 expansion of each course's example section
    └── evidence/                                                        [G]
        ├── phase-*.md, *.png                                            [G]
        ├── execution-summary.md                                         [G] the ledger table (no scratch paths), committed
        └── aaoifi-url-register.md                                       [G] one row per distinct AAOIFI URL, with course and file
```

## Counts and PR Size

| Item                                | Estimate                                                                                                       | Basis                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Example units                       | 1,788 (1,404 By Example plus at least 384 Annotated-Concept)                                                   | [003](./003-definition-of-done-and-targets.md#targets)                        |
| Kata units                          | 204 (18 × 8 plus 12 × 5)                                                                                       | Same                                                                          |
| Capstone units                      | 30                                                                                                             | One per course                                                                |
| Files in the PR                     | About 8,000: about 6,300 example-unit files (3 to 4 per unit), 1,000 kata files, 240 capstone files, 460 pages | Planning estimate; the actual count goes into `<plan>/evidence/phase-7-pr.md` |
| Files edited outside course folders | About 40, plus the tests and specs above                                                                       | The tree above                                                                |

The PR is far above the size reviewers prefer, on purpose ([D12](./009-decision-records.md#d12--one-pr-for-the-whole-plan));
the mitigations are the checkpoint pushes and the gate reports.

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The 24 accounting courses and the two accounting manifests (plan 06), the eight capstone courses (plan 08), and
  the career manifests.
- `apps/ayokoding-cli/**` (plan 05's, with plan 06's `psql` entry). A defect found in the harness is fixed at its
  root there with a regression test only if it blocks this plan (M11 of plan 05's migration contract); otherwise
  it is reported as a follow-up.
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml`: never committed; restored if the dev server or a
  tool rewrites them.
- `.env.prod`, `.env.stag`, and every other `.env*` file.
- Plan 06's rule module `sharia-content.md`: read, not edited (an edit is a change request routed to plan 06's
  owner, which in practice means a follow-up).

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and its bounded contexts. This plan adds
no container, component responsibility, relationship, or boundary: it changes content and data, and removes
code. The C4 reconciliation in [the delivery](../delivery.md#phase-6-rule-impact-and-docs-propagation) therefore
records "no change" with this reason, after reading the as-built document and any C4 document plan 05 added for
`ayokoding-cli`, and edits the file only if it describes the marker mechanism this plan deletes.
