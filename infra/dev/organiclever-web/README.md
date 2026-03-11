# organiclever-web Dev Stack

Local development environment for `organiclever-web`, the Next.js landing
and promotional website at [www.organiclever.com](https://www.organiclever.com/).

## Port Assignment

| Service          | Port |
| ---------------- | ---- |
| organiclever-web | 3200 |

## Quick Start

### Recommended: Using npm Scripts

```bash
# From repository root
npm run organiclever-web:dev

# Or to restart (clean state)
npm run organiclever-web:dev:restart
```

### Alternative: Direct Docker Compose

```bash
cd infra/dev/organiclever-web

# First run — build image and start service
docker compose up --build

# Subsequent runs (image cached)
docker compose up
```

## Environment Variables

| Variable        | Default | Description                                           |
| --------------- | ------- | ----------------------------------------------------- |
| `START_COMMAND` | `dev`   | `dev` for hot-reload, `production` to serve pre-built |

Override defaults by setting variables in your shell or in a `.env` file alongside
`docker-compose.yml`.

## Startup Behaviour

**Controlled by `START_COMMAND` env var:**

- `(default)` — `npm install && npm run dev` — hot-reload dev server for local development
- `production` — `npm install --omit=dev && npm run start` — serves a pre-built `.next/` directory (CI only; host must run `nx build organiclever-web` first)

**node_modules isolation**: A named Docker volume (`organiclever-web-node-modules`) shadows the host `node_modules`. This prevents platform binary conflicts between Alpine Linux (container) and macOS/Windows/Linux (host).

**First startup**: ~2-4 minutes (cold `npm install`, Storybook devDeps are heavy)
**Subsequent starts**: fast (named volume persists installed packages)

## E2E Tests

```bash
# Start the frontend
npm run organiclever-web:dev

# Run E2E tests from workspace root
nx run organiclever-web-e2e:test:e2e
```

Tests target `http://localhost:3200` by default.

See [`apps/organiclever-web-e2e/`](../../../apps/organiclever-web-e2e/) for full documentation.

## Related Documentation

- [organiclever-web README](../../../apps/organiclever-web/README.md)
- [organiclever-web-e2e README](../../../apps/organiclever-web-e2e/README.md)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
