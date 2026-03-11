# Demo Backend Infrastructure

Docker Compose configuration for Demo Backend services ecosystem.

## Overview

This infrastructure setup provides Docker Compose configuration for the demo backend ecosystem. The full ecosystem includes:

- **demo-be-db** - PostgreSQL 17 database (port 5432, runs in Docker Compose)
- **demo-be-jasb** - Spring Boot backend service (port 8201, depends on demo-be-db)
- **demo-be-e2e** - Playwright API E2E tests (requires demo-be-jasb + demo-be-db)

For the frontend (`organiclever-web`), see [`infra/dev/organiclever-web/`](../organiclever-web/README.md).

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Maven 3.8+ (for building the application)
- Java 25+ (for building the application)

## Quick Start

### Recommended: Using npm Scripts

The easiest way to start the development environment:

```bash
# From repository root
npm run demo-be:dev

# Or to restart (clean state)
npm run demo-be:dev:restart
```

This automatically:

- Starts `demo-be-jasb` (port 8201) with PostgreSQL database
- Mounts source code for hot-reload (Spring Boot DevTools)
- Shows logs in the terminal

### Alternative: Direct Docker Compose

If you prefer manual control or need specific docker-compose options:

#### 1. Build the Docker Image (First-time only)

The development environment uses a custom Docker image with Maven pre-installed. Build it once:

```bash
# From infra/dev/demo-be-jasb directory
docker compose build
```

This creates a custom development image (~666MB) that includes:

- Eclipse Temurin JDK 25 (Alpine)
- Maven 3.9.11 (pre-installed, not installed at runtime)
- Optimized for fast startup

**Note**: You only need to build once. The image persists and Maven won't be reinstalled on subsequent starts.

#### 2. Configure Environment

```bash
# From infra/dev/demo-be-jasb directory
cp .env.example .env
```

Edit `.env` and set:

| Variable            | Description                       | Default in .env.example             |
| ------------------- | --------------------------------- | ----------------------------------- |
| `POSTGRES_USER`     | PostgreSQL username               | `organiclever`                      |
| `POSTGRES_PASSWORD` | PostgreSQL password               | `organiclever`                      |
| `APP_JWT_SECRET`    | JWT signing secret (min 32 chars) | example value (change for security) |

The `APP_JWT_SECRET` default is for development only. Use a strong random secret in any
shared or production-like environment.

#### 3. Start Services

```bash
# Development mode (auto-reload enabled)
docker compose up

# Or detached mode
docker compose up -d

# To restart
docker compose down && docker compose up
```

### 4. Verify Services

```bash
# Check backend health
curl http://localhost:8201/health

# Test backend hello endpoint
curl http://localhost:8201/api/v1/hello
# Expected: {"message":"world"}
```

## Service Details

### demo-be-db

**Port**: 5432
**Image**: `postgres:17-alpine`
**Purpose**: PostgreSQL database for demo-be-jasb

**Environment Variables** (set in `.env`):

- `POSTGRES_USER` — database user (default: `organiclever`)
- `POSTGRES_PASSWORD` — database password (default: `organiclever`)
- `POSTGRES_DB` — database name (always: `demo_be`)

**Health check**: `pg_isready -U $POSTGRES_USER -d demo_be` (every 10 seconds)
**Data persistence**: `demo-be-db-data` named Docker volume

**Note**: `demo-be-jasb` depends on `demo-be-db` with `condition: service_healthy`,
so the backend will not start until PostgreSQL is ready.

### demo-be-jasb

**Port**: 8201
**Image**: Custom dev image (built from `Dockerfile.be.dev`)
**Base**: eclipse-temurin:25-jdk-alpine + Maven 3.9.11
**Profile**: dev (development mode with auto-reload)

**Endpoints**:

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login, returns JWT token
- `GET /api/v1/hello` - Hello world (requires Bearer token)
- `GET /health` - Health check (no auth)

**Environment Variables**:

- `SPRING_PROFILES_ACTIVE` - Spring profile (dev/prod), default: dev
- `SPRING_DATASOURCE_URL` - JDBC URL pointing to demo-be-db
- `SPRING_DATASOURCE_USERNAME` - Database username (from `POSTGRES_USER`)
- `SPRING_DATASOURCE_PASSWORD` - Database password (from `POSTGRES_PASSWORD`)
- `APP_JWT_SECRET` - JWT signing secret (min 32 chars)
- `MAVEN_OPTS` - JVM options for Maven process

## Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f demo-be-jasb

# Last 100 lines
docker-compose logs --tail=100 demo-be-jasb
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop demo-be-jasb
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart demo-be-jasb
```

### Check Status

```bash
# List running services
docker-compose ps

# Check resource usage
docker stats
```

### Rebuild After Code Changes

```bash
# 1. Rebuild the application
cd ../../apps/demo-be-jasb
mvn clean package -DskipTests

