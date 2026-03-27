use async_trait::async_trait;
use chrono::NaiveDate;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::db::expense_repo;
use crate::domain::errors::AppError;
use crate::domain::expense::Expense;
use crate::domain::types::Currency;
use crate::repositories::{CurrencySummary, ExpenseRepository, ListExpensesResult, PlReport};

pub struct SqlxExpenseRepository {
    pool: AnyPool,
}

impl SqlxExpenseRepository {
    #[must_use]
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ExpenseRepository for SqlxExpenseRepository {
    async fn create(
        &self,
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
        expense_repo::create_expense(
            &self.pool,
            id,
            user_id,
            amount,
            currency,
            category,
            description,
            date,
            entry_type,
            quantity,
            unit,
        )
        .await
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Expense>, AppError> {
        expense_repo::find_by_id(&self.pool, id).await
    }

    async fn list_for_user(
        &self,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<ListExpensesResult, AppError> {
        expense_repo::list_for_user(&self.pool, user_id, page, page_size).await
    }

    async fn update(
        &self,
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
        expense_repo::update_expense(
            &self.pool,
            id,
            amount,
            currency,
            category,
            description,
            date,
            entry_type,
            quantity,
            unit,
        )
        .await
    }

    async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        expense_repo::delete_expense(&self.pool, id).await
    }

    async fn summarize_by_currency(&self, user_id: Uuid) -> Result<Vec<CurrencySummary>, AppError> {
        expense_repo::summarize_by_currency(&self.pool, user_id).await
    }

    async fn pl_report(
        &self,
        user_id: Uuid,
        currency: &Currency,
        from: NaiveDate,
        to: NaiveDate,
    ) -> Result<PlReport, AppError> {
        expense_repo::pl_report(&self.pool, user_id, currency, from, to).await
    }
}
