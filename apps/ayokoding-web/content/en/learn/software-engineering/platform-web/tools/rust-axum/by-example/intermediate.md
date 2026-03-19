---
title: "Intermediate"
weight: 10000002
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master production Rust Axum patterns through 28 annotated examples covering SQLx database integration, JWT authentication, CORS, rate limiting, WebSockets, SSE, testing, graceful shutdown, and tracing"
tags: ["axum", "rust", "web-framework", "tutorial", "by-example", "intermediate", "sqlx", "jwt", "websockets", "tracing", "testing"]
---

## Group 13: Database Integration with SQLx

### Example 28: SQLx Connection Pool Setup

SQLx provides compile-time checked SQL queries and async database access. Set up a `PgPool` in `AppState` so all handlers share the same connection pool.

```mermaid
graph TD
    A["App Startup"] --> B["PgPool::connect_with<br/>max_connections: 10"]
    B --> C["Arc#60;AppState#62;<br/>db_pool: PgPool"]
    C --> D["Handler A<br/>State#60;AppState#62;"]
    C --> E["Handler B<br/>State#60;AppState#62;"]
    D --> F["pool.acquire#40;#41;<br/>Connection from Pool"]
    E --> F

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```rust
// Cargo.toml:
// sqlx = { version = "0.8", features = ["postgres", "runtime-tokio", "macros"] }
// axum = "0.8"
// tokio = { version = "1", features = ["full"] }

use axum::{extract::State, routing::get, Json, Router};
use sqlx::{PgPool, postgres::PgPoolOptions};  // => PostgreSQL pool
use std::sync::Arc;

// AppState holds the connection pool - shared across all handlers
#[derive(Clone)]
struct AppState {
    db: PgPool,  // => PgPool is already Arc-wrapped internally; Clone is cheap
}

// Simple row structure for a SELECT query
#[derive(sqlx::FromRow, serde::Serialize)]  // => FromRow: map DB rows to struct
struct User {
    id: i64,         // => PostgreSQL BIGINT or SERIAL
    username: String, // => PostgreSQL TEXT or VARCHAR
    email: String,
}

async fn list_users(
    State(state): State<Arc<AppState>>,  // => Inject pool from state
) -> Result<Json<Vec<User>>, axum::http::StatusCode> {
    let users = sqlx::query_as::<_, User>(
        "SELECT id, username, email FROM users ORDER BY id LIMIT 50"
        // => query_as maps each row to User via FromRow derive
        // => Compile-time checks if SQLX_OFFLINE=true (requires sqlx-data.json)
    )
    .fetch_all(&state.db)              // => Execute query, get Vec<User>
    .await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    // => DB error → 500 Internal Server Error

    Ok(Json(users))                    // => 200 OK with JSON array
}

#[tokio::main]
async fn main() {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://user:pass@localhost/mydb".into());
    // => DATABASE_URL from environment - never hardcode credentials

    let pool = PgPoolOptions::new()
        .max_connections(10)           // => Max 10 concurrent DB connections
        .min_connections(2)            // => Keep 2 connections warm
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");
    // => Panics on startup if DB unreachable - fail fast is correct here

    let state = Arc::new(AppState { db: pool });

    let app = Router::new()
        .route("/users", get(list_users))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Store `PgPool` in `AppState`; `PgPool` is internally `Arc`-wrapped so it is cheap to clone. Use `PgPoolOptions` to configure pool size based on expected concurrency.

**Why It Matters**: Connection pooling is the foundation of database performance in production. Without pooling, each request would open and close a database connection—a 10-50ms overhead per request. A pool of 10 connections can serve hundreds of concurrent requests through connection reuse. The `max_connections` setting protects your database from being overwhelmed: PostgreSQL has a default limit of 100 connections, and exceeding it causes connection errors for new clients.

---

### Example 29: SQLx CRUD Operations

Implement complete Create, Read, Update, Delete operations using SQLx's `query!` and `query_as!` macros.

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
struct AppState { db: PgPool }

#[derive(Serialize, sqlx::FromRow)]
struct Post {
    id: i64,
    title: String,
    body: String,
}

#[derive(Deserialize)]
struct CreatePost {
    title: String,  // => Required: title of the post
    body: String,   // => Required: post content
}

#[derive(Deserialize)]
struct UpdatePost {
    title: Option<String>,  // => Optional partial update
    body: Option<String>,   // => Only provided fields are updated
}

// CREATE
async fn create_post(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreatePost>,
) -> Result<(StatusCode, Json<Post>), StatusCode> {
    let post = sqlx::query_as::<_, Post>(
        "INSERT INTO posts (title, body) VALUES ($1, $2) RETURNING id, title, body"
        // => $1, $2 are positional placeholders (PostgreSQL syntax)
        // => RETURNING fetches the inserted row in one query
    )
    .bind(&payload.title)   // => Bind $1 = title (prevents SQL injection)
    .bind(&payload.body)    // => Bind $2 = body
    .fetch_one(&state.db)   // => Execute and return single row
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(post)))  // => 201 Created + new post
}

// READ
async fn get_post(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<Post>, StatusCode> {
    let post = sqlx::query_as::<_, Post>("SELECT id, title, body FROM posts WHERE id = $1")
        .bind(id)               // => Safe parameterized query
        .fetch_optional(&state.db)  // => Returns Option<Post>
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;  // => None → 404 Not Found

    Ok(Json(post))
}

// UPDATE
async fn update_post(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePost>,
) -> Result<Json<Post>, StatusCode> {
    // Build SET clause dynamically for partial updates
    let post = sqlx::query_as::<_, Post>(
        "UPDATE posts SET
            title = COALESCE($1, title),
            body  = COALESCE($2, body)
         WHERE id = $3 RETURNING id, title, body"
        // => COALESCE($1, title): use $1 if not null, else keep existing value
        // => Implements partial update without multiple queries
    )
    .bind(&payload.title)    // => $1: new title or NULL
    .bind(&payload.body)     // => $2: new body or NULL
    .bind(id)                // => $3: row ID
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(post))
}

// DELETE
async fn delete_post(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM posts WHERE id = $1")
        .bind(id)
        .execute(&state.db)    // => execute() for queries with no return rows
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {  // => rows_affected() = 0 means no row matched
        return Err(StatusCode::NOT_FOUND);
    }
    Ok(StatusCode::NO_CONTENT)  // => 204 No Content - successful delete
}

