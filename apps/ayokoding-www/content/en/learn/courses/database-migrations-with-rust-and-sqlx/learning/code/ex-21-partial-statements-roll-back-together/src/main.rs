// Example 21: Partial Statements Roll Back Together.
// one bad statement voids the whole file.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the three-statement file

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

async fn present(pool: &sqlx::PgPool, table: &str) -> Result<bool, sqlx::Error> {
    // => one probe reused for both tables
    let row = sqlx::query("SELECT to_regclass($1) IS NOT NULL AS present") // => NULL means the table is gone
        .bind(format!("public.{table}")) // => schema-qualify so the lookup is exact
        .fetch_one(pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    Ok(row.get("present")) // => hand the flag to the caller
} // => helper ends: presence checks stay in one place

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
                 // => the third statement fails
    match MIGRATOR.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 1)) => {
            // => the failure names version 1
            println!("migration 1 failed as recorded"); // => the expected failure, classified
        } // => match arm ends: the failure is expected, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("broken file should not apply"),  // => silent success would hide the bug
    } // => match ends: every outcome is classified
    println!("halves present: {}", present(&pool, "halves").await?); // => rolled back with the file
    println!("wholes present: {}", present(&pool, "wholes").await?); // => rolled back with the file
    Ok(()) // => green run: the file is atomic
} // => main ends: the harness compares stdout to the golden file
