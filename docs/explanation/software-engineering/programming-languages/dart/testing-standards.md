---
title: "Dart Testing Standards"
description: Authoritative OSE Platform Dart testing standards (package:test, mockito, flutter-test, coverage)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - testing-standards
  - package-test
  - mockito
  - flutter-test
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to write tests in THIS codebase, not WHAT testing is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for Dart development in the OSE Platform. These standards ensure consistent, reliable, and maintainable test suites across all Dart projects.

**Target Audience**: OSE Platform Dart developers, QA engineers, CI/CD pipeline maintainers

**Scope**: package:test patterns, mocking with mockito, Flutter widget testing, integration tests, coverage enforcement

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Test Execution):

```dart
// Makefile or shell script for automated testing
// dart test --coverage=coverage
// dart pub global run coverage:format_coverage \
//   --lcov --in=coverage --out=coverage/lcov.info

// zakat_calculator_test.dart
import 'package:test/test.dart';
import 'package:zakat_service/src/domain/zakat/zakat_calculator.dart';

void main() {
  group('ZakatCalculator', () {
    test('wealth above nisab returns correct zakat amount', () {
      expect(calculateZakat(10000.0, 5000.0), equals(250.0));
    });

    test('wealth below nisab returns zero', () {
      expect(calculateZakat(3000.0, 5000.0), equals(0.0));
    });

    test('wealth equal to nisab returns 2.5%', () {
      expect(calculateZakat(5000.0, 5000.0), equals(125.0));
    });
  });
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Arrange-Act-Assert):

```dart
import 'package:test/test.dart';
import 'package:mockito/mockito.dart';
import 'package:zakat_service/zakat_service.dart';

void main() {
  test('ZakatService saves transaction to repository', () async {
    // Arrange - explicit setup
    final mockRepo = MockZakatRepository();
    final service = ZakatService(repository: mockRepo);
    final expectedTx = ZakatTransaction(
      transactionId: 'TX-001',
      payerId: 'CUST-001',
      wealth: 10000.0,
      zakatAmount: 250.0,
      paidAt: DateTime(2026, 3, 1),
    );

    when(mockRepo.save(any)).thenAnswer((_) async => expectedTx);

    // Act - explicit invocation
    final result = await service.recordZakatPayment(
      payerId: 'CUST-001',
      wealth: 10000.0,
      nisab: 5000.0,
    );

    // Assert - explicit verification
    expect(result.zakatAmount, equals(250.0));
    verify(mockRepo.save(any)).called(1);
  });
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Test Data):

```dart
// CORRECT: Immutable test fixtures
const testNisab = 5000.0;
const testWealthAboveNisab = 10000.0;
const testWealthBelowNisab = 3000.0;

// Shared immutable test data
const validContract = MurabahaContractFixture(
  contractId: 'CONTRACT-001',
  customerId: 'CUST-001',
  costPrice: 50000.0,
  profitRate: 0.08,
);
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Testing Pure Domain Functions):

```dart
// Pure functions are easiest to test - no setup needed
void main() {
  group('calculateZakat (pure function)', () {
    final testCases = [
      (wealth: 10000.0, nisab: 5000.0, expected: 250.0),
      (wealth: 0.0, nisab: 5000.0, expected: 0.0),
      (wealth: 5000.0, nisab: 5000.0, expected: 125.0),
      (wealth: 100000.0, nisab: 5000.0, expected: 2500.0),
    ];

    for (final tc in testCases) {
      test('wealth ${tc.wealth} with nisab ${tc.nisab} -> ${tc.expected}', () {
        expect(calculateZakat(tc.wealth, tc.nisab), equals(tc.expected));
      });
    }
  });
}
```

### 5. Reproducibility First

**PASS Example** (Deterministic Tests):

```dart
// CORRECT: Inject time dependencies for reproducibility
class ZakatService {
  final DateTime Function() _now;

  ZakatService({DateTime Function()? now}) : _now = now ?? DateTime.now;

  ZakatTransaction createTransaction(String payerId, double wealth, double nisab) {
    return ZakatTransaction(
      transactionId: _generateId(),
      payerId: payerId,
      wealth: wealth,
      zakatAmount: calculateZakat(wealth, nisab),
      paidAt: _now(), // Injected, not hardcoded
    );
  }
}

