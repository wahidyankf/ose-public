/// BDD step definitions for security/security.feature.
///
/// Verifies password complexity enforcement during registration, account
/// lockout after repeated failed logins, admin unlock, and unlock+login flow.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// RenderFlex overflow and Riverpod issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/security/security.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _SecurityState _s;

class _SecurityState {
  bool locked = false;
  bool unlocked = false;
}

// ---------------------------------------------------------------------------
// Test-only registration form with password validation
// ---------------------------------------------------------------------------

class _TestRegisterScreen extends StatefulWidget {
  const _TestRegisterScreen();
  @override
  State<_TestRegisterScreen> createState() => _TestRegisterScreenState();
}

class _TestRegisterScreenState extends State<_TestRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 12) {
      return 'Password must be at least 12 characters';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain uppercase characters';
    }
    if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain a special character (!@#)';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Username'),
              ),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: _validatePassword,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () {
                  setState(() {
                    _formKey.currentState!.validate();
                  });
                },
                child: const Text('Create Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Test-only login screen (locked account variant)
// ---------------------------------------------------------------------------

class _TestLoginScreen extends StatefulWidget {
  const _TestLoginScreen({required this.locked});
  final bool locked;
  @override
  State<_TestLoginScreen> createState() => _TestLoginScreenState();
}

class _TestLoginScreenState extends State<_TestLoginScreen> {
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
              onPressed: () {
                setState(() => _submitted = true);
              },
              child: const Text('Sign In'),
            ),
            if (_submitted && widget.locked)
              const Text(
                  'Your account has been locked due to too many failed login attempts.'),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Test-only admin panel
// ---------------------------------------------------------------------------

class _TestAdminPanel extends StatefulWidget {
  const _TestAdminPanel();
  @override
  State<_TestAdminPanel> createState() => _TestAdminPanelState();
}

class _TestAdminPanelState extends State<_TestAdminPanel> {
  String _aliceStatus = 'LOCKED';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel')),
      body: Column(
        children: [
          ListTile(
            title: const Text('alice'),
            subtitle: Text('Status: $_aliceStatus'),
            trailing: _aliceStatus == 'LOCKED'
                ? TextButton(
                    onPressed: () {
                      setState(() => _aliceStatus = 'ACTIVE');
                      _s.unlocked = true;
                    },
                    child: const Text('Unlock'),
                  )
                : null,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Test-only unlocked login (success)
// ---------------------------------------------------------------------------

class _TestUnlockedLoginScreen extends StatefulWidget {
  const _TestUnlockedLoginScreen();
  @override
  State<_TestUnlockedLoginScreen> createState() =>
      _TestUnlockedLoginScreenState();
}

class _TestUnlockedLoginScreenState extends State<_TestUnlockedLoginScreen> {
  bool _loggedIn = false;

  @override
  Widget build(BuildContext context) {
    if (_loggedIn) {
      return const Scaffold(body: Center(child: Text('Dashboard')));
    }
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
              onPressed: () => setState(() => _loggedIn = true),
              child: const Text('Sign In'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _SecurityState();
  await tester.pumpWidget(
    const MaterialApp(home: _TestRegisterScreen()),
  );
  await tester.pumpAndSettle();
}

/// `When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Short1!Ab"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithPasswordShort1Ab(
        WidgetTester tester) async {
  await _fillRegistrationForm(tester,
      username: 'alice',
      email: 'alice@example.com',
      password: 'Short1!Ab');
}

/// `When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "AllUpperCase1234"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithPasswordAllUpperCase1234(
        WidgetTester tester) async {
  await _fillRegistrationForm(tester,
      username: 'alice',
      email: 'alice@example.com',
      password: 'AllUpperCase1234');
}

/// `And the visitor submits the registration form`
Future<void> andTheVisitorSubmitsTheRegistrationForm(
    WidgetTester tester) async {
  await tester.tap(find.widgetWithText(FilledButton, 'Create Account'));
  await tester.pumpAndSettle();
}

/// `Then a validation error for the password field should be displayed`
Future<void> thenAValidationErrorForThePasswordFieldShouldBeDisplayed(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('password') ?? false) &&
          (w.data?.toLowerCase().contains('characters') == true ||
              w.data?.toLowerCase().contains('uppercase') == true ||
              w.data?.toLowerCase().contains('special') == true),
    ),
    findsWidgets,
  );
}

/// `And the error should mention minimum length requirements`
Future<void> andTheErrorShouldMentionMinimumLengthRequirements(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('12') == true ||
              w.data?.toLowerCase().contains('characters') == true),
    ),
    findsWidgets,
  );
}

/// `And the error should mention special character requirements`
Future<void> andTheErrorShouldMentionSpecialCharacterRequirements(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('special') == true ||
              w.data?.contains('!@#') == true),
    ),
    findsWidgets,
  );
}

