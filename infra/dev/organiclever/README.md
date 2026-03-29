# OrganicLever Local Development Infrastructure

Docker Compose setup for running the full OrganicLever stack locally.

## Services

| Service         | Port | Description                 |
| --------------- | ---- | --------------------------- |
| organiclever-db | 5432 | PostgreSQL 17               |
| organiclever-be | 8202 | F#/Giraffe REST API backend |
| organiclever-fe | 3200 | Next.js 16 frontend         |

## Quick Start

```bash
# Copy .env.example to .env and fill in Google OAuth credentials
cp .env.example .env

# Start all services
npm run organiclever:dev

# Restart with fresh database
npm run organiclever:dev:restart
```

## Environment Variables

See `.env.example` for all required variables. At minimum, set:

- `GOOGLE_CLIENT_ID` — Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth Client Secret

## CI Variant

`docker-compose.ci.yml` is used in GitHub Actions for integration and E2E tests. It uses
`tmpfs` for the database and sets `APP_ENV=test` to bypass Google token verification.
