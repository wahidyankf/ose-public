use std::sync::Arc;

use demo_be_rsax::{app, config::Config, db::pool::create_pool, state::AppState};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let config = Config::from_env();
    let pool = create_pool(&config.database_url)
        .await
        .expect("Failed to create database pool");

    let state = Arc::new(AppState::new(pool, config.jwt_secret));
    let app = app::router(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .expect("Failed to bind port");

    tracing::info!("Listening on port {}", config.port);
    axum::serve(listener, app).await.expect("Server error");
}
