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
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      status: json['status'] as String,
      roles: (json['roles'] as List<dynamic>).cast<String>(),
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
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
    return UserListResponse(
      content: (json['content'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalElements: json['totalElements'] as int,
      totalPages: json['totalPages'] as int,
      page: json['page'] as int,
      size: json['size'] as int,
    );
  }
}

class UpdateProfileRequest {
  final String displayName;

  const UpdateProfileRequest({required this.displayName});

  Map<String, dynamic> toJson() => {'displayName': displayName};
}

class ChangePasswordRequest {
  final String oldPassword;
  final String newPassword;

  const ChangePasswordRequest({
    required this.oldPassword,
    required this.newPassword,
  });

  Map<String, dynamic> toJson() => {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      };
}

class DisableRequest {
  final String reason;

  const DisableRequest({required this.reason});

  Map<String, dynamic> toJson() => {'reason': reason};
}

class PasswordResetResponse {
  final String token;

  const PasswordResetResponse({required this.token});

  factory PasswordResetResponse.fromJson(Map<String, dynamic> json) {
    return PasswordResetResponse(token: json['token'] as String);
  }
}
