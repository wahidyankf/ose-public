// Example 13: Edited Migration Fails Validation.
// the tampered copy fails the checksum.
use sqlx::migrate::MigrateError; // => the error enum names every failure mode

static ORIGINAL: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the file as reviewed and applied
static EDITED: sqlx::migrate::Migrator = sqlx::migrate!("./edited"); // => the same version with a stricter column

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
    ORIGINAL.run(&pool).await?; // => version 1 applies and records its checksum
                                // => the same version with different bytes
    match EDITED.run(&pool).await {
        Err(MigrateError::VersionMismatch(version)) => {
            // => the tamper seal trips here
            println!(
                "second run failed: migration {version} was previously applied but has been modified"
            ); // => the exact failure, printed
        } // => match arm ends: the expected failure is handled
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("edited migration should not apply"), // => silent success would void the seal
    } // => match ends: every outcome is classified
    Ok(()) // => green run: tampering is caught, not applied
} // => main ends: the harness compares stdout to the golden file
