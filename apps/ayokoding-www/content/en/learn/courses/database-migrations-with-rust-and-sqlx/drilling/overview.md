---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples teach the patterns; drilling makes them reflexes. Recall questions cover all sixteen concepts, applied problems replay the incidents, eight katas rebuild the hard parts by hand, and the checklist plus interrogation verify the habits stuck.

## Recall Q&A

Twenty-four questions, one per concept, with answers hidden in `<details>` blocks. Read the question, answer aloud, then open the block.

### co-01 migration-file

**Q1. What makes a file a migration, and what does sqlx require of its name?**

<details>
<summary>Answer</summary>

A versioned SQL file under `migrations/` whose name matches `<VERSION>_<DESCRIPTION>.sql` with a positive integer version. The number decides order; the description becomes the history text.

</details>

### co-02 up-and-down

**Q2. When does a down file run, and what does `undo(&pool, target)` do to versions above the target?**

<details>
<summary>Answer</summary>

A down file runs only through `undo`, which applies the down files of every applied version above the target in reverse order, then deletes those history rows.

</details>

### co-03 migration-history-table

**Q3. Which table records applied migrations, and what does each row carry?**

<details>
<summary>Answer</summary>

`_sqlx_migrations`, one row per applied version: version, description, installed_on, success, checksum, and execution_time.

</details>

### co-04 linear-vs-branching-history

**Q4. How do two branches avoid a version collision, and what happens when they fail?**

<details>
<summary>Answer</summary>

They claim disjoint version numbers or renumber before merging. Same-number-different-content fails the second run with a checksum mismatch naming the version.

</details>

### co-05 idempotent-migration

**Q5. What makes a migration safe to run twice, and which SQL patterns provide it?**

<details>
<summary>Answer</summary>

Running it twice changes nothing the second time. Patterns: `IF NOT EXISTS`, `WHERE`-guarded updates, and `ON CONFLICT DO NOTHING` inserts.

</details>

### co-06 backfill

**Q6. What is a backfill, and why does it ship as its own version?**

<details>
<summary>Answer</summary>

A data-only migration that derives new-column values from existing rows. Its own version keeps shape and content reviews separate and rerunnable.

</details>

### co-07 zero-downtime-migration

**Q7. What is the expand-contract order, and why must contraction come last?**

<details>
<summary>Answer</summary>

Add the new shape, copy data over, move readers, then drop the old shape. Contraction comes last because dropping early orphans readers still on the old shape.

</details>

### co-08 rollback

**Q8. What are the two rollback shapes in sqlx, and when does each apply?**

<details>
<summary>Answer</summary>

Undo via tested down files for reversible pairs, and forward-fix versions for one-way files. Undo reverts; forward fixes repair by moving ahead.

</details>

### co-09 schema-drift

**Q9. What is schema drift, and why can green reruns not detect it?**

<details>
<summary>Answer</summary>

Live schema diverging from versioned history through hand-run DDL. Checksums seal files, not schemas, so reruns pass while drift accumulates.

</details>

### co-10 baseline

**Q10. How do you adopt a legacy database without a baseline command?**

<details>
<summary>Answer</summary>

Write version 1 idempotently with `IF NOT EXISTS` so it succeeds on legacy tables and builds fresh ones; the recorded version becomes the floor.

</details>

### co-11 checksum-validation

**Q11. What does the checksum cover, and what error does an edited applied file produce?**

<details>
<summary>Answer</summary>

SHA-384 over the whole file, stored at apply time and rechecked every run. An edited applied file fails with a version-mismatch error naming the version.

</details>

### co-12 transaction-wrapped-migration

**Q12. What does the per-file transaction guarantee on PostgreSQL, and which marker opts out?**

<details>
<summary>Answer</summary>

Each file commits whole or rolls back whole, so failures leave no partial state. The `-- no-transaction` first line opts out for statements like `CREATE INDEX CONCURRENTLY`.

</details>

### co-13 environment-promotion

**Q13. How does the same version chain serve fresh clones and legacy bases alike?**

<details>
<summary>Answer</summary>

Idempotent first versions build empty databases and adopt legacy ones through the same files, so every environment converges on one recorded line.

</details>

### co-14 conflict-resolution

**Q14. What is the resolution when two branches need the same schema change?**

<details>
<summary>Answer</summary>

One branch keeps the version and merges; the other renumbers its work to the next free number and merges after. History stays a straight line.

</details>

### co-15 locking-migration

**Q15. What serializes concurrent migrators, and what must a failing run do with it?**

<details>
<summary>Answer</summary>

A session advisory lock taken per migrate run. Every exit path, including failures, must release it so repair runs proceed immediately.

</details>

### co-16 migration-testing

**Q16. What three checks close a migration diagnosis?**

<details>
<summary>Answer</summary>

