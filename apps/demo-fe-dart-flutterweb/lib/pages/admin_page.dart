import 'dart:js_interop';

import 'package:dio/dio.dart';
import 'package:web/web.dart';

import '../models/user.dart';
import '../services/admin_service.dart' as admin_svc;

void render(Element parent) {
  final main = document.createElement('main') as HTMLElement
    ..style.setProperty('max-width', '64rem')
    ..style.setProperty('margin', '2rem auto')
    ..style.setProperty('padding', '0 1.5rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement
    ..textContent = 'Admin: Users'
    ..style.setProperty('margin-bottom', '1.5rem');
  main.appendChild(h1);

  parent.appendChild(main);

  // Mutable state
  var currentPage = 0;
  var currentSearch = '';
  String? disablingUserId;

  // ── Disable dialog ──────────────────────────────────────────────────────────
  final overlay = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'alertdialog')
    ..setAttribute('aria-modal', 'true')
    ..setAttribute('aria-labelledby', 'disable-dialog-title')
    ..style.setProperty('display', 'none')
    ..style.setProperty('position', 'fixed')
    ..style.setProperty('top', '0')
    ..style.setProperty('left', '0')
    ..style.setProperty('width', '100%')
    ..style.setProperty('height', '100%')
    ..style.setProperty('background-color', 'rgba(0,0,0,0.45)')
    ..style.setProperty('z-index', '1000')
    ..style.setProperty('justify-content', 'center')
    ..style.setProperty('align-items', 'center');

  final dialogBox = document.createElement('div') as HTMLDivElement
    ..style.setProperty('background-color', '#fff')
    ..style.setProperty('border-radius', '8px')
    ..style.setProperty('padding', '2rem')
    ..style.setProperty('min-width', '22rem')
    ..style.setProperty('max-width', '28rem')
    ..style.setProperty('box-shadow', '0 4px 24px rgba(0,0,0,0.18)');

  final dialogTitle = document.createElement('h2') as HTMLHeadingElement
    ..id = 'disable-dialog-title'
    ..textContent = 'Disable User'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  dialogBox.appendChild(dialogTitle);

  final reasonLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'disable-reason'
    ..textContent = 'Reason'
    ..style.setProperty('display', 'block')
    ..style.setProperty('margin-bottom', '0.4rem')
    ..style.setProperty('font-weight', '600');
  dialogBox.appendChild(reasonLabel);

  final reasonTextarea = document.createElement('textarea') as HTMLTextAreaElement
    ..id = 'disable-reason'
    ..rows = 3
    ..style.setProperty('width', '100%')
    ..style.setProperty('padding', '0.5rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('box-sizing', 'border-box')
    ..style.setProperty('margin-bottom', '1rem');
  dialogBox.appendChild(reasonTextarea);

  final dialogError = document.createElement('div') as HTMLDivElement
    ..setAttribute('role', 'alert')
    ..style.setProperty('display', 'none')
    ..style.setProperty('color', '#c0392b')
    ..style.setProperty('background-color', '#fdf2f2')
    ..style.setProperty('padding', '0.5rem 0.75rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('margin-bottom', '0.75rem')
    ..style.setProperty('font-size', '0.9rem');
  dialogBox.appendChild(dialogError);

  final dialogActions = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.5rem')
    ..style.setProperty('justify-content', 'flex-end');

  final confirmDisableBtn = document.createElement('button') as HTMLButtonElement
    ..textContent = 'Disable'
    ..disabled = true;
  _styleActionButton(confirmDisableBtn, '#c0392b');

  final cancelDialogBtn = document.createElement('button') as HTMLButtonElement
    ..textContent = 'Cancel';
  _styleActionButton(cancelDialogBtn, '#666');

  dialogActions.appendChild(cancelDialogBtn);
  dialogActions.appendChild(confirmDisableBtn);
  dialogBox.appendChild(dialogActions);
  overlay.appendChild(dialogBox);
  document.body!.appendChild(overlay);

  void closeDialog() {
    overlay.style.setProperty('display', 'none');
    reasonTextarea.value = '';
    dialogError.style.setProperty('display', 'none');
    confirmDisableBtn.disabled = true;
    dialogTitle.textContent = 'Disable User';
    disablingUserId = null;
  }

  reasonTextarea.addEventListener(
    'input',
    ((Event _) {
      confirmDisableBtn.disabled = reasonTextarea.value.trim().isEmpty;
    }).toJS,
  );

  cancelDialogBtn.addEventListener('click', ((Event _) => closeDialog()).toJS);

  // ── Search form ─────────────────────────────────────────────────────────────
  final searchForm = document.createElement('form') as HTMLFormElement
    ..setAttribute('novalidate', '')
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.5rem')
    ..style.setProperty('align-items', 'center')
    ..style.setProperty('margin-bottom', '1.25rem')
    ..style.setProperty('flex-wrap', 'wrap');

  final searchLabel = document.createElement('label') as HTMLLabelElement
    ..htmlFor = 'search-users'
    ..textContent = 'Search users'
    ..style.setProperty('display', 'none');
  searchForm.appendChild(searchLabel);

  final searchInput = document.createElement('input') as HTMLInputElement
    ..id = 'search-users'
    ..type = 'text'
    ..placeholder = 'Search by username or email'
    ..style.setProperty('padding', '0.45rem 0.75rem')
    ..style.setProperty('border', '1px solid #ccc')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.95rem')
    ..style.setProperty('min-width', '16rem');
  searchForm.appendChild(searchInput);

  final searchBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'submit'
    ..textContent = 'Search';
  _styleActionButton(searchBtn, '#1a73e8');
  searchForm.appendChild(searchBtn);

  final clearBtn = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Clear'
    ..style.setProperty('display', 'none');
  _styleActionButton(clearBtn, '#666');
  searchForm.appendChild(clearBtn);

  main.appendChild(searchForm);

  // ── Table container ─────────────────────────────────────────────────────────
  final tableContainer = document.createElement('div') as HTMLDivElement;
  main.appendChild(tableContainer);

  // ── Pagination ──────────────────────────────────────────────────────────────
  final paginationDiv = document.createElement('div') as HTMLDivElement
    ..style.setProperty('display', 'flex')
    ..style.setProperty('gap', '0.75rem')
    ..style.setProperty('align-items', 'center')
    ..style.setProperty('margin-top', '1rem');
  main.appendChild(paginationDiv);

  // Forward declarations for mutual recursion
  late void Function() loadUsers;
  late void Function(UserListResponse data) renderTable;

  renderTable = (UserListResponse data) {
    while (tableContainer.firstChild != null) {
      tableContainer.removeChild(tableContainer.firstChild!);
    }

    final countEl = document.createElement('p') as HTMLParagraphElement
      ..textContent = '${data.totalElements} users'
      ..style.setProperty('color', '#555')
      ..style.setProperty('margin-bottom', '0.75rem')
      ..style.setProperty('font-size', '0.95rem');
    tableContainer.appendChild(countEl);

    // Wrapper with shadow
    final tableWrapper = document.createElement('div') as HTMLDivElement
      ..style.setProperty('background-color', '#fff')
      ..style.setProperty('border-radius', '8px')
      ..style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.06)')
      ..style.setProperty('overflow-x', 'auto');

    final table = document.createElement('table') as HTMLTableElement
      ..style.setProperty('width', '100%')
      ..style.setProperty('border-collapse', 'collapse');

    // thead
    final thead = table.createTHead();
    final headerRow = thead.insertRow(-1);
    for (final heading in ['Username', 'Email', 'Status', 'Actions']) {
      final th = document.createElement('th') as HTMLTableCellElement
        ..textContent = heading
        ..style.setProperty('text-align', 'left')
        ..style.setProperty('padding', '0.65rem 1rem')
        ..style.setProperty('font-weight', '700')
        ..style.setProperty('font-size', '0.78rem')
        ..style.setProperty('text-transform', 'uppercase')
        ..style.setProperty('color', '#555')
        ..style.setProperty('background-color', '#f0f0f0')
        ..style.setProperty('border-bottom', '2px solid #ddd');
      headerRow.appendChild(th);
    }

    // tbody
    final tbody = table.createTBody();
    for (var i = 0; i < data.content.length; i++) {
      final user = data.content[i];
      final tr = tbody.insertRow(-1)
        ..style.setProperty('background-color', i.isEven ? '#fff' : '#fafafa')
        ..style.setProperty('border-bottom', '1px solid #eee');

      // Username
      tr.insertCell(-1)
        ..textContent = user.username
        ..style.setProperty('padding', '0.65rem 1rem')
        ..style.setProperty('font-size', '0.95rem');

      // Email
      tr.insertCell(-1)
        ..textContent = user.email
        ..style.setProperty('padding', '0.65rem 1rem')
        ..style.setProperty('font-size', '0.95rem');

      // Status badge
      final statusCell = tr.insertCell(-1)
        ..style.setProperty('padding', '0.65rem 1rem');
      statusCell.appendChild(_buildStatusBadge(user.status));

      // Actions cell
      final actionsCell = tr.insertCell(-1)
        ..style.setProperty('padding', '0.65rem 1rem');

      // Per-status action button
      if (user.status == 'ACTIVE') {
        final disableBtn = document.createElement('button') as HTMLButtonElement
          ..textContent = 'Disable'
          ..setAttribute('aria-label', 'Disable user ${user.username}');
        _styleActionButton(disableBtn, '#c0392b');
        disableBtn.addEventListener(
          'click',
          ((Event _) {
            disablingUserId = user.id;
            dialogTitle.textContent = 'Disable User: ${user.username}';
            reasonTextarea.value = '';
            confirmDisableBtn.disabled = true;
            dialogError.style.setProperty('display', 'none');
            overlay.style.setProperty('display', 'flex');
          }).toJS,
        );
        actionsCell.appendChild(disableBtn);
      } else if (user.status == 'DISABLED') {
        final enableBtn = document.createElement('button') as HTMLButtonElement
          ..textContent = 'Enable'
          ..setAttribute('aria-label', 'Enable user ${user.username}');
        _styleActionButton(enableBtn, '#27ae60');
        enableBtn.addEventListener(
          'click',
          ((Event _) {
            () async {
              enableBtn.disabled = true;
              try {
                await admin_svc.enableUser(user.id);
                loadUsers();
              } on DioException {
                enableBtn.disabled = false;
              }
            }();
          }).toJS,
        );
        actionsCell.appendChild(enableBtn);
      } else if (user.status == 'LOCKED') {
        final unlockBtn = document.createElement('button') as HTMLButtonElement
          ..textContent = 'Unlock'
          ..setAttribute('aria-label', 'Unlock user ${user.username}');
        _styleActionButton(unlockBtn, '#8e44ad');
        unlockBtn.addEventListener(
          'click',
          ((Event _) {
            () async {
              unlockBtn.disabled = true;
              try {
                await admin_svc.unlockUser(user.id);
                loadUsers();
              } on DioException {
                unlockBtn.disabled = false;
              }
            }();
          }).toJS,
        );
        actionsCell.appendChild(unlockBtn);
      }

      // Generate Reset Token button (all users)
      final resetBtn = document.createElement('button') as HTMLButtonElement
        ..textContent = 'Generate Reset Token'
        ..setAttribute(
          'aria-label',
          'Generate Reset Token for ${user.username}',
        );
      _styleActionButton(resetBtn, '#1a73e8');
      resetBtn.addEventListener(
        'click',
        ((Event _) {
          () async {
            resetBtn.disabled = true;
            // Remove any previously shown token for this row
            final oldTokenAreas = actionsCell.querySelectorAll('[data-reset-token-area]');
            for (var j = 0; j < oldTokenAreas.length; j++) {
              (oldTokenAreas.item(j) as Element?)?.remove();
            }
            try {
              final resp = await admin_svc.forcePasswordReset(user.id);
              resetBtn.disabled = false;

              final tokenArea = document.createElement('span') as HTMLSpanElement
                ..setAttribute('data-reset-token-area', '')
                ..style.setProperty('display', 'inline-flex')
                ..style.setProperty('align-items', 'center')
                ..style.setProperty('gap', '0.35rem')
                ..style.setProperty('margin-top', '0.35rem')
                ..style.setProperty('flex-wrap', 'wrap');

              final codeEl = document.createElement('code') as HTMLElement
                ..setAttribute('data-testid', 'reset-token')
                ..textContent = resp.token
                ..style.setProperty('background-color', '#f0f0f0')
                ..style.setProperty('padding', '0.15rem 0.4rem')
                ..style.setProperty('border-radius', '3px')
                ..style.setProperty('font-size', '0.8rem')
                ..style.setProperty('word-break', 'break-all');
              tokenArea.appendChild(codeEl);

              final copyBtn = document.createElement('button') as HTMLButtonElement
                ..textContent = 'Copy';
              _styleActionButton(copyBtn, '#555');
              copyBtn.addEventListener(
                'click',
                ((Event _) {
                  window.navigator.clipboard.writeText(resp.token);
                  copyBtn.textContent = 'Copied!';
                  Future.delayed(
                    const Duration(seconds: 2),
                    () => copyBtn.textContent = 'Copy',
                  );
                }).toJS,
              );
              tokenArea.appendChild(copyBtn);

              // Insert token area below the buttons
              actionsCell.appendChild(document.createElement('br'));
              actionsCell.appendChild(tokenArea);
            } on DioException {
              resetBtn.disabled = false;
            }
          }();
        }).toJS,
      );
      actionsCell.appendChild(resetBtn);
    }

    tableWrapper.appendChild(table);
    tableContainer.appendChild(tableWrapper);

    // Pagination
    while (paginationDiv.firstChild != null) {
      paginationDiv.removeChild(paginationDiv.firstChild!);
    }

    final prevBtn = document.createElement('button') as HTMLButtonElement
      ..textContent = 'Previous'
      ..setAttribute('aria-label', 'Previous page')
      ..disabled = data.page == 0;
    _styleActionButton(prevBtn, '#555');
    prevBtn.addEventListener(
      'click',
      ((Event _) {
        if (currentPage > 0) {
          currentPage--;
          loadUsers();
        }
      }).toJS,
    );
    paginationDiv.appendChild(prevBtn);

    final pageLabel = document.createElement('span') as HTMLSpanElement
      ..textContent = 'Page ${data.page + 1} of ${data.totalPages}'
      ..style.setProperty('font-size', '0.9rem')
      ..style.setProperty('color', '#444');
    paginationDiv.appendChild(pageLabel);

    final nextBtn = document.createElement('button') as HTMLButtonElement
      ..textContent = 'Next'
      ..setAttribute('aria-label', 'Next page')
      ..disabled = data.page >= data.totalPages - 1;
    _styleActionButton(nextBtn, '#555');
    nextBtn.addEventListener(
      'click',
      ((Event _) {
        if (data.page < data.totalPages - 1) {
          currentPage++;
          loadUsers();
        }
      }).toJS,
    );
    paginationDiv.appendChild(nextBtn);
  };

  loadUsers = () {
    while (tableContainer.firstChild != null) {
      tableContainer.removeChild(tableContainer.firstChild!);
    }
    while (paginationDiv.firstChild != null) {
      paginationDiv.removeChild(paginationDiv.firstChild!);
    }

    final loadingEl = document.createElement('p') as HTMLParagraphElement
      ..textContent = 'Loading users...'
      ..style.setProperty('color', '#666');
    tableContainer.appendChild(loadingEl);

    admin_svc
        .listUsers(
      page: currentPage,
      size: 20,
      search: currentSearch.isEmpty ? null : currentSearch,
    )
        .then((data) {
      renderTable(data);
    }).catchError((_) {
      while (tableContainer.firstChild != null) {
        tableContainer.removeChild(tableContainer.firstChild!);
      }
      final errDiv = document.createElement('div') as HTMLDivElement
        ..setAttribute('role', 'alert')
        ..textContent = 'Failed to load users.'
        ..style.setProperty('color', '#c0392b')
        ..style.setProperty('background-color', '#fdf2f2')
        ..style.setProperty('padding', '0.75rem 1rem')
        ..style.setProperty('border-radius', '4px')
        ..style.setProperty('border', '1px solid #f5c6cb');
      tableContainer.appendChild(errDiv);
    });
  };

  // Wire up confirm disable
  confirmDisableBtn.addEventListener(
    'click',
    ((Event _) {
      () async {
        final reason = reasonTextarea.value.trim();
        if (reason.isEmpty) return;
        final userId = disablingUserId;
        if (userId == null) return;

        confirmDisableBtn.disabled = true;
        dialogError.style.setProperty('display', 'none');

        try {
          await admin_svc.disableUser(userId, DisableRequest(reason: reason));
          closeDialog();
          loadUsers();
        } on DioException {
          dialogError
            ..textContent = 'Failed to disable user. Please try again.'
            ..style.setProperty('display', 'block');
          confirmDisableBtn.disabled = false;
        }
      }();
    }).toJS,
  );

  // Wire up search form
  searchForm.addEventListener(
    'submit',
    ((Event e) {
      e.preventDefault();
      final term = searchInput.value.trim();
      currentSearch = term;
      currentPage = 0;
      clearBtn.style.setProperty('display', term.isEmpty ? 'none' : 'inline-block');
      loadUsers();
    }).toJS,
  );

  clearBtn.addEventListener(
    'click',
    ((Event _) {
      searchInput.value = '';
      currentSearch = '';
      currentPage = 0;
      clearBtn.style.setProperty('display', 'none');
      loadUsers();
    }).toJS,
  );

  loadUsers();
}

Element _buildStatusBadge(String status) {
  final colors = <String, String>{
    'ACTIVE': '#27ae60',
    'INACTIVE': '#e67e22',
    'DISABLED': '#c0392b',
    'LOCKED': '#8e44ad',
  };
  final color = colors[status] ?? '#888';

  return document.createElement('span') as HTMLSpanElement
    ..textContent = status
    ..style.setProperty('background-color', color)
    ..style.setProperty('color', '#fff')
    ..style.setProperty('padding', '0.2rem 0.55rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('font-size', '0.78rem')
    ..style.setProperty('font-weight', '700');
}

void _styleActionButton(HTMLButtonElement btn, String bgColor) {
  btn.style
    ..setProperty('padding', '0.35rem 0.7rem')
    ..setProperty('background-color', bgColor)
    ..setProperty('color', '#fff')
    ..setProperty('border', 'none')
    ..setProperty('border-radius', '4px')
    ..setProperty('cursor', 'pointer')
    ..setProperty('font-size', '0.8rem')
    ..setProperty('font-weight', '600')
    ..setProperty('margin-right', '0.35rem');
}
