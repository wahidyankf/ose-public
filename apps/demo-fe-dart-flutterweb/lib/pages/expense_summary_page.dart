import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../services/expense_service.dart' as expense_svc;
import '../services/report_service.dart' as report_svc;
import '../models/report.dart';

void render(Element parent) {
  final main = document.createElement('main') as HTMLElement
    ..style.setProperty('max-width', '48rem')
    ..style.setProperty('margin', '2rem auto')
    ..style.setProperty('padding', '0 1rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement
    ..textContent = 'Expense Summary'
    ..style.setProperty('margin-bottom', '1.5rem')
    ..style.setProperty('margin-top', '0');
  main.appendChild(h1);

  // Total by currency section
  final summarySection = document.createElement('div') as HTMLDivElement
    ..style.setProperty('margin-bottom', '2rem');
  final summaryH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Total by Currency'
    ..style.setProperty('margin-bottom', '1rem');
  summarySection.appendChild(summaryH2);

  final summaryCards = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('flex-wrap', 'wrap')
    ..style.setProperty('gap', '1rem');

  final summaryLoading = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Loading totals...'
    ..style.setProperty('color', '#666');
  summarySection.appendChild(summaryLoading);
  summarySection.appendChild(summaryCards);
  main.appendChild(summarySection);

  expense_svc.getExpenseSummary().then((totals) {
    summaryLoading.remove();
    if (totals.isEmpty) {
      final emptyMsg = document.createElement('p') as HTMLParagraphElement
        ..textContent = 'No expenses recorded.'
        ..style.setProperty('color', '#888');
      summaryCards.appendChild(emptyMsg);
    } else {
      totals.forEach((currency, total) {
        final card = document.createElement('div') as HTMLDivElement
          ..style.setProperty('background-color', '#fff')
          ..style.setProperty('border', '1px solid #ddd')
          ..style.setProperty('border-radius', '8px')
          ..style.setProperty('padding', '1rem 1.5rem')
          ..style.setProperty('box-shadow', '0 2px 6px rgba(0,0,0,0.06)')
          ..style.setProperty('min-width', '10rem');

        final currencyLabel = document.createElement('p') as HTMLParagraphElement
          ..textContent = currency
          ..style.setProperty('margin', '0 0 0.25rem')
          ..style.setProperty('font-size', '0.9rem')
          ..style.setProperty('color', '#555')
          ..style.setProperty('font-weight', '600');
        card.appendChild(currencyLabel);

        final totalValue = document.createElement('p') as HTMLParagraphElement
          ..textContent = total
          ..style.setProperty('margin', '0')
          ..style.setProperty('font-size', '1.5rem')
          ..style.setProperty('font-weight', '700')
          ..style.setProperty('color', '#c0392b');
        card.appendChild(totalValue);

        summaryCards.appendChild(card);
      });
    }
  }).catchError((_) {
    summaryLoading.remove();
    final errEl = document.createElement('p') as HTMLParagraphElement
      ..setAttribute('role', 'alert')
      ..textContent = 'Failed to load totals.'
      ..style.setProperty('color', '#c0392b');
    summaryCards.appendChild(errEl);
  });

  // Filter form
  final now = DateTime.now();
  final firstOfMonth =
      DateTime(now.year, now.month, 1).toIso8601String().substring(0, 10);
  final today = now.toIso8601String().substring(0, 10);

  final filterCard = document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#fff')
    ..style.setProperty('padding', '1.5rem')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('border', '1px solid #ddd')
    ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.06)')
    ..style.setProperty('margin-bottom', '1.5rem');

  final filterH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'P&L Report'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  filterCard.appendChild(filterH2);

  final filterForm = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '')
    ..style.setProperty('display', 'flex')
    ..style.setProperty('flex-wrap', 'wrap')
    ..style.setProperty('gap', '1rem')
    ..style.setProperty('align-items', 'flex-end');

  // Start date
  final startGroup = document.createElement('div') as HTMLDivElement;
  final startLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'start-date'
    ..textContent = 'Start Date'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  startGroup.appendChild(startLabel);
  final startInput = document.createElement('input') as HTMLInputElement
    ..id = 'start-date'
    ..type = 'date'
    ..value = firstOfMonth
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem');
  startGroup.appendChild(startInput);
  filterForm.appendChild(startGroup);

  // End date
  final endGroup = document.createElement('div') as HTMLDivElement;
  final endLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'end-date'
    ..textContent = 'End Date'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  endGroup.appendChild(endLabel);
  final endInput = document.createElement('input') as HTMLInputElement
    ..id = 'end-date'
    ..type = 'date'
    ..value = today
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem');
  endGroup.appendChild(endInput);
  filterForm.appendChild(endGroup);

  // Currency select
  final currencyGroup = document.createElement('div') as HTMLDivElement;
  final currencyLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'currency'
    ..textContent = 'Currency'
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  currencyGroup.appendChild(currencyLabel);
  final currencySelect = document.createElement('select') as HTMLSelectElement
    ..id = 'currency'
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem');
  for (final cur in ['USD', 'IDR']) {
    final opt = document.createElement('option') as HTMLOptionElement
      ..value = cur
      ..textContent = cur;
    currencySelect.appendChild(opt);
  }
  currencyGroup.appendChild(currencySelect);
  filterForm.appendChild(currencyGroup);

  // Generate button
  final generateBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'submit'
    ..textContent = 'Generate Report'
    ..style.setProperty('padding', '0.65rem 1.5rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('font-weight', '600');
  filterForm.appendChild(generateBtn);

  filterCard.appendChild(filterForm);
  main.appendChild(filterCard);

  // Report output area
  final reportContainer = document.createElement('div') as HTMLDivElement
    ..setAttribute('data-testid', 'pl-chart')
    ..style.setProperty('margin-bottom', '2rem');

  // Default message
  final defaultMsg = document.createElement('p') as HTMLParagraphElement
    ..textContent =
        'Select a date range and currency, then click Generate Report.'
    ..style.setProperty('color', '#666')
    ..style.setProperty('font-style', 'italic');
  reportContainer.appendChild(defaultMsg);
  main.appendChild(reportContainer);

  filterForm.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();
      final startDate = startInput.value.isNotEmpty ? startInput.value : firstOfMonth;
      final endDate = endInput.value.isNotEmpty ? endInput.value : today;
      final currency = currencySelect.value.isNotEmpty ? currencySelect.value : 'USD';

      while (reportContainer.firstChild != null) {
        reportContainer.removeChild(reportContainer.firstChild!);
      }

      final loadingMsg = document.createElement('p') as HTMLParagraphElement
        ..textContent = 'Generating report...'
        ..style.setProperty('color', '#666');
      reportContainer.appendChild(loadingMsg);

      generateBtn
        ..textContent = 'Generating...'
        ..disabled = true;

      () async {
        try {
          final report = await report_svc.getPLReport(startDate, endDate, currency);
          loadingMsg.remove();
          generateBtn
            ..textContent = 'Generate Report'
            ..disabled = false;
          _renderReport(reportContainer, report);
        } on DioException {
          loadingMsg.remove();
          generateBtn
            ..textContent = 'Generate Report'
            ..disabled = false;
          final errEl = document.createElement('p') as HTMLParagraphElement
            ..setAttribute('role', 'alert')
            ..textContent = 'Failed to load report. Please try again.'
            ..style.setProperty('color', '#c0392b')
            ..style.setProperty('background-color', '#fdf2f2')
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-radius', '4px')
            ..style.setProperty('border', '1px solid #f5c6cb');
          reportContainer.appendChild(errEl);
        }
      }();
    }).toJS,
  );

  parent.appendChild(main);
}

