// Kata 03 solution: the idempotent version adopts the legacy base.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the idempotent baseline version

// => one URL builder shared by the pool and every probe query
fn db_url() -> String {
    // => assemble the connection string from its parts
    format!(
        "postgres://{}@{}:{}/{}", // => trust auth: a user with no password
        std::env::var("PGUSER").unwrap_or_else(|_| String::from("postgres")), // => superuser in the service container
        std::env::var("PGHOST").unwrap_or_else(|_| String::from("postgres")), // => service alias on the unit network
        std::env::var("PGPORT").unwrap_or_else(|_| String::from("5432")), // => pinned PostgreSQL port
        std::env::var("PGDATABASE").unwrap_or_else(|_| String::from("postgres")), // => the service database name
    ) // => format returns the finished URL
} // => helper ends: every connection flows through here

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    sqlx::query("CREATE TABLE legacy_stock (id SERIAL PRIMARY KEY, sku TEXT NOT NULL)") // => the table the legacy base holds
        .execute(&pool) // => raw SQL builds the pre-migration state
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("INSERT INTO legacy_stock (sku) VALUES ('a'), ('b')") // => two legacy rows to preserve
        .execute(&pool) // => seed the legacy state directly
        .await?; // => ? bubbles a setup failure instead of panicking
    MIGRATOR.run(&pool).await?; // => the idempotent version adopts without error
    let row = sqlx::query("SELECT COUNT(*) AS n FROM legacy_stock") // => the rows adoption must keep
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => two legacy rows, untouched
    println!("legacy rows kept: {n}"); // => the adoption proof
    let row = sqlx::query("SELECT version FROM _sqlx_migrations") // => the recorded floor
        .fetch_one(&pool) // => exactly one history row exists
        .await?; // => ? bubbles a query failure instead of panicking
    let version: i64 = row.get("version"); // => version 1 recorded
    println!("baseline version: {version}"); // => the floor the chain builds on
    Ok(()) // => green kata: adoption preserves everything
} // => main ends: the harness compares stdout to the golden file
