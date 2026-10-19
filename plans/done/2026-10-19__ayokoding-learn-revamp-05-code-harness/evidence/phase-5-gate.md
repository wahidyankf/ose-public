# Evidence — Phase 5 AC-5.5 fixtures, E2E, and toolchain smoke (swe-developer)

Scope: `apps/ayokoding-cli/internal/application/check.go`,
`internal/adapters/cli/check_cmd.go`, `internal/adapters/cli/root.go`
(check/run wiring only), `internal/adapters/containers/run.go`,
`internal/domain/containerplan/{run,build,services}.go`,
`internal/domain/finding/finding.go`,
`internal/application/run*.go`, `tests/bdd/steps_test.go`,
`tests/testdata/courses/{services-unready/**,services-postgres/**/requirements.lock}`,
fixture hygiene (`__pycache__` removals), and this file. No commit, no
push, no folder moves. Docker daemon `24.0.2`, Go `go1.27.2` darwin/arm64.

Ownership deviations: none. `tests/integration/containers_test.go:268`
(`t.Skip` tripping the `test:unit` skip-grep) belongs to the AC-5.4
containers agent and is reported, not edited — see Blockers.

## Baseline (untouched tree)

`go test -count=1 ./tests/bdd/` (unit adapter): 33 passed / 20 failed —
every failure `ayokoding.env.runtime-refused ... manifest unknown` on the
placeholder `sha256:aaa...` test catalog, plus other-agent Backgrounds and
the buildkit Dockerfile error. Zero step bindings missing at runtime, but
the six environment/interrupt Givens/Whens/Thens below were unbound
(`unknown ... step`).

## RED → GREEN record

### 1. Supervisor vocabulary (frozen specs vs implementation)

RED (`TestEnvCodesMatchSupervisorTable`, `TestProbe_failureNamesRuntimeUnavailable`):
`ayokoding.env.service-unready/runtime-refused/not-executable/not-found`
against tech-docs/005 and the frozen `environment-failures.feature`
(`container-cli-not-found`, `container-runtime-unavailable`, exit
127/125). GREEN: renamed the four `finding` values (constant identifiers
unchanged, so `tests/integration` symbolic assertions keep passing);
`ExitCode` mapping unchanged (124/125/126/127).

DEVIATION (recorded, not implemented): tech-docs/005 also wants
`ayokoding.env.image-pull-failed` for pull failures and
`container-cli-not-executable`/`service-not-ready` renames — the last two
ARE implemented (renames); the pull/daemon SPLIT was reverted because the
AC-5.4 `TestContainers_PullFailureExits125` pins pull failures to
`finding.EnvRuntimeRefused` and that file is outside this task's ownership.
No frozen spec or gate asserts the pull code. Root should schedule the
split with the containers-agent file update (one assertion line).

### 2. Build context Dockerfile path (services-postgres env build)

RED (`TestDerived_fileTravelsWithContext` + real Docker probe):
`docker buildx build --load --tag ... --file Dockerfile <abstmp>` fails
with `failed to read dockerfile` — buildkit resolves a bare filename
against the caller working directory, not the context. Reproduced against
`24.0.2` with a scratch context. GREEN: `buildArgv` plans
`--file <contextDir>/Dockerfile`; updated the four byte-exact argv
expectations and the adapter argv assertion. `toolchains build` of all ten
derived ids succeeds after the fix.

### 3. Harness-local images skip the registry pull

RED (`TestRunSkipsPullForLocalImages`): derived
`ayokoding-toolchain/<id>:<hash>@sha256:<hash>` refs contain `@sha256:`
so `flow.pull` tried `docker pull` on them — no registry serves them.
GREEN: `isLocalImage` skips the `ayokoding-toolchain/` and
`ayokoding-env/` namespaces (the only two the codebase constructs).

### 4. `examples check` (AC-5.5 FIXTURE + SMOKE need it; Phase 6 extends it)

