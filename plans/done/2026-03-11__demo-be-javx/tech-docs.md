# Technical Design: demo-be-javx

## Vert.x vs Spring Boot: The Fundamental Difference

`demo-be-javx` is a Java project, like `demo-be-jasb`. However, it uses Vert.x instead of
Spring Boot. The two Java frameworks have fundamentally different execution models that affect
how every layer of the application is structured.

### Execution Model Comparison

| Concern              | demo-be-jasb (Spring Boot)                   | demo-be-javx (Vert.x)                              |
| -------------------- | -------------------------------------------- | -------------------------------------------------- |
| Threading model      | Thread-per-request (Servlet/Tomcat)          | Event loop (Netty-based, single or few threads)    |
| Handler style        | Blocking `@Controller` methods               | Non-blocking `Handler<RoutingContext>`              |
| Database I/O         | JDBC (blocks calling thread)                 | Vert.x SQL Client (async, `Future<T>` composition) |
| Dependency injection | Spring DI (`@Autowired`, `@Component`)       | Manual wiring in `Verticle.start()` or factories   |
| Configuration        | `application.yml` + Spring Environment       | `config()` in Verticle or `ConfigRetriever`        |
| Routing              | `@GetMapping`, `@PostMapping` annotations    | `Router.get(path).handler(fn)` programmatic API    |
| Authentication       | Spring Security filter chain                 | Manual `Handler` added before route handlers       |
| Error handling       | `@ExceptionHandler`, `ResponseEntity`        | `routingContext.fail(statusCode)` + failure handler|
| Body parsing         | Auto-parsed by `@RequestBody`                | Requires explicit `BodyHandler.create()` on router |
| Async composition    | Blocking (or Project Reactor for WebFlux)    | `Future<T>` chained with `.compose()`, `.map()`    |

### Why This Matters for Implementation

Because Vert.x handlers must never block the event loop, all I/O operations (database queries,
file reads) return `Future<T>` instead of direct values. Handler code looks like:

```java
// Spring Boot style (blocking — FORBIDDEN in Vert.x handlers)
User user = userRepository.findById(id);    // blocks
return ResponseEntity.ok(user);

// Vert.x style (non-blocking — correct approach)
userRepository.findById(id)
    .onSuccess(user -> ctx.json(user))
    .onFailure(err -> ctx.fail(404));
```

The integration test strategy also differs: instead of Spring's `MockMvc` (which uses an
embedded servlet container), Vert.x tests deploy the verticle in a `Vertx` test instance and
call it via `WebClient` over a real (but in-process) HTTP server on a random port.

---

## Application Architecture

### Project Structure

