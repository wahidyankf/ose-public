import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`ALTER TABLE cap_orders ADD COLUMN status TEXT`; // => expand: the new shape arrives
}); // => end of migration 5
