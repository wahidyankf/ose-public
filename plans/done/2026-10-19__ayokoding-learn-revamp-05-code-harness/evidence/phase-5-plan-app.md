# Phase 5 Plan + Application — Evidence (AC-5.1 / AC-5.2 / AC-5.3)

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`. All commands run with cwd
`apps/ayokoding-cli` unless noted. Go `go1.27.2` darwin/arm64.
Ownership: `internal/domain/containerplan/**`,
`internal/application/run*.go`, `internal/adapters/cli/root.go` (runCommand
hunk only), `tests/bdd/steps_test.go` bindings, fixture courses under
`tests/testdata/courses/`, this file. No commits made.

## AC-5.1 — containerplan Run argv (byte-for-byte)

Files: `internal/domain/containerplan/run.go`,
`internal/domain/containerplan/run_test.go` (9 tests).

RED (assertion, not stub): `TestPlanRunIsolationFlags` failed on the
planned argv before the implementation — `PlanRun`/`RunConfig` undefined
at first (build red), then the exact-argv assertion failed against the
empty plan. GREEN after `run.go`:

```text
ok  github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan  1.033s  (go test -race -count=1)
coverage: 99.1% of statements
```

Plan shape (per execution): `run --rm --name ayokoding-<runID>-<exec>
--label ayokoding.run=<runID> --network none|named --read-only
--tmpfs /tmp:rw,nosuid,size=512m --cap-drop ALL --security-opt
no-new-privileges --pids-limit 256 --memory/--memory-swap --cpus <quota>
--user UID:GID --env <sorted merged> --mount type=bind,source=<work>,
target=/work --workdir <runWorkdir> <image> <command...>`.
`--interactive` only with stdin. Merged env: fixed `HOME/LANG/
PYTHONHASHSEED/SOURCE_DATE_EPOCH/TZ` + `AYOKODING_UNIT` + toolchain +
service + run layers, `AYOKODING_SEED` only in replay. `t.Setenv
SECRET_TOKEN` test proves no host leak. `cpuQuota`: full on seq 0, half
on seq 1 (`--cpus 0.5` when CPUs=1).

Name-ordinal evolution (found by real-Docker E2E, see below): the name
first used the per-run seq (`ayokoding-<runID>-<seq>`), which collides
across units when a still-running container holds the name. RED:
`TestRunContainerNamesUnique` failed with
`names=["ayokoding-test-run-1-0" "ayokoding-test-run-1-1"
"ayokoding-test-run-1-0" "ayokoding-test-run-1-1"], want all distinct`.
GREEN: `RunConfig.Exec` (command-scoped execution ordinal) names the
container; `Seq` keeps driving the quota
(`TestPlanRunSecondSequenceNames` asserts `Seq=1,Exec=5` → name `-5`
with `--cpus 1`). Unit suite green with `-race` after the change.

## AC-5.2 — services plan

Files: `internal/domain/containerplan/services.go`,
`internal/domain/containerplan/services_test.go` (8 tests).

RED: `undefined ServiceConfig/NetworkCreate/...` (build red), then
assertion red. GREEN:

```text
ok  github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan  1.033s  (go test -race -count=1)
```

`NetworkName` (sha256 unit hash, 8 hex), `NetworkCreate` (`network create
--internal --label`), `ServiceStart` (`run -d --name --label --network
--network-alias --tmpfs <dataDir>:rw,nosuid --env sorted + image`),
`Cleanup` (`rm -f` then `network rm`), `PollReady` (500 ms cadence over
the fake clock `Now`/`Sleep`, `finding.EnvServiceUnready` → exit 124,
context cancel wrapped `containerplan: poll service %q`). Data dirs:
`postgres:/var/lib/postgresql/data`.

## AC-5.3 — application Run

Files: `internal/application/run_runtime.go` (`Runtime`/`EnvImageBuilder`
ports, `Execution`, 7 finding codes), `run.go` (`RunRequest/RunReport/
PassedRun/ReplayOutput/runner`, flag checks, probe → 24 h sweep →
courses), `run_prepare.go` (spec parse, image resolve, per-execution
working copy, link placement, duplicate-link + NUL-parent checks,
0750/0644), `run_execute.go` (services setup/teardown, single pull for
`@sha256:` images, double run seq 0/1 with comparison, expectation
check with first-differing-line, simulation gate, replay, `--record`
missing-files-only, `--single-run`, precedence 2 > env > 1 > 0).

RED: `undefined RunRequest/RunReport/Run` (build red), then ~50
`scriptedRuntime` tests red on assertions. GREEN:

```text
ok  github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application  1.155s  (go test -race -count=1)
coverage: 97.8% of statements
```

Fresh-copy evolution (found by real-Docker E2E): executions first shared
one working copy, so a self-mutating program poisoned the second
execution. RED: `TestRunExecutionsUseFreshCopies` failed with
`stdout-mismatch ... actual "second sees dirt"`. GREEN: `executeOnce`
materializes its own copy per execution (removed on every path).

## CLI wiring (`internal/adapters/cli/root.go`, runCommand hunk only)

`runAdapter` over `containers.Runtime` (stdin dropped, combined
Output→Stdout, TimeoutError/deadline→TimedOut), `--since/--shard`
rejected with `UsageNotImplemented`, `renderRun` text + JSON
(schemaVersion 1, no timestamps/paths). `internal/adapters/cli` tests
pass. Static gates:

```text
go tool golangci-lint run ./internal/...  →  0 issues.
go tool nilaway -include-pkgs=... ./...   →  clean.
gofmt -l internal/ tests/                 →  clean.
go test -count=1 ./internal/...           →  all ok (10 packages).
```

## Fixtures (`tests/testdata/courses/`)

`failing-run` (exit 3 / BETA-vs-beta line 2 / stderr-as-stdout line 2 /
30 s sleep with `timeout:2s` / record pair), `nondeterministic`
(unseeded `random.random()`), `network-attempt` (urllib example.com),
`simulation` (xorshift-64 deterministic + `AYOKODING_SEED` trace,
no-summary, 8-seed, bugdemo seeds 4/31 exit 1), `services-postgres`
(psycopg-binary 3.3.6 pinned both-arch hashes), `static-unit` (check.py),
`green-python` ex-03-env + ex-04-immutable (self-overwriting sticky.py),
`green-kata` kata-01-hello. All validate (`examples validate` EXIT:0).

## BDD (`tests/bdd/steps_test.go`)

Verbatim step bindings for the new scenarios; `TestContract`: 33 passed
/ 20 failed, all 20 environment-bound (placeholder `sha256:aaa...`
unpullable → 125; other-agent Backgrounds; buildkit Dockerfile error in
this env). Zero binding bugs.

## Real-Docker E2E (python `sha256:e748956c...`, postgres `sha256:74935e72...`)

green-python (proof catalog, real daemon): EXIT 0 —

```text
green-python learning/code/ex-01-hello main: passed
green-python learning/code/ex-02-range main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
```

Course files untouched (`sticky.py` intact, `git status` clean apart
from new fixtures). failing-run first pass: 4/5 findings exact
(first-differing-line shown); ex-05-record spuriously nondeterministic
(first exit 125) — diagnosed as container-name collision with the
still-sleeping ex-04-timeout container (docker 125 "name already in
use"), fixed by the Exec ordinal above. Rerun below after the daemon
recovery.

## E2E rerun matrix (daemon recovered after one Docker Desktop restart)

Environment note: mid-session the Docker daemon socket vanished and the
Desktop VM exited (all `com.docker` processes gone, guest log stalled at
`lifecycle-server.sock: does not exist yet`). One `open -a Docker`
restored daemon `24.0.2`; pulled images survived. Real digests used via
`/tmp/proof-catalog.yaml` (test catalog keeps the placeholder
`sha256:aaa...`, untouched — out of scope).

- [x] failing-run full course → EXIT 1, no 125s: ex-01 exit-mismatch
      (actual 3), ex-02 stdout-mismatch line 2 (beta/BETA), ex-03
      stdout-mismatch line 1 (stderr surfaces in the merged stream;
      stabilized with a 1 s separator — daemon interleave is otherwise a
      coin flip; true `stderr-mismatch` waits on split streams),
      ex-04 run-timeout 2 s, ex-05-record both runs passed. Stable over
      repeated runs.
- [x] nondeterministic → `nondeterministic ... at line 1: first
"0.744...", second "0.163..."`, EXIT 1. network-attempt →
      exit-mismatch actual 1 (no network), EXIT 1.
- [x] simulation → ex-01-sim passed, ex-04-bugdemo passed (exit 1 with
      failing seeds, per spec), ex-02-no-summary + ex-03-few-seeds
      `simulation-summary` findings, EXIT 1.
- [x] replay `--seed 17` on ex-01-sim → passed + `replay seed 17` +
      trace lines, EXIT 0. `--single-run` green-python → 4/4 passed.
- [x] `--record` on a scratch copy → missing `second.stdout.txt`
      written with `two\n`, existing file unchanged, re-run prompt
      finding; committed fixtures untouched.
- [x] static-unit → `passed (static)`, EXIT 0. green-kata → passed.
      JSON render → `{"schemaVersion":1,...}`, EXIT 0.
- [ ] services-postgres → `env-build-failed`: buildkit `failed to read
dockerfile` inside the containers-agent `Builder.BuildEnvironment`
      path (out of scope); application handling verified (finding, EXIT
      1, zero leftover containers/networks). For the containers agent.
- [ ] interrupt 130 → other-agent scope, not attempted.
- [x] BDD `TestContract` rerun → still 33 passed / 20 failed
      (169 passed / 20 failed / 27 skipped steps), identical
      classification: placeholder-digest 125s, other-agent Backgrounds,
      buildkit Dockerfile error. Zero regressions from this change set.
