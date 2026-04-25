---
title: "Dart Error Handling Standards"
description: Authoritative OSE Platform Dart error handling standards (exceptions, result-type, try-catch)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - error-handling
  - exceptions
  - result-type
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to handle errors in THIS codebase, not WHAT exceptions are.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative error handling standards** for Dart development in the OSE Platform. Consistent error handling prevents silent failures, improves debuggability, and ensures business domain errors are communicated clearly.

**Target Audience**: OSE Platform Dart developers, API designers, technical reviewers

**Scope**: Exception hierarchy, try/catch patterns, custom exceptions, Result type pattern, rethrow vs throw

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Error Detection):

```dart
// analysis_options.yaml enforces error handling rules
linter:
  rules:
    - only_throw_errors       # Only throw Error/Exception subclasses
    - use_rethrow_when_possible # Use rethrow, not throw e
    - unawaited_futures       # Catch missed async errors

// CI catches uncaught error patterns via dart analyze
// dart analyze --fatal-infos fails on missing error handling
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Exception Types):

```dart
// CORRECT: Explicit, typed exceptions
abstract class ZakatException implements Exception {
  final String message;
  const ZakatException(this.message);
}

class InsufficientWealthException extends ZakatException {
  final double wealth;
  final double nisab;

  const InsufficientWealthException({
    required this.wealth,
    required this.nisab,
  }) : super('Wealth $wealth is below nisab $nisab');
}

// Explicit typed catch - callers know exactly what to handle
try {
  final zakat = await service.calculateAndRecord(wealth, nisab);
} on InsufficientWealthException catch (e) {
  // Explicit handling for this specific case
  showNisabExplanation(e.nisab);
} on ZakatValidationException catch (e) {
  showValidationError(e.message);
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Exception Objects):

```dart
// CORRECT: Immutable exceptions with const constructors
class MurabahaValidationException implements Exception {
  final String field;
  final String reason;
  final double? invalidValue;

  const MurabahaValidationException({
    required this.field,
    required this.reason,
    this.invalidValue,
  });

  @override
  String toString() =>
      'MurabahaValidationException: field=$field, reason=$reason'
      '${invalidValue != null ? ", value=$invalidValue" : ""}';
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Validation Functions):

```dart
// CORRECT: Pure validation returning Result type
sealed class ValidationResult<T> {}
class ValidationSuccess<T> extends ValidationResult<T> {
  final T value;
  const ValidationSuccess(this.value);
}
class ValidationFailure<T> extends ValidationResult<T> {
  final String message;
  const ValidationFailure(this.message);
}

// Pure function - no side effects, returns validation result
ValidationResult<double> validateWealth(double wealth) {
  if (wealth < 0) {
    return ValidationFailure('Wealth cannot be negative');
  }
  if (wealth.isNaN || wealth.isInfinite) {
    return ValidationFailure('Wealth must be a finite number');
  }
  return ValidationSuccess(wealth);
}
```

### 5. Reproducibility First

**PASS Example** (Consistent Error Response Structure):

```dart
// Consistent error response for all API endpoints
class ApiErrorResponse {
  final String code;
  final String message;
  final Map<String, String>? details;
  final DateTime timestamp;

  const ApiErrorResponse({
    required this.code,
    required this.message,
    this.details,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'code': code,
    'message': message,
    if (details != null) 'details': details,
    'timestamp': timestamp.toIso8601String(),
  };
}
```

## Part 1: Dart Exception Hierarchy

### Error vs Exception

**MUST** understand and apply the distinction between `Error` and `Exception`:

- **`Error`**: Programmer mistakes (bugs), not recoverable. Examples: `AssertionError`, `RangeError`, `TypeError`
- **`Exception`**: Recoverable conditions expected during normal operation. Examples: `FormatException`, `IOException`, `SocketException`

```dart
// CORRECT: Use Exception for business logic failures (recoverable)
class ZakatCalculationException implements Exception {
  final String message;
  const ZakatCalculationException(this.message);
}

// CORRECT: Dart SDK throws Error for programmer mistakes
// Don't catch Error unless you're at the top boundary
void main() {
  final list = [1, 2, 3];
  // list[10]; // Throws RangeError - programmer bug, should not catch

  // WRONG: Catching Error hides bugs
  try {
    final value = list[10];
    print(value);
  } on RangeError {
    print('Out of bounds'); // Hiding the bug!
  }
}

// CORRECT: Use Error only for programming invariant violations
class ContractInvariantError extends Error {
  final String invariant;
  ContractInvariantError(this.invariant);

