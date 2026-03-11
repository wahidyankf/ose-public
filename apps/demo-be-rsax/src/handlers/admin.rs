use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::middleware::AdminUser;
use crate::db::{token_repo, user_repo};
use crate::domain::errors::AppError;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub email: Option<String>,
}

#[derive(Serialize)]
pub struct UserSummary {
    pub id: String,
    pub username: String,
    pub email: String,
    pub display_name: String,
    pub role: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct ListUsersResponse {
    pub data: Vec<UserSummary>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Query(params): Query<ListUsersQuery>,
) -> Result<Json<ListUsersResponse>, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20);
    let email_filter = params.email.as_deref();

    let result = user_repo::list_users(&state.pool, page, page_size, email_filter).await?;

    let data = result
        .users
        .into_iter()
        .map(|u| UserSummary {
            id: u.id.to_string(),
            username: u.username,
            email: u.email,
            display_name: u.display_name,
            role: u.role,
            status: u.status,
        })
        .collect();

    Ok(Json(ListUsersResponse {
        data,
        total: result.total,
        page,
        page_size,
    }))
}

#[derive(Deserialize)]
pub struct DisableUserRequest {
    pub reason: Option<String>,
}

pub async fn disable_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
    Json(_body): Json<serde_json::Value>,
) -> Result<impl IntoResponse, AppError> {
    user_repo::update_status(&state.pool, user_id, "DISABLED").await?;
    token_repo::revoke_all_for_user(&state.pool, user_id).await?;
    Ok((StatusCode::OK, Json(json!({"message": "User disabled"}))))
}

pub async fn enable_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    user_repo::update_status(&state.pool, user_id, "ACTIVE").await?;
    Ok((StatusCode::OK, Json(json!({"message": "User enabled"}))))
}

pub async fn unlock_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    user_repo::update_status(&state.pool, user_id, "ACTIVE").await?;
    user_repo::reset_failed_attempts(&state.pool, user_id).await?;
    Ok((StatusCode::OK, Json(json!({"message": "User unlocked"}))))
}

pub async fn force_password_reset(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Verify user exists
    let _ = user_repo::find_by_id(&state.pool, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;

    let reset_token = Uuid::new_v4().to_string();
    user_repo::set_password_reset_token(&state.pool, user_id, &reset_token).await?;

    Ok(Json(json!({"reset_token": reset_token})))
}
