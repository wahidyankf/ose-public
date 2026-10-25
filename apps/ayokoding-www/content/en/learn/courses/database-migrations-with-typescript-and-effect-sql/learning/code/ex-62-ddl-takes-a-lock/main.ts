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
    // => the run locks the history first
    loader: Migrator.fromRecord({
      // => observe the lock from inside
      "1_create_ex62_t": Effect.gen(function* () {
        // => the observing migration
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex62_t (id SERIAL PRIMARY KEY)`; // => the migrated table
        yield* inner`CREATE TABLE ex62_seen (mode TEXT NOT NULL)`; // => the observation channel
        yield* inner`INSERT INTO ex62_seen (mode) SELECT mode FROM pg_locks WHERE pid = pg_backend_pid() AND relation = 'ex62_history'::regclass AND mode = 'AccessExclusiveLock'`; // => capture the held lock
      }), // => end of the observing migration
    }), // => end of the migration record
    table: "ex62_history", // => per-example history table
  }); // => the lock is held throughout this run
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 1
  const rows = yield* sql<{ mode: string }>`SELECT mode FROM ex62_seen`; // => what the body observed
  for (const row of rows) {
    // => walk the observations
    yield* Console.log(`history lock: ${row.mode}`); // => Output: history lock: AccessExclusiveLock
  } // => loop ends after the observation
  yield* sql`DROP TABLE ex62_seen`; // => drop the observation channel
  yield* sql`DROP TABLE ex62_t`; // => drop the migrated table
  yield* sql`DROP TABLE ex62_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
