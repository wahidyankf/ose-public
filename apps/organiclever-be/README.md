# organiclever-be

OrganicLever Platform Backend - Spring Boot REST API

## Overview

- **Framework**: Spring Boot 4.0.2
- **Language**: Java 25
- **Build Tool**: Maven
- **Port**: 8201
- **API Base**: `/api/v1`

**CORS Configuration**: The backend includes CORS configuration to allow web apps on `http://localhost:*` (see `config/CorsConfig.java`).

## Prerequisites

- **Java 25** (managed via Volta or SDKMAN)
- **Maven 3.9+**
- **Docker & Docker Compose** (for containerized development)

## Development Modes

### Option 1: npm Scripts (Easiest - Recommended)

Use the convenient npm scripts from the repository root:

```bash
# Start development environment
npm run organiclever:dev

# Restart (clean restart with fresh state)
npm run organiclever:dev:restart
```

**Benefits**:

- ✅ Single command from anywhere in the repository
- ✅ No need to navigate to infra directory
- ✅ Consistent with other project scripts
- ✅ Auto-reload enabled (1-2 second restarts)

**Auto-reload workflow**:

1. Edit source files in `apps/organiclever-be/src/`
2. Save changes (Ctrl+S)
3. Watch logs for restart message (1-2 seconds)
4. Test changes immediately

**First startup**: Takes 2-3 minutes for Maven to download dependencies
**Subsequent restarts**: 1-2 seconds via DevTools intelligent classloader

### Option 2: Docker Compose (Direct Control)

If you prefer direct Docker Compose control:

```bash
cd infra/dev/organiclever

# First-time only: Build the custom dev image
docker compose build

# Start development environment
docker compose up
```

**What's happening**:

- Uses custom Docker image with Maven pre-installed (see `Dockerfile.be.dev`)
- Mounts source code into container (read-write)
- Runs `mvn spring-boot:run` with DevTools enabled
- DevTools watches for file changes and triggers fast restarts
- **Note**: Maven is NOT installed at runtime, saving 10-20 seconds on each startup

### Option 3: Local Maven (Fastest)

Run directly on host machine (0.5-1 second restarts):

```bash
# From repository root
nx dev organiclever-be

# Or from app directory
cd apps/organiclever-be
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Best for**: Rapid iteration, debugging with IDE

## Testing Auto-Reload

### Step 1: Start application

```bash
npm run organiclever:dev
```

Wait for: `Started OrganicLeverApplication in X seconds`

### Step 2: Test baseline

```bash
curl http://localhost:8201/api/v1/hello
```

Expected: `{"message":"world"}`

### Step 3: Modify code

Edit `apps/organiclever-be/src/main/java/com/organiclever/be/controller/HelloController.java`:

```java
return Map.of("message", "auto-reload works!");
```

Save file (Ctrl+S)

### Step 4: Verify reload

Watch Docker logs for:

```
Restarting due to 1 class path change
```

Test again (within 2 seconds):

```bash
curl http://localhost:8201/api/v1/hello
```

Expected: `{"message":"auto-reload works!"}`

## Production Deployment

### Step 1: Build JAR

```bash
# From repository root
nx build organiclever-be

# Or from app directory
cd apps/organiclever-be
mvn clean package -DskipTests
```

Output: `target/organiclever-be-1.0.0.jar`

### Step 2: Run with production config

```bash
cd infra/dev/organiclever
docker-compose -f docker-compose.yml up
```

**Production mode differences**:

- Uses JRE image (smaller, ~80MB vs 300MB JDK)
- No source mount (pre-built JAR only)
- No DevTools (excluded from JAR)
- No auto-reload (manual rebuild required)
- Faster startup (~10 seconds)

## Nx Commands

```bash
# Build JAR
nx build organiclever-be

# Start development server (Maven spring-boot:run)
nx dev organiclever-be

# Start production server (runs built JAR)
nx run organiclever-be:start

# Run fast quality gate: unit + integration in parallel (no running service needed)
nx run organiclever-be:test:quick

