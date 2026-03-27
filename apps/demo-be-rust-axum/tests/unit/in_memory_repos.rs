//! HashMap-backed in-memory repository implementations for unit tests.
//!
//! These provide zero-dependency implementations of the repository traits —
//! no SQLite, no network, no filesystem. Each implementation wraps its store
//! in a `tokio::sync::Mutex` so it can be shared via `Arc<dyn Trait>`.

use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use std::collections::HashMap;
use tokio::sync::Mutex;
use uuid::Uuid;

use demo_be_rust_axum::{
    domain::{
        attachment::Attachment, errors::AppError, expense::Expense, types::Currency, user::User,
    },
    repositories::{
        AttachmentRepository, CategoryAmount, CurrencySummary, ExpenseRepository,
        ListExpensesResult, NewAttachment, PlReport, RefreshToken, RefreshTokenRepository,
        TokenRepository, UserRepository,
    },
};

use demo_be_rust_axum::db::user_repo::ListUsersResult;

// ---------------------------------------------------------------------------
// InMemoryUserRepository
// ---------------------------------------------------------------------------

#[derive(Default, Debug)]
pub struct InMemoryUserRepository {
    users: Mutex<HashMap<Uuid, User>>,
}

impl InMemoryUserRepository {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl UserRepository for InMemoryUserRepository {
    async fn create(
        &self,
        id: Uuid,
        username: &str,
        email: &str,
        display_name: &str,
        password_hash: &str,
        role: &str,
    ) -> Result<User, AppError> {
        let mut store = self.users.lock().await;
        // Check uniqueness
        for u in store.values() {
            if u.username == username || u.email == email {
                return Err(AppError::Conflict {
                    message: "Username or email already exists".to_string(),
                });
            }
        }
        let now = Utc::now();
        let user = User {
            id,
            username: username.to_string(),
            email: email.to_string(),
            display_name: display_name.to_string(),
            password_hash: password_hash.to_string(),
            role: role.to_string(),
            status: "ACTIVE".to_string(),
            failed_login_attempts: 0,
            created_at: now,
            created_by: "system".to_string(),
            updated_at: now,
            updated_by: "system".to_string(),
            deleted_at: None,
            deleted_by: None,
        };
        store.insert(id, user.clone());
        Ok(user)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError> {
        let store = self.users.lock().await;
        Ok(store.get(&id).cloned())
    }

    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError> {
        let store = self.users.lock().await;
        Ok(store.values().find(|u| u.username == username).cloned())
    }

    async fn update_status(&self, id: Uuid, status: &str) -> Result<(), AppError> {
        let mut store = self.users.lock().await;
        if let Some(u) = store.get_mut(&id) {
            u.status = status.to_string();
            u.updated_at = Utc::now();
        }
        Ok(())
    }

    async fn update_display_name(&self, id: Uuid, display_name: &str) -> Result<User, AppError> {
        let mut store = self.users.lock().await;
        let u = store.get_mut(&id).ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;
        u.display_name = display_name.to_string();
        u.updated_at = Utc::now();
        Ok(u.clone())
    }

    async fn update_password_hash(&self, id: Uuid, password_hash: &str) -> Result<(), AppError> {
        let mut store = self.users.lock().await;
        if let Some(u) = store.get_mut(&id) {
            u.password_hash = password_hash.to_string();
            u.updated_at = Utc::now();
        }
        Ok(())
    }

    async fn increment_failed_attempts(&self, id: Uuid) -> Result<i64, AppError> {
        let mut store = self.users.lock().await;
        let u = store.get_mut(&id).ok_or_else(|| AppError::NotFound {
            entity: "user".to_string(),
        })?;
        u.failed_login_attempts += 1;
        u.updated_at = Utc::now();
        Ok(u.failed_login_attempts)
    }

    async fn reset_failed_attempts(&self, id: Uuid) -> Result<(), AppError> {
        let mut store = self.users.lock().await;
        if let Some(u) = store.get_mut(&id) {
            u.failed_login_attempts = 0;
            u.updated_at = Utc::now();
        }
        Ok(())
    }

    async fn set_password_reset_token(&self, _id: Uuid, _token: &str) -> Result<(), AppError> {
        // No-op for in-memory; token not stored in User struct
        Ok(())
    }

    async fn update_role(&self, id: Uuid, role: &str) -> Result<(), AppError> {
        let mut store = self.users.lock().await;
        if let Some(user) = store.get_mut(&id) {
            user.role = role.to_string();
        }
        Ok(())
    }

    async fn list(
        &self,
        page: i64,
        page_size: i64,
        search_filter: Option<&str>,
    ) -> Result<ListUsersResult, AppError> {
        let store = self.users.lock().await;
        let mut all: Vec<User> = if let Some(search) = search_filter {
            let search_lower = search.to_lowercase();
            store
                .values()
                .filter(|u| {
                    u.email.to_lowercase().contains(&search_lower)
                        || u.username.to_lowercase().contains(&search_lower)
                })
                .cloned()
                .collect()
        } else {
            store.values().cloned().collect()
        };

        // Sort by created_at desc (most recent first)
        all.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        let total = all.len() as i64;
        let offset = ((page - 1) * page_size) as usize;
        let users: Vec<User> = all
            .into_iter()
            .skip(offset)
            .take(page_size as usize)
            .collect();

        Ok(ListUsersResult { users, total })
    }
}

// ---------------------------------------------------------------------------
// InMemoryExpenseRepository
// ---------------------------------------------------------------------------

#[derive(Default, Debug)]
pub struct InMemoryExpenseRepository {
    expenses: Mutex<HashMap<Uuid, Expense>>,
}

impl InMemoryExpenseRepository {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl ExpenseRepository for InMemoryExpenseRepository {
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
        let now = Utc::now();
        let expense = Expense {
            id,
            user_id,
            amount,
            currency: currency.to_string(),
            category: category.to_string(),
            description: description.to_string(),
            date,
            entry_type: entry_type.to_string(),
            quantity,
            unit: unit.map(String::from),
            created_at: now,
            created_by: "system".to_string(),
            updated_at: now,
            updated_by: "system".to_string(),
            deleted_at: None,
            deleted_by: None,
        };
        self.expenses.lock().await.insert(id, expense.clone());
        Ok(expense)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Expense>, AppError> {
        let store = self.expenses.lock().await;
        Ok(store.get(&id).cloned())
    }

