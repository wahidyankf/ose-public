use sqlx::any::AnyPoolOptions;
use sqlx::AnyPool;

const MIGRATION_001: &str = include_str!("migrations/001_users.sql");
const MIGRATION_002: &str = include_str!("migrations/002_token_revocations.sql");
const MIGRATION_003: &str = include_str!("migrations/003_expenses.sql");
const MIGRATION_004: &str = include_str!("migrations/004_attachments.sql");

async fn run_migrations(pool: &AnyPool) -> Result<(), sqlx::Error> {
    for sql in [MIGRATION_001, MIGRATION_002, MIGRATION_003, MIGRATION_004] {
        sqlx::query(sql).execute(pool).await?;
    }
    Ok(())
}

pub async fn create_pool(database_url: &str) -> Result<AnyPool, sqlx::Error> {
    sqlx::any::install_default_drivers();
    let max_connections = if database_url.starts_with("sqlite") {
        1
    } else {
        10
    };
    let pool = AnyPoolOptions::new()
        .max_connections(max_connections)
        .connect(database_url)
        .await?;
    run_migrations(&pool).await?;
    Ok(pool)
}

pub async fn create_test_pool() -> Result<AnyPool, sqlx::Error> {
    create_pool("sqlite::memory:").await
}
