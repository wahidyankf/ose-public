---
description: The Dockerfile template, compose file roles, and .dockerignore pattern.
when_to_use: Use when writing a Dockerfile, compose file, or .dockerignore.
---

# Docker Conventions

## Dockerfile Template

All production Dockerfiles follow a multi-stage pattern:

```dockerfile
# syntax=docker/dockerfile:1

# ── Stage 1: dependency manifest layer ──────────────────────────────────────
# Copy only manifest files first so this layer is cached across code changes.
FROM base-image AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── Stage 3: production runtime ─────────────────────────────────────────────
FROM base-image AS runner
WORKDIR /app

# OCI standard image labels
LABEL org.opencontainers.image.source="https://github.com/open-sharia-enterprise/open-sharia-enterprise"
LABEL org.opencontainers.image.description="App description"

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup \
  && adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["sh", "-c", "wget -qO- http://localhost:3000/health || exit 1"]

CMD ["node", "dist/main.js"]
```

**Key requirements**:

- **Multi-stage**: Separate dependency installation, build, and runtime stages.
- **Dependency-manifest-first layer ordering**: Copy `package.json` / lock file before source
  code so Docker layer cache survives code-only changes.
- **Non-root user**: All containers run as a non-root system user.
- **HEALTHCHECK with `wget`**: Use `wget` for health checks — never `curl`. Many minimal base
  images (Alpine, distroless) include `wget` but not `curl`. Write its `CMD` in JSON (exec) form,
  as the `hadolint` gate requires; wrap it in `sh -c` when the probe needs variable expansion or
  the `|| exit 1` mapping.
- **OCI LABEL**: Every production image must carry `org.opencontainers.image.source` and
  `org.opencontainers.image.description` labels.

## Docker Compose Patterns

Three docker-compose file roles exist per app:

| Role           | Path                                    | Purpose                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| **Dev**        | `infra/dev/{app}/docker-compose.yml`    | Local development services (databases, message queues, etc.)              |
| **E2E**        | `apps/{app}/docker-compose.e2e.yml`     | Networked test stack for public-boundary E2E with isolated synthetic data |
| **CI overlay** | `infra/dev/{app}/docker-compose.ci.yml` | Overrides for CI E2E environment (no volume mounts, deterministic ports)  |

Docker Compose is never an Integration-test classifier. A container the test did not start is not
a resource it owns, so any test that reaches one belongs to E2E and must enter through the
application's public boundary. Integration may use only local resources it owns, including an
allowlisted loopback socket it starts and stops itself.

All compose files must pass `docker compose config` without errors before merging. The CI overlay
is applied with `-f docker-compose.yml -f docker-compose.ci.yml` to keep dev and CI configs DRY.

## `.dockerignore` Pattern

Use broad exclusions with narrow inclusions rather than enumerating every excluded path:

```dockerignore
# Exclude everything by default
**

# Include only what the build needs
!apps/{app-name}/
!libs/
!package.json
!package-lock.json
!nx.json
!tsconfig*.json
```

Broad exclusion prevents accidentally including large directories (e.g., `node_modules`, `.git`,
`generated-reports`) that would bloat the build context and slow transfers.
