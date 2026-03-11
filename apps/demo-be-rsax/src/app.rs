use axum::{
    extract::DefaultBodyLimit,
    routing::{delete, get, patch, post, put},
    Router,
};
use std::sync::Arc;

use crate::handlers::{admin, attachment, auth, expense, health, report, token, user};
use crate::state::AppState;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health::get_health))
        .route("/.well-known/jwks.json", get(token::jwks))
        .nest("/api/v1", api_router())
        .with_state(state)
}

fn api_router() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/auth", auth_router())
        .nest("/users", user_router())
        .nest("/admin", admin_router())
        .nest("/expenses", expense_router())
        .nest("/tokens", token_router())
        .nest("/reports", report_router())
}

fn auth_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
        .route("/refresh", post(auth::refresh))
        .route("/logout", post(auth::logout))
        .route("/logout-all", post(auth::logout_all))
}

fn user_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/me", get(user::get_profile))
        .route("/me", patch(user::update_profile))
        .route("/me/password", post(user::change_password))
        .route("/me/deactivate", post(user::deactivate))
}

fn admin_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(admin::list_users))
        .route("/users/{id}/disable", post(admin::disable_user))
        .route("/users/{id}/enable", post(admin::enable_user))
        .route("/users/{id}/unlock", post(admin::unlock_user))
        .route(
            "/users/{id}/force-password-reset",
            post(admin::force_password_reset),
        )
}

fn expense_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", post(expense::create_expense))
        .route("/", get(expense::list_expenses))
        .route("/summary", get(expense::expense_summary))
        .route("/{id}", get(expense::get_expense))
        .route("/{id}", put(expense::update_expense))
        .route("/{id}", delete(expense::delete_expense))
        .route(
            "/{id}/attachments",
            post(attachment::upload_attachment).layer(DefaultBodyLimit::max(20 * 1024 * 1024)),
        )
        .route("/{id}/attachments", get(attachment::list_attachments))
        .route(
            "/{id}/attachments/{aid}",
            delete(attachment::delete_attachment),
        )
}

fn token_router() -> Router<Arc<AppState>> {
    Router::new().route("/claims", get(token::get_claims))
}

fn report_router() -> Router<Arc<AppState>> {
    Router::new().route("/pl", get(report::pl_report))
}
