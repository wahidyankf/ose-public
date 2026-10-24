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
  yield* sql`CREATE TABLE ex50_customers (id SERIAL PRIMARY KEY)`; // => the first legacy table, built by hand
  yield* sql`CREATE TABLE ex50_invoices (id SERIAL PRIMARY KEY)`; // => the second legacy table, built by hand
  yield* sql`CREATE TABLE ex50_history (migration_id integer primary key, created_at timestamp with time zone not null default now(), name text not null)`; // => the history, built by hand
  yield* sql`INSERT INTO ex50_history (migration_id, name) VALUES (1, 'full_snapshot')`; // => one stamp for the whole past
  const applied = yield* PgMigrator.run({
    // => the migrator adopts the stamped history
    loader: Migrator.fromRecord({
      // => snapshot plus newcomer
      "1_full_snapshot": sql`SELECT 1`, // => skipped: already recorded, never executes
      "2_create_ex50_new": sql`CREATE TABLE ex50_new (id SERIAL PRIMARY KEY)`, // => the genuinely new table
    }), // => end of the migration record
    table: "ex50_history", // => per-example history table
  }); // => only the newcomer applies
  for (const [id, name] of applied) {
    // => walk the newly applied rows
    yield* Console.log(`applied: ${id}_${name}`); // => Output: applied: 2_create_ex50_new
  } // => loop ends after the last applied migration
  yield* sql`DROP TABLE ex50_new`; // => drop the newcomer
  yield* sql`DROP TABLE ex50_invoices`; // => drop the second legacy table
  yield* sql`DROP TABLE ex50_customers`; // => drop the first legacy table
  yield* sql`DROP TABLE ex50_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
