use chrono::{DateTime, Utc};
use sqlx::any::AnyRow;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::domain::errors::AppError;

#[derive(Debug, Clone)]
pub struct RefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub expires_at: DateTime<Utc>,
    pub revoked: bool,
    pub created_at: DateTime<Utc>,
}

fn row_to_refresh_token(row: &AnyRow) -> RefreshToken {
    use sqlx::Row;
    let id_str: String = row.get("id");
    let user_id_str: String = row.get("user_id");
    let expires_str: String = row.get("expires_at");
    let created_str: String = row.get("created_at");
    RefreshToken {
        id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
        user_id: Uuid::parse_str(&user_id_str).unwrap_or_else(|_| Uuid::new_v4()),
        token_hash: row.get("token_hash"),
        expires_at: chrono::DateTime::parse_from_rfc3339(&expires_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
        // SQLite stores BOOLEAN as INTEGER 0/1; the Any driver cannot decode SqliteTypeInfo(Bool)
        // to bool, so fall back to reading as i32 and converting.
        revoked: row
            .try_get::<bool, _>("revoked")
            .or_else(|_| row.try_get::<i32, _>("revoked").map(|v| v != 0))
            .unwrap_or(false),
        created_at: chrono::DateTime::parse_from_rfc3339(&created_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
    }
}

pub async fn create_refresh_token(
    pool: &AnyPool,
    user_id: Uuid,
    token_hash: &str,
    expires_at: DateTime<Utc>,
) -> Result<RefreshToken, AppError> {
    let id = Uuid::new_v4();
    let id_str = id.to_string();
    let user_id_str = user_id.to_string();
    let expires_str = expires_at.to_rfc3339();
    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
           VALUES ($1, $2, $3, $4, 0, $5)"#,
    )
    .bind(&id_str)
    .bind(&user_id_str)
    .bind(token_hash)
    .bind(&expires_str)
    .bind(&now_str)
    .execute(pool)
    .await?;

    find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "refresh_token".to_string(),
        })
}

pub async fn find_by_id(pool: &AnyPool, id: Uuid) -> Result<Option<RefreshToken>, AppError> {
    let id_str = id.to_string();
    let row = sqlx::query(
        "SELECT id, user_id, token_hash, expires_at, revoked, created_at FROM refresh_tokens WHERE id = $1",
    )
    .bind(&id_str)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_refresh_token))
}

pub async fn find_by_token_hash(
    pool: &AnyPool,
    token_hash: &str,
) -> Result<Option<RefreshToken>, AppError> {
    let row = sqlx::query(
        "SELECT id, user_id, token_hash, expires_at, revoked, created_at FROM refresh_tokens WHERE token_hash = $1",
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_refresh_token))
}

pub async fn revoke_by_id(pool: &AnyPool, id: Uuid) -> Result<(), AppError> {
    let id_str = id.to_string();
    sqlx::query("UPDATE refresh_tokens SET revoked = 1 WHERE id = $1")
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn revoke_all_for_user(pool: &AnyPool, user_id: Uuid) -> Result<(), AppError> {
    let user_id_str = user_id.to_string();
    sqlx::query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = $1")
        .bind(&user_id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn list_active_for_user(
    pool: &AnyPool,
    user_id: Uuid,
) -> Result<Vec<RefreshToken>, AppError> {
    let user_id_str = user_id.to_string();
    let now_str = Utc::now().to_rfc3339();
    let rows = sqlx::query(
        r#"SELECT id, user_id, token_hash, expires_at, revoked, created_at
           FROM refresh_tokens WHERE user_id = $1 AND revoked = 0 AND expires_at > $2"#,
    )
    .bind(&user_id_str)
    .bind(&now_str)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_refresh_token).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::create_test_pool;
    use crate::db::user_repo;

    #[tokio::test]
    async fn create_and_find_refresh_token() {
        let pool = create_test_pool().await.unwrap();
        let user_id = Uuid::new_v4();
        user_repo::create_user(
            &pool,
            user_id,
            "testuser",
            "test@example.com",
            "Test User",
            "hash",
            "USER",
        )
        .await
        .unwrap();

        let expires_at = Utc::now() + chrono::Duration::days(7);
        let token = create_refresh_token(&pool, user_id, "somehash123", expires_at)
            .await
            .unwrap();

        assert_eq!(token.user_id, user_id);
        assert_eq!(token.token_hash, "somehash123");
        assert!(!token.revoked);

        let found = find_by_token_hash(&pool, "somehash123")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(found.id, token.id);
    }

    #[tokio::test]
    async fn revoke_refresh_token_by_id() {
        let pool = create_test_pool().await.unwrap();
        let user_id = Uuid::new_v4();
        user_repo::create_user(
            &pool,
            user_id,
            "testuser2",
            "test2@example.com",
            "Test User 2",
            "hash",
            "USER",
        )
        .await
        .unwrap();

        let expires_at = Utc::now() + chrono::Duration::days(7);
        let token = create_refresh_token(&pool, user_id, "revokehash", expires_at)
            .await
            .unwrap();

        revoke_by_id(&pool, token.id).await.unwrap();

        let found = find_by_id(&pool, token.id).await.unwrap().unwrap();
        assert!(found.revoked);
    }

    #[tokio::test]
    async fn revoke_all_for_user() {
        let pool = create_test_pool().await.unwrap();
        let user_id = Uuid::new_v4();
        user_repo::create_user(
            &pool,
            user_id,
            "testuser3",
            "test3@example.com",
            "Test User 3",
            "hash",
            "USER",
        )
        .await
        .unwrap();

        let expires_at = Utc::now() + chrono::Duration::days(7);
        create_refresh_token(&pool, user_id, "hash_a", expires_at)
            .await
            .unwrap();
        create_refresh_token(&pool, user_id, "hash_b", expires_at)
            .await
            .unwrap();

        super::revoke_all_for_user(&pool, user_id).await.unwrap();

        let active = list_active_for_user(&pool, user_id).await.unwrap();
        assert!(active.is_empty());
    }
}
