---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Database Migrations with Kotlin and Flyway: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): What does the version number in `V2__add_email.sql` decide?

<details><summary>Answer</summary>

The apply order: Flyway runs versioned files numerically, so `V2` always applies after `V1` regardless of arrival order, as in Examples 5 and 10.

</details>

### Q2 (co-02): How do you roll back a migration in Flyway's open-source edition?

<details><summary>Answer</summary>

With a new compensating migration that reverses the change — `V3` dropping the column `V2` added — because there is no undo command, as in Example 18.

</details>

### Q3 (co-02): When does a restore need a default value?

<details><summary>Answer</summary>

When re-adding a dropped column to a table that still holds rows: the default gives surviving rows a chosen value instead of a null, as in Example 19.

</details>

### Q4 (co-03): What does `flyway_schema_history` record per migration?

<details><summary>Answer</summary>

Version, description, type, checksum, and success flag in installation-rank order — the database's own memory of what ran, as in Examples 4 and 9.

</details>

### Q5 (co-03): How do you prove two environments ran the same migrations?

<details><summary>Answer</summary>

Dump version and success ordered by `installed_rank` on both and compare: any difference names the exact migration to investigate, as in Example 9.

</details>

### Q6 (co-04): How does Flyway treat a missing version number in the middle?

<details><summary>Answer</summary>

It applies what exists: `V1` followed by `V4` runs fine, as in Example 12. Gaps record renames, not failures.

</details>

### Q7 (co-04): What happens to a late `V2` when `V1` and `V3` already applied?

<details><summary>Answer</summary>

It fails validation by default and applies only with `outOfOrder(true)`, making disorder an explicit team decision, as in Example 11.

</details>

### Q8 (co-05): What makes a backfill safe to run twice?

<details><summary>Answer</summary>

A guarding `WHERE` clause — `UPDATE ... WHERE tier IS NULL` — so reruns find no work, as in Example 32. History gives the second safety net.

</details>

### Q9 (co-06): When does a migration need a backfill step?

<details><summary>Answer</summary>

Whenever a schema change must preserve or derive row data: a new column on a populated table, a split, or a lookup seed — not for empty structural changes, as in Examples 26 to 34.

</details>

### Q10 (co-06): Why split big backfills into batches?

<details><summary>Answer</summary>

Each statement then locks briefly and commits, bounding the blast radius on live tables, as in Example 28.

</details>

### Q11 (co-07): What are the three phases of a zero-downtime change?

<details><summary>Answer</summary>

Expand (add beside the old), migrate readers (serve both), contract (drop the old last), as in Examples 35 to 44.

</details>

### Q12 (co-07): When is it safe to drop the old column?

<details><summary>Answer</summary>

Only after every reader moved to the new one — release notes and monitoring guard the timing, as in Example 38.

</details>

### Q13 (co-08): What does `repair()` do and not do?

<details><summary>Answer</summary>

It clears recorded failure state without rerunning anything; the corrected file applies on the next migrate, as in Example 23.

</details>

### Q14 (co-08): What belongs in a rollback release?

<details><summary>Answer</summary>

The next version: corrections to rows first, then to defaults and constraints, tested before it is needed, as in Example 24.

</details>

### Q15 (co-09): Where does migration diagnosis start?

<details><summary>Answer</summary>

At the history table: version, description, type, and success per row, before any log, as in Example 71.

</details>

### Q16 (co-09): Why can `validate()` pass on a drifted schema?

<details><summary>Answer</summary>

It compares files to history, not the schema to the files — a hand-added column is invisible to it, as in Example 73. Metadata checks catch drift.

</details>

### Q17 (co-10): What does `baseline()` record?

<details><summary>Answer</summary>

A `BASELINE` history row stamping the pre-existing schema at a version, so new migrations apply on top, as in Example 45.

</details>

### Q18 (co-10): When should `baselineOnMigrate` be enabled?

<details><summary>Answer</summary>

When one configuration must serve empty clones and legacy imports alike: empty schemas migrate normally, non-empty ones stamp first, as in Example 47.

