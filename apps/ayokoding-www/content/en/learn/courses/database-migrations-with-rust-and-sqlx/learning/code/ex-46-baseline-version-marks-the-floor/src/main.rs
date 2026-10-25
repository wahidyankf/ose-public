// Example 46: Baseline Version Marks the Floor.
// adopted below, managed above.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => version 1 adopts, version 2 builds

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
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the floor plus the new work
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => adopted 1, managed 2
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("recorded versions: {line}"); // => the floor and the build
    Ok(()) // => green run: the floor holds new work
} // => main ends: the harness compares stdout to the golden file
