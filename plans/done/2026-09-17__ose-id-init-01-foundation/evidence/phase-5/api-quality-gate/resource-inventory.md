# Resource Inventory — api-exploratory-tester discovery run `aet-2ecbb6945fdd`

Observed non-destructively (no write, restart, or stop issued against any owned resource) before and
during the sweep, alongside the stack description already provided by the invoking task ("a fresh,
owned local stack — foundation-ready fixture profile, empty domain state, only the EF
migrations-history table exists").

## Live listener

| Property | Observed value                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Process  | `dotnet` PID 84455, listening `127.0.0.1:8501` (TCP, LISTEN)                                             |
| Server   | `Kestrel` (banner only; no version number disclosed)                                                     |
| Runtime  | ASP.NET Core (Kestrel banner, `application/problem+json` RFC 9457 shape, minimal-API-style 405 fallback) |

## Owned PostgreSQL container (read-only `docker ps`; not queried, stopped, or restarted this pass)

| Property | Observed value                       |
| -------- | ------------------------------------ |
| Name     | `ose-id-local-stack-pg-4938a4ef13c6` |
| Image    | `postgres:17-alpine`                 |
| Ports    | `127.0.0.1:5438->5432/tcp`           |
| Status   | `Up 9 minutes` at sweep start        |

Domain/schema state was not independently queried (out of the immutable HTTP-only scope for this
pass); `GET /health/ready` reported `{"postgresql":"ready","schema":"compatible"}` throughout,
consistent with the task-provided "empty domain state, only the EF migrations-history table exists"
baseline.

## Worktree / build identity

| Property      | Value                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Worktree path | `./worktrees/ose-id-init-01-foundation`                                                                                                     |
| Git HEAD      | `83b73f6b6b910ffeaf988323a9fd0a7b18e08f17`                                                                                                  |
| Git branch    | `ose-id-init-01-foundation-base`                                                                                                            |
| Working tree  | dirty at sweep time (unrelated in-progress Phase 5 documentation edits already staged by a concurrent session; none touched by this tester) |

## Closed-surface inventory (paths confirmed to answer only ordinary framework 404, zero leakage)

28 plausible-but-out-of-scope paths probed (see `request-response-matrix.md` §5): `/`, `/health`,
`/healthz`, `/api/health`, `/swagger`, `/swagger/index.html`, `/openapi.json`, `/openapi.yaml`,
`/.well-known/openid-configuration`, `/connect/userinfo`, `/connect/logout`, `/connect/endsession`,
`/account/login`, `/account/register`, `/account/logout`, `/company`, `/companies`,
`/v1/health/live`, `/api/v1/health/live`, `/metrics`, `/robots.txt`, `/favicon.ico`,
`/scim/v2/ServiceProviderConfig`, `/platform/admin`, `/platform/admin/companies/1`,
`/external/google`, `/connect`, `/oidc`, `/.well-known/jwks.json` — every one returned `404` with an
empty body and no `Content-Type` header (the framework's genuine unmatched-route shape), confirming
no Swagger/OpenAPI self-exposure, no accidental account/company/OIDC-userinfo/metrics route, and no
capability-code leakage outside the seven documented operations.

## Scope respected

Only `http://127.0.0.1:8501` was exercised. `http://127.0.0.1:3500` (`ose-id-web`) was never
requested — it is explicitly out of this pass's immutable scope. No `docker stop`/`start`, no process
signal, and no database write was issued; the stack was left exactly as received for the orchestrator
to tear down.