  @override
  String toString() => 'ContractInvariantError: $invariant violated';
}
```

### Never Throw Error Subclasses for Business Logic

**PROHIBITED**: Using `Error` subclasses for expected business conditions.

```dart
// WRONG: Error for business logic
void validateNisab(double nisab) {
  if (nisab <= 0) {
    throw ArgumentError('Nisab must be positive'); // ArgumentError is an Error!
  }
}

// CORRECT: Exception for business validation
void validateNisab(double nisab) {
  if (nisab <= 0) {
    throw ZakatValidationException(
      field: 'nisab',
      message: 'Nisab threshold must be positive',
      invalidValue: nisab,
    );
  }
}
```

## Part 2: Custom Exception Classes

### Exception Hierarchy Pattern

**MUST** create a domain exception hierarchy for each bounded context.

```dart
// Base exception for the Zakat domain
abstract class ZakatDomainException implements Exception {
  final String message;
  final String? code;

  const ZakatDomainException(this.message, {this.code});

  @override
  String toString() =>
      '${runtimeType}${code != null ? "[$code]" : ""}: $message';
}

// Specific exceptions
class ZakatValidationException extends ZakatDomainException {
  final String field;
  final Object? invalidValue;

  const ZakatValidationException({
    required this.field,
    required String message,
    this.invalidValue,
  }) : super(message, code: 'VALIDATION_ERROR');
}

class ZakatNisabException extends ZakatDomainException {
  final double wealth;
  final double nisab;

  const ZakatNisabException({required this.wealth, required this.nisab})
      : super(
          'Wealth $wealth does not meet nisab threshold $nisab',
          code: 'BELOW_NISAB',
        );
}

class ZakatTransactionNotFoundException extends ZakatDomainException {
  final String transactionId;

  const ZakatTransactionNotFoundException(this.transactionId)
      : super(
          'Zakat transaction not found: $transactionId',
          code: 'NOT_FOUND',
        );
}

// Murabaha domain exceptions
abstract class MurabahaDomainException implements Exception {
  final String message;
  const MurabahaDomainException(this.message);
}

class MurabahaContractException extends MurabahaDomainException {
  const MurabahaContractException(super.message);
}

class InvalidPaymentException extends MurabahaDomainException {
  final double paymentAmount;
  final double remainingBalance;

