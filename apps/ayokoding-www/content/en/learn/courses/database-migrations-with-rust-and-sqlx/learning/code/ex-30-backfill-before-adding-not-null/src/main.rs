// Example 30: Backfill Before Adding NOT NULL.
// strictness arrives in three versions.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => embeds the nullable, backfill, and constraint

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
    MIGRATOR.run(&pool).await?; // => nullable arrives, nulls fill, constraint lands
    let row = sqlx::query("SELECT COUNT(*) AS n FROM profiles WHERE handle IS NULL") // => nulls that would block strictness
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => zero after the backfill
    println!("null handles remaining: {n}"); // => the backfill proof
    let row = sqlx::query("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'handle'") // => the constraint itself
        .fetch_one(&pool) // => exactly one catalog row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let nullable: String = row.get("is_nullable"); // => NO once the constraint lands
    println!("handle nullable: {nullable}"); // => the strictness proof
    Ok(()) // => green run: data first, constraint second
} // => main ends: the harness compares stdout to the golden file