# 2. Restart the service
cd ../../infra/dev/demo-be-jasb
docker-compose restart demo-be-jasb
```

## Development with Auto-Reload

The infrastructure supports **Docker-based development with auto-reload** using Spring Boot DevTools. This enables code changes to be reflected automatically without manual rebuild cycles.

### Starting Development Mode

**Recommended: Use npm script** (from repository root):

```bash
npm run demo-be:dev
```

**Alternative: Direct docker compose**:

```bash
cd infra/dev/demo-be-jasb
docker compose up
```

**What happens**:

- Uses custom dev image with Maven pre-installed (no runtime installation)
- Mounts source code from `apps/demo-be-jasb/` (read-write)
- Runs `mvn spring-boot:run` with DevTools enabled
- DevTools watches for file changes and triggers fast restarts (1-2 seconds)
- First startup: ~2-3 minutes (Maven downloads dependencies)
- Subsequent restarts: 1-2 seconds (intelligent classloader reload)

### Auto-Reload Workflow

1. **Edit code**: Make changes to any file in `apps/demo-be-jasb/src/`
2. **Save file**: Press Ctrl+S (or Cmd+S on Mac)
3. **Wait**: Watch Docker logs for restart message (~1-2 seconds)
4. **Test**: Changes are live immediately

**Example**:

```bash
# Terminal 1: Start dev environment
npm run demo-be:dev

# Terminal 2: Test endpoint
curl http://localhost:8201/api/v1/hello
# Output: {"message":"world!"}

# Edit apps/demo-be-jasb/src/main/java/com/organiclever/be/controller/HelloController.java
# Change "world!" to "auto-reload works!"
# Save file

# Watch Terminal 1 for:
# "Restarting due to 1 class path change"

# Test again (within 2 seconds)
curl http://localhost:8201/api/v1/hello
# Output: {"message":"auto-reload works!"}
```

### First Startup vs Subsequent Restarts

**First startup**: 2-3 minutes

- Maven downloads ~100MB of dependencies
- Builds application
- Starts Spring Boot

**Subsequent restarts**: 1-2 seconds

- DevTools uses intelligent classloader reload
- Only reloads changed classes
- No dependency download needed (cached in Docker volume)

### Alternative: Local Maven Development

For even faster development (0.5-1 second restarts), run directly on host:

```bash
# From repository root
nx dev demo-be-jasb

# Or from app directory
cd apps/demo-be-jasb
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Benefits**:

- Faster restarts (no Docker overhead)
- Direct IDE integration
- Easier debugging

**Tradeoffs**:

- Requires Java 25 and Maven installed locally
- Not containerized (environment differences possible)

### Custom Development Image

The development environment uses a custom Docker image built from `Dockerfile.be.dev`:

**Why custom image?**

- ✅ **Faster startup**: Maven is pre-installed during build, not at runtime
- ✅ **Consistent environment**: Same Maven version for all developers
- ✅ **Isolated**: Maven installation contained to this service only
- ✅ **Build once, use many**: Image persists across container restarts

**Building the image** (first-time only):

```bash
# From infra/dev/demo-be-jasb
docker compose build
```

**What's included:**

- Eclipse Temurin JDK 25 (Alpine Linux)
- Maven 3.9.11 (pre-installed via apk)
- Total size: ~666MB

**Rebuilding** (only needed if Dockerfile.be.dev changes):

```bash
docker compose build --no-cache
```

## Environment Architecture

This project uses a 3-environment architecture:

### Dev (Local Development)

- **Profile**: `dev`
- **Location**: Local machine (this directory)
- **Deployment**: Docker Compose
- **Purpose**: Local development with auto-reload
- **DevTools**: Enabled
- **Logging**: DEBUG level
- **Health**: Full details exposed
- **Start**: `npm run demo-be:dev`

### Staging (Pre-Production)

- **Profile**: `staging`
- **Location**: Kubernetes cluster
- **Deployment**: Kubernetes
- **Purpose**: Pre-production testing and validation
- **DevTools**: Disabled
- **Logging**: INFO level
- **Health**: Details when authorized
- **Configuration**: See `infra/k8s/organiclever/staging/`

### Production

- **Profile**: `prod`
- **Location**: Kubernetes cluster
- **Deployment**: Kubernetes
- **Purpose**: Production deployment
- **DevTools**: Disabled
- **Logging**: INFO level
- **Health**: No details exposed
- **Configuration**: See `infra/k8s/organiclever/production/`

**Production Docker images**: Defined in the app directory (`apps/demo-be-jasb/Dockerfile`), independent of this dev setup.

**Deployment Flow**: dev (local) → staging (K8s) → prod (K8s)

## Development Options

This setup is **local development only**. For development, you have three options:

