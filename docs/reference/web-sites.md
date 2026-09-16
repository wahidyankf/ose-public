---
title: "Web Sites"
description: Every deployable app in this repo — domain, dev port, and production deploy branch.
category: reference
tags:
  - reference
  - apps
  - deployment
created: 2026-08-14
---

# Web Sites

| App                  | Domain                                                   | Port | Prod Branch                 |
| -------------------- | -------------------------------------------------------- | ---- | --------------------------- |
| ose-www              | [oseplatform.com](https://oseplatform.com)               | 3100 | `prod-ose-www`              |
| ayokoding-www        | [ayokoding.com](https://ayokoding.com)                   | 3101 | `prod-ayokoding-www`        |
| organiclever-www     | [www.organiclever.com](https://www.organiclever.com/)    | 3200 | `prod-organiclever-www`     |
| organiclever-app-web | TBD                                                      | 3202 | `prod-organiclever-app-web` |
| ose-app-web          | [app.oseplatform.com](https://app.oseplatform.com) (TBD) | 3300 | `prod-ose-app-web` (TBD)    |
| ose-id-web           | TBD                                                      | 3500 | `prod-ose-id-web` (TBD)     |
| ose-be               | api.oseplatform.com (F# / Giraffe / ASP.NET 10)          | 8302 | —                           |
| ose-lms-be           | (Java 25 / Spring Boot 4)                                | 8303 | —                           |
| organiclever-be      | (F# / Giraffe / ASP.NET 10, Kubernetes)                  | 8202 | —                           |
| roots-be             | (Go 1.26 / Gin)                                          | 8402 | —                           |
| ose-id-be            | (C# / ASP.NET Core 10)                                   | 8501 | —                           |

## Overriding a port

Every app in the table above resolves its listener port the same way: an explicit `--port` flag,
then the app's prefixed variable, then the default shown. A malformed value fails at startup rather
than falling back silently.

| App                  | Variable                    |
| -------------------- | --------------------------- |
| ose-www              | `OSE_WWW_PORT`              |
| ayokoding-www        | `AYOKODING_WWW_PORT`        |
| organiclever-www     | `ORGANICLEVER_WWW_PORT`     |
| organiclever-app-web | `ORGANICLEVER_APP_WEB_PORT` |
| ose-app-web          | `OSE_APP_WEB_PORT`          |
| ose-id-web           | `OSE_ID_WEB_PORT`           |
| organiclever-be      | `ORGANICLEVER_BE_PORT`      |
| ose-be               | `OSE_BE_PORT`               |
| ose-lms-be           | `OSE_LMS_BE_PORT`           |
| roots-be             | `ROOTS_BE_PORT`             |
| ose-id-be            | `OSE_ID_BE_PORT`            |

```bash
./hippo run --class service --disk-path . -- npm exec nx -- dev ose-www --port=4000       # flag
OSE_WWW_PORT=4000 ./hippo run --class service --disk-path . -- npm exec nx -- dev ose-www # variable
./hippo run --class service --disk-path . -- docker run -e OSE_WWW_PORT=4000 …            # container
```

A bare `PORT` is deliberately not honoured — one exported `PORT` would otherwise retarget every app
at once. See the
[Environment Variable Naming Standard](../../repo-governance/conventions/security/secrets-and-env-standards/environment-variable-naming-standard.md).

## Supporting Service Ports

Every backend test stack publishes its PostgreSQL and NATS containers on distinct host ports so two
stacks can run at the same time (Nx runs affected projects in parallel).

| Stack                       | PostgreSQL | NATS |
| --------------------------- | ---------- | ---- |
| ose-be integration          | 5433       | 4223 |
| organiclever-be integration | 5434       | 4224 |
| ose-be e2e                  | 5435       | 4225 |
| organiclever-be e2e         | 5436       | 4226 |

Host ports 5432 and 4222 stay unclaimed — they remain the defaults in each backend's `.env.example`
for a developer-run PostgreSQL or NATS shared across apps by database name, not by port.

`ose-id-be-e2e`'s owned local-stack (`OSE_ID_POSTGRES_PORT`, default 5438) does not fit the table
above — OSE ID uses no NATS container — so it is recorded here instead: the E2E project's
self-contained PostgreSQL container publishes on host port 5438 by default, overridable the same way
as the app ports above.

Each app README at `apps/[app-name]/README.md` covers framework, deployment, E2E tests, and content
details. Staging branches: `stag-organiclever-app-web`, `stag-ose-app-web`.

**See**: [AGENTS.md](../../AGENTS.md), [monorepo-structure.md](./monorepo-structure.md)
