use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Validation failed: {field} — {message}")]
    Validation { field: String, message: String },
    #[error("Not found: {entity}")]
    NotFound { entity: String },
    #[error("Forbidden: {message}")]
    Forbidden { message: String },
    #[error("Conflict: {message}")]
    Conflict { message: String },
    #[error("Unauthorized: {message}")]
    Unauthorized { message: String },
    #[error("File too large")]
    FileTooLarge,
    #[error("Unsupported media type")]
    UnsupportedMediaType,
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("JWT error: {0}")]
    Jwt(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, body) = match &self {
            AppError::Validation { field, message } => (
                StatusCode::BAD_REQUEST,
                json!({"message": format!("{field}: {message}")}),
            ),
            AppError::NotFound { .. } => (StatusCode::NOT_FOUND, json!({"message": "Not found"})),
            AppError::Forbidden { message } => (StatusCode::FORBIDDEN, json!({"message": message})),
            AppError::Conflict { message } => (StatusCode::CONFLICT, json!({"message": message})),
            AppError::Unauthorized { message } => {
                (StatusCode::UNAUTHORIZED, json!({"message": message}))
            }
            AppError::FileTooLarge => (
                StatusCode::PAYLOAD_TOO_LARGE,
                json!({"message": "File size exceeds the maximum allowed limit"}),
            ),
            AppError::UnsupportedMediaType => (
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                json!({"message": "file: Unsupported file type"}),
            ),
            AppError::Database(_) | AppError::Jwt(_) | AppError::Internal(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                json!({"message": "Internal server error"}),
            ),
        };
        (status, Json(body)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::response::IntoResponse;

    #[test]
    fn validation_error_into_response() {
        let err = AppError::Validation {
            field: "email".to_string(),
            message: "invalid format".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn not_found_into_response() {
        let err = AppError::NotFound {
            entity: "user".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn forbidden_into_response() {
        let err = AppError::Forbidden {
            message: "no access".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    }

    #[test]
    fn conflict_into_response() {
        let err = AppError::Conflict {
            message: "duplicate".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::CONFLICT);
    }

    #[test]
    fn unauthorized_into_response() {
        let err = AppError::Unauthorized {
            message: "bad token".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn file_too_large_into_response() {
        let err = AppError::FileTooLarge;
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[test]
    fn unsupported_media_type_into_response() {
        let err = AppError::UnsupportedMediaType;
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    #[test]
    fn jwt_error_into_response() {
        let err = AppError::Jwt("bad jwt".to_string());
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn internal_error_into_response() {
        let err = AppError::Internal("oops".to_string());
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}