```
apps/demo-be-javx/
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/organiclever/demojavx/
│   │           ├── MainVerticle.java               # Entry point — deploys all verticles
│   │           ├── domain/
│   │           │   ├── model/
│   │           │   │   ├── User.java               # User record (JSpecify @NullMarked)
│   │           │   │   ├── Expense.java            # Expense record
│   │           │   │   ├── Attachment.java         # Attachment record
│   │           │   │   ├── TokenRevocation.java    # Revoked token record
│   │           │   │   └── package-info.java       # @NullMarked annotation
│   │           │   └── validation/
│   │           │       ├── UserValidator.java      # Password, email, username rules
│   │           │       ├── ExpenseValidator.java   # Currency, amount, unit rules
│   │           │       └── package-info.java       # @NullMarked annotation
│   │           ├── repository/
│   │           │   ├── UserRepository.java         # Interface: Future<T> returns
│   │           │   ├── ExpenseRepository.java      # Interface: Future<T> returns
│   │           │   ├── AttachmentRepository.java   # Interface: Future<T> returns
│   │           │   ├── TokenRevocationRepository.java
│   │           │   ├── pg/
│   │           │   │   ├── PgUserRepository.java   # Vert.x SQL Client impl (PostgreSQL)
│   │           │   │   ├── PgExpenseRepository.java
│   │           │   │   ├── PgAttachmentRepository.java
│   │           │   │   └── PgTokenRevocationRepository.java
│   │           │   ├── memory/
│   │           │   │   ├── InMemoryUserRepository.java   # ConcurrentHashMap impl (tests)
│   │           │   │   ├── InMemoryExpenseRepository.java
│   │           │   │   ├── InMemoryAttachmentRepository.java
│   │           │   │   └── InMemoryTokenRevocationRepository.java
│   │           │   └── package-info.java           # @NullMarked annotation
│   │           ├── auth/
│   │           │   ├── JwtService.java             # JWT generation + validation
│   │           │   ├── JwtAuthHandler.java         # Vert.x Handler: validates Bearer token
│   │           │   ├── AdminAuthHandler.java       # Vert.x Handler: enforces admin role
│   │           │   ├── PasswordService.java        # BCrypt hashing (jBCrypt)
│   │           │   └── package-info.java           # @NullMarked annotation
│   │           ├── handler/
│   │           │   ├── HealthHandler.java           # GET /health
│   │           │   ├── AuthHandler.java             # register, login, refresh, logout
│   │           │   ├── UserHandler.java             # profile, display name, password, deactivate
│   │           │   ├── AdminHandler.java            # user management
│   │           │   ├── ExpenseHandler.java          # CRUD + summary
│   │           │   ├── AttachmentHandler.java       # upload, list, delete
│   │           │   ├── TokenHandler.java            # claims, JWKS
│   │           │   └── package-info.java            # @NullMarked annotation
│   │           └── router/
│   │               ├── AppRouter.java               # Assembles Router with all routes
│   │               └── package-info.java            # @NullMarked annotation
│   └── test/
│       └── java/
│           └── com/organiclever/demojavx/
│               ├── support/
│   │           │   ├── AppFactory.java             # Creates Vertx + deploys verticle with in-memory repos
│   │           │   ├── ScenarioState.java          # Shared state across Cucumber steps
│   │           │   └── VertxTestHelper.java        # Async → sync bridge for Cucumber steps
│               ├── unit/
│               │   ├── UserValidatorTest.java       # Password, email, username validation
│               │   ├── ExpenseValidatorTest.java    # Currency, amount, unit validation
│               │   ├── JwtServiceTest.java          # Token generation and validation
│               │   └── PasswordServiceTest.java     # BCrypt hashing
│               └── integration/
│                   └── steps/
│                       ├── CommonSteps.java         # @BeforeAll, @AfterAll, shared setup
│                       ├── HealthSteps.java
│                       ├── AuthSteps.java
│                       ├── TokenLifecycleSteps.java
│                       ├── UserAccountSteps.java
│                       ├── SecuritySteps.java
│                       ├── TokenManagementSteps.java
│                       ├── AdminSteps.java
│                       ├── ExpenseSteps.java
│                       ├── CurrencySteps.java
│                       ├── UnitHandlingSteps.java
│                       ├── ReportingSteps.java
│                       └── AttachmentSteps.java
├── checkstyle.xml                                   # Checkstyle rules (mirrors demo-be-jasb)
├── project.json                                     # Nx targets
├── pom.xml                                          # Maven build + profiles
└── README.md
```

---

## Vert.x Core Concepts

### Verticles

A Verticle is the deployment unit in Vert.x (analogous to a Spring Boot application class).
`MainVerticle` wires all dependencies and registers routes:

```java
@NullMarked
public class MainVerticle extends AbstractVerticle {

    @Override
    public void start(Promise<Void> startPromise) {
        // Wire dependencies
        var jwtService = new JwtService(config().getString("jwt.secret"));
        var userRepo = new PgUserRepository(vertx, config());
        var expenseRepo = new PgExpenseRepository(vertx, config());
        var passwordService = new PasswordService();

        // Build router
        var router = AppRouter.create(vertx, jwtService, userRepo, expenseRepo, passwordService);

        // Start HTTP server
        vertx.createHttpServer()
            .requestHandler(router)
            .listen(8201)
            .<Void>mapEmpty()
            .onComplete(startPromise);
    }
}
```

### Vert.x Router and Route Handlers

Routes are registered programmatically — no annotations. `BodyHandler` must be added before
any handler that reads the request body:

```java
@NullMarked
public class AppRouter {
    public static Router create(Vertx vertx, JwtService jwtService,
                                 UserRepository userRepo, ...) {
        var router = Router.router(vertx);

        // REQUIRED: parse request body for POST/PUT/PATCH routes
        router.route().handler(BodyHandler.create());

        // Public routes
        router.get("/health").handler(new HealthHandler());
        router.post("/api/v1/auth/register").handler(new AuthHandler(userRepo, jwtService));
        router.post("/api/v1/auth/login").handler(new AuthHandler(userRepo, jwtService));

        // JWT-protected routes — JwtAuthHandler runs first
        router.get("/api/v1/users/me")
            .handler(new JwtAuthHandler(jwtService, tokenRevocationRepo))
            .handler(new UserHandler(userRepo));

        // Admin-protected routes — JwtAuthHandler + AdminAuthHandler
        router.get("/api/v1/admin/users")
            .handler(new JwtAuthHandler(jwtService, tokenRevocationRepo))
            .handler(new AdminAuthHandler())
            .handler(new AdminHandler(userRepo));

        return router;
    }
}
```

