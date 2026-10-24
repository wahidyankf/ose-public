import * as Effect from "effect/Effect"; // => Effect.gen sequences the kata
import * as SqlClient from "effect/sql/SqlClient"; // => SqlClient runs SQL against the pool

// => TODO: migrate, then check history and catalog agree.
export const task = Effect.gen(function* () {
  // => replace this stub with the migrator run
  const sql = yield* SqlClient.SqlClient; // => the query surface over the pool
  yield* sql`SELECT 1`; // => placeholder: remove when the migrations run
}); // => end of the stub
