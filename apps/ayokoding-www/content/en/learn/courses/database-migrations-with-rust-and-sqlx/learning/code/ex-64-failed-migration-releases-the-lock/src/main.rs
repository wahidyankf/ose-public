// Example 64: Failed Migration Releases the Lock.
// the repair releases the lock, then proceeds.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static BROKEN: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => version 2 carries the invalid type
static FIXED: sqlx::migrate::Migrator = sqlx::migrate!("./fixed"); // => version 2 corrected, same number

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
                 // => version 1 applies, version 2 fails
    match BROKEN.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 2)) => {
            // => the failure names version 2
            println!("broken run failed on version 2 as expected"); // => the failure, classified
        } // => match arm ends: the failure is expected, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("broken chain should not apply"), // => silent success would hide the bug
    } // => match ends: every outcome is classified
    sqlx::query("SELECT pg_advisory_unlock_all()")
        .execute(&pool)
        .await?; // => the failed run keeps the lock: release it here
    FIXED.run(&pool).await?; // => unlocked sessions proceed, so the repair runs
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the recovered line
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 2 on record
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("after repair: {line}"); // => recovery, recorded
    Ok(()) // => green run: failures never wedge the fleet
} // => main ends: the harness compares stdout to the golden file
