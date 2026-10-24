// Example 59: Seed Outside the Migrator.
// repeatable seeds live beside the chain.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the schema chain, seeds excluded
static SEED: &str = include_str!("../seed.sql"); // => the repeatable seed, embedded byte-identically

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
    MIGRATOR.run(&pool).await?; // => the schema lands once through versions
    sqlx::query(SEED).execute(&pool).await?; // => first seed run inserts both zones
    sqlx::query(SEED).execute(&pool).await?; // => second seed run adds nothing
    let row = sqlx::query("SELECT COUNT(*) AS n FROM zones") // => the rows repeatable seeds maintain
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => two zones, never duplicated
    println!("seeded zones: {n}"); // => convergence after two runs
    Ok(()) // => green run: outside seeds converge
} // => main ends: the harness compares stdout to the golden file
