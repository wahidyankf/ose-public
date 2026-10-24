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
  yield* sql`CREATE DATABASE ex78_dev`; // => the first environment, a real database
  yield* sql`CREATE DATABASE ex78_prod`; // => the second environment, a real database
  // => two real databases: promotion shares no tables
  const makeDb = (database: string) =>
    PgClient.layerConfig({
      // => one pool per environment
      host: Config.String("PGHOST").pipe(Config.withDefault("postgres")), // => service hostname
      port: Config.Port("PGPORT").pipe(Config.withDefault(5432)), // => service port as a number
      database: Config.succeed(database), // => this environment's database
      username: Config.String("PGUSER").pipe(Config.withDefault("postgres")), // => trust-auth role
      ssl: Config.succeed(false), // => plaintext inside the unit network
    }); // => a pool aimed at one environment
  const envFor = (database: string) => Layer.mergeAll(makeDb(database), NodeLive, SpawnerLive); // => one full environment
  // => pools plus node services, assembled per environment
  const runOn = (database: string) =>
    Effect.provide(
      // => each environment runs on its own pool
      Effect.gen(function* () {
        // => migrate one environment fully
        const db = yield* SqlClient.SqlClient; // => this environment's client
        const applied = yield* PgMigrator.run({
          // => the release set
          loader: Migrator.fromRecord({
            // => the same three everywhere
            "1_create_ex78_customers": db`CREATE TABLE ex78_customers (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`, // => who orders
            "2_create_ex78_orders": db`CREATE TABLE ex78_orders (id SERIAL PRIMARY KEY, customer_id INT NOT NULL)`, // => what they order
            "3_seed_customer": db`INSERT INTO ex78_customers (name) VALUES ('ada')`, // => the first customer
          }), // => end of the migration record
          table: "ex78_history", // => each database keeps its own history
        }); // => this environment converges
        const latest = yield* db<{
          migration_id: number;
          name: string;
        }>`SELECT migration_id, name FROM ex78_history ORDER BY migration_id DESC LIMIT 1`; // => this environment's newest
        const customers = yield* db<{ total: number }>`SELECT count(*)::int AS total FROM ex78_customers`; // => the seeded data is live
        return {
          count: applied.length,
          latest: `${latest[0].migration_id}_${latest[0].name}`,
          customers: customers[0].total,
        }; // => plain data crosses the pool boundary
        // => counts and names cross; clients never leave their pool
      }), // => end of the per-environment story
      envFor(database), // => pool plus node services
    ); // => runOn hands back counts, never clients
  const dev = yield* runOn("ex78_dev"); // => the first environment adopts the set
  // => the first environment converges
  yield* Console.log(`dev: ${dev.count}`); // => Output: dev: 3
  const prod = yield* runOn("ex78_prod"); // => the second environment adopts the set
  // => the second environment converges
  yield* Console.log(`prod: ${prod.count}`); // => Output: prod: 3
  // => prod agrees on the newest migration
  yield* Console.log(`prod latest: ${prod.latest}`); // => Output: prod latest: 3_seed_customer
  // => the seeded data survived promotion
  yield* Console.log(`customers: ${prod.customers}`); // => Output: customers: 1
  yield* sql`DROP DATABASE ex78_dev`; // => drop the first environment
  yield* sql`DROP DATABASE ex78_prod`; // => drop the second environment
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
