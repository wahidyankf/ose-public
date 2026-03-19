---
title: "Intermediate"
weight: 10000002
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master production Kotlin Ktor patterns through 28 annotated examples covering authentication (Basic, JWT, OAuth), sessions, Exposed database, plugins architecture, WebSocket, testing, custom plugins, HOCON configuration, file upload, and Koin dependency injection"
tags: ["ktor", "kotlin", "web-framework", "tutorial", "by-example", "intermediate", "jwt", "authentication", "websocket", "exposed", "testing", "koin"]
---

## Group 1: Authentication

### Example 28: Basic Authentication

Ktor's authentication plugin provides a structured way to protect routes. Basic authentication exchanges Base64-encoded credentials in the `Authorization` header and is simple to implement for internal tools and APIs.

```mermaid
graph TD
  A["Request without Auth"] --> B["authenticate block"]
  B -->|"No Authorization header"| C["401 Unauthorized"]
  B -->|"Authorization: Basic base64"| D["Validate Credentials"]
  D -->|"Invalid"| C
  D -->|"Valid"| E["Route Handler"]
  E --> F["200 Response"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#CA9161,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#029E73,stroke:#000,color:#fff
  style F fill:#029E73,stroke:#000,color:#fff
```

```kotlin
// build.gradle.kts: implementation("io.ktor:ktor-server-auth:3.0.3")

import io.ktor.server.application.*
import io.ktor.server.auth.*               // => Authentication plugin
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureAuthentication() {
    install(Authentication) {              // => Install authentication plugin
        basic("auth-basic") {              // => Register Basic auth with name "auth-basic"
                                            // => Name used to reference in authenticate blocks
            realm = "My Protected API"     // => Shown in browser auth dialog
                                            // => Also appears in WWW-Authenticate header
            validate { credentials ->      // => Called for every request to protected routes
                                            // => credentials.name = username
                                            // => credentials.password = password
                // Return UserIdPrincipal (success) or null (failure)
                if (credentials.name == "admin" &&
                    credentials.password == "secret123") {
                    UserIdPrincipal(credentials.name)  // => Wraps username as principal
                                                        // => Available as call.principal<UserIdPrincipal>()
                } else {
                    null                   // => null = authentication failed -> 401
                }
                // In production: check against database with bcrypt comparison
                // Never store plain-text passwords
            }
        }
    }
}

fun Application.configureRouting() {
    routing {
        // Unprotected route
        get("/public") {
            call.respondText("Public endpoint - no auth required")
        }

        // Protected route - requires "auth-basic" authentication
        authenticate("auth-basic") {       // => All routes inside are protected
            get("/admin") {
                val principal = call.principal<UserIdPrincipal>()  // => Get authenticated user
                                                                     // => Non-null inside authenticate block
                call.respondText("Hello, ${principal?.name}!")     // => "Hello, admin!"
            }
            get("/admin/stats") {
                call.respondText("Admin stats endpoint")
            }
        }
    }
}
// => GET /public              => 200 "Public endpoint - no auth required"
// => GET /admin               => 401 (no credentials)
// => GET /admin (Authorization: Basic YWRtaW46c2VjcmV0MTIz)
//    => 200 "Hello, admin!" (YWRtaW46c2VjcmV0MTIz = base64("admin:secret123"))
```

**Key Takeaway**: `install(Authentication) { basic("name") { validate { ... } } }` registers a named Basic auth provider; `authenticate("name") { }` wraps protected routes; `call.principal<T>()` retrieves the authenticated identity inside the block.

**Why It Matters**: Basic authentication over HTTPS is appropriate for internal tools, CI/CD APIs, and machine-to-machine communication where session management overhead is unnecessary. The `realm` string appears in browser credential dialogs, helping users understand which system requires authentication. Production systems should always use hashed password comparison (bcrypt, Argon2) rather than plain-text equality checks - the example's plain-text comparison is only for illustration clarity.

---

### Example 29: JWT Authentication

JWT (JSON Web Token) authentication stateless bearer tokens that encode claims. Ktor's JWT auth provider validates tokens on every request without database lookups, making it ideal for microservices and mobile API backends.

```kotlin
// build.gradle.kts:
// implementation("io.ktor:ktor-server-auth:3.0.3")
// implementation("io.ktor:ktor-server-auth-jwt:3.0.3")
// implementation("com.auth0:java-jwt:4.4.0")

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*           // => JWT authentication support
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import java.util.Date

// JWT configuration constants (move to application.conf in production)
private const val JWT_SECRET = "your-256-bit-secret-key-here"
private const val JWT_ISSUER = "https://myapp.com"
private const val JWT_AUDIENCE = "myapp-users"
private const val JWT_EXPIRY_MS = 86_400_000L  // => 24 hours in milliseconds

// Helper: generate a JWT token for a user
fun generateToken(userId: String, role: String): String {
    return JWT.create()
        .withIssuer(JWT_ISSUER)            // => Identifies who issued the token
        .withAudience(JWT_AUDIENCE)        // => Identifies intended recipients
        .withClaim("userId", userId)       // => Custom claim: userId
        .withClaim("role", role)           // => Custom claim: user role
        .withExpiresAt(                    // => Token expiration time
            Date(System.currentTimeMillis() + JWT_EXPIRY_MS)
        )
        .sign(Algorithm.HMAC256(JWT_SECRET))  // => Sign with HMAC-SHA256
                                               // => Signature prevents tampering
}

fun Application.configureJWT() {
    install(Authentication) {
        jwt("auth-jwt") {                  // => Register JWT auth with name "auth-jwt"
            realm = "ktor-jwt-example"
            verifier(                      // => Configure token verifier
                JWT.require(Algorithm.HMAC256(JWT_SECRET))  // => Must use same secret
                    .withIssuer(JWT_ISSUER)      // => Must match issuer claim
                    .withAudience(JWT_AUDIENCE)  // => Must match audience claim
                    .build()
            )
            validate { credential ->       // => Called after signature validation passes
                // credential.payload contains decoded claims
                val userId = credential.payload.getClaim("userId").asString()
                if (userId != null) {
                    JWTPrincipal(credential.payload)  // => Wrap payload as principal
                } else {
                    null                   // => Invalid claims -> 401
                }
            }
            challenge { defaultScheme, realm ->
                call.respond(HttpStatusCode.Unauthorized,
                    mapOf("error" to "Token is not valid or has expired"))
            }
        }
    }
}

fun Application.configureRouting() {
    routing {
        // Public: issue tokens
        post("/auth/login") {
            // In production: verify credentials against database first
            val token = generateToken("user-123", "user")
            call.respond(mapOf("token" to token))
            // => {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        }

        authenticate("auth-jwt") {
            get("/profile") {
                val principal = call.principal<JWTPrincipal>()  // => Non-null here
                val userId = principal?.payload?.getClaim("userId")?.asString()
                val role = principal?.payload?.getClaim("role")?.asString()
                call.respondText("User: $userId, Role: $role")
                // => "User: user-123, Role: user"
            }
        }
    }
}
// => POST /auth/login => {"token": "eyJ..."}
// => GET /profile (Authorization: Bearer eyJ...) => "User: user-123, Role: user"
// => GET /profile (no token) => 401 {"error": "Token is not valid or has expired"}
```

**Key Takeaway**: `jwt("name") { verifier(...) { ... }; validate { JWTPrincipal(...) } }` validates and decodes JWT tokens; claims are extracted from `call.principal<JWTPrincipal>()?.payload`.

**Why It Matters**: JWT eliminates server-side session storage, enabling horizontal scaling without shared session stores (Redis, database). Each token is cryptographically self-contained: expiry, user identity, and permissions travel in the token. This architecture is standard for microservices where one auth service issues tokens consumed by multiple downstream services without cross-service session sharing. The `challenge` block ensures JWT validation failures return your API's standard error format rather than a default HTML 401 page.

---

### Example 30: Session-Based Authentication

Cookie sessions store user state server-side (or encrypted in cookies) between requests. The Sessions plugin manages cookie creation, reading, and invalidation, enabling traditional stateful login flows.

```kotlin
// build.gradle.kts:
// implementation("io.ktor:ktor-server-sessions:3.0.3")
// implementation("io.ktor:ktor-server-auth:3.0.3")

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*            // => Sessions plugin
import io.ktor.http.*

// Session data class (must be serializable)
// Stored in the cookie or server-side
data class UserSession(
    val userId: String,                    // => Identifies the logged-in user
    val role: String                       // => User's role for authorization
)

fun Application.configureSessions() {
    install(Sessions) {                    // => Install sessions plugin
        cookie<UserSession>("user_session") {  // => Cookie name: "user_session"
                                                // => Type param = session data class
            cookie.path = "/"              // => Cookie valid for entire site
            cookie.maxAgeInSeconds = 86400  // => Session lasts 24 hours
            cookie.httpOnly = true         // => Prevent JS access (XSS protection)
            cookie.secure = true           // => HTTPS only
            cookie.extensions["SameSite"] = "Lax"  // => CSRF protection

            // Encrypt cookie to prevent tampering (REQUIRED for production)
            transform(SessionTransportTransformerEncrypt(
                hex("00112233445566778899aabbccddeeff"),  // => Encryption key (AES-256)
                hex("01020304050607080910111213141516")   // => Sign key (HMAC)
                // Generate with: java.security.SecureRandom().generateSeed(32)
            ))
        }
    }
}

fun Application.configureRouting() {
    routing {
        // Login endpoint: verify credentials, set session
        post("/login") {
            val params = call.receiveParameters()
            val username = params["username"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val password = params["password"] ?: return@post call.respond(HttpStatusCode.BadRequest)

            // In production: verify against database with bcrypt
            if (username == "alice" && password == "password123") {
                call.sessions.set(         // => Creates/overwrites the session cookie
                    UserSession(userId = "user-1", role = "admin")
                )
                call.respondRedirect("/dashboard")
            } else {
                call.respond(HttpStatusCode.Unauthorized)
            }
        }

        // Protected: require active session
        get("/dashboard") {
            val session = call.sessions.get<UserSession>()  // => Read session; null if not logged in
            if (session == null) {
                call.respondRedirect("/login")
                return@get
            }
            call.respondText("Welcome, ${session.userId}! Role: ${session.role}")
        }

        // Logout: clear session
        post("/logout") {
            call.sessions.clear<UserSession>()  // => Removes session cookie
            call.respondRedirect("/login")
        }
    }
}
// => POST /login username=alice&password=password123 => Sets cookie, redirects to /dashboard
// => GET /dashboard (with valid cookie) => "Welcome, user-1! Role: admin"
// => GET /dashboard (no cookie) => redirects to /login
// => POST /logout => Clears cookie, redirects to /login
```

