# demo-be-java-springboot

Demo Backend - Spring Boot REST API

## Overview

- **Framework**: Spring Boot 4.0.3
- **Language**: Java 25
- **Build Tool**: Maven
- **Port**: 8201
- **API Base**: `/api/v1`
- **Security**: Spring Security with stateless JWT authentication (JJWT 0.12.x)
- **Database**: PostgreSQL (dev/prod/integration tests) / mocked repositories with InMemoryDataStore (unit tests)
- **Schema Migration**: Liquibase SQL formatted changesets

**CORS Configuration**: Restricted to `http://localhost:3200` and `https://www.organiclever.com`
(configured in `SecurityConfig.java`).

## Prerequisites

- **Java 25** (managed via Volta or SDKMAN)
- **Maven 3.9+**
- **Docker & Docker Compose** (for containerized development)
- **PostgreSQL 17** (via Docker Compose in dev; or external DB in staging/prod)

## Environment Variables

| Variable                     | Required       | Default                                          | Description                                                 |
| ---------------------------- | -------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `APP_JWT_SECRET`             | Yes (prod)     | `change-me-in-production-at-least-32-chars-long` | JWT signing secret (min 32 chars for HS256)                 |
| `SPRING_DATASOURCE_URL`      | Yes (non-test) | —                                                | JDBC URL (e.g., `jdbc:postgresql://host:5432/organiclever`) |
| `SPRING_DATASOURCE_USERNAME` | Yes (non-test) | —                                                | Database username                                           |
| `SPRING_DATASOURCE_PASSWORD` | Yes (non-test) | —                                                | Database password                                           |

**Security note**: Set a strong `APP_JWT_SECRET` in production (min 32 random characters).
Never commit real secrets to version control. Copy `infra/dev/demo-be-java-springboot/.env.example`
to `infra/dev/demo-be-java-springboot/.env` for local development.

## Development Modes

### Option 1: npm Scripts (Easiest - Recommended)

Use the convenient npm scripts from the repository root:

```bash
# Start development environment
npm run demo-be:dev

# Restart (clean restart with fresh state)
npm run demo-be:dev:restart
```

**Benefits**:

- ✅ Single command from anywhere in the repository
- ✅ No need to navigate to infra directory
- ✅ Consistent with other project scripts
- ✅ Auto-reload enabled (1-2 second restarts)

**Auto-reload workflow**:

1. Edit source files in `apps/demo-be-java-springboot/src/`
2. Save changes (Ctrl+S)
3. Watch logs for restart message (1-2 seconds)
4. Test changes immediately

**First startup**: Takes 2-3 minutes for Maven to download dependencies
**Subsequent restarts**: 1-2 seconds via DevTools intelligent classloader

### Option 2: Docker Compose (Direct Control)

If you prefer direct Docker Compose control:

```bash
cd infra/dev/demo-be-java-springboot

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
nx dev demo-be-java-springboot

# Or from app directory
cd apps/demo-be-java-springboot
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Best for**: Rapid iteration, debugging with IDE

## Testing Auto-Reload

### Step 1: Start application

```bash
npm run demo-be:dev
```

Wait for: `Started OrganicLeverApplication in X seconds`

### Step 2: Test baseline

```bash
curl http://localhost:8201/api/v1/hello
```

Expected: `{"message":"world"}`

### Step 3: Modify code

Edit `apps/demo-be-java-springboot/src/main/java/com/organiclever/be/hello/controller/HelloController.java`:

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

### Option 1: Docker Image (Recommended)

Build a production container image using the multi-stage Dockerfile:

```bash
docker build -t demo-be-java-springboot:latest apps/demo-be-java-springboot/
```

Run the image:

```bash
docker run --rm -p 8201:8201 demo-be-java-springboot:latest
```

**Image characteristics**:

- Multi-stage build: JDK (build) + JRE (runtime)
- Non-root `app` user
- ZGC garbage collector enabled
- Spring profile: `prod` by default
- Image size: ~150-200MB
- Customizable via `JAVA_OPTS` and `SPRING_PROFILES_ACTIVE` env vars

### Option 2: JAR Directly

```bash
# Build JAR
nx build demo-be-java-springboot

# Or from app directory
cd apps/demo-be-java-springboot
mvn clean package -DskipTests
```

Output: `target/demo-be-java-springboot-1.0.0.jar`

Run:

```bash
java -XX:+UseZGC -jar apps/demo-be-java-springboot/target/demo-be-java-springboot-1.0.0.jar --spring.profiles.active=prod
```

## Nx Commands

```bash
# Build JAR
nx build demo-be-java-springboot

