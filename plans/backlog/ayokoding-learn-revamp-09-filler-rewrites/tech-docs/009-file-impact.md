# 009 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by hand).
Plans 03 and 05 create some of the edited files; Phase 0 confirms each exists on `origin/main` under the name
shown, and records any difference.

## Tree

```text
apps/
├── ayokoding-cli/
│   ├── toolchains/catalog.yaml                                              [E] add the `clojure` entry (D6); give `java` an `install` recipe and a `build` (D5)
│   ├── toolchains/clojure/Dockerfile                                        [N] derived image: Temurin 25 plus three jars, SHA-256-checked downloads, wrapper
│   ├── toolchains/java/Dockerfile                                           [N] derived image: Temurin 25 plus the embedded JarFetch tool
│   ├── toolchains/java/JarFetch.java                                        [N] about sixty lines: read the lock, download, verify SHA-256
│   └── tests/
│       ├── testdata/toolchain-smoke/<clojure and java smoke courses>/       [N] one unit each: a sorted-map print; two locked jars compiled against
│       └── <toolchain smoke table, as named by plan 05>                     [E] two rows
├── ayokoding-www/
│   ├── content/en/learn/courses/<each of the 8 slugs>/
│   │   ├── _index.md                                                        [E] frontmatter (prerequisites, estimatedHours; format, category, description only if plan 03 differs); body [G]
│   │   ├── overview.md                                                      [E] rewritten (the two security courses keep `## Legacy relation`)
│   │   ├── learning/
│   │   │   ├── _index.md                                                    [G]
│   │   │   ├── overview.md                                                  [E] concepts, Examples by Level, how to run
│   │   │   ├── beginner.md, intermediate.md, advanced.md                    [E] rewritten
│   │   │   ├── capstone/
│   │   │   │   ├── _index.md                                                [G]
│   │   │   │   ├── overview.md                                              [E] rewritten (absorbs ir-report.md and verify.md)
│   │   │   │   └── code/**                                                  [N] one harness unit with run.yaml
│   │   │   └── code/
│   │   │       ├── ex-NN-<slug>/**                                          [N] one unit per example (illustrations excepted)
│   │   │       ├── <shared files>                                           [N] fixtures, vectors, lock files
│   │   │       ├── README.md                                                [D] six templated courses
│   │   │       └── <old flat lab files>                                     [D] the two security courses' scripts and fixtures, replaced by units
│   │   └── drilling/
│   │       ├── _index.md                                                    [G]
│   │       ├── overview.md                                                  [E] rewritten
│   │       └── code/kata-NN-<slug>/{before,after}/**                        [N] eight katas, each with run.yaml
│   │   (`learning/code/ex-NN-<old-slug>/**`, the old unit folders)          [D] replaced by new folders
│   │   (`learning/capstone/{ir-report.md,verify.md}`, vulnerability `learning/capstone/*.py` beside the page) [D] moved or folded
│   ├── src/features/content/
│   │   ├── core/course-filler.ts                                            [N] pure: thresholds, normalizers, shingles, clusters, boilerplate, `evaluateCourse`
│   │   ├── core/course-filler-baseline.ts                                   [N] pure data: `FILLER_BASELINE` (25, then 17), cap, `REWRITTEN_FILLER_COURSES`
│   │   └── shell/course-filler-scan.ts                                      [N] `scanCourseFiller`, `formatFillerReport`
│   └── tests/unit/
│       ├── be-steps/course-filler.steps.ts                                  [N] binds course-filler-guard.feature
│       ├── be-steps/filler-course-completion.steps.ts                       [N] binds filler-course-completion.feature
│       ├── be-steps/support/course-completion-checks.ts                     [N] test helper functions
│       ├── be-steps/support/course-completion-checks.unit.test.ts           [N] helper tests on temp folders
│       ├── features/content/core/course-filler.test.ts                      [N]
│       ├── features/content/core/course-filler-baseline.test.ts             [N]
│       ├── features/content/shell/course-filler-scan.unit.test.ts           [N]
│       └── <any test that uses one of the eight as a real example>          [E] only if Phase 0 finds one (found on 2026-10-09: `fe-steps/course-rehome-redirects.steps.tsx` mentions the slugs for redirects only; no change expected)
specs/apps/ayokoding/www/behaviours/backend/content/
├── course-filler-guard.feature                                              [N]
├── filler-course-completion.feature                                         [N]
└── README.md                                                                [E] list the two new features
.agents/skills/apps-ayokoding-www-developing-content/
├── SKILL.md                                                                 [E] link the new reference
├── reference/README.md                                                      [E] index entry
└── reference/course-quality-guards.md                                       [N] rules FILL1, FILL2, SEC1 (D1, D3)
<generated harness routes for the skill above>                               [G] from `./rhino harness adapters generate`
repo-governance/development/quality/gate-adapters/ayokoding-www.md           [E] pointer to the guard reference
plans/
├── backlog/README.md, in-progress/README.md, done/README.md                 [E] promotion and archival only
└── in-progress/ayokoding-learn-revamp-09-filler-rewrites/
    ├── delivery.md, learnings.md                                            [E] ticks and entries
    └── evidence/                                                            [N]
        ├── phase-*.md, *.png                                                [N]
        ├── guard-calibration.md                                             [N] the TypeScript port's metrics table and margin check
        ├── phase-2-probes.md                                                [N] probe results P1 to P11
        └── execution-summary.md                                             [N] the ledger table, committed
```

## Counts

| Item                                          | Count                                             |
| --------------------------------------------- | ------------------------------------------------- |
| Courses rewritten                             | 8 (7 By Example, 1 Primer)                        |
| Examples                                      | 78 x 7 + 80 = 626                                 |
| Katas                                         | 8 x 8 = 64                                        |
| Capstone units                                | 8                                                 |
| `run.yaml` files (examples, katas, capstones) | about 698, minus examples marked as illustrations |
| New TypeScript modules                        | 3 (`core` x 2, `shell` x 1)                       |
| New feature files                             | 2                                                 |
| New toolchain entries                         | 1 (`clojure`); 1 entry extended (`java`)          |
| New skill reference files                     | 1                                                 |

## Not Touched

- `apps/ayokoding-www/content/id/**` (series decision 35).
- The career manifests, the skills and AI manifests, the path pages, and the routing code. The three
  software-engineer manifests keep the eight courses where they are (D8).
- Every course outside the eight, including the 17 courses that stay in the baseline for plans 11 to 13.
- Plan 05's harness code (`apps/ayokoding-cli/internal/**`), except if a harness defect blocks a course
  (plan 05's M11): then the fix and its regression test are added in this PR and listed in the ledger.
- `apps/ayokoding-www/next-env.d.ts` and `.serena/project.yml` (never committed; restored if the dev server or a
  tool rewrites them).
- `.env.prod`, `.env.stag`, and every other `.env*` file except an uncommitted `.env.local` if the dev server
  needs one.

## Architecture Documents

`specs/apps/ayokoding/www/architecture.md` describes one `web` container and six bounded contexts; the
`content` context is "Markdown parsing, syntax highlighting, `content.getBySlug`, `listChildren`". The guard is
a test-time check over the same files; it adds no runtime responsibility, no container, no relationship, and no
boundary. Course content changes are data. The two toolchain entries are data inside `ayokoding-cli`, not new
elements. The C4 reconciliation in [../delivery.md](../delivery.md) therefore records "no change" with this
reason, after reading the as-built document and any C4 document plan 05 added for `ayokoding-cli`.
