# Skip / Pending / Undefined Test Inventory — ose-public

Scope: every skip-capable mechanism across the 4 test tools relevant to `ose-public` — Vitest (unit,
JS/TS apps), Playwright (e2e), xunit.v3/`dotnet test` (F# unit + integration), and cucumber-rs
(rhino-cli's Gherkin runner). Commands run 2026-07-04 from `~/ose-projects/ose-public`.

## 1. Vitest `.skip(` / `.only(` / `.todo(` — repo-wide, all TS/TSX

Command: `git grep -nE "(describe|it|test)\.(skip|only|todo)\(" -- '*.ts' '*.tsx'` (repo-wide, not
just `tests/unit`, to catch any co-located test file regardless of directory convention).

**Result: 0 occurrences anywhere in the repository.** No Jest is used in this repo (only Vitest 4.1.0,
confirmed via `apps/*/package.json`); the task brief's "Jest/Vitest" pattern applies 1:1 to Vitest here.
Also checked `xit(`/`xdescribe(` legacy Mocha-style skip aliases — zero matches.

## 2. Playwright `test.skip(` / `.only(` / `.fixme(` / `describe.skip(` — all 11 `*-e2e` apps

Command: `git grep -nE "\.skip\(|\.only\(|\.todo\(" -- '*.ts' '*.tsx'` (broad sweep, all TS/TSX,
narrowed manually to `*-e2e` app paths) plus a targeted
`git grep -nE "test\.(only|fixme)\(|test\.describe\.(skip|only)\(" -- 'apps/*-e2e/**/*.ts'`.

**3 conditional `test.skip(condition, reason)` calls found, all in one file, all environment guards —
not backlog:**

```text
apps/organiclever-app-web-e2e/steps/system-status-be.steps.ts:20:  $test.skip(process.env["CI"] === "true", "In CI docker-compose, ORGANICLEVER_BE_URL is always set in the FE server");
apps/organiclever-app-web-e2e/steps/system-status-be.steps.ts:38:  $test.skip(!!process.env["CI"], "Cannot simulate connection refused in full-stack CI");
apps/organiclever-app-web-e2e/steps/system-status-be.steps.ts:43:  $test.skip(!!process.env["CI"], "Cannot simulate backend timeout in full-stack CI");
```

Each is Playwright's documented conditional-skip API (`test.skip(condition, description)`), gating a
scenario that cannot be simulated inside the full-stack CI docker-compose environment (network-failure
simulation against a real, always-reachable backend). This is a legitimate environment guard, not test
debt. **Zero** unconditional `test.skip()`, zero `test.only(`, zero `test.fixme(`, zero
`test.describe.skip(` anywhere across all 11 e2e apps
(`ayokoding-www-be-e2e`, `ayokoding-www-fe-e2e`, `organiclever-app-web-e2e`, `organiclever-be-e2e`,
`organiclever-www-be-e2e`, `organiclever-www-fe-e2e`, `ose-app-web-e2e`, `ose-be-e2e`,
`ose-www-be-e2e`, `ose-www-fe-e2e`, `wahidyankf-www-fe-e2e`).

All 11 e2e apps' `playwright.config.ts` already set `forbidOnly: !!process.env.CI` (verified by direct
grep — see `05-reporters-public.md`), which would fail CI today if `.only(` were ever introduced.

## 3. F# xunit `Skip = "..."` attribute — `organiclever-be`, `ose-be`, `crane-cli`, `fsharp-crane-core`

Command: `git grep -nE "Skip\s*=\s*\""  -- '*.fs'` (repo-wide; also
`find apps/{organiclever-be,ose-be,crane-cli}/tests libs/fsharp-crane-core/tests -name "*.fs" | xargs grep -l Skip`
as a broader sweep).

**Result: 0 genuine `[Fact(Skip = "...")]`/`[Theory(Skip = "...")]` attributes anywhere in the repo.**
The broader case-insensitive sweep for the bare word `Skip` does surface 5 files
(`apps/crane-cli/tests/unit/Tests/SkiplistManagerTests.fs`,
`apps/crane-cli/tests/unit/Steps/SkiplistSteps.fs`,
`libs/fsharp-crane-core/tests/unit/Tests/SkiplistManagerTests.fs`,
`libs/fsharp-crane-core/tests/unit/Tests/DomainTests.fs`,
`apps/crane-cli/tests/unit/Tests/ReportManagerTests.fs`) — all are **false positives**: `crane-cli`
implements a domain feature literally named "Skiplist" (a skip-list data structure manager), so `Skip`
appears only as a substring of `Skiplist`/`SkiplistManager`/etc., never as the xunit `Skip=` attribute
parameter. Confirmed by re-running the precise `Skip\s*=\s*"` pattern against these exact files: zero
matches.

## 4. Cucumber-rs undefined/pending steps — rhino-cli

rhino-cli ships **18 cucumber-rs integration test binaries** under `apps/rhino-cli/tests/`
(`agent_naming_validator`, `agents`, `contracts`, `convention`, `ddd`, `docs`, `doctor`, `env_contract`,
`env`, `git_hooks`, `java`, `repo_config_data_driven`, `repo_config_validate`, `repo_governance`,
`spec_coverage`, `specs_tree`, `test_coverage`, `workflows`) — one per subdirectory of
`specs/apps/rhino/behavior/rhino-cli/gherkin/` (confirmed 1:1: `find .../gherkin -mindepth 1 -maxdepth 1
-type d` also returns exactly these 18 names). All 18 call `.fail_on_skipped()` on their
`cucumber::World::cucumber()` builder before `.run_and_exit(...)` — cucumber-rs's
`writer::FailOnSkipped` wrapper, which "transforms skipped steps into failed steps" (confirmed via
`docs.rs/cucumber/0.23.0`, see `05-reporters-public.md`).

**Ran all 18 binaries** (`cargo test --release --test <name>`, from `apps/rhino-cli/`):

| Metric                   | Result                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Binaries run             | 18 / 18                                                                                                                                |
| Exit code                | 0 (pass) for all 18                                                                                                                    |
| Total scenarios executed | 310 (sum across all 18 runs — matches `01-scenario-census-public.md`'s independently-grepped 310-scenario count for rhino-cli exactly) |
| Undefined/pending steps  | **0**                                                                                                                                  |
| Failed steps             | **0**                                                                                                                                  |
| Failed scenarios         | **0**                                                                                                                                  |

No "undefined step" or "pending" runner-status output appears anywhere in the combined run log; the
only lines containing the words "skipped"/"undefined" are Gherkin scenario **titles/step text**
describing product behavior about skipped files/headings (e.g. `Scenario: Symlinks and oversized files
are skipped`, `Then the output identifies the step as an undefined step` — this second one is
`rhino-cli`'s own step-coverage checker's output-message assertion, not a cucumber runner status). The
rhino-cli cucumber harness is fully green with **zero** backlog today.

## Summary table

| Category                                                         | Count | Zero-count?                           |
| ---------------------------------------------------------------- | ----- | ------------------------------------- |
| Vitest `.skip`/`.only`/`.todo` (repo-wide)                       | 0     | Yes                                   |
| Playwright unconditional `test.skip`/`.only`/`.fixme` (11 apps)  | 0     | Yes                                   |
| Playwright conditional `test.skip(condition, reason)`            | 3     | No — but environment guards, not debt |
| F# xunit `Skip = "..."` (4 test surfaces)                        | 0     | Yes                                   |
| Cucumber-rs undefined/pending steps (18 binaries, 310 scenarios) | 0     | Yes                                   |

## Key finding

The skip/pending/ignore backlog across `ose-public`'s entire test surface is **effectively empty**.
Every one of the four test tools' skip-capable mechanisms returns zero genuine skips, with a single
exception (3 legitimate, environment-conditional Playwright skips in one file). This means this plan's
repo-wide rollout inherits **no existing skip debt** to reconcile — a clean starting baseline. It also
means there is currently nothing to exercise rhino-cli's `.fail_on_skipped()` guard against in practice
(it has never fired); the real near-term risk is not skip _debt_ but the **complete absence of any
skip-fail guard** for Vitest and xunit (see `05-reporters-public.md`) — if a `.skip()` or
`[Fact(Skip=...)]` were introduced tomorrow in any of the 23 non-rhino-cli projects, nothing in CI would
catch it.
