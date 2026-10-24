// Example 56: Hotfix Arrives After the Release.
// the late fix heals the line.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static RELEASE: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the release ships 1 and 3
static HOTFIX: sqlx::migrate::Migrator = sqlx::migrate!("./complete"); // => the hotfix fills version 2

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
    RELEASE.run(&pool).await?; // => versions 1 and 3 ship, leaving a gap at 2
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => history with the hotfix missing
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let shipped: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 3 on record
    let line = shipped // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("shipped: {line}"); // => the release with its gap
    HOTFIX.run(&pool).await?; // => only version 2 is pending, so only it runs
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => history with the hotfix applied
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let healed: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1, 2, and 3 on record
    let line = healed // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("after hotfix: {line}"); // => the healed line
    Ok(()) // => green run: hotfixes compose
} // => main ends: the harness compares stdout to the golden file
