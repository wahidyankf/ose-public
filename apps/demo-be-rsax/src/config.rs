use std::env;

pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl Config {
    /// Load configuration from environment variables with defaults.
    #[must_use]
    pub fn from_env() -> Self {
        let database_url =
            env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite::memory:".to_string());
        let jwt_secret = env::var("APP_JWT_SECRET")
            .unwrap_or_else(|_| "dev-jwt-secret-at-least-32-chars-long".to_string());
        let port = env::var("APP_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8201);
        Self {
            database_url,
            jwt_secret,
            port,
        }
    }
}
