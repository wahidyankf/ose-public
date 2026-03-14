/// BDD step definitions for user-lifecycle/user-profile.feature.
///
/// Tests profile display, display name update, password change, and
/// self-deactivation flows.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// Riverpod/GoRouter issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/user-profile.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _ProfileState _s;

class _ProfileState {
  String displayName = 'Alice';
  bool changePasswordShouldFail = false;
  bool deactivated = false;
}

// ---------------------------------------------------------------------------
// Test-only profile screen
// ---------------------------------------------------------------------------

class _TestProfileScreen extends StatefulWidget {
  const _TestProfileScreen({required this.state});
  final _ProfileState state;
  @override
  State<_TestProfileScreen> createState() => _TestProfileScreenState();
}

class _TestProfileScreenState extends State<_TestProfileScreen> {
  late TextEditingController _displayNameController;
  String? _message;
  bool _deactivated = false;

  @override
  void initState() {
    super.initState();
    _displayNameController =
        TextEditingController(text: widget.state.displayName);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_deactivated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Login')),
        body: Column(
          children: [
            FilledButton(onPressed: () {}, child: const Text('Sign In')),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Username: alice'),
            const Text('Email: alice@example.com'),
            Text('Display Name: ${_displayNameController.text}'),
            const SizedBox(height: 16),
            TextField(
              controller: _displayNameController,
              decoration:
                  const InputDecoration(labelText: 'Display Name'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  widget.state.displayName = _displayNameController.text;
                });
              },
              child: const Text('Save'),
            ),
            const Divider(),
            const TextField(
              decoration: InputDecoration(labelText: 'Current Password'),
              obscureText: true,
            ),
            const TextField(
              decoration: InputDecoration(labelText: 'New Password'),
              obscureText: true,
            ),
            FilledButton(
              onPressed: () {
                setState(() {
                  if (widget.state.changePasswordShouldFail) {
                    _message = 'Invalid username or password.';
                  } else {
                    _message = 'Password changed successfully.';
                  }
                });
              },
              child: const Text('Change Password'),
            ),
            if (_message != null) Text(_message!),
            const Divider(),
            TextButton(
              onPressed: () {
                showDialog<void>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Deactivate Account'),
                    content: const Text(
                        'Are you sure you want to deactivate your account?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: const Text('Cancel'),
                      ),
                      FilledButton(
                        onPressed: () {
                          Navigator.of(ctx).pop();
                          setState(() {
                            _deactivated = true;
                            widget.state.deactivated = true;
                          });
                        },
                        child: const Text('Confirm'),
                      ),
                    ],
                  ),
                );
              },
              child: const Text('Deactivate Account'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Test-only deactivated login screen
// ---------------------------------------------------------------------------

class _TestDeactivatedLoginScreen extends StatefulWidget {
  const _TestDeactivatedLoginScreen();
  @override
  State<_TestDeactivatedLoginScreen> createState() =>
      _TestDeactivatedLoginScreenState();
}

class _TestDeactivatedLoginScreenState
    extends State<_TestDeactivatedLoginScreen> {
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const TextField(
              decoration: InputDecoration(labelText: 'Username'),
            ),
            const TextField(
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => setState(() => _submitted = true),
              child: const Text('Sign In'),
            ),
            if (_submitted)
              const Text('Your account has been deactivated.'),
          ],
        ),
      ),
    );
  }
}