Versions sequential with no gaps, recorded checksums matching embedded files, and zero pending versions. All three green means healthy.

</details>

### Cross-cutting recall

**Q17. Why must same-version files stay byte-identical across a unit's migration directories?**

<details>
<summary>Answer</summary>

Checksums cover whole files, so any byte difference trips a mismatch on the second run. Copies of one version must match exactly.

</details>

**Q18. Why do golden outputs never print timestamps, durations, or checksums?**

<details>
<summary>Answer</summary>

Those values vary per run, which breaks the double-run determinism check. Goldens print stable facts: versions, counts, flags, and row values.

</details>

**Q19. When is `set_ignore_missing(true)` the right call, and what is its risk?**

<details>
<summary>Answer</summary>

On the emergency path when the binary legitimately lacks an applied version, such as a rollback deploy. The risk is silently forgetting work that mattered.

</details>

**Q20. Why does the course query `to_regclass` instead of selecting from tables directly?**

<details>
<summary>Answer</summary>

Presence probes must work whether the table exists or not; selecting from a missing table errors, while `to_regclass` returns null for absence.

</details>

**Q21. What makes `undo(&pool, 0)` different from deleting history rows by hand?**

<details>
<summary>Answer</summary>

Undo runs the tested down files to reverse schema changes and then deletes the rows, keeping schema and record in agreement. Hand deletion orphans schema objects.

</details>

**Q22. Why do kata starters live in `before/` while the harness runs `after/`?**

<details>
<summary>Answer</summary>

Starters are intentionally imperfect exercises for the learner to fix. Only the `after/` solutions run green, so the harness builds those and the lessons anchor both.

</details>

**Q23. When should a migration use `-- no-transaction`, and what does it cost?**

<details>
<summary>Answer</summary>

For statements PostgreSQL forbids inside transactions, like `CREATE INDEX CONCURRENTLY`. The cost is isolation: a `CONCURRENTLY` build cannot share a file with other statements, because the driver sends each file as one batch. Failure still voids the whole file, so the signal stays error plus history gap.

</details>

**Q24. What single query best opens any migration incident?**

<details>
<summary>Answer</summary>

The full history dump ordered by version: versions, descriptions, and success flags. Recorded fact first, logs second.

</details>

## Applied problems

Eight realistic situations. Each states the symptom, the constraint, and what a good answer shows. Work them on paper before checking the course examples they point to.

### AP-1: The deploy ran migrations twice

**Symptom**: The pipeline retried the migrate step after a network blip. **Constraint**: No human may inspect the database between runs. **Good answer**: Names idempotence as the property that makes this safe, cites the history skip for applied versions, and shows the rerun report (see Examples 3 and 32).

### AP-2: Two teams both shipped version 7

**Symptom**: Friday's merge contains two different `0007` files. **Constraint**: Both changes must reach production. **Good answer**: Keeps one team's number, renumbers the other to the next free integer, and verifies both checksums apply cleanly (see Examples 54 and 55).

### AP-3: The new column blocks the deploy on nulls

**Symptom**: Adding `NOT NULL` fails on the staging copy of production. **Constraint**: Zero downtime, no data loss. **Good answer**: Splits the work into nullable column, backfill, then constraint across three versions, with a check query proving zero nulls before tightening (see Example 30).

### AP-4: The legacy database must join the chain

**Symptom**: A five-year-old database with hand-built tables needs versioning. **Constraint**: No dump-and-reload window exists. **Good answer**: Writes an idempotent version 1 with `IF NOT EXISTS`, adopts with the recorded floor, and validates embedded against applied (see Examples 45 and 50).

### AP-5: The rename must not break old readers

**Symptom**: The `name` column must become `full_name` while old binaries still run. **Constraint**: Rolling deploy, old and new code simultaneously live. **Good answer**: Expands with the new column, copies values, bridges with a view if needed, and contracts only after readers move (see Examples 37 and 42).

### AP-6: The migration failed halfway through a concurrent index

**Symptom**: A `CONCURRENTLY` build died mid-file, and the index is gone with no history row. **Constraint**: The next deploy must succeed without manual archaeology. **Good answer**: Reads the absent object plus the history gap as atomic failure, keeps `CONCURRENTLY` alone in its file, and reruns the fixed chain (see Examples 39 and 76).

### AP-7: Three instances migrate at once on every deploy

**Symptom**: The fleet starts together and every instance runs migrate. **Constraint**: Exactly-once application with no deploy coordination. **Good answer**: Relies on the advisory lock plus pending-set logic: one winner applies, the rest no-op, and the history proves it (see Examples 62 and 63).

### AP-8: Production has a column no version created

**Symptom**: The Friday incident added a column by console; Monday's audit finds it. **Constraint**: History must absorb reality without rewriting the past. **Good answer**: Reports live-minus-tracked as the drift, ships an absorbing version that documents the column, and schedules the drift check (see Examples 73 and 74).

