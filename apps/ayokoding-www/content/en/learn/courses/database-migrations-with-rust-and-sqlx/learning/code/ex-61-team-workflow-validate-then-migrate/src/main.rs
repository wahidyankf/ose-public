// Example 61: Team Workflow: Validate Then Migrate.
// the gate runs before and after.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the chain the team ships

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

async fn valid(pool: &sqlx::PgPool) -> Result<bool, sqlx::Error> {
    // => the gate both phases share
    let mut embedded: Vec<i64> = MIGRATOR.iter().map(|m| m.version).collect(); // => every version compiled into the binary
    embedded.sort_unstable(); // => order the embedded set for comparison
    let row = sqlx::query("SELECT to_regclass('public._sqlx_migrations') IS NOT NULL AS present") // => the history table may not exist yet
        .fetch_one(pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let present: bool = row.get("present"); // => false on the empty base
    if !present {
        // => no history table means nothing recorded
        return Ok(false); // => the gate answers false before the first run
    } // => early return ends the missing-table case
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations") // => every version recorded in the database
        .fetch_all(pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let mut applied: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded set
    applied.sort_unstable(); // => order the recorded set for comparison
    Ok(!embedded.is_empty() && embedded == applied) // => agreement means the base is fully migrated
} // => helper ends: the gate answers one boolean

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    println!("valid before migrate: {}", valid(&pool).await?); // => the pre-check on the empty base
    MIGRATOR.run(&pool).await?; // => the team run applies both versions
    println!("valid after migrate: {}", valid(&pool).await?); // => the post-check on the managed base
    Ok(()) // => green run: the workflow holds both ends
} // => main ends: the harness compares stdout to the golden file
