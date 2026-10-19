# Evidence — Phase 5 AC-5.4 container adapter (swe-developer)

Scope: `apps/ayokoding-cli/internal/adapters/containers/run.go`,
`procgroup_unix.go`, `procgroup_windows.go`,
`tests/support/fakecontainer/main.go`,
`tests/integration/containers_test.go`, and this file. No commit, no
push, no folder moves. All commands ran from
`apps/ayokoding-cli` in the execution worktree unless stated.

Baseline on the untouched tree: `go build ./...` plus
`go test ./internal/adapters/containers/... ./tests/integration/...`
both passed.

## Files

- `internal/adapters/containers/run.go`: `Runtime` (planned
  `containerplan.Invocation` in, exit status out), `Result`,
  `TimeoutError`, `ResolveCLI`, `Run`, `Probe`, `Pull`, `WaitReady`,
  `TrackContainer`, `TrackNetwork`, `Cleanup`, `SweepLeftovers`, plus
  `supervisedExec` (`exec.Command` with `Setpgid`, group kill on
  context done) and `stale`/`parseCreated` for the 24h sweep.
- `internal/adapters/containers/procgroup_unix.go`,
  `procgroup_windows.go`: process-group setup and kill per OS.
- `tests/support/fakecontainer/main.go`: fake container CLI built into
  `t.TempDir()`, selected via `AYOKODING_CONTAINER_CLI`, scripted via
  `FAKECONTAINER_*` variables (log, sleep, run exit, daemon down, pull
  fail, never ready, ps/network listings).
- `tests/integration/containers_test.go`: ten tests covering every
  AC-5.4 clause, including a real-SIGINT helper subprocess.

## RED

`go test -count=1 -run 'TestContainers_|TestInterruptChildMain' ./tests/integration/`
against the compiling stub (wrong values, no process started).
Every failure is an assertion, never a build error:

```text
--- FAIL: TestContainers_RunRecordsPlannedArgv (0.62s)
    containers_test.go:134: fake log lacks "argv: run --rm --name ayokoding-abc-0 ..."
--- FAIL: TestContainers_RunTimeoutKillsContainer (0.46s)
    containers_test.go:152: error type=<nil>, want *containers.TimeoutError (<nil>)
--- FAIL: TestContainers_MissingCLIExits127 (0.41s)
    containers_test.go:169: expected ayokoding.env.not-found, got no error
--- FAIL: TestContainers_NonExecutableCLIExits126 (0.39s)
    containers_test.go:189: expected ayokoding.env.not-executable, got no error
--- FAIL: TestContainers_DaemonDownExits125 (0.47s)
    containers_test.go:196: expected ayokoding.env.runtime-refused, got no error
--- FAIL: TestContainers_PullFailureExits125 (0.46s)
    containers_test.go:204: expected ayokoding.env.runtime-refused, got no error
--- FAIL: TestContainers_ServiceNeverReadyExits124 (0.47s)
    containers_test.go:215: expected ayokoding.env.service-unready, got no error
--- FAIL: TestContainers_InterruptRemovesLabelledResourcesAndExits130 (30.51s)
    containers_test.go:250: fake log never showed "started ayokoding-int-0":
--- FAIL: TestContainers_SweepRemovesLeftoversOlderThan24Hours (0.48s)
    containers_test.go:311: fake log lacks "rm -f ayokoding-old-0":
FAIL
```

## GREEN

`go test -count=1 -run 'TestContainers_|TestInterruptChildMain' -v ./tests/integration/`
after implementing `run.go` and the `procgroup_*` files:

```text
--- PASS: TestContainers_RunRecordsPlannedArgv (0.55s)
--- PASS: TestContainers_RunTimeoutKillsContainer (0.78s)
--- PASS: TestContainers_MissingCLIExits127 (0.46s)
--- PASS: TestContainers_NonExecutableCLIExits126 (0.46s)
--- PASS: TestContainers_DaemonDownExits125 (0.45s)
--- PASS: TestContainers_PullFailureExits125 (0.43s)
--- PASS: TestContainers_ServiceNeverReadyExits124 (0.65s)
--- PASS: TestContainers_ServiceReadyPasses (0.46s)
--- PASS: TestContainers_InterruptRemovesLabelledResourcesAndExits130 (0.50s)
--- SKIP: TestInterruptChildMain (0.00s)
--- PASS: TestContainers_SweepRemovesLeftoversOlderThan24Hours (0.54s)
PASS
```

Race detector: `go test -race -count=1
./internal/adapters/containers/... ./tests/integration/...` passed.
`gofmt`, `go vet`, and `go tool gofumpt -l` report nothing.

## Gates

`golangci-lint run` on the owned paths
(`internal/adapters/containers/...`, `tests/integration/...`,
`tests/support/fakecontainer/...`): 0 issues. `gofmt`, `go vet`, and
`go tool gofumpt -l` report nothing. `go test -race -count=1` on
`./internal/adapters/containers/... ./tests/integration/...` passes,
including the pre-existing signal tests.

`nx run ayokoding-cli:test:integration` (rerun for GREEN): the
`tests/integration` leg passes (`ok ... 6.337s`); the `tests/bdd` leg
fails only on `unknown given step` (39 occurrences, zero other
assertion failures) for the 21 new Phase-5 scenarios whose step
bindings belong to the concurrent containerplan/application agent
(AC-5.3; `tests/bdd` is outside this task's file set). This matches the
specs-maker RED recorded in `phase-5-gherkin.md`.

`nx run ayokoding-cli:test:quick` (rerun for REFACTOR): the `lint`
leg reports 0 issues in the owned files; the run fails on a
typecheck error in the concurrent agent's in-progress
`internal/application/run_*_test.go` (`undefined:
application.RunRequest`, `application.Run`, `application.RunReport`),
which is their RED phase and outside this task's file set.

## Assumptions for the root coordinator

- No `ContainerRuntime` interface existed (`internal/application` has
  no `run*.go` yet), so the seam is defined inside the owned package:
  `containers.Runtime` with `Run(Invocation) (Result, error)`. The
  plan shape is reused read-only: `containerplan.Invocation`
  (`build.go`, Phase 3 green). `AYOKODING_CONTAINER_CLI` overrides any
  planned binary.
- Finding codes reuse the frozen Phase-1 vocabulary
  (`finding.EnvNotFound`, `EnvNotExecutable`, `EnvRuntimeRefused`,
  `EnvServiceUnready`), which map to exits 127/126/125/124 exactly as
  tech-docs/005 requires; the literal code strings differ from the
  tech-doc names (for example `ayokoding.env.not-found` versus
  `ayokoding.env.container-cli-not-found`) and were not changed.
- Run timeouts surface as `*containers.TimeoutError` (not an env
  status); the application maps it to `ayokoding.examples.run-timeout`
  (exit 1) per tech-docs/005.
- `Cleanup` is the `cli.Options.OnInterrupt` hook body (the Phase-1
  handler in `internal/adapters/cli/cli.go` already calls the hook and
  returns 130); wiring it to real runs is root's step alongside AC-5.3.
- The sweep lists `ps -a --filter label=ayokoding.run --format
{{.Names}}|{{.CreatedAt}}` and the network analogue, parsing RFC
  3339 or Docker's CreatedAt layout; E2E (AC-5.5) validates the argv
  against real Docker.
