---
title: "Dart Error Handling"
description: Error handling in Dart including try-catch-finally, custom exceptions, async error handling, Result types, validation patterns, and recovery strategies
category: explanation
subcategory: prog-lang
tags:
  - dart
  - error-handling
  - exceptions
  - try-catch
  - result-types
  - validation
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__async-programming.md
  - ./ex-soen-prla-da__null-safety.md
principles:
  - explicit-over-implicit
updated: 2026-01-29
---

# Dart Error Handling

## Quick Reference

### Error Handling Patterns

**Try-Catch**:

```dart
try {
  final zakat = calculateZakat(wealth, nisab);
  print('Zakat: \$${zakat}');
} on ArgumentError catch (e) {
  print('Validation error: ${e.message}');
} catch (e, stackTrace) {
  print('Error: $e');
  print('Stack: $stackTrace');
}
```

**Custom Exceptions**:

```dart
class ZakatCalculationException implements Exception {
  final String message;
  final Object? cause;

  ZakatCalculationException(this.message, [this.cause]);

  @override
  String toString() => 'ZakatCalculationException: $message';
}
```

**Result Type**:

```dart
class Result<T, E> {
  final T? value;
  final E? error;

  Result.success(this.value) : error = null;
  Result.failure(this.error) : value = null;

  bool get isSuccess => value != null;
}
```

## Overview

Dart provides comprehensive error handling through exceptions, try-catch blocks, and custom exception types. Proper error handling is critical for financial applications where failures must be managed gracefully.

This guide covers **Dart 3.0+ error handling** with Islamic finance examples.

## Exception Hierarchy

### Built-in Exceptions

```dart
// ArgumentError - invalid arguments
double calculateZakat(double wealth) {
  if (wealth < 0) {
    throw ArgumentError('Wealth cannot be negative');
  }
  return wealth * 0.025;
}

// StateError - invalid state
class DonationService {
  bool _initialized = false;

  void process() {
    if (!_initialized) {
      throw StateError('Service not initialized');
    }
  }
}

// FormatException - parsing errors
double parseAmount(String input) {
  final amount = double.tryParse(input);
  if (amount == null) {
    throw FormatException('Invalid amount: $input');
  }
  return amount;
}
```

### Custom Exceptions

```dart
class ShariaComplianceException implements Exception {
  final String reason;
  final List<String> violations;

  ShariaComplianceException(this.reason, this.violations);

  @override
  String toString() =>
      'Sharia violation: $reason - ${violations.join(', ')}';
}

class InsufficientFundsException implements Exception {
  final double required;
  final double available;

  InsufficientFundsException(this.required, this.available);

  @override
  String toString() =>
      'Insufficient funds: required \$$required, available \$$available';
}
```

## Try-Catch-Finally

```dart
Future<void> processDonation(Donation donation) async {
  try {
    await validateDonation(donation);
    await saveDonation(donation);
    await sendConfirmation(donation);
  } on ValidationException catch (e) {
    print('Validation failed: ${e.message}');
    rethrow;
  } on DatabaseException catch (e, stackTrace) {
    print('Database error: $e');
    print('Stack trace: $stackTrace');
    await retryDonation(donation);
  } finally {
    // Always executes
    print('Processing complete');
  }
}

class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
}

class DatabaseException implements Exception {
  final String message;
  DatabaseException(this.message);
}

Future<void> validateDonation(Donation donation) async {}
Future<void> saveDonation(Donation donation) async {}
Future<void> sendConfirmation(Donation donation) async {}
Future<void> retryDonation(Donation donation) async {}

class Donation {
  final String id;
  final double amount;
  Donation(this.id, this.amount);
}
```

## Async Error Handling

```dart
Future<double> calculateZakatSafely(String userId) async {
  try {
    final wealth = await fetchWealth(userId);
    final nisab = await fetchNisab();
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  } on NetworkException catch (e) {
    print('Network error: $e');
    return 0.0; // Safe fallback
  } catch (e) {
    print('Unexpected error: $e');
    rethrow;
  }
}

Future<double> fetchWealth(String userId) async {
  throw NetworkException('Connection failed');
}

Future<double> fetchNisab() async {
  return 5000.0;
}

class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);
}
```

## Result Type Pattern

```dart
class Result<T, E> {
  final T? value;
  final E? error;

  Result.success(this.value) : error = null;
  Result.failure(this.error) : value = null;

  bool get isSuccess => value != null;
  bool get isFailure => error != null;

  T getOrThrow() {
    if (value != null) return value!;
    throw error!;
  }

  T getOrElse(T defaultValue) {
    return value ?? defaultValue;
  }
}

Result<double, String> calculateZakat(double wealth, double nisab) {
  if (wealth < 0) {
    return Result.failure('Wealth cannot be negative');
  }
  if (nisab < 0) {
    return Result.failure('Nisab cannot be negative');
  }

  final zakat = wealth >= nisab ? wealth * 0.025 : 0.0;
  return Result.success(zakat);
}

// Usage
final result = calculateZakat(10000.0, 5000.0);
if (result.isSuccess) {
  print('Zakat: \$${result.value}');
} else {
  print('Error: ${result.error}');
}
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Async Programming](./ex-soen-prla-da__async-programming.md)
- [Null Safety](./ex-soen-prla-da__null-safety.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
