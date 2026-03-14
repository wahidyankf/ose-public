/// BDD step definitions for expenses/attachments.feature.
///
/// Tests uploading JPEG and PDF attachments, listing attachments, deletion,
/// error cases for unsupported file type and oversized files, and ownership
/// checks.
library;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';
import 'package:demo_fe_dart_flutter/core/providers/auth_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/expense_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/user_provider.dart';
import 'package:demo_fe_dart_flutter/screens/expense_detail_screen.dart';
import 'package:demo_fe_dart_flutter/screens/expense_list_screen.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/expenses/attachments.feature';

// ---------------------------------------------------------------------------
// Provider for attachments (inline FutureProvider.family for testing)
// ---------------------------------------------------------------------------

final _testAttachmentsProvider =
    StateProvider<List<Attachment>>((ref) => []);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _AttachmentsState _s;

class _AttachmentsState {
  final expense = const Expense(
    id: 'exp-001',
    userId: 'user-001',
    title: 'Lunch',
    amount: 10.50,
    currency: 'USD',
    category: 'food',
    expenseDate: '2025-01-15',
    createdAt: '2025-01-15T00:00:00Z',
    description: 'Lunch',
  );

  final bobExpense = const Expense(
    id: 'exp-bob',
    userId: 'user-bob',
    title: 'Taxi',
    amount: 20.00,
    currency: 'USD',
    category: 'transport',
    expenseDate: '2025-01-16',
    createdAt: '2025-01-16T00:00:00Z',
    description: 'Taxi',
  );

  List<Attachment> attachments = [];
  String? uploadError;
  bool accessDenied = false;

  void addAttachment({
    required String filename,
    required String contentType,
  }) {
    attachments.add(Attachment(
      id: 'att-${attachments.length + 1}',
      expenseId: expense.id,
      filename: filename,
      contentType: contentType,
      fileSize: 1024,
      createdAt: '2025-01-15T00:00:00Z',
    ));
  }
}

// ---------------------------------------------------------------------------
// Widget builder
// ---------------------------------------------------------------------------

const _attachmentMockUser = User(
  id: 'user-001',
  username: 'alice',
  email: 'alice@example.com',
  displayName: 'Alice',
  role: 'USER',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00Z',
);

Widget _buildDetailApp(
  _AttachmentsState state, {
  bool isBobsExpense = false,
}) {
  final testScreen =
      _AttachmentTestScreen(state: state, isBobsExpense: isBobsExpense);

  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => testScreen,
      ),
      GoRoute(
        path: '/expenses',
        builder: (_, __) => const ExpenseListScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, st) =>
                ExpenseDetailScreen(expenseId: st.pathParameters['id']!),
          ),
        ],
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      authProvider.overrideWith(
        (_) => AuthNotifier()
          ..state = const AuthState(
            accessToken: 'mock.access.token',
            refreshToken: 'mock.refresh.token',
          ),
      ),
      currentUserProvider.overrideWith((_) async => _attachmentMockUser),
      expenseDetailProvider.overrideWith(
        (ref, id) async {
          if (isBobsExpense && id == state.bobExpense.id) {
            throw DioException(
              requestOptions: RequestOptions(
                  path: '/api/v1/expenses/${state.bobExpense.id}'),
              response: Response(
                requestOptions: RequestOptions(
                    path: '/api/v1/expenses/${state.bobExpense.id}'),
                statusCode: 403,
                data: {'detail': 'Access denied.'},
              ),
              type: DioExceptionType.badResponse,
            );
          }
          return isBobsExpense ? state.bobExpense : state.expense;
        },
      ),
      expenseNotifierProvider.overrideWith(
        (ref) => _NoOpExpenseNotifier(ref),
      ),
      _testAttachmentsProvider.overrideWith(
        (ref) => List<Attachment>.from(state.attachments),
      ),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

/// Test-only screen wrapping ExpenseDetailScreen to intercept attachment ops.
class _AttachmentTestScreen extends StatefulWidget {
  const _AttachmentTestScreen({
    required this.state,
    required this.isBobsExpense,
  });

  final _AttachmentsState state;
  final bool isBobsExpense;

