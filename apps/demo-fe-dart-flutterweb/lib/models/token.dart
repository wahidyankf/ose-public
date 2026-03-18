import 'package:demo_contracts/demo_contracts.dart' as gen;

class TokenClaims {
  final String sub;
  final String iss;
  final int exp;
  final int iat;
  final List<String> roles;

  const TokenClaims({
    required this.sub,
    required this.iss,
    required this.exp,
    required this.iat,
    required this.roles,
  });

  /// Parses JWT claims with defensive defaults for optional fields.
  ///
  /// JWT payloads may omit standard claims, so this constructor applies
  /// defaults rather than throwing on missing keys.
  factory TokenClaims.fromJson(Map<String, dynamic> json) {
    // Normalize: supply defaults for missing/null JWT claim fields before
    // delegating to the generated parser, which asserts required keys.
    final normalized = <String, dynamic>{
      'sub': json['sub'] ?? '',
      'iss': json['iss'] ?? '',
      'exp': json['exp'] ?? 0,
      'iat': json['iat'] ?? 0,
      'roles': json['roles'] ?? <String>[],
    };
    final g = gen.TokenClaims.fromJson(normalized)!;
    return TokenClaims(
      sub: g.sub,
      iss: g.iss,
      exp: g.exp,
      iat: g.iat,
      roles: List<String>.from(g.roles),
    );
  }
}

class JwkKey {
  final String kty;
  final String kid;
  final String use;
  final String n;
  final String e;

  const JwkKey({
    required this.kty,
    required this.kid,
    required this.use,
    required this.n,
    required this.e,
  });

  factory JwkKey.fromJson(Map<String, dynamic> json) {
    // Apply defensive defaults for optional JWK fields.
    final normalized = <String, dynamic>{
      'kty': json['kty'] ?? '',
      'kid': json['kid'] ?? '',
      'use': json['use'] ?? '',
      'n': json['n'] ?? '',
      'e': json['e'] ?? '',
    };
    final g = gen.JwkKey.fromJson(normalized)!;
    return JwkKey(
      kty: g.kty,
      kid: g.kid,
      use: g.use,
      n: g.n,
      e: g.e,
    );
  }
}

class JwksResponse {
  final List<JwkKey> keys;

  const JwksResponse({required this.keys});

  factory JwksResponse.fromJson(Map<String, dynamic> json) {
    final g = gen.JwksResponse.fromJson(json)!;
    return JwksResponse(
      keys: g.keys
          .map(
            (k) => JwkKey(
              kty: k.kty,
              kid: k.kid,
              use: k.use,
              n: k.n,
              e: k.e,
            ),
          )
          .toList(),
    );
  }
}
