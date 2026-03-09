# organiclever-be

OrganicLever Platform Backend - Spring Boot REST API

## Overview

- **Framework**: Spring Boot 4.0.3
- **Language**: Java 25
- **Build Tool**: Maven
- **Port**: 8201
- **API Base**: `/api/v1`
- **Security**: Spring Security with stateless JWT authentication (JJWT 0.12.x)
- **Database**: PostgreSQL (dev/prod) / H2 in-memory (integration tests)
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
Never commit real secrets to version control. Copy `infra/dev/organiclever/.env.example`
to `infra/dev/organiclever/.env` for local development.

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

Edit `apps/organiclever-be/src/main/java/com/organiclever/be/hello/controller/HelloController.java`:

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
docker build -t organiclever-be:latest apps/organiclever-be/
```

Run the image:

```bash
docker run --rm -p 8201:8201 organiclever-be:latest
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
nx build organiclever-be

# Or from app directory
cd apps/organiclever-be
mvn clean package -DskipTests
```

Output: `target/organiclever-be-1.0.0.jar`

Run:

```bash
java -XX:+UseZGC -jar apps/organiclever-be/target/organiclever-be-1.0.0.jar --spring.profiles.active=prod
```

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

### Authentication

- `POST /api/v1/auth/register` - Register a new user (returns 201 with user id, username,
  createdAt)
- `POST /api/v1/auth/login` - Login with credentials (returns 200 with JWT token and type)

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
{ "token": "<jwt>", "type": "Bearer" }
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
└── src/test/
    ├── java/com/organiclever/be/
    │   ├── integration/
    │   │   ├── ResponseStore.java                # Shared MvcResult state (@Component @Scope)
    │   │   ├── OrganicLeverApplicationTest.java  # Context-load test
    │   │   ├── steps/                            # Shared step definitions + context base
    │   │   ├── registration/                     # RegistrationIT + context config (testdb_registration)
    │   │   ├── login/                            # LoginIT + context config (testdb_login)
    │   │   └── jwtprotected/                     # JwtProtectedIT + context config (testdb_jwt)
    │   └── unit/
    │       └── HelloControllerTest.java
    └── resources/
        ├── application-test.yml                  # H2 datasource, ddl-auto:create
        └── junit-platform.properties
```

## Testing

Three tiers of testing provide complete coverage:

| Tier        | Tool                   | Surefire profile | Location                         | Command                                   | Requires running service? | Cached? |
| ----------- | ---------------------- | ---------------- | -------------------------------- | ----------------------------------------- | ------------------------- | ------- |
| Unit        | JUnit 5                | (default)        | `src/test/java/.../unit/`        | `nx run organiclever-be:test:unit`        | No                        | Yes     |
| Integration | Cucumber JVM + MockMvc | `-Pintegration`  | `src/test/java/.../integration/` | `nx run organiclever-be:test:integration` | No                        | Yes     |
| E2E         | playwright-bdd         | —                | `apps/organiclever-be-e2e/`      | `nx run organiclever-be-e2e:test:e2e`     | Yes (port 8201)           | No      |

The two Maven profiles are mutually exclusive: `mvn test` includes only `**/unit/**/*Test.java`;
`mvn test -Pintegration` includes only `**/*IT.java` (the three Cucumber runner classes). `test:quick`
runs both in parallel (MockMvc needs no real server, so there is no shared resource contention).

The three `*IT.java` runners execute in parallel (Surefire `parallel=classes`, `threadCount=3`)
using separate H2 in-memory databases (`testdb_registration`, `testdb_login`, `testdb_jwt`) to
prevent cross-thread data conflicts.

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
- `GET /health` — status 200, `{"status":"UP"}`

## Next Steps

- Add API documentation (Swagger/OpenAPI)
- Add CI/CD pipeline (registry push, Kubernetes deploy)
- Add task management endpoints