## Code katas

Eight hands-on katas under `drilling/code/`. Each kata has a `before/` starter (intentionally imperfect — fix it) and an `after/` solution that runs green. The starter references the shared chain with `migrate!("../migrations")`, the same path the solution compiles. Run a kata with the command in its own `run.yaml`.

---

### Kata: Write a Migration and Its Rollback

Write the reversible pair for a `shelves` table, then prove the round trip: migrate up, undo to zero, and show both presence states.

- Starter: `drilling/code/kata-01-write-migration-and-rollback/before/main.rs`
- Solution: `drilling/code/kata-01-write-migration-and-rollback/after/src/main.rs`

**`drilling/code/kata-01-write-migration-and-rollback/before/main.rs`**:

```rust
// Kata 01 starter: the up file exists, the way back does not.
// TODO: add migrations/0001_create_shelves.down.sql that drops the table,
// then undo to 0 and print the presence before and after.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the up-only set under test

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
    MIGRATOR.run(&pool).await?; // => TODO: the table lands, but nothing reverses it yet
    println!("shelves after migrate: true"); // => TODO: probe the real table instead
    Ok(()) // => the kata is done when undo prints false
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-01-write-migration-and-rollback/after/src/main.rs`**:

```rust
// Kata 01 solution: the pair round-trips through undo.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the reversible pair at the kata root

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

async fn present(pool: &sqlx::PgPool, table: &str) -> Result<bool, sqlx::Error> {
    // => one probe for before and after
    let row = sqlx::query("SELECT to_regclass($1) IS NOT NULL AS present") // => NULL means the table is gone
        .bind(format!("public.{table}")) // => schema-qualify so the lookup is exact
        .fetch_one(pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    Ok(row.get("present")) // => hand the flag to the caller
} // => helper ends: presence checks stay in one place

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
                 // => the pair must survive the round trip
    MIGRATOR.run(&pool).await?; // => the up file creates the table
    println!(
        "shelves after migrate: {}",
        present(&pool, "shelves").await?
    ); // => the up file landed
    MIGRATOR.undo(&pool, 0).await?; // => the down file drops it and forgets the version
    println!("shelves after undo: {}", present(&pool, "shelves").await?); // => the round trip is proven
    Ok(()) // => green kata: reversible pairs round-trip
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-01-write-migration-and-rollback/migrations/0001_create_shelves.down.sql`**:

```sql
-- 0001 down: undo drops exactly what the up created. -- => the reverse half of the pair
DROP TABLE shelves; -- => undo runs this file, then forgets version 1
```

**`drilling/code/kata-01-write-migration-and-rollback/migrations/0001_create_shelves.up.sql`**:

```sql
-- 0001 up: shelves arrive with a label. -- => the forward half of the pair
CREATE TABLE shelves ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every shelf must be labeled
); -- => the definition closes here
```

**Output** (`drilling/code/kata-01-write-migration-and-rollback/expected/main.stdout.txt`):

```text
shelves after migrate: true
shelves after undo: false
```

---

### Kata: Add a Backfill Step to an Existing Migration

A `qty` column ships empty on live rows; add the guarded backfill that fills it, then prove zero nulls remain.

- Starter: `drilling/code/kata-02-add-backfill-step/before/main.rs`
- Solution: `drilling/code/kata-02-add-backfill-step/after/src/main.rs`

**`drilling/code/kata-02-add-backfill-step/before/main.rs`**:

```rust
// Kata 02 starter: the column exists, the values do not.
// TODO: add migrations/0003_backfill_qty.sql with a WHERE-guarded update,
// then count the nulls that remain.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => schema and seed, no backfill yet

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
    MIGRATOR.run(&pool).await?; // => TODO: schema and seed only, qty stays null
    println!("null qtys: many"); // => TODO: count the real nulls instead
    Ok(()) // => the kata is done when the count prints 0
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-02-add-backfill-step/after/src/main.rs`**:

```rust
// Kata 02 solution: the guarded backfill empties every null.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => schema, seed, and backfill

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
    MIGRATOR.run(&pool).await?; // => create, seed, add the column, fill it
    let row = sqlx::query("SELECT COUNT(*) AS n FROM items WHERE qty IS NULL") // => rows the backfill missed
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => zero after the guarded update
    println!("null qtys: {n}"); // => the backfill certificate
    Ok(()) // => green kata: backfills empty every null
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-02-add-backfill-step/migrations/0001_create_items.sql`**:

```sql
-- 0001: items start quantity-less. -- => the column the backfill fills
CREATE TABLE items ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => every item must be named
    qty INTEGER -- => NULL until the backfill derives values
); -- => the definition closes here
```

