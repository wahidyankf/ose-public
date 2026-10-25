// Example 16: Pending Work Shows Before It Runs.
// the diff names version 2 without applying it.
use sqlx::Row; // => Row unlocks column reads by name on every result row
use std::collections::HashSet; // => set subtraction finds the pending versions

static PARTIAL: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => version 1 ships first
static FULL: sqlx::migrate::Migrator = sqlx::migrate!("./complete"); // => the fuller set under review

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
    PARTIAL.run(&pool).await?; // => version 1 applies; version 2 stays unapplied
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations") // => what the database already holds
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let applied: HashSet<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded set
    let mut pending: Vec<i64> = FULL
        .iter() // => walk each element in turn
        .map(|m| m.version) // => project the embedded numbers
        .filter(|v| !applied.contains(v)) // => keep only the unapplied
        .collect(); // => embedded minus recorded
    pending.sort_unstable(); // => order the pending list for stable output
    let line = pending // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("pending versions: {line}"); // => the dry-run report
    Ok(()) // => green run: previews need no database writes
} // => main ends: the harness compares stdout to the golden file
