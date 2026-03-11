use axum::Json;
use serde_json::{json, Value};

use crate::auth::middleware::AuthUser;
use crate::domain::errors::AppError;

/// GET /api/v1/tokens/claims — Return decoded JWT claims for current user.
pub async fn get_claims(auth_user: AuthUser) -> Result<Json<Value>, AppError> {
    Ok(Json(json!({
        "sub": auth_user.user_id.to_string(),
        "username": auth_user.username,
        "role": auth_user.role.to_string(),
        "jti": auth_user.jti,
        "iss": crate::auth::jwt::ISSUER,
    })))
}

/// GET /.well-known/jwks.json — Return JWKS (public key info for HS256).
/// For HMAC-SHA256 (symmetric), we return a minimal JWKS with the algorithm info.
pub async fn jwks() -> Json<Value> {
    Json(json!({
        "keys": [
            {
                "kty": "oct",
                "alg": "HS256",
                "use": "sig",
                "kid": "default"
            }
        ]
    }))
}
