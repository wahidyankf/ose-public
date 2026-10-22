// Example 9: History Table Is the Source of Truth.
// two numbers describe the whole database.
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
    MIGRATOR.run(&pool).await?; // => three files apply in version order
    let row = sqlx::query("SELECT COUNT(*) AS n, MAX(version) AS latest FROM _sqlx_migrations") // => the state summary in one row
        .fetch_one(&pool) // => aggregates always return exactly one row
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => how many migrations applied
    let latest: i64 = row.get("latest"); // => the newest version on record
    println!("migrations applied: {n}"); // => the count claim, printed
    println!("latest version: {latest}"); // => the currency claim, printed
    Ok(()) // => green run: state is queryable
} // => main ends: the harness compares stdout to the golden file
