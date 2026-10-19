# Contributing to ayokoding-cli

Author usage, exit statuses, local prerequisites, the target list, and the
harness contract live in [README.md](./README.md); what follows is contributor
plumbing only.

## Build and verify

Run every command from the repository root (the worktree root when you
work inside the delivery worktree):

- `npm exec nx -- run ayokoding-cli:build` — build
  `dist/ayokoding-cli`.
- `npm exec nx -- run ayokoding-cli:test:quick` — lint, typecheck,
  unit tests with the 99% coverage gate, and behaviour coverage. Run
  this before every push.
- `npm exec nx -- run ayokoding-cli:test:integration` — integration
  tests with the fake container CLI. Needs no Docker daemon.
- `npm exec nx -- run ayokoding-cli:test:e2e` — end-to-end tests
  against real containers. Needs a running Docker daemon.
- `npm run lint:md` — Markdown lint over the repository.

Integration and E2E run outside the PR gate, twice daily and on demand.
Unit tests never touch disk, processes, or the network; they receive
content, readers, or settings as arguments.

## Code map

- `cmd/ayokoding-cli/` — the `main` entry point only.
- `internal/domain/` — pure models with no I/O: `anchors` (fence
  parsing), `layout` (unit layout), `runspec` (`run.yaml`), `catalog`
  (toolchain catalog), `finding` (the closed error vocabulary),
  `containerplan`, plus `selection` and `coverage`.
- `internal/application/` — use cases (`check`, `run`, `sync`,
  `build`): they wire domain models to adapters and own exit statuses.
- `internal/adapters/` — the outer layer: `cli` (Cobra commands),
  `containers` (container runtime calls), `content` (course files).
- `internal/bootstrap/` — dependency wiring for the binary.
- `toolchains/` — the embedded catalog (`catalog.yaml`) and one
  directory per toolchain image.
- `tests/bdd/` — Gherkin step bindings for the contract corpus.
- `tests/integration/`, `tests/support/`, `tests/testdata/` —
  integration tests, test helpers, and fixture courses.
- `scripts/` — `coverage-gate.sh`, `test-e2e.sh`,
  `compat-min-version.sh`.

Every error crosses a boundary as a coded error from the closed
vocabulary in `internal/domain/finding`. A new failure mode gets a new
code, never a new status.

## BDD layers

The contract corpus lives at `specs/apps/ayokoding/cli/`. The
`tests/bdd` package binds it through three drivers, chosen by
`AYOKODING_BDD_ADAPTER`:

- `unit` — runs each command in process. Fast; this is the default.
- `integration` — runs a freshly built binary against temp dirs.
- `e2e` — runs the stamped binary in `AYOKODING_BIN` against real
  containers.

Write the Gherkin scenario first, then the failing test, then the code.
Bind a new scenario in `tests/bdd` before implementing it.

## Fake container CLI

`tests/support/fakecontainer` stands in for the container CLI in
integration tests. It records every argv line, and its behaviour is
scripted through `FAKECONTAINER_*` environment variables (daemon down,
pull failure, never ready, run exit code, sleep). Tests select it with
`AYOKODING_CONTAINER_CLI`, which overrides the default `docker`:

```sh
go build -trimpath -o fakecontainer ./tests/support/fakecontainer
AYOKODING_CONTAINER_CLI=./fakecontainer ./dist/ayokoding-cli examples run --all
```

The fake is never used in production.
