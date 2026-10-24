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
    // => apply every pending migration
    loader: Migrator.fromRecord({
      // => three tables, then one precise reversal
      "1_create_ex23_a": sql`CREATE TABLE ex23_a (id SERIAL PRIMARY KEY)`, // => the first keeper
      "2_create_ex23_b": sql`CREATE TABLE ex23_b (id SERIAL PRIMARY KEY, tag TEXT)`, // => the one to reverse
      "3_create_ex23_c": sql`CREATE TABLE ex23_c (id SERIAL PRIMARY KEY)`, // => the second keeper
      "4_drop_ex23_b": sql`DROP TABLE ex23_b`, // => the compensation touches only its target
    }), // => end of the migration record
    table: "ex23_history", // => per-example history table
  }); // => applied lists only the migrations this run added
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 4
  const tables = yield* sql<{
    name: string;
  }>`SELECT tablename AS name FROM pg_tables WHERE tablename IN ('ex23_a', 'ex23_b', 'ex23_c') ORDER BY tablename`; // => who survived
  for (const table of tables) {
    // => walk the surviving tables
    yield* Console.log(`table: ${table.name}`); // => Output: table: ex23_a
  } // => loop ends after the last table
  yield* sql`DROP TABLE ex23_c`; // => drop the second keeper
  yield* sql`DROP TABLE ex23_a`; // => drop the first keeper
  yield* sql`DROP TABLE ex23_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
