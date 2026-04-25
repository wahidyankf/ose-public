---
title: "Rust API Standards"
description: Authoritative OSE Platform Rust API standards (Axum routing, extractors, Tower middleware, AppState)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - api-standards
  - axum
  - rest
  - tower
  - middleware
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative API standards** for Rust web development in the OSE Platform. The standard web framework is **Axum 0.8** with Tokio runtime and Tower middleware.

**Target Audience**: OSE Platform Rust developers building REST APIs and web services

**Scope**: Axum routing, extractors, Tower middleware, AppState, error handling, OpenAPI, testing

## Software Engineering Principles

### 1. Explicit Over Implicit

Axum's design enforces explicitness:

- Route handlers list their extractors explicitly as function parameters
- AppState type is explicit in the router type signature
- Middleware is composed explicitly via `ServiceBuilder`
- Error responses are explicit via `IntoResponse`

### 2. Immutability Over Mutability

API state MUST be immutable at the router level:

- `AppState` is cloned into each handler (cheap with `Arc`)
- Shared mutable state uses `Arc<RwLock<T>>` explicitly
- Request extractors take immutable references to request data

### 3. Pure Functions Over Side Effects

Handler functions SHOULD be as pure as possible:

- Extract data from request (via extractors)
- Call domain logic (pure functions)
- Return response (via `IntoResponse`)
- Side effects (DB, HTTP) are explicit in the function signature

## Axum Routing

**MUST** define routes using `Router::new()` with method-specific handlers:

```rust
use axum::{Router, routing::{get, post, put, delete}};

fn zakat_router() -> Router<AppState> {
    Router::new()
        .route("/zakat/obligations", get(list_zakat_obligations))
        .route("/zakat/obligations", post(create_zakat_obligation))
        .route("/zakat/obligations/:id", get(get_zakat_obligation))
        .route("/zakat/obligations/:id", put(update_zakat_obligation))
        .route("/zakat/obligations/:id/pay", post(pay_zakat_obligation))
}

fn murabaha_router() -> Router<AppState> {
    Router::new()
        .route("/murabaha/contracts", post(create_murabaha_contract))
        .route("/murabaha/contracts/:id", get(get_murabaha_contract))
}

// Compose routers
fn build_router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", zakat_router())
        .nest("/api/v1", murabaha_router())
        .layer(ServiceBuilder::new()
            .layer(TraceLayer::new_for_http())
            .layer(CorsLayer::permissive()))
        .with_state(state)
}
```

## Axum Extractors

**MUST** use typed extractors for all request data:

```rust
use axum::{
    extract::{Path, Query, State, Json},
    http::StatusCode,
};
use serde::Deserialize;

// Path parameters
async fn get_contract(
    Path(contract_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<ContractResponse>, AppError> {
    let contract = state.contract_service.find_by_id(contract_id).await?;
    Ok(Json(ContractResponse::from(contract)))
}

// Query parameters
#[derive(Deserialize)]
struct ListContractsQuery {
    customer_id: Option<Uuid>,
    status: Option<ContractStatus>,
    page: Option<u32>,
    per_page: Option<u32>,
}

async fn list_contracts(
    Query(query): Query<ListContractsQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<ContractResponse>>, AppError> {
    let contracts = state.contract_service.list(query).await?;
    Ok(Json(contracts.into_iter().map(ContractResponse::from).collect()))
}

// JSON request body
#[derive(Deserialize)]
struct CreateContractRequest {
    customer_id: Uuid,
    cost_price: Decimal,
    profit_margin: Decimal,
    installments: u32,
}

async fn create_contract(
    State(state): State<AppState>,
    Json(payload): Json<CreateContractRequest>,
) -> Result<(StatusCode, Json<ContractResponse>), AppError> {
    let contract = state.contract_service.create(payload.into()).await?;
    Ok((StatusCode::CREATED, Json(ContractResponse::from(contract))))
}
```

## AppState with Arc for Shared State

**MUST** use a struct wrapped in `Arc` for shared application state. Axum clones state into each handler, so `Arc` makes this efficient.

```rust
// CORRECT: AppState with Arc for cheap cloning
#[derive(Clone)]
struct AppState {
    db_pool: Arc<sqlx::PgPool>,
    config: Arc<AppConfig>,
    zakat_service: Arc<ZakatService>,
    contract_service: Arc<ContractService>,
}

impl AppState {
    async fn new(config: AppConfig) -> anyhow::Result<Self> {
        let db_pool = Arc::new(
            sqlx::PgPool::connect(&config.database_url.expose_secret())
                .await
                .context("failed to connect to database")?
        );

        Ok(AppState {
            zakat_service: Arc::new(ZakatService::new(Arc::clone(&db_pool))),
            contract_service: Arc::new(ContractService::new(Arc::clone(&db_pool))),
            db_pool,
            config: Arc::new(config),
        })
    }
}

// Register state with router
let state = AppState::new(config).await?;
let app = build_router(state);
```

