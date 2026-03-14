import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as expensesApi from "../api/expenses";
import * as reportsApi from "../api/reports";
import type { CreateExpenseRequest, UpdateExpenseRequest } from "../api/types";

export function useExpenses(page = 0, size = 20) {
  return useQuery({
    queryKey: ["expenses", page, size],
    queryFn: () => expensesApi.listExpenses(page, size),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => expensesApi.getExpense(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesApi.createExpense(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) => expensesApi.updateExpense(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useExpenseSummary(currency?: string) {
  return useQuery({
    queryKey: ["expenseSummary", currency],
    queryFn: () => expensesApi.getExpenseSummary(currency),
  });
}

export function usePLReport(startDate: string, endDate: string, currency: string) {
  return useQuery({
    queryKey: ["plReport", startDate, endDate, currency],
    queryFn: () => reportsApi.getPLReport(startDate, endDate, currency),
    enabled: !!startDate && !!endDate && !!currency,
  });
}
