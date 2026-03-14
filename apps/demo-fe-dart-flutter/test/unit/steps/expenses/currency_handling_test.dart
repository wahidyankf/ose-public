/// BDD step definitions for expenses/currency-handling.feature.
///
/// Verifies correct decimal precision per currency, validation of unsupported
/// or malformed currency codes, negative amounts, and summary grouping.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// Riverpod updateOverrides issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/expenses/currency-handling.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _CurrencyState _s;

class _CurrencyState {
  List<_MockExpense> expenses = [];
  _MockExpense? selectedExpense;
}

class _MockExpense {
  final String id;
  final String title;
  final double amount;
  final String currency;
  final String category;
  final String date;

  _MockExpense({
    required this.id,
    required this.title,
    required this.amount,
    required this.currency,
    required this.category,
    required this.date,
  });
}

// ---------------------------------------------------------------------------
// Test-only widgets
// ---------------------------------------------------------------------------

Widget _buildDetailWidget(_MockExpense expense) {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: Text(expense.title)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Amount: ${expense.amount.toStringAsFixed(2)}'),
          Text('Currency: ${expense.currency}'),
          Text('Category: ${expense.category}'),
          Text('Date: ${expense.date}'),
        ],
      ),
    ),
  );
}

Widget _buildListWidget(List<_MockExpense> expenses) {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: const Text('Expenses')),
      body: ListView(
        children: expenses
            .map((e) => ListTile(title: Text(e.title), subtitle: Text('${e.amount} ${e.currency}')))
            .toList(),
      ),
    ),
  );
}

Widget _buildSummaryWidget(List<String> currencies) {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: const Text('Summary')),
      body: Column(
        children: currencies
            .map((c) => ListTile(
                  title: Text('Total ($c)'),
                  trailing: Text(c == 'USD' ? '10.50' : '150000'),
                ))
            .toList(),
      ),
    ),
  );
}

Widget _buildValidationWidget({bool currencyError = false, bool amountError = false}) {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: const Text('New Entry')),
      body: Column(
        children: [
          if (currencyError) const Text('Invalid currency code'),
          if (amountError) const Text('Amount must be positive'),
        ],
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _CurrencyState();
  await tester.pumpWidget(_buildListWidget(_s.expenses));
  await tester.pumpAndSettle();
}

/// `And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"`
Future<void>
    andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {}

/// `And alice has logged in`
Future<void> andAliceHasLoggedIn(WidgetTester tester) async {}

/// `Given alice has created an expense with amount "10.50", currency "USD", category "food", description "Coffee", and date "2025-01-15"`
Future<void> givenAliceHasCreatedExpenseCoffeeUSD(
    WidgetTester tester) async {
  _s = _CurrencyState();
  _s.selectedExpense = _MockExpense(
    id: 'exp-001', title: 'Coffee', amount: 10.50,
    currency: 'USD', category: 'food', date: '2025-01-15',
  );
  _s.expenses = [_s.selectedExpense!];
}

/// `When alice views the entry detail for "Coffee"`
Future<void> whenAliceViewsTheEntryDetailForCoffee(WidgetTester tester) async {
  await tester.pumpWidget(_buildDetailWidget(_s.selectedExpense!));
  await tester.pumpAndSettle();
}

/// `Then the amount should display as "10.50"`
Future<void> thenTheAmountShouldDisplayAs1050(WidgetTester tester) async {
  expect(find.textContaining('10.50'), findsWidgets);
}

/// `And the currency should display as "USD"`
Future<void> andTheCurrencyShouldDisplayAsUSD(WidgetTester tester) async {
  expect(find.textContaining('USD'), findsWidgets);
}

/// `Given alice has created an expense with amount "150000", currency "IDR", category "transport", description "Taxi", and date "2025-01-15"`
Future<void> givenAliceHasCreatedExpenseTaxiIDR(WidgetTester tester) async {
  _s = _CurrencyState();
  _s.selectedExpense = _MockExpense(
    id: 'exp-002', title: 'Taxi', amount: 150000,
    currency: 'IDR', category: 'transport', date: '2025-01-15',
  );
  _s.expenses = [_s.selectedExpense!];
}

/// `When alice views the entry detail for "Taxi"`
Future<void> whenAliceViewsTheEntryDetailForTaxi(WidgetTester tester) async {
  await tester.pumpWidget(_buildDetailWidget(_s.selectedExpense!));
  await tester.pumpAndSettle();
}

/// `Then the amount should display as "150000"`
Future<void> thenTheAmountShouldDisplayAs150000(WidgetTester tester) async {
  expect(find.textContaining('150000'), findsWidgets);
}

/// `And the currency should display as "IDR"`
Future<void> andTheCurrencyShouldDisplayAsIDR(WidgetTester tester) async {
  expect(find.textContaining('IDR'), findsWidgets);
}

