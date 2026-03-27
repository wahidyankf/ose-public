use chrono::{NaiveDate, Utc};
use sqlx::any::AnyRow;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::domain::errors::AppError;
use crate::domain::expense::Expense;
use crate::domain::types::Currency;

fn row_to_expense(row: &AnyRow) -> Expense {
    use sqlx::Row;
    let id_str: String = row.get("id");
    let user_id_str: String = row.get("user_id");
    let date_str: String = row.get("date");
    let created_str: String = row.get("created_at");
    let updated_str: String = row.get("updated_at");
    let deleted_str: Option<String> = row.try_get("deleted_at").ok().flatten();
    Expense {
        id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::new_v4()),
        user_id: Uuid::parse_str(&user_id_str).unwrap_or_else(|_| Uuid::new_v4()),
        amount: row
            .try_get::<f64, _>("amount")
            .or_else(|_| {
                row.try_get::<i64, _>("amount").map(|v| v as f64)
            })
            .unwrap_or(0.0),
        currency: row.get("currency"),
        category: row.get("category"),
        description: row.get("description"),
        date: NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive()),
        entry_type: row.get("type"),
        quantity: row
            .try_get::<Option<f64>, _>("quantity")
            .or_else(|_| {
                row.try_get::<Option<String>, _>("quantity")
                    .map(|opt| opt.and_then(|s| s.parse::<f64>().ok()))
            })
            .ok()
            .flatten(),
        unit: row.try_get("unit").ok().flatten(),
        created_at: chrono::DateTime::parse_from_rfc3339(&created_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
        created_by: row
            .try_get("created_by")
            .unwrap_or_else(|_| "system".to_string()),
        updated_at: chrono::DateTime::parse_from_rfc3339(&updated_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now()),
        updated_by: row
            .try_get("updated_by")
            .unwrap_or_else(|_| "system".to_string()),
        deleted_at: deleted_str.as_deref().and_then(|s| {
            chrono::DateTime::parse_from_rfc3339(s)
                .map(|dt| dt.with_timezone(&Utc))
                .ok()
        }),
        deleted_by: row.try_get("deleted_by").ok().flatten(),
    }
}

#[allow(clippy::too_many_arguments)]
pub async fn create_expense(
    pool: &AnyPool,
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
) -> Result<Expense, AppError> {
    let id_str = id.to_string();
    let user_id_str = user_id.to_string();
    let date_str = date.to_string();
    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO expenses (id, user_id, amount, currency, category, description, date, type, quantity, unit, created_at, created_by, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'system', $12, 'system')"#,
    )
    .bind(&id_str)
    .bind(&user_id_str)
    .bind(amount)
    .bind(currency)
    .bind(category)
    .bind(description)
    .bind(&date_str)
    .bind(entry_type)
    .bind(quantity.map(|q| q.to_string()))
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

