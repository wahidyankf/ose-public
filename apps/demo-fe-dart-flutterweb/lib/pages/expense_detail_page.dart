import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../services/expense_service.dart' as expense_svc;
import '../services/attachment_service.dart' as attach_svc;
import '../services/user_service.dart' as user_svc;
import '../models/expense.dart';
import '../main.dart' as router;

void render(Element parent, String id) {
  final main = document.createElement('main') as HTMLElement
    ..style.setProperty('max-width', '48rem')
    ..style.setProperty('margin', '2rem auto')
    ..style.setProperty('padding', '0 1rem');

  final loading = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Loading expense...'
    ..style.setProperty('color', '#666');
  main.appendChild(loading);
  parent.appendChild(main);

  Future.wait([
    expense_svc.getExpense(id),
    user_svc.getCurrentUser(),
  ]).then((results) {
    loading.remove();
    final expense = results[0] as Expense;
    final currentUser = results[1] as dynamic;
    _renderDetail(main, expense, currentUser, id);
  }).catchError((_) {
    loading.remove();
    final errDiv = document.createElement('div') as HTMLDivElement
      ..style.setProperty('text-align', 'center');
    final errMsg = document.createElement('p') as HTMLParagraphElement
      ..textContent = 'Expense not found or failed to load.'
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('margin-bottom', '1rem');
    errDiv.appendChild(errMsg);
    final backLink = document.createElement('a') as HTMLAnchorElement
      ..href = '/expenses'
      ..textContent = '← Back to Expenses'
      ..style.setProperty('color', '#1558c0');
    backLink.addEventListener(
      'click',
      ((Event e) {
        e.preventDefault();
        router.navigateTo('/expenses');
      }).toJS,
    );
    errDiv.appendChild(backLink);
    main.appendChild(errDiv);
  });
}

