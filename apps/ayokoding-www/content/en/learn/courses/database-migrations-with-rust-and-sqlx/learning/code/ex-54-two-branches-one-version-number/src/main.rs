// Example 54: Two Branches, One Version Number.
// the same number with different bytes collides.
use sqlx::migrate::MigrateError; // => the error enum names every failure mode

static TEAM_A: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => team A claims version 1 first
static TEAM_B: sqlx::migrate::Migrator = sqlx::migrate!("./branch"); // => team B claims version 1 differently

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
    TEAM_A.run(&pool).await?; // => team A lands and records its checksum
                              // => team B carries the same number, other bytes
    match TEAM_B.run(&pool).await {
        Err(MigrateError::VersionMismatch(version)) => {
            // => the collision trips the seal
            println!(
                "branch run failed: migration {version} was previously applied but has been modified"
            ); // => the conflict, named
        } // => match arm ends: the collision is expected, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("conflicting branch should not apply"), // => silent success would corrupt history
    } // => match ends: every outcome is classified
    Ok(()) // => green run: collisions fail loudly
} // => main ends: the harness compares stdout to the golden file
