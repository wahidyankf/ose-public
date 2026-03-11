use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: Uuid,
    pub expense_id: Uuid,
    pub user_id: Uuid,
    pub filename: String,
    pub content_type: String,
    pub size: i64,
    pub data: Vec<u8>,
    pub created_at: DateTime<Utc>,
}

pub const ALLOWED_CONTENT_TYPES: &[&str] = &["image/jpeg", "image/png", "application/pdf"];
pub const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10 MB

#[must_use]
pub fn is_allowed_content_type(content_type: &str) -> bool {
    ALLOWED_CONTENT_TYPES.contains(&content_type)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allowed_content_types() {
        assert!(is_allowed_content_type("image/jpeg"));
        assert!(is_allowed_content_type("image/png"));
        assert!(is_allowed_content_type("application/pdf"));
        assert!(!is_allowed_content_type("application/octet-stream"));
        assert!(!is_allowed_content_type("text/plain"));
    }

    #[test]
    fn max_file_size_is_10mb() {
        assert_eq!(MAX_FILE_SIZE, 10 * 1024 * 1024);
    }
}
