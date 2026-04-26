# OrganicLever Local Development Infrastructure

Docker Compose setup for running the full OrganicLever stack locally.

## Services

| Service          | Port | Description                 |
| ---------------- | ---- | --------------------------- |
| organiclever-be  | 8202 | F#/Giraffe REST API backend |
| organiclever-web | 3200 | Next.js 16 frontend         |

## Quick Start

```bash
# Start all services (no .env file required for v0)
npm run organiclever:dev

# Restart with a fresh build
npm run organiclever:dev:restart
```

## Environment Variables

v0 has no required environment variables. The backend runs the health endpoint without
configuration and the frontend is local-first. The `.env.example` placeholder is kept for future
product features.

## CI Variant

`docker-compose.ci.yml` is used in GitHub Actions for E2E tests. It overrides only what differs
from the default compose file (currently nothing meaningful — kept as the extension point for
future CI-specific configuration).
