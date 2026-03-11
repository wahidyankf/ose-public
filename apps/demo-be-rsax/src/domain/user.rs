use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::errors::AppError;
use crate::domain::types::{Role, UserStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub display_name: String,
    pub password_hash: String,
    pub role: String,
    pub status: String,
    pub failed_attempts: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    #[must_use]
    pub fn role(&self) -> Role {
        Role::parse_str(&self.role).unwrap_or(Role::User)
    }

    #[must_use]
    pub fn status(&self) -> UserStatus {
        UserStatus::parse_str(&self.status).unwrap_or(UserStatus::Active)
    }

    #[must_use]
    pub fn is_active(&self) -> bool {
        self.status() == UserStatus::Active
    }
}

/// Validate email format.
pub fn validate_email(email: &str) -> Result<(), AppError> {
    if email.is_empty() {
        return Err(AppError::Validation {
            field: "email".to_string(),
            message: "must not be empty".to_string(),
        });
    }
    // Basic email validation: must contain @ with non-empty local and domain parts
    let parts: Vec<&str> = email.splitn(2, '@').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() || !parts[1].contains('.') {
        return Err(AppError::Validation {
            field: "email".to_string(),
            message: "invalid email format".to_string(),
        });
    }
    Ok(())
}

/// Validate password complexity: min 12 chars, uppercase required, special char required.
pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.is_empty() {
        return Err(AppError::Validation {
            field: "password".to_string(),
            message: "must not be empty".to_string(),
        });
    }
    if password.len() < 12 {
        return Err(AppError::Validation {
            field: "password".to_string(),
            message: "must be at least 12 characters".to_string(),
        });
    }
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err(AppError::Validation {
            field: "password".to_string(),
            message: "must contain at least one uppercase letter".to_string(),
        });
    }
    if !password.chars().any(|c| !c.is_alphanumeric()) {
        return Err(AppError::Validation {
            field: "password".to_string(),
            message: "must contain at least one special character".to_string(),
        });
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_email() {
        assert!(validate_email("alice@example.com").is_ok());
        assert!(validate_email("user@domain.org").is_ok());
    }

    #[test]
    fn invalid_email_no_at() {
        assert!(validate_email("notanemail").is_err());
    }

    #[test]
    fn invalid_email_no_domain() {
        assert!(validate_email("user@").is_err());
    }

    #[test]
    fn invalid_email_no_local() {
        assert!(validate_email("@domain.com").is_err());
    }

    #[test]
    fn invalid_email_empty() {
        assert!(validate_email("").is_err());
    }

    #[test]
    fn invalid_email_no_dot_in_domain() {
        assert!(validate_email("user@nodot").is_err());
    }

    #[test]
    fn valid_password() {
        assert!(validate_password("Str0ng#Pass1").is_ok());
        assert!(validate_password("NewPass#456!").is_ok());
    }

    #[test]
    fn password_too_short() {
        assert!(validate_password("Short1!Ab").is_err());
    }

    #[test]
    fn password_no_uppercase() {
        assert!(validate_password("str0ng#pass1abc").is_err());
    }

    #[test]
    fn password_no_special_char() {
        assert!(validate_password("AllUpperCase1234").is_err());
    }

    #[test]
    fn password_empty() {
        assert!(validate_password("").is_err());
    }
}
