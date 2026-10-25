import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE ex03_items (id SERIAL PRIMARY KEY, label TEXT NOT NULL)`; // => migration 2 creates items
}); // => end of migration 2
