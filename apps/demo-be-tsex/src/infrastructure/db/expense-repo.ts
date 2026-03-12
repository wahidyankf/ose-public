import { Context, Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { SqlError } from "@effect/sql/SqlError";
import type { Expense, CreateExpenseData } from "../../domain/expense.js";
import { NotFoundError } from "../../domain/errors.js";

export interface ExpenseRepositoryApi {
  readonly create: (data: CreateExpenseData) => Effect.Effect<Expense, SqlError>;
  readonly findById: (id: string) => Effect.Effect<Expense | null, SqlError>;
  readonly findByUserId: (
    userId: string,
    page: number,
    size: number,
  ) => Effect.Effect<{ items: Expense[]; total: number }, SqlError>;
  readonly update: (id: string, data: Partial<CreateExpenseData>) => Effect.Effect<Expense, NotFoundError | SqlError>;
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | SqlError>;
  readonly summarize: (userId: string) => Effect.Effect<Record<string, { income: number; expense: number }>, SqlError>;
  readonly findByDateRange: (
    userId: string,
    from: string,
    to: string,
    currency: string,
  ) => Effect.Effect<Expense[], SqlError>;
}

export class ExpenseRepository extends Context.Tag("ExpenseRepository")<ExpenseRepository, ExpenseRepositoryApi>() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExpense(row: any): Expense {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Expense["type"],
    amount: row.amount as number,
    currency: row.currency as string,
    description: row.description as string,
    quantity: row.quantity as string | null,
    unit: row.unit as string | null,
    date: row.date as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export const ExpenseRepositoryLive = Layer.effect(
  ExpenseRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return {
      create: (data: CreateExpenseData) =>
        Effect.gen(function* () {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          const quantity = data.quantity ?? null;
          const unit = data.unit ?? null;
          yield* sql`
            INSERT INTO expenses (id, user_id, type, amount, currency, description, quantity, unit, date, created_at, updated_at)
            VALUES (${id}, ${data.userId}, ${data.type}, ${data.amount}, ${data.currency}, ${data.description}, ${quantity}, ${unit}, ${data.date}, ${now}, ${now})
          `;
          const rows = yield* sql`SELECT * FROM expenses WHERE id = ${id}`;
          return rowToExpense(rows[0]);
        }),

      findById: (id: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM expenses WHERE id = ${id}`;
          const row = rows[0];
          return row ? rowToExpense(row) : null;
        }),

      findByUserId: (userId: string, page: number, size: number) =>
        Effect.gen(function* () {
          const offset = (page - 1) * size;
          const countRows = yield* sql`SELECT COUNT(*) as count FROM expenses WHERE user_id = ${userId}`;
          const total = (countRows[0]?.count as number) ?? 0;
          const rows =
            yield* sql`SELECT * FROM expenses WHERE user_id = ${userId} ORDER BY date DESC LIMIT ${size} OFFSET ${offset}`;
          return { items: rows.map(rowToExpense), total };
        }),

      update: (id: string, data: Partial<CreateExpenseData>) =>
        Effect.gen(function* () {
          const existing = yield* sql`SELECT * FROM expenses WHERE id = ${id}`;
          if (!existing[0]) {
            return yield* Effect.fail(new NotFoundError({ resource: `Expense ${id}` }));
          }
          const now = new Date().toISOString();
          const current = rowToExpense(existing[0]);
          const amount = data.amount ?? current.amount;
          const currency = data.currency ?? current.currency;
          const description = data.description ?? current.description;
          const quantity = data.quantity ?? current.quantity ?? null;
          const unit = data.unit ?? current.unit ?? null;
          const date = data.date ?? current.date;
          const type = data.type ?? current.type;
          yield* sql`
            UPDATE expenses
            SET type = ${type}, amount = ${amount}, currency = ${currency},
                description = ${description}, quantity = ${quantity}, unit = ${unit},
                date = ${date}, updated_at = ${now}
            WHERE id = ${id}
          `;
          const rows = yield* sql`SELECT * FROM expenses WHERE id = ${id}`;
          return rowToExpense(rows[0]);
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          const existing = yield* sql`SELECT * FROM expenses WHERE id = ${id}`;
          if (!existing[0]) {
            return yield* Effect.fail(new NotFoundError({ resource: `Expense ${id}` }));
          }
          yield* sql`DELETE FROM expenses WHERE id = ${id}`;
        }),

      summarize: (userId: string) =>
        Effect.gen(function* () {
          const rows =
            yield* sql`SELECT currency, type, SUM(amount) as total FROM expenses WHERE user_id = ${userId} GROUP BY currency, type`;
          const summary: Record<string, { income: number; expense: number }> = {};
          for (const row of rows) {
            const currency = row.currency as string;
            if (!summary[currency]) {
              summary[currency] = { income: 0, expense: 0 };
            }
            const entry = summary[currency];
            if (entry) {
              if (row.type === "INCOME") {
                entry.income += row.total as number;
              } else {
                entry.expense += row.total as number;
              }
            }
          }
          return summary;
        }),

      findByDateRange: (userId: string, from: string, to: string, currency: string) =>
        Effect.gen(function* () {
          const rows =
            yield* sql`SELECT * FROM expenses WHERE user_id = ${userId} AND currency = ${currency} AND date >= ${from} AND date <= ${to} ORDER BY date ASC`;
          return rows.map(rowToExpense);
        }),
    };
  }),
);