</details>

### Q19 (co-11): What does a failing `validate()` prove?

<details><summary>Answer</summary>

That files and history disagree: an edited or conflicting migration exists, as in Examples 13 and 54. Deleted files escape default validation, as Example 77 shows.

</details>

### Q20 (co-12): Why is each PostgreSQL migration atomic?

<details><summary>Answer</summary>

Flyway wraps it in one transaction and PostgreSQL runs DDL transactionally, so a failing statement voids the whole file, as in Example 21.

</details>

### Q21 (co-13): What three steps repeat on every environment promotion?

<details><summary>Answer</summary>

Validate, migrate, validate again — identical gates everywhere, as in Examples 15 and 53.

</details>

### Q22 (co-14): How do you resolve two branches writing the same version?

<details><summary>Answer</summary>

Renumber the losing change forward to the next version; never edit applied files, as in Example 55.

</details>

### Q23 (co-15): How does Flyway serialize concurrent migrates?

<details><summary>Answer</summary>

On the history lock: one winner applies the pending set, losers find no work, and totals never exceed the file count, as in Examples 62 and 63.

</details>

### Q24 (co-16): What assertion belongs with every backfill?

<details><summary>Answer</summary>

A leftover count the migration must drive to zero — `unfilled=0` — as in Example 34.

</details>

## Applied problems

At least 8 scenario problems. Work each on paper or in a scratch database before reading the sketch.

### AP1: Split a breaking column rename into zero-downtime steps

Ship `V1` adding `full_name` plus backfill, keep `name` serving; a release later ship `V2` dropping `name` after readers move (Examples 37–38). Never rename in place on a live table.

_Applied: expand-migrate-contract keeps every intermediate deploy safe._

### AP2: Resolve a migration-order conflict between two branches

Both branches wrote `V2`: validate the rival set to surface the checksum failure, then merge with the losing change renumbered to `V3` and migrate (Examples 54–55).

_Applied: renumber-forward merges without rewriting history._

### AP3: Diagnose a partially applied migration from the history table

Name the missing version against the directory, count the ghost objects to confirm atomicity held, fix the file, repair, rerun, validate green (Examples 72, 75-76).

_Applied: history-first runbooks end in passing validation._

### AP4: Size a backfill for a ten-million-row table

Batch by key ranges with disjoint `WHERE` clauses, guard with null checks for rerun safety, and assert a zero leftover count (Examples 28, 32, 34).

_Applied: bounded locks plus rerun guards scale backfills safely._

### AP5: Import a legacy database under Flyway control

Pre-existing schema stays untouched; `baseline()` with a documented description stamps it, then versioned migrations extend it and `validate()` proves coherence (Examples 45, 48, 50).

_Applied: stamped imports replay identically on every environment._

### AP6: Gate a release on migration validation

Run `validate()`, list `info().pending()`, require review for non-empty lists, then migrate and confirm history counts (Examples 58, 61).

_Applied: explicit gates stop unreviewed migrations riding with code._

### AP7: Prove parallel deploys cannot double-apply

Race two migrators at the same set, sum the applied counts, and read the ledger: totals equal the file count every run (Examples 62, 70).

_Applied: lock-serialized totals turn parallel-deploy fear into evidence._

### AP8: Detect schema drift on a schedule

Compare `information_schema` columns against the migrations' promise and report unexpected names; remember `validate()` alone cannot see drift (Examples 73–74).

_Applied: scheduled metadata checks catch hand changes before incidents do._

## Code katas

Eight hands-on katas under `drilling/code/`. Each kata has a `before/` starter (intentionally imperfect — fix it) and an `after/` solution that runs green. Run a kata with the command in its own `run.yaml`.

### Kata: Write a Migration and Its Rollback

Write `V1` creating a `shelves` table, `V2` adding a `location` column, and `V3` dropping it again as the compensating rollback. Print the final columns and the history.

- Starter: `drilling/code/kata-01-write-migration-and-rollback/before/Starter.kt`
- Solution: `drilling/code/kata-01-write-migration-and-rollback/after/Solution.kt`

