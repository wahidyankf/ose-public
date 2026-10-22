// Example 52: Baseline a Multi-Table Database.
// one version adopts the whole base.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => one file adopts two tables

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
    sqlx::query("CREATE TABLE legacy_authors (id SERIAL PRIMARY KEY, name TEXT NOT NULL)") // => the first legacy table
        .execute(&pool) // => raw SQL builds the pre-migration state
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("INSERT INTO legacy_authors (name) VALUES ('ada'), ('grace')") // => two legacy authors
        .execute(&pool) // => seed the legacy state directly
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("CREATE TABLE legacy_books (id SERIAL PRIMARY KEY, title TEXT NOT NULL)") // => the second legacy table
        .execute(&pool) // => raw SQL builds the pre-migration state
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("INSERT INTO legacy_books (title) VALUES ('notes'), ('letters'), ('essays')") // => three legacy books
        .execute(&pool) // => seed the legacy state directly
        .await?; // => ? bubbles a setup failure instead of panicking
    MIGRATOR.run(&pool).await?; // => adopt both tables in one version
    let row = sqlx::query("SELECT (SELECT COUNT(*) FROM legacy_authors) AS authors, (SELECT COUNT(*) FROM legacy_books) AS books") // => both adopted tables at once
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let authors: i64 = row.get("authors"); // => two legacy authors kept
    let books: i64 = row.get("books"); // => three legacy books kept
    println!("authors {authors} books {books}"); // => the whole base, adopted
    Ok(()) // => green run: adoption composes across tables
} // => main ends: the harness compares stdout to the golden file
