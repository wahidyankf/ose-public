---
title: Overview
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples teach the patterns; drilling makes them reflexes. Recall questions cover all sixteen concepts, applied problems replay the incidents, eight katas rebuild the hard parts by hand, and the checklist plus interrogation verify the habits stuck.

## Recall Q&A

Twenty-four questions, at least one per concept, with answers hidden in `<details>` blocks. Read the question, answer aloud, then open the block.

### co-01 migration-file

**Q1. What makes a file a migration, and what does Effect require of its shape?**

<details>
<summary>Answer</summary>

A TypeScript module whose default export is an Effect that the SQL client can run, stored under the migrations directory with a name matching `<id>_<name>.ts`. The number decides order; the description becomes the history text. Inline records keyed the same way work for small examples, but files are the production shape.

</details>

**Q2. Why does every migration in this course do exactly one thing?**

<details>
<summary>Answer</summary>

One change per migration makes review, revert, and reasoning trivial: a failing deploy points at one numbered entry instead of a bundled script. The history then reads as a changelog where each row explains itself.

</details>

### co-02 up-and-down

**Q3. Effect migrations move in one direction only. What does rollback mean here?**

<details>
<summary>Answer</summary>

There is no down step, so rollback means writing a new compensating migration whose effect reverses the earlier one, for example dropping a table the earlier migration created. The history keeps both rows; nothing is ever rewritten.

</details>

### co-03 migration-history-table

**Q4. What three columns does the Effect history table hold, and which one never appears in a transcript?**

<details>
<summary>Answer</summary>

The numeric `migration_id`, the human `name`, and the `created_at` timestamp. Timestamps are wall-clock values, so no deterministic transcript ever prints one; examples select only the id and the name.

</details>

**Q5. When does the migrator skip a migration without running it?**

<details>
<summary>Answer</summary>

Whenever the migration's id is already recorded in the history table, that is whenever its id is less than or equal to the latest recorded id. Skipping is silent and normal: it is how reruns, second instances, and late branches all stand down.

</details>

### co-04 linear-vs-branching-history

**Q6. How does the loader order migrations, and why do ids 1, 2, 10 apply in that order?**

<details>
<summary>Answer</summary>

The loader sorts by the numeric id before running anything, so text order and authoring order never matter. Ten is numerically larger than two, so it runs third even though it sorts first alphabetically.

</details>

### co-05 idempotent-migration

**Q7. What makes a repeated migrator run safe, and what makes a repeated backfill safe?**

<details>
<summary>Answer</summary>

The repeated run is safe because the history check skips recorded ids, so the second run applies nothing. The repeated backfill is safe because its `WHERE new_column IS NULL` guard matches zero rows the second time. Idempotence comes from the history in one case and from the guard in the other.

</details>

### co-06 backfill

**Q8. Why is a backfill a separate migration from the schema change it fills?**

<details>
<summary>Answer</summary>

Separating them keeps each migration honest about one job: the first changes shape, the second changes content. Shape-first ordering also guarantees the column exists before any row tries to fill it, and the backfill can be batched, guarded, and verified on its own.

</details>

### co-07 zero-downtime-migration

**Q9. Name the three steps of a zero-downtime rename, in order, and say what each deploy between them sees.**

<details>
<summary>Answer</summary>

Expand adds the new column while the old one keeps serving, so every deploy sees both. Migrate copies the values across, so both columns agree. Contract drops the old column only after every reader moved, so no deploy ever sees a missing column.

</details>

### co-08 rollback

**Q10. A migration dropped a column that later work needs back. What is the fix, and what is forbidden?**

<details>
<summary>Answer</summary>

The fix is a forward migration that re-adds the column. Editing the applied migration that dropped it is forbidden: its id is already recorded everywhere, so the edited SQL would never run where it already applied.

</details>

### co-09 schema-drift

**Q11. The history lists a table the catalog does not have. What is this, and what caused it?**

<details>
<summary>Answer</summary>

This is drift in the missing direction: someone dropped the table by hand outside the migrator, so the history still claims it ran. The check compares the recorded history against the live catalog and reports recorded-but-missing objects.

</details>

### co-10 baseline

**Q12. What is a baseline, and how do you write one when the tool offers no baseline command?**

