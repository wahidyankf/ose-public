class HealthResponse {
  final String status;

  const HealthResponse({required this.status});

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(status: json['status'] as String);
  }
}
