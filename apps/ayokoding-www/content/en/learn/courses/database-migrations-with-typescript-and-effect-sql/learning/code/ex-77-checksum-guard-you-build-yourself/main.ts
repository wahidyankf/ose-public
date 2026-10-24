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
import { createHash } from "node:crypto"; // => node:crypto hashes the migration text

const program = Effect.gen(function* () {
  // => the example narrative
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const original = "CREATE TABLE ex77_docs (id SERIAL PRIMARY KEY, title TEXT NOT NULL)"; // => the migration text as shipped
  const edited = "CREATE TABLE ex77_docs (id SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT)"; // => the text as edited later
  const applied = yield* PgMigrator.run({
    // => apply the documented migration
    loader: Migrator.fromRecord({
      // => the docs table plus its guard table
      "1_create_ex77_docs": Effect.gen(function* () {
        // => the guarded migration
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex77_docs (id SERIAL PRIMARY KEY, title TEXT NOT NULL)`; // => the documented table
        yield* inner`CREATE TABLE ex77_checksums (id INT PRIMARY KEY, sha TEXT NOT NULL)`; // => the owned guard table
      }), // => end of the guarded migration
    }), // => end of the migration record
    table: "ex77_history", // => per-example history table
  }); // => the migration applies cleanly
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 1
  const originalSha = createHash("sha256").update(original).digest("hex"); // => hash the shipped text
  yield* sql`INSERT INTO ex77_checksums ${sql.insert({ id: 1, sha: originalSha })}`; // => store the known-good hash
  const editedSha = createHash("sha256").update(edited).digest("hex"); // => hash the edited text
  const stored = yield* sql<{ sha: string }>`SELECT sha FROM ex77_checksums WHERE id = 1`; // => read the known-good hash back
  if (stored[0].sha === editedSha) {
    // => compare stored against edited
    yield* Console.log("checksum: match"); // => never printed for this unit
  } else {
    // => the texts differ, so the hashes differ
    yield* Console.log("checksum: mismatch"); // => Output: checksum: mismatch
  } // => end of the comparison
  yield* sql`DROP TABLE ex77_docs`; // => drop the documented table
  yield* sql`DROP TABLE ex77_checksums`; // => drop the guard table
  yield* sql`DROP TABLE ex77_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
