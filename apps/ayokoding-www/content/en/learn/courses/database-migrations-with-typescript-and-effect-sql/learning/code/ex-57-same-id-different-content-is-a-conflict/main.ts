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
  // => the example narrative
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const first = yield* PgMigrator.run({
    // => our own migration lands first
    loader: Migrator.fromRecord({
      // => the early loader
      "1_create_ex57_a": sql`CREATE TABLE ex57_a (id SERIAL PRIMARY KEY)`, // => our table, recorded as id 1
    }), // => end of the early loader
    table: "ex57_history", // => per-example history table
  }); // => id 1 is ours
  yield* Console.log(`first: ${first.length}`); // => Output: first: 1
  // => id 1 is ours before the foreign writer arrives
  yield* sql`INSERT INTO ex57_history (migration_id, name) VALUES (2, 'branch_b_index')`; // => another writer claims id 2 between runs
  const applied = yield* PgMigrator.run({
    // => our loader meets the foreign row
    loader: Migrator.fromRecord({
      // => three migrations, one id taken
      "1_create_ex57_a": sql`SELECT 1`, // => skipped: already recorded, never re-executes
      "2_create_ex57_b": sql`CREATE TABLE ex57_b (id SERIAL PRIMARY KEY)`, // => skipped: the foreign row owns id 2
      "3_create_ex57_c": sql`CREATE TABLE ex57_c (id SERIAL PRIMARY KEY)`, // => applies normally
    }), // => end of the migration record
    table: "ex57_history", // => the same history table
  }); // => the loader's number two never runs
  for (const [id, name] of applied) {
    // => walk the newly applied rows
    yield* Console.log(`applied: ${id}_${name}`); // => Output: applied: 3_create_ex57_c
  } // => loop ends after the last applied migration
  const present = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename IN ('ex57_a', 'ex57_c')`; // => ours both stand
  yield* Console.log(`present: ${present[0].total}`); // => Output: present: 2
  const missing = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename = 'ex57_b'`; // => the skipped table never appears
  yield* Console.log(`missing: ${missing[0].total}`); // => Output: missing: 0
  // => the skipped table never appears: the foreign row owns its id
  yield* sql`DROP TABLE ex57_c`; // => drop the applied tables
  yield* sql`DROP TABLE ex57_a`; // => drop the applied tables
  yield* sql`DROP TABLE ex57_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