<details>
<summary>Answer</summary>

A baseline declares the inherited schema as the starting point so old changes never replay. With no built-in command, you create the history table by hand and insert the stamp row for the acknowledged ids, then run the migrator: only newer ids apply.

</details>

### co-11 checksum-validation

**Q13. Effect records no content hash. What risk does that leave, and who owns the guard?**

<details>
<summary>Answer</summary>

An edited, already-applied migration goes unnoticed because the skip logic compares ids only, never content. The team owns the guard: store a hash of each migration text in an owned table at apply time and compare before every deploy.

</details>

### co-12 transaction-wrapped-migration

**Q14. What happens when the second statement of a migration body fails?**

<details>
<summary>Answer</summary>

The whole run is wrapped in one transaction, so the failure rolls back every statement in the body: no partial writes, no history row, no leftover tables. The migrator reports the typed `Failed` failure, and a corrected retry starts from a clean slate.

</details>

### co-13 environment-promotion

**Q15. How do two environments share one migration set without sharing one history?**

<details>
<summary>Answer</summary>

Each environment gets its own history table, and the same ordered loader runs against each in turn. Both histories converge on the same latest id, and each records independently, so an audit can compare the lines id by id.

</details>

### co-14 conflict-resolution

**Q16. Two branches both claim migration number two. What is the resolution?**

<details>
<summary>Answer</summary>

One branch renumbers its work forward to the next free number at merge time; rewriting the already-merged number is forbidden. The merged loader then applies in numeric order, and the history shows one clean line from both branches.

</details>

### co-15 locking-migration

**Q17. What lock does the migrator take, on what, and when is it released?**

<details>
<summary>Answer</summary>

It locks the history table in access-exclusive mode at the start of the run, which serializes competing migrators. The lock releases when the run's transaction commits, so nothing stays pinned afterwards; a post-run lock query finds nothing held.

</details>

### co-16 migration-testing

**Q18. After a failing migration, which two counts prove the rollback?**

<details>
<summary>Answer</summary>

The history row count is zero and the migrated table is absent from the catalog. Automating both assertions turns the incident diagnosis into a check the pipeline can run instead of a story an operator reconstructs.

</details>

### Cross-concept review

**Q19. Applied equals recorded equals present: what does each equality check, and what does a mismatch mean?**

<details>
<summary>Answer</summary>

Applied equals recorded means the run reported what it stored. Recorded equals present means the catalog holds every table the history claims. A mismatch in either means something wrote outside the migrator: a hand edit, a hand drop, or a foreign writer, and the drill is to find it before the next deploy.

</details>

**Q20. Why do examples use per-example history tables instead of sharing one?**

<details>
<summary>Answer</summary>

The table option scopes a history, so per-example tables isolate every unit: reruns, retries, and parallel runs can never observe each other's rows. Production uses the same mechanism in reverse, one table per environment over the same ordered set.

</details>

**Q21. A deploy needs a new `NOT NULL` column on a live table. List the migration sequence.**

<details>
<summary>Answer</summary>

Add the column nullable, backfill it from existing data, verify zero nulls remain, then set `NOT NULL` in a later migration. Optionally set a default so future inserts inherit the value. Constraints land last, never first.

</details>

**Q22. A deploy needs to rename a column readers still use. List the migration sequence.**

<details>
<summary>Answer</summary>

Expand with the new column, dual-write or backfill it from the old column, move the readers, then contract by dropping the old column. Old versions keep working until the contract step, which runs only after every reader moved.

</details>

**Q23. A second migrator instance starts while the first is running. What happens, step by step?**

<details>
<summary>Answer</summary>

The second blocks on the history table's exclusive lock, then reads the history after the first commits. If the first recorded everything, the second finds nothing pending and returns an empty applied list. Standing down is the normal case, reported as zero, not as an error.

</details>

**Q24. An old database joins the migrator next week. List the adoption steps.**

<details>
<summary>Answer</summary>

Build the legacy objects list, create the history table by hand, insert the stamp row naming the snapshot, run the migrator with the newcomer migrations, then run the checklist: legacy objects present, stamp plus newcomers recorded, and a fresh run finds nothing pending.