**`drilling/code/kata-02-add-backfill-step/migrations/0002_seed_items.sql`**:

```sql
-- 0002: two quantity-less rows. -- => the rows the backfill must cover
INSERT INTO items (name) -- => quantities unknown at seed time
    VALUES ('pen'), -- => item 1
    ('ink'); -- => item 2
```

**`drilling/code/kata-02-add-backfill-step/migrations/0003_backfill_qty.sql`**:

```sql
-- 0003: fill every missing quantity. -- => guarded, rerunnable, complete
UPDATE items -- => only the still-missing rows change
    SET qty = 1 WHERE qty IS NULL; -- => the guard is the idempotence
```

**Output** (`drilling/code/kata-02-add-backfill-step/expected/main.stdout.txt`):

```text
null qtys: 0
```

---

### Kata: Baseline an Existing Database Without Losing Data

Adopt a legacy `stock` table with two rows using an idempotent first version, then prove both rows and the recorded version survived.

- Starter: `drilling/code/kata-03-baseline-existing-database/before/main.rs`
- Solution: `drilling/code/kata-03-baseline-existing-database/after/src/main.rs`

**`drilling/code/kata-03-baseline-existing-database/before/main.rs`**:

```rust
// Kata 03 starter: the plain create fails on legacy bases.
// TODO: make migrations/0001 idempotent with IF NOT EXISTS,
// pre-create the legacy table in main, and prove the rows survive.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the brittle first version

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
    MIGRATOR.run(&pool).await?; // => TODO: fails where the legacy table already lives
    println!("legacy rows kept: unknown"); // => TODO: count the real rows instead
    Ok(()) // => the kata is done when adoption prints 2 and 1
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-03-baseline-existing-database/after/src/main.rs`**:

```rust
// Kata 03 solution: the idempotent version adopts the legacy base.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the idempotent baseline version

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
    sqlx::query("CREATE TABLE legacy_stock (id SERIAL PRIMARY KEY, sku TEXT NOT NULL)") // => the table the legacy base holds
        .execute(&pool) // => raw SQL builds the pre-migration state
        .await?; // => ? bubbles a setup failure instead of panicking
    sqlx::query("INSERT INTO legacy_stock (sku) VALUES ('a'), ('b')") // => two legacy rows to preserve
        .execute(&pool) // => seed the legacy state directly
        .await?; // => ? bubbles a setup failure instead of panicking
    MIGRATOR.run(&pool).await?; // => the idempotent version adopts without error
    let row = sqlx::query("SELECT COUNT(*) AS n FROM legacy_stock") // => the rows adoption must keep
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => two legacy rows, untouched
    println!("legacy rows kept: {n}"); // => the adoption proof
    let row = sqlx::query("SELECT version FROM _sqlx_migrations") // => the recorded floor
        .fetch_one(&pool) // => exactly one history row exists
        .await?; // => ? bubbles a query failure instead of panicking
    let version: i64 = row.get("version"); // => version 1 recorded
    println!("baseline version: {version}"); // => the floor the chain builds on
    Ok(()) // => green kata: adoption preserves everything
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-03-baseline-existing-database/migrations/0001_create_legacy_stock.sql`**:

```sql
-- 0001: idempotent so legacy bases adopt it. -- => the tolerant first version
CREATE TABLE IF NOT EXISTS legacy_stock ( -- => succeeds whether the table exists or not
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    sku TEXT NOT NULL -- => seeded skus stay exactly as seeded
); -- => the definition closes here
```

**Output** (`drilling/code/kata-03-baseline-existing-database/expected/main.stdout.txt`):

```text
legacy rows kept: 2
baseline version: 1
```

---

### Kata: Resolve an Order Conflict

Two branches claim version 1; renumber the loser forward and prove the merged line reads 1, 2.

- Starter: `drilling/code/kata-04-resolve-order-conflict/before/main.rs`
- Solution: `drilling/code/kata-04-resolve-order-conflict/after/src/main.rs`

**`drilling/code/kata-04-resolve-order-conflict/before/main.rs`**:

```rust
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
```

**`drilling/code/kata-04-resolve-order-conflict/after/src/main.rs`**:

```rust
// Kata 04 solution: the loser renumbers forward and merges.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static WINNER: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => team A keeps version 1
static LOSER: sqlx::migrate::Migrator = sqlx::migrate!("../branch"); // => team B collides on version 1
static MERGED: sqlx::migrate::Migrator = sqlx::migrate!("../fixed"); // => team B renumbered to version 2

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
    WINNER.run(&pool).await?; // => team A lands version 1
                              // => team B collides on the same number
    match LOSER.run(&pool).await {
        Err(MigrateError::VersionMismatch(_)) => {
            // => the collision trips the seal
            println!("branch run failed as expected"); // => the conflict, classified
        } // => match arm ends: the collision is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("colliding branch should not apply"), // => silent success would corrupt history
    } // => match ends: every outcome is classified
    MERGED.run(&pool).await?; // => the renumbered loser merges cleanly
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the merged line
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 2 on record
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("merged versions: {line}"); // => the merge, proven
    Ok(()) // => green kata: renumbering heals conflicts
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/0001_create_teams.sql`**:

