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
      // => column, backfill, default
      "1_add_currency_nullable": Effect.gen(function* () {
        // => the schema migration
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE ex32_invoices (id SERIAL PRIMARY KEY, amount INT NOT NULL)`; // => the invoices table
        yield* inner`INSERT INTO ex32_invoices (amount) VALUES (100)`; // => one row predates the column
        yield* inner`ALTER TABLE ex32_invoices ADD COLUMN currency TEXT`; // => nullable for now
      }), // => end of the schema migration
      "2_backfill_currency": sql`UPDATE ex32_invoices SET currency = 'USD' WHERE currency IS NULL`, // => fix the old rows
      "3_default_currency": sql`ALTER TABLE ex32_invoices ALTER COLUMN currency SET DEFAULT 'USD'`, // => guard the new rows
    }), // => end of the migration record
    table: "ex32_history", // => per-example history table
  }); // => applied lists only the migrations this run added
  // => old rows fixed by the backfill, new rows guarded by the default
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 3
  yield* sql`INSERT INTO ex32_invoices (amount) VALUES (200)`; // => a new row omits the currency
  const rows = yield* sql<{
    amount: number;
    currency: string;
  }>`SELECT amount, currency FROM ex32_invoices ORDER BY amount`; // => old and new side by side
  for (const row of rows) {
    // => walk the invoice rows
    yield* Console.log(`invoice: ${row.amount} ${row.currency}`); // => Output: invoice: 100 USD
  } // => loop ends after the last invoice
  yield* sql`DROP TABLE ex32_invoices`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex32_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