**`drilling/code/kata-01-write-migration-and-rollback/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Write `V1` creating a `shelves` table, `V2` adding a `location` column, and `V3` dropping it again as the compensating rollback. Print the final columns and the history.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Write `V1` creating a `shelves` table, `V2` adding a `location` column, and `V3` dropping it again as the compensating rollback. Print the final columns and the history.
```

**`drilling/code/kata-01-write-migration-and-rollback/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-01-write-migration-and-rollback.
// Write `V1` creating a `shelves` table, `V2` adding a `location` column, and `V3` dropping it again as the compensating rollback. Print the final columns and the history.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the column query
            st.executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'shelves' ORDER BY ordinal_position").use { rs -> // => location must be gone
                while (rs.next()) { // => walk the surviving columns
                    println(rs.getString(1)) // => id and label only
                } // => loop ends after the last column
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-01-write-migration-and-rollback/migrations/V1__create_shelves.sql`**:

```sql
-- V1: shelves start with a label.
CREATE TABLE shelves (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL
);
```

**`drilling/code/kata-01-write-migration-and-rollback/migrations/V2__add_location.sql`**:

```sql
-- V2: the change to roll back.
ALTER TABLE shelves ADD COLUMN location TEXT;
```

**`drilling/code/kata-01-write-migration-and-rollback/migrations/V3__drop_location.sql`**:

```sql
-- V3: rollback, written forward.
ALTER TABLE shelves DROP COLUMN location;
```

**Output** (`drilling/code/kata-01-write-migration-and-rollback/expected/main.stdout.txt`):

```text
id
label
```

### Kata: Add a Backfill Step to an Existing Migration

Extend the `items` table with a `qty` column and backfill every existing row to `1` in the same migration. Print the leftover-null count (zero) and the filled count.

- Starter: `drilling/code/kata-02-add-backfill-step/before/Starter.kt`
- Solution: `drilling/code/kata-02-add-backfill-step/after/Solution.kt`

**`drilling/code/kata-02-add-backfill-step/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Extend the `items` table with a `qty` column and backfill every existing row to `1` in the same migration. Print the leftover-null count (zero) and the filled count.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Extend the `items` table with a `qty` column and backfill every existing row to `1` in the same migration. Print the leftover-null count (zero) and the filled count.
```

**`drilling/code/kata-02-add-backfill-step/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-02-add-backfill-step.
// Extend the `items` table with a `qty` column and backfill every existing row to `1` in the same migration. Print the leftover-null count (zero) and the filled count.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the check queries
            st.executeQuery("SELECT count(*) FROM items WHERE qty IS NULL").use { rs -> // => leftovers must be zero
                rs.next() // => move to the single result row
                println("unfilled=" + rs.getInt(1)) // => Output: unfilled=0
            } // => result set closed here
            st.executeQuery("SELECT count(*) FROM items WHERE qty = 1").use { rs -> // => every row backfilled
                rs.next() // => move to the single result row
                println("filled=" + rs.getInt(1)) // => Output: filled=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-02-add-backfill-step/migrations/V1__create_items.sql`**:

```sql
-- V1: items without quantities.
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**`drilling/code/kata-02-add-backfill-step/migrations/V2__seed_items.sql`**:

```sql
-- V2: two items seed the kata.
INSERT INTO items (name) VALUES ('nails'), ('bolts');
```

**`drilling/code/kata-02-add-backfill-step/migrations/V3__backfill_qty.sql`**:

```sql
-- V3: your backfill goes here: add qty, fill it, prove zero misses.
ALTER TABLE items ADD COLUMN qty INTEGER;
UPDATE items SET qty = 1;
```

**Output** (`drilling/code/kata-02-add-backfill-step/expected/main.stdout.txt`):

```text
unfilled=0
filled=2
```

### Kata: Baseline an Existing Database Without Losing Data

A `legacy_stock` table already exists with two rows. Baseline it, apply `V2` adding a `code` column, and prove both rows survived with codes filled.

- Starter: `drilling/code/kata-03-baseline-existing-database/before/Starter.kt`
- Solution: `drilling/code/kata-03-baseline-existing-database/after/Solution.kt`

**`drilling/code/kata-03-baseline-existing-database/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: A `legacy_stock` table already exists with two rows. Baseline it, apply `V2` adding a `code` column, and prove both rows survived with codes filled.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: A `legacy_stock` table already exists with two rows. Baseline it, apply `V2` adding a `code` column, and prove both rows survived with codes filled.
```

**`drilling/code/kata-03-baseline-existing-database/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-03-baseline-existing-database.
// A `legacy_stock` table already exists with two rows. Baseline it, apply `V2` adding a `code` column, and prove both rows survived with codes filled.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    var present = 0 // => rows already living in the legacy table
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => connect before Flyway exists
        conn.createStatement().use { st -> // => plain DDL outside any migration
            st.executeUpdate("CREATE TABLE IF NOT EXISTS legacy_stock (id SERIAL PRIMARY KEY, item TEXT NOT NULL)") // => the pre-Flyway schema
            st.executeQuery("SELECT count(*) FROM legacy_stock").use { rs -> // => seed only into an empty table
                rs.next() // => move to the single result row
                present = rs.getInt(1) // => re-runs find the backfilled rows
            } // => result set closed here
            if (present == 0) { // => first run seeds; re-runs keep backfilled data
                st.executeUpdate("INSERT INTO legacy_stock (item) VALUES ('nails'), ('bolts')") // => two rows the baseline must keep
            } // => seeding ends; every run converges here
        } // => statement closed here
    } // => connection closed: the legacy schema stands ready
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => first run stamps; re-runs find the stamp already there
        flyway.baseline() // => stamp the existing schema as version 1
    } catch (e: Exception) { // => the stamp persists, so later runs stand down
    } // => either path converges on the same stamped history
    flyway.migrate() // => apply V2 with its backfill; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the survival queries
            st.executeQuery("SELECT count(*) FROM legacy_stock").use { rs -> // => both rows must survive
                rs.next() // => move to the single result row
                println("rows=" + rs.getInt(1)) // => Output: rows=2
            } // => result set closed here
            st.executeQuery("SELECT count(*) FROM legacy_stock WHERE code = 'K1'").use { rs -> // => the backfilled column
                rs.next() // => move to the single result row
                println("coded=" + rs.getInt(1)) // => Output: coded=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-03-baseline-existing-database/migrations/V2__add_code.sql`**:

```sql
-- V2: the first migration after your baseline.
ALTER TABLE legacy_stock ADD COLUMN code TEXT;
UPDATE legacy_stock SET code = 'K1';
```

**Output** (`drilling/code/kata-03-baseline-existing-database/expected/main.stdout.txt`):

```text
rows=2
coded=2
```

### Kata: Resolve a Migration-Order Conflict Between Two Branches

Branch A applied `V1`+`V2`. Branch B's same-numbered `V2` differs. Validate B (it fails), then migrate the merged set where B's change is renumbered `V3`. Print the three history versions.

- Starter: `drilling/code/kata-04-resolve-order-conflict/before/Starter.kt`
- Solution: `drilling/code/kata-04-resolve-order-conflict/after/Solution.kt`

**`drilling/code/kata-04-resolve-order-conflict/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Branch A applied `V1`+`V2`. Branch B's same-numbered `V2` differs. Validate B (it fails), then migrate the merged set where B's change is renumbered `V3`. Print the three history versions.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Branch A applied `V1`+`V2`. Branch B's same-numbered `V2` differs. Validate B (it fails), then migrate the merged set where B's change is renumbered `V3`. Print the three history versions.
```

**`drilling/code/kata-04-resolve-order-conflict/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-04-resolve-order-conflict.
// Branch A applied `V1`+`V2`. Branch B's same-numbered `V2` differs. Validate B (it fails), then migrate the merged set where B's change is renumbered `V3`. Print the three history versions.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val branchA = Flyway.configure() // => configuration for branch A
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations/branch") // => V1 plus branch A's V2
        .load() // => freeze the branch configuration
    try { // => branch A applies once; re-runs find it superseded
        branchA.migrate() // => V1 and V2 apply on the first run
    } catch (e: Exception) { // => later runs see the renumbered V3 and stand down
    } // => either path converges on the same merged history below
    val rival = Flyway.configure() // => configuration for the rival branch files
        .dataSource(dbUrl(), dbUser(), null) // => same database, rival V2
        .locations("filesystem:migrations/rival") // => V1 plus the conflicting V2
        .load() // => freeze the rival configuration
    println("valid=" + rival.validateWithResult().validationSuccessful) // => checksums disagree on V2
    val merged = Flyway.configure() // => configuration for the renumbered merge
        .dataSource(dbUrl(), dbUser(), null) // => same database, merged files
        .locations("filesystem:migrations/merged") // => V1, V2, plus renumbered V3
        .load() // => freeze the merged configuration
    merged.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the version query
            st.executeQuery("SELECT version FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => the merged story
                val order = StringBuilder() // => collect versions in rank order
                while (rs.next()) { // => walk all three rows
                    if (order.isNotEmpty()) order.append(" ") // => space between versions
                    order.append(rs.getString(1)) // => one version per row
                } // => loop ends after the last row
                println(order.toString()) // => Output: 1 2 3
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/branch/V1__create_bins.sql`**:

```sql
-- V1: the shared starting point.
CREATE TABLE bins (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL
);
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/branch/V2__add_size.sql`**:

```sql
-- V2 branch A: size wins here.
ALTER TABLE bins ADD COLUMN size TEXT;
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/merged/V1__create_bins.sql`**:

```sql
-- V1: the shared starting point.
CREATE TABLE bins (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL
);
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/merged/V2__add_size.sql`**:

```sql
-- V2 branch A: size wins here.
ALTER TABLE bins ADD COLUMN size TEXT;
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/merged/V3__add_zone.sql`**:

```sql
-- V3: branch B's change renumbered forward.
ALTER TABLE bins ADD COLUMN zone TEXT;
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/rival/V1__create_bins.sql`**:

```sql
-- V1: the shared starting point.
CREATE TABLE bins (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL
);
```

**`drilling/code/kata-04-resolve-order-conflict/migrations/rival/V2__add_color.sql`**:

```sql
-- V2 branch B: same number, different content.
ALTER TABLE bins ADD COLUMN color TEXT;
```

**Output** (`drilling/code/kata-04-resolve-order-conflict/expected/main.stdout.txt`):

```text
valid=false
1 2 3
```

### Kata: Diagnose a Partially Applied Migration

A `V2` with two statements fails on the second. Print the surviving history, prove the first statement's table is absent (atomicity held), then state the fix.

- Starter: `drilling/code/kata-05-diagnose-partial-migration/before/Starter.kt`
- Solution: `drilling/code/kata-05-diagnose-partial-migration/after/Solution.kt`

**`drilling/code/kata-05-diagnose-partial-migration/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: A `V2` with two statements fails on the second. Print the surviving history, prove the first statement's table is absent (atomicity held), then state the fix.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: A `V2` with two statements fails on the second. Print the surviving history, prove the first statement's table is absent (atomicity held), then state the fix.
```

**`drilling/code/kata-05-diagnose-partial-migration/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-05-diagnose-partial-migration.
// A `V2` with two statements fails on the second. Print the surviving history, prove the first statement's table is absent (atomicity held), then state the fix.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => the second statement of V2 is expected to fail
        flyway.migrate() // => V1 commits; V2 rolls back entirely
        println("migrated=true") // => never reached: V2 always fails
    } catch (e: Exception) { // => Flyway wraps the SQL error
        println("migrated=false") // => Output: migrated=false
    } // => the failure is data, not a crash
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the incident pair
            st.executeQuery("SELECT version, success FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => V2 is absent: the file to fix
                while (rs.next()) { // => walk the surviving history
                    println(rs.getString(1) + " " + rs.getBoolean(2)) // => Output: 1 true
                } // => loop ends after the single row
            } // => result set closed here
            st.executeQuery("SELECT count(*) FROM information_schema.tables WHERE table_name = 'staged_bays'").use { rs -> // => the debris check
                rs.next() // => move to the single result row
                println("debris=" + rs.getInt(1)) // => Output: debris=0
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-05-diagnose-partial-migration/migrations/V1__create_yards.sql`**:

```sql
-- V1: yards apply cleanly.
CREATE TABLE yards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**`drilling/code/kata-05-diagnose-partial-migration/migrations/V2__partial_bays.sql`**:

```sql
-- V2: the second statement fails; diagnose what remains.
CREATE TABLE staged_bays (
    id SERIAL PRIMARY KEY
);
CREATE TABLE doomed_bays (
    id WRONGTYPE PRIMARY KEY
);
```

**Output** (`drilling/code/kata-05-diagnose-partial-migration/expected/main.stdout.txt`):

```text
migrated=false
1 true
debris=0
```

### Kata: Split a Breaking Change into Zero-Downtime Steps

Split `accounts.name` into `full_name` without downtime: add the new column, backfill it, and prove old and new match for every row. (Contracting comes in a later release, out of scope here.)

- Starter: `drilling/code/kata-06-split-zero-downtime/before/Starter.kt`
- Solution: `drilling/code/kata-06-split-zero-downtime/after/Solution.kt`

**`drilling/code/kata-06-split-zero-downtime/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Split `accounts.name` into `full_name` without downtime: add the new column, backfill it, and prove old and new match for every row. (Contracting comes in a later release, out of scope here.)
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Split `accounts.name` into `full_name` without downtime: add the new column, backfill it, and prove old and new match for every row. (Contracting comes in a later release, out of scope here.)
```

**`drilling/code/kata-06-split-zero-downtime/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-06-split-zero-downtime.
// Split `accounts.name` into `full_name` without downtime: add the new column, backfill it, and prove old and new match for every row. (Contracting comes in a later release, out of scope here.)
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => apply pending migrations; re-runs find nothing new
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the parity query
            st.executeQuery("SELECT count(*) FROM accounts WHERE name = full_name").use { rs -> // => every row matches
                rs.next() // => move to the single result row
                println("matched=" + rs.getInt(1)) // => Output: matched=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-06-split-zero-downtime/migrations/V1__create_accounts.sql`**:

```sql
-- V1: accounts with the legacy name column.
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**`drilling/code/kata-06-split-zero-downtime/migrations/V2__seed_accounts.sql`**:

```sql
-- V2: two accounts seed the kata.
INSERT INTO accounts (name) VALUES ('sari'), ('budi');
```

**`drilling/code/kata-06-split-zero-downtime/migrations/V3__add_full_name.sql`**:

```sql
-- V3: expand and backfill; old readers keep working.
ALTER TABLE accounts ADD COLUMN full_name TEXT;
UPDATE accounts SET full_name = name;
```

**Output** (`drilling/code/kata-06-split-zero-downtime/expected/main.stdout.txt`):

```text
matched=2
```

### Kata: Build a Validate-Before-Migrate Gate

Before migrating, validate the files. Print the validation boolean and the final history count.

- Starter: `drilling/code/kata-07-validate-gate/before/Starter.kt`
- Solution: `drilling/code/kata-07-validate-gate/after/Solution.kt`

**`drilling/code/kata-07-validate-gate/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Before migrating, validate the files. Print the validation boolean and the final history count.
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Before migrating, validate the files. Print the validation boolean and the final history count.
```

**`drilling/code/kata-07-validate-gate/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-07-validate-gate.
// Before migrating, validate the files. Print the validation boolean and the final history count.
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    flyway.migrate() // => bring the database current; re-runs find nothing new
    println("valid=" + flyway.validateWithResult().validationSuccessful) // => gate one: result matches the files
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the receipt query
            st.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE success").use { rs -> // => every migration recorded
                rs.next() // => move to the single result row
                println("history=" + rs.getInt(1)) // => Output: history=2
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-07-validate-gate/migrations/V1__create_stalls.sql`**:

```sql
-- V1: stalls open the gate demo.
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**`drilling/code/kata-07-validate-gate/migrations/V2__create_goods.sql`**:

```sql
-- V2: goods belong to a stall.
CREATE TABLE goods (
    id SERIAL PRIMARY KEY,
    stall_id INTEGER NOT NULL REFERENCES stalls(id),
    name TEXT NOT NULL
);
```

**Output** (`drilling/code/kata-07-validate-gate/expected/main.stdout.txt`):

```text
valid=true
history=2
```

### Kata: Repair a Failed Migration Record

Fail `V2` with bad SQL, print the surviving history, repair any recorded failure state, and prove the history holds only `V1`. (Applying the corrected file is the follow-up exercise.)

- Starter: `drilling/code/kata-08-repair-failed/before/Starter.kt`
- Solution: `drilling/code/kata-08-repair-failed/after/Solution.kt`

**`drilling/code/kata-08-repair-failed/before/Starter.kt`**:

```kotlin
// Starter: an incomplete migration set. The smell: files without
// a rollback story, backfills without checks, history nobody reads.
// Your task: Fail `V2` with bad SQL, print the surviving history, repair any recorded failure state, and prove the history holds only `V1`. (Applying the corrected file is the follow-up exercise.)
fun main() { // => the shape to keep: configure, migrate, verify
    println("todo") // => replace this line with the real workflow
} // => main ends: the kata is done when todo is gone
// fix me: Fail `V2` with bad SQL, print the surviving history, repair any recorded failure state, and prove the history holds only `V1`. (Applying the corrected file is the follow-up exercise.)
```

**`drilling/code/kata-08-repair-failed/after/Solution.kt`**:

```kotlin
// Example 0: Kata kata-08-repair-failed.
// Fail `V2` with bad SQL, print the surviving history, repair any recorded failure state, and prove the history holds only `V1`. (Applying the corrected file is the follow-up exercise.)
import org.flywaydb.core.Flyway // => the entry point: configure, then migrate
import java.sql.DriverManager // => plain JDBC for the verification queries

fun dbUrl(): String { // => one URL builder shared by Flyway and JDBC
    val host = System.getenv("PGHOST") ?: "localhost" // => service alias on the unit network
    val db = System.getenv("PGDATABASE") ?: "postgres" // => the service's database name
    return "jdbc:postgresql://" + host + "/" + db // => trust auth needs no password
} // => helper ends: every connection string flows through here

fun dbUser(): String { // => one user lookup shared by Flyway and JDBC
    return System.getenv("PGUSER") ?: "postgres" // => postgres superuser in the service container
} // => helper ends: a single place if the service user ever changes

fun main() { // => the entry point the harness runs
    val flyway = Flyway.configure() // => start from a clean configuration
        .dataSource(dbUrl(), dbUser(), null) // => trust auth: user with no password
        .locations("filesystem:migrations") // => SQL files live beside the program
        .load() // => freeze the configuration into a Flyway instance
    try { // => the broken migration is expected to fail
        flyway.migrate() // => V1 commits, V2 explodes
        println("migrated=true") // => never reached: V2 always fails
    } catch (e: Exception) { // => Flyway wraps the SQL error
        println("migrated=false") // => Output: migrated=false
    } // => the failure is data, not a crash
    flyway.repair() // => clear any recorded failure state before continuing
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the healed check
            st.executeQuery("SELECT count(*) FROM flyway_schema_history").use { rs -> // => only V1 should remain
                rs.next() // => move to the single result row
                println("history=" + rs.getInt(1)) // => Output: history=1
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
    DriverManager.getConnection(dbUrl(), dbUser(), null).use { conn -> // => open one JDBC connection
        conn.createStatement().use { st -> // => a statement for the flag query
            st.executeQuery("SELECT version, success FROM flyway_schema_history ORDER BY installed_rank").use { rs -> // => the healed ledger
                while (rs.next()) { // => walk the single row
                    println(rs.getString(1) + " " + rs.getBoolean(2)) // => Output: 1 true
                } // => loop ends after the last row
            } // => result set closed here
        } // => statement closed here
    } // => connection closed here
} // => main ends: every check printed
```

**`drilling/code/kata-08-repair-failed/migrations/V1__create_docks.sql`**:

```sql
-- V1: docks apply cleanly.
CREATE TABLE docks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**`drilling/code/kata-08-repair-failed/migrations/V2__create_broken.sql`**:

```sql
-- V2: WRONGTYPE fails; repair clears the failure state.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
```

**Output** (`drilling/code/kata-08-repair-failed/expected/main.stdout.txt`):

```text
migrated=false
history=1
1 true
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check only what you have actually done in a database, not what you have read.

1. (co-01) I can name a migration file so its version, description, and suffix follow the contract.

2. (co-01) I can order versions so parallel work merges without negotiation.

3. (co-02) I can write a compensating migration that reverses a bad change.

4. (co-02) I can restore a dropped column with defaults for surviving rows.

5. (co-03) I can read `flyway_schema_history` and state exactly what ran, in order.

6. (co-03) I can compare two environments' histories and name the difference.

7. (co-04) I can land a late migration with `outOfOrder` as an explicit decision.

8. (co-04) I can explain why version gaps are legal and what they record.

9. (co-05) I can guard a backfill so reruns change nothing.

10. (co-06) I can decide when a migration needs a backfill versus schema-only change.

11. (co-06) I can batch a backfill by key ranges with a zero-leftover assertion.

12. (co-07) I can split a breaking change into expand, migrate, contract.

13. (co-07) I can time contraction using reader monitoring, not guesses.

14. (co-08) I can repair a failed record and land the corrected file.

15. (co-08) I can ship a rollback release with row fixes before constraint fixes.

16. (co-09) I can diagnose from history first: missing versions, then metadata, then fix.

17. (co-09) I can detect drift with a metadata comparison despite passing validation.

18. (co-10) I can baseline a legacy database without touching its rows.

19. (co-10) I can set the baseline version floor and description for an import.

20. (co-11) I can run validate gates that fail deploys on tampered files.

21. (co-12) I can rely on per-migration atomicity on PostgreSQL and prove it.

22. (co-13) I can promote with identical validate-migrate-validate steps everywhere.

23. (co-14) I can resolve branch conflicts by renumbering forward.

24. (co-15) I can prove concurrent migrates apply exactly once via summed totals.

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Explain each aloud before reading.

### E1: Why append-only history instead of editing a bad migration in place?

Rejected alternative: Editing rewrites the past every environment already recorded; checksums would diverge everywhere.

<details><summary>Model answer</summary>

Because the history table is shared truth: a forward fix keeps all environments converging, while an edit forks them irreparably.

</details>

### E2: Why not use Flyway's undo command for rollbacks?

Rejected alternative: The open-source edition has none, and Teams-only undo still rewrites applied state.

<details><summary>Model answer</summary>

Because compensating migrations work in every edition, review like normal code, and keep the audit trail complete.

</details>

### E3: Why backfill in the migration instead of a follow-up script?

Rejected alternative: A separate script runs outside version control ordering and may run twice or never.

<details><summary>Model answer</summary>

Because the migration's transaction and history entry make the data change as ordered and auditable as the schema change.

</details>

### E4: Why baseline instead of replaying legacy SQL as V1?

Rejected alternative: Legacy SQL rarely replays cleanly — data, permissions, and dead ends accumulate over years.

<details><summary>Model answer</summary>

Because stamping imports the result without re-executing history nobody can reproduce.

</details>

### E5: Why validate on every promotion instead of only in CI?

Rejected alternative: CI checks the branch's files against a test database, not the release files against production's history.

<details><summary>Model answer</summary>

Because each environment's history differs, only per-environment validation proves the files match that database.

</details>

### E6: Why small migrations instead of one release file?

Rejected alternative: One file holds the history lock longer, fails as a unit, and reviews as a wall of SQL.

<details><summary>Model answer</summary>

Because small files bound lock time, localize failures, and let reviewers actually review.

</details>
