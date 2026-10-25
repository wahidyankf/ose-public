// Example 58: Pending Review Gate.
// the gate names what the base lacks.
use sqlx::Row; // => Row unlocks column reads by name on every result row
use std::collections::HashSet; // => set subtraction finds the pending versions

static SHIPPED: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => version 1 rides the deploy
static CANDIDATE: sqlx::migrate::Migrator = sqlx::migrate!("./complete"); // => the binary under review holds 1 and 2

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
    SHIPPED.run(&pool).await?; // => the deploy applies version 1 only
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations") // => what the database already holds
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let applied: HashSet<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded set
    let pending: Vec<i64> = CANDIDATE
        .iter() // => walk each element in turn
        .map(|m| m.version) // => project the embedded numbers
        .filter(|v| !applied.contains(v)) // => keep only the unapplied
        .collect(); // => embedded minus recorded
    println!("version 2 pending review: {}", pending == vec![2]); // => the gate answer for version 2
    println!("candidate knows version 2: {}", CANDIDATE.version_exists(2)); // => the binary-side check
    Ok(()) // => green run: the gate sees the gap
} // => main ends: the harness compares stdout to the golden file
