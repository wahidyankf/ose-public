# ferret-cli

FERRET keeps a private, local record of what coding-agent harnesses do: which agents, skills, and tools ran, and how
they ended. It stores metadata only — never prompts, responses, tool arguments, transcripts, or environment values —
and nothing leaves the machine. `ferret` is a standard-library-only Python 3.14 command-line tool shipped as one
zipapp.

## Start with the command help

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:run -- --help
```

Run `ferret <command> --help` for one command. The commands are `init`, `capture`, `capture-hook`, `status`,
`events list`, `events export`, `usage`, `outcomes`, `maintenance`, `self install`, `self uninstall`, and `version`.
Commands with a machine form accept `--json` (shorthand for `--output json`); scripts should always use it. Requested
help and version go to stdout with exit 0, and a usage mistake goes to stderr with exit 2.

## Use it

```bash
ferret init                        # create the private data home and store, once
ferret self install --target user  # copy the artifact under ~/.local/share/ferret and link ~/.local/bin/ferret
ferret status --json               # is recording healthy, and how much space does it use
ferret usage --group-by skill --json
```

The harness registrations in this repository forward every hook payload to `ferret capture-hook`, which reduces it to
a closed set of metadata fields, writes nothing to stdout or stderr, and always exits 0 so a harness is never
disturbed. A payload over 256 KiB is refused, so a very large tool result loses its completion event. What each harness
can and cannot report is in
[Platform Bindings](../../docs/reference/platform-bindings.md#ferret-lifecycle-registrations).

## Where the data lives, and how long

The data home is `$HOME/.ferret`; `FERRET_DATA_HOME` relocates it (an absolute, normalized path on a local disk). It
holds the installation key, identity, config, and `ferret.sqlite3`, all private to the user.

- Anything older than 30 days is never returned by any command. The next operation after maintenance becomes due
  deletes at most 100 expired rows within 100 monotonic milliseconds and skips the attempt when the write lock is
  held, so it can never delay a harness. `ferret maintenance` removes every expired row, folds the log into the
  database, and rewrites the file only when it is over 16 MiB with at least 25% free.
- A stored event weighs about 0.9 KiB (919.5 bytes measured at 100,000 events), which is roughly 130 MiB for a
  30-day store at 5,000 events a day.
- `events list`, `events export`, `usage`, and `outcomes` read the last seven days unless given `--all-time` or
  `--from`/`--to`. A page cursor is bound to its filters, limit, and window, and the default window ends at each
  call's own clock, so paging across calls needs `--all-time` or explicit bounds.

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
`dist/ferret.pyz`: every archive entry has a fixed timestamp, mode, and order and nothing is compressed, so the same
sources always produce the same bytes. `test:quick` runs Ruff, strict Pyright, the Unit suite with a 99% line-coverage
floor, and the static behaviour validators. `test:integration` exercises the real filesystem, SQLite, and process
boundary. The process-level tests against the built artifact live in
[`ferret-cli-e2e`](../ferret-cli-e2e/README.md).

## Code map

- `src/ferret/cli.py` — the closed command grammar, help and version, and the closed failure contract
- `src/ferret/help_text.py` — the help text of every command, kept as literals because it is a tested surface
- `src/ferret/domain/`, `src/ferret/application/`, `src/ferret/adapters/` — the rules, the use cases and their ports,
  and the SQLite, filesystem, POSIX install, and clock adapters
- `scripts/build_zipapp.py` — the reproducible zipapp build
- `tests/unit/` — in-process tests, including the pytest-bdd step definitions for the Gherkin corpus
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

## Manual evidence helpers

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
