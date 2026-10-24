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
    // => the first deploy ships two migrations
    loader: Migrator.fromRecord({
      // => loader A holds the early pair
      "1_create_ex10_a": sql`CREATE TABLE ex10_a (id SERIAL PRIMARY KEY)`, // => the first table
      "2_create_ex10_b": sql`CREATE TABLE ex10_b (id SERIAL PRIMARY KEY)`, // => the second table
    }), // => end of loader A
    table: "ex10_history", // => per-example history table
  }); // => first run applies the early pair
  yield* Console.log(`first: ${first.length}`); // => Output: first: 2
  const second = yield* PgMigrator.run({
    // => the next deploy ships one more
    loader: Migrator.fromRecord({
      // => loader B continues the line
      "3_create_ex10_c": sql`CREATE TABLE ex10_c (id SERIAL PRIMARY KEY)`, // => the late arrival
    }), // => end of loader B
    table: "ex10_history", // => the same history table
  }); // => second run applies only the newcomer
  yield* Console.log(`second: ${second.length}`); // => Output: second: 1
  const rows = yield* sql<{ migration_id: number }>`SELECT migration_id FROM ex10_history ORDER BY migration_id`; // => the full line
  yield* Console.log(`recorded: ${rows.map((row) => row.migration_id).join(", ")}`); // => Output: recorded: 1, 2, 3
  yield* sql`DROP TABLE ex10_c`; // => drop the late table
  yield* sql`DROP TABLE ex10_b`; // => drop the middle table
  yield* sql`DROP TABLE ex10_a`; // => drop the first table
  yield* sql`DROP TABLE ex10_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
