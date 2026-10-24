// Example 77: Missing Files Escape Validation.
// closed by default, open on request.
use sqlx::migrate::MigrateError; // => the error enum names every failure mode

static FULL: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the two versions on record
static SLIM: sqlx::migrate::Migrator = sqlx::migrate!("./slim"); // => a binary missing version 2

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
    FULL.run(&pool).await?; // => versions 1 and 2 record normally
                            // => the slim binary lacks version 2
    match SLIM.run(&pool).await {
        Err(MigrateError::VersionMissing(version)) => {
            // => the closed default trips here
            println!(
                "strict run failed: migration {version} was previously applied but is missing"
            ); // => the protection, named
        } // => match arm ends: the closed failure is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("slim run should not pass strict"), // => silent success would hide the gap
    } // => match ends: the strict outcome is classified
    sqlx::query("SELECT pg_advisory_unlock_all()")
        .execute(&pool)
        .await?; // => the strict run keeps the lock: release it here
    let mut lenient = sqlx::migrate::Migrator::new(std::path::Path::new("./slim")).await?; // => resolve the same slim set at runtime
    lenient.set_ignore_missing(true); // => opt open for the emergency path
    lenient.run(&pool).await?; // => missing versions no longer block
    println!("lenient run passed with missing versions ignored"); // => the open policy, demonstrated
    Ok(()) // => green run: both policies behave
} // => main ends: the harness compares stdout to the golden file