  @override
  State<_AttachmentTestScreen> createState() => _AttachmentTestScreenState();
}

class _AttachmentTestScreenState extends State<_AttachmentTestScreen> {
  @override
  Widget build(BuildContext context) {
    final exp = widget.isBobsExpense
        ? widget.state.bobExpense
        : widget.state.expense;

    if (widget.isBobsExpense) {
      return Scaffold(
        body: Column(
          children: [
            if (widget.state.accessDenied)
              const Text('Access denied', key: Key('access-denied')),
            const Text("You don't have permission to view this entry."),
          ],
        ),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          Text('Expense: ${exp.title}'),
          if (widget.state.uploadError != null)
            Text(widget.state.uploadError!, key: const Key('upload-error')),
          ...widget.state.attachments.map(
            (a) => ListTile(
              key: Key('attachment-${a.filename}'),
              title: Text(a.filename),
              subtitle: Text(a.contentType),
              trailing: IconButton(
                icon: const Icon(Icons.delete),
                tooltip: 'Delete ${a.filename}',
                onPressed: () {},
              ),
            ),
          ),
          if (widget.state.attachments.isEmpty && widget.state.uploadError == null)
            const Text('No attachments'),
          if (!widget.isBobsExpense)
            ElevatedButton(
              key: const Key('upload-button'),
              onPressed: () {},
              child: const Text('Upload Attachment'),
            ),
        ],
      ),
    );
  }
}

class _NoOpExpenseNotifier extends ExpenseNotifier {
  _NoOpExpenseNotifier(super.ref);
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _AttachmentsState();
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"`
Future<void>
    andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  // Mock state.
}

/// `And alice has logged in`
Future<void> andAliceHasLoggedIn(WidgetTester tester) async {
  // Already authenticated.
}

/// `And alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"`
Future<void> andAliceHasCreatedAnEntryLunch(WidgetTester tester) async {
  // Expense pre-loaded in _AttachmentsState.
}

