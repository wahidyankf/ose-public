// Example 50: Baseline Then Validate.
// adoption ends with the same seal.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the adopted floor plus one managed version

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
    sqlx::query("CREATE TABLE legacy_orders (id SERIAL PRIMARY KEY, total INTEGER NOT NULL)") // => the table the legacy database already holds
        .execute(&pool) // => raw SQL builds the pre-migration state
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("INSERT INTO legacy_orders (total) VALUES (100), (250)") // => two legacy rows the baseline must keep
        .execute(&pool) // => seed the legacy state directly
        .await?; // => ? bubbles a setup failure instead of panicking
    MIGRATOR.run(&pool).await?; // => adopt the base, then build above it
    let embedded: Vec<i64> = MIGRATOR.iter().map(|m| m.version).collect(); // => every version compiled into the binary
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations") // => every version recorded in the database
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let mut applied: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded set
    applied.sort_unstable(); // => order the recorded set for comparison
    let valid = embedded == applied; // => agreement seals the adoption
    println!("embedded {} applied {}", embedded.len(), applied.len()); // => the counts, printed
    println!("valid {valid}"); // => the verdict as data
    Ok(()) // => green run: the adoption is sealed
} // => main ends: the harness compares stdout to the golden file