void _renderReport(Element container, PLReport report) {
  // Summary cards
  final net = double.tryParse(report.net) ?? 0.0;
  final isPositive = net >= 0;

  final summaryRow = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('flex-wrap', 'wrap')
    ..style.setProperty('gap', '1rem')
    ..style.setProperty('margin-bottom', '1.5rem');

  summaryRow.appendChild(
    _summaryCard('Total Income', report.totalIncome, '#27ae60'),
  );
  summaryRow.appendChild(
    _summaryCard('Total Expense', report.totalExpense, '#c0392b'),
  );
  summaryRow.appendChild(
    _summaryCard('Net', report.net, isPositive ? '#27ae60' : '#c0392b'),
  );
  container.appendChild(summaryRow);

  // Income breakdown
  if (report.incomeBreakdown.isNotEmpty) {
    final incomeH2 = document.createElement('h2') as HTMLHeadingElement
      ..textContent = 'Income Breakdown'
      ..style.setProperty('margin-bottom', '0.75rem');
    container.appendChild(incomeH2);
    container.appendChild(
      _buildBreakdownTable(report.incomeBreakdown),
    );
  }

  // Expense breakdown
  if (report.expenseBreakdown.isNotEmpty) {
    final expenseH2 = document.createElement('h2') as HTMLHeadingElement
      ..textContent = 'Expense Breakdown'
      ..style.setProperty('margin-top', '1.5rem')
      ..style.setProperty('margin-bottom', '0.75rem');
    container.appendChild(expenseH2);
    container.appendChild(
      _buildBreakdownTable(report.expenseBreakdown),
    );
  }
}