// Test with fixed time
test('transaction has correct timestamp', () {
  final fixedTime = DateTime(2026, 3, 9);
  final service = ZakatService(now: () => fixedTime);

  final tx = service.createTransaction('CUST-001', 10000.0, 5000.0);

  expect(tx.paidAt, equals(fixedTime));
});
```

## Part 1: package:test Patterns

### Test Structure with group and test

**MUST** use `group` to organize related tests and `test` for individual cases.

```dart
import 'package:test/test.dart';
import 'package:zakat_service/zakat_service.dart';

void main() {
  // Top-level group by feature/class
  group('MurabahaContract', () {
    // Nested group by scenario or method
    group('create()', () {
      test('creates contract with valid parameters', () {
        final contract = MurabahaContract.create(
          customerId: 'CUST-001',
          costPrice: 50000.0,
          profitRate: 0.08,
          installmentCount: 24,
        );

        expect(contract.customerId, equals('CUST-001'));
        expect(contract.costPrice, equals(50000.0));
        expect(contract.totalPrice, equals(54000.0));
      });

      test('throws ArgumentError for negative cost price', () {
        expect(
          () => MurabahaContract.create(
            customerId: 'CUST-001',
            costPrice: -1000.0,
            profitRate: 0.08,
            installmentCount: 24,
          ),
          throwsArgumentError,
        );
      });

      test('throws ArgumentError for negative profit rate', () {
        expect(
          () => MurabahaContract.create(
            customerId: 'CUST-001',
            costPrice: 50000.0,
            profitRate: -0.01,
            installmentCount: 24,
          ),
          throwsArgumentError,
        );
      });
    });

    group('recordPayment()', () {
      late MurabahaContract contract;

      setUp(() {
        contract = MurabahaContract.create(
          customerId: 'CUST-001',
          costPrice: 50000.0,
          profitRate: 0.08,
          installmentCount: 24,
        );
      });

      test('returns new contract with payment recorded', () {
        final payment = Payment(
          amount: 2000.0,
          paymentDate: DateTime(2026, 3, 1),
        );

        final updated = contract.recordPayment(payment);

        expect(updated.payments, hasLength(1));
        expect(updated.payments.first.amount, equals(2000.0));
        // Original is unchanged (immutability)
        expect(contract.payments, isEmpty);
      });
    });
  });
}
```

### setUp and tearDown

**MUST** use `setUp`/`tearDown` for per-test initialization and cleanup. Use `setUpAll`/`tearDownAll` for group-level one-time setup.

```dart
group('ZakatRepository integration', () {
  late ZakatRepository repository;
  late InMemoryDatabase database;

  setUpAll(() async {
    // One-time setup for the group
    database = await InMemoryDatabase.create();
  });

  setUp(() async {
    // Per-test setup - fresh state
    await database.clear();
    repository = ZakatRepository(database: database);
  });

  tearDown(() async {
    // Per-test cleanup
    await database.clear();
  });

  tearDownAll(() async {
    // One-time teardown
    await database.dispose();
  });

  test('saves and retrieves transaction', () async {
    // Test with fresh repository state
    final tx = ZakatTransaction(/* ... */);
    await repository.save(tx);
    final found = await repository.findById(tx.transactionId);
    expect(found, equals(tx));
  });
});
```

### Arrange-Act-Assert Pattern

**MUST** structure every test with clear Arrange-Act-Assert sections.

```dart
test('ZakatCalculator returns correct amount for gold nisab', () {
  // Arrange
  const goldNisabValue = 5000.0;
  const customerWealth = 15000.0;
  final calculator = ZakatCalculator(nisab: goldNisabValue);

  // Act
  final zakatAmount = calculator.calculate(customerWealth);

  // Assert
  expect(zakatAmount, equals(375.0)); // 15000 * 0.025
});
```

### Async Tests

**MUST** use `async`/`await` for asynchronous tests and return `Future`.

```dart
test('fetches zakat history from remote API', () async {
  // Arrange
  final mockClient = MockHttpClient();
  final service = ZakatApiService(client: mockClient);
  final expectedHistory = [
    ZakatTransaction(/* ... */),
    ZakatTransaction(/* ... */),
  ];

  when(mockClient.get(any)).thenAnswer(
    (_) async => http.Response(
      jsonEncode(expectedHistory.map((t) => t.toJson()).toList()),
      200,
    ),
  );

  // Act
  final history = await service.fetchHistory(customerId: 'CUST-001');

  // Assert
  expect(history, hasLength(2));
  expect(history.first.payerId, equals('CUST-001'));
});
```

### Custom Matchers

**SHOULD** create custom matchers for domain-specific assertions.

```dart
// Custom matcher for ZakatTransaction
Matcher hasZakatAmount(double expected) => _HasZakatAmount(expected);

