// Capstone: evolve an order-management schema through eight migrations.
// The shop opens with customers and orders, gains statuses, renames its name
// column without downtime, derives contact emails, and indexes the order key
// -- then proves the result with one golden join.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./db/migrations"); // => embeds the eight shop evolutions

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
async fn main() -> Result<(), sqlx::Error> {
    // => main returns the database error so failures print it
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    MIGRATOR.run(&pool).await?; // => open, seed, expand, backfill, and index in order
    let rows = sqlx::query("SELECT o.id, c.full_name, c.email, o.total, o.status FROM customers c JOIN orders o ON o.customer_id = c.id ORDER BY o.id") // => the shop, fully evolved
        .fetch_all(&pool) // => run the golden join against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    for row in rows {
        // => walk every order in id order
        let id: i32 = row.get("id"); // => the seeded order number
        let name: String = row.get("full_name"); // => twinned by the rename backfill
        let email: String = row.get("email"); // => derived by the contact backfill
        let total: i32 = row.get("total"); // => the seeded total, untouched
        let status: String = row.get("status"); // => defaulted open by version 4
        println!("order {id} {name} {email} total {total} status {status}"); // => one evolved order per line
    } // => loop ends after the last order
    Ok(()) // => green capstone: the evolution preserved everything
} // => main ends: the harness compares stdout to the golden file
