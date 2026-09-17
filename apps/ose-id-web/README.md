# ose-id-web

`ose-id-web` is the OSE ID platform's web shell: a Next.js app that reads and renders the backend's
service status. This slice is the foundation delivery — it deliberately serves no sign-in, account,
company, or product page. There is nothing to click; the page is a read-only status document.

## Start it locally

From the repository root, install workspace dependencies, copy the environment template, and start
the dev server:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm install
cp apps/ose-id-web/.env.example apps/ose-id-web/.env.local
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:dev
```

Visit `http://127.0.0.1:3500/`. A `Staging`, `Production`, or missing/unknown `OSE_RUNTIME_MODE` in
the process environment makes the proxy return `503` for every request instead of serving a page —
see [Configuration](#configuration).

Run standalone this way, the page reads whatever `ose-id-be` is reachable at `OSE_ID_BE_URL`, and
states plainly that it could not read one when nothing answers there. For a fully owned PostgreSQL
plus `ose-id-be` plus this web shell, with no separate setup or manual cleanup, use
`ose-id-be-e2e`'s [local stack](../ose-id-be-e2e/README.md#local-stack-serve) instead.

## What is available today

| Route   | What it renders                                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /` | The service status page: a heading, one named `role="status"` region, and a text-based (never color-only) state for the shell, the backend, PostgreSQL, the schema, and authentication. |

The page renders server-side on every request (`export const dynamic = "force-dynamic"`), reading
`GET /health/ready` from the backend as it renders, so it is never stale and never caches a state the
backend no longer has. Reloading the page re-reads; there is no refresh control, and no form, link,
or interactive control of any kind — nothing here can start a session. When the backend cannot be
read at all, the root answers a sanitized `503` page that names no host, path, or exception.

## Configuration

The app reads configuration from process environment variables; see
[`.env.example`](./.env.example) for the full template.

- `OSE_RUNTIME_MODE` is required. Only the exact values `Local` and `Test` allow the proxy to serve a
  response; anything else returns a sanitized `503` with no host, stack, or path detail.
- `OSE_ID_BE_URL` is optional; it defaults to `http://127.0.0.1:8501`, the port reserved for
  `ose-id-be`. It is server-only and must be an absolute loopback origin — the browser never receives
  it, and a non-loopback origin fails startup.
- `OSE_ID_WEB_PORT` is optional; it defaults to `3500`, the port reserved for `ose-id-web` in
  [`docs/reference/web-sites.md`](../../docs/reference/web-sites.md).

## How the code is arranged

```text
apps/ose-id-web/src/
├── app/                              the one route: layout, page, metadata
├── contexts/foundation/
│   ├── domain/                       status vocabulary and labels
│   ├── application/                  status report assembly, composition root, envelope policy
│   ├── infrastructure/               the server-side backend readiness client
│   └── presentation/                 the accessible status panel component
├── shared/runtime/                   the runtime-mode guard (mirrors the backend's)
└── proxy.ts                          composition root: wires the status source to the envelope
```

See [runtime guard and status reporting](../../specs/apps/ose/id-web/architecture/runtime-guard-and-status-reporting.md)
for the full behaviour.

## Common commands

Run these from the repository root.

| Command                                                                                                                      | Use it for                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:dev`                    | Run the dev server with file watching.                             |
| `./hippo run --class transactional --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-web:build`               | Produce the production build.                                      |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:typecheck`        | Run the no-emit strict TypeScript check.                           |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:lint`             | Run `oxlint` and `eslint`, including accessibility rules.          |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:test:unit`        | Run component/unit tests (99% line coverage enforced).             |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web:test:integration` | Run the real server-side proxy/page boundary in Node.              |
| `./hippo run --class transactional --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-web:test:quick`          | Run this project's focused quality gate, including specs coverage. |
| `./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-web-e2e:test:e2e`            | Run the separate Playwright browser end-to-end suite.              |

## BDD and Testing

The canonical corpus is `specs/apps/ose/id-web/behaviours/`. `test:unit` covers rendering logic with
jsdom; `test:integration` drives the real Next.js proxy and page composition in a Node runtime with no
network; and the dedicated `ose-id-web-e2e` project owns the real-browser, real-viewport boundary.
Matching `test:coverage:*` targets validate all applicable adapters statically against the shared
Gherkin corpus.
