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
  const reason = yield* PgMigrator.run({
    // => this loader carries a duplicate id
    loader: Migrator.fromRecord({
      // => two entries share id 1
      "1_create_ex72_widgets": sql`CREATE TABLE ex72_widgets (id SERIAL PRIMARY KEY)`, // => first claimant of id 1
      "1_create_ex72_gadgets": sql`CREATE TABLE ex72_gadgets (id SERIAL PRIMARY KEY)`, // => second claimant of id 1
    }), // => end of the migration record
    table: "ex72_history", // => per-example history table
  }).pipe(
    // => catch the typed rejection, not a crash
    Effect.catchTag("MigrationError", (error) => Console.log(`rejected: ${error.kind}`).pipe(Effect.as(error.kind))), // => Output: rejected: Duplicates
  ); // => reason holds the typed rejection kind
  yield* Console.log(`reason: ${reason}`); // => Output: reason: Duplicates
  yield* sql`DROP TABLE IF EXISTS ex72_widgets`; // => the example leaves no tables behind
  yield* sql`DROP TABLE IF EXISTS ex72_gadgets`; // => neither claimant created anything
  yield* sql`DROP TABLE ex72_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
