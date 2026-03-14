/// Shared mock providers and helpers for BDD widget tests.
///
/// Provides [ProviderScope] overrides that substitute mock Riverpod state
/// in place of the real network-backed implementations. Each test domain
/// may use the helpers here to avoid duplication.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';
import 'package:demo_fe_dart_flutter/core/providers/auth_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/expense_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/user_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/admin_provider.dart';

// ---------------------------------------------------------------------------
// Mock AuthNotifier
// ---------------------------------------------------------------------------

class MockAuthNotifier extends AuthNotifier {
  bool loginShouldSucceed = true;
  bool loginShouldReturnDeactivated = false;
  bool loginShouldReturnLocked = false;
  String? accessTokenOverride;
  String? refreshTokenOverride;

  @override
  Future<void> login({required String username, required String password}) async {
    if (loginShouldReturnDeactivated) {
      throw Exception('Your account is deactivated or disabled.');
    }
    if (loginShouldReturnLocked) {
      throw Exception('Your account has been locked due to too many failed login attempts.');
    }
    if (!loginShouldSucceed) {
      throw Exception('Invalid username or password.');
    }
    state = AuthState(
      accessToken: accessTokenOverride ?? 'mock.access.token',
      refreshToken: refreshTokenOverride ?? 'mock.refresh.token',
    );
  }

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
  }) async {
    state = const AuthState(
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    );
  }

  @override
  Future<void> logout() async {
    state = const AuthState.unauthenticated();
  }

  @override
  Future<void> logoutAll() async {
    state = const AuthState.unauthenticated();
  }

  @override
  Future<void> refresh() async {
    state = const AuthState(
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    );
  }
}

// ---------------------------------------------------------------------------
// Mock UserNotifier
// ---------------------------------------------------------------------------

class MockUserNotifier extends UserNotifier {
  MockUserNotifier(super.ref);

  bool changePasswordShouldSucceed = true;

  @override
  Future<void> updateProfile(String displayName) async {
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    if (!changePasswordShouldSucceed) {
      state = AsyncValue.error(Exception('Invalid username or password.'), StackTrace.current);
      return;
    }
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> deactivateAccount() async {
    state = const AsyncValue.data(null);
  }
}

// ---------------------------------------------------------------------------
// Mock ExpenseNotifier
// ---------------------------------------------------------------------------

class MockExpenseNotifier extends ExpenseNotifier {
  MockExpenseNotifier(super.ref);

  Expense? expenseToReturn;

  @override
  Future<Expense?> createExpense({
    required String title,
    required double amount,
    required String currency,
    required String category,
    required String expenseDate,
    String? description,
  }) async {
    state = const AsyncValue.data(null);
    return expenseToReturn ?? Expense(
      id: 'exp-001',
      userId: 'user-001',
      title: title,
      amount: amount,
      currency: currency,
      category: category,
      expenseDate: expenseDate,
      createdAt: '2025-01-15T00:00:00Z',
      description: description,
    );
  }

  @override
  Future<Expense?> updateExpense(
    String id, {
    String? title,
    double? amount,
    String? currency,
    String? category,
    String? expenseDate,
    String? description,
  }) async {
    state = const AsyncValue.data(null);
    return Expense(
      id: id,
      userId: 'user-001',
      title: title ?? 'Updated',
      amount: amount ?? 10.0,
      currency: currency ?? 'USD',
      category: category ?? 'food',
      expenseDate: expenseDate ?? '2025-01-15',
      createdAt: '2025-01-15T00:00:00Z',
      description: description,
    );
  }

  @override
  Future<void> deleteExpense(String id) async {
    state = const AsyncValue.data(null);
  }
}

// ---------------------------------------------------------------------------
// Mock AdminNotifier
// ---------------------------------------------------------------------------

class MockAdminNotifier extends AdminNotifier {
  MockAdminNotifier(super.ref);

  @override
  Future<void> disableUser(String id, String reason) async {
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> enableUser(String id) async {
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> unlockUser(String id) async {
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> forcePasswordReset(String id) async {
    state = const AsyncValue.data(null);
  }
}

// ---------------------------------------------------------------------------
// Stub data builders
// ---------------------------------------------------------------------------

/// Creates a minimal authenticated [AuthState].
AuthState authenticatedState({
  String accessToken = 'mock.access.token',
  String refreshToken = 'mock.refresh.token',
}) =>
    AuthState(accessToken: accessToken, refreshToken: refreshToken);

/// Creates a standard mock [User] for tests.
User mockUser({
  String id = 'user-001',
  String username = 'alice',
  String email = 'alice@example.com',
  String displayName = 'Alice',
  String role = 'USER',
  String status = 'ACTIVE',
}) =>
    User(
      id: id,
      username: username,
      email: email,
      displayName: displayName,
      role: role,
      status: status,
      createdAt: '2025-01-01T00:00:00Z',
    );

/// Creates a mock [Expense] for tests.
Expense mockExpense({
  String id = 'exp-001',
  String userId = 'user-001',
  String title = 'Lunch',
  double amount = 10.50,
  String currency = 'USD',
  String category = 'food',
  String expenseDate = '2025-01-15',
  String? description,
}) =>
    Expense(
      id: id,
      userId: userId,
      title: title,
      amount: amount,
      currency: currency,
      category: category,
      expenseDate: expenseDate,
      createdAt: '2025-01-15T00:00:00Z',
      description: description ?? title,
    );

/// Creates a mock [ExpenseListResponse].
ExpenseListResponse mockExpenseList(List<Expense> expenses) =>
    ExpenseListResponse(
      expenses: expenses,
      total: expenses.length,
      page: 1,
      size: 20,
    );

/// Creates a mock admin [User].
User mockAdminUser({
  String id = 'admin-001',
  String username = 'superadmin',
  String email = 'admin@example.com',
}) =>
    User(
      id: id,
      username: username,
      email: email,
      displayName: 'Super Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00Z',
    );

/// Creates a mock [UserListResponse].
UserListResponse mockUserList(List<User> users) => UserListResponse(
      users: users,
      total: users.length,
      page: 1,
      size: 20,
    );

/// Creates an [Attachment] mock.
Attachment mockAttachment({
  String id = 'att-001',
  String expenseId = 'exp-001',
  String filename = 'receipt.jpg',
  String contentType = 'image/jpeg',
  int fileSize = 1024,
}) =>
    Attachment(
      id: id,
      expenseId: expenseId,
      filename: filename,
      contentType: contentType,
      fileSize: fileSize,
      createdAt: '2025-01-15T00:00:00Z',
    );

// ---------------------------------------------------------------------------
// Widget wrappers
// ---------------------------------------------------------------------------

/// Wraps [child] in a [MaterialApp] with a [ProviderScope] using the given
/// [overrides]. Use this for widget tests that don't need full routing.
Widget buildTestApp(
  Widget child, {
  List<Override> overrides = const [],
}) =>
    ProviderScope(
      overrides: overrides,
      child: MaterialApp(home: child),
    );
