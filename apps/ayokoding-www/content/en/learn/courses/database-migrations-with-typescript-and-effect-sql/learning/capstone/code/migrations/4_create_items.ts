import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE cap_items (id SERIAL PRIMARY KEY, order_id INT NOT NULL REFERENCES cap_orders (id), product_id INT NOT NULL, qty INT NOT NULL)`; // => the line items
  yield* sql`INSERT INTO cap_items (order_id, product_id, qty) VALUES (1, 1, 2)`; // => two widgets on order one
  yield* sql`CREATE INDEX cap_items_order_idx ON cap_items (order_id)`; // => the lookup path
}); // => end of migration 4
