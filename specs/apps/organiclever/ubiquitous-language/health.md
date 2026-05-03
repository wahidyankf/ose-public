# Ubiquitous Language — health

**Bounded context**: `health`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Backend health-endpoint client and the `/system/status/be` diagnostic page. Reads `ORGANICLEVER_BE_URL`, probes `GET /health`, and renders an UP / DOWN / Not configured tile.

## Terms

| Term              | Definition                                                                                                         | Code identifier(s)                                                                                  | Used in features   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------ |
| `Backend URL`     | The configured `ORGANICLEVER_BE_URL` env var. Server-only.                                                         | `ORGANICLEVER_BE_URL`                                                                               | `health/*.feature` |
| `Health probe`    | A `GET <backendUrl>/health` request with a 3-second timeout, executed on each request to `/system/status/be`.      | `BackendClient` (Effect Service Tag)                                                                | `health/*.feature` |
| `Health status`   | One of `UP`, `DOWN`, or `Not configured`. Determined by the probe result.                                          | `ApiError`, `NetworkError`                                                                          | `health/*.feature` |
| `Status tile`     | The card on `/system/status/be` rendering one of the three states with URL, latency, and (on DOWN) failure reason. | (server-rendered page component)                                                                    | `health/*.feature` |
| `Backend client`  | The Effect.ts service that issues the health probe. Lives behind a port; the live and test layers are siblings.    | `BackendClient` (Effect Service Tag), `BackendClientLive`, `createBackendClientTest` (test factory) | `health/*.feature` |
| `Diagnostic page` | The route `/system/status/be` itself — server-rendered, `force-dynamic`.                                           | (route segment) system/status/be                                                                    | `health/*.feature` |

## Forbidden synonyms

- "Status" alone — overloaded with "session status" in `workout-session` and "settings status" in `settings`. Inside `health`, always qualify as "health status".
- "Endpoint" — refers to the backend's `GET /health` route. Inside `health`, the backend route is the _target_, not an owned concept; prefer "backend URL" or "health endpoint".
