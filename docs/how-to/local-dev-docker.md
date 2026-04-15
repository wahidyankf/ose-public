---
title: How to Set Up Local Development with Docker
description: Set up a reproducible local development environment using Docker and Docker Compose for all services
category: how-to
tags:
  - docker
  - local-development
  - docker-compose
created: 2026-02-28
updated: 2026-03-31
---

# How to Set Up Reproducible Local Development with Docker

## Overview

This guide explains how to set up a reproducible local development environment using Docker and Docker Compose for all services in the open-sharia-enterprise platform.

**Goal**: Ensure all developers work in identical environments, regardless of their host operating system or installed tools.

## Prerequisites

- **Docker Desktop** (macOS/Windows) or **Docker Engine + Docker Compose v2** (Linux):
  - Docker Engine: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
  - Docker Compose: v2.0+ (included with Docker Desktop; install separately on Linux)
- **Docker resources**: Minimum 2 CPU cores and 4 GB RAM recommended (configure in Docker Desktop → Settings → Resources)
- **Volta**: Node.js version manager for running Nx commands — install from [volta.sh](https://volta.sh/). Volta reads the pinned Node.js and npm versions from `package.json` automatically.
- **Git**: For cloning the repository

**Optional** (only needed if building applications outside Docker):

- Language-specific tools (Java, Node.js, etc.) for building before containerization
- Or use Docker multi-stage builds (future enhancement)

## Benefits of Docker-Based Development

1. **Environment Consistency**: All developers use identical runtime environments
2. **Isolation**: Services don't conflict with host system or each other
3. **Production Parity**: Development environment matches production deployment
4. **Easy Onboarding**: New developers get started in minutes
5. **Clean System**: No need to install multiple language runtimes
6. **Network Simulation**: Test service-to-service communication locally

## Repository Structure

Docker Compose configurations are organized by deployment target:

```
infra/
├── dev/                        # Local development environments
│   ├── a-demo-be-java-springboot/         # Demo Backend (Spring Boot) stack
│   │   ├── docker-compose.yml
│   │   ├── .env.example
│   │   └── README.md
│   ├── a-demo-be-elixir-phoenix/         # Demo Backend (Elixir/Phoenix) stack
│   │   ├── docker-compose.yml
│   │   └── README.md
│   ├── organiclever-fe/     # organiclever-fe (Next.js) stack
│   │   ├── docker-compose.yml
│   │   └── README.md
│   └── [other-service]/       # Other service ecosystems
└── k8s/                        # Kubernetes configs
    └── organiclever/          # OrganicLever K8s deployments
```

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
```

### 2. Choose Your Service Ecosystem

Each app category has its own Docker Compose setup under `infra/dev/`. Pick the one matching your development task:

**Backend (demo-be)**:

```bash
docker compose -f infra/dev/a-demo-be-golang-gin/docker-compose.yml up
```

**Frontend (demo-fe)**:

```bash
docker compose -f infra/dev/a-demo-fe-ts-nextjs/docker-compose.yml up
```

**Full-stack (demo-fs)**:

```bash
docker compose -f infra/dev/a-demo-fs-ts-nextjs/docker-compose.yml up
```

**Content platform**:

```bash
# AyoKoding
docker compose -f infra/dev/ayokoding-web/docker-compose.yml up

# OSE Platform
docker compose -f infra/dev/oseplatform-web/docker-compose.yml up
```

**OrganicLever** (frontend + backend + database):

```bash
docker compose -f infra/dev/organiclever/docker-compose.yml up
```

> **Note**: All `a-demo-be-*` backends bind port 8201 and are mutually exclusive — do not run two backend stacks simultaneously.

### 3. Configure Environment (Optional)

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional, defaults work)
nano .env
```

### 4. Build Application (If Needed)

Some services require building before containerization:

```bash
# Example: Spring Boot application
cd ../../../apps/a-demo-be-java-springboot
mvn clean package -DskipTests

# Or using Nx
nx run a-demo-be-java-springboot:build

# Return to Docker Compose directory
cd ../../infra/dev/a-demo-be-java-springboot
```

### 5. Start Services

```bash
# Start all services in the ecosystem
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### 6. Verify Services

```bash
# Example: Test a-demo-be-java-springboot
curl http://localhost:8201/api/v1/hello
# Expected: {"message":"world"}

curl http://localhost:8201/health
# Expected: {"status":"UP"}
```

### 6a. Run E2E Tests (Optional)

With the backend running, execute the API-level Playwright E2E suite from the repository root:

```bash
nx run a-demo-be-e2e:test:e2e
```

See [`apps/a-demo-be-e2e/`](../../apps/a-demo-be-e2e/README.md) for setup and options.

With the frontend running, execute the web Playwright suite:

```bash
nx run organiclever-fe-e2e:test:e2e
```

See [`apps/organiclever-fe-e2e/`](../../apps/organiclever-fe-e2e/README.md) for setup and options.

### 7. Stop Services

```bash
# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Available Service Ecosystems

### Demo Backend — JASB (`infra/dev/a-demo-be-java-springboot/`)

**Services (Docker Compose)**:

- `a-demo-be-db` - PostgreSQL 17 database (port 5432)
- `a-demo-be-java-springboot` - Spring Boot backend (port 8201)

**Related Apps (run separately)**:

- `a-demo-be-e2e` - Playwright API E2E tests — `nx run a-demo-be-e2e:test:e2e`

**Quick Start**:

```bash
npm run demo-be:dev
```

**Documentation**: [Demo Backend (JASB) Infrastructure README](../../infra/dev/a-demo-be-java-springboot/README.md)

### organiclever-fe (`infra/dev/organiclever-fe/`)

**Services (Docker Compose)**:

- `organiclever-fe` - Next.js landing website (port 3200)

**Related Apps (run separately)**:

- `organiclever-fe-e2e` - Playwright browser E2E tests — `nx run organiclever-fe-e2e:test:e2e`

**Quick Start**:

```bash
npm run organiclever-fe:dev
```

**Documentation**: [organiclever-fe Infrastructure README](../../infra/dev/organiclever/README.md)

### Future Ecosystems

Additional service ecosystems will be added as the platform grows.

## Common Operations

### View Logs

```bash
# All services
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml logs -f

# Specific service
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml logs -f a-demo-be-java-springboot

# Last 100 lines
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml logs --tail=100 a-demo-be-java-springboot
```

### Restart Services

```bash
# Restart all
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml restart

# Restart specific service
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml restart a-demo-be-java-springboot
```

### Rebuild After Code Changes

```bash
# 1. Rebuild the application
nx run a-demo-be-java-springboot:build

# 2. Restart the service
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml restart a-demo-be-java-springboot
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# Compose service status
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml ps
```

### Clean Up

```bash
# Stop and remove containers
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml down

# Remove volumes (caution: deletes data)
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml down -v

# Remove unused Docker resources
docker system prune
```

## Development Workflows

### Workflow 1: Pure Docker Development

**Best for**: Frontend developers, new team members, quick testing

```bash
# 1. Start services
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml up -d

# 2. Make changes to code
# 3. Rebuild and restart (Java requires rebuild; Go/Python restart is sufficient)
nx run a-demo-be-java-springboot:build
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml restart a-demo-be-java-springboot

# 4. Test changes
curl http://localhost:8201/api/v1/hello
```

### Workflow 2: Hybrid Development

**Best for**: Backend developers, active development

```bash
# Run the database in Docker only
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml up -d a-demo-be-db

# Run the app directly on the host for faster iteration
cd apps/a-demo-be-java-springboot
mvn spring-boot:run
```

### Workflow 3: Full Local Development

**Best for**: System integration testing

```bash
# Run all services in Docker
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml up -d

# All services share the same named bridge network and communicate by service name
```

## Environment Variable Configuration

### Using .env Files

Each service ecosystem that needs configuration includes an `.env.example` template:

```bash
# 1. Copy the template
cp infra/dev/<ecosystem>/.env.example infra/dev/<ecosystem>/.env

# 2. Edit your values (most defaults work without changes)
nano infra/dev/<ecosystem>/.env
```

The `.env` file is loaded automatically by Docker Compose. It is git-ignored — never commit it.

### Common Variables by Ecosystem

**All backends (DATABASE_URL)**:

```bash
# Constructed by Docker Compose internally; exposed on host for E2E tests
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Full-stack (`a-demo-fs-ts-nextjs`)**:

```bash
DATABASE_URL=postgresql://demo_fs_nextjs:demo_fs_nextjs@db:5432/demo_fs_nextjs
APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long!!
# Enable test-only API routes used by E2E tests
ENABLE_TEST_API=true
```

**OrganicLever** (requires OAuth setup):

```bash
# Required: Google OAuth credentials for login
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT secret — dev default provided if omitted
APP_JWT_SECRET=dev-jwt-secret-at-least-32-characters-long

# PostgreSQL — no need to change for local dev
POSTGRES_USER=organiclever
POSTGRES_PASSWORD=organiclever
POSTGRES_DB=organiclever
```

**Java Spring Boot**:

```bash
# Profile: dev (verbose logging) or prod (JSON logging)
SPRING_PROFILES_ACTIVE=dev
JAVA_OPTS=-Xms256m -Xmx512m -XX:+UseZGC
```

### What Each Variable Controls

| Variable                    | Used By                 | Purpose                                        |
| --------------------------- | ----------------------- | ---------------------------------------------- |
| `DATABASE_URL`              | All backends with DB    | Connection string for PostgreSQL               |
| `ENABLE_TEST_API`           | a-demo-fs-ts-nextjs     | Enables test-only HTTP routes for E2E teardown |
| `APP_JWT_SECRET`            | fs-nextjs, organiclever | Signs JWT tokens (min 32 chars for HS256)      |
| `GOOGLE_CLIENT_ID`          | organiclever-fe         | Google OAuth client identifier                 |
| `GOOGLE_CLIENT_SECRET`      | organiclever            | Google OAuth client secret (server-side only)  |
| `SPRING_PROFILES_ACTIVE`    | Java Spring Boot        | Selects Spring Boot configuration profile      |
| `JAVA_OPTS` / `MAVEN_OPTS`  | Java backends           | JVM and Maven memory settings                  |
| `POSTGRES_USER/PASSWORD/DB` | organiclever, jasb      | PostgreSQL credentials (dev defaults provided) |

## Database Seeding and Migration

Each backend handles database setup automatically on startup. No manual migration steps are required for local development.

| Language / Framework | Migration Tool     | How It Runs                                                          |
| -------------------- | ------------------ | -------------------------------------------------------------------- |
| Go (Gin)             | GORM auto-migrate  | Runs on startup via `AutoMigrate` calls in `main.go`                 |
| Java (Spring Boot)   | Flyway             | Flyway migrations run automatically during Spring Boot startup       |
| Java (Vert.x)        | Flyway             | Flyway migrations run via `mvn compile exec:java` on startup         |
| TypeScript (Effect)  | Drizzle            | Drizzle migrations applied before server starts                      |
| Python (FastAPI)     | Alembic            | Alembic `upgrade head` runs in the container entrypoint              |
| Rust (Axum)          | sqlx migrate       | `sqlx migrate run` executes on startup                               |
| Kotlin (Ktor)        | Exposed / Flyway   | Schema creation runs on startup                                      |
| F# (Giraffe)         | EF Core Migrations | `dotnet run` applies pending migrations on startup                   |
| C# (ASP.NET Core)    | EF Core Migrations | `dotnet run` applies pending migrations on startup                   |
| Elixir (Phoenix)     | Ecto               | `mix ecto.migrate` runs before `mix phx.server` in the container CMD |
| Clojure (Pedestal)   | Custom / Korma     | Schema applied on startup                                            |

For services with PostgreSQL, the database container must pass its health check before the app container starts. Docker Compose `depends_on: condition: service_healthy` enforces this ordering automatically.

## Hot-Reload in Docker Development

The dev Docker images mount source code as a volume and run the application directly from source. This means most changes are reflected immediately or after a fast recompile — no image rebuild required.

| Language            | Container Command            | Reload Mechanism                                                  |
| ------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Go                  | `go run ./cmd/server`        | Restart the container to pick up changes (or use `air` locally)   |
| Java (Spring Boot)  | `mvn spring-boot:run -Pdev`  | Spring DevTools reloads classes on compilation                    |
| Java (Vert.x)       | `mvn compile exec:java`      | Recompile via Maven; restart container                            |
| TypeScript (Effect) | `npx tsx src/main.ts`        | Restart container after file changes                              |
| Python (FastAPI)    | `uvicorn ... --host 0.0.0.0` | Restart container (add `--reload` flag locally for auto-reload)   |
| Rust (Axum)         | `cargo run`                  | Full rebuild on restart (`cargo-watch` not used in Docker)        |
| Kotlin (Ktor)       | `./gradlew run`              | Gradle restarts the JVM on change with `--continuous`             |
| F# (Giraffe)        | `dotnet run`                 | `dotnet watch run` can be substituted for file-watching           |
| C# (ASP.NET Core)   | `dotnet run`                 | `dotnet watch run` can be substituted for file-watching           |
| Elixir (Phoenix)    | `mix phx.server`             | Phoenix code reloader handles module recompilation automatically  |
| Clojure (Pedestal)  | `clojure -M -m ...`          | Restart container; nREPL connection available for REPL-driven dev |
| Dart (Flutter Web)  | Flutter web server           | Restart container; incremental compilation applies on reload      |

**Restarting a single service** to pick up code changes:

```bash
docker compose -f infra/dev/<ecosystem>/docker-compose.yml restart <service-name>
```

## Environment Architecture

The platform uses a 3-environment architecture:

- **dev**: Local Docker Compose development (this guide)
- **staging**: Kubernetes pre-production testing
- **prod**: Kubernetes production deployment

For local development, always use the `dev` profile (default). The `staging` and `prod` profiles are designed for Kubernetes deployments with different observability and security configurations.

## Networking

### Service Communication

Services in the same Docker Compose network can communicate by service name:

```bash
# Example: Frontend calling backend
http://a-demo-be-java-springboot:8201/api/v1/hello

# Example: Backend connecting to database
jdbc:postgresql://organiclever-db:5432/organiclever
```

### Port Mapping

Services expose ports to the host:

| App / Service                    | Host Port | Service Type             |
| -------------------------------- | --------- | ------------------------ |
| a-demo-be-\* (all backends)      | 8201      | Backend API              |
| a-demo-fe-ts-nextjs              | 3301      | Frontend dev server      |
| a-demo-fe-ts-tanstack-start      | 3301      | Frontend dev server      |
| a-demo-fe-dart-flutterweb        | 3301      | Frontend dev server      |
| a-demo-fs-ts-nextjs              | 3401      | Full-stack dev server    |
| ayokoding-web                    | 3101      | Content platform         |
| oseplatform-web                  | 3100      | Content platform         |
| organiclever-fe                  | 3200      | OrganicLever frontend    |
| organiclever-be                  | 8202      | OrganicLever backend API |
| PostgreSQL (most backends)       | 5432      | Database                 |
| PostgreSQL (a-demo-fs-ts-nextjs) | 5438      | Database                 |

> **Note**: Frontend stacks (`a-demo-fe-*`) are mutually exclusive — they all expose port 3301 and include the Go/Gin backend on port 8201. Do not run two frontend stacks simultaneously.

## Health Checks

Services include health checks for monitoring:

```bash
# Check health via Docker
docker compose -f infra/dev/<ecosystem>/docker-compose.yml ps

# Check health via endpoint
curl http://localhost:8201/health
```

**Health check features**:

- Automatic restarts on failure
- Startup grace period
- Configurable intervals and retries

## Troubleshooting

### Docker Daemon Not Running

```bash
# Check if Docker is running
docker info

# If not, start Docker Desktop (macOS/Windows)
# or on Linux: sudo systemctl start docker
```

### Service Won't Start

```bash
# Check logs for error details
docker compose -f infra/dev/<ecosystem>/docker-compose.yml logs <service-name>

# Check if a required port is already occupied
lsof -i :8201

# Verify application was built (Java apps)
ls -lh apps/a-demo-be-java-springboot/target/*.jar
```

### Port Conflicts

All `a-demo-be-*` backends share port 8201. All `a-demo-fe-*` frontends share port 3301. Running two stacks simultaneously causes a bind error.

```bash
# Find the process occupying the port
lsof -i :8201

# Kill the process by PID
kill -9 <PID>

# Or stop the conflicting Docker stack
docker compose -f infra/dev/<other-ecosystem>/docker-compose.yml down
```

### Volume Permission Errors

On Linux, Docker containers may run as a non-root user that cannot write to host-mounted volumes.

```bash
# Check the error in container logs
docker compose -f infra/dev/<ecosystem>/docker-compose.yml logs <service-name>

# Fix by adjusting ownership of the mounted directory
sudo chown -R $USER:$USER apps/<app-name>

# Or run the container as your UID (set in docker-compose.yml env)
# UID=$(id -u) GID=$(id -g) docker compose up
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Remove stopped containers, unused images, networks, and build cache
docker system prune

# Also remove unused volumes (caution: deletes persistent data)
docker system prune --volumes
```

### Cannot Connect to Service

```bash
# Verify service is running and healthy
docker compose -f infra/dev/<ecosystem>/docker-compose.yml ps

# Inspect health status
docker inspect <container-name> | grep -A 10 Health

# Test connectivity from inside the container
docker exec <container-name> curl -f http://localhost:8201/health
```

### Network Issues Between Services

```bash
# List Docker networks
docker network ls

# Inspect which containers are on the network
docker network inspect <network-name>

# Each ecosystem creates its own named bridge network.
# Containers in different ecosystems cannot reach each other by service name.
```

### Build Failed (Java)

```bash
# View full build output
mvn clean package

# Verify Java version matches requirements
java -version

# Clear Maven local cache if corrupted
rm -rf ~/.m2/repository/org/springframework
```

## Best Practices

### 1. Always Use Version Pinning

```yaml
# Good: Specific version
image: eclipse-temurin:25-jre-alpine

# Bad: Latest tag (unpredictable)
image: eclipse-temurin:latest
```

### 2. Use .env Files, Never Commit Secrets

```bash
# Good: Use .env.example as template
cp .env.example .env

# Bad: Hardcode secrets in docker-compose.yml
```

### 3. Mount Volumes Read-Only When Possible

```yaml
volumes:
  - ../../apps/a-demo-be-java-springboot/target/app.jar:/app/app.jar:ro
```

### 4. Include Health Checks

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:8201/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 5. Use Named Networks

```yaml
networks:
  organiclever-network:
    driver: bridge
    name: organiclever-network
```

### 6. Document Port Assignments

Maintain a central registry of ports to avoid conflicts. See the [Port Mapping](#port-mapping) reference table in the Networking section above for the complete list. Key assignments:

- 8201: All `a-demo-be-*` backends (shared, mutually exclusive)
- 3301: All `a-demo-fe-*` frontends (shared, mutually exclusive)
- 3200: organiclever-fe
- 8202: organiclever-be
- 5432: PostgreSQL for most backends
- 5438: PostgreSQL for a-demo-fs-ts-nextjs

## Performance Tips

### 1. Use BuildKit

```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
```

### 2. Optimize Image Size

- Use Alpine-based images
- Multi-stage builds for compiled languages (see `apps/a-demo-be-java-springboot Dockerfile` and `apps/organiclever-fe/Dockerfile` for production examples)
- Remove unnecessary files

### 3. Cache Dependencies

```bash
# For Maven, cache .m2 directory
volumes:
  - ~/.m2:/root/.m2:cached
```

### 4. Limit Resource Usage

```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"
      memory: 1024M
    reservations:
      cpus: "0.5"
      memory: 512M
```

## Migration from Local Development

### Before: Local Development

```bash
# Install Java 25
# Install Maven
# Install Node.js
# Configure environment variables
# Run application
mvn spring-boot:run
```

### After: Docker Development

```bash
# Install Docker (one time)
# Start with Docker Compose (source is volume-mounted; no pre-build needed for most backends)
docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml up -d
```

### Advantages

- No Java/Maven installation needed (optional)
- Consistent environment across team
- Easier onboarding for new developers
- Production parity

## CI/CD Integration

**Production Dockerfiles**: Multi-stage production Dockerfiles are co-located with each app (`apps/a-demo-be-java-springboot/Dockerfile`, `apps/organiclever-fe/Dockerfile`). These build optimized, non-root images suitable for Kubernetes deployment.

Docker Compose can be used in CI/CD pipelines:

```bash
# GitHub Actions example
- name: Start services
  run: docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml up -d

- name: Run tests
  run: docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml exec a-demo-be-java-springboot mvn test

- name: Stop services
  run: docker compose -f infra/dev/a-demo-be-java-springboot/docker-compose.yml down
```

## Related Documentation

- [Demo Backend (JASB) Infrastructure README](../../infra/dev/a-demo-be-java-springboot/README.md)
- [organiclever-fe Infrastructure README](../../infra/dev/organiclever/README.md)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Reproducible Environments Convention](../../governance/development/workflow/reproducible-environments.md)

## Support

For issues or questions:

1. Check service-specific README in `infra/dev/[service]/`
2. Review troubleshooting section above
3. Check Docker logs: `docker compose -f infra/dev/<ecosystem>/docker-compose.yml logs`
4. Consult main repository documentation