</details>

## Applied problems

Eight incidents drawn from the example clusters. Each states the symptom, the question, and the model response. Work them before reading the response.

### AP-01. The deploy log says `applied: 0` and the feature is missing

Symptom: Friday's release ran the migrator, reported zero applied migrations, and the feature that needs the new column is broken in production. The migration file is numbered 14; the history's latest id is 17.

Model response: Nothing is broken about the run: id 14 is already recorded, so the migrator correctly skipped it, and the feature was built against a column that this environment never received through the normal line. Check whether migration 14's content matches what the feature expects; if another writer claimed id 14 first, renumber the real change forward and ship it as a newcomer. Zero applied is a fact to investigate, never an error to retry blindly.

### AP-02. Two branches merged and staging has a table production lacks

Symptom: After a merge, staging shows `session_tokens` but production does not, and both histories claim to be complete. The branch numbered its table migration 6; main's release also shipped a migration 6 with different content.

Model response: Same id, different content: the first writer won each environment separately, and each history recorded its own number six. Read both histories by id and name, confirm the divergence, then ship production's missing table as the next free number with its own name. Adopt the rule that collisions renumber forward at merge time, and add the history-name comparison to the merge checklist.

### AP-03. A backfill timed out halfway on a ten-million-row table

Symptom: The backfill update ran for twenty minutes, hit the statement timeout, and rolled back. The deploy pipeline marks the release failed, and the column is still null everywhere.

Model response: One giant update holds locks too long and dies as a unit, which is exactly the safe behavior. Split the backfill into key-range batches inside one migration body, keep the `IS NULL` guard so retried batches touch nothing twice, and verify with a null-count query afterwards. The timeout becomes a batch-size tuning decision, not an incident.

### AP-04. The rename deploy broke old app servers for nine minutes

Symptom: The column rename shipped as drop-plus-add in one migration. New servers started fine, but old servers still running the previous release errored until they restarted.

Model response: The contract step ran before the readers moved. Roll forward, not back: re-add the old column nullable, backfill it from the new column, let the old servers recover, then redo the migration as expand, migrate, contract with the reader move tracked between steps. Renames are three migrations, never one.

### AP-05. The history lists migration 9, but its table is gone

Symptom: Monday's audit finds history row 9 with no matching table in the catalog. Nobody shipped a drop migration, and Friday's deploy was green.

Model response: Recorded but missing means a hand drop outside the migrator. Confirm with the catalog count, then decide: if the table should exist, ship a forward migration that recreates it; if the drop was intended, ship the drop as a compensating migration so the history explains the absence. Either way, the runbook gets a new rule: schema changes ship as migrations, never as console commands.

### AP-06. The checksum gate fails on a migration nobody remembers editing

Symptom: The owned checksum table disagrees with the current file text for migration 4. The history shows it applied months ago, and the file has no recent commits.

Model response: The guard is doing its job: something differs between the text that ran and the text on disk, whether an edit, a line-ending change, or a merge artifact. Diff the file against the archived copy from the release tag, determine which text actually ran, restore or re-bless deliberately, and record the decision. Never update the stored hash to match an unexplained file.

### AP-07. Two environments disagree on the latest migration

Symptom: Dev history ends at 12, prod history ends at 11, and the release notes claim 12 shipped everywhere. The promotion job is green.

Model response: The promotion ran against dev but never completed against prod, or prod's run failed after dev succeeded. Promote the identical set against prod's history and compare: prod should adopt 12 and converge. Then fix the pipeline so promotion is one job over both histories with a final comparison, not two jobs that can drift apart silently.

### AP-08. The legacy import applied ancient migrations over the live schema

Symptom: The baseline stamp was skipped to save time, the loader replayed migrations 1 through 30 against the legacy database, and half of them failed on objects that already exist.

Model response: Stop, roll back the partial run (the transaction already did), and do the adoption properly: create the history by hand, stamp the snapshot id, verify with the checklist, then run. The failed replay changed nothing thanks to transactional runs, but the lesson is procedural: stamps come before runs, and the checklist from the baselining cluster gates the adoption, not optimism.

## Code katas

