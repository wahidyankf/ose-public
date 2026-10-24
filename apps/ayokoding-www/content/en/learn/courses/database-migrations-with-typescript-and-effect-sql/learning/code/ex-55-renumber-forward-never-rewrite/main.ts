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
    // => the shared base lands first
    loader: Migrator.fromRecord({
      // => the base loader
      "1_create_ex55_base": sql`CREATE TABLE ex55_base (id SERIAL PRIMARY KEY)`, // => the table both branches share
    }), // => end of the base loader
    table: "ex55_history", // => per-example history table
  }); // => base applies alone
  yield* Console.log(`base: ${first.length}`); // => Output: base: 1
  const branch = yield* PgMigrator.run({
    // => the branch takes the next free numbers
    loader: Migrator.fromRecord({
      // => renumbered forward at merge time
      "2_branch_login": sql`CREATE TABLE ex55_login (id SERIAL PRIMARY KEY)`, // => the branch's first table
      "3_branch_session": sql`CREATE TABLE ex55_session (id SERIAL PRIMARY KEY)`, // => the branch's second table
    }), // => end of the branch loader
    table: "ex55_history", // => the same history table
  }); // => the branch appends cleanly
  yield* Console.log(`branch: ${branch.length}`); // => Output: branch: 2
  const rows = yield* sql<{ migration_id: number }>`SELECT migration_id FROM ex55_history ORDER BY migration_id`; // => one line, no rewrite
  yield* Console.log(`recorded: ${rows.map((row) => row.migration_id).join(", ")}`); // => Output: recorded: 1, 2, 3
  yield* sql`DROP TABLE ex55_session`; // => drop the branch tables
  yield* sql`DROP TABLE ex55_login`; // => drop the branch tables
  yield* sql`DROP TABLE ex55_base`; // => drop the base table
  yield* sql`DROP TABLE ex55_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
