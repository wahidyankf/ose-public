import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";
import { AttachmentRepository, AttachmentRepositoryLive } from "../../src/infrastructure/db/attachment-repo.js";
import { UserRepository, UserRepositoryLive } from "../../src/infrastructure/db/user-repo.js";
import { ExpenseRepository, ExpenseRepositoryLive } from "../../src/infrastructure/db/expense-repo.js";
import { CREATE_TABLE_STATEMENTS } from "../../src/infrastructure/db/schema.js";
import type { CreateAttachmentData } from "../../src/domain/attachment.js";

const SqliteLayer = SqliteClient.layer({ filename: ":memory:" });
const TestLayer = Layer.mergeAll(AttachmentRepositoryLive, ExpenseRepositoryLive, UserRepositoryLive).pipe(
  Layer.provideMerge(SqliteLayer),
);

const runTest = <A>(
  effect: Effect.Effect<A, unknown, AttachmentRepository | ExpenseRepository | UserRepository | SqlClient.SqlClient>,
): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(TestLayer)) as Effect.Effect<A, never, never>);

const initDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  for (const stmt of CREATE_TABLE_STATEMENTS) {
    yield* sql.unsafe(stmt);
  }
});

function makeAttachmentData(expenseId: string, userId: string): CreateAttachmentData {
  return {
    expenseId,
    userId,
    filename: "receipt.jpg",
    contentType: "image/jpeg",
    size: 1024,
    data: Buffer.from("fake image data"),
  };
}

describe("AttachmentRepository", () => {
  describe("create", () => {
    it("creates an attachment and returns it", async () => {
      const attachment = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "attuser1",
            email: "att1@example.com",
            passwordHash: "hash",
            displayName: "Att User 1",
          });
          const expRepo = yield* ExpenseRepository;
          const expense = yield* expRepo.create({
            userId: user.id,
            type: "EXPENSE",
            amount: 10.0,
            currency: "USD",
            description: "Test",
            date: "2024-01-01",
          });
          const repo = yield* AttachmentRepository;
          return yield* repo.create(makeAttachmentData(expense.id, user.id));
        }),
      );
      expect(attachment.filename).toBe("receipt.jpg");
      expect(attachment.contentType).toBe("image/jpeg");
      expect(attachment.size).toBe(1024);
      expect(attachment.id).toBeTruthy();
    });
  });

  describe("findByExpenseId", () => {
    it("returns all attachments for an expense", async () => {
      const attachments = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "attuser2",
            email: "att2@example.com",
            passwordHash: "hash",
            displayName: "Att User 2",
          });
          const expRepo = yield* ExpenseRepository;
          const expense = yield* expRepo.create({
            userId: user.id,
            type: "EXPENSE",
            amount: 10.0,
            currency: "USD",
            description: "Test",
            date: "2024-01-01",
          });
          const repo = yield* AttachmentRepository;
          yield* repo.create(makeAttachmentData(expense.id, user.id));
          yield* repo.create({
            ...makeAttachmentData(expense.id, user.id),
            filename: "invoice.pdf",
            contentType: "application/pdf",
          });
          return yield* repo.findByExpenseId(expense.id);
        }),
      );
      expect(attachments).toHaveLength(2);
    });

    it("returns empty array when no attachments", async () => {
      const attachments = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* AttachmentRepository;
          return yield* repo.findByExpenseId("nonexistent-expense");
        }),
      );
      expect(attachments).toHaveLength(0);
    });
  });

  describe("findById", () => {
    it("returns the attachment when found", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "attuser3",
            email: "att3@example.com",
            passwordHash: "hash",
            displayName: "Att User 3",
          });
          const expRepo = yield* ExpenseRepository;
          const expense = yield* expRepo.create({
            userId: user.id,
            type: "EXPENSE",
            amount: 10.0,
            currency: "USD",
            description: "Test",
            date: "2024-01-01",
          });
          const repo = yield* AttachmentRepository;
          const created = yield* repo.create(makeAttachmentData(expense.id, user.id));
          return yield* repo.findById(created.id);
        }),
      );
      expect(found).not.toBeNull();
      expect(found?.filename).toBe("receipt.jpg");
    });

    it("returns null when not found", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* AttachmentRepository;
          return yield* repo.findById("nonexistent");
        }),
      );
      expect(found).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing attachment", async () => {
      const found = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const userRepo = yield* UserRepository;
          const user = yield* userRepo.create({
            username: "attuser4",
            email: "att4@example.com",
            passwordHash: "hash",
            displayName: "Att User 4",
          });
          const expRepo = yield* ExpenseRepository;
          const expense = yield* expRepo.create({
            userId: user.id,
            type: "EXPENSE",
            amount: 10.0,
            currency: "USD",
            description: "Test",
            date: "2024-01-01",
          });
          const repo = yield* AttachmentRepository;
          const created = yield* repo.create(makeAttachmentData(expense.id, user.id));
          yield* repo.delete(created.id);
          return yield* repo.findById(created.id);
        }),
      );
      expect(found).toBeNull();
    });

    it("fails with NotFoundError when attachment does not exist", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          yield* initDb;
          const repo = yield* AttachmentRepository;
          return yield* Effect.either(repo.delete("nonexistent"));
        }),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as { _tag: string })._tag).toBe("NotFoundError");
      }
    });
  });
});
