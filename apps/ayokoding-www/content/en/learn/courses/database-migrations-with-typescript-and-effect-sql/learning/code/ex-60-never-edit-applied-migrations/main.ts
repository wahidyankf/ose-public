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
    // => the original migration ships
    loader: Migrator.fromRecord({
      // => the original single-column table
      "1_create_ex60_t": sql`CREATE TABLE ex60_t (id SERIAL PRIMARY KEY, a TEXT)`, // => the table as first written
    }), // => end of the original loader
    table: "ex60_history", // => per-example history table
  }); // => the original applies
  yield* Console.log(`first: ${first.length}`); // => Output: first: 1
  const second = yield* PgMigrator.run({
    // => the edited file returns
    loader: Migrator.fromRecord({
      // => same id, different SQL
      "1_create_ex60_t": sql`CREATE TABLE ex60_t (id SERIAL PRIMARY KEY, a TEXT, b TEXT)`, // => the edit: silently ignored
    }), // => end of the edited loader
    table: "ex60_history", // => the same history table
  }); // => recorded ids never re-run
  yield* Console.log(`second: ${second.length}`); // => Output: second: 0
  const columns = yield* sql<{
    name: string;
  }>`SELECT column_name AS name FROM information_schema.columns WHERE table_name = 'ex60_t' ORDER BY ordinal_position`; // => the edit never landed
  yield* Console.log(`columns: ${columns.map((column) => column.name).join(", ")}`); // => Output: columns: id, a
  yield* sql`DROP TABLE ex60_t`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex60_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
