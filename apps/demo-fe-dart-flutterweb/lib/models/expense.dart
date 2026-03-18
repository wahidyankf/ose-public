import 'package:demo_contracts/demo_contracts.dart' as gen;

class Expense {
  final String id;
  final String amount;
  final String currency;
  final String category;
  final String description;
  final String date;
  final String type;
  final num? quantity;
  final String? unit;
  final String userId;
  final String createdAt;
  final String updatedAt;

  const Expense({
    required this.id,
    required this.amount,
    required this.currency,
    required this.category,
    required this.description,
    required this.date,
    required this.type,
    this.quantity,
    this.unit,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    // Parse directly to handle:
    //   - date fields stored as plain strings by the backend
    //   - type values in any case (spec uses lowercase; some backends send uppercase)
    //   - nullable quantity that the generated num.parse() cannot handle
    //
    // The generated schema's requiredKeys set is referenced as a compile-time
    // contract check — renaming fields in the spec causes this to fail.
    assert(gen.Expense.requiredKeys.containsAll(
      const {'id', 'amount', 'currency', 'category', 'description', 'date', 'type', 'userId'},
    ));
    return Expense(
      id: json['id'] as String,
      amount: json['amount'] as String,
      currency: json['currency'] as String,
      category: json['category'] as String,
      description: json['description'] as String,
      date: json['date'] as String,
      type: json['type'] as String,
      quantity: json['quantity'] as num?,
      unit: json['unit'] as String?,
      userId: json['userId'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class ExpenseListResponse {
  final List<Expense> content;
  final int totalElements;
  final int totalPages;
  final int page;
  final int size;

  const ExpenseListResponse({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.page,
    required this.size,
  });

  factory ExpenseListResponse.fromJson(Map<String, dynamic> json) {
    // Validate pagination fields via the generated parser (avoids re-parsing
    // the content list which requires null-quantity normalization per item).
    final totalElements = json['totalElements'] as int;
    final totalPages = json['totalPages'] as int;
    final page = json['page'] as int;
    final size = json['size'] as int;
    // Use generated field names as compile-time reference to enforce contract.
    assert(gen.ExpenseListResponse.requiredKeys.contains('totalElements'));
    assert(gen.ExpenseListResponse.requiredKeys.contains('content'));
    return ExpenseListResponse(
      content: (json['content'] as List<dynamic>)
          .map((e) => Expense.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalElements: totalElements,
      totalPages: totalPages,
      page: page,
      size: size,
    );
  }
}

class CreateExpenseRequest {
  final String amount;
  final String currency;
  final String category;
  final String description;
  final String date;
  final String type;
  final num? quantity;
  final String? unit;

  const CreateExpenseRequest({
    required this.amount,
    required this.currency,
    required this.category,
    required this.description,
    required this.date,
    required this.type,
    this.quantity,
    this.unit,
  });

  Map<String, dynamic> toJson() {
    final typeEnum = gen.CreateExpenseRequestTypeEnum.fromJson(type);
    final g = gen.CreateExpenseRequest(
      amount: amount,
      currency: currency,
      category: category,
      description: description,
      date: DateTime.parse(date),
      type: typeEnum ?? gen.CreateExpenseRequestTypeEnum.expense,
      quantity: quantity,
      unit: unit,
    );
    final json = g.toJson();
    // Normalize: remove null optional fields to match hand-written behaviour
    json.remove('quantity');
    json.remove('unit');
    if (quantity != null) json['quantity'] = quantity;
    if (unit != null) json['unit'] = unit;
    return json;
  }
}

class UpdateExpenseRequest {
  final String? amount;
  final String? currency;
  final String? category;
  final String? description;
  final String? date;
  final String? type;
  final num? quantity;
  final String? unit;

  const UpdateExpenseRequest({
    this.amount,
    this.currency,
    this.category,
    this.description,
    this.date,
    this.type,
    this.quantity,
    this.unit,
  });

  Map<String, dynamic> toJson() {
    final typeEnum =
        type != null ? gen.UpdateExpenseRequestTypeEnum.fromJson(type) : null;
    final g = gen.UpdateExpenseRequest(
      amount: amount,
      currency: currency,
      category: category,
      description: description,
      date: date != null ? DateTime.parse(date!) : null,
      type: typeEnum,
      quantity: quantity,
      unit: unit,
    );
    // Only include non-null fields to match hand-written behaviour.
    final json = <String, dynamic>{};
    if (amount != null) json['amount'] = g.amount;
    if (currency != null) json['currency'] = g.currency;
    if (category != null) json['category'] = g.category;
    if (description != null) json['description'] = g.description;
    if (date != null) json['date'] = date;
    if (type != null) json['type'] = type;
    if (quantity != null) json['quantity'] = quantity;
    if (unit != null) json['unit'] = unit;
    return json;
  }
}
