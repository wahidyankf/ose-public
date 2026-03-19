---
title: "Advanced"
weight: 10000003
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master expert-level Rust Axum patterns through 25 annotated examples covering custom extractors, Tower middleware deep dive, connection pooling, streaming, Prometheus metrics, OpenTelemetry, circuit breakers, caching, API versioning, and Docker deployment"
tags: ["axum", "rust", "web-framework", "tutorial", "by-example", "advanced", "tower", "opentelemetry", "prometheus", "docker", "production"]
---

## Group 29: Custom Extractors

### Example 56: Implementing `FromRequestParts`

Custom extractors let you encapsulate reusable extraction logic. Implement `FromRequestParts` for extractors that do not consume the request body.

```mermaid
graph TD
    A["Incoming Request<br/>Headers + Parts"] --> B["FromRequestParts<br/>impl for CustomExtractor"]
    B --> C{"Extraction<br/>Succeeds?"}
    C -->|Yes| D["Handler receives<br/>CustomExtractor value"]
    C -->|No| E["Rejection Response<br/>400/401/403"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```rust
use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    RequestPartsExt,  // => Extension trait adding .extract() to Parts
};
use std::sync::Arc;

// Custom extractor: extracts a validated API key from headers
struct ApiKey(String);  // => Newtype wrapping the validated key string

// AppState is needed to validate API keys against a known set
#[derive(Clone)]
struct AppState {
    valid_keys: Vec<String>,  // => List of valid API keys (use a HashSet in production)
}

#[async_trait]
impl<S> FromRequestParts<S> for ApiKey
where
    S: Send + Sync,  // => S is the state type; must be Send + Sync for async
    Arc<AppState>: axum::extract::FromRef<S>,  // => State must contain Arc<AppState>
                                                // => FromRef enables extracting sub-state
{
    type Rejection = StatusCode;  // => Return type on extraction failure

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // Extract the AppState from the state parameter
        let State(app_state): State<Arc<AppState>> = parts
            .extract_with_state(state)  // => Use state-aware extraction
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Extract the X-API-Key header
        let key = parts
            .headers
            .get("X-API-Key")                       // => Look for header
            .and_then(|v| v.to_str().ok())           // => Convert to &str
            .ok_or(StatusCode::UNAUTHORIZED)?;       // => 401 if missing

        // Validate the key
        if !app_state.valid_keys.iter().any(|k| k == key) {
            return Err(StatusCode::FORBIDDEN);       // => 403 if key not in valid set
        }

        Ok(ApiKey(key.to_string()))                  // => Extraction succeeded
    }
}

// Handler uses the custom extractor directly
async fn api_handler(
    ApiKey(key): ApiKey,  // => Extracts and validates in one step
) -> String {
    format!("Authenticated with key: {}...", &key[..4])
    // => "Authenticated with key: sk-l..."
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        valid_keys: vec!["sk-live-abc123".to_string(), "sk-live-def456".to_string()],
    });

    let app = axum::Router::new()
        .route("/api/data", axum::routing::get(api_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Implement `FromRequestParts` for extractors that read headers, query params, or state without consuming the body. Use `FromRef` to extract sub-state when your extractor needs application state.

**Why It Matters**: Custom extractors move repeated validation logic from handler bodies into a reusable, composable unit. Every handler that declares `ApiKey` in its parameters automatically validates the API key—without any code in the handler body. New handlers added to the codebase inherit the validation for free. This is Axum's most powerful extensibility mechanism and the foundation for building domain-specific DSLs for your API's security model.

---

### Example 57: Implementing `FromRequest` for Body Extractors

`FromRequest` is for extractors that consume the request body. Use it to build custom deserialization logic, such as signature-verified JSON or CBOR.

```rust
use axum::{
    async_trait,
    body::Bytes,
    extract::{FromRequest, Request},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use serde::de::DeserializeOwned;

// Custom extractor: validates Content-Type before parsing JSON
struct StrictJson<T>(T);  // => Wraps the deserialized value

// Custom rejection type with structured error
struct StrictJsonRejection {
    message: String,
    status: StatusCode,
}

impl IntoResponse for StrictJsonRejection {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}

#[async_trait]
impl<T, S> FromRequest<S> for StrictJson<T>
where
    T: DeserializeOwned,  // => T must be deserializable from JSON
    S: Send + Sync,
{
    type Rejection = StrictJsonRejection;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        // Step 1: Validate Content-Type header explicitly
        let content_type = req
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        // => Check before reading body (cheap operation)

        if !content_type.contains("application/json") {
            return Err(StrictJsonRejection {
                message: format!("Expected application/json, got: {}", content_type),
                status: StatusCode::UNSUPPORTED_MEDIA_TYPE,  // => 415
            });
        }

        // Step 2: Read the entire request body
        let bytes = Bytes::from_request(req, state)
            .await
            .map_err(|_| StrictJsonRejection {
                message: "Failed to read body".to_string(),
                status: StatusCode::BAD_REQUEST,
            })?;
        // => bytes contains the raw request body

        // Step 3: Deserialize JSON
        serde_json::from_slice::<T>(&bytes)
            .map(StrictJson)         // => Wrap in StrictJson on success
            .map_err(|e| StrictJsonRejection {
                message: format!("JSON parse error: {}", e),
                status: StatusCode::UNPROCESSABLE_ENTITY,  // => 422
            })
    }
}

// Handler uses StrictJson - enforces application/json Content-Type
async fn create_item(
    StrictJson(data): StrictJson<serde_json::Value>,  // => Custom extractor
) -> String {
    format!("Received: {}", data)  // => "Received: {\"name\":\"widget\"}"
}

#[tokio::main]
async fn main() {
    let app = axum::Router::new()
        .route("/items", axum::routing::post(create_item));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Implement `FromRequest<S>` (not `FromRequestParts`) for extractors that consume the body. Body can only be read once, so `FromRequest` takes ownership of the full `Request`.

**Why It Matters**: Custom body extractors encapsulate protocol-specific validation that cannot be expressed through serde alone. Use cases include: CBOR or MessagePack deserialization, HMAC signature verification over the raw bytes, content length enforcement, or strict schema validation against JSON Schema. Building these as extractors means they compose with all other Axum extractors and can be reused across any number of handlers without code duplication.

---

## Group 30: Tower Middleware Deep Dive

### Example 58: Building a Tower `Layer` and `Service`

Tower middleware is the backbone of the Axum ecosystem. Implementing `Layer` and `Service` manually gives you the deepest level of control.

```rust
use axum::{routing::get, Router};
use std::{
    pin::Pin,
    future::Future,
    task::{Context, Poll},
};
use tower::{Layer, Service};  // => Core Tower traits
use axum::http::Request;
use axum::response::Response;
use axum::body::Body;

// Step 1: Define the Layer (factory that wraps services)
#[derive(Clone)]
struct RequestIdLayer;  // => Adds X-Request-ID to every request

impl<S> Layer<S> for RequestIdLayer {
    type Service = RequestIdService<S>;  // => The service this layer creates

    fn layer(&self, inner: S) -> Self::Service {
        RequestIdService { inner }       // => Wrap the inner service
    }
}

// Step 2: Define the Service (the actual middleware logic)
#[derive(Clone)]
struct RequestIdService<S> {
    inner: S,  // => The wrapped (inner) service/handler
}

impl<S> Service<Request<Body>> for RequestIdService<S>
where
    S: Service<Request<Body>, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Response, S::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)  // => Delegate readiness to inner service
                                    // => Ready when inner is ready to accept requests
    }

    fn call(&mut self, mut req: Request<Body>) -> Self::Future {
        let inner = self.inner.clone();  // => Clone inner for the async block
        Box::pin(async move {
            // Generate a unique request ID
            let id = format!("{}", rand_id());  // => Unique ID per request
            req.headers_mut().insert(
                "x-request-id",
                id.parse().unwrap(),   // => Inject into request headers
            );
            // => Inner handlers can read X-Request-ID from headers

            let mut inner = inner;
            let response = inner.call(req).await?;  // => Call the inner service
            Ok(response)  // => Return response unchanged (or modify here)
        })
    }
}

fn rand_id() -> u64 {
    // In production: use uuid::Uuid::new_v4().to_string()
    42  // => Simplified for example
}

async fn handler(headers: axum::http::HeaderMap) -> String {
    let id = headers.get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("none");
    format!("Request ID: {}", id)  // => "Request ID: 42"
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(handler))
        .layer(RequestIdLayer);  // => Apply custom Tower layer
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: A Tower middleware requires two types: a `Layer` (the factory) and a `Service` (the logic). The `Layer::layer()` method wraps the inner service, and `Service::call()` executes the middleware logic around `inner.call(req)`.

