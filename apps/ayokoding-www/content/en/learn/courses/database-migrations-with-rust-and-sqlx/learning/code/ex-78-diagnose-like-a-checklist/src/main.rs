// Example 78: Diagnose Like a Checklist.
// three checks close the course.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the two versions under final review

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
    MIGRATOR.run(&pool).await?; // => two versions apply cleanly
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the line the checklist inspects
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let applied: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded line
    let sequential = applied.windows(2).all(|w| w[1] == w[0] + 1); // => no gaps in the line
    println!("no gaps in history: {sequential}"); // => check one: order
    let embedded: Vec<i64> = MIGRATOR.iter().map(|m| m.version).collect(); // => every version compiled into the binary
    println!("recorded matches embedded: {}", embedded == applied); // => check two: seals would trip otherwise
    let pending: Vec<i64> = embedded
        .into_iter()
        .filter(|v| !applied.contains(v)) // => keep only the unapplied
        .collect(); // => embedded minus recorded
    println!("nothing pending: {}", pending.is_empty()); // => check three: completeness
    Ok(()) // => green run: the checklist is green
} // => main ends: the harness compares stdout to the golden file