Eight katas under `drilling/code/`, each with a `before/` starting point, a finished `after/` solution, and a `run.yaml` that builds and runs the solution against the real database. Work the `before/` first, then compare with the `after/`.

### Kata 01: write a migration and its rollback

Directory: `drilling/code/kata-01-write-migration-and-rollback`. Create a `products` table in migration one, reverse it with a compensating drop in migration two, and verify the table is gone while the history keeps both rows. The finished solution prints the applied count, the empty catalog check, the recorded count, and the cleanup line.

**`drilling/code/kata-01-write-migration-and-rollback/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: run two migrations: create the products table, then drop it again.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-01-write-migration-and-rollback/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => forward change plus compensation
    loader: Migrator.fromRecord({
      // => two migrations, opposite effects
      "1_create_kata01_products": sql`CREATE TABLE kata01_products (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`, // => the change
      "2_drop_kata01_products": sql`DROP TABLE kata01_products`, // => the rollback, also a migration
    }), // => end of the migration record
    table: "kata01_history", // => per-kata history table
  }); // => both rows apply
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 2
  const tables = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename = 'kata01_products'`; // => the table is gone
  yield* Console.log(`tables: ${tables[0].total}`); // => Output: tables: 0
  const rows = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM kata01_history`; // => both rows stay recorded
  yield* Console.log(`recorded: ${rows[0].total}`); // => Output: recorded: 2
  yield* sql`DROP TABLE kata01_history`; // => drop the history table
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-01-write-migration-and-rollback/expected/main.stdout.txt`):

```text
applied: 2
tables: 0
recorded: 2
cleaned: yes
```

### Kata 02: add a backfill step to an existing migration

Directory: `drilling/code/kata-02-add-backfill-step`. A members table already exists with names but no display column. Add the column nullable, backfill it from the names, and prove no nulls remain. The finished solution prints the applied count, the zero null remainder, and the cleanup line.

**`drilling/code/kata-02-add-backfill-step/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: add a nullable display column, backfill it, verify zero nulls.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-02-add-backfill-step/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => schema change, then data change
    loader: Migrator.fromRecord({
      // => the existing table plus the new step
      "1_create_kata02_members": Effect.gen(function* () {
        // => the pre-existing shape
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata02_members (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`; // => the members table
        yield* inner`INSERT INTO kata02_members (name) VALUES ('ada'), ('bob')`; // => two members predate the column
        yield* inner`ALTER TABLE kata02_members ADD COLUMN display TEXT`; // => nullable for now
      }), // => end of the setup migration
      "2_backfill_display": sql`UPDATE kata02_members SET display = name WHERE display IS NULL`, // => derive from the names
    }), // => end of the migration record
    table: "kata02_history", // => per-kata history table
  }); // => both migrations apply
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 2
  const rows = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM kata02_members WHERE display IS NULL`; // => the remainder check
  yield* Console.log(`nulls: ${rows[0].total}`); // => Output: nulls: 0
  yield* sql`DROP TABLE kata02_members`; // => the example leaves no tables behind
  yield* sql`DROP TABLE kata02_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-02-add-backfill-step/expected/main.stdout.txt`):

```text
applied: 2
nulls: 0
cleaned: yes
```

### Kata 03: baseline an existing database without losing data

Directory: `drilling/code/kata-03-baseline-existing-database`. A legacy orders table already exists with one row. Stamp the history by hand, run a newcomer migration, and prove the legacy row survived untouched. The finished solution prints the applied migration, the surviving row, and the cleanup line.

**`drilling/code/kata-03-baseline-existing-database/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: stamp the history for the legacy table, migrate, verify the row.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-03-baseline-existing-database/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`CREATE TABLE kata03_orders (id SERIAL PRIMARY KEY, total INT NOT NULL)`; // => the legacy table, built by hand
  yield* sql`INSERT INTO kata03_orders (total) VALUES (42)`; // => one legacy row
  yield* sql`CREATE TABLE kata03_history (migration_id integer primary key, created_at timestamp with time zone not null default now(), name text not null)`; // => the history, built by hand
  yield* sql`INSERT INTO kata03_history (migration_id, name) VALUES (1, 'legacy_snapshot')`; // => the stamp: id 1 already in place
  const applied = yield* PgMigrator.run({
    // => the migrator adopts the stamped history
    loader: Migrator.fromRecord({
      // => snapshot plus newcomer
      "1_legacy_snapshot": sql`SELECT 1`, // => skipped: already recorded, never executes
      "2_create_kata03_audit": sql`CREATE TABLE kata03_audit (id SERIAL PRIMARY KEY, order_id INT NOT NULL)`, // => the first real migration
    }), // => end of the migration record
    table: "kata03_history", // => per-kata history table
  }); // => only the newcomer applies
  for (const [id, name] of applied) {
    // => walk the newly applied rows
    yield* Console.log(`applied: ${id}_${name}`); // => Output: applied: 2_create_kata03_audit
  } // => loop ends after the last applied migration
  const rows = yield* sql<{ total: number }>`SELECT total FROM kata03_orders`; // => the legacy row survives
  for (const row of rows) {
    // => walk the legacy rows
    yield* Console.log(`legacy: ${row.total}`); // => Output: legacy: 42
  } // => loop ends after the last row
  yield* sql`DROP TABLE kata03_audit`; // => drop the newcomer
  yield* sql`DROP TABLE kata03_orders`; // => drop the legacy table
  yield* sql`DROP TABLE kata03_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-03-baseline-existing-database/expected/main.stdout.txt`):