    async fn list_for_user(
        &self,
        user_id: Uuid,
        page: i64,
        page_size: i64,
    ) -> Result<ListExpensesResult, AppError> {
        let store = self.expenses.lock().await;
        let mut all: Vec<Expense> = store
            .values()
            .filter(|e| e.user_id == user_id)
            .cloned()
            .collect();
        all.sort_by(|a, b| b.date.cmp(&a.date));

        let total = all.len() as i64;
        let offset = ((page - 1) * page_size) as usize;
        let expenses: Vec<Expense> = all
            .into_iter()
            .skip(offset)
            .take(page_size as usize)
            .collect();

        Ok(ListExpensesResult { expenses, total })
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
        let mut store = self.expenses.lock().await;
        let e = store.get_mut(&id).ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;
        e.amount = amount;
        e.currency = currency.to_string();
        e.category = category.to_string();
        e.description = description.to_string();
        e.date = date;
        e.entry_type = entry_type.to_string();
        e.quantity = quantity;
        e.unit = unit.map(String::from);
        e.updated_at = Utc::now();
        Ok(e.clone())
    }

    async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        // Also delete attachments referencing this expense (handled by InMemoryAttachmentRepository
        // on a shared ref — here we just remove the expense).
        self.expenses.lock().await.remove(&id);
        Ok(())
    }

    async fn summarize_by_currency(&self, user_id: Uuid) -> Result<Vec<CurrencySummary>, AppError> {
        let store = self.expenses.lock().await;
        let mut totals: HashMap<String, f64> = HashMap::new();
        for e in store.values() {
            if e.user_id == user_id && e.entry_type == "expense" {
                *totals.entry(e.currency.clone()).or_insert(0.0) += e.amount;
            }
        }
        Ok(totals
            .into_iter()
            .map(|(currency, total)| CurrencySummary { currency, total })
            .collect())
    }