# Run unit tests only (JUnit 5, no Spring context)
nx run organiclever-be:test:unit

# Run integration tests only (Cucumber JVM + MockMvc, no running service needed)
nx run organiclever-be:test:integration

# Lint code
nx lint organiclever-be

# Package annotation + null-safety check (JSpecify + NullAway — runs in pre-push hook)
nx typecheck organiclever-be
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names. Use `dev` (not `serve`) for the development server.

## Available Endpoints

### Application

- `GET /api/v1/hello` - Hello world endpoint

### Actuator (Monitoring)

- `GET /actuator/health` - Health check
- `GET /actuator/info` - Application info
- `GET /actuator/metrics` - Metrics

## Configuration Profiles

### dev (Development)

- **File**: `application-dev.yml`
- **Location**: Local machine
- **Deployment**: Docker Compose
- **DevTools**: Enabled (auto-reload)
- **Logging**: DEBUG level
- **Health**: Full details exposed

### staging (Staging Environment)

- **File**: `application-staging.yml`
- **Location**: Kubernetes cluster
- **Deployment**: Kubernetes
- **DevTools**: Excluded
- **Logging**: INFO level
- **Health**: Details when authorized

### prod (Production)

- **File**: `application-prod.yml`
- **Location**: Kubernetes cluster
- **Deployment**: Kubernetes
- **DevTools**: Excluded
- **Logging**: INFO level
- **Health**: Details hidden

## Troubleshooting

### Auto-reload not working

**Check DevTools is running**:

```bash
# Look for this in logs:
LiveReload server is running on port 35729
```

**Verify file changes are detected**:

```bash
# Watch container logs while editing files
docker-compose logs -f organiclever-be
```

**Force restart**:

```bash
docker-compose restart organiclever-be
```

### Port 8201 already in use

```bash
# Find process using port
lsof -i :8201

# Kill process
kill -9 <PID>
```

### Maven dependency download slow

First startup downloads ~100MB of dependencies. Subsequent starts are fast due to local Maven cache.

**Speed up next time**:

```bash
# Pre-download dependencies
cd apps/organiclever-be
mvn dependency:go-offline
```

### Application won't start

**Check Java version**:

```bash
java -version
# Should show Java 25
```

**Check Maven version**:

```bash
mvn -version
# Should show Maven 3.9+
```

**Clear Maven cache**:

```bash
rm -rf ~/.m2/repository
mvn clean install
```

## Development Workflow

### 1. Feature Development

```bash
# Start dev environment
cd infra/dev/organiclever
docker-compose up

# Edit code in apps/organiclever-be/src/
# Save → Auto-reload (1-2 seconds)
# Test changes immediately
```

### 2. Running Tests

```bash
# Fast quality gate: unit + integration in parallel (no running service needed)
nx run organiclever-be:test:quick

# Unit tests only (JUnit 5, no Spring context)
nx run organiclever-be:test:unit        # mvn test

# Integration tests only (Cucumber JVM + MockMvc)
nx run organiclever-be:test:integration # mvn test -Pintegration
```

### 3. Production Build

```bash
nx build organiclever-be
cd infra/dev/organiclever
docker-compose -f docker-compose.yml up
```

## Docker Development Image

The Docker-based development environment uses a custom image built from `infra/dev/organiclever/Dockerfile.be.dev`:

**Key Features**:

- ✅ **Pre-installed Maven**: Maven 3.9.11 installed during image build, not at runtime
- ✅ **Faster startup**: Saves 10-20 seconds on each `docker compose up`
- ✅ **Consistent environment**: Same tooling for all developers
- ✅ **Isolated**: Maven installation contained to organiclever-be service only

**Building the image** (first-time only):

```bash
cd infra/dev/organiclever
docker compose build
```

**Image details**:

- Base: eclipse-temurin:25-jdk-alpine
- Maven: 3.9.11 (pre-installed via Alpine package manager)
- Size: ~666MB
- Build time: ~60-90 seconds

