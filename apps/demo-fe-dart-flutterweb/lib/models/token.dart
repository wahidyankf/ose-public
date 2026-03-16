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

  factory TokenClaims.fromJson(Map<String, dynamic> json) {
    return TokenClaims(
      sub: json['sub'] as String? ?? '',
      iss: json['iss'] as String? ?? '',
      exp: json['exp'] as int? ?? 0,
      iat: json['iat'] as int? ?? 0,
      roles: (json['roles'] as List<dynamic>?)?.cast<String>() ?? [],
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
    return JwkKey(
      kty: json['kty'] as String? ?? '',
      kid: json['kid'] as String? ?? '',
      use: json['use'] as String? ?? '',
      n: json['n'] as String? ?? '',
      e: json['e'] as String? ?? '',
    );
  }
}

class JwksResponse {
  final List<JwkKey> keys;

  const JwksResponse({required this.keys});

  factory JwksResponse.fromJson(Map<String, dynamic> json) {
    return JwksResponse(
      keys: (json['keys'] as List<dynamic>)
          .map((e) => JwkKey.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
