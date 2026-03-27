use async_trait::async_trait;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::db::token_repo;
use crate::domain::errors::AppError;
use crate::repositories::TokenRepository;

pub struct SqlxTokenRepository {
    pool: AnyPool,
}

impl SqlxTokenRepository {
    #[must_use]
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TokenRepository for SqlxTokenRepository {
    async fn revoke_token(&self, jti: &str, user_id: Uuid) -> Result<(), AppError> {
        token_repo::revoke_token(&self.pool, jti, user_id).await
    }

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError> {
        token_repo::revoke_all_for_user(&self.pool, user_id).await
    }

    async fn is_revoked(&self, jti: &str) -> Result<bool, AppError> {
        token_repo::is_revoked(&self.pool, jti).await
    }

    async fn is_user_all_revoked_after(
        &self,
        user_id: Uuid,
        issued_at: i64,
    ) -> Result<bool, AppError> {
        token_repo::is_user_all_revoked_after(&self.pool, user_id, issued_at).await
    }
}
