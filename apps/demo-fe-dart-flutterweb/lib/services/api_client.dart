import 'dart:convert';
import 'dart:js_interop';

import 'package:dio/dio.dart' hide Headers;
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
    onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
      final token = getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (DioException error, ErrorInterceptorHandler handler) {
      final path = error.requestOptions.path;
      final isAuthRoute = path.contains('/auth/login') ||
          path.contains('/auth/register') ||
          path.contains('/auth/refresh');
      if (error.response?.statusCode == 401 && !isAuthRoute) {
        window.sessionStorage.setItem(
          'auth_error',
          'Your session has expired or your account has been disabled. Please log in again.',
        );
        clearTokens();
        window.dispatchEvent(CustomEvent('auth:401'));
      }
      return handler.next(error);
    },
  ));

  return dio;
}

final apiClient = createApiClient();

/// POST with keepalive: true — survives page navigation (for mutations).
Future<Map<String, dynamic>> keepalivePost(
  String url,
  Map<String, dynamic> body,
) async {
  final token = getAccessToken();
  final headers = <String, String>{
    'Content-Type': 'application/json',
  };
  if (token != null) {
    headers['Authorization'] = 'Bearer $token';
  }

  final jsHeaders = Headers();
  headers.forEach(jsHeaders.append);

  final response = await window
      .fetch(
        url.toJS,
        RequestInit(
          method: 'POST',
          headers: jsHeaders,
          body: jsonEncode(body).toJS,
          keepalive: true,
        ),
      )
      .toDart;

  if (!response.ok) {
    throw ApiError(response.status, null);
  }
  final text = (await response.text().toDart).toDart;
  return jsonDecode(text) as Map<String, dynamic>;
}

/// PUT with keepalive: true — survives page navigation (for mutations).
Future<Map<String, dynamic>> keepalivePut(
  String url,
  Map<String, dynamic> body,
) async {
  final token = getAccessToken();
  final headers = <String, String>{
    'Content-Type': 'application/json',
  };
  if (token != null) {
    headers['Authorization'] = 'Bearer $token';
  }

  final jsHeaders = Headers();
  headers.forEach(jsHeaders.append);

  final response = await window
      .fetch(
        url.toJS,
        RequestInit(
          method: 'PUT',
          headers: jsHeaders,
          body: jsonEncode(body).toJS,
          keepalive: true,
        ),
      )
      .toDart;

  if (!response.ok) {
    throw ApiError(response.status, null);
  }
  final text = (await response.text().toDart).toDart;
  return jsonDecode(text) as Map<String, dynamic>;
}

/// DELETE with keepalive: true — survives page navigation (for mutations).
Future<void> keepaliveDelete(String url) async {
  final token = getAccessToken();
  final jsHeaders = Headers();
  if (token != null) {
    jsHeaders.append('Authorization', 'Bearer $token');
  }

  await window
      .fetch(
        url.toJS,
        RequestInit(
          method: 'DELETE',
          headers: jsHeaders,
          keepalive: true,
        ),
      )
      .toDart;
}
