# Phase 0 Contracts — Plan 10 (base `32ec44423`)

## Base commit

`32ec44423` (`docs(plans): promote plan-10 legacy-unique-migration to in-progress (#722)`).
Every "since the plan started" comparison uses this commit.

## Order decision (user, 2026-10-19)

Plan 10 executes before plans 06/07/08/09 per the user's explicit DAG-priority order
(DAG `P05 --> P10` allows it; no `06/07/08/09 --> 10` edge exists). Consequences recorded here:

- Outline baseline is 62, not 0: 30 `erp-systems` + 24 `accounting` + 8 others, all skeletons
  belonging to unexecuted plans 06 to 09. Guards scope to non-outline courses, so execution is
  unaffected. The `plans/done/` folders for 06/07/08/09 are absent, as expected under this order.
- Plan 09's toolchain foundation is ABSENT and is absorbed into this plan's Phase 1 (user
  decision): the `clojure` catalog entry, `toolchains/java/JarFetch.java`, the `java` `install`
  recipe, and the lock-agreement unit do not exist on `origin/main`. Phase 1 builds them first
  per plan 09's own specs (`tech-docs/004-code-harness-and-determinism.md:232-233`,
  `delivery.md:625-629`), then AC-1 to AC-3 proceed on top. Plan 09 later skips its toolchain
  slice (filler rewrites unaffected).

## As-merged names (same as planned unless noted)

- Plan 02: closure rule R4 at
  `apps/ayokoding-www/src/features/course-paths/core/manifest-integrity.ts:115` — same as planned.
- Plan 03: `course-metadata.ts` and `course-categories.ts` exist; `COURSE_CATEGORIES` exported
  at `course-categories.ts:41` (14-category constant) — same as planned.
- Plan 05: Nx target `examples:check` at `apps/ayokoding-www/project.json:240`; Go project at
  `apps/ayokoding-cli` (356 tracked files) — same as planned.
- Plan 05 "Adding a Toolchain" procedure: heading `## Adding a Toolchain` still exists at
  `plans/done/2026-10-19__ayokoding-learn-revamp-05-code-harness/tech-docs/005-runners-and-toolchain-catalog.md:218`
  — same as planned.
- CLI subcommands `toolchains list` / `toolchains build [ID]...` confirmed via
  `apps/ayokoding-cli/README.md:83-84` — same as planned.
- `CLI-TEST`: no bare `test` target exists; this plan uses `ayokoding-cli:test:quick`
  (deviation recorded; `test:unit` + `test:coverage:*` + `test:integration` + `test:e2e` exist).
- `TOOLCHAIN-LIST` (2026-10-19, CLI built exit 0): catalog contains `java` and `kotlin`,
  does NOT contain `clojure` (absent — absorbed Phase 1 scope, see order decision) and does
  NOT contain `webassembly` (expected; Phase 1 AC-4 adds it).
- Plan 09 toolchain contract: ABSENT (see order decision above). `toolchains/java/` holds no
  files; the `java` entry (catalog: `eclipse-temurin:25-jdk` digest) has no `install` block;
  the `kotlin` entry (derived image) has no `install` block either. The catalog's only
  `install:` block is `python`'s (line 12). `clojure` entry: absent. AC-5 inventory baseline:
  `kotlin`, `rust`, `dotnet`, `elixir` — none has an `install` block.
