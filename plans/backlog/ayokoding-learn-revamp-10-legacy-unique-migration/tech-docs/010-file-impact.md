# 010 — File Impact

## File-impact tree

```text
apps/ayokoding-www/
  content/en/learn/
    courses/
      claude-code-for-engineers/                       # new (48 new course directories total)
        _index.md
        overview.md
        learning/
          overview.md, beginner.md, intermediate.md, advanced.md   # (By Example courses)
          overview.md, theme-a-....md .. theme-i-....md            # (Annotated-Concept courses)
          code/ex-01-<slug>/ .. ex-NN-<slug>/
          code/jars.lock                                           # only the 8 lock-bearing JVM-hosted courses (3 Clojure, 3 Java, 2 Kotlin)
          capstone/overview.md, capstone/code/
        drilling/
          overview.md
          code/kata-01-<slug>/{before,after}/ .. kata-NN-<slug>/
      ... (47 more new course directories, listed in
           plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/syllabus/courses/README.md)
    legacy/                                             # untouched (read-only source material; FR11)
  src/
    features/content/core/course-categories.ts          # unchanged (no new category; counts read at build time)
apps/ayokoding-cli/
  toolchains/
    catalog.yaml                                         # edited: install block on clojure and kotlin; new webassembly entry
    java/JarFetch.java                                   # edited: gains the optional repository field
    clojure/                                             # edited (plan 09's entry): Dockerfile, JarFetch.java copy, wrapper class path
    kotlin/                                              # edited: Dockerfile, JarFetch.java copy
    webassembly/ (WASI target + WASI runtime pin)         # new toolchain (the only one)
  tests/                                                 # one unit: the three JarFetch.java copies are byte-identical
    testdata/toolchain-smoke/                            # new smoke courses: java clojars field, clojure install, kotlin install, webassembly
tests/unit/be-steps/
  course-metadata.steps.ts                               # extended: 48 new slugs, new totals
  legacy-mapping.steps.ts                                # new: mapping completeness + target resolution + legacy-untouched checks
specs/apps/ayokoding/www/behaviours/
  backend/content/
    legacy-mapping-completeness.feature                  # new
    legacy-migrated-course-completion.feature             # new
  frontend/course-paths/
    catalog-count-after-migration.feature                 # new
plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/
  README.md, brd.md, prd.md, learnings.md, delivery.md
  tech-docs/001..011 + README.md
  syllabus/
    README.md
    legacy-to-course-mapping.md
    courses/README.md + 48 course brief files
local-tmp/ayokoding-learn/
  execution-ledger.md                                    # appended: "## Plan 10 — legacy-unique migration" section (not committed to the PR; local execution state)
```

## What this plan's own commits touch

- `apps/ayokoding-www/content/en/learn/courses/<48 new slugs>/**` — new course content.
- `apps/ayokoding-cli/toolchains/{catalog.yaml,java/JarFetch.java,clojure/**,kotlin/**,webassembly/**}` —
  one new toolchain definition (WebAssembly) and the install-recipe extensions of the merged `clojure`
  entry and of `kotlin`, per plan 05's "Adding a Toolchain" procedure; plus a recipe extension for `rust`,
  `dotnet`, or `elixir` only if the Phase 0 inventory finds a course that needs one
  ([tech-docs/003](./003-code-harness-determinism-and-toolchain-additions.md#install-recipes-for-the-other-toolchains)).
- `apps/ayokoding-cli/tests/**` — the new fixture units and the `JarFetch.java` byte-identity unit.
- `tests/unit/be-steps/course-metadata.steps.ts` — extended corpus assertions (229 total, new per-category
  counts).
- `tests/unit/be-steps/legacy-mapping.steps.ts` — new file, the mapping-completeness and
  legacy-untouched checks.
- `specs/apps/ayokoding/www/behaviours/{backend/content,frontend/course-paths}/*.feature` — the three new
  feature files in [prd.md](../prd.md#acceptance-criteria-gherkin).
- `plans/backlog/ayokoding-learn-revamp-10-legacy-unique-migration/**` — this plan's own folder.

## What this plan's own commits never touch

- `apps/ayokoding-www/content/en/learn/legacy/**` (FR11; verified by the legacy-untouched test).
- `apps/ayokoding-www/content/id/**` (decision 35).
- Any of the 181 pre-existing course directories (plans 11 to 13's job).
- Any of the 8 career/skills path manifest files (decision D7 in
  [tech-docs/009](./009-decision-records.md)).
- `apps/ayokoding-www/next-env.d.ts` (a local dev rewrite, never committed) and `.serena/project.yml`
  (worktree-local Serena state, never committed).
- `plans/backlog/README.md`.