**Why It Matters**: Understanding Tower's `Layer`/`Service` pattern unlocks the entire Tower ecosystem—`tower-http`, `tower_governor`, `tower_sessions`, and dozens of community crates all implement this pattern. When you understand it, you can compose any combination of middleware, build your own, and contribute to the ecosystem. This pattern is also how Axum itself works internally—every router is a Tower service.

---

### Example 59: `tower-http` Compression Middleware

Response compression reduces bandwidth costs and improves perceived performance. `tower-http`'s `CompressionLayer` handles gzip, brotli, and zstd compression transparently.

```rust
// Cargo.toml:
// tower-http = { version = "0.6", features = ["compression-full"] }

use axum::{routing::get, Router};
use tower_http::compression::CompressionLayer;  // => Automatic response compression

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/data", get(large_response))
        .layer(
            CompressionLayer::new()
                // => Compresses responses based on Accept-Encoding header
                // => Supports: gzip, deflate, brotli, zstd (with feature flags)
                // => Skips compression for small responses (< ~1KB, configurable)
                // => Does NOT compress already-compressed formats (JPEG, PNG, zip)
        );

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn large_response() -> String {
    // Simulated large JSON response (real: query 1000 rows from DB)
    let data: Vec<String> = (1..=100)
        .map(|i| format!("{{\"id\":{},\"name\":\"Item {}\",\"description\":\"Long description for item {}\"}}", i, i, i))
        .collect();
    format!("[{}]", data.join(","))
    // => Uncompressed: ~8KB
    // => With gzip: ~0.4KB (95% reduction for repetitive JSON)
    // => Content-Encoding: gzip header added automatically
}
```

**Key Takeaway**: Add `CompressionLayer::new()` to automatically compress responses when clients send `Accept-Encoding: gzip, br, zstd`. The layer selects the best algorithm supported by the client.

**Why It Matters**: JSON APIs with repetitive structure (lists of similar objects) typically compress 90-98% with gzip or brotli. For an API returning 100KB of JSON, compression reduces bandwidth to 2-10KB—a 10-50x reduction. For mobile clients on metered connections, this directly reduces user costs. For high-traffic APIs, compression reduces egress bandwidth costs proportionally. The `CompressionLayer` handles algorithm negotiation, applies compression only when beneficial, and skips already-compressed media types automatically.

---

## Group 31: Connection Pooling Patterns

### Example 60: Multi-Database Connection Pool Configuration

Production applications often require multiple database pools with different characteristics: a primary read-write pool and a replica read-only pool.

```rust
// Cargo.toml:
// sqlx = { version = "0.8", features = ["postgres", "runtime-tokio"] }

use axum::{extract::State, routing::get, Json, Router};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;
use std::time::Duration;

// AppState with separate read-write and read-only pools
#[derive(Clone)]
struct AppState {
    primary: PgPool,   // => Read-write: INSERT, UPDATE, DELETE
    replica: PgPool,   // => Read-only: SELECT queries (load balanced to replicas)
}

async fn get_user(State(state): State<Arc<AppState>>) -> Json<String> {
    // Use replica pool for read queries
    let name = sqlx::query_scalar::<_, String>("SELECT name FROM users WHERE id = 1")
        .fetch_one(&state.replica)  // => Routes to read replica
        .await
        .unwrap_or_else(|_| "unknown".to_string());
    Json(name)
}

async fn update_user(State(state): State<Arc<AppState>>) -> axum::http::StatusCode {
    // Use primary pool for write queries
    sqlx::query("UPDATE users SET last_seen = NOW() WHERE id = 1")
        .execute(&state.primary)    // => Routes to primary (read-write)
        .await
        .ok();
    axum::http::StatusCode::OK
}

#[tokio::main]
async fn main() {
    // Primary: smaller pool, handles writes
    let primary = PgPoolOptions::new()
        .max_connections(5)          // => Writes are less frequent; smaller pool
        .min_connections(1)          // => Keep at least 1 warm
        .acquire_timeout(Duration::from_secs(5))   // => Fail fast if pool exhausted
        .idle_timeout(Duration::from_secs(600))    // => Close idle connections after 10 min
        .max_lifetime(Duration::from_secs(1800))   // => Refresh connections every 30 min
                                                    // => Prevents stale connections after DB failover
        .connect("postgres://primary-host/mydb").await.unwrap();

    // Replica: larger pool for high-read workloads
    let replica = PgPoolOptions::new()
        .max_connections(20)         // => Reads dominate; larger pool
        .min_connections(3)
        .acquire_timeout(Duration::from_secs(3))
        .connect("postgres://replica-host/mydb").await.unwrap();

    let state = Arc::new(AppState { primary, replica });

    let app = Router::new()
        .route("/users/1", get(get_user))
        .route("/users/1/touch", axum::routing::post(update_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Configure separate `PgPool` instances for primary and replica databases with appropriate sizes. Use `max_lifetime` to prevent stale connections after database failovers.

**Why It Matters**: Read replicas reduce load on the primary database by routing 80-95% of typical application traffic (reads) to horizontally scalable replicas. The `max_lifetime` setting is critical for cloud database services that rotate connection credentials or perform maintenance: without it, connections established before a failover silently fail. `acquire_timeout` ensures your API returns a `500` quickly rather than hanging indefinitely when the pool is exhausted—preserving user experience during database pressure events.

---

## Group 32: Streaming Responses

### Example 61: Large File Streaming

Stream large files from disk to the HTTP client using `tokio::fs` and `Body::from_stream` without loading the entire file into memory.

```rust
use axum::{
    body::Body,
    http::{header, StatusCode},
    response::Response,
    routing::get,
    Router,
};
use tokio::io::AsyncReadExt;
use tokio_util::io::ReaderStream;  // => Convert AsyncRead into Stream

#[tokio::main]
async fn main() {
    let app = Router::new().route("/download/:filename", get(download_file));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn download_file(
    axum::extract::Path(filename): axum::extract::Path<String>,
) -> Result<Response, StatusCode> {
    // Security: prevent path traversal attacks
    if filename.contains("..") || filename.contains('/') {
        return Err(StatusCode::BAD_REQUEST);  // => Reject path traversal attempts
    }

    let path = format!("./files/{}", filename);
    // => Only serve files from the ./files/ directory

    // Open the file (returns error if not found)
    let file = tokio::fs::File::open(&path)
        .await
        .map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => StatusCode::NOT_FOUND,       // => 404
            _ => StatusCode::INTERNAL_SERVER_ERROR,                       // => 500
        })?;

    // Get file size for Content-Length header
    let metadata = file.metadata().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let file_size = metadata.len();  // => File size in bytes

    // Convert file into a stream of byte chunks
    let stream = ReaderStream::new(file);
    // => Reads 8KB chunks from disk as client reads them
    // => Memory usage: O(8KB) regardless of file size

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/octet-stream")
        .header(header::CONTENT_LENGTH, file_size)  // => Enable progress bars
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename),
            // => Forces browser download instead of display
        )
        .body(Body::from_stream(stream))  // => Stream file bytes to client
        .unwrap())
}
```

**Key Takeaway**: Use `ReaderStream::new(file)` to convert a `tokio::fs::File` into a stream, then `Body::from_stream(stream)`. The server reads from disk and writes to the network socket in small chunks—constant memory usage.

**Why It Matters**: Memory-efficient file streaming is essential for any application handling files larger than a few megabytes. Without streaming, a 100MB file download would allocate 100MB of heap memory per concurrent download—20 concurrent downloads would allocate 2GB. With streaming, each download uses ~8KB of memory for the read buffer. Path traversal prevention (checking for `..` and `/`) is mandatory: without it, a request for `../../etc/passwd` could expose sensitive system files.

---

## Group 33: Metrics and Observability

### Example 62: Prometheus Metrics with `axum-prometheus`

Expose application metrics in Prometheus format. `axum-prometheus` automatically tracks request counts, latencies, and response sizes.

```rust
// Cargo.toml:
// axum-prometheus = "0.7"
// axum = "0.8"

use axum::{routing::get, Router};
use axum_prometheus::PrometheusMetricLayer;  // => Auto-tracks HTTP metrics