**Key Takeaway**: `install(Sessions) { cookie<T>("name") { ... } }` configures cookie-backed sessions; always use `SessionTransportTransformerEncrypt` to prevent session data tampering.

**Why It Matters**: Session-based authentication remains the right choice for user-facing web applications where browsers handle cookies automatically. The encrypted cookie transform prevents users from modifying their session data (like escalating their role from "user" to "admin"). Without encryption, cookie sessions are trivially forgeable. Server-side session storage (using a Redis-backed `SessionStorage`) is needed for multi-server deployments where the same user might hit different instances between requests.

---

### Example 31: OAuth2 Authentication with GitHub

OAuth2 delegates authentication to external identity providers (GitHub, Google) instead of managing credentials. Ktor's OAuth auth provider handles the full authorization code flow.

```kotlin
// build.gradle.kts:
// implementation("io.ktor:ktor-server-auth:3.0.3")
// implementation("io.ktor:ktor-client-core:3.0.3")
// implementation("io.ktor:ktor-client-cio:3.0.3")

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.http.*

// HttpClient for Ktor's OAuth to make token exchange calls
val httpClient = HttpClient(CIO)         // => Required by OAuth auth provider

fun Application.configureOAuth() {
    install(Authentication) {
        oauth("auth-oauth-github") {     // => Register OAuth provider
            urlProvider = { "http://localhost:8080/callback" }
                                         // => Your registered redirect URI in GitHub app
                                         // => Must match exactly what's in GitHub OAuth app settings
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "github",
                    authorizeUrl = "https://github.com/login/oauth/authorize",
                                         // => GitHub OAuth authorization URL
                    accessTokenUrl = "https://github.com/login/oauth/access_token",
                                         // => Exchange code for access token
                    requestMethod = HttpMethod.Post,
                    clientId = System.getenv("GITHUB_CLIENT_ID") ?: "your-client-id",
                    clientSecret = System.getenv("GITHUB_CLIENT_SECRET") ?: "your-secret",
                    defaultScopes = listOf("read:user", "user:email")
                                         // => Permissions to request from GitHub
                )
            }
            client = httpClient          // => HttpClient for token exchange
        }
    }
}

fun Application.configureRouting() {
    routing {
        // Clicking "Login with GitHub" redirects here first
        authenticate("auth-oauth-github") {
            get("/login/github") {
                // => Ktor intercepts this and redirects to GitHub OAuth
                // => No code needed here; plugin handles redirect
            }

            // GitHub redirects back here with ?code=... and ?state=...
            get("/callback") {
                val principal = call.principal<OAuthAccessTokenResponse.OAuth2>()
                // => principal.accessToken = GitHub access token
                // => Use this token to call GitHub API for user info
                val accessToken = principal?.accessToken
                // => In production: call https://api.github.com/user with token
                // => Get user's GitHub ID, name, email
                // => Find or create user in your database
                // => Create your app's session or JWT
                call.respondText("GitHub OAuth success! Token: ${accessToken?.take(8)}...")
            }
        }

        get("/login") {
            call.respondText(
                """<a href="/login/github">Login with GitHub</a>""",
                io.ktor.http.ContentType.Text.Html
            )
        }
    }
}
// => GET /login => page with "Login with GitHub" link
// => GET /login/github => redirected to github.com/login/oauth/authorize
// => GitHub redirects to GET /callback?code=abc&state=xyz
//    => Token exchanged; response: "GitHub OAuth success! Token: ghp_abc1..."
```

**Key Takeaway**: Ktor's OAuth provider handles the full authorization code flow (redirect → authorization → token exchange); your `/callback` handler receives the access token via `call.principal<OAuthAccessTokenResponse.OAuth2>()`.

**Why It Matters**: OAuth2 with trusted providers (GitHub, Google) eliminates password management entirely - you never store passwords, and the complexity of secure password resets, MFA, and breach detection shifts to providers who specialize in identity. Users benefit from "Login with GitHub" requiring no new account creation. Production implementations must use the access token to fetch canonical user identity from the provider's API, then create or look up a local user record to maintain application-specific user data.

---

## Group 2: Database with Exposed

### Example 32: Exposed ORM Basic Setup

Exposed is JetBrains' official Kotlin SQL library providing type-safe DSL and DAO approaches for database access. Setting up Exposed with HikariCP connection pooling is the standard Ktor database integration pattern.

```kotlin
// build.gradle.kts:
// implementation("org.jetbrains.exposed:exposed-core:0.57.0")
// implementation("org.jetbrains.exposed:exposed-dao:0.57.0")
// implementation("org.jetbrains.exposed:exposed-jdbc:0.57.0")
// implementation("com.zaxxer:HikariCP:5.1.0")
// implementation("org.postgresql:postgresql:42.7.4")

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

// Table definition using Exposed DSL approach
// Object represents the "users" table schema
object Users : Table("users") {          // => Table name in database: "users"
    val id = integer("id").autoIncrement()  // => INTEGER AUTOINCREMENT column
    val name = varchar("name", 255)         // => VARCHAR(255) column
    val email = varchar("email", 255).uniqueIndex()  // => VARCHAR(255) UNIQUE
    val createdAt = long("created_at")      // => BIGINT for Unix timestamp
    override val primaryKey = PrimaryKey(id)  // => id is the primary key
}

// Configure HikariCP connection pool
fun createHikariDataSource(
    url: String,
    driver: String = "org.postgresql.Driver"
): HikariDataSource {
    val config = HikariConfig().apply {
        jdbcUrl = url                    // => "jdbc:postgresql://localhost:5432/mydb"
        driverClassName = driver
        maximumPoolSize = 10             // => Max 10 concurrent DB connections
        minimumIdle = 2                  // => Keep 2 idle connections warm
        idleTimeout = 600_000            // => Close idle connections after 10 minutes
        connectionTimeout = 30_000       // => Fail fast if no connection in 30s
        isAutoCommit = false             // => Let Exposed manage transactions
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"
    }
    return HikariDataSource(config)
}

fun Application.configureDatabase() {
    val dataSource = createHikariDataSource(
        url = environment.config
            .property("database.url")    // => Read from application.conf
            .getString()
    )

    Database.connect(dataSource)         // => Connect Exposed to HikariCP pool
                                          // => All transaction { } blocks use this connection

    // Create tables if they don't exist (use Flyway for production migrations)
    transaction {
        SchemaUtils.create(Users)        // => CREATE TABLE IF NOT EXISTS users (...)
    }
}
// => Database connected with pool of 2-10 connections
// => "users" table created if not already present
```

**Key Takeaway**: `Database.connect(hikariDataSource)` connects Exposed to a pooled data source; `transaction { SchemaUtils.create(Table) }` creates tables within a database transaction.

**Why It Matters**: HikariCP is the fastest JDBC connection pool available and is battle-tested in production across thousands of applications. Setting `maximumPoolSize` based on database and CPU capacity (typically `2 * cores + 1` for PostgreSQL) prevents connection exhaustion under load. `isAutoCommit = false` is essential for Exposed - without it, every single SQL statement commits immediately, making multi-statement transactions impossible. Production systems should use Flyway or Liquibase for schema migrations rather than `SchemaUtils.create()`, which cannot handle schema evolution.

---

### Example 33: Exposed CRUD Operations

With the table defined, Exposed's DSL provides type-safe SQL expressions for inserting, selecting, updating, and deleting records inside transaction blocks.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class UserDto(val id: Int, val name: String, val email: String)

@Serializable
data class CreateUserDto(val name: String, val email: String)

fun Application.configureRouting() {
    routing {
        // CREATE: INSERT INTO users
        post("/users") {
            val dto = call.receive<CreateUserDto>()

            val userId = transaction {   // => Opens a database transaction
                Users.insert {           // => INSERT INTO users (name, email, created_at)
                    it[name] = dto.name
                    it[email] = dto.email
                    it[createdAt] = System.currentTimeMillis()
                } get Users.id           // => Returns the generated id value
            }
            // => transaction {} auto-commits on success, rollbacks on exception

            call.respond(
                HttpStatusCode.Created,
                UserDto(userId, dto.name, dto.email)
            )
        }

        // READ ALL: SELECT * FROM users
        get("/users") {
            val users = transaction {
                Users.selectAll()        // => SELECT * FROM users
                    .orderBy(Users.id)   // => ORDER BY id ASC
                    .map { row ->        // => Map each ResultRow to UserDto
                        UserDto(
                            id = row[Users.id],       // => row[column] extracts typed value
                            name = row[Users.name],
                            email = row[Users.email]
                        )
                    }
            }
            call.respond(users)          // => JSON array of users
        }

        // READ ONE: SELECT WHERE id = ?
        get("/users/{id}") {
            val userId = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest)

            val user = transaction {
                Users.select { Users.id eq userId }  // => WHERE id = userId
                    .singleOrNull()      // => Returns ResultRow? (null if not found)
                    ?.let { row ->       // => Map if found
                        UserDto(row[Users.id], row[Users.name], row[Users.email])
                    }
            }

            if (user == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "User not found"))
            } else {
                call.respond(user)
            }
        }

        // UPDATE: UPDATE users SET ... WHERE id = ?
        put("/users/{id}") {
            val userId = call.parameters["id"]?.toIntOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest)
            val dto = call.receive<CreateUserDto>()

            val updated = transaction {
                Users.update({ Users.id eq userId }) {  // => UPDATE ... WHERE id = userId
                    it[name] = dto.name
                    it[email] = dto.email
                }
                // => Returns count of updated rows (0 = not found, 1 = updated)
            }

            if (updated == 0) {
                call.respond(HttpStatusCode.NotFound)
            } else {
                call.respond(UserDto(userId, dto.name, dto.email))
            }
        }

        // DELETE: DELETE FROM users WHERE id = ?
        delete("/users/{id}") {
            val userId = call.parameters["id"]?.toIntOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest)

            transaction {
                Users.deleteWhere { Users.id eq userId }  // => DELETE WHERE id = userId
            }
            call.respond(HttpStatusCode.NoContent)        // => 204 regardless (idempotent)
        }
    }
}
// => POST /users {"name":"Alice","email":"alice@example.com"} => 201 {"id":1,...}
// => GET  /users                                              => 200 [{"id":1,...}]
// => GET  /users/1                                            => 200 {"id":1,...}
// => PUT  /users/1 {"name":"Alice Smith","email":"..."}       => 200 {"id":1,...}
// => DELETE /users/1                                          => 204
```

**Key Takeaway**: Wrap all Exposed operations in `transaction { }` for automatic commit/rollback; `Table.select { Column eq value }` and `Table.update { }` use compile-time type-safe column references.

**Why It Matters**: Type-safe SQL via Exposed's DSL catches column name typos and type mismatches at compile time rather than runtime. A misspelled column name in raw JDBC SQL fails at runtime on the first request; the Exposed DSL `Users.emali eq value` fails at compile time. The transaction block's automatic rollback on exceptions prevents partial writes (e.g., writing a user record but failing to write their permissions) from leaving the database in an inconsistent state.

---

## Group 3: WebSocket

### Example 34: Basic WebSocket Handler

Ktor's WebSocket support enables full-duplex communication over a persistent connection. The `webSocket` route handler receives and sends frames in a coroutine scope, making bidirectional streaming natural to write.

```mermaid
graph LR
  A["Client"] -->|"HTTP Upgrade"| B["Ktor WebSocket Handler"]
  B -->|"101 Switching Protocols"| A
  A -->|"Text Frame: hello"| B
  B -->|"Text Frame: Echo: hello"| A
  A -->|"Close Frame"| B
  B -->|"Close Frame"| A

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#029E73,stroke:#000,color:#fff
```

```kotlin
// build.gradle.kts: implementation("io.ktor:ktor-server-websockets:3.0.3")