void _renderDetail(
  Element main,
  Expense expense,
  dynamic currentUser,
  String id,
) {
  final isOwner =
      currentUser != null && (currentUser as dynamic).id == expense.userId;

  // Back link
  final backLink = document.createElement('a') as HTMLAnchorElement
    ..href = '/expenses'
    ..textContent = '← Back to Expenses'
    ..style.setProperty('color', '#1558c0')
    ..style.setProperty('display', 'inline-block')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('text-decoration', 'none');
  backLink.addEventListener(
    'click',
    ((Event e) {
      e.preventDefault();
      router.navigateTo('/expenses');
    }).toJS,
  );
  main.appendChild(backLink);

  // Title
  final title = document.createElement('h1') as HTMLHeadingElement
    ..textContent = expense.description
    ..style.setProperty('margin-bottom', '1.5rem')
    ..style.setProperty('margin-top', '0');
  main.appendChild(title);

  // Action buttons row
  final actionsRow = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem')
    ..style.setProperty('margin-bottom', '1.5rem');

  final editBtn = document.createElement('button') as HTMLButtonElement
    ..textContent = 'Edit'
    ..style.setProperty('padding', '0.5rem 1.25rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  final deleteBtn = document.createElement('button') as HTMLButtonElement
    ..textContent = 'Delete'
    ..style.setProperty('padding', '0.5rem 1.25rem')
    ..style.setProperty('background-color', '#c0392b')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  actionsRow
    ..appendChild(editBtn)
    ..appendChild(deleteBtn);
  main.appendChild(actionsRow);

  // Detail card
  final detailCard = _makeCard();
  final dl = document.createElement('dl') as HTMLElement
    ..style.setProperty('margin', '0');

  void addDetail(String term, String value) {
    final dt = document.createElement('dt') as HTMLElement
      ..textContent = term
      ..style.setProperty('font-weight', '600')
      ..style.setProperty('color', '#555')
      ..style.setProperty('font-size', '0.85rem')
      ..style.setProperty('margin-top', '0.75rem')
      ..style.setProperty('margin-bottom', '0.2rem');
    final dd = document.createElement('dd') as HTMLElement
      ..textContent = value
      ..style.setProperty('margin', '0')
      ..style.setProperty('font-size', '1rem');
    dl
      ..appendChild(dt)
      ..appendChild(dd);
  }

  addDetail('Amount', '${expense.currency} ${expense.amount}');
  addDetail('Type', expense.type);
  addDetail('Category', expense.category);
  addDetail('Date', expense.date);
  addDetail('Quantity', expense.quantity?.toString() ?? '—');
  addDetail('Unit', expense.unit ?? '—');

  detailCard.appendChild(dl);
  main.appendChild(detailCard);

  // Edit form (hidden initially)
  final editFormContainer = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'none')
    ..style.setProperty('margin-bottom', '1.5rem');

  final editCard = _makeCard();
  final editCardH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Edit Expense'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  editCard.appendChild(editCardH2);

  final editForm = _buildEditForm(expense);
  editCard.appendChild(editForm);
  editFormContainer.appendChild(editCard);
  main.appendChild(editFormContainer);

  // Toggle edit form
  var editOpen = false;
  editBtn.addEventListener(
    'click',
    ((Event _) {
      editOpen = !editOpen;
      editFormContainer.style.setProperty('display', editOpen ? 'block' : 'none');
      editBtn.textContent = editOpen ? 'Cancel Edit' : 'Edit';
    }).toJS,
  );

  // Handle save from the edit form
  final saveBtn = editForm.querySelector('#edit-save-btn') as HTMLButtonElement?;
  final cancelBtn = editForm.querySelector('#edit-cancel-btn') as HTMLButtonElement?;

  cancelBtn?.addEventListener(
    'click',
    ((Event _) {
      editOpen = false;
      editFormContainer.style.setProperty('display', 'none');
      editBtn.textContent = 'Edit';
    }).toJS,
  );

  saveBtn?.addEventListener(
    'click',
    ((Event _) {
      () async {
        final amountVal =
            (editForm.querySelector('#edit-amount') as HTMLInputElement?)?.value ?? '';
        final currencyVal =
            (editForm.querySelector('#edit-currency') as HTMLInputElement?)?.value ?? '';
        final typeVal =
            (editForm.querySelector('#edit-type') as HTMLInputElement?)?.value ?? '';
        final categoryVal =
            (editForm.querySelector('#edit-category') as HTMLInputElement?)?.value ?? '';
        final dateVal =
            (editForm.querySelector('#edit-date') as HTMLInputElement?)?.value ?? '';
        final descriptionVal =
            (editForm.querySelector('#edit-description') as HTMLInputElement?)?.value ?? '';
        final quantityStr =
            (editForm.querySelector('#edit-quantity') as HTMLInputElement?)?.value ?? '';
        final unitVal =
            (editForm.querySelector('#edit-unit') as HTMLInputElement?)?.value ?? '';

        final editError = editForm.querySelector('#edit-error') as HTMLDivElement?;
        editError?.style.setProperty('display', 'none');

        saveBtn
          ..textContent = 'Saving...'
          ..disabled = true;

        try {
          final updated = await expense_svc.updateExpense(
            id,
            UpdateExpenseRequest(
              amount: amountVal.isNotEmpty ? amountVal : null,
              currency: currencyVal.isNotEmpty ? currencyVal : null,
              type: typeVal.isNotEmpty ? typeVal : null,
              category: categoryVal.isNotEmpty ? categoryVal : null,
              date: dateVal.isNotEmpty ? dateVal : null,
              description: descriptionVal.isNotEmpty ? descriptionVal : null,
              quantity: quantityStr.isNotEmpty ? num.tryParse(quantityStr) : null,
              unit: unitVal.isNotEmpty ? unitVal : null,
            ),
          );

          // Refresh the page with updated data
          while (main.firstChild != null) {
            main.removeChild(main.firstChild!);
          }
          _renderDetail(main, updated, currentUser, id);
        } on DioException catch (err) {
          saveBtn
            ..textContent = 'Save Changes'
            ..disabled = false;
          final body = err.response?.data;
          final msg = body is Map
              ? (body['message'] as String? ?? 'Failed to update expense.')
              : 'Failed to update expense.';
          if (editError != null) {
            editError
              ..textContent = msg
              ..style.setProperty('display', 'block');
          }
        }
      }();
    }).toJS,
  );

  // Delete confirmation dialog
  final deleteDialog = _buildDeleteDialog(
    dialogId: 'delete-expense-dialog',
    titleId: 'delete-dialog-title',
    titleText: 'Delete Expense',
    message: 'Are you sure you want to delete this expense?',
    confirmLabel: 'Yes, Delete',
    onConfirm: () async {
      try {
        await expense_svc.deleteExpense(id);
        router.navigateTo('/expenses');
      } on DioException {
        // ignore — navigate anyway
        router.navigateTo('/expenses');
      }
    },
  );
  document.body?.appendChild(deleteDialog);

  deleteBtn.addEventListener(
    'click',
    ((Event _) {
      deleteDialog.style.setProperty('display', 'flex');
      deleteDialog.focus();
    }).toJS,
  );

  // Attachments section
  final attachSection = document.createElement('div') as HTMLDivElement
    ..style.setProperty('margin-top', '2rem');
  final attachH2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Attachments'
    ..style.setProperty('margin-bottom', '1rem');
  attachSection.appendChild(attachH2);

  // Upload input (only for owner)
  if (isOwner) {
    final uploadGroup = document.createElement('div') as HTMLDivElement
      ..style.setProperty('margin-bottom', '1rem');
    final fileInput = document.createElement('input') as HTMLInputElement
      ..type = 'file'
      ..id = 'file-upload'
      ..accept = 'image/*,.pdf,.txt'
      ..style.setProperty('display', 'block')
      ..style.setProperty('margin-bottom', '0.5rem');
    uploadGroup.appendChild(fileInput);

    final uploadError = document.createElement('div') as HTMLDivElement
      ..setAttribute('role', 'alert')
      ..style.setProperty('display', 'none')
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('font-size', '0.9rem')
      ..style.setProperty('margin-top', '0.25rem');
    uploadGroup.appendChild(uploadError);

    fileInput.addEventListener(
      'change',
      ((Event _) {
        () async {
          uploadError.style.setProperty('display', 'none');
          final files = fileInput.files;
          if (files == null || files.length == 0) return;
          final file = files.item(0)!;

          const maxBytes = 10 * 1024 * 1024; // 10MB
          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
          ];

          if (file.size > maxBytes) {
            uploadError
              ..textContent = 'File is too large.'
              ..style.setProperty('display', 'block');
            fileInput.value = '';
            return;
          }

          if (!allowedTypes.contains(file.type)) {
            uploadError
              ..textContent = 'Unsupported file type.'
              ..style.setProperty('display', 'block');
            fileInput.value = '';
            return;
          }

          try {
            await attach_svc.uploadAttachment(id, file);
            fileInput.value = '';
            // Refresh attachment list
            _refreshAttachments(attachSection, id, isOwner, uploadGroup);
          } on DioException catch (err) {
            fileInput.value = '';
            final status = err.response?.statusCode;
            if (status == 413) {
              uploadError
                ..textContent = 'File is too large.'
                ..style.setProperty('display', 'block');
            } else if (status == 415) {
              uploadError
                ..textContent = 'Unsupported file type.'
                ..style.setProperty('display', 'block');
            } else {
              uploadError
                ..textContent = 'Upload failed. Please try again.'
                ..style.setProperty('display', 'block');
            }
          }
        }();
      }).toJS,
    );

    attachSection.appendChild(uploadGroup);
  }

  // Attachment list container
  final attachListContainer = document.createElement('div') as HTMLDivElement
    ..id = 'attachment-list';
  attachSection.appendChild(attachListContainer);

  _loadAttachmentList(attachListContainer, id, isOwner);
  main.appendChild(attachSection);
}

