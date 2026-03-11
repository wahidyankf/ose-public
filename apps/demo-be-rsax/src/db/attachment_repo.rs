use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::attachment::Attachment;
use crate::domain::errors::AppError;

pub struct NewAttachment<'a> {
    pub id: Uuid,
    pub expense_id: Uuid,
    pub user_id: Uuid,
    pub filename: &'a str,
    pub content_type: &'a str,
    pub size: i64,
    pub data: &'a [u8],
}

fn row_to_attachment(row: &sqlx::sqlite::SqliteRow) -> Attachment {
    use sqlx::Row;
    let id_str: String = row.get("id");
    let expense_id_str: String = row.get("expense_id");
    let user_id_str: String = row.get("user_id");
    let created_str: String = row.get("created_at");
    Attachment {
        id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
        expense_id: Uuid::parse_str(&expense_id_str).unwrap_or_else(|_| Uuid::new_v4()),
        user_id: Uuid::parse_str(&user_id_str).unwrap_or_else(|_| Uuid::new_v4()),
        filename: row.get("filename"),
        content_type: row.get("content_type"),
        size: row.get("size"),
        data: row.get("data"),
        created_at: chrono::DateTime::parse_from_rfc3339(&created_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
    }
}

pub async fn create_attachment(
    pool: &SqlitePool,
    new: NewAttachment<'_>,
) -> Result<Attachment, AppError> {
    let id_str = new.id.to_string();
    let expense_id_str = new.expense_id.to_string();
    let user_id_str = new.user_id.to_string();
    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO attachments (id, expense_id, user_id, filename, content_type, size, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&id_str)
    .bind(&expense_id_str)
    .bind(&user_id_str)
    .bind(new.filename)
    .bind(new.content_type)
    .bind(new.size)
    .bind(new.data)
    .bind(&now_str)
    .execute(pool)
    .await?;

    find_by_id(pool, new.id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "attachment".to_string(),
        })
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Attachment>, AppError> {
    let id_str = id.to_string();
    let row = sqlx::query(
        r#"SELECT id, expense_id, user_id, filename, content_type, size, data, created_at
           FROM attachments WHERE id = ?"#,
    )
    .bind(&id_str)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_attachment))
}

pub async fn list_for_expense(
    pool: &SqlitePool,
    expense_id: Uuid,
) -> Result<Vec<Attachment>, AppError> {
    let expense_id_str = expense_id.to_string();
    let rows = sqlx::query(
        r#"SELECT id, expense_id, user_id, filename, content_type, size, data, created_at
           FROM attachments WHERE expense_id = ? ORDER BY created_at ASC"#,
    )
    .bind(&expense_id_str)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_attachment).collect())
}

pub async fn delete_attachment(pool: &SqlitePool, id: Uuid) -> Result<(), AppError> {
    let id_str = id.to_string();
    sqlx::query("DELETE FROM attachments WHERE id = ?")
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}
