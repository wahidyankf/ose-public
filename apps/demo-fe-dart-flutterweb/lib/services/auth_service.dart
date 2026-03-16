import '../models/auth.dart';
import '../models/health.dart';
import 'api_client.dart';

Future<HealthResponse> getHealth() async {
  final response = await apiClient.get<Map<String, dynamic>>('/health');
  return HealthResponse.fromJson(response.data!);
}

Future<void> register(RegisterRequest data) async {
  await apiClient.post<void>(
    '/api/v1/auth/register',
    data: data.toJson(),
  );
}

Future<AuthTokens> login(LoginRequest data) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/auth/login',
    data: data.toJson(),
  );
  return AuthTokens.fromJson(response.data!);
}

Future<AuthTokens> refreshToken(String token) async {
  final response = await apiClient.post<Map<String, dynamic>>(
    '/api/v1/auth/refresh',
    data: {'refreshToken': token},
  );
  return AuthTokens.fromJson(response.data!);
}

Future<void> logout(String token) async {
  await apiClient.post<void>(
    '/api/v1/auth/logout',
    data: {'refreshToken': token},
  );
}

Future<void> logoutAll() async {
  await apiClient.post<void>('/api/v1/auth/logout-all');
}
