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
      // => create narrow, widen forward
      "1_create_ex22_prices": Effect.gen(function* () {
        // => the original shape
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex22_prices (id SERIAL PRIMARY KEY, amount INT NOT NULL)`; // => integer cents, as first designed
        yield* inner`INSERT INTO ex22_prices (amount) VALUES (199)`; // => one price worth converting
      }), // => end of the original migration
      "2_amount_to_numeric": sql`ALTER TABLE ex22_prices ALTER COLUMN amount TYPE NUMERIC(10, 2) USING amount::numeric / 100`, // => cents become money
    }), // => end of the migration record
    table: "ex22_history", // => per-example history table
  }); // => applied lists only the migrations this run added
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 2
  const columns = yield* sql<{
    type: string;
  }>`SELECT data_type AS type FROM information_schema.columns WHERE table_name = 'ex22_prices' AND column_name = 'amount'`; // => the converted type
  yield* Console.log(`type: ${columns[0].type}`); // => Output: type: numeric
  const rows = yield* sql<{ amount: string }>`SELECT amount::text AS amount FROM ex22_prices`; // => the converted value
  for (const row of rows) {
    // => walk the converted rows
    yield* Console.log(`amount: ${row.amount}`); // => Output: amount: 1.99
  } // => loop ends after the last row
  yield* sql`DROP TABLE ex22_prices`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex22_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