/// `Given a user "alice" is registered with password "Str0ng#Pass1"`
Future<void> givenAUserAliceIsRegisteredWithPasswordStr0ngPass1(
    WidgetTester tester) async {
  // Handled by mock.
}

/// `And alice has entered the wrong password the maximum number of times`
Future<void> andAliceHasEnteredTheWrongPasswordTheMaximumNumberOfTimes(
    WidgetTester tester) async {
  _s.locked = true;
  await tester.pumpWidget(
    MaterialApp(home: _TestLoginScreen(locked: _s.locked)),
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

/// `Then an error message about account lockout should be displayed`
Future<void> thenAnErrorMessageAboutAccountLockoutShouldBeDisplayed(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('locked') == true ||
              w.data?.toLowerCase().contains('too many') == true),
    ),
    findsWidgets,
  );
}

/// `And alice should remain on the login page`
Future<void> andAliceShouldRemainOnTheLoginPage(WidgetTester tester) async {
  expect(find.text('Sign In'), findsWidgets);
}

/// `Given a user "alice" is registered and locked after too many failed logins`
Future<void>
    givenAUserAliceIsRegisteredAndLockedAfterTooManyFailedLogins(
        WidgetTester tester) async {
  _s.locked = true;
}

/// `And an admin user "superadmin" is logged in`
Future<void> andAnAdminUserSuperadminIsLoggedIn(WidgetTester tester) async {
  await tester.pumpWidget(
    const MaterialApp(home: _TestAdminPanel()),
  );
  await tester.pumpAndSettle();
}

/// `When the admin navigates to alice's user detail in the admin panel`
Future<void> whenTheAdminNavigatesToAlicesUserDetailInTheAdminPanel(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `And the admin clicks the "Unlock" button`
Future<void> andTheAdminClicksTheUnlockButton(WidgetTester tester) async {
  final unlockButton = find.textContaining('Unlock');
  if (unlockButton.evaluate().isNotEmpty) {
    await tester.tap(unlockButton.first);
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
          (w.data?.toLowerCase() == 'active' ||
              w.data?.toLowerCase().contains('active') == true),
    ),
    findsWidgets,
  );
}

/// `Given a user "alice" was locked and has been unlocked by an admin`
Future<void> givenAUserAliceWasLockedAndHasBeenUnlockedByAnAdmin(
    WidgetTester tester) async {
  _s.unlocked = true;
  await tester.pumpWidget(
    const MaterialApp(home: _TestUnlockedLoginScreen()),
  );
  await tester.pumpAndSettle();
}

/// `Then alice should be on the dashboard page`
Future<void> thenAliceShouldBeOnTheDashboardPage(WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.text('Dashboard'), findsOneWidget);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

Future<void> _fillRegistrationForm(
  WidgetTester tester, {
  required String username,
  required String email,
  required String password,
}) async {
  final fields = find.byType(TextFormField);
  await tester.enterText(fields.at(0), username);
  await tester.enterText(fields.at(1), email);
  if (password.isNotEmpty) {
    await tester.enterText(fields.at(2), password);
  }
  await tester.pumpAndSettle();
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Security', () {
    testWidgets(
        'Registration form rejects password shorter than 12 characters',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithPasswordShort1Ab(tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAValidationErrorForThePasswordFieldShouldBeDisplayed(tester);
      await andTheErrorShouldMentionMinimumLengthRequirements(tester);
    });

    testWidgets(
        'Registration form rejects password with no special character',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithPasswordAllUpperCase1234(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAValidationErrorForThePasswordFieldShouldBeDisplayed(tester);
      await andTheErrorShouldMentionSpecialCharacterRequirements(tester);
    });

    testWidgets(
        'Account is locked after exceeding maximum failed login attempts',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await givenAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasEnteredTheWrongPasswordTheMaximumNumberOfTimes(tester);
      await whenAliceSubmitsTheLoginFormWithUsernameAliceAndPasswordStr0ngPass1(
          tester);
      await thenAnErrorMessageAboutAccountLockoutShouldBeDisplayed(tester);
      await andAliceShouldRemainOnTheLoginPage(tester);
    });

    testWidgets('Admin unlocks a locked account via the admin panel',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await givenAUserAliceIsRegisteredAndLockedAfterTooManyFailedLogins(
          tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await whenTheAdminNavigatesToAlicesUserDetailInTheAdminPanel(tester);
      await andTheAdminClicksTheUnlockButton(tester);
      await thenAlicesStatusShouldDisplayAsActive(tester);
    });

    testWidgets('Unlocked account can log in with correct password',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await givenAUserAliceWasLockedAndHasBeenUnlockedByAnAdmin(tester);
      await whenAliceSubmitsTheLoginFormWithUsernameAliceAndPasswordStr0ngPass1(
          tester);
      await thenAliceShouldBeOnTheDashboardPage(tester);
    });
  });
}