### Future<T> Composition (Non-Blocking I/O)

All repository methods return `Future<T>`. Handler code composes these futures:

```java
// AuthHandler — login endpoint
public void handle(RoutingContext ctx) {
    var body = ctx.body().asJsonObject();
    var username = body.getString("username");
    var password = body.getString("password");

    userRepo.findByUsername(username)
        .compose(user -> {
            if (!passwordService.verify(password, user.passwordHash())) {
                return Future.failedFuture(new UnauthorizedException("Invalid credentials"));
            }
            return Future.succeededFuture(user);
        })
        .compose(user -> {
            var tokens = jwtService.generateTokenPair(user);
            return tokenRevocationRepo.saveRefreshToken(tokens.refreshTokenId(), user.id())
                .map(ignored -> tokens);
        })
        .onSuccess(tokens -> ctx.response()
            .setStatusCode(200)
            .putHeader("Content-Type", "application/json")
            .end(Json.encode(tokens)))
        .onFailure(ctx::fail);
}
```

### Failure Handler

A global failure handler translates exceptions to HTTP responses:

```java
router.route().failureHandler(ctx -> {
    var failure = ctx.failure();
    int statusCode = ctx.statusCode();

    if (failure instanceof ValidationException ve) {
        ctx.response().setStatusCode(400).end(Json.encode(
            new JsonObject().put("message", ve.getMessage())
        ));
    } else if (failure instanceof UnauthorizedException) {
        ctx.response().setStatusCode(401).end(Json.encode(
            new JsonObject().put("message", "Unauthorized")
        ));
    } else if (statusCode > 0) {
        ctx.response().setStatusCode(statusCode).end();
    } else {
        ctx.response().setStatusCode(500).end();
    }
});
```

---

## BDD Integration Tests: Cucumber JVM + Vert.x Test

Integration tests parse the canonical `.feature` files from `specs/apps/demo-be/gherkin/`
using **Cucumber JVM 7+** with Java step definitions.

HTTP calls use Vert.x's own `WebClient` against a live Vert.x HTTP server deployed in the
test JVM. There is no MockMvc (that is a Spring-specific tool). Instead, the test verticle
is deployed with **in-memory repository implementations** wired in place of the PostgreSQL
implementations — no database required, fully in-process.

### Test Verticle Deployment

```java
@NullMarked
public class AppFactory {
    private static Vertx vertx;
    private static WebClient client;
    private static int port;

    public static void deploy() {
        vertx = Vertx.vertx();
        port = findFreePort();

        // Wire in-memory repositories
        var userRepo = new InMemoryUserRepository();
        var expenseRepo = new InMemoryExpenseRepository();
        var attachmentRepo = new InMemoryAttachmentRepository();
        var tokenRevocationRepo = new InMemoryTokenRevocationRepository();
        var jwtService = new JwtService("test-secret-32-chars-or-more-here");
        var passwordService = new PasswordService();

        var router = AppRouter.create(vertx, jwtService, userRepo, expenseRepo,
                                      attachmentRepo, tokenRevocationRepo, passwordService);

        // Deploy on random port — avoids port conflicts
        var serverFuture = vertx.createHttpServer()
            .requestHandler(router)
            .listen(port)
            .toCompletionStage()
            .toCompletableFuture()
            .get(5, TimeUnit.SECONDS);

        client = WebClient.create(vertx,
            new WebClientOptions().setDefaultHost("localhost").setDefaultPort(port));
    }

    public static WebClient getClient() { return client; }
    public static void close() { vertx.close(); }
}
```

### Cucumber Step Definitions

