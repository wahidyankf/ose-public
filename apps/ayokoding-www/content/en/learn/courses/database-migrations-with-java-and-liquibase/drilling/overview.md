---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Database Migrations with Java and Liquibase: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): What do the author and id of a changeset decide?

<details><summary>Answer</summary>

Its identity: Liquibase tracks `author:id:filepath` in `DATABASECHANGELOG`, so two changesets with the same triple collide and one identity always means one change, as in Example 3.

</details>

### Q2 (co-01): How do numeric filename prefixes order changelogs?

<details><summary>Answer</summary>

Alphabetically at include time: `001-` always applies before `002-` regardless of arrival order, so prefixes are the team's merge protocol, as in Example 12.

</details>

### Q3 (co-02): Why does raw SQL need an explicit rollback block?

<details><summary>Answer</summary>

Liquibase cannot infer the reverse of arbitrary SQL, so without a declared `-- rollback` the reverse is undefined and the rollback fails loudly instead of guessing, as in Examples 21 and 23.

</details>

### Q4 (co-02): How do data rollbacks restore deleted rows?

<details><summary>Answer</summary>

By re-inserting them: the rollback block carries the `INSERT` statements that restore exactly the rows the forward `DELETE` removed, as in Example 22.

</details>

### Q5 (co-03): What does `DATABASECHANGELOG` record per changeset?

<details><summary>Answer</summary>

Id, author, filename, checksum, execution order, and tag in apply order — the database's own memory of what ran, as in Example 9.

</details>

### Q6 (co-03): How do you prove two environments ran the same changesets?

<details><summary>Answer</summary>

List id and author ordered by `orderexecuted` on both and compare: any difference names the exact changeset to investigate, as in Examples 9 and 76.

</details>

### Q7 (co-04): What happens when two branches add conflicting changesets?

<details><summary>Answer</summary>

The second table creation collides at apply time with a loud failure: the merge looked clean in version control but the database enforces one reality, as in Example 54.

</details>

### Q8 (co-04): How do merged histories keep one order?

<details><summary>Answer</summary>

By interleaving on filename prefixes: both branches' changesets apply in prefix order into a single `orderexecuted` line, never by editing applied rows, as in Example 55.

</details>

### Q9 (co-05): What makes a backfill safe to run twice?

<details><summary>Answer</summary>

A guarding `WHERE` clause plus batching by key ranges — reruns find no work and each statement locks briefly, as in Example 29. History gives the second safety net.

</details>

### Q10 (co-06): When does a migration need a backfill step?

<details><summary>Answer</summary>

Whenever a schema change must preserve or derive row data: a new column on a populated table, a seed, or a lookup fill — not for empty structural changes, as in Examples 26 and 27.

</details>

### Q11 (co-06): What assertion belongs with every backfill?

<details><summary>Answer</summary>

A leftover count the migration must drive to zero — `ungraded=0` — plus the derived-value count, as in Example 34.

</details>

### Q12 (co-07): What are the three phases of a zero-downtime change?

<details><summary>Answer</summary>

Expand (add beside the old), bridge with dual writes while readers move, contract (drop the old last), as in Examples 35 to 37.

</details>

### Q13 (co-07): When is it safe to drop the old column?

<details><summary>Answer</summary>

Only after every reader moved to the new one — a release later, with monitoring guarding the timing, as in Example 38.

</details>

### Q14 (co-08): What does rolling back one changeset do to history?

<details><summary>Answer</summary>

It runs the changeset's rollback block and deletes its history row: the reverse of apply is un-record, not a compensating entry, as in Example 18.

</details>

### Q15 (co-08): What happens when a rollback has no plan?

<details><summary>Answer</summary>

It fails loudly with a named exception instead of half-reversing: an unplanned reverse is a missing requirement, not a best effort, as in Example 23.

</details>

### Q16 (co-09): Where does migration diagnosis start?

<details><summary>Answer</summary>

At the history table: ids in `orderexecuted` order name the boundary between what committed and what failed, before any log, as in Example 71.

</details>

### Q17 (co-09): Why can `validate` pass on a drifted schema?

<details><summary>Answer</summary>

It compares the changelog to history, not the schema to the changelog — a hand-added column is invisible to it, as in Example 25. `diff` against the changelog catches drift, as in Example 47.

</details>

### Q18 (co-10): What does `changeLogSync` record?

<details><summary>Answer</summary>

`MARK_RAN` rows for the matching changelog without executing a single statement, adopting the legacy schema as the starting point, as in Example 45.

</details>

### Q19 (co-11): What does a checksum failure prove?

<details><summary>Answer</summary>

That an applied changeset's file was edited after it ran: the stored `md5sum` no longer matches, and the exact changeset id is named, as in Examples 11 and 72.

</details>

### Q20 (co-12): Why do some migrations commit step by step?

<details><summary>Answer</summary>

Because some statements forbid transactions — `CREATE INDEX CONCURRENTLY` cannot run inside one — so the changeset opts out with `runInTransaction:false`, as in Examples 41 and 66.

</details>

### Q21 (co-13): What repeats on every environment promotion?

<details><summary>Answer</summary>

The same order everywhere: validate the changelog, update, then test — identical gates on every database, as in Examples 60 and 70.

</details>

### Q22 (co-14): How do you resolve a duplicate table across branches?

<details><summary>Answer</summary>

Keep the winner's table and replace the loser's duplicate with its remaining value — an index on the winner's table — so the merge ships one history line, as in Example 59.

</details>

### Q23 (co-15): How does `DATABASECHANGELOGLOCK` serialize runners?

<details><summary>Answer</summary>

One winner holds the lock row and applies the pending set; losers wait or fail fast on timeout, and totals never exceed the changeset count, as in Examples 62 and 67.

</details>

### Q24 (co-16): How do you test a rollback without risking real data?

<details><summary>Answer</summary>

In a scratch database: apply, reverse, re-apply, and prove the cycle, as in Example 75. Pipelines run update-then-test so every migration earns its green, as in Example 70.

</details>

## Applied problems

