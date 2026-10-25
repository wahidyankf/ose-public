// Example 36: Readers Move to the New Column.
// every old value gains its new twin.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds create, seed, expand, and copy

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
    MIGRATOR.run(&pool).await?; // => create, seed, expand, then copy values over
    let rows = sqlx::query("SELECT name, full_name FROM users ORDER BY id") // => old and new side by side
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    for row in rows {
        // => walk every user in id order
        let name: String = row.get("name"); // => the old column readers still use
        let full_name: String = row.get("full_name"); // => the new column readers adopt
        println!("{name} also {full_name}"); // => one faithful pair per line
    } // => loop ends after the last user
    Ok(()) // => green run: the copy is faithful
} // => main ends: the harness compares stdout to the golden file
