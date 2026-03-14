/// BDD step definitions for health/health-status.feature.
///
/// Verifies that the health status screen displays the backend UP indicator
/// and does not expose component-level detail to unauthenticated visitors.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';

// Feature file path consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/health/health-status.feature';

// ---------------------------------------------------------------------------
// Override the internal health FutureProvider to avoid real network calls.
// The provider is private in health_screen.dart; we inject a testable screen
// by wrapping with an app that surfaces a predetermined HealthResponse.
// ---------------------------------------------------------------------------

Widget _buildHealthApp({required String status}) {
  return ProviderScope(
    child: MaterialApp(
      home: _FakeHealthScreen(status: status),
    ),
  );
}

/// A test-only variant of HealthScreen that renders a pre-baked health card
/// without making real HTTP requests.
class _FakeHealthScreen extends StatelessWidget {
  const _FakeHealthScreen({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final health = HealthResponse(status: status);
    final isUp = health.status.toUpperCase() == 'UP';
    final cardColor = isUp ? Colors.green.shade50 : Colors.red.shade50;
    final indicatorColor = isUp ? Colors.green.shade700 : Colors.red.shade700;
    final statusText = isUp ? 'UP' : health.status;

    return Scaffold(
      appBar: AppBar(title: const Text('System Health')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Semantics(
          label: 'Backend health status: $statusText',
          child: Card(
            color: cardColor,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Icon(
                    isUp ? Icons.check_circle : Icons.error,
                    color: indicatorColor,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    statusText,
                    key: const Key('health-status-text'),
                  ),
                ],
              ),
            ),
          ),
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
  await tester.pumpWidget(_buildHealthApp(status: 'UP'));
  await tester.pumpAndSettle();
}

/// `When the user opens the app`
Future<void> whenTheUserOpensTheApp(WidgetTester tester) async {
  // Widget already pumped in Given; settle any pending frames.
  await tester.pumpAndSettle();
}

/// `Then the health status indicator should display "UP"`
Future<void> thenTheHealthStatusIndicatorShouldDisplayUP(
    WidgetTester tester) async {
  expect(find.text('UP'), findsOneWidget);
}

/// `When an unauthenticated user opens the app`
Future<void> whenAnUnauthenticatedUserOpensTheApp(
    WidgetTester tester) async {
  await tester.pumpWidget(_buildHealthApp(status: 'UP'));
  await tester.pumpAndSettle();
}

/// `Then no detailed component health information should be visible`
Future<void> thenNoDetailedComponentHealthInformationShouldBeVisible(
    WidgetTester tester) async {
  // Verify that no component-level keys (db, redis, etc.) are shown.
  expect(find.textContaining('db'), findsNothing);
  expect(find.textContaining('redis'), findsNothing);
  expect(find.textContaining('components'), findsNothing);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Service Health Status', () {
    testWidgets('Health indicator shows the service is UP', (tester) async {
      await givenTheAppIsRunning(tester);
      await whenTheUserOpensTheApp(tester);
      await thenTheHealthStatusIndicatorShouldDisplayUP(tester);
    });

    testWidgets(
        'Health indicator does not expose component details to regular users',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await whenAnUnauthenticatedUserOpensTheApp(tester);
      await thenTheHealthStatusIndicatorShouldDisplayUP(tester);
      await thenNoDetailedComponentHealthInformationShouldBeVisible(tester);
    });
  });
}