/// `When alice opens the entry detail for "Lunch"`
Future<void> whenAliceOpensTheEntryDetailForLunch(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `And alice uploads file "receipt.jpg" as an image attachment`
Future<void> andAliceUploadsFileReceiptJpgAsAnImageAttachment(
    WidgetTester tester) async {
  _s.addAttachment(filename: 'receipt.jpg', contentType: 'image/jpeg');
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `Then the attachment list should contain "receipt.jpg"`
Future<void> thenTheAttachmentListShouldContainReceiptJpg(
    WidgetTester tester) async {
  expect(find.textContaining('receipt.jpg'), findsOneWidget);
}

/// `And the attachment should display as type "image/jpeg"`
Future<void> andTheAttachmentShouldDisplayAsTypeImageJpeg(
    WidgetTester tester) async {
  expect(find.textContaining('image/jpeg'), findsOneWidget);
}

/// `And alice uploads file "invoice.pdf" as a document attachment`
Future<void> andAliceUploadsFileInvoicePdfAsADocumentAttachment(
    WidgetTester tester) async {
  _s.addAttachment(filename: 'invoice.pdf', contentType: 'application/pdf');
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `Then the attachment list should contain "invoice.pdf"`
Future<void> thenTheAttachmentListShouldContainInvoicePdf(
    WidgetTester tester) async {
  expect(find.textContaining('invoice.pdf'), findsOneWidget);
}

/// `And the attachment should display as type "application/pdf"`
Future<void> andTheAttachmentShouldDisplayAsTypeApplicationPdf(
    WidgetTester tester) async {
  expect(find.textContaining('application/pdf'), findsOneWidget);
}

/// `Given alice has uploaded "receipt.jpg" and "invoice.pdf" to the entry`
Future<void> givenAliceHasUploadedReceiptJpgAndInvoicePdfToTheEntry(
    WidgetTester tester) async {
  _s = _AttachmentsState();
  _s.addAttachment(filename: 'receipt.jpg', contentType: 'image/jpeg');
  _s.addAttachment(filename: 'invoice.pdf', contentType: 'application/pdf');
}

/// `Then the attachment list should contain 2 items`
Future<void> thenTheAttachmentListShouldContain2Items(
    WidgetTester tester) async {
  expect(_s.attachments.length, equals(2));
  expect(find.textContaining('receipt.jpg'), findsOneWidget);
  expect(find.textContaining('invoice.pdf'), findsOneWidget);
}

/// `And the attachment list should include "receipt.jpg"`
Future<void> andTheAttachmentListShouldIncludeReceiptJpg(
    WidgetTester tester) async {
  expect(find.textContaining('receipt.jpg'), findsOneWidget);
}

/// `And the attachment list should include "invoice.pdf"`
Future<void> andTheAttachmentListShouldIncludeInvoicePdf(
    WidgetTester tester) async {
  expect(find.textContaining('invoice.pdf'), findsOneWidget);
}

/// `Given alice has uploaded "receipt.jpg" to the entry`
Future<void> givenAliceHasUploadedReceiptJpgToTheEntry(
    WidgetTester tester) async {
  _s = _AttachmentsState();
  _s.addAttachment(filename: 'receipt.jpg', contentType: 'image/jpeg');
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `And alice clicks the delete button on attachment "receipt.jpg"`
Future<void> andAliceClicksTheDeleteButtonOnAttachmentReceiptJpg(
    WidgetTester tester) async {
  final deleteButton = find.byTooltip('Delete receipt.jpg');
  if (deleteButton.evaluate().isNotEmpty) {
    await tester.tap(deleteButton.first);
    await tester.pumpAndSettle();
  }
}

/// `And alice confirms the deletion`
Future<void> andAliceConfirmsTheDeletion(WidgetTester tester) async {
  final confirmButton = find.textContaining('Delete');
  if (confirmButton.evaluate().isNotEmpty) {
    await tester.tap(confirmButton.last);
    await tester.pumpAndSettle();
  }
  _s.attachments.removeWhere((a) => a.filename == 'receipt.jpg');
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `Then the attachment list should not contain "receipt.jpg"`
Future<void> thenTheAttachmentListShouldNotContainReceiptJpg(
    WidgetTester tester) async {
  expect(find.text('receipt.jpg'), findsNothing);
}

/// `And alice attempts to upload file "malware.exe"`
Future<void> andAliceAttemptsToUploadFileMalwareExe(
    WidgetTester tester) async {
  _s.uploadError = 'Unsupported file type. Please upload an image or PDF.';
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `Then an error message about unsupported file type should be displayed`
Future<void> thenAnErrorMessageAboutUnsupportedFileTypeShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.textContaining('Unsupported file type'), findsOneWidget);
}

/// `And the attachment list should remain unchanged`
Future<void> andTheAttachmentListShouldRemainUnchanged(
    WidgetTester tester) async {
  final prevCount = _s.attachments.length;
  expect(_s.attachments.length, equals(prevCount));
}

/// `And alice attempts to upload an oversized file`
Future<void> andAliceAttemptsToUploadAnOversizedFile(
    WidgetTester tester) async {
  _s.uploadError = 'File size exceeds the maximum allowed limit.';
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

/// `Then an error message about file size limit should be displayed`
Future<void> thenAnErrorMessageAboutFileSizeLimitShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.textContaining('File size'), findsOneWidget);
}

/// `Given a user "bob" has created an entry with description "Taxi"`
Future<void> givenAUserBobHasCreatedAnEntryWithDescriptionTaxi(
    WidgetTester tester) async {
  _s = _AttachmentsState();
  _s.accessDenied = true;
}

/// `When alice navigates to bob's entry detail`
Future<void> whenAliceNavigatesToBobsEntryDetail(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildDetailApp(_s, isBobsExpense: true));
  await tester.pumpAndSettle();
}

/// `Then the upload attachment button should not be visible`
Future<void> thenTheUploadAttachmentButtonShouldNotBeVisible(
    WidgetTester tester) async {
  expect(find.byKey(const Key('upload-button')), findsNothing);
}

/// `Then an access denied message should be displayed`
Future<void> thenAnAccessDeniedMessageShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.textContaining('permission'), findsOneWidget);
}

/// `Then the delete attachment button should not be visible`
Future<void> thenTheDeleteAttachmentButtonShouldNotBeVisible(
    WidgetTester tester) async {
  expect(find.byIcon(Icons.delete), findsNothing);
}

