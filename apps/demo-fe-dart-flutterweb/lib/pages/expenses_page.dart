import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../models/expense.dart';
import '../services/expense_service.dart' as expense_svc;
import '../main.dart' as router;

const _supportedCurrencies = ['USD', 'IDR'];
const _supportedTypes = ['INCOME', 'EXPENSE'];
const _supportedUnits = [
  'kg',
  'g',
  'mg',
  'lb',
  'oz',
  'l',
  'ml',
  'm',
  'cm',
  'km',
  'ft',
  'in',
  'unit',
  'pcs',
  'dozen',
  'box',
  'pack',
];

void render(Element parent) {
  int currentPage = 0;
  bool isLoading = false;

  // Page container
  final container = document.createElement('div') as HTMLDivElement
    ..style.setProperty('padding', '1.5rem 0');

  // Header row
  final header = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('align-items', 'center')
    ..style.setProperty('justify-content', 'space-between')
    ..style.setProperty('margin-bottom', '1.5rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement
    ..textContent = 'Expenses'
    ..style.setProperty('margin', '0');
  header.appendChild(h1);

  final newExpenseBtn = document.createElement('button') as HTMLButtonElement
    ..textContent = 'New Expense'
    ..style.setProperty('padding', '0.6rem 1.2rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#ffffff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-weight', '600');
  header.appendChild(newExpenseBtn);
  container.appendChild(header);

  // Create form (hidden by default)
  final createFormWrapper = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#ffffff')
    ..style.setProperty('border', '1px solid #ddd')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('padding', '1.5rem')
    ..style.setProperty('margin-bottom', '1.5rem')
    ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.08)');

  final createFormH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'New Expense'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('font-size', '1.1rem');
  createFormWrapper.appendChild(createFormH2);

  final createFormError = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'alert')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('color', '#c0392b')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('border', '1px solid #f5c6cb');
  createFormWrapper.appendChild(createFormError);

  final createForm = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '')
    ..style.setProperty('display', 'grid')
    ..style.setProperty('grid-template-columns', 'repeat(2, 1fr)')
    ..style.setProperty('gap', '1rem');

  // Helper to build a labeled field group
  HTMLDivElement buildFieldGroup(
    String labelText,
    Element input,
    String errorId,
  ) {
    final group = document.createElement('div') as HTMLDivElement
      ..style.setProperty('display', 'flex')
      ..style.setProperty('flex-direction', 'column');
    final label = document.createElement('label') as HTMLLabelElement
      ..htmlFor = (input as dynamic).id as String
      ..textContent = labelText
      ..style.setProperty('font-weight', '600')
      ..style.setProperty('margin-bottom', '0.3rem')
      ..style.setProperty('font-size', '0.9rem');
    final err = document.createElement('span') as HTMLSpanElement
      ..id = errorId
      ..setAttribute('role', 'alert')
      ..style.setProperty('display', 'none')
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('font-size', '0.8rem')
      ..style.setProperty('margin-top', '0.2rem');
    group
      ..appendChild(label)
      ..appendChild(input)
      ..appendChild(err);
    return group;
  }

  HTMLInputElement inputStyle(HTMLInputElement el) {
    el.style
      ..setProperty('width', '100%')
      ..setProperty('padding', '0.6rem 0.75rem')
      ..setProperty('border', '1px solid #ccc')
      ..setProperty('border-radius', '4px')
      ..setProperty('font-size', '0.95rem')
      ..setProperty('box-sizing', 'border-box');
    return el;
  }

  // Amount
  final amountInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'amount'
      ..type = 'number'
      ..setAttribute('aria-required', 'true')
      ..setAttribute('min', '0')
      ..setAttribute('step', 'any'),
  );
  createForm.appendChild(buildFieldGroup('Amount', amountInput, 'amount-error'));

  // Currency
  final currencyInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'currency'
      ..type = 'text'
      ..setAttribute('aria-required', 'true')
      ..setAttribute('list', 'currency-list'),
  );
  final currencyList = document.createElement('datalist')
    ..id = 'currency-list';
  for (final c in _supportedCurrencies) {
    final opt = document.createElement('option') as HTMLOptionElement
      ..value = c;
    currencyList.appendChild(opt);
  }
  final currencyGroup = buildFieldGroup('Currency', currencyInput, 'currency-error');
  currencyGroup.appendChild(currencyList);
  createForm.appendChild(currencyGroup);

  // Type
  final typeInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'type'
      ..type = 'text'
      ..setAttribute('aria-required', 'true')
      ..setAttribute('list', 'type-list'),
  );
  final typeList = document.createElement('datalist')..id = 'type-list';
  for (final t in _supportedTypes) {
    final opt = document.createElement('option') as HTMLOptionElement
      ..value = t;
    typeList.appendChild(opt);
  }
  final typeGroup = buildFieldGroup('Type', typeInput, 'type-error');
  typeGroup.appendChild(typeList);
  createForm.appendChild(typeGroup);

  // Category
  final categoryInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'category'
      ..type = 'text'
      ..setAttribute('aria-required', 'true'),
  );
  createForm.appendChild(buildFieldGroup('Category', categoryInput, 'category-error'));

  // Date
  final dateInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'date'
      ..type = 'date'
      ..setAttribute('aria-required', 'true'),
  );
  createForm.appendChild(buildFieldGroup('Date', dateInput, 'date-error'));

  // Description (full width)
  final descriptionInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'description'
      ..type = 'text'
      ..setAttribute('aria-required', 'true'),
  );
  final descriptionGroup = buildFieldGroup('Description', descriptionInput, 'description-error')
    ..style.setProperty('grid-column', '1 / -1');
  createForm.appendChild(descriptionGroup);

  // Quantity (optional)
  final quantityInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'quantity'
      ..type = 'number'
      ..setAttribute('min', '0')
      ..setAttribute('step', 'any'),
  );
  createForm.appendChild(buildFieldGroup('Quantity (optional)', quantityInput, 'quantity-error'));

  // Unit (optional)
  final unitInput = inputStyle(
    document.createElement('input') as HTMLInputElement
      ..id = 'unit'
      ..type = 'text'
      ..setAttribute('list', 'unit-list'),
  );
  final unitList = document.createElement('datalist')..id = 'unit-list';
  for (final u in _supportedUnits) {
    final opt = document.createElement('option') as HTMLOptionElement..value = u;
    unitList.appendChild(opt);
  }
  final unitGroup = buildFieldGroup('Unit (optional)', unitInput, 'unit-error');
  unitGroup.appendChild(unitList);
  createForm.appendChild(unitGroup);

  // Form actions (full width)
  final formActions = document.createElement('div') as HTMLDivElement
    ..style.setProperty('grid-column', '1 / -1')
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem');

  final createSubmitBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'submit'
    ..textContent = 'Create Expense'
    ..style.setProperty('padding', '0.65rem 1.4rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#ffffff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-weight', '600');

  final cancelFormBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Cancel'
    ..style.setProperty('padding', '0.65rem 1.2rem')
    ..style.setProperty('background-color', '#f0f0f0')
    ..style.setProperty('color', '#333')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('cursor', 'pointer');

  formActions
    ..appendChild(createSubmitBtn)
    ..appendChild(cancelFormBtn);
  createForm.appendChild(formActions);
  createFormWrapper.appendChild(createForm);
  container.appendChild(createFormWrapper);

  // List area
  final listArea = document.createElement('div') as HTMLDivElement;
  container.appendChild(listArea);

  // Delete confirmation dialog
  final dialogOverlay = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'alertdialog')
    ..setAttribute('aria-modal', 'true')
    ..setAttribute('aria-labelledby', 'delete-dialog-title')
    ..style.setProperty('display', 'none')
    ..style.setProperty('position', 'fixed')
    ..style.setProperty('top', '0')
    ..style.setProperty('left', '0')
    ..style.setProperty('width', '100%')
    ..style.setProperty('height', '100%')
    ..style.setProperty('background-color', 'rgba(0,0,0,0.45)')
    ..style.setProperty('z-index', '1000')
    ..style.setProperty('align-items', 'center')
    ..style.setProperty('justify-content', 'center');

  final dialogBox = document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#ffffff')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('padding', '2rem')
    ..style.setProperty('max-width', '22rem')
    ..style.setProperty('width', '90%')
    ..style.setProperty('box-shadow', '0 4px 20px rgba(0,0,0,0.18)');

  final dialogH2 = document.createElement('h2') as HTMLHeadingElement
    ..id = 'delete-dialog-title'
    ..textContent = 'Delete Expense'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('font-size', '1.15rem');
  dialogBox.appendChild(dialogH2);

  final dialogText = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Are you sure you want to delete this expense? This action cannot be undone.'
    ..style.setProperty('color', '#444');
  dialogBox.appendChild(dialogText);

  final dialogActions = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem')
    ..style.setProperty('margin-top', '1.5rem');

  final confirmDeleteBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Delete'
    ..style.setProperty('padding', '0.6rem 1.2rem')
    ..style.setProperty('background-color', '#c0392b')
    ..style.setProperty('color', '#ffffff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-weight', '600');

  final cancelDeleteBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Cancel'
    ..style.setProperty('padding', '0.6rem 1.2rem')
    ..style.setProperty('background-color', '#f0f0f0')
    ..style.setProperty('color', '#333')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('cursor', 'pointer');

  dialogActions
    ..appendChild(confirmDeleteBtn)
    ..appendChild(cancelDeleteBtn);
  dialogBox.appendChild(dialogActions);
  dialogOverlay.appendChild(dialogBox);
  document.body?.appendChild(dialogOverlay);

  String? pendingDeleteId;

  void closeDeleteDialog() {
    dialogOverlay.style.setProperty('display', 'none');
    pendingDeleteId = null;
  }

  void openDeleteDialog(String expenseId) {
    pendingDeleteId = expenseId;
    dialogOverlay.style.setProperty('display', 'flex');
  }

  cancelDeleteBtn.addEventListener(
    'click',
    ((Event _) => closeDeleteDialog()).toJS,
  );
  dialogOverlay.addEventListener(
    'click',
    ((Event e) {
      if (e.target == dialogOverlay) closeDeleteDialog();
    }).toJS,
  );

  // Toggle create form
  newExpenseBtn.addEventListener(
    'click',
    ((Event _) {
      final hidden = createFormWrapper.style.getPropertyValue('display') == 'none';
      createFormWrapper.style.setProperty('display', hidden ? 'block' : 'none');
    }).toJS,
  );

  cancelFormBtn.addEventListener(
    'click',
    ((Event _) {
      createFormWrapper.style.setProperty('display', 'none');
    }).toJS,
  );

  // Validate and clear helpers
  void setFieldError(String errorId, String message) {
    final el = document.getElementById(errorId) as HTMLElement?;
    if (el != null) {
      el.textContent = message;
      el.style.setProperty('display', 'block');
    }
  }

  void clearFieldError(String errorId) {
    final el = document.getElementById(errorId) as HTMLElement?;
    if (el != null) {
      el.textContent = '';
      el.style.setProperty('display', 'none');
    }
  }

  // Render the list
  Future<void> loadExpenses() async {
    if (isLoading) return;
    isLoading = true;
    while (listArea.firstChild != null) {
      listArea.removeChild(listArea.firstChild!);
    }

    final loadingEl = document.createElement('p') as HTMLParagraphElement
      ..textContent = 'Loading expenses...'
      ..style.setProperty('color', '#666');
    listArea.appendChild(loadingEl);

    try {
      final result = await expense_svc.listExpenses(page: currentPage);
      while (listArea.firstChild != null) {
        listArea.removeChild(listArea.firstChild!);
      }
      isLoading = false;

      // Count display
      final countEl = document.createElement('p') as HTMLParagraphElement
        ..textContent = '${result.totalElements} entries'
        ..style.setProperty('color', '#666')
        ..style.setProperty('margin-bottom', '0.75rem')
        ..style.setProperty('font-size', '0.9rem');
      listArea.appendChild(countEl);

      if (result.content.isEmpty) {
        final emptyEl = document.createElement('p') as HTMLParagraphElement
          ..textContent = 'No expenses found. Create your first expense!'
          ..style.setProperty('color', '#666')
          ..style.setProperty('text-align', 'center')
          ..style.setProperty('padding', '2rem 0');
        listArea.appendChild(emptyEl);
      } else {
        // Table wrapper
        final tableWrapper = document.createElement('div') as HTMLDivElement
          ..style.setProperty('overflow-x', 'auto')
          ..style.setProperty('background-color', '#ffffff')
          ..style.setProperty('border-radius', '8px')
          ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.08)')
          ..style.setProperty('border', '1px solid #e0e0e0')
          ..style.setProperty('margin-bottom', '1rem');

        final table = document.createElement('table') as HTMLTableElement
          ..style.setProperty('width', '100%')
          ..style.setProperty('border-collapse', 'collapse')
          ..style.setProperty('background-color', '#ffffff');

        // Thead
        final thead = table.createTHead();
        final headerRow = thead.insertRow(-1);
        for (final col in [
          'Date',
          'Description',
          'Category',
          'Type',
          'Amount',
          'Actions',
        ]) {
          final th = document.createElement('th') as HTMLTableCellElement
            ..textContent = col
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('text-align', 'left')
            ..style.setProperty('font-weight', '600')
            ..style.setProperty('font-size', '0.85rem')
            ..style.setProperty('color', '#555')
            ..style.setProperty('background-color', '#f8f8f8')
            ..style.setProperty('border-bottom', '2px solid #e0e0e0');
          headerRow.appendChild(th);
        }

        // Tbody
        final tbody = table.createTBody();
        for (final expense in result.content) {
          final row = tbody.insertRow(-1)
            ..setAttribute('data-testid', 'entry-card');

          final typeColor = expense.type == 'INCOME' ? '#27ae60' : '#c0392b';

          // Date
          final dateCell = row.insertCell(-1)
            ..textContent = expense.date
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0')
            ..style.setProperty('font-size', '0.9rem')
            ..style.setProperty('white-space', 'nowrap');
          // ignore: unused_local_variable
          final _ = dateCell;

          // Description (link to detail)
          final descCell = row.insertCell(-1)
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0');
          final descLink = document.createElement('a') as HTMLAnchorElement
            ..href = '/expenses/${expense.id}'
            ..textContent = expense.description
            ..style.setProperty('color', '#1a73e8')
            ..style.setProperty('text-decoration', 'none');
          descLink.addEventListener(
            'click',
            ((Event e) {
              e.preventDefault();
              router.navigateTo('/expenses/${expense.id}');
            }).toJS,
          );
          descCell.appendChild(descLink);

          // Category
          row.insertCell(-1)
            ..textContent = expense.category
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0')
            ..style.setProperty('font-size', '0.9rem');

          // Type (color-coded)
          final typeCell = row.insertCell(-1)
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0');
          final typeSpan = document.createElement('span') as HTMLSpanElement
            ..textContent = expense.type
            ..style.setProperty('color', typeColor)
            ..style.setProperty('font-weight', '600')
            ..style.setProperty('font-size', '0.9rem');
          typeCell.appendChild(typeSpan);

          // Amount (color-coded by type)
          final amountCell = row.insertCell(-1)
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0')
            ..style.setProperty('white-space', 'nowrap');
          final amountSpan = document.createElement('span') as HTMLSpanElement
            ..textContent = '${expense.currency} ${expense.amount}'
            ..style.setProperty('color', typeColor)
            ..style.setProperty('font-weight', '600')
            ..style.setProperty('font-size', '0.9rem');
          amountCell.appendChild(amountSpan);

          // Actions
          final actionsCell = row.insertCell(-1)
            ..style.setProperty('padding', '0.75rem 1rem')
            ..style.setProperty('border-bottom', '1px solid #f0f0f0')
            ..style.setProperty('white-space', 'nowrap');

          final editLink = document.createElement('a') as HTMLAnchorElement
            ..href = '/expenses/${expense.id}'
            ..textContent = 'Edit'
            ..style.setProperty('color', '#1a73e8')
            ..style.setProperty('margin-right', '0.75rem')
            ..style.setProperty('text-decoration', 'none')
            ..style.setProperty('font-size', '0.9rem');
          editLink.addEventListener(
            'click',
            ((Event e) {
              e.preventDefault();
              router.navigateTo('/expenses/${expense.id}');
            }).toJS,
          );

          final deleteBtn = document.createElement('button') as HTMLButtonElement
            ..type = 'button'
            ..textContent = 'Delete'
            ..style.setProperty('padding', '0.3rem 0.75rem')
            ..style.setProperty('background-color', 'transparent')
            ..style.setProperty('color', '#c0392b')
            ..style.setProperty('border', '1px solid #c0392b')
            ..style.setProperty('border-radius', '4px')
            ..style.setProperty('font-size', '0.85rem')
            ..style.setProperty('cursor', 'pointer');

          final expenseId = expense.id;
          deleteBtn.addEventListener(
            'click',
            ((Event _) => openDeleteDialog(expenseId)).toJS,
          );

          actionsCell
            ..appendChild(editLink)
            ..appendChild(deleteBtn);
        }

        tableWrapper.appendChild(table);
        listArea.appendChild(tableWrapper);

        // Pagination
        if (result.totalPages > 1) {
          final pagination = document.createElement('div') as HTMLDivElement
            ..style.setProperty('display', 'flex')
            ..style.setProperty('align-items', 'center')
            ..style.setProperty('gap', '0.75rem')
            ..style.setProperty('margin-top', '1rem');

          final prevBtn = document.createElement('button') as HTMLButtonElement
            ..type = 'button'
            ..textContent = 'Previous'
            ..setAttribute('aria-label', 'Previous page')
            ..disabled = currentPage == 0
            ..style.setProperty('padding', '0.5rem 1rem')
            ..style.setProperty('background-color', currentPage == 0 ? '#e0e0e0' : '#1a73e8')
            ..style.setProperty('color', currentPage == 0 ? '#888' : '#ffffff')
            ..style.setProperty('border', 'none')
            ..style.setProperty('border-radius', '4px')
            ..style.setProperty('cursor', currentPage == 0 ? 'not-allowed' : 'pointer');

          final pageLabel = document.createElement('span') as HTMLSpanElement
            ..textContent = 'Page ${currentPage + 1} of ${result.totalPages}'
            ..style.setProperty('font-size', '0.9rem')
            ..style.setProperty('color', '#444');

          final isLastPage = currentPage >= result.totalPages - 1;
          final nextBtn = document.createElement('button') as HTMLButtonElement
            ..type = 'button'
            ..textContent = 'Next'
            ..setAttribute('aria-label', 'Next page')
            ..disabled = isLastPage
            ..style.setProperty('padding', '0.5rem 1rem')
            ..style.setProperty('background-color', isLastPage ? '#e0e0e0' : '#1a73e8')
            ..style.setProperty('color', isLastPage ? '#888' : '#ffffff')
            ..style.setProperty('border', 'none')
            ..style.setProperty('border-radius', '4px')
            ..style.setProperty('cursor', isLastPage ? 'not-allowed' : 'pointer');

          prevBtn.addEventListener(
            'click',
            ((Event _) {
              if (currentPage > 0) {
                currentPage--;
                loadExpenses();
              }
            }).toJS,
          );

          nextBtn.addEventListener(
            'click',
            ((Event _) {
              if (currentPage < result.totalPages - 1) {
                currentPage++;
                loadExpenses();
              }
            }).toJS,
          );

          pagination
            ..appendChild(prevBtn)
            ..appendChild(pageLabel)
            ..appendChild(nextBtn);
          listArea.appendChild(pagination);
        }
      }
    } on DioException {
      while (listArea.firstChild != null) {
        listArea.removeChild(listArea.firstChild!);
      }
      isLoading = false;
      final errEl = document.createElement('p') as HTMLParagraphElement
        ..setAttribute('role', 'alert')
        ..textContent = 'Failed to load expenses.'
        ..style.setProperty('color', '#c0392b');
      listArea.appendChild(errEl);
    }
  }

  // Create form submission
  createForm.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();

      createFormError.style.setProperty('display', 'none');
      for (final id in [
        'amount-error',
        'currency-error',
        'type-error',
        'category-error',
        'date-error',
        'description-error',
      ]) {
        clearFieldError(id);
      }

      final amountVal = amountInput.value.trim();
      final currencyVal = currencyInput.value.trim().toUpperCase();
      final typeVal = typeInput.value.trim().toUpperCase();
      final categoryVal = categoryInput.value.trim();
      final dateVal = dateInput.value.trim();
      final descriptionVal = descriptionInput.value.trim();
      final quantityVal = quantityInput.value.trim();
      final unitVal = unitInput.value.trim();

      var valid = true;

      if (amountVal.isEmpty) {
        setFieldError('amount-error', 'Amount is required');
        amountInput.setAttribute('aria-invalid', 'true');
        valid = false;
      } else {
        final parsed = double.tryParse(amountVal);
        if (parsed == null || parsed < 0) {
          setFieldError('amount-error', 'Amount must be a non-negative number');
          amountInput.setAttribute('aria-invalid', 'true');
          valid = false;
        }
      }

      if (currencyVal.isEmpty) {
        setFieldError('currency-error', 'Currency is required');
        currencyInput.setAttribute('aria-invalid', 'true');
        valid = false;
      } else if (!_supportedCurrencies.contains(currencyVal)) {
        setFieldError('currency-error', 'Currency must be USD or IDR');
        currencyInput.setAttribute('aria-invalid', 'true');
        valid = false;
      }

      if (typeVal.isEmpty) {
        setFieldError('type-error', 'Type is required');
        typeInput.setAttribute('aria-invalid', 'true');
        valid = false;
      } else if (!_supportedTypes.contains(typeVal)) {
        setFieldError('type-error', 'Type must be INCOME or EXPENSE');
        typeInput.setAttribute('aria-invalid', 'true');
        valid = false;
      }

      if (categoryVal.isEmpty) {
        setFieldError('category-error', 'Category is required');
        categoryInput.setAttribute('aria-invalid', 'true');
        valid = false;
      }

      if (dateVal.isEmpty) {
        setFieldError('date-error', 'Date is required');
        dateInput.setAttribute('aria-invalid', 'true');
        valid = false;
      }

      if (descriptionVal.isEmpty) {
        setFieldError('description-error', 'Description is required');
        descriptionInput.setAttribute('aria-invalid', 'true');
        valid = false;
      }

      if (!valid) return;

      createSubmitBtn
        ..textContent = 'Creating...'
        ..disabled = true
        ..style.setProperty('cursor', 'not-allowed');

      () async {
        try {
          await expense_svc.createExpense(CreateExpenseRequest(
            amount: amountVal,
            currency: currencyVal,
            category: categoryVal,
            description: descriptionVal,
            date: dateVal,
            type: typeVal,
            quantity: quantityVal.isNotEmpty ? num.tryParse(quantityVal) : null,
            unit: unitVal.isNotEmpty ? unitVal : null,
          ));

          // Reset form
          createForm.reset();
          createFormWrapper.style.setProperty('display', 'none');
          createSubmitBtn
            ..textContent = 'Create Expense'
            ..disabled = false
            ..style.setProperty('cursor', 'pointer');

          currentPage = 0;
          await loadExpenses();
        } on DioException {
          createSubmitBtn
            ..textContent = 'Create Expense'
            ..disabled = false
            ..style.setProperty('cursor', 'pointer');
          createFormError
            ..textContent = 'Failed to create expense. Please try again.'
            ..style.setProperty('display', 'block');
        }
      }();
    }).toJS,
  );

  // Confirm delete
  confirmDeleteBtn.addEventListener(
    'click',
    ((Event _) {
      () async {
        final id = pendingDeleteId;
        if (id == null) return;
        closeDeleteDialog();
        try {
          await expense_svc.deleteExpense(id);
          await loadExpenses();
        } on DioException {
          final errEl = document.createElement('p') as HTMLParagraphElement
            ..setAttribute('role', 'alert')
            ..textContent = 'Failed to delete expense. Please try again.'
            ..style.setProperty('color', '#c0392b');
          listArea.appendChild(errEl);
        }
      }();
    }).toJS,
  );

  parent.appendChild(container);

  // Initial load
  loadExpenses();
}
