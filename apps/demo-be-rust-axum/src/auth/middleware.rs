use axum::extract::FromRequestParts;
use http::request::Parts;
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::jwt::decode_access_token;
use crate::domain::errors::AppError;
use crate::domain::types::{Role, UserStatus};
use crate::state::AppState;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub username: String,
    pub role: Role,
    pub jti: String,
    pub iat: i64,
}

impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized {
                message: "Missing Authorization header".to_string(),
            })?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized {
                message: "Invalid Authorization format".to_string(),
            });
        }

        let token = &auth_header["Bearer ".len()..];

        // Decode JWT
        let claims = decode_access_token(token, &state.jwt_secret)?;

        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized {
            message: "Invalid user ID in token".to_string(),
        })?;

        // Check if token is revoked (by jti)
        let revoked = state.token_repo.is_revoked(&claims.jti).await?;
        if revoked {
            return Err(AppError::Unauthorized {
                message: "Token has been revoked".to_string(),
            });
        }

        // Check if there's a revoke-all for this user issued after token issuance
        let all_revoked = state
            .token_repo
            .is_user_all_revoked_after(user_id, claims.iat as i64)
            .await?;
        if all_revoked {
            return Err(AppError::Unauthorized {
                message: "Token has been revoked".to_string(),
            });
        }

        // Check user status in database
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
                message: "Account is not active".to_string(),
            });
        }

        let role = Role::parse_str(&claims.role).unwrap_or(Role::User);

        Ok(AuthUser {
            user_id,
            username: claims.username,
            role,
            jti: claims.jti,
            iat: claims.iat as i64,
        })
    }
}

/// Admin-only guard (composes with AuthUser)
pub struct AdminUser(pub AuthUser);

impl FromRequestParts<Arc<AppState>> for AdminUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;
        if user.role != Role::Admin {
            return Err(AppError::Forbidden {
                message: "Admin only".to_string(),
            });
        }
        Ok(AdminUser(user))
    }
}
