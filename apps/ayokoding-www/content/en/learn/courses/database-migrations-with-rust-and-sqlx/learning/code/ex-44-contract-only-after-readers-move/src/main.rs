// Example 44: Contract Only After Readers Move.
// the old shape leaves last.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the split, bridge, and contraction

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
    MIGRATOR.run(&pool).await?; // => split, bridge, then contract
    let row = sqlx::query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'authors' AND column_name = 'bio'") // => legacy columns that remain
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let columns: i64 = row.get("n"); // => zero after contraction
    println!("legacy bio columns: {columns}"); // => the column proof
    let row = sqlx::query(
        "SELECT COUNT(*) AS n FROM information_schema.views WHERE table_name = 'authors_full'",
    ) // => legacy views that remain
    .fetch_one(&pool) // => exactly one count row comes back
    .await?; // => ? bubbles a query failure instead of panicking
    let views: i64 = row.get("n"); // => zero after contraction
    println!("legacy bridge views: {views}"); // => the view proof
    Ok(()) // => green run: contraction is complete
} // => main ends: the harness compares stdout to the golden file
