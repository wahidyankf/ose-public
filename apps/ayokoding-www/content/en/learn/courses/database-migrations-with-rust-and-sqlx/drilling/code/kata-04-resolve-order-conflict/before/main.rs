// Kata 04 starter: both branches claim version 1.
// TODO: run the winner, watch the loser fail, then renumber the loser
// to version 2 in fixed/ and print the merged line.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static WINNER: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => team A keeps version 1

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
    WINNER.run(&pool).await?; // => TODO: then collide, then renumber, then merge
    println!("merged versions: 1"); // => TODO: print the real merged line instead
    Ok(()) // => the kata is done when the line prints 1 2
} // => main ends: the kata is done when todo is gone
