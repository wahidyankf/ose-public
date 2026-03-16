class AuthTokens {
  final String accessToken;
  final String refreshToken;

  const AuthTokens({required this.accessToken, required this.refreshToken});

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
      };
}

class LoginRequest {
  final String username;
  final String password;

  const LoginRequest({required this.username, required this.password});

  Map<String, dynamic> toJson() => {
        'username': username,
        'password': password,
      };
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

  Map<String, dynamic> toJson() => {
        'username': username,
        'email': email,
        'password': password,
      };
}
