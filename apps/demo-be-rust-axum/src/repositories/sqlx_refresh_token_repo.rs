use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::AnyPool;
use uuid::Uuid;

use crate::db::refresh_token_repo;
use crate::domain::errors::AppError;
use crate::repositories::{RefreshToken, RefreshTokenRepository};

pub struct SqlxRefreshTokenRepository {
    pool: AnyPool,
}

impl SqlxRefreshTokenRepository {
    #[must_use]
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RefreshTokenRepository for SqlxRefreshTokenRepository {
    async fn create(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expires_at: DateTime<Utc>,
    ) -> Result<RefreshToken, AppError> {
        refresh_token_repo::create_refresh_token(&self.pool, user_id, token_hash, expires_at).await
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<RefreshToken>, AppError> {
        refresh_token_repo::find_by_id(&self.pool, id).await
    }

    async fn find_by_token_hash(&self, token_hash: &str) -> Result<Option<RefreshToken>, AppError> {
        refresh_token_repo::find_by_token_hash(&self.pool, token_hash).await
    }

    async fn revoke_by_id(&self, id: Uuid) -> Result<(), AppError> {
        refresh_token_repo::revoke_by_id(&self.pool, id).await
    }

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError> {
        refresh_token_repo::revoke_all_for_user(&self.pool, user_id).await
    }

    async fn list_active_for_user(&self, user_id: Uuid) -> Result<Vec<RefreshToken>, AppError> {
        refresh_token_repo::list_active_for_user(&self.pool, user_id).await
    }
}