At least 8 scenario problems. Work each on paper or in a scratch database before reading the sketch.

### AP1: Split a breaking column rename into zero-downtime steps

Ship release one adding `display_name` plus backfill, keep `name` serving with dual writes; a release later ship release two dropping `name` after readers move (Examples 35–38). Never rename in place on a live table.

_Applied: expand-bridge-contract keeps every intermediate deploy safe._

### AP2: Resolve a migration-order conflict between two branches

Both branches created the same table: let the loser's update fail loudly, then merge with the losing change replaced by an index on the winner's table and update (Examples 54–55, 59).

_Applied: replace-the-duplicate merges without rewriting history._

### AP3: Diagnose a partially applied migration from the history table

Name the failed changeset against the changelog, list applied ids stopping at the boundary, confirm atomicity held, fix the file, clear or sync as sanctioned, rerun, validate green (Examples 71–75).

_Applied: history-first runbooks end in passing validation._

### AP4: Size a backfill for a ten-million-row table

Batch updates by key ranges with disjoint `WHERE` clauses, guard with null checks for rerun safety, and assert a zero leftover count (Examples 29, 34).

_Applied: bounded locks plus rerun guards scale backfills safely._

### AP5: Import a legacy database under Liquibase control

Pre-existing schema stays untouched; `changeLogSync` with a matching changelog stamps it `MARK_RAN`, then new changesets extend it and `validate` proves coherence (Examples 45, 53).

_Applied: stamped imports replay identically on every environment._

### AP6: Gate a release on changelog validation

Run `validate`, preview pending work with `status`, require review for non-empty lists, then update and confirm history counts (Examples 17, 25, 78).

_Applied: explicit gates stop unreviewed changesets riding with code._

### AP7: Prove parallel deploys cannot double-apply

Race two runners at the same set, sum the applied counts, and read the ledger: totals equal the changeset count every run, lock timeouts fail fast (Examples 62, 67, 70).

_Applied: lock-serialized totals turn parallel-deploy fear into evidence._

### AP8: Detect schema drift on a schedule

Run `diff` and `diffChangeLog` against the changelog, report unexpected objects, reconcile before the next release; remember `validate` alone cannot see drift (Examples 47–49).

_Applied: scheduled metadata checks catch hand changes before incidents do._

## Code katas

Eight hands-on katas under `drilling/code/`. Each kata has a `before/` starter (intentionally imperfect — fix it) and an `after/` solution that runs green. Run a kata with the command in its own `run.yaml`.

### Kata: Write a Migration and Its Rollback

Update the two-changeset changelog, roll back its latest changeset, then print the surviving column count and the history count.

- Starter: `drilling/code/kata-01-write-migration-and-rollback/before/Starter.java`
- Solution: `drilling/code/kata-01-write-migration-and-rollback/after/Solution.java`

**`drilling/code/kata-01-write-migration-and-rollback/before/Starter.java`**:

```java
// Starter: a rollback story with its ending missing. The smell: a migration
// that only moves forward, and a verify step that never looks backward.
// Your task: update the changelog, roll back its latest changeset, then print
// the surviving column count and the history count.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Update the changelog, roll back its latest changeset, then print the surviving column count and the history count.
```

**`drilling/code/kata-01-write-migration-and-rollback/after/Solution.java`**:

```java
// Kata 01: Write a Migration and Its Rollback.
// Update the two-changeset changelog, roll back its latest changeset, then
// prove the older table survived with one history row while the newer one
// is gone. Forward plus reverse is one complete migration story.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => Liquibase narrates on updates and rollbacks alike, so one quiet
  // => runner covers the forward move and its reverse
  static void runQuiet(Liquibase liquibase, boolean forward) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the flag selects the direction of the Liquibase move
        if (forward) {
          // => run both kata changesets forward first
          liquibase.update("");
        } else {
          // => then reverse only the latest changeset
          liquibase.rollback(1, "");
        } // => the declared block is the only reverse raw SQL gets
      }
    );
    // => both directions stay inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the kata run and both checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two kata changesets: the shelf, then its stock column
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, true);
      // => both kata changesets apply; the history holds two rows
      runQuiet(liquibase, false);
      // => rolling back one reverses only the latest kata changeset
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery(
          "SELECT count(*) FROM information_schema.columns " + "WHERE table_name = 'shelves'"
        )
      ) {
        // => the rollback removed the stock column, keeping id and label
        rs.next();
        System.out.println("shelf columns surviving: " + rs.getInt(1));
        // => Output: shelf columns surviving: 2
      } // => two columns prove the reverse undid exactly the addition
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => the rollback deleted the reversed changeset's history row
        rs.next();
        System.out.println("history rows after rollback: " + rs.getInt(1));
        // => Output: history rows after rollback: 1
        // => a rerun re-applies the column, then rolls it back again
      } // => reading history back closes every kata like every example
    } // => closing the connection ends the kata with the story complete
  } // => main migrates forward, steps one back, then proves the step
}
```

**`drilling/code/kata-01-write-migration-and-rollback/changelog.sql`**:

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-shelves
-- => the shelf changeset creates the shelves table the kata keeps
CREATE TABLE shelves (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  label VARCHAR(60) NOT NULL
  -- => shelf labels are required from the first migration
);

-- rollback DROP TABLE shelves;
-- => this reverse never runs here; only the column addition rolls back

-- changeset kata:002-add-stock
-- => the stock changeset adds the column the kata rolls back
ALTER TABLE shelves ADD COLUMN stock INTEGER;

