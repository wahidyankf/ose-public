// Example 63: Three Racers Still Apply Once.
// the lock serializes the whole crowd.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations"); // => one slow version three tasks run

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

#[tokio::main] // => the multi-thread runtime drives all three racing tasks
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    let mut racers = Vec::new(); // => one task per racer
    for _ in 0..3 {
        // => three racers share the slow version
        let handle = pool.clone(); // => each racer owns a pool handle to move
        racers.push(tokio::spawn(async move { MIGRATOR.run(&handle).await })); // => racers queue on the advisory lock
    } // => loop ends after spawning the crowd
    for racer in racers {
        // => every racer must report success
        // => waiting is not failing
        match racer.await {
            Ok(Ok(())) => {} // => the winner applied, the rest no-opped
            Ok(Err(e)) => panic!("racer failed: {e}"), // => migration failure is a test bug
            Err(e) => panic!("racer crashed: {e}"), // => task crash is a test bug
        } // => match ends: each racer is classified
    } // => loop ends after the last racer succeeds
    let row = sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations") // => the version the crowd recorded once
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => one version, however many racers
    println!("three racers finished, versions: {n}"); // => the crowd serialized
    Ok(()) // => green run: the lock scales
} // => main ends: the harness compares stdout to the golden file
