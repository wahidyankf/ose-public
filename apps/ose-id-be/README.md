# ose-id-be

`ose-id-be` is the OSE ID platform backend: the repository's first ASP.NET Core service, built as a
pragmatic hexagonal/DDD boundary (Domain, Application, Infrastructure, Host). This slice is the
foundation delivery — it deliberately serves no account, sign-in, OIDC, company, or product
authorization behaviour. Everything it exposes today is inert by design: a runtime-mode guard that
refuses to start outside `Local`/`Test`, and a closed inventory of not-yet-built identity routes that
answer `404 capability_disabled` instead of silently 404-ing like an absent path.

## Start it locally

From the repository root, install workspace dependencies and confirm the .NET 10 SDK is available:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm install
```

Then run the service directly:

```bash
export OSE_RUNTIME_MODE=Local
dotnet run --project apps/ose-id-be/src/OseId.Host/OseId.Host.csproj
```

A `Staging`, `Production`, or missing/unknown `OSE_RUNTIME_MODE` exits non-zero before any listener
binds — see [Configuration](#configuration).

Run standalone this way, the process needs its own reachable PostgreSQL (see
[Configuration](#configuration) below) — without it, `/health/ready` reports not-ready rather than
serving. For a fully owned PostgreSQL plus this backend plus the web shell, with no separate setup,
use `ose-id-be-e2e`'s [local stack](../ose-id-be-e2e/README.md#local-stack-serve) instead; it starts
and cleans up every resource itself.

## What is available today

Two truthful health routes, plus the closed disabled-capability inventory. No account, sign-in,
OIDC, company, or product endpoint exists yet.

- `GET /health/live` — always `200 application/json`, reads no port; `{"status":"live","service":"ose-id-be"}`.
- `GET /health/ready` — reads exactly one bounded PostgreSQL schema-compatibility check. Ready is
  `200 application/json` with `{"status":"ready","components":{"postgresql":"ready","schema":"compatible"}}`.
  Any failure (PostgreSQL unreachable, schema incompatible) is `application/problem+json` at the
  matching status with a sanitized `capability_disabled`-shaped problem body — never an exception,
  connection string, host, or stack trace. Both routes echo `X-Correlation-ID` on every response and
  send `Cache-Control: no-store`.

Every other route answers its exact method/path pair with `404 application/problem+json` and a
`capability_disabled` code; every other path or method receives the framework's ordinary not-found
response.

| Capability                | Method | Path                         |
| ------------------------- | ------ | ---------------------------- |
| OIDC authorization        | GET    | `/connect/authorize`         |
| OAuth token issuance      | POST   | `/connect/token`             |
| External-provider sign-in | GET    | `/external/google/challenge` |
| SCIM user provisioning    | POST   | `/scim/v2/Users`             |
| Platform administration   | GET    | `/platform/admin/companies`  |

The [OpenAPI contract](../../specs/apps/ose/id-be/contracts/openapi.yaml) is the source of truth for
every operation.

## Configuration

The service reads configuration from process environment variables; see
[`.env.example`](./.env.example) for the full template.

- `OSE_RUNTIME_MODE` is required. Only the exact values `Local` and `Test` allow the process to
  serve; anything else — missing, unknown, `Staging`, or `Production` — writes a sanitized diagnostic
  to stderr and exits non-zero before a builder, route table, or listener exists.
- `OSE_ID_BE_PORT` is optional; it defaults to `8501`, the port reserved for `ose-id-be` in
  [`docs/reference/web-sites.md`](../../docs/reference/web-sites.md). The listener always binds the
  loopback address `127.0.0.1`, never a machine-reachable interface.
- `OSE_ID_CONNECTION` is required for `/health/ready` to report ready: the serving process's
  read-only `ose_id_app` role connection string. `OSE_ID_MIGRATION_CONNECTION` is the separate,
  schema-owning `ose_id_migrator` role connection string the standalone migrator reads; the serving
  process never reads it. The two roles and keys must never collide.

## How the code is arranged

```text
apps/ose-id-be/src/
├── OseId.Domain/          business language and types; no outward dependency at all
├── OseId.Application/     use cases and ports; depends only on Domain
├── OseId.Infrastructure/  outbound adapters implementing Application's ports
└── OseId.Host/            composition root; the only project that names a framework type
```

See [the hexagonal dependency boundary](../../specs/apps/ose/id-be/architecture/hexagonal-dependency-boundary.md)
for the full rule set, and
[routes, configuration, and health](../../specs/apps/ose/id-be/architecture/routes-configuration-and-health.md)
for what the host serves.

## Common commands

Run these from the repository root.

| Command                                                                                                                     | Use it for                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `./hippo run --class transactional --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-be:build`               | Publish the release build.                                         |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:typecheck`        | Compile with warnings as errors.                                   |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:lint`             | Run `dotnet format --verify-no-changes` and analyzer verification. |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:test:unit`        | Run the fast in-process unit tests (99% line coverage enforced).   |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:test:integration` | Run in-process ASP.NET Core `TestHost` tests.                      |
| `./hippo run --class transactional --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-be:test:quick`          | Run this project's focused quality gate, including specs coverage. |
| `./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e`            | Run the separate published-process backend end-to-end suite.       |

## BDD and Testing

The canonical corpus is `specs/apps/ose/id-be/behaviours/`. `test:unit` uses injected boundary
doubles inside an in-process `TestHost`; `test:integration` exercises the composed ASP.NET Core
pipeline in-process; and the dedicated `ose-id-be-e2e:test:e2e` project owns the published-process,
public-loopback-HTTP boundary. Matching `test:coverage:*` targets validate all applicable adapters
statically against the shared Gherkin corpus.