class _HasZakatAmount extends Matcher {
  final double _expected;
  const _HasZakatAmount(this._expected);

  @override
  bool matches(Object? item, Map matchState) {
    if (item is ZakatTransaction) {
      return (item.zakatAmount - _expected).abs() < 0.001;
    }
    return false;
  }

  @override
  Description describe(Description description) =>
      description.add('has zakat amount of $_expected');
}

// Usage
test('calculates correct zakat amount', () {
  final tx = ZakatTransaction(zakatAmount: 250.0, /* ... */);
  expect(tx, hasZakatAmount(250.0));
});
```

## Part 2: Mocking with mockito

### Generating Mocks

**MUST** use `@GenerateMocks` annotation with `build_runner` for type-safe mocks.

```dart
// zakat_service_test.dart
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:test/test.dart';
import 'package:zakat_service/zakat_service.dart';

// Generate mocks with build_runner: dart run build_runner build
@GenerateMocks([ZakatRepository, ZakatApiClient, ZakatNotificationService])
import 'zakat_service_test.mocks.dart';

void main() {
  late MockZakatRepository mockRepository;
  late MockZakatApiClient mockApiClient;
  late ZakatService service;

  setUp(() {
    mockRepository = MockZakatRepository();
    mockApiClient = MockZakatApiClient();
    service = ZakatService(
      repository: mockRepository,
      apiClient: mockApiClient,
    );
  });

  test('records payment and saves to repository', () async {
    // Arrange
    final transaction = ZakatTransaction(/* ... */);
    when(mockRepository.save(any)).thenAnswer((_) async => transaction);

    // Act
    await service.recordPayment(payerId: 'CUST-001', amount: 250.0);

    // Assert
    verify(mockRepository.save(any)).called(1);
    verifyNoMoreInteractions(mockRepository);
  });
}
```

### Stubbing Behavior

**MUST** use `when`/`thenReturn`/`thenAnswer`/`thenThrow` for stub configuration.

```dart
// Stub synchronous return
when(mockRepository.findById('TX-001')).thenReturn(transaction);

// Stub async return
when(mockRepository.findAll()).thenAnswer((_) async => [tx1, tx2]);

// Stub exception
when(mockApiClient.fetchRates()).thenThrow(NetworkException('No connection'));

// Stub with argument matcher
when(mockRepository.save(argThat(
  predicate<ZakatTransaction>((tx) => tx.zakatAmount > 0),
))).thenAnswer((_) async => savedTransaction);

// Stub sequential returns
when(mockRepository.getNextId())
  .thenReturn('TX-001')
  .thenReturn('TX-002')
  .thenReturn('TX-003');