-- rollback ALTER TABLE shelves DROP COLUMN stock;
-- => dropping the column reverses exactly what this changeset added
```

**Output** (`drilling/code/kata-01-write-migration-and-rollback/expected/main.stdout.txt`):

```text
shelf columns surviving: 2
history rows after rollback: 1
```

### Kata: Add a Backfill Step to an Existing Migration

Wire the backfill changeset after the seed, then print the ungraded count and the distinct grades.

- Starter: `drilling/code/kata-02-add-backfill-step/before/Starter.java`
- Solution: `drilling/code/kata-02-add-backfill-step/after/Solution.java`

**`drilling/code/kata-02-add-backfill-step/before/Starter.java`**:

```java
// Starter: a backfill step that exists only as an intention. The smell: a new
// column with nulls nobody derives, and no verification query in sight.
// Your task: wire the backfill changeset after the seed, then print the ungraded
// count and the distinct grades.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Wire the backfill changeset after the seed, then print the ungraded count and the distinct grades.
```

**`drilling/code/kata-02-add-backfill-step/after/Solution.java`**:

```java
// Kata 02: Add a Backfill Step to an Existing Migration.
// The seed leaves grades empty; the backfill changeset derives every row's
// grade after it. Wire the step, run both changelogs, then prove no row
// stayed ungraded and two distinct grades resulted.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => Liquibase narrates progress to its console UI by default; those lines
  // => differ between a first run and a rerun, so goldens cannot hold them
  static void runQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the seed, the backfill, and the checks
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots the seed and the backfill in the kata folder
      runQuiet(new Liquibase("changelog.sql", accessor, database));
      // => the seed builds the table with four ungraded rows
      runQuiet(new Liquibase("after/backfill.sql", accessor, database));
      // => wiring the backfill step means running its changelog second
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM ingots WHERE grade IS NULL")
      ) {
        // => the backfill must leave zero rows without a derived grade
        rs.next();
        System.out.println("ungraded rows: " + rs.getInt(1));
        // => Output: ungraded rows: 0
      } // => zero nulls prove the added step reached every seeded row
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(DISTINCT grade) FROM ingots")
      ) {
        // => heavy rows became A, light rows became B
        rs.next();
        System.out.println("distinct grades: " + rs.getInt(1));
        // => Output: distinct grades: 2
        // => a rerun skips both changelogs and prints the identical checks
      } // => two grades prove the step derived values instead of copying one
    } // => closing the connection ends the kata with the backfill wired
  } // => main seeds, backfills, then proves no row was missed
}
```

**`drilling/code/kata-02-add-backfill-step/changelog.sql`** (the seed):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The seed builds the table with ungraded rows; the backfill lands next.
-- changeset kata:001-seed-ingots
-- => four seeded rows with weights but no grades yet
CREATE TABLE ingots (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  weight_kg INTEGER NOT NULL,
  -- => the weight below decides each row's derived grade
  grade VARCHAR(10)
  -- => grades start NULL; the backfill step derives all four
);
INSERT INTO ingots (weight_kg) VALUES (10), (20), (30), (40);
-- => four ungraded rows awaiting the wired backfill step

-- rollback DROP TABLE ingots;
-- => this reverse never runs here; the kata wires forward only
```

**`drilling/code/kata-02-add-backfill-step/after/backfill.sql`** (the wired step):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The wired backfill step: heavy rows become A, light rows become B.
-- changeset kata:002-grade-ingots
-- => the added step derives every row's grade from its weight
UPDATE ingots SET grade = CASE WHEN weight_kg >= 25 THEN 'A' ELSE 'B' END;
-- => two and two: the verification below recounts both bands

-- rollback UPDATE ingots SET grade = NULL;
-- => nulling the grades un-derives every row without dropping the column
```

**Output** (`drilling/code/kata-02-add-backfill-step/expected/main.stdout.txt`):

```text
ungraded rows: 0
distinct grades: 2
```

### Kata: Baseline an Existing Database Without Losing Data

Hand-build the legacy shape, sync its matching changelog without running it, then print the baselined count and the kept rows.

- Starter: `drilling/code/kata-03-baseline-existing-database/before/Starter.java`
- Solution: `drilling/code/kata-03-baseline-existing-database/after/Solution.java`

**`drilling/code/kata-03-baseline-existing-database/before/Starter.java`**:

```java
// Starter: a legacy table with no changelog to its name. The smell: a database
// the team is afraid to migrate because history starts nowhere.
// Your task: hand-build the legacy shape, sync its matching changelog without
// running it, then print the baselined count and the kept rows.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Hand-build the legacy shape, sync its matching changelog without running it, then print the baselined count and the kept rows.
```

**`drilling/code/kata-03-baseline-existing-database/after/Solution.java`**:

```java
// Kata 03: Baseline an Existing Database Without Losing Data.
// The legacy table predates Liquibase; the sync adopts it without running
// a single statement. Hand-build the shape, sync the matching changelog,
// then prove the history filled while both legacy rows stayed untouched.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection hand-builds the legacy shape, then syncs it
      conn.setAutoCommit(false);
      // => manual commit makes the hand-build explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => the legacy table predates Liquibase: no changeset ever built it
        st.execute("DROP TABLE IF EXISTS legacy_ledgers");
        // => dropping first keeps the hand-build idempotent on double runs
        st.execute("CREATE TABLE legacy_ledgers (id SERIAL PRIMARY KEY, balance_cents INTEGER)");
        // => the legacy shape matches the changelog below column for column
        st.execute("DELETE FROM legacy_ledgers");
        // => delete-then-insert keeps the seed idempotent on the double run
        st.execute("INSERT INTO legacy_ledgers (balance_cents) VALUES (1000), (2000)");
        // => two legacy rows the sync must carry over untouched
        conn.commit();
        // => committing pins the legacy shape before the sync below
      } // => hand-built history is exactly what baselines are for
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset describing the already-existing table
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      Scope.child(
        java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
        // => the sync narrates too, so it stays inside a quiet scope
        () -> liquibase.changeLogSync("")
      );
      // => the sync recorded the changeset; executing it would have failed
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => the baseline is one tracked changeset that never executed
        rs.next();
        System.out.println("baselined changesets: " + rs.getInt(1));
        // => Output: baselined changesets: 1
      } // => one row proves the database joined version control today
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM legacy_ledgers")
      ) {
        // => both legacy rows survived the sync exactly as hand-built
        rs.next();
        System.out.println("legacy rows kept: " + rs.getInt(1));
        // => Output: legacy rows kept: 2
        // => a rerun rebuilds the legacy shape, then syncs it no-op again
      } // => counts verify data without dumping rows into the transcript
    } // => closing the connection ends the kata with the past baselined
  } // => main hand-builds the past, then baselines it without running
}
```

**`drilling/code/kata-03-baseline-existing-database/changelog.sql`**:

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The changeset describes the hand-built table column for column.
-- changeset kata:001-legacy-ledgers
-- => it must never execute here: the table already exists, so the sync
-- => marks it ran and every future changeset builds on top normally
CREATE TABLE legacy_ledgers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL matches the hand-built key exactly, or drift starts today
  balance_cents INTEGER NOT NULL
  -- => the hand-built column the sync below carries over untouched
);

-- rollback DROP TABLE legacy_ledgers;
-- => this reverse never runs here; baselines record, they do not execute
```