void _refreshAttachments(
  Element attachSection,
  String expenseId,
  bool isOwner,
  Element uploadGroup,
) {
  final existing = attachSection.querySelector('#attachment-list');
  if (existing != null) {
    existing.remove();
    final newContainer = document.createElement('div') as HTMLDivElement
      ..id = 'attachment-list';
    attachSection.appendChild(newContainer);
    _loadAttachmentList(newContainer, expenseId, isOwner);
  }
}

void _loadAttachmentList(
  Element container,
  String expenseId,
  bool isOwner,
) {
  while (container.firstChild != null) {
    container.removeChild(container.firstChild!);
  }
  final loading = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Loading attachments...'
    ..style.setProperty('color', '#666')
    ..style.setProperty('font-size', '0.9rem');
  container.appendChild(loading);

  attach_svc.listAttachments(expenseId).then((attachments) {
    loading.remove();
    if (attachments.isEmpty) {
      final emptyMsg = document.createElement('p') as HTMLParagraphElement
        ..textContent = 'No attachments yet.'
        ..style.setProperty('color', '#888')
        ..style.setProperty('font-size', '0.9rem');
      container.appendChild(emptyMsg);
      return;
    }

    final ul = document.createElement('ul') as HTMLUListElement
      ..style.setProperty('list-style', 'none')
      ..style.setProperty('padding', '0')
      ..style.setProperty('margin', '0');

    for (final att in attachments) {
      final li = document.createElement('li') as HTMLLIElement
        ..style.setProperty('display', 'flex')
        ..style.setProperty('flex-direction', 'column')
        ..style.setProperty('gap', '0.5rem')
        ..style.setProperty('padding', '1rem')
        ..style.setProperty('border', '1px solid #ddd')
        ..style.setProperty('border-radius', '6px')
        ..style.setProperty('margin-bottom', '0.75rem')
        ..style.setProperty('background-color', '#fafafa');

      final topRow = document.createElement('div') as HTMLDivElement
        ..style.setProperty('display', 'flex')
        ..style.setProperty('align-items', 'center')
        ..style.setProperty('justify-content', 'space-between')
        ..style.setProperty('gap', '1rem');

      final infoDiv = document.createElement('div') as HTMLDivElement;
      final nameSpan = document.createElement('span') as HTMLSpanElement
        ..textContent = att.filename
        ..style.setProperty('font-weight', '600')
        ..style.setProperty('display', 'block');
      infoDiv.appendChild(nameSpan);
      final metaSpan = document.createElement('span') as HTMLSpanElement
        ..textContent = '${att.contentType} · ${_formatFileSize(att.size)}'
        ..style.setProperty('color', '#666')
        ..style.setProperty('font-size', '0.85rem');
      infoDiv.appendChild(metaSpan);
      topRow.appendChild(infoDiv);

      if (isOwner) {
        final attDeleteBtn = document.createElement('button') as HTMLButtonElement
          ..textContent = 'Delete'
          ..setAttribute('aria-label', 'Delete attachment ${att.filename}')
          ..style.setProperty('padding', '0.35rem 0.75rem')
          ..style.setProperty('background-color', '#c0392b')
          ..style.setProperty('color', '#fff')
          ..style.setProperty('border', 'none')
          ..style.setProperty('border-radius', '4px')
          ..style.setProperty('cursor', 'pointer')
          ..style.setProperty('font-size', '0.85rem')
          ..style.setProperty('flex-shrink', '0');

        final attDeleteDialog = _buildDeleteDialog(
          dialogId: 'delete-att-dialog-${att.id}',
          titleId: 'delete-att-dialog-title-${att.id}',
          titleText: 'Delete Attachment',
          message: 'Delete "${att.filename}"?',
          confirmLabel: 'Yes, Delete',
          onConfirm: () async {
            await attach_svc.deleteAttachment(expenseId, att.id);
            _loadAttachmentList(container, expenseId, isOwner);
          },
        );
        document.body?.appendChild(attDeleteDialog);

        attDeleteBtn.addEventListener(
          'click',
          ((Event _) {
            attDeleteDialog.style.setProperty('display', 'flex');
            attDeleteDialog.focus();
          }).toJS,
        );

        topRow.appendChild(attDeleteBtn);
      }

      li.appendChild(topRow);

      // Image preview
      if (att.contentType.startsWith('image/')) {
        final img = document.createElement('img') as HTMLImageElement
          ..src = '/api/v1/expenses/$expenseId/attachments/${att.id}/content'
          ..alt = att.filename
          ..style.setProperty('max-width', '100%')
          ..style.setProperty('max-height', '200px')
          ..style.setProperty('border-radius', '4px')
          ..style.setProperty('display', 'block');
        li.appendChild(img);
      }

      ul.appendChild(li);
    }

    container.appendChild(ul);
  }).catchError((_) {
    loading.remove();
    final errMsg = document.createElement('p') as HTMLParagraphElement
      ..textContent = 'Failed to load attachments.'
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('font-size', '0.9rem');
    container.appendChild(errMsg);
  });
}

