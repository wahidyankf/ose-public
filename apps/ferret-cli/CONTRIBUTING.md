# Contributing to ferret-cli

How to build, verify, and test ferret-cli locally. For installing and using it, read the [README](README.md).

## Local prerequisites

| Tool   | Version | Notes                                                      |
| ------ | ------- | ---------------------------------------------------------- |
| uv     | 0.12.16 | Installs the locked development tools and Python 3.14.7.   |
| Python | 3.14.7  | Selected by `.python-version`; the project accepts 3.14.x. |

FERRET supports macOS and Linux only.

## Build and verify

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:install
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:build
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:quick
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration
```

`install` runs `uv sync --locked`, so it fails rather than change `uv.lock`. `build` writes the reproducible artifact
`dist/ferret.pyz`: fixed entry timestamps, modes, and order plus no compression mean the same sources always
produce the same bytes. `test:quick` runs Ruff, strict Pyright, the Unit suite with a 99% line-coverage
floor, and the static behaviour validators. `test:integration` exercises the real filesystem, SQLite, and process
boundary. The process-level tests against the built artifact live in
[`ferret-cli-e2e`](../ferret-cli-e2e/README.md).

## Code map

- `src/ferret/cli.py` — the closed command grammar, help and version, and the closed failure contract
- `src/ferret/help_text.py` — the help text of every command, kept as literals because it is a tested surface
- `src/ferret/domain/`, `src/ferret/application/`, `src/ferret/adapters/` — the rules, the use cases and their ports,
  and the SQLite, filesystem, POSIX install, and clock adapters
- `scripts/build_zipapp.py` — the reproducible zipapp build
- `tests/unit/` — in-process tests and the pytest-bdd step definitions; the wrapper and plugin bindings run those
  [script subjects](../../repo-governance/development/behaviour-driven-development/script-subject-unit-proof.md) directly
- `tests/integration/` — real-resource tests
- `tests/support/` — shared fixtures and two manual-evidence helpers (below)

The interior is ports and adapters: the domain and application layers know nothing of the command line, SQLite, or
the filesystem, and `cli.py` is the composition root.

## BDD and testing

The canonical Gherkin corpus is [`specs/apps/ferret/cli/behaviours/`](../../specs/apps/ferret/cli/README.md), six
feature files across storage, privacy, queries, analytics, and harness concerns. The Unit adapter binds it with
pytest-bdd step definitions, the Integration adapter binds the scenarios that need real resources, and the static
`test:coverage:unit`, `test:coverage:integration`, and `test:coverage:behaviour` targets check that every scenario is
bound exactly once per applicable layer.

Every Unit and Integration test runs with a private, empty `HOME` and with `FERRET_DATA_HOME` and `XDG_DATA_HOME`
cleared, set by an autouse fixture in `tests/conftest.py`. The CLI honours those variables, so without it a shell that
exports them to a real store would have a test that calls the CLI in process, or a child that inherits the
environment, write into that store. A test that needs a particular data home sets the variables itself.

## Manual evidence helpers

The helper invocations in this section were not exercised during this documentation pass. Existing automated test
results do not establish execution of these hand-run recipes.

Two non-production helpers drive the built artifact for hand-run evidence. Both accept only the raw root
`local-tmp/ferret-plan01/<run-id>` and reuse an existing one only when it carries their run marker, give every child
its own `HOME`, XDG data home, and data home, and write only labels, exit codes, byte counts, SHA-256 values, and
assertion results to the summary file they are given:

- `tests/support/manual_evidence.py {capture,query,install}` runs one closed case of the command contract.
- `tests/support/manual_retention_fixture.py run-matrix` seeds expired and retained rows relative to one instant,
  holds the store's write lock from a second process, and checks that reads hide expired rows, that a locked prune
  changes nothing, and that pruning is bounded and counted exactly once.

Run them with the project interpreter (`uv run --no-sync --project apps/ferret-cli python <helper> ...`); each
prints its own usage with `--help`.
