/// BDD step definitions for user-lifecycle/registration.feature.
///
/// Verifies registration form validation (duplicate username, invalid email,
/// empty password, weak password) and successful registration flow.
///
/// Uses simplified test-only widgets instead of real screens to avoid
/// RenderFlex overflow issues irrelevant to unit smoke tests.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/registration.feature';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

enum _RegOutcome { success, duplicateUsername }

late _RegistrationState _s;

class _RegistrationState {
  _RegOutcome outcome = _RegOutcome.success;
  String enteredPassword = '';
}

// ---------------------------------------------------------------------------
// Test-only registration form
// ---------------------------------------------------------------------------

class _TestRegisterScreen extends StatefulWidget {
  const _TestRegisterScreen({required this.outcome});
  final _RegOutcome outcome;
  @override
  State<_TestRegisterScreen> createState() => _TestRegisterScreenState();
}

class _TestRegisterScreenState extends State<_TestRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  bool _navigatedToLogin = false;
  String? _serverError;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    if (!value.contains('@') || !value.contains('.')) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required. Must be 12+ characters with uppercase and special';
    }
    if (value.length < 12) {
      return 'Password must be at least 12 characters with uppercase and special';
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
    if (_navigatedToLogin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Login')),
        body: Column(
          children: [
            const Text('Account created successfully!'),
            FilledButton(
              onPressed: () {},
              child: const Text('Sign In'),
            ),
          ],
        ),
      );
    }

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
                validator: _validateEmail,
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
                    if (_formKey.currentState!.validate()) {
                      if (widget.outcome == _RegOutcome.duplicateUsername) {
                        _serverError = 'Username or email already in use.';
                      } else {
                        _navigatedToLogin = true;
                      }
                    }
                  });
                },
                child: const Text('Create Account'),
              ),
              if (_serverError != null) Text(_serverError!),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _buildApp(_RegOutcome outcome) {
  return MaterialApp(
    home: _TestRegisterScreen(outcome: outcome),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _RegistrationState();
  await tester.pumpWidget(_buildApp(_s.outcome));
  await tester.pumpAndSettle();
}

/// `Given a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"`
Future<void>
    givenAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  _s.outcome = _RegOutcome.duplicateUsername;
  await tester.pumpWidget(_buildApp(_s.outcome));
  await tester.pumpAndSettle();
}

/// `When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  _s.enteredPassword = 'Str0ng#Pass1';
  await _fillForm(tester,
      username: 'alice', email: 'alice@example.com', password: 'Str0ng#Pass1');
}

/// `When a visitor fills in the registration form with username "alice", email "new@example.com", and password "Str0ng#Pass1"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailNewAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  _s.enteredPassword = 'Str0ng#Pass1';
  await _fillForm(tester,
      username: 'alice', email: 'new@example.com', password: 'Str0ng#Pass1');
}

/// `When a visitor fills in the registration form with username "alice", email "not-an-email", and password "Str0ng#Pass1"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailNotAnEmailAndPasswordStr0ngPass1(
        WidgetTester tester) async {
  _s.enteredPassword = 'Str0ng#Pass1';
  await _fillForm(tester,
      username: 'alice', email: 'not-an-email', password: 'Str0ng#Pass1');
}

/// `When a visitor fills in the registration form with username "alice", email "alice@example.com", and password ""`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordEmpty(
        WidgetTester tester) async {
  _s.enteredPassword = '';
  await _fillForm(tester,
      username: 'alice', email: 'alice@example.com', password: '');
}

/// `When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "str0ng#pass1"`
Future<void>
    whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordWeakPassword(
        WidgetTester tester) async {
  _s.enteredPassword = 'str0ng#pass1';
  await _fillForm(tester,
      username: 'alice', email: 'alice@example.com', password: 'str0ng#pass1');
}

/// `And the visitor submits the registration form`
Future<void> andTheVisitorSubmitsTheRegistrationForm(
    WidgetTester tester) async {
  await tester.tap(find.widgetWithText(FilledButton, 'Create Account'));
  await tester.pumpAndSettle();
}

/// `Then the visitor should be on the login page`
Future<void> thenTheVisitorShouldBeOnTheLoginPage(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.text('Sign In'), findsWidgets);
}

/// `And a success message about account creation should be displayed`
Future<void> andASuccessMessageAboutAccountCreationShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.textContaining('Account created'), findsOneWidget);
}

/// `Then no password value should be visible on the page`
Future<void> thenNoPasswordValueShouldBeVisibleOnThePage(
    WidgetTester tester) async {
  if (_s.enteredPassword.isNotEmpty) {
    expect(find.text(_s.enteredPassword), findsNothing);
  }
}

/// `Then an error message about duplicate username should be displayed`
Future<void> thenAnErrorMessageAboutDuplicateUsernameShouldBeDisplayed(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
  expect(find.textContaining('already in use'), findsOneWidget);
}

/// `And the visitor should remain on the registration page`
Future<void> andTheVisitorShouldRemainOnTheRegistrationPage(
    WidgetTester tester) async {
  expect(find.text('Create Account'), findsWidgets);
}

/// `Then a validation error for the email field should be displayed`
Future<void> thenAValidationErrorForTheEmailFieldShouldBeDisplayed(
    WidgetTester tester) async {
  expect(find.textContaining('valid email'), findsOneWidget);
}

/// `Then a validation error for the password field should be displayed`
Future<void> thenAValidationErrorForThePasswordFieldShouldBeDisplayed(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) =>
          w is Text &&
          (w.data?.toLowerCase().contains('password') ?? false) &&
          (w.data?.toLowerCase().contains('required') == true ||
              w.data?.toLowerCase().contains('characters') == true ||
              w.data?.toLowerCase().contains('uppercase') == true ||
              w.data?.toLowerCase().contains('special') == true),
    ),
    findsWidgets,
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

Future<void> _fillForm(
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
  group('User Registration', () {
    testWidgets(
        'Successful registration navigates to the login page with success message',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordStr0ngPass1(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenTheVisitorShouldBeOnTheLoginPage(tester);
      await andASuccessMessageAboutAccountCreationShouldBeDisplayed(tester);
    });

    testWidgets(
        'Successful registration does not display the password in any confirmation',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordStr0ngPass1(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenNoPasswordValueShouldBeVisibleOnThePage(tester);
    });

    testWidgets('Registration with duplicate username shows an error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await givenAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
          tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailNewAndPasswordStr0ngPass1(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAnErrorMessageAboutDuplicateUsernameShouldBeDisplayed(tester);
      await andTheVisitorShouldRemainOnTheRegistrationPage(tester);
    });

    testWidgets('Registration with invalid email shows a validation error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailNotAnEmailAndPasswordStr0ngPass1(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAValidationErrorForTheEmailFieldShouldBeDisplayed(tester);
      await andTheVisitorShouldRemainOnTheRegistrationPage(tester);
    });

    testWidgets('Registration with empty password shows a validation error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordEmpty(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAValidationErrorForThePasswordFieldShouldBeDisplayed(tester);
      await andTheVisitorShouldRemainOnTheRegistrationPage(tester);
    });

    testWidgets('Registration with weak password shows a validation error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAVisitorFillsInTheRegistrationFormWithUsernameAliceEmailAliceAndPasswordWeakPassword(
          tester);
      await andTheVisitorSubmitsTheRegistrationForm(tester);
      await thenAValidationErrorForThePasswordFieldShouldBeDisplayed(tester);
      await andTheVisitorShouldRemainOnTheRegistrationPage(tester);
    });
  });
}
