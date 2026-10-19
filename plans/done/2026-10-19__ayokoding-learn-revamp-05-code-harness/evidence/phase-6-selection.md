# Evidence — Phase 6 code harness (selection, coverage, check/affected)

Scope: `internal/domain/selection/**`, `internal/domain/coverage/**`,
`internal/adapters/git/**` (new; architecture `exec-scope` allows
`os/exec` only in `containers/` and `git/`, so the git adapter lives
there), `internal/application/check*.go` + `coverage.go`, CLI
`check`/`affected`/`coverage` hunks plus the shared `selection.go`
helper and the one-line `run.go` message reuse, `tests/bdd/**`
bindings, `tests/integration/selection_test.go`, and this file. No
commit, no push, no folder moves.

Out of scope, untouched: `toolchains/**`, `tests/testdata/**`,
`specs/**`, `apps/ayokoding-www/project.json`, `.github/**`, product
docs, and all other plan docs. The `finding` package gained one code
(`ayokoding.env.git-not-found` → 127, per FR-14 "git when --since needs
it, was not found") and lost `ayokoding.usage.not-implemented`; one
`finding_test.go` table row covers the new mapping.

## AC-6.1 — Selection

- `internal/domain/selection`: changed paths map to course slugs through
  the repo-relative content root; only opted-in courses select, the rest
  list as inert; any path under `apps/ayokoding-cli/toolchains/`
  selects every opted-in course in `full` mode; `--all`, explicit
  `--course`, `K/N` shards over sorted slugs with a no-overlap-no-gap
  property test; invalid shard text is a usage error (exit 2).
- `internal/adapters/git`: `ChangedFiles` runs
  `git diff --name-only <merge-base>...HEAD` with every `GIT_*`
  variable cleared; `ContentPrefix` maps the content dir back to its
  repo-relative root. Integration tests build a real temporary
  repository (changed-files listing, poisoned-`GIT_DIR` proof, unknown
  revision failure) plus an end-to-end `examples affected --since`
  run asserting mode, courses, and inert.
- RED recorded: new unit tests failed on assertions before the
  implementation; GREEN after, with the integration file failing on
  assertions against the adapter stub first.

## AC-6.2 — Coverage

- `internal/domain/coverage`: covered/uncovered/not-applicable courses,
  percentage over applicable courses only, per-course illustration and
  static counts, `ayokoding.coverage.below-minimum` below the minimum.
- `examples coverage` renders text and JSON and exits 1 below
  `--min-percent`. RED recorded on assertions; GREEN after.

## AC-6.3 — `examples check` and `examples affected`

- `application.Check`: validates and syncs named courses, else every
  opted-in course; runs the shard-sliced selection and skips the
  runtime entirely when it is empty; reports static coverage at minimum
  0 over every course; returns `0 opted-in courses; nothing to run`
  with no runtime call (the test arms the fake with a failing probe).
- `application.Affected` returns the mode with the courses and inert
  list; explicit courses keep their existence check.
- `rtk git grep -n not-implemented -- apps/ayokoding-cli` and the
  filesystem grep both report no match: `examples coverage` and
  `examples affected` are implemented, `check`/`run` resolve
  `--since`/`--shard` through the selection, and the
  `UsageNotImplemented` constant is removed.
- All 11 scenarios bound in `tests/bdd/phase6_test.go` (temp content
  trees and temp git repositories staged at runtime; committed
  fixtures untouched). The inert proof poisons `AYOKODING_CONTAINER_CLI`
  and asserts exit 0, so no container can have started on any driver.

## Gates (worktree root `apps/ayokoding-cli` unless noted)

- `go build ./...` — exit 0.
- `go test -count=1 ./internal/... ./cmd/...` — exit 0.
- `COVERAGE_MINIMUM=99 ./scripts/coverage-gate.sh` (arch, race unit,
  100% static coverage over `internal/domain/finding`, BDD unit with
  64 scenarios) — exit 0.
- `go tool golangci-lint fmt --diff` (empty), `golangci-lint run`
  (0 issues), `nilaway`, `shfmt -d scripts` — exit 0, no new
  exclusions.
- `AYOKODING_BDD_ADAPTER=integration go test -count=1 ./tests/bdd ./tests/integration/...` — exit 0.
- `apps/ayokoding-cli/scripts/test-e2e.sh` — exit 0 (docker daemon present).
- `node scripts/behaviour-coverage.mjs` for adapters unit,
  integration, e2e, behaviour — 13 features, 64 scenarios each, exit 0.

## Notes for the record

- `runspec.Spec.Mode` always holds its default (`modeReal`; only the
  returned bool carries static), so the coverage static count keys on
  the always-present static reason instead of touching `runspec/`.
- `examples run --since/--shard` resolves through the same selection
  helper; plain `--course`/`--all` runs keep their exact Phase 5 path.
- `examples check` text always ends with
  `<covered> of <applicable> applicable courses covered`, and names
  inert courses as `inert: <slug>`.
