# 010 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by
hand). Plans 02, 03, 04, and 05 create some of the edited files; Phase 0 confirms each exists on
`origin/main` under the name shown, and records any difference in the merged-name map.

## Tree

```text
apps/
├── ayokoding-www/
│   ├── content/en/learn/
│   │   ├── courses/<each of the 8 capstone slugs>/
│   │   │   ├── _index.md                                              [E] frontmatter (status removed, format, estimatedHours, prerequisites); body [G]
│   │   │   ├── overview.md                                            [E] rewritten (## Safety boundary in three courses; ends with ## References)
│   │   │   ├── learning/
│   │   │   │   ├── _index.md                                          [G]
│   │   │   │   ├── overview.md                                        [N] prerequisites, relies-on table, big idea, mode sentence, theme list
│   │   │   │   ├── theme-a-<slug>.md … theme-e-<slug>.md              [N] 5 pages for 7 courses; theme-a … theme-d for the no-code course
│   │   │   │   ├── capstone/
│   │   │   │   │   ├── _index.md                                      [G]
│   │   │   │   │   ├── overview.md                                    [E] rewritten: the six contract headings
│   │   │   │   │   └── code/**                                        [N] one capstone unit with run.yaml, reference solution, tests, expected/ (not in the no-code course)
│   │   │   │   └── code/ex-NN-<slug>/**                               [N] one unit per worked example (not in the no-code course)
│   │   │   └── drilling/
│   │   │       ├── _index.md                                          [G]
│   │   │       ├── overview.md                                        [E] rewritten: the five drill sections
│   │   │       └── code/kata-NN-<slug>/{before,after}/**, run.yaml    [N] not in the no-code course
│   │   └── paths/careers/immediately-effective/ai-engineer/_index.md   [E] description and body
│   ├── src/features/course-paths/manifests/
│   │   ├── careers/immediately-effective/ai-engineer.json             [E] goals, four core phases, assumes, five extension phases
│   │   └── README.md                                                  [E] every career path declares a goal
│   └── tests/unit/
│       ├── be-steps/capstone-course-completion.steps.ts               [N] the nine scenarios
│       ├── fe-steps/career-path-goals.steps.ts                        [N] the two scenarios
│       ├── fe-steps/course-landing-header.steps.tsx                   [E] only if Phase 0 finds the Start-fallback proof is not fixture-based
│       ├── fe-steps/<steps for the outline-anchored scenarios>        [E] only where a fixture-course proof must be added first (Phase 0)
│       └── features/course-paths/manifests/
│           ├── legacy-membership.ts                                   [E] AI array gains two IDs, with a comment
│           └── careers/
│               ├── careers-ai-manifest.unit.test.ts                   [E] goal, core size and order, assumes, phase ids
│               └── career-goals.unit.test.ts                          [N] every career manifest has a goal
├── ayokoding-www-fe-e2e/tests/e2e/steps/
│   ├── course-landing-header.steps.ts                                 [E] remove the Start-fallback step bound to capstone-data-pipeline
│   └── <steps that open a real outline course>                        [E] removed or re-pointed (found in Phase 0; plans 02–04)
└── ayokoding-cli/                                                      (only if the CI ladder reaches rung 2; see 004)
    ├── internal/domain/selection/<shard-count rule and its test>      [E] count units, not courses
    └── README.md                                                      [E] the shard-count rule
.github/workflows/
├── pr-quality-gate.yml                                                [E] only for rung 2, if the count is made in the workflow step
└── _reusable-ayokoding-www-examples-check.yml                         [E] only for rung 3: `since` timeout 60 → 120, with a comment
specs/apps/ayokoding/www/behaviours/
├── backend/content/capstone-course-completion.feature                 [N] 9 scenarios, all @integration-exempt @e2e-exempt
├── backend/content/README.md                                          [E] list the new feature
├── frontend/course-paths/career-path-goals.feature                    [N] 2 scenarios, both exempt
├── frontend/course-paths/course-landing-header.feature                [E] plan 03's file: the E2E exemption on "Start falls back to the first learning page"
├── frontend/course-paths/<features with outline-anchored scenarios>  [E] an exemption pair each (plans 02–04; found in Phase 0)
└── frontend/course-paths/README.md                                    [E] list the new feature and the exemptions
.agents/skills/apps-ayokoding-www-developing-content/
├── SKILL.md                                                           [E] link the capstone module
├── reference/README.md                                                [E] index entry
└── reference/capstone-courses.md                                      [N] rules CC1–CC7 (and CG1 if plan 02's module is absent)
.agents/skills/apps-ayokoding-www-authoring-annotated-concept/          [E] two reference files: the capstone declaration clause
<generated harness routes for the skills above>                        [G] from `./rhino harness adapters generate`
repo-governance/development/quality/gate-adapters/
├── ayokoding-www.md                                                   [E] one "Capstone courses" bullet
└── ayokoding-www/tutorial-kinds.md                                    [E] one sentence in the Annotated Concept Mode bullet
plans/
├── backlog/README.md, in-progress/README.md, done/README.md           [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-08-capstone-courses/
    ├── delivery.md, learnings.md                                      [E] ticks, header line, entries
    └── evidence/                                                      [N]
        ├── phase-*.md, *.png                                          [N]
        ├── closure-recompute.md, ci-projection.md                     [N] Phase 0 records, updated by later phases
        └── execution-summary.md                                       [N] the ledger table, committed
```

The 8 course folders hold about 358 code units in 7 courses, written by `swe-developer` and the
annotated-concept maker; the exact file lists are the courses' own content and are not repeated here.
The unit counts per course are in [004](./004-code-harness-and-determinism-design.md#units-per-course).

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The five capstones that are not skeletons: `capstone-first-working-software`, `capstone-forge-ready`,
  `capstone-full-stack-app`, `capstone-interview-loop`, and `capstone-solid-core`. Plans 11–13 own them.
  Their `format: capstone` backfill (plan 03) is already in place.
- The other three career manifests, the four skills manifests, and every course not named above. A
  prerequisite edit on a capstone (the nine edge changes in
  [003](./003-prerequisites-readiness-and-ordering.md#prerequisite-rubric-re-run)) changes only that
  capstone's own `_index.md`.
- The product code for the outline status, the Outline badge, plan 02's integrity rules, and plan 03's
  Start-button logic. Only their real-content proofs move (see
  [006](./006-e2e-rebinding-and-testing-strategy.md)).
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev
  server or a tool rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev
  server needs one.
- `local-tmp/ayokoding-learn/execution-ledger.md` and the gate reports under `generated-reports/` are
  working files and are not committed; the committed record is `evidence/execution-summary.md`.

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts. This
plan adds no container, component responsibility, relationship, or boundary: it adds course content and
code units, changes one manifest, edits path-page copy, and adds test files. The C4 reconciliation in
[../delivery.md](../delivery.md) therefore records "no change" with this reason, after reading the
as-built document and any C4 document plan 05 added for `ayokoding-cli`. If rung 2 changes the CLI's shard
rule, that is a change inside an existing element, not a new one.
