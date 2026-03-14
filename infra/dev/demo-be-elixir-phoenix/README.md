# Demo Backend Dev Stack — EXPH (Elixir/Phoenix)

Local development environment for `demo-be-elixir-phoenix`, the Elixir/Phoenix
alternative backend for the Demo Backend platform. Runs on the same port (8201) as the
Go/Gin backend (`demo-be-golang-gin`) — the two stacks are mutually
exclusive and **must not be started simultaneously**.

## Port Assignment

| Service                   | Port |
| ------------------------- | ---- |
| demo-be-elixir-phoenix-db | 5432 |
| demo-be-elixir-phoenix    | 8201 |

## Quick Start

```bash
# From workspace root
cd infra/dev/demo-be-elixir-phoenix

# First run — build image and start services
docker compose up --build

# Subsequent runs (image cached)
docker compose up
```

The `demo-be-elixir-phoenix` container automatically runs `mix ecto.migrate`
before starting Phoenix, so the schema is always up to date.

## Environment Variables

| Variable            | Default                                    | Description                |
| ------------------- | ------------------------------------------ | -------------------------- |
| `POSTGRES_USER`     | `demo_be_elixir_phoenix`                   | PostgreSQL username        |
| `POSTGRES_PASSWORD` | `demo_be_elixir_phoenix`                   | PostgreSQL password        |
| `APP_JWT_SECRET`    | `change-me-in-dev-only-not-for-production` | JWT signing secret (HS256) |

Override defaults by setting variables in your shell or in a `.env` file alongside
`docker-compose.yml`.

## Manual Smoke Test

```bash
# Health check
curl http://localhost:8201/health
# Expected: {"status":"UP"}

# Register a user
curl -X POST http://localhost:8201/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"Str0ng#Pass1"}'
# Expected: {"id":1,"username":"alice","email":"alice@example.com"}

# Login
curl -X POST http://localhost:8201/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Str0ng#Pass1"}'
# Expected: {"access_token":"<jwt>","refresh_token":"<refresh>","token_type":"Bearer"}

# Get profile (replace <jwt> with access_token from login)
curl http://localhost:8201/api/v1/users/me \
  -H "Authorization: Bearer <jwt>"
# Expected: {"id":1,"username":"alice","email":"alice@example.com",...}
```

## Shared Database Note

Both `demo-be-golang-gin` and `demo-be-elixir-phoenix` use PostgreSQL on port 5432.
They cannot run simultaneously since both bind port 8201. The databases have different
names (`organiclever` for jasb, `demo_be_elixir_phoenix` for exph) so they can share the
same PostgreSQL instance if needed, but this requires custom setup.

## E2E Tests

```bash
# Start the stack in E2E mode (docker-compose.e2e.yml merges on top of docker-compose.yml)
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build -d

# Run E2E tests from workspace root
BASE_URL=http://localhost:8201 npx nx run demo-be-e2e:test:e2e

# Stop stack
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
```

## Volume Mounts for Local Dependencies

`demo-be-elixir-phoenix` declares `elixir-gherkin` and `elixir-cabbage` as local
Mix path dependencies. Inside the container, Mix resolves these relative to
`/workspace`:

- `../../libs/elixir-gherkin` → `/libs/elixir-gherkin` (bind-mounted read-only)
- `../../libs/elixir-cabbage` → `/libs/elixir-cabbage` (bind-mounted read-only)

Both must be mounted for `mix deps.get` and compilation to succeed.
