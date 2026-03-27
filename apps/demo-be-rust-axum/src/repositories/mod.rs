use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

use crate::domain::attachment::Attachment;
use crate::domain::errors::AppError;
use crate::domain::expense::Expense;
use crate::domain::types::Currency;
use crate::domain::user::User;

pub mod sqlx_attachment_repo;
pub mod sqlx_expense_repo;
pub mod sqlx_refresh_token_repo;
pub mod sqlx_token_repo;
pub mod sqlx_user_repo;

// Re-export result types from db module so callers don't have to import from two places.
pub use crate::db::expense_repo::{CategoryAmount, CurrencySummary, ListExpensesResult, PlReport};
pub use crate::db::refresh_token_repo::RefreshToken;
pub use crate::db::user_repo::ListUsersResult;

// ---------------------------------------------------------------------------
// UserRepository
// ---------------------------------------------------------------------------

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(
        &self,
        id: Uuid,
        username: &str,
        email: &str,
        display_name: &str,
        password_hash: &str,
        role: &str,
    ) -> Result<User, AppError>;

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError>;

    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError>;

    async fn update_status(&self, id: Uuid, status: &str) -> Result<(), AppError>;

    async fn update_display_name(&self, id: Uuid, display_name: &str) -> Result<User, AppError>;

    async fn update_password_hash(&self, id: Uuid, password_hash: &str) -> Result<(), AppError>;

    async fn increment_failed_attempts(&self, id: Uuid) -> Result<i64, AppError>;

    async fn reset_failed_attempts(&self, id: Uuid) -> Result<(), AppError>;

    async fn set_password_reset_token(&self, id: Uuid, token: &str) -> Result<(), AppError>;

    async fn update_role(&self, id: Uuid, role: &str) -> Result<(), AppError>;

    async fn list(
        &self,
        page: i64,
        page_size: i64,
        search_filter: Option<&str>,
    ) -> Result<ListUsersResult, AppError>;
}

// ---------------------------------------------------------------------------
// ExpenseRepository
// ---------------------------------------------------------------------------

#[async_trait]
pub trait ExpenseRepository: Send + Sync {
    #[allow(clippy::too_many_arguments)]
    async fn create(
        &self,
        id: Uuid,
        user_id: Uuid,
        amount: f64,
        currency: &str,
        category: &str,
        description: &str,
        date: NaiveDate,
        entry_type: &str,
        quantity: Option<f64>,
        unit: Option<&str>,
    ) -> Result<Expense, AppError>;

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Expense>, AppError>;

    async fn list_for_user(
        &self,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<ListExpensesResult, AppError>;

    #[allow(clippy::too_many_arguments)]
    async fn update(
        &self,
        id: Uuid,
        amount: f64,
        currency: &str,
        category: &str,
        description: &str,
        date: NaiveDate,
        entry_type: &str,
        quantity: Option<f64>,
        unit: Option<&str>,
    ) -> Result<Expense, AppError>;

    async fn delete(&self, id: Uuid) -> Result<(), AppError>;

    async fn summarize_by_currency(&self, user_id: Uuid) -> Result<Vec<CurrencySummary>, AppError>;

    async fn pl_report(
        &self,
        user_id: Uuid,
        currency: &Currency,
        from: NaiveDate,
        to: NaiveDate,
    ) -> Result<PlReport, AppError>;
}

// ---------------------------------------------------------------------------
// AttachmentRepository
// ---------------------------------------------------------------------------

pub struct NewAttachment {
    pub id: Uuid,
    pub expense_id: Uuid,
    pub filename: String,
    pub content_type: String,
    pub size: i64,
    pub data: Vec<u8>,
}

#[async_trait]
pub trait AttachmentRepository: Send + Sync {
    async fn create(&self, new: NewAttachment) -> Result<Attachment, AppError>;

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Attachment>, AppError>;

    async fn list_for_expense(&self, expense_id: Uuid) -> Result<Vec<Attachment>, AppError>;

    async fn delete(&self, id: Uuid) -> Result<(), AppError>;
}

// ---------------------------------------------------------------------------
// TokenRepository (revoked tokens)
// ---------------------------------------------------------------------------

#[async_trait]
pub trait TokenRepository: Send + Sync {
    async fn revoke_token(&self, jti: &str, user_id: Uuid) -> Result<(), AppError>;

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError>;

    async fn is_revoked(&self, jti: &str) -> Result<bool, AppError>;

    async fn is_user_all_revoked_after(
        &self,
        user_id: Uuid,
        issued_at: i64,
    ) -> Result<bool, AppError>;
}

// ---------------------------------------------------------------------------
// RefreshTokenRepository
// ---------------------------------------------------------------------------

#[async_trait]
pub trait RefreshTokenRepository: Send + Sync {
    async fn create(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expires_at: DateTime<Utc>,
    ) -> Result<RefreshToken, AppError>;

    async fn find_by_id(&self, id: Uuid) -> Result<Option<RefreshToken>, AppError>;

    async fn find_by_token_hash(&self, token_hash: &str) -> Result<Option<RefreshToken>, AppError>;

    async fn revoke_by_id(&self, id: Uuid) -> Result<(), AppError>;

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError>;

    async fn list_active_for_user(&self, user_id: Uuid) -> Result<Vec<RefreshToken>, AppError>;
}
