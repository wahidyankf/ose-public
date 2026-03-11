use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::db::expense_repo;
use crate::domain::{
    errors::AppError,
    expense::parse_amount,
    types::{is_supported_unit, Currency},
};
use crate::state::AppState;

#[derive(Deserialize)]
pub struct CreateExpenseRequest {
    pub amount: Option<String>,
    pub currency: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub date: Option<String>,
    #[serde(rename = "type")]
    pub entry_type: Option<String>,
    pub quantity: Option<f64>,
    pub unit: Option<String>,
}

fn parse_currency(s: &str) -> Result<Currency, AppError> {
    Currency::parse_from_str(s).ok_or_else(|| AppError::Validation {
        field: "currency".to_string(),
        message: format!("unsupported currency: {s}"),
    })
}

fn parse_entry_type(s: &str) -> Result<String, AppError> {
    match s {
        "expense" | "income" => Ok(s.to_string()),
        _ => Err(AppError::Validation {
            field: "type".to_string(),
            message: format!("unsupported entry type: {s}"),
        }),
    }
}

fn expense_to_json(expense: &crate::domain::expense::Expense) -> Value {
    let currency = expense.currency();
    let amount_display = currency.format_amount(expense.amount_stored);
    json!({
        "id": expense.id.to_string(),
        "amount": amount_display,
        "currency": expense.currency,
        "category": expense.category,
        "description": expense.description,
        "date": expense.date.to_string(),
        "type": expense.entry_type,
        "quantity": expense.quantity,
        "unit": expense.unit,
    })
}

pub async fn create_expense(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(body): Json<CreateExpenseRequest>,
) -> Result<impl IntoResponse, AppError> {
    let amount_str = body.amount.unwrap_or_default();
    let currency_str = body.currency.unwrap_or_default();
    let category = body.category.unwrap_or_default();
    let description = body.description.unwrap_or_default();
    let date_str = body.date.unwrap_or_default();
    let entry_type_str = body.entry_type.unwrap_or_default();

    let currency = parse_currency(&currency_str)?;
    let amount_stored = parse_amount(&currency, &amount_str)?;
    let entry_type = parse_entry_type(&entry_type_str)?;

    let date =
        NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").map_err(|_| AppError::Validation {
            field: "date".to_string(),
            message: "invalid date format, use YYYY-MM-DD".to_string(),
        })?;

    // Validate unit if provided
    if let Some(ref unit) = body.unit {
        if !is_supported_unit(unit) {
            return Err(AppError::Validation {
                field: "unit".to_string(),
                message: format!("unsupported unit: {unit}"),
            });
        }
    }

    let expense_id = Uuid::new_v4();
    let expense = expense_repo::create_expense(
        &state.pool,
        expense_id,
        auth_user.user_id,
        amount_stored,
        &currency_str,
        &category,
        &description,
        date,
        &entry_type,
        body.quantity,
        body.unit.as_deref(),
    )
    .await?;

    Ok((StatusCode::CREATED, Json(expense_to_json(&expense))))
}

#[derive(Deserialize)]
pub struct ListExpensesQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

pub async fn list_expenses(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Query(params): Query<ListExpensesQuery>,
) -> Result<Json<Value>, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20);

    let result =
        expense_repo::list_for_user(&state.pool, auth_user.user_id, page, page_size).await?;

    let data: Vec<Value> = result.expenses.iter().map(expense_to_json).collect();
    Ok(Json(json!({
        "data": data,
        "total": result.total,
        "page": page,
        "page_size": page_size,
    })))
}

pub async fn get_expense(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(expense_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let expense = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if expense.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    Ok(Json(expense_to_json(&expense)))
}

pub async fn update_expense(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(expense_id): Path<Uuid>,
    Json(body): Json<CreateExpenseRequest>,
) -> Result<Json<Value>, AppError> {
    // Check ownership first
    let existing = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if existing.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    let amount_str = body.amount.unwrap_or_default();
    let currency_str = body.currency.unwrap_or_default();
    let category = body.category.unwrap_or_default();
    let description = body.description.unwrap_or_default();
    let date_str = body.date.unwrap_or_default();
    let entry_type_str = body.entry_type.unwrap_or_default();

    let currency = parse_currency(&currency_str)?;
    let amount_stored = parse_amount(&currency, &amount_str)?;
    let entry_type = parse_entry_type(&entry_type_str)?;

    let date =
        NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").map_err(|_| AppError::Validation {
            field: "date".to_string(),
            message: "invalid date format, use YYYY-MM-DD".to_string(),
        })?;

    if let Some(ref unit) = body.unit {
        if !is_supported_unit(unit) {
            return Err(AppError::Validation {
                field: "unit".to_string(),
                message: format!("unsupported unit: {unit}"),
            });
        }
    }

    let updated = expense_repo::update_expense(
        &state.pool,
        expense_id,
        amount_stored,
        &currency_str,
        &category,
        &description,
        date,
        &entry_type,
        body.quantity,
        body.unit.as_deref(),
    )
    .await?;

    Ok(Json(expense_to_json(&updated)))
}

pub async fn delete_expense(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(expense_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let existing = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if existing.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    expense_repo::delete_expense(&state.pool, expense_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn expense_summary(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Result<Json<Value>, AppError> {
    let summaries = expense_repo::summarize_by_currency(&state.pool, auth_user.user_id).await?;

    let mut result = serde_json::Map::new();
    for s in summaries {
        if let Some(currency) = Currency::parse_from_str(&s.currency) {
            let display = currency.format_amount(s.total);
            result.insert(s.currency, json!(display));
        }
    }

    Ok(Json(Value::Object(result)))
}
