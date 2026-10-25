import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE cap_products (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price INT NOT NULL)`; // => the products table
  yield* sql`INSERT INTO cap_products (title, price) VALUES ('widget', 199)`; // => the first product
}); // => end of migration 2
