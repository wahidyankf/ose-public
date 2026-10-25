// Example 71: Read the History Table First.
// the dump grounds every diagnosis.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the three versions under diagnosis

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
    MIGRATOR.run(&pool).await?; // => three versions apply cleanly
    let rows =
        sqlx::query("SELECT version, description, success FROM _sqlx_migrations ORDER BY version") // => the record every diagnosis opens with
            .fetch_all(&pool) // => run the read against the same pool
            .await?; // => ? bubbles a query failure instead of panicking
    for row in rows {
        // => walk every recorded migration
        let version: i64 = row.get("version"); // => the migration number sqlx applied
        let description: String = row.get("description"); // => the file-name description with spaces
        let success: bool = row.get("success"); // => true once the migration committed
        println!("{version} {description} {success}"); // => one fact per migration
    } // => loop ends after the last applied migration
    Ok(()) // => green run: facts first, theories later
} // => main ends: the harness compares stdout to the golden file