RED (`TestCheck*` ×5 against a compiling stub, `TestCheckUnknownCourse*`
against `notImplemented`): `examples check` exited 2
`ayokoding.usage.not-implemented`. GREEN: `application.Check`
(validate + sync + run over `--course`/`--all`, findings deduplicated,
usage > environment > findings precedence) with `runCheck` wiring and
text/JSON rendering. `--since`/`--shard` stay `not-implemented` for the
Phase 6 selection. The contract `check --course many` spam path still
exits 141 (fault seam runs before the use case).

### 5. Interrupt cleanup wiring (AC-5.4 contract, AC-5.3 missed the hookup)

RED (`TestRunTracksExecutionContainers`,
`TestRunCleansTrackedResourcesOnInterrupt`, then the BDD interrupt
scenario): run execution containers were never tracked and nothing called
`Runtime.Cleanup` on interrupt — SIGINT exited 130 but leaked containers.
GREEN: `containerplan.RunName` (single source; `PlanRun` uses it,
byte-identical argv), `executeOnce` tracks every execution, `flow.run`
defers `cleanupAtInterrupt` (request values without cancellation), and
`runAdapter` exposes `Cleanup`. Verified with a real SIGINT against the
fake runtime (BDD) and the adapter-level helper (AC-5.4 file, untouched).

### 6. Timed-out executions orphan their container (suite flake root cause)

Proved empirically: killing a `docker run` client leaves the container
`Up` (daemon-side processes ignore the client death and process-group
kill). The `ex-04-timeout` orphan lived ~28 s and tripped later
`dockerEmpty` assertions nondeterministically. RED
(`TestRunTimeoutRemovesTimedOutContainer`). GREEN: `executeOnce` removes
the timed-out container through the new `Runtime.RemoveContainer` port
(best-effort; the finding already reports the timeout), implemented on
`containers.Runtime` (`rm -f`) and passed through `runAdapter`.

### 7. Split container streams (frozen stderr-mismatch scenario)

RED (BDD `Unexpected standard error fails the run`): the adapter merged
stderr into stdout, so the warning surfaced as `stdout-mismatch` and
`stderr-mismatch` could never fire — while AC-5.3 specifies stderr
`empty`/`ignore`/file comparisons and the application implements them.
GREEN: `supervisedExec` captures each stream separately (control-plane
calls keep one combined buffer through the unchanged `Exec` seam);
`Result` gains `Stderr`, mapped into `Application.Execution` by
`runAdapter`. Pinned by `TestRun_splitsContainerStreams` (`/bin/sh`
writes to both streams, exit 3). The `Exec` seam signature is unchanged,
so `tests/integration` fakes keep working.

### 8. Readiness probes ignored exit statuses (124 never fired for real)

RED (`TestRunServiceUnreadyExit124`, then the BDD 124 scenario with
`FAKECONTAINER_NEVER_READY`): `waitServices` treated any probe process
exit as success because `Runtime.Run` returns statuses as data — a
`pg_isready` exit 1 read as ready. The adapter-level `WaitReady` (unused
by the application) already treats nonzero exits as unready. GREEN: the
probe fails on `executed.Exit != 0` through static `errProbeUnready`.

### 9. Postgres 18 data directory (real service never became ready)

With probes fixed, real postgres never reported ready: mounting a tmpfs
at `/var/lib/postgresql/data` trips the 18+ `pg_ctlcluster` layout guard
(`unused mount/volume`, entrypoint exits 1). Verified the parent mount
works (`pg_isready` exit 0). GREEN: `serviceDataDirs["postgres"]` is now
`/var/lib/postgresql`. No unit test pinned the old value.

### 10. Postgres fixture lockfile missed `psycopg` (`--no-deps` recipe)

The query died with `ModuleNotFoundError: No module named 'psycopg'`:
`psycopg-binary` wheels ship only `psycopg_binary`, and the catalog
install recipe deliberately uses `--no-deps`, so the pure `psycopg`
package must be pinned in the lockfile too. Added `psycopg==3.3.6` with
both PyPI hashes, each corroborated by downloading the artifact
(wheel `a1db9f71…`, sdist `c081f225…`); the pre-existing binary hashes
verified as the cp315 x86_64 + aarch64 wheels. The env image tag moved
accordingly (content hash). Also removed stray `__pycache__` dirs from
the `services-postgres` and `network-attempt` fixtures.

