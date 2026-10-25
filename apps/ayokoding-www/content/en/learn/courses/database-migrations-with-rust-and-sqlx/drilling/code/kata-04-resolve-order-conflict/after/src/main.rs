// Kata 04 solution: the loser renumbers forward and merges.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static WINNER: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => team A keeps version 1
static LOSER: sqlx::migrate::Migrator = sqlx::migrate!("../branch"); // => team B collides on version 1
static MERGED: sqlx::migrate::Migrator = sqlx::migrate!("../fixed"); // => team B renumbered to version 2

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
    WINNER.run(&pool).await?; // => team A lands version 1
                              // => team B collides on the same number
    match LOSER.run(&pool).await {
        Err(MigrateError::VersionMismatch(_)) => {
            // => the collision trips the seal
            println!("branch run failed as expected"); // => the conflict, classified
        } // => match arm ends: the collision is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("colliding branch should not apply"), // => silent success would corrupt history
    } // => match ends: every outcome is classified
    MERGED.run(&pool).await?; // => the renumbered loser merges cleanly
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the merged line
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 2 on record
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("merged versions: {line}"); // => the merge, proven
    Ok(()) // => green kata: renumbering heals conflicts
} // => main ends: the harness compares stdout to the golden file