1. **npm scripts** (easiest, recommended):

```bash
# From repository root
npm run demo-be:dev

# Restart with clean state
npm run demo-be:dev:restart
```

1. **Docker Compose** (direct control):

```bash
cd infra/dev/demo-be-jasb
docker compose up
```

1. **Local Maven** (fastest, requires local Java 25):

```bash
nx dev demo-be-jasb
# or
cd apps/demo-be-jasb && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Environment Configuration

You can customize settings via `.env` file:

```bash
# In infra/dev/demo-be-jasb/.env
SPRING_PROFILES_ACTIVE=dev
MAVEN_OPTS=-Xmx512m
```

## Adding New Services

To add a new service to the demo-be ecosystem:

1. **Update docker-compose.yml**:

```yaml
new-service:
  image: your-image:tag
  container_name: demo-be-new-service
  ports:
    - "PORT:PORT"
  environment:
    - ENV_VAR=value
  networks:
    - demo-be-network
```

1. **Update .env.example** with new environment variables

1. **Update this README** with service documentation

## Network Configuration

All services communicate through the `demo-be-network` bridge network.

**Network Details**:

- Name: `demo-be-network`
- Driver: bridge
- Allows inter-service communication by container name

## Health Checks

Services include Docker health checks:

**demo-be-jasb** — custom health endpoint:

- **Endpoint**: `http://localhost:8201/health`
- **Interval**: 30 seconds / **Timeout**: 10 seconds / **Retries**: 3
- **Start Period**: 60 seconds

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs demo-be-jasb

# Check if JAR file exists
ls -lh ../../apps/demo-be-jasb/target/demo-be-jasb-1.0.0.jar

# Rebuild the application
cd ../../apps/demo-be-jasb && mvn clean package -DskipTests
```

### Port already in use

```bash
# Check what's using port 8201
lsof -i :8201

# Kill the process or change port in docker-compose.yml
```

### Health check failing

```bash
# Check if service is actually running
docker-compose ps

# Check logs for errors
docker-compose logs demo-be-jasb

# Test health endpoint manually
docker exec demo-be-jasb wget -O- http://localhost:8201/health
```

### Out of memory

Increase memory limits in `.env`:

```bash
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseZGC
```

### Cannot connect to service

```bash
# Verify service is running
docker-compose ps

# Verify port mapping
docker port demo-be-jasb

# Check firewall rules
sudo ufw status
```

## Performance Tuning

### JVM Options

Recommended JVM options for different scenarios:

**Low Memory (< 1GB)**:

```bash
JAVA_OPTS=-Xms256m -Xmx512m -XX:+UseZGC -XX:MaxRAMPercentage=75.0
```

**Medium Memory (1-2GB)**:

```bash
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseZGC -XX:MaxRAMPercentage=75.0
```

**High Memory (> 2GB)**:

```bash
JAVA_OPTS=-Xms1024m -Xmx2048m -XX:+UseZGC -XX:MaxRAMPercentage=75.0
```

### Docker Resource Limits

Add resource limits to services:

```yaml
services:
  demo-be-jasb:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1024M
        reservations:
          cpus: "0.5"
          memory: 512M
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` file with secrets
2. **Network Isolation**: Services are isolated in demo-be-network
3. **Read-Only Volumes**: JAR file is mounted read-only
4. **Non-Root User**: Production Dockerfiles run as non-root `app` user
5. **Health Checks**: Enables automatic recovery of unhealthy services

## Future Enhancements

### Completed

- **Production Dockerfiles**: Multi-stage build in `apps/demo-be-jasb/Dockerfile`

### Planned

- **Database**: PostgreSQL for data persistence
- **Redis**: Caching layer
- **Nginx**: Reverse proxy and load balancer
- **Monitoring**: Prometheus + Grafana
- **Log Aggregation**: ELK stack or similar

## Running E2E Tests

### API E2E Tests (demo-be-e2e)

Once the backend is running via Docker Compose, run the API-level Playwright test suite:

```bash
# Start backend only (avoids spinning up the frontend unnecessarily)
docker compose up -d demo-be-jasb

# Run tests
nx run demo-be-e2e:test:e2e
```

Tests target `http://localhost:8201` by default. Override with `BASE_URL` for other environments:

```bash
BASE_URL=http://staging.example.com nx run demo-be-e2e:test:e2e
```

See [`apps/demo-be-e2e/`](../../../apps/demo-be-e2e/README.md) for full documentation.

## Related Documentation

- [demo-be-jasb README](../../../apps/demo-be-jasb/README.md)
- [demo-be-e2e README](../../../apps/demo-be-e2e/README.md)
- [organiclever-web infra](../organiclever-web/README.md) — Frontend infrastructure (separate stack)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review service logs: `docker-compose logs`
3. Consult the main repository documentation
4. Check the application logs in the container
