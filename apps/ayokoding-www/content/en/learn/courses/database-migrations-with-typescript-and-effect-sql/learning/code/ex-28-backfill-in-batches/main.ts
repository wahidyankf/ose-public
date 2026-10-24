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
      // => schema change, then batched data
      "1_add_level_nullable": Effect.gen(function* () {
        // => the schema migration
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex28_scores (id SERIAL PRIMARY KEY, points INT NOT NULL)`; // => the scores table
        yield* inner`INSERT INTO ex28_scores (points) VALUES (10), (20), (30), (40), (50)`; // => five rows predate the column
        yield* inner`ALTER TABLE ex28_scores ADD COLUMN level INT`; // => nullable for now
      }), // => end of the schema migration
      "2_backfill_level_batched": Effect.gen(function* () {
        // => the batched backfill
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`UPDATE ex28_scores SET level = 1 WHERE id BETWEEN 1 AND 3 AND level IS NULL`; // => the first batch
        yield* inner`UPDATE ex28_scores SET level = 1 WHERE id BETWEEN 4 AND 5 AND level IS NULL`; // => the second batch
      }), // => end of the batched backfill
    }), // => end of the migration record
    table: "ex28_history", // => per-example history table
  }); // => applied lists only the migrations this run added
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 2
  const rows = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM ex28_scores WHERE level = 1`; // => every row filled
  yield* Console.log(`filled: ${rows[0].total}`); // => Output: filled: 5
  yield* sql`DROP TABLE ex28_scores`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex28_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
