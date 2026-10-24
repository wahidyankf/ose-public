import * as Config from "effect/Config"; // => Config reads PGHOST and friends with defaults
import * as Console from "effect/Console"; // => Console.log prints the golden transcript
import * as Effect from "effect/Effect"; // => Effect.gen sequences the migration story
import * as Layer from "effect/Layer"; // => Layer joins the database and node services
import * as Migrator from "effect/sql/Migrator"; // => fromRecord turns Effects into migrations
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner"; // => spawner service
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"; // => filesystem the migrator type needs
import * as NodePath from "@effect/platform-node/NodePath"; // => path the migrator type needs
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
  const exit = yield* Effect.exit(
    PgMigrator.run({
      // => capture success or crash, never crash out
      loader: Migrator.fromRecord({
        // => the second statement cannot run
        "1_create_ex71_widgets": Effect.gen(function* () {
          // => a two-step migration body
          const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
          yield* inner`CREATE TABLE ex71_widgets (id SERIAL PRIMARY KEY)`; // => step one is valid DDL
          yield* inner`CREATE TABLE ex71_widgets (id SERIAL PRIMARY KEY)`; // => step two repeats the name
        }), // => end of the two-step body
        "2_add_widget_name": sql`ALTER TABLE ex71_widgets ADD COLUMN name TEXT`, // => never reached
      }), // => end of the migration record
      table: "ex71_history", // => per-example history table
    }),
  ); // => exit holds Success or the loud Failure
  if (exit._tag === "Failure") {
    // => the duplicate CREATE TABLE died here
    yield* Console.log("outcome: migration-failed"); // => Output: outcome: migration-failed
  } else {
    // => success would list the applied pair
    yield* Console.log("outcome: unexpected-success"); // => never printed for this unit
  } // => end of the outcome branch
  const rows = yield* sql<{ migration_id: number }>`SELECT migration_id FROM ex71_history ORDER BY migration_id`; // => what did the history record
  yield* Console.log(`recorded: ${rows.length}`); // => Output: recorded: 0
  const tables = yield* sql<{ name: string }>`SELECT tablename AS name FROM pg_tables WHERE tablename = 'ex71_widgets'`; // => did the table survive
  yield* Console.log(`tables: ${tables.length}`); // => Output: tables: 0
  yield* sql`DROP TABLE IF EXISTS ex71_widgets`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex71_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