  const InvalidPaymentException({
    required this.paymentAmount,
    required this.remainingBalance,
  }) : super(
          'Payment $paymentAmount exceeds remaining balance $remainingBalance',
        );
}
```

## Part 3: try/catch/on/finally Patterns

### Typed Exception Catching

**MUST** use `on ExceptionType catch` (not bare `catch`) for typed exception handling.

```dart
// CORRECT: Typed exception catching (most specific first)
Future<ZakatTransaction> processPayment(String customerId, double amount) async {
  try {
    final customer = await customerRepository.findById(customerId);
    final transaction = await zakatService.recordPayment(customer, amount);
    return transaction;
  } on CustomerNotFoundException catch (e) {
    // Handle specific case
    throw ZakatProcessingException('Customer not found: ${e.customerId}');
  } on InsufficientWealthException catch (e, stackTrace) {
    // Log with stack trace for debugging
    log.warning('Insufficient wealth', e, stackTrace);
    rethrow; // Re-throw original exception
  } on NetworkException catch (e) {
    // Wrap infrastructure exception in domain exception
    throw ZakatServiceUnavailableException('Network error: ${e.message}');
  } finally {
    // Always executed - cleanup
    await auditLog.recordAttempt(customerId, amount);
  }
}

// WRONG: Catching all exceptions - too broad
try {
  await processPayment(customerId, amount);
} catch (e) {
  print('Error: $e'); // Catches everything - hides unexpected errors!
}

// WRONG: Catching Exception base class
try {
  await processPayment(customerId, amount);
} on Exception catch (e) {
  print('Exception: $e'); // Still too broad for domain handling
}
```

### Rethrow vs Throw

**MUST** use `rethrow` to propagate the original exception with original stack trace. Use `throw` only when wrapping in a new exception type.

```dart
Future<void> saveTransaction(ZakatTransaction tx) async {
  try {
    await database.insert(tx);
  } on DatabaseConnectionException {
    // CORRECT: rethrow preserves original stack trace
    rethrow;
  } on DatabaseConstraintException catch (e) {
    // CORRECT: throw wraps in domain exception with new context
    throw ZakatTransactionDuplicateException(
      transactionId: tx.transactionId,
      cause: e.message,
    );
  }
}

// WRONG: throw e loses the original stack trace
try {
  await database.insert(tx);
} on DatabaseConnectionException catch (e) {
  throw e; // WRONG: Use rethrow instead!
}
```

### Finally for Cleanup

**MUST** use `finally` for resource cleanup that must always execute.

```dart
Future<void> processZakatBatch(List<String> customerIds) async {
  final progressTracker = ProgressTracker(total: customerIds.length);

  try {
    for (final id in customerIds) {
      await processCustomerZakat(id);
      progressTracker.increment();
    }
  } on ZakatBatchException catch (e) {
    await notificationService.alertAdmin('Batch failed', e.message);
    rethrow;
  } finally {
    // Always closes resources regardless of success or failure
    await progressTracker.close();
    await auditLog.finalizeBatch(customerIds.length, progressTracker.processed);
  }
}
```

## Part 4: Result Type Pattern

### Manual Result Type

**SHOULD** use the Result type pattern for operations where failure is part of the domain, not exceptional.

```dart
// Sealed class Result type
sealed class Result<T> {}

class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

class Failure<T> extends Result<T> {
  final Exception exception;
  final StackTrace? stackTrace;
  const Failure(this.exception, [this.stackTrace]);
}

// Usage for domain operations that commonly fail
Result<double> calculateZakat(double wealth, double nisab) {
  if (wealth < 0) {
    return Failure(ZakatValidationException(
      field: 'wealth',
      message: 'Wealth cannot be negative',
      invalidValue: wealth,
    ));
  }
  if (nisab <= 0) {
    return Failure(ZakatValidationException(
      field: 'nisab',
      message: 'Nisab must be positive',
      invalidValue: nisab,
    ));
  }

  final amount = wealth >= nisab ? wealth * 0.025 : 0.0;
  return Success(amount);
}

// Exhaustive pattern matching with switch
final result = calculateZakat(wealth, nisab);
switch (result) {
  case Success(:final value):
    displayZakatAmount(value);
  case Failure(:final exception):
    displayError(exception.toString());
}
```

### Using the either Package

**MAY** use the `fpdart` package for functional Result/Either patterns when functional style is preferred.

```dart
// pubspec.yaml
// dependencies:
//   fpdart: ^1.1.0

import 'package:fpdart/fpdart.dart';

// Either<Left=failure, Right=success>
Either<ZakatValidationException, double> validateAndCalculate(
  double wealth,
  double nisab,
) {
  if (wealth < 0) {
    return left(ZakatValidationException(
      field: 'wealth',
      message: 'Wealth cannot be negative',
    ));
  }
  return right(wealth >= nisab ? wealth * 0.025 : 0.0);
}

// Usage with fold
final result = validateAndCalculate(wealth, nisab);
result.fold(
  (error) => displayError(error.message),
  (amount) => displayZakatAmount(amount),
);
```

## Part 5: Async Error Handling

### Future Error Handling

**MUST** handle Future errors with `try`/`catch` in `async` functions (not `.catchError()`).

```dart
// CORRECT: async/await with try/catch
Future<ZakatTransaction> fetchTransaction(String id) async {
  try {
    final response = await apiClient.get('/transactions/$id');
    if (response.statusCode == 404) {
      throw ZakatTransactionNotFoundException(id);
    }
    return ZakatTransaction.fromJson(response.body);
  } on ZakatTransactionNotFoundException {
    rethrow;
  } on FormatException catch (e) {
    throw ZakatParseException('Invalid transaction format: ${e.message}');
  }
}

// WRONG: .catchError() is error-prone and hard to read
Future<ZakatTransaction> fetchTransaction2(String id) {
  return apiClient.get('/transactions/$id')
    .then((r) => ZakatTransaction.fromJson(r.body))
    .catchError((e) { // Catches all types!
      throw ZakatParseException(e.toString());
    });
}
```

### Stream Error Handling

**MUST** handle stream errors with `handleError` or `try`/`catch` in `await for`.

```dart
// CORRECT: await for with try/catch
Future<void> processTransactionStream(
  Stream<ZakatTransaction> transactions,
) async {
  try {
    await for (final tx in transactions) {
      await processTransaction(tx);
    }
  } on ZakatProcessingException catch (e) {
    await notifyFailure(e);
    rethrow;
  }
}

// CORRECT: handleError for stream transformation
Stream<ZakatTransaction> safeTransactionStream(
  Stream<ZakatTransaction> source,
) {
  return source.handleError(
    (Object error, StackTrace stackTrace) {
      log.severe('Stream error', error, stackTrace);
      // Optionally rethrow or swallow
    },
    test: (e) => e is NetworkException,
  );
}
```

## Enforcement

Error handling standards are enforced through:

- **dart analyze** - `only_throw_errors`, `use_rethrow_when_possible` rules
- **Code reviews** - Verify typed exceptions, no bare `catch`
- **Testing** - Error paths must be tested (contributes to >=95% coverage)

**Pre-commit checklist**:

- [ ] All exceptions implement `Exception` (not extend `Error` for business logic)
- [ ] Typed `on ExceptionType catch` used (not bare `catch`)
- [ ] `rethrow` used (not `throw e`) when propagating without wrapping
- [ ] `finally` used for resource cleanup
- [ ] Async errors handled with `try`/`catch` (not `.catchError()`)
- [ ] Custom exceptions are immutable with `const` constructors

## Related Standards

- [Coding Standards](./coding-standards.md) - Exception naming conventions
- [Testing Standards](./testing-standards.md) - Testing error paths
- [API Standards](./api-standards.md) - HTTP error response mapping
- [Type Safety Standards](./type-safety-standards.md) - Sealed classes for Result types

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
