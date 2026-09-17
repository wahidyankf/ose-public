# ose-id-be-e2e

This project tests `ose-id-be` as a real, published, spawned process — the one boundary neither the
backend's own Unit nor Integration adapter can observe. It publishes the deployable output once per
test assembly, launches it with an explicit environment, and only ever looks at what an outside
observer can see: the exit code, the diagnostic stream, and whether a loopback listener exists.

## Run locally

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm install
./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e
```

The suite publishes `apps/ose-id-be/src/OseId.Host/OseId.Host.csproj` to
`apps/ose-id-be/dist/e2e/` and spawns it directly with `dotnet`; no separate terminal or manually
started server is needed.

## Local stack (`serve`)

This project also owns a manual-verification local stack — a multi-process orchestrator, not an app
`dev`/`start` server (see `target-naming-rules.md`'s documented exception for this shape):

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-ready
```

It starts one owned PostgreSQL container, applies migrations, starts one or two `ose-id-be`
instances, and starts `ose-id-web`, in that dependency order, then blocks until signaled and stops
everything it started in the exact reverse order. Every owned resource is scoped to this
invocation's run ID; cleanup never touches another concurrent invocation's resources or a broader
Docker/process pattern.

Fixture profiles (`--fixture-profile=<name>`, all reach full readiness first, then apply the named
transition): `foundation-ready` (default, stays ready), `foundation-postgres-down` (stops the owned
PostgreSQL container after readiness), `foundation-backend-down` (stops the first backend instance
after readiness). `--instances=1|2` controls backend instance count; `--validate-only` exits after
readiness without blocking.

Ports resolve `flag > env var > fallback`: `OSE_ID_POSTGRES_PORT` (5438), `OSE_ID_BE_PORT` (8501),
`OSE_ID_WEB_PORT` (3500) — see [web-sites.md](../../docs/reference/web-sites.md). A concurrent
invocation supplies its own env vars to avoid colliding with these manual-development defaults.

## Checks and specs

```bash
npm exec nx -- run ose-id-be-e2e:typecheck
npm exec nx -- run ose-id-be-e2e:lint
npm exec nx -- run ose-id-be-e2e:test:e2e
npm exec nx -- run ose-id-be-e2e:test:coverage
npm exec nx -- run ose-id-be-e2e:test:quick
```

`typecheck` compiles the step assembly with warnings as errors; `lint` adds
`dotnet format --verify-no-changes` and Roslyn analyzer verification. Both run inside `test:quick`,
ahead of the static coverage validators, under the same build policy the code they observe uses.

The behaviour source of truth is
[the OSE ID backend Gherkin suite](../../specs/apps/ose/id-be/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes `ose-id-be`
through the real process and loopback-listener boundary; `test:coverage:e2e`,
`test:coverage:behaviour`, and aggregate `test:coverage` validate it statically. Unit and Integration
are omitted because their in-process boundaries belong to `ose-id-be` itself. `install`,
`test:e2e:ui`, and `test:e2e:report` are omitted as Playwright/npm-specific and inapplicable to a
Reqnroll runner.
