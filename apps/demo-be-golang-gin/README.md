# demo-be-golang-gin

Go + Gin REST API backend — the default demo backend. Alternative implementations exist:
`demo-be-java-springboot` (Java/Spring Boot), `demo-be-elixir-phoenix` (Elixir/Phoenix), and other demo-be backends. Uses Go and the Gin framework.

## Tech Stack

| Concern   | Choice                             |
| --------- | ---------------------------------- |
| Language  | Go 1.24                            |
| Framework | Gin                                |
| Database  | GORM + PostgreSQL (production)     |
| JWT       | golang-jwt                         |
| Passwords | bcrypt                             |
| BDD Tests | Godog (Cucumber for Go) + httptest |
| Coverage  | go test -coverprofile + rhino-cli  |
| Linting   | golangci-lint                      |
| Port      | 8201                               |

## Local Development

### Prerequisites

- Go 1.24+
- PostgreSQL (or use Docker Compose)

### Environment Variables

| Variable       | Default                                                                                | Description        |
| -------------- | -------------------------------------------------------------------------------------- | ------------------ |
| `PORT`         | `8201`                                                                                 | HTTP port          |
| `DATABASE_URL` | `postgresql://demo_be_golang_gin:demo_be_golang_gin@localhost:5432/demo_be_golang_gin` | PostgreSQL URL     |
| `JWT_SECRET`   | (dev default)                                                                          | JWT signing secret |

### Run locally

```bash
# Start PostgreSQL
docker compose -f ../../infra/dev/demo-be-golang-gin/docker-compose.yml up -d demo-be-golang-gin-db

# Run dev server
go run cmd/server/main.go

# Health check
curl http://localhost:8201/health
```

## Nx Targets

```bash
nx build demo-be-golang-gin                   # Compile binary
nx dev demo-be-golang-gin                     # Start development server
nx run demo-be-golang-gin:test:quick          # Unit (BDD) tests + coverage gate (>=90%)
nx run demo-be-golang-gin:test:unit           # BDD unit tests only (verbose)
nx run demo-be-golang-gin:test:integration    # PostgreSQL integration tests via Docker Compose
nx lint demo-be-golang-gin                    # Run golangci-lint
```

## API Endpoints

See [plan README](../../plans/done/2026-03-11__demo-be-golang-gin/README.md) for the full API surface.

## Test Architecture

This project follows the three-level testing standard where the same Gherkin feature files
(`specs/apps/demo/be/gherkin/`) drive all three levels. Only the step implementations differ.

### Level 1: Unit tests (`test:quick`, `test:unit`)

- **Package**: `internal/bdd/`
- **Build tag**: none (runs with plain `go test ./...`)
- **Store**: `store.MemoryStore` (in-memory Go maps, no external deps)
- **HTTP**: `net/http/httptest` (in-process)
- **Test function**: `TestUnit`
- **Cacheable**: yes
- **Coverage**: >=90% line coverage enforced via `rhino-cli test-coverage validate`

The `internal/bdd/` package mirrors the step definitions in `internal/integration/` but without
the `//go:build integration` tag, so every scenario runs as part of the standard `go test ./...`
and contributes to coverage measurement.

Infrastructure packages excluded from coverage measurement:

- `gorm_store` - PostgreSQL driver code, no logic to unit-test
- `internal/server` - server wiring, tested at e2e level
- `cmd/server` - entry point, single-line `main()`

### Level 2: Integration tests (`test:integration`)

- **Package**: `internal/integration_pg/`
- **Build tag**: `//go:build integration_pg`
- **Store**: `store.GORMStore` (real PostgreSQL via GORM)
- **HTTP**: `net/http/httptest` (in-process, same router)
- **Test function**: `TestIntegrationPG`
- **Cacheable**: no (requires Docker, external PostgreSQL service)
- **Runner**: `docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build`

Each scenario is isolated by truncating all tables (`TRUNCATE TABLE ... CASCADE`) in the `Before`
hook before each scenario runs. PostgreSQL is started as a `postgres:17-alpine` container with
`tmpfs` storage so data never persists between runs.

The `Dockerfile.integration` builds the Go project inside a `golang:1.24-alpine` container and
runs `go test -tags=integration_pg`. The `docker-compose.integration.yml` mounts
`../../specs` at `/specs` so the Godog path `/specs/apps/demo/be/gherkin` resolves correctly.

### Level 3: E2E tests

E2E tests for all demo-be backends live in the shared `demo-be-e2e` Playwright project.

### Legacy integration package

The `internal/integration/` package (`//go:build integration`, `TestIntegration`) predates the
three-level architecture. It runs the same Godog scenarios against `MemoryStore` but requires
`-tags=integration` to execute. It is kept for reference but is superseded by `internal/bdd/`
for coverage purposes.
