# 009 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by hand),
and `[C]` conditional (made only if the stated trigger fires). Plans 02, 03, 05, 06, 08, and 09 create some of
the edited files; Phase 0 confirms each exists on `origin/main` under the name shown, and records any
difference.

## Tree

```text
apps/
├── ayokoding-www/
│   ├── content/en/learn/courses/<each of the 32 slugs>/
│   │   ├── _index.md                                                      [E] frontmatter only: prerequisites (if CP-1 changes them), estimatedHours
│   │   ├── overview.md                                                    [E] scope sentence, honest boundaries
│   │   ├── learning/
│   │   │   ├── overview.md                                                [E] "Examples by Level", scope and dependents sentences
│   │   │   ├── *.md (beginner, intermediate, advanced, or themed pages)   [E] lessons: anchors, Why It Matters, annotations, diagrams
│   │   │   ├── *.md                                                       [N] new pages where a word floor needs them
│   │   │   ├── capstone/{overview.md [E], code/** [N or E]}               code courses
│   │   │   └── code/
│   │   │       ├── ex-NN-<slug>/**                                       [N] 826 units to create across the plan (see 003)
│   │   │       └── ex-NN-<slug>/run.yaml, expected/*.txt                 [N] for the 1,745 units to convert, plus code edits [E]
│   │   └── drilling/
│   │       ├── overview.md                                                [E] five standard sections, 5,000 words
│   │       └── code/kata-NN-<slug>/{before,after}/**, run.yaml            [N or E]
│   ├── src/features/content/core/course-filler-baseline.ts                [E] five entries removed and the cap lowered by five (plan 09's file)
│   └── tests/unit/be-steps/
│       ├── audited-course-completion.steps.ts                             [N]
│       └── audited-courses.ts                                             [N] registry, one row per course
├── ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json   [C] only on the AI-core exception (005)
├── ayokoding-www/content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md            [C] same trigger
├── ayokoding-www/tests/unit/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts   [C] same trigger
├── ayokoding-cli/                                                          [C] rungs 2b and 2c: the shard-count or split rule and its Go test (M11)
│   └── README.md                                                          [C] the shard rule, if changed
specs/apps/ayokoding/www/behaviours/backend/content/
├── audited-course-completion.feature                                      [N]
└── README.md                                                              [E] list the new feature
specs/apps/ayokoding/cli/<plan 05's selection feature, as merged>          [C] two scenarios if rung 2b or 2c triggers
.github/workflows/
├── pr-quality-gate.yml                                                    [C] the `examples-plan` job's shard rule (rung 2b)
└── _reusable-ayokoding-www-examples-check.yml                             [C] `since` timeout 60 to 120 (rung 3)
.agents/skills/apps-ayokoding-www-developing-content/reference/
├── code-example-harness.md                                                [E] rule TC1 beside the illustration rule (plan 05's module)
└── course-quality-guards.md                                               [E] rule TC2 beside FILL1 and FILL2 (plan 09's module)
<generated harness routes for the skill above>                             [G] from `./rhino harness adapters generate`
repo-governance/development/quality/gate-adapters/ayokoding-www.md        [E] extend the existing pointer sentences for TC1 and TC2
plans/
├── backlog/README.md, in-progress/README.md, done/README.md               [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-11-audit-languages-and-tooling/
    ├── delivery.md, learnings.md                                          [E] ticks and entries
    └── evidence/                                                          [N]
        ├── phase-*.md, *.png                                              [N]
        ├── harness-measurements.md                                        [N] spike seconds, shard table, ladder rungs
        └── execution-summary.md                                           [N] the ledger table and the coverage report, committed
```

The 32 course folders hold about 249 Markdown files today; the plan adds pages where a word floor needs them
(for example the capstone of `capstone-forge-ready`, which is one page today). The count of changed files is a
planning estimate of 8,000 to 10,000 ([006](./006-execution-model.md#commits-and-checkpoint-pushes)).

## What Each Course Commit Contains

| Path                                                                     | Always?                            | Why                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------- |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/**`                  | yes                                | The audited course                                                          |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`           | yes                                | `estimatedHours`, and `prerequisites` if CP-1 changed them                  |
| `apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts`              | yes                                | The course's registry row, committed GREEN                                  |
| `apps/ayokoding-www/src/features/content/core/course-filler-baseline.ts` | five courses                       | Remove the entry and lower the cap (plan 09's ratchet)                      |
| Regenerated `_index.md` files that belong to the course                  | when index generation changes them | Indexes are regenerated by the coordinator once per wave, never by an agent |

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The other courses that plans 12 and 13 audit, the accounting and ERP courses, the capstones, and the
  courses plans 09 and 10 write.
- Every path manifest and path page, except the AI exception above.
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev server
  or a tool rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev server
  needs one.
- `apps/ayokoding-cli/toolchains/` (no toolchain is added by default; decision D9).

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts. This plan
adds no container, component responsibility, relationship, or boundary: it changes content and data, adds one
test-support file, and, only if a rung of the CI ladder triggers, changes a shard count or timeout in existing
workflow and CLI code. The C4 reconciliation in [../delivery.md](../delivery.md) therefore records "no change"
with this reason, after reading the as-built document and any C4 document plan 05 added for `ayokoding-cli`.
