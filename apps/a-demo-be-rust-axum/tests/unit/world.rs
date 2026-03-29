use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use a_demo_be_rust_axum::{
    auth::{
        jwt::{
            decode_access_token, decode_claims_unchecked, decode_refresh_token,
            encode_access_token, encode_refresh_token, ISSUER,
        },
        password::{hash_password, verify_password},
    },
    domain::{
        attachment::{is_allowed_content_type, Attachment, MAX_FILE_SIZE},
        errors::AppError,
        expense::{parse_amount, Expense},
        types::{Currency, Role, UserStatus},
        user::{validate_email, validate_password},
    },
    repositories::NewAttachment,
    state::AppState,
};

use crate::in_memory_repos::{
    InMemoryAttachmentRepository, InMemoryExpenseRepository, InMemoryRefreshTokenRepository,
    InMemoryTokenRepository, InMemoryUserRepository,
};

pub const TEST_JWT_SECRET: &str = "test-jwt-secret-that-is-32-chars-long!!";

/// HTTP-like response abstraction produced by direct service calls.
/// Status codes mirror what the Axum handlers return via `AppError::into_response`.
#[derive(Debug, Clone)]
pub struct ServiceResponse {
    pub status: u16,
    pub body: Value,
}

impl ServiceResponse {
    pub fn ok(body: Value) -> Self {
        Self { status: 200, body }
    }

    pub fn created(body: Value) -> Self {
        Self { status: 201, body }
    }

    pub fn no_content() -> Self {
        Self {
            status: 204,
            body: Value::Null,
        }
    }

    pub fn from_error(err: &AppError) -> Self {
        use serde_json::json;
        let (status, body) = match err {
            AppError::Validation { field, message } => {
                (400u16, json!({"message": format!("{field}: {message}")}))
            }
            AppError::NotFound { .. } => (404, json!({"message": "Not found"})),
            AppError::Forbidden { message } => (403, json!({"message": message})),
            AppError::Conflict { message } => (409, json!({"message": message})),
            AppError::Unauthorized { message } => (401, json!({"message": message})),
            AppError::FileTooLarge => (
                413,
                json!({"message": "File size exceeds the maximum allowed limit"}),
            ),
            AppError::UnsupportedMediaType => {
                (415, json!({"message": "file: Unsupported file type"}))
            }
            AppError::Database(_) | AppError::Jwt(_) | AppError::Internal(_) => {
                (500, json!({"message": "Internal server error"}))
            }
        };
        Self { status, body }
    }
}

/// Decode a Bearer token string and verify it against the repos (revocation check + user active).
/// Returns `Err(AppError::Unauthorized)` on any failure — mirrors `AuthUser::from_request_parts`.
async fn auth_from_bearer(state: &AppState, bearer: &str) -> Result<AuthContext, AppError> {
    let token = bearer.strip_prefix("Bearer ").unwrap_or(bearer).trim();
    if token.is_empty() {
        return Err(AppError::Unauthorized {
            message: "Missing Authorization header".to_string(),
        });
    }

    let claims = decode_access_token(token, &state.jwt_secret)?;

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized {
        message: "Invalid user ID in token".to_string(),
    })?;

    let revoked = state.token_repo.is_revoked(&claims.jti).await?;
    if revoked {
        return Err(AppError::Unauthorized {
            message: "Token has been revoked".to_string(),
        });
    }

    let all_revoked = state
        .token_repo
        .is_user_all_revoked_after(user_id, claims.iat as i64)
        .await?;
    if all_revoked {
        return Err(AppError::Unauthorized {
            message: "Token has been revoked".to_string(),
        });
    }

    let user =
        state
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::Unauthorized {
                message: "User not found".to_string(),
            })?;

    let status = UserStatus::parse_str(&user.status).unwrap_or(UserStatus::Active);
    if status != UserStatus::Active {
        return Err(AppError::Unauthorized {
            message: "Account is not active".to_string(),
        });
    }

    let role = Role::parse_str(&claims.role).unwrap_or(Role::User);

    Ok(AuthContext {
        user_id,
        username: claims.username,
        role,
        jti: claims.jti,
        iat: claims.iat as i64,
    })
}

#[derive(Clone, Debug)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub username: String,
    pub role: Role,
    pub jti: String,
    #[allow(dead_code)]
    pub iat: i64,
}

