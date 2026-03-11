# Technical Design: demo-be-ktkt

## BDD Integration Test: Cucumber JVM + Ktor testApplication

Integration tests parse the canonical `.feature` files in `specs/apps/demo-be/gherkin/` using
**Cucumber JVM** with Kotlin lambda step definitions. Cucumber discovers feature files at test
time via classpath resource loading.

HTTP calls use Ktor's built-in `testApplication {}` DSL — no live server is started; requests
are handled in-process by the same Ktor engine pipeline (matching `demo-be-jasb`'s MockMvc
approach and `demo-be-fsgi`'s ASP.NET TestServer approach). The database layer uses Exposed +
SQLite in-memory for full isolation and determinism — Koin injects the in-memory data source for
tests.

Step definitions use Cucumber-JVM's Kotlin lambda DSL:

```kotlin
// src/test/kotlin/com/organiclever/demoktkt/integration/steps/HealthSteps.kt
class HealthSteps : En {
    private lateinit var response: HttpResponse

    init {
        Given("the API is running") {
            // testApplication is initialized in the World/hooks
        }

        When("an operations engineer sends GET /health") {
            response = testClient.get("/health")
        }

        Then("the response status code should be {int}") { code: Int ->
            assertEquals(code, response.status.value)
        }
    }
}
```

### Feature File Path Resolution

Feature files are copied into the test classpath via a Gradle `processTestResources` task:

```kotlin
// build.gradle.kts
tasks.processTestResources {
    from("${rootProject.projectDir}/../../specs/apps/demo-be/gherkin") {
        into("specs/apps/demo-be/gherkin")
    }
}
```

Cucumber discovers feature files from the classpath path
`specs/apps/demo-be/gherkin/**/*.feature` configured in `junit-platform.properties`.

### Cucumber JUnit 5 Platform Configuration

```properties
# src/test/resources/junit-platform.properties
cucumber.publish.enabled=false
cucumber.plugin=pretty,json:build/reports/cucumber.json
cucumber.glue=com.organiclever.demoktkt.integration.steps
cucumber.features=classpath:specs/apps/demo-be/gherkin
```

---

## Application Architecture

### Project Structure

```
apps/demo-be-ktkt/
├── src/
│   ├── main/
│   │   └── kotlin/com/organiclever/demoktkt/
│   │       ├── Application.kt               # Entry point + Ktor server configuration
│   │       ├── domain/
│   │       │   ├── models.kt                # Data classes + sealed classes for errors
│   │       │   ├── UserDomain.kt            # User entity + validation functions
│   │       │   ├── ExpenseDomain.kt         # Expense entity + currency precision
│   │       │   └── AttachmentDomain.kt      # Attachment entity
│   │       ├── infrastructure/
│   │       │   ├── DatabaseFactory.kt       # Exposed database + connection factory
│   │       │   ├── tables/
│   │       │   │   ├── UsersTable.kt        # Exposed Table DSL for users
│   │       │   │   ├── TokensTable.kt       # Exposed Table DSL for token revocation
│   │       │   │   ├── ExpensesTable.kt     # Exposed Table DSL for expenses
│   │       │   │   └── AttachmentsTable.kt  # Exposed Table DSL for attachments
│   │       │   ├── repositories/
│   │       │   │   ├── UserRepository.kt    # Interface
│   │       │   │   ├── TokenRepository.kt   # Interface
│   │       │   │   ├── ExpenseRepository.kt # Interface
│   │       │   │   └── AttachmentRepository.kt # Interface
│   │       │   ├── ExposedUserRepository.kt # Exposed-backed implementation
│   │       │   ├── ExposedTokenRepository.kt
│   │       │   ├── ExposedExpenseRepository.kt
│   │       │   └── ExposedAttachmentRepository.kt
│   │       ├── auth/
│   │       │   ├── JwtService.kt            # JWT generation + JWKS key pair
│   │       │   └── PasswordService.kt       # BCrypt wrapper (jBCrypt)
│   │       ├── plugins/
│   │       │   ├── Routing.kt               # Route wiring — all 27 endpoints
│   │       │   ├── Authentication.kt        # Ktor JWT auth plugin configuration
│   │       │   ├── Serialization.kt         # kotlinx.serialization JSON config
│   │       │   ├── StatusPages.kt           # Global error → HTTP response mapping
│   │       │   └── DI.kt                    # Koin module registration
│   │       └── routes/
│   │           ├── HealthRoutes.kt          # GET /health
│   │           ├── AuthRoutes.kt            # register, login, refresh, logout
│   │           ├── UserRoutes.kt            # profile, password, deactivate
│   │           ├── AdminRoutes.kt           # admin user management
│   │           ├── ExpenseRoutes.kt         # CRUD + summary
│   │           ├── AttachmentRoutes.kt      # upload, list, delete
│   │           └── TokenRoutes.kt           # claims, JWKS
│   └── test/
│       └── kotlin/com/organiclever/demoktkt/
│           ├── TestApplication.kt           # testApplication {} factory + in-memory Koin
│           ├── unit/
│           │   ├── UserValidationTest.kt    # Password, email, username validation
│           │   ├── CurrencyValidationTest.kt # Decimal precision tests
│           │   └── PasswordServiceTest.kt   # BCrypt wrapper tests
│           └── integration/
│               └── steps/
│                   ├── CommonSteps.kt       # Shared: status code, API running
│                   ├── AuthSteps.kt         # Register, login steps
│                   ├── TokenLifecycleSteps.kt
│                   ├── UserAccountSteps.kt
│                   ├── SecuritySteps.kt
│                   ├── TokenManagementSteps.kt
│                   ├── AdminSteps.kt
│                   ├── ExpenseSteps.kt
│                   ├── CurrencySteps.kt
│                   ├── UnitHandlingSteps.kt
│                   ├── ReportingSteps.kt
│                   └── AttachmentSteps.kt
├── build.gradle.kts                         # Gradle Kotlin DSL build file
├── settings.gradle.kts                      # Project name declaration
├── gradle.properties                        # Gradle + Kotlin + Ktor versions
├── detekt.yml                               # detekt rules configuration
├── .editorconfig                            # ktfmt + Kotlin code style settings
├── project.json                             # Nx targets
└── README.md
```

---

## Key Design Decisions

### Ktor Routing with Type-Safe DSL

All routes use Ktor's type-safe routing DSL with Kotlin coroutines:

```kotlin
// plugins/Routing.kt
fun Application.configureRouting() {
    routing {
        get("/health") { call.respond(mapOf("status" to "UP")) }

        route("/.well-known") {
            get("/jwks.json") { TokenRoutes.jwks(call) }
        }

        route("/api/v1") {
            route("/auth") {
                post("/register") { AuthRoutes.register(call) }
                post("/login") { AuthRoutes.login(call) }
                authenticate("jwt-auth") {
                    post("/refresh") { AuthRoutes.refresh(call) }
                    post("/logout-all") { AuthRoutes.logoutAll(call) }
                }
                post("/logout") { AuthRoutes.logout(call) }
            }

            authenticate("jwt-auth") {
                route("/users/me") {
                    get { UserRoutes.getProfile(call) }
                    patch { UserRoutes.updateDisplayName(call) }
                    post("/password") { UserRoutes.changePassword(call) }
                    post("/deactivate") { UserRoutes.deactivate(call) }
                }

                route("/admin") {
                    // AdminGuard plugin or route-level check
                    get("/users") { AdminRoutes.listUsers(call) }
                    post("/users/{id}/disable") { AdminRoutes.disable(call) }
                    post("/users/{id}/enable") { AdminRoutes.enable(call) }
                    post("/users/{id}/unlock") { AdminRoutes.unlock(call) }
                    post("/users/{id}/force-password-reset") { AdminRoutes.forceReset(call) }
                }

                route("/expenses") {
                    post { ExpenseRoutes.create(call) }
                    get { ExpenseRoutes.list(call) }
                    get("/summary") { ExpenseRoutes.summary(call) }
                    get("/{id}") { ExpenseRoutes.getById(call) }
                    put("/{id}") { ExpenseRoutes.update(call) }
                    delete("/{id}") { ExpenseRoutes.delete(call) }
                    post("/{id}/attachments") { AttachmentRoutes.upload(call) }
                    get("/{id}/attachments") { AttachmentRoutes.list(call) }
                    delete("/{id}/attachments/{aid}") { AttachmentRoutes.delete(call) }
                }

                route("/tokens") {
                    get("/claims") { TokenRoutes.claims(call) }
                }

                route("/reports") {
                    get("/pl") { ReportRoutes.pl(call) }
                }
            }
        }
    }
}
```

### Sealed Classes for Domain Errors

Domain operations return `Result<T, DomainError>` using Kotlin's sealed classes:

```kotlin
// domain/models.kt
sealed class DomainError {
    data class ValidationError(val field: String, val message: String) : DomainError()
    data class NotFound(val entity: String) : DomainError()
    data class Forbidden(val message: String) : DomainError()
    data class Conflict(val message: String) : DomainError()
    data class Unauthorized(val message: String) : DomainError()
    data class FileTooLarge(val limitBytes: Long) : DomainError()
    data class UnsupportedMediaType(val contentType: String) : DomainError()
}

// Mapped in plugins/StatusPages.kt
fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<DomainException> { call, cause ->
            when (val error = cause.domainError) {
                is DomainError.ValidationError ->
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to error.message))
                is DomainError.NotFound ->
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Not found"))
                is DomainError.Forbidden ->
                    call.respond(HttpStatusCode.Forbidden, mapOf("message" to error.message))
                is DomainError.Conflict ->
                    call.respond(HttpStatusCode.Conflict, mapOf("message" to error.message))
                is DomainError.Unauthorized ->
                    call.respond(HttpStatusCode.Unauthorized, mapOf("message" to error.message))
                is DomainError.FileTooLarge ->
                    call.respond(HttpStatusCode.PayloadTooLarge,
                        mapOf("message" to "File size exceeds the maximum allowed limit"))
                is DomainError.UnsupportedMediaType ->
                    call.respond(HttpStatusCode.UnsupportedMediaType,
                        mapOf("message" to "Unsupported file type"))
            }
        }
    }
}
```

### Koin Dependency Injection

Koin modules swap production vs. test implementations:

```kotlin
// Production module (plugins/DI.kt)
val productionModule = module {
    single<UserRepository> { ExposedUserRepository() }
    single<TokenRepository> { ExposedTokenRepository() }
    single<ExpenseRepository> { ExposedExpenseRepository() }
    single<AttachmentRepository> { ExposedAttachmentRepository() }
    single { JwtService(getProperty("JWT_SECRET")) }
    single { PasswordService() }
}

// Test module (test/TestApplication.kt)
val testModule = module {
    single<UserRepository> { InMemoryUserRepository() }
    single<TokenRepository> { InMemoryTokenRepository() }
    single<ExpenseRepository> { InMemoryExpenseRepository() }
    single<AttachmentRepository> { InMemoryAttachmentRepository() }
    single { JwtService("test-secret-at-least-32-chars-long") }
    single { PasswordService() }
}

// Test setup
fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
    application {
        startKoin { modules(testModule) }
        configurePlugins()
    }
    block()
}
```

### Exposed Database DSL

Production uses PostgreSQL via the Exposed DAO/DSL. Integration tests use SQLite in-memory via
`InMemory*Repository` implementations backed by `ConcurrentHashMap`:

```kotlin
// infrastructure/DatabaseFactory.kt
object DatabaseFactory {
    fun init(jdbcUrl: String, driver: String) {
        val db = Database.connect(
            url = jdbcUrl,
            driver = driver
        )
        transaction(db) {
            SchemaUtils.create(UsersTable, TokensTable, ExpensesTable, AttachmentsTable)
        }
    }
}

// infrastructure/tables/UsersTable.kt
object UsersTable : Table("users") {
    val id = uuid("id").autoGenerate()
    val username = varchar("username", 50).uniqueIndex()
    val email = varchar("email", 255).uniqueIndex()
    val displayName = varchar("display_name", 100)
    val passwordHash = varchar("password_hash", 255)
    val role = enumerationByName("role", 10, Role::class)
    val status = enumerationByName("status", 10, UserStatus::class)
    val failedLoginCount = integer("failed_login_count").default(0)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    override val primaryKey = PrimaryKey(id)
}
```

### JWT Strategy

RSA-256 signing using `com.auth0:java-jwt` with Ktor's built-in JWT plugin:

```kotlin
// auth/JwtService.kt
class JwtService(private val secret: String) {
    private val algorithm = Algorithm.HMAC256(secret)

    fun generateAccessToken(userId: UUID, username: String, role: Role): String =
        JWT.create()
            .withIssuer("demo-be-ktkt")
            .withSubject(userId.toString())
            .withClaim("username", username)
            .withClaim("role", role.name)
            .withClaim("jti", UUID.randomUUID().toString())
            .withIssuedAt(Date())
            .withExpiresAt(Date(System.currentTimeMillis() + 15 * 60 * 1000)) // 15 min
            .sign(algorithm)

    fun generateRefreshToken(userId: UUID): String =
        JWT.create()
            .withIssuer("demo-be-ktkt")
            .withSubject(userId.toString())
            .withClaim("jti", UUID.randomUUID().toString())
            .withIssuedAt(Date())
            .withExpiresAt(Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000)) // 7 days
            .sign(algorithm)

    fun verifier(): JWTVerifier =
        JWT.require(algorithm).withIssuer("demo-be-ktkt").build()
}
```

### Currency Precision

Amounts stored as `BigDecimal` with currency-specific precision enforced at the domain level:

```kotlin
// domain/ExpenseDomain.kt
fun validateAmount(currency: String, amount: BigDecimal): Result<BigDecimal, DomainError> {
    if (amount < BigDecimal.ZERO) {
        return Err(DomainError.ValidationError("amount", "Amount must not be negative"))
    }
    return when (currency.uppercase()) {
        "USD" -> if (amount.scale() > 2) {
            Err(DomainError.ValidationError("amount", "USD requires at most 2 decimal places"))
        } else Ok(amount.setScale(2))
        "IDR" -> if (amount.stripTrailingZeros().scale() > 0) {
            Err(DomainError.ValidationError("amount", "IDR requires whole number amounts"))
        } else Ok(amount.setScale(0))
        else -> Err(DomainError.ValidationError("currency", "Unsupported currency: $currency"))
    }
}
```

### Coroutines and Suspending Functions

All Ktor route handlers are suspending functions. Repository interfaces are defined with
`suspend` modifiers — the Exposed implementations use `newSuspendedTransaction {}`:

```kotlin
interface UserRepository {
    suspend fun findByUsername(username: String): User?
    suspend fun findById(id: UUID): User?
    suspend fun create(user: CreateUserRequest): User
    suspend fun update(id: UUID, patch: UpdateUserPatch): User?
    suspend fun updateStatus(id: UUID, status: UserStatus): Unit
    suspend fun incrementFailedLogins(id: UUID): Int
    suspend fun resetFailedLogins(id: UUID): Unit
    suspend fun findAll(page: Int, pageSize: Int, emailFilter: String?): Page<User>
}

// Exposed implementation
class ExposedUserRepository : UserRepository {
    override suspend fun findByUsername(username: String): User? =
        newSuspendedTransaction(Dispatchers.IO) {
            UsersTable.select { UsersTable.username eq username }
                .map { it.toUser() }
                .singleOrNull()
        }
}
```

### Null Safety

Kotlin's null safety eliminates null pointer exceptions. All domain models use non-nullable
types where invariants hold. Optional fields use `String?`/`BigDecimal?` with explicit null
handling:

```kotlin
data class Expense(
    val id: UUID,
    val userId: UUID,
    val type: EntryType,        // EXPENSE | INCOME — never null
    val amount: BigDecimal,     // never null, validated
    val currency: String,       // never null, validated
    val category: String,       // never null
    val description: String,    // never null (empty string for "no description")
    val date: LocalDate,        // never null
    val quantity: BigDecimal?,  // null when no unit provided
    val unit: String?,          // null when no unit provided
    val createdAt: Instant,
    val updatedAt: Instant
)
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-ktkt",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-ktkt/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./gradlew build -x test",
        "cwd": "apps/demo-be-ktkt"
      },
      "outputs": ["{projectRoot}/build"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./gradlew run",
        "cwd": "apps/demo-be-ktkt"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "java -jar build/libs/demo-be-ktkt-all.jar",
        "cwd": "apps/demo-be-ktkt"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "./gradlew test koverXmlReport",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-be-ktkt/build/reports/kover/report.xml 90)",
          "./gradlew detekt ktfmtCheck"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-ktkt"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./gradlew test --tests '*.unit.*'",
        "cwd": "apps/demo-be-ktkt"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./gradlew test --tests '*.integration.*'",
        "cwd": "apps/demo-be-ktkt"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/main/**/*.kt",
        "{projectRoot}/src/test/**/*.kt",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./gradlew detekt",
        "cwd": "apps/demo-be-ktkt"
      }
    }
  },
  "tags": ["type:app", "platform:ktor", "lang:kotlin", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `typecheck`**: No `typecheck` target is defined. The Kotlin compiler enforces null
> safety and type correctness at compile time. `build` already invokes the full compiler — this
> matches the convention for `demo-be-jasb` (Java) and `demo-be-fsgi` (F#).
>
> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because Kover
> XML report must exist before `rhino-cli` validates coverage, and `detekt`/`ktfmtCheck` run
> after tests to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use Ktor `testApplication {}` with
> in-memory Koin module — no external services. Fully deterministic and safe to cache.

---

## Infrastructure

### Port Assignment

| Service      | Port                                               |
| ------------ | -------------------------------------------------- |
| demo-be-db   | 5432                                               |
| demo-be-jasb | 8201                                               |
| demo-be-exph | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsgi | 8201 (same port — mutually exclusive alternatives) |
| demo-be-ktkt | 8201 (same port — mutually exclusive alternatives) |

### Docker Compose (`infra/dev/demo-be-ktkt/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_ktkt
      POSTGRES_USER: demo_be_ktkt
      POSTGRES_PASSWORD: demo_be_ktkt
    ports:
      - "5432:5432"
    volumes:
      - demo-be-ktkt-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_ktkt"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-ktkt-network

  demo-be-ktkt:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-ktkt
    ports:
      - "8201:8201"
    environment:
      - PORT=8201
      - DATABASE_URL=jdbc:postgresql://demo-be-db:5432/demo_be_ktkt
      - DATABASE_USER=demo_be_ktkt
      - DATABASE_PASSWORD=demo_be_ktkt
      - JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-ktkt:/workspace:rw
    depends_on:
      demo-be-db:
        condition: service_healthy
    command: sh -c "./gradlew run"
    networks:
      - demo-be-ktkt-network

volumes:
  demo-be-ktkt-db-data:

networks:
  demo-be-ktkt-network:
```

### Dockerfile.be.dev

```dockerfile
FROM eclipse-temurin:21-jdk-alpine

RUN apk add --no-cache bash curl

WORKDIR /workspace

COPY . .

RUN ./gradlew dependencies --no-daemon || true

CMD ["./gradlew", "run"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-ktkt.yml`

Mirrors `e2e-demo-be-jasb.yml` and `e2e-demo-be-fsgi.yml` with:

- Name: `E2E - Demo BE (KTKT)`
- Schedule: same crons as jasb/exph/fsgi
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-ktkt` → docker down (always)

### Updated Workflow: `main-ci.yml`

JDK is already set up in `main-ci.yml` for `demo-be-jasb`. Add after the Kover report step:

```yaml
- name: Upload coverage — demo-be-ktkt
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-ktkt/build/reports/kover/report.xml
    flags: demo-be-ktkt
    fail_ci_if_error: false
```

---

## Dependencies Summary

### Gradle Dependencies (`build.gradle.kts`)

| Dependency                                 | Purpose                                      |
| ------------------------------------------ | -------------------------------------------- |
| `io.ktor:ktor-server-core`                 | Ktor core framework                          |
| `io.ktor:ktor-server-netty`                | Netty engine for production                  |
| `io.ktor:ktor-server-content-negotiation`  | JSON content negotiation plugin              |
| `io.ktor:ktor-serialization-kotlinx-json`  | kotlinx.serialization JSON support           |
| `io.ktor:ktor-server-auth`                 | Authentication plugin (JWT principal)        |
| `io.ktor:ktor-server-auth-jwt`             | JWT authentication plugin                    |
| `io.ktor:ktor-server-status-pages`         | Global exception → HTTP response mapping     |
| `io.ktor:ktor-server-call-logging`         | Request/response logging                     |
| `io.ktor:ktor-server-cors`                 | CORS plugin                                  |
| `org.jetbrains.exposed:exposed-core`       | Exposed DSL core                             |
| `org.jetbrains.exposed:exposed-dao`        | Exposed DAO layer                            |
| `org.jetbrains.exposed:exposed-jdbc`       | Exposed JDBC support                         |
| `org.jetbrains.exposed:exposed-java-time`  | Exposed date/time support                    |
| `org.postgresql:postgresql`                | PostgreSQL JDBC driver                       |
| `com.auth0:java-jwt`                       | JWT creation and verification                |
| `org.mindrot:jbcrypt`                      | BCrypt password hashing                      |
| `io.insert-koin:koin-ktor`                 | Koin DI integration for Ktor                 |
| `io.insert-koin:koin-logger-slf4j`         | Koin SLF4J logging                           |
| `ch.qos.logback:logback-classic`           | Logback logging implementation               |

### Test Dependencies

| Dependency                                 | Purpose                                      |
| ------------------------------------------ | -------------------------------------------- |
| `io.ktor:ktor-server-test-host`            | Ktor `testApplication {}` in-process testing |
| `io.cucumber:cucumber-java`                | Cucumber JVM core                            |
| `io.cucumber:cucumber-junit-platform-engine`| Cucumber JUnit 5 platform engine            |
| `org.junit.platform:junit-platform-suite`  | JUnit 5 platform suite runner                |
| `org.junit.jupiter:junit-jupiter`          | JUnit Jupiter API + engine                   |
| `org.xerial:sqlite-jdbc`                   | SQLite JDBC driver (in-memory test DB)       |
| `io.insert-koin:koin-test`                 | Koin test utilities                          |

### Gradle Plugins

| Plugin                                 | Purpose                                          |
| -------------------------------------- | ------------------------------------------------ |
| `org.jetbrains.kotlin.jvm`             | Kotlin JVM compilation                           |
| `io.ktor.plugin`                       | Ktor Gradle plugin (fatJar, run tasks)           |
| `org.jetbrains.kotlinx.kover`          | Code coverage (Kover)                            |
| `io.gitlab.arturbosch.detekt`          | Static analysis (detekt)                         |
| `com.ncorti.ktfmt.gradle`              | Kotlin formatting (ktfmt)                        |
| `org.jetbrains.kotlin.plugin.serialization` | kotlinx.serialization support             |
