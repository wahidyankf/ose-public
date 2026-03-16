use chrono::Utc;
use sqlx::any::AnyRow;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::domain::errors::AppError;
use crate::domain::user::User;

fn row_to_user(row: &AnyRow) -> User {
    use sqlx::Row;
    let id_str: String = row.get("id");
    let created_str: String = row.get("created_at");
    let updated_str: String = row.get("updated_at");
    let failed_attempts: i32 = row.get("failed_attempts");
    User {
        id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
        username: row.get("username"),
        email: row.get("email"),
        display_name: row.get("display_name"),
        password_hash: row.get("password_hash"),
        role: row.get("role"),
        status: row.get("status"),
        failed_attempts: i64::from(failed_attempts),
        created_at: chrono::DateTime::parse_from_rfc3339(&created_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
        updated_at: chrono::DateTime::parse_from_rfc3339(&updated_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
    }
}

pub async fn create_user(
    pool: &AnyPool,
    id: Uuid,
    username: &str,
    email: &str,
    display_name: &str,
    password_hash: &str,
    role: &str,
) -> Result<User, AppError> {
    let now_str = Utc::now().to_rfc3339();
    let id_str = id.to_string();

    sqlx::query(
        r#"INSERT INTO users (id, username, email, display_name, password_hash, role, status, failed_attempts, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 0, $7, $8)"#,
    )
    .bind(&id_str)
    .bind(username)
    .bind(email)
    .bind(display_name)
    .bind(password_hash)
    .bind(role)
    .bind(&now_str)
    .bind(&now_str)
    .execute(pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE")
            || e.to_string().contains("unique")
            || e.to_string().contains("duplicate key")
        {
            AppError::Conflict {
                message: "Username or email already exists".to_string(),
            }
        } else {
            AppError::Database(e)
        }
    })?;

    find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })
}

pub async fn find_by_id(pool: &AnyPool, id: Uuid) -> Result<Option<User>, AppError> {
    let id_str = id.to_string();
    let row = sqlx::query(
        r#"SELECT id, username, email, display_name, password_hash, role, status, failed_attempts, created_at, updated_at
           FROM users WHERE id = $1"#,
    )
    .bind(&id_str)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_user))
}

pub async fn find_by_username(pool: &AnyPool, username: &str) -> Result<Option<User>, AppError> {
    let row = sqlx::query(
        r#"SELECT id, username, email, display_name, password_hash, role, status, failed_attempts, created_at, updated_at
           FROM users WHERE username = $1"#,
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_user))
}

pub async fn update_status(pool: &AnyPool, id: Uuid, status: &str) -> Result<(), AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query("UPDATE users SET status = $1, updated_at = $2 WHERE id = $3")
        .bind(status)
        .bind(&now_str)
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_display_name(
    pool: &AnyPool,
    id: Uuid,
    display_name: &str,
) -> Result<User, AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query("UPDATE users SET display_name = $1, updated_at = $2 WHERE id = $3")
        .bind(display_name)
        .bind(&now_str)
        .bind(&id_str)
        .execute(pool)
        .await?;
    find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })
}

pub async fn update_password_hash(
    pool: &AnyPool,
    id: Uuid,
    password_hash: &str,
) -> Result<(), AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query("UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3")
        .bind(password_hash)
        .bind(&now_str)
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn increment_failed_attempts(pool: &AnyPool, id: Uuid) -> Result<i64, AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query(
        "UPDATE users SET failed_attempts = failed_attempts + 1, updated_at = $1 WHERE id = $2",
    )
    .bind(&now_str)
    .bind(&id_str)
    .execute(pool)
    .await?;

    use sqlx::Row;
    let row: AnyRow = sqlx::query("SELECT failed_attempts FROM users WHERE id = $1")
        .bind(&id_str)
        .fetch_one(pool)
        .await?;
    let val: i32 = row.get::<i32, _>("failed_attempts");
    Ok(i64::from(val))
}

pub async fn reset_failed_attempts(pool: &AnyPool, id: Uuid) -> Result<(), AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query("UPDATE users SET failed_attempts = 0, updated_at = $1 WHERE id = $2")
        .bind(&now_str)
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_password_reset_token(
    pool: &AnyPool,
    id: Uuid,
    token: &str,
) -> Result<(), AppError> {
    let id_str = id.to_string();
    let now_str = Utc::now().to_rfc3339();
    sqlx::query("UPDATE users SET password_reset_token = $1, updated_at = $2 WHERE id = $3")
        .bind(token)
        .bind(&now_str)
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub struct ListUsersResult {
    pub users: Vec<User>,
    pub total: i64,
}

pub async fn list_users(
    pool: &AnyPool,
    page: i64,
    page_size: i64,
    search_filter: Option<&str>,
) -> Result<ListUsersResult, AppError> {
    let offset = (page - 1) * page_size;

    let (users, total) = if let Some(search) = search_filter {
        let pattern = format!("%{search}%");
        let rows = sqlx::query(
            r#"SELECT id, username, email, display_name, password_hash, role, status, failed_attempts, created_at, updated_at
               FROM users WHERE email LIKE $1 OR username LIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"#,
        )
        .bind(&pattern)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;
        let users: Vec<User> = rows.iter().map(row_to_user).collect();

        use sqlx::Row;
        let count_row: AnyRow = sqlx::query(
            "SELECT COUNT(*) as cnt FROM users WHERE email LIKE $1 OR username LIKE $1",
        )
        .bind(&pattern)
        .fetch_one(pool)
        .await?;
        let total: i64 = count_row.get::<i64, _>("cnt");
        (users, total)
    } else {
        let rows = sqlx::query(
            r#"SELECT id, username, email, display_name, password_hash, role, status, failed_attempts, created_at, updated_at
               FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"#,
        )
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;
        let users: Vec<User> = rows.iter().map(row_to_user).collect();

        use sqlx::Row;
        let count_row: AnyRow = sqlx::query("SELECT COUNT(*) as cnt FROM users")
            .fetch_one(pool)
            .await?;
        let total: i64 = count_row.get::<i64, _>("cnt");
        (users, total)
    };

    Ok(ListUsersResult { users, total })
}
