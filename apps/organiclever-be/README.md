# organiclever-be

`organiclever-be` is OrganicLever's F# backend service, built with Giraffe on
ASP.NET Core. It is pre-alpha software for engineers working on the product's
server-side foundations: a PostgreSQL-backed journal, database migrations, and
a small NATS/JetStream messaging probe.

The OrganicLever web app is currently local-first. This service is where the
server-of-record path is being developed and verified.

## Start locally

The service requires PostgreSQL. Docker is the quickest way to provide the
local PostgreSQL and NATS dependencies used by the end-to-end test setup.

```bash
./hippo run --class service --resource-tier standard --disk-path . -- \
  docker compose -f apps/organiclever-be/docker-compose.e2e.yml up
```

Keep that reservation-owning terminal open while the dependencies run. In another terminal, export
the service configuration and start the backend:

```bash
export DATABASE_URL="Host=localhost;Port=5432;Database=organiclever;Username=postgres;Password=${POSTGRES_PASSWORD:-postgres}"
export ASPNETCORE_URLS='http://localhost:8202'

./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:dev
```

On startup, the service applies its embedded SQL migrations to `DATABASE_URL`.
It also tries to connect to NATS and run its JetStream demo. A NATS failure is
reported through the messaging status endpoint but does not prevent the HTTP
service from starting.

Verify the service in another terminal:

```bash
curl http://localhost:8202/api/v1/health
```

When finished, stop the backend and dependency terminals with <kbd>Ctrl</kbd>+<kbd>C</kbd>, then
remove the containers, networks, and volumes transactionally:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- \
  docker compose -f apps/organiclever-be/docker-compose.e2e.yml down -v
```

## Configuration

| Variable                   | Required | Purpose                                                                  |
| -------------------------- | -------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string; the service fails fast when it is missing. |
| `ASPNETCORE_URLS`          | No       | ASP.NET Core listen address, for example `http://localhost:8202`.        |
| `ORGANICLEVER_BE_NATS_URL` | No       | NATS address for startup messaging; defaults to `nats://localhost:4222`. |

Use `.env.example` as a local variable reference. It contains only local
development placeholders; do not put real credentials in tracked files.

## HTTP surface

| Method                 | Path                              | Purpose                                    |
| ---------------------- | --------------------------------- | ------------------------------------------ |
| `GET`                  | `/health`                         | Legacy liveness probe for the web tier.    |
| `GET`                  | `/api/v1/health`                  | Versioned service health response.         |
| `GET`, `POST`          | `/api/v1/journal/entries`         | List or create journal entries.            |
| `GET`, `PUT`, `DELETE` | `/api/v1/journal/entries/{id}`    | Read, update, or delete one journal entry. |
| `GET`                  | `/api/v1/system/status/messaging` | Result of the startup JetStream demo.      |

The [OpenAPI contract](../../specs/apps/organiclever/be/contracts/openapi.yaml) and
[behaviour specifications](../../specs/apps/organiclever/be/behaviours/README.md)
are the durable references for intended API behaviour.

## Everyday commands

| Command                                                                                                                       | Use                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:dev`                | Run with `dotnet watch`.                                                       |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build organiclever-be`            | Generate contract types and publish a release build.                           |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:quick`   | Typecheck, lint, unit-test, coverage, and specification checks.                |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:unit`    | Run the TickSpec/xUnit unit suite.                                             |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:integration` | Run isolated filesystem/process-environment Integration tests without network. |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:lint`         | Check Fantomas formatting and strict F# analysis.                              |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:fmt`          | Apply Fantomas formatting to service source files.                             |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:codegen`      | Regenerate F# contract types from the bundled OpenAPI spec.                    |

The app-level E2E target is omitted. Backend API E2E tests belong to
[organiclever-be-e2e](../organiclever-be-e2e/README.md).

## Project layout

```text
apps/organiclever-be/
├── src/OrganicleverBe/
│   ├── Contexts/       # Health, Journal, Messaging, and database slices
│   ├── Infrastructure/ # EF Core database and NATS adapters
│   ├── WebApp.fs       # HTTP route composition
│   └── Program.fs      # Startup, migrations, and host configuration
├── db/migrations/      # SQL applied on startup
├── tests/unit/         # TickSpec/xUnit unit tests
└── tests/integration/  # Isolated local-resource tests; no network
```

`generated-contracts/` is generated from the OpenAPI bundle and is intentionally
not hand-edited. Nx runs code generation before build, typecheck, lint, and
unit-test targets.

## Related references

- [Backend architecture](../../specs/apps/organiclever/be/architecture.md)
- [API reference](../../specs/apps/organiclever/be/api.md)
- [OpenAPI contract](../../specs/apps/organiclever/be/contracts/README.md)
- [Backend behaviour specifications](../../specs/apps/organiclever/be/behaviours/README.md)
- [Backend E2E suite](../organiclever-be-e2e/README.md)

## BDD and Testing

The canonical corpus is `specs/apps/organiclever/be/behaviours/`. `test:unit` uses injected
boundary doubles; `test:integration` exercises owned non-networked local resources; and the
dedicated `organiclever-be-e2e:test:e2e` target owns public HTTP/messaging proof. Matching
`test:coverage:*` targets validate all applicable adapters statically. Owner-local E2E runtime is
omitted because the dedicated project owns that boundary.