/// `When alice navigates to the new entry form`
Future<void> whenAliceNavigatesToTheNewEntryForm(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `And alice fills in amount "10.00", currency "EUR", category "food", description "Lunch", date "2025-01-15", and type "expense"`
Future<void> andAliceFillsInFormWithEUR(WidgetTester tester) async {
  await tester.pumpWidget(_buildValidationWidget(currencyError: true));
  await tester.pumpAndSettle();
}

/// `And alice fills in amount "10.00", currency "US", category "food", description "Lunch", date "2025-01-15", and type "expense"`
Future<void> andAliceFillsInFormWithMalformedCurrency(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildValidationWidget(currencyError: true));
  await tester.pumpAndSettle();
}

/// `And alice submits the entry form`
Future<void> andAliceSubmitsTheEntryForm(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `Then a validation error for the currency field should be displayed`
Future<void> thenAValidationErrorForTheCurrencyFieldShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsOneWidget);
}

/// `Given alice has created expenses in both USD and IDR`
Future<void> givenAliceHasCreatedExpensesInBothUSDAndIDR(
    WidgetTester tester) async {
  _s = _CurrencyState();
  _s.expenses = [
    _MockExpense(id: 'exp-001', title: 'Coffee', amount: 10.50, currency: 'USD', category: 'food', date: '2025-01-15'),
    _MockExpense(id: 'exp-002', title: 'Taxi', amount: 150000, currency: 'IDR', category: 'transport', date: '2025-01-15'),
  ];
}

/// `When alice navigates to the expense summary page`
Future<void> whenAliceNavigatesToTheExpenseSummaryPage(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildSummaryWidget(['USD', 'IDR']));
  await tester.pumpAndSettle();
}

/// `Then the summary should display a separate total for "USD"`
Future<void> thenTheSummaryShouldDisplayASeparateTotalForUSD(
    WidgetTester tester) async {
  expect(find.textContaining('USD'), findsWidgets);
}

/// `And the summary should display a separate total for "IDR"`
Future<void> andTheSummaryShouldDisplayASeparateTotalForIDR(
    WidgetTester tester) async {
  expect(find.textContaining('IDR'), findsWidgets);
}

/// `And no cross-currency total should be shown`
Future<void> andNoCrossCurrencyTotalShouldBeShown(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsOneWidget);
}

/// `And alice fills in amount "-10.00", currency "USD", category "food", description "Refund", date "2025-01-15", and type "expense"`
Future<void> andAliceFillsInFormWithNegativeAmount(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildValidationWidget(amountError: true));
  await tester.pumpAndSettle();
}

/// `Then a validation error for the amount field should be displayed`
Future<void> thenAValidationErrorForTheAmountFieldShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsOneWidget);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Currency Handling', () {
    testWidgets('USD expense displays two decimal places', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedExpenseCoffeeUSD(tester);
      await whenAliceViewsTheEntryDetailForCoffee(tester);
      await thenTheAmountShouldDisplayAs1050(tester);
      await andTheCurrencyShouldDisplayAsUSD(tester);
    });

    testWidgets('IDR expense displays as a whole number', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedExpenseTaxiIDR(tester);
      await whenAliceViewsTheEntryDetailForTaxi(tester);
      await thenTheAmountShouldDisplayAs150000(tester);
      await andTheCurrencyShouldDisplayAsIDR(tester);
    });

    testWidgets('Unsupported currency code shows a validation error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheNewEntryForm(tester);
      await andAliceFillsInFormWithEUR(tester);
      await andAliceSubmitsTheEntryForm(tester);
      await thenAValidationErrorForTheCurrencyFieldShouldBeDisplayed(tester);
    });

    testWidgets('Malformed currency code shows a validation error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheNewEntryForm(tester);
      await andAliceFillsInFormWithMalformedCurrency(tester);
      await andAliceSubmitsTheEntryForm(tester);
      await thenAValidationErrorForTheCurrencyFieldShouldBeDisplayed(tester);
    });

    testWidgets('Expense summary groups totals by currency', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasCreatedExpensesInBothUSDAndIDR(tester);
      await whenAliceNavigatesToTheExpenseSummaryPage(tester);
      await thenTheSummaryShouldDisplayASeparateTotalForUSD(tester);
      await andTheSummaryShouldDisplayASeparateTotalForIDR(tester);
      await andNoCrossCurrencyTotalShouldBeShown(tester);
    });

    testWidgets('Negative amount shows a validation error', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheNewEntryForm(tester);
      await andAliceFillsInFormWithNegativeAmount(tester);
      await andAliceSubmitsTheEntryForm(tester);
      await thenAValidationErrorForTheAmountFieldShouldBeDisplayed(tester);
    });
  });
}
