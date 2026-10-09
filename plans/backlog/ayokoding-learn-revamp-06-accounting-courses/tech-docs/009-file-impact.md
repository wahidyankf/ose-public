# 009 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by
hand). Plans 02, 03, and 05 create some of the edited files; Phase 0 confirms each exists on
`origin/main` under the name shown, and records any difference.

## Tree

```text
apps/
├── ayokoding-cli/
│   ├── toolchains/catalog.yaml                                        [E] add the `psql` language entry (D14)
│   └── tests/
│       ├── testdata/courses/<psql-fixture-course>/learning/code/ex-01-<slug>/  [N] fixture unit: main.sql, run.yaml, expected output
│       └── <toolchain smoke table, as named by plan 05>               [E] one row for `psql`
├── ayokoding-www/
│   ├── content/en/learn/
│   │   ├── courses/<each of the 24 accounting slugs>/
│   │   │   ├── _index.md                                              [E] frontmatter (status removed, format, estimatedHours, prerequisites, weight for two courses); body [G]
│   │   │   ├── overview.md                                            [E] rewritten
│   │   │   ├── learning/
│   │   │   │   ├── _index.md                                          [G]
│   │   │   │   ├── overview.md                                        [E] rewritten
│   │   │   │   ├── beginner.md, intermediate.md, advanced.md          [N] By Example courses
│   │   │   │   ├── theme-a-<slug>.md … theme-e-<slug>.md              [N] Annotated Concept courses
│   │   │   │   ├── capstone/{_index.md [G], overview.md [N], code/** [N]}
│   │   │   │   └── code/
│   │   │   │       ├── ex-NN-<slug>/**                                [N] one unit per code-bearing example
│   │   │   │       └── requirements.in, requirements.lock             [N] database courses only
│   │   │   └── drilling/
│   │   │       ├── _index.md                                          [G]
│   │   │       ├── overview.md                                        [E] rewritten
│   │   │       └── code/kata-NN-<slug>/{before,after}/**, run.yaml    [N]
│   │   └── paths/skills/
│   │       ├── _index.md                                              [E] description
│   │       ├── conventional-accounting/_index.md                      [E] description and body
│   │       └── sharia-accounting/_index.md                            [E] description and body
│   ├── src/
│   │   ├── app/[locale]/(content)/[...slug]/page.tsx                  [E] skills hub strapline
│   │   └── features/course-paths/
│   │       ├── core/schemas.ts                                        [E] marker enum narrowed to "plan-07"
│   │       ├── core/skills-restructure-allowlist.ts                   [E] two accounting entries removed
│   │       ├── manifests/skills/conventional-accounting.json          [E] phases, outcomes, assumes, no marker
│   │       ├── manifests/skills/sharia-accounting.json                [E] same
│   │       ├── manifests/README.md                                    [E] docs: accounting paths restructured
│   │       ├── shell/category-landing.tsx                             [E] statement; strip removed
│   │       └── shell/ramp-milestone-strip.tsx                         [D]
│   └── tests/
│       ├── unit/be-steps/accounting-course-completion.steps.ts       [N]
│       ├── unit/fe-steps/skills-fixed-arc-statement.steps.tsx        [E]
│       ├── unit/fe-steps/path-copy.steps.ts                           [E]
│       ├── unit/features/course-paths/
│       │   ├── content/path-copy.unit.test.ts                         [E] scope widened
│       │   ├── core/schemas.test.ts                                   [E]
│       │   ├── core/skills-restructure-allowlist.test.ts              [E]
│       │   ├── manifests/skills/conventional-accounting-manifest.unit.test.ts  [E]
│       │   ├── manifests/skills/sharia-accounting-manifest.unit.test.ts        [E]
│       │   ├── manifests/skills/skills-path-composition.unit.test.ts           [E]
│       │   ├── manifests/skills-order.unit.test.ts, legacy-skills-order.ts     [E] only if they iterate frozen keys
│       │   ├── shell/category-landing.test.tsx                        [E]
│       │   └── shell/ramp-milestone-strip.test.tsx                    [D]
│       └── integration/fe-steps/skills-path-composition.steps.ts     [E]
└── ayokoding-www-fe-e2e/tests/e2e/steps/
    ├── course-paths.steps.ts                                          [E] statement step; no-strip step
    └── <steps that use an accounting course as a real outline>        [E] re-pointed (D16; found in Phase 0)
specs/apps/ayokoding/www/behaviours/
├── backend/content/accounting-course-completion.feature               [N]
├── backend/content/README.md                                          [E] list the new feature
├── frontend/course-paths/skills-fixed-arc-statement.feature           [E]
├── frontend/course-paths/skills-path-composition.feature              [E]
├── frontend/course-paths/path-copy.feature                            [E] (plan 02's file)
└── frontend/course-paths/README.md                                    [E] feature list and the ramp wording
.agents/skills/apps-ayokoding-www-developing-content/
├── SKILL.md                                                           [E] link the Sharia module; tree-shape summary
├── reference/README.md                                                [E] index entry
├── reference/sharia-content.md                                        [N] rules SC1–SC8 (D9)
└── reference/canonical-content-tree-shape.md                          [E] course layout (D15)
<generated harness routes for the skill above>                         [G] from `./rhino harness adapters generate`
repo-governance/development/quality/gate-adapters/ayokoding-www.md     [E] tree-shape bullet (D15); pointer to the Sharia module
plans/
├── backlog/README.md, in-progress/README.md, done/README.md           [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-06-accounting-courses/
    ├── delivery.md, learnings.md                                      [E] ticks and entries
    └── evidence/                                                      [N]
        ├── phase-*.md, *.png                                          [N]
        ├── execution-summary.md                                       [N] the ledger table, committed
        └── aaoifi-url-register.md                                     [N] one row per AAOIFI URL
```

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The ERP and capstone courses, the ERP manifests, and the career manifests.
- Plan 04's roadmap code (the flat branch for marked paths stays for the ERP paths).
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev
  server or a tool rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev
  server needs one.

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts.
This plan adds no container, component responsibility, relationship, or boundary: it changes content
and data, removes one presentational component, and adds one toolchain entry to the harness catalog
(data inside `ayokoding-cli`, not a new element). The C4 reconciliation in [../delivery.md](../delivery.md)
therefore records "no change" with this reason, after reading the as-built document and any C4
document plan 05 added for `ayokoding-cli`.
