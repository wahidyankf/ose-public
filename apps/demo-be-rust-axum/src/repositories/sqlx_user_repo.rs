use async_trait::async_trait;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::db::user_repo;
use crate::domain::errors::AppError;
use crate::domain::user::User;
use crate::repositories::{ListUsersResult, UserRepository};

pub struct SqlxUserRepository {
    pool: AnyPool,
}

impl SqlxUserRepository {
    #[must_use]
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for SqlxUserRepository {
    async fn create(
        &self,
        id: Uuid,
        username: &str,
        email: &str,
        display_name: &str,
        password_hash: &str,
        role: &str,
    ) -> Result<User, AppError> {
        user_repo::create_user(
            &self.pool,
            id,
            username,
            email,
            display_name,
            password_hash,
            role,
        )
        .await
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError> {
        user_repo::find_by_id(&self.pool, id).await
    }

    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError> {
        user_repo::find_by_username(&self.pool, username).await
    }

    async fn update_status(&self, id: Uuid, status: &str) -> Result<(), AppError> {
        user_repo::update_status(&self.pool, id, status).await
    }

    async fn update_display_name(&self, id: Uuid, display_name: &str) -> Result<User, AppError> {
        user_repo::update_display_name(&self.pool, id, display_name).await
    }

    async fn update_password_hash(&self, id: Uuid, password_hash: &str) -> Result<(), AppError> {
        user_repo::update_password_hash(&self.pool, id, password_hash).await
    }

    async fn increment_failed_attempts(&self, id: Uuid) -> Result<i64, AppError> {
        user_repo::increment_failed_attempts(&self.pool, id).await
    }

    async fn reset_failed_attempts(&self, id: Uuid) -> Result<(), AppError> {
        user_repo::reset_failed_attempts(&self.pool, id).await
    }

    async fn set_password_reset_token(&self, id: Uuid, token: &str) -> Result<(), AppError> {
        user_repo::set_password_reset_token(&self.pool, id, token).await
    }

    async fn update_role(&self, id: Uuid, role: &str) -> Result<(), AppError> {
        user_repo::update_role(&self.pool, id, role).await
    }

    async fn list(
        &self,
        page: i64,
        page_size: i64,
        search_filter: Option<&str>,
    ) -> Result<ListUsersResult, AppError> {
        user_repo::list_users(&self.pool, page, page_size, search_filter).await
    }
}
