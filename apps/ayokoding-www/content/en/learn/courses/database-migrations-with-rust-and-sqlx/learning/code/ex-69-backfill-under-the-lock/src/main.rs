// Example 69: Backfill Under the Lock.
// the waiter finds the work done.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => the slow backfill both tasks run

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
    let worker = pool.clone(); // => the worker owns a pool handle to move
    let waiter = pool.clone(); // => the waiter owns a pool handle to move
    let first = tokio::spawn(async move { MIGRATOR.run(&worker).await }); // => the worker starts the slow backfill
    let second = tokio::spawn(async move { MIGRATOR.run(&waiter).await }); // => the waiter blocks on the advisory lock
                                                                           // => the worker must report success
    match first.await {
        Ok(Ok(())) => {}                            // => the backfill applied exactly once
        Ok(Err(e)) => panic!("worker failed: {e}"), // => migration failure is a test bug
        Err(e) => panic!("worker crashed: {e}"),    // => task crash is a test bug
    } // => match ends: the worker is classified
      // => the waiter must report success
    match second.await {
        Ok(Ok(())) => {} // => the waiter found every version applied
        Ok(Err(e)) => panic!("waiter failed: {e}"), // => migration failure is a test bug
        Err(e) => panic!("waiter crashed: {e}"), // => task crash is a test bug
    } // => match ends: the waiter is classified
    let rows = sqlx::query("SELECT id, total FROM invoices ORDER BY id") // => the backfill, applied exactly once
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    for row in rows {
        // => walk every invoice in id order
        let id: i32 = row.get("id"); // => the seeded invoice number
        let total: i32 = row.get("total"); // => derived exactly once, never doubled
        println!("invoice {id} total {total}"); // => one backfilled row per line
    } // => loop ends after the last invoice
    Ok(()) // => green run: the lock prevented double work
} // => main ends: the harness compares stdout to the golden file
