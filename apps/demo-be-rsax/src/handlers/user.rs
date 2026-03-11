use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

use crate::auth::{
    middleware::AuthUser,
    password::{hash_password, verify_password},
};
use crate::db::{token_repo, user_repo};
use crate::domain::errors::AppError;
use crate::state::AppState;

#[derive(Serialize)]
pub struct UserProfile {
    pub id: String,
    pub username: String,
    pub email: String,
    pub display_name: String,
    pub role: String,
    pub status: String,
}

pub async fn get_profile(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Result<Json<UserProfile>, AppError> {
    let user = user_repo::find_by_id(&state.pool, auth_user.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;

    Ok(Json(UserProfile {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        status: user.status,
    }))
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
}

pub async fn update_profile(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(body): Json<UpdateProfileRequest>,
) -> Result<Json<UserProfile>, AppError> {
    let display_name = body.display_name.unwrap_or_default();
    let user =
        user_repo::update_display_name(&state.pool, auth_user.user_id, &display_name).await?;

    Ok(Json(UserProfile {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        status: user.status,
    }))
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    pub old_password: Option<String>,
    pub new_password: Option<String>,
}

pub async fn change_password(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(body): Json<ChangePasswordRequest>,
) -> Result<impl IntoResponse, AppError> {
    let old_password = body.old_password.unwrap_or_default();
    let new_password = body.new_password.unwrap_or_default();

    let user = user_repo::find_by_id(&state.pool, auth_user.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;

    let valid = verify_password(old_password, user.password_hash).await?;
    if !valid {
        return Err(AppError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    if new_password.is_empty() {
        return Err(AppError::Validation {
            field: "new_password".to_string(),
            message: "must not be empty".to_string(),
        });
    }
    let new_hash = hash_password(new_password).await?;
    user_repo::update_password_hash(&state.pool, auth_user.user_id, &new_hash).await?;
    // Revoke all tokens after password change
    token_repo::revoke_all_for_user(&state.pool, auth_user.user_id).await?;

    Ok((StatusCode::OK, Json(json!({"message": "Password changed"}))))
}

pub async fn deactivate(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    user_repo::update_status(&state.pool, auth_user.user_id, "INACTIVE").await?;
    token_repo::revoke_all_for_user(&state.pool, auth_user.user_id).await?;
    Ok((
        StatusCode::OK,
        Json(json!({"message": "Account deactivated"})),
    ))
}