#[tokio::main]
async fn main() {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await.unwrap();
    let state = Arc::new(AppState { db: pool });
    let app = Router::new()
        .route("/posts", post(create_post))
        .route("/posts/:id", get(get_post).put(update_post).delete(delete_post));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `fetch_optional` + `.ok_or(StatusCode::NOT_FOUND)` for queries that return zero or one row. Use `rows_affected() == 0` to detect missing records in DELETE.

**Why It Matters**: Correct HTTP semantics for CRUD operations make APIs predictable for clients. Returning `404` when a record does not exist (instead of `200` with empty data) enables clients to distinguish "not found" from "found empty list." The `RETURNING` clause in PostgreSQL combines INSERT/UPDATE and SELECT in one network round-trip, halving latency for write operations. The `COALESCE`-based partial update pattern avoids fetching the record before updating it.

---

### Example 30: SQLx Database Transactions

Transactions ensure multiple database operations succeed or fail atomically. Use SQLx's `begin()` to start a transaction and commit or rollback explicitly.

```rust
use axum::{
    extract::{Json, State},
    http::StatusCode,
    routing::post,
    Router,
};
use sqlx::PgPool;
use serde::Deserialize;
use std::sync::Arc;

#[derive(Clone)]
struct AppState { db: PgPool }

#[derive(Deserialize)]
struct TransferRequest {
    from_account: i64,   // => Debit this account
    to_account: i64,     // => Credit this account
    amount: i64,         // => Amount in cents (use integers for money)
}

async fn transfer_funds(
    State(state): State<Arc<AppState>>,
    Json(req): Json<TransferRequest>,
) -> Result<StatusCode, StatusCode> {
    // Start a database transaction
    let mut tx = state.db.begin()     // => Acquires a connection and begins transaction
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Step 1: Debit the sender
    let rows = sqlx::query(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1"
        // => Atomic debit: only succeeds if sufficient funds
        // => balance >= $1 prevents overdraft in a single query
    )
    .bind(req.amount)
    .bind(req.from_account)
    .execute(&mut *tx)           // => Execute within the transaction
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if rows.rows_affected() == 0 {
        tx.rollback().await.ok();   // => Insufficient funds - roll back
        return Err(StatusCode::UNPROCESSABLE_ENTITY);  // => 422
    }

    // Step 2: Credit the receiver (within same transaction)
    sqlx::query("UPDATE accounts SET balance = balance + $1 WHERE id = $2")
        .bind(req.amount)
        .bind(req.to_account)
        .execute(&mut *tx)          // => Same transaction - both succeed or both fail
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Commit: both operations succeeded
    tx.commit()                     // => Makes both updates permanent atomically
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)              // => 200: transfer successful
    // => If handler returns Err before commit, tx drops and auto-rollbacks
}

#[tokio::main]
async fn main() {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await.unwrap();
    let state = Arc::new(AppState { db: pool });
    let app = Router::new().route("/transfer", post(transfer_funds));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `pool.begin()` to start a transaction, pass `&mut *tx` to queries, and call `.commit()` on success. SQLx automatically rolls back if the transaction is dropped without committing.

**Why It Matters**: Financial operations require atomicity—a partial transfer (debit without credit) corrupts account balances. Database transactions are the only correct mechanism: without them, a crash between two `UPDATE` statements creates a permanent inconsistency no amount of application logic can detect or repair. SQLx's automatic rollback-on-drop provides a safety net even when error handling code omits explicit rollback calls.

---

## Group 14: Authentication

### Example 31: Password Hashing with Argon2

Never store plaintext passwords. Use Argon2 (via the `argon2` crate) to hash passwords during registration and verify them during login.

```rust
// Cargo.toml:
// argon2 = "0.5"
// axum = "0.8"

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,  // => Argon2 hasher (Argon2id variant is the default, recommended)
};

// Hash a password during user registration
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);  // => Cryptographically random salt
                                                    // => Unique per password - prevents rainbow tables
    let argon2 = Argon2::default();               // => Argon2id with secure default parameters
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)?  // => Compute hash
        .to_string();                                  // => Store this string in DB
    // => hash format: "$argon2id$v=19$m=65536,t=3,p=4$salt$hash"
    // => Embeds algorithm, parameters, salt, and hash in one string
    Ok(hash)
}

// Verify a password during login
fn verify_password(password: &str, hash: &str) -> bool {
    let parsed_hash = PasswordHash::new(hash)       // => Parse stored hash string
        .expect("Invalid hash format in database");  // => DB corruption if this panics
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)  // => Recompute and compare
        .is_ok()                                              // => true if match
    // => Constant-time comparison prevents timing attacks
}

// Example usage in a registration handler
async fn register_example() {
    let password = "user-secret-password";
    let hash = hash_password(password).unwrap();
    println!("Hash: {}", &hash[..40]);  // => "$argon2id$v=19$m=65536,t=3,p=4..." (truncated)

    let valid = verify_password(password, &hash);
    println!("Valid: {}", valid);    // => "Valid: true"

    let invalid = verify_password("wrong-password", &hash);
    println!("Invalid: {}", invalid); // => "Invalid: false"
}

#[tokio::main]
async fn main() {
    register_example().await;
}
```

**Key Takeaway**: Use `Argon2::default()` for hashing and `verify_password()` for checking. The hash string embeds all parameters needed for verification—store only the hash, never the plaintext.

**Why It Matters**: Argon2id is the current gold standard for password hashing—winner of the 2015 Password Hashing Competition and recommended by OWASP. Its memory-hardness (65MB by default) makes GPU-based brute-force attacks 1000x more expensive than bcrypt. Unique salts mean two users with identical passwords have different hashes, defeating precomputed rainbow table attacks. A breach of your database exposes only slow-to-crack hashes, giving users time to change passwords.

---

### Example 32: JWT Authentication

JSON Web Tokens (JWT) enable stateless authentication. Use the `jsonwebtoken` crate to generate tokens during login and validate them on subsequent requests.

```rust
// Cargo.toml:
// jsonwebtoken = "9"
// serde = { version = "1", features = ["derive"] }

use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

// JWT claims - the payload embedded in the token
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,   // => Subject: user ID or email (standard JWT field)
    role: String,  // => Custom claim: user role for authorization
    exp: u64,      // => Expiration: Unix timestamp (standard JWT field)
                    // => JWT library rejects tokens past this time automatically
}

const SECRET: &[u8] = b"my-256-bit-secret-do-not-hardcode-in-production";
// => In production: read from environment variable or secrets manager

// Generate a JWT token (call this after successful login)
fn generate_token(user_id: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let expiry = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() + 3600;  // => Token valid for 1 hour from now

    let claims = Claims {
        sub: user_id.to_string(),  // => User identifier
        role: role.to_string(),    // => User role
        exp: expiry,               // => Expiration timestamp
    };

    encode(
        &Header::default(),                       // => HS256 algorithm (HMAC-SHA256)
        &claims,                                  // => Claims payload
        &EncodingKey::from_secret(SECRET),        // => Sign with secret key
    )
    // => Returns base64url-encoded header.payload.signature
}

// Validate a JWT token (call this in auth middleware)
fn validate_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(SECRET),        // => Same secret used for signing
        &Validation::default(),                    // => Validates exp, alg, signature
                                                    // => Returns error if expired or invalid
    )?;
    Ok(token_data.claims)                          // => Validated claims
}