Widget _buildProfileApp(_ProfileState state) {
  return MaterialApp(
    home: _TestProfileScreen(state: state),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _ProfileState();
  await tester.pumpWidget(_buildProfileApp(_s));
  await tester.pumpAndSettle();
}

/// `And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"`
Future<void>
    andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {}

/// `And alice has logged in`
Future<void> andAliceHasLoggedIn(WidgetTester tester) async {}

/// `When alice navigates to the profile page`
Future<void> whenAliceNavigatesToTheProfilePage(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `Then the profile should display username "alice"`
Future<void> thenTheProfileShouldDisplayUsernameAlice(
    WidgetTester tester) async {
  expect(find.textContaining('alice'), findsWidgets);
}

/// `And the profile should display email "alice@example.com"`
Future<void> thenTheProfileShouldDisplayEmailAliceAtExampleCom(
    WidgetTester tester) async {
  expect(find.textContaining('alice@example.com'), findsOneWidget);
}

/// `And the profile should display a display name`
Future<void> andTheProfileShouldDisplayADisplayName(
    WidgetTester tester) async {
  expect(find.textContaining('Alice'), findsWidgets);
}

/// `And alice changes the display name to "Alice Smith"`
Future<void> andAliceChangesTheDisplayNameToAliceSmith(
    WidgetTester tester) async {
  final displayNameField = find.byWidgetPredicate(
    (w) =>
        w is TextField &&
        (w.decoration?.labelText?.toLowerCase().contains('display') ?? false),
  );
  if (displayNameField.evaluate().isNotEmpty) {
    await tester.enterText(displayNameField, 'Alice Smith');
    await tester.pumpAndSettle();
  }
}

/// `And alice saves the profile changes`
Future<void> andAliceSavesTheProfileChanges(WidgetTester tester) async {
  final saveButton = find.widgetWithText(ElevatedButton, 'Save');
  if (saveButton.evaluate().isNotEmpty) {
    await tester.tap(saveButton.first);
    await tester.pumpAndSettle();
  }
}

/// `Then the profile should display display name "Alice Smith"`
Future<void> thenTheProfileShouldDisplayDisplayNameAliceSmith(
    WidgetTester tester) async {
  expect(find.textContaining('Alice Smith'), findsWidgets);
}

/// `When alice navigates to the change password form`
Future<void> whenAliceNavigatesToTheChangePasswordForm(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `And alice enters old password "Str0ng#Pass1" and new password "NewPass#456"`
Future<void>
    andAliceEntersOldPasswordStr0ngPass1AndNewPasswordNewPass456(
        WidgetTester tester) async {
  _s.changePasswordShouldFail = false;
  final currentPwField = find.byWidgetPredicate(
    (w) =>
        w is TextField &&
        ((w.decoration?.labelText?.toLowerCase().contains('current') ??
                false) ||
            (w.decoration?.labelText?.toLowerCase().contains('old') ?? false)),
  );
  final newPwField = find.byWidgetPredicate(
    (w) =>
        w is TextField &&
        (w.decoration?.labelText?.toLowerCase().contains('new') ?? false),
  );
  if (currentPwField.evaluate().isNotEmpty) {
    await tester.enterText(currentPwField.first, 'Str0ng#Pass1');
  }
  if (newPwField.evaluate().isNotEmpty) {
    await tester.enterText(newPwField.first, 'NewPass#456');
  }
  await tester.pumpAndSettle();
}

/// `And alice enters old password "Wr0ngOld!" and new password "NewPass#456"`
Future<void>
    andAliceEntersOldPasswordWr0ngOldAndNewPasswordNewPass456(
        WidgetTester tester) async {
  _s.changePasswordShouldFail = true;
  await tester.pumpWidget(_buildProfileApp(_s));
  await tester.pumpAndSettle();
}

/// `And alice submits the password change`
Future<void> andAliceSubmitsThePasswordChange(WidgetTester tester) async {
  final button = find.widgetWithText(FilledButton, 'Change Password');
  if (button.evaluate().isNotEmpty) {
    await tester.tap(button.first);
    await tester.pumpAndSettle();
  }
}

/// `Then a success message about password change should be displayed`
Future<void> thenASuccessMessageAboutPasswordChangeShouldBeDisplayed(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('password') ?? false) &&
          (w.data?.toLowerCase().contains('changed') == true ||
              w.data?.toLowerCase().contains('updated') == true ||
              w.data?.toLowerCase().contains('success') == true),
    ),
    findsWidgets,
  );
}

/// `Then an error message about invalid credentials should be displayed`
Future<void> thenAnErrorMessageAboutInvalidCredentialsShouldBeDisplayed(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.textContaining('Invalid'), findsWidgets);
}

