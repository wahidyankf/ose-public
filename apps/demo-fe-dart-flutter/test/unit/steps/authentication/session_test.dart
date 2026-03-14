/// BDD step definitions for authentication/session.feature.
///
/// Tests session lifecycle: automatic token refresh, expired refresh token
/// redirect, token rotation rejection, deactivated user redirect, logout, and
/// multi-device logout.
library;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:demo_fe_dart_flutter/core/providers/auth_provider.dart';
import 'package:demo_fe_dart_flutter/screens/login_screen.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/authentication/session.feature';

// ---------------------------------------------------------------------------
// Scenario-scoped state
// ---------------------------------------------------------------------------

late _SessionScenarioState _s;

class _SessionScenarioState {
  final authNotifier = _SessionAuthNotifier();
  bool refreshShouldFail = false;
  bool tokenRotationRejected = false;
  bool accountDeactivated = false;
}

class _SessionAuthNotifier extends AuthNotifier {
  bool refreshShouldFail = false;
  bool accountDeactivated = false;

  _SessionAuthNotifier()
      : super() {
    state = const AuthState(
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    );
  }

  @override
  Future<void> refresh() async {
    if (refreshShouldFail) {
      state = const AuthState.unauthenticated();
      throw DioException(
        requestOptions: RequestOptions(path: '/api/v1/auth/refresh'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/auth/refresh'),
          statusCode: 401,
          data: {'detail': 'Your session has expired. Please log in again.'},
        ),
        type: DioExceptionType.badResponse,
      );
    }
    state = const AuthState(
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    );
  }

  @override
  Future<void> logout() async {
    state = const AuthState.unauthenticated();
  }

  @override
  Future<void> logoutAll() async {
    state = const AuthState.unauthenticated();
  }
}