# Start development server (Maven spring-boot:run)
nx dev demo-be-java-springboot

# Start production server (runs built JAR)
nx run demo-be-java-springboot:start

# Run fast quality gate: unit tests + coverage check (no running service needed)
nx run demo-be-java-springboot:test:quick

# Run unit tests only (Cucumber JVM + mocked repos, no Spring context)
nx run demo-be-java-springboot:test:unit

# Run integration tests (Cucumber JVM + real PostgreSQL via docker-compose)
nx run demo-be-java-springboot:test:integration

# Lint code
nx lint demo-be-java-springboot

# Package annotation + null-safety check (JSpecify + NullAway — runs in pre-push hook)
nx typecheck demo-be-java-springboot
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names. Use `dev` (not `serve`) for the development server.

## Available Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user (returns 201 with user id, username,
  createdAt)
- `POST /api/v1/auth/login` - Login with credentials (returns 200 with access_token, refresh_token, and token_type)

**Register request body**:

```json
{ "username": "myuser", "password": "Secur3Pass!" }
```

Constraints: username 5-50 chars (alphanumeric + underscore); password 8-128 chars with uppercase,
lowercase, digit, and special character.

**Login request body**:

```json
{ "username": "myuser", "password": "Secur3Pass!" }
```

**Login response**:

```json
{ "access_token": "<jwt>", "refresh_token": "<refresh>", "token_type": "Bearer" }
```

Pass the token in subsequent requests as `Authorization: Bearer <token>`.

### Application

- `GET /api/v1/hello` - Hello world endpoint (requires Bearer token)

### Health

- `GET /health` - Health check (no auth required)

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
docker-compose logs -f demo-be-java-springboot
```

**Force restart**:

```bash
docker-compose restart demo-be-java-springboot
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
cd apps/demo-be-java-springboot
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
cd infra/dev/demo-be-java-springboot
docker-compose up

# Edit code in apps/demo-be-java-springboot/src/
# Save → Auto-reload (1-2 seconds)
# Test changes immediately
```

### 2. Running Tests

```bash
# Fast quality gate: unit tests + coverage check (pre-push hook)
nx run demo-be-java-springboot:test:quick

# Unit tests only (Cucumber JVM + mocked repos)
nx run demo-be-java-springboot:test:unit        # mvn test

# Integration tests (Cucumber JVM + real PostgreSQL via docker-compose)
nx run demo-be-java-springboot:test:integration # docker compose up --abort-on-container-exit
```

### 3. Production Build

```bash
nx build demo-be-java-springboot
cd infra/dev/demo-be-java-springboot
docker-compose -f docker-compose.yml up
```

## Docker Development Image

The Docker-based development environment uses a custom image built from `infra/dev/demo-be-java-springboot/Dockerfile.be.dev`:

**Key Features**:

- ✅ **Pre-installed Maven**: Maven 3.9.11 installed during image build, not at runtime
- ✅ **Faster startup**: Saves 10-20 seconds on each `docker compose up`
- ✅ **Consistent environment**: Same tooling for all developers
- ✅ **Isolated**: Maven installation contained to demo-be-java-springboot service only

**Building the image** (first-time only):

```bash
cd infra/dev/demo-be-java-springboot
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
apps/demo-be-java-springboot/
├── src/main/java/com/organiclever/be/
│   ├── OrganicLeverApplication.java
│   ├── auth/
│   │   ├── controller/AuthController.java        # POST /register, POST /login
│   │   ├── dto/                                  # RegisterRequest, LoginRequest, RegisterResponse, AuthResponse
│   │   ├── model/User.java                       # JPA entity with audit trail
│   │   ├── repository/UserRepository.java        # Spring Data JPA
│   │   └── service/                              # AuthService, UserDetailsServiceImpl, custom exceptions
│   ├── config/
│   │   ├── GlobalExceptionHandler.java           # @RestControllerAdvice
│   │   └── JpaAuditingConfig.java                # @EnableJpaAuditing
│   ├── hello/
│   │   └── controller/HelloController.java       # GET /api/v1/hello
│   └── security/
│       ├── JwtAuthFilter.java                    # OncePerRequestFilter
│       ├── JwtUtil.java                          # JJWT 0.12.x token generation/validation
│       └── SecurityConfig.java                   # SecurityFilterChain, CORS, BCrypt
├── src/main/resources/
│   ├── application.yml                           # Base config (Liquibase, JWT defaults)
│   ├── application-dev.yml                       # Dev config (PostgreSQL, DevTools)
│   ├── application-staging.yml                   # Staging config (env-var-driven)
│   └── application-prod.yml                      # Prod config (env-var-driven)
│   └── db/changelog/
│       ├── db.changelog-master.yaml              # Liquibase master changelog
│       └── changes/
│           └── 001-create-users-table.sql        # dbms:postgresql + dbms:h2 changesets
├── docker-compose.integration.yml                # PostgreSQL + test-runner for integration tests
├── Dockerfile.integration                        # Java 25 + Maven image for integration test runner
└── src/test/
    ├── java/com/organiclever/be/
    │   ├── integration/                          # Integration tests (real PostgreSQL)
    │   │   ├── ResponseStore.java                # Shared response state (@Component @Scope)
    │   │   ├── DatabaseCleaner.java              # Truncates all tables between scenarios
    │   │   ├── steps/                            # Step definitions calling controllers directly
    │   │   ├── registration/                     # RegistrationIT (Cucumber runner)
    │   │   ├── login/                            # LoginIT (Cucumber runner)
    │   │   └── ...                               # 13 domain-specific Cucumber runners
    │   └── unit/                                 # Unit tests (mocked repos, no DB)
    │       ├── steps/                            # Unit step definitions calling controllers directly
    │       │   ├── UnitInMemoryDataStore.java    # ConcurrentHashMap-backed mock store
    │       │   ├── UnitServicesConfig.java       # Mock repository beans
    │       │   └── Unit*Steps.java               # Per-domain step definitions
    │       ├── registration/                     # RegistrationUnitTest (Cucumber runner)
    │       └── ...                               # 13 domain-specific Cucumber runners
    └── resources/
        ├── application-test.yml                  # Excludes DB autoconfiguration; mocked repos
        ├── application-unit-test.yml             # Unit test profile config
        ├── application-integration-test.yml      # Real PostgreSQL via DATABASE_URL
        └── junit-platform.properties
