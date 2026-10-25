// Example 39: Index New Columns Before Cutover.
// concurrent builds never block writers.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the table and the concurrent index

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
    MIGRATOR.run(&pool).await?; // => create the table, then build the index concurrently
    let row = sqlx::query("SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' AND indexname = 'shipments_tracking_idx'") // => the ready query path
        .fetch_one(&pool) // => exactly one catalog row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let name: String = row.get("indexname"); // => the concurrently built index
    println!("ready index: {name}"); // => the cutover prerequisite, proven
    Ok(()) // => green run: readers may switch
} // => main ends: the harness compares stdout to the golden file
