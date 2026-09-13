# ose-primer Scenario Census (Phase 0 Audit — Deliverable 1)

Source of truth: `~/ose-projects/ose-primer/repo-config.yml`, `coverage.projects` (25 entries,
confirmed via `grep -c "^    - name:" repo-config.yml`).

**Method**: scenario counts are literal `grep -E "^\s*Scenario:|^\s*Scenario Outline:"` line counts
across every `.feature` file matched by each project's `specs:` glob — one `Scenario Outline:` counts
as 1, regardless of how many `Examples:` rows it expands to at run time (see caveat below). Per-scenario
tag counts are literal `^\s*@(unit|integration|e2e)` lines immediately preceding a `Scenario:`/
`Scenario Outline:` line.

**Critical nuance confirmed by direct inspection**: level assignment in ose-primer is overwhelmingly
**registry-driven** (the `levels:` field per `coverage.projects` entry), not tag-driven. Per-scenario
`@unit`/`@integration`/`@e2e` Gherkin tags exist **only** inside `rhino-cli`'s own spec suite (13 of its
310 scenarios). Every other project (all 11 `crud-be-*` variants, `crud-be-e2e`, all 3 `crud-fe-*`
variants, `crud-fe-e2e`, `crud-fs-ts-nextjs`, and all 7 libs) has **zero** literal per-scenario level
tags — for those, the registry's `levels:` field is the _only_ level-assignment mechanism that exists.

**Shared-glob dedup**: `specs/apps/crud/behavior/crud-be/**` is one physical scenario set shared by 12
registry entries (11 `crud-be-*` + `crud-be-e2e`); `specs/apps/crud/behavior/crud-web/**` is one physical
scenario set shared by 5 registry entries (`crud-fe-dart-flutterweb`, `crud-fe-ts-nextjs`,
`crud-fe-ts-tanstack-start`, `crud-fe-e2e`, `crud-fs-ts-nextjs`). Scenario counts below are per-glob (not
multiplied per sharing project) — the table intentionally repeats the same count across each project
row so every one of the 25 registered projects has an explicit row.

## Census Table

| #   | Project                     | Levels (registry)     | Specs glob                               | Feature files | Scenarios (incl. Outlines) | Per-scenario level-tagged        |
| --- | --------------------------- | --------------------- | ---------------------------------------- | ------------- | -------------------------- | -------------------------------- |
| 1   | `rhino-cli`                 | `[unit, integration]` | `specs/apps/rhino/behavior/rhino-cli/**` | 57            | 310                        | 13 (all `@unit`)                 |
| 2   | `crud-be-clojure-pedestal`  | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 3   | `crud-be-csharp-aspnetcore` | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 4   | `crud-be-elixir-phoenix`    | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 5   | `crud-be-fsharp-giraffe`    | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 6   | `crud-be-golang-gin`        | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 7   | `crud-be-java-springboot`   | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 8   | `crud-be-java-vertx`        | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 9   | `crud-be-kotlin-ktor`       | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 10  | `crud-be-python-fastapi`    | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 11  | `crud-be-rust-axum`         | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 12  | `crud-be-ts-effect`         | `[unit, integration]` | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 13  | `crud-be-e2e`               | `[e2e]`               | `specs/apps/crud/behavior/crud-be/**`    | 16            | 80                         | 0                                |
| 14  | `crud-fe-dart-flutterweb`   | `[unit]`              | `specs/apps/crud/behavior/crud-web/**`   | 16            | 93                         | 0                                |
| 15  | `crud-fe-ts-nextjs`         | `[unit]`              | `specs/apps/crud/behavior/crud-web/**`   | 16            | 93                         | 0                                |
| 16  | `crud-fe-ts-tanstack-start` | `[unit]`              | `specs/apps/crud/behavior/crud-web/**`   | 16            | 93                         | 0                                |
| 17  | `crud-fe-e2e`               | `[e2e]`               | `specs/apps/crud/behavior/crud-web/**`   | 16            | 93                         | 0                                |
| 18  | `crud-fs-ts-nextjs`         | `[unit]`              | `specs/apps/crud/behavior/crud-web/**`   | 16            | 93                         | 0                                |
| 19  | `golang-commons`            | `[unit]`              | `specs/libs/golang-commons/**`           | 2             | 4                          | 0                                |
| 20  | `ts-ui`                     | `[unit]`              | `specs/libs/ts-ui/**`                    | 6             | 31                         | 0                                |
| 21  | `clojure-openapi-codegen`   | `[unit]`              | `specs/libs/clojure-openapi-codegen/**`  | 1             | 2                          | 0 (file is feature-level `@wip`) |
| 22  | `elixir-openapi-codegen`    | `[unit]`              | `specs/libs/elixir-openapi-codegen/**`   | 1             | 3                          | 0 (file is feature-level `@wip`) |
| 23  | `elixir-cabbage`            | `[unit]`              | `specs/libs/elixir-cabbage/**`           | 1             | 2                          | 0 (file is feature-level `@wip`) |
| 24  | `elixir-gherkin`            | `[unit]`              | `specs/libs/elixir-gherkin/**`           | 1             | 2                          | 0 (file is feature-level `@wip`) |
| 25  | `ts-ui-tokens`              | `[unit]`              | `specs/libs/ts-ui-tokens/**`             | 1             | 2                          | 0 (file is feature-level `@wip`) |

