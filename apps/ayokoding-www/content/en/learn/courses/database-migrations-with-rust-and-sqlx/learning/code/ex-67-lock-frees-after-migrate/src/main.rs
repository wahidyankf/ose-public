// Example 67: Lock Frees After Migrate.
// the same session verifies the release.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the version the lock guards

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
    MIGRATOR.run(&pool).await?; // => the lock guards this run, then releases
                                // => count this session advisory locks
    let mut conn = pool.acquire().await?; // => one dedicated session for the check
    let row = sqlx::query(
        "SELECT COUNT(*) AS n FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()",
    ) // => locks this session still holds
    .fetch_one(&mut *conn) // => the same session the migrator would have used
    .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => zero once every migrator released cleanly
    println!("advisory locks held: {n}"); // => the release, counted
    Ok(()) // => green run: the lock frees every time
} // => main ends: the harness compares stdout to the golden file
