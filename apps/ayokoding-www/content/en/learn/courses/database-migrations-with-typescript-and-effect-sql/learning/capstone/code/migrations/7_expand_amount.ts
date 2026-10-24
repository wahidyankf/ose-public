import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`ALTER TABLE cap_products ADD COLUMN amount_cents INT`; // => expand: cents replace bare price
  yield* sql`UPDATE cap_products SET amount_cents = price WHERE amount_cents IS NULL`; // => migrate the values across
}); // => end of migration 7
