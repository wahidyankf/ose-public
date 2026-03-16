import 'dart:convert';

import '../models/token.dart';
import 'api_client.dart';

Future<JwksResponse> getJwks() async {
  final response =
      await apiClient.get<Map<String, dynamic>>('/.well-known/jwks.json');
  return JwksResponse.fromJson(response.data!);
}

Map<String, dynamic> decodeTokenClaims(String token) {
  final parts = token.split('.');
  if (parts.length != 3) throw Exception('Invalid JWT format');

  final payload = parts[1];
  // Handle base64url encoding
  final normalized = payload.replaceAll('-', '+').replaceAll('_', '/');
  final padded = normalized.padRight(
    (normalized.length + 3) & ~3,
    '=',
  );
  final decoded = utf8.decode(base64Decode(padded));
  return jsonDecode(decoded) as Map<String, dynamic>;
}
