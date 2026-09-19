# roots-be

Backend service for the OSE Roots domain. Go 1.26 on [Gin](https://gin-gonic.com/),
serving a single health endpoint.

This is a deliberately small first slice: the service exists so that the Go lane, the specification
corpus, and the deployment shape are all real and gated before any domain logic lands.

## Behaviour corpus

The canonical Gherkin lives in
[`specs/apps/roots/be/behaviours/`](../../specs/apps/roots/be/behaviours/) and is never copied
into this project — the tests read it in place, so the two cannot drift.

| Folder                                                    | Scenarios | What it covers                          |
| --------------------------------------------------------- | --------- | --------------------------------------- |
| [`health/`](../../specs/apps/roots/be/behaviours/health/) | 3         | Status, content type, unknown-route 404 |
| [`config/`](../../specs/apps/roots/be/behaviours/config/) | 5         | Listener-port resolution order          |

The HTTP contract is [`specs/apps/roots/be/contracts/openapi.yaml`](../../specs/apps/roots/be/contracts/openapi.yaml),
owned by the `roots-contracts` project. `codegen` generates the Gin `ServerInterface` from it, and
`internal/router` implements that interface — so an operation added to the contract fails
compilation until it is served, rather than returning 404 at runtime.

## Test adapters

| Layer       | Owner                                   | Status                                   |
| ----------- | --------------------------------------- | ---------------------------------------- |
| Unit        | `internal/bdd` + co-located `*_test.go` | Mandatory. 100% line coverage, 99% floor |
| Integration | —                                       | **Omitted.** See below                   |
| E2E         | `roots-be-e2e`                          | Owns the health scenarios over real HTTP |

### Why there is no `test:integration`

Integration proof exists to cover a real _local-resource_ boundary — a database, an embedded store,
the filesystem, a child process, an owned loopback socket. `roots-be` has none. It holds no
persistent state, starts no subprocess, and reads nothing from disk at runtime.

Its only two boundaries are an HTTP surface, which is a network boundary that belongs to E2E, and
the process environment, which port resolution takes as an injected `Lookup` rather than reading
directly. An Integration target here would either duplicate the Unit tests or bind a real socket
that E2E already covers.

Per the [BDD contract](../../repo-governance/development/behaviour-driven-development.md), an
inapplicable target is omitted and explained rather than stubbed. No echo target, no success
sentinel.

## Targets

```bash
npx nx run roots-be:dev          # serve on 8402
npx nx run roots-be:test:quick   # typecheck, lint, unit + coverage floor, specs, validators
npx nx run roots-be:lint         # golangci-lint (v2 schema)
npx nx run roots-be:build        # dist/roots-be
npx nx run roots-be:codegen      # regenerate the contract types
```

`test:unit` enforces a 99% line-coverage floor over `./internal/...` via
[`scripts/coverage-gate.sh`](./scripts/coverage-gate.sh). `cmd/roots-be` is excluded because it
only binds a socket and reads the environment — the boundaries Unit proof may not touch — and
`generated-contracts` is excluded because it is generated, not authored.

`compat:min-version` is a real assertion that `go.mod`'s `go` directive still matches the pinned
floor, not an echo.

### First run in a fresh worktree

`generated-contracts/` is gitignored, so a fresh clone or worktree does not have it and `gopls`
reports `could not import .../generated-contracts` against correct source. Nx targets are immune —
`typecheck` and `build` declare `dependsOn: ["codegen"]` — but a language server reads the working
tree directly. Materialize it once, then restart the Go language server:

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run roots-be:codegen
```

See [Per-Project Generated Sources](../../repo-governance/development/workflow/worktree-setup/per-project-generated-sources.md).

## Configuration

| Variable        | Default | Notes                                                |
| --------------- | ------- | ---------------------------------------------------- |
| `ROOTS_BE_PORT` | `8402`  | `--port` flag wins over it; a bare `PORT` is ignored |

A malformed value fails startup rather than falling back to the default, so a typo surfaces
immediately instead of as traffic on the wrong port. A bare `PORT` is deliberately ignored: one
exported variable must not retarget every app in the monorepo at once.

Copy [`.env.example`](./.env.example) to `.env.local` for local overrides. Never commit a real one.

## Running in Docker

```bash
npx nx run roots-be:codegen   # the image build needs the generated types
docker compose -f ../../infra/dev/roots-be/docker-compose.yml up --build
```

The runtime stage is `scratch` — a static binary and nothing else. It carries no CA certificates
because the service makes no outbound TLS calls; add them the moment it does.

## See also

- [Specification corpus](../../specs/apps/roots/be/README.md) — behaviours, contract, architecture
- [`apps/roots-be-e2e`](../roots-be-e2e/README.md) — the E2E suite for this service, driving
  the three health scenarios through the real HTTP boundary