Step definitions use `ScenarioState` to share state between steps (analogous to
`demo-be-jasb`'s `ScenarioContext`):

```java
@NullMarked
public class AuthSteps {
    private final ScenarioState state;

    public AuthSteps(ScenarioState state) {
        this.state = state;
    }

    @When("a user registers with username {string} and email {string}")
    public void userRegisters(String username, String email) throws Exception {
        var body = new JsonObject()
            .put("username", username)
            .put("email", email)
            .put("password", state.getPassword());

        var response = AppFactory.getClient()
            .post("/api/v1/auth/register")
            .sendJsonObject(body)
            .toCompletionStage()
            .toCompletableFuture()
            .get(5, TimeUnit.SECONDS);

        state.setLastResponse(response);
    }

    @Then("the response status code should be {int}")
    public void responseStatusIs(int expected) {
        assertEquals(expected, state.getLastResponse().statusCode());
    }
}
```

### Async → Sync Bridge

Cucumber step methods are synchronous. The pattern `future.toCompletionStage().toCompletableFuture().get(timeout, unit)`
converts `Future<T>` to a blocking call safely inside test threads (not the event loop):

```java
// In step definitions — safe because steps run on test thread, not event loop
var response = AppFactory.getClient()
    .get("/api/v1/users/me")
    .bearerTokenAuthentication(state.getAccessToken())
    .send()
    .toCompletionStage()
    .toCompletableFuture()
    .get(5, TimeUnit.SECONDS);
```

### Feature File Path Resolution

The Maven Surefire/Failsafe plugin discovers `.feature` files via Cucumber's
`@CucumberOptions` or `junit-platform.properties`. Since feature files live outside the test
source root, Maven copies them during the `generate-test-resources` phase:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-resources-plugin</artifactId>
  <executions>
    <execution>
      <id>copy-gherkin-specs</id>
      <phase>generate-test-resources</phase>
      <goals><goal>copy-resources</goal></goals>
      <configuration>
        <outputDirectory>${project.build.testOutputDirectory}/specs</outputDirectory>
        <resources>
          <resource>
            <directory>../../specs/apps/demo-be/gherkin</directory>
            <filtering>false</filtering>
          </resource>
        </resources>
      </configuration>
    </execution>
  </executions>
</plugin>
```

Then in `junit-platform.properties`:

```properties
cucumber.features=classpath:specs
cucumber.glue=com.organiclever.demojavx.integration.steps
cucumber.plugin=pretty,json:target/cucumber-reports/cucumber.json
```

---

## In-Memory Repository Implementations

Integration tests use `ConcurrentHashMap`-backed implementations — the same pattern used by
`demo-be-jasb`'s `InMemoryDataStore`:

```java
@NullMarked
public class InMemoryUserRepository implements UserRepository {
    private final ConcurrentHashMap<String, User> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    @Override
    public Future<User> save(User user) {
        var id = String.valueOf(idSequence.getAndIncrement());
        var saved = user.withId(id);
        store.put(id, saved);
        return Future.succeededFuture(saved);
    }

    @Override
    public Future<Optional<User>> findByUsername(String username) {
        return Future.succeededFuture(
            store.values().stream()
                .filter(u -> u.username().equals(username))
                .findFirst()
        );
    }

    // reset() called in @Before hook between scenarios
    public void reset() { store.clear(); idSequence.set(1); }
}
```

Each scenario gets a clean state via a `@Before` Cucumber hook that calls `reset()` on all
in-memory repositories.

---

## JWT Authentication Handler

The `JwtAuthHandler` is a Vert.x `Handler<RoutingContext>` that validates Bearer tokens and
stores the authenticated user in the routing context for downstream handlers:

```java
@NullMarked
public class JwtAuthHandler implements Handler<RoutingContext> {
    private final JwtService jwtService;
    private final TokenRevocationRepository revocationRepo;

    @Override
    public void handle(RoutingContext ctx) {
        var authHeader = ctx.request().getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ctx.fail(401);
            return;
        }
        var token = authHeader.substring(7);

        try {
            var claims = jwtService.validate(token);
            // Check revocation list
            revocationRepo.isRevoked(claims.jti())
                .onSuccess(revoked -> {
                    if (revoked) { ctx.fail(401); return; }
                    ctx.put("userId", claims.subject());
                    ctx.put("role", claims.role());
                    ctx.next();  // pass to next handler in chain
                })
                .onFailure(ctx::fail);
        } catch (JwtException e) {
            ctx.fail(401);
        }
    }
}
```

---

## Key Design Decisions

### No Spring DI — Manual Wiring

Vert.x does not use Spring's dependency injection container. Dependencies are wired manually
in `MainVerticle.start()` and passed to handlers via constructor injection. This is simpler
than Spring's annotation-based DI but requires explicit wiring at the composition root.

### BodyHandler is Mandatory

Unlike Spring Boot, which automatically parses request bodies, Vert.x requires an explicit
`BodyHandler.create()` to be installed on the router before any handler that reads the body.
Forgetting this results in `null` body, which is a common Vert.x pitfall.

### Route Ordering Matters

Vert.x Router matches routes in registration order. The `GET /api/v1/expenses/summary` route
must be registered before `GET /api/v1/expenses/:id` to avoid the literal "summary" being
matched as an expense ID. Same for `/api/v1/reports/pl`.

### Future Composition Over Nested Callbacks

The canonical Vert.x pattern for sequential async operations is `.compose()` chaining, not
nested callbacks. This keeps code flat and readable:

```java
// Good: composed future chain
userRepo.findByUsername(username)
    .compose(this::validatePassword)
    .compose(user -> tokenRepo.saveRefreshToken(user.id()))
    .onSuccess(token -> ctx.json(token))
    .onFailure(ctx::fail);

