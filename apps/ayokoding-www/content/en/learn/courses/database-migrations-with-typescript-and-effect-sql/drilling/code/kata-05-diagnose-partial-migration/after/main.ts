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
  const kind = yield* PgMigrator.run({
    // => the partial run fails midway
    loader: Migrator.fromRecord({
      // => two steps, the second impossible
      "1_partial_kata05": Effect.gen(function* () {
        // => the partial body
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata05_t (id SERIAL PRIMARY KEY)`; // => step one succeeds
        yield* inner`INSERT INTO kata05_t (missing_column) VALUES (1)`; // => step two cannot succeed
      }), // => end of the partial body
    }), // => end of the failing loader
    table: "kata05_history", // => per-kata history table
  }).pipe(
    // => catch the typed failure, not a crash
    Effect.catchTag("MigrationError", (error) => Console.log(`failed: ${error.kind}`).pipe(Effect.as(error.kind))), // => Output: failed: Failed
  ); // => kind holds the typed failure kind
  yield* Console.log(`kind: ${kind}`); // => Output: kind: Failed
  const recorded = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM kata05_history`; // => checklist: history empty
  yield* Console.log(`recorded: ${recorded[0].total}`); // => Output: recorded: 0
  const tables = yield* sql<{
    total: number;
  }>`SELECT count(*)::int AS total FROM pg_tables WHERE tablename = 'kata05_t'`; // => checklist: table absent
  yield* Console.log(`tables: ${tables[0].total}`); // => Output: tables: 0
  yield* sql`DROP TABLE IF EXISTS kata05_t`; // => the kata leaves no tables behind
  yield* sql`DROP TABLE kata05_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
