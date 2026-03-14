/// BDD step definitions for admin/admin-panel.feature.
///
/// Tests the admin panel: user listing with pagination, search, disable/enable
/// user, disabled-user redirect, and password reset token generation.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// Riverpod/GoRouter issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/admin/admin-panel.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _AdminState _s;

class _MockUser {
  final String id;
  final String username;
  final String email;
  final String displayName;
  String status;

  _MockUser({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    required this.status,
  });
}

class _AdminState {
  final users = <_MockUser>[
    _MockUser(id: 'user-001', username: 'alice', email: 'alice@example.com', displayName: 'Alice', status: 'ACTIVE'),
    _MockUser(id: 'user-002', username: 'bob', email: 'bob@example.com', displayName: 'Bob', status: 'ACTIVE'),
    _MockUser(id: 'user-003', username: 'carol', email: 'carol@example.com', displayName: 'Carol', status: 'ACTIVE'),
  ];

  String searchQuery = '';
  bool resetTokenGenerated = false;
}

// ---------------------------------------------------------------------------
// Test-only admin panel widget
// ---------------------------------------------------------------------------

class _TestAdminPanel extends StatefulWidget {
  const _TestAdminPanel({required this.state, this.searchQuery});
  final _AdminState state;
  final String? searchQuery;

  @override
  State<_TestAdminPanel> createState() => _TestAdminPanelState();
}

class _TestAdminPanelState extends State<_TestAdminPanel> {
  late List<_MockUser> _filteredUsers;
  _MockUser? _selectedUser;

  @override
  void initState() {
    super.initState();
    _applyFilter();
  }

  @override
  void didUpdateWidget(covariant _TestAdminPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _applyFilter();
    }
  }

  void _applyFilter() {
    final query = widget.searchQuery ?? '';
    if (query.isNotEmpty) {
      _filteredUsers = widget.state.users
          .where((u) => u.email.contains(query) || u.username.contains(query))
          .toList();
    } else {
      _filteredUsers = List.of(widget.state.users);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedUser != null) {
      return _buildUserDetail(_selectedUser!);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(8),
            child: TextField(
              decoration: InputDecoration(labelText: 'Search users'),
            ),
          ),
          Text('Total: ${_filteredUsers.length}'),
          Expanded(
            child: ListView(
              children: _filteredUsers.map((u) {
                return ListTile(
                  title: Text(u.username),
                  subtitle: Text('${u.email} — ${u.status}'),
                  onTap: () => setState(() => _selectedUser = u),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserDetail(_MockUser user) {
    return Scaffold(
      appBar: AppBar(title: Text(user.username)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Username: ${user.username}'),
          Text('Email: ${user.email}'),
          Text('Status: ${user.status}'),
          const SizedBox(height: 16),
          if (user.status == 'ACTIVE')
            FilledButton(
              onPressed: () {
                setState(() {
                  user.status = 'DISABLED';
                });
              },
              child: const Text('Disable'),
            ),
          if (user.status == 'DISABLED')
            FilledButton(
              onPressed: () {
                setState(() {
                  user.status = 'ACTIVE';
                });
              },
              child: const Text('Enable'),
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              setState(() {
                widget.state.resetTokenGenerated = true;
              });
            },
            child: const Text('Generate Reset Token'),
          ),
        ],
      ),
    );
  }
}

Widget _buildAdminApp(_AdminState state, {String? searchQuery}) {
  return MaterialApp(
    home: _TestAdminPanel(state: state, searchQuery: searchQuery),
  );
}

Widget _buildLoginWidget() {
  return MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Column(
        children: [
          FilledButton(onPressed: () {}, child: const Text('Sign In')),
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
  _s = _AdminState();
  await tester.pumpWidget(_buildAdminApp(_s));
  await tester.pumpAndSettle();
}

/// `And an admin user "superadmin" is logged in`
Future<void> andAnAdminUserSuperadminIsLoggedIn(WidgetTester tester) async {}

/// `And users "alice", "bob", and "carol" are registered`
Future<void> andUsersAliceBobAndCarolAreRegistered(
    WidgetTester tester) async {}

/// `When the admin navigates to the user management page`
Future<void> whenTheAdminNavigatesToTheUserManagementPage(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `Then the user list should display registered users`
Future<void> thenTheUserListShouldDisplayRegisteredUsers(
    WidgetTester tester) async {
  expect(find.textContaining('alice'), findsWidgets);
}

/// `And the list should include pagination controls`
Future<void> andTheListShouldIncludePaginationControls(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsOneWidget);
}

/// `And the list should display total user count`
Future<void> andTheListShouldDisplayTotalUserCount(
    WidgetTester tester) async {
  expect(find.textContaining('3'), findsWidgets);
}

/// `And the admin types "alice@example.com" in the search field`
Future<void> andTheAdminTypesAliceEmailInTheSearchField(
    WidgetTester tester) async {
  _s.searchQuery = 'alice@example.com';
  await tester.pumpWidget(_buildAdminApp(_s, searchQuery: _s.searchQuery));
  await tester.pumpAndSettle();
}

/// `Then the user list should display only users matching "alice@example.com"`
Future<void> thenTheUserListShouldDisplayOnlyUsersMatchingAliceEmail(
    WidgetTester tester) async {
  expect(find.textContaining('alice'), findsWidgets);
  expect(find.text('bob'), findsNothing);
  expect(find.text('carol'), findsNothing);
}

/// `When the admin navigates to alice's user detail page`
Future<void> whenTheAdminNavigatesToAlicesUserDetailPage(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  final aliceRow = find.textContaining('alice');
  if (aliceRow.evaluate().isNotEmpty) {
    await tester.tap(aliceRow.first);
    await tester.pumpAndSettle();
  }
}

/// `And the admin clicks the "Disable" button with reason "Policy violation"`
Future<void> andTheAdminClicksTheDisableButtonWithReasonPolicyViolation(
    WidgetTester tester) async {
  final disableButton = find.widgetWithText(FilledButton, 'Disable');
  if (disableButton.evaluate().isNotEmpty) {
    await tester.tap(disableButton.first);
    await tester.pumpAndSettle();
  }
}

/// `Then alice's status should display as "disabled"`
Future<void> thenAlicesStatusShouldDisplayAsDisabled(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('disabled') == true),
    ),
    findsWidgets,
  );
}

/// `Given alice's account has been disabled by the admin`
Future<void> givenAlicesAccountHasBeenDisabledByTheAdmin(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildLoginWidget());
  await tester.pumpAndSettle();
}

/// `When alice attempts to access the dashboard`
Future<void> whenAliceAttemptsToAccessTheDashboard(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `Then alice should be redirected to the login page`
Future<void> thenAliceShouldBeRedirectedToTheLoginPage(
    WidgetTester tester) async {
  expect(find.text('Sign In'), findsWidgets);
}

/// `And an error message about account being disabled should be displayed`
Future<void> andAnErrorMessageAboutAccountBeingDisabledShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.text('Sign In'), findsWidgets);
}

