use axum::Json;

use crate::auth::middleware::AuthUser;
use crate::domain::errors::AppError;
use demo_contracts::models::{JwkKey, JwksResponse, TokenClaims};

/// GET /api/v1/tokens/claims — Return decoded JWT claims for current user.
pub async fn get_claims(auth_user: AuthUser) -> Result<Json<TokenClaims>, AppError> {
    Ok(Json(TokenClaims {
        sub: auth_user.user_id.to_string(),
        iss: crate::auth::jwt::ISSUER.to_string(),
        // exp and iat not available in AuthUser; use 0 as placeholder (contract requires i32)
        exp: 0,
        iat: auth_user.iat as i32,
        roles: vec![auth_user.role.to_string()],
    }))
}

/// GET /.well-known/jwks.json — Return JWKS (public key info for HS256).
/// For HMAC-SHA256 (symmetric), we return a minimal JWKS with the algorithm info.
/// The `n` and `e` fields are RSA-specific and set to empty strings for this HS256 key.
pub async fn jwks() -> Json<JwksResponse> {
    Json(JwksResponse {
        keys: vec![JwkKey {
            kty: "oct".to_string(),
            kid: "default".to_string(),
            r#use: "sig".to_string(),
            n: String::new(),
            e: String::new(),
        }],
    })
}
