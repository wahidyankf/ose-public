import * as Effect from "effect/Effect"; // => Effect.gen builds the migration body
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs the DDL

export default Effect.gen(function* () {
  // => the default export is the migration
  const sql = yield* SqlClient.SqlClient; // => the client the migrator lends this file
  yield* sql`CREATE TABLE ex04_books (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`; // => the books table
  yield* sql`INSERT INTO ex04_books (name) VALUES ('Dune')`; // => one row worth keeping
}); // => end of migration 1
