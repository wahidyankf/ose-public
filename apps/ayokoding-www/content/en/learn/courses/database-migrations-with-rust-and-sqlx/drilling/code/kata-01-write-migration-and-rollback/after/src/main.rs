// Kata 01 solution: the pair round-trips through undo.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the reversible pair at the kata root

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

async fn present(pool: &sqlx::PgPool, table: &str) -> Result<bool, sqlx::Error> {
    // => one probe for before and after
    let row = sqlx::query("SELECT to_regclass($1) IS NOT NULL AS present") // => NULL means the table is gone
        .bind(format!("public.{table}")) // => schema-qualify so the lookup is exact
        .fetch_one(pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    Ok(row.get("present")) // => hand the flag to the caller
} // => helper ends: presence checks stay in one place

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
                 // => the pair must survive the round trip
    MIGRATOR.run(&pool).await?; // => the up file creates the table
    println!(
        "shelves after migrate: {}",
        present(&pool, "shelves").await?
    ); // => the up file landed
    MIGRATOR.undo(&pool, 0).await?; // => the down file drops it and forgets the version
    println!("shelves after undo: {}", present(&pool, "shelves").await?); // => the round trip is proven
    Ok(()) // => green kata: reversible pairs round-trip
} // => main ends: the harness compares stdout to the golden file