```

### Verification

**MUST** verify mock interactions for behavior-based tests.

```dart
test('notifies customer after successful payment', () async {
  // Arrange
  when(mockRepository.save(any)).thenAnswer((_) async => transaction);
  when(mockNotifier.notifyPaymentSuccess(any)).thenAnswer((_) async {});

  // Act
  await service.recordPayment(payerId: 'CUST-001', amount: 250.0);

  // Assert interactions
  verify(mockRepository.save(any)).called(1);
  verify(mockNotifier.notifyPaymentSuccess('CUST-001')).called(1);
  verifyNever(mockNotifier.notifyPaymentFailure(any)); // Never called
  verifyNoMoreInteractions(mockNotifier);
});
```

## Part 3: Flutter Widget Tests

### Basic Widget Test Pattern

**MUST** use `flutter_test` for widget and integration testing in Flutter apps.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zakat_app/widgets/zakat_calculator_form.dart';

void main() {
  group('ZakatCalculatorForm', () {
    testWidgets('displays result after calculation', (tester) async {
      // Arrange - pump widget
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ZakatCalculatorForm(),
          ),
        ),
      );

      // Act - interact with UI
      await tester.enterText(find.byKey(const Key('wealth-input')), '10000');
      await tester.enterText(find.byKey(const Key('nisab-input')), '5000');
      await tester.tap(find.byKey(const Key('calculate-button')));
      await tester.pump(); // Trigger rebuild

      // Assert - check rendered output
      expect(find.text('Zakat Amount: 250.00 USD'), findsOneWidget);
      expect(find.byKey(const Key('result-display')), findsOneWidget);
    });

    testWidgets('shows error for invalid wealth input', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: Scaffold(body: ZakatCalculatorForm())),
      );

      await tester.enterText(find.byKey(const Key('wealth-input')), '-100');
      await tester.tap(find.byKey(const Key('calculate-button')));
      await tester.pump();

      expect(find.text('Wealth must be positive'), findsOneWidget);
    });
  });
}
```

### Testing Async Widgets

**MUST** use `pumpAndSettle()` for animations and async state updates.

```dart
testWidgets('loads and displays zakat history', (tester) async {
  // Arrange with mock provider
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        zakatHistoryProvider.overrideWith(
          (ref) => Stream.fromIterable([
            [tx1, tx2, tx3],
          ]),
        ),
      ],
      child: const MaterialApp(home: ZakatHistoryScreen()),
    ),
  );

  // Wait for async loading to complete
  await tester.pumpAndSettle();

  // Assert loaded state
  expect(find.byType(ZakatHistoryCard), findsNWidgets(3));
  expect(find.text('Loading...'), findsNothing);
});
```

## Part 4: Coverage Enforcement

### Running Coverage

**MUST** run tests with coverage and enforce >=95% line coverage.

```bash
# Run tests with coverage
dart test --coverage=coverage

# Convert to lcov format
dart pub global run coverage:format_coverage \
  --lcov \
  --in=coverage \
  --out=coverage/lcov.info \
  --report-on=lib

# View coverage summary
dart pub global run coverage:format_coverage \
  --summary \
  --in=coverage

# For Flutter projects
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

### Coverage Configuration

**MUST** configure coverage thresholds in CI/CD pipeline.

```yaml
# .github/workflows/test.yaml
- name: Run tests with coverage
  run: |
    dart test --coverage=coverage
    dart pub global run coverage:format_coverage \
      --lcov --in=coverage --out=coverage/lcov.info

- name: Check coverage threshold
  run: |
    # Enforce >=95% line coverage
    COVERAGE=$(lcov --summary coverage/lcov.info 2>&1 | grep lines | awk '{print $2}' | tr -d '%')
    echo "Coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 95" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 95% threshold"
      exit 1
    fi
```

### What to Test

**MUST** test:

- Pure domain functions (all branches)
- Business rule enforcement (valid and invalid cases)
- Error handling paths
- Repository interfaces with mock implementations

**SHOULD** test:

- Integration between service layers
- API client behavior with mocked HTTP

**MAY** omit tests for:

- Simple delegating constructors
- Trivial getters that return field values
- Generated code (`*.g.dart`, `*.freezed.dart`)

## Enforcement

Testing standards are enforced through:

- **dart test** - Runs all tests (enforced in pre-push hooks and CI/CD)
- **coverage enforcement** - >=95% line coverage required
- **Code reviews** - Verify AAA pattern, mock usage, test isolation

**Pre-commit checklist**:

- [ ] All tests pass with `dart test`
- [ ] New code has corresponding tests
- [ ] Tests follow Arrange-Act-Assert structure
- [ ] Mocks generated via `@GenerateMocks` (not manual)
- [ ] Coverage >= 95% enforced

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions for test files
- [Code Quality Standards](./code-quality-standards.md) - dart analyze in CI
- [Error Handling Standards](./error-handling-standards.md) - Testing exception scenarios
- [Framework Integration](./framework-integration.md) - Flutter test patterns

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)
- [Maker-Checker-Fixer Pattern](../../../../../governance/development/pattern/maker-checker-fixer.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Testing Stack**: package:test, mockito, flutter_test, mocktail