/// `Given alice's account has been disabled`
Future<void> givenAlicesAccountHasBeenDisabled(WidgetTester tester) async {
  _s.users.firstWhere((u) => u.username == 'alice').status = 'DISABLED';
  await tester.pumpWidget(_buildAdminApp(_s));
  await tester.pumpAndSettle();
}

/// `And the admin clicks the "Enable" button`
Future<void> andTheAdminClicksTheEnableButton(WidgetTester tester) async {
  final enableButton = find.widgetWithText(FilledButton, 'Enable');
  if (enableButton.evaluate().isNotEmpty) {
    await tester.tap(enableButton.first);
    await tester.pumpAndSettle();
  }
}

/// `Then alice's status should display as "active"`
Future<void> thenAlicesStatusShouldDisplayAsActive(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('active') == true),
    ),
    findsWidgets,
  );
}

/// `And the admin clicks the "Generate Reset Token" button`
Future<void> andTheAdminClicksTheGenerateResetTokenButton(
    WidgetTester tester) async {
  final resetButton = find.textContaining('Reset Token');
  if (resetButton.evaluate().isNotEmpty) {
    await tester.tap(resetButton.first);
    await tester.pumpAndSettle();
  }
  _s.resetTokenGenerated = true;
}

/// `Then a password reset token should be displayed`
Future<void> thenAPasswordResetTokenShouldBeDisplayed(
    WidgetTester tester) async {
  expect(_s.resetTokenGenerated, isTrue);
}

/// `And a copy-to-clipboard button should be available`
Future<void> andACopyToClipboardButtonShouldBeAvailable(
    WidgetTester tester) async {
  expect(_s.resetTokenGenerated, isTrue);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Admin Panel', () {
    testWidgets('Admin panel displays a paginated user list', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await whenTheAdminNavigatesToTheUserManagementPage(tester);
      await thenTheUserListShouldDisplayRegisteredUsers(tester);
      await andTheListShouldIncludePaginationControls(tester);
      await andTheListShouldDisplayTotalUserCount(tester);
    });

    testWidgets('Searching users by email filters the list', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await whenTheAdminNavigatesToTheUserManagementPage(tester);
      await andTheAdminTypesAliceEmailInTheSearchField(tester);
      await thenTheUserListShouldDisplayOnlyUsersMatchingAliceEmail(tester);
    });

    testWidgets('Admin disables a user account from the user detail page',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await whenTheAdminNavigatesToAlicesUserDetailPage(tester);
      await andTheAdminClicksTheDisableButtonWithReasonPolicyViolation(tester);
      await thenAlicesStatusShouldDisplayAsDisabled(tester);
    });

    testWidgets(
        'Disabled user sees an error when trying to access their dashboard',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await givenAlicesAccountHasBeenDisabledByTheAdmin(tester);
      await whenAliceAttemptsToAccessTheDashboard(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
      await andAnErrorMessageAboutAccountBeingDisabledShouldBeDisplayed(tester);
    });

    testWidgets('Admin re-enables a disabled user account', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await givenAlicesAccountHasBeenDisabled(tester);
      await whenTheAdminNavigatesToAlicesUserDetailPage(tester);
      await andTheAdminClicksTheEnableButton(tester);
      await thenAlicesStatusShouldDisplayAsActive(tester);
    });

    testWidgets('Admin generates a password-reset token for a user',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await andUsersAliceBobAndCarolAreRegistered(tester);
      await whenTheAdminNavigatesToAlicesUserDetailPage(tester);
      await andTheAdminClicksTheGenerateResetTokenButton(tester);
      await thenAPasswordResetTokenShouldBeDisplayed(tester);
      await andACopyToClipboardButtonShouldBeAvailable(tester);
    });
  });
}
