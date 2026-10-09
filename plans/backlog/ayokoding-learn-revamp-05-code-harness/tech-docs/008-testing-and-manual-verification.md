# Testing Strategy and Manual CLI Verification

## Layers

| Layer           | Where                                                                                                          | What it proves                                                                                                                                                                                                                                 | Runs in                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Unit            | `internal/**/*_test.go`, `tests/architecture`, `tests/coverage`, `tests/bdd` with `AYOKODING_BDD_ADAPTER=unit` | Pure decisions: decoding, validation, anchor grammar, fence classes, sync rewrite, argv construction, selection, shards, coverage maths, summary parsing, exit mapping, rendering. Uses `fstest.MapFS` and in-memory fakes. Runs with `-race`. | `test:unit` → `test:quick` (PR gate)                              |
| Integration     | `tests/integration`, `tests/bdd` with `AYOKODING_BDD_ADAPTER=integration`                                      | Real filesystem (`t.TempDir`), real `git` repositories, the fake container CLI as a child process, signal handling (SIGINT → 130), closed pipe (141), cleanup of labelled containers, `sync --write` on disk                                   | `test:integration` (scheduled twice daily; on demand)             |
| E2E             | `tests/bdd` with `AYOKODING_BDD_ADAPTER=e2e` and `AYOKODING_BIN`                                               | The stamped binary against fixture courses with real Docker: network denial, read-only root, double run, services, dependency image build, static mode, simulation replay, `--version` stamp                                                   | `test:e2e` (scheduled twice daily; on demand)                     |
| Toolchain smoke | `tests/testdata/toolchain-smoke/` (one tiny course per catalog id)                                             | Every catalog image pulls or builds and runs a hello program or validator                                                                                                                                                                      | Phase 5 (`SMOKE`); monthly run; any PR that changes `toolchains/` |

Unit tests never use `t.TempDir`, `t.Setenv`, a listener, or a child process. The repository's Go
standard classes those as Integration.

## Fake Container CLI

`tests/support/fakecontainer` is a small Go program that integration tests build into a temporary
folder and point `AYOKODING_CONTAINER_CLI` at. It:

- records each argv to a log file;
- answers `version`, `image inspect`, `pull`, `buildx build`, `network`, `exec`, `rm`, and `run` from
  a scenario script (JSON) chosen through a variable;
- can return different output on the first and second `run`, which proves nondeterminism
  detection;
- can sleep past a timeout, exit with any status, or report the daemon as down.

It exists only under `tests/` and the production depguard rule forbids importing it.

## Fixture Courses

Every fixture lives under `apps/ayokoding-cli/tests/testdata/courses/<name>/`, in the same shape as a
real course folder. The fixtures are test data, not published content.

| Fixture             | Shape                                                                                                | Used to prove                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `green-python`      | Two examples (`main` with expected stdout, `tests` with pytest), anchored lesson and Output blocks   | The green path, `--record`, JSON payload                |
| `green-kata`        | One kata with `before` (expected exit 1) and `after` runs, labelled-path anchors                     | Kata units and labelled anchors                         |
| `inert-course`      | Code dirs, mismatched fences, no `run.yaml`                                                          | Inert selection: nothing reported, nothing run          |
| `broken-sync`       | One instance of each sync finding                                                                    | Every `ayokoding.sync.*` code                           |
| `broken-layout`     | Flat `ex-NN` file, nested code dir, unit without `run.yaml`, misplaced `run.yaml`                    | Every `ayokoding.layout.*` code                         |
| `broken-runspec`    | Unknown key, missing schema, timeout out of range, static without note, unknown toolchain, `..` path | Every `ayokoding.runspec.*` code                        |
| `failing-run`       | Exit mismatch, stdout mismatch, unexpected stderr, timeout                                           | Every run result code                                   |
| `nondeterministic`  | Prints an unseeded random number and a thread-order-dependent line                                   | `ayokoding.examples.nondeterministic`                   |
| `network-attempt`   | Expects to fetch a URL                                                                               | Network denial (fails under the harness)                |
| `simulation`        | A 64-seed simulation with S7 output, plus a "find the bug" variant expecting exit 1                  | Summary check, replay with `--seed`, bug demonstrations |
| `services-postgres` | Python with a hash-locked database driver and the `postgres` service                                 | Environment image build, internal network, readiness    |
| `static-unit`       | `mode: static` using the smallest validator image                                                    | Static mode and the required note                       |