fn main() {
    let token = generate_token("user-42", "admin").unwrap();
    println!("Token: {}...", &token[..30]);  // => "eyJ0eXAiOiJKV1QiLCJhbGc..." (truncated)

    match validate_token(&token) {
        Ok(claims) => println!("Valid! sub={}, role={}", claims.sub, claims.role),
        // => "Valid! sub=user-42, role=admin"
        Err(e) => println!("Invalid: {}", e),
    }
}
```

**Key Takeaway**: Generate tokens with `encode()` and validate with `decode()`. The `exp` claim is automatically checked by the `jsonwebtoken` library—expired tokens return an error.

**Why It Matters**: JWT enables stateless authentication—the server does not store sessions in a database. Validation is a pure cryptographic operation (verify the HMAC signature) that takes microseconds and requires no database lookup. This is critical for horizontal scaling: any server instance can validate any token without shared session storage. The tradeoff is that JWTs cannot be revoked before expiry without a token blacklist (a small, fast lookup table compared to full session storage).

---

### Example 33: JWT Middleware Integration

Integrate JWT validation into Axum middleware, extracting the authenticated user and making it available to handlers via extensions.

```rust
use axum::{
    extract::Extension,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Router,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Claims {
    sub: String,
    role: String,
    exp: u64,
}

const SECRET: &[u8] = b"my-secret-key";

// Middleware: validate JWT and insert Claims into request extensions
async fn jwt_middleware(
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract Bearer token from Authorization header
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;  // => 401 if header missing

    let token = auth_header
        .strip_prefix("Bearer ")             // => Remove "Bearer " prefix
        .ok_or(StatusCode::UNAUTHORIZED)?;   // => 401 if wrong scheme

    // Validate JWT and extract claims
    let claims = decode::<Claims>(
        token,
        &DecodingKey::from_secret(SECRET),
        &Validation::default(),              // => Checks signature + expiry
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?  // => 401 if invalid/expired
    .claims;

    // Insert validated claims into request extensions
    request.extensions_mut().insert(claims);  // => Keyed by type Claims
    Ok(next.run(request).await)               // => Continue to handler
}

// Protected handler: extract Claims set by middleware
async fn profile(Extension(claims): Extension<Claims>) -> String {
    format!("User: {}, Role: {}", claims.sub, claims.role)
    // => "User: user-42, Role: admin"
}

// Admin-only handler
async fn admin_only(Extension(claims): Extension<Claims>) -> Result<String, StatusCode> {
    if claims.role != "admin" {
        return Err(StatusCode::FORBIDDEN);  // => 403 if not admin
    }
    Ok("Admin panel".to_string())
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/profile", get(profile))
        .route("/admin", get(admin_only))
        .layer(middleware::from_fn(jwt_middleware));
        // => All routes require valid JWT

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Validate JWT in middleware and insert `Claims` via `extensions_mut()`. Handlers retrieve the claims with `Extension<Claims>`—guaranteed to contain valid, non-expired claims.

**Why It Matters**: Centralized JWT validation in middleware means individual handlers never handle invalid or expired tokens—they only run if authentication succeeds. Authorization logic (role checks) in handlers remains clean and focused. This separation of authentication (who are you?) from authorization (what can you do?) is a core security architecture principle that simplifies auditing: the entire authentication boundary is one middleware function.

---

## Group 15: CORS and Security

### Example 34: CORS Configuration

Cross-Origin Resource Sharing (CORS) headers tell browsers which domains can call your API. Configure with `tower-http`'s `CorsLayer`.

```rust
// Cargo.toml:
// tower-http = { version = "0.6", features = ["cors"] }

use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};  // => CORS layer and helpers
use axum::http::{HeaderName, Method};

#[tokio::main]
async fn main() {
    // Development: allow all origins (use in dev only!)
    let dev_cors = CorsLayer::permissive();
    // => Allows all origins, methods, and headers
    // => NEVER use in production

    // Production: strict CORS for an API used by a React frontend
    let prod_cors = CorsLayer::new()
        .allow_origin([
            "https://app.example.com".parse().unwrap(),  // => Main frontend
            "https://staging.example.com".parse().unwrap(), // => Staging env
        ])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        // => Only allow these HTTP methods
        .allow_headers([
            axum::http::header::CONTENT_TYPE,        // => Required for JSON APIs
            axum::http::header::AUTHORIZATION,       // => JWT tokens
            HeaderName::from_static("x-request-id"), // => Custom header
        ])
        .allow_credentials(true);
        // => Allow cookies and Authorization headers in cross-origin requests
        // => Requires specific origins (not `Any`) when using credentials

    let app = Router::new()
        .route("/api/data", get(data_handler))
        .layer(prod_cors);  // => Apply CORS to all routes

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn data_handler() -> &'static str { "API data" }
```

**Key Takeaway**: Use `CorsLayer::permissive()` for development only. In production, specify exact origins with `.allow_origin()` and enable `.allow_credentials(true)` only when cookies or `Authorization` headers are needed.

**Why It Matters**: CORS misconfiguration is a top API security vulnerability. An overly permissive CORS policy (`allow_origin: *` with `allow_credentials: true`) allows any website to make authenticated API calls on behalf of your users—effectively defeating all your authentication. Specifying exact allowed origins means that a malicious site cannot make credentialed cross-origin requests to your API even if a user is logged in, protecting against CSRF attacks in SPA architectures.

---

## Group 16: Rate Limiting

### Example 35: Rate Limiting with `tower_governor`

Rate limiting protects your API from abuse and unintentional overload. `tower_governor` provides token-bucket rate limiting per IP address.

```rust
// Cargo.toml:
// tower_governor = "0.4"
// axum = "0.8"

use axum::{routing::get, Router};
use tower_governor::{
    governor::GovernorConfigBuilder,
    GovernorLayer,  // => Tower layer for rate limiting
};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    // Configure rate limiter: 5 requests per second per IP
    let governor_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(5)          // => 5 requests per second (refill rate)
            .burst_size(10)         // => Allow burst of up to 10 requests
                                     // => Token bucket: starts with 10, refills at 5/sec
            .finish()
            .unwrap(),
    );

    let app = Router::new()
        .route("/api/limited", get(rate_limited_handler))
        .route("/api/unlimited", get(unlimited_handler))
        .layer(GovernorLayer {
            config: governor_conf,  // => Apply rate limiting to all routes above
        });
        // => Requests exceeding limit get 429 Too Many Requests
        // => X-RateLimit-Limit and Retry-After headers are set automatically

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn rate_limited_handler() -> &'static str {
    "Rate limited response"  // => Rejected with 429 if rate exceeded
}

async fn unlimited_handler() -> &'static str {
    "No rate limit"          // => Always served (layer applied before this route? NO)
    // => IMPORTANT: layer() applies to routes defined BEFORE it in Axum 0.7+
    // => To exclude a route from rate limiting, add it to a separate Router
}
```

**Key Takeaway**: Configure `GovernorConfigBuilder` with `per_second()` and `burst_size()` to define the token bucket parameters. The governor layer applies to all routes registered before the `.layer()` call.

**Why It Matters**: Rate limiting is your first line of defense against DoS attacks, credential stuffing, and runaway automation. A well-configured rate limiter (5 req/s with burst of 10) allows normal user traffic while blocking brute-force login attempts and API scraping. The `Retry-After` header in the `429` response is crucial for legitimate clients to implement backoff without spinning. Production systems typically have different rate limits for authenticated vs unauthenticated requests.

---

## Group 17: File Upload

### Example 36: Multipart File Upload

Handle file uploads using the `axum-multipart` feature. Parse multipart forms with `axum::extract::Multipart`.

```rust
// Cargo.toml:
// axum = { version = "0.8", features = ["multipart"] }

use axum::{
    extract::Multipart,          // => Multipart form data extractor
    http::StatusCode,
    routing::post,
    Router,
};

async fn upload_file(
    mut multipart: Multipart,    // => Iterator over multipart fields
) -> Result<String, StatusCode> {
    let mut file_names = Vec::new();

    // Iterate over each field in the multipart form
    while let Some(field) = multipart.next_field().await
        .map_err(|_| StatusCode::BAD_REQUEST)?  // => Malformed multipart → 400
    {
        let name = field.name()
            .unwrap_or("unknown")       // => Form field name (e.g., "file")
            .to_string();

        let file_name = field.file_name()
            .unwrap_or("unnamed")       // => Original filename from browser
            .to_string();

        // Read file bytes
        let data = field.bytes()        // => Read entire field as Bytes
            .await
            .map_err(|_| StatusCode::BAD_REQUEST)?;

        // In production: validate file type, size, and save to storage
        println!("Field: {}, File: {}, Size: {} bytes", name, file_name, data.len());
        // => "Field: avatar, File: profile.jpg, Size: 24576 bytes"

        // Security: validate file type by magic bytes, not extension
        let is_image = data.starts_with(b"\xFF\xD8") // => JPEG magic bytes
            || data.starts_with(b"\x89PNG");          // => PNG magic bytes

        if !is_image {
            return Err(StatusCode::UNPROCESSABLE_ENTITY);  // => 422 wrong file type
        }

        file_names.push(file_name);
        // => In production: save to S3/GCS/local disk here
    }

    Ok(format!("Uploaded: {:?}", file_names))
    // => "Uploaded: [\"profile.jpg\"]"
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/upload", post(upload_file));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `Multipart::next_field()` in a `while let` loop to process each uploaded file. Always validate file content by magic bytes, not file extension.

**Why It Matters**: File upload validation is a critical security concern. Validating by file extension is trivially bypassed (rename `shell.php` to `image.jpg`). Validating by magic bytes (the first few bytes of a file that identify its format) is much harder to spoof. Production file upload handlers should also enforce maximum file size limits, scan for malware, and store files outside the web root—preferably in object storage (S3/GCS) rather than on the application server filesystem.

---

## Group 18: WebSockets

### Example 37: Basic WebSocket Handler

Axum supports WebSocket upgrades via `axum::extract::ws`. The connection upgrades from HTTP to the WebSocket protocol.

```mermaid
graph LR
    A["Client<br/>HTTP Upgrade Request"] --> B["Axum<br/>WebSocket Upgrade"]
    B --> C["ws.on_upgrade<br/>Async Handler"]
    C --> D["send#40;Message#41;<br/>recv#40;#41;"]
    D --> E["Client<br/>WebSocket Messages"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```rust
// Cargo.toml:
// axum = { version = "0.8", features = ["ws"] }

use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},  // => WS types
    response::Response,
    routing::get,
    Router,
};
use futures::{sink::SinkExt, stream::StreamExt};  // => send/recv on split socket

#[tokio::main]
async fn main() {
    let app = Router::new().route("/ws", get(ws_handler));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// The handler receives a WebSocketUpgrade extractor
async fn ws_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_socket)  // => Upgrades HTTP → WebSocket
                                   // => handle_socket runs in a new task
}

// The actual WebSocket logic runs after upgrade
async fn handle_socket(mut socket: WebSocket) {
    // Echo server: receive message and send it back
    while let Some(msg) = socket.recv().await {  // => Wait for next message
        let msg = match msg {
            Ok(m) => m,                           // => Message received
            Err(_) => break,                      // => Connection error - close
        };

        match msg {
            Message::Text(text) => {
                println!("Received: {}", text);   // => "Received: hello"
                // Echo the message back to the client
                if socket.send(Message::Text(format!("Echo: {}", text))).await.is_err() {
                    break;  // => Client disconnected - stop the loop
                }
                // => Client receives: "Echo: hello"
            }
            Message::Close(_) => {
                println!("Client disconnected");  // => Graceful close
                break;
            }
            _ => {}  // => Binary, Ping, Pong - ignore for this echo server
        }
    }
}
```

**Key Takeaway**: Use `WebSocketUpgrade` as the extractor and call `.on_upgrade(handler)` to upgrade the HTTP connection. The handler receives a `WebSocket` with `send()`/`recv()` methods.

**Why It Matters**: WebSockets enable real-time bidirectional communication—essential for chat, live dashboards, collaborative editing, and gaming. The Axum WebSocket upgrade path integrates cleanly with Tokio's async model, so each WebSocket connection is a lightweight async task rather than a thread. A single Axum server can maintain tens of thousands of concurrent WebSocket connections while handling regular HTTP requests on the same port.

---

### Example 38: WebSocket Broadcast to Multiple Clients

Use `tokio::sync::broadcast` to broadcast messages from one WebSocket client to all connected clients—the foundation of a chat room.

```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
    routing::get,
    Router,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;  // => Multi-producer multi-consumer channel

#[derive(Clone)]
struct AppState {
    // broadcast::Sender can be cloned; each clone sends to all Receivers
    tx: broadcast::Sender<String>,  // => Channel for broadcasting messages
}

#[tokio::main]
async fn main() {
    let (tx, _rx) = broadcast::channel(100);  // => Buffer up to 100 messages
                                                // => _rx: initial receiver (dropped immediately)
    let state = Arc::new(AppState { tx });

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    // Subscribe to the broadcast channel (each client gets its own receiver)
    let mut rx = state.tx.subscribe();  // => Creates a new receiver for this client
                                         // => Receives all messages sent AFTER this call

    // Split socket into writer and reader halves
    let (mut sender, mut receiver) = socket.split();
    // => sender: write messages to this client
    // => receiver: read messages from this client

    // Spawn a task to forward broadcast messages to this client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {      // => Wait for broadcast messages
            if sender.send(Message::Text(msg)).await.is_err() {
                break;  // => Client disconnected - stop forwarding
            }
        }
    });

    // Read messages from this client and broadcast to all others
    let tx = state.tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            let _ = tx.send(text);  // => Broadcast to all subscribers
                                     // => Ignored if no receivers (all disconnected)
        }
    });

    // Wait for either task to finish (means client disconnected)
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),   // => Send failed: abort recv
        _ = &mut recv_task => send_task.abort(),   // => Recv failed: abort send
    }
}
```

**Key Takeaway**: Use `broadcast::channel` for fan-out messaging. Each WebSocket connection creates a new `broadcast::Receiver` via `.subscribe()`, and split the socket into send/recv halves to run them concurrently with `tokio::spawn`.

**Why It Matters**: The broadcast channel pattern scales to hundreds of concurrent WebSocket connections with zero contention. Tokio's broadcast channel is designed for exactly this use case: one sender, many receivers, bounded buffer. The `tokio::select!` macro handles connection cleanup correctly—when either the send or receive direction fails, both tasks are cancelled cleanly, preventing goroutine/task leaks that would accumulate silently in a long-running server.

---

## Group 19: Server-Sent Events

### Example 39: Server-Sent Events (SSE)

SSE is a unidirectional streaming protocol built on HTTP. Use `axum::response::sse` for pushing updates to browser clients without WebSockets.

```rust
use axum::{
    response::sse::{Event, Sse},  // => SSE response type
    routing::get,
    Router,
};
use futures::stream::{self, Stream};
use std::{convert::Infallible, time::Duration};
use tokio_stream::StreamExt as _;  // => .throttle() for rate limiting the stream

#[tokio::main]
async fn main() {
    let app = Router::new().route("/sse", get(sse_handler));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// Returns an SSE stream that sends an event every second
async fn sse_handler() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    // Create a stream of SSE events
    let stream = stream::iter(1u64..)          // => Infinite counter: 1, 2, 3, ...
        .map(|counter| {
            Event::default()                   // => Create an SSE event
                .event("update")               // => event: update (client uses this to filter)
                .data(format!("count={}", counter))  // => data: count=1
                                                      // => Client receives: event:update\ndata:count=1\n\n
        })
        .map(Ok::<_, Infallible>)              // => Wrap in Ok (stream never errors)
        .throttle(Duration::from_secs(1));     // => Emit one event per second

    Sse::new(stream)                           // => Wrap stream in Sse response
        .keep_alive(                           // => Sends : keep-alive comments
            axum::response::sse::KeepAlive::new()
                .interval(Duration::from_secs(15))  // => Every 15 seconds
                .text("keep-alive"),                 // => Comment text (client ignores)
        )
    // => Content-Type: text/event-stream
    // => Cache-Control: no-cache
    // => Connection: keep-alive
}
```

**Key Takeaway**: Return `Sse<impl Stream<Item = Result<Event, Infallible>>>` from a handler to push server-to-client updates over HTTP/1.1. Use `.keep_alive()` to prevent proxies from closing idle connections.

**Why It Matters**: SSE is often a better choice than WebSockets for unidirectional push notifications (news feeds, notifications, live metrics) because it works over plain HTTP/1.1, is automatically reconnected by browsers, and is easier to proxy and cache than WebSocket upgrades. SSE uses one HTTP connection per client for streaming, whereas a polling approach would use one connection every N seconds—drastically reducing server load for real-time dashboards with many connected clients.

---

## Group 20: Graceful Shutdown

### Example 40: Graceful Shutdown on SIGTERM/SIGINT

Production services must drain in-flight requests before shutting down. Axum provides a `with_graceful_shutdown` API.

```rust
use axum::{routing::get, Router};
use tokio::signal;  // => Signal handling utilities

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(handler))
        .route("/slow", get(slow_handler));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    println!("Server started. Send SIGINT (Ctrl+C) or SIGTERM to shut down gracefully.");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())  // => Stop accepting new connections on signal
                                                     // => Waits for in-flight requests to complete
        .await
        .unwrap();

    println!("Server shutdown complete.");  // => Only printed after all requests finish
}

// Signal handler: resolves when SIGINT (Ctrl+C) or SIGTERM is received
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()                             // => Listen for Ctrl+C (SIGINT)
            .await
            .expect("Failed to install CTRL+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            // => Listen for SIGTERM (sent by Docker, Kubernetes on shutdown)
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();  // => Windows has no SIGTERM

    // Wait for either signal
    tokio::select! {
        _ = ctrl_c => {},     // => SIGINT received
        _ = terminate => {},  // => SIGTERM received
    }

    println!("Shutdown signal received, draining connections...");
}

async fn handler() -> &'static str { "OK" }

async fn slow_handler() -> &'static str {
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    // => Simulates a slow request; graceful shutdown waits for this to complete
    "Slow response"
}
```

**Key Takeaway**: Pass a future to `.with_graceful_shutdown()` that resolves when a shutdown signal arrives. Axum stops accepting new connections and waits for in-flight requests to complete.

**Why It Matters**: Container orchestrators (Kubernetes, ECS) send SIGTERM before forcefully killing a container. Without graceful shutdown, in-flight requests receive connection reset errors. With graceful shutdown, the server finishes processing all active requests before exiting—giving users a clean response instead of a cryptic error. Kubernetes typically waits 30 seconds (configurable via `terminationGracePeriodSeconds`) before sending SIGKILL, so handlers must complete within that window.

---

## Group 21: Logging and Tracing

### Example 41: Structured Logging with `tracing`

The `tracing` crate provides structured, contextual logging. Combine `tracing::instrument` with Axum's `TraceLayer` for full request context in every log.

```rust
// Cargo.toml:
// tracing = "0.1"
// tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

use axum::{extract::Path, routing::get, Router};
use tower_http::trace::TraceLayer;
use tracing::{info, instrument, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize structured JSON logging for production
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "my_app=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        // => .json(): Output logs as JSON lines (easy to ingest by log aggregators)
        // => Remove .json() for human-readable output in development
        .init();

    let app = Router::new()
        .route("/users/:id", get(get_user))
        .layer(TraceLayer::new_for_http());
        // => Each request gets a tracing span with method, uri, status, latency

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// #[instrument] creates a span for this function, automatically propagating context
#[instrument(fields(user_id = %id))]  // => Adds user_id field to the span
async fn get_user(Path(id): Path<u64>) -> String {
    info!("Fetching user");  // => {"level":"INFO","span":{"user_id":"42"},"message":"Fetching user"}

    if id == 0 {
        warn!(id = id, "Invalid user ID requested");
        // => {"level":"WARN","span":{"user_id":"0"},"id":0,"message":"Invalid user ID"}
        return "Invalid".to_string();
    }

    let user = format!("User {}", id);
    info!(found = true, "User found");  // => Logs with additional structured field
    user
}
```

**Key Takeaway**: Use `#[instrument]` to create tracing spans for functions. Add structured fields with `info!(key = value, "message")`. Enable JSON output in production for log aggregator ingestion.

**Why It Matters**: Structured JSON logs enable powerful querying in log aggregation platforms (Datadog, Grafana Loki, CloudWatch Logs Insights). Instead of grepping through text, you can query `user_id = "42"` to find all requests related to a specific user across multiple services. The `#[instrument]` attribute automatically propagates the tracing context through nested async calls, giving you a complete execution trace without manually passing context through every function.

---

## Group 22: Configuration

### Example 42: Environment-Based Configuration

Use the `config` crate with `serde` to load configuration from environment variables and TOML files with validation.

```rust
// Cargo.toml:
// config = "0.14"
// serde = { version = "1", features = ["derive"] }
// dotenvy = "0.15"  # Load .env files in development

use serde::Deserialize;
use std::sync::Arc;

// Configuration struct - matches environment variables and config file keys
#[derive(Deserialize, Clone, Debug)]
pub struct Settings {
    pub server: ServerSettings,    // => [server] section in config.toml
    pub database: DatabaseSettings, // => [database] section
    pub auth: AuthSettings,         // => [auth] section
}

#[derive(Deserialize, Clone, Debug)]
pub struct ServerSettings {
    pub host: String,  // => SERVER__HOST env var or server.host in config file
    pub port: u16,     // => SERVER__PORT env var
}

#[derive(Deserialize, Clone, Debug)]
pub struct DatabaseSettings {
    pub url: String,         // => DATABASE__URL env var (override in production!)
    pub max_connections: u32, // => DATABASE__MAX_CONNECTIONS
}

#[derive(Deserialize, Clone, Debug)]
pub struct AuthSettings {
    pub jwt_secret: String,  // => AUTH__JWT_SECRET env var (from secrets manager in prod)
    pub token_expiry: u64,   // => AUTH__TOKEN_EXPIRY in seconds
}

fn load_config() -> Settings {
    dotenvy::dotenv().ok();  // => Load .env file if present (development only)
                              // => .ok() ignores error if .env doesn't exist

    config::Config::builder()
        // Base configuration from file (checked into source, no secrets)
        .add_source(config::File::with_name("config/default").required(false))
        // => Reads config/default.toml if it exists

        // Environment-specific overrides
        .add_source(
            config::File::with_name(&format!(
                "config/{}",
                std::env::var("APP_ENV").unwrap_or_else(|_| "development".into())
            ))
            .required(false),
        )
        // => Reads config/production.toml in production

        // Environment variable overrides (highest priority)
        .add_source(
            config::Environment::with_prefix("APP")
                .separator("__")  // => APP__SERVER__PORT=3001 overrides server.port
        )
        .build()
        .expect("Failed to build configuration")
        .try_deserialize::<Settings>()
        .expect("Invalid configuration")
}

#[tokio::main]
async fn main() {
    let settings = Arc::new(load_config());
    println!("Starting on {}:{}", settings.server.host, settings.server.port);
    // => "Starting on 0.0.0.0:3000"
    println!("DB max connections: {}", settings.database.max_connections);
    // => "DB max connections: 10"
    // In real app: pass settings to AppState
}
```

**Key Takeaway**: Use `config::Config::builder()` to layer configuration sources: default file < environment file < environment variables. Environment variables override everything, making container deployments clean.

**Why It Matters**: The 12-factor app methodology requires configuration from the environment, not baked-in defaults. The layered approach allows sane defaults in source-controlled files while overriding secrets and environment-specific values via environment variables at runtime. This means the same Docker image runs in development, staging, and production with only environment variable differences—no configuration file changes required between deployments.

---

## Group 23: Advanced Routing

### Example 43: Route Groups with Shared Middleware

Apply different middleware stacks to different route groups by using separate `Router` instances that are merged together.

```rust
use axum::{
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Router,
};

// Auth middleware (reused in different route groups)
async fn require_auth(request: Request, next: Next) -> Result<Response, StatusCode> {
    if request.headers().get("Authorization").is_none() {
        return Err(StatusCode::UNAUTHORIZED);  // => 401 if no auth header
    }
    Ok(next.run(request).await)
}

// Admin middleware (stricter than require_auth)
async fn require_admin(request: Request, next: Next) -> Result<Response, StatusCode> {
    let role = request.headers()
        .get("X-Role")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);  // => 403 if not admin
    }
    Ok(next.run(request).await)
}

#[tokio::main]
async fn main() {
    // Public routes: no middleware
    let public_routes = Router::new()
        .route("/", get(|| async { "Home" }))
        .route("/health", get(|| async { "OK" }));
    // => No middleware - accessible to everyone

    // Authenticated routes: require auth
    let auth_routes = Router::new()
        .route("/profile", get(|| async { "Profile" }))
        .route("/settings", get(|| async { "Settings" }))
        .layer(middleware::from_fn(require_auth));
    // => require_auth runs for /profile and /settings

    // Admin routes: require auth AND admin role
    let admin_routes = Router::new()
        .route("/admin/users", get(|| async { "User list" }))
        .route("/admin/config", get(|| async { "Config" }))
        .layer(middleware::from_fn(require_admin))   // => Check role
        .layer(middleware::from_fn(require_auth));    // => Check auth FIRST
        // => Middleware layers apply outer-to-inner: auth runs first, then admin check

    // Merge all groups into the final router
    let app = Router::new()
        .merge(public_routes)  // => Adds public routes as-is
        .merge(auth_routes)    // => Adds auth-protected routes
        .merge(admin_routes);  // => Adds admin-protected routes

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Create separate `Router` instances for each security zone and apply middleware per group. Use `.merge()` to combine them into the final application router.

**Why It Matters**: Grouping routes by security zone and applying middleware at the group level makes the security model explicit and auditable. A security reviewer can see exactly which routes have authentication, which have admin authorization, and which are public—all from the router configuration without reading individual handlers. This is dramatically clearer than scattered `if !authenticated { return 401 }` checks in handler bodies.

---

## Group 24: Request Validation

### Example 44: Input Validation with `validator`

Validate request bodies beyond what serde deserialization provides. The `validator` crate adds field-level validation with descriptive error messages.

```rust
// Cargo.toml:
// validator = { version = "0.18", features = ["derive"] }
// axum = "0.8"

use axum::{
    extract::Json,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use validator::Validate;  // => Validation derive macro and trait

// Derive both Deserialize and Validate
#[derive(Deserialize, Validate)]
struct RegisterUser {
    #[validate(length(min = 3, max = 50, message = "Username must be 3-50 characters"))]
    username: String,

    #[validate(email(message = "Must be a valid email address"))]
    email: String,

    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    #[validate(regex(path = "PASSWORD_REGEX", message = "Password must contain a number"))]
    password: String,

    #[validate(range(min = 18, max = 120, message = "Age must be 18-120"))]
    age: u8,
}

// Pre-compiled regex for password complexity check
static PASSWORD_REGEX: std::sync::LazyLock<regex::Regex> =
    std::sync::LazyLock::new(|| regex::Regex::new(r"\d").unwrap());
// => Regex matches if password contains at least one digit

// Validation error response
#[derive(Serialize)]
struct ValidationErrors {
    errors: std::collections::HashMap<String, Vec<String>>,
    // => {"username": ["Username must be 3-50 characters"], "email": [...]}
}

async fn register(
    Json(payload): Json<RegisterUser>,
) -> Result<StatusCode, Response> {
    // Run validation AFTER deserialization
    payload.validate()
        .map_err(|e| {
            // Convert validator errors to a JSON response
            let errors: std::collections::HashMap<String, Vec<String>> = e
                .field_errors()  // => Iterator of (field_name, Vec<ValidationError>)
                .into_iter()
                .map(|(field, errors)| {
                    let messages: Vec<String> = errors.iter()
                        .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
                        .collect();
                    (field.to_string(), messages)
                })
                .collect();
            (StatusCode::UNPROCESSABLE_ENTITY, Json(ValidationErrors { errors }))
                .into_response()  // => 422 with field-level error messages
        })?;

    // Validation passed - proceed with registration
    Ok(StatusCode::CREATED)  // => 201 Created
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/register", post(register));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Derive `Validate` on input structs and call `.validate()` after deserialization. Return `422 Unprocessable Entity` with field-level error messages for validation failures.

**Why It Matters**: Field-level validation error messages dramatically improve API usability and reduce support burden. Instead of "Invalid request body" (from a 400), clients receive specific guidance: "Username must be 3-50 characters" and "Must be a valid email address." The `422 Unprocessable Entity` status code correctly distinguishes "body was parseable JSON but failed business validation" from "body was malformed JSON" (400), following HTTP semantics precisely.

---

## Group 25: Health Checks and Readiness

### Example 45: Health Check and Readiness Endpoints

Production services expose `/health` (liveness) and `/ready` (readiness) endpoints for container orchestrators and load balancers.

```rust
use axum::{
    extract::State,
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
struct AppState { db: PgPool }

#[derive(Serialize)]
struct HealthResponse {
    status: String,   // => "healthy" or "unhealthy"
    version: String,  // => Application version from build metadata
}

#[derive(Serialize)]
struct ReadinessResponse {
    status: String,       // => "ready" or "not ready"
    database: String,     // => "ok" or "error: <message>"
}

// Liveness probe: is the process alive and not deadlocked?
// Should NEVER check external dependencies (DB, Redis, etc.)
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),  // => "0.1.0" from Cargo.toml
    })
    // => Always returns 200 if the process is running
    // => Kubernetes restarts pod if this returns 5xx or times out
}

// Readiness probe: can this instance serve traffic?
// SHOULD check external dependencies
async fn ready(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ReadinessResponse>) {
    // Test database connectivity
    let db_status = sqlx::query("SELECT 1")  // => Minimal query to verify DB connection
        .execute(&state.db)
        .await;

    match db_status {
        Ok(_) => (
            StatusCode::OK,
            Json(ReadinessResponse {
                status: "ready".to_string(),
                database: "ok".to_string(),
            }),
        ),
        // => 200: instance is ready for traffic
        Err(e) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ReadinessResponse {
                status: "not ready".to_string(),
                database: format!("error: {}", e),
            }),
        ),
        // => 503: database unavailable, do NOT route traffic here
    }
}

#[tokio::main]
async fn main() {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await.unwrap();
    let state = Arc::new(AppState { db: pool });

    let app = Router::new()
        .route("/health", get(health))  // => Liveness probe
        .route("/ready", get(ready))    // => Readiness probe
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Separate liveness (`/health`) from readiness (`/ready`). Liveness never checks external services. Readiness checks all dependencies and returns `503` if any are unavailable.

**Why It Matters**: The liveness/readiness separation is critical for Kubernetes health management. A failed liveness probe restarts the pod (use for deadlocks, OOM). A failed readiness probe removes the pod from the load balancer rotation without restarting it (use for database downtime). If you incorrectly check the database in a liveness probe, a database outage causes all pods to restart in a cascade—making an outage worse. Correct health probe semantics prevent this operational failure mode.

---

## Group 26: Middleware State Access

### Example 46: Middleware with Application State

Middleware can access `AppState` using `axum::middleware::from_fn_with_state`, enabling stateful middleware like request counting or quota checks.

```rust
use axum::{
    extract::State,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Router,
};
use std::sync::{Arc, atomic::{AtomicU64, Ordering}};

// State with atomic counters (lock-free for high-performance counting)
#[derive(Clone)]
struct AppState {
    request_count: Arc<AtomicU64>,   // => Lock-free request counter
    error_count: Arc<AtomicU64>,     // => Lock-free error counter
}

// Middleware with state access
async fn request_counter(
    State(state): State<Arc<AppState>>,  // => Inject state into middleware
    request: Request,
    next: Next,
) -> Response {
    state.request_count.fetch_add(1, Ordering::Relaxed);
    // => Increment counter atomically (Relaxed: no memory ordering needed for counters)
    // => AtomicU64 is faster than Mutex<u64> for simple counters

    let response = next.run(request).await;  // => Run the rest of the chain

    if response.status().is_server_error() {
        state.error_count.fetch_add(1, Ordering::Relaxed);
        // => Count 5xx errors for alerting
    }

    response
}

async fn stats_handler(
    State(state): State<Arc<AppState>>,
) -> String {
    let requests = state.request_count.load(Ordering::Relaxed);
    let errors = state.error_count.load(Ordering::Relaxed);
    format!("Requests: {}, Errors: {}", requests, errors)
    // => "Requests: 142, Errors: 3"
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        request_count: Arc::new(AtomicU64::new(0)),
        error_count: Arc::new(AtomicU64::new(0)),
    });

    let app = Router::new()
        .route("/stats", get(stats_handler))
        .route("/", get(|| async { "Hello" }))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            request_counter,  // => Use from_fn_with_state for stateful middleware
        ))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `middleware::from_fn_with_state(state, middleware_fn)` to inject `AppState` into middleware. `AtomicU64` is faster than `Mutex<u64>` for simple counters since it requires no lock acquisition.

**Why It Matters**: Stateful middleware is the building block for per-service rate limiting, request metering, quota enforcement, and circuit breakers. Atomic operations for counters avoid lock contention—in a high-traffic service (10,000 req/sec), a `Mutex`-based counter would serialize 10,000 lock acquisitions per second, becoming a throughput bottleneck. `AtomicU64` with `Relaxed` ordering is essentially free at any concurrency level, making instrumentation invisible to latency.

---

## Group 27: Error Handling Patterns

### Example 47: Centralized Error Handling with `thiserror`

The `thiserror` crate generates `Display` and `Error` implementations from attribute macros, enabling clean error hierarchies that map to HTTP responses.

```rust
// Cargo.toml:
// thiserror = "1"
// axum = "0.8"
// sqlx = { version = "0.8", features = ["postgres", "runtime-tokio"] }

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;  // => Derive macro for error types

// Top-level application error enum
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),  // => Auto-convert sqlx::Error via From trait
                                     // => #[from] generates: impl From<sqlx::Error> for AppError

    #[error("Not found: {0}")]
    NotFound(String),               // => 404 Not Found

    #[error("Unauthorized")]
    Unauthorized,                   // => 401 Unauthorized

    #[error("Forbidden: insufficient permissions")]
    Forbidden,                      // => 403 Forbidden

    #[error("Validation failed: {0}")]
    Validation(String),             // => 422 Unprocessable Entity

    #[error("Internal error")]
    Internal,                       // => 500 (scrub details in prod)
}

// Response body for errors
#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    status: u16,
}

// Map AppError variants to HTTP responses
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Database(e) => {
                tracing::error!("Database error: {}", e);  // => Log internal detail
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string())
                // => Never expose DB errors to clients
            }
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden".to_string()),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error".to_string()),
        };

        let body = ErrorResponse {
            error: message,
            status: status.as_u16(),
        };

        (status, Json(body)).into_response()
    }
}

// Example handler: DB error auto-converts to AppError via ? operator
async fn find_user(id: u64, db: &sqlx::PgPool) -> Result<String, AppError> {
    let user = sqlx::query_scalar::<_, String>("SELECT name FROM users WHERE id = $1")
        .bind(id as i64)
        .fetch_optional(db)
        .await?         // => sqlx::Error auto-converts to AppError::Database via #[from]
        .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))?;
    // => None → AppError::NotFound

    Ok(user)
}
```

**Key Takeaway**: Use `thiserror::Error` derive and `#[from]` to auto-convert library errors into your `AppError` type. The `?` operator then converts errors automatically in handlers.

**Why It Matters**: The `?` operator with `#[from]` converters means error propagation is essentially automatic—write business logic, add `?`, and the correct HTTP response emerges from the type system. This eliminates the most tedious part of error handling: manually mapping every `sqlx::Error` to a `StatusCode`. The `IntoResponse` implementation becomes the single authoritative place where error details are logged and scrubbed before reaching the client.

---

### Example 48: Handling `Option` and `Result` in Handlers

Common patterns for converting `Option<T>` and external `Result<T, E>` values into appropriate HTTP responses using idiomatic Rust.

```rust
use axum::{
    extract::Path,
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;

#[derive(Serialize)]
struct User {
    id: u64,
    name: String,
}

// Simulates a database lookup that returns Option
fn db_find_user(id: u64) -> Option<User> {
    if id == 1 {
        Some(User { id: 1, name: "Alice".to_string() })
    } else {
        None  // => User not found
    }
}

// Simulates an operation that can fail
fn parse_username(raw: &str) -> Result<String, String> {
    if raw.chars().all(|c| c.is_alphanumeric() || c == '_') {
        Ok(raw.to_lowercase())
    } else {
        Err(format!("Invalid username: {}", raw))  // => Contains invalid characters
    }
}

async fn get_user_handler(
    Path(id): Path<u64>,
) -> Result<Json<User>, StatusCode> {
    // Pattern 1: Option → Result with .ok_or()
    let user = db_find_user(id)
        .ok_or(StatusCode::NOT_FOUND)?;  // => None → 404, Some(u) → u
    Ok(Json(user))
}

async fn validate_username(
    Path(username): Path<String>,
) -> Result<String, (StatusCode, String)> {
    // Pattern 2: external Result → HTTP error with custom body
    let clean = parse_username(&username)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))?;
    // => Err(msg) → 400 Bad Request with message as body
    // => Ok(clean) → continue

    Ok(format!("Valid username: {}", clean))  // => "Valid username: alice"
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/users/:id", get(get_user_handler))
        .route("/validate/:username", get(validate_username));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `.ok_or(StatusCode)` to convert `Option<T>` into `Result<T, StatusCode>`. Use `.map_err(|e| (StatusCode, body))` to convert external `Err` values into HTTP error responses.

**Why It Matters**: These idiomatic conversion patterns remove boilerplate `match` expressions from handlers. Every `match None => return Err(StatusCode::NOT_FOUND)` block becomes `.ok_or(StatusCode::NOT_FOUND)?`—a single line. Readable, consistent error handling across a large codebase makes it easier to audit that all error paths return appropriate status codes and that no `unwrap()` calls can panic in production request paths.

---

## Group 28: Integration Testing

### Example 55: Full Integration Test Setup

Write integration tests that start a real application with test-specific state and send HTTP requests via `reqwest` or `axum`'s own `TestClient`.

```rust
// In tests/integration_test.rs (separate file for integration tests)
// Cargo.toml [dev-dependencies]:
// reqwest = { version = "0.12", features = ["json"] }
// tokio = { version = "1", features = ["full"] }

use axum::{routing::get, Router};
use std::net::SocketAddr;
use tokio::net::TcpListener;

// Build the application (extracted to a function for reuse in tests and main)
fn build_app() -> Router {
    Router::new()
        .route("/hello", get(|| async { "Hello, World!" }))
        .route("/json", get(|| async {
            axum::Json(serde_json::json!({"status": "ok", "version": "1.0"}))
        }))
}

// Test helper: start the app on a random port, return the base URL
async fn start_test_server() -> String {
    let listener = TcpListener::bind("127.0.0.1:0")  // => Port 0: OS assigns free port
        .await
        .unwrap();
    let addr = listener.local_addr().unwrap();  // => Get the assigned port
    // => e.g., 127.0.0.1:54321

    let app = build_app();

    // Start the server in a background task
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    format!("http://{}", addr)  // => "http://127.0.0.1:54321"
}

#[tokio::test]
async fn test_hello_endpoint() {
    let base_url = start_test_server().await;

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/hello", base_url))  // => Real HTTP request to test server
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);          // => 200 OK
    assert_eq!(response.text().await.unwrap(), "Hello, World!");
    // => Body matches
}

#[tokio::test]
async fn test_json_endpoint() {
    let base_url = start_test_server().await;

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/json", base_url))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "ok");     // => JSON field assertion
    assert_eq!(body["version"], "1.0");  // => JSON field assertion
}
```

**Key Takeaway**: Extract `build_app()` to reuse in tests and `main()`. Use `TcpListener::bind("127.0.0.1:0")` for random port assignment, eliminating port conflicts between parallel test runs.

**Why It Matters**: Extracting `build_app()` into a separate function is the key architectural decision enabling testability. Both your production `main()` and tests call the same function, ensuring tests run against the exact same application configuration. Random port assignment via port `0` means integration tests always run in parallel without port conflicts—even across CI workers. This approach verifies the full middleware stack, routing, and serialization in a way that unit tests cannot.
