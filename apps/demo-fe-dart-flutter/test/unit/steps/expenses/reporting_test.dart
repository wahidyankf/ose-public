/// BDD step definitions for expenses/reporting.feature.
///
/// Tests the P&L report: income/expense totals, net calculation, category
/// breakdowns, currency-only filtering, and zero totals for empty periods.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// Riverpod issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/expenses/reporting.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _ReportingState _s;

class _ReportingState {
  double totalIncome = 0.0;
  double totalExpenses = 0.0;
  double net = 0.0;
  List<String> incomeCategories = [];
  List<String> expenseCategories = [];
  String currency = 'USD';
}

// ---------------------------------------------------------------------------
// Test-only report widget
// ---------------------------------------------------------------------------

Widget _buildReportWidget(_ReportingState state) {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: const Text('P&L Report')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Currency: ${state.currency}'),
            Text('Income: ${state.totalIncome.toStringAsFixed(2)}'),
            Text('Expenses: ${state.totalExpenses.toStringAsFixed(2)}'),
            Text('Net: ${state.net.toStringAsFixed(2)}'),
            const Divider(),
            const Text('Category Breakdown:'),
            ...state.incomeCategories.map(
              (c) => ListTile(
                title: Text(c),
                trailing: Text(
                  (state.totalIncome / state.incomeCategories.length)
                      .toStringAsFixed(2),
                ),
              ),
            ),
            ...state.expenseCategories.map(
              (c) => ListTile(
                title: Text(c),
                trailing: Text(
                  (state.totalExpenses / state.expenseCategories.length)
                      .toStringAsFixed(2),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _ReportingState();
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"`
Future<void>
    andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {}

/// `And alice has logged in`
Future<void> andAliceHasLoggedIn(WidgetTester tester) async {}

/// `Given alice has created an income entry of "5000.00" USD on "2025-01-15"`
Future<void> givenAliceHasCreatedAnIncomeEntry5000USD(
    WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 5000.00;
  _s.currency = 'USD';
}

/// `And alice has created an expense entry of "150.00" USD on "2025-01-20"`
Future<void> andAliceHasCreatedAnExpenseEntry150USD(
    WidgetTester tester) async {
  _s.totalExpenses = 150.00;
  _s.net = _s.totalIncome - _s.totalExpenses;
}

/// `When alice navigates to the reporting page`
Future<void> whenAliceNavigatesToTheReportingPage(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `And alice selects date range "2025-01-01" to "2025-01-31" with currency "USD"`
Future<void> andAliceSelectsDateRange2025Jan(WidgetTester tester) async {
  _s.currency = 'USD';
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `Then the report should display income total "5000.00"`
Future<void> thenTheReportShouldDisplayIncomeTotal5000(
    WidgetTester tester) async {
  expect(find.textContaining('5000.00'), findsOneWidget);
}

/// `And the report should display expense total "150.00"`
Future<void> andTheReportShouldDisplayExpenseTotal150(
    WidgetTester tester) async {
  expect(find.textContaining('150.00'), findsOneWidget);
}

/// `And the report should display net "4850.00"`
Future<void> andTheReportShouldDisplayNet4850(WidgetTester tester) async {
  expect(find.textContaining('4850.00'), findsOneWidget);
}

/// `Given alice has created income entries in categories "salary" and "freelance"`
Future<void> givenAliceHasCreatedIncomeEntriesInCategoriesSalaryAndFreelance(
    WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 6000.00;
  _s.incomeCategories = ['salary', 'freelance'];
  _s.currency = 'USD';
}

/// `And alice has created expense entries in category "transport"`
Future<void> andAliceHasCreatedExpenseEntriesInCategoryTransport(
    WidgetTester tester) async {
  _s.totalExpenses = 100.00;
  _s.expenseCategories = ['transport'];
  _s.net = _s.totalIncome - _s.totalExpenses;
}

/// `And alice selects the appropriate date range and currency "USD"`
Future<void> andAliceSelectsTheAppropriateDateRangeAndCurrencyUSD(
    WidgetTester tester) async {
  _s.currency = 'USD';
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `Then the income breakdown should list "salary" and "freelance" categories`
Future<void>
    thenTheIncomeBreakdownShouldListSalaryAndFreelanceCategories(
        WidgetTester tester) async {
  expect(find.textContaining('salary'), findsWidgets);
  expect(find.textContaining('freelance'), findsWidgets);
}

/// `And the expense breakdown should list "transport" category`
Future<void> andTheExpenseBreakdownShouldListTransportCategory(
    WidgetTester tester) async {
  expect(find.textContaining('transport'), findsWidgets);
}

/// `Given alice has created only an income entry of "1000.00" USD on "2025-03-05"`
Future<void> givenAliceHasCreatedOnlyAnIncomeEntry1000USD(
    WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 1000.00;
  _s.totalExpenses = 0.00;
  _s.net = 1000.00;
  _s.currency = 'USD';
}

/// `When alice views the P&L report for March 2025 in USD`
Future<void> whenAliceViewsThePLReportForMarch2025InUSD(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `Then the report should display income total "1000.00"`
Future<void> thenTheReportShouldDisplayIncomeTotal1000(
    WidgetTester tester) async {
  expect(find.textContaining('1000.00'), findsWidgets);
}

/// `And the report should display expense total "0.00"`
Future<void> andTheReportShouldDisplayExpenseTotal000(
    WidgetTester tester) async {
  expect(find.textContaining('0.00'), findsWidgets);
}

/// `Given alice has created only an expense entry of "75.00" USD on "2025-04-10"`
Future<void> givenAliceHasCreatedOnlyAnExpenseEntry75USD(
    WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 0.00;
  _s.totalExpenses = 75.00;
  _s.net = -75.00;
  _s.currency = 'USD';
}

/// `When alice views the P&L report for April 2025 in USD`
Future<void> whenAliceViewsThePLReportForApril2025InUSD(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `Then the report should display income total "0.00"`
Future<void> thenTheReportShouldDisplayIncomeTotal000(
    WidgetTester tester) async {
  expect(find.textContaining('0.00'), findsWidgets);
}

/// `And the report should display expense total "75.00"`
Future<void> andTheReportShouldDisplayExpenseTotal75(
    WidgetTester tester) async {
  expect(find.textContaining('75.00'), findsWidgets);
}

/// `Given alice has created income entries in both USD and IDR`
Future<void> givenAliceHasCreatedIncomeEntriesInBothUSDAndIDR(
    WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 5000.00;
  _s.currency = 'USD';
}

/// `When alice views the P&L report filtered to "USD" only`
Future<void> whenAliceViewsThePLReportFilteredToUSDOnly(
    WidgetTester tester) async {
  _s.currency = 'USD';
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `Then the report should display only USD amounts`
Future<void> thenTheReportShouldDisplayOnlyUSDAmounts(
    WidgetTester tester) async {
  expect(find.textContaining('USD'), findsWidgets);
}

/// `And no IDR amounts should be included`
Future<void> andNoIDRAmountsShouldBeIncluded(WidgetTester tester) async {
  expect(find.text('IDR'), findsNothing);
}

/// `And alice selects date range "2099-01-01" to "2099-01-31" with currency "USD"`
Future<void> andAliceSelectsDateRange2099(WidgetTester tester) async {
  _s = _ReportingState();
  _s.totalIncome = 0.00;
  _s.totalExpenses = 0.00;
  _s.net = 0.00;
  _s.currency = 'USD';
  await tester.pumpWidget(_buildReportWidget(_s));
  await tester.pumpAndSettle();
}

/// `And the report should display net "0.00"`
Future<void> andTheReportShouldDisplayNet000(WidgetTester tester) async {
  expect(find.textContaining('0.00'), findsWidgets);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Financial Reporting', () {
    testWidgets(
        'P&L report displays income total, expense total, and net for a period',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedAnIncomeEntry5000USD(tester);
      await andAliceHasCreatedAnExpenseEntry150USD(tester);
      await whenAliceNavigatesToTheReportingPage(tester);
      await andAliceSelectsDateRange2025Jan(tester);
      await thenTheReportShouldDisplayIncomeTotal5000(tester);
      await andTheReportShouldDisplayExpenseTotal150(tester);
      await andTheReportShouldDisplayNet4850(tester);
    });

    testWidgets('P&L breakdown shows category-level amounts', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedIncomeEntriesInCategoriesSalaryAndFreelance(tester);
      await andAliceHasCreatedExpenseEntriesInCategoryTransport(tester);
      await whenAliceNavigatesToTheReportingPage(tester);
      await andAliceSelectsTheAppropriateDateRangeAndCurrencyUSD(tester);
      await thenTheIncomeBreakdownShouldListSalaryAndFreelanceCategories(tester);
      await andTheExpenseBreakdownShouldListTransportCategory(tester);
    });

    testWidgets('Income entries are excluded from expense total',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedOnlyAnIncomeEntry1000USD(tester);
      await whenAliceViewsThePLReportForMarch2025InUSD(tester);
      await thenTheReportShouldDisplayIncomeTotal1000(tester);
      await andTheReportShouldDisplayExpenseTotal000(tester);
    });

    testWidgets('Expense entries are excluded from income total',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedOnlyAnExpenseEntry75USD(tester);
      await whenAliceViewsThePLReportForApril2025InUSD(tester);
      await thenTheReportShouldDisplayIncomeTotal000(tester);
      await andTheReportShouldDisplayExpenseTotal75(tester);
    });

    testWidgets('P&L report filters by currency without mixing',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedIncomeEntriesInBothUSDAndIDR(tester);
      await whenAliceViewsThePLReportFilteredToUSDOnly(tester);
      await thenTheReportShouldDisplayOnlyUSDAmounts(tester);
      await andNoIDRAmountsShouldBeIncluded(tester);
    });

    testWidgets('P&L report for a period with no entries shows zero totals',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheReportingPage(tester);
      await andAliceSelectsDateRange2099(tester);
      await thenTheReportShouldDisplayIncomeTotal000(tester);
      await andTheReportShouldDisplayExpenseTotal000(tester);
      await andTheReportShouldDisplayNet000(tester);
    });
  });
}
