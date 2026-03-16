use axum::{
    extract::{Query, State},
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;

use crate::auth::middleware::AuthUser;
use crate::db::expense_repo;
use crate::domain::{errors::AppError, types::Currency};
use crate::state::AppState;

#[derive(Deserialize)]
pub struct PlReportQuery {
    #[serde(rename = "startDate", alias = "from")]
    pub start_date: Option<String>,
    #[serde(rename = "endDate", alias = "to")]
    pub end_date: Option<String>,
    pub currency: Option<String>,
}

pub async fn pl_report(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Query(params): Query<PlReportQuery>,
) -> Result<Json<Value>, AppError> {
    let from_str = params.start_date.unwrap_or_default();
    let to_str = params.end_date.unwrap_or_default();
    let currency_str = params.currency.unwrap_or_else(|| "USD".to_string());

    let from =
        NaiveDate::parse_from_str(&from_str, "%Y-%m-%d").map_err(|_| AppError::Validation {
            field: "from".to_string(),
            message: "invalid date format".to_string(),
        })?;
    let to = NaiveDate::parse_from_str(&to_str, "%Y-%m-%d").map_err(|_| AppError::Validation {
        field: "to".to_string(),
        message: "invalid date format".to_string(),
    })?;

    let currency = Currency::parse_from_str(&currency_str).ok_or_else(|| AppError::Validation {
        field: "currency".to_string(),
        message: format!("unsupported currency: {currency_str}"),
    })?;

    let report =
        expense_repo::pl_report(&state.pool, auth_user.user_id, &currency, from, to).await?;

    let net = report.income_total - report.expense_total;

    let income_breakdown: Vec<Value> = report
        .income_breakdown
        .iter()
        .map(|c| {
            json!({
                "category": c.category,
                "type": "income",
                "total": currency.format_amount(c.total)
            })
        })
        .collect();

    let expense_breakdown: Vec<Value> = report
        .expense_breakdown
        .iter()
        .map(|c| {
            json!({
                "category": c.category,
                "type": "expense",
                "total": currency.format_amount(c.total)
            })
        })
        .collect();

    Ok(Json(json!({
        "startDate": from_str,
        "endDate": to_str,
        "currency": currency_str.to_uppercase(),
        "totalIncome": currency.format_amount(report.income_total),
        "totalExpense": currency.format_amount(report.expense_total),
        "net": currency.format_amount(net),
        "incomeBreakdown": income_breakdown,
        "expenseBreakdown": expense_breakdown,
    })))
}
