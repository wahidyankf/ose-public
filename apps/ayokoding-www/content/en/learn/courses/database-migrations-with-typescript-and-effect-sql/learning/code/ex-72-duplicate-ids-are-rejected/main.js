"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const Config = __importStar(require("effect/Config")); // => Config reads PGHOST and friends with defaults
const Console = __importStar(require("effect/Console")); // => Console.log prints the golden transcript
const Effect = __importStar(require("effect/Effect")); // => Effect.gen sequences the migration story
const Layer = __importStar(require("effect/Layer")); // => Layer joins the database and node services
const Migrator = __importStar(require("effect/sql/Migrator")); // => fromRecord turns Effects into migrations
const SqlClient = __importStar(require("effect/sql/SqlClient")); // => SqlClient runs SQL against the pool
const NodeChildProcessSpawner = __importStar(require("@effect/platform-node/NodeChildProcessSpawner")); // => spawner the migrator type needs
const NodeFileSystem = __importStar(require("@effect/platform-node/NodeFileSystem")); // => filesystem the migrator type needs
const NodePath = __importStar(require("@effect/platform-node/NodePath")); // => path the migrator type needs
const NodeRuntime = __importStar(require("@effect/platform-node/NodeRuntime")); // => runMain boots the node services
const PgClient = __importStar(require("@effect/sql-pg/PgClient")); // => PgClient.layerConfig builds the pool
const PgMigrator = __importStar(require("@effect/sql-pg/PgMigrator")); // => PgMigrator.run applies pending migrations
// => one database layer from harness variables, trust auth, no TLS
const DbLive = PgClient.layerConfig({
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
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  const reason = yield* PgMigrator.run({
    loader: Migrator.fromRecord({
      "1_create_ex72_widgets": sql`CREATE TABLE ex72_widgets (id SERIAL PRIMARY KEY)`, // => first claimant of id 1
      "1_create_ex72_gadgets": sql`CREATE TABLE ex72_gadgets (id SERIAL PRIMARY KEY)`, // => second claimant of id 1
    }), // => end of the migration record
    table: "ex72_history", // => per-example history table
  }).pipe(
    // => catch the typed rejection, not a crash
    Effect.catchTag("MigrationError", (error) =>
      Console.log(`rejected: ${error.reason}`).pipe(Effect.as(error.reason)),
    ), // => Output: rejected: duplicates
  ); // => reason holds the typed rejection kind
  yield* Console.log(`reason: ${reason}`); // => Output: reason: duplicates
  yield* sql`DROP TABLE IF EXISTS ex72_widgets`; // => the example leaves no tables behind
  yield* sql`DROP TABLE IF EXISTS ex72_gadgets`; // => neither claimant created anything
  yield* sql`DROP TABLE ex72_history`; // => and no history table either
  yield* Console.log("cleaned: yes"); // => Output: cleaned: yes
}); // => program ends: the harness compares stdout to the golden file
NodeRuntime.runMain(program.pipe(Effect.provide(MainLive))); // => boot node services and run