/// Shared application state held in the world.
#[derive(cucumber::World, Debug)]
#[world(init = Self::new_world)]
pub struct AppWorld {
    pub state: Arc<AppState>,
    pub last_status: u16,
    pub last_body: Value,
    pub auth_token: Option<String>,
    pub refresh_token: Option<String>,
    pub user_id: Option<Uuid>,
    #[allow(dead_code)]
    pub second_auth_token: Option<String>,
    #[allow(dead_code)]
    pub second_refresh_token: Option<String>,
    #[allow(dead_code)]
    pub second_user_id: Option<Uuid>,
    pub admin_token: Option<String>,
    pub last_expense_id: Option<Uuid>,
    pub last_attachment_id: Option<Uuid>,
    pub bob_expense_id: Option<Uuid>,
    pub bob_auth_token: Option<String>,
    pub original_refresh_token: Option<String>,
    pub alice_id: Option<Uuid>,
}

impl AppWorld {
    async fn new_world() -> Result<Self, anyhow::Error> {
        // Build a dummy pool (sqlite in-memory) for the pool field; it will never be
        // used by unit-test service calls since they all go through the repo traits.
        let pool = a_demo_be_rust_axum::db::pool::create_test_pool().await?;

        let state = Arc::new(AppState::with_repos(
            pool,
            TEST_JWT_SECRET.to_string(),
            Arc::new(InMemoryUserRepository::new()),
            Arc::new(InMemoryExpenseRepository::new()),
            Arc::new(InMemoryAttachmentRepository::new()),
            Arc::new(InMemoryTokenRepository::new()),
            Arc::new(InMemoryRefreshTokenRepository::new()),
        ));

        Ok(Self {
            state,
            last_status: 0,
            last_body: Value::Null,
            auth_token: None,
            refresh_token: None,
            user_id: None,
            second_auth_token: None,
            second_refresh_token: None,
            second_user_id: None,
            admin_token: None,
            last_expense_id: None,
            last_attachment_id: None,
            bob_expense_id: None,
            bob_auth_token: None,
            original_refresh_token: None,
            alice_id: None,
        })
    }

    fn record(&mut self, resp: ServiceResponse) {
        self.last_status = resp.status;
        self.last_body = resp.body;
    }