// Bad: nested callbacks (callback hell)
userRepo.findByUsername(username).onSuccess(user -> {
    validatePassword(user).onSuccess(validated -> {
        tokenRepo.saveRefreshToken(validated.id()).onSuccess(token -> {
            ctx.json(token);
        });
    });
});
```

### JSpecify @NullMarked on All Packages

Every `package-info.java` declares `@NullMarked`. NullAway (Error Prone) enforces this at
compile time via the `nullcheck` Maven profile. This mirrors `demo-be-jasb` exactly.

### Currency Precision

Amounts are stored as `java.math.BigDecimal` with currency-specific precision:

```java
public static BigDecimal validateAmount(String currency, BigDecimal amount) {
    return switch (currency.toUpperCase()) {
        case "USD" -> {
            if (amount.scale() > 2)
                throw new ValidationException("USD requires at most 2 decimal places");
            yield amount.setScale(2, RoundingMode.UNNECESSARY);
        }
        case "IDR" -> {
            if (amount.scale() > 0)
                throw new ValidationException("IDR requires 0 decimal places");
            yield amount.setScale(0, RoundingMode.UNNECESSARY);
        }
        default -> throw new ValidationException("Unsupported currency: " + currency);
    };
}
```

### Password Hashing

jBCrypt is used identically to `demo-be-jasb`:

```java
public String hash(String plaintext) {
    return BCrypt.hashpw(plaintext, BCrypt.gensalt(12));
}

public boolean verify(String plaintext, String hashed) {
    return BCrypt.checkpw(plaintext, hashed);
}
```

---

## Maven Profiles

| Profile       | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| (default)     | Unit tests only (`mvn test`)                                |
| `integration` | Cucumber BDD integration tests (`mvn test -Pintegration`)   |
| `nullcheck`   | NullAway + Error Prone compile-time null safety             |

The `integration` profile configures Maven Failsafe to run Cucumber:

```xml
<profile>
  <id>integration</id>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-failsafe-plugin</artifactId>
        <executions>
          <execution>
            <goals>
              <goal>integration-test</goal>
              <goal>verify</goal>
            </goals>
          </execution>
        </executions>
        <configuration>
          <includes>
            <include>**/*IT.java</include>
            <include>**/*CucumberIT.java</include>
          </includes>
        </configuration>
      </plugin>
    </plugins>
  </build>
