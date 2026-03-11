use chrono::{NaiveDate, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::errors::AppError;
use crate::domain::expense::Expense;
use crate::domain::types::Currency;

fn row_to_expense(row: &sqlx::sqlite::SqliteRow) -> Expense {
    use sqlx::Row;
    let id_str: String = row.get("id");
    let user_id_str: String = row.get("user_id");
    let date_str: String = row.get("date");
    Expense {
        id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
        user_id: Uuid::parse_str(&user_id_str).unwrap_or_else(|_| Uuid::new_v4()),
        amount_stored: row.get("amount_stored"),
        currency: row.get("currency"),
        category: row.get("category"),
        description: row.get("description"),
        date: NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive()),
        entry_type: row.get("entry_type"),
        quantity: row.try_get("quantity").ok().flatten(),
        unit: row.try_get("unit").ok().flatten(),
    }
}

#[allow(clippy::too_many_arguments)]
pub async fn create_expense(
    pool: &SqlitePool,
    id: Uuid,
    user_id: Uuid,
    amount_stored: i64,
    currency: &str,
    category: &str,
    description: &str,
    date: NaiveDate,
    entry_type: &str,
    quantity: Option<f64>,
    unit: Option<&str>,
) -> Result<Expense, AppError> {
    let id_str = id.to_string();
    let user_id_str = user_id.to_string();
    let date_str = date.to_string();
    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO expenses (id, user_id, amount_stored, currency, category, description, date, entry_type, quantity, unit, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&id_str)
    .bind(&user_id_str)
    .bind(amount_stored)
    .bind(currency)
    .bind(category)
    .bind(description)
    .bind(&date_str)
    .bind(entry_type)
    .bind(quantity)
    .bind(unit)
    .bind(&now_str)
    .bind(&now_str)
    .execute(pool)
    .await?;

    find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Expense>, AppError> {
    let id_str = id.to_string();
    let row = sqlx::query(
        r#"SELECT id, user_id, amount_stored, currency, category, description, date, entry_type, quantity, unit
           FROM expenses WHERE id = ?"#,
    )
    .bind(&id_str)
    .fetch_optional(pool)
    .await?;

    Ok(row.as_ref().map(row_to_expense))
}

pub struct ListExpensesResult {
    pub expenses: Vec<Expense>,
    pub total: i64,
}

pub async fn list_for_user(
    pool: &SqlitePool,
    user_id: Uuid,
    page: i64,
    page_size: i64,
) -> Result<ListExpensesResult, AppError> {
    let user_id_str = user_id.to_string();
    let offset = (page - 1) * page_size;

    let rows = sqlx::query(
        r#"SELECT id, user_id, amount_stored, currency, category, description, date, entry_type, quantity, unit
           FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?"#,
    )
    .bind(&user_id_str)
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let expenses = rows.iter().map(row_to_expense).collect();

    use sqlx::Row;
    let count_row: sqlx::sqlite::SqliteRow =
        sqlx::query("SELECT COUNT(*) as cnt FROM expenses WHERE user_id = ?")
            .bind(&user_id_str)
            .fetch_one(pool)
            .await?;
    let total: i64 = count_row.get("cnt");

    Ok(ListExpensesResult { expenses, total })
}

#[allow(clippy::too_many_arguments)]
pub async fn update_expense(
    pool: &SqlitePool,
    id: Uuid,
    amount_stored: i64,
    currency: &str,
    category: &str,
    description: &str,
    date: NaiveDate,
    entry_type: &str,
    quantity: Option<f64>,
    unit: Option<&str>,
) -> Result<Expense, AppError> {
    let id_str = id.to_string();
    let date_str = date.to_string();
    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"UPDATE expenses SET amount_stored = ?, currency = ?, category = ?, description = ?, date = ?,
           entry_type = ?, quantity = ?, unit = ?, updated_at = ? WHERE id = ?"#,
    )
    .bind(amount_stored)
    .bind(currency)
    .bind(category)
    .bind(description)
    .bind(&date_str)
    .bind(entry_type)
    .bind(quantity)
    .bind(unit)
    .bind(&now_str)
    .bind(&id_str)
    .execute(pool)
    .await?;

    find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })
}

pub async fn delete_expense(pool: &SqlitePool, id: Uuid) -> Result<(), AppError> {
    let id_str = id.to_string();
    sqlx::query("DELETE FROM attachments WHERE expense_id = ?")
        .bind(&id_str)
        .execute(pool)
        .await?;
    sqlx::query("DELETE FROM expenses WHERE id = ?")
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub struct CurrencySummary {
    pub currency: String,
    pub total: i64,
}

pub async fn summarize_by_currency(
    pool: &SqlitePool,
    user_id: Uuid,
) -> Result<Vec<CurrencySummary>, AppError> {
    use sqlx::Row;
    let user_id_str = user_id.to_string();
    let rows = sqlx::query(
        r#"SELECT currency, SUM(amount_stored) as total FROM expenses
           WHERE user_id = ? AND entry_type = 'expense' GROUP BY currency"#,
    )
    .bind(&user_id_str)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|r| CurrencySummary {
            currency: r.get("currency"),
            total: r.get::<i64, _>("total"),
        })
        .collect())
}

pub struct PlReport {
    pub income_total: i64,
    pub expense_total: i64,
    pub income_breakdown: Vec<CategoryAmount>,
    pub expense_breakdown: Vec<CategoryAmount>,
}

pub struct CategoryAmount {
    pub category: String,
    pub total: i64,
}

pub async fn pl_report(
    pool: &SqlitePool,
    user_id: Uuid,
    currency: &Currency,
    from: NaiveDate,
    to: NaiveDate,
) -> Result<PlReport, AppError> {
    use sqlx::Row;
    let user_id_str = user_id.to_string();
    let currency_str = currency.as_str();
    let from_str = from.to_string();
    let to_str = to.to_string();

    let income_row: sqlx::sqlite::SqliteRow = sqlx::query(
        r#"SELECT COALESCE(SUM(amount_stored), 0) as total FROM expenses
           WHERE user_id = ? AND currency = ? AND entry_type = 'income'
           AND date >= ? AND date <= ?"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_one(pool)
    .await?;
    let income_total: i64 = income_row.get("total");

    let expense_row: sqlx::sqlite::SqliteRow = sqlx::query(
        r#"SELECT COALESCE(SUM(amount_stored), 0) as total FROM expenses
           WHERE user_id = ? AND currency = ? AND entry_type = 'expense'
           AND date >= ? AND date <= ?"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_one(pool)
    .await?;
    let expense_total: i64 = expense_row.get("total");

    let income_rows = sqlx::query(
        r#"SELECT category, SUM(amount_stored) as total FROM expenses
           WHERE user_id = ? AND currency = ? AND entry_type = 'income'
           AND date >= ? AND date <= ? GROUP BY category"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_all(pool)
    .await?;

    let expense_rows = sqlx::query(
        r#"SELECT category, SUM(amount_stored) as total FROM expenses
           WHERE user_id = ? AND currency = ? AND entry_type = 'expense'
           AND date >= ? AND date <= ? GROUP BY category"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_all(pool)
    .await?;

    Ok(PlReport {
        income_total,
        expense_total,
        income_breakdown: income_rows
            .iter()
            .map(|r| CategoryAmount {
                category: r.get("category"),
                total: r.get::<i64, _>("total"),
            })
            .collect(),
        expense_breakdown: expense_rows
            .iter()
            .map(|r| CategoryAmount {
                category: r.get("category"),
                total: r.get::<i64, _>("total"),
            })
            .collect(),
    })
}
