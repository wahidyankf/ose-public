import { Context, Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { SqlError } from "@effect/sql/SqlError";

export interface RevokedTokenRepositoryApi {
  readonly revoke: (jti: string, userId: string) => Effect.Effect<void, SqlError>;
  readonly isRevoked: (jti: string) => Effect.Effect<boolean, SqlError>;
  readonly revokeAllForUser: (userId: string) => Effect.Effect<void, SqlError>;
}

export class RevokedTokenRepository extends Context.Tag("RevokedTokenRepository")<
  RevokedTokenRepository,
  RevokedTokenRepositoryApi
>() {}

export const RevokedTokenRepositoryLive = Layer.effect(
  RevokedTokenRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return {
      revoke: (jti: string, userId: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`
            INSERT OR IGNORE INTO revoked_tokens (jti, user_id, revoked_at)
            VALUES (${jti}, ${userId}, ${now})
          `;
        }),

      isRevoked: (jti: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti}`;
          return rows.length > 0;
        }),

      revokeAllForUser: (userId: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          const syntheticJti = `all-${userId}-${now}`;
          yield* sql`
            INSERT OR IGNORE INTO revoked_tokens (jti, user_id, revoked_at)
            VALUES (${syntheticJti}, ${userId}, ${now})
          `;
        }),
    };
  }),
);
