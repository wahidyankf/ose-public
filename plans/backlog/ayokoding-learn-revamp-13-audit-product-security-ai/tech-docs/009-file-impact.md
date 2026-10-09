# 009 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by hand), and `[C]`
conditional (made only if the stated trigger fires). Plans 02, 03, 05, 06, 08, 09, 11, and 12 create some of the edited
files; Phase 0 confirms each exists on `origin/main` under the name shown, and records any difference.

## Tree

```text
apps/
├── ayokoding-www/
│   ├── content/en/learn/courses/<each of the 45 slugs>/
│   │   ├── _index.md                                                      [E] frontmatter only: prerequisites (if CP-1 changes them), estimatedHours, format (two interview courses)
│   │   ├── overview.md                                                    [E] scope sentence, honest boundaries; for `capstone-first-working-software` also ## Safety boundary
│   │   ├── learning/
│   │   │   ├── overview.md                                                [E] "Examples by Level", scope sentence, relies-on table for a capstone; ## Safety boundary for the five safety-scanned courses that are not capstones
│   │   │   ├── *.md (beginner, intermediate, advanced, or themed pages)   [E] lessons: anchors, Why It Matters, annotations, diagrams
│   │   │   ├── *.md                                                       [N] new pages where a word floor needs them; whole new learning/ folder for two capstones
│   │   │   ├── capstone/{overview.md [E or N], code/** [N or E]}          code courses
│   │   │   └── code/
│   │   │       ├── ex-NN-<slug>/**                                       [N] 1,007 units to create across the plan (see 003)
│   │   │       ├── ex-NN-<slug>/run.yaml, expected/*.txt                 [N] for the units to convert, plus code edits [E]
│   │   │       ├── fake_model.py (or the course's own kit)               [N] 13 AI courses: scripted model, one per course (policy AI2, AI5)
│   │   │       └── requirements.lock, package-lock.json, pubspec.lock    [N] hash-locked dependencies per course that needs them (plan 05's contract)
│   │   ├── drilling/
│   │   │   ├── overview.md                                                [E] five standard sections, 5,000 words
│   │   │   └── code/kata-NN-<slug>/{before,after}/**, run.yaml            [N or E]
│   │   └── pyrightconfig.json, ruff.toml, requirements.txt (course root)  [E or D] moved under learning/code/ if a check run uses them, otherwise deleted
│   ├── content/en/learn/courses/capstone-*/learning/overview.md          [E] a stale relies-on row (CP-7), only where one is stale
│   ├── content/en/learn/courses/capstone-full-stack-app/learning/code/contract/openapi.json   [N] plus a byte-identical copy in the TypeScript example units (decision D8)
│   ├── src/features/content/core/course-filler-baseline.ts                [E] six entries removed and the cap lowered by six (plan 09's file); empty at the end
│   ├── src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json   [C] only on the AI-core exception (005)
│   └── tests/unit/
│       ├── be-steps/
│       │   ├── audited-course-completion.steps.ts                         [E] tenth scenario; floors rows for `capstone` or `annotated-concept-no-code` if the merged table lacks them
│       │   ├── audited-courses.ts                                         [E] 45 registry rows, one per course commit (plan 11 created the file)
│       │   ├── capstone-course-completion.steps.ts                        [E] three slugs added to plan 08's constant; one byte-identity pair for the full-stack contract (plan 08's file)
│       │   ├── course-content-safety.steps.ts                             [N] four scenarios of the safety feature
│       │   ├── course-safety-scan.ts                                      [N] scanner, scope constants, banned lists, exceptions list (test support)
│       │   └── course-safety-scan.unit.test.ts                            [N] scanner and exceptions helper tests (RED/GREEN)
│       ├── fe-steps/course-landing-header.steps.tsx                       [C] a fixture-based proof if the merged Unit binding is not fixture-based
│       └── features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts   [C] same trigger as the AI manifest
├── ayokoding-www/content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md   [C] same trigger
├── ayokoding-www-fe-e2e/tests/e2e/steps/course-landing-header.steps.ts   [C] shape-3 step removed (or rebound) when the last course without a learning/ folder gains one
├── ayokoding-cli/                                                          [C] rungs 2b, 2c, 2t, 2d: the shard-count, split, or selection rule and its Go test (M11), only if not already merged
│   └── README.md                                                          [C] the shard rule, if changed
specs/apps/ayokoding/www/behaviours/
├── backend/content/
│   ├── audited-course-completion.feature                                  [E] tenth scenario
│   ├── course-content-safety.feature                                      [N] four scenarios
│   └── README.md                                                          [E] list the new feature
└── frontend/course-paths/course-landing-header.feature                    [C] exemption tags on the shape-3 scenario, if no course without a learning/ folder remains
specs/apps/ayokoding/cli/<plan 05's selection feature, as merged>          [C] two scenarios if a rung triggers
.github/workflows/
├── pr-quality-gate.yml                                                    [C] the `examples-plan` job's shard rule (rung 2b, 2t, or 2d)
└── _reusable-ayokoding-www-examples-check.yml                             [C] `since` timeout 60 to 120 (rung 3)
.agents/skills/apps-ayokoding-www-developing-content/reference/
├── code-example-harness.md                                                [E] rules AF1 and AF2 beside TC1 (plan 05's module, plan 11's rule)
└── course-quality-guards.md                                               [E] rules SF1 and SF2 beside FILL1, FILL2, SEC1, and TC2 (plan 09's module)
<generated harness routes for the skill above>                             [G] from `./rhino harness adapters generate`
repo-governance/development/quality/gate-adapters/ayokoding-www.md        [E] extend the existing pointer sentences for AF1, AF2, SF1, and SF2
plans/
├── backlog/README.md, in-progress/README.md, done/README.md               [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-13-audit-product-security-ai/
    ├── delivery.md, learnings.md                                          [E] ticks and entries
    └── evidence/                                                          [N]
        ├── phase-*.md, *.png                                              [N]
        ├── harness-measurements.md                                        [N] spike seconds, shard table, ladder rungs
        ├── phase-9-coverage.json                                          [N] the coverage report for the series gate
        └── execution-summary.md                                           [N] the ledger tables and the coverage report, committed
```