**Output** (`drilling/code/kata-03-baseline-existing-database/expected/main.stdout.txt`):

```text
baselined changesets: 1
legacy rows kept: 2
```

### Kata: Resolve a Migration-Order Conflict Between Two Branches

Apply branch-a, survive branch-b's collision, apply the resolved replacement instead, then print the failure, the history, and the index.

- Starter: `drilling/code/kata-04-resolve-order-conflict/before/Starter.java`
- Solution: `drilling/code/kata-04-resolve-order-conflict/after/Solution.java`

**`drilling/code/kata-04-resolve-order-conflict/before/Starter.java`**:

```java
// Starter: two branches, one table, zero agreement. The smell: a merge that
// applies cleanly on one side and explodes on the other, with no fallback.
// Your task: apply branch-a, survive branch-b's collision, apply the resolved
// replacement instead, then print the failure, the history, and the index.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Apply branch-a, survive branch-b's collision, apply the resolved replacement instead, then print the failure, the history, and the index.
```

**`drilling/code/kata-04-resolve-order-conflict/after/Solution.java`**:

```java
// Kata 04: Resolve an Order Conflict Between Two Branches.
// Branch-a builds the table; branch-b duplicates it and must lose. The
// resolution replaces the duplicate with an index on the winner's table.
// Apply the winner, survive the collision, apply the replacement, then
// prove the failure named itself with two history rows and one index.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.exception.LiquibaseException; // => the stable type every expected failure wears
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => each branch runs inside the same quiet scope shape as every update
  static void runQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the collision and its resolution
      conn.setAutoCommit(false);
      // => manual commit makes the kata reset explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => the losing branch's table persists, so every run starts clean
        st.execute("DROP TABLE IF EXISTS waypoints");
        // => dropping first keeps the collision replayable on double runs
      } // => a clean slate replays the same collision on every run
      clearHistory(conn);
      // => forgetting past branches lets this run collide them fresh
      conn.commit();
      // => committing pins the clean slate before branch-a below
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      DirectoryResourceAccessor accessor = new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile());
      // => one accessor roots all three branch changelogs in the kata folder
      runQuiet(new Liquibase("changelog-a.sql", accessor, database));
      // => branch-a wins the race: its waypoints table applies cleanly
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => branch-b builds the same table, so this update must collide
        runQuiet(new Liquibase("changelog-b.sql", accessor, database));
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the collision failed loudly instead of merging
        conn.rollback();
        // => rolling back keeps the winner's history exactly as applied
      } // => no stack trace: the collision is the expected evidence
      runQuiet(new Liquibase("changelog-b-resolved.sql", accessor, database));
      // => the resolution indexes the winner's table instead of duplicating it
      System.out.println("branch conflict failure: " + failure);
      // => Output: branch conflict failure: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => winner plus resolution share the history: two rows, one order
        rs.next();
        System.out.println("merged history rows: " + rs.getInt(1));
        // => Output: merged history rows: 2
      } // => two rows prove the merge resolved into a single line
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM pg_indexes WHERE indexname = 'ix_waypoints_code'")
      ) {
        // => the replacement built exactly the index the duplicate skipped
        rs.next();
        System.out.println("resolution indexes: " + rs.getInt(1));
        // => Output: resolution indexes: 1
        // => a rerun replays winner, collision, and resolution identically
      } // => one index proves the losing branch still shipped value
    } // => closing the connection ends the kata with the conflict resolved
  } // => main races two branches, then merges them into one history

  // => the history table may not exist before the first update, so forgetting
  // => our rows is guarded by an existence check on every run
  static void clearHistory(Connection conn) throws Exception {
    // => information_schema tells whether any history exists to forget
    try (
      Statement check = conn.createStatement();
      // => a separate statement keeps the check isolated from the delete
      ResultSet rs = check.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => forgetting runs only where a history table already exists
      if (rs.getInt(1) > 0) {
        // => deleting only our own rows leaves every other course untouched
        try (Statement forget = conn.createStatement()) {
          // => the delete runs only after the check proved the table exists
          forget.execute("DELETE FROM databasechangelog WHERE author = 'kata'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates
}
```

**`drilling/code/kata-04-resolve-order-conflict/changelog-a.sql`** (branch-a, the winner):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-a builds the waypoints table first and wins the kata race.
-- changeset kata:001-a-make-waypoints
-- => the winning changeset creates the table both branches want
CREATE TABLE waypoints (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  code VARCHAR(20) NOT NULL
  -- => waypoint codes are required from the first migration
);

-- rollback DROP TABLE waypoints;
-- => this reverse never runs here; winners are not rolled back
```

**`drilling/code/kata-04-resolve-order-conflict/changelog-b.sql`** (branch-b, the loser):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-b builds the same table and loses the kata race by design.
-- changeset kata:001-b-make-waypoints
-- => the losing changeset collides: the table already exists from branch-a
CREATE TABLE waypoints (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  code VARCHAR(20) NOT NULL
  -- => the identical shape proves neither branch compromised, both wrote it
);

-- rollback DROP TABLE waypoints;
-- => this reverse never runs: the changeset itself never applies
```

**`drilling/code/kata-04-resolve-order-conflict/changelog-b-resolved.sql`** (the resolution):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The resolution: index the winner's table instead of duplicating it.
-- changeset kata:002-b-index-waypoints
-- => the replacement ships the loser's value without the loser's table
CREATE INDEX ix_waypoints_code ON waypoints (code);
-- => the index the duplicate skipped, applied onto the winner's table