</profile>
```

JaCoCo is configured in the `integration` profile to output XML for `rhino-cli`:

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>post-integration-test</phase>
      <goals><goal>report</goal></goals>
      <configuration>
        <outputDirectory>${project.build.directory}/site/jacoco-integration</outputDirectory>
        <formats><format>XML</format></formats>
      </configuration>
    </execution>
  </executions>
</plugin>
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-javx",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-javx/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn clean package -DskipTests",
        "cwd": "apps/demo-be-javx"
      },
      "outputs": ["{projectRoot}/target"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn compile exec:java -Dexec.mainClass=com.organiclever.demojavx.Main",
        "cwd": "apps/demo-be-javx"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "sh -c 'java -jar target/demo-be-javx-*.jar'",
        "cwd": "apps/demo-be-javx"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "mvn test",
          "mvn test -Pintegration",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-be-javx/target/site/jacoco-integration/jacoco.xml 90)",
          "mvn checkstyle:check"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-javx"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test",
        "cwd": "apps/demo-be-javx"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test -Pintegration",
        "cwd": "apps/demo-be-javx"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.java",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn checkstyle:check",
        "cwd": "apps/demo-be-javx"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx run rhino-cli:build --skip-nx-cache && ./apps/rhino-cli/dist/rhino-cli java validate-annotations apps/demo-be-javx/src/main/java",
          "cd apps/demo-be-javx && mvn compile -Pnullcheck"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:app", "platform:vertx", "lang:java", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection (JaCoCo) must finish before `rhino-cli` validates the XML output.
> Checkstyle runs last to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use Vert.x with in-memory
> repositories — no external services. Fully deterministic and safe to cache.

---

## Infrastructure

### Port Assignment

| Service      | Port                                                |
| ------------ | --------------------------------------------------- |
| demo-be-db   | 5432                                                |
| demo-be-jasb | 8201                                                |
| demo-be-exph | 8201 (same port — mutually exclusive alternatives)  |
| demo-be-fsgi | 8201 (same port — mutually exclusive alternatives)  |
| demo-be-javx | 8201 (same port — mutually exclusive alternatives)  |

### Docker Compose (`infra/dev/demo-be-javx/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_javx
      POSTGRES_USER: demo_be_javx
      POSTGRES_PASSWORD: demo_be_javx
    ports:
      - "5432:5432"
    volumes:
      - demo-be-javx-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_javx"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-javx-network

  demo-be-javx:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-javx
    ports:
      - "8201:8201"
    environment:
      - DB_HOST=demo-be-db
      - DB_PORT=5432
      - DB_NAME=demo_be_javx
      - DB_USER=demo_be_javx
      - DB_PASSWORD=demo_be_javx
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
      - APP_PORT=8201
    volumes:
      - ../../../apps/demo-be-javx:/workspace:rw
      - ../../../specs/apps/demo-be:/specs/apps/demo-be:ro
    depends_on:
      demo-be-db:
        condition: service_healthy
    networks:
      - demo-be-javx-network

volumes:
  demo-be-javx-db-data:

networks:
  demo-be-javx-network:
```

### Dockerfile.be.dev

```dockerfile
FROM eclipse-temurin:25-jdk-alpine

RUN apk add --no-cache maven

WORKDIR /workspace

CMD ["mvn", "compile", "exec:java", "-Dexec.mainClass=com.organiclever.demojavx.Main"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-javx.yml`

Mirrors `e2e-demo-be-jasb.yml` with:

- Name: `E2E - Demo BE (JAVX)`
- Schedule: same crons as jasb/exph/fsgi
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-javx` → docker down (always)

### Updated Workflow: `main-ci.yml`

JDK 25 setup is already present for `demo-be-jasb`. Add after the existing JaCoCo upload:

```yaml
- name: Upload coverage — demo-be-javx
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-javx/target/site/jacoco-integration/jacoco.xml
    flags: demo-be-javx
    fail_ci_if_error: false
```

---

## Dependencies Summary

### Maven Dependencies (pom.xml)

| Dependency                        | Group ID                      | Purpose                                      |
| --------------------------------- | ----------------------------- | -------------------------------------------- |
| `vertx-core`                      | `io.vertx`                    | Vert.x core (event loop, Future, Vertx)      |
| `vertx-web`                       | `io.vertx`                    | HTTP Router, RoutingContext, BodyHandler      |
| `vertx-pg-client`                 | `io.vertx`                    | Reactive PostgreSQL client                   |
| `vertx-auth-jwt`                  | `io.vertx`                    | Optional: Vert.x JWT provider                |
| `java-jwt`                        | `com.auth0`                   | JWT creation + validation (Auth0)            |
| `jbcrypt`                         | `org.mindrot`                 | BCrypt password hashing                      |
| `jspecify`                        | `org.jspecify`                | @NullMarked, @Nullable annotations           |
| `vertx-junit5`                    | `io.vertx`                    | Vert.x test extension for JUnit 5            |
| `vertx-web-client`                | `io.vertx`                    | WebClient for integration test HTTP calls    |
| `cucumber-java`                   | `io.cucumber`                 | Cucumber JVM step definitions                |
| `cucumber-junit-platform-engine`  | `io.cucumber`                 | JUnit Platform runner for Cucumber           |
| `junit-jupiter`                   | `org.junit.jupiter`           | JUnit 5 assertions and annotations           |
| `jacoco-maven-plugin`             | `org.jacoco`                  | Code coverage (XML output)                   |
| `checkstyle`                      | `com.puppycrawl.tools`        | Java style enforcement                       |
| `error_prone_core`                | `com.google.errorprone`       | Compile-time bug detection                   |
| `NullAway`                        | `com.uber.nullaway`           | Null safety enforcement via Error Prone      |