The 45 course folders hold about 582 Markdown files today; the plan adds pages where a word floor needs them
(for example the whole `learning/` folder of two capstones, and the lesson pages of `agent-context-and-memory`). The
count of changed files is a planning estimate of 9,000 to 11,000
([006](./006-execution-model.md#commits-and-checkpoint-pushes)).

## What Each Course Commit Contains

| Path                                                                          | Always?                                                            | Why                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/**`                       | yes                                                                | The audited course                                                                                 |
| `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`                | yes                                                                | `estimatedHours`, `prerequisites` if CP-1 changed them, and `format` for the two corrected courses |
| `apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts`                   | yes                                                                | The course's registry row, committed GREEN                                                         |
| `apps/ayokoding-www/src/features/content/core/course-filler-baseline.ts`      | six courses                                                        | Remove the entry and lower the cap (plan 09's ratchet)                                             |
| `apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md` | where a relies-on row was stale                                    | The corrected row and the paragraph that restates it (CP-7)                                        |
| `apps/ayokoding-www/tests/unit/be-steps/capstone-course-completion.steps.ts`  | the three capstones                                                | The slug added to plan 08's constant; for `capstone-full-stack-app` also the byte-identity pair    |
| `specs/.../course-landing-header.feature` and the E2E steps file              | `capstone-first-working-software` (if the exemption path is taken) | The shape-3 exemption and the removal of the E2E step                                              |
| Regenerated `_index.md` files that belong to the course                       | when index generation changes them                                 | Indexes are regenerated by the coordinator once per wave, never by an agent                        |

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The courses that plans 11 and 12 audit, the accounting and ERP courses, the capstones that plan 08 wrote (except a
  relies-on row), and the courses plans 09 and 10 write.
- Every path manifest and path page, except the AI exception above.
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev server or a tool
  rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev server needs
  one.
- `apps/ayokoding-cli/toolchains/` (no toolchain is added by default; decision D9).
- Plan 09's feature file `filler-course-completion.feature` and its step file (the reserved-address rule reaches the new
  courses through this plan's own feature).

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts. This plan adds no
container, component responsibility, relationship, or boundary: it changes content and data, adds test-support files,
and, only if a rung of the CI ladder triggers, changes a shard count, selection rule, or timeout in existing workflow
and CLI code. The C4 reconciliation in [../delivery.md](../delivery.md) therefore records "no change" with this reason,
after reading the as-built document and any C4 document plan 05 added for `ayokoding-cli`.