    async fn pl_report(
        &self,
        user_id: Uuid,
        currency: &Currency,
        from: NaiveDate,
        to: NaiveDate,
    ) -> Result<PlReport, AppError> {
        let store = self.expenses.lock().await;
        let currency_str = currency.as_str();
        let matching: Vec<&Expense> = store
            .values()
            .filter(|e| {
                e.user_id == user_id && e.currency == currency_str && e.date >= from && e.date <= to
            })
            .collect();

        let mut income_total = 0.0f64;
        let mut expense_total = 0.0f64;
        let mut income_by_cat: HashMap<String, f64> = HashMap::new();
        let mut expense_by_cat: HashMap<String, f64> = HashMap::new();

        for e in &matching {
            match e.entry_type.as_str() {
                "income" => {
                    income_total += e.amount;
                    *income_by_cat.entry(e.category.clone()).or_insert(0.0) += e.amount;
                }
                "expense" => {
                    expense_total += e.amount;
                    *expense_by_cat.entry(e.category.clone()).or_insert(0.0) += e.amount;
                }
                _ => {}
            }
        }

        Ok(PlReport {
            income_total,
            expense_total,
            income_breakdown: income_by_cat
                .into_iter()
                .map(|(category, total)| CategoryAmount { category, total })
                .collect(),
            expense_breakdown: expense_by_cat
                .into_iter()
                .map(|(category, total)| CategoryAmount { category, total })
                .collect(),
        })
    }
}

// ---------------------------------------------------------------------------
// InMemoryAttachmentRepository
// ---------------------------------------------------------------------------

#[derive(Default, Debug)]
pub struct InMemoryAttachmentRepository {
    attachments: Mutex<HashMap<Uuid, Attachment>>,
}

impl InMemoryAttachmentRepository {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl AttachmentRepository for InMemoryAttachmentRepository {
    async fn create(&self, new: NewAttachment) -> Result<Attachment, AppError> {
        let attachment = Attachment {
            id: new.id,
            expense_id: new.expense_id,
            filename: new.filename,
            content_type: new.content_type,
            size: new.size,
            data: new.data,
            created_at: Utc::now(),
        };
        self.attachments
            .lock()
            .await
            .insert(new.id, attachment.clone());
        Ok(attachment)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Attachment>, AppError> {
        Ok(self.attachments.lock().await.get(&id).cloned())
    }

    async fn list_for_expense(&self, expense_id: Uuid) -> Result<Vec<Attachment>, AppError> {
        let store = self.attachments.lock().await;
        let mut list: Vec<Attachment> = store
            .values()
            .filter(|a| a.expense_id == expense_id)
            .cloned()
            .collect();
        list.sort_by_key(|a| a.created_at);
        Ok(list)
    }

    async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        self.attachments.lock().await.remove(&id);
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// InMemoryTokenRepository (revoked tokens)
// ---------------------------------------------------------------------------

#[derive(Default, Debug)]
struct RevokedTokenRecord {
    jti: String,
    user_id: Uuid,
    revoked_at: DateTime<Utc>,
}

#[derive(Default, Debug)]
pub struct InMemoryTokenRepository {
    tokens: Mutex<Vec<RevokedTokenRecord>>,
}

impl InMemoryTokenRepository {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl TokenRepository for InMemoryTokenRepository {
    async fn revoke_token(&self, jti: &str, user_id: Uuid) -> Result<(), AppError> {
        let mut store = self.tokens.lock().await;
        // ON CONFLICT DO NOTHING semantics
        if !store.iter().any(|r| r.jti == jti) {
            store.push(RevokedTokenRecord {
                jti: jti.to_string(),
                user_id,
                revoked_at: Utc::now(),
            });
        }
        Ok(())
    }

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError> {
        let sentinel_jti = format!(
            "user-revoke-all-{}-{}",
            user_id,
            Utc::now().timestamp_nanos_opt().unwrap_or(0)
        );
        self.revoke_token(&sentinel_jti, user_id).await
    }

    async fn is_revoked(&self, jti: &str) -> Result<bool, AppError> {
        let store = self.tokens.lock().await;
        Ok(store.iter().any(|r| r.jti == jti))
    }

    async fn is_user_all_revoked_after(
        &self,
        user_id: Uuid,
        issued_at: i64,
    ) -> Result<bool, AppError> {
        let store = self.tokens.lock().await;
        let prefix = format!("user-revoke-all-{user_id}-");
        let iat_dt = chrono::DateTime::from_timestamp(issued_at, 0).unwrap_or_else(Utc::now);
        Ok(store
            .iter()
            .any(|r| r.user_id == user_id && r.jti.starts_with(&prefix) && r.revoked_at > iat_dt))
    }
}

// ---------------------------------------------------------------------------
// InMemoryRefreshTokenRepository
// ---------------------------------------------------------------------------

#[derive(Default, Debug)]
pub struct InMemoryRefreshTokenRepository {
    tokens: Mutex<HashMap<Uuid, RefreshToken>>,
}

impl InMemoryRefreshTokenRepository {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl RefreshTokenRepository for InMemoryRefreshTokenRepository {
    async fn create(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expires_at: DateTime<Utc>,
    ) -> Result<RefreshToken, AppError> {
        let id = Uuid::new_v4();
        let token = RefreshToken {
            id,
            user_id,
            token_hash: token_hash.to_string(),
            expires_at,
            revoked: false,
            created_at: Utc::now(),
        };
        self.tokens.lock().await.insert(id, token.clone());
        Ok(token)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<RefreshToken>, AppError> {
        Ok(self.tokens.lock().await.get(&id).cloned())
    }

    async fn find_by_token_hash(&self, token_hash: &str) -> Result<Option<RefreshToken>, AppError> {
        let store = self.tokens.lock().await;
        Ok(store.values().find(|t| t.token_hash == token_hash).cloned())
    }

    async fn revoke_by_id(&self, id: Uuid) -> Result<(), AppError> {
        let mut store = self.tokens.lock().await;
        if let Some(t) = store.get_mut(&id) {
            t.revoked = true;
        }
        Ok(())
    }

    async fn revoke_all_for_user(&self, user_id: Uuid) -> Result<(), AppError> {
        let mut store = self.tokens.lock().await;
        for t in store.values_mut() {
            if t.user_id == user_id {
                t.revoked = true;
            }
        }
        Ok(())
    }

    async fn list_active_for_user(&self, user_id: Uuid) -> Result<Vec<RefreshToken>, AppError> {
        let store = self.tokens.lock().await;
        let now = Utc::now();
        Ok(store
            .values()
            .filter(|t| t.user_id == user_id && !t.revoked && t.expires_at > now)
            .cloned()
            .collect())
    }
}
