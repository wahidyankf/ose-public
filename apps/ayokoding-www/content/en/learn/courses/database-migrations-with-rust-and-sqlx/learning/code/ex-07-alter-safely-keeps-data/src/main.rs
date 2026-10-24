// Example 7: Alter Safely Keeps Data.
// the seeded row survives the alter.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds each file under migrations/ at compile time

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
    MIGRATOR.run(&pool).await?; // => create, seed, then alter in version order
    let row = sqlx::query("SELECT sku, qty FROM inventory") // => the seeded row after the alter
        .fetch_one(&pool) // => exactly one seeded row exists
        .await?; // => ? bubbles a query failure instead of panicking
    let sku: String = row.get("sku"); // => the value the seed file inserted
    let qty: i32 = row.get("qty"); // => the default the alter file supplied
    println!("{sku} {qty}"); // => survival plus default, printed together
    Ok(()) // => green run: data outlived the schema change
} // => main ends: the harness compares stdout to the golden file
