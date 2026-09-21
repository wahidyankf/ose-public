# ferret-cli-e2e

End-to-end tests for [`ferret-cli`](../ferret-cli/README.md), the local FERRET command-line tool. They drive the
built `dist/ferret.pyz` the way a real caller does: as a separate process with an empty inherited environment, a
private `HOME`, and real stdin, stdout, stderr, and exit codes.

## What it proves

| Module                            | What it proves through the public process boundary                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tests/test_package_smoke.py`     | the frozen help and version surface, usage errors, `--json` equal to `--output json`, locale-independent bytes      |
| `tests/test_standalone.py`        | every command works from the built artifact with every network socket denied                                        |
| `tests/test_query_export.py`      | cursors, streaming export, broken pipes, and byte-stable output                                                     |
| `tests/test_user_install.py`      | user install, in-place update, interrupted-install recovery, and an uninstall that removes only what FERRET owns    |
| `tests/test_harness_adapters.py`  | vendor fixtures for the shared POSIX wrapper (Claude Code, Codex) and the OpenCode plugin: forwarded, stored, quiet |
| `tests/test_adapter_latency.py`   | the adapter latency tool's own rules; no process is timed                                                           |
| `tests/test_storage_benchmark.py` | the storage benchmark tool's own rules: percentiles, projections, acceptance, and the rows it seeds                 |
| `tests/steps/`                    | the pytest-bdd step definitions that bind the six feature files of the corpus for this adapter                      |

## Measuring tools

`src/storage_benchmark.py` builds deterministic synthetic stores and reports the bytes per event, index share, log
high-water mark, and what retention gives back; `src/adapter_latency.py` times whole adapter calls per condition
against their budgets. Both run against the built artifact in an isolated home:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- uv run --no-sync --project apps/ferret-cli-e2e python apps/ferret-cli-e2e/src/storage_benchmark.py --events 100000 --seed 20260918 --output storage.json
```

## Running

```bash
# the full suite; builds the artifact first through the Nx dependency
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e

# static checks only, no process started
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:quick
```

`install` runs `uv sync --locked` for this project's own locked development tools. Set `FERRET_ARTIFACT` to test an
artifact other than `../ferret-cli/dist/ferret.pyz`.

## How a test runs the artifact

`src/ferret_process.py` runs the artifact with the interpreter that runs the tests, so a shell's `python3` never
decides the result. Each test gets an empty environment plus `HOME` pointing at a temporary directory, so no test can
touch a developer's real `~/.ferret`.

## BDD and testing

This project owns no feature files. It is the public-process adapter for the corpus in
[`specs/apps/ferret/cli/behaviours/`](../../specs/apps/ferret/cli/README.md); the static `test:coverage:e2e` and
`test:coverage:behaviour` targets check its mapping without running a test, and `test:quick` never runs a runtime
E2E test. It owns no Unit or Integration target.
