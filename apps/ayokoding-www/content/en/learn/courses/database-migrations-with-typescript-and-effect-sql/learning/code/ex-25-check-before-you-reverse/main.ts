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
    // => the change that later needs reversing
    loader: Migrator.fromRecord({
      // => seed three rows
      "1_create_ex25_events": Effect.gen(function* () {
        // => the setup migration
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex25_events (id SERIAL PRIMARY KEY, kind TEXT NOT NULL)`; // => the events table
        yield* inner`INSERT INTO ex25_events (kind) VALUES ('a'), ('b'), ('c')`; // => three rows worth archiving
      }), // => end of the setup migration
    }), // => end of the first loader
    table: "ex25_history", // => per-example history table
  }); // => first run seeds the table
  yield* Console.log(`seeded: ${first.length}`); // => Output: seeded: 1
  const before = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM ex25_events`; // => count before reversing
  yield* Console.log(`rows before: ${before[0].total}`); // => Output: rows before: 3
  const second = yield* PgMigrator.run({
    // => the checked reversal
    loader: Migrator.fromRecord({
      // => archive, then drop
      "2_archive_ex25_events": Effect.gen(function* () {
        // => the compensation
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex25_archive (id INT NOT NULL, kind TEXT NOT NULL)`; // => the archive table
        yield* inner`INSERT INTO ex25_archive SELECT id, kind FROM ex25_events`; // => copy every row across
        yield* inner`DROP TABLE ex25_events`; // => only then drop the original
      }), // => end of the compensation
    }), // => end of the second loader
    table: "ex25_history", // => the same history table
  }); // => second run archives and drops
  yield* Console.log(`reversed: ${second.length}`); // => Output: reversed: 1
  const after = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM ex25_archive`; // => count after reversing
  yield* Console.log(`archived: ${after[0].total}`); // => Output: archived: 3
  yield* sql`DROP TABLE ex25_archive`; // => drop the archive table
  yield* sql`DROP TABLE ex25_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
