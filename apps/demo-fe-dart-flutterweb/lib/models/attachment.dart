class Attachment {
  final String id;
  final String filename;
  final String contentType;
  final int size;
  final String createdAt;

  const Attachment({
    required this.id,
    required this.filename,
    required this.contentType,
    required this.size,
    required this.createdAt,
  });

  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      id: json['id'] as String,
      filename: json['filename'] as String,
      contentType: json['contentType'] as String,
      size: json['size'] as int,
      createdAt: json['createdAt'] as String,
    );
  }
}
