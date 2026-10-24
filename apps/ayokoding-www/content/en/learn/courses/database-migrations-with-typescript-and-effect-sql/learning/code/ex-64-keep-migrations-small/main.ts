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
    // => one short run, five small steps
    loader: Migrator.fromRecord({
      // => five one-statement migrations
      "1_create_ex64_a": sql`CREATE TABLE ex64_a (id SERIAL PRIMARY KEY)`, // => small step one
      "2_create_ex64_b": sql`CREATE TABLE ex64_b (id SERIAL PRIMARY KEY)`, // => small step two
      "3_create_ex64_c": sql`CREATE TABLE ex64_c (id SERIAL PRIMARY KEY)`, // => small step three
      "4_create_ex64_d": sql`CREATE TABLE ex64_d (id SERIAL PRIMARY KEY)`, // => small step four
      "5_create_ex64_e": sql`CREATE TABLE ex64_e (id SERIAL PRIMARY KEY)`, // => small step five
    }), // => end of the migration record
    table: "ex64_history", // => per-example history table
  }); // => the whole run holds the lock briefly
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 5
  yield* sql`DROP TABLE ex64_e`; // => drop the small tables
  yield* sql`DROP TABLE ex64_d`; // => drop the small tables
  yield* sql`DROP TABLE ex64_c`; // => drop the small tables
  yield* sql`DROP TABLE ex64_b`; // => drop the small tables
  yield* sql`DROP TABLE ex64_a`; // => drop the small tables
  yield* sql`DROP TABLE ex64_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