-- rollback DROP INDEX ix_waypoints_code;
-- => dropping the index un-resolves back to the winner alone
```

**Output** (`drilling/code/kata-04-resolve-order-conflict/expected/main.stdout.txt`):

```text
branch conflict failure: CommandExecutionException
merged history rows: 2
resolution indexes: 1
```

### Kata: Diagnose a Partially Applied Migration

Run the pair, catch the failure, then name the failed id and list the applied ids stopping at the boundary.

- Starter: `drilling/code/kata-05-diagnose-partial-migration/before/Starter.java`
- Solution: `drilling/code/kata-05-diagnose-partial-migration/after/Solution.java`

**`drilling/code/kata-05-diagnose-partial-migration/before/Starter.java`**:

```java
// Starter: a migration that dies halfway with no obituary. The smell: a failure
// nobody can place, because nobody read the history boundary.
// Your task: run the pair, catch the failure, then name the failed id and list
// the applied ids stopping at the boundary.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Run the pair, catch the failure, then name the failed id and list the applied ids stopping at the boundary.
```

**`drilling/code/kata-05-diagnose-partial-migration/after/Solution.java`**:

```java
// Kata 05: Diagnose a Partial Migration from the History.
// A good changeset plus a failing one leaves a boundary in history: read
// it before repairing anything. Run the pair, catch the failure, then
// name the failed id and list the applied ids stopping at the boundary.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.exception.LiquibaseException; // => the stable type every expected failure wears
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the failed run and its forensics
      conn.setAutoCommit(false);
      // => manual commit makes the kata reset explicit and replayable
      try (Statement st = conn.createStatement()) {
        // => leftovers would move the boundary this kata must locate
        st.execute("DROP TABLE IF EXISTS barometers");
        // => dropping first keeps the failed run replayable on double runs
      } // => forensics need a witness-free stage to read clearly
      clearHistory(conn);
      // => forgetting past runs lets this run fail at the same boundary
      conn.commit();
      // => committing pins the clean slate before the failing pair
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two kata changesets: a good table, then an impossible insert
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      try {
        // => the first changeset commits, then the second fails beside it
        Scope.child(
          java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
          // => the failing run narrates too, so it stays inside a quiet scope
          () -> liquibase.update("")
        );
      } catch (LiquibaseException expected) {
        // => the failure is forensics fuel, not the printed story itself
        conn.rollback();
        // => rolling back keeps the committed first step exactly as applied
      } // => no stack trace: the boundary below is the expected evidence
      System.out.println("failed at changeset: 002-bad-insert");
      // => Output: failed at changeset: 002-bad-insert
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT id FROM databasechangelog ORDER BY orderexecuted")
      ) {
        // => the history boundary sits exactly before the failed changeset
        StringBuilder applied = new StringBuilder();
        // => the builder collects the committed ids the failure left behind
        while (rs.next()) {
          // => each id is one changeset that committed before the failure
          if (applied.length() > 0) {
            // => commas separate the steps without extra whitespace
            applied.append(",");
          } // => the first id needs no separator before it
          applied.append(rs.getString(1));
          // => appending preserves the database-reported execution order
        } // => the joined ids end where the failure began, by construction
        System.out.println("applied before failure: " + applied);
        // => Output: applied before failure: 001-make-barometers
        // => a rerun recommits the first step, then fails identically again
      } // => reading history back is the first diagnostic move, always
    } // => closing the connection ends the kata at the failure boundary
  } // => main fails on purpose, then reads exactly where it stopped

  // => the history table may not exist before the failing pair, so forgetting
  // => our rows is guarded by an existence check on every run
  static void clearHistory(Connection conn) throws Exception {
    // => information_schema tells whether any history exists to forget
    try (
      Statement check = conn.createStatement();
      // => a separate statement keeps the check isolated from the delete
      ResultSet rs = check.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => forgetting runs only where a history table already exists
      if (rs.getInt(1) > 0) {
        // => deleting only our own rows leaves every other course untouched
        try (Statement forget = conn.createStatement()) {
          // => the delete runs only after the check proved the table exists
          forget.execute("DELETE FROM databasechangelog WHERE author = 'kata'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates
}
```

**`drilling/code/kata-05-diagnose-partial-migration/changelog.sql`**:

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-barometers
-- => the good changeset commits first and anchors the failure boundary
CREATE TABLE barometers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => the committed table the forensics below start reading from
);

-- rollback DROP TABLE barometers;
-- => this reverse never runs here; forensics read, they do not roll back

-- changeset kata:002-bad-insert
-- => the failing changeset inserts into a table that does not exist
-- => its absence from the history is the boundary the kata reports
INSERT INTO missing_table (name) VALUES ('ghost');

-- rollback DELETE FROM missing_table WHERE name = 'ghost';
-- => this reverse never runs: the failed changeset recorded nothing
```

**Output** (`drilling/code/kata-05-diagnose-partial-migration/expected/main.stdout.txt`):

```text
failed at changeset: 002-bad-insert
applied before failure: 001-make-barometers
```

### Kata: Split a Breaking Change into Zero-Downtime Steps

Migrate the expanded table, dual-write both columns for every row, then print the agreeing count and the total.

- Starter: `drilling/code/kata-06-split-zero-downtime/before/Starter.java`
- Solution: `drilling/code/kata-06-split-zero-downtime/after/Solution.java`

**`drilling/code/kata-06-split-zero-downtime/before/Starter.java`**:

```java
// Starter: a rename with no bridge and no agreement check. The smell: an old
// column and a new column with nobody proving they match.
// Your task: migrate the expanded table, dual-write both columns for every row,
// then print the agreeing count and the total.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Migrate the expanded table, dual-write both columns for every row, then print the agreeing count and the total.
```

**`drilling/code/kata-06-split-zero-downtime/after/Solution.java`**:

```java
// Kata 06: Split Reads Across Old and New Without Downtime.
// The expanded table carries both columns; the application writes both
// for every row while readers move over. Migrate, bridge both columns,
// then prove old and new agree on every row before any contract.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => Liquibase narrates progress to its console UI by default; those lines
  // => differ between a first run and a rerun, so goldens cannot hold them
  static void runQuiet(Liquibase liquibase) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> liquibase.update("")
    );
    // => update("") runs every changeset with no context filter
  } // => quiet updates keep golden output identical on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the migration and the dual write
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => one changeset: the expanded table with old and new together
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase);
      // => the table holds both columns; the bridge below fills the new one
      conn.commit();
      // => committing pins the migration before the application write below
      try (Statement st = conn.createStatement()) {
        // => one statement bridges old and new for every row at once
        st.execute("DELETE FROM circulars");
        // => delete-then-insert keeps the bridge idempotent on the double run
        st.execute("INSERT INTO circulars (title, body) VALUES ('Jadwal', 'Jadwal')");
        // => writing both columns together is the dual write in miniature
        conn.commit();
        // => committing the bridge makes the agreement below observable
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM circulars WHERE title = body")) {
          // => every row must agree: old and new readers see the same text
          rs.next();
          System.out.println("rows where old and new agree: " + rs.getInt(1));
          // => Output: rows where old and new agree: 1
        } // => agreement on all rows green-lights the coming contract step
        try (ResultSet rs = st.executeQuery("SELECT count(*) FROM circulars")) {
          // => the bridge writes rows, never extra ones
          rs.next();
          System.out.println("total rows bridged: " + rs.getInt(1));
          // => Output: total rows bridged: 1
          // => a rerun re-bridges the same single row and prints the same
        } // => counts verify data without dumping rows into the transcript
      } // => closing the statement releases the database resources
    } // => closing the connection ends the kata with the bridge proven
  } // => main writes both columns, then proves they agree
}
```

**`drilling/code/kata-06-split-zero-downtime/changelog.sql`**:

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The expand changeset creates both columns together for the bridge.
-- changeset kata:001-make-circulars
-- => old and new start side by side; the kata bridges them by hand
CREATE TABLE circulars (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  title VARCHAR(120) NOT NULL,
  -- => the old column old readers still consume
  body TEXT
  -- => the new column, born nullable until dual writes fill it
);

-- rollback DROP TABLE circulars;
-- => this reverse never runs here; the kata bridges forward only
```

**Output** (`drilling/code/kata-06-split-zero-downtime/expected/main.stdout.txt`):

```text
rows where old and new agree: 1
total rows bridged: 1
```

### Kata: Build a Validate-Before-Migrate Gate

Validate the changelog, catch its refusal, then print the failure and prove the history stayed empty.

- Starter: `drilling/code/kata-07-validate-gate/before/Starter.java`
- Solution: `drilling/code/kata-07-validate-gate/after/Solution.java`

**`drilling/code/kata-07-validate-gate/before/Starter.java`**:

```java
// Starter: a merge queue with no gate and no preview. The smell: broken files
// that reach the database because nobody validated them first.
// Your task: validate the changelog, catch its refusal, then print the failure
// and prove the history stayed empty.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Validate the changelog, catch its refusal, then print the failure and prove the history stayed empty.
```

**`drilling/code/kata-07-validate-gate/after/Solution.java`**:

```java
// Kata 07: Gate the Merge on Validation.
// Broken changelogs must fail the gate, never the deploy: validate the
// file, catch its refusal, then prove nothing ran. The gate runs before
// every merge, cheaply, with no database touched.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.exception.LiquibaseException; // => the stable type every expected failure wears
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the gate and the emptiness proof
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two changesets share one id: the file is broken by design
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      String failure = "none";
      // => the failure name records the outcome without printing internals
      try {
        // => validation reads the file and the database, but runs nothing
        Scope.child(
          java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
          // => validation narrates too, so it stays inside a quiet scope
          () -> liquibase.validate()
        );
      } catch (LiquibaseException expected) {
        // => the exception type is stable; its message text is not asserted
        failure = expected.getClass().getSimpleName();
        // => catching proves the broken file never reached the database
        conn.rollback();
        // => rolling back keeps the untouched database exactly as it was
      } // => no stack trace: the refusal is the expected behaviour
      System.out.println("gate refusal: " + failure);
      // => Output: gate refusal: CommandExecutionException
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => validation initializes tracking but records zero changesets
        rs.next();
        System.out.println("history rows recorded by gate: " + rs.getInt(1));
        // => Output: history rows recorded by gate: 0
        // => a rerun gates the same broken file and refuses identically
      } // => zero history rows prove the gate executed nothing at all
    } // => closing the connection ends the kata with the merge ungated-shut
  } // => main gates first, and the broken file never runs
}
```

**`drilling/code/kata-07-validate-gate/changelog.sql`** (broken by design):

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The duplicated id below is the deliberate break the gate must catch.
-- changeset kata:001-make-signals
-- => the first changeset creates the signals table
CREATE TABLE signals (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => signal names are required from the first migration
);

-- rollback DROP TABLE signals;
-- => this reverse never runs: the gate refuses before any update

-- changeset kata:001-make-signals
-- => DELIBERATE BREAK: the same author and id as the changeset above
-- => two identities collide, so validation must refuse the whole file
CREATE TABLE signal_dup (
  id SERIAL PRIMARY KEY
  -- => this table never exists: the refusal fires before anything runs
);

-- rollback DROP TABLE signal_dup;
-- => this reverse never runs either; nothing in this file ever runs
```

