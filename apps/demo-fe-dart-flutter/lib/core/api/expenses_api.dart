/// Expense CRUD and summary API functions.
///
/// Wraps the `/api/v1/expenses/*` endpoints.
library;

import 'package:demo_fe_dart_flutter/core/api/api_client.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';

/// Returns a paginated list of expenses for the authenticated user.
Future<ExpenseListResponse> listExpenses({int page = 1, int size = 20}) async {
  final response = await dio.get<Map<String, dynamic>>(
    '/api/v1/expenses',
    queryParameters: {'page': page, 'size': size},
  );
  return ExpenseListResponse.fromJson(response.data!);
}

/// Returns a single expense by [id].
Future<Expense> getExpense(String id) async {
  final response = await dio.get<Map<String, dynamic>>('/api/v1/expenses/$id');
  return Expense.fromJson(response.data!);
}

/// Creates a new expense and returns the created [Expense].
Future<Expense> createExpense({
  required String title,
  required double amount,
  required String currency,
  required String category,
  required String expenseDate,
  String? description,
}) async {
  final response = await dio.post<Map<String, dynamic>>(
    '/api/v1/expenses',
    data: {
      'title': title,
      'amount': amount,
      'currency': currency,
      'category': category,
      'expense_date': expenseDate,
      if (description != null) 'description': description,
    },
  );
  return Expense.fromJson(response.data!);
}

/// Updates an existing expense and returns the updated [Expense].
///
/// Only non-null parameters are included in the request body.
Future<Expense> updateExpense(
  String id, {
  String? title,
  double? amount,
  String? currency,
  String? category,
  String? expenseDate,
  String? description,
}) async {
  final body = <String, dynamic>{
    if (title != null) 'title': title,
    if (amount != null) 'amount': amount,
    if (currency != null) 'currency': currency,
    if (category != null) 'category': category,
    if (expenseDate != null) 'expense_date': expenseDate,
    if (description != null) 'description': description,
  };

  final response = await dio.put<Map<String, dynamic>>(
    '/api/v1/expenses/$id',
    data: body,
  );
  return Expense.fromJson(response.data!);
}

/// Deletes the expense with [id].
Future<void> deleteExpense(String id) async {
  await dio.delete<void>('/api/v1/expenses/$id');
}

/// Returns an [ExpenseSummary] for the authenticated user filtered by
/// [currency].
Future<ExpenseSummary> getExpenseSummary(String currency) async {
  final response = await dio.get<Map<String, dynamic>>(
    '/api/v1/expenses/summary',
    queryParameters: {'currency': currency},
  );
  return ExpenseSummary.fromJson(response.data!);
}
