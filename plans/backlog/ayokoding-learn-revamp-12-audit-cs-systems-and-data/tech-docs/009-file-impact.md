# 009 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by hand), and
`[C]` conditional (made only if the stated trigger fires). Plans 02, 03, 05, 06, 08, 09, and 11 create some of the
edited files; Phase 0 confirms each exists on `origin/main` under the name shown, and records any difference.

## Tree

```text
apps/
├── ayokoding-www/
│   ├── content/en/learn/courses/<each of the 34 slugs>/
│   │   ├── _index.md                                                      [E] frontmatter only: prerequisites (if CP-1 changes them), estimatedHours
│   │   ├── overview.md                                                    [E] scope sentence, honest boundaries
│   │   ├── learning/
│   │   │   ├── overview.md                                                [E] "Examples by Level" (8 By Example courses lack it), mode declaration, scope sentence
│   │   │   ├── *.md (beginner, intermediate, advanced, or themed pages)   [E] lessons: anchors, Why It Matters, annotations, diagrams
│   │   │   ├── *.md                                                       [N] new pages where a word floor needs them (14 courses)
│   │   │   ├── capstone/{overview.md [E or N], code/** [N or E]}          capstone-solid-core only
│   │   │   └── code/
│   │   │       ├── ex-NN-<slug>/**                                       [N] 712 units to author and 2,151 to convert across the plan (see 001)
│   │   │       ├── ex-NN-<slug>/run.yaml, expected/*.txt                 [N] one pair per unit, recorded after reading
│   │   │       └── requirements.in, requirements.lock                    [N] 16 Python courses with third-party packages (hash-locked)
│   │   └── drilling/
│   │       ├── overview.md                                                [E] five standard sections, 5,000 words
│   │       └── code/kata-NN-<slug>/{before,after}/**, run.yaml            [N or E]
│   ├── content/en/learn/courses/capstone-solid-core/code/**               [D] the 35 root files move under the unit folders; no top-level code/ remains
│   ├── src/features/content/core/course-filler-baseline.ts                [E] six entries removed and the cap lowered by six (plan 09's file)
│   └── tests/unit/be-steps/
│       ├── audited-courses.ts                                             [E] 34 rows (plan 11's registry), one per course, in the course's commit
│       ├── audited-course-completion.steps.ts                             [E] the ninth scenario's step and the 34-slug constant; a `capstone` floors row if missing
│       └── <plan 08's capstone content-shape step file, as merged>        [C] a CC6 shared-copy row, or the slug in a by-name list (006)
├── ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json   [C] only on the AI-core exception (006)
├── ayokoding-www/content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md            [C] same trigger
├── ayokoding-www/tests/unit/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts   [C] same trigger
└── ayokoding-cli/
    ├── toolchains/
    │   ├── <catalog file, as merged>                                      [E] seven entries (valkey, mongodb, cassandra, dynamodb-local, timescaledb, gremlin, neo4j-gds), each only if its spike passes
    │   ├── gremlin/Dockerfile, neo4j-gds/Dockerfile                       [N] derived images; downloads checked by SHA-256
    │   └── <smoke table and fixture course units, as merged>              [E] one fixture unit and one smoke row per added id
    ├── internal/selection/ (expected path; Phase 1 finds it)              [C] rung 2t (toolchain-aware selection) and rung 2d (unit-level split), tests first
    ├── internal/shard/ or the `--shard` code (expected; Phase 1 finds it) [C] rungs 2b and 2c if plan 11 did not merge them
    └── README.md                                                          [C] the selection and shard rules, if changed
specs/apps/ayokoding/www/behaviours/backend/content/
├── audited-course-completion.feature                                      [E] the ninth scenario (Gherkin first)
└── README.md                                                              [C] only if plan 11 did not list the feature
specs/apps/ayokoding/cli/<plan 05's selection feature, as merged>          [C] two scenarios if rung 2t or 2d is built (see the PRD)
.github/workflows/
├── pr-quality-gate.yml                                                    [C] the `examples-plan` job's shard rule (rung 2b), if not merged by plan 11
└── _reusable-ayokoding-www-examples-check.yml                             [C] `since` timeout 60 to 120 (rung 3), if not merged by plan 11
.agents/skills/apps-ayokoding-www-developing-content/reference/
└── code-example-harness.md                                                [E] rules AU1, AU2, AU3 beside plan 05's determinism and service sections
<generated harness routes for the skill above>                             [G] from `./rhino harness adapters generate`, if any change
repo-governance/development/quality/gate-adapters/ayokoding-www.md        [E] extend the existing "Example Harness" pointer by one clause for AU1 to AU3
plans/
├── backlog/README.md, in-progress/README.md, done/README.md               [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-12-audit-cs-systems-and-data/
    ├── delivery.md, learnings.md                                          [E] ticks and entries
    └── evidence/                                                          [N]
        ├── phase-*.md, *.png                                              [N]
        ├── harness-measurements.md                                        [N] spike seconds, shard table, ladder rungs
        └── execution-summary.md                                           [N] the ledger table and the coverage report, committed
```

The 34 course folders hold about 367 lesson pages and indexes and 3,566 code files today; the plan adds pages where a word
floor needs them (for example the five theme pages and the capstone page of `capstone-solid-core`, which is one
page today). The count of changed files is a planning estimate of 9,000 to 11,000
([005](./005-execution-model-waves-and-ledger.md#commits-and-checkpoint-pushes)).

## What Each Course Commit Contains

| Path                                                                     | Always?                            | Why                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------- |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/**`                  | yes                                | The audited course                                                          |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`           | yes                                | `estimatedHours`, and `prerequisites` if CP-1 changed them                  |
| `apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts`              | yes                                | The course's registry row, committed GREEN                                  |
| `apps/ayokoding-www/src/features/content/core/course-filler-baseline.ts` | six courses                        | Remove the entry and lower the cap (plan 09's ratchet)                      |
| The AI manifest and its test                                             | only on the AI-1 exception         | The closure changed and the user chose to update the manifest (006)         |
| Plan 08's capstone step file                                             | `capstone-solid-core`, if needed   | A CC6 row, or the slug in a by-name list                                    |
| Regenerated `_index.md` files that belong to the course                  | when index generation changes them | Indexes are regenerated by the coordinator once per wave, never by an agent |

The toolchain additions (`apps/ayokoding-cli/toolchains/`) are one early commit of their own, and each rung of the CI
ladder is one commit of its own with its test; none is part of a course commit.

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The courses that other plans own: plan 11's 32, plan 13's courses, the accounting and ERP courses, the eight
  capstones of plan 08, and the courses plans 09 and 10 write.
- Every path manifest and path page, except the AI exception above.
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev server or a tool
  rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev server needs
  one.
- Plan 09's `clojure` entry and the `java` jar recipe, and `REWRITTEN_FILLER_COURSES` (decision D12).
- `plans/backlog/README.md` entries for other plans, and every other plan's files.

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts. This plan adds no
container, component responsibility, relationship, or boundary: it changes content and data, adds catalog entries
(data) and two selection behaviours to the CLI's existing selection component, and edits test-support code. The C4
reconciliation in [../delivery.md](../delivery.md) therefore records "no change" with this reason, after reading the
as-built document and any C4 document plan 05 added for `ayokoding-cli`. If rung 2t changes how the CLI's
`examples affected` component decides what to run in a way that document describes, the sentence in the document is
updated in the same commit and the reconciliation records that instead.
