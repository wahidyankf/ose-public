import type { ExpenseRepository } from "@/repositories/interfaces";
import {
  ok,
  err,
  type ServiceResult,
  type Expense,
  SUPPORTED_CURRENCIES,
  CURRENCY_DECIMALS,
  SUPPORTED_UNITS,
  type SupportedCurrency,
  type SupportedUnit,
} from "@/lib/types";

interface ExpenseDeps {
  expenses: ExpenseRepository;
}

function formatExpense(e: Expense): Expense {
  const decimals = CURRENCY_DECIMALS[e.currency as SupportedCurrency] ?? 2;
  return {
    ...e,
    amount: parseFloat(e.amount).toFixed(decimals),
    type: e.type.toLowerCase(),
    quantity: e.quantity != null ? (parseFloat(e.quantity) as unknown as string) : null,
  };
}

export async function createExpense(
  deps: ExpenseDeps,
  userId: string,
  data: {
    amount: string;
    currency: string;
    category: string;
    description: string;
    date: string;
    type: string;
    quantity?: string;
    unit?: string;
  },
): Promise<ServiceResult<Expense>> {
  if (!data.amount) return err("Amount is required", 400);
  if (!data.currency) return err("Currency is required", 400);
  if (!data.category) return err("Category is required", 400);
  if (!data.description) return err("Description is required", 400);
  if (!data.date) return err("Date is required", 400);
  if (!data.type) return err("Type is required", 400);

  const upperCurrency = data.currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(upperCurrency as SupportedCurrency)) {
    return err(`Unsupported currency: ${data.currency}`, 400);
  }

  const upperType = data.type.toUpperCase();
  if (upperType !== "INCOME" && upperType !== "EXPENSE") {
    return err(`Invalid type: ${data.type}. Must be INCOME or EXPENSE`, 400);
  }

  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount < 0) return err("Amount must be a non-negative number", 400);

  if (data.unit && !SUPPORTED_UNITS.includes(data.unit as SupportedUnit)) {
    return err(`Unsupported unit: ${data.unit}`, 400);
  }

  const decimals = CURRENCY_DECIMALS[upperCurrency as SupportedCurrency];
  const normalizedAmount = amount.toFixed(decimals);

  const expense = await deps.expenses.create({
    userId,
    amount: normalizedAmount,
    currency: upperCurrency,
    category: data.category,
    description: data.description,
    date: data.date,
    type: upperType,
    quantity: data.quantity,
    unit: data.unit,
  });

  return ok(formatExpense(expense));
}

export async function getExpense(
  deps: ExpenseDeps,
  expenseId: string,
  userId: string,
): Promise<ServiceResult<Expense>> {
  const expense = await deps.expenses.findByIdAndUserId(expenseId, userId);
  if (!expense) return err("Expense not found", 404);
  return ok(formatExpense(expense));
}

export async function updateExpense(
  deps: ExpenseDeps,
  expenseId: string,
  userId: string,
  data: {
    amount: string;
    currency: string;
    category: string;
    description: string;
    date: string;
    type: string;
    quantity?: string | null;
    unit?: string | null;
  },
): Promise<ServiceResult<Expense>> {
  const existing = await deps.expenses.findByIdAndUserId(expenseId, userId);
  if (!existing) return err("Expense not found", 404);

  const upperCurrency = data.currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(upperCurrency as SupportedCurrency)) {
    return err(`Unsupported currency: ${data.currency}`, 400);
  }

  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount < 0) return err("Amount must be a non-negative number", 400);

  const decimals = CURRENCY_DECIMALS[upperCurrency as SupportedCurrency];
  const normalizedAmount = amount.toFixed(decimals);

  const updated = await deps.expenses.update(expenseId, {
    ...data,
    amount: normalizedAmount,
    currency: upperCurrency,
    type: data.type.toUpperCase(),
  });

  return ok(formatExpense(updated));
}

export async function deleteExpense(
  deps: ExpenseDeps,
  expenseId: string,
  userId: string,
): Promise<ServiceResult<{ message: string }>> {
  const existing = await deps.expenses.findByIdAndUserId(expenseId, userId);
  if (!existing) return err("Expense not found", 404);
  await deps.expenses.delete(expenseId);
  return ok({ message: "Expense deleted" });
}

export async function listExpenses(
  deps: ExpenseDeps,
  userId: string,
  page: number,
  size: number,
): Promise<ServiceResult<{ content: Expense[]; totalElements: number; page: number; size: number }>> {
  const safePage = Math.max(page, 1);
  const result = await deps.expenses.listByUserId(userId, safePage, size);
  return ok({
    content: result.items.map(formatExpense),
    totalElements: result.total,
    page: safePage,
    size,
  });
}

export async function getExpenseSummary(
  deps: ExpenseDeps,
  userId: string,
): Promise<ServiceResult<{ currency: string; totalIncome: string; totalExpense: string }[]>> {
  const summary = await deps.expenses.summaryByUserId(userId);
  return ok(summary);
}
