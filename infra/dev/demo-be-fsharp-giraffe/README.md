# Demo Backend Dev Stack — FSGI (F#/Giraffe)

Local development environment for `demo-be-fsharp-giraffe`, the F#/Giraffe
alternative backend for the Demo Backend platform. Runs on the same port (8201) as the
Go/Gin backend (`demo-be-golang-gin`) and the Elixir/Phoenix backend (`demo-be-elixir-phoenix`) — the
stacks are mutually exclusive and **must not be started simultaneously**.

## Port Assignment

| Service                   | Port |
| ------------------------- | ---- |
| demo-be-fsharp-giraffe-db | 5432 |
| demo-be-fsharp-giraffe    | 8201 |

## Quick Start

```bash
# From workspace root
cd infra/dev/demo-be-fsharp-giraffe

# First run — build image and start services
docker compose up --build

# Subsequent runs (image cached)
docker compose up
```

EF Core auto-migrates the database on startup via `EnsureCreated`, so the schema
is always up to date.

## Environment Variables

| Variable            | Default                                    | Description                      |
| ------------------- | ------------------------------------------ | -------------------------------- |
| `POSTGRES_USER`     | `demo_be_fsharp_giraffe`                   | PostgreSQL username              |
| `POSTGRES_PASSWORD` | `demo_be_fsharp_giraffe`                   | PostgreSQL password              |
| `APP_JWT_SECRET`    | `change-me-in-dev-only-not-for-production` | JWT signing secret (HMAC-SHA256) |

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
# Expected: {"id":"<uuid>","username":"alice","email":"alice@example.com"}

# Login
curl -X POST http://localhost:8201/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Str0ng#Pass1"}'
# Expected: {"access_token":"<jwt>","refresh_token":"<refresh>","token_type":"Bearer"}

# Get profile (replace <jwt> with access_token from login)
curl http://localhost:8201/api/v1/users/me \
  -H "Authorization: Bearer <jwt>"
# Expected: {"id":"<uuid>","username":"alice","email":"alice@example.com",...}
```

## E2E Tests

```bash
# Start the stack in E2E mode (docker-compose.e2e.yml merges on top of docker-compose.yml)
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build -d

# Run E2E tests from workspace root
BASE_URL=http://localhost:8201 npx nx run demo-be-e2e:test:e2e

# Stop stack
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
```
