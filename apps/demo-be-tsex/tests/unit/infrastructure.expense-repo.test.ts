import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";
import { ExpenseRepository, ExpenseRepositoryLive } from "../../src/infrastructure/db/expense-repo.js";
import { UserRepository, UserRepositoryLive } from "../../src/infrastructure/db/user-repo.js";
import { CREATE_TABLE_STATEMENTS } from "../../src/infrastructure/db/schema.js";
import type { CreateExpenseData } from "../../src/domain/expense.js";

const SqliteLayer = SqliteClient.layer({ filename: ":memory:" });
const TestLayer = Layer.mergeAll(ExpenseRepositoryLive, UserRepositoryLive).pipe(Layer.provideMerge(SqliteLayer));

const runTest = <A>(
  effect: Effect.Effect<A, unknown, ExpenseRepository | UserRepository | SqlClient.SqlClient>,
): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(TestLayer)) as Effect.Effect<A, never, never>);

const initDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  for (const stmt of CREATE_TABLE_STATEMENTS) {
    yield* sql.unsafe(stmt);
  }
});

const makeExpenseData = (userId: string): CreateExpenseData => ({
  userId,
  type: "EXPENSE",
  amount: 25.0,
  currency: "USD",
  description: "Lunch",
  date: "2024-01-15",
});

describe("ExpenseRepository", () => {
  describe("create", () => {
    it("creates an expense and returns it", async () => {
      const expense = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user1",
            email: "user1@example.com",
            passwordHash: "hash",
            displayName: "User 1",
          });
          const repo = yield* ExpenseRepository;
          return yield* repo.create(makeExpenseData(user.id));
        }),
      );
      expect(expense.amount).toBe(25.0);
      expect(expense.currency).toBe("USD");
      expect(expense.description).toBe("Lunch");
      expect(expense.type).toBe("EXPENSE");
      expect(expense.id).toBeTruthy();
      expect(expense.quantity).toBeNull();
      expect(expense.unit).toBeNull();
    });

    it("creates an expense with optional quantity and unit", async () => {
      const expense = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user2a",
            email: "user2a@example.com",
            passwordHash: "hash",
            displayName: "User 2a",
          });
          const repo = yield* ExpenseRepository;
          return yield* repo.create({
            ...makeExpenseData(user.id),
            quantity: "2",
            unit: "liter",
          });
        }),
      );
      expect(expense.quantity).toBe("2");
      expect(expense.unit).toBe("liter");
    });
  });

  describe("findById", () => {
    it("returns the expense when found", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user3",
            email: "user3@example.com",
            passwordHash: "hash",
            displayName: "User 3",
          });
          const repo = yield* ExpenseRepository;
          const created = yield* repo.create(makeExpenseData(user.id));
          return yield* repo.findById(created.id);
        }),
      );
      expect(found).not.toBeNull();
      expect(found?.description).toBe("Lunch");
    });

    it("returns null when not found", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* repo.findById("nonexistent");
        }),
      );
      expect(found).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("returns expenses for the user with pagination", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user4",
            email: "user4@example.com",
            passwordHash: "hash",
            displayName: "User 4",
          });
          const repo = yield* ExpenseRepository;
          yield* repo.create(makeExpenseData(user.id));
          yield* repo.create({
            ...makeExpenseData(user.id),
            description: "Dinner",
          });
          return yield* repo.findByUserId(user.id, 1, 10);
        }),
      );
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it("returns empty for user with no expenses", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* repo.findByUserId("nonexistent-user", 1, 10);
        }),
      );
      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("updates expense fields", async () => {
      const updated = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user5",
            email: "user5@example.com",
            passwordHash: "hash",
            displayName: "User 5",
          });
          const repo = yield* ExpenseRepository;
          const created = yield* repo.create(makeExpenseData(user.id));
          return yield* repo.update(created.id, {
            description: "Updated Lunch",
            amount: 30.0,
          });
        }),
      );
      expect(updated.description).toBe("Updated Lunch");
      expect(updated.amount).toBe(30.0);
    });

    it("preserves existing fields when partial update", async () => {
      const updated = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user6",
            email: "user6@example.com",
            passwordHash: "hash",
            displayName: "User 6",
          });
          const repo = yield* ExpenseRepository;
          const created = yield* repo.create({
            ...makeExpenseData(user.id),
            quantity: "3",
            unit: "kilogram",
          });
          return yield* repo.update(created.id, { description: "Groceries" });
        }),
      );
      expect(updated.description).toBe("Groceries");
      expect(updated.quantity).toBe("3");
      expect(updated.unit).toBe("kilogram");
    });

    it("fails with NotFoundError when expense does not exist", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* Effect.either(repo.update("nonexistent", { description: "test" }));
        }),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as { _tag: string })._tag).toBe("NotFoundError");
      }
    });
  });

  describe("delete", () => {
    it("deletes an existing expense", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user7",
            email: "user7@example.com",
            passwordHash: "hash",
            displayName: "User 7",
          });
          const repo = yield* ExpenseRepository;
          const created = yield* repo.create(makeExpenseData(user.id));
          yield* repo.delete(created.id);
          return yield* repo.findById(created.id);
        }),
      );
      expect(found).toBeNull();
    });

    it("fails with NotFoundError when expense does not exist", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* Effect.either(repo.delete("nonexistent"));
        }),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as { _tag: string })._tag).toBe("NotFoundError");
      }
    });
  });

  describe("summarize", () => {
    it("returns summary grouped by currency and type", async () => {
      const summary = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user8",
            email: "user8@example.com",
            passwordHash: "hash",
            displayName: "User 8",
          });
          const repo = yield* ExpenseRepository;
          yield* repo.create({
            ...makeExpenseData(user.id),
            type: "INCOME",
            amount: 100.0,
          });
          yield* repo.create({
            ...makeExpenseData(user.id),
            type: "EXPENSE",
            amount: 40.0,
          });
          return yield* repo.summarize(user.id);
        }),
      );
      expect(summary["USD"]).toBeDefined();
      expect(summary["USD"]?.income).toBe(100.0);
      expect(summary["USD"]?.expense).toBe(40.0);
    });

    it("returns empty object when user has no expenses", async () => {
      const summary = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* repo.summarize("nonexistent-user");
        }),
      );
      expect(Object.keys(summary)).toHaveLength(0);
    });
  });

  describe("findByDateRange", () => {
    it("returns expenses within date range", async () => {
      const expenses = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "user9",
            email: "user9@example.com",
            passwordHash: "hash",
            displayName: "User 9",
          });
          const repo = yield* ExpenseRepository;
          yield* repo.create({ ...makeExpenseData(user.id), date: "2024-01-10" });
          yield* repo.create({ ...makeExpenseData(user.id), date: "2024-01-20" });
          yield* repo.create({ ...makeExpenseData(user.id), date: "2024-02-01" });
          return yield* repo.findByDateRange(user.id, "2024-01-01", "2024-01-31", "USD");
        }),
      );
      expect(expenses).toHaveLength(2);
    });

    it("returns empty array when no expenses in range", async () => {
      const expenses = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* ExpenseRepository;
          return yield* repo.findByDateRange("any-user", "2023-01-01", "2023-12-31", "USD");
        }),
      );
      expect(expenses).toHaveLength(0);
    });
  });
});
