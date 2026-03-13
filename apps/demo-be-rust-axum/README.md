# demo-be-rust-axum

Rust + Axum REST API backend — a functional twin of `demo-be-java-springboot` (Java/Spring Boot),
`demo-be-elixir-phoenix` (Elixir/Phoenix), and other demo-be backends using Rust and the Axum framework.

## Tech Stack

| Concern   | Choice                                          |
| --------- | ----------------------------------------------- |
| Language  | Rust (stable)                                   |
| Framework | Axum 0.8                                        |
| Runtime   | Tokio                                           |
| Database  | SQLx + SQLite (unit) / PostgreSQL (integration) |
| JWT       | jsonwebtoken                                    |
| Passwords | bcrypt                                          |
| BDD Tests | cucumber-rs + Tower TestClient                  |
| Coverage  | cargo-llvm-cov (LCOV) + rhino-cli               |
| Linting   | clippy + rustfmt                                |
| Port      | 8201                                            |

## Local Development

### Prerequisites

- Rust (stable toolchain)
- SQLite (bundled via sqlx)
- Docker (for integration tests with PostgreSQL)

### Environment Variables

| Variable       | Default           | Description         |
| -------------- | ----------------- | ------------------- |
| `PORT`         | `8201`            | HTTP port           |
| `DATABASE_URL` | `sqlite::memory:` | Database connection |
| `JWT_SECRET`   | (dev default)     | JWT signing secret  |

### Run locally

```bash
# Run dev server (SQLite in-memory)
cargo run

# Health check
curl http://localhost:8201/health
```

## Nx Targets

```bash
nx build demo-be-rust-axum                    # Compile release binary
nx dev demo-be-rust-axum                      # Start development server
nx run demo-be-rust-axum:test:quick           # Unit tests + coverage gate (no lint)
nx run demo-be-rust-axum:test:unit            # Unit tests only (lib + BDD with SQLite in-memory)
nx run demo-be-rust-axum:test:integration     # Integration tests via Docker Compose (PostgreSQL)
nx lint demo-be-rust-axum                     # Run clippy + rustfmt check
```

## API Endpoints

See [plan README](../../plans/done/2026-03-11__demo-be-rust-axum/README.md) for the full API surface.

## Test Architecture

This project uses a three-level test architecture:

### Unit Tests (`tests/unit/`)

- Run all 76 Gherkin scenarios using cucumber-rs with Tower TestClient
- Use SQLite in-memory database (no external services required)
- Also include inline `#[cfg(test)]` unit tests in source modules
- Run via `cargo test --lib --test unit`
- Coverage measured with cargo-llvm-cov and validated at ≥90%
- Used by `test:quick` and `test:unit` targets

### Integration Tests (`tests/integration/`)

- Run all 76 Gherkin scenarios against a real PostgreSQL 17 database
- Launched via Docker Compose (`docker-compose.integration.yml`)
- Reads specs from `/specs/apps/demo/be/gherkin/` (mounted volume)
- Not cached — always runs fresh
- Used by `test:integration` target

### End-to-End Tests

- Covered by `demo-be-e2e` (Playwright) running against the full deployed stack
- Not part of this project's targets

### Running Integration Tests

```bash
# Runs PostgreSQL + test-runner in Docker, tears down on completion
nx run demo-be-rust-axum:test:integration
```
