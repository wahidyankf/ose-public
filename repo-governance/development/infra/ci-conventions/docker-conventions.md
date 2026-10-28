---
description: The Dockerfile template, Podman Compose file roles, rootless Podman CI boundaries, and the .dockerignore pattern.
when_to_use: Use when writing a Dockerfile, compose file, .dockerignore, or a CI workflow that builds, runs, or publishes a container image with Podman.
---

# Podman Conventions

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
  code so the container build layer cache survives code-only changes.
- **Non-root user**: All containers run as a non-root system user.
- **HEALTHCHECK with `wget`**: Use `wget` for health checks — never `curl`. Many minimal base
  images (Alpine, distroless) include `wget` but not `curl`. Write its `CMD` in JSON (exec) form,
  as the `hadolint` gate requires; wrap it in `sh -c` when the probe needs variable expansion or
  the `|| exit 1` mapping.
- **Docker image format**: Native builds use `podman build --layers --format docker`. That format
  keeps the `HEALTHCHECK` metadata, so do not switch an image to an OCI-only format that drops it. Compose builds set
  `BUILDAH_FORMAT=docker`, as the dev scripts in `package.json` do; CI Compose builds rely on
  Compose-level healthchecks until they set it too.
- **OCI LABEL**: Every production image must carry `org.opencontainers.image.source` and
  `org.opencontainers.image.description` labels.

## Podman Compose Patterns

Three compose file roles exist per app:

| Role           | Path                                    | Purpose                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| **Dev**        | `infra/dev/{app}/docker-compose.yml`    | Local development services (databases, message queues, etc.)              |
| **E2E**        | `apps/{app}/docker-compose.e2e.yml`     | Networked test stack for public-boundary E2E with isolated synthetic data |
| **CI overlay** | `infra/dev/{app}/docker-compose.ci.yml` | Overrides for CI E2E environment (no volume mounts, deterministic ports)  |

Compose files keep their standard filenames and schema. Run them with `podman compose`, never with
Docker Compose.

Podman Compose is never an Integration-test classifier. A container the test did not start is not
a resource it owns, so any test that reaches one belongs to E2E and must enter through the
application's public boundary. Integration may use only local resources it owns, including a
review-accepted loopback socket it starts and stops itself.

Every compose file must pass `podman compose -f <file> config` without errors before merging. The CI
overlay is applied with `-f docker-compose.yml -f docker-compose.ci.yml` to keep dev and CI configs DRY.

## Podman Runtime and CI Boundaries

- **Rootless only**: A local script or entry point that starts, builds, or publishes a container first runs
  the shared preflight, `scripts/container-runtime-check` (with `--compose` when it calls Compose).
  CI workflows get the equivalent rootless and provider assertion from the `setup-podman` action.
  The preflight rejects an unreachable or rootful engine. Workloads never run with `sudo` or against
  a rootful engine.
- **Explicit provider**: Set `PODMAN_COMPOSE_PROVIDER` to the `podman-compose` executable before any
  `podman compose` command. An installed Docker Compose must never be selected.
- **Shared setup**: CI installs and checks Podman through the `.github/actions/setup-podman` action,
  which installs the pinned Podman and provider versions for its runner. Do not add a second container
  setup path.
- **Native builds with a job-local cache**: Build images with `podman build --layers --format docker`.
  The build cache stays local to the job, and derived images run from the same Podman store. Do not add
  registry-backed cache, BuildKit cache directories, or Buildx cache flags.
- **Stack teardown**: The reusable web-test workflow's `stop-containers-before-fe-e2e` input controls
  whether containers stop before FE E2E runs. No Compose stop command includes `-v`, and no job removes
  volumes to make a test pass.
- **Publishing**: Backend image publication logs in with `podman login --password-stdin` using an
  ephemeral auth file, builds with `podman build --layers --format docker`, and pushes with
  `podman push`. The job removes the auth file in its own cleanup. Never print tokens or persist
  authentication caches.

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
