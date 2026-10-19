# 010 — File Impact

Root-relative paths. Markers: `[N]` new, `[E]` edited, `[D]` deleted, `[G]` generated (never edited by hand).
Plans 03, 05, and 09 create some of the edited files; Phase 0 confirms each exists on `origin/main` under the name
shown, and records any difference. Unmarked rows are containers or files this plan leaves byte-for-byte unchanged.

## File-impact tree

```text
apps/ayokoding-www/
  content/en/learn/
    courses/
      claude-code-for-engineers/                       # [N] (48 new course directories total)
        _index.md                                                      # [N]
        overview.md                                                    # [N]
        learning/                                                      # [N]
          overview.md, beginner.md, intermediate.md, advanced.md   # [N] (By Example courses)
          overview.md, theme-a-....md .. theme-i-....md            # [N] (Annotated-Concept courses)
          code/ex-01-<slug>/ .. ex-NN-<slug>/                     # [N]
          code/jars.lock                                           # [N] only the 8 lock-bearing JVM-hosted courses (3 Clojure, 3 Java, 2 Kotlin)
          capstone/overview.md, capstone/code/                    # [N]
        drilling/                                                      # [N]
          overview.md                                                  # [N]
          code/kata-01-<slug>/{before,after}/ .. kata-NN-<slug>/  # [N]
      ... (47 more new course directories, listed in
           plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/syllabus/courses/README.md)  # [N]
    legacy/                                             # untouched (read-only source material; FR11)
  src/
    features/content/core/course-categories.ts          # unchanged (no new category; counts read at build time)
apps/ayokoding-cli/
  toolchains/
    catalog.yaml                                         # [E] install block on clojure and kotlin; new webassembly entry
    java/JarFetch.java                                   # [E] gains the optional repository field
    clojure/                                             # [E] (plan 09's entry): Dockerfile, JarFetch.java copy, wrapper class path
    kotlin/                                              # [E] Dockerfile, JarFetch.java copy
    webassembly/ (WASI target + WASI runtime pin)         # [N] the only new toolchain
  tests/                                                 # [N] one unit: the three JarFetch.java copies are byte-identical
    testdata/toolchain-smoke/                            # [N] new smoke courses: java clojars field, clojure install, kotlin install, webassembly
<wtests>/unit/be-steps/
  course-metadata.steps.ts                               # [E] extended: 48 new slugs, new totals
  legacy-mapping.steps.ts                                # [N] mapping completeness + target resolution + legacy-untouched checks
specs/apps/ayokoding/www/behaviours/
  backend/content/
    legacy-mapping-completeness.feature                  # [N]
    legacy-migrated-course-completion.feature             # [N]
  frontend/course-paths/
    catalog-count-after-migration.feature                 # [N]
plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/
  README.md, brd.md, prd.md, learnings.md, delivery.md   # [E] ticks and entries during execution
  tech-docs/001..011 + README.md                         # [E] ticks and entries during execution
  syllabus/
    README.md                                            # [E] ticks and entries during execution
    legacy-to-course-mapping.md                          # [E] ticks and entries during execution
    courses/README.md + 48 course brief files            # [E] ticks and entries during execution
local-tmp/ayokoding-learn/
  execution-ledger.md                                    # [N] appended: "## Plan 10 — legacy-unique migration" section (not committed to the PR; local execution state)
```

## What this plan's own commits touch

- `apps/ayokoding-www/content/en/learn/courses/<48 new slugs>/**` — new course content.
- `apps/ayokoding-cli/toolchains/{catalog.yaml,java/JarFetch.java,clojure/**,kotlin/**,webassembly/**}` —
  one new toolchain definition (WebAssembly) and the install-recipe extensions of the merged `clojure`
  entry and of `kotlin`, per plan 05's "Adding a Toolchain" procedure; plus a recipe extension for `rust`,
  `dotnet`, or `elixir` only if the Phase 0 inventory finds a course that needs one
  ([tech-docs/003](./003-code-harness-determinism-and-toolchain-additions.md#install-recipes-for-the-other-toolchains)).
- `apps/ayokoding-cli/tests/**` — the new fixture units and the `JarFetch.java` byte-identity unit.
- `<wtests>/unit/be-steps/course-metadata.steps.ts` — extended corpus assertions (230 total, new per-category
  counts).
- `<wtests>/unit/be-steps/legacy-mapping.steps.ts` — new file, the mapping-completeness and
  legacy-untouched checks.
- `specs/apps/ayokoding/www/behaviours/{backend/content,frontend/course-paths}/*.feature` — the three new
  feature files in [prd.md](../prd.md#acceptance-criteria-gherkin).
- `plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/**` — this plan's own folder.

## What this plan's own commits never touch

- `apps/ayokoding-www/content/en/learn/legacy/**` (FR11; verified by the legacy-untouched test).
- `apps/ayokoding-www/content/id/**` (decision 35).
- Any of the 182 pre-existing course directories (plans 11 to 13's job).
- Any of the 8 career/skills path manifest files (decision D7 in
  [tech-docs/009](./009-decision-records.md)).
- `apps/ayokoding-www/next-env.d.ts` (a local dev rewrite, never committed) and `.serena/project.yml`
  (worktree-local Serena state, never committed).
- `plans/backlog/README.md`.
