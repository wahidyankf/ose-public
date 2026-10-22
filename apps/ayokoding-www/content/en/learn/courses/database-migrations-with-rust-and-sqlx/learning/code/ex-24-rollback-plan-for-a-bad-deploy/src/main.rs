// Example 24: Rollback Plan for a Bad Deploy.
// the down file is the rehearsed way back.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the deploy and its way back

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
    MIGRATOR.run(&pool).await?; // => the risky deploy applies
    let rows = sqlx::query("SELECT column_name FROM information_schema.columns WHERE table_name = 'members' ORDER BY ordinal_position") // => the deployed shape
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let deployed: Vec<String> = rows.iter().map(|row| row.get("column_name")).collect(); // => id, name, plus nickname
    println!("with feature: {}", deployed.join(" ")); // => the risky column is live
    MIGRATOR.undo(&pool, 1).await?; // => rollback: revert everything above version 1, keeping members
    let rows = sqlx::query("SELECT column_name FROM information_schema.columns WHERE table_name = 'members' ORDER BY ordinal_position") // => the recovered shape
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let recovered: Vec<String> = rows.iter().map(|row| row.get("column_name")).collect(); // => id and name again
    println!("without feature: {}", recovered.join(" ")); // => the way back worked
    Ok(()) // => green run: the rollback plan is proven
} // => main ends: the harness compares stdout to the golden file