## Unique scenario total (deduped by glob)

| Glob                                                         | Scenarios |
| ------------------------------------------------------------ | --------- |
| `specs/apps/rhino/behavior/rhino-cli/**`                     | 310       |
| `specs/apps/crud/behavior/crud-be/**`                        | 80        |
| `specs/apps/crud/behavior/crud-web/**`                       | 93        |
| `specs/libs/golang-commons/**`                               | 4         |
| `specs/libs/ts-ui/**`                                        | 31        |
| `specs/libs/clojure-openapi-codegen/**`                      | 2         |
| `specs/libs/elixir-openapi-codegen/**`                       | 3         |
| `specs/libs/elixir-cabbage/**`                               | 2         |
| `specs/libs/elixir-gherkin/**`                               | 2         |
| `specs/libs/ts-ui-tokens/**`                                 | 2         |
| **Total unique scenarios across all 25 registered projects** | **529**   |

## Other tags observed (non-level)

`git grep -ohE "^\s*@[A-Za-z0-9_-]+"` across `specs/apps/crud/behavior/crud-be`,
`specs/apps/crud/behavior/crud-web`, and `specs/libs/**`:

| Tag               | Count | Meaning                                                                                                                                                                                                                                                                   |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@wip`            | 5     | Feature-level (line 1, before `Feature:`) — one entire file each in `clojure-openapi-codegen`, `elixir-cabbage`, `elixir-gherkin`, `elixir-openapi-codegen`, `ts-ui-tokens`. Exempts the whole feature from the (currently unwired — see deliverable 4) `@covers` engine. |
| `@codegen`        | 3     | Marks CI-infra codegen scenarios (e.g. `codegen/go-codegen-fresh-checkout.feature`) — explicitly excluded from `specs:behavior:coverage` scans via `--exclude-dir codegen`.                                                                                               |
| `@golang-commons` | 2     | Project-scoping tag inside a shared glob.                                                                                                                                                                                                                                 |
| `@test-support`   | 1     | Marks `test-support/test-api.feature` scenarios — explicitly excluded via `--exclude-dir test-support`.                                                                                                                                                                   |

No `@unit`/`@integration`/`@e2e` per-scenario tags appear anywhere in `crud-be`, `crud-web`, or any
`specs/libs/**` feature file — confirmed via
`grep -nE "^\s*@(unit|integration|e2e)\b"` returning zero matches across all three trees.

## Caveat: scenario-count methodology vs. the live coverage engine

`crud-be-rust-axum:specs:behavior:coverage` (deliverable 4) reports **89 scenarios** for the same
`crud-be` glob (minus `test-support`/`codegen` exclusions: 16 files → 13 files), while this census's
raw `Scenario:`/`Scenario Outline:` line-count method yields **80** for the full 16-file set. The
delta is `Scenario Outline:` + `Examples:` row expansion — rhino-cli's own coverage engine counts one
scenario per expanded Examples row, not one per `Scenario Outline:` literal. This audit follows the
task's literal-grep instruction; the plan's design phase should decide which counting convention the
new repo-wide mechanism adopts (expanded vs. literal).