## Tower Middleware

**MUST** compose middleware using `ServiceBuilder`:

```rust
use tower::ServiceBuilder;
use tower_http::{
    trace::TraceLayer,
    cors::CorsLayer,
    compression::CompressionLayer,
    timeout::TimeoutLayer,
};
use std::time::Duration;

fn apply_middleware(router: Router) -> Router {
    router.layer(
        ServiceBuilder::new()
            .layer(TimeoutLayer::new(Duration::from_secs(30)))
            .layer(CompressionLayer::new())
            .layer(TraceLayer::new_for_http())
            .layer(
                CorsLayer::new()
                    .allow_origin(["https://app.oseplatform.com".parse().unwrap()])
                    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                    .allow_headers([CONTENT_TYPE, AUTHORIZATION]),
            ),
    )
}
```

**SHOULD** implement custom middleware via `tower::Layer`:

```rust
use tower::{Layer, Service};
use axum::http::{Request, Response};
use futures::future::BoxFuture;

// Authentication middleware
#[derive(Clone)]
struct AuthLayer {
    jwt_secret: Arc<Secret<String>>,
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthMiddleware {
            inner,
            jwt_secret: Arc::clone(&self.jwt_secret),
        }
    }
}
```

## Error Handling with impl IntoResponse

**MUST** implement `IntoResponse` for application error types to convert them to HTTP responses:

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),

    #[error("validation failed: {0}")]
    Validation(String),

    #[error("unauthorized")]
    Unauthorized,

    #[error("internal error")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".to_string()),
            AppError::Internal(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

## OpenAPI Documentation with utoipa

**SHOULD** use `utoipa` to generate OpenAPI documentation:

```rust
use utoipa::{OpenApi, ToSchema};

#[derive(ToSchema, Serialize)]
struct ContractResponse {
    id: Uuid,
    customer_id: Uuid,
    cost_price: Decimal,
    profit_margin: Decimal,
}

#[utoipa::path(
    get,
    path = "/api/v1/murabaha/contracts/{id}",
    params(
        ("id" = Uuid, Path, description = "Contract ID")
    ),
    responses(
        (status = 200, description = "Contract found", body = ContractResponse),
        (status = 404, description = "Contract not found"),
    ),
    tag = "Murabaha"
)]
async fn get_murabaha_contract(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<ContractResponse>, AppError> {
    let contract = state.contract_service.find_by_id(id).await?;
    Ok(Json(ContractResponse::from(contract)))
}
```

## Testing with axum-test

**MUST** use `axum-test` or `tower::ServiceExt` for handler testing without starting a server:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum_test::TestServer;
    use serde_json::json;

    async fn test_server() -> TestServer {
        let state = AppState::test_state().await;
        let app = build_router(state);
        TestServer::new(app).unwrap()
    }

    #[tokio::test]
    async fn test_create_contract_returns_201() {
        let server = test_server().await;

        let response = server
            .post("/api/v1/murabaha/contracts")
            .json(&json!({
                "customer_id": "550e8400-e29b-41d4-a716-446655440000",
                "cost_price": "10000.00",
                "profit_margin": "500.00",
                "installments": 12
            }))
            .await;

        response.assert_status_created();
        let body: serde_json::Value = response.json();
        assert!(body["id"].is_string());
    }

    #[tokio::test]
    async fn test_get_contract_not_found_returns_404() {
        let server = test_server().await;
        let nonexistent_id = Uuid::new_v4();

        let response = server
            .get(&format!("/api/v1/murabaha/contracts/{}", nonexistent_id))
            .await;

        response.assert_status_not_found();
    }
}
```

## Enforcement

**Pre-commit checklist**:

- [ ] Routes defined with `Router::new()` and method-specific handlers
- [ ] Extractors used for all request data (Path, Query, Json, State)
- [ ] AppState implements `Clone` and uses `Arc` for shared services
- [ ] All error types implement `IntoResponse`
- [ ] Middleware composed via `ServiceBuilder`
- [ ] Handler tests using `axum-test` or equivalent
- [ ] OpenAPI annotations for all public endpoints

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - AppError design
- [Concurrency Standards](concurrency-standards.md) - Arc/Mutex for AppState
- [Security Standards](security-standards.md) - Auth middleware, input validation
- [DDD Standards](ddd-standards.md) - Service layer design

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
**Framework**: Axum 0.8, Tokio 1.x, Tower
