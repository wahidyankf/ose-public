# Evidence — Phase 6 AC-6.4 Nx target and AC-6.5 CI wiring (swe-developer)

Scope: `apps/ayokoding-www/project.json` (`examples:check` target only),
`.github/actions/setup-go/action.yml`,
`.github/workflows/pr-quality-gate.yml`,
`.github/workflows/_reusable-ayokoding-www-examples-check.yml` (new),
`.github/workflows/ayokoding-www-examples-check.yml` (new),
`.github/workflows/non-product-full-quality.yml`,
`.github/workflows/dependency-vulnerability-audit.yml`, and this file.
No commit, no push, no folder moves. Docker daemon `24.0.2`, Node `v24.16.0`.
`scripts/workflow-language-lanes.test.mjs` needed no update (see AC-6.5).

Ownership deviations: none. `apps/ayokoding-cli/**` (selection, coverage,
`examples check`/`affected` implementation) belongs to the concurrent
selection/coverage agent and is reported, not edited — see Blockers.

## AC-6.4 — `ayokoding-www:examples:check`

RED: `EXAMPLES-CHECK` before the target existed failed with exit 1 and
`Cannot find configuration for task ayokoding-www:examples`.

GREEN: added the `examples:check` target plus its `full` configuration to
`apps/ayokoding-www/project.json`, byte-identical to tech-docs/007
(`nx:run-commands`, `dependsOn` `ayokoding-cli:build`, `cache: false`,
`--since "${NX_BASE:-origin/main}"`, full configuration `--all`).
`npx nx show project ayokoding-www` resolves the target exactly as specified.

- `EXAMPLES-CHECK`: exit 0. Stdout shows `0 opted-in courses; nothing to
run` and `0 of 126 applicable courses covered` (measured 2026-10-18;
  the plan text's 116 is stale — 126 courses are applicable on the day).
- `docker ps -a --filter label=ayokoding.run` at that point: header only,
  no containers.
- Full configuration
  (`npm exec nx -- run ayokoding-www:examples:check --configuration=full`):
  exit 0, same two stdout lines.

Opt-in proof (scratch only, content untouched): copied the `green-python`
fixture to `local-tmp/ayokoding-learn/plan-05/content/` and ran the built
CLI with `--content` at the copy plus `--all` — exit 0, all four examples
passed, `1 of 1 applicable courses covered`. Flipped one byte in
`ex-01-hello/expected/main.stdout.txt` (`world` → `WORLD`) and reran —
exit 1 with `ayokoding.examples.stdout-mismatch` naming line 3
(expected `WORLD`, actual `world`). Deleted the copy afterwards;
`local-tmp/ayokoding-learn/plan-05/` holds no content copy.

`WWW-QUICK`: PENDING — see Blockers.

## AC-6.5 — CI wiring

- `.github/actions/setup-go/action.yml`: `cache-dependency-path` default is
  now `apps/ayokoding-cli/go.sum`; `go-version` default is now `1.26.1`
  (the module's `go 1.26.1` directive differs from the old `1.26` literal,
  so the default follows the directive per the AC). The stale
  no-checked-in-go.mod comment now names the module.
- `.github/workflows/pr-quality-gate.yml`: `has-ayokoding-examples` output,
  two `case` arms (`ayokoding-www`, `ayokoding-cli`) in `detect`, the
  `examples-plan` job (builds the CLI, runs
  `examples affected --since "$NX_BASE" --output json`, emits `shards`
  `[1]`/`shard-total` `1` when mode is `affected` with at most 8 courses,
  else `[1,2,3,4]`/`4`) and the `examples` job (calls the reusable
  workflow with `selection: since`, the base, and the shard list); both
  jobs added to `quality-gate.needs`. The plan job parses `.mode` and
  `.courses`, matching the implemented JSON document
  (`schemaVersion`, `mode`, `courses`, `inert`).
- `.github/workflows/_reusable-ayokoding-www-examples-check.yml` (new) and
  `.github/workflows/ayokoding-www-examples-check.yml` (new, monthly cron
  `17 3 1 * *` verbatim from tech-docs/007), both `permissions:
contents: read`. The reusable workflow runs the Nx target
  (`--configuration=full` for `all`), rotates the buildx cache folder the
  CLI writes beside (`<dir>-new`, per `containerplan/build.go` cache flags),
  and appends `examples coverage` to `$GITHUB_STEP_SUMMARY`.
- `.github/workflows/non-product-full-quality.yml`: `ayokoding-cli` added
  to the `test:quick`, `test:integration`, and `test:e2e` project lists; a
  `setup-go` step added to each of the three jobs.
- `.github/workflows/dependency-vulnerability-audit.yml`: `setup-go` step
  added so `deps:audit` (govulncheck) runs on the pinned Go.

`LINT-WORKFLOWS`: exit 0. The plan command alone short-circuits (no path
args), so actionlint was additionally run over every touched file: one real
finding fixed — `env` context is not allowed in a reusable-call `with:`
block, so the caller passes `base: origin/${{ github.base_ref }}` instead
of `${{ env.NX_BASE }}`; rerun exit 0.

`SCRIPT-TESTS`: exit 0 — 128 passed, 0 failed.
`scripts/workflow-language-lanes.test.mjs` encodes no job list (it derives
lanes from `--exclude` lines, which the new jobs have none of, and checks
triggers generically), so no expectation update was needed.

`CLI-QUICK`: exit 0 (lint, typecheck, unit at 100% over 25/25 statements,
all coverage layers).

## Blockers

1. `WWW-QUICK` (`ayokoding-www:test:quick`) cannot complete on this host
   right now: `typecheck` and `lint` pass (lint: 64 warnings, 0 errors),
   then `test:unit` is killed mid-suite by HIPPO
   (`pressure-shed ... after swap-critical`, exit 124) with 92 passing
   assertions and zero failing tests observed across five gate attempts
   plus one reduced-worker diagnostic (also shed). The 16 GB host carries
   ~5.6 GB of compressed pages from the day's concurrent builds plus the
   Docker VM and three agents; the coverage-enabled vitest run (8 workers,
   933 files) does not fit in the remaining headroom. My change cannot
   influence this (project.json only gains a target; `test:unit` never
   reads it; content is untouched). Retry `WWW-QUICK` on a quiet host
   before closing the Phase 6 gate.