HTMLDivElement _summaryCard(String label, String value, String color) {
  final card = document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#fff')
    ..style.setProperty('border', '1px solid #ddd')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('padding', '1rem 1.5rem')
    ..style.setProperty('box-shadow', '0 2px 6px rgba(0,0,0,0.06)')
    ..style.setProperty('min-width', '10rem');

  final labelEl = document.createElement('p') as HTMLParagraphElement
    ..textContent = label
    ..style.setProperty('margin', '0 0 0.25rem')
    ..style.setProperty('font-size', '0.9rem')
    ..style.setProperty('color', '#555')
    ..style.setProperty('font-weight', '600');
  card.appendChild(labelEl);

  final valueEl = document.createElement('p') as HTMLParagraphElement
    ..textContent = value
    ..style.setProperty('margin', '0')
    ..style.setProperty('font-size', '1.4rem')
    ..style.setProperty('font-weight', '700')
    ..style.setProperty('color', color);
  card.appendChild(valueEl);

  return card;
}

HTMLTableElement _buildBreakdownTable(List<CategoryBreakdown> rows) {
  final table = document.createElement('table') as HTMLTableElement
    ..style.setProperty('width', '100%')
    ..style.setProperty('border-collapse', 'collapse')
    ..style.setProperty('font-size', '0.95rem');

  final thead = table.createTHead();
  final headerRow = thead.insertRow(-1);
  for (final h in ['Category', 'Total']) {
    final th = document.createElement('th') as HTMLTableCellElement
      ..textContent = h
      ..style.setProperty('text-align', h == 'Total' ? 'right' : 'left')
      ..style.setProperty('padding', '0.6rem 0.75rem')
      ..style.setProperty('background-color', '#f5f5f5')
      ..style.setProperty('border-bottom', '2px solid #ddd')
      ..style.setProperty('font-weight', '700');
    headerRow.appendChild(th);
  }

  final tbody = table.createTBody();
  for (final row in rows) {
    final tr = tbody.insertRow(-1);
    final categoryCell = document.createElement('td') as HTMLTableCellElement
      ..textContent = row.category
      ..style.setProperty('padding', '0.6rem 0.75rem')
      ..style.setProperty('border-bottom', '1px solid #eee');
    tr.appendChild(categoryCell);
    final totalCell = document.createElement('td') as HTMLTableCellElement
      ..textContent = row.total
      ..style.setProperty('padding', '0.6rem 0.75rem')
      ..style.setProperty('border-bottom', '1px solid #eee')
      ..style.setProperty('text-align', 'right');
    tr.appendChild(totalCell);
  }

  return table;
}
