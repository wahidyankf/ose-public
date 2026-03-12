import { Context, Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { SqlError } from "@effect/sql/SqlError";
import type { Attachment, CreateAttachmentData } from "../../domain/attachment.js";
import { NotFoundError } from "../../domain/errors.js";

export interface AttachmentRepositoryApi {
  readonly create: (data: CreateAttachmentData) => Effect.Effect<Attachment, SqlError>;
  readonly findByExpenseId: (expenseId: string) => Effect.Effect<Attachment[], SqlError>;
  readonly findById: (id: string) => Effect.Effect<Attachment | null, SqlError>;
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | SqlError>;
}

export class AttachmentRepository extends Context.Tag("AttachmentRepository")<
  AttachmentRepository,
  AttachmentRepositoryApi
>() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAttachment(row: any): Attachment {
  return {
    id: row.id as string,
    expenseId: row.expense_id as string,
    userId: row.user_id as string,
    filename: row.filename as string,
    contentType: row.content_type as string,
    size: row.size as number,
    data: Buffer.from(row.data as Uint8Array),
    createdAt: new Date(row.created_at as string),
  };
}

export const AttachmentRepositoryLive = Layer.effect(
  AttachmentRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return {
      create: (data: CreateAttachmentData) =>
        Effect.gen(function* () {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          yield* sql`
            INSERT INTO attachments (id, expense_id, user_id, filename, content_type, size, data, created_at)
            VALUES (${id}, ${data.expenseId}, ${data.userId}, ${data.filename}, ${data.contentType}, ${data.size}, ${data.data}, ${now})
          `;
          const rows = yield* sql`SELECT * FROM attachments WHERE id = ${id}`;
          return rowToAttachment(rows[0]);
        }),

      findByExpenseId: (expenseId: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM attachments WHERE expense_id = ${expenseId} ORDER BY created_at ASC`;
          return rows.map(rowToAttachment);
        }),

      findById: (id: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM attachments WHERE id = ${id}`;
          const row = rows[0];
          return row ? rowToAttachment(row) : null;
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          const existing = yield* sql`SELECT * FROM attachments WHERE id = ${id}`;
          if (!existing[0]) {
            return yield* Effect.fail(new NotFoundError({ resource: `Attachment ${id}` }));
          }
          yield* sql`DELETE FROM attachments WHERE id = ${id}`;
        }),
    };
  }),
);
