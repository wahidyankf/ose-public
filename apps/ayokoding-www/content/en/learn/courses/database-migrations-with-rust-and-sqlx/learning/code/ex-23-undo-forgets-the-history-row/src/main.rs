// Example 23: Undo Forgets the History Row.
// the version vanishes from history too.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the reversible pair at compile time

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
    MIGRATOR.run(&pool).await?; // => the up file creates the table and the row
    let row = sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations") // => history with the version present
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let before: i64 = row.get("n"); // => one row after the migrate
    println!("history rows after migrate: {before}"); // => the version on record
    MIGRATOR.undo(&pool, 0).await?; // => the down file drops the table and deletes the row
    let row = sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations") // => history with the version forgotten
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let after: i64 = row.get("n"); // => no rows after the undo
    println!("history rows after undo: {after}"); // => the version forgotten
    Ok(()) // => green run: undo cleans both schema and record
} // => main ends: the harness compares stdout to the golden file
