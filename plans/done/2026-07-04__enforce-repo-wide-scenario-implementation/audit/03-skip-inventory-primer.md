# ose-primer Skip/Pending/Ignore Marker Inventory (Phase 0 Audit — Deliverable 3)

All searches run via `git grep` from `~/ose-projects/ose-primer`, scoped to the relevant
project directories per ecosystem. **Headline finding: every classic skip/pending/ignore marker across
all 12 language ecosystems is at zero** — the one real, currently-live gap is a _different_ shape of
vacuous-pass, found empirically in `crud-be-ts-effect`'s cucumber-js suite (see the standout finding
below). A zero count is itself a real, useful data point — it means these 24 projects are not currently
relying on any of the standard skip-tag escape hatches to look green.

## Per-ecosystem results

| #   | Ecosystem / marker                           | Projects scoped                                                                                                     | Command                                                                                                        | Count                                | Example                                                                    |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Jest/Vitest `.skip(`/`.only(`/`.todo(`       | `crud-fe-ts-nextjs`, `crud-fe-ts-tanstack-start`, `crud-fs-ts-nextjs`, `crud-be-ts-effect`, `ts-ui`, `ts-ui-tokens` | `git grep -nE "(describe\|it\|test)\.(skip\|only\|todo)\("` (also checked `xdescribe`/`xit`/`fdescribe`/`fit`) | **0**                                | —                                                                          |
| 2   | Playwright `test.skip(`/`.only(`/`.fixme(`   | `crud-be-e2e`, `crud-fe-e2e`                                                                                        | `git grep -nE "test\.(skip\|only\|fixme)\("`                                                                   | **0**                                | —                                                                          |
| 3   | .NET xunit `Skip = "..."` / `Fact(Skip=...)` | `crud-be-fsharp-giraffe`, `crud-be-csharp-aspnetcore`                                                               | `git grep -nE "Skip\s*="` and `Fact\(Skip\|Theory\(Skip`                                                       | **0**                                | —                                                                          |
| 4   | Kaocha pending/skip metadata                 | `crud-be-clojure-pedestal`, `clojure-openapi-codegen`                                                               | `git grep -nE ":kaocha\.testable/skip\|\^:pending\|\^:kaocha/skip"`                                            | **0**                                | —                                                                          |
| 5   | ExUnit `@tag :skip` / `@moduletag :skip`     | `crud-be-elixir-phoenix`, `elixir-openapi-codegen`, `elixir-cabbage`, `elixir-gherkin`                              | `git grep -nE "@tag\s*:skip\|@moduletag\s*:skip\|@tag\s*skip:\s*true"`                                         | **0**                                | —                                                                          |
| 6   | Go `t.Skip(`/`t.SkipNow(`                    | `crud-be-golang-gin`, `golang-commons`                                                                              | `git grep -nE "t\.Skip\(\|t\.SkipNow\("`                                                                       | **0**                                | —                                                                          |
| 7   | JUnit5 `@Disabled`                           | `crud-be-java-springboot`, `crud-be-java-vertx`, `crud-be-kotlin-ktor`                                              | `git grep -nE "@Disabled"`                                                                                     | **0**                                | —                                                                          |
| 8   | pytest `@pytest.mark.skip`/`skipif`/`xfail`  | `crud-be-python-fastapi`                                                                                            | `git grep -nE "@pytest\.mark\.(skip\|skipif\|xfail)"`                                                          | **0**                                | —                                                                          |
| 9   | Cargo `#[ignore]`                            | `crud-be-rust-axum`, `rhino-cli`                                                                                    | `git grep -nE "#\[ignore\]"`                                                                                   | **0**                                | —                                                                          |
| 10  | Dart/Flutter `skip:`                         | `crud-fe-dart-flutterweb`                                                                                           | `git grep -nE "skip\s*:\s*true\|skip\s*:\s*'"`                                                                 | **0**                                | —                                                                          |
| 11  | cucumber-js undefined/pending steps          | `crud-be-ts-effect`                                                                                                 | see standout finding below                                                                                     | **20 undefined steps / 4 scenarios** | `specs/apps/crud/behavior/crud-be/gherkin/test-support/test-api.feature:9` |

