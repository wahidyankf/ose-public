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
  readonly findByDateRangeGroupedByCategory: (
    userId: string,
    from: string,
    to: string,
    currency: string,
    type: string,
  ) => Effect.Effect<Array<{ category: string; total: number }>, SqlError>;
}

export class ExpenseRepository extends Context.Tag("ExpenseRepository")<ExpenseRepository, ExpenseRepositoryApi>() {}

// DECIMAL(19,4) is returned as a string by PostgreSQL drivers; SQLite returns it as a number.
// parseFloat handles both cases safely.
//
// PostgreSQL DATE columns are returned as JavaScript Date objects by @effect/sql-pg.
// We normalize to a plain YYYY-MM-DD string to match the domain contract.
//
// PostgreSQL DECIMAL(19,4) quantity values (e.g. "50.5000") are stored as strings so that
// Number(quantity) in the route layer reconstructs the original numeric value correctly.

/**
 * Normalize a raw DB date value to a plain YYYY-MM-DD string.
 * PostgreSQL DATE columns arrive as JavaScript Date objects; SQLite returns plain strings.
 * Exported for unit testing.
 */
export function normalizeDate(raw: string | Date): string {
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
}

/**
 * Normalize a raw DB quantity value (null, number, or DECIMAL string) to a stripped string.
 * PostgreSQL DECIMAL(19,4) returns e.g. "50.5000"; we strip trailing zeros so that
 * Number(quantity) in the response layer produces the expected float (e.g. 50.5, 10).
 * Exported for unit testing.
 */
export function normalizeQuantity(raw: unknown): string | null {
  if (raw == null) return null;
  const str = String(raw);
  return str.includes(".") ? str.replace(/\.?0+$/, "") : str;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExpense(row: any): Expense {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Expense["type"],
    amount: parseFloat(String(row.amount)),
    currency: row.currency as string,
    category: (row.category as string) ?? "",
    description: row.description as string,
    quantity: normalizeQuantity(row.quantity),
    unit: row.unit as string | null,
    date: normalizeDate(row.date as string | Date),
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
          const category = data.category ?? "";
          yield* sql`
            INSERT INTO expenses (id, user_id, amount, currency, category, description, date, type, quantity, unit, created_at, created_by, updated_at, updated_by)
            VALUES (${id}, ${data.userId}, ${data.amount}, ${data.currency}, ${category}, ${data.description}, ${data.date}, ${data.type}, ${quantity}, ${unit}, ${now}, 'system', ${now}, 'system')
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
          const category = data.category ?? current.category;
          const description = data.description ?? current.description;
          const quantity = data.quantity ?? current.quantity ?? null;
          const unit = data.unit ?? current.unit ?? null;
          const date = data.date ?? current.date;
          const type = data.type ?? current.type;
          yield* sql`
            UPDATE expenses
            SET type = ${type}, amount = ${amount}, currency = ${currency},
                category = ${category}, description = ${description},
                quantity = ${quantity}, unit = ${unit},
                date = ${date}, updated_at = ${now}, updated_by = 'system'
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
                entry.income += parseFloat(String(row.total));
              } else {
                entry.expense += parseFloat(String(row.total));
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

      findByDateRangeGroupedByCategory: (userId: string, from: string, to: string, currency: string, type: string) =>
        Effect.gen(function* () {
          const rows =
            yield* sql`SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ${userId} AND currency = ${currency} AND type = ${type} AND date >= ${from} AND date <= ${to} GROUP BY category`;
          return rows.map((r) => ({
            category: r.category as string,
            total: parseFloat(String(r.total)),
          }));
        }),
    };
  }),
);