import io.ktor.server.application.*
import io.ktor.server.websocket.*           // => WebSocket plugin and DSL
import io.ktor.websocket.*                  // => Frame, CloseReason types
import io.ktor.server.routing.*
import kotlinx.coroutines.channels.consumeEach  // => Iterate incoming frames
import java.time.Duration

fun Application.configureWebSockets() {
    install(WebSockets) {                   // => Install WebSocket support
        pingPeriod = Duration.ofSeconds(15) // => Send ping every 15s to keep connection alive
                                             // => Detects dead connections from broken networks
        timeout = Duration.ofSeconds(15)    // => Close if no pong received within 15s
        maxFrameSize = Long.MAX_VALUE        // => Maximum frame size (use reasonable limit in prod)
        masking = false                     // => Server-to-client masking (false = standard)
    }
}

fun Application.configureRouting() {
    routing {
        // Basic echo WebSocket
        webSocket("/ws/echo") {             // => WebSocket route; suspends for connection lifetime
            // 'this' is DefaultWebSocketServerSession
            send("Connected to echo server!")  // => Send text frame to client

            incoming.consumeEach { frame ->    // => Iterate frames until connection closes
                when (frame) {
                    is Frame.Text -> {         // => Text frame received
                        val text = frame.readText()  // => "hello" (string content)
                        send("Echo: $text")    // => Send echo back
                        // => send() is a suspend function; waits for buffer space
                    }
                    is Frame.Close -> {        // => Client sent close frame
                        val reason = frame.readReason()
                        close(CloseReason(CloseReason.Codes.NORMAL, "Client closed"))
                        return@consumeEach     // => Exit the consume loop
                    }
                    else -> {} // => Binary, Ping, Pong frames: ignore in this example
                }
            }
            // => After consumeEach exits, connection is closed
        }

        // Chat room: broadcast to all connected clients
        val connections = mutableSetOf<DefaultWebSocketServerSession>()

        webSocket("/ws/chat") {
            connections.add(this)           // => Track this connection
            try {
                incoming.consumeEach { frame ->
                    if (frame is Frame.Text) {
                        val message = frame.readText()
                        // Broadcast to all other connections
                        connections.forEach { conn ->
                            if (conn !== this) {  // => Don't echo back to sender
                                conn.send(message)  // => Broadcast to each connection
                            }
                        }
                    }
                }
            } finally {
                connections.remove(this)    // => Clean up on disconnect (always)
            }
        }
    }
}
// WebSocket client connects to ws://localhost:8080/ws/echo
// Client sends: "hello"
// Server responds: "Echo: hello"
// Client sends: "world"
// Server responds: "Echo: world"
```

**Key Takeaway**: `webSocket("/path") { }` creates a coroutine scope lasting the entire connection; `incoming.consumeEach { frame -> }` processes frames until the client disconnects; `send()` pushes frames to the client.

**Why It Matters**: WebSocket enables real-time features (live notifications, collaborative editing, multiplayer games, financial tickers) that would require expensive polling over HTTP. Ktor's coroutine-based WebSocket handler scales efficiently: each connection suspends rather than blocking a thread, enabling tens of thousands of concurrent connections on modest hardware. The `pingPeriod` configuration is essential for production - without it, mobile clients behind NAT lose connections silently when the network path is idle.

---

### Example 35: WebSocket with Session State

Production WebSocket handlers maintain per-connection state and integrate with authentication. This pattern associates WebSocket connections with authenticated user sessions.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import io.ktor.server.routing.*
import kotlinx.coroutines.channels.consumeEach
import java.util.concurrent.ConcurrentHashMap

// Per-connection state
data class ConnectedUser(
    val userId: String,
    val session: DefaultWebSocketServerSession
)

// Thread-safe map of all connected users
val activeConnections = ConcurrentHashMap<String, ConnectedUser>()
                                           // => Key: userId, Value: ConnectedUser

fun Application.configureRouting() {
    routing {
        authenticate("auth-jwt") {         // => Require JWT before WebSocket upgrade
            webSocket("/ws/notifications") {
                // Principal available after JWT validation
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asString()
                    ?: return@webSocket close(
                        CloseReason(CloseReason.Codes.VIOLATED_POLICY, "No user ID")
                    )

                // Register this connection
                val connection = ConnectedUser(userId, this)
                activeConnections[userId] = connection  // => Store for server-push later
                                                         // => ConcurrentHashMap is thread-safe

                try {
                    send("Connected! User: $userId")   // => Confirm connection to client

                    incoming.consumeEach { frame ->
                        if (frame is Frame.Text) {
                            val msg = frame.readText()
                            // Echo back with userId prefix
                            send("[$userId] $msg")
                        }
                    }
                } finally {
                    activeConnections.remove(userId)    // => Always remove on disconnect
                                                         // => Prevents memory leaks
                }
            }
        }

        // Server-side push: send notification to specific user
        // Called from other parts of the application (e.g., after a database event)
        post("/notify/{userId}") {
            val targetUserId = call.parameters["userId"] ?: return@post
            val message = call.receiveText()
            val connection = activeConnections[targetUserId]

            if (connection != null) {
                connection.session.send(message)  // => Push to connected WebSocket client
                call.respondText("Sent to $targetUserId")
            } else {
                call.respondText("User not connected",
                    status = io.ktor.http.HttpStatusCode.NotFound)
            }
        }
    }
}
// => WebSocket /ws/notifications (with JWT) => registers connection for user-123
// => POST /notify/user-123 body="New order!" => pushes to user-123's WebSocket
```

**Key Takeaway**: Store `DefaultWebSocketServerSession` in a `ConcurrentHashMap` indexed by userId; always remove connections in `finally` blocks; JWT authentication on the upgrade request gates WebSocket access.

**Why It Matters**: Server-push notifications (order updates, message alerts, live dashboard data) require maintaining the mapping from user identity to WebSocket session. `ConcurrentHashMap` is essential because route handlers run in different coroutines (potentially different threads) and modify the map concurrently. The `finally` block cleanup is non-negotiable: leaked sessions hold memory and may cause server-push to attempt writes to closed connections, generating errors. In high-scale scenarios, replace the in-memory map with Redis pub/sub for multi-instance deployments.

---

## Group 4: Testing

### Example 36: testApplication for Integration Testing

Ktor's `testApplication` builder starts an in-memory test server using your actual application modules. Tests send real HTTP requests and assert on real responses without network I/O or port binding.

```kotlin
// build.gradle.kts (test dependencies):
// testImplementation("io.ktor:ktor-server-test-host:3.0.3")
// testImplementation("io.ktor:ktor-client-content-negotiation:3.0.3")
// testImplementation("org.jetbrains.kotlin:kotlin-test:2.1.0")

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.http.*
import io.ktor.server.testing.*            // => testApplication, ApplicationTestBuilder
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class UserApiTest {

    // testApplication creates an in-memory Ktor server using real modules
    @Test
    fun `GET users returns list`() = testApplication {
        application {                       // => Apply your real module functions
            configureContentNegotiation()   // => Same function used in production
            configureRouting()              // => Same routes as production
        }

        // client is a pre-configured HttpClient pointing to the test server
        val response = client.get("/users") {
            header(HttpHeaders.Accept, ContentType.Application.Json.toString())
        }

        assertEquals(HttpStatusCode.OK, response.status)
        // => response.status is HttpStatusCode.OK (200)

        val body = response.bodyAsText()    // => Read response body as String
        // Assert body contains expected content
        assert(body.contains("[")) { "Expected JSON array, got: $body" }
    }

    @Test
    fun `POST users creates user and returns 201`() = testApplication {
        application {
            configureContentNegotiation()
            configureRouting()
        }

        // Configure test client with JSON support
        val jsonClient = createClient {     // => Create client with plugins
            install(ContentNegotiation) {   // => Auto-serialize/deserialize JSON
                json()
            }
        }

        val response = jsonClient.post("/users") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("name" to "Bob", "email" to "bob@example.com"))
            // => setBody() serializes the map to JSON using the ContentNegotiation plugin
        }

        assertEquals(HttpStatusCode.Created, response.status)  // => 201 Created
        val responseBody = response.bodyAsText()
        assert(responseBody.contains("Bob")) { "Expected 'Bob' in response: $responseBody" }
    }

    @Test
    fun `GET users with invalid ID returns 400`() = testApplication {
        application {
            configureStatusPages()
            configureRouting()
        }

        val response = client.get("/users/not-a-number")
        assertEquals(HttpStatusCode.BadRequest, response.status)  // => 400
    }
}
// => All tests run without starting a real HTTP server
// => No ports opened; tests are fast and isolated
// => Same module functions as production: tests exercise real configuration
```

**Key Takeaway**: `testApplication { application { yourModules() }; client.get("/path") }` runs integration tests against your real application configuration without network ports; `createClient { install(...) }` configures per-test client plugins.

