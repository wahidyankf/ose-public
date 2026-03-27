use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::middleware::AdminUser;
use crate::domain::errors::AppError;
use crate::state::AppState;
use demo_contracts::models::{
    user::Status as UserStatus, PasswordResetResponse, User, UserListResponse,
};

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub search: Option<String>,
}

fn domain_status_to_contract(status: &str) -> UserStatus {
    match status {
        "INACTIVE" => UserStatus::Inactive,
        "DISABLED" => UserStatus::Disabled,
        "LOCKED" => UserStatus::Locked,
        _ => UserStatus::Active,
    }
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Query(params): Query<ListUsersQuery>,
) -> Result<Json<UserListResponse>, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20);
    let search_filter = params.search.as_deref();

    let result = state.user_repo.list(page, page_size, search_filter).await?;

    let content: Vec<User> = result
        .users
        .into_iter()
        .map(|u| User {
            id: u.id.to_string(),
            username: u.username,
            email: u.email,
            display_name: u.display_name,
            status: domain_status_to_contract(&u.status),
            roles: vec![u.role],
            created_at: u.created_at.to_rfc3339(),
            updated_at: u.updated_at.to_rfc3339(),
        })
        .collect();

    let total_pages = ((result.total as f64) / (page_size as f64)).ceil() as i32;

    Ok(Json(UserListResponse {
        content,
        total_elements: result.total as i32,
        total_pages,
        page: page as i32,
        size: page_size as i32,
    }))
}

pub async fn disable_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
    Json(_body): Json<serde_json::Value>,
) -> Result<impl IntoResponse, AppError> {
    state.user_repo.update_status(user_id, "DISABLED").await?;
    state.token_repo.revoke_all_for_user(user_id).await?;
    Ok((StatusCode::OK, Json(json!({"message": "User disabled"}))))
}

pub async fn enable_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    state.user_repo.update_status(user_id, "ACTIVE").await?;
    Ok((StatusCode::OK, Json(json!({"message": "User enabled"}))))
}

pub async fn unlock_user(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    state.user_repo.update_status(user_id, "ACTIVE").await?;
    state.user_repo.reset_failed_attempts(user_id).await?;
    Ok((StatusCode::OK, Json(json!({"message": "User unlocked"}))))
}

pub async fn force_password_reset(
    State(state): State<Arc<AppState>>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<PasswordResetResponse>, AppError> {
    // Verify user exists
    let _ = state
        .user_repo
        .find_by_id(user_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;

    let reset_token = Uuid::new_v4().to_string();
    state
        .user_repo
        .set_password_reset_token(user_id, &reset_token)
        .await?;

    Ok(Json(PasswordResetResponse { token: reset_token }))
}
