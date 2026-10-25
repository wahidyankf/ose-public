// Example 57: Checksum Stability Across Runs.
// the seal never wobbles.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the two sealed files

const SEAL_SQL: &str =
    "SELECT encode(checksum, 'hex') AS seal FROM _sqlx_migrations ORDER BY version"; // => the seals as hex text, embedded once

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
    MIGRATOR.run(&pool).await?; // => first run records both checksums
    let rows = sqlx::query(SEAL_SQL) // => read the recorded seals
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let first: Vec<String> = rows.iter().map(|row| row.get("seal")).collect(); // => seals after run one
    MIGRATOR.run(&pool).await?; // => second run revalidates without rewriting
                                // => read the seals again after the second run
    let rows = sqlx::query(SEAL_SQL) // => the same named query, rerun
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let second: Vec<String> = rows.iter().map(|row| row.get("seal")).collect(); // => seals after run two
    println!("checksums stable across runs: {}", first == second); // => determinism as a boolean
    Ok(()) // => green run: the seal is deterministic
} // => main ends: the harness compares stdout to the golden file
