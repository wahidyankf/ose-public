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
    return ExpenseListResponse(
      content: (json['content'] as List<dynamic>)
          .map((e) => Expense.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalElements: json['totalElements'] as int,
      totalPages: json['totalPages'] as int,
      page: json['page'] as int,
      size: json['size'] as int,
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
    final Map<String, dynamic> json = {
      'amount': amount,
      'currency': currency,
      'category': category,
      'description': description,
      'date': date,
      'type': type,
    };
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
    final Map<String, dynamic> json = {};
    if (amount != null) json['amount'] = amount;
    if (currency != null) json['currency'] = currency;
    if (category != null) json['category'] = category;
    if (description != null) json['description'] = description;
    if (date != null) json['date'] = date;
    if (type != null) json['type'] = type;
    if (quantity != null) json['quantity'] = quantity;
    if (unit != null) json['unit'] = unit;
    return json;
  }
}
