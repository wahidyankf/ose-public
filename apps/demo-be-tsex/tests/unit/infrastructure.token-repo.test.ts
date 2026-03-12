import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";
import { RevokedTokenRepository, RevokedTokenRepositoryLive } from "../../src/infrastructure/db/token-repo.js";
import { CREATE_TABLE_STATEMENTS } from "../../src/infrastructure/db/schema.js";

const SqliteLayer = SqliteClient.layer({ filename: ":memory:" });
const TestLayer = RevokedTokenRepositoryLive.pipe(Layer.provideMerge(SqliteLayer));

const runTest = <A>(effect: Effect.Effect<A, unknown, RevokedTokenRepository | SqlClient.SqlClient>): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.provide(TestLayer)) as Effect.Effect<A, never, never>);

const initDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  for (const stmt of CREATE_TABLE_STATEMENTS) {
    yield* sql.unsafe(stmt);
  }
});

describe("RevokedTokenRepository", () => {
  describe("revoke and isRevoked", () => {
    it("marks a token as revoked", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* RevokedTokenRepository;
          yield* repo.revoke("test-jti-1", "user-id-1");
          return yield* repo.isRevoked("test-jti-1");
        }),
      );
      expect(result).toBe(true);
    });

    it("returns false for a token that has not been revoked", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* RevokedTokenRepository;
          return yield* repo.isRevoked("unknown-jti");
        }),
      );
      expect(result).toBe(false);
    });

    it("handles duplicate revoke gracefully (INSERT OR IGNORE)", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* RevokedTokenRepository;
          yield* repo.revoke("dup-jti", "user-id-2");
          yield* repo.revoke("dup-jti", "user-id-2");
          return yield* repo.isRevoked("dup-jti");
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe("revokeAllForUser", () => {
    it("returns false for a specific jti after revokeAllForUser", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* RevokedTokenRepository;
          yield* repo.revokeAllForUser("user-id-3");
          return yield* repo.isRevoked("unknown-jti-for-user");
        }),
      );
      expect(result).toBe(false);
    });

    it("completes without error", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* RevokedTokenRepository;
          yield* repo.revokeAllForUser("user-id-4");
        }),
      );
      expect(result).toBeUndefined();
    });
  });
});
