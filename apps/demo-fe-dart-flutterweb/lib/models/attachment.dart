import 'package:demo_contracts/demo_contracts.dart' as gen;

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
    final g = gen.Attachment.fromJson(json)!;
    return Attachment(
      id: g.id,
      filename: g.filename,
      contentType: g.contentType,
      size: g.size,
      createdAt: g.createdAt.toIso8601String(),
    );
  }
}