    pub fn bearer(&self) -> String {
        self.auth_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    pub fn admin_bearer(&self) -> String {
        self.admin_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    pub fn bob_bearer(&self) -> String {
        self.bob_auth_token
            .clone()
            .map(|t| format!("Bearer {t}"))
            .unwrap_or_default()
    }

    // -----------------------------------------------------------------------
    // AUTH service calls
    // -----------------------------------------------------------------------

    /// POST /api/v1/auth/register
    pub async fn svc_register(&mut self, username: &str, email: &str, password: &str) {
        let resp = svc_register(&self.state, username, email, password).await;
        self.record(resp);
    }

    /// POST /api/v1/auth/login
    pub async fn svc_login(&mut self, username: &str, password: &str) {
        let resp = svc_login(&self.state, username, password).await;
        self.record(resp);
    }

    /// POST /api/v1/auth/refresh
    pub async fn svc_refresh(&mut self, refresh_token: &str) {
        let resp = svc_refresh(&self.state, refresh_token).await;
        self.record(resp);
    }

    /// POST /api/v1/auth/logout  (accepts bearer string like "Bearer <token>")
    pub async fn svc_logout(&mut self, bearer: &str) {
        let resp = svc_logout(&self.state, bearer).await;
        self.record(resp);
    }

    /// POST /api/v1/auth/logout-all  (requires valid auth)
    pub async fn svc_logout_all(&mut self, bearer: &str) {
        let resp = svc_logout_all(&self.state, bearer).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // HEALTH service call
    // -----------------------------------------------------------------------

    /// GET /health
    pub async fn svc_health(&mut self) {
        use serde_json::json;
        let resp = ServiceResponse::ok(json!({"status": "UP"}));
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // TOKEN service calls
    // -----------------------------------------------------------------------

    /// GET /api/v1/tokens/claims
    pub async fn svc_get_claims(&mut self, bearer: &str) {
        let resp = svc_get_claims(&self.state, bearer).await;
        self.record(resp);
    }

    /// GET /.well-known/jwks.json
    pub async fn svc_jwks(&mut self) {
        use serde_json::json;
        let resp = ServiceResponse::ok(json!({
            "keys": [
                {
                    "kty": "oct",
                    "alg": "HS256",
                    "use": "sig",
                    "kid": "default"
                }
            ]
        }));
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // USER service calls
    // -----------------------------------------------------------------------

    /// GET /api/v1/users/me
    pub async fn svc_get_profile(&mut self, bearer: &str) {
        let resp = svc_get_profile(&self.state, bearer).await;
        self.record(resp);
    }

    /// PATCH /api/v1/users/me
    pub async fn svc_update_profile(&mut self, bearer: &str, display_name: &str) {
        let resp = svc_update_profile(&self.state, bearer, display_name).await;
        self.record(resp);
    }

    /// POST /api/v1/users/me/password
    pub async fn svc_change_password(
        &mut self,
        bearer: &str,
        old_password: &str,
        new_password: &str,
    ) {
        let resp = svc_change_password(&self.state, bearer, old_password, new_password).await;
        self.record(resp);
    }

    /// POST /api/v1/users/me/deactivate
    pub async fn svc_deactivate(&mut self, bearer: &str) {
        let resp = svc_deactivate(&self.state, bearer).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // ADMIN service calls
    // -----------------------------------------------------------------------

    /// GET /api/v1/admin/users (with optional email filter)
    pub async fn svc_admin_list_users(&mut self, admin_bearer: &str, email_filter: Option<&str>) {
        let resp = svc_admin_list_users(&self.state, admin_bearer, email_filter).await;
        self.record(resp);
    }

    /// POST /api/v1/admin/users/{id}/disable
    pub async fn svc_admin_disable_user(&mut self, admin_bearer: &str, user_id: Uuid) {
        let resp = svc_admin_disable_user(&self.state, admin_bearer, user_id).await;
        self.record(resp);
    }

    /// POST /api/v1/admin/users/{id}/enable
    pub async fn svc_admin_enable_user(&mut self, admin_bearer: &str, user_id: Uuid) {
        let resp = svc_admin_enable_user(&self.state, admin_bearer, user_id).await;
        self.record(resp);
    }

    /// POST /api/v1/admin/users/{id}/unlock
    pub async fn svc_admin_unlock_user(&mut self, admin_bearer: &str, user_id: Uuid) {
        let resp = svc_admin_unlock_user(&self.state, admin_bearer, user_id).await;
        self.record(resp);
    }

    /// POST /api/v1/admin/users/{id}/force-password-reset
    pub async fn svc_admin_force_password_reset(&mut self, admin_bearer: &str, user_id: Uuid) {
        let resp = svc_admin_force_password_reset(&self.state, admin_bearer, user_id).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // EXPENSE service calls
    // -----------------------------------------------------------------------

    /// POST /api/v1/expenses
    #[allow(clippy::too_many_arguments)]
    pub async fn svc_create_expense(
        &mut self,
        bearer: &str,
        amount: &str,
        currency: &str,
        category: &str,
        description: &str,
        date: &str,
        entry_type: &str,
        quantity: Option<f64>,
        unit: Option<&str>,
    ) {
        let resp = svc_create_expense(
            &self.state,
            bearer,
            amount,
            currency,
            category,
            description,
            date,
            entry_type,
            quantity,
            unit,
        )
        .await;
        if resp.status == 201 {
            self.last_expense_id = resp
                .body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| Uuid::parse_str(s).ok());
        }
        self.record(resp);
    }

    /// GET /api/v1/expenses
    pub async fn svc_list_expenses(&mut self, bearer: &str) {
        let resp = svc_list_expenses(&self.state, bearer).await;
        self.record(resp);
    }

    /// GET /api/v1/expenses/{id}
    pub async fn svc_get_expense(&mut self, bearer: &str, expense_id: Uuid) {
        let resp = svc_get_expense(&self.state, bearer, expense_id).await;
        self.record(resp);
    }

    /// PUT /api/v1/expenses/{id}
    #[allow(clippy::too_many_arguments)]
    pub async fn svc_update_expense(
        &mut self,
        bearer: &str,
        expense_id: Uuid,
        amount: &str,
        currency: &str,
        category: &str,
        description: &str,
        date: &str,
        entry_type: &str,
        quantity: Option<f64>,
        unit: Option<&str>,
    ) {
        let resp = svc_update_expense(
            &self.state,
            bearer,
            expense_id,
            amount,
            currency,
            category,
            description,
            date,
            entry_type,
            quantity,
            unit,
        )
        .await;
        self.record(resp);
    }

    /// DELETE /api/v1/expenses/{id}
    pub async fn svc_delete_expense(&mut self, bearer: &str, expense_id: Uuid) {
        let resp = svc_delete_expense(&self.state, bearer, expense_id).await;
        self.record(resp);
    }

    /// GET /api/v1/expenses/summary
    pub async fn svc_expense_summary(&mut self, bearer: &str) {
        let resp = svc_expense_summary(&self.state, bearer).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // ATTACHMENT service calls
    // -----------------------------------------------------------------------

    /// POST /api/v1/expenses/{id}/attachments
    pub async fn svc_upload_attachment(
        &mut self,
        bearer: &str,
        expense_id: Uuid,
        filename: &str,
        content_type: &str,
        data: Vec<u8>,
    ) {
        let resp = svc_upload_attachment(
            &self.state,
            bearer,
            expense_id,
            filename,
            content_type,
            data,
        )
        .await;
        if resp.status == 201 {
            self.last_attachment_id = resp
                .body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| Uuid::parse_str(s).ok());
        }
        self.record(resp);
    }

    /// GET /api/v1/expenses/{id}/attachments
    pub async fn svc_list_attachments(&mut self, bearer: &str, expense_id: Uuid) {
        let resp = svc_list_attachments(&self.state, bearer, expense_id).await;
        self.record(resp);
    }

    /// DELETE /api/v1/expenses/{id}/attachments/{aid}
    pub async fn svc_delete_attachment(
        &mut self,
        bearer: &str,
        expense_id: Uuid,
        attachment_id: Uuid,
    ) {
        let resp = svc_delete_attachment(&self.state, bearer, expense_id, attachment_id).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // REPORT service calls
    // -----------------------------------------------------------------------

    /// GET /api/v1/reports/pl
    pub async fn svc_pl_report(&mut self, bearer: &str, from: &str, to: &str, currency: &str) {
        let resp = svc_pl_report(&self.state, bearer, from, to, currency).await;
        self.record(resp);
    }

    // -----------------------------------------------------------------------
    // DB helpers (bypass service layer for setup steps)
    // -----------------------------------------------------------------------

    /// Promote a user to admin by directly updating the in-memory repo.
    pub async fn promote_to_admin(&self, user_id: Uuid) -> anyhow::Result<()> {
        self.state.user_repo.update_role(user_id, "ADMIN").await?;
        Ok(())
    }
}

// ===========================================================================
// Pure service functions (no HTTP, no Router, no Tower)
// ===========================================================================

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

pub async fn svc_register(
    state: &AppState,
    username: &str,
    email: &str,
    password: &str,
) -> ServiceResponse {
    use serde_json::json;

    // Validate inputs
    if let Err(e) = validate_email(email) {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = validate_password(password) {
        return ServiceResponse::from_error(&e);
    }
    if username.is_empty() {
        return ServiceResponse::from_error(&AppError::Validation {
            field: "username".to_string(),
            message: "must not be empty".to_string(),
        });
    }

    let password_hash = match hash_password(password.to_string()).await {
        Ok(h) => h,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let user_id = Uuid::new_v4();
    match state
        .user_repo
        .create(
            user_id,
            username,
            email,
            username, // display_name defaults to username
            &password_hash,
            "USER",
        )
        .await
    {
        Ok(user) => ServiceResponse::created(json!({
            "id": user.id.to_string(),
            "username": user.username,
            "email": user.email,
            "displayName": user.display_name,
        })),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_login(state: &AppState, username: &str, password: &str) -> ServiceResponse {
    use serde_json::json;

    const MAX_FAILED_ATTEMPTS: i64 = 5;

    let user = match state.user_repo.find_by_username(username).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::Unauthorized {
                message: "Invalid credentials".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let status = UserStatus::parse_str(&user.status).unwrap_or(UserStatus::Active);

    if status == UserStatus::Inactive {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Account has been deactivated".to_string(),
        });
    }
    if status == UserStatus::Disabled {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Account has been disabled".to_string(),
        });
    }
    if status == UserStatus::Locked {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Account is locked".to_string(),
        });
    }

    let valid = match verify_password(password.to_string(), user.password_hash.clone()).await {
        Ok(v) => v,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if !valid {
        let attempts = match state.user_repo.increment_failed_attempts(user.id).await {
            Ok(a) => a,
            Err(e) => return ServiceResponse::from_error(&e),
        };
        if attempts >= MAX_FAILED_ATTEMPTS {
            if let Err(e) = state.user_repo.update_status(user.id, "LOCKED").await {
                return ServiceResponse::from_error(&e);
            }
        }
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    if let Err(e) = state.user_repo.reset_failed_attempts(user.id).await {
        return ServiceResponse::from_error(&e);
    }

    let role = Role::parse_str(&user.role).unwrap_or(Role::User);
    let (access_token, _) = match encode_access_token(
        user.id,
        &user.username,
        &role.to_string(),
        &state.jwt_secret,
    ) {
        Ok(pair) => pair,
        Err(e) => return ServiceResponse::from_error(&e),
    };
    let (refresh_token, _) = match encode_refresh_token(user.id, &state.jwt_secret) {
        Ok(pair) => pair,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    ServiceResponse::ok(json!({
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
    }))
}

pub async fn svc_refresh(state: &AppState, refresh_token_str: &str) -> ServiceResponse {
    use serde_json::json;

    let claims = match decode_refresh_token(refresh_token_str, &state.jwt_secret) {
        Ok(c) => c,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let revoked = match state.token_repo.is_revoked(&claims.jti).await {
        Ok(r) => r,
        Err(e) => return ServiceResponse::from_error(&e),
    };
    if revoked {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Invalid token".to_string(),
        });
    }

    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => {
            return ServiceResponse::from_error(&AppError::Unauthorized {
                message: "Invalid token".to_string(),
            })
        }
    };

    let user = match state.user_repo.find_by_id(user_id).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::Unauthorized {
                message: "User not found".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let status = UserStatus::parse_str(&user.status).unwrap_or(UserStatus::Active);
    if status != UserStatus::Active {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Account has been deactivated".to_string(),
        });
    }

    if let Err(e) = state.token_repo.revoke_token(&claims.jti, user_id).await {
        return ServiceResponse::from_error(&e);
    }

    let role = Role::parse_str(&user.role).unwrap_or(Role::User);
    let (access_token, _) = match encode_access_token(
        user.id,
        &user.username,
        &role.to_string(),
        &state.jwt_secret,
    ) {
        Ok(pair) => pair,
        Err(e) => return ServiceResponse::from_error(&e),
    };
    let (refresh_token, _) = match encode_refresh_token(user.id, &state.jwt_secret) {
        Ok(pair) => pair,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    ServiceResponse::ok(json!({
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
    }))
}

pub async fn svc_logout(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let token = bearer.strip_prefix("Bearer ").unwrap_or(bearer).trim();
    if !token.is_empty() {
        if let Ok(claims) = decode_claims_unchecked(token, &state.jwt_secret) {
            let user_id = Uuid::parse_str(&claims.sub).unwrap_or_else(|_| Uuid::new_v4());
            if let Err(e) = state.token_repo.revoke_token(&claims.jti, user_id).await {
                return ServiceResponse::from_error(&e);
            }
        }
    }
    ServiceResponse::ok(json!({"message": "Logged out"}))
}

pub async fn svc_logout_all(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if let Err(e) = state.token_repo.revoke_token(&auth.jti, auth.user_id).await {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = state.token_repo.revoke_all_for_user(auth.user_id).await {
        return ServiceResponse::from_error(&e);
    }
    ServiceResponse::ok(json!({"message": "ok"}))
}

// ---------------------------------------------------------------------------
// TOKENS
// ---------------------------------------------------------------------------

pub async fn svc_get_claims(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    ServiceResponse::ok(json!({
        "sub": auth.user_id.to_string(),
        "username": auth.username,
        "role": auth.role.to_string(),
        "jti": auth.jti,
        "iss": ISSUER,
    }))
}

// ---------------------------------------------------------------------------
// USER
// ---------------------------------------------------------------------------

pub async fn svc_get_profile(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state.user_repo.find_by_id(auth.user_id).await {
        Ok(Some(user)) => ServiceResponse::ok(json!({
            "id": user.id.to_string(),
            "username": user.username,
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "status": user.status,
        })),
        Ok(None) => ServiceResponse::from_error(&AppError::NotFound {
            entity: "user".to_string(),
        }),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_update_profile(
    state: &AppState,
    bearer: &str,
    display_name: &str,
) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state
        .user_repo
        .update_display_name(auth.user_id, display_name)
        .await
    {
        Ok(user) => ServiceResponse::ok(json!({
            "id": user.id.to_string(),
            "username": user.username,
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "status": user.status,
        })),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_change_password(
    state: &AppState,
    bearer: &str,
    old_password: &str,
    new_password: &str,
) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let user = match state.user_repo.find_by_id(auth.user_id).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "user".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let valid = match verify_password(old_password.to_string(), user.password_hash).await {
        Ok(v) => v,
        Err(e) => return ServiceResponse::from_error(&e),
    };
    if !valid {
        return ServiceResponse::from_error(&AppError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    if new_password.is_empty() {
        return ServiceResponse::from_error(&AppError::Validation {
            field: "new_password".to_string(),
            message: "must not be empty".to_string(),
        });
    }

    let new_hash = match hash_password(new_password.to_string()).await {
        Ok(h) => h,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if let Err(e) = state
        .user_repo
        .update_password_hash(auth.user_id, &new_hash)
        .await
    {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = state.token_repo.revoke_all_for_user(auth.user_id).await {
        return ServiceResponse::from_error(&e);
    }

    ServiceResponse::ok(json!({"message": "Password changed"}))
}

pub async fn svc_deactivate(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if let Err(e) = state
        .user_repo
        .update_status(auth.user_id, "INACTIVE")
        .await
    {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = state.token_repo.revoke_all_for_user(auth.user_id).await {
        return ServiceResponse::from_error(&e);
    }
    ServiceResponse::ok(json!({"message": "Account deactivated"}))
}

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

async fn require_admin(state: &AppState, bearer: &str) -> Result<AuthContext, AppError> {
    let auth = auth_from_bearer(state, bearer).await?;
    if auth.role != Role::Admin {
        return Err(AppError::Forbidden {
            message: "Admin only".to_string(),
        });
    }
    Ok(auth)
}

pub async fn svc_admin_list_users(
    state: &AppState,
    admin_bearer: &str,
    email_filter: Option<&str>,
) -> ServiceResponse {
    use serde_json::json;

    if let Err(e) = require_admin(state, admin_bearer).await {
        return ServiceResponse::from_error(&e);
    }

    match state.user_repo.list(1, 20, email_filter).await {
        Ok(result) => {
            let data: Vec<Value> = result
                .users
                .into_iter()
                .map(|u| {
                    json!({
                        "id": u.id.to_string(),
                        "username": u.username,
                        "email": u.email,
                        "displayName": u.display_name,
                        "role": u.role,
                        "status": u.status,
                    })
                })
                .collect();
            ServiceResponse::ok(json!({
                "content": data,
                "totalElements": result.total,
                "page": 1i64,
                "page_size": 20i64,
            }))
        }
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_admin_disable_user(
    state: &AppState,
    admin_bearer: &str,
    user_id: Uuid,
) -> ServiceResponse {
    use serde_json::json;

    if let Err(e) = require_admin(state, admin_bearer).await {
        return ServiceResponse::from_error(&e);
    }

    if let Err(e) = state.user_repo.update_status(user_id, "DISABLED").await {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = state.token_repo.revoke_all_for_user(user_id).await {
        return ServiceResponse::from_error(&e);
    }
    ServiceResponse::ok(json!({"message": "User disabled"}))
}

pub async fn svc_admin_enable_user(
    state: &AppState,
    admin_bearer: &str,
    user_id: Uuid,
) -> ServiceResponse {
    use serde_json::json;

    if let Err(e) = require_admin(state, admin_bearer).await {
        return ServiceResponse::from_error(&e);
    }

    if let Err(e) = state.user_repo.update_status(user_id, "ACTIVE").await {
        return ServiceResponse::from_error(&e);
    }
    ServiceResponse::ok(json!({"message": "User enabled"}))
}

pub async fn svc_admin_unlock_user(
    state: &AppState,
    admin_bearer: &str,
    user_id: Uuid,
) -> ServiceResponse {
    use serde_json::json;

    if let Err(e) = require_admin(state, admin_bearer).await {
        return ServiceResponse::from_error(&e);
    }

    if let Err(e) = state.user_repo.update_status(user_id, "ACTIVE").await {
        return ServiceResponse::from_error(&e);
    }
    if let Err(e) = state.user_repo.reset_failed_attempts(user_id).await {
        return ServiceResponse::from_error(&e);
    }
    ServiceResponse::ok(json!({"message": "User unlocked"}))
}

pub async fn svc_admin_force_password_reset(
    state: &AppState,
    admin_bearer: &str,
    user_id: Uuid,
) -> ServiceResponse {
    use serde_json::json;

    if let Err(e) = require_admin(state, admin_bearer).await {
        return ServiceResponse::from_error(&e);
    }

    match state.user_repo.find_by_id(user_id).await {
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "user".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
        Ok(Some(_)) => {}
    }

    let reset_token = Uuid::new_v4().to_string();
    if let Err(e) = state
        .user_repo
        .set_password_reset_token(user_id, &reset_token)
        .await
    {
        return ServiceResponse::from_error(&e);
    }

    ServiceResponse::ok(json!({"token": reset_token}))
}

// ---------------------------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------------------------

#[allow(clippy::too_many_arguments)]
pub async fn svc_create_expense(
    state: &AppState,
    bearer: &str,
    amount: &str,
    currency_str: &str,
    category: &str,
    description: &str,
    date_str: &str,
    entry_type_str: &str,
    quantity: Option<f64>,
    unit: Option<&str>,
) -> ServiceResponse {
    use a_demo_be_rust_axum::domain::types::is_supported_unit;
    use chrono::NaiveDate;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let currency = match Currency::parse_from_str(currency_str) {
        Some(c) => c,
        None => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "currency".to_string(),
                message: format!("unsupported currency: {currency_str}"),
            })
        }
    };

    let amount = match parse_amount(&currency, amount) {
        Ok(v) => v,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let entry_type = match entry_type_str {
        "expense" | "income" => entry_type_str.to_string(),
        other => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "type".to_string(),
                message: format!("unsupported entry type: {other}"),
            })
        }
    };

    let date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "date".to_string(),
                message: "invalid date format, use YYYY-MM-DD".to_string(),
            })
        }
    };

    if let Some(u) = unit {
        if !is_supported_unit(u) {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "unit".to_string(),
                message: format!("unsupported unit: {u}"),
            });
        }
    }

    let expense_id = Uuid::new_v4();
    match state
        .expense_repo
        .create(
            expense_id,
            auth.user_id,
            amount,
            currency_str,
            category,
            description,
            date,
            &entry_type,
            quantity,
            unit,
        )
        .await
    {
        Ok(expense) => ServiceResponse::created(expense_to_json(&expense)),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_list_expenses(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state.expense_repo.list_for_user(auth.user_id, 1, 20).await {
        Ok(result) => {
            let data: Vec<Value> = result.expenses.iter().map(expense_to_json).collect();
            ServiceResponse::ok(json!({
                "content": data,
                "totalElements": result.total,
                "page": 1i64,
                "page_size": 20i64,
            }))
        }
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_get_expense(state: &AppState, bearer: &str, expense_id: Uuid) -> ServiceResponse {
    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(expense)) => {
            if expense.user_id != auth.user_id {
                return ServiceResponse::from_error(&AppError::Forbidden {
                    message: "Access denied".to_string(),
                });
            }
            ServiceResponse::ok(expense_to_json(&expense))
        }
        Ok(None) => ServiceResponse::from_error(&AppError::NotFound {
            entity: "expense".to_string(),
        }),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

#[allow(clippy::too_many_arguments)]
pub async fn svc_update_expense(
    state: &AppState,
    bearer: &str,
    expense_id: Uuid,
    amount: &str,
    currency_str: &str,
    category: &str,
    description: &str,
    date_str: &str,
    entry_type_str: &str,
    quantity: Option<f64>,
    unit: Option<&str>,
) -> ServiceResponse {
    use a_demo_be_rust_axum::domain::types::is_supported_unit;
    use chrono::NaiveDate;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let existing = match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(e)) => e,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "expense".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if existing.user_id != auth.user_id {
        return ServiceResponse::from_error(&AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    let currency = match Currency::parse_from_str(currency_str) {
        Some(c) => c,
        None => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "currency".to_string(),
                message: format!("unsupported currency: {currency_str}"),
            })
        }
    };

    let amount = match parse_amount(&currency, amount) {
        Ok(v) => v,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let entry_type = match entry_type_str {
        "expense" | "income" => entry_type_str.to_string(),
        other => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "type".to_string(),
                message: format!("unsupported entry type: {other}"),
            })
        }
    };

    let date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "date".to_string(),
                message: "invalid date format, use YYYY-MM-DD".to_string(),
            })
        }
    };

    if let Some(u) = unit {
        if !is_supported_unit(u) {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "unit".to_string(),
                message: format!("unsupported unit: {u}"),
            });
        }
    }

    match state
        .expense_repo
        .update(
            expense_id,
            amount,
            currency_str,
            category,
            description,
            date,
            &entry_type,
            quantity,
            unit,
        )
        .await
    {
        Ok(expense) => ServiceResponse::ok(expense_to_json(&expense)),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_delete_expense(
    state: &AppState,
    bearer: &str,
    expense_id: Uuid,
) -> ServiceResponse {
    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(expense)) => {
            if expense.user_id != auth.user_id {
                return ServiceResponse::from_error(&AppError::Forbidden {
                    message: "Access denied".to_string(),
                });
            }
        }
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "expense".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    }

    if let Err(e) = state.expense_repo.delete(expense_id).await {
        return ServiceResponse::from_error(&e);
    }

    ServiceResponse::no_content()
}

pub async fn svc_expense_summary(state: &AppState, bearer: &str) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    match state.expense_repo.summarize_by_currency(auth.user_id).await {
        Ok(summaries) => {
            let mut result = serde_json::Map::new();
            for s in summaries {
                if let Some(currency) = Currency::parse_from_str(&s.currency) {
                    let display = currency.format_amount(s.total);
                    result.insert(s.currency, json!(display));
                }
            }
            ServiceResponse::ok(Value::Object(result))
        }
        Err(e) => ServiceResponse::from_error(&e),
    }
}

