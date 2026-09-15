# Local Stack and Verification

## Runner Ownership

The repository must have one OSE ID foundation entrypoint implemented through current Nx target and
script conventions discovered in Phase 0. Do not prescribe a new orchestration framework if an existing
owned-runner pattern already satisfies lifecycle requirements.

Each invocation generates a non-secret run ID and resolves loopback ports from scoped configuration.
Every container/network/volume/process/log directory carries that run ID. Cleanup selects exact owned
resources, never broad Docker or process patterns.

## Startup Order

1. Validate tools, runtime mode, environment, port availability, and output paths.
2. Allocate an ignored temporary run directory outside tracked source.
3. Start the owned PostgreSQL resource and wait on its native readiness probe under a bounded deadline.
4. Apply migrations with the migration role and stop immediately on non-zero exit.
5. Start one or two backend instances with application credentials; poll `/health/ready`.
6. Start the web shell; poll its readiness/HTTP contract.
7. Run E2E/manual serve action only after every dependency is ready.
8. On success, failure, signal, or timeout, stop web, backend, and PostgreSQL in reverse order.
9. Assert no owned process/container/network/volume/port remains; report cleanup failure separately.

No fixed sleep is an admission mechanism. Bounded readiness polling is allowed because it observes a
state transition; retrying a failed assertion or entire test is forbidden.

## Port and Environment Contract

The canonical local defaults are fixed: `OSE_ID_WEB_PORT=3500` at `http://127.0.0.1:3500`,
`OSE_ID_BE_PORT=8501` at `http://127.0.0.1:8501`, and `OSE_ID_POSTGRES_PORT=5438` at
`127.0.0.1:5438`. Phase 0 verifies these remain unclaimed in `docs/reference/web-sites.md` and the live
host before mutation. A registry or live collision stops execution and amends the plan; the executor
does not silently choose another default. Parallel E2E runs allocate runner-owned ephemeral overrides
while these values remain the documented manual-development defaults.

Never reuse `$HOME`, `$CODEX_HOME`, or system option variable names. Do not commit real `.env` files.
Use an `.env.example` with safe local placeholders and comments that mark non-local rejection.

## Test Ownership

| Layer       | Scope                                                                                | Network/container rule                 |
| ----------- | ------------------------------------------------------------------------------------ | -------------------------------------- |
| Unit        | Runtime-mode parser, health mapping, config redaction, domain-free application ports | No network/container                   |
| Integration | In-process ASP.NET/Next wiring with approved fakes                                   | No Docker; no built-process dependency |
| Backend E2E | Built backend, PostgreSQL, migrations, privilege, outage, two instances              | Owns network/container                 |
| Web E2E     | Built browser/web/backend stack, accessibility, dependency state, cleanup            | Owns/delegates full stack              |
| Manual      | Local shell and curl/browser inspection                                              | Isolated run only                      |

## Required Negative Tests

- Unknown/missing/Staging/Production modes do not bind useful listeners.
- Application database role cannot create, alter, drop, grant, change role, or bypass policy.
- Health responses do not include strings matching connection-string, password, bearer, host-path, or
  raw exception patterns.
- Account, token, provider, company, admin, and framework sample routes do not exist.
- A readiness deadline does not cause resources to survive.
- A failure during migration, backend startup, web startup, or assertion still runs cleanup.
- A cleanup error does not replace the original failure code/message.

## Manual Verification

After automated gates, the executor uses the delivered runner and records sanitized evidence:

1. Start a clean stack and capture project/version plus successful liveness/readiness.
2. Stop PostgreSQL; capture live=success and ready=database-unavailable.
3. Restart PostgreSQL; capture readiness recovery without backend restart.
4. Probe future identity routes and record only status/path, proving no enabled behavior.
5. Open the web shell at desktop and 320px, navigate by keyboard, and inspect accessible status text.
6. Start two backend instances and alternate diagnostic requests; stop/restart one.
7. Stop the stack and record an empty owned-resource/port inventory.
8. Repeat the complete run once to catch stale migration or cleanup state.

Evidence contains no environment dumps, database passwords, connection strings, cookies, tokens, or
absolute machine paths. Store sanitized outputs under the in-progress plan's `evidence/` folder using
descriptive filenames.

## Commands as Delivered Interface

The exact Nx target names are resolved from current repository convention in Phase 0 and then documented
in each project README. At minimum provide:

- focused backend/web `build`, `typecheck`, `lint`, `test:quick`, and applicable `test:integration` targets;
- backend/web E2E targets that own their resources;
- a standalone local `serve` target that blocks until ready and cleans on termination;
- an automated full-stack check target suitable for local and CI execution.

If the repository already prescribes `dev`, `e2e`, or `local-stack` names, use those rather than adding
aliases. The delivery checklist names discovery steps because inventing commands before project
generation would produce an unreliable runbook.

## Rollback

Because this slice has no user data, rollback removes project/registry files and stops owned local
resources. If the schema migration has landed, keep it in history or apply a forward repair; do not edit
applied migration files. A rollback must preserve any later plan already based on these contracts, so it
cannot occur after Plan 02 starts without first stopping and replanning downstream work.
