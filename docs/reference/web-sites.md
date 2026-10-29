---
title: "Web Sites"
description: Every deployable app in this repo — domain, dev port, and production deploy branch — the host ports its test stacks and tools bind, and the stock service ports no app may claim.
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
| ose-www              | [www.oseplatform.com](https://www.oseplatform.com/)      | 3100 | `prod-ose-www`              |
| ayokoding-www        | [www.ayokoding.com](https://www.ayokoding.com/)          | 3101 | `prod-ayokoding-www`        |
| ayokoding-web        | TBD (local Go + htmx rewrite, in progress)               | 3102 | —                           |
| organiclever-www     | [www.organiclever.com](https://www.organiclever.com/)    | 3200 | `prod-organiclever-www`     |
| organiclever-app-web | TBD                                                      | 3202 | `prod-organiclever-app-web` |
| ose-app-web          | [app.oseplatform.com](https://app.oseplatform.com) (TBD) | 3300 | `prod-ose-app-web` (TBD)    |
| ose-be               | api.oseplatform.com (F# / Giraffe / ASP.NET 10)          | 8302 | —                           |
| organiclever-be      | (F# / Giraffe / ASP.NET 10, Kubernetes)                  | 8202 | —                           |

## Overriding a port

Every app in the table above resolves its listener port the same way: an explicit `--port` flag,
then the app's prefixed variable, then the default shown. A malformed value fails at startup rather
than falling back silently.

| App                  | Variable                    |
| -------------------- | --------------------------- |
| ose-www              | `OSE_WWW_PORT`              |
| ayokoding-www        | `AYOKODING_WWW_PORT`        |
| ayokoding-web        | `AYOKODING_WEB_PORT`        |
| organiclever-www     | `ORGANICLEVER_WWW_PORT`     |
| organiclever-app-web | `ORGANICLEVER_APP_WEB_PORT` |
| ose-app-web          | `OSE_APP_WEB_PORT`          |
| organiclever-be      | `ORGANICLEVER_BE_PORT`      |
| ose-be               | `OSE_BE_PORT`               |

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-www --port=4000       # flag
OSE_WWW_PORT=4000 ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-www # variable
./hippo run --class service --resource-tier standard --disk-path . -- podman run -e OSE_WWW_PORT=4000 …            # container
```

A bare `PORT` is deliberately not honoured — one exported `PORT` would otherwise retarget every app
at once. See the
[Environment Variable Naming Standard](../../repo-governance/conventions/security/secrets-and-env-standards/environment-variable-naming-standard.md).

## Stock Service Ports

An app, or the stack that serves it, claims no port that is the stock default of a common local
service: a developer's own copy of that service already holds it, so the claim fails or silently
reaches the wrong process. A stack that needs one of these services publishes it on another host port.

| Port  | Service       |
| ----- | ------------- |
| 5432  | PostgreSQL    |
| 3306  | MySQL         |
| 6379  | Redis         |
| 27017 | MongoDB       |
| 4222  | NATS          |
| 5672  | RabbitMQ      |
| 9092  | Kafka         |
| 9200  | Elasticsearch |
| 11434 | Ollama        |

An app that connects to one of these services at its stock port, such as the `.env.example` defaults
below, is a client and claims nothing.

**Enforcement**: unenforced by decision; checked by review. No declared gate scans listener ports or
compose `ports:` entries, because telling a claim from a client connecting to a developer-run service
is a judgement a mechanical scan cannot settle. Review checks every port added to this page, an
`.env.example`, or a compose file against the table above.

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

The `infra/dev/ose-app` Compose scaffold publishes its PostgreSQL on host port 5437; inside the
Compose network the backend still reaches it at `postgres:5432`.

## Test and Tooling Ports

Ports that a test suite or a developer tool binds on the host, outside the app and backend stack
tables above:

| Port | Owner                              | Use                                                            |
| ---- | ---------------------------------- | -------------------------------------------------------------- |
| 3190 | `ose-www-fe-e2e`, `ose-www-be-e2e` | The `ose-www` server Playwright starts for the E2E suites      |
| 3191 | `ayokoding-web-e2e`                | The `ayokoding-web` server Playwright starts for the E2E suite |
| 6006 | `libs/web-ui`                      | Storybook (`storybook` target and its Playwright suite)        |

A port listed here is claimed the same way as an app port: pick a new one listed nowhere on this
page.

Each app README at `apps/[app-name]/README.md` covers framework, deployment, E2E tests, and content
details. Staging branches: `stag-organiclever-app-web`, `stag-ose-app-web`.

**See**: [AGENTS.md](../../AGENTS.md), [monorepo-structure.md](./monorepo-structure.md)
