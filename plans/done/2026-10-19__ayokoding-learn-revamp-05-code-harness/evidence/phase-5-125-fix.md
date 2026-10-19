# Evidence — Phase 5 SMOKE 125-cluster fix (swe-developer)

Scope: `apps/ayokoding-cli/internal/application/run_execute.go` (+ its
test), `apps/ayokoding-cli/internal/domain/containerplan/run.go` (+ its
test), and this file. No commit, no push, no folder moves. Docker daemon
`24.0.2`, Go `go1.27.2` darwin/arm64. Commands below run from the worktree
root; `CLI-BUILD` was rebuilt before the fixture runs because
`run_execute.go` changed.

Ownership deviations: none. `go.mod`/`go.sum`, `project.json`,
`repo-config.yml`, `toolchains/**`, `tests/testdata/**`, `scripts/`,
`specs/`, and plan docs untouched. Full SMOKE not run (another task runs
it after this lands).

## Diagnosis (verified, not just root-caused)

The gate (`phase-5-gate.md`, SMOKE triage item 1) held that the harness
plans `docker run ... ayokoding-toolchain/<id>:<hash>@sha256:<hash>` for
harness-local derived images. Corroborated on this host:

- `docker image inspect ayokoding-toolchain/shell:<tag>` →
  `RepoDigests=[]`, arch `arm64` (same for `lua`). Locally-built images
  carry no RepoDigest, so the daemon answers `Unable to find image
locally` + `pull access denied` = exit 125, while the bare tag resolves.
- The RED run below reproduced the exact production argv
  (`... ayokoding-toolchain/python:<hash>@sha256:<hash> python3
example.py`) through the fake runtime.

`isLocalImage` only skipped the registry pull; the run still used the
unresolvable digest ref.

## RED → GREEN record

RED (both fail on assertions, never on build errors):

- `TestPlanRunResolvesLocalDigestToBareTag` (`containerplan/run_test.go`):
  `derived local` row — `argv misses image
"ayokoding-toolchain/shell:<hash>"`, argv held the `@sha256:`-suffixed
  ref. `environment local` and `official pinned` rows passed pre-fix.
- `TestRunExecutesLocalDerivedImageByBareTag` (`application/run_test.go`):
  `local derived runs by bare tag` row — `argv misses "
ayokoding-toolchain/python:<hash> "` through the full
  `application.Run` double-run. `official keeps its digest ref` passed
  pre-fix.

GREEN (design):

- `containerplan/run.go`: new `IsLocalImage` (the two harness-local
  namespaces, moved here as the single source) and new `RunRef` — local
  refs strip the `@sha256:` suffix to the bare tag; official pinned-digest
  refs pass through unchanged. `PlanRun` appends `RunRef(cfg.Image)`.
- `application/run_execute.go`: `isLocalImage` delegates to
  `containerplan.IsLocalImage` (pull-skip behavior identical; pull and
  plan now agree on one namespace list).
- `ServiceStart` untouched: services run official images only.
- No new lint exclusions; `lint` passes with cyclop/funlen active.

## Per-id before → after (FIXTURE via hippo, rebuilt binary)

`apps/ayokoding-cli/dist/ayokoding-cli --content
apps/ayokoding-cli/tests/testdata/toolchain-smoke examples check
--course <id>`

| id             | before (gate SMOKE)               | after                                                                                                                                                                                                                                                                                                                                          |
| -------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shell          | `exit-mismatch ... actual 125`    | `shell learning/code/ex-01-hello main: passed`                                                                                                                                                                                                                                                                                                 |
| lua            | `exit-mismatch ... actual 125`    | `lua learning/code/ex-01-hello main: passed`                                                                                                                                                                                                                                                                                                   |
| windows-static | `exit-mismatch ... actual 125` ×2 | 125s gone; both runs now execute but report `stderr-mismatch` on the `linux/amd64 ... no specific platform was requested` warning — the derived image is `amd64` (`docker image inspect` confirms) on this `arm64` host. Same class as gate triage item 3 (image arch / expectation bytes, both outside this ownership). Reported, not chased. |

## Gates

- `CLI-BUILD` (`go build -trimpath -o dist/ayokoding-cli
./cmd/ayokoding-cli`, the `build` target's command): exit 0.
- `CLI-QUICK` (`nx run ayokoding-cli:test:quick --skip-nx-cache`):
  exit 0 on 2nd attempt — attempt 1 died to hippo pressure-shed
  (`hippo.limit.pressure-shed` after a memory warning, environment, not
  code; same precedent as the gate file's attempts 1–2). Final: `lint`,
  `typecheck`, `test:unit` (coverage gate 100.00%, 24/24), and all four
  `test:coverage` adapters green.
- Race-detector runs of both touched packages (`go test -race
./internal/domain/containerplan/ ./internal/application/`): ok.
- Leftover sweeps after the fixture runs: `docker ps -a --filter
label=ayokoding.run` empty, `docker network ls --filter
name=ayokoding-` empty.
