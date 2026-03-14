import { apiFetch } from "./client";
import type { Expense, ExpenseListResponse, CreateExpenseRequest, UpdateExpenseRequest, ExpenseSummary } from "./types";

export function listExpenses(page = 0, size = 20): Promise<ExpenseListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<ExpenseListResponse>(`/api/v1/expenses?${params}`);
}

export function getExpense(id: string): Promise<Expense> {
  return apiFetch<Expense>(`/api/v1/expenses/${id}`);
}

export function createExpense(data: CreateExpenseRequest): Promise<Expense> {
  return apiFetch<Expense>("/api/v1/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
  return apiFetch<Expense>(`/api/v1/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch(`/api/v1/expenses/${id}`, {
    method: "DELETE",
  });
}

export function getExpenseSummary(currency?: string): Promise<ExpenseSummary[]> {
  const params = new URLSearchParams();
  if (currency) params.set("currency", currency);
  return apiFetch<ExpenseSummary[]>(`/api/v1/expenses/summary?${params}`);
}
