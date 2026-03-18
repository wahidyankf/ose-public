import 'package:demo_contracts/demo_contracts.dart' as gen;

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final String tokenType;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    this.tokenType = 'Bearer',
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    // Normalize: supply a default tokenType when absent for backward
    // compatibility with backends that omit it.
    final normalized = Map<String, dynamic>.from(json);
    normalized.putIfAbsent('tokenType', () => 'Bearer');
    final g = gen.AuthTokens.fromJson(normalized)!;
    return AuthTokens(
      accessToken: g.accessToken,
      refreshToken: g.refreshToken,
      tokenType: g.tokenType,
    );
  }

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'tokenType': tokenType,
      };
}

class LoginRequest {
  final String username;
  final String password;

  const LoginRequest({required this.username, required this.password});

  Map<String, dynamic> toJson() {
    final g = gen.LoginRequest(username: username, password: password);
    return g.toJson();
  }
}

class RegisterRequest {
  final String username;
  final String email;
  final String password;

  const RegisterRequest({
    required this.username,
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    final g = gen.RegisterRequest(
      username: username,
      email: email,
      password: password,
    );
    return g.toJson();
  }
}