**When to rebuild**:

- Only if `Dockerfile.be.dev` changes
- Otherwise, the image persists and is reused automatically

## Architecture

```
apps/organiclever-be/
├── src/main/java/com/organiclever/be/
│   ├── OrganicLeverApplication.java      # Main entry point
│   ├── config/
│   │   └── CorsConfig.java               # CORS configuration for Flutter web
│   └── controller/
│       └── HelloController.java          # REST endpoints
├── src/main/resources/
│   ├── application.yml                   # Base config
│   ├── application-dev.yml               # Dev config (DevTools)
│   └── application-prod.yml              # Prod config
└── src/test/
    ├── java/com/organiclever/be/
    │   ├── integration/
    │   │   ├── CucumberIntegrationTest.java       # @Suite runner
    │   │   ├── CucumberSpringContextConfig.java   # Spring + MockMvc context config
    │   │   ├── ResponseStore.java                 # Shared MvcResult state
    │   │   ├── OrganicLeverApplicationTest.java   # Context-load test
    │   │   └── steps/
    │   │       ├── CommonSteps.java
    │   │       ├── HelloSteps.java
    │   │       └── HealthSteps.java
    │   └── unit/
    │       └── HelloControllerTest.java           # JUnit 5, no Spring context
    └── resources/
        ├── application-test.yml                   # Test profile (overrides dev show-details)
        └── junit-platform.properties              # Cucumber config
```

## Testing

Three tiers of testing provide complete coverage:

| Tier        | Tool                   | Surefire profile | Location                         | Command                                   | Requires running service? | Cached? |
| ----------- | ---------------------- | ---------------- | -------------------------------- | ----------------------------------------- | ------------------------- | ------- |
| Unit        | JUnit 5                | (default)        | `src/test/java/.../unit/`        | `nx run organiclever-be:test:unit`        | No                        | Yes     |
| Integration | Cucumber JVM + MockMvc | `-Pintegration`  | `src/test/java/.../integration/` | `nx run organiclever-be:test:integration` | No                        | Yes     |
| E2E         | playwright-bdd         | —                | `apps/organiclever-be-e2e/`      | `nx run organiclever-be-e2e:test:e2e`     | Yes (port 8201)           | No      |

The two Maven profiles are mutually exclusive: `mvn test` includes only `**/unit/**/*Test.java`;
`mvn test -Pintegration` includes only `**/integration/**/*Test.java`. `test:quick` runs both in
parallel (MockMvc needs no real server, so there is no shared resource contention).

Integration and E2E tests share the same Gherkin feature files from `specs/apps/organiclever-be/`.

### Unit Tests

No Spring context. Tests individual classes in isolation (`mvn test`, default Surefire includes):

```bash
nx run organiclever-be:test:unit
# or: cd apps/organiclever-be && mvn test
```

### Integration Tests (MockMvc)

Full Spring context via `@SpringBootTest(webEnvironment = MOCK)` + MockMvc. No running service
required — Cucumber JVM reads the same Gherkin feature files as the E2E suite (`mvn test
-Pintegration`). Because all dependencies are in-process, integration tests are **cached** by Nx
(`cache: true`):

```bash
nx run organiclever-be:test:integration
# or: cd apps/organiclever-be && mvn test -Pintegration
```

### E2E Testing

The [`organiclever-be-e2e`](../organiclever-be-e2e/) project provides Playwright-based E2E tests
for this API. Run them after starting the backend:

```bash
# Start backend (any method above), then:
nx run organiclever-be-e2e:test:e2e
```

Tests cover:

- `GET /api/v1/hello` — status 200, `{"message":"world!"}`, JSON content-type
- `GET /actuator/health` — status 200, `{"status":"UP"}`

## Next Steps

- Add database integration (PostgreSQL)
- Add security (Spring Security, JWT)
- Add API documentation (Swagger/OpenAPI)
- Add integration tests
- Add CI/CD pipeline
