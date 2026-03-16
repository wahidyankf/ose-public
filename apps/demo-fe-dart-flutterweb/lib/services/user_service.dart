import '../models/user.dart';
import 'api_client.dart';

Future<User> getCurrentUser() async {
  final response =
      await apiClient.get<Map<String, dynamic>>('/api/v1/users/me');
  return User.fromJson(response.data!);
}

Future<User> updateProfile(UpdateProfileRequest data) async {
  final response = await apiClient.patch<Map<String, dynamic>>(
    '/api/v1/users/me',
    data: data.toJson(),
  );
  return User.fromJson(response.data!);
}

Future<void> changePassword(ChangePasswordRequest data) async {
  await apiClient.post<void>(
    '/api/v1/users/me/password',
    data: data.toJson(),
  );
}

Future<void> deactivateAccount() async {
  await apiClient.post<void>('/api/v1/users/me/deactivate');
}
