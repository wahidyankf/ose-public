/// Admin user-management API functions.
///
/// Wraps the `/api/v1/admin/users/*` endpoints. All functions require the
/// caller to hold the ADMIN role; the backend returns 403 otherwise.
library;

import 'package:demo_fe_dart_flutter/core/api/api_client.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';

/// Returns a paginated list of all users.
///
/// [search] is an optional username/email filter substring.
Future<UserListResponse> listUsers({
  int page = 1,
  int size = 20,
  String? search,
}) async {
  final queryParameters = <String, dynamic>{
    'page': page,
    'size': size,
    if (search != null && search.isNotEmpty) 'search': search,
  };

  final response = await dio.get<Map<String, dynamic>>(
    '/api/v1/admin/users',
    queryParameters: queryParameters,
  );
  return UserListResponse.fromJson(response.data!);
}

/// Disables a user account.
///
/// [reason] is stored in the audit log and displayed to the user on login.
Future<void> disableUser(String id, String reason) async {
  await dio.post<void>(
    '/api/v1/admin/users/$id/disable',
    data: {'reason': reason},
  );
}

/// Re-enables a previously disabled user account.
Future<void> enableUser(String id) async {
  await dio.post<void>('/api/v1/admin/users/$id/enable');
}

/// Unlocks a user account that was locked due to repeated login failures.
Future<void> unlockUser(String id) async {
  await dio.post<void>('/api/v1/admin/users/$id/unlock');
}

/// Forces a password reset for the specified user on next login.
Future<void> forcePasswordReset(String id) async {
  await dio.post<void>('/api/v1/admin/users/$id/force-password-reset');
}