### 11. BDD bindings (all in `tests/bdd/steps_test.go`)

- Run scenarios use the embedded catalog (real pinned digests — the same
  images FIXTURE/SMOKE run); the placeholder test catalog stays for
  validate/list scenarios.
- New Givens: `an opted-in course with one unit` (static-unit),
  `the container command does not exist` (missing path),
  `the container command exists but is not executable` (0644 stub),
  `the container runtime reports that it is unavailable`
  (fake + `FAKECONTAINER_DAEMON_DOWN`),
  `the unit declares a service that never reports ready` (new
  lockfile-free `services-unready` fixture + fake `NEVER_READY` +
  generated 2 s-`readyTimeout` catalog copy),
  `a fixture course whose run is still executing` (built CLI + fake
  `SLEEP=30` + log).
- New When: `the harness receives an interrupt` (child CLI, poll log for
  `started ayokoding-`, SIGINT, record 130) — uniform across drivers
  because signals cannot target the in-process unit driver.
- New Thens: statuses 124/125/126/127/130, the two spec error codes, and
  `every container and network labelled with this run is removed`
  (fake-log started/removed matching + real-daemon emptiness).
- `I check the course by name` honors `w.unit` when a Given focuses one
  (only the bugdemo scenario sets it — whole-course runs there can never
  pass because sibling negative fixtures fail by design).
- `only the validator command was executed` asserts the green static
  label with status 0 (the harness never echoes program output; running
  the Swift program as Python would fail instead).
- `requireServiceCleanup` keeps the fake-log ordering proof when the log
  is non-empty and always asserts real-daemon emptiness.
- Dispatcher splits (no new lint exclusions): `givenPhase5`,
  `thenContract`, `thenSimulation`, `thenEnv`.

## E2E real-container proof (sampled `docker events`, label-filtered)

`examples run --course green-python --unit learning/code/ex-01-hello`
(double run) produced, under `label=ayokoding.run`:

- `container create/start` for
  `ayokoding-1792321160470543000-64163-0` and `...-1`,
  `image=docker.io/library/python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24`
  (the embedded pinned digest, not the placeholder),
- `container die ... exitCode=0` then `container destroy` for both.

The full CLI-E2E suite (53 scenarios, real binary, real daemon) exits 0;
every E2E-bound run scenario passes only through such containers.

## FIXTURE outputs (through `rtk ./hippo run`, saved verbatim)

`examples check --course green-python` → exit 0:

```text
green-python learning/code/ex-01-hello main: passed
green-python learning/code/ex-02-range main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
```

`examples check --course failing-run` → exit 1:

```text
failing-run learning/code/ex-05-record first: passed
failing-run learning/code/ex-05-record second: passed
failing-run learning/code/ex-01-exit:0: failed ayokoding.sync.unreferenced-unit: no lesson anchor targets a file inside unit learning/code/ex-01-exit
failing-run learning/code/ex-01-exit/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 3
failing-run learning/code/ex-02-output:0: failed ayokoding.sync.unreferenced-unit: no lesson anchor targets a file inside unit learning/code/ex-02-output
failing-run learning/code/ex-02-output/run.yaml:1: failed ayokoding.examples.stdout-mismatch: run "main" stdout differs at line 2: expected "beta", actual "BETA"
failing-run learning/code/ex-03-stderr:0: failed ayokoding.sync.unreferenced-unit: no lesson anchor targets a file inside unit learning/code/ex-03-stderr
failing-run learning/code/ex-03-stderr/run.yaml:1: failed ayokoding.examples.stderr-mismatch: run "main" stderr differs: expected empty, actual "warning: slow mirror\n"
failing-run learning/code/ex-04-timeout:0: failed ayokoding.sync.unreferenced-unit: no lesson anchor targets a file inside unit learning/code/ex-04-timeout
failing-run learning/code/ex-04-timeout/run.yaml:1: failed ayokoding.examples.run-timeout: run "main" exceeded timeout 2s
failing-run learning/code/ex-05-record:0: failed ayokoding.sync.unreferenced-unit: no lesson anchor targets a file inside unit learning/code/ex-05-record
```

