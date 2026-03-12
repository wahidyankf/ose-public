use sqlx::AnyPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: AnyPool,
    pub jwt_secret: String,
}

impl AppState {
    #[must_use]
    pub fn new(pool: AnyPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}
