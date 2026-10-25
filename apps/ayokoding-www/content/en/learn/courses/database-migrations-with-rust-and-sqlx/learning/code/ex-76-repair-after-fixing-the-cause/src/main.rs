// Example 76: Repair After Fixing the Cause.
// fix the bytes, rerun the chain.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static DOOMED: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the file that fails clean
static FIXED: sqlx::migrate::Migrator = sqlx::migrate!("./fixed"); // => the corrected chain

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
                 // => the file fails atomically: nothing strands
    match DOOMED.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 1)) => {
            // => the failure names version 1
            println!("doomed run failed on version 1 as expected"); // => the failure, classified
        } // => match arm ends: the failure is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("doomed file should not apply"),  // => silent success would hide the bug
    } // => match ends: every outcome is classified
    let row = sqlx::query("SELECT to_regclass('public.leftovers') IS NOT NULL AS present") // => the object that never stranded
        .fetch_one(&pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let present: bool = row.get("present"); // => false: no cleanup needed
    println!("leftover table present: {present}"); // => the repair starts clean
    sqlx::query("SELECT pg_advisory_unlock_all()")
        .execute(&pool)
        .await?; // => the doomed run keeps the lock: release it here
    FIXED.run(&pool).await?; // => the corrected chain applies cleanly
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the healed line
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 2 on record
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("repaired versions: {line}"); // => the recovery, recorded
    Ok(()) // => green run: repair is fix plus rerun
} // => main ends: the harness compares stdout to the golden file
