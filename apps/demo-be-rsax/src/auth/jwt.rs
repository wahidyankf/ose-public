use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::errors::AppError;

pub const ACCESS_TOKEN_DURATION_SECS: i64 = 15 * 60; // 15 minutes
pub const REFRESH_TOKEN_DURATION_SECS: i64 = 7 * 24 * 60 * 60; // 7 days
pub const ISSUER: &str = "demo-be-rsax";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: String,
    pub jti: String,
    pub iss: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RefreshClaims {
    pub sub: String,
    pub jti: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn encode_access_token(
    user_id: Uuid,
    username: &str,
    role: &str,
    secret: &str,
) -> Result<(String, String), AppError> {
    let now = Utc::now().timestamp();
    let jti = Uuid::new_v4().to_string();
    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        role: role.to_string(),
        jti: jti.clone(),
        iss: ISSUER.to_string(),
        exp: (now + ACCESS_TOKEN_DURATION_SECS) as usize,
        iat: now as usize,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Jwt(e.to_string()))?;
    Ok((token, jti))
}

pub fn encode_refresh_token(user_id: Uuid, secret: &str) -> Result<(String, String), AppError> {
    let now = Utc::now().timestamp();
    let jti = Uuid::new_v4().to_string();
    let claims = RefreshClaims {
        sub: user_id.to_string(),
        jti: jti.clone(),
        exp: (now + REFRESH_TOKEN_DURATION_SECS) as usize,
        iat: now as usize,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Jwt(e.to_string()))?;
    Ok((token, jti))
}

pub fn decode_access_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&[ISSUER]);
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| {
        let msg = e.to_string();
        if msg.contains("expired") {
            AppError::Unauthorized {
                message: "Token has expired".to_string(),
            }
        } else {
            AppError::Unauthorized {
                message: "Invalid token".to_string(),
            }
        }
    })
}

pub fn decode_refresh_token(token: &str, secret: &str) -> Result<RefreshClaims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.required_spec_claims.remove("iss");
    decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| {
        let msg = e.to_string();
        if msg.contains("expired") {
            AppError::Unauthorized {
                message: "Token has expired".to_string(),
            }
        } else {
            AppError::Unauthorized {
                message: "Invalid token".to_string(),
            }
        }
    })
}

/// Decode token claims without validation (for /tokens/claims endpoint)
pub fn decode_claims_unchecked(token: &str, secret: &str) -> Result<Claims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = false;
    validation.required_spec_claims.clear();
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| AppError::Jwt(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "test-secret-that-is-32-chars-long!!";

    #[test]
    fn encode_decode_access_token() {
        let user_id = Uuid::new_v4();
        let (token, jti) = encode_access_token(user_id, "alice", "USER", SECRET).unwrap();
        assert!(!token.is_empty());
        assert!(!jti.is_empty());

        let claims = decode_access_token(&token, SECRET).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.username, "alice");
        assert_eq!(claims.role, "USER");
        assert_eq!(claims.iss, ISSUER);
    }

    #[test]
    fn encode_decode_refresh_token() {
        let user_id = Uuid::new_v4();
        let (token, jti) = encode_refresh_token(user_id, SECRET).unwrap();
        assert!(!token.is_empty());
        assert!(!jti.is_empty());

        let claims = decode_refresh_token(&token, SECRET).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
    }

    #[test]
    fn invalid_secret_rejected() {
        let user_id = Uuid::new_v4();
        let (token, _) = encode_access_token(user_id, "alice", "USER", SECRET).unwrap();
        let result = decode_access_token(&token, "wrong-secret");
        assert!(result.is_err());
    }

    #[test]
    fn decode_claims_unchecked_works() {
        let user_id = Uuid::new_v4();
        let (token, _) = encode_access_token(user_id, "alice", "USER", SECRET).unwrap();
        let claims = decode_claims_unchecked(&token, SECRET).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert!(!claims.iss.is_empty());
    }
}
