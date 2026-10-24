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
  yield* sql`CREATE TABLE ex53_legacy (id SERIAL PRIMARY KEY)`; // => the legacy table, built by hand
  yield* sql`CREATE TABLE ex53_history (migration_id integer primary key, created_at timestamp with time zone not null default now(), name text not null)`; // => the history, built by hand
  yield* sql`INSERT INTO ex53_history (migration_id, name) VALUES (1, 'legacy_snapshot')`; // => the stamp: id 1 already in place
  const loader = Migrator.fromRecord({
    // => snapshot plus newcomer, reused twice
    "1_legacy_snapshot": sql`SELECT 1`, // => skipped: already recorded, never executes
    "2_create_ex53_new": sql`CREATE TABLE ex53_new (id SERIAL PRIMARY KEY)`, // => the genuinely new table
  }); // => the loader is just data: safe to run twice
  const first = yield* PgMigrator.run({ loader, table: "ex53_history" }); // => the adoption run
  yield* Console.log(`first: ${first.length}`); // => Output: first: 1
  const tables = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename IN ('ex53_legacy', 'ex53_new')`; // => checklist item one
  yield* Console.log(`tables: ${tables[0].total}`); // => Output: tables: 2
  const recorded = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM ex53_history`; // => checklist item two
  yield* Console.log(`recorded: ${recorded[0].total}`); // => Output: recorded: 2
  const second = yield* PgMigrator.run({ loader, table: "ex53_history" }); // => checklist item three
  yield* Console.log(`pending: ${second.length}`); // => Output: pending: 0
  yield* sql`DROP TABLE ex53_new`; // => drop the newcomer
  yield* sql`DROP TABLE ex53_legacy`; // => drop the legacy table
  yield* sql`DROP TABLE ex53_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
