---
title: "Dart Testing"
description: Testing strategies for Dart including unit testing with package:test, widget testing, integration testing, TDD, mocking, test coverage, and CI/CD integration
category: explanation
subcategory: prog-lang
tags:
  - dart
  - testing
  - unit-testing
  - widget-testing
  - tdd
  - mocking
  - test-coverage
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__flutter.md
principles:
  - automation-over-manual
updated: 2026-01-29
---

# Dart Testing

## Quick Reference

### Testing Basics

**Unit Test**:

```dart
import 'package:test/test.dart';

void main() {
  test('calculates Zakat correctly', () {
    final result = calculateZakat(10000.0, 5000.0);
    expect(result, equals(250.0));
  });

  test('returns 0 when below nisab', () {
    final result = calculateZakat(3000.0, 5000.0);
    expect(result, equals(0.0));
  });
}

double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}
```

**Group Tests**:

```dart
void main() {
  group('ZakatCalculator', () {
    late ZakatCalculator calculator;

    setUp(() {
      calculator = ZakatCalculator();
    });

    test('calculates Zakat for eligible wealth', () {
      final result = calculator.calculate(10000.0, 5000.0);
      expect(result, equals(250.0));
    });

    test('returns 0 for ineligible wealth', () {
      final result = calculator.calculate(3000.0, 5000.0);
      expect(result, equals(0.0));
    });
  });
}

class ZakatCalculator {
  double calculate(double wealth, double nisab) {
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}
```

## Overview

Dart provides comprehensive testing support through package:test for unit testing, package:flutter_test for widget testing, and integration testing frameworks. Testing is essential for reliable financial applications.

This guide covers **Dart 3.0+ testing** with Islamic finance examples.

## Unit Testing

### Basic Tests

```dart
import 'package:test/test.dart';

void main() {
  group('Donation', () {
    test('creates donation with valid amount', () {
      final donation = Donation('don-1', 'donor-1', 100.0);

      expect(donation.id, equals('don-1'));
      expect(donation.donorId, equals('donor-1'));
      expect(donation.amount, equals(100.0));
    });

    test('throws on negative amount', () {
      expect(
        () => Donation('don-1', 'donor-1', -100.0),
        throwsA(isA<ArgumentError>()),
      );
    });
  });
}

class Donation {
  final String id;
  final String donorId;
  final double amount;

  Donation(this.id, this.donorId, this.amount) {
    if (amount <= 0) {
      throw ArgumentError('Amount must be positive');
    }
  }
}
```

### Async Tests

```dart
void main() {
  test('fetches nisab threshold', () async {
    final service = ZakatService();
    final nisab = await service.fetchNisab();

    expect(nisab, greaterThan(0));
  });

  test('calculates Zakat asynchronously', () async {
    final service = ZakatService();
    final zakat = await service.calculateZakat('user-1');

    expect(zakat, greaterThanOrEqualTo(0));
  });
}

class ZakatService {
  Future<double> fetchNisab() async {
    await Future.delayed(Duration(milliseconds: 100));
    return 5000.0;
  }

  Future<double> calculateZakat(String userId) async {
    final wealth = await fetchWealth(userId);
    final nisab = await fetchNisab();
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }

  Future<double> fetchWealth(String userId) async {
    await Future.delayed(Duration(milliseconds: 100));
    return 10000.0;
  }
}
```

## Mocking

```dart
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';

class MockDonationRepository extends Mock implements DonationRepository {}

void main() {
  group('DonationService', () {
    late DonationRepository repository;
    late DonationService service;

    setUp(() {
      repository = MockDonationRepository();
      service = DonationService(repository);
    });

    test('saves donation', () async {
      final donation = Donation('don-1', 'donor-1', 100.0);

      when(() => repository.save(donation))
          .thenAnswer((_) async => true);

      final result = await service.processDonation(donation);

      expect(result, isTrue);
      verify(() => repository.save(donation)).called(1);
    });
  });
}

abstract class DonationRepository {
  Future<bool> save(Donation donation);
}

class DonationService {
  final DonationRepository repository;

  DonationService(this.repository);

  Future<bool> processDonation(Donation donation) async {
    return await repository.save(donation);
  }
}
```

## Test Coverage

```bash
# Run tests with coverage
dart test --coverage=coverage

# Generate coverage report
dart pub global activate coverage
dart pub global run coverage:format_coverage \
  --lcov \
  --in=coverage \
  --out=coverage/lcov.info \
  --report-on=lib

# View coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Flutter Integration](./ex-soen-prla-da__flutter.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