HTMLFormElement _buildEditForm(Expense expense) {
  final form = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '')
    ..style.setProperty('display', 'flex')
    ..style.setProperty('flex-direction', 'column')
    ..style.setProperty('gap', '1rem');

  final errorDiv = document.createElement('div') as HTMLDivElement
    ..id = 'edit-error'
    ..setAttribute('role', 'alert')
    ..style.setProperty('display', 'none')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('color', '#c0392b')
    ..style.setProperty('padding', '0.75rem 1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('border', '1px solid #f5c6cb');
  form.appendChild(errorDiv);

  form.appendChild(_labeledInput('edit-amount', 'Amount', expense.amount));
  form.appendChild(_labeledInputWithDatalist(
    'edit-currency',
    'Currency',
    expense.currency,
    'edit-currency-list',
    ['USD', 'IDR'],
  ));
  form.appendChild(_labeledInputWithDatalist(
    'edit-type',
    'Type',
    expense.type,
    'edit-type-list',
    ['INCOME', 'EXPENSE'],
  ));
  form.appendChild(_labeledInput('edit-category', 'Category', expense.category));
  form.appendChild(_labeledDateInput('edit-date', 'Date', expense.date));
  form.appendChild(
    _labeledInput(
      'edit-quantity',
      'Quantity',
      expense.quantity?.toString() ?? '',
    ),
  );
  form.appendChild(_labeledInputWithDatalist(
    'edit-unit',
    'Unit',
    expense.unit ?? '',
    'edit-unit-list',
    ['kg', 'g', 'pcs', 'box', 'liter', 'hour'],
  ));
  form.appendChild(_labeledInput('edit-description', 'Description', expense.description));

  final btnRow = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem');

  final saveBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..id = 'edit-save-btn'
    ..textContent = 'Save Changes'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#1a73e8')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  final cancelBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..id = 'edit-cancel-btn'
    ..textContent = 'Cancel'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#f5f5f5')
    ..style.setProperty('color', '#333')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('font-size', '0.95rem');

  btnRow
    ..appendChild(saveBtn)
    ..appendChild(cancelBtn);
  form.appendChild(btnRow);

  return form;
}

