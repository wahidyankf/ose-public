# organiclever-fe

Next.js 16 frontend for the OrganicLever productivity tracker.

## Overview

This app is the web frontend for OrganicLever. It uses a BFF (Backend-for-Frontend) proxy pattern
where the browser communicates only with this Next.js app, which in turn communicates server-side
with `organiclever-be` (the F#/Giraffe backend).

Authentication uses Google Identity Services (GSI). The Google ID token is sent to a Route Handler,
which proxies the token to the backend and stores the resulting JWT in an `httpOnly` cookie.

## Architecture

```
Browser ──── Next.js (organiclever-fe) ──── organiclever-be:8202
                    │
                    ├── /login          Client component (Google OAuth)
                    ├── /profile        Server component (reads profile from backend)
                    ├── /api/auth/google Route Handler (proxy Google token → backend)
                    ├── /api/auth/refresh Route Handler (proxy refresh → backend)
                    └── /api/auth/me    Route Handler (proxy me → backend)
```

Key design decisions:

- Effect TS runs on the server side only (service layer, Route Handlers, Server Components)
- Client components use plain `fetch` to the Route Handlers
- JWT tokens stored in `httpOnly` cookies (never exposed to JavaScript)
- Route protection via `src/proxy.ts` (Next.js 16 middleware)

## Environment Variables

| Variable                       | Scope       | Description                                         |
| ------------------------------ | ----------- | --------------------------------------------------- |
| `ORGANICLEVER_BE_URL`          | Server-only | Backend base URL (default: `http://localhost:8202`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Public      | Google OAuth client ID for the GSI button           |

## Development

```bash
nx dev organiclever-fe          # Start development server (localhost:3200)
nx build organiclever-fe        # Production build
nx run organiclever-fe:test:quick  # Unit tests + coverage validation (70%)
nx run organiclever-fe:test:unit   # Unit tests only
nx run organiclever-fe:typecheck   # TypeScript type check
nx run organiclever-fe:lint        # Lint with oxlint
```

## Testing

Tests use Vitest with `@amiceli/vitest-cucumber` for BDD-style Gherkin specs.

Spec files are in `specs/apps/organiclever/fe/gherkin/`.

Step implementations are in `test/unit/steps/`.

Coverage threshold: 70% lines (enforced by `rhino-cli test-coverage validate`).

## Tech Stack

- **Next.js 16** — App Router, Server Components, Route Handlers
- **Effect TS** — Typed functional effects for server-side service layer
- **Tailwind CSS v4** — Utility-first CSS
- **`@open-sharia-enterprise/ts-ui`** — Shared UI component library
- **Vitest** — Unit tests
- **TypeScript 5** — Strict mode