// ---------------------------------------------------------------------------
// ATTACHMENTS
// ---------------------------------------------------------------------------

pub async fn svc_upload_attachment(
    state: &AppState,
    bearer: &str,
    expense_id: Uuid,
    filename: &str,
    content_type: &str,
    data: Vec<u8>,
) -> ServiceResponse {
    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let expense = match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(e)) => e,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "expense".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if expense.user_id != auth.user_id {
        return ServiceResponse::from_error(&AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    if !is_allowed_content_type(content_type) {
        return ServiceResponse::from_error(&AppError::UnsupportedMediaType);
    }

    if data.len() > MAX_FILE_SIZE {
        return ServiceResponse::from_error(&AppError::FileTooLarge);
    }

    let att_id = Uuid::new_v4();
    match state
        .attachment_repo
        .create(NewAttachment {
            id: att_id,
            expense_id,
            filename: filename.to_string(),
            content_type: content_type.to_string(),
            size: data.len() as i64,
            data,
        })
        .await
    {
        Ok(att) => ServiceResponse::created(attachment_to_json(&att)),
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_list_attachments(
    state: &AppState,
    bearer: &str,
    expense_id: Uuid,
) -> ServiceResponse {
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let expense = match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(e)) => e,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "expense".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if expense.user_id != auth.user_id {
        return ServiceResponse::from_error(&AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    match state.attachment_repo.list_for_expense(expense_id).await {
        Ok(attachments) => {
            let items: Vec<Value> = attachments.iter().map(attachment_to_json).collect();
            ServiceResponse::ok(json!({"attachments": items}))
        }
        Err(e) => ServiceResponse::from_error(&e),
    }
}

pub async fn svc_delete_attachment(
    state: &AppState,
    bearer: &str,
    expense_id: Uuid,
    attachment_id: Uuid,
) -> ServiceResponse {
    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let expense = match state.expense_repo.find_by_id(expense_id).await {
        Ok(Some(e)) => e,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "expense".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if expense.user_id != auth.user_id {
        return ServiceResponse::from_error(&AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    let attachment = match state.attachment_repo.find_by_id(attachment_id).await {
        Ok(Some(a)) => a,
        Ok(None) => {
            return ServiceResponse::from_error(&AppError::NotFound {
                entity: "attachment".to_string(),
            })
        }
        Err(e) => return ServiceResponse::from_error(&e),
    };

    if attachment.expense_id != expense_id {
        return ServiceResponse::from_error(&AppError::NotFound {
            entity: "attachment".to_string(),
        });
    }

    if let Err(e) = state.attachment_repo.delete(attachment_id).await {
        return ServiceResponse::from_error(&e);
    }

    ServiceResponse::no_content()
}

// ---------------------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------------------

pub async fn svc_pl_report(
    state: &AppState,
    bearer: &str,
    from_str: &str,
    to_str: &str,
    currency_str: &str,
) -> ServiceResponse {
    use chrono::NaiveDate;
    use serde_json::json;

    let auth = match auth_from_bearer(state, bearer).await {
        Ok(a) => a,
        Err(e) => return ServiceResponse::from_error(&e),
    };

    let from = match NaiveDate::parse_from_str(from_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "from".to_string(),
                message: "invalid date format".to_string(),
            })
        }
    };
    let to = match NaiveDate::parse_from_str(to_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "to".to_string(),
                message: "invalid date format".to_string(),
            })
        }
    };
    let currency = match Currency::parse_from_str(currency_str) {
        Some(c) => c,
        None => {
            return ServiceResponse::from_error(&AppError::Validation {
                field: "currency".to_string(),
                message: format!("unsupported currency: {currency_str}"),
            })
        }
    };

    match state
        .expense_repo
        .pl_report(auth.user_id, &currency, from, to)
        .await
    {
        Ok(report) => {
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
            ServiceResponse::ok(json!({
                "totalIncome": currency.format_amount(report.income_total),
                "totalExpense": currency.format_amount(report.expense_total),
                "net": currency.format_amount(net),
                "incomeBreakdown": income_breakdown,
                "expenseBreakdown": expense_breakdown,
            }))
        }
        Err(e) => ServiceResponse::from_error(&e),
    }
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

fn expense_to_json(expense: &Expense) -> Value {
    use serde_json::json;
    let currency = expense.currency();
    let amount_display = currency.format_amount(expense.amount);
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

fn attachment_to_json(att: &Attachment) -> Value {
    use serde_json::json;
    json!({
        "id": att.id.to_string(),
        "expense_id": att.expense_id.to_string(),
        "filename": att.filename,
        "contentType": att.content_type,
        "size": att.size,
        "url": format!("/api/v1/expenses/{}/attachments/{}", att.expense_id, att.id),
    })
}