HTMLDivElement _labeledInput(String id, String label, String value) {
  final group = document.createElement('div') as HTMLDivElement;
  final lbl = document.createElement('label') as HTMLLabelElement
    ..htmlFor = id
    ..textContent = label
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  group.appendChild(lbl);
  final input = document.createElement('input') as HTMLInputElement
    ..id = id
    ..type = 'text'
    ..value = value
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');
  group.appendChild(input);
  return group;
}

HTMLDivElement _labeledDateInput(String id, String label, String value) {
  final group = document.createElement('div') as HTMLDivElement;
  final lbl = document.createElement('label') as HTMLLabelElement
    ..htmlFor = id
    ..textContent = label
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  group.appendChild(lbl);
  final input = document.createElement('input') as HTMLInputElement
    ..id = id
    ..type = 'date'
    ..value = value
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');
  group.appendChild(input);
  return group;
}

HTMLDivElement _labeledInputWithDatalist(
  String id,
  String label,
  String value,
  String listId,
  List<String> options,
) {
  final group = document.createElement('div') as HTMLDivElement;
  final lbl = document.createElement('label') as HTMLLabelElement
    ..htmlFor = id
    ..textContent = label
    ..style.setProperty('display', 'block')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('margin-bottom', '0.3rem')
    ..style.setProperty('font-size', '0.9rem');
  group.appendChild(lbl);

  final input = document.createElement('input') as HTMLInputElement
    ..id = id
    ..type = 'text'
    ..value = value
    ..setAttribute('list', listId)
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.6rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '1rem')
    ..style.setProperty('box-sizing', 'border-box');

  final datalist = document.createElement('datalist')..id = listId;
  for (final opt in options) {
    final option = document.createElement('option') as HTMLOptionElement
      ..value = opt;
    datalist.appendChild(option);
  }

  group
    ..appendChild(input)
    ..appendChild(datalist);
  return group;
}