pub async fn find_by_id(pool: &AnyPool, id: Uuid) -> Result<Option<Expense>, AppError> {
    let id_str = id.to_string();
    let row = sqlx::query(
        r#"SELECT id, user_id, amount, currency, category, description, date, type, quantity, unit,
                  created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
           FROM expenses WHERE id = $1"#,
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
    pool: &AnyPool,
    user_id: Uuid,
    page: i64,
    page_size: i64,
) -> Result<ListExpensesResult, AppError> {
    let user_id_str = user_id.to_string();
    let offset = (page - 1) * page_size;

    let rows = sqlx::query(
        r#"SELECT id, user_id, amount, currency, category, description, date, type, quantity, unit,
                  created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
           FROM expenses WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3"#,
    )
    .bind(&user_id_str)
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let expenses = rows.iter().map(row_to_expense).collect();

    use sqlx::Row;
    let count_row: AnyRow = sqlx::query("SELECT COUNT(*) as cnt FROM expenses WHERE user_id = $1")
        .bind(&user_id_str)
        .fetch_one(pool)
        .await?;
    let total: i64 = count_row.get("cnt");

    Ok(ListExpensesResult { expenses, total })
}

#[allow(clippy::too_many_arguments)]
pub async fn update_expense(
    pool: &AnyPool,
    id: Uuid,
    amount: f64,
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
        r#"UPDATE expenses SET amount = $1, currency = $2, category = $3, description = $4, date = $5,
           type = $6, quantity = $7, unit = $8, updated_at = $9, updated_by = 'system' WHERE id = $10"#,
    )
    .bind(amount)
    .bind(currency)
    .bind(category)
    .bind(description)
    .bind(&date_str)
    .bind(entry_type)
    .bind(quantity.map(|q| q.to_string()))
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

pub async fn delete_expense(pool: &AnyPool, id: Uuid) -> Result<(), AppError> {
    let id_str = id.to_string();
    sqlx::query("DELETE FROM attachments WHERE expense_id = $1")
        .bind(&id_str)
        .execute(pool)
        .await?;
    sqlx::query("DELETE FROM expenses WHERE id = $1")
        .bind(&id_str)
        .execute(pool)
        .await?;
    Ok(())
}

pub struct CurrencySummary {
    pub currency: String,
    pub total: f64,
}

pub async fn summarize_by_currency(
    pool: &AnyPool,
    user_id: Uuid,
) -> Result<Vec<CurrencySummary>, AppError> {
    use sqlx::Row;
    let user_id_str = user_id.to_string();
    let rows = sqlx::query(
        r#"SELECT currency, SUM(amount) as total FROM expenses
           WHERE user_id = $1 AND type = 'expense' GROUP BY currency"#,
    )
    .bind(&user_id_str)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|r| CurrencySummary {
            currency: r.get("currency"),
            total: r
                .try_get::<f64, _>("total")
                .or_else(|_| r.try_get::<i64, _>("total").map(|v| v as f64))
                .unwrap_or(0.0),
        })
        .collect())
}

pub struct PlReport {
    pub income_total: f64,
    pub expense_total: f64,
    pub income_breakdown: Vec<CategoryAmount>,
    pub expense_breakdown: Vec<CategoryAmount>,
}

pub struct CategoryAmount {
    pub category: String,
    pub total: f64,
}

pub async fn pl_report(
    pool: &AnyPool,
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

    let income_row: AnyRow = sqlx::query(
        r#"SELECT COALESCE(SUM(amount), 0) as total FROM expenses
           WHERE user_id = $1 AND currency = $2 AND type = 'income'
           AND date >= $3 AND date <= $4"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_one(pool)
    .await?;
    let income_total: f64 = income_row
        .try_get::<f64, _>("total")
        .or_else(|_| income_row.try_get::<i64, _>("total").map(|v| v as f64))
        .unwrap_or(0.0);

    let expense_row: AnyRow = sqlx::query(
        r#"SELECT COALESCE(SUM(amount), 0) as total FROM expenses
           WHERE user_id = $1 AND currency = $2 AND type = 'expense'
           AND date >= $3 AND date <= $4"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_one(pool)
    .await?;
    let expense_total: f64 = expense_row
        .try_get::<f64, _>("total")
        .or_else(|_| expense_row.try_get::<i64, _>("total").map(|v| v as f64))
        .unwrap_or(0.0);

    let income_rows = sqlx::query(
        r#"SELECT category, SUM(amount) as total FROM expenses
           WHERE user_id = $1 AND currency = $2 AND type = 'income'
           AND date >= $3 AND date <= $4 GROUP BY category"#,
    )
    .bind(&user_id_str)
    .bind(currency_str)
    .bind(&from_str)
    .bind(&to_str)
    .fetch_all(pool)
    .await?;

    let expense_rows = sqlx::query(
        r#"SELECT category, SUM(amount) as total FROM expenses
           WHERE user_id = $1 AND currency = $2 AND type = 'expense'
           AND date >= $3 AND date <= $4 GROUP BY category"#,
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
                total: r
                    .try_get::<f64, _>("total")
                    .or_else(|_| r.try_get::<i64, _>("total").map(|v| v as f64))
                    .unwrap_or(0.0),
            })
            .collect(),
        expense_breakdown: expense_rows
            .iter()
            .map(|r| CategoryAmount {
                category: r.get("category"),
                total: r
                    .try_get::<f64, _>("total")
                    .or_else(|_| r.try_get::<i64, _>("total").map(|v| v as f64))
                    .unwrap_or(0.0),
            })
            .collect(),
    })
}