**Why It Matters**: Integration tests using `testApplication` catch entire-path bugs that unit tests miss: missing plugin installations, wrong route configurations, incorrect serialization setup. Because the same module functions used in production are applied in tests, configuration drift (production has a plugin test doesn't) is impossible. The absence of port binding makes these tests safe to run in parallel without port conflicts, dramatically reducing test suite execution time in CI pipelines.

---

### Example 37: Testing Authentication Endpoints

Testing authenticated routes requires sending correct credentials in test requests and asserting correct rejection of invalid credentials.

```kotlin
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import java.util.Base64

class AuthTest {

    private fun ApplicationTestBuilder.setupApp() {
        application {
            configureAuthentication()    // => Install Basic auth
            configureRouting()           // => Install routes including protected ones
        }
    }

    @Test
    fun `protected endpoint rejects unauthenticated request`() = testApplication {
        setupApp()
        val response = client.get("/admin")  // => No Authorization header
        assertEquals(HttpStatusCode.Unauthorized, response.status)
        // => 401 Unauthorized expected
    }

    @Test
    fun `protected endpoint accepts valid credentials`() = testApplication {
        setupApp()

        // Build Basic auth header: "Basic base64(username:password)"
        val credentials = Base64.getEncoder()
            .encodeToString("admin:secret123".toByteArray())
        val response = client.get("/admin") {
            header(HttpHeaders.Authorization, "Basic $credentials")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        assert(response.bodyAsText().contains("Hello, admin!"))
    }

    @Test
    fun `protected endpoint rejects wrong password`() = testApplication {
        setupApp()

        val credentials = Base64.getEncoder()
            .encodeToString("admin:wrongpassword".toByteArray())
        val response = client.get("/admin") {
            header(HttpHeaders.Authorization, "Basic $credentials")
        }

        assertEquals(HttpStatusCode.Unauthorized, response.status)
        // => 401: wrong password rejected
    }

    @Test
    fun `JWT endpoint accepts valid token`() = testApplication {
        application {
            configureJWT()
            configureRouting()
        }

        // First: get a token
        val loginResponse = client.post("/auth/login")
        assertEquals(HttpStatusCode.OK, loginResponse.status)
        val responseText = loginResponse.bodyAsText()
        // Extract token from JSON (simplified; use proper JSON parsing in real tests)
        val token = responseText.substringAfter("\"token\":\"").substringBefore("\"")

        // Then: use the token
        val profileResponse = client.get("/profile") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }
        assertEquals(HttpStatusCode.OK, profileResponse.status)
    }
}
// => All tests pass without network I/O
// => Authentication logic tested end-to-end including header parsing and validation
```

**Key Takeaway**: Build the `Authorization` header manually for Basic auth tests; for JWT tests, first call the login endpoint to get a real token, then use it in subsequent requests to test the full token flow.

**Why It Matters**: Testing only the happy path of authentication misses the bugs that matter most: gaps in credential validation, token expiration not enforced, incorrect status codes on failure. Testing invalid credentials and missing headers confirms that your security boundary holds before deployment. The pattern of calling login to get a real token (rather than generating one in the test) ensures the test exercises the full generation pipeline, catching bugs in token generation that a test with a hardcoded token would miss.

---

## Group 5: Custom Plugins

### Example 38: Creating a Custom Application Plugin

Ktor's plugin architecture lets you create reusable middleware that intercepts the request/response pipeline. Custom plugins are the Ktor equivalent of Spring Boot `HandlerInterceptor` or Express middleware.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.util.*

// Step 1: Define the plugin configuration class
class RequestIdConfig {
    var headerName: String = "X-Request-ID"  // => Default header name
    var generator: () -> String = {           // => Default ID generator
        java.util.UUID.randomUUID().toString()
    }
}

// Step 2: Define the plugin using createApplicationPlugin
val RequestIdPlugin = createApplicationPlugin(
    name = "RequestIdPlugin",               // => Plugin identifier (must be unique)
    createConfiguration = ::RequestIdConfig // => Configuration factory
) {
    // pluginConfig is the RequestIdConfig instance configured by the caller
    val headerName = pluginConfig.headerName
    val generator = pluginConfig.generator

    // Step 3: Install pipeline interception
    onCall { call ->                        // => Runs for EVERY request before routing
        // Read existing request ID from client, or generate a new one
        val requestId = call.request.headers[headerName]
            ?: generator()                  // => Generate if client didn't provide one
                                             // => Client-provided IDs enable end-to-end tracing

        // Store in call attributes for access in handlers
        call.attributes.put(RequestIdKey, requestId)
                                             // => AttributeKey provides typed storage on call

        // Add to response headers so clients see the same ID
        call.response.headers.append(headerName, requestId)
    }
}

// AttributeKey for type-safe access from handlers
val RequestIdKey = AttributeKey<String>("RequestId")

// Step 4: Use the plugin
fun Application.configurePlugins() {
    install(RequestIdPlugin) {              // => Install with default config
        headerName = "X-Request-ID"         // => Customize configuration
        generator = { "ktor-${System.nanoTime()}" }  // => Custom generator
    }
}

fun Application.configureRouting() {
    routing {
        get("/demo") {
            val requestId = call.attributes[RequestIdKey]  // => Read from attributes
                                                            // => "ktor-1234567890" or client-provided
            call.respondText("Request ID: $requestId")
        }
    }
}
// => GET /demo (no X-Request-ID header)
//    Response header: X-Request-ID: ktor-1234567890
//    Body: "Request ID: ktor-1234567890"
// => GET /demo (X-Request-ID: my-trace-id)
//    Response header: X-Request-ID: my-trace-id
//    Body: "Request ID: my-trace-id"
```

**Key Takeaway**: `createApplicationPlugin("Name", createConfiguration = ::Config) { onCall { ... } }` creates a reusable plugin; `call.attributes.put(Key, value)` passes data from plugin to handlers via type-safe attribute storage.

**Why It Matters**: Custom plugins extract cross-cutting concerns from route handlers, keeping handlers focused on business logic. Request ID tracking, rate limiting, audit logging, tenant identification, and feature flag resolution all fit naturally as plugins. The `AttributeKey` pattern provides type-safe communication between plugins and handlers without global state or thread-locals, which would be unreliable in coroutine contexts where a single logical request may run on multiple threads during suspension.

---

### Example 39: Route-Scoped Plugin

Route-scoped plugins apply only to specific route subtrees rather than all requests. This enables per-feature middleware without affecting unrelated routes.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.util.*

// Route-scoped plugin configuration
class RateLimitConfig {
    var requestsPerMinute: Int = 60         // => Configurable rate limit
    var keyExtractor: (ApplicationCall) -> String = { call ->
        call.request.origin.remoteHost      // => Default: rate limit by IP
    }
}

// createRouteScopedPlugin creates plugin applied only to specific route groups
val RateLimitPlugin = createRouteScopedPlugin(
    name = "RateLimitPlugin",
    createConfiguration = ::RateLimitConfig
) {
    val limit = pluginConfig.requestsPerMinute
    val keyExtractor = pluginConfig.keyExtractor

    // In-memory store (use Redis in production for multi-instance support)
    val requestCounts = mutableMapOf<String, Pair<Long, Int>>()
                                            // => Key -> (windowStart, count)

    onCall { call ->                        // => Runs for requests in this route scope
        val key = keyExtractor(call)        // => Extract rate limit key (e.g., IP)
        val now = System.currentTimeMillis()
        val windowMs = 60_000L              // => 1 minute window

        val (windowStart, count) = requestCounts[key] ?: (now to 0)

        if (now - windowStart > windowMs) {
            // New window: reset counter
            requestCounts[key] = now to 1  // => Reset to 1 for this request
        } else if (count >= limit) {
            // Over limit: reject
            call.response.headers.append(
                "Retry-After", "60"         // => Tell client when to retry
            )
            call.respond(
                HttpStatusCode.TooManyRequests,  // => HTTP 429
                mapOf("error" to "Rate limit exceeded. Limit: $limit/min")
            )
            return@onCall                   // => Short-circuit: don't proceed to handler
        } else {
            requestCounts[key] = windowStart to (count + 1)
        }
    }
}

fun Application.configureRouting() {
    routing {
        // Apply rate limiting only to public API endpoints
        route("/api/public") {
            install(RateLimitPlugin) {      // => Route-scoped installation
                requestsPerMinute = 30      // => Stricter limit for public endpoints
            }
            get("/data") {
                call.respondText("Public data")
            }
        }

        // Internal endpoints: no rate limiting
        route("/api/internal") {
            get("/admin") {
                call.respondText("Admin only, no rate limit")
            }
        }
    }
}
// => GET /api/public/data (30th request in window) => 200 "Public data"
// => GET /api/public/data (31st request in window) => 429 {"error":"Rate limit exceeded..."}
// => GET /api/internal/admin => 200 "Admin only, no rate limit" (no limit applied)
```

**Key Takeaway**: `createRouteScopedPlugin` creates middleware applied to specific route subtrees via `install()` inside `route { }` blocks; `return@onCall` short-circuits the pipeline before reaching the handler.

**Why It Matters**: Global plugins apply to every request including health checks, metrics endpoints, and internal APIs that should not be rate-limited. Route-scoped plugins give fine-grained control: public API endpoints get stricter limits, authenticated endpoints get per-user limits, and internal management endpoints bypass limits entirely. This granularity is impossible with global middleware and prevents the frustrating scenario where your health check endpoint gets rate-limited and fails your load balancer's health monitoring.

---

## Group 6: Configuration

### Example 40: HOCON Configuration with application.conf

Ktor uses HOCON (Human-Optimized Config Object Notation) for configuration. `application.conf` provides type-safe access to server settings, database URLs, secret keys, and feature flags with environment variable substitution.

```kotlin
// src/main/resources/application.conf
// ktor {
//   deployment {
//     port = 8080
//     port = ${?PORT}            # Override with PORT env var if set
//     environment = development
//     environment = ${?APP_ENV}  # Override with APP_ENV env var
//   }
//   application {
//     modules = [ com.example.ApplicationKt.module ]
//   }
// }
//
// database {
//   url = "jdbc:postgresql://localhost:5432/mydb"
//   url = ${?DATABASE_URL}       # Override in production
//   maxPoolSize = 10
// }
//
// jwt {
//   secret = "dev-secret-change-in-production"
//   secret = ${?JWT_SECRET}      # Always override in production
//   issuer = "http://localhost:8080"
//   audience = "myapp"
// }
//
// features {
//   newDashboard = false
//   newDashboard = ${?FEATURE_NEW_DASHBOARD}  # Toggle via env var
// }

import io.ktor.server.application.*
import io.ktor.server.config.*              // => ApplicationConfig

fun Application.readConfiguration() {
    // Read configuration properties with full type safety
    val port = environment.config
        .property("ktor.deployment.port")  // => Throws if missing (required)
        .getString().toInt()               // => "8080" converted to 8080
                                            // => => 8080 or value of PORT env var

    val dbUrl = environment.config
        .property("database.url")
        .getString()                       // => "jdbc:postgresql://..." or DATABASE_URL value

    val maxPoolSize = environment.config
        .propertyOrNull("database.maxPoolSize")  // => propertyOrNull = optional
        ?.getString()?.toIntOrNull() ?: 10        // => Default 10 if not configured

    val jwtSecret = environment.config
        .property("jwt.secret")
        .getString()                       // => "dev-secret..." or JWT_SECRET env value

    val newDashboardEnabled = environment.config
        .propertyOrNull("features.newDashboard")
        ?.getString()?.toBoolean() ?: false  // => false unless FEATURE_NEW_DASHBOARD=true

    // Log configuration at startup (never log secrets)
    log.info("Starting on port $port, env=${environment.config
        .propertyOrNull("ktor.deployment.environment")
        ?.getString() ?: "unknown"}")
    log.info("DB pool size: $maxPoolSize, Feature/newDashboard: $newDashboardEnabled")
}
// => application.conf with PORT=9090 env var:
//    port = 9090 (env var overrides default 8080)
// => With JWT_SECRET env var:
//    jwtSecret = value from env (production secret, not hardcoded)
// => With DATABASE_URL env var:
//    dbUrl = PostgreSQL URL from hosting provider
```

**Key Takeaway**: `environment.config.property("key").getString()` reads required properties; `propertyOrNull("key")` handles optional settings; `${?ENV_VAR}` syntax in HOCON overrides defaults with environment variable values.

**Why It Matters**: HOCON's `${?VARIABLE}` syntax creates a clean separation between default development values (checked into version control) and production secrets (injected via environment variables). This is the Twelve-Factor App configuration approach: the same binary runs in any environment with only environment variables changing. Never hardcode secrets; the `${?JWT_SECRET}` pattern fails loud (no override) rather than silently using a development key in production, which would make all production JWTs forgeable.

---

## Group 7: File Upload

### Example 41: Multipart File Upload

Ktor handles multipart form data for file uploads. The `receiveMultipart()` API provides streaming access to each part (file data and form fields) without buffering the entire upload in memory.

```kotlin
// build.gradle.kts: implementation("io.ktor:ktor-server-partial-content:3.0.3")
// (multipart is part of ktor-server-core)

import io.ktor.http.content.*             // => PartData, streamProvider
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.utils.io.core.*            // => readBytes
import java.io.File

fun Application.configureRouting() {
    routing {
        // File upload endpoint
        post("/upload") {
            val contentType = call.request.contentType()
            if (!contentType.match(ContentType.MultiPart.FormData)) {
                call.respond(HttpStatusCode.BadRequest, "Expected multipart/form-data")
                return@post
            }

            val multipart = call.receiveMultipart()  // => Get multipart reader
            var fileName: String? = null
            var fileSize = 0L
            var description: String? = null

            // Process each part of the multipart body
            multipart.forEachPart { part ->          // => Iterates each part
                when (part) {
                    is PartData.FileItem -> {         // => File upload part
                        fileName = part.originalFileName ?: "upload"
                        val uploadDir = File("uploads").also { it.mkdirs() }
                        val file = File(uploadDir, fileName!!)

                        // Stream to disk without loading into memory
                        part.streamProvider().use { input ->  // => InputStream of file data
                            file.outputStream().buffered().use { output ->
                                val bytes = input.readBytes()
                                output.write(bytes)
                                fileSize = bytes.size.toLong()
                                // => In production: use chunked copying for large files
                                // => input.copyTo(output) for memory-efficient streaming
                            }
                        }
                    }
                    is PartData.FormItem -> {         // => Regular form field
                        if (part.name == "description") {
                            description = part.value  // => Form field value as String
                        }
                    }
                    else -> {}                        // => BinaryChannelItem, BinaryItem: skip
                }
                part.dispose()                        // => Always dispose after reading
                                                       // => Releases underlying resources
            }

            if (fileName == null) {
                call.respond(HttpStatusCode.BadRequest, "No file uploaded")
                return@post
            }

            call.respond(
                HttpStatusCode.Created,
                mapOf(
                    "fileName" to fileName,
                    "size" to fileSize,
                    "description" to description
                )
            )
        }
    }
}
// => POST /upload (multipart with file "photo.jpg" + description field)
//    => 201 {"fileName":"photo.jpg","size":102400,"description":"My photo"}
//    => File saved to uploads/photo.jpg
```

**Key Takeaway**: `call.receiveMultipart().forEachPart { }` streams multipart parts; `PartData.FileItem.streamProvider()` gives an `InputStream` for streaming file content; always call `part.dispose()` to release resources.

**Why It Matters**: Buffering entire file uploads in memory crashes servers under concurrent uploads - a 100MB file from 100 concurrent users requires 10GB of heap. Streaming to disk via `streamProvider()` keeps memory usage constant regardless of file size or concurrency. `part.dispose()` releases network buffers promptly: without it, a slow multipart consumer holds the client socket open unnecessarily, exhausting connection pools under load. Production upload handlers also validate file type and size limits before writing to disk to prevent storage abuse.

---

## Group 8: Dependency Injection with Koin

### Example 42: Koin Dependency Injection Setup

Koin is a lightweight Kotlin DI framework that integrates cleanly with Ktor via the `ktor-server-koin` plugin. Koin eliminates manual wiring by resolving dependencies from a module registry.

```kotlin
// build.gradle.kts:
// implementation("io.insert-koin:koin-ktor:3.5.6")
// implementation("io.insert-koin:koin-logger-slf4j:3.5.6")

import io.insert.koin.ktor.ext.*          // => inject(), get() extension functions
import io.insert.koin.ktor.plugin.*       // => Koin plugin
import io.insert.koin.core.module.dsl.*   // => singleOf, factoryOf DSL
import io.insert.koin.dsl.*               // => module {}
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

// Domain classes (no Koin annotations required)
interface UserRepository {
    fun findById(id: Int): String?
}

class InMemoryUserRepository : UserRepository {
    private val users = mapOf(1 to "Alice", 2 to "Bob")

    override fun findById(id: Int): String? = users[id]
                                           // => Returns name or null
}

class UserService(
    private val repository: UserRepository  // => Injected by Koin
) {
    fun getUser(id: Int): String =
        repository.findById(id) ?: throw NoSuchElementException("User $id not found")
}

// Koin module: defines how to create each dependency
val appModule = module {
    // single: created once, reused for all injections (singleton)
    single<UserRepository> { InMemoryUserRepository() }
                                           // => Binds UserRepository interface to implementation
                                           // => Swap implementation here for testing

    // factory: new instance for each injection
    single { UserService(get()) }          // => get() resolves UserRepository from above
                                           // => Koin wires UserRepository -> UserService
}

fun Application.configureKoin() {
    install(Koin) {                        // => Install Koin plugin
        slf4jLogger()                      // => Koin logs via SLF4J
        modules(appModule)                 // => Register dependency module(s)
    }
}

fun Application.configureRouting() {
    routing {
        get("/users/{id}") {
            val userService: UserService = call.application.koin.get()
                                           // => Resolve UserService from Koin container
                                           // => Alternative: inject() at module level
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respondText("Invalid ID",
                    status = io.ktor.http.HttpStatusCode.BadRequest)

            try {
                val name = userService.getUser(id)
                call.respondText("User: $name")  // => "User: Alice"
            } catch (e: NoSuchElementException) {
                call.respondText("Not found",
                    status = io.ktor.http.HttpStatusCode.NotFound)
            }
        }
    }
}
// => GET /users/1 => "User: Alice"
// => GET /users/3 => 404 "Not found"
```

**Key Takeaway**: `install(Koin) { modules(appModule) }` registers the DI container; `call.application.koin.get<T>()` resolves dependencies; `single { }` creates singletons and `factory { }` creates new instances per resolution.

**Why It Matters**: Manual dependency wiring in route handlers creates tight coupling and untestable code. Koin allows swapping `InMemoryUserRepository` for a real database repository in production and a mock repository in tests by changing a single line in the module definition. This is the foundation of testable architecture: route handlers depend on interfaces, not implementations. Unlike Spring's reflection-heavy injection, Koin uses pure Kotlin code (no annotations required on classes), resulting in faster startup and AOT compilation compatibility.

---

### Example 43: Koin Testing Strategy

Testing Koin-injected services requires overriding production module bindings with test implementations, enabling isolation without a real database or external services.

```kotlin
import io.insert.koin.core.*
import io.insert.koin.dsl.*
import io.ktor.server.testing.*
import kotlin.test.*

// Test double: in-memory implementation for tests
class FakeUserRepository : UserRepository {
    val users = mutableMapOf<Int, String>() // => Mutable for test setup

    override fun findById(id: Int): String? = users[id]
}

class UserServiceTest {

    @Test
    fun `getUser returns user when found`() = testApplication {
        // Override production module with test module
        val fakeRepo = FakeUserRepository().apply {
            users[1] = "TestUser"           // => Pre-populate test data
        }

        application {
            install(Koin) {
                modules(module {
                    // Override: bind interface to test implementation
                    single<UserRepository> { fakeRepo }  // => Test fake, not real DB
                    single { UserService(get()) }
                })
            }
            configureRouting()
        }

        val response = client.get("/users/1")
        assertEquals(io.ktor.http.HttpStatusCode.OK, response.status)
        assert(response.bodyAsText().contains("TestUser"))
    }

    @Test
    fun `getUser returns 404 when not found`() = testApplication {
        application {
            install(Koin) {
                modules(module {
                    single<UserRepository> { FakeUserRepository() }  // => Empty repo
                    single { UserService(get()) }
                })
            }
            configureRouting()
        }

        val response = client.get("/users/999")
        assertEquals(io.ktor.http.HttpStatusCode.NotFound, response.status)
    }
}
// => Tests run without database connection
// => FakeUserRepository provides controlled, predictable test data
// => Same route handlers tested as in production (no mock of routes themselves)
```

**Key Takeaway**: Override the Koin module in `testApplication` by installing `Koin` with test modules that bind interfaces to fake implementations; test doubles replace external dependencies without changing route handler code.

**Why It Matters**: Tests that require real database connections are slow (100-500ms per test vs 5-10ms for in-memory), fragile (database availability affects CI), and non-isolated (shared state between tests causes flakiness). By binding `UserRepository` to `FakeUserRepository` in the test Koin module, tests run in milliseconds with complete control over test data. This is the Repository Pattern's payoff: the entire business logic and route handling stack is tested through a swappable persistence boundary without real I/O.

---

## Group 9: Advanced Routing Patterns

### Example 44: Type-Safe Routing with Resources

Ktor's Resources plugin provides compile-time type-safe route definitions, eliminating string-based URL construction that can diverge from actual route definitions.

```kotlin
// build.gradle.kts: implementation("io.ktor:ktor-server-resources:3.0.3")

import io.ktor.resources.*                  // => Resource annotation
import io.ktor.server.application.*
import io.ktor.server.resources.*           // => handle, get, post extensions
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

// Resource classes represent URL structure
@Serializable
@Resource("/users")                         // => Maps to /users
class Users {

    @Serializable
    @Resource("{id}")                       // => Maps to /users/{id}
    class ById(val parent: Users = Users(), val id: Int)
                                             // => id is type-safe Int (not String)
                                             // => parent references parent resource

    @Serializable
    @Resource("search")                     // => Maps to /users/search
    class Search(
        val parent: Users = Users(),
        val name: String? = null,           // => Query parameter: /users/search?name=Alice
        val page: Int = 1
    )
}

fun Application.configureRouting() {
    install(Resources)                      // => Install Resources plugin

    routing {
        get<Users> {                        // => GET /users (type-safe)
            call.respondText("All users")
        }

        get<Users.ById> { params ->         // => GET /users/{id}
                                             // => params.id is Int (already parsed)
            call.respondText("User ${params.id}")  // => "User 42"
        }

        get<Users.Search> { params ->       // => GET /users/search?name=Alice&page=2
            call.respondText(
                "Search: name=${params.name}, page=${params.page}"
            )
        }

        post<Users> {                       // => POST /users
            call.respond(io.ktor.http.HttpStatusCode.Created)
        }
    }
}

// Type-safe URL generation (no string concatenation)
fun generateUserUrl(userId: Int): String {
    return href(Users.ById(id = userId))   // => "/users/42" - compile-time safe
                                            // => Changing Users.ById structure causes compile error
    // => String "/api/users/$userId" would silently diverge from route definition
}
// => GET /users         => "All users"
// => GET /users/42      => "User 42" (42 is Int, not String)
// => GET /users/search?name=Alice&page=2 => "Search: name=Alice, page=2"
// => href(Users.ById(id=42)) => "/users/42"
```

**Key Takeaway**: `@Resource("/path")` on data classes defines type-safe routes; `get<ResourceClass> { params -> }` handles them; `href(ResourceClass(...))` generates URLs with compile-time correctness.

**Why It Matters**: String-based URL construction in large applications eventually diverges from actual route definitions as routes are renamed or restructured. Type-safe resources make this impossible: renaming `Users.ById` to `Users.Detail` causes every `href(Users.ById(...))` call to fail compilation, forcing all URL references to update together. This eliminates the entire class of "link to nonexistent route" bugs that only manifest in testing or production. The pattern also enables IDE refactoring tools to find all usages of a route.

---

## Group 10: Content Versioning and API Design

### Example 45: API Versioning Strategies

Versioning REST APIs allows backward-incompatible changes without breaking existing clients. The three main strategies in Ktor are URL path versioning, header versioning, and query parameter versioning.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

@Serializable
data class UserV1(val id: Int, val name: String)

@Serializable
data class UserV2(val id: Int, val firstName: String, val lastName: String, val email: String)

fun Application.configureRouting() {
    routing {
        // Strategy 1: URL path versioning (most visible, easiest to test)
        route("/api/v1") {
            get("/users/{id}") {
                val id = call.parameters["id"]?.toIntOrNull() ?: return@get
                call.respond(UserV1(id, "Alice Smith"))
                // => {"id":1,"name":"Alice Smith"}
            }
        }
        route("/api/v2") {
            get("/users/{id}") {
                val id = call.parameters["id"]?.toIntOrNull() ?: return@get
                call.respond(UserV2(id, "Alice", "Smith", "alice@example.com"))
                // => {"id":1,"firstName":"Alice","lastName":"Smith","email":"alice@example.com"}
            }
        }

        // Strategy 2: Header versioning (cleaner URLs, harder to test in browser)
        get("/api/users/{id}") {
            val version = call.request.headers["Accept-Version"] ?: "v1"
                                          // => "v2" or "v1" from request header
            val id = call.parameters["id"]?.toIntOrNull() ?: return@get

            when (version) {
                "v2" -> call.respond(UserV2(id, "Alice", "Smith", "alice@example.com"))
                else -> call.respond(UserV1(id, "Alice Smith"))  // => Default to v1
            }
        }

        // Strategy 3: Query parameter versioning (easiest to add, clutters URLs)
        get("/api/users") {
            val version = call.request.queryParameters["version"] ?: "1"
            when (version) {
                "2" -> call.respondText("UserV2 list format")
                else -> call.respondText("UserV1 list format")
            }
        }
    }
}
// URL versioning:
// => GET /api/v1/users/1 => {"id":1,"name":"Alice Smith"}
// => GET /api/v2/users/1 => {"id":1,"firstName":"Alice","lastName":"Smith","email":"..."}
// Header versioning:
// => GET /api/users/1 Accept-Version: v2 => {"id":1,"firstName":"Alice",...}
// => GET /api/users/1 (no header)        => {"id":1,"name":"Alice Smith"}
```

**Key Takeaway**: URL path versioning (`/api/v1`, `/api/v2`) is the most explicit and cacheable strategy; header versioning keeps URLs clean but requires deliberate header setting in clients; always provide a default version for requests without a version indicator.

**Why It Matters**: Breaking existing API clients in production causes outages for partners and mobile app users who cannot update immediately. Versioning allows parallel evolution: v1 remains stable while v2 introduces breaking changes. URL versioning is the most visible approach and works naturally with HTTP caches and API gateways that route by URL. Production APIs maintain older versions for a defined deprecation window (typically 6-12 months), with sunset dates communicated in `Sunset` response headers to give clients time to migrate.

---

## Group 11: Error Handling Patterns

### Example 46: Structured Error Responses

Production APIs need consistent, machine-parseable error responses that include enough context for clients to take corrective action without exposing internal implementation details.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

// RFC 7807 Problem Details format for structured error responses
@Serializable
data class ProblemDetail(
    val type: String,         // => URI identifying the error type
    val title: String,        // => Human-readable summary (stable, not instance-specific)
    val status: Int,          // => HTTP status code
    val detail: String,       // => Instance-specific human-readable explanation
    val instance: String? = null  // => URI of the specific occurrence (e.g., request ID)
)

// Domain-specific exceptions
class ResourceNotFoundException(val resourceType: String, val id: String)
    : RuntimeException("$resourceType with id=$id not found")

class BusinessRuleViolationException(val rule: String, override val message: String)
    : RuntimeException(message)

fun Application.configureErrorHandling() {
    install(StatusPages) {
        exception<ResourceNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ProblemDetail(
                    type = "https://myapi.com/problems/not-found",
                    title = "Resource Not Found",
                    status = 404,
                    detail = "${cause.resourceType} '${cause.id}' does not exist",
                    instance = call.request.uri
                )
            )
        }

        exception<BusinessRuleViolationException> { call, cause ->
            call.respond(
                HttpStatusCode.UnprocessableEntity,
                ProblemDetail(
                    type = "https://myapi.com/problems/${cause.rule}",
                    title = "Business Rule Violation",
                    status = 422,
                    detail = cause.message ?: "Business rule violated"
                )
            )
        }

        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled exception on ${call.request.uri}", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ProblemDetail(
                    type = "https://myapi.com/problems/internal-error",
                    title = "Internal Server Error",
                    status = 500,
                    detail = "An unexpected error occurred. Please try again later."
                    // => Never include cause.message: may expose internal paths, SQL, secrets
                )
            )
        }
    }
}

fun Application.configureRouting() {
    routing {
        get("/orders/{id}") {
            val id = call.parameters["id"] ?: throw ResourceNotFoundException("Order", "null")
            if (id.length > 20) throw BusinessRuleViolationException(
                "order-id-too-long", "Order ID must not exceed 20 characters"
            )
            call.respondText("Order $id")
        }
    }
}
// => GET /orders/NONEXISTENT
//    => 404 {"type":"...not-found","title":"Resource Not Found","status":404,"detail":"Order 'NONEXISTENT' does not exist","instance":"/orders/NONEXISTENT"}
// => GET /orders/TOOLONGIDTHATEXCEEDSLIMIT
//    => 422 {"type":"...order-id-too-long","title":"Business Rule Violation",...}
```

**Key Takeaway**: Use RFC 7807 Problem Details format for structured errors; domain-specific exception classes carry typed context; catch-all handlers log internally but never expose internal details to clients.

**Why It Matters**: Inconsistent error responses force API client developers to write ad-hoc parsing for each error scenario. RFC 7807 Problem Details provides a standard schema that libraries and tools understand natively. The `type` URI links to documentation, enabling self-service error resolution. Never returning `cause.message` in production prevents accidental leakage of database connection strings, file system paths, or stack traces that attackers use to map your infrastructure. Log everything internally but surface only safe, structured information externally.

---

## Group 12: Background Processing

### Example 47: Background Coroutines from Route Handlers

Route handlers sometimes trigger operations that should not block the response: sending emails, processing uploads, updating analytics. Launching coroutines in the application scope enables fire-and-forget tasks.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.coroutines.*

fun Application.configureRouting() {
    routing {
        post("/orders") {
            val orderId = "order-${System.currentTimeMillis()}"

            // Respond immediately - don't make client wait for email
            call.respond(
                HttpStatusCode.Created,
                mapOf("orderId" to orderId, "status" to "processing")
            )
            // => Client receives response immediately

            // Launch background processing AFTER responding
            // Use application scope, NOT coroutineScope (which ties to handler lifecycle)
            call.application.launch {      // => Launches in application's coroutine scope
                                            // => Survives after route handler completes
                try {
                    delay(100)             // => Simulate async processing (replace with real work)
                    // sendConfirmationEmail(orderId)  // => Email sending
                    // updateInventory(orderId)        // => Inventory update
                    // notifyWarehouse(orderId)        // => Warehouse notification
                    application.environment.log.info("Order $orderId processed")
                } catch (e: Exception) {
                    // Log but don't crash the application
                    application.environment.log.error("Failed to process order $orderId", e)
                }
            }
            // => Handler returns after responding; background job continues independently
        }
    }
}
// => POST /orders => 201 {"orderId":"order-1234","status":"processing"} (immediate)
// => Background: order processing runs after response sent
// => If background task fails: logged but client already received 201
```

**Key Takeaway**: Use `call.application.launch { }` (application scope) for background tasks that outlive the route handler; never use `CoroutineScope(Dispatchers.IO).launch { }` which creates unstructured coroutines without lifecycle management.

**Why It Matters**: Blocking a route handler on email sending, external API calls, or heavy computation degrades all concurrent users' response times. Fire-and-forget via application scope ensures the background task is structured: it cancels cleanly when the application shuts down, preventing tasks from running against a shutting-down database. The `try-catch` in background tasks is non-optional: an unhandled exception in a launched coroutine propagates to its scope handler, potentially crashing the application. Always design background tasks to be idempotent in case they need retry logic.

---

## Group 13: Serialization Patterns

### Example 48: Polymorphic Serialization

APIs often return heterogeneous collections where each item has a different shape based on type. kotlinx.serialization's polymorphic serialization handles sealed class hierarchies automatically.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.*

// Sealed class hierarchy for polymorphic events
@Serializable
sealed class Event {
    abstract val id: String
    abstract val timestamp: Long
}

@Serializable
data class UserCreatedEvent(
    override val id: String,
    override val timestamp: Long,
    val userId: String,
    val email: String
) : Event()

@Serializable
data class OrderPlacedEvent(
    override val id: String,
    override val timestamp: Long,
    val orderId: String,
    val amount: Double
) : Event()

// Serialization module registers polymorphic mappings
val eventModule = SerializersModule {
    polymorphic(Event::class) {
        subclass(UserCreatedEvent::class)   // => Register concrete types
        subclass(OrderPlacedEvent::class)
    }
}

fun Application.configureContentNegotiation() {
    install(ContentNegotiation) {
        json(Json {
            serializersModule = eventModule  // => Register polymorphic mappings
            classDiscriminator = "type"      // => JSON field that identifies the subtype
                                              // => default is "type"
        })
    }
}

fun Application.configureRouting() {
    routing {
        get("/events") {
            val events: List<Event> = listOf(
                UserCreatedEvent("evt-1", 1710000000000L, "user-42", "alice@example.com"),
                OrderPlacedEvent("evt-2", 1710000001000L, "order-99", 149.99)
            )
            call.respond(events)            // => Serializes with "type" discriminator
        }
    }
}
// => GET /events
// => [
// =>   {"type":"com.example.UserCreatedEvent","id":"evt-1","timestamp":...,"userId":"user-42","email":"alice@example.com"},
// =>   {"type":"com.example.OrderPlacedEvent","id":"evt-2","timestamp":...,"orderId":"order-99","amount":149.99}
// => ]
```

**Key Takeaway**: `SerializersModule { polymorphic(Base::class) { subclass(Concrete::class) } }` enables automatic type discriminator injection; sealed class hierarchies with `@Serializable` are the idiomatic Kotlin pattern for typed unions.

**Why It Matters**: Event-driven architectures and activity feeds return heterogeneous response arrays where type determines which fields are present. Without polymorphic serialization, developers resort to `Any` types with manual parsing, losing type safety. The `classDiscriminator` field lets API clients perform pattern matching on the type field to dispatch event handling. Sealed classes are exhaustively checkable at compile time, preventing handlers from silently ignoring new event types added by the server.

---

## Group 14: Middleware Composition

### Example 49: Pipeline Interception

Ktor's request processing uses a pipeline of phases. Intercepting specific phases enables fine-grained control over request processing, enabling use cases like request transformation, rate limiting, and response modification.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.pipeline.*
import io.ktor.http.*

fun Application.configureInterceptors() {
    // Intercept the Call phase of the Application pipeline
    // This runs for every request before routing
    intercept(ApplicationCallPipeline.Plugins) {  // => Plugins phase: before routing
        val startTime = System.currentTimeMillis()  // => Record request start time

        // Continue pipeline execution
        proceed()                                  // => Call next interceptor / route handler
                                                    // => Code after proceed() runs AFTER handler

        // After response: calculate and log duration
        val duration = System.currentTimeMillis() - startTime
        val status = call.response.status()?.value ?: 0

        // Add timing header to response (after proceed returns)
        call.response.headers.append("X-Response-Time", "${duration}ms")

        application.environment.log.debug(
            "${call.request.httpMethod.value} ${call.request.uri} => $status (${duration}ms)"
        )
    }
}

fun Application.configureRouting() {
    routing {
        get("/slow") {
            kotlinx.coroutines.delay(50)   // => Simulate slow handler
            call.respondText("Done")
        }
        get("/fast") {
            call.respondText("Fast response")
        }
    }
}
// => GET /slow => 200 "Done" + header X-Response-Time: 50ms
// => GET /fast => 200 "Fast response" + header X-Response-Time: 1ms
// => Both requests logged with duration
```

**Key Takeaway**: `intercept(ApplicationCallPipeline.Plugins) { proceed(); /* post-handler */ }` creates request/response middleware; code before `proceed()` runs pre-handler; code after runs post-handler.

**Why It Matters**: Pipeline interception exposes Ktor's internal processing model, enabling precisely targeted middleware placement. Unlike Express middleware chaining where order is implicit, Ktor's phase-based pipeline makes execution order explicit and auditable. The timing interceptor pattern provides accurate end-to-end request duration measurement including serialization time - more accurate than measuring only inside the handler. Production observability systems use this pattern to attach trace spans, measure per-endpoint P99 latency, and detect anomalous request processing times.

---

## Group 15: Health and Readiness

### Example 50: Health Check and Readiness Endpoints

Production services require health and readiness endpoints for orchestration systems (Kubernetes, load balancers). Health checks verify liveness; readiness checks verify ability to serve traffic.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

@Serializable
data class HealthStatus(
    val status: String,                  // => "UP" or "DOWN"
    val components: Map<String, String>  // => Per-component status
)

// Simulate checking database connectivity
suspend fun checkDatabase(): Boolean {
    // In production: execute SELECT 1 and return true if it completes
    return true  // => Simulate healthy database
}

// Application-level readiness flag (set to false during graceful shutdown)
var isReady = true

fun Application.configureHealthChecks() {
    routing {
        // Liveness: is the JVM alive and not deadlocked?
        // Kubernetes restarts pod if this returns non-2xx
        get("/health/live") {
            call.respond(HttpStatusCode.OK, mapOf("status" to "UP"))
            // => Returns 200 as long as application is running
            // => Rarely fails (only if JVM deadlock or OOM)
        }

        // Readiness: can the service accept traffic?
        // Kubernetes removes pod from load balancer if this returns non-2xx
        get("/health/ready") {
            val dbHealthy = checkDatabase()  // => Check DB connectivity
            val allHealthy = dbHealthy && isReady

            if (allHealthy) {
                call.respond(
                    HttpStatusCode.OK,
                    HealthStatus(
                        status = "UP",
                        components = mapOf("database" to "UP")
                    )
                )
            } else {
                call.respond(
                    HttpStatusCode.ServiceUnavailable,    // => HTTP 503
                    HealthStatus(
                        status = "DOWN",
                        components = mapOf(
                            "database" to if (dbHealthy) "UP" else "DOWN"
                        )
                    )
                )
            }
        }

        // Startup: has the application finished initialization?
        // Kubernetes won't route traffic until this returns 2xx
        get("/health/startup") {
            // Return 200 after all initialization complete
            // Return 503 while initializing (e.g., loading caches)
            call.respond(HttpStatusCode.OK, mapOf("initialized" to true))
        }
    }
}
// => GET /health/live    => 200 {"status":"UP"} (always if running)
// => GET /health/ready   => 200 {"status":"UP","components":{"database":"UP"}}
// => GET /health/ready   => 503 {"status":"DOWN",...} if DB unreachable
// => GET /health/startup => 200 {"initialized":true}
```

**Key Takeaway**: Implement separate `/health/live`, `/health/ready`, and `/health/startup` endpoints for different Kubernetes probe types; readiness returns 503 when dependencies (database, external services) are unavailable.

**Why It Matters**: Without separate liveness and readiness probes, Kubernetes cannot distinguish between a JVM that needs restarting (liveness failure) and a temporarily overloaded service that should stop receiving traffic but not restart (readiness failure). Restarting on readiness failures causes cascading failures during database outages - all instances restart simultaneously, lose warm caches, and overwhelm the recovering database. Correct health endpoints are the foundation of zero-downtime deployments and graceful degradation during dependency outages.

---

## Group 16: Server-Sent Events

### Example 51: Server-Sent Events (SSE)

Server-Sent Events provide unidirectional server-to-client streaming over HTTP. Unlike WebSocket, SSE uses standard HTTP and automatically reconnects if the connection drops.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun Application.configureRouting() {
    routing {
        // SSE endpoint: streams events to client
        get("/sse/prices") {
            call.response.cacheControl(CacheControl.NoCache(null))  // => Disable caching
            call.response.headers.append(HttpHeaders.Connection, "keep-alive")

            // respondTextWriter streams text without buffering
            call.respondTextWriter(ContentType.Text.EventStream) {
                // 'this' is a Writer for the response body
                var priceCount = 0

                while (true) {            // => Stream until client disconnects
                    priceCount++
                    val price = 100.0 + kotlin.random.Random.nextDouble(0.0, 10.0)

                    // SSE format: each event is lines ending in \n\n
                    write("id: $priceCount\n")          // => Event ID (for reconnection)
                    write("event: price-update\n")       // => Event type (JS uses this)
                    write("data: {\"price\": ${"%.2f".format(price)}}\n")
                    write("\n")                          // => Double newline ends the event
                    flush()                              // => Send immediately (don't buffer)
                    // => Client receives: event: price-update\ndata: {"price": 105.32}\n\n

                    delay(1000)           // => Emit new price every second
                    // => delay() is a suspend function; no thread blocked

                    if (isCoroutineActive.not()) break  // => Stop if client disconnected
                }
            }
        }

        // Client-side JavaScript:
        // const eventSource = new EventSource('/sse/prices');
        // eventSource.addEventListener('price-update', (e) => {
        //     const data = JSON.parse(e.data);
        //     console.log('Price:', data.price);
        // });
    }
}
// => GET /sse/prices (SSE client)
// => Stream: id:1\nevent:price-update\ndata:{"price":105.32}\n\n
// =>         id:2\nevent:price-update\ndata:{"price":103.78}\n\n
// =>         ... (continues indefinitely until client closes)
```

**Key Takeaway**: `call.respondTextWriter(ContentType.Text.EventStream) { write("data: ...\n\n"); flush() }` implements SSE; each event ends with double newline; `flush()` is required to send events immediately rather than buffering.

**Why It Matters**: SSE is preferable to WebSocket for unidirectional streaming (dashboard metrics, live feeds, progress notifications) because it works over plain HTTP/1.1, traverses firewalls and proxies without special configuration, and reconnects automatically. Browsers limit concurrent WebSocket connections per domain but allow many more SSE connections. For use cases like financial data feeds, build progress monitoring, and live activity streams, SSE's simplicity and reliability outweigh WebSocket's bidirectional capability.

---

## Group 17: Additional Intermediate Patterns

### Example 52: Call ID and Distributed Tracing Basics

Call IDs enable correlating log entries and distributed traces across services. The CallId plugin generates and propagates a unique identifier for every HTTP request.

```kotlin
// build.gradle.kts: implementation("io.ktor:ktor-server-call-id:3.0.3")

import io.ktor.server.application.*
import io.ktor.server.plugins.callid.*    // => CallId plugin
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureCallId() {
    install(CallId) {                      // => Install Call ID plugin
        // Where to look for an existing request ID (in order)
        retrieveFromHeader("X-Request-ID")  // => Use client-provided ID if present
        retrieveFromHeader("X-Correlation-ID")  // => Alternative header name

        // Generate a new ID if not provided by client
        generate {                          // => Called when no header found
            java.util.UUID.randomUUID().toString()  // => "550e8400-e29b-41d4-a716-..."
        }

        // Verify the ID format (reject spoofed IDs with invalid format)
        verify { callId ->
            callId.isNotEmpty() && callId.length <= 64  // => Basic length validation
        }

        // Send ID back in response header
        replyToHeader("X-Request-ID")       // => Adds X-Request-ID to every response
    }

    install(CallLogging) {
        // Add call ID to every log line (MDC)
        callIdMdc("requestId")             // => MDC key "requestId" = call ID value
                                            // => All log lines for this request include requestId
    }
}

fun Application.configureRouting() {
    routing {
        get("/demo") {
            val callId = call.callId        // => Access the call ID from route handler
            call.respondText("Call ID: $callId")
            // => Logs for this request automatically include requestId
        }
    }
}
// => GET /demo (with X-Request-ID: my-trace-123)
//    Response: X-Request-ID: my-trace-123 (echoed back)
//    Body: "Call ID: my-trace-123"
//    Log: INFO ...  [requestId=my-trace-123] ...
// => GET /demo (no X-Request-ID header)
//    Response: X-Request-ID: 550e8400-e29b-41d4-a716-... (generated)
```

**Key Takeaway**: `install(CallId) { retrieveFromHeader(...); generate { ... }; replyToHeader(...) }` automatically assigns a unique ID to every request; `callIdMdc("key")` adds it to all log lines for the request.

**Why It Matters**: Distributed systems generate thousands of log lines per second across multiple services and instances. Without a request ID on every log line, correlating the user-facing error with the specific database query that failed requires guessing based on timestamps. Request IDs propagate from frontend (user's browser) through API gateway, microservices, and database logs, enabling an entire transaction to be traced in one log query. This capability reduces mean time to diagnosis from hours to minutes during production incidents.

---

### Example 53: Graceful Shutdown

Production applications must stop accepting new requests and finish processing in-flight requests before shutting down, preventing data corruption and client errors during deployments.

```kotlin
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.*

fun main() {
    val server = embeddedServer(Netty, port = 8080) {
        routing {
            get("/") { call.respondText("Hello") }
        }
    }

    // Register JVM shutdown hook (triggered by SIGTERM or SIGINT)
    Runtime.getRuntime().addShutdownHook(Thread {
        // This code runs in a separate thread when JVM shuts down
        println("Shutdown signal received...")

        runBlocking {
            // Stop accepting new connections immediately
            // Let existing requests complete up to gracePeriodMillis
            server.stop(
                gracePeriodMillis = 5_000L,  // => Wait up to 5s for in-flight requests
                timeoutMillis = 10_000L      // => Force stop after 10s if grace period exceeded
            )
            // => After gracePeriodMillis: stop accepting new requests
            // => After timeoutMillis: forcefully close remaining connections
        }
        println("Server stopped gracefully")
    })

    server.start(wait = true)              // => Blocks until server.stop() called
}

// For Kubernetes: handle SIGTERM gracefully
// Kubernetes sends SIGTERM first, then SIGKILL after terminationGracePeriodSeconds
// => Set terminationGracePeriodSeconds > timeoutMillis in pod spec
// => Ktor's stop() runs during SIGTERM; JVM exits before SIGKILL arrives

// resources/application.conf for configured shutdown:
// ktor {
//   deployment {
//     shutdownUrl = "/shutdown"  # Enables POST /shutdown endpoint (dev only)
//   }
// }
```

**Key Takeaway**: Register a JVM shutdown hook that calls `server.stop(gracePeriodMillis, timeoutMillis)`; `gracePeriodMillis` allows in-flight requests to complete; `timeoutMillis` is the hard cutoff for force shutdown.

**Why It Matters**: Kubernetes rolling deployments send SIGTERM to pods being replaced. Without graceful shutdown, the pod immediately drops all in-flight HTTP requests, causing 502 errors for users whose requests happened to be processing during the deployment. With graceful shutdown, the pod drains: the load balancer stops routing new requests, existing requests finish, then the pod exits cleanly. Production deployments with graceful shutdown achieve zero-downtime releases. The 5-second grace period should exceed your slowest expected request processing time (consider long-running uploads or database transactions).

---

### Example 54: Pagination Pattern

Paginating large result sets is essential for performance. The cursor-based approach handles concurrent insertions better than offset-based pagination.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PagedResponse<T>(
    val data: List<T>,
    val meta: PageMeta
)

@Serializable
data class PageMeta(
    val total: Long,             // => Total items matching the query
    val page: Int,               // => Current page number (1-based)
    val pageSize: Int,           // => Items per page
    val hasNext: Boolean,        // => Whether a next page exists
    val nextCursor: String?      // => Cursor for next page (cursor-based alternative)
)

@Serializable
data class ItemDto(val id: Int, val name: String)

// Simulated data store
val allItems = (1..200).map { ItemDto(it, "Item $it") }

fun Application.configureRouting() {
    routing {
        // Offset-based pagination: simple but has gaps/duplicates with concurrent writes
        get("/items") {
            val page = call.request.queryParameters["page"]
                ?.toIntOrNull()?.coerceAtLeast(1) ?: 1    // => Min page=1, default 1
            val pageSize = call.request.queryParameters["pageSize"]
                ?.toIntOrNull()?.coerceIn(1, 100) ?: 20   // => 1-100, default 20

            val offset = (page - 1) * pageSize             // => Skip (page-1) pages
            val items = allItems
                .drop(offset)                              // => Skip offset items
                .take(pageSize)                            // => Take pageSize items

            call.respond(PagedResponse(
                data = items,
                meta = PageMeta(
                    total = allItems.size.toLong(),         // => 200 total
                    page = page,
                    pageSize = pageSize,
                    hasNext = offset + pageSize < allItems.size,
                    nextCursor = null                      // => Null for offset pagination
                )
            ))
        }
    }
}
// => GET /items?page=1&pageSize=5
// => {"data":[{"id":1,"name":"Item 1"},...,{"id":5,"name":"Item 5"}],
// =>  "meta":{"total":200,"page":1,"pageSize":5,"hasNext":true,"nextCursor":null}}
// => GET /items?page=2&pageSize=5
// => {"data":[{"id":6,"name":"Item 6"},...,{"id":10,"name":"Item 10"}],"meta":{...}}
```

**Key Takeaway**: Return a `meta` object alongside data with `total`, `hasNext`, and current `page`; use `coerceIn(1, 100)` to constrain `pageSize` to a safe maximum, preventing clients from requesting all 10 million items.

**Why It Matters**: APIs without pagination return unbounded result sets. A table growing from 10,000 to 10,000,000 rows without pagination changes a fast query into a minutes-long scan that OOMs the JVM and saturates the database. Enforcing `pageSize` maximums prevents clients from accidentally or maliciously bypassing pagination. The `hasNext` field in the meta object is more mobile-friendly than computing the total count for every request - calculating total counts requires a `COUNT(*)` query that gets expensive on large tables with complex filters.

---

### Example 55: Compression and Chunked Response

Chunked transfer encoding enables streaming large responses to clients progressively, reducing time-to-first-byte for reports and exports.

```kotlin
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.coroutines.delay

fun Application.configureRouting() {
    routing {
        // Stream a large CSV export without loading all rows into memory
        get("/export/users") {
            call.response.headers.append(
                HttpHeaders.ContentDisposition,   // => Prompt browser to download
                "attachment; filename=\"users.csv\""
            )

            // respondTextWriter streams chunked without buffering entire response
            call.respondTextWriter(
                ContentType.Text.CSV,             // => text/csv content type
                status = HttpStatusCode.OK
            ) {
                // Write CSV header row
                write("id,name,email,created_at\n")
                flush()                            // => Send header immediately

                // Simulate streaming rows from database
                for (i in 1..1000) {               // => 1000 rows (replace with DB cursor)
                    write("$i,User$i,user$i@example.com,${System.currentTimeMillis()}\n")
                    if (i % 100 == 0) {
                        flush()                    // => Flush every 100 rows
                                                    // => Client receives chunks progressively
                        delay(10)                  // => Simulate DB fetch time
                    }
                }
                // => No need to flush at end; respondTextWriter flushes on close
            }
        }
    }
}
// => GET /export/users
//    Content-Disposition: attachment; filename="users.csv"
//    Transfer-Encoding: chunked
//    Body streams: id,name,email,...\n1,User1,...\n2,User2,...\n...
// => Client sees data downloading progressively (not waiting for all 1000 rows)
```

**Key Takeaway**: `call.respondTextWriter(contentType) { write(...); flush() }` streams responses chunked without buffering; `flush()` every N rows sends partial data to the client progressively.

**Why It Matters**: Loading 100,000 CSV rows into memory before responding causes OOM errors and 30-second blank download screens. Streaming with chunked transfer encoding starts delivering data to the client immediately, providing download progress feedback and reducing peak memory usage from O(N) to O(chunk size). This pattern enables large data exports that would be impossible with buffered responses. Database cursors combined with this streaming response pattern keep both memory and database connections efficient during large exports.
