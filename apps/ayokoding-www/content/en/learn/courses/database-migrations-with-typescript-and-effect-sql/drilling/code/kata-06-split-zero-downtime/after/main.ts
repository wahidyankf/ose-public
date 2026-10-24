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
  // => the kata solution
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const applied = yield* PgMigrator.run({
    // => the canonical three-step split
    loader: Migrator.fromRecord({
      // => expand, migrate, contract
      "1_create_kata06_products": Effect.gen(function* () {
        // => the legacy shape
        const inner = yield* SqlClient.SqlClient; // => the body borrows the same client
        yield* inner`CREATE TABLE kata06_products (id SERIAL PRIMARY KEY, code TEXT NOT NULL)`; // => the legacy column
        yield* inner`INSERT INTO kata06_products (code) VALUES ('x1')`; // => one row predates the split
      }), // => end of the legacy migration
      "2_expand_sku": sql`ALTER TABLE kata06_products ADD COLUMN sku TEXT`, // => expand: the replacement arrives
      "3_migrate_sku": sql`UPDATE kata06_products SET sku = code WHERE sku IS NULL`, // => migrate: copy the values
      "4_contract_code": sql`ALTER TABLE kata06_products DROP COLUMN code`, // => contract: the legacy leaves
    }), // => end of the migration record
    table: "kata06_history", // => per-kata history table
  }); // => the full split applies
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 4
  const rows = yield* sql<{ sku: string }>`SELECT sku FROM kata06_products`; // => the value moved across
  for (const row of rows) {
    // => walk the migrated rows
    yield* Console.log(`sku: ${row.sku}`); // => Output: sku: x1
  } // => loop ends after the last product
  yield* sql`DROP TABLE kata06_products`; // => the kata leaves no tables behind
  yield* sql`DROP TABLE kata06_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