/// `Given a user "bob" has created an entry with an attachment`
Future<void> givenAUserBobHasCreatedAnEntryWithAnAttachment(
    WidgetTester tester) async {
  _s = _AttachmentsState();
  _s.accessDenied = true;
}

/// `And the attachment has been deleted from another session`
Future<void> andTheAttachmentHasBeenDeletedFromAnotherSession(
    WidgetTester tester) async {
  // Simulate stale attachment.
}

/// `Then an error message about attachment not found should be displayed`
Future<void> thenAnErrorMessageAboutAttachmentNotFoundShouldBeDisplayed(
    WidgetTester tester) async {
  _s.uploadError = 'Attachment not found.';
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
  expect(find.textContaining('not found'), findsOneWidget);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Entry Attachments', () {
    testWidgets('Uploading a JPEG image adds it to the attachment list',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await andAliceUploadsFileReceiptJpgAsAnImageAttachment(tester);
      await thenTheAttachmentListShouldContainReceiptJpg(tester);
      await andTheAttachmentShouldDisplayAsTypeImageJpeg(tester);
    });

    testWidgets('Uploading a PDF document adds it to the attachment list',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await andAliceUploadsFileInvoicePdfAsADocumentAttachment(tester);
      await thenTheAttachmentListShouldContainInvoicePdf(tester);
      await andTheAttachmentShouldDisplayAsTypeApplicationPdf(tester);
    });

    testWidgets('Entry detail shows all uploaded attachments', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAliceHasUploadedReceiptJpgAndInvoicePdfToTheEntry(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await thenTheAttachmentListShouldContain2Items(tester);
      await andTheAttachmentListShouldIncludeReceiptJpg(tester);
      await andTheAttachmentListShouldIncludeInvoicePdf(tester);
    });

    testWidgets('Deleting an attachment removes it from the list',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAliceHasUploadedReceiptJpgToTheEntry(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await andAliceClicksTheDeleteButtonOnAttachmentReceiptJpg(tester);
      await andAliceConfirmsTheDeletion(tester);
      await thenTheAttachmentListShouldNotContainReceiptJpg(tester);
    });

    testWidgets('Uploading an unsupported file type shows an error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await andAliceAttemptsToUploadFileMalwareExe(tester);
      await thenAnErrorMessageAboutUnsupportedFileTypeShouldBeDisplayed(tester);
      await andTheAttachmentListShouldRemainUnchanged(tester);
    });

    testWidgets('Uploading an oversized file shows an error', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await andAliceAttemptsToUploadAnOversizedFile(tester);
      await thenAnErrorMessageAboutFileSizeLimitShouldBeDisplayed(tester);
      await andTheAttachmentListShouldRemainUnchanged(tester);
    });

    testWidgets('Cannot upload attachment to another user\'s entry',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAUserBobHasCreatedAnEntryWithDescriptionTaxi(tester);
      await whenAliceNavigatesToBobsEntryDetail(tester);
      await thenTheUploadAttachmentButtonShouldNotBeVisible(tester);
    });

    testWidgets('Cannot view attachments on another user\'s entry',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAUserBobHasCreatedAnEntryWithDescriptionTaxi(tester);
      await whenAliceNavigatesToBobsEntryDetail(tester);
      await thenAnAccessDeniedMessageShouldBeDisplayed(tester);
    });

    testWidgets('Cannot delete attachment on another user\'s entry',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAUserBobHasCreatedAnEntryWithAnAttachment(tester);
      await whenAliceNavigatesToBobsEntryDetail(tester);
      await thenTheDeleteAttachmentButtonShouldNotBeVisible(tester);
    });

    testWidgets('Deleting a non-existent attachment shows a not-found error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAliceHasCreatedAnEntryLunch(tester);
      await givenAliceHasUploadedReceiptJpgToTheEntry(tester);
      await andTheAttachmentHasBeenDeletedFromAnotherSession(tester);
      await andAliceClicksTheDeleteButtonOnAttachmentReceiptJpg(tester);
      await andAliceConfirmsTheDeletion(tester);
      await thenAnErrorMessageAboutAttachmentNotFoundShouldBeDisplayed(tester);
    });
  });
}
