module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "cap_" [ "cap_customers"; "cap_orders"; "cap_lines" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_001_create_customers.sql",
                "CREATE TABLE cap_customers (id SERIAL PRIMARY KEY, name TEXT NOT NULL);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_002_create_orders.sql",
                "CREATE TABLE cap_orders (id SERIAL PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES cap_customers (id), status TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_003_create_lines.sql",
                "CREATE TABLE cap_lines (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES cap_orders (id), sku TEXT NOT NULL, qty INTEGER NOT NULL, price INTEGER NOT NULL);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true

    let upgrader4 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_004_seed.sql",
                "INSERT INTO cap_customers (name) VALUES ('ada'), ('grace'); INSERT INTO cap_orders (customer_id, status) VALUES (1, 'pending'), (2, 'paid'); INSERT INTO cap_lines (order_id, sku, qty, price) VALUES (1, 'book', 2, 10), (1, 'pen', 1, 10), (2, 'desk', 5, 10);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader4 = upgrader4.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader4.Successful // => Output: upgrade=true

    let upgrader5 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_005_backfill_totals.sql",
                "UPDATE cap_orders SET total = (SELECT sum(qty * price) FROM cap_lines WHERE order_id = cap_orders.id) WHERE total = 0;"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader5 = upgrader5.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader5.Successful // => Output: upgrade=true

    let upgrader6 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("cap_006_expand_status.sql", "ALTER TABLE cap_orders ADD COLUMN order_status TEXT;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader6 = upgrader6.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader6.Successful // => Output: upgrade=true

    let upgrader7 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_007_migrate_status.sql",
                "UPDATE cap_orders SET order_status = status WHERE order_status IS NULL;"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader7 = upgrader7.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader7.Successful // => Output: upgrade=true

    let upgrader8 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "cap_008_contract.sql",
                "ALTER TABLE cap_orders DROP COLUMN status; CREATE INDEX CONCURRENTLY cap_orders_customer_idx ON cap_orders (customer_id);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader8 = upgrader8.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader8.Successful // => Output: upgrade=true

    printfn
        "orders=%s"
        (System.String.Join(
            ";",
            column
                conn
                "SELECT c.name || ':' || o.total::text || ':' || o.order_status FROM cap_orders o JOIN cap_customers c ON c.id = o.customer_id ORDER BY o.id"
        )) // => Output: orders=ada:30:pending;grace:50:paid

    printfn "lines=%d" (scalar conn "SELECT count(*) FROM cap_lines") // => Output: lines=3
    printfn "applied=%d" (scalar conn "SELECT count(*) FROM schemaversions WHERE scriptname LIKE 'cap\_%'") // => Output: applied=8
    reset conn "cap_" [ "cap_customers"; "cap_orders"; "cap_lines" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
