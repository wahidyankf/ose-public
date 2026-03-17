import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { ExpenseRepository } from "../infrastructure/db/expense-repo.js";
import { requireAuth } from "../auth/middleware.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../domain/errors.js";
import { validateAmount, validateUnit } from "../domain/expense.js";
import { CURRENCY_DECIMALS, isSupportedCurrency } from "../domain/types.js";
import type { ExpenseType } from "../domain/expense.js";
import type { CreateExpenseRequest, UpdateExpenseRequest, Expense, ExpenseListResponse } from "../lib/api/types.js";

function formatAmount(amount: number, currency: string): string {
  const upperCurrency = currency.toUpperCase();
  if (!isSupportedCurrency(upperCurrency)) {
    return amount.toString();
  }
  const decimals = CURRENCY_DECIMALS[upperCurrency];
  return amount.toFixed(decimals);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expenseToResponse(expense: {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  quantity: string | null;
  unit: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: expense.id,
    userId: expense.userId,
    type: expense.type.toLowerCase(),
    amount: formatAmount(expense.amount, expense.currency),
    currency: expense.currency,
    category: expense.category,
    description: expense.description,
    quantity: expense.quantity !== null ? Number(expense.quantity) : undefined,
    unit: expense.unit ?? undefined,
    date: expense.date,
  };
}

const createExpense = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const body = yield* req.json as Effect.Effect<CreateExpenseRequest, unknown>;

      const typeRaw = ((body["type"] as string | undefined) ?? "expense").toUpperCase() as ExpenseType;
      const amountRaw = body["amount"] as string | number | undefined;
      const currency = ((body["currency"] as string | undefined) ?? "").toUpperCase();
      const category = (body["category"] as string | undefined) ?? "";
      const description = (body["description"] as string | undefined) ?? "";
      const date = (body["date"] as string | undefined) ?? "";
      const quantityRaw = body["quantity"] as string | undefined;
      const unitRaw = body["unit"] as string | undefined;

      if (!description) {
        return yield* Effect.fail(new ValidationError({ field: "description", message: "Description is required" }));
      }
      if (!date) {
        return yield* Effect.fail(new ValidationError({ field: "date", message: "Date is required" }));
      }

      const amount = typeof amountRaw === "string" ? parseFloat(amountRaw) : (amountRaw ?? 0);
      if (isNaN(amount)) {
        return yield* Effect.fail(new ValidationError({ field: "amount", message: "Amount must be a number" }));
      }

      yield* validateAmount(currency, amount);

      if (unitRaw !== undefined && unitRaw !== "") {
        yield* validateUnit(unitRaw);
      }

      const expenseRepo = yield* ExpenseRepository;
      const createData: import("../domain/expense.js").CreateExpenseData = {
        userId: claims.sub,
        type: typeRaw,
        amount,
        currency,
        category,
        description,
        date,
        ...(quantityRaw !== undefined ? { quantity: quantityRaw } : {}),
        ...(unitRaw !== undefined ? { unit: unitRaw } : {}),
      };
      const expense = yield* expenseRepo.create(createData);

      return yield* HttpServerResponse.json(expenseToResponse(expense) as unknown as Expense, { status: 201 });
    }),
  ),
);

const listExpenses = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const url = new URL(req.url, "http://localhost");
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
      const size = Math.min(100, parseInt(url.searchParams.get("size") ?? "20", 10));

      const expenseRepo = yield* ExpenseRepository;
      const result = yield* expenseRepo.findByUserId(claims.sub, page, size);

      const listResponse = {
        content: result.items.map(expenseToResponse),
        totalElements: result.total,
        page,
        size,
      } as unknown as ExpenseListResponse;
      return yield* HttpServerResponse.json(listResponse);
    }),
  ),
);

const getExpense = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["id"] ?? "";

          const expenseRepo = yield* ExpenseRepository;
          const expense = yield* expenseRepo.findById(expenseId);

          if (!expense) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (expense.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          return yield* HttpServerResponse.json(expenseToResponse(expense) as unknown as Expense);
        }),
      ),
    ),
  ),
);

const updateExpense = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["id"] ?? "";
          const body = yield* req.json as Effect.Effect<UpdateExpenseRequest, unknown>;

          const expenseRepo = yield* ExpenseRepository;
          const existing = yield* expenseRepo.findById(expenseId);

          if (!existing) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (existing.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          const typeRaw =
            body["type"] !== undefined ? ((body["type"] as string).toUpperCase() as ExpenseType) : undefined;
          const amountRaw = body["amount"] as string | number | undefined;
          const currencyRaw = body["currency"] as string | undefined;
          const category = body["category"] as string | undefined;
          const description = body["description"] as string | undefined;
          const date = body["date"] as string | undefined;
          const quantityRaw = body["quantity"] as string | undefined;
          const unitRaw = body["unit"] as string | undefined;

          const currency = currencyRaw !== undefined ? currencyRaw.toUpperCase() : existing.currency;
          const amount =
            amountRaw !== undefined
              ? typeof amountRaw === "string"
                ? parseFloat(amountRaw)
                : amountRaw
              : existing.amount;

          if (amountRaw !== undefined || currencyRaw !== undefined) {
            yield* validateAmount(currency, amount);
          }

          if (unitRaw !== undefined && unitRaw !== "") {
            yield* validateUnit(unitRaw);
          }

          const updateData: Partial<import("../domain/expense.js").CreateExpenseData> = {
            ...(typeRaw !== undefined ? { type: typeRaw } : {}),
            ...(amountRaw !== undefined ? { amount } : {}),
            ...(currencyRaw !== undefined ? { currency } : {}),
            ...(category !== undefined ? { category } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(quantityRaw !== undefined ? { quantity: quantityRaw } : {}),
            ...(unitRaw !== undefined ? { unit: unitRaw } : {}),
            ...(date !== undefined ? { date } : {}),
          };
          const updated = yield* expenseRepo.update(expenseId, updateData);

          return yield* HttpServerResponse.json(expenseToResponse(updated) as unknown as Expense);
        }),
      ),
    ),
  ),
);

const deleteExpense = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["id"] ?? "";

          const expenseRepo = yield* ExpenseRepository;
          const existing = yield* expenseRepo.findById(expenseId);

          if (!existing) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (existing.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          yield* expenseRepo.delete(expenseId);
          return yield* HttpServerResponse.empty({ status: 204 });
        }),
      ),
    ),
  ),
);

const getExpenseSummary = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const expenseRepo = yield* ExpenseRepository;
      const summary = yield* expenseRepo.summarize(claims.sub);

      // Return flat object: { "USD": "30.00", "IDR": "150000" }
      // Only include currencies with a positive expense total (matches Go/Clojure behaviour)
      const result: Record<string, string> = {};
      for (const [currency, { expense }] of Object.entries(summary)) {
        if (expense > 0) {
          result[currency] = formatAmount(expense, currency);
        }
      }

      return yield* HttpServerResponse.json(result);
    }),
  ),
);

export const expenseRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/v1/expenses", createExpense),
  HttpRouter.get("/api/v1/expenses", listExpenses),
  HttpRouter.get("/api/v1/expenses/summary", getExpenseSummary),
  HttpRouter.get("/api/v1/expenses/:id", getExpense),
  HttpRouter.put("/api/v1/expenses/:id", updateExpense),
  HttpRouter.del("/api/v1/expenses/:id", deleteExpense),
);
