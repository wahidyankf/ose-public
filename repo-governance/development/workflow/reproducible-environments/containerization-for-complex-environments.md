---
description: docker-compose.yml and a development Dockerfile pattern for local services and consistent build environments, run with rootless Podman Compose.
when_to_use: Use when standing up local Postgres/Redis services via Podman Compose, or writing a development Dockerfile.
---

# Containerization for Complex Environments

## Podman Compose for Local Development

The repository runs containers with rootless Podman. Run only the `podman` binary: no `docker` CLI,
`docker buildx`, Docker daemon, or Docker socket. Use `podman compose` with the explicit
`podman-compose` provider. Set `PODMAN_COMPOSE_PROVIDER` to the `podman-compose` executable name or path
so that an installed Docker Compose cannot take over. The Compose file keeps its standard name and schema.

**docker-compose.yml** (committed to git):

```yaml
version: "3.8"

services:
  postgres:
    image: docker.io/library/postgres:16.1
    environment:
      POSTGRES_DB: ose_dev
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: docker.io/library/redis:7.2.4
    ports:
      - "6379:6379"

  app:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://developer:${POSTGRES_PASSWORD:-dev_password}@postgres:5432/ose_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**Starting local environment**:

```bash
export PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"
podman compose up
# All services start with exact same configuration
```

## Development Dockerfile

**Dockerfile.be.dev**:

```dockerfile
# Use specific version
FROM docker.io/library/node:24.13.1-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies from lockfile
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

**Why this works**:

- Exact Node.js version (24.13.1)
- npm ci installs from lockfile (deterministic)
- Same environment for all developers
- Intended to run the same on macOS (Podman machine) and Linux; verified on rootless Podman on Linux (Compose stacks and platform checks) and macOS (platform checks)

## Boundaries and Cleanup

- Rootless-only operation, CI setup, and image rules: [Podman Conventions](../../infra/ci-conventions/docker-conventions.md).
- Teardown of containers, volumes, and stacks: [Podman-Artifact Cleanup](../worktree-and-artifact-cleanup/docker-artifact-cleanup.md).
  Only positively owned, disposable artifacts are removed; shared dev stacks and persistent data are retained.
