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
  const applied = yield* PgMigrator.run({
    // => the merge lands at once
    loader: Migrator.fromRecord({
      // => contributions from both sides
      "1_create_ex59_a": sql`CREATE TABLE ex59_a (id SERIAL PRIMARY KEY)`, // => main's table
      "2_create_ex59_b": sql`CREATE TABLE ex59_b (id SERIAL PRIMARY KEY)`, // => main's second table
      "3_create_ex59_c": sql`CREATE TABLE ex59_c (id SERIAL PRIMARY KEY)`, // => the branch's table
      "4_create_ex59_d": sql`CREATE TABLE ex59_d (id SERIAL PRIMARY KEY)`, // => the branch's second table
    }), // => end of the migration record
    table: "ex59_history", // => per-example history table
  }); // => the merge applies fully
  // => one ordered list from two branches: the merge receipt
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 4
  const rows = yield* sql<{
    migration_id: number;
    name: string;
  }>`SELECT migration_id, name FROM ex59_history ORDER BY migration_id`; // => the merge receipt
  for (const row of rows) {
    // => walk the recorded history
    yield* Console.log(`history: ${row.migration_id}_${row.name}`); // => Output: history: 1_create_ex59_a
  } // => loop ends after the last history row
  yield* sql`DROP TABLE ex59_d`; // => drop the branch tables
  yield* sql`DROP TABLE ex59_c`; // => drop the branch tables
  yield* sql`DROP TABLE ex59_b`; // => drop the main tables
  yield* sql`DROP TABLE ex59_a`; // => drop the main tables
  yield* sql`DROP TABLE ex59_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