Corroborating repo-wide tag scan (deliverable 1) also found **zero** `@wip`-as-skip-mechanism collisions:
the 5 `@wip`-tagged feature files are a documentation/exemption convention, not a test-runner skip
directive — no test runner in this repo currently interprets `@wip` as a tag filter.

## Standout finding: cucumber-js "undefined" steps pass silently (crud-be-ts-effect)

This is **not** a `.skip()`/`.only()` marker (row 1 above is genuinely zero) — it is cucumber-js's own
notion of a step with no matching step-definition regex, which functions as an equivalent
vacuous-pass hole and is worth flagging because it was found live, not merely theorized.

**Evidence — cached, current build artifact** (`apps/crud-be-ts-effect/coverage/cucumber-unit-report.json`,
gitignored, dated 2026-07-02, working tree clean, no commits to `crud-be-ts-effect/tests` or the
`crud-be` gherkin tree since 2026-06-19 — i.e. not stale):

```text
{'passed': 587, 'undefined': 20}   # 16 features, 20 of 527 steps undefined across 4 scenarios
```

**Reproduced live** by re-running the exact `test:unit` cucumber-js invocation from
`apps/crud-be-ts-effect/project.json`:

```bash
npx cucumber-js '../../specs/apps/crud/behavior/crud-be/gherkin/**/*.feature' \
  --require-module tsx/cjs --require 'tests/unit/bdd/hooks.ts' \
  --require 'tests/unit/bdd/world.ts' --require 'tests/unit/bdd/steps/**/*.ts' \
  --format summary
# => 80 scenarios (4 undefined, 76 passed)
# => 527 steps (20 undefined, 507 passed)
# => exit code: 0            (confirmed with and without --strict / --no-strict — see deliverable 5)
```

Undefined scenarios/steps, by file:line:

- `specs/apps/crud/behavior/crud-be/gherkin/codegen/go-codegen-fresh-checkout.feature:9-12` — scenario
  "Fresh Go codegen yields types.gen.go from a 3.1 spec" (4 steps; not applicable to a TS project, but
  still counted as "undefined" rather than excluded)
- `specs/apps/crud/behavior/crud-be/gherkin/codegen/rust-codegen-fresh-checkout.feature:9-12` — scenario
  "Fresh Rust codegen yields Cargo.toml and module wiring" (4 steps)
- `specs/apps/crud/behavior/crud-be/gherkin/test-support/test-api.feature:9-17` — scenario "Reset
  database clears all user-created data" (7 steps)
- `specs/apps/crud/behavior/crud-be/gherkin/test-support/test-api.feature:19-24` — scenario "Promote
  user to admin role" (5 steps)

All 4 undefined scenarios live in `codegen/` and `test-support/` — the same two subdirectories that
rhino-cli's `specs:behavior:coverage` target explicitly excludes via `--exclude-dir codegen
--exclude-dir test-support` for every `crud-be-*` project (see deliverable 4). `crud-be-ts-effect`'s
own `test:specs` target does run `specs:behavior:coverage` with the same exclusions, so rhino-cli's
own gate never sees these 4 scenarios either — but cucumber-js's `test:unit`/`test:coverage` targets do
NOT apply that exclusion, so they load and silently no-op these scenarios every run.

**Why this matters for the plan**: cucumber-js reports undefined steps under a "Failures:" header in
its own console output, yet returns exit code 0 regardless — confirmed empirically (see deliverable 5).
Any CI pipeline gating only on cucumber-js's exit code currently cannot detect these 4
never-implemented scenarios. This is exactly the class of gap `enforce-repo-wide-scenario-implementation`
is meant to close, and it is real and present today, not hypothetical.
