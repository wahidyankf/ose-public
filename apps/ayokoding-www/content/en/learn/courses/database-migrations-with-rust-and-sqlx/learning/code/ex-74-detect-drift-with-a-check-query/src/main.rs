// Example 74: Detect Drift with a Check Query.
// live minus tracked names the drift.
use sqlx::Row; // => Row unlocks column reads by name on every result row
use std::collections::HashSet; // => set subtraction finds the unexpected columns

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the chain tracking two columns
static TRACKED: &[&str] = &["id", "name"]; // => the columns the chain owns

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
    MIGRATOR.run(&pool).await?; // => the chain builds its two columns
    sqlx::query("ALTER TABLE configs ADD COLUMN hand_made TEXT") // => the drift under detection
        .execute(&pool) // => no version records this change
        .await?; // => ? bubbles a setup failure instead of panicking
                 // => collect the live set for subtraction
    let rows = sqlx::query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'configs'",
    ) // => the live reality
    .fetch_all(&pool) // => run the read against the same pool
    .await?; // => ? bubbles a query failure instead of panicking
    let live: HashSet<String> = rows.iter().map(|row| row.get("column_name")).collect(); // => every column present
    let tracked: HashSet<String> = TRACKED.iter().map(|s| s.to_string()).collect(); // => every column owned
    let mut drifted: Vec<String> = live.difference(&tracked).cloned().collect(); // => present but unowned
    drifted.sort(); // => order the drift for stable output
    println!("drifted columns: {}", drifted.join(" ")); // => the drift, named
    Ok(()) // => green run: detection works
} // => main ends: the harness compares stdout to the golden file
