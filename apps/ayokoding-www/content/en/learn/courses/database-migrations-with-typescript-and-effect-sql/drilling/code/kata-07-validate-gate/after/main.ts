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
