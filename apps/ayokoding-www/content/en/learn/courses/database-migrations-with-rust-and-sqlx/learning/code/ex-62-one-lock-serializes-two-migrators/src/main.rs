// Example 62: One Lock Serializes Two Migrators.
// the advisory lock orders the racers.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => one slow version both tasks run

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

#[tokio::main] // => the multi-thread runtime drives both racing tasks
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    let one = pool.clone(); // => each racer owns a pool handle to move
    let two = pool.clone(); // => handles share the same underlying pool
    let first = tokio::spawn(async move { MIGRATOR.run(&one).await }); // => racer one starts the slow migration
    let second = tokio::spawn(async move { MIGRATOR.run(&two).await }); // => racer two waits on the advisory lock
                                                                        // => racer one must report success
    match first.await {
        Ok(Ok(())) => {}                               // => the winner applied the version
        Ok(Err(e)) => panic!("racer one failed: {e}"), // => migration failure is a test bug
        Err(e) => panic!("racer one crashed: {e}"),    // => task crash is a test bug
    } // => match ends: racer one is classified
      // => racer two must report success
    match second.await {
        Ok(Ok(())) => {}                               // => the waiter found nothing pending
        Ok(Err(e)) => panic!("racer two failed: {e}"), // => migration failure is a test bug
        Err(e) => panic!("racer two crashed: {e}"),    // => task crash is a test bug
    } // => match ends: racer two is classified
    let row = sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations") // => the version the race recorded once
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => one version, however many racers
    println!("both migrators finished, versions: {n}"); // => serialization proven
    Ok(()) // => green run: the lock held
} // => main ends: the harness compares stdout to the golden file
