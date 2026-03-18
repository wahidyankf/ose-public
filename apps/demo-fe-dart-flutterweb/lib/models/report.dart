import 'package:demo_contracts/demo_contracts.dart' as gen;

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
    final g = gen.CategoryBreakdown.fromJson(json)!;
    return CategoryBreakdown(
      category: g.category,
      type: g.type,
      total: g.total,
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
    final g = gen.ExpenseSummary.fromJson(json)!;
    return ExpenseSummary(
      currency: g.currency,
      totalIncome: g.totalIncome,
      totalExpense: g.totalExpense,
      net: g.net,
      categories: g.categories
          .map(
            (c) => CategoryBreakdown(
              category: c.category,
              type: c.type,
              total: c.total,
            ),
          )
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
    final g = gen.PLReport.fromJson(json)!;
    return PLReport(
      startDate: g.startDate.toIso8601String().split('T').first,
      endDate: g.endDate.toIso8601String().split('T').first,
      currency: g.currency,
      totalIncome: g.totalIncome,
      totalExpense: g.totalExpense,
      net: g.net,
      incomeBreakdown: g.incomeBreakdown
          .map(
            (c) => CategoryBreakdown(
              category: c.category,
              type: c.type,
              total: c.total,
            ),
          )
          .toList(),
      expenseBreakdown: g.expenseBreakdown
          .map(
            (c) => CategoryBreakdown(
              category: c.category,
              type: c.type,
              total: c.total,
            ),
          )
          .toList(),
    );
  }
}