(The `unreferenced-unit` sync lines are by fixture design: `failing-run`
ships no lessons. `green-python` lessons anchor every unit, so its check
is silent.)

## Gate runs (completed 2026-10-18 WIB, swe-developer)

All commands from the worktree root, per the delivery.md Command Reference,
`--skip-nx-cache` where noted. Docker daemon `24.0.2`, Go `go1.27.2`
darwin/arm64 (arm64 host — matters for two failures below).

| Gate                                                                                                    | Result                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLI-BUILD` (`nx run ayokoding-cli:build`, standard)                                                    | exit 0                                                                                                                                     |
| `SMOKE` (official heavy-tier run, retry — first attempt was shed by hippo post-payload, output lost)    | exit **1** — 10 passed lines, 30 failed lines (verbatim below)                                                                             |
| leftover `docker ps -a --filter label=ayokoding.run` (standard, after SMOKE and again after every gate) | exit 0, empty both times                                                                                                                   |
| leftover `docker network ls --filter name=ayokoding-` (standard, same timing)                           | exit 0, empty both times                                                                                                                   |
| `CLI-QUICK` (`test:quick --skip-nx-cache`, standard)                                                    | exit 0 on 3rd attempt; attempts 1–2 died to hippo pressure-shed (exit 124, once in `nilaway`, once in `test:unit`) — environment, not code |
| `CLI-UNIT` standalone (`test:unit --skip-nx-cache`)                                                     | exit 0 — the `t.Skip` skip-grep fix holds; coverage gate 100.00% (24/24)                                                                   |
| `CLI-BEHAVIOUR` (`test:coverage --skip-nx-cache`)                                                       | exit 0 (10 features, 53 expanded scenarios)                                                                                                |
| `CLI-INTEGRATION` (`test:integration --skip-nx-cache`, heavy)                                           | exit 0 (`tests/bdd` 66 s, `tests/integration` 7 s)                                                                                         |
| `CLI-E2E` (`test:e2e --skip-nx-cache`, heavy)                                                           | exit 0 (`tests/bdd` 70 s)                                                                                                                  |

Fully-green catalog ids: `dart`, `elixir`, `node`, `postgres`, `python`,
`swift`. Partial: `gcc`/`java`/`rust` build-only, `swift-parse` static-only.
The other 20 ids fail — triaged below, none dropped, none fixed here:
every fault sits in `toolchains/**`, `tests/testdata/toolchain-smoke/**`
bytes, or `src`, all outside this task's ownership (STOP per task order).
No failing id reads `tests/testdata/courses/**` (SMOKE `--content` points
at `toolchain-smoke`), so no owned edit could green it. No off-limits path
was touched; nothing committed, pushed, or moved.

### SMOKE output (verbatim, exit 1)

```text
dart learning/code/ex-01-hello main: passed
elixir learning/code/ex-01-hello main: passed
gcc learning/code/ex-01-hello build: passed
java learning/code/ex-01-hello build: passed
node learning/code/ex-01-hello main: passed
postgres learning/code/ex-01-hello query: passed
python learning/code/ex-01-hello main: passed
rust learning/code/ex-01-hello build: passed
swift learning/code/ex-01-hello main: passed
swift-parse learning/code/ex-01-hello parse: passed (static)
dotnet learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "build" differs: expected exit 0, actual 1
dotnet learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 1
flutter learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "test" differs: expected exit 0, actual 125
gcc learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 127
go learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.nondeterministic: run "main" differs between executions on standard error at line 1: first "fork/exec /tmp/go-build2289087812/b001/exe/main: permission denied", second "fork/exec /tmp/go-build3827964073/b001/exe/main: permission denied"
java learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 1
kotlin learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "build" differs: expected exit 0, actual 125
kotlin learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
ktlint learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "lint" differs: expected exit 0, actual 125
ktlint learning/lessons/ktlint.md:11: failed ayokoding.sync.mismatch: fence body line 2 differs: expected "" found ""
kubeconform learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "check" differs: expected exit 0, actual 125
lua learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
luajit learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
neo4j learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "query" differs: expected exit 0, actual 1
neovim learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
ocaml learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 50
opentofu learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "validate" differs: expected exit 0, actual 1
opentofu learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "init" differs: expected exit 0, actual 1
powershell learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.stderr-mismatch: run "main" stderr differs: expected empty, actual "WARNING: The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested\n"
racket learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.stderr-mismatch: run "main" stderr differs: expected empty, actual "WARNING: The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested\n"
rust learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 127
shell learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
swift-parse learning/lessons/swift-parse.md:9: failed ayokoding.sync.mismatch: fence body line 2 differs: expected "" found ""
typescript learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "build" differs: expected exit 0, actual 125
typescript learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "main" differs: expected exit 0, actual 125
windows-static learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "syntax" differs: expected exit 0, actual 125
windows-static learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.exit-mismatch: run "parse" differs: expected exit 0, actual 125
```

### SMOKE triage — first blocking failure (STOP, evidence for the owner)

1. **The 125 cluster (root-caused): `flutter`, `kotlin` ×2, `ktlint`
   lint, `kubeconform`, `lua`, `luajit`, `neovim`, `shell`, `typescript`
   ×2, `windows-static` ×2 — every derived (`ayokoding-toolchain/`) run.**
   Captured the real argv through an `AYOKODING_CONTAINER_CLI` logging
   wrapper (in `/tmp`, outside the repo): the harness plans `docker run
... ayokoding-toolchain/<id>:<hash>@sha256:<hash> ...`. Locally-built
   images carry no RepoDigest (verified: `docker image inspect` shows
   `RepoDigests=[]`), so the daemon answers `Unable to find image
locally` and then `pull access denied` — `docker run` exits 125
   (reproduced by hand). The same argv with the bare tag exits 0, and the
   image itself is arm64-healthy (`bash --version` exits 0), so neither
   the `Dockerfile` nor the fixture is at fault: the fix is to resolve
   harness-local refs to the bare tag (or equivalent) at plan/run time —
   `src` (`internal/application/run_execute.go` pull/plan path,
   `internal/domain/containerplan`), outside this task's ownership. The
   pull-skip (`isLocalImage`) only skips the registry pull; the run still
   uses the unresolvable digest ref.
2. **Program failures inside official images — owner: smoke-fixture or
   image bytes:** `dotnet` build+main exit 1, `java` main exit 1,
   `neo4j` query exit 1, `opentofu` init+validate exit 1, `ocaml` main
   exit 50, `gcc`/`rust` main 127 with build passing, `go`
   `nondeterministic` (`fork/exec /tmp/go-build…: permission denied` —
   smells like image user/tmp perms, deterministic across two full
   runs).
3. **Platform warnings on the arm64 host — owner: image arch or
   expectation bytes:** `powershell`/`racket` fail only on the
   `linux/amd64` stderr warning (images are amd64-only).
4. **Sync mismatches in smoke lesson bytes:** `ktlint.md:11`,
   `swift-parse.md:9` (`fence body line 2 differs: expected "" found
""` — invisible whitespace/newline drift).

Determinism note: the direct diagnostic run and the official hippo run
agree line-for-line on every failure, so none of this is flake or host
pressure.

## Blockers

1. `test:unit` (hence `test:quick`) fails at the repo's own skip-grep on
   `tests/integration/containers_test.go:268`
   (`t.Skip("interrupt helper only")`), a file owned by the AC-5.4
   containers agent. The skip never executes under `test:unit`
   (`coverage-gate.sh` does not run `./tests/integration`), but the grep
   fails the target before any test runs. Untouched per task ownership.
   Recipe for the owner: replace the dispatch `t.Skip` with an early
   `return` when the helper marker env is absent (identical behavior, no
   skip call), or relocate the helper out of `*_test.go` and adjust the
   grep. Everything else in `test:quick` is green (lint, typecheck,
   `test:coverage` all four adapters).
