class CategoryBreakdown {
  final String category;
  final String type;
  final String total;

  const CategoryBreakdown({
    required this.category,
    required this.type,
    required this.total,
  });

  factory CategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return CategoryBreakdown(
      category: json['category'] as String,
      type: json['type'] as String,
      total: json['total'] as String,
    );
  }
}

class ExpenseSummary {
  final String currency;
  final String totalIncome;
  final String totalExpense;
  final String net;
  final List<CategoryBreakdown> categories;

  const ExpenseSummary({
    required this.currency,
    required this.totalIncome,
    required this.totalExpense,
    required this.net,
    required this.categories,
  });

  factory ExpenseSummary.fromJson(Map<String, dynamic> json) {
    return ExpenseSummary(
      currency: json['currency'] as String,
      totalIncome: json['totalIncome'] as String,
      totalExpense: json['totalExpense'] as String,
      net: json['net'] as String,
      categories: (json['categories'] as List<dynamic>)
          .map((e) => CategoryBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class PLReport {
  final String startDate;
  final String endDate;
  final String currency;
  final String totalIncome;
  final String totalExpense;
  final String net;
  final List<CategoryBreakdown> incomeBreakdown;
  final List<CategoryBreakdown> expenseBreakdown;

  const PLReport({
    required this.startDate,
    required this.endDate,
    required this.currency,
    required this.totalIncome,
    required this.totalExpense,
    required this.net,
    required this.incomeBreakdown,
    required this.expenseBreakdown,
  });

  factory PLReport.fromJson(Map<String, dynamic> json) {
    return PLReport(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      currency: json['currency'] as String,
      totalIncome: json['totalIncome'] as String,
      totalExpense: json['totalExpense'] as String,
      net: json['net'] as String,
      incomeBreakdown: (json['incomeBreakdown'] as List<dynamic>)
          .map((e) => CategoryBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      expenseBreakdown: (json['expenseBreakdown'] as List<dynamic>)
          .map((e) => CategoryBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