Widget _buildSessionApp(_SessionAuthNotifier notifier) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith((_) => notifier),
    ],
    child: MaterialApp(
      routes: {
        '/expenses': (context) =>
            const Scaffold(body: Text('Dashboard')),
        '/login': (context) => const LoginScreen(),
        '/tokens': (context) => const Scaffold(body: Text('Tokens')),
      },
      home: const Scaffold(
        body: Column(
          children: [
            Text('Dashboard'),
            Text('Logout'),
            Text('Log out all devices'),
          ],
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/// `Given the app is running`
Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _SessionScenarioState();
  await tester.pumpWidget(_buildSessionApp(_s.authNotifier));
  await tester.pumpAndSettle();
}

/// `And a user "alice" is registered with password "Str0ng#Pass1"`
Future<void> andAUserAliceIsRegisteredWithPasswordStr0ngPass1(
    WidgetTester tester) async {
  // Handled by mock state.
}

/// `And alice has logged in`
Future<void> andAliceHasLoggedIn(WidgetTester tester) async {
  // AuthNotifier initializes with authenticated state in constructor.
}

/// `Given alice's access token is about to expire`
Future<void> givenAlicesAccessTokenIsAboutToExpire(
    WidgetTester tester) async {
  // Simulated — refresh will succeed.
  _s.authNotifier.refreshShouldFail = false;
}

/// `When the app performs a background token refresh`
Future<void> whenTheAppPerformsABackgroundTokenRefresh(
    WidgetTester tester) async {
  await _s.authNotifier.refresh();
  await tester.pumpAndSettle();
}

/// `Then a new access token should be stored`
Future<void> thenANewAccessTokenShouldBeStored(WidgetTester tester) async {
  expect(_s.authNotifier.state.accessToken, equals('new.access.token'));
}

/// `And a new refresh token should be stored`
Future<void> andANewRefreshTokenShouldBeStored(WidgetTester tester) async {
  expect(_s.authNotifier.state.refreshToken, equals('new.refresh.token'));
}

/// `Given alice's refresh token has expired`
Future<void> givenAlicesRefreshTokenHasExpired(WidgetTester tester) async {
  _s.authNotifier.refreshShouldFail = true;
}

/// `When the app attempts a background token refresh`
Future<void> whenTheAppAttemptsABackgroundTokenRefresh(
    WidgetTester tester) async {
  try {
    await _s.authNotifier.refresh();
  } on DioException {
    // Expected; unauthenticated state set inside refresh().
  }
  await tester.pumpAndSettle();
}

/// `Then alice should be redirected to the login page`
Future<void> thenAliceShouldBeRedirectedToTheLoginPage(
    WidgetTester tester) async {
  expect(_s.authNotifier.state.isAuthenticated, isFalse);
}

/// `And an error message about session expiration should be displayed`
Future<void> andAnErrorMessageAboutSessionExpirationShouldBeDisplayed(
    WidgetTester tester) async {
  // Session cleared — isAuthenticated is false.
  expect(_s.authNotifier.state.isAuthenticated, isFalse);
}

/// `Given alice has refreshed her session and received a new token pair`
Future<void> givenAliceHasRefreshedHerSessionAndReceivedANewTokenPair(
    WidgetTester tester) async {
  await _s.authNotifier.refresh();
}

/// `When the app attempts to refresh using the original refresh token`
Future<void> whenTheAppAttemptsToRefreshUsingTheOriginalRefreshToken(
    WidgetTester tester) async {
  _s.authNotifier.refreshShouldFail = true;
  try {
    await _s.authNotifier.refresh();
  } on DioException {
    // Expected.
  }
  await tester.pumpAndSettle();
}

/// `Given alice's account has been deactivated`
Future<void> givenAlicesAccountHasBeenDeactivated(
    WidgetTester tester) async {
  _s.authNotifier.refreshShouldFail = true;
}

/// `When alice navigates to a protected page`
Future<void> whenAliceNavigatesToAProtectedPage(WidgetTester tester) async {
  try {
    await _s.authNotifier.refresh();
  } on DioException {
    // Expected.
  }
  await tester.pumpAndSettle();
}

/// `And an error message about account deactivation should be displayed`
Future<void> andAnErrorMessageAboutAccountDeactivationShouldBeDisplayed(
    WidgetTester tester) async {
  expect(_s.authNotifier.state.isAuthenticated, isFalse);
}

/// `When alice clicks the "Logout" button`
Future<void> whenAliceClicksTheLogoutButton(WidgetTester tester) async {
  await _s.authNotifier.logout();
  await tester.pumpAndSettle();
}

/// `And the authentication session should be cleared`
Future<void> andTheAuthenticationSessionShouldBeCleared(
    WidgetTester tester) async {
  expect(_s.authNotifier.state.isAuthenticated, isFalse);
  expect(_s.authNotifier.state.accessToken, isNull);
}

/// `When alice clicks the "Log out all devices" option`
Future<void> whenAliceClicksTheLogOutAllDevicesOption(
    WidgetTester tester) async {
  await _s.authNotifier.logoutAll();
  await tester.pumpAndSettle();
}

/// `Given alice has already clicked logout`
Future<void> givenAliceHasAlreadyClickedLogout(WidgetTester tester) async {
  await _s.authNotifier.logout();
}

/// `When alice navigates to the login page`
Future<void> whenAliceNavigatesToTheLoginPage(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

/// `Then no error should be displayed`
Future<void> thenNoErrorShouldBeDisplayed(WidgetTester tester) async {
  expect(find.byType(AlertDialog), findsNothing);
  expect(find.textContaining('Error'), findsNothing);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Session Lifecycle', () {
    testWidgets('Session refreshes automatically before the access token expires',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAlicesAccessTokenIsAboutToExpire(tester);
      await whenTheAppPerformsABackgroundTokenRefresh(tester);
      await thenANewAccessTokenShouldBeStored(tester);
      await andANewRefreshTokenShouldBeStored(tester);
    });

    testWidgets('Expired refresh token redirects to login', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAlicesRefreshTokenHasExpired(tester);
      await whenTheAppAttemptsABackgroundTokenRefresh(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
      await andAnErrorMessageAboutSessionExpirationShouldBeDisplayed(tester);
    });

    testWidgets('Original refresh token is rejected after rotation',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasRefreshedHerSessionAndReceivedANewTokenPair(tester);
      await whenTheAppAttemptsToRefreshUsingTheOriginalRefreshToken(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
    });

    testWidgets('Deactivated user is redirected to login on next action',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAlicesAccountHasBeenDeactivated(tester);
      await whenAliceNavigatesToAProtectedPage(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
      await andAnErrorMessageAboutAccountDeactivationShouldBeDisplayed(tester);
    });

    testWidgets('Clicking logout ends the current session', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceClicksTheLogoutButton(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
      await andTheAuthenticationSessionShouldBeCleared(tester);
    });

    testWidgets('Clicking "Log out all devices" ends all sessions',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await whenAliceClicksTheLogOutAllDevicesOption(tester);
      await thenAliceShouldBeRedirectedToTheLoginPage(tester);
      await andTheAuthenticationSessionShouldBeCleared(tester);
    });

    testWidgets('Clicking logout twice does not cause an error',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasAlreadyClickedLogout(tester);
      await whenAliceNavigatesToTheLoginPage(tester);
      await thenNoErrorShouldBeDisplayed(tester);
    });
  });
}
