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
      // => table, check, then validation
      "1_create_ex42_accounts": sql`CREATE TABLE ex42_accounts (id SERIAL PRIMARY KEY, balance INT NOT NULL)`, // => the accounts table
      "2_add_check_not_valid": sql`ALTER TABLE ex42_accounts ADD CONSTRAINT ex42_positive_balance CHECK (balance >= 0) NOT VALID`, // => the deferred rule
      "3_validate_check": sql`ALTER TABLE ex42_accounts VALIDATE CONSTRAINT ex42_positive_balance`, // => the validation pass
    }), // => end of the migration record
    table: "ex42_history", // => per-example history table
  }); // => applied lists only the migrations this run added
  // => the second half of the deferred-constraint pattern
  yield* Console.log(`applied: ${applied.length}`); // => Output: applied: 3
  const rows = yield* sql<{
    name: string;
    valid: boolean;
  }>`SELECT conname AS name, convalidated AS valid FROM pg_constraint WHERE conname = 'ex42_positive_balance'`; // => now enforced
  for (const row of rows) {
    // => walk the constraint row
    yield* Console.log(`check: ${row.name}, validated: ${row.valid}`); // => Output: check: ex42_positive_balance, validated: true
  } // => loop ends after the constraint row
  yield* sql`DROP TABLE ex42_accounts`; // => the example leaves no tables behind
  yield* sql`DROP TABLE ex42_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file

NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
