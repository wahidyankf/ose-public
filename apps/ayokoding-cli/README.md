# ayokoding-cli

`ayokoding-cli` checks AyoKoding course code examples in pinned
containers. Content authors use it to validate, sync, run, and cover
examples before they push. It is a Go + Cobra CLI at
`apps/ayokoding-cli`.

## Command help

The reference below is the built CLI's own help, captured from
`dist/ayokoding-cli`:

```text
Check AyoKoding course code examples in pinned containers.

Exit statuses:
  0  Everything selected is green: no finding, every run passed, coverage at or above the minimum.
  1  The work completed and the result is negative: a finding, a failed or timed out run, or coverage below the minimum.
  2  Bad usage, bad configuration, or an internal failure, including a recovered panic.
  124  A service did not become ready in its bounded wait.
  125  The container runtime refused: daemon unavailable or pull failed.
  126  The container CLI was found but cannot run.
  127  The container CLI, or git when --since needs it, was not found.
  130  Interrupted; running containers and networks are removed first.
  141  Standard output was closed by the reader.

Usage:
  ayokoding-cli [flags]
  ayokoding-cli [command]

Available Commands:
  examples    Validate, sync, run, and cover course code examples.
  help        Help about any command
  toolchains  List and build course toolchain images.

Flags:
      --catalog string   toolchain catalog file; defaults to the embedded catalog
      --color string     colour: auto, always, or never (default "auto")
      --content string   course content directory (default "apps/ayokoding-www/content/en/learn/courses")
  -h, --help             help for ayokoding-cli
      --no-input         accepted; the tool never prompts
      --output string    output format: text or json (default "text")
  -v, --version          version for ayokoding-cli

Use "ayokoding-cli [command] --help" for more information about a command.
```

Global flags apply to every command: `--output text|json`,
`--color auto|always|never`, `--no-input`, `--content DIR`, and
`--catalog FILE`. Under `--output json` an error is one JSON body on
standard error, and standard output stays empty on every failure path.
`AYOKODING_FAULT` is a test-only fault seam; never set it in production.

## Usage for authors

Run every command from the repository root. The binary comes from the
`ayokoding-cli:build` Nx target and lives at
`apps/ayokoding-cli/dist/ayokoding-cli`.

- `examples validate [--course SLUG]... [--include-inert]` — check unit
  layout, run specs, and catalog references. Use it after adding or
  moving units or editing a `run.yaml`.
- `examples sync [--course SLUG]... [--include-inert] [--write]` —
  check lesson fences against course files. Without `--write` it only
  reports drift; with `--write` it copies file bytes into the fences.
- `examples run (--course SLUG... | --since REV | --all)` — run the
  selected units in containers. Extra flags: `--unit PATH` for one unit,
  `--shard K/N` for a stable split over sorted course slugs,
  `--single-run` to skip the determinism double run.
- `examples run --seed N` (replay) — replay one seed of a simulation
  example. Simulations run at least 32 seeds by default; replay pins one
  seed while debugging a failure.
- `examples run --record` (record) — write missing expected-output
  files only. It never overwrites an existing file; delete the stale
  file first, then record, then review the diff.
- `examples check (--course SLUG... | --since REV | --all)` —
  validate, sync, run, and cover the selection in one step. This is the
  same step the PR gate runs on opted-in courses.
- `examples coverage [--course SLUG]... [--min-percent N]` — unit and
  fence coverage per course. `--min-percent N` fails below N percent.
- `examples affected --since REV` — print the course selection only,
  without running anything.
- `toolchains list` — list the embedded toolchain catalog.
- `toolchains build [ID]...` — build derived and environment images.

A course with no `run.yaml` is inert: it is listed as not opted in and
nothing runs for it. `examples check --all` on today's content prints
`0 opted-in courses; nothing to run` and starts no container.

## Local prerequisites

- Go, through `npm run doctor`. The doctor provisions the pinned Go
  toolchain; never install Go by hand.
- rootless Podman, running, for every command that starts a container
  (`examples run`, `examples check`, image builds). `validate`, `sync`
  without runs, `coverage`, and `affected` need no daemon.

## Targets

The Nx targets for this project live in `project.json`:

- `install`, `build`, `run`, `typecheck`, `lint`
- `test:unit` — skipped-test guard, then the 99% coverage gate
  with `-race`
- `test:integration`, `test:e2e` — outside the PR gate, twice daily
  and on demand
- `test:coverage:{unit,integration,e2e,behaviour}`, `test:coverage`,
  `test:quick`
- `deps:audit`, `compat:min-version`

No target is omitted: the project ships every standard target. There is
no release target, because the CLI ships only inside this repository and
versions are repository commits (see `CHANGELOG.md`).

## Contract

The CLI contract is the Gherkin corpus at
`specs/apps/ayokoding/cli/`: the `cli-contract` features pin the
command line, exit statuses, and output shapes, and the `examples`,
`toolchains`, and behaviour features pin each command. Change the CLI
only with its contract: Gherkin first, then the failing test, then the
code.