```

## Testing

Three levels of testing consume the same 76 Gherkin scenarios from `specs/apps/demo/be/gherkin/`:

| Level       | Tool                           | Dependencies         | Command                                           | Cached? |
| ----------- | ------------------------------ | -------------------- | ------------------------------------------------- | ------- |
| Unit        | Cucumber JVM + mocked repos    | InMemoryDataStore    | `nx run demo-be-java-springboot:test:unit`        | Yes     |
| Integration | Cucumber JVM + real PostgreSQL | Docker Compose       | `nx run demo-be-java-springboot:test:integration` | No      |
| E2E         | Playwright + HTTP              | Running backend + DB | `nx run demo-be-e2e:test:e2e`                     | No      |

**What's mocked at each level**:

- **Unit**: Repositories are mocked via `UnitInMemoryDataStore` (ConcurrentHashMap). No database, no
  Spring Data JPA. Steps call controller methods directly as plain Java calls.
- **Integration**: Real PostgreSQL via `docker-compose.integration.yml`. Liquibase runs migrations.
  `DatabaseCleaner` truncates all tables between scenarios. Steps call controllers directly (no HTTP).
- **E2E**: Full HTTP requests via Playwright against a running backend with real PostgreSQL.

**Coverage**: Measured from `test:unit` only. `test:quick` = `test:unit` + `rhino-cli test-coverage validate` (≥90%).

### Unit Tests

Cucumber JVM with mocked repositories. No database, no Spring Data JPA autoconfiguration.
All 76 scenarios run against `UnitInMemoryDataStore`:

```bash
nx run demo-be-java-springboot:test:unit
# or: cd apps/demo-be-java-springboot && mvn test
```

### Integration Tests (PostgreSQL via Docker Compose)

Real PostgreSQL database via `docker-compose.integration.yml`. The `test-runner` service builds
the app, runs Liquibase migrations, and executes all 76 Cucumber scenarios against real SQL.
Not cached — always re-runs:

```bash
nx run demo-be-java-springboot:test:integration
# or: cd apps/demo-be-java-springboot && docker compose -f docker-compose.integration.yml down -v && docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build
```

### E2E Testing

The [`demo-be-e2e`](../demo-be-e2e/) project provides Playwright-based E2E tests
for this API. Run them after starting the backend:

```bash
# Start backend (any method above), then:
nx run demo-be-e2e:test:e2e
```

## Next Steps

- Add API documentation (Swagger/OpenAPI)
- Add CI/CD pipeline (registry push, Kubernetes deploy)
- Add task management endpoints
