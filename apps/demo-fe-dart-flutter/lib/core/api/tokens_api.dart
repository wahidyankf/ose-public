/// Token introspection API functions.
///
/// Provides access to the JWKS endpoint and a helper for decoding JWT claims
/// without signature verification (useful for displaying user info in the UI).
library;

import 'dart:convert';

import 'package:demo_fe_dart_flutter/core/api/api_client.dart';

/// Returns the JSON Web Key Set published by the backend.
///
/// The JWKS is available without authentication at the well-known path.
Future<Map<String, dynamic>> getJwks() async {
  final response = await dio.get<Map<String, dynamic>>(
    '/.well-known/jwks.json',
  );
  return response.data!;
}

/// Decodes the payload claims of a JWT without verifying the signature.
///
/// This is intentionally insecure — it is used only for display purposes
/// (e.g. showing the current user's role in the UI). Never rely on these
/// claims for access control; trust only the backend's authoritative checks.
///
/// Returns the decoded claims map, or an empty map if [token] is malformed.
Map<String, dynamic> decodeTokenClaims(String token) {
  final parts = token.split('.');
  if (parts.length != 3) {
    return {};
  }

  try {
    // JWT uses base64url encoding without padding.
    final payload = parts[1];
    final normalized = base64Url.normalize(payload);
    final decoded = utf8.decode(base64Url.decode(normalized));
    final claims = json.decode(decoded) as Map<String, dynamic>;
    return claims;
  } on FormatException {
    return {};
  }
}
