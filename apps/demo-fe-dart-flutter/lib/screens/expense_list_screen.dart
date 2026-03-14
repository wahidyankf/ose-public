/// Expense list screen — paginated list of expenses.
///
/// Displays expenses with description, amount (currency-formatted), category,
/// and date. Tapping an item navigates to its detail. A FAB and header button
/// open the create-expense dialog. Wrapped in [AppShell].
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';
import 'package:demo_fe_dart_flutter/core/providers/expense_provider.dart';
import 'package:demo_fe_dart_flutter/widgets/app_shell.dart';

class ExpenseListScreen extends ConsumerStatefulWidget {
  const ExpenseListScreen({super.key});

  @override
  ConsumerState<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends ConsumerState<ExpenseListScreen> {
  int _page = 1;
  static const int _pageSize = 20;

  ExpensesParams get _params => ExpensesParams(page: _page, size: _pageSize);

  @override
  Widget build(BuildContext context) {
    final expensesAsync = ref.watch(expensesProvider(_params));

    return AppShell(
      child: Scaffold(
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showCreateDialog(context, ref),
          icon: const Icon(Icons.add),
          label: const Text('New Expense'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Expenses',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  TextButton.icon(
                    onPressed: () => context.go('/expenses/summary'),
                    icon: const Icon(Icons.bar_chart),
                    label: const Text('View Summary'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: expensesAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) =>
                      Center(child: Text('Error loading expenses: $e')),
                  data: (data) => Column(
                    children: [
                      Expanded(
                        child: data.expenses.isEmpty
                            ? const Center(
                                child: Text('No expenses yet. Create one!'),
                              )
                            : _ExpenseList(expenses: data.expenses),
                      ),
                      _Pagination(
                        page: _page,
                        total: data.total,
                        pageSize: _pageSize,
                        onPageChanged: (p) => setState(() => _page = p),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => _CreateExpenseDialog(ref: ref),
    );
  }
}

// ---------------------------------------------------------------------------
// Expense list
// ---------------------------------------------------------------------------

class _ExpenseList extends StatelessWidget {
  const _ExpenseList({required this.expenses});

  final List<Expense> expenses;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: expenses.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) => _ExpenseTile(expense: expenses[index]),
    );
  }
}

class _ExpenseTile extends StatelessWidget {
  const _ExpenseTile({required this.expense});

  final Expense expense;

  @override
  Widget build(BuildContext context) {
    final amount = _formatAmount(expense.amount, expense.currency);

    return ListTile(
      onTap: () => context.go('/expenses/${expense.id}'),
      title: Text(expense.title),
      subtitle: Text('${expense.category} · ${expense.expenseDate}'),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(amount, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (expense.attachmentCount > 0)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.attach_file, size: 12),
                Text(
                  '${expense.attachmentCount}',
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
        ],
      ),
    );
  }

  String _formatAmount(double amount, String currency) {
    final decimals = currency.toUpperCase() == 'IDR' ? 0 : 2;
    return '${amount.toStringAsFixed(decimals)} $currency';
  }
}

// ---------------------------------------------------------------------------
// Create expense dialog
// ---------------------------------------------------------------------------

class _CreateExpenseDialog extends ConsumerStatefulWidget {
  const _CreateExpenseDialog({required this.ref});

  final WidgetRef ref;

  @override
  ConsumerState<_CreateExpenseDialog> createState() =>
      _CreateExpenseDialogState();
}

class _CreateExpenseDialogState extends ConsumerState<_CreateExpenseDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  String _currency = 'USD';
  String _category = 'OTHER';
  DateTime _date = DateTime.now();
  bool _isLoading = false;
  String? _errorMessage;

  static const List<String> _currencies = ['USD', 'EUR', 'GBP', 'IDR', 'MYR'];
  static const List<String> _categories = [
    'FOOD',
    'TRANSPORT',
    'UTILITIES',
    'ENTERTAINMENT',
    'HEALTH',
    'EDUCATION',
    'SHOPPING',
    'TRAVEL',
    'INCOME',
    'OTHER',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final amount = double.parse(_amountController.text.trim());
      await widget.ref
          .read(expenseNotifierProvider.notifier)
          .createExpense(
            title: _titleController.text.trim(),
            amount: amount,
            currency: _currency,
            category: _category,
            expenseDate:
                '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
            description: _descController.text.trim().isEmpty
                ? null
                : _descController.text.trim(),
          );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _errorMessage = 'Failed to create expense.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New Expense'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_errorMessage != null) ...[
                Text(
                  _errorMessage!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: 8),
              ],
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Title is required'
                    : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _amountController,
                      decoration: const InputDecoration(
                        labelText: 'Amount',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return 'Required';
                        }
                        if (double.tryParse(v.trim()) == null) {
                          return 'Invalid number';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _currency,
                      decoration: const InputDecoration(
                        labelText: 'Currency',
                        border: OutlineInputBorder(),
                      ),
                      items: _currencies
                          .map(
                            (c) => DropdownMenuItem(value: c, child: Text(c)),
                          )
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _currency = v ?? _currency),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: _categories
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _category = v ?? _category),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Date'),
                subtitle: Text(
                  '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
                ),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) setState(() => _date = picked);
                },
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isLoading ? null : _submit,
          child: _isLoading
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Create'),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.page,
    required this.total,
    required this.pageSize,
    required this.onPageChanged,
  });

  final int page;
  final int total;
  final int pageSize;
  final ValueChanged<int> onPageChanged;

  int get _totalPages => (total / pageSize).ceil().clamp(1, 9999);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            tooltip: 'Previous page',
            icon: const Icon(Icons.chevron_left),
            onPressed: page > 1 ? () => onPageChanged(page - 1) : null,
          ),
          Text('Page $page of $_totalPages  ($total items)'),
          IconButton(
            tooltip: 'Next page',
            icon: const Icon(Icons.chevron_right),
            onPressed: page < _totalPages
                ? () => onPageChanged(page + 1)
                : null,
          ),
        ],
      ),
    );
  }
}