HTMLDivElement _buildDeleteDialog({
  required String dialogId,
  required String titleId,
  required String titleText,
  required String message,
  required String confirmLabel,
  required Future<void> Function() onConfirm,
}) {
  final overlay = document.createElement('div') as HTMLDivElement
    ..id = dialogId
    ..setAttribute('role', 'alertdialog')
    ..setAttribute('aria-modal', 'true')
    ..setAttribute('aria-labelledby', titleId)
    ..tabIndex = -1
    ..style.setProperty('display', 'none')
    ..style.setProperty('position', 'fixed')
    ..style.setProperty('top', '0')
    ..style.setProperty('left', '0')
    ..style.setProperty('width', '100%')
    ..style.setProperty('height', '100%')
    ..style.setProperty('background-color', 'rgba(0,0,0,0.5)')
    ..style.setProperty('align-items', 'center')
    ..style.setProperty('justify-content', 'center')
    ..style.setProperty('z-index', '1000');

  final dialog = document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#fff')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('padding', '2rem')
    ..style.setProperty('max-width', '28rem')
    ..style.setProperty('width', '90%')
    ..style.setProperty('box-shadow', '0 4px 20px rgba(0,0,0,0.2)');

  final dialogTitle = document.createElement('h2') as HTMLHeadingElement
    ..id = titleId
    ..textContent = titleText
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem')
    ..style.setProperty('font-size', '1.25rem');
  dialog.appendChild(dialogTitle);

  final dialogMsg = document.createElement('p') as HTMLParagraphElement
    ..textContent = message
    ..style.setProperty('margin-bottom', '1.5rem')
    ..style.setProperty('color', '#444');
  dialog.appendChild(dialogMsg);

  final btnRow = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem')
    ..style.setProperty('justify-content', 'flex-end');

  final cancelBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Cancel'
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#f5f5f5')
    ..style.setProperty('color', '#333')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer');

  final confirmBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = confirmLabel
    ..style.setProperty('padding', '0.6rem 1.25rem')
    ..style.setProperty('background-color', '#c0392b')
    ..style.setProperty('color', '#fff')
    ..style.setProperty('border', 'none')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('cursor', 'pointer');

  cancelBtn.addEventListener(
    'click',
    ((Event _) => overlay.style.setProperty('display', 'none')).toJS,
  );

  confirmBtn.addEventListener(
    'click',
    ((Event _) {
      () async {
        confirmBtn
          ..textContent = 'Deleting...'
          ..disabled = true;
        overlay.style.setProperty('display', 'none');
        await onConfirm();
      }();
    }).toJS,
  );

  btnRow
    ..appendChild(cancelBtn)
    ..appendChild(confirmBtn);
  dialog.appendChild(btnRow);
  overlay.appendChild(dialog);

  return overlay;
}

HTMLDivElement _makeCard() {
  return document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#ffffff')
    ..style.setProperty('padding', '1.5rem')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('border', '1px solid #ddd')
    ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.06)')
    ..style.setProperty('margin-bottom', '1.5rem');
}

String _formatFileSize(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
