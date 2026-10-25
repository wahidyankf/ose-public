// Example 20: Failed Migration Leaves Earlier Work Intact.
// the good version stands; the bad one is recorded.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the good file and the bad file

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
    match MIGRATOR.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 2)) => {
            // => the failure names its version
            println!("migration 2 failed as recorded"); // => the expected failure, classified
        } // => match arm ends: the failure is expected, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("broken migration should not apply"), // => silent success would hide the bug
    } // => match ends: every outcome is classified
    let row =
        sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations WHERE version = 1 AND success") // => the surviving good version
            .fetch_one(&pool) // => exactly one count row comes back
            .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => version 1 committed before version 2 failed
    println!("healthy versions standing: {n}"); // => earlier work is intact
    Ok(()) // => green run: failure is contained and recorded
} // => main ends: the harness compares stdout to the golden file