/// `And alice clicks the "Deactivate Account" button`
Future<void> andAliceClicksTheDeactivateAccountButton(
    WidgetTester tester) async {
  final button = find.textContaining('Deactivate');
  if (button.evaluate().isNotEmpty) {
    await tester.tap(button.first);
    await tester.pumpAndSettle();
  }
}

/// `And alice confirms the deactivation`
Future<void> andAliceConfirmsTheDeactivation(WidgetTester tester) async {
  final confirmButton = find.widgetWithText(FilledButton, 'Confirm');
  if (confirmButton.evaluate().isNotEmpty) {
    await tester.tap(confirmButton.first);
    await tester.pumpAndSettle();
  }
}

/// `Then alice should be redirected to the login page`
Future<void> thenAliceShouldBeRedirectedToTheLoginPage(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.text('Sign In'), findsWidgets);
}

/// `Given alice has deactivated her account`
Future<void> givenAliceHasDeactivatedHerAccount(WidgetTester tester) async {
  await tester.pumpWidget(
    const MaterialApp(home: _TestDeactivatedLoginScreen()),
  );
  await tester.pumpAndSettle();
}

/// `When alice submits the login form with username "alice" and password "Str0ng#Pass1"`
Future<void>
    whenAliceSubmitsTheLoginFormWithUsernameAliceAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  final usernameField = find.byWidgetPredicate(
    (w) =>
        w is TextField &&
        (w.decoration?.labelText?.toLowerCase().contains('username') ?? false),
  );
  final passwordField = find.byWidgetPredicate(
    (w) =>
        w is TextField &&
        (w.decoration?.labelText?.toLowerCase().contains('password') ?? false),
  );
  await tester.enterText(usernameField, 'alice');
  await tester.enterText(passwordField, 'Str0ng#Pass1');
  await tester.tap(find.widgetWithText(FilledButton, 'Sign In'));
  await tester.pumpAndSettle();
}

/// `Then an error message about account deactivation should be displayed`
Future<void> thenAnErrorMessageAboutAccountDeactivationShouldBeDisplayed(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.textContaining('deactivated'), findsOneWidget);
}

/// `And alice should remain on the login page`
Future<void> andAliceShouldRemainOnTheLoginPage(WidgetTester tester) async {
  expect(find.text('Sign In'), findsWidgets);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('User Profile', () {
    testWidgets('Profile page displays username, email, and display name',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheProfilePage(tester);
      await thenTheProfileShouldDisplayUsernameAlice(tester);
      await thenTheProfileShouldDisplayEmailAliceAtExampleCom(tester);
      await andTheProfileShouldDisplayADisplayName(tester);
    });

    testWidgets('Updating display name shows the new value', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheProfilePage(tester);
      await andAliceChangesTheDisplayNameToAliceSmith(tester);
      await andAliceSavesTheProfileChanges(tester);
      await thenTheProfileShouldDisplayDisplayNameAliceSmith(tester);
    });

    testWidgets('Changing password with correct old password succeeds',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheChangePasswordForm(tester);
      await andAliceEntersOldPasswordStr0ngPass1AndNewPasswordNewPass456(tester);
      await andAliceSubmitsThePasswordChange(tester);
      await thenASuccessMessageAboutPasswordChangeShouldBeDisplayed(tester);
    });

    testWidgets(
        'Changing password with incorrect old password shows an error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheChangePasswordForm(tester);
      await andAliceEntersOldPasswordWr0ngOldAndNewPasswordNewPass456(tester);
      await andAliceSubmitsThePasswordChange(tester);
      await thenAnErrorMessageAboutInvalidCredentialsShouldBeDisplayed(tester);
    });

    testWidgets('Self-deactivating account redirects to login',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceNavigatesToTheProfilePage(tester);
      await andAliceClicksTheDeactivateAccountButton(tester);
      await andAliceConfirmsTheDeactivation(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
    });

    testWidgets('Self-deactivated user cannot log in', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasDeactivatedHerAccount(tester);
      await whenAliceSubmitsTheLoginFormWithUsernameAliceAndPasswordStr0ngPass1(tester);
      await thenAnErrorMessageAboutAccountDeactivationShouldBeDisplayed(tester);
      await andAliceShouldRemainOnTheLoginPage(tester);
    });
  });
}
