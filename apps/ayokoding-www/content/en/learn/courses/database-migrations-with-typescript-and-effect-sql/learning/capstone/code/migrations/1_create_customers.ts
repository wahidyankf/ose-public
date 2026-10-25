import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE cap_customers (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`; // => the customers table
  yield* sql`INSERT INTO cap_customers (name) VALUES ('ada')`; // => the first customer
}); // => end of migration 1
