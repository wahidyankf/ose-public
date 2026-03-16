import '../models/user.dart';
import 'api_client.dart';

Future<UserListResponse> listUsers({
  int page = 0,
  int size = 20,
  String? search,
}) async {
  final params = <String, dynamic>{'page': page, 'size': size};
  if (search != null && search.isNotEmpty) params['search'] = search;

  final response = await apiClient.get<Map<String, dynamic>>(
    '/api/v1/admin/users',
    queryParameters: params,
  );
  return UserListResponse.fromJson(response.data!);
}

Future<User> disableUser(String userId, DisableRequest data) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/admin/users/$userId/disable',
    data: data.toJson(),
  );
  return User.fromJson(response.data!);
}

Future<User> enableUser(String userId) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/admin/users/$userId/enable',
  );
  return User.fromJson(response.data!);
}

Future<User> unlockUser(String userId) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/admin/users/$userId/unlock',
  );
  return User.fromJson(response.data!);
}

Future<PasswordResetResponse> forcePasswordReset(String userId) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/admin/users/$userId/force-password-reset',
  );
  return PasswordResetResponse.fromJson(response.data!);
}
