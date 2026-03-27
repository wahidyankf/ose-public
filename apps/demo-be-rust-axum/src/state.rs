use sqlx::AnyPool;
use std::sync::Arc;

use crate::repositories::{
    AttachmentRepository, ExpenseRepository, RefreshTokenRepository, TokenRepository,
    UserRepository,
};

#[derive(Clone)]
pub struct AppState {
    /// Raw pool kept for handlers that run ad-hoc DDL/DML (test_api reset_db, promote_admin).
    pub pool: AnyPool,
    pub jwt_secret: String,
    pub user_repo: Arc<dyn UserRepository>,
    pub expense_repo: Arc<dyn ExpenseRepository>,
    pub attachment_repo: Arc<dyn AttachmentRepository>,
    pub token_repo: Arc<dyn TokenRepository>,
    pub refresh_token_repo: Arc<dyn RefreshTokenRepository>,
}

impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("jwt_secret", &"[redacted]")
            .finish()
    }
}

impl AppState {
    #[must_use]
    pub fn new(pool: AnyPool, jwt_secret: String) -> Self {
        use crate::repositories::sqlx_attachment_repo::SqlxAttachmentRepository;
        use crate::repositories::sqlx_expense_repo::SqlxExpenseRepository;
        use crate::repositories::sqlx_refresh_token_repo::SqlxRefreshTokenRepository;
        use crate::repositories::sqlx_token_repo::SqlxTokenRepository;
        use crate::repositories::sqlx_user_repo::SqlxUserRepository;

        Self {
            user_repo: Arc::new(SqlxUserRepository::new(pool.clone())),
            expense_repo: Arc::new(SqlxExpenseRepository::new(pool.clone())),
            attachment_repo: Arc::new(SqlxAttachmentRepository::new(pool.clone())),
            token_repo: Arc::new(SqlxTokenRepository::new(pool.clone())),
            refresh_token_repo: Arc::new(SqlxRefreshTokenRepository::new(pool.clone())),
            pool,
            jwt_secret,
        }
    }

    /// Construct with explicit repository implementations (used in tests).
    #[must_use]
    pub fn with_repos(
        pool: AnyPool,
        jwt_secret: String,
        user_repo: Arc<dyn UserRepository>,
        expense_repo: Arc<dyn ExpenseRepository>,
        attachment_repo: Arc<dyn AttachmentRepository>,
        token_repo: Arc<dyn TokenRepository>,
        refresh_token_repo: Arc<dyn RefreshTokenRepository>,
    ) -> Self {
        Self {
            pool,
            jwt_secret,
            user_repo,
            expense_repo,
            attachment_repo,
            token_repo,
            refresh_token_repo,
        }
    }
}