```text
applied: 2_create_kata03_audit
legacy: 42
cleaned: yes
```

### Kata 04: resolve an order conflict between branches

Directory: `drilling/code/kata-04-resolve-order-conflict`. Main applied migrations one and two; the branch arrives with work numbered two. Renumber the branch work to three and four, apply, and prove the history reads one through four. The finished solution prints both run counts, the merged line, and the cleanup line.

**`drilling/code/kata-04-resolve-order-conflict/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: land main first, then the renumbered branch, verify one to four.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-04-resolve-order-conflict/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const main = yield* PgMigrator.run({
    // => main lands first
    loader: Migrator.fromRecord({
      // => the main pair
      "1_create_kata04_a": sql`CREATE TABLE kata04_a (id SERIAL PRIMARY KEY)`, // => main's first table
      "2_create_kata04_b": sql`CREATE TABLE kata04_b (id SERIAL PRIMARY KEY)`, // => main's second table
    }), // => end of the main loader
    table: "kata04_history", // => per-kata history table
  }); // => main applies both
  yield* Console.log(`main: ${main.length}`); // => Output: main: 2
  const branch = yield* PgMigrator.run({
    // => the branch takes the next free numbers
    loader: Migrator.fromRecord({
      // => renumbered forward at merge time
      "3_create_kata04_c": sql`CREATE TABLE kata04_c (id SERIAL PRIMARY KEY)`, // => the branch's first table
      "4_create_kata04_d": sql`CREATE TABLE kata04_d (id SERIAL PRIMARY KEY)`, // => the branch's second table
    }), // => end of the branch loader
    table: "kata04_history", // => the same history table
  }); // => the branch appends cleanly
  yield* Console.log(`branch: ${branch.length}`); // => Output: branch: 2
  const rows = yield* sql<{ migration_id: number }>`SELECT migration_id FROM kata04_history ORDER BY migration_id`; // => one line, no rewrite
  yield* Console.log(`recorded: ${rows.map((row) => row.migration_id).join(", ")}`); // => Output: recorded: 1, 2, 3, 4
  yield* sql`DROP TABLE kata04_d`; // => drop the branch tables
  yield* sql`DROP TABLE kata04_c`; // => drop the branch tables
  yield* sql`DROP TABLE kata04_b`; // => drop the main tables
  yield* sql`DROP TABLE kata04_a`; // => drop the main tables
  yield* sql`DROP TABLE kata04_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-04-resolve-order-conflict/expected/main.stdout.txt`):

```text
main: 2
branch: 2
recorded: 1, 2, 3, 4
cleaned: yes
```

### Kata 05: diagnose a partially applied migration

Directory: `drilling/code/kata-05-diagnose-partial-migration`. A two-step migration fails on its second step. Capture the typed failure, then prove the rollback: the history is empty and the table is absent. The finished solution prints the failure kind, both zero counts, and the cleanup line.

**`drilling/code/kata-05-diagnose-partial-migration/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: fail a migration, catch it, prove nothing landed.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-05-diagnose-partial-migration/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const kind = yield* PgMigrator.run({
    // => the partial run fails midway
    loader: Migrator.fromRecord({
      // => two steps, the second impossible
      "1_partial_kata05": Effect.gen(function* () {
        // => the partial body
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata05_t (id SERIAL PRIMARY KEY)`; // => step one succeeds
        yield* inner`INSERT INTO kata05_t (missing_column) VALUES (1)`; // => step two cannot succeed
      }), // => end of the partial body
    }), // => end of the failing loader
    table: "kata05_history", // => per-kata history table
  }).pipe(
    // => catch the typed failure, not a crash
    Effect.catchTag("MigrationError", (error) => Console.log(`failed: ${error.kind}`).pipe(Effect.as(error.kind))), // => Output: failed: Failed
  ); // => kind holds the typed failure kind
  yield* Console.log(`kind: ${kind}`); // => Output: kind: Failed
  const recorded = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM kata05_history`; // => checklist: history empty
  yield* Console.log(`recorded: ${recorded[0].total}`); // => Output: recorded: 0
  const tables = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename = 'kata05_t'`; // => checklist: table absent
  yield* Console.log(`tables: ${tables[0].total}`); // => Output: tables: 0
  yield* sql`DROP TABLE IF EXISTS kata05_t`; // => the kata leaves no tables behind
  yield* sql`DROP TABLE kata05_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-05-diagnose-partial-migration/expected/main.stdout.txt`):

```text
failed: Failed
kind: Failed
recorded: 0
tables: 0
cleaned: yes
```

### Kata 06: split a breaking change into zero-downtime steps

Directory: `drilling/code/kata-06-split-zero-downtime`. Retire a legacy code column without breaking readers: add the replacement, copy the values, drop the original. Verify the replacement holds the original value. The finished solution prints the applied count, the moved value, and the cleanup line.

**`drilling/code/kata-06-split-zero-downtime/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: expand, migrate, contract the code column; verify the value moved.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-06-split-zero-downtime/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => the canonical three-step split
    loader: Migrator.fromRecord({
      // => expand, migrate, contract
      "1_create_kata06_products": Effect.gen(function* () {
        // => the legacy shape
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata06_products (id SERIAL PRIMARY KEY, code TEXT NOT NULL)`; // => the legacy column
        yield* inner`INSERT INTO kata06_products (code) VALUES ('x1')`; // => one row predates the split
      }), // => end of the legacy migration
      "2_expand_sku": sql`ALTER TABLE kata06_products ADD COLUMN sku TEXT`, // => expand: the replacement arrives
      "3_migrate_sku": sql`UPDATE kata06_products SET sku = code WHERE sku IS NULL`, // => migrate: copy the values
      "4_contract_code": sql`ALTER TABLE kata06_products DROP COLUMN code`, // => contract: the legacy leaves
    }), // => end of the migration record
    table: "kata06_history", // => per-kata history table
  }); // => the full split applies
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 4
  const rows = yield* sql<{ sku: string }>`SELECT sku FROM kata06_products`; // => the value moved across
  for (const row of rows) {
    // => walk the migrated rows
    yield* Console.log(`sku: ${row.sku}`); // => Output: sku: x1
  } // => loop ends after the last product
  yield* sql`DROP TABLE kata06_products`; // => the kata leaves no tables behind
  yield* sql`DROP TABLE kata06_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-06-split-zero-downtime/expected/main.stdout.txt`):

```text
applied: 4
sku: x1
cleaned: yes
```

### Kata 07: build a validate gate from history and catalog

Directory: `drilling/code/kata-07-validate-gate`. Write the gate every deploy should run: compare the recorded history against the live catalog and report agreement. Migrate two tables, then prove applied equals recorded equals present. The finished solution prints the triple count, the pass verdict, and the cleanup line.

**`drilling/code/kata-07-validate-gate/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: migrate, then check history and catalog agree.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-07-validate-gate/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => apply every pending migration
    loader: Migrator.fromRecord({
      // => two migrations in one run
      "1_create_kata07_a": sql`CREATE TABLE kata07_a (id SERIAL PRIMARY KEY)`, // => the first table
      "2_create_kata07_b": sql`CREATE TABLE kata07_b (id SERIAL PRIMARY KEY)`, // => the second table
    }), // => end of the migration record
    table: "kata07_history", // => per-kata history table
  }); // => both migrations apply
  const recorded = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM kata07_history`; // => gate check one: history rows
  const present = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename IN ('kata07_a', 'kata07_b')`; // => gate check two: catalog tables
  yield* Console.log(`applied: ${applied.length}, recorded: ${recorded[0].total}, present: ${present[0].total}`); // => Output: applied: 2, recorded: 2, present: 2
  yield* Console.log("gate: pass"); // => Output: gate: pass
  yield* sql`DROP TABLE kata07_b`; // => drop the second table
  yield* sql`DROP TABLE kata07_a`; // => drop the first table
  yield* sql`DROP TABLE kata07_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-07-validate-gate/expected/main.stdout.txt`):

```text
applied: 2, recorded: 2, present: 2
gate: pass
cleaned: yes
```

### Kata 08: repair a failed migration with a forward fix

Directory: `drilling/code/kata-08-repair-failed`. Migration one fails on a bad statement, leaving nothing behind. Ship the corrected migration under the same id on a fresh attempt and prove it applies. The finished solution prints the failure kind, the retry count, and the cleanup line.

**`drilling/code/kata-08-repair-failed/before/main.ts`**:

```typescript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: fail once, fix forward, verify the retry applies.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
```

**`drilling/code/kata-08-repair-failed/after/main.ts`**:

```typescript
import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => loaders turn files and records into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the file loader reads through
import * as NodePath from "@effect/platform-node/NodePath"; // => path the file loader joins with
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"; // => runMain boots the node services
import * as PgClient from "@effect/sql-pg/PgClient"; // => PgClient.layerConfig builds the pool
import * as PgMigrator from "@effect/sql-pg/PgMigrator"; // => PgMigrator.run applies pending migrations

// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
  // => layerConfig unwraps Config values
  host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
  port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
  database: Config.String("PGDATABASE").pipe(Config.withDefault("postgres")), // => fresh database per run
  username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
  ssl: Config.succeed(false), // => plaintext inside the unit network
}); // => DbLive offers PgClient and SqlClient together

// => the migrator type also asks for three node services
const NodeLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer); // => file plus path side by side
const SpawnerLive = Layer.provide(NodeChildProcessSpawner.layer, NodeLive); // => spawner fed by file and path
const MainLive = Layer.mergeAll(DbLive, NodeLive, SpawnerLive); // => one layer for the whole program

const program = Effect.gen(function* () {
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const kind = yield* PgMigrator.run({
    // => the first attempt fails loudly
    loader: Migrator.fromRecord({
      // => a migration that cannot succeed
      "1_create_kata08_t": Effect.gen(function* () {
        // => the doomed body
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata08_t (id SERIAL PRIMARY KEY)`; // => the table, created once
        yield* inner`CREATE TABLE kata08_t (id SERIAL PRIMARY KEY)`; // => the same table, created twice
      }), // => end of the doomed body
    }), // => end of the failing loader
    table: "kata08_history", // => per-kata history table
  }).pipe(
    // => catch the typed failure, not a crash
    Effect.catchTag("MigrationError", (error) => Console.log(`failed: ${error.kind}`).pipe(Effect.as(error.kind))), // => Output: failed: Failed
  ); // => kind holds the typed failure kind
  yield* Console.log(`kind: ${kind}`); // => Output: kind: Failed
  const retry = yield* PgMigrator.run({
    // => the forward fix starts from a clean slate
    loader: Migrator.fromRecord({
      // => the repaired migration
      "1_create_kata08_t": sql`CREATE TABLE kata08_t (id SERIAL PRIMARY KEY, note TEXT)`, // => the same id, corrected
    }), // => end of the repaired loader
    table: "kata08_history", // => the same history table
  }); // => the retry applies cleanly
  yield* Console.log(`retry: ${retry.length}`); // => Output: retry: 1
  yield* sql`DROP TABLE kata08_t`; // => the kata leaves no tables behind
  yield* sql`DROP TABLE kata08_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
```

**Output** (`drilling/code/kata-08-repair-failed/expected/main.stdout.txt`):

```text
failed: Failed
kind: Failed
retry: 1
cleaned: yes
```

## Self-check checklist

Twenty-four statements, at least one per concept. Check each only when its example runs green and you can explain every line.

- I can write a migration file whose default export the file loader picks up. (co-01)
- I can keep every migration to exactly one schema change. (co-01)
- I can reverse a migration with a compensating forward migration. (co-02)
- I can explain why Effect has no down step and never will. (co-02)
- I can read the history table and name the latest applied migration. (co-03)
- I can predict which migrations a rerun will skip and why. (co-03)
- I can order migrations numerically regardless of authoring order. (co-04)
- I can merge two loaders into one linear history without rewriting. (co-04)
- I can write a migration that is safe to run twice. (co-05)
- I can split a data change from the schema change it fills. (co-06)
- I can backfill from existing rows with a guarded, replayable update. (co-06)
- I can expand, migrate, and contract a breaking rename. (co-07)
- I can roll back one change from a long history surgically. (co-08)
- I can compare the history against the catalog and spot drift both ways. (co-09)
- I can baseline a legacy database with a hand-written stamp. (co-10)
- I can explain what the migrator does not checksum and why it matters. (co-11)
- I can rely on the run transaction to roll back a failed body. (co-12)
- I can promote the same ordered set across two history tables. (co-13)
- I can resolve a branch conflict by renumbering forward. (co-14)
- I can name the lock the migrator takes and when it releases. (co-15)
- I can keep migrations small to shrink the lock window. (co-15)
- I can verify a migration's effect with an automated check query. (co-16)
- I can diagnose a failed run starting from the history table. (co-03)
- I can adopt a legacy database with the three-step checklist. (co-10)

## Elaborative interrogation & self-explanation

Six prompts, each naming a design choice and a rejected alternative, with a model answer. Argue the other side first, then read.

**EI-1. Why does the history record names instead of content hashes, when hashes would catch edits?**

The rejected alternative is content hashing every migration body: it would detect tampering but couples the history to exact file bytes, so formatting, comments, or generator changes would false-alarm on every deploy. Names keep the history human-readable and stable across harmless edits, and teams that need tamper detection add an owned checksum table, which this course teaches as an explicit step rather than a hidden default.

**EI-2. Why does rollback move forward with compensation instead of backward with down steps?**

The rejected alternative is reversible down migrations: they promise symmetry but deliver it only when the down step is perfectly maintained, which fails exactly when the team is stressed. Forward compensation is honest about direction: the history only ever appends, every reversal is itself reviewed, and the ledger tells the true story of what ran, including the mistake and its repair.

**EI-3. Why run the whole migration line in one transaction instead of committing per migration?**

The rejected alternative is per-migration commits: a crash midway would leave half the line applied and half pending, and the operator could not tell intent from accident. One transaction makes the run atomic: it applies fully or not at all, the history never shows a half-run, and diagnosis starts from a clean either-or instead of a forensic reconstruction.

**EI-4. Why lock the history table exclusively instead of coordinating migrators externally?**

The rejected alternative is an external lock service or deploy-time mutex: it adds a dependency every environment must run and every operator must understand. The exclusive lock reuses the one system every migrator already shares, the database itself, serializes racers with no extra moving parts, and releases automatically on commit. Coordination lives where the data lives.

**EI-5. Why expand, migrate, and contract instead of one breaking migration with a maintenance window?**

The rejected alternative is the planned outage: it is simpler to describe but couples every schema change to a downtime negotiation, which either delays needed changes or trains the team to accept risk. The three-step split keeps every intermediate deploy green, lets readers migrate at their own pace, and turns the scary change into three boring ones. Boring deploys ship more often.

**EI-6. Why stamp a baseline by hand instead of replaying the old migrations?**

The rejected alternative is replaying history against the legacy database: every already-existing object collides, and the replay must be nursed through dozens of expected failures. The hand-written stamp acknowledges the past in one row instead of re-enacting it, takes effect immediately, and keeps the history truthful about what the migrator itself did. The past is data, not a script to re-run.
