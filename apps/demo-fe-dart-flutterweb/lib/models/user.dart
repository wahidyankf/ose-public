import 'package:demo_contracts/demo_contracts.dart' as gen;

class User {
  final String id;
  final String username;
  final String email;
  final String displayName;
  final String status;
  final List<String> roles;
  final String createdAt;
  final String updatedAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    required this.status,
    required this.roles,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final g = gen.User.fromJson(json)!;
    return User(
      id: g.id,
      username: g.username,
      email: g.email,
      displayName: g.displayName,
      status: g.status.value,
      roles: List<String>.from(g.roles),
      createdAt: g.createdAt.toIso8601String(),
      updatedAt: g.updatedAt.toIso8601String(),
    );
  }
}

class UserListResponse {
  final List<User> content;
  final int totalElements;
  final int totalPages;
  final int page;
  final int size;

  const UserListResponse({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.page,
    required this.size,
  });

  factory UserListResponse.fromJson(Map<String, dynamic> json) {
    final g = gen.UserListResponse.fromJson(json)!;
    return UserListResponse(
      content: g.content.map(
        (u) => User(
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.displayName,
          status: u.status.value,
          roles: List<String>.from(u.roles),
          createdAt: u.createdAt.toIso8601String(),
          updatedAt: u.updatedAt.toIso8601String(),
        ),
      ).toList(),
      totalElements: g.totalElements,
      totalPages: g.totalPages,
      page: g.page,
      size: g.size,
    );
  }
}

class UpdateProfileRequest {
  final String displayName;

  const UpdateProfileRequest({required this.displayName});

  Map<String, dynamic> toJson() {
    final g = gen.UpdateProfileRequest(displayName: displayName);
    return g.toJson();
  }
}

class ChangePasswordRequest {
  final String oldPassword;
  final String newPassword;

  const ChangePasswordRequest({
    required this.oldPassword,
    required this.newPassword,
  });

  Map<String, dynamic> toJson() {
    final g = gen.ChangePasswordRequest(
      oldPassword: oldPassword,
      newPassword: newPassword,
    );
    return g.toJson();
  }
}

class DisableRequest {
  final String reason;

  const DisableRequest({required this.reason});

  Map<String, dynamic> toJson() {
    final g = gen.DisableRequest(reason: reason);
    return g.toJson();
  }
}

class PasswordResetResponse {
  final String token;

  const PasswordResetResponse({required this.token});

  factory PasswordResetResponse.fromJson(Map<String, dynamic> json) {
    final g = gen.PasswordResetResponse.fromJson(json)!;
    return PasswordResetResponse(token: g.token);
  }
}
