import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE cap_orders (id SERIAL PRIMARY KEY, customer_id INT NOT NULL REFERENCES cap_customers (id))`; // => the orders table
  yield* sql`INSERT INTO cap_orders (customer_id) VALUES (1)`; // => ada's first order
}); // => end of migration 3
