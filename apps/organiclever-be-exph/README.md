# organiclever-be-exph

Elixir/Phoenix REST API backend for the OrganicLever productivity tracker.
This is an alternative implementation of `demo-be-jasb` (Spring Boot), built with
Phoenix 1.7+ on Elixir 1.17 / OTP 27.

## Local Development (Docker)

```bash
# From workspace root — start PostgreSQL + Phoenix server
docker compose -f infra/dev/organiclever-exph/docker-compose.yml up --build
```

The server listens on port **8201** (`http://localhost:8201`).

## Environment Variables

| Variable          | Required   | Description                          |
| ----------------- | ---------- | ------------------------------------ |
| `DATABASE_URL`    | Dev / Prod | Ecto connection URL (`ecto://...`)   |
| `APP_JWT_SECRET`  | Dev / Prod | HS256 secret for Guardian JWT tokens |
| `PORT`            | Optional   | HTTP port (default: `4000`)          |
| `PHX_HOST`        | Prod only  | Canonical hostname (`example.com`)   |
| `SECRET_KEY_BASE` | Prod only  | Phoenix cookie encryption key        |

> `APP_JWT_SECRET` is **not** required during `mix test` — `config/test.exs` supplies a
> hardcoded test secret so CI can run without injecting secrets.

## Nx Targets

```bash
nx run organiclever-be-exph:install          # mix deps.get
nx run organiclever-be-exph:dev              # mix phx.server (development)
nx run organiclever-be-exph:test:quick       # lint + format + coverage gate (≥90%)
nx run organiclever-be-exph:test:unit        # mix test --only unit
nx run organiclever-be-exph:test:integration # mix test --only integration (Gherkin BDD)
nx run organiclever-be-exph:lint             # mix credo --strict
nx run organiclever-be-exph:typecheck        # mix dialyzer
nx run organiclever-be-exph:build            # mix compile (prod, warnings-as-errors)
```

## API Endpoints

| Method | Path                    | Auth   | Description           |
| ------ | ----------------------- | ------ | --------------------- |
| GET    | `/health`               | Public | Health check          |
| POST   | `/api/v1/auth/register` | Public | Register new user     |
| POST   | `/api/v1/auth/login`    | Public | Login, receive JWT    |
| GET    | `/api/v1/hello`         | Bearer | Protected hello world |

## BDD Integration Tests

Feature specifications live in `specs/apps/organiclever-be/` and are executed via
`elixir-cabbage` (vendored Gherkin BDD framework):

```bash
nx run organiclever-be-exph:test:integration
```

24 scenarios across 5 feature files cover all endpoints.