```sql
-- 0001: teams anchor the merge. -- => applies once, skips on re-runs
CREATE TABLE teams ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every team must be named
); -- => the definition closes here
```

**`drilling/code/kata-04-resolve-order-conflict/branch/0001_create_squads.sql`**:

```sql
-- 0001 team B: squads collide on version 1. -- => same number, different table
CREATE TABLE squads ( -- => the colliding claim
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every squad must be named
); -- => the definition closes here
```

**`drilling/code/kata-04-resolve-order-conflict/fixed/0001_create_teams.sql`**:

```sql
-- 0001: teams anchor the merge. -- => applies once, skips on re-runs
CREATE TABLE teams ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every team must be named
); -- => the definition closes here
```

**`drilling/code/kata-04-resolve-order-conflict/fixed/0002_create_squads.sql`**:

```sql
-- 0002 team B renumbered: squads merge cleanly. -- => the next free number
CREATE TABLE squads ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every squad must be named
); -- => the definition closes here
```

**Output** (`drilling/code/kata-04-resolve-order-conflict/expected/main.stdout.txt`):

```text
branch run failed as expected
merged versions: 1 2
```

---

### Kata: Diagnose a Partial Migration

A non-transactional file fails atomically: nothing strands, history stays empty. Probe the absent table, confirm the empty history, and name both facts.

- Starter: `drilling/code/kata-05-diagnose-partial-migration/before/main.rs`
- Solution: `drilling/code/kata-05-diagnose-partial-migration/after/src/main.rs`

**`drilling/code/kata-05-diagnose-partial-migration/before/main.rs`**:

```rust
// Kata 05 starter: the file fails, the state confuses.
// TODO: run the doomed file, catch the version error, then probe
// the absent table and the empty history separately.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the doomed non-transactional file

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
    MIGRATOR.run(&pool).await?; // => TODO: this fails; catch it and diagnose instead
    println!("stray present: unknown"); // => TODO: probe the real table instead
    Ok(()) // => the kata is done when absence prints false and 0
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-05-diagnose-partial-migration/after/src/main.rs`**:

```rust
// Kata 05 solution: absence of state is two probes, not a mystery.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the doomed non-transactional file

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
                 // => the file fails atomically: nothing strands
    match MIGRATOR.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 1)) => {
            // => the failure names version 1
            println!("doomed run failed on version 1 as expected"); // => the failure, classified
        } // => match arm ends: the failure is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("doomed file should not apply"),  // => silent success would hide the bug
    } // => match ends: every outcome is classified
    let row = sqlx::query("SELECT to_regclass('public.stray') IS NOT NULL AS present") // => the object that never stranded
        .fetch_one(&pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let present: bool = row.get("present"); // => false: nothing survived the file
    println!("stray table present: {present}"); // => absence is the diagnosis
    let row = sqlx::query("SELECT COUNT(*) AS n FROM _sqlx_migrations") // => the history the failure skipped
        .fetch_one(&pool) // => exactly one count row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let n: i64 = row.get("n"); // => zero: nothing was recorded
    println!("versions recorded: {n}"); // => the missing record
    Ok(()) // => green kata: absence is diagnosable
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-05-diagnose-partial-migration/migrations/0001_doomed_build.sql`**:

```sql
-- no-transaction
-- 0001 doomed: creates, then fails, atomically. -- => the failure under diagnosis
CREATE TABLE stray ( -- => atomic with the file despite no-transaction
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the column the probe will not find
); -- => the definition closes here
SELECT not_a_function(); -- => the failure that voids the whole file
```

**Output** (`drilling/code/kata-05-diagnose-partial-migration/expected/main.stdout.txt`):

```text
doomed run failed on version 1 as expected
stray table present: false
versions recorded: 0
```

---

### Kata: Split a Table Without Downtime

Move `bio` out of `authors` into a new `profiles` table with a copy, then prove the join preserves every value.

- Starter: `drilling/code/kata-06-split-zero-downtime/before/main.rs`
- Solution: `drilling/code/kata-06-split-zero-downtime/after/src/main.rs`

**`drilling/code/kata-06-split-zero-downtime/before/main.rs`**:

```rust
// Kata 06 starter: the split drops first and loses data.
// TODO: expand with the new table, copy the bios over, and prove
// the join before dropping anything.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the careful split, not the hasty one

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
    MIGRATOR.run(&pool).await?; // => TODO: then join and prove nothing was lost
    println!("ada wrote unknown"); // => TODO: print the real joined rows instead
    Ok(()) // => the kata is done when the join proves the split
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-06-split-zero-downtime/after/src/main.rs`**:

```rust
// Kata 06 solution: the join proves the split lost nothing.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the expand-and-copy split

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
    MIGRATOR.run(&pool).await?; // => seed, expand with profiles, copy the bios over
    let rows = sqlx::query(
        "SELECT a.name, p.bio FROM authors a JOIN profiles p ON p.author_id = a.id ORDER BY a.id",
    ) // => the split, rejoined
    .fetch_all(&pool) // => run the read against the same pool
    .await?; // => ? bubbles a query failure instead of panicking
    for row in rows {
        // => walk every author in id order
        let name: String = row.get("name"); // => the column that stayed
        let bio: String = row.get("bio"); // => the column that moved
        println!("{name} wrote {bio}"); // => one preserved pair per line
    } // => loop ends after the last author
    Ok(()) // => green kata: splits preserve everything
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-06-split-zero-downtime/migrations/0001_create_authors.sql`**:

```sql
-- 0001: authors start wide. -- => bio lives here until the split
CREATE TABLE authors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => the column that stays
    bio TEXT NOT NULL -- => the column the split moves out
); -- => the definition closes here
```

**`drilling/code/kata-06-split-zero-downtime/migrations/0002_seed_authors.sql`**:

```sql
-- 0002: two wide rows. -- => the values the split must preserve
INSERT INTO authors (name, bio) -- => the legacy shape, populated
    VALUES ('ada', 'analyst'), -- => author 1
    ('grace', 'admiral'); -- => author 2
```

**`drilling/code/kata-06-split-zero-downtime/migrations/0003_create_profiles.sql`**:

```sql
-- 0003: profiles take the bios. -- => the new home fills before any drop
CREATE TABLE profiles ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    author_id INTEGER NOT NULL UNIQUE REFERENCES authors (id), -- => one profile per author
    bio TEXT NOT NULL -- => the moved column finds its new home
); -- => the definition closes here
```

**`drilling/code/kata-06-split-zero-downtime/migrations/0004_copy_bios.sql`**:

```sql
-- 0004: twin every bio. -- => the data side of the split
INSERT INTO profiles (author_id, bio) -- => one profile per existing author
    SELECT id, bio FROM authors; -- => the copy, derived from live rows
```

**Output** (`drilling/code/kata-06-split-zero-downtime/expected/main.stdout.txt`):

```text
ada wrote analyst
grace wrote admiral
```

---

### Kata: Build a Validate Gate

Wrap the migrate in validation before and after, and print the false-then-true verdict that proves the gate works.

- Starter: `drilling/code/kata-07-validate-gate/before/main.rs`
- Solution: `drilling/code/kata-07-validate-gate/after/src/main.rs`

**`drilling/code/kata-07-validate-gate/before/main.rs`**:

```rust
// Kata 07 starter: the migrate runs blind.
// TODO: add a valid() helper comparing embedded against recorded,
// treating a missing history table as not-yet-migrated,
// print it before and after the run.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the chain the gate will check

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
    MIGRATOR.run(&pool).await?; // => TODO: gate this run before and after
    println!("valid: unknown"); // => TODO: print the real gate verdicts instead
    Ok(()) // => the kata is done when the gate prints false then true
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-07-validate-gate/after/src/main.rs`**:

```rust
// Kata 07 solution: the gate answers before and after.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => the chain the gate checks

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

async fn valid(pool: &sqlx::PgPool) -> Result<bool, sqlx::Error> {
    // => the gate both phases share
    let mut embedded: Vec<i64> = MIGRATOR.iter().map(|m| m.version).collect(); // => every version compiled into the binary
    embedded.sort_unstable(); // => order the embedded set for comparison
    let row = sqlx::query("SELECT to_regclass('public._sqlx_migrations') IS NOT NULL AS present") // => the history table may not exist yet
        .fetch_one(pool) // => a single flag row comes back
        .await?; // => ? bubbles a query failure instead of panicking
    let present: bool = row.get("present"); // => false on the empty base
    if !present {
        // => no history table means nothing recorded
        return Ok(false); // => the gate answers false before the first run
    } // => early return ends the missing-table case
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations") // => every version recorded in the database
        .fetch_all(pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let mut applied: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => the recorded set
    applied.sort_unstable(); // => order the recorded set for comparison
    Ok(!embedded.is_empty() && embedded == applied) // => agreement means the base is fully migrated
} // => helper ends: the gate answers one boolean

#[tokio::main] // => the async runtime drives the pool and the queries
               // => main returns the database error so failures print it
async fn main() -> Result<(), sqlx::Error> {
    let pool = sqlx::postgres::PgPoolOptions::new() // => start from the default pool options
        .max_connections(5) // => five connections: migrate plus a few readers
        .connect(&db_url()) // => connect to the per-run service database
        .await?; // => ? bubbles a connection failure instead of panicking
    println!("valid before migrate: {}", valid(&pool).await?); // => the pre-check on the empty base
    MIGRATOR.run(&pool).await?; // => the gated run applies the version
    println!("valid after migrate: {}", valid(&pool).await?); // => the post-check on the managed base
    Ok(()) // => green kata: gates prove runs
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-07-validate-gate/migrations/0001_create_beacons.sql`**:

```sql
-- 0001: beacons anchor the gate. -- => the version the gate checks
CREATE TABLE beacons ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every beacon must be named
); -- => the definition closes here
```

**Output** (`drilling/code/kata-07-validate-gate/expected/main.stdout.txt`):

```text
valid before migrate: false
valid after migrate: true
```

---

### Kata: Repair a Failed Migration

A broken version 2 fails cleanly with nothing recorded but keeps its session lock; release the lock, retry the same number with fixed bytes, and print the healed line.

- Starter: `drilling/code/kata-08-repair-failed/before/main.rs`
- Solution: `drilling/code/kata-08-repair-failed/after/src/main.rs`

**`drilling/code/kata-08-repair-failed/before/main.rs`**:

```rust
// Kata 08 starter: the failure crashes instead of teaching.
// TODO: match the ExecuteMigration error, release the session lock,
// then run the fixed set and print the healed version line.
use sqlx::Row; // => Row unlocks column reads by name on every result row

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => version 2 carries the invalid type

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
    MIGRATOR.run(&pool).await?; // => TODO: this fails; classify it and repair instead
    println!("healed versions: none"); // => TODO: print the real healed line instead
    Ok(()) // => the kata is done when repair prints 1 2
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-08-repair-failed/after/src/main.rs`**:

```rust
// Kata 08 solution: classify the failure, retry the number fixed.
use sqlx::migrate::MigrateError;
use sqlx::Row; // => the error enum names every failure mode // => Row unlocks column reads by name on every result row

static BROKEN: sqlx::migrate::Migrator = sqlx::migrate!("../migrations"); // => version 2 carries the invalid type
static FIXED: sqlx::migrate::Migrator = sqlx::migrate!("../fixed"); // => version 2 corrected, still free

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
                 // => version 1 applies, version 2 fails
    match BROKEN.run(&pool).await {
        Err(MigrateError::ExecuteMigration(_, 2)) => {
            // => the failure names version 2
            println!("broken run failed on version 2 as expected"); // => the failure, classified
        } // => match arm ends: the failure is evidence, not a crash
        Err(other) => panic!("unexpected error: {other}"), // => any other failure is a test bug
        Ok(()) => panic!("broken version should not apply"), // => silent success would hide the bug
    } // => match ends: every outcome is classified
    sqlx::query("SELECT pg_advisory_unlock_all()")
        .execute(&pool)
        .await?; // => the broken run keeps the lock: release it here
    FIXED.run(&pool).await?; // => the same number retries with fixed bytes
    let rows = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version") // => the healed line
        .fetch_all(&pool) // => run the read against the same pool
        .await?; // => ? bubbles a query failure instead of panicking
    let versions: Vec<i64> = rows.iter().map(|row| row.get("version")).collect(); // => versions 1 and 2 on record
    let line = versions // => collect the report line first so the print stays short
        .iter() // => walk each element in turn
        .map(i64::to_string) // => render each version as text
        .collect::<Vec<_>>() // => gather into a printable list
        .join(" "); // => space the versions for one line
    println!("healed versions: {line}"); // => the repair, recorded
    Ok(()) // => green kata: failed numbers retry fixed
} // => main ends: the harness compares stdout to the golden file
```

**`drilling/code/kata-08-repair-failed/migrations/0001_create_docks.sql`**:

```sql
-- 0001: docks are the good version. -- => applies once, skips on re-runs
CREATE TABLE docks ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every dock must be labeled
); -- => the definition closes here
```

**`drilling/code/kata-08-repair-failed/migrations/0002_broken_type.sql`**:

```sql
-- 0002 broken: an invalid type fails the file. -- => nothing recorded, so retry stays clean
CREATE TABLE broken ( -- => this statement never commits
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    amount NOT_A_TYPE -- => unknown types fail at parse time
); -- => the definition closes here
```

**`drilling/code/kata-08-repair-failed/fixed/0001_create_docks.sql`**:

```sql
-- 0001: docks are the good version. -- => applies once, skips on re-runs
CREATE TABLE docks ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every dock must be labeled
); -- => the definition closes here
```

**`drilling/code/kata-08-repair-failed/fixed/0002_create_berths.sql`**:

```sql
-- 0002 fixed: berths belong to docks. -- => corrected content, still the free number
CREATE TABLE berths ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    dock_id INTEGER NOT NULL REFERENCES docks (id), -- => every berth sits at a dock
    label TEXT NOT NULL -- => every berth must be labeled
); -- => the definition closes here
```

**Output** (`drilling/code/kata-08-repair-failed/expected/main.stdout.txt`):

```text
broken run failed on version 2 as expected
healed versions: 1 2
```

---

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check an item only when you have done it in a real database.

- [ ] I can write a versioned migration file that sqlx resolves and applies in order (co-01).
- [ ] I can pair an up file with a down file and reverse it with `undo` to a chosen target (co-02).
- [ ] I can read `_sqlx_migrations` and state exactly what ran, in which order, with which outcome (co-03).
- [ ] I can merge two branches' version lines without collisions by renumbering forward (co-04).
- [ ] I can write a migration that reruns safely using `IF NOT EXISTS` or guarded writes (co-05).
- [ ] I can backfill a new column from existing rows and prove zero nulls remain (co-06).
- [ ] I can split a breaking change into expand, copy, move-readers, and contract versions (co-07).
- [ ] I can roll back with a down file or a forward fix and keep history truthful either way (co-08).
- [ ] I can detect schema drift with a live-minus-tracked check query (co-09).
- [ ] I can baseline a legacy database with an idempotent version 1 and validate the adoption (co-10).
- [ ] I can explain what the checksum covers and what error an edited file produces (co-11).
- [ ] I can state the per-file transaction guarantee and mark the files that opt out (co-12).
- [ ] I can promote one chain across fresh and legacy environments and prove both converge (co-13).
- [ ] I can resolve a same-number conflict so both branches' work survives (co-14).
- [ ] I can reason about the advisory lock: who holds it, who waits, and who frees it (co-15).
- [ ] I can close a diagnosis with the gap, seal, and pending checks all green (co-16).
- [ ] I can keep same-version files byte-identical across a unit's migration directories.
- [ ] I can write golden outputs using only stable facts, never timestamps or durations.
- [ ] I can choose `set_ignore_missing` deliberately and state its risk aloud.
- [ ] I can probe table presence with `to_regclass` without erroring on absence.
- [ ] I can repair a clean failure by fixing the file and rerunning, with no cleanup step.
- [ ] I can build a concurrent index without blocking writers using the opt-out marker.
- [ ] I can run two migrators concurrently and predict the serialized outcome.
- [ ] I can open any migration incident with the history dump before touching logs.

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Explain each aloud before reading.

### EI-1: Why does sqlx record checksums per row instead of one hash for the whole chain?

**Rejected alternative**: A single chain hash stored once per database.

**Model answer**: Per-row seals name the exact tampered version, while a chain hash only says something changed somewhere. Granular seals turn validation failures into single-file reviews instead of schema-wide audits. Precision in failure attribution is worth the few bytes per row.

### EI-2: Why must the advisory lock release on failure paths, not just success?

**Rejected alternative**: Hold the lock until an operator clears it, to force human review of failures.

**Model answer**: Forced review via wedged coordination punishes the whole fleet for one bad version and turns every failure into an outage. Automatic release keeps repair runs immediate; review happens in the history and the fix, not in lock archaeology. Coordination must heal itself.

### EI-3: Why not edit an applied migration and rerun instead of writing a forward fix?

**Rejected alternative**: Fix the file in place; the database already matches except the edited lines.

**Model answer**: Environments that applied the old bytes keep the old checksum while the file carries a new one, so the next run fails everywhere at once. Forward fixes apply cleanly on all databases including the ones that saw the mistake. History must be append-only to stay shared.

### EI-4: Why do backfills deserve their own versions instead of riding inside schema files?

**Rejected alternative**: Combine each backfill with the schema change it serves to halve the version count.

**Model answer**: Combined files mix shape and content reviews, cannot be retried independently, and hide data work inside schema diffs. Separate versions keep each review focused, each rerun safe, and the version line honest about what changed. Version count is cheap; confused reviews are expensive.

### EI-5: Why does the course forbid timestamps and durations in golden outputs?

**Rejected alternative**: Record full rows including `installed_on` and `execution_time` for completeness.

**Model answer**: Goldens must match on every double run, and time values never repeat. Stable-fact outputs keep the determinism check meaningful instead of flaky. Completeness that breaks the check is not completeness but noise.

### EI-6: Why emulate baselines with idempotent files instead of a dedicated baseline command?

**Rejected alternative**: Add a baseline verb that stamps versions as applied without running them.

**Model answer**: Stamping without running creates recorded-but-never-executed history, which no fresh database can reproduce from the same chain. Idempotent files run truly everywhere, so legacy and fresh bases converge on one honest line. A chain every environment executes beats a stamp only some environments honor.
