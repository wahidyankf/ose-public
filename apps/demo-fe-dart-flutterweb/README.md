# demo-fe-dart-flutterweb

Flutter Web frontend for OrganicLever expense tracking — an alternative implementation
to `demo-fe-ts-nextjs` (Next.js).

## Tech Stack

- **Language**: Dart (using `package:web` for standard DOM output)
- **Build Tool**: Flutter Web (`flutter build web`)
- **HTTP Client**: dio
- **Serving**: Nginx (reverse proxy for `/api/*`, `/health`, `/.well-known/*`)
- **E2E Tests**: Shared `demo-fe-e2e` Playwright tests (92 Gherkin scenarios)

## Architecture

This app renders standard HTML elements using `package:web` and `dart:js_interop` to
ensure full Playwright E2E compatibility. All pages produce real `<input>`, `<button>`,
`<table>`, `<nav>`, and ARIA elements that Playwright can query via `getByRole()`,
`getByLabel()`, and `querySelectorAll()`.

## Development

```bash
# Development server
nx dev demo-fe-dart-flutterweb

# Build
nx build demo-fe-dart-flutterweb

# Lint
nx lint demo-fe-dart-flutterweb
```

## Docker

```bash
# Start full stack (DB + Go/Gin backend + Flutter frontend)
docker compose -f infra/dev/demo-fe-dart-flutterweb/docker-compose.yml up --build

# Frontend: http://localhost:3301
# Backend:  http://localhost:8201
```

## E2E Tests

```bash
# With docker compose running:
BASE_URL=http://localhost:3301 BACKEND_URL=http://localhost:8201 \
  npx nx run demo-fe-e2e:test:e2e
```

## Project Structure

```
lib/
├── main.dart               # Entry point, routing, auth refresh
├── models/                 # Data classes (auth, user, expense, etc.)
├── services/               # API client + service layer (dio)
├── pages/                  # Route pages (package:web DOM)
└── widgets/                # Layout (app shell, header, sidebar)
nginx/
├── nginx.conf.template     # Nginx config with $BACKEND_URL
└── entrypoint.sh           # envsubst + nginx start
```