**Output** (`drilling/code/kata-07-validate-gate/expected/main.stdout.txt`):

```text
gate refusal: CommandExecutionException
history rows recorded by gate: 0
```

### Kata: Repair a Failed Migration Record

Rewrite deliberately, clear the checksums, update, then prove the history stands with zero stale markers left.

- Starter: `drilling/code/kata-08-repair-failed/before/Starter.java`
- Solution: `drilling/code/kata-08-repair-failed/after/Solution.java`

**`drilling/code/kata-08-repair-failed/before/Starter.java`**:

```java
// Starter: a rewritten history with no sanctioned path. The smell: checksums
// that disagree with the file and a team reaching for hand-edits.
// Your task: rewrite deliberately, clear the checksums, update, then prove the
// history stands with zero stale markers left.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Rewrite deliberately, clear the checksums, update, then prove the history stands with zero stale markers left.
```

**`drilling/code/kata-08-repair-failed/after/Solution.java`**:

```java
// Kata 08: Repair a Failed History with a Deliberate Rewrite.
// A reviewed rewrite must be adopted everywhere at once: tamper the
// checksums to stand in for it, clear them deliberately, update, then
// prove the full history stands with zero stale markers left.
import java.sql.Connection; // => the handle every move and check shares
import java.sql.DriverManager; // => finds the PostgreSQL driver from the locked jars
import java.sql.ResultSet; // => walks the rows each verification query returns
import java.sql.Statement; // => carries the verification queries to the database
import java.util.Properties; // => carries the login without string-concatenated secrets
import liquibase.Liquibase; // => the entry point: configure, then update
import liquibase.Scope; // => silences progress narration for deterministic goldens
import liquibase.database.Database; // => Liquibase's view of our PostgreSQL connection
import liquibase.database.DatabaseFactory; // => picks the PostgreSQL implementation from the URL
import liquibase.database.jvm.JdbcConnection; // => adapts our JDBC handle to Liquibase
import liquibase.resource.DirectoryResourceAccessor; // => the current file-based changelog accessor
import liquibase.ui.LoggerUIService; // => reroutes progress lines into the silenced log

public class Solution {

  // => one public class per file, named after the file
  static Connection connect() throws Exception {
    // => the harness starts PostgreSQL 18 and publishes these variables
    String host = System.getenv().getOrDefault("PGHOST", "localhost");
    // => default keeps local experimentation working outside the harness
    String url = "jdbc:postgresql://" + host + ":5432/postgres";
    // => trust auth accepts any password, so only the user matters
    Properties props = new Properties();
    // => Properties carries the login without string-concatenated secrets
    props.setProperty("user", System.getenv().getOrDefault("PGUSER", "postgres"));
    // => DriverManager finds the PostgreSQL driver from the locked jars
    return DriverManager.getConnection(url, props);
  } // => connect is the only place that knows connection details

  // => the rewrite story runs update, tamper, clear, and update again, so
  // => one quiet runner covers all four moves in the same scope shape
  static void runQuiet(Liquibase liquibase, String move) throws Exception {
    // => the LOGGER service reroutes progress lines into the silenced JUL log
    Scope.child(
      java.util.Collections.singletonMap(Scope.Attr.ui.name(), new LoggerUIService()),
      // => the lambda runs inside the scope; main still throws Exception
      () -> {
        // => the move name selects the Liquibase operation below
        if (move.equals("clear")) {
          // => wipe stored checksums so the rewrite recomputes them
          liquibase.clearCheckSums();
        } else {
          // => apply whatever the history still lacks, recomputing checks
          liquibase.update("");
        } // => clear-then-update accepts the deliberate rewrite as one story
      }
    );
    // => every move stays inside the silenced scope, so goldens stay clean
  } // => quiet moves keep golden output identical on the harness double run

  // => a fresh kata slate keeps this solution deterministic on double runs
  static void resetDemo(Connection conn) throws Exception {
    // => cleared checksums persist, so every run starts clean
    conn.setAutoCommit(false);
    // => manual commit makes the kata reset explicit and replayable
    try (Statement st = conn.createStatement()) {
      // => one statement serves the whole reset
      st.execute("DROP TABLE IF EXISTS meters");
      // => dropping the rewritten tables removes the previous run's evidence
      st.execute("DROP TABLE IF EXISTS dials");
      // => both tables go, so the rewrite below runs them fresh
    } // => the next rewrite always meets an empty history for our changesets
    clearHistory(conn);
    // => forgetting past rewrites lets this run accept its own fresh
    conn.commit();
    // => committing the reset makes the fresh rewrite that follows honest
  } // => reset-then-rewrite prints identical lines on the harness double run

  public static void main(String[] args) throws Exception {
    // => silence JUL so the LOGGER service lines below disappear too
    java.util.logging.LogManager.getLogManager().reset();
    // => the entry point the harness runs
    try (Connection conn = connect()) {
      // => one connection serves the rewrite and its acceptance proof
      resetDemo(conn);
      // => a clean slate means the rewrite below behaves identically always
      Database database = DatabaseFactory.getInstance()
        // => the factory picks the PostgreSQL implementation from the URL
        .findCorrectDatabaseImplementation(new JdbcConnection(conn));
      // => JdbcConnection adapts our JDBC handle to Liquibase's database API
      Liquibase liquibase = new Liquibase(
        // => two kata changesets: the rewrite story plays out on both
        "changelog.sql",
        // => DirectoryResourceAccessor is the current file-based accessor
        new DirectoryResourceAccessor(new java.io.File(".").getAbsoluteFile()),
        // => rooting at the kata directory keeps changelogs beside the program
        database
      );
      runQuiet(liquibase, "update");
      // => both kata changesets apply against the clean slate first
      conn.commit();
      // => committing pins the history rows the rewrite below will clear
      try (Statement st = conn.createStatement()) {
        // => the deliberate rewrite starts by invalidating the stored checks
        st.executeUpdate("UPDATE databasechangelog SET md5sum = '9:rewritten'");
        // => rewriting every checksum stands in for the reviewed file rewrite
        conn.commit();
        // => the rewritten rows persist, so the clear below must confront them
      } // => rewrites are deliberate: reviewed, agreed, and recorded as such
      runQuiet(liquibase, "clear");
      // => clearing wipes the stored values; the file is now the truth
      runQuiet(liquibase, "update");
      // => the update recomputes checksums and accepts the rewritten file
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog")
      ) {
        // => the accepted rewrite kept both history rows in place
        rs.next();
        System.out.println("history rows after repair: " + rs.getInt(1));
        // => Output: history rows after repair: 2
      } // => two rows prove the rewrite was accepted, not re-applied
      try (
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT count(*) FROM databasechangelog WHERE md5sum = '9:rewritten'")
      ) {
        // => no rewritten marker may survive the clear-and-recompute
        rs.next();
        System.out.println("stale rewritten checksums: " + rs.getInt(1));
        // => Output: stale rewritten checksums: 0
        // => a rerun rewrites, clears, and accepts identically again
      } // => zero stale rows prove fresh checksums replaced every rewrite
    } // => closing the connection ends the kata with history repaired cleanly
  } // => main rewrites deliberately, then proves the rewrite was accepted

  // => the history table may not exist before the kata update, so forgetting
  // => our rows is guarded by an existence check on every run
  static void clearHistory(Connection conn) throws Exception {
    // => information_schema tells whether any history exists to forget
    try (
      Statement check = conn.createStatement();
      // => a separate statement keeps the check isolated from the delete
      ResultSet rs = check.executeQuery(
        "SELECT count(*) FROM information_schema.tables " + "WHERE table_name = 'databasechangelog'"
      )
    ) {
      // => the query returns exactly one row with exactly one number
      rs.next();
      // => forgetting runs only where a history table already exists
      if (rs.getInt(1) > 0) {
        // => deleting only our own rows leaves every other course untouched
        try (Statement forget = conn.createStatement()) {
          // => the delete runs only after the check proved the table exists
          forget.execute("DELETE FROM databasechangelog WHERE author = 'kata'");
        } // => a missing table means a fresh database: nothing to forget
      } // => the guard keeps the first run as clean as the fiftieth
    } // => guarded forgetting keeps resets replayable on double runs
  } // => helpers that verify stay separate from code that migrates
}
```

