import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { ExpenseRepository } from "../infrastructure/db/expense-repo.js";
import { requireAuth } from "../auth/middleware.js";
import { ValidationError } from "../domain/errors.js";
import { CURRENCY_DECIMALS, isSupportedCurrency } from "../domain/types.js";
import type { PLReport, CategoryBreakdown } from "../lib/api/types.js";

function formatAmount(amount: number, currency: string): string {
  const upperCurrency = currency.toUpperCase();
  if (!isSupportedCurrency(upperCurrency)) {
    return amount.toFixed(2);
  }
  const decimals = CURRENCY_DECIMALS[upperCurrency];
  return amount.toFixed(decimals);
}

const getPL = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const url = new URL(req.url, "http://localhost");
      const from = url.searchParams.get("startDate") ?? url.searchParams.get("from") ?? "";
      const to = url.searchParams.get("endDate") ?? url.searchParams.get("to") ?? "";
      const currency = (url.searchParams.get("currency") ?? "").toUpperCase();

      if (!from) {
        return yield* Effect.fail(new ValidationError({ field: "startDate", message: "startDate is required" }));
      }
      if (!to) {
        return yield* Effect.fail(new ValidationError({ field: "endDate", message: "endDate is required" }));
      }
      if (!currency) {
        return yield* Effect.fail(new ValidationError({ field: "currency", message: "currency is required" }));
      }

      const expenseRepo = yield* ExpenseRepository;
      const expenses = yield* expenseRepo.findByDateRange(claims.sub, from, to, currency);

      let incomeTotal = 0;
      let expenseTotal = 0;
      const incomeBreakdownMap: Record<string, number> = {};
      const expenseBreakdownMap: Record<string, number> = {};

      for (const entry of expenses) {
        if (entry.type === "INCOME") {
          incomeTotal += entry.amount;
          const cat = entry.category || "uncategorized";
          incomeBreakdownMap[cat] = (incomeBreakdownMap[cat] ?? 0) + entry.amount;
        } else {
          expenseTotal += entry.amount;
          const cat = entry.category || "uncategorized";
          expenseBreakdownMap[cat] = (expenseBreakdownMap[cat] ?? 0) + entry.amount;
        }
      }

      const net = incomeTotal - expenseTotal;

      const incomeBreakdown: CategoryBreakdown[] = Object.entries(incomeBreakdownMap).map(([cat, amount]) => ({
        category: cat,
        type: "income",
        total: formatAmount(amount, currency),
      }));

      const expenseBreakdown: CategoryBreakdown[] = Object.entries(expenseBreakdownMap).map(([cat, amount]) => ({
        category: cat,
        type: "expense",
        total: formatAmount(amount, currency),
      }));

      const plResponse = {
        totalIncome: formatAmount(incomeTotal, currency),
        totalExpense: formatAmount(expenseTotal, currency),
        net: formatAmount(net, currency),
        incomeBreakdown,
        expenseBreakdown,
        currency,
      } as unknown as PLReport;
      return yield* HttpServerResponse.json(plResponse);
    }),
  ),
);

export const reportRouter = HttpRouter.empty.pipe(HttpRouter.get("/api/v1/reports/pl", getPL));