#[tokio::main]
async fn main() {
    // Initialize the Prometheus layer and metrics handle
    let (prometheus_layer, metrics_handle) = PrometheusMetricLayer::pair();
    // => prometheus_layer: middleware that records metrics
    // => metrics_handle: used to render metrics in the /metrics endpoint

    let app = Router::new()
        // Business routes
        .route("/api/items", get(items_handler))
        .route("/api/users", get(users_handler))
        // Metrics endpoint (typically restricted to internal network)
        .route("/metrics", get(move || async move {
            metrics_handle.render()  // => Renders metrics in Prometheus text format
            // => Output: # HELP axum_http_requests_total...
            // => axum_http_requests_total{method="GET",path="/api/items",status="200"} 42
        }))
        .layer(prometheus_layer);  // => Wraps all routes to record metrics
        // => Automatically tracks:
        // => axum_http_requests_total (counter, by method/path/status)
        // => axum_http_request_duration_seconds (histogram, by method/path/status)
        // => axum_http_requests_in_flight (gauge)

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn items_handler() -> &'static str { "items" }
async fn users_handler() -> &'static str { "users" }
```

**Key Takeaway**: `PrometheusMetricLayer::pair()` returns both the middleware layer (records metrics) and a handle (renders them). Expose `/metrics` endpoint for Prometheus scraping.

**Why It Matters**: Prometheus metrics are the industry standard for service observability. With `axum-prometheus`, you immediately gain request rate, error rate, and latency (RED method) metrics for every route—the minimum required to operate a production service. Combined with a Grafana dashboard, these metrics answer "is the service healthy?" and "where is it slow?" in real time. Without metrics, diagnosing a latency increase requires log analysis across many servers, taking minutes instead of seconds.

---

### Example 63: Custom Application Metrics

Record business-level metrics alongside HTTP metrics. Use `metrics` crate macros to track domain-specific counters, gauges, and histograms.

```rust
// Cargo.toml:
// metrics = "0.23"
// metrics-exporter-prometheus = "0.15"
// axum = "0.8"

use axum::{extract::Json, routing::post, Router};
use metrics::{counter, gauge, histogram};  // => Metrics macros
use serde::Deserialize;
use std::time::Instant;

#[derive(Deserialize)]
struct OrderRequest {
    product_id: u64,
    quantity: u32,
    total_cents: i64,
}

async fn create_order(Json(order): Json<OrderRequest>) -> axum::http::StatusCode {
    let start = Instant::now();

    // Business logic (simulated)
    let success = order.total_cents > 0 && order.quantity > 0;

    // Record business metrics
    if success {
        counter!("orders.created.total",            // => Counter: monotonically increasing
            "product" => order.product_id.to_string()  // => Label for breakdown by product
        ).increment(1);
        // => Prometheus: orders_created_total{product="42"} 7

        counter!("revenue.total_cents").increment(order.total_cents as u64);
        // => Total revenue in cents (derive dollars in Grafana)
    } else {
        counter!("orders.failed.total").increment(1);
        // => Track failure rate
    }

    // Record order processing latency
    histogram!("order.processing_duration_seconds").record(
        start.elapsed().as_secs_f64()  // => Processing time as float seconds
    );
    // => Prometheus: order_processing_duration_seconds{quantile="0.99"} 0.003

    // Track pending orders (gauge: can go up or down)
    gauge!("orders.in_processing").set(42.0);
    // => Prometheus: orders_in_processing 42

    if success {
        axum::http::StatusCode::CREATED
    } else {
        axum::http::StatusCode::UNPROCESSABLE_ENTITY
    }
}

#[tokio::main]
async fn main() {
    // Install Prometheus exporter (exports at /metrics if using metrics-exporter-prometheus)
    metrics_exporter_prometheus::PrometheusBuilder::new()
        .install()
        .expect("Failed to install Prometheus exporter");

    let app = Router::new().route("/orders", post(create_order));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `counter!`, `gauge!`, and `histogram!` macros from the `metrics` crate. Counters track totals, gauges track current state, and histograms track distributions (latency, response sizes).

**Why It Matters**: HTTP-level metrics tell you the service is having errors; business metrics tell you what business impact those errors have. "5% error rate on `/orders`" is an alert; "revenue drop of $2,000/minute" is a crisis. Business metrics in Prometheus enable Grafana dashboards that connect technical metrics to business outcomes, which accelerates incident response from "is this actually bad?" to "this is bad and here is exactly how bad" in seconds.

---

## Group 34: Distributed Tracing

### Example 64: OpenTelemetry Tracing

Distributed tracing propagates context across service boundaries. OpenTelemetry is the standard library for emitting traces to backends like Jaeger, Zipkin, or Honeycomb.

```rust
// Cargo.toml:
// opentelemetry = "0.27"
// opentelemetry_sdk = { version = "0.27", features = ["rt-tokio"] }
// opentelemetry-otlp = { version = "0.27", features = ["tonic"] }
// tracing-opentelemetry = "0.28"
// axum = "0.8"
// tracing = "0.1"

use axum::{extract::Path, routing::get, Router};
use opentelemetry::global;
use opentelemetry_sdk::trace::SdkTracerProvider;
use tracing::{info_span, instrument};
use tracing_opentelemetry::OpenTelemetrySpanExt;

fn init_tracer() -> SdkTracerProvider {
    // Configure OTLP exporter (sends to Jaeger, Honeycomb, etc.)
    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()                               // => gRPC transport
        .build()
        .expect("Failed to create OTLP exporter");
        // => Reads OTEL_EXPORTER_OTLP_ENDPOINT env var (default: http://localhost:4317)

    SdkTracerProvider::builder()
        .with_batch_exporter(exporter, opentelemetry_sdk::runtime::Tokio)
        // => Batch exporter: buffers spans and sends periodically (efficient)
        .build()
}

// Handler with manual span creation and propagation
#[instrument(                           // => Creates tracing span for this function
    name = "get_product",               // => Span name in Jaeger UI
    fields(product.id = %id, otel.kind = "SERVER")  // => OTel semantic conventions
)]
async fn get_product(Path(id): Path<u64>) -> String {
    // Add business context to the current span
    let span = tracing::Span::current();
    span.set_attribute("product.type", "widget");  // => Custom span attribute

    // Simulate downstream call (would propagate context to microservice)
    let data = fetch_product_data(id).await;

    info!(product.id = id, "Product fetched");  // => Logged within this span
    data
}

#[instrument(name = "fetch_product_data")]  // => Child span for DB/service call
async fn fetch_product_data(id: u64) -> String {
    // In real code: propagate trace context to downstream HTTP call
    // via W3C Trace-Context headers (traceparent, tracestate)
    tokio::time::sleep(std::time::Duration::from_millis(5)).await;
    format!("Product {}", id)
    // => Span duration recorded: ~5ms (visible in Jaeger)
}

#[tokio::main]
async fn main() {
    let provider = init_tracer();
    global::set_tracer_provider(provider.clone());  // => Install as global tracer

    // tracing-opentelemetry bridges tracing spans → OTel spans automatically
    let otel_layer = tracing_opentelemetry::layer();
    use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(otel_layer)                            // => Forward spans to OTel
        .init();

    let app = Router::new().route("/products/:id", get(get_product));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    // Flush remaining spans on shutdown
    provider.shutdown().ok();
}
```

**Key Takeaway**: Use `#[instrument]` with `tracing-opentelemetry` to bridge `tracing` spans to OpenTelemetry automatically. Install the global OTel tracer provider before starting the server.

**Why It Matters**: Distributed tracing is essential for debugging latency in microservice architectures. When a request traverses 5 services, traditional logs cannot tell you which service caused a 2-second delay. A distributed trace shows the entire request timeline as a tree: service A called service B (50ms), which called service C (1.8s, the bottleneck). OpenTelemetry is vendor-neutral—the same instrumentation sends to Jaeger (open source), Honeycomb, or Datadog without code changes.

---

## Group 35: Caching

### Example 65: In-Memory Caching with `moka`

The `moka` crate provides a high-performance, concurrent in-memory cache with TTL expiration and LRU eviction.

```rust
// Cargo.toml:
// moka = { version = "0.12", features = ["future"] }
// axum = "0.8"

use axum::{extract::{Path, State}, routing::get, Json, Router};
use moka::future::Cache;  // => Async-aware concurrent cache
use serde::Serialize;
use std::sync::Arc;
use std::time::Duration;

#[derive(Serialize, Clone)]
struct Product {
    id: u64,
    name: String,
    price_cents: u64,
}

#[derive(Clone)]
struct AppState {
    // Cache: key=product_id (u64), value=Product, max 1000 entries
    product_cache: Cache<u64, Product>,  // => Thread-safe, no Arc needed (already Arc inside)
}

async fn get_product(
    Path(id): Path<u64>,
    State(state): State<Arc<AppState>>,
) -> Json<Product> {
    // Check cache first (O(1) concurrent lookup, lock-free in common case)
    if let Some(product) = state.product_cache.get(&id).await {
        return Json(product);               // => Cache hit: return immediately
        // => No database query required
    }

    // Cache miss: fetch from database (simulated)
    let product = fetch_from_db(id).await;  // => Simulated DB call

    // Store in cache with TTL
    state.product_cache.insert(id, product.clone()).await;
    // => Expires after 5 minutes (configured at cache creation)
    // => Evicted if cache exceeds 1000 entries (LRU policy)

    Json(product)
}

async fn fetch_from_db(id: u64) -> Product {
    // Simulate database latency
    tokio::time::sleep(Duration::from_millis(20)).await;
    Product {
        id,
        name: format!("Product {}", id),
        price_cents: 999,
    }
}

#[tokio::main]
async fn main() {
    let product_cache = Cache::builder()
        .max_capacity(1000)              // => LRU eviction when > 1000 entries
        .time_to_live(Duration::from_secs(300))   // => Entries expire after 5 minutes
        .time_to_idle(Duration::from_secs(60))    // => Evict if not accessed for 1 minute
        .build();

    let state = Arc::new(AppState { product_cache });

    let app = Router::new()
        .route("/products/:id", get(get_product))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: `moka::future::Cache` is a concurrent in-memory cache. Use `get().await` for cache hits and `insert().await` for cache population. Configure TTL and capacity at creation.

**Why It Matters**: For read-heavy workloads with slowly changing data (product catalogs, user profiles, configuration), in-memory caching reduces database queries by 80-99%. A cache hit returns in microseconds versus milliseconds for a database query—a 100-1000x latency improvement for cached data. Moka's lock-free concurrent design means the cache itself does not become a throughput bottleneck under high concurrency. TTL ensures stale data is evicted automatically without manual invalidation logic.

---

## Group 36: API Versioning

### Example 66: URL-Based API Versioning

Manage multiple API versions using nested routers with version prefixes. This enables safe, gradual migration of clients to newer API versions.

```rust
use axum::{routing::get, Router, Json};
use serde::Serialize;

// V1 response: original format
#[derive(Serialize)]
struct UserV1 {
    id: u64,
    name: String,  // => V1: single name field
}

// V2 response: expanded format (breaking change from V1)
#[derive(Serialize)]
struct UserV2 {
    id: u64,
    first_name: String,   // => V2: split into first/last
    last_name: String,
    email: String,        // => V2: added email field
}

// V1 handlers
async fn get_user_v1() -> Json<UserV1> {
    Json(UserV1 { id: 1, name: "Alice Smith".to_string() })
    // => {"id":1,"name":"Alice Smith"}
}

// V2 handlers (different response structure)
async fn get_user_v2() -> Json<UserV2> {
    Json(UserV2 {
        id: 1,
        first_name: "Alice".to_string(),
        last_name: "Smith".to_string(),
        email: "alice@example.com".to_string(),
    })
    // => {"id":1,"first_name":"Alice","last_name":"Smith","email":"alice@example.com"}
}

// Build V1 router - all V1 routes in one function
fn v1_router() -> Router {
    Router::new()
        .route("/users/:id", get(get_user_v1))
        // => GET /api/v1/users/:id
        // Add more V1 routes here as needed
}

// Build V2 router - V2 adds and modifies routes
fn v2_router() -> Router {
    Router::new()
        .route("/users/:id", get(get_user_v2))
        // => GET /api/v2/users/:id (breaking change)
        // Routes that didn't change can call v1 handlers directly
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .nest("/api/v1", v1_router())  // => All v1 routes under /api/v1
        .nest("/api/v2", v2_router())  // => All v2 routes under /api/v2
        .route("/api/latest", get(|| async { "Redirect to v2" }));
        // => Optional: /api/latest as alias for current stable version

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Organize version-specific routes into dedicated router functions and nest them under `/api/v1`, `/api/v2`, etc. Each version's router is independent—changing v2 handlers does not affect v1.

**Why It Matters**: API versioning is how you evolve a public API without breaking existing clients. The URL-based approach (`/api/v1`, `/api/v2`) is the most explicit: clients know exactly which version they are using, and the version is visible in logs and monitoring. Maintaining both versions in the same codebase with shared data layer means you can run v1 and v2 simultaneously with a single deployment, deprecating v1 over time as clients migrate. The cost is code duplication, which is acceptable for the operational clarity gained.

---

## Group 37: Circuit Breaker Pattern

### Example 67: Circuit Breaker for External Services

The circuit breaker pattern prevents cascading failures by stopping calls to an unhealthy external service and allowing recovery time.

```rust
// Cargo.toml:
// tokio = { version = "1", features = ["full"] }
// axum = "0.8"

use axum::{extract::State, routing::get, Router};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// Circuit breaker states
#[derive(Debug, PartialEq)]
enum CircuitState {
    Closed,    // => Normal operation: requests pass through
    Open,      // => Failing: requests rejected immediately (no external calls)
    HalfOpen,  // => Recovering: allow one probe request
}

struct CircuitBreaker {
    state: CircuitState,
    failure_count: u32,
    last_failure: Option<Instant>,
    failure_threshold: u32,     // => Open circuit after this many failures
    recovery_timeout: Duration, // => Wait this long before trying HalfOpen
}

impl CircuitBreaker {
    fn new(failure_threshold: u32, recovery_timeout: Duration) -> Self {
        Self {
            state: CircuitState::Closed,
            failure_count: 0,
            last_failure: None,
            failure_threshold,
            recovery_timeout,
        }
    }

    // Returns true if the request should be allowed through
    fn allow_request(&mut self) -> bool {
        match self.state {
            CircuitState::Closed => true,  // => Allow: normal operation
            CircuitState::Open => {
                // Check if recovery timeout has elapsed
                if let Some(last) = self.last_failure {
                    if last.elapsed() > self.recovery_timeout {
                        self.state = CircuitState::HalfOpen;  // => Try recovery
                        return true;  // => Allow probe request
                    }
                }
                false  // => Still within timeout: reject request
            }
            CircuitState::HalfOpen => true,  // => Allow one probe request
        }
    }

    fn record_success(&mut self) {
        self.failure_count = 0;
        self.state = CircuitState::Closed;  // => Recovery confirmed: close circuit
    }

    fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_failure = Some(Instant::now());

        if self.failure_count >= self.failure_threshold {
            self.state = CircuitState::Open;  // => Too many failures: open circuit
        }
    }
}

#[derive(Clone)]
struct AppState {
    breaker: Arc<Mutex<CircuitBreaker>>,
}

async fn proxy_request(State(state): State<Arc<AppState>>) -> axum::http::StatusCode {
    // Check if circuit allows this request
    {
        let mut breaker = state.breaker.lock().unwrap();
        if !breaker.allow_request() {
            return axum::http::StatusCode::SERVICE_UNAVAILABLE;
            // => 503: circuit is open, external service bypassed
        }
    }

    // Call external service (simulated; 50% failure rate)
    let success = rand_bool();

    // Update circuit breaker based on outcome
    let mut breaker = state.breaker.lock().unwrap();
    if success {
        breaker.record_success();   // => Healthy: reset failure count
        axum::http::StatusCode::OK
    } else {
        breaker.record_failure();   // => Failed: increment failure count
        axum::http::StatusCode::BAD_GATEWAY  // => 502: upstream error
    }
}

fn rand_bool() -> bool { true } // Simplified; use random in real code

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        breaker: Arc::new(Mutex::new(CircuitBreaker::new(
            5,                            // => Open after 5 failures
            Duration::from_secs(30),     // => Try recovery after 30 seconds
        ))),
    });
    let app = Router::new()
        .route("/proxy", get(proxy_request))
        .with_state(state);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: A circuit breaker transitions through Closed → Open → HalfOpen states. In Open state, requests fail immediately without calling the external service, preventing cascading failures.

**Why It Matters**: Without circuit breakers, a slow or failing external service causes your service to fail slowly—every request to the failing dependency blocks for its timeout period, exhausting your connection pool and making all other requests slow. Circuit breakers make failures fast: once the circuit opens, failing requests complete in microseconds with a `503`, preserving capacity for requests that do not depend on the failing service. This is a foundational resilience pattern for microservice architectures.

---

## Group 38: Production Deployment

### Example 68: Docker Multi-Stage Build

Multi-stage Docker builds produce minimal production images by separating the Rust compilation environment from the runtime environment.

```dockerfile
# Dockerfile for Axum application
# Stage 1: Build
FROM rust:1.83-slim AS builder
# => rust:1.83-slim: official Rust image, slim variant for smaller base

WORKDIR /app

# Copy dependency files first (layer caching optimization)
COPY Cargo.toml Cargo.lock ./
# => Copying these first enables Docker layer caching:
# => If source code changes but dependencies don't, Cargo.toml layer is cached
# => Next RUN only re-downloads if Cargo.toml/Cargo.lock changes

# Build dependencies with a dummy main (enables caching of dependency compilation)
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
# => Compiles all dependencies (slow: 2-5 minutes first time)
# => Subsequent builds with unchanged deps skip this layer (seconds)
RUN rm -rf src

# Copy actual source code and build
COPY src ./src
RUN touch src/main.rs  # => Ensure cargo detects changed source
RUN cargo build --release
# => Final binary at: /app/target/release/my_axum_app
# => Statically linked (no runtime dependencies needed)

# Stage 2: Runtime (minimal image)
FROM debian:bookworm-slim AS runtime
# => debian:bookworm-slim: ~80MB vs rust:1.83-slim ~700MB

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \   # => Required for HTTPS outbound calls
    libpq5 \            # => PostgreSQL client library (if using sqlx postgres)
    && rm -rf /var/lib/apt/lists/*  # => Clean up to reduce image size

WORKDIR /app

# Copy only the compiled binary from builder
COPY --from=builder /app/target/release/my_axum_app .
# => ~10MB binary vs ~700MB full Rust toolchain

# Non-root user for security
RUN useradd -r -s /bin/false app_user
USER app_user

EXPOSE 3000                        # => Document the port (does not actually open it)
ENV RUST_LOG="info"               # => Default log level

CMD ["./my_axum_app"]             # => Start the binary
```

```bash
# Build and run
docker build -t my-axum-app .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@host/db" \
  -e AUTH__JWT_SECRET="production-secret-from-vault" \
  my-axum-app
# => Passes secrets via environment variables (not baked into image)
```

**Key Takeaway**: Use two-stage Docker builds: `rust:slim` for compilation, `debian:slim` for runtime. The runtime image contains only the binary and its libraries—dramatically smaller and more secure than single-stage builds.

**Why It Matters**: A single-stage Rust Docker image is 700MB-1GB (includes compiler, cargo, source code). A multi-stage build produces a 15-50MB image (binary + minimal OS). Smaller images mean faster deploys (less to pull from registry), reduced attack surface (less software to exploit), and lower container registry costs. Running as a non-root user prevents privilege escalation attacks—if the container is compromised, the attacker has minimal OS permissions. This is standard production practice for any containerized Rust service.

---

### Example 69: Kubernetes-Ready Health Configuration

Configure liveness and readiness probes to integrate cleanly with Kubernetes pod lifecycle management.

```rust
use axum::{
    extract::State,
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use sqlx::PgPool;
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};

#[derive(Clone)]
struct AppState {
    db: PgPool,
    ready: Arc<AtomicBool>,  // => Readiness flag (can be flipped by shutdown logic)
}

#[derive(Serialize)]
struct HealthJson {
    status: &'static str,
    version: &'static str,
}

// Kubernetes liveness probe: /healthz
// Returns 200 if process is alive (not deadlocked)
// Kubernetes restarts pod if this returns non-200
async fn liveness() -> Json<HealthJson> {
    Json(HealthJson {
        status: "alive",
        version: env!("CARGO_PKG_VERSION"),  // => From Cargo.toml at compile time
    })
    // => Always returns 200 while process is running
    // => Kubernetes kubectl: livenessProbe.httpGet.path = /healthz
}

// Kubernetes readiness probe: /readyz
// Returns 200 if instance can serve traffic
// Kubernetes removes pod from Service endpoints if this returns non-200
async fn readiness(State(state): State<Arc<AppState>>) -> (StatusCode, Json<serde_json::Value>) {
    // Check if the app is in the ready state (set to false during shutdown)
    if !state.ready.load(Ordering::Relaxed) {
        return (StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"status": "not ready", "reason": "shutting down"})));
        // => 503 during graceful shutdown: Kubernetes stops routing traffic here
    }

    // Verify database connectivity
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "ready", "db": "ok"}))),
        Err(e) => (StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"status": "not ready", "db": format!("error: {}", e)}))),
    }
}

#[tokio::main]
async fn main() {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await.unwrap();
    let ready = Arc::new(AtomicBool::new(true));

    let state = Arc::new(AppState { db: pool, ready: ready.clone() });

    let app = Router::new()
        .route("/healthz", get(liveness))   // => Kubernetes liveness probe
        .route("/readyz", get(readiness))   // => Kubernetes readiness probe
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            // On shutdown signal: mark not ready before draining
            tokio::signal::ctrl_c().await.ok();
            ready.store(false, Ordering::Relaxed);  // => Tell K8s to stop routing here
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            // => Wait 5 seconds for K8s to stop routing (propagation delay)
        })
        .await
        .unwrap();
}
```

**Key Takeaway**: Set `ready` to `false` before draining connections during shutdown. The readiness probe returning `503` signals Kubernetes to remove the pod from the load balancer before connections are closed.

**Why It Matters**: The shutdown sequence matters: Kubernetes propagates readiness probe failures to the load balancer in 1-5 seconds. Without the `ready = false` step and a short sleep before accepting shutdown, the pod begins refusing connections while Kubernetes still routes traffic to it—causing brief `503` errors during every rolling deploy. This sleep-based solution is the standard Kubernetes graceful shutdown pattern, ensuring zero-downtime deploys for services with proper health probe configuration.

---

### Example 70: Environment-Specific Cargo Features

Use Cargo feature flags to enable or disable functionality (debug endpoints, test helpers) based on build profile.

```rust
// Cargo.toml:
// [features]
// default = []
// debug-endpoints = []  # Enable /debug/* routes (development only)
// mock-external = []    # Use mock external services (testing)

use axum::{routing::get, Router};

fn build_router() -> Router {
    let mut app = Router::new()
        .route("/", get(|| async { "Production ready" }))
        .route("/health", get(|| async { "OK" }));

    // Debug endpoints: only compiled and exposed when feature is enabled
    #[cfg(feature = "debug-endpoints")]
    {
        // => This block is entirely absent from production binary
        // => cargo build --features debug-endpoints to include
        app = app
            .route("/debug/state", get(debug_state))
            // => Exposes internal state - NEVER in production
            .route("/debug/panic", get(trigger_panic));
            // => Test panic handling - NEVER in production
    }

    app
}

#[cfg(feature = "debug-endpoints")]
async fn debug_state() -> &'static str {
    "Internal state dump (debug only)"
}

#[cfg(feature = "debug-endpoints")]
async fn trigger_panic() -> &'static str {
    panic!("Triggered for testing");
}

#[tokio::main]
async fn main() {
    let app = build_router();
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// Run with debug endpoints:
// cargo run --features debug-endpoints
//
// Production (no debug endpoints):
// cargo build --release
```

**Key Takeaway**: Use `#[cfg(feature = "...")]` to conditionally compile code. Debug endpoints, admin tools, and test helpers are absent from the production binary at the compiler level—not just at runtime.

**Why It Matters**: Conditional compilation provides a stronger security guarantee than environment-variable feature flags: debug endpoints that are conditionally compiled out of the production binary cannot be accidentally enabled by environment misconfiguration. A misconfigured `DEBUG_ENABLED=true` environment variable exposes your debug routes if you use runtime guards; `cargo build --release` without `--features debug-endpoints` guarantees those routes do not exist in the compiled binary, regardless of configuration.

---

## Group 39: Advanced Patterns

### Example 71: Request ID Propagation

Assign a unique ID to every request and propagate it through logs and response headers for end-to-end request tracing.

```rust
use axum::{
    extract::Extension,
    http::{Request, Response as HttpResponse},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Router,
};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

// Global request counter (or use UUID for distributed systems)
static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Debug)]
struct RequestId(String);  // => Newtype for type-safe request ID

// Middleware: assign request ID and add to response headers
async fn request_id_middleware(
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Response {
    // Generate a unique ID for this request
    let id = format!(
        "req-{:016x}",
        REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed)
        // => "req-0000000000000001", "req-0000000000000002", ...
        // => Use uuid::Uuid::new_v4().to_string() for distributed systems
    );

    // Insert into request extensions for handlers
    request.extensions_mut().insert(RequestId(id.clone()));
    // => Handlers can access via Extension<RequestId>

    // Propagate in structured logs automatically via tracing span
    let _span = tracing::info_span!("request", request_id = %id);

    // Process the request
    let mut response = next.run(request).await;

    // Add request ID to response headers (for client-side debugging)
    response.headers_mut().insert(
        "X-Request-ID",
        id.parse().unwrap(),  // => Client can log this for support tickets
    );

    response
}

async fn handler(Extension(req_id): Extension<RequestId>) -> String {
    tracing::info!(request_id = %req_id.0, "Processing request");
    // => Logs: "Processing request" with request_id field
    format!("Processed: {}", req_id.0)
    // => "Processed: req-0000000000000042"
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(handler))
        .layer(middleware::from_fn(request_id_middleware));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Generate a request ID in middleware, insert it in extensions for handlers, and add it to response headers. This creates a correlation ID visible to both server logs and API clients.

**Why It Matters**: Request IDs are the primary tool for correlating a user's "my request failed" report with a specific log entry. Without request IDs, finding the relevant log among thousands of concurrent requests requires time-based filtering and guessing. With request IDs, support staff can ask "what is your X-Request-ID from the response header?" and immediately find every log entry, database query, and downstream call for that exact request. This reduces debugging time from hours to seconds.

---

### Example 72: Conditional Request Handling with ETag

ETags enable conditional GET requests, allowing clients to cache responses and validate freshness with a single round-trip when the data has not changed.

```rust
use axum::{
    http::{header, HeaderMap, StatusCode},
    response::Response,
    routing::get,
    Router,
};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

// Compute a simple hash-based ETag for data
fn compute_etag(data: &str) -> String {
    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    format!("\"{:x}\"", hasher.finish())
    // => Format: "\"abc123def456\"" (quoted per RFC 7232)
    // => Use SHA-256 or MD5 for production
}

async fn get_data(headers: HeaderMap) -> Response {
    // Simulate fetching data (would come from DB in production)
    let data = r#"{"id":1,"name":"Alice","role":"admin"}"#;

    // Compute ETag for the current data
    let etag = compute_etag(data);
    // => e.g., "\"7f4a6b82c1d93e5f\""

    // Check If-None-Match header (client's cached ETag)
    let if_none_match = headers
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if if_none_match == etag {
        // Client has current version - no need to send data
        return Response::builder()
            .status(StatusCode::NOT_MODIFIED)   // => 304 Not Modified
            .header(header::ETAG, &etag)        // => Always include ETag in 304
            .body(axum::body::Body::empty())
            .unwrap();
        // => No body, no bandwidth, minimal latency
    }

    // Data changed (or no cache): send full response with ETag
    Response::builder()
        .status(StatusCode::OK)
        .header(header::ETAG, &etag)            // => Client stores this for next request
        .header(header::CONTENT_TYPE, "application/json")
        .body(axum::body::Body::from(data))
        .unwrap()
    // => Full response with current data
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/data", get(get_data));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Compute a content hash as the ETag. Return `304 Not Modified` if `If-None-Match` matches, saving bandwidth and response time.

**Why It Matters**: ETags implement HTTP's built-in caching protocol without any client-side caching infrastructure. For data that changes infrequently, a `304 Not Modified` response uses negligible bandwidth and latency compared to resending the full response. For mobile clients on slow connections, this is the difference between instant perceived response (client uses cached data) and a multi-second wait. ETags also prevent "cache poisoning" window issues that exist with time-based `Cache-Control: max-age` caching.

---

### Example 73: Pagination with Cursor-Based Navigation

Cursor-based pagination scales better than offset-based pagination for large datasets. The cursor is an opaque token encoding the position in the result set.

```rust
use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};

#[derive(Clone)]
struct AppState { db: PgPool }

#[derive(Deserialize)]
struct CursorParams {
    after: Option<String>,  // => Opaque cursor from previous response
    limit: Option<u32>,     // => Items per page (default 20, max 100)
}

#[derive(Serialize, sqlx::FromRow)]
struct Item {
    id: i64,
    name: String,
}

#[derive(Serialize)]
struct PaginatedResponse {
    items: Vec<Item>,
    next_cursor: Option<String>,  // => None if no more items
    has_more: bool,               // => true if next_cursor is Some
}

// Encode cursor: last item ID → base64 string
fn encode_cursor(id: i64) -> String {
    URL_SAFE_NO_PAD.encode(id.to_be_bytes())
    // => Encodes i64 as URL-safe base64 (no = padding)
    // => e.g., id=42 → "AAAAAAAAKg"
}

// Decode cursor: base64 string → last item ID
fn decode_cursor(cursor: &str) -> Option<i64> {
    let bytes = URL_SAFE_NO_PAD.decode(cursor).ok()?;
    let arr: [u8; 8] = bytes.try_into().ok()?;
    Some(i64::from_be_bytes(arr))
    // => "AAAAAAAAKg" → 42
}

async fn list_items(
    State(state): State<Arc<AppState>>,
    Query(params): Query<CursorParams>,
) -> Json<PaginatedResponse> {
    let limit = params.limit.unwrap_or(20).min(100) as i64;
    // => Clamp to max 100 to prevent abuse
    let fetch_count = limit + 1;
    // => Fetch one extra to determine if there are more items

    let after_id = params.after
        .as_deref()
        .and_then(decode_cursor)
        .unwrap_or(0);         // => Start from beginning if no cursor

    let items: Vec<Item> = sqlx::query_as(
        "SELECT id, name FROM items WHERE id > $1 ORDER BY id LIMIT $2"
        // => id > $1: items after the cursor position
        // => ORDER BY id: deterministic ordering required for cursor pagination
        // => LIMIT $2: fetch limit + 1 to check for more
    )
    .bind(after_id)
    .bind(fetch_count)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let has_more = items.len() as i64 > limit;
    let items: Vec<Item> = items.into_iter().take(limit as usize).collect();
    // => Drop the extra item (used only to check has_more)

    let next_cursor = if has_more {
        items.last().map(|item| encode_cursor(item.id))
        // => Encode last returned item's ID as cursor
    } else {
        None  // => No more items
    };

    Json(PaginatedResponse {
        has_more,
        next_cursor,
        items,
    })
}

#[tokio::main]
async fn main() {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await.unwrap();
    let state = Arc::new(AppState { db: pool });
    let app = Router::new().route("/items", get(list_items)).with_state(state);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Encode the last returned item's ID as an opaque base64 cursor. Use `WHERE id > $cursor ORDER BY id LIMIT $n+1` to fetch the next page. Fetch `n+1` items to detect if more pages exist.

**Why It Matters**: Offset-based pagination (`LIMIT 20 OFFSET 200`) requires the database to scan and discard 200 rows to return rows 201-220—a cost that grows linearly with page number. Cursor-based pagination uses an index seek (`WHERE id > 200`), which is O(1) regardless of page depth. For tables with millions of rows, offset pagination becomes unacceptably slow beyond page 100; cursor pagination remains fast at page 10,000. Opaque cursors also hide your database's internal ID scheme from clients.

---

### Example 74: Background Task Management with `tokio::spawn`

Long-running or periodic tasks run as Tokio tasks. Use channels to communicate between request handlers and background tasks.

```rust
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;  // => Multi-producer single-consumer channel

// Job submitted via API
#[derive(Deserialize, Clone)]
struct Job {
    id: String,
    payload: String,
}

// Result sent back after processing
#[derive(Serialize, Clone)]
struct JobResult {
    id: String,
    status: String,
}

#[derive(Clone)]
struct AppState {
    job_sender: mpsc::Sender<Job>,       // => Send jobs to background worker
    result_store: Arc<std::sync::Mutex<Vec<JobResult>>>,  // => Accumulate results
}

// API handler: enqueue a job for background processing
async fn submit_job(
    State(state): State<Arc<AppState>>,
    Json(job): Json<Job>,
) -> axum::http::StatusCode {
    match state.job_sender.try_send(job) {
        Ok(_) => axum::http::StatusCode::ACCEPTED,  // => 202: job queued
        Err(mpsc::error::TrySendError::Full(_)) => {
            axum::http::StatusCode::TOO_MANY_REQUESTS  // => 429: queue full
        }
        Err(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
    }
}

// API handler: list completed jobs
async fn list_results(State(state): State<Arc<AppState>>) -> Json<Vec<JobResult>> {
    let results = state.result_store.lock().unwrap().clone();
    Json(results)
}

// Background worker: processes jobs from the channel
async fn job_worker(
    mut receiver: mpsc::Receiver<Job>,
    result_store: Arc<std::sync::Mutex<Vec<JobResult>>>,
) {
    while let Some(job) = receiver.recv().await {  // => Wait for next job
        println!("Processing job: {}", job.id);

        // Simulate work (real: DB write, email send, PDF generation, etc.)
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        let result = JobResult {
            id: job.id.clone(),
            status: format!("processed: {}", job.payload),
        };

        result_store.lock().unwrap().push(result);  // => Store result
        println!("Completed job: {}", job.id);
    }
}

#[tokio::main]
async fn main() {
    let (sender, receiver) = mpsc::channel(100);  // => Queue capacity: 100 jobs
    let result_store = Arc::new(std::sync::Mutex::new(Vec::new()));

    // Spawn background worker task
    tokio::spawn(job_worker(receiver, result_store.clone()));
    // => Runs concurrently with the HTTP server

    let state = Arc::new(AppState { job_sender: sender, result_store });

    let app = Router::new()
        .route("/jobs", post(submit_job).get(list_results))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Use `mpsc::channel` to decouple HTTP handlers from background work. Handlers enqueue jobs with `try_send` (non-blocking) and return `202 Accepted` immediately. The background task processes jobs at its own pace.

**Why It Matters**: Fire-and-forget background tasks are essential for any work that takes longer than an acceptable HTTP response time (typically 200ms-2s). Email sending, PDF generation, image processing, and webhook delivery are canonical examples. Returning `202 Accepted` immediately improves user experience while work continues in the background. The bounded `mpsc::channel` capacity (`100` jobs) provides natural backpressure—the `429 Too Many Requests` response tells clients to retry rather than silently dropping jobs.

---

### Example 75: API Rate Limiting by User

Implement per-user rate limiting that distinguishes authenticated users from anonymous users, applying different limits based on tier.

```rust
use axum::{
    http::{Request, Response, StatusCode},
    middleware::{self, Next},
    routing::get,
    Router,
};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

// Simple sliding window rate limiter state per user
struct UserRateState {
    request_times: Vec<Instant>,  // => Timestamps of recent requests
    window: Duration,             // => Rate limit window (e.g., 60 seconds)
    limit: u32,                   // => Max requests per window
}

impl UserRateState {
    fn new(limit: u32, window: Duration) -> Self {
        Self { request_times: Vec::new(), window, limit }
    }

    fn is_allowed(&mut self) -> bool {
        let now = Instant::now();
        // Remove timestamps outside the window
        self.request_times.retain(|t| now.duration_since(*t) < self.window);
        // => Only keep timestamps within the last `window` seconds

        if self.request_times.len() as u32 >= self.limit {
            return false;  // => Limit exceeded
        }
        self.request_times.push(now);  // => Record this request
        true
    }
}

type RateLimitStore = Arc<Mutex<HashMap<String, UserRateState>>>;

// Middleware: per-user rate limiting
async fn per_user_rate_limit(
    request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response<axum::body::Body>, StatusCode> {
    // Extract user ID from Authorization header (simplified)
    let user_key = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            // Anonymous: key by IP address (from X-Forwarded-For)
            request.headers()
                .get("X-Forwarded-For")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("unknown")
                .to_string()
        });

    // Check rate limit for this user
    // In production: use AppState instead of thread-local store
    static STORE: std::sync::OnceLock<RateLimitStore> = std::sync::OnceLock::new();
    let store = STORE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));

    let allowed = {
        let mut map = store.lock().unwrap();
        let state = map.entry(user_key).or_insert_with(|| {
            UserRateState::new(60, Duration::from_secs(60))
            // => 60 requests per 60 seconds per user
        });
        state.is_allowed()
    };

    if !allowed {
        return Err(StatusCode::TOO_MANY_REQUESTS);  // => 429
    }

    Ok(next.run(request).await)
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/data", get(|| async { "data" }))
        .layer(middleware::from_fn(per_user_rate_limit));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Per-user rate limiting distinguishes between users with different entitlements. Sliding window tracking removes timestamps outside the window on every check, accurately counting requests within the current period.

**Why It Matters**: Global rate limiting treats all users equally—a single abusive user can consume the entire rate limit allocation, starving legitimate users. Per-user rate limiting provides fairness and enables tiered service models (free users: 60 req/min, paid users: 6000 req/min). The sliding window algorithm is more accurate than fixed windows (which reset all at once) for evenly distributing requests over time. Production implementations use Redis for distributed rate limiting across multiple server instances.

---

### Example 76: Webhook Delivery with Retry Logic

Implement reliable outbound webhook delivery with exponential backoff retry using Tokio tasks.

```rust
use axum::{
    extract::{Json, State},
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::time::{sleep, Duration};

#[derive(Deserialize, Clone, Serialize)]
struct Event {
    event_type: String,   // => e.g., "user.created"
    data: serde_json::Value,  // => Event payload
}

#[derive(Clone)]
struct AppState {
    webhook_url: String,    // => Target URL to deliver events
    http_client: reqwest::Client,  // => Reusable HTTP client (connection pool inside)
}

// Deliver a webhook with exponential backoff retry
async fn deliver_webhook(
    client: reqwest::Client,
    url: String,
    event: Event,
    max_retries: u32,
) {
    let payload = serde_json::to_string(&event).unwrap();

    for attempt in 0..=max_retries {
        let result = client
            .post(&url)
            .header("Content-Type", "application/json")
            .header("X-Event-Type", &event.event_type)
            .body(payload.clone())
            .send()
            .await;

        match result {
            Ok(resp) if resp.status().is_success() => {
                tracing::info!(attempt, "Webhook delivered successfully");
                return;  // => Success: stop retrying
            }
            Ok(resp) => {
                tracing::warn!(attempt, status = %resp.status(), "Webhook delivery failed");
            }
            Err(e) => {
                tracing::error!(attempt, error = %e, "Webhook network error");
            }
        }

        if attempt < max_retries {
            // Exponential backoff: 1s, 2s, 4s, 8s...
            let delay = Duration::from_secs(2u64.pow(attempt));
            // => Attempt 0: wait 1s, attempt 1: wait 2s, attempt 2: wait 4s
            sleep(delay).await;
        }
    }

    tracing::error!(max_retries, "Webhook delivery failed after all retries");
    // => In production: store failed events in DB for manual review
}

async fn trigger_event(
    State(state): State<Arc<AppState>>,
    Json(event): Json<Event>,
) -> axum::http::StatusCode {
    let client = state.http_client.clone();
    let url = state.webhook_url.clone();

    // Spawn delivery as background task (non-blocking)
    tokio::spawn(async move {
        deliver_webhook(client, url, event, 4).await;
        // => Max 4 retries: attempts at 0s, 1s, 3s, 7s, 15s
    });

    axum::http::StatusCode::ACCEPTED  // => 202: event accepted, delivery asynchronous
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        webhook_url: "https://webhook.example.com/events".to_string(),
        http_client: reqwest::Client::new(),  // => Reuse client (connection pool)
    });
    let app = Router::new().route("/events", post(trigger_event)).with_state(state);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Spawn webhook delivery as a background `tokio::spawn` task and return `202 Accepted` immediately. Implement exponential backoff with a maximum retry count to handle transient receiver failures.

**Why It Matters**: Reliable webhook delivery is notoriously difficult without retry logic. Network failures, temporary receiver downtime, and slow receivers all cause initial delivery failures. Without retries, your users lose important events. Exponential backoff prevents thundering herd: if a receiver goes down, all webhooks retry simultaneously at fixed intervals, potentially overloading the recovering receiver. Exponential backoff spreads retries over time. For critical events (payments, user actions), production systems store delivery attempts in a database for auditing and manual replay.

---

### Example 77: Axum with tokio-console for Async Debugging

`tokio-console` is a real-time debugger for Tokio tasks. Enable it in development to visualize task scheduling, wakeups, and blocking operations.

```rust
// Cargo.toml [dev-dependencies]:
// console-subscriber = "0.4"  # Enable only in development
//
// To use: RUSTFLAGS="--cfg tokio_unstable" cargo run
// Then in another terminal: tokio-console

use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    // Initialize tokio-console subscriber (development only)
    // In production, replace with tracing-subscriber::fmt
    #[cfg(debug_assertions)]
    console_subscriber::init();
    // => Starts a gRPC server on localhost:6669
    // => tokio-console connects to this port to visualize tasks
    // => Shows: task name, poll count, scheduled/busy/idle time, wakeups

    #[cfg(not(debug_assertions))]
    tracing_subscriber::fmt::init();
    // => Normal text logging in production

    let app = Router::new()
        .route("/", get(handler))
        .route("/slow", get(slow_handler));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// Name your tasks for visibility in tokio-console
async fn handler() -> &'static str {
    tokio::task::Builder::new()
        .name("background-work")  // => Named task: visible in tokio-console
        .spawn(async {
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        })
        .unwrap()
        .await
        .unwrap();
    "OK"
}

async fn slow_handler() -> &'static str {
    // This blocking call will show as "blocked" in tokio-console
    std::thread::sleep(std::time::Duration::from_millis(500));
    // => tokio-console will flag this as blocking the async executor
    // => Should be: tokio::task::spawn_blocking(|| std::thread::sleep(...)).await.unwrap()
    "Slow (blocking - bad practice shown for demonstration)"
}
```

**Key Takeaway**: Add `console_subscriber::init()` under `#[cfg(debug_assertions)]` to enable `tokio-console` in development. Named tasks with `Builder::new().name()` appear clearly in the console UI.

**Why It Matters**: Async runtime starvation—where a task blocks the executor thread—is one of the hardest bugs to diagnose in production Tokio applications. Symptoms include request latency spikes that do not correlate with CPU or database load. `tokio-console` makes these problems immediately visible: blocked tasks show their call stack, and the "busy" vs "scheduled" time breakdown reveals tasks that hold the executor too long. This tool turns a multi-day debugging session into a 10-minute fix.

---

### Example 78: Request Deduplication

Prevent duplicate processing of identical requests using idempotency keys—common in payment APIs and at-least-once delivery systems.

```rust
use axum::{
    extract::{Json, State},
    http::{HeaderMap, StatusCode},
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

#[derive(Deserialize, Clone)]
struct PaymentRequest {
    amount_cents: u64,
    currency: String,
    recipient: String,
}

#[derive(Serialize, Clone)]
struct PaymentResponse {
    payment_id: String,
    status: String,
    idempotent: bool,  // => true if this is a replayed response
}

#[derive(Clone)]
struct CachedResponse {
    response: PaymentResponse,
    created_at: Instant,
}

#[derive(Clone)]
struct AppState {
    idempotency_cache: Arc<Mutex<HashMap<String, CachedResponse>>>,
}

async fn create_payment(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<PaymentRequest>,
) -> Result<(StatusCode, Json<PaymentResponse>), StatusCode> {
    // Require Idempotency-Key header
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::BAD_REQUEST)?;  // => 400 if header missing
    // => Clients MUST provide a unique key per intended operation

    let mut cache = state.idempotency_cache.lock().unwrap();

    // Check if we've already processed this key
    if let Some(cached) = cache.get(idempotency_key) {
        // Expire cache entries after 24 hours
        if cached.created_at.elapsed() < Duration::from_secs(86400) {
            let mut response = cached.response.clone();
            response.idempotent = true;    // => Signal this is a replay
            return Ok((StatusCode::OK, Json(response)));
            // => Return exact same response as original request
        }
        // => Expired entry: treat as new request
    }

    // Process the payment (real: call payment gateway)
    let payment_id = format!("pay_{}", uuid_simple());
    // => Real ID would come from payment processor

    let response = PaymentResponse {
        payment_id,
        status: "completed".to_string(),
        idempotent: false,
    };

    // Cache the response
    cache.insert(idempotency_key.to_string(), CachedResponse {
        response: response.clone(),
        created_at: Instant::now(),
    });

    Ok((StatusCode::CREATED, Json(response)))  // => 201 on first creation
}

fn uuid_simple() -> String { "abc123def456".to_string() } // Simplified

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        idempotency_cache: Arc::new(Mutex::new(HashMap::new())),
    });
    let app = Router::new().route("/payments", post(create_payment)).with_state(state);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Key Takeaway**: Store responses keyed by `Idempotency-Key` header. Return the cached response for duplicate keys, marking it with `idempotent: true`. Expire entries after 24 hours to prevent indefinite memory growth.

**Why It Matters**: Network retries are fundamental in distributed systems—clients cannot know if a request was received but the response was lost. Without idempotency keys, retrying a payment creates a double charge. With idempotency keys, retrying is safe: the server detects the duplicate and returns the original response without re-processing. This is how Stripe, Braintree, and every reliable payment API operates. The pattern applies to any non-idempotent operation: order creation, user registration, and any API that creates resources with side effects.

---

### Example 79: WebSocket Ping/Pong Keep-Alive

Maintain long-lived WebSocket connections by sending application-level ping frames and closing stale connections.

```rust
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::Response,
    routing::get,
    Router,
};
use std::time::Duration;
use tokio::time::{interval, timeout};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/ws", get(ws_handler));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_socket_with_keepalive)
}

async fn handle_socket_with_keepalive(mut socket: WebSocket) {
    let mut ping_interval = interval(Duration::from_secs(30));
    // => Send ping every 30 seconds
    ping_interval.tick().await;  // => Skip initial immediate tick

    loop {
        tokio::select! {
            // Wait for next message from client
            msg = timeout(Duration::from_secs(60), socket.recv()) => {
                // => 60-second timeout: close if no message received
                match msg {
                    Ok(Some(Ok(Message::Text(text)))) => {
                        // Echo text messages
                        if socket.send(Message::Text(format!("Echo: {}", text))).await.is_err() {
                            break;  // => Client disconnected
                        }
                    }
                    Ok(Some(Ok(Message::Pong(_)))) => {
                        // Client responded to our ping - connection is alive
                        tracing::debug!("Received pong - connection healthy");
                    }
                    Ok(Some(Ok(Message::Close(_)))) | Ok(None) => {
                        tracing::info!("Client disconnected gracefully");
                        break;  // => Clean close
                    }
                    Err(_timeout) => {
                        tracing::warn!("WebSocket timeout - no message in 60s, closing");
                        let _ = socket.send(Message::Close(None)).await;
                        break;  // => Close stale connection
                    }
                    _ => {}  // => Other message types
                }
            }
            // Send periodic ping
            _ = ping_interval.tick() => {
                if socket.send(Message::Ping(vec![])).await.is_err() {
                    break;  // => Client disconnected (could not send ping)
                }
                tracing::debug!("Sent ping to client");
            }
        }
    }
}
```

**Key Takeaway**: Use `tokio::select!` to simultaneously wait for client messages and send periodic pings. Close connections that do not respond within a timeout to prevent resource leaks from zombie connections.

**Why It Matters**: Network proxies (Nginx, AWS ALB, Cloudflare) silently close idle TCP connections after 60-300 seconds. Without keep-alive pings, long-lived WebSocket connections that have no message traffic appear idle to the network and get silently terminated—the client and server both think the connection is alive until the next message fails. Application-level pings (sent every 30 seconds) keep the connection alive through all intermediate proxies while also detecting genuinely dead connections faster than TCP keepalive allows.

---

### Example 80: Full Production Setup Checklist

Combine all production concerns into a final, complete application structure demonstrating how everything fits together.

```rust
// This example shows the complete main.rs structure for a production Axum service

use axum::Router;
use std::sync::Arc;
use tokio::signal;

// Application modules (in a real app: separate files)
mod config { pub struct Settings { pub port: u16, pub db_url: String, pub jwt_secret: String } }
mod state { pub struct AppState { pub config: Arc<super::config::Settings> } }

async fn build_app(state: Arc<state::AppState>) -> Router {
    // 1. Domain routers (organized by feature)
    let api_router = Router::new()
        // .merge(users::router())   // => User management routes
        // .merge(products::router()) // => Product routes
        // .merge(orders::router())   // => Order routes
        ;

    // 2. Health and observability routes (outside API prefix, no auth)
    let infra_router = Router::new()
        .route("/healthz", axum::routing::get(|| async { "alive" }))   // => K8s liveness
        .route("/readyz", axum::routing::get(|| async { "ready" }));    // => K8s readiness

    // 3. Compose layers in order (outermost to innermost)
    Router::new()
        .merge(infra_router)                    // => /healthz, /readyz (no middleware)
        .nest("/api/v1", api_router)            // => /api/v1/* (with all middleware)
        .layer(tower_http::trace::TraceLayer::new_for_http())      // => Request logging
        .layer(tower_http::compression::CompressionLayer::new())   // => Response compression
        .layer(tower_http::cors::CorsLayer::permissive())          // => CORS (restrict in prod)
        .layer(tower::ServiceBuilder::new()
            .layer(tower_http::timeout::TimeoutLayer::new(
                std::time::Duration::from_secs(30))                // => 30s request timeout
            )
        )
        .with_state(state)                      // => AppState available to all handlers
}

#[tokio::main]
async fn main() {
    // Step 1: Initialize tracing (FIRST - before any other setup)
    tracing_subscriber::fmt::init();
    // => In production: use JSON format + OpenTelemetry

    // Step 2: Load configuration
    let settings = Arc::new(config::Settings {
        port: std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3000),
        db_url: std::env::var("DATABASE_URL").unwrap_or_default(),
        jwt_secret: std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
        // => .expect() for required config: fail fast at startup
    });

    // Step 3: Initialize database pool
    // let db = PgPoolOptions::new()
    //     .max_connections(10)
    //     .connect(&settings.db_url).await
    //     .expect("Failed to connect to database");

    // Step 4: Build application state
    let state = Arc::new(state::AppState { config: settings.clone() });

    // Step 5: Build the router
    let app = build_app(state).await;

    // Step 6: Bind and serve with graceful shutdown
    let addr = format!("0.0.0.0:{}", settings.port);
    let listener = tokio::net::TcpListener::bind(&addr).await
        .expect("Failed to bind");
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("Server error");

    tracing::info!("Server shutdown complete");
}

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("CTRL+C handler failed") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("SIGTERM handler failed").recv().await
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    tracing::info!("Shutdown signal received");
}
```

**Key Takeaway**: Production Axum applications follow a clear initialization order: tracing → configuration → database → state → router → serve with graceful shutdown. Extract `build_app()` for testability. Apply layers from outermost (logging) to innermost (compression, CORS, timeout).

**Why It Matters**: The initialization order matters: tracing must be configured before any log statements (including startup failures), configuration must be validated before database connections, and database connections must be established before the HTTP server accepts requests. Extracting `build_app()` into a separate function makes integration testing trivial—tests call the same function as `main()`. This pattern, practiced consistently across Axum services, creates a codebase where any developer can understand the application's startup sequence and middleware stack at a glance.