**`drilling/code/kata-08-repair-failed/changelog.sql`**:

```sql
-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-meters
-- => the first rewritten changeset creates the meters table
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => meter names are required from the first migration
);

-- rollback DROP TABLE meters;
-- => dropping the table reverses exactly what this changeset built

-- changeset kata:002-make-dials
-- => the second rewritten changeset creates the dials table
CREATE TABLE dials (
  id SERIAL PRIMARY KEY,
  -- => dials get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => dial names are required from the first migration
);

-- rollback DROP TABLE dials;
-- => each changeset carries its own reverse, independent of its neighbours
```

**Output** (`drilling/code/kata-08-repair-failed/expected/main.stdout.txt`):

```text
history rows after repair: 2
stale rewritten checksums: 0
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check only what you have actually done in a database, not what you have read.

1. (co-01) I can name a changeset so its author, id, and filepath follow the contract.

2. (co-01) I can order changelogs with numeric prefixes so parallel work merges without negotiation.

3. (co-02) I can write a rollback block that reverses a raw SQL change.

4. (co-02) I can restore deleted rows with a data rollback.

5. (co-03) I can read `DATABASECHANGELOG` and state exactly what ran, in order.

6. (co-03) I can compare two environments' histories and name the difference.

7. (co-04) I can land conflicting branch changesets into one ordered history.

8. (co-04) I can explain why prefix gaps are legal and what they record.

9. (co-05) I can guard a backfill so reruns change nothing.

10. (co-06) I can decide when a migration needs a backfill versus a schema-only change.

11. (co-06) I can prove a backfill with a zero-leftover assertion.

12. (co-07) I can split a breaking change into expand, bridge, contract.

13. (co-07) I can time contraction using reader monitoring, not guesses.

14. (co-08) I can roll back one changeset and prove its history row is gone.

15. (co-08) I can refuse a rollback that has no plan instead of half-reversing.

16. (co-09) I can diagnose from history first: boundary ids, then metadata, then fix.

17. (co-09) I can detect drift with `diff` despite passing validation.

18. (co-10) I can baseline a legacy database without touching its rows.

19. (co-10) I can squash old migrations into one baseline for a new environment.

20. (co-11) I can run checksum validation that fails deploys on edited files.

21. (co-12) I can choose per-changeset transactions and opt out where the database forbids them.

22. (co-13) I can promote with identical validate-update-test steps everywhere.

23. (co-14) I can resolve branch conflicts by replacing the duplicate with surviving value.

24. (co-15, co-16) I can prove concurrent runners apply exactly once via lock plus summed totals, and verify every migration with an automated check.

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Explain each aloud before reading.

### E1: Why append-only history instead of editing an applied changeset in place?

Rejected alternative: Editing rewrites the past every environment already recorded; checksums would diverge everywhere.

<details><summary>Model answer</summary>

Because the history table is shared truth: a forward fix keeps all environments converging, while an edit forks them irreparably.

</details>

### E2: Why explicit rollback blocks instead of auto-reversing raw SQL?

Rejected alternative: Auto-inference would guess the reverse of arbitrary statements and sometimes guess wrong, silently.

<details><summary>Model answer</summary>

Because only the author knows the true reverse of raw SQL; a declared block makes the reverse reviewable, while inference would hide it.

</details>

### E3: Why backfill in the changelog instead of a follow-up script?

Rejected alternative: A separate script runs outside changelog ordering and may run twice or never.

<details><summary>Model answer</summary>

Because the changeset's transaction and history entry make the data change as ordered and auditable as the schema change.

</details>

### E4: Why `changeLogSync` instead of replaying legacy DDL as changesets?

Rejected alternative: Legacy DDL rarely replays cleanly — data, permissions, and dead ends accumulate over years.

<details><summary>Model answer</summary>

Because syncing stamps the result without re-executing history nobody can reproduce.

</details>

### E5: Why validate on every promotion instead of only in CI?

Rejected alternative: CI checks the branch's files against a test database, not the release files against production's history.

<details><summary>Model answer</summary>

Because each environment's history differs, only per-environment validation proves the files match that database.

</details>

### E6: Why short changesets instead of one release file?

Rejected alternative: One file holds the history lock longer, fails as a unit, and reviews as a wall of SQL.

<details><summary>Model answer</summary>

Because short changesets bound lock time, localize failures, and let reviewers actually review.