Expected files in fixtures are written by hand and reviewed. They are never produced by `--record`
inside the test that asserts them.

## Manual CLI Verification

The CLI surface has no listed tester gate, so Phase 8 exercises it by hand through its own
interface and records each command, exit status, and the first lines of each stream in
`<plan>/evidence/phase-8-manual-cli.md`. Paths in evidence are repository-relative.

| #   | Command (from the worktree root)                                                                                                 | Expected                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/ayokoding-cli/dist/ayokoding-cli --help`                                                                                   | Exit 0; usage on stdout; the exit-status table and every subcommand listed                                                                              |
| 2   | `apps/ayokoding-cli/dist/ayokoding-cli`                                                                                          | Exit 2; help on stderr; stdout empty                                                                                                                    |
| 3   | `apps/ayokoding-cli/dist/ayokoding-cli --version`                                                                                | Exit 0; `ayokoding-cli dev (commit unknown, catalog <hash>)`                                                                                            |
| 4   | `apps/ayokoding-cli/dist/ayokoding-cli examples run`                                                                             | Exit 2; `ayokoding.usage.missing-selection` on stderr                                                                                                   |
| 5   | `apps/ayokoding-cli/dist/ayokoding-cli --output json examples run`                                                               | Exit 2; one JSON error body on stderr; stdout empty                                                                                                     |
| 6   | `apps/ayokoding-cli/dist/ayokoding-cli examples check --since origin/main`                                                       | Exit 0; `0 opted-in courses; nothing to run`; coverage `0 of 116 applicable courses covered`; no container started                                      |
| 7   | `apps/ayokoding-cli/dist/ayokoding-cli examples sync --course just-enough-python --output json`                                  | Exit 1; a JSON payload of sync findings for a not-yet-migrated course (preview). Save the counts.                                                       |
| 8   | `apps/ayokoding-cli/dist/ayokoding-cli --content apps/ayokoding-cli/tests/testdata/courses examples check --course green-python` | Exit 0; two units green; progress with durations on stderr only                                                                                         |
| 9   | Same with `--course failing-run`                                                                                                 | Exit 1; four findings with codes                                                                                                                        |
| 10  | Same with `--course simulation` and `examples run --unit learning/code/ex-02-raft-bug --seed 17`                                 | Exit 0 for the replay; the trace printed; no expected-output comparison                                                                                 |
| 11  | `NO_COLOR=1 apps/ayokoding-cli/dist/ayokoding-cli --color auto ... --course failing-run`                                         | No escape sequences in either stream                                                                                                                    |
| 12  | `AYOKODING_CONTAINER_CLI=does-not-exist apps/ayokoding-cli/dist/ayokoding-cli ... --course green-python`                         | Exit 127; `ayokoding.env.container-cli-not-found`                                                                                                       |
| 13  | Run 8 with `--course services-postgres` under `timeout -s INT 5`                                                                 | Exit 130; afterwards `docker ps -a --filter label=ayokoding.run` and `docker network ls --filter name=ayokoding-` list nothing                          |
| 14  | `apps/ayokoding-cli/dist/ayokoding-cli --help \| head -1`, then read `PIPESTATUS[0]`                                             | 141 or 0 (0 is allowed when the whole help fits the pipe buffer); never 1 or 2                                                                          |
| 15  | Baseline for content plans: `examples validate --include-inert --output json` and `examples sync --include-inert --output json`  | Exit 1. Save one table (course, layout findings, sync findings by code) for the 116 applicable courses in `<plan>/evidence/phase-8-content-baseline.md` |

Row 15 gives plans 06–13 a measured starting point that matches the tool they will use. It is
evidence, not a gate: every row is expected to have findings.
