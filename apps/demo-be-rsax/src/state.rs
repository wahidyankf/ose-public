use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub jwt_secret: String,
}

impl AppState {
    #[must_use]
    pub fn new(pool: SqlitePool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}
