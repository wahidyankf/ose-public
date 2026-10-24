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
    // => the whole run shares one transaction
    loader: Migrator.fromRecord({
      // => write, then read the write
      "1_write_then_read": Effect.gen(function* () {
        // => the self-observing body
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex65_t (id SERIAL PRIMARY KEY, label TEXT NOT NULL)`; // => the migrated table
        yield* inner`CREATE TABLE ex65_log (note TEXT NOT NULL)`; // => the observation channel
        yield* inner`INSERT INTO ex65_t (label) VALUES ('x')`; // => the uncommitted write
        yield* inner`INSERT INTO ex65_log (note) SELECT 'rows: ' || count(*)::text FROM ex65_t`; // => the same-txn read sees it
      }), // => end of the self-observing body
    }), // => end of the migration record
    table: "ex65_history", // => per-example history table
  }); // => the run commits once at the end
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 1
  const rows = yield* sql<{ note: string }>`SELECT note FROM ex65_log`; // => what the body observed
  for (const row of rows) {
    // => walk the observations
    yield* Console.log(`seen: ${row.note}`); // => Output: seen: rows: 1
  } // => loop ends after the observation
  yield* sql`DROP TABLE ex65_log`; // => drop the observation channel
  yield* sql`DROP TABLE ex65_t`; // => drop the migrated table
  yield* sql`DROP TABLE ex65_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
