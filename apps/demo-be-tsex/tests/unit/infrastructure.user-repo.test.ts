import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";
import { UserRepository, UserRepositoryLive } from "../../src/infrastructure/db/user-repo.js";
import { CREATE_TABLE_STATEMENTS } from "../../src/infrastructure/db/schema.js";

// UserRepositoryLive needs SqlClient, provided by SqliteLayer.
// We use provideMerge so the final layer provides BOTH SqlClient.SqlClient and UserRepository.
// UserRepositoryLive.pipe(Layer.provideMerge(SqliteLayer)):
//   feeds SqliteLayer outputs INTO UserRepositoryLive's inputs,
//   and the resulting layer provides BOTH UserRepositoryLive AND SqliteLayer outputs.
const SqliteLayer = SqliteClient.layer({ filename: ":memory:" });
const TestLayer = UserRepositoryLive.pipe(Layer.provideMerge(SqliteLayer));

const runTest = <A>(effect: Effect.Effect<A, unknown, UserRepository | SqlClient.SqlClient>): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.provide(TestLayer)) as Effect.Effect<A, never, never>);

const initDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  for (const stmt of CREATE_TABLE_STATEMENTS) {
    yield* sql.unsafe(stmt);
  }
});

const sampleUser = {
  username: "testuser",
  email: "test@example.com",
  passwordHash: "hashed_password",
  displayName: "Test User",
};

describe("UserRepository", () => {
  describe("create", () => {
    it("creates a user and returns it", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          return yield* repo.create(sampleUser);
        }),
      );
      expect(user.username).toBe("testuser");
      expect(user.email).toBe("test@example.com");
      expect(user.displayName).toBe("Test User");
      expect(user.role).toBe("USER");
      expect(user.status).toBe("ACTIVE");
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.id).toBeTruthy();
    });

    it("fails with ConflictError when username already exists", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          return yield* Effect.either(repo.create(sampleUser));
        }),
      );
      expect(result._tag).toBe("Left");
    });
  });

  describe("findByUsername", () => {
    it("returns the user when found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          return yield* repo.findByUsername("testuser");
        }),
      );
      expect(user).not.toBeNull();
      expect(user?.username).toBe("testuser");
    });

    it("returns null when not found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          return yield* repo.findByUsername("nobody");
        }),
      );
      expect(user).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("returns the user when found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          return yield* repo.findByEmail("test@example.com");
        }),
      );
      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null when not found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          return yield* repo.findByEmail("nobody@example.com");
        }),
      );
      expect(user).toBeNull();
    });
  });

  describe("findById", () => {
    it("returns the user when found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          return yield* repo.findById(created.id);
        }),
      );
      expect(user).not.toBeNull();
    });

    it("returns null when not found", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          return yield* repo.findById("nonexistent-id");
        }),
      );
      expect(user).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("updates user status", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          yield* repo.updateStatus(created.id, "INACTIVE");
          return yield* repo.findById(created.id);
        }),
      );
      expect(user?.status).toBe("INACTIVE");
    });
  });

  describe("updateDisplayName", () => {
    it("updates display name", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          yield* repo.updateDisplayName(created.id, "New Name");
          return yield* repo.findById(created.id);
        }),
      );
      expect(user?.displayName).toBe("New Name");
    });
  });

  describe("updatePassword", () => {
    it("updates password hash", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          yield* repo.updatePassword(created.id, "new_hash");
          return yield* repo.findById(created.id);
        }),
      );
      expect(user?.passwordHash).toBe("new_hash");
    });
  });

  describe("incrementFailedAttempts", () => {
    it("increments the failed login attempts counter", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          yield* repo.incrementFailedAttempts(created.id);
          yield* repo.incrementFailedAttempts(created.id);
          return yield* repo.findById(created.id);
        }),
      );
      expect(user?.failedLoginAttempts).toBe(2);
    });
  });

  describe("resetFailedAttempts", () => {
    it("resets failed login attempts to zero", async () => {
      const user = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          const created = yield* repo.create(sampleUser);
          yield* repo.incrementFailedAttempts(created.id);
          yield* repo.resetFailedAttempts(created.id);
          return yield* repo.findById(created.id);
        }),
      );
      expect(user?.failedLoginAttempts).toBe(0);
    });
  });

  describe("listUsers", () => {
    it("returns all users with pagination", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          yield* repo.create({
            ...sampleUser,
            username: "another",
            email: "another@example.com",
          });
          return yield* repo.listUsers(1, 10);
        }),
      );
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it("filters by email when provided", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          yield* repo.create({
            ...sampleUser,
            username: "another",
            email: "another@example.com",
          });
          return yield* repo.listUsers(1, 10, "another");
        }),
      );
      expect(result.total).toBe(1);
      expect(result.items[0]?.email).toBe("another@example.com");
    });

    it("returns all users with empty email filter", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* UserRepository;
          yield* repo.create(sampleUser);
          return yield* repo.listUsers(1, 10, "");
        }),
      );
      expect(result.total).toBe(1);
    });
  });
});
