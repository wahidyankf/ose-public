import 'package:dio/dio.dart';
import 'package:web/web.dart';

const _tokenKey = 'demo_fe_access_token';
const _refreshKey = 'demo_fe_refresh_token';

String? getAccessToken() => window.localStorage.getItem(_tokenKey);
String? getRefreshToken() => window.localStorage.getItem(_refreshKey);

void setTokens(String access, String refresh) {
  window.localStorage.setItem(_tokenKey, access);
  window.localStorage.setItem(_refreshKey, refresh);
  window.dispatchEvent(CustomEvent('auth:set'));
}

void clearTokens() {
  window.localStorage.removeItem(_tokenKey);
  window.localStorage.removeItem(_refreshKey);
  window.dispatchEvent(CustomEvent('auth:cleared'));
}

class ApiError {
  final int status;
  final dynamic body;

  ApiError(this.status, this.body);

  @override
  String toString() => 'ApiError: $status';
}

Dio createApiClient() {
  final dio = Dio(BaseOptions(
    baseUrl: '',
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      final token = getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        window.sessionStorage.setItem(
          'auth_error',
          'Your account has been disabled or deactivated. Please log in again.',
        );
        clearTokens();
      }
      return handler.next(error);
    },
  ));

  return dio;
}

final apiClient = createApiClient();
