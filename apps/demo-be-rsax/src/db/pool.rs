use sqlx::SqlitePool;

pub async fn create_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePool::connect(database_url).await?;
    sqlx::migrate!("src/db/migrations").run(&pool).await?;
    Ok(pool)
}

pub async fn create_test_pool() -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePool::connect("sqlite::memory:").await?;
    sqlx::migrate!("src/db/migrations").run(&pool).await?;
    Ok(pool)
}
