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
  // => the capstone story
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => eight migrations, one ordered line
    loader: Migrator.fromFileSystem("migrations"), // => files 1 through 8 in numeric order
    table: "cap_history", // => per-capstone history table
  }); // => the whole shop schema builds at once
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 8
  // => all eight files ran in numeric order
  // => the golden join proves schema and data agree
  const rows = yield* sql<{
    customer: string;
    product: string;
    qty: number;
    status: string;
    amount: number;
  }>`SELECT c.name AS customer, p.title AS product, i.qty AS qty, o.status AS status, p.amount_cents AS amount FROM cap_customers c JOIN cap_orders o ON o.customer_id = c.id JOIN cap_items i ON i.order_id = o.id JOIN cap_products p ON p.id = i.product_id ORDER BY o.id`; // => the golden join
  for (const row of rows) {
    // => walk the order lines
    yield* Console.log(`${row.customer} ordered ${row.product} x${row.qty} ${row.status} ${row.amount}`); // => Output: ada ordered widget x2 placed 199
  } // => loop ends after the last order line
  const recorded = yield* sql<{ total: number }>`SELECT count(*)::int AS total FROM cap_history`; // => the full line recorded
  yield* Console.log(`recorded: ${recorded[0].total}`); // => Output: recorded: 8
  // => applied equals recorded: the healthy-run invariant
  // => the unit leaves the database exactly as it found it
  yield* sql`DROP TABLE cap_items`; // => drop the line items
  yield* sql`DROP TABLE cap_orders`; // => drop the orders
  yield* sql`DROP TABLE cap_products`; // => drop the products
  yield* sql`DROP TABLE cap_customers`; // => drop the customers
  yield* sql`DROP TABLE cap_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
