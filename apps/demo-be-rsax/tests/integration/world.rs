use axum::body::Body;
use axum::Router;
use http::{Request, Response};
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::SqlitePool;
use std::sync::Arc;
use tower::ServiceExt;
use uuid::Uuid;

use demo_be_rsax::{app::router, db::pool::create_test_pool, state::AppState};

pub const TEST_JWT_SECRET: &str = "test-jwt-secret-that-is-32-chars-long!!";

#[derive(cucumber::World, Debug)]
#[world(init = Self::new_world)]
pub struct AppWorld {
    pub app: Router,
    pub pool: SqlitePool,
    pub last_status: u16,
    pub last_body: Value,
    pub auth_token: Option<String>,
    pub refresh_token: Option<String>,
    pub user_id: Option<Uuid>,
    pub second_auth_token: Option<String>,
    pub second_refresh_token: Option<String>,
    pub second_user_id: Option<Uuid>,
    pub admin_token: Option<String>,
    pub last_expense_id: Option<Uuid>,
    pub last_attachment_id: Option<Uuid>,
    pub bob_expense_id: Option<Uuid>,
    pub bob_auth_token: Option<String>,
    pub original_refresh_token: Option<String>,
    pub alice_id: Option<Uuid>,
}

impl AppWorld {
    async fn new_world() -> Result<Self, anyhow::Error> {
        let pool = create_test_pool().await?;
        let state = Arc::new(AppState::new(pool.clone(), TEST_JWT_SECRET.to_string()));
        let app = router(state);
        Ok(Self {
            app,
            pool,
            last_status: 0,
            last_body: Value::Null,
            auth_token: None,
            refresh_token: None,
            user_id: None,
            second_auth_token: None,
            second_refresh_token: None,
            second_user_id: None,
            admin_token: None,
            last_expense_id: None,
            last_attachment_id: None,
            bob_expense_id: None,
            bob_auth_token: None,
            original_refresh_token: None,
            alice_id: None,
        })
    }

    pub async fn send(&mut self, req: Request<Body>) -> anyhow::Result<()> {
        let response: Response<Body> = self.app.clone().oneshot(req).await?;
        self.last_status = response.status().as_u16();
        let bytes = response.into_body().collect().await?.to_bytes();
        self.last_body = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
        Ok(())
    }

    pub fn bearer(&self) -> String {
        self.auth_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    pub fn admin_bearer(&self) -> String {
        self.admin_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    pub fn bob_bearer(&self) -> String {
        self.bob_auth_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    /// Promote a user to admin by directly updating the database.
    pub async fn promote_to_admin(&self, user_id: Uuid) -> anyhow::Result<()> {
        let id_str = user_id.to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE users SET role = 'ADMIN', updated_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&id_str)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

pub fn json_req(method: &str, uri: &str, body: &str, auth: Option<&str>) -> Request<Body> {
    let mut builder = Request::builder()
        .method(method)
        .uri(uri)
        .header("Content-Type", "application/json");
    if let Some(token) = auth {
        builder = builder.header("Authorization", token);
    }
    builder
        .body(Body::from(body.to_string()))
        .expect("Failed to build request")
}

pub fn get_req(uri: &str, auth: Option<&str>) -> Request<Body> {
    let mut builder = Request::builder().method("GET").uri(uri);
    if let Some(token) = auth {
        builder = builder.header("Authorization", token);
    }
    builder
        .body(Body::empty())
        .expect("Failed to build request")
}
