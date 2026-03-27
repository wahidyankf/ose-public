use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::{
    jwt::{decode_refresh_token, encode_access_token, encode_refresh_token},
    middleware::AuthUser,
    password::{hash_password, verify_password},
};
use crate::domain::{
    errors::AppError,
    types::{Role, UserStatus},
    user::{validate_email, validate_password},
};
use crate::state::AppState;
use demo_contracts::models::{
    user::Status as ContractStatus, AuthTokens, LoginRequest, RefreshRequest, RegisterRequest, User,
};

const MAX_FAILED_ATTEMPTS: i64 = 5;

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(body): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    let username = body.username;
    let email = body.email;
    let password = body.password;

    // Validate inputs
    validate_email(&email)?;
    validate_password(&password)?;

    if username.is_empty() {
        return Err(AppError::Validation {
            field: "username".to_string(),
            message: "must not be empty".to_string(),
        });
    }

    let password_hash = hash_password(password).await?;
    let user_id = Uuid::new_v4();

    let user = state
        .user_repo
        .create(
            user_id,
            &username,
            &email,
            &username, // display_name defaults to username
            &password_hash,
            "USER",
        )
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(User {
            id: user.id.to_string(),
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            status: ContractStatus::Active,
            roles: vec!["USER".to_string()],
            created_at: user.created_at.to_rfc3339(),
            updated_at: user.updated_at.to_rfc3339(),
        }),
    ))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<AuthTokens>, AppError> {
    let username = body.username;
    let password = body.password;

    let user = state
        .user_repo
        .find_by_username(&username)
        .await?
        .ok_or_else(|| AppError::Unauthorized {
            message: "Invalid credentials".to_string(),
        })?;

    let status = UserStatus::parse_str(&user.status).unwrap_or(UserStatus::Active);

    // Check status before verifying password
    if status == UserStatus::Inactive {
        return Err(AppError::Unauthorized {
            message: "Account has been deactivated".to_string(),
        });
    }
    if status == UserStatus::Disabled {
        return Err(AppError::Unauthorized {
            message: "Account has been disabled".to_string(),
        });
    }
    if status == UserStatus::Locked {
        return Err(AppError::Unauthorized {
            message: "Account is locked".to_string(),
        });
    }

    let valid = verify_password(password, user.password_hash.clone()).await?;
    if !valid {
        let attempts = state.user_repo.increment_failed_attempts(user.id).await?;
        if attempts >= MAX_FAILED_ATTEMPTS {
            state.user_repo.update_status(user.id, "LOCKED").await?;
        }
        return Err(AppError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    // Reset failed attempts on success
    state.user_repo.reset_failed_attempts(user.id).await?;

    let role = Role::parse_str(&user.role).unwrap_or(Role::User);
    let (access_token, _access_jti) = encode_access_token(
        user.id,
        &user.username,
        &role.to_string(),
        &state.jwt_secret,
    )?;
    let (refresh_token, _refresh_jti) = encode_refresh_token(user.id, &state.jwt_secret)?;

    Ok(Json(AuthTokens {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
    }))
}

pub async fn refresh(
    State(state): State<Arc<AppState>>,
    Json(body): Json<RefreshRequest>,
) -> Result<Json<AuthTokens>, AppError> {
    let token_str = body.refresh_token;
    let claims = decode_refresh_token(&token_str, &state.jwt_secret)?;

    // Check if this refresh token jti is revoked (single-use rotation)
    let revoked = state.token_repo.is_revoked(&claims.jti).await?;
    if revoked {
        return Err(AppError::Unauthorized {
            message: "Invalid token".to_string(),
        });
    }

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized {
        message: "Invalid token".to_string(),
    })?;

    // Check user is still active
    let user =
        state
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::Unauthorized {
                message: "User not found".to_string(),
            })?;

    let status = UserStatus::parse_str(&user.status).unwrap_or(UserStatus::Active);
    if status != UserStatus::Active {
        return Err(AppError::Unauthorized {
            message: "Account has been deactivated".to_string(),
        });
    }

    // Revoke old refresh token (single-use)
    state.token_repo.revoke_token(&claims.jti, user_id).await?;

    let role = Role::parse_str(&user.role).unwrap_or(Role::User);
    let (access_token, _access_jti) = encode_access_token(
        user.id,
        &user.username,
        &role.to_string(),
        &state.jwt_secret,
    )?;
    let (refresh_token, _refresh_jti) = encode_refresh_token(user.id, &state.jwt_secret)?;

    Ok(Json(AuthTokens {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
    }))
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    // Extract token from Authorization header (Bearer <token>)
    let token_str = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .unwrap_or("");

    if token_str.is_empty() {
        return Ok(Json(json!({"message": "Logged out"})));
    }

    // Decode without strict validation (may be expired)
    if let Ok(claims) = crate::auth::jwt::decode_claims_unchecked(token_str, &state.jwt_secret) {
        let user_id = Uuid::parse_str(&claims.sub).unwrap_or_else(|_| Uuid::new_v4());
        state.token_repo.revoke_token(&claims.jti, user_id).await?;
    }

    Ok(Json(json!({"message": "Logged out"})))
}

pub async fn logout_all(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // Revoke the current access token
    state
        .token_repo
        .revoke_token(&auth_user.jti, auth_user.user_id)
        .await?;
    // Revoke all tokens for user
    state
        .token_repo
        .revoke_all_for_user(auth_user.user_id)
        .await?;
    Ok(Json(json!({"message": "ok"})))
}
