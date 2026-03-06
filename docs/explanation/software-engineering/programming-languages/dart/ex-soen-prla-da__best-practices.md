---
title: "Dart Best Practices"
description: Production-quality standards for Dart development covering project structure, naming, null safety, async patterns, error handling, testing, performance, and memory management
category: explanation
subcategory: prog-lang
tags:
  - dart
  - best-practices
  - production
  - quality
  - standards
  - project-structure
  - naming-conventions
  - performance
related:
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__anti-patterns.md
  - ./ex-soen-prla-da__null-safety.md
  - ./ex-soen-prla-da__testing.md
  - ./ex-soen-prla-da__performance.md
  - ../../../../../governance/development/pattern/functional-programming.md
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
updated: 2026-01-29
---

# Dart Best Practices

## Quick Reference

### Best Practices by Category

**Code Organization**:

- [Project Structure](#1-project-structure) - Standard directory layout
- [Naming Conventions](#2-naming-conventions) - lowerCamelCase, UpperCamelCase, snake_case
- [Import Organization](#3-import-organization) - Dart, package, relative imports

**Type Safety**:

- [Null Safety Practices](#4-null-safety-best-practices) - Sound null safety patterns
- [Type Annotations](#5-type-annotations) - When to annotate vs infer
- [Const and Final](#6-const-and-final) - Immutability preferences

**Async Programming**:

- [Async Patterns](#7-async-programming-patterns) - Future and Stream best practices
- [Error Handling](#8-error-handling) - Try-catch, custom exceptions
- [Stream Management](#9-stream-management) - Closing streams, broadcast vs single

**Code Quality**:

- [Testing Standards](#10-testing-standards) - Unit, widget, integration testing
- [Documentation](#11-dartdoc-documentation) - Writing effective dartdoc
- [Performance](#12-performance-optimization) - Profiling, optimization strategies
- [Memory Management](#13-memory-management) - Avoiding leaks, managing resources

**Dependencies**:

- [Dependency Management](#14-dependency-management) - pubspec.yaml, versioning
- [Package Publishing](#15-package-publishing) - Creating reusable packages

### Quick Standards

````dart
// ✅ Naming conventions
class ZakatCalculator {}           // UpperCamelCase for classes
void calculateZakat() {}           // lowerCamelCase for methods
const zakatRate = 0.025;           // lowerCamelCase for variables
enum DonationType {}               // UpperCamelCase for enums
mixin ValidationMixin {}           // UpperCamelCase + Mixin suffix

// ✅ Prefer final and const
final amount = 1000.0;             // Final for runtime constants
const rate = 0.025;                // Const for compile-time constants

// ✅ Null safety
String name = 'Ahmed';             // Non-nullable by default
String? optionalName;              // Nullable with ?

// ✅ Async patterns
Future<double> calculateAsync() async {
  final result = await fetchData();
  return result * 0.025;
}

// ✅ Error handling
try {
  await performOperation();
} on SpecificException catch (e) {
  log.error('Specific error: $e');
} catch (e, stackTrace) {
  log.error('General error: $e', stackTrace);
}

// ✅ Documentation
/// Calculates Zakat for given [wealth] and [nisab].
///
/// Returns the Zakat amount (2.5% of wealth) if wealth >= nisab,
/// otherwise returns 0.0.
///
/// Example:
/// ```dart
/// final zakat = calculateZakat(10000.0, 5000.0);
/// print(zakat); // 250.0
/// ```
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}
````

## Overview

Dart best practices are production-tested patterns that ensure maintainable, performant, and correct code. These practices align with Dart's philosophy of productivity, type safety, and performance optimization.

This guide covers **Dart 3.0+ best practices** for the Open Sharia Enterprise platform, emphasizing null safety, modern async patterns, and domain-driven financial applications.

### Why Best Practices Matter

- **Maintainability**: Code that's easy to read, understand, and modify
- **Correctness**: Type safety and null safety prevent runtime errors
- **Performance**: Optimized patterns for fast execution
- **Collaboration**: Team-wide consistency and shared understanding
- **Quality**: Automated testing and documentation standards

### Target Audience

This document targets developers building production Dart applications for the Open Sharia Enterprise platform, particularly those working on financial domain logic, mobile apps (Flutter), and server-side services.

## Code Organization

### 1. Project Structure

**Pattern**: Follow standard Dart package structure for consistency and tooling support.

**Standard Package Layout**:

```
zakat_calculator/
├── lib/
│   ├── src/
│   │   ├── models/
│   │   │   ├── zakat_calculation.dart
│   │   │   └── donation_record.dart
│   │   ├── services/
│   │   │   ├── zakat_service.dart
│   │   │   └── donation_service.dart
│   │   └── utils/
│   │       ├── validators.dart
│   │       └── formatters.dart
│   └── zakat_calculator.dart        # Public API
├── test/
│   ├── models/
│   │   └── zakat_calculation_test.dart
│   ├── services/
│   │   └── zakat_service_test.dart
│   └── utils/
│       └── validators_test.dart
├── bin/
│   └── zakat_calculator.dart        # CLI entry point (optional)
├── example/
│   └── zakat_calculator_example.dart
├── pubspec.yaml
├── README.md
├── CHANGELOG.md
└── LICENSE
```

**Directory Purposes**:

- `lib/` - Source code
  - `lib/src/` - Private implementation (not exported)
  - `lib/<package_name>.dart` - Public API (exports from src/)
- `test/` - Unit and integration tests (mirrors lib/ structure)
- `bin/` - Command-line executables
- `example/` - Usage examples
- Root files - Package metadata

**Public API Pattern**:

```dart
// lib/zakat_calculator.dart (public API)
library zakat_calculator;

// Export public interfaces
export 'src/models/zakat_calculation.dart';
export 'src/services/zakat_service.dart';

// Do NOT export internal utilities
// src/utils/ remains private
```

**Islamic Finance Example**:

```
sharia_finance/
├── lib/
│   ├── src/
│   │   ├── contracts/
│   │   │   ├── murabaha_contract.dart
│   │   │   ├── musharaka_contract.dart
│   │   │   └── ijara_contract.dart
│   │   ├── calculators/
│   │   │   ├── zakat_calculator.dart
│   │   │   ├── profit_calculator.dart
│   │   │   └── installment_calculator.dart
│   │   ├── validators/
│   │   │   ├── sharia_compliance_validator.dart
│   │   │   └── contract_validator.dart
│   │   └── models/
│   │       ├── money.dart
│   │       ├── payment.dart
│   │       └── transaction.dart
│   └── sharia_finance.dart          # Public API
├── test/
│   ├── contracts/
│   │   └── murabaha_contract_test.dart
│   ├── calculators/
│   │   └── zakat_calculator_test.dart
│   └── validators/
│       └── sharia_compliance_validator_test.dart
└── pubspec.yaml
```

### 2. Naming Conventions

**Pattern**: Follow Dart style guide for consistent naming.

**Class Names** - UpperCamelCase:

```dart
// ✅ Good
class ZakatCalculator {}
class MurabahaContract {}
class DonationService {}

// ❌ Bad
class zakat_calculator {}     // snake_case
class murabahacontract {}     // no separation
class donation_Service {}     // mixed
```

**Function and Variable Names** - lowerCamelCase:

```dart
// ✅ Good
void calculateZakat() {}
final donationAmount = 100.0;
String formatCurrency(double amount) {}

// ❌ Bad
void CalculateZakat() {}      // UpperCamelCase
final DonationAmount = 100.0; // UpperCamelCase
String format_currency() {}   // snake_case
```

**Constant Names** - lowerCamelCase:

```dart
// ✅ Good
const zakatRate = 0.025;
const nisabThreshold = 5000.0;
const maxInstallments = 12;

// ❌ Bad
const ZAKAT_RATE = 0.025;     // SCREAMING_SNAKE_CASE (old style)
const NisabThreshold = 5000.0; // UpperCamelCase
```

**File Names** - snake_case:

```dart
// ✅ Good file names
zakat_calculator.dart
murabaha_contract.dart
donation_service.dart

// ❌ Bad file names
ZakatCalculator.dart          // UpperCamelCase
murabahaContract.dart         // lowerCamelCase
donation-service.dart         // kebab-case
```

**Private Members** - Prefix with `_`:

```dart
class ZakatCalculator {
  // Private field
  final double _nisab = 5000.0;

  // Private method
  double _calculateBase(double wealth) {
    return wealth * 0.025;
  }

  // Public method
  double calculate(double wealth) {
    return wealth >= _nisab ? _calculateBase(wealth) : 0.0;
  }
}
```

**Boolean Names** - Use positive predicates:

```dart
// ✅ Good
bool isEligible;
bool hasZakatObligation;
bool canProcessDonation;

// ❌ Avoid negative predicates
bool isNotEligible;           // Use !isEligible instead
bool doesNotHaveObligation;   // Confusing
```

**Islamic Finance Example**:

```dart
// File: sharia_compliance_validator.dart

class ShariaComplianceValidator {
  // Constants - lowerCamelCase
  static const prohibitedSectors = ['alcohol', 'gambling', 'interest'];
  static const minEquityRatio = 0.33;

  // Private fields
  final List<String> _validatedAssets = [];

  // Public methods - lowerCamelCase
  bool isCompliant(String sector) {
    return !prohibitedSectors.contains(sector);
  }

  bool hasMinimumEquity(double equity, double totalAssets) {
    return _calculateRatio(equity, totalAssets) >= minEquityRatio;
  }

  // Private methods
  double _calculateRatio(double equity, double total) {
    return total > 0 ? equity / total : 0.0;
  }
}
```

### 3. Import Organization

**Pattern**: Organize imports in consistent order for readability.

**Import Order**:

1. Dart SDK imports (`dart:*`)
2. External package imports (`package:*`)
3. Internal package imports (`package:your_package/*`)
4. Relative imports

**Example**:

```dart
// 1. Dart SDK imports
import 'dart:async';
import 'dart:convert';

// 2. External package imports
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

// 3. Internal package imports
import 'package:zakat_calculator/src/models/zakat_calculation.dart';
import 'package:zakat_calculator/src/services/zakat_service.dart';

// 4. Relative imports
import '../utils/validators.dart';
import 'donation_record.dart';
```

**Prefer Package Imports Over Relative**:

```dart
// ✅ Good - package import
import 'package:zakat_calculator/src/models/money.dart';

// ❌ Avoid - relative import (brittle, hard to refactor)
import '../../models/money.dart';
```

**Use `show` and `hide` Sparingly**:

```dart
// ✅ Good - import entire library
import 'package:logging/logging.dart';

// ⚠️ Use `show` only when necessary (avoiding conflicts)
import 'package:zakat_calculator/src/models/payment.dart' show Payment;

// ⚠️ Use `hide` to exclude specific members
import 'package:collection/collection.dart' hide UnmodifiableListView;
```

**Islamic Finance Example**:

```dart
// File: murabaha_service.dart

// Dart SDK
import 'dart:async';
import 'dart:convert';

// External packages
import 'package:logging/logging.dart';
import 'package:uuid/uuid.dart';

// Internal package
import 'package:sharia_finance/src/contracts/murabaha_contract.dart';
import 'package:sharia_finance/src/models/money.dart';
import 'package:sharia_finance/src/models/payment.dart';
import 'package:sharia_finance/src/validators/contract_validator.dart';

// Relative imports (minimal)
import '../utils/date_utils.dart';

class MurabahaService {
  final _log = Logger('MurabahaService');
  final _uuid = Uuid();

  // Implementation...
}
```

## Type Safety

### 4. Null Safety Best Practices

**Pattern**: Leverage Dart's sound null safety to eliminate null reference errors.

**Prefer Non-Nullable by Default**:

```dart
// ✅ Good - non-nullable
class Donation {
  final String donorId;
  final double amount;
  final DateTime timestamp;

  Donation({
    required this.donorId,
    required this.amount,
    required this.timestamp,
  });
}

// ❌ Bad - unnecessary nullable
class Donation {
  final String? donorId;  // Should be required
  final double? amount;   // Should be required
  final DateTime? timestamp;
}
```

**Use `late` for Deferred Initialization**:

```dart
// ✅ Good - late for guaranteed initialization
class DatabaseService {
  late final String connectionString;

  Future<void> initialize(String config) async {
    connectionString = await loadConfig(config);
  }

  Future<String> loadConfig(String path) async {
    // Load from file/network
    return 'connection-string';
  }
}

// ❌ Bad - nullable requires checks everywhere
class DatabaseService {
  String? connectionString;

  void query(String sql) {
    if (connectionString != null) {
      // Must check every time
    }
  }
}
```

**Avoid Null Assertion (`!`) Unless Absolutely Certain**:

```dart
// ❌ Bad - risky null assertion
String? getName() => null;

void printName() {
  final name = getName()!; // Runtime error if null
  print(name);
}

// ✅ Good - null-aware operators
void printNameSafely() {
  final name = getName() ?? 'Guest';
  print(name);
}

// ✅ Good - null check
void printNameWithCheck() {
  final name = getName();
  if (name != null) {
    print(name);
  }
}
```

**Use Definite Assignment**:

```dart
// ✅ Good - Dart knows value is assigned
String getMessage(bool condition) {
  String message;

  if (condition) {
    message = 'Success';
  } else {
    message = 'Failure';
  }

  return message; // ✅ Definite assignment - no error
}

// ❌ Bad - potentially unassigned
String getMessageBad(bool condition) {
  String message;

  if (condition) {
    message = 'Success';
  }

  // return message; // ❌ Compile error - might be uninitialized
}
```

**Islamic Finance Example**:

```dart
class ZakatCalculation {
  // Non-nullable - always required
  final double wealth;
  final double nisab;
  final DateTime calculationDate;

  // Nullable - optional notes
  final String? notes;

  // Late - initialized after construction
  late final double zakatAmount;
  late final bool isEligible;

  ZakatCalculation({
    required this.wealth,
    required this.nisab,
    this.notes,
    DateTime? calculationDate,
  }) : calculationDate = calculationDate ?? DateTime.now() {
    // Initialize late fields
    isEligible = wealth >= nisab;
    zakatAmount = isEligible ? wealth * 0.025 : 0.0;
  }

  String getReport() {
    // Safe access - notes is nullable
    final notesSection = notes != null ? '\nNotes: $notes' : '';

    return '''
Zakat Calculation
-----------------
Wealth: \$${wealth.toStringAsFixed(2)}
Nisab: \$${nisab.toStringAsFixed(2)}
Eligible: ${isEligible ? 'Yes' : 'No'}
Zakat Amount: \$${zakatAmount.toStringAsFixed(2)}$notesSection
''';
  }
}
```

### 5. Type Annotations

**Pattern**: Balance explicit type annotations with type inference.

**When to Annotate**:

```dart
// ✅ Public APIs - always annotate
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// ✅ Class fields - usually annotate
class Donation {
  final String donorId;
  final double amount;
  final DateTime timestamp;
}

// ✅ Complex types - annotate for clarity
Map<String, List<Donation>> groupDonationsByDonor(
  List<Donation> donations,
) {
  // Implementation
  return {};
}
```

**When to Infer**:

```dart
// ✅ Local variables - let Dart infer
void processDonations(List<Donation> donations) {
  final total = donations.fold(0.0, (sum, d) => sum + d.amount);
  final count = donations.length;
  final average = total / count;

  // Types are obvious from context
}

// ❌ Over-annotation - redundant
void processDonationsVerbose(List<Donation> donations) {
  final double total = donations.fold(0.0, (sum, d) => sum + d.amount);
  final int count = donations.length;
  final double average = total / count;
}
```

**Prefer `var` for Locals, `final` for Immutables**:

```dart
// ✅ Good - prefer final
void calculate() {
  final amount = 1000.0;     // Won't change
  final nisab = 5000.0;      // Won't change
  final result = amount * 0.025;

  // Use var only if reassigning
  var runningTotal = 0.0;
  for (var i = 0; i < 10; i++) {
    runningTotal += i;
  }
}

// ❌ Avoid var when final works
void calculateBad() {
  var amount = 1000.0;       // Never reassigned - use final
  var nisab = 5000.0;        // Never reassigned - use final
}
```

**Islamic Finance Example**:

```dart
class MurabahaCalculator {
  // Explicit types for public API
  double calculateTotalAmount(double assetCost, double profitRate) {
    return assetCost * (1 + profitRate);
  }

  List<Payment> generatePaymentSchedule({
    required double assetCost,
    required double profitRate,
    required int installmentMonths,
  }) {
    // Infer local variables
    final totalAmount = calculateTotalAmount(assetCost, profitRate);
    final monthlyPayment = totalAmount / installmentMonths;

    // Type annotation for clarity
    return List.generate(
      installmentMonths,
      (index) => Payment(
        amount: monthlyPayment,
        dueDate: DateTime.now().add(Duration(days: 30 * (index + 1))),
      ),
    );
  }
}

class Payment {
  final double amount;
  final DateTime dueDate;

  Payment({required this.amount, required this.dueDate});
}
```

### 6. Const and Final

**Pattern**: Prefer immutability with `const` and `final`.

**Prefer `const` for Compile-Time Constants**:

```dart
// ✅ Good - const for compile-time values
class ZakatConstants {
  static const zakatRate = 0.025;
  static const nisabGoldGrams = 85.0;
  static const nisabSilverGrams = 595.0;

  static const prohibitedAssets = [
    'alcohol',
    'gambling',
    'interest-bearing',
  ];
}

// ❌ Bad - final when const works
class ZakatConstantsBad {
  static final zakatRate = 0.025;  // Use const instead
}
```

**Use `final` for Runtime Constants**:

```dart
class DonationService {
  // Runtime constant - cannot be const
  final String serviceId = Uuid().v4();
  final DateTime createdAt = DateTime.now();

  // Compile-time constant - use const
  static const maxDonationAmount = 1000000.0;
}
```

**Const Constructors for Immutable Classes**:

```dart
// ✅ Good - const constructor
class Money {
  final double amount;
  final String currency;

  const Money(this.amount, this.currency);
}

// Usage - compile-time constant
const nisab = Money(5000.0, 'USD');

// ❌ Bad - missing const constructor
class Money {
  final double amount;
  final String currency;

  Money(this.amount, this.currency); // Not const
}

// const nisab = Money(5000.0, 'USD'); // ❌ Error - not const constructor
```

**Islamic Finance Example**:

```dart
class ShariaComplianceRules {
  // Compile-time constants
  static const prohibitedSectors = [
    'alcohol',
    'gambling',
    'tobacco',
    'weapons',
    'interest-based_finance',
  ];

  static const maxDebtRatio = 0.33;
  static const minEquityRatio = 0.33;

  // Runtime constants
  final String rulesetVersion;
  final DateTime effectiveDate;

  ShariaComplianceRules()
      : rulesetVersion = '2.0',
        effectiveDate = DateTime.now();

  bool isCompliant(String sector, double debtRatio, double equityRatio) {
    return !prohibitedSectors.contains(sector) &&
           debtRatio <= maxDebtRatio &&
           equityRatio >= minEquityRatio;
  }
}

// Const value objects
class NisabThreshold {
  final double goldGrams;
  final double silverGrams;

  const NisabThreshold(this.goldGrams, this.silverGrams);

  static const hanafi = NisabThreshold(87.48, 612.36);
  static const shafi = NisabThreshold(85.0, 595.0);
}

// Usage
const threshold = NisabThreshold.hanafi; // Compile-time constant
```

## Async Programming

### 7. Async Programming Patterns

**Pattern**: Use async/await for readable asynchronous code.

**Prefer Async/Await Over Then**:

```dart
// ✅ Good - async/await
Future<double> calculateZakatAsync(double wealth, double nisab) async {
  final exchangeRate = await fetchExchangeRate();
  final adjustedWealth = wealth * exchangeRate;
  return adjustedWealth >= nisab ? adjustedWealth * 0.025 : 0.0;
}

// ❌ Avoid - then chains (less readable)
Future<double> calculateZakatThen(double wealth, double nisab) {
  return fetchExchangeRate().then((rate) {
    final adjustedWealth = wealth * rate;
    return adjustedWealth >= nisab ? adjustedWealth * 0.025 : 0.0;
  });
}
```

**Always Await Futures**:

```dart
// ❌ Bad - forgotten await
Future<void> processDonation(Donation donation) async {
  saveDonation(donation); // ❌ Future ignored!
  print('Donation processed');
}

// ✅ Good - await the future
Future<void> processDonation(Donation donation) async {
  await saveDonation(donation);
  print('Donation processed');
}
```

**Use `Future.wait` for Parallel Operations**:

```dart
// ✅ Good - parallel execution
Future<void> loadAllData() async {
  final results = await Future.wait([
    fetchDonations(),
    fetchDonors(),
    fetchRecipients(),
  ]);

  final donations = results[0] as List<Donation>;
  final donors = results[1] as List<Donor>;
  final recipients = results[2] as List<Recipient>;

  // Process results
}

// ❌ Bad - sequential (slower)
Future<void> loadAllDataSequential() async {
  final donations = await fetchDonations();
  final donors = await fetchDonors();
  final recipients = await fetchRecipients();

  // Takes 3x longer if each takes 1 second
}
```

**Handle Errors in Async Code**:

```dart
// ✅ Good - explicit error handling
Future<void> processDonationSafely(Donation donation) async {
  try {
    await saveDonation(donation);
    await sendConfirmationEmail(donation.donorId);
  } on NetworkException catch (e) {
    log.error('Network error: $e');
    rethrow;
  } catch (e, stackTrace) {
    log.error('Unexpected error: $e', stackTrace);
  }
}
```

**Islamic Finance Example**:

```dart
class ZakatCalculationService {
  final ApiClient _apiClient;
  final Logger _log;

  ZakatCalculationService(this._apiClient, this._log);

  Future<ZakatReport> generateReport({
    required String userId,
    required int year,
  }) async {
    try {
      // Parallel data fetching
      final results = await Future.wait([
        _apiClient.fetchUserWealth(userId, year),
        _apiClient.fetchNisabThreshold(year),
        _apiClient.fetchExchangeRates(year),
      ]);

      final wealth = results[0] as double;
      final nisab = results[1] as double;
      final exchangeRates = results[2] as Map<String, double>;

      // Sequential calculation
      final adjustedWealth = await _adjustForCurrency(wealth, exchangeRates);
      final zakatAmount = await _calculateZakat(adjustedWealth, nisab);

      return ZakatReport(
        userId: userId,
        year: year,
        wealth: adjustedWealth,
        nisab: nisab,
        zakatAmount: zakatAmount,
        generatedAt: DateTime.now(),
      );
    } on ApiException catch (e) {
      _log.error('API error generating Zakat report: $e');
      rethrow;
    } catch (e, stackTrace) {
      _log.error('Unexpected error: $e', stackTrace);
      throw ZakatCalculationException('Failed to generate report');
    }
  }

  Future<double> _adjustForCurrency(
    double amount,
    Map<String, double> rates,
  ) async {
    // Currency adjustment logic
    return amount;
  }

  Future<double> _calculateZakat(double wealth, double nisab) async {
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}
```

### 8. Error Handling

**Pattern**: Use specific exception types and proper try-catch patterns.

**Create Custom Exceptions**:

```dart
// ✅ Good - specific exception types
class ZakatCalculationException implements Exception {
  final String message;
  final Object? cause;

  ZakatCalculationException(this.message, [this.cause]);

  @override
  String toString() => 'ZakatCalculationException: $message${cause != null ? ' (caused by: $cause)' : ''}';
}

class InsufficientWealthException implements Exception {
  final double wealth;
  final double nisab;

  InsufficientWealthException(this.wealth, this.nisab);

  @override
  String toString() =>
      'Wealth \$$wealth is below nisab threshold \$$nisab';
}

// ❌ Bad - generic exceptions
throw Exception('Something went wrong'); // Too generic
```

**Catch Specific Exceptions First**:

```dart
// ✅ Good - specific to general
Future<void> processDonation(Donation donation) async {
  try {
    await saveDonation(donation);
  } on NetworkException catch (e) {
    log.warning('Network error - will retry: $e');
    await retryWithBackoff(() => saveDonation(donation));
  } on ValidationException catch (e) {
    log.error('Invalid donation data: $e');
    rethrow;
  } catch (e, stackTrace) {
    log.error('Unexpected error: $e', stackTrace);
  }
}

// ❌ Bad - catches everything first
Future<void> processDonationBad(Donation donation) async {
  try {
    await saveDonation(donation);
  } catch (e) {
    // Catches everything - can't handle specifically
    log.error('Error: $e');
  } on NetworkException catch (e) {
    // Never reached!
  }
}
```

**Include Stack Traces for Debugging**:

```dart
// ✅ Good - capture stack trace
Future<void> processPayment(Payment payment) async {
  try {
    await savePayment(payment);
  } catch (error, stackTrace) {
    log.error('Failed to process payment', error, stackTrace);
    rethrow;
  }
}

// ❌ Bad - no stack trace
Future<void> processPaymentBad(Payment payment) async {
  try {
    await savePayment(payment);
  } catch (error) {
    log.error('Failed to process payment: $error'); // Missing context
  }
}
```

**Islamic Finance Example**:

```dart
// Custom exceptions
class ShariaComplianceException implements Exception {
  final String reason;
  final List<String> violations;

  ShariaComplianceException(this.reason, this.violations);

  @override
  String toString() =>
      'Sharia compliance violation: $reason\nViolations: ${violations.join(', ')}';
}

class ContractValidationException implements Exception {
  final String contractId;
  final Map<String, String> errors;

  ContractValidationException(this.contractId, this.errors);

  @override
  String toString() =>
      'Contract $contractId validation failed: ${errors.entries.map((e) => '${e.key}: ${e.value}').join(', ')}';
}

// Service with error handling
class MurabahaContractService {
  final Logger _log;
  final ShariaComplianceValidator _validator;

  MurabahaContractService(this._log, this._validator);

  Future<MurabahaContract> createContract({
    required String customerId,
    required double assetCost,
    required double profitRate,
    required int installmentMonths,
  }) async {
    try {
      // Validate Sharia compliance
      final complianceResult = await _validator.validateMurabaha(
        assetCost: assetCost,
        profitRate: profitRate,
      );

      if (!complianceResult.isCompliant) {
        throw ShariaComplianceException(
          'Murabaha contract violates Sharia principles',
          complianceResult.violations,
        );
      }

      // Create contract
      final contract = MurabahaContract(
        contractId: Uuid().v4(),
        customerId: customerId,
        assetCost: assetCost,
        profitRate: profitRate,
        installmentMonths: installmentMonths,
        createdAt: DateTime.now(),
      );

      // Validate business rules
      final validationErrors = _validateBusinessRules(contract);
      if (validationErrors.isNotEmpty) {
        throw ContractValidationException(
          contract.contractId,
          validationErrors,
        );
      }

      // Save contract
      await _saveContract(contract);

      _log.info('Created Murabaha contract: ${contract.contractId}');
      return contract;

    } on ShariaComplianceException catch (e) {
      _log.error('Sharia compliance failure: $e');
      rethrow;
    } on ContractValidationException catch (e) {
      _log.error('Contract validation failure: $e');
      rethrow;
    } on DatabaseException catch (e, stackTrace) {
      _log.error('Database error creating contract', e, stackTrace);
      throw MurabahaContractException(
        'Failed to save contract',
        e,
      );
    } catch (e, stackTrace) {
      _log.error('Unexpected error creating contract', e, stackTrace);
      throw MurabahaContractException(
        'Failed to create Murabaha contract',
        e,
      );
    }
  }

  Map<String, String> _validateBusinessRules(MurabahaContract contract) {
    final errors = <String, String>{};

    if (contract.assetCost <= 0) {
      errors['assetCost'] = 'Asset cost must be positive';
    }

    if (contract.profitRate < 0 || contract.profitRate > 0.50) {
      errors['profitRate'] = 'Profit rate must be between 0% and 50%';
    }

    if (contract.installmentMonths <= 0 || contract.installmentMonths > 360) {
      errors['installmentMonths'] = 'Installment months must be between 1 and 360';
    }

    return errors;
  }

  Future<void> _saveContract(MurabahaContract contract) async {
    // Database save logic
  }
}

class MurabahaContractException implements Exception {
  final String message;
  final Object? cause;

  MurabahaContractException(this.message, [this.cause]);

  @override
  String toString() =>
      'MurabahaContractException: $message${cause != null ? ' (caused by: $cause)' : ''}';
}
```

### 9. Stream Management

**Pattern**: Properly manage Stream lifecycles to avoid memory leaks.

**Always Close Streams and StreamControllers**:

```dart
// ✅ Good - close StreamController
class DonationStream {
  final _controller = StreamController<Donation>();

  Stream<Donation> get stream => _controller.stream;

  void add(Donation donation) => _controller.add(donation);

  Future<void> dispose() async {
    await _controller.close();
  }
}

// Usage
final donationStream = DonationStream();
// Use stream...
await donationStream.dispose(); // ✅ Always close
```

**Cancel Stream Subscriptions**:

```dart
// ✅ Good - cancel subscription
class DonationListener {
  StreamSubscription<Donation>? _subscription;

  void startListening(Stream<Donation> stream) {
    _subscription = stream.listen((donation) {
      print('Received donation: ${donation.amount}');
    });
  }

  Future<void> stopListening() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
```

**Use Broadcast Streams for Multiple Listeners**:

```dart
// ✅ Good - broadcast stream for multiple listeners
class DonationBroadcaster {
  final _controller = StreamController<Donation>.broadcast();

  Stream<Donation> get stream => _controller.stream;

  void addDonation(Donation donation) => _controller.add(donation);

  Future<void> dispose() async {
    await _controller.close();
  }
}

// Multiple listeners
final broadcaster = DonationBroadcaster();

broadcaster.stream.listen((d) => print('Listener 1: $d'));
broadcaster.stream.listen((d) => print('Listener 2: $d'));

broadcaster.addDonation(Donation(100.0));
// Both listeners receive the donation
```

**Islamic Finance Example**:

```dart
class ZakatCalculationStream {
  final _calculationController = StreamController<ZakatCalculation>.broadcast();
  final _errorController = StreamController<ZakatCalculationError>();

  Stream<ZakatCalculation> get calculationStream => _calculationController.stream;
  Stream<ZakatCalculationError> get errorStream => _errorController.stream;

  Future<void> processCalculations(List<UserWealth> wealthData) async {
    try {
      for (final wealth in wealthData) {
        try {
          final calculation = await _calculateZakat(wealth);
          _calculationController.add(calculation);
        } on ZakatCalculationException catch (e) {
          _errorController.add(ZakatCalculationError(
            userId: wealth.userId,
            error: e.toString(),
          ));
        }
      }
    } finally {
      // Don't close here if stream is reusable
    }
  }

  Future<ZakatCalculation> _calculateZakat(UserWealth wealth) async {
    // Calculation logic
    return ZakatCalculation(
      userId: wealth.userId,
      wealth: wealth.totalWealth,
      nisab: 5000.0,
      zakatAmount: wealth.totalWealth * 0.025,
    );
  }

  Future<void> dispose() async {
    await _calculationController.close();
    await _errorController.close();
  }
}

class ZakatCalculation {
  final String userId;
  final double wealth;
  final double nisab;
  final double zakatAmount;

  ZakatCalculation({
    required this.userId,
    required this.wealth,
    required this.nisab,
    required this.zakatAmount,
  });
}

class ZakatCalculationError {
  final String userId;
  final String error;

  ZakatCalculationError({required this.userId, required this.error});
}

class UserWealth {
  final String userId;
  final double totalWealth;

  UserWealth({required this.userId, required this.totalWealth});
}
```

## Code Quality

### 10. Testing Standards

**Pattern**: Write comprehensive tests using package:test.

**Unit Test Structure**:

```dart
import 'package:test/test.dart';
import 'package:zakat_calculator/zakat_calculator.dart';

void main() {
  group('ZakatCalculator', () {
    late ZakatCalculator calculator;

    setUp(() {
      calculator = ZakatCalculator(nisab: 5000.0);
    });

    test('calculates Zakat when wealth >= nisab', () {
      final result = calculator.calculate(10000.0);
      expect(result, equals(250.0)); // 2.5% of 10000
    });

    test('returns 0 when wealth < nisab', () {
      final result = calculator.calculate(3000.0);
      expect(result, equals(0.0));
    });

    test('throws ArgumentError for negative wealth', () {
      expect(
        () => calculator.calculate(-1000.0),
        throwsA(isA<ArgumentError>()),
      );
    });
  });
}
```

**Test Coverage Goals**:

- Unit tests: >85% code coverage
- Critical business logic: 100% coverage
- Integration tests for workflows
- Widget tests for Flutter UI

**Islamic Finance Example**:

```dart
// test/murabaha_calculator_test.dart
import 'package:test/test.dart';
import 'package:sharia_finance/sharia_finance.dart';

void main() {
  group('MurabahaCalculator', () {
    late MurabahaCalculator calculator;

    setUp(() {
      calculator = MurabahaCalculator();
    });

    group('calculateTotalAmount', () {
      test('calculates correct total with profit', () {
        final total = calculator.calculateTotalAmount(
          assetCost: 10000.0,
          profitRate: 0.10,
        );

        expect(total, equals(11000.0));
      });

      test('handles zero profit rate', () {
        final total = calculator.calculateTotalAmount(
          assetCost: 10000.0,
          profitRate: 0.0,
        );

        expect(total, equals(10000.0));
      });

      test('throws on negative asset cost', () {
        expect(
          () => calculator.calculateTotalAmount(
            assetCost: -1000.0,
            profitRate: 0.10,
          ),
          throwsA(isA<ArgumentError>()),
        );
      });
    });

    group('generatePaymentSchedule', () {
      test('generates correct number of payments', () {
        final schedule = calculator.generatePaymentSchedule(
          assetCost: 12000.0,
          profitRate: 0.10,
          installmentMonths: 12,
        );

        expect(schedule.length, equals(12));
      });

      test('calculates equal monthly payments', () {
        final schedule = calculator.generatePaymentSchedule(
          assetCost: 12000.0,
          profitRate: 0.10,
          installmentMonths: 12,
        );

        final expectedMonthlyPayment = 13200.0 / 12; // (12000 * 1.10) / 12

        for (final payment in schedule) {
          expect(payment.amount, equals(expectedMonthlyPayment));
        }
      });

      test('schedules payments 30 days apart', () {
        final schedule = calculator.generatePaymentSchedule(
          assetCost: 12000.0,
          profitRate: 0.10,
          installmentMonths: 3,
        );

        final now = DateTime.now();
        expect(
          schedule[0].dueDate.difference(now).inDays,
          closeTo(30, 1),
        );
        expect(
          schedule[1].dueDate.difference(now).inDays,
          closeTo(60, 1),
        );
        expect(
          schedule[2].dueDate.difference(now).inDays,
          closeTo(90, 1),
        );
      });
    });

    group('ShariaComplianceValidator', () {
      late ShariaComplianceValidator validator;

      setUp(() {
        validator = ShariaComplianceValidator();
      });

      test('rejects prohibited sectors', () {
        expect(validator.isCompliant('alcohol'), isFalse);
        expect(validator.isCompliant('gambling'), isFalse);
        expect(validator.isCompliant('interest'), isFalse);
      });

      test('approves compliant sectors', () {
        expect(validator.isCompliant('technology'), isTrue);
        expect(validator.isCompliant('agriculture'), isTrue);
        expect(validator.isCompliant('manufacturing'), isTrue);
      });

      test('validates minimum equity ratio', () {
        expect(
          validator.hasMinimumEquity(
            equity: 5000.0,
            totalAssets: 10000.0,
          ),
          isTrue, // 50% > 33% minimum
        );

        expect(
          validator.hasMinimumEquity(
            equity: 2000.0,
            totalAssets: 10000.0,
          ),
          isFalse, // 20% < 33% minimum
        );
      });
    });
  });
}
```

### 11. Dartdoc Documentation

**Pattern**: Write clear, comprehensive documentation using dartdoc.

**Document Public APIs**:

````dart
/// Calculates Zakat for given [wealth] and [nisab] threshold.
///
/// Zakat (2.5%) is obligatory when [wealth] >= [nisab].
///
/// Example:
/// ```dart
/// final zakat = calculateZakat(10000.0, 5000.0);
/// print(zakat); // 250.0
/// ```
///
/// Throws [ArgumentError] if [wealth] or [nisab] is negative.
double calculateZakat(double wealth, double nisab) {
  if (wealth < 0 || nisab < 0) {
    throw ArgumentError('Wealth and nisab must be non-negative');
  }

  return wealth >= nisab ? wealth * 0.025 : 0.0;
}
````

**Document Classes and Members**:

````dart
/// Represents a Murabaha contract in Islamic finance.
///
/// Murabaha is a cost-plus financing structure where the financier purchases
/// an asset and sells it to the customer at cost plus an agreed profit margin,
/// payable in installments.
///
/// Example:
/// ```dart
/// final contract = MurabahaContract(
///   contractId: 'MUR-001',
///   assetCost: 10000.0,
///   profitRate: 0.10,
///   installmentMonths: 12,
/// );
///
/// print(contract.totalAmount); // 11000.0
/// print(contract.monthlyPayment); // 916.67
/// ```
class MurabahaContract {
  /// Unique identifier for this contract.
  final String contractId;

  /// Original cost of the asset being financed.
  final double assetCost;

  /// Profit rate applied to the asset cost (as decimal, e.g., 0.10 for 10%).
  final double profitRate;

  /// Number of monthly installments for repayment.
  final int installmentMonths;

  /// Creates a new Murabaha contract.
  ///
  /// Throws [ArgumentError] if [assetCost] is negative,
  /// [profitRate] is negative or > 1.0, or [installmentMonths] is <= 0.
  MurabahaContract({
    required this.contractId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
  }) {
    if (assetCost < 0) {
      throw ArgumentError('Asset cost must be non-negative');
    }
    if (profitRate < 0 || profitRate > 1.0) {
      throw ArgumentError('Profit rate must be between 0 and 1');
    }
    if (installmentMonths <= 0) {
      throw ArgumentError('Installment months must be positive');
    }
  }

  /// Total amount to be repaid (asset cost + profit).
  double get totalAmount => assetCost * (1 + profitRate);

  /// Monthly payment amount.
  double get monthlyPayment => totalAmount / installmentMonths;
}
````

### 12. Performance Optimization

**Pattern**: Profile before optimizing, focus on algorithmic improvements.

**Use Profiling Tools**:

```bash
# Profile Dart application
dart run --observe myapp.dart

# Profile Flutter application
flutter run --profile
```

**Optimize Collection Operations**:

```dart
// ❌ Bad - repeated lookups
List<Donation> filterDonationsByDonor(
  List<Donation> donations,
  List<String> targetDonorIds,
) {
  return donations.where((d) => targetDonorIds.contains(d.donorId)).toList();
  // O(n * m) - contains() is O(m) for each donation
}

// ✅ Good - use Set for O(1) lookups
List<Donation> filterDonationsByDonorOptimized(
  List<Donation> donations,
  List<String> targetDonorIds,
) {
  final donorIdSet = targetDonorIds.toSet(); // O(m)
  return donations.where((d) => donorIdSet.contains(d.donorId)).toList();
  // O(n + m) - much faster for large lists
}
```

**Avoid Unnecessary Computation**:

```dart
// ❌ Bad - recomputes on every access
class ZakatCalculator {
  double wealth;
  double nisab;

  ZakatCalculator(this.wealth, this.nisab);

  double get zakatAmount {
    // Recomputed every time!
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}

// ✅ Good - compute once
class ZakatCalculator {
  final double wealth;
  final double nisab;
  late final double zakatAmount;

  ZakatCalculator(this.wealth, this.nisab) {
    zakatAmount = wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}
```

### 13. Memory Management

**Pattern**: Avoid memory leaks by properly disposing resources.

**Close Streams and Controllers**:

```dart
// ✅ Good - dispose pattern
class DonationManager {
  final _controller = StreamController<Donation>();
  Stream<Donation> get donationStream => _controller.stream;

  void addDonation(Donation donation) {
    _controller.add(donation);
  }

  Future<void> dispose() async {
    await _controller.close();
  }
}
```

**Cancel Timers**:

```dart
// ✅ Good - cancel timer
class PeriodicZakatReminder {
  Timer? _timer;

  void startReminders() {
    _timer = Timer.periodic(Duration(days: 30), (timer) {
      sendZakatReminder();
    });
  }

  void stopReminders() {
    _timer?.cancel();
    _timer = null;
  }
}
```

### 14. Dependency Management

**Pattern**: Use semantic versioning and lock files for reproducible builds.

**pubspec.yaml**:

```yaml
name: zakat_calculator
version: 1.0.0
description: Zakat calculation library for Islamic finance
environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  http: ^1.1.0 # Compatible with 1.x
  logging: ^1.2.0
  uuid: ^4.0.0

dev_dependencies:
  test: ^1.24.0
  lints: ^3.0.0
  build_runner: ^2.4.0
```

**Always Commit pubspec.lock**:

```bash
# ✅ Good - lock file ensures reproducible builds
git add pubspec.lock
git commit -m "Lock dependencies"
```

### 15. Package Publishing

**Pattern**: Follow pub.dev conventions for publishable packages.

**Package Checklist**:

- ✅ README.md with usage examples
- ✅ CHANGELOG.md tracking versions
- ✅ LICENSE file
- ✅ pubspec.yaml with complete metadata
- ✅ example/ directory with working examples
- ✅ test/ directory with comprehensive tests
- ✅ Documentation for all public APIs
- ✅ `dart pub publish --dry-run` passes
- ✅ Analysis warnings resolved

**Example pubspec.yaml**:

```yaml
name: sharia_finance
version: 1.0.0
description: Dart library for Sharia-compliant financial calculations including Zakat, Murabaha, and Musharaka
repository: https://github.com/your-org/sharia-finance
homepage: https://shariafinance.dev

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  logging: ^1.2.0
  meta: ^1.11.0

dev_dependencies:
  test: ^1.24.0
  lints: ^3.0.0

topics:
  - finance
  - islamic-finance
  - zakat
  - murabaha
```

## Related Documentation

**Core Dart**:

- [Dart Idioms](./ex-soen-prla-da__idioms.md) - Language patterns
- [Dart Anti-Patterns](./ex-soen-prla-da__anti-patterns.md) - Common mistakes

**Specialized Topics**:

- [Null Safety](./ex-soen-prla-da__null-safety.md) - Sound null safety
- [Async Programming](./ex-soen-prla-da__async-programming.md) - Future and Stream
- [Testing](./ex-soen-prla-da__testing.md) - Testing strategies
- [Performance](./ex-soen-prla-da__performance.md) - Optimization
- [Error Handling](./ex-soen-prla-da__error-handling.md) - Exception handling

**Platform**:

- [Programming Languages Index](../README.md) - Parent languages documentation
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md) - Cross-language FP principles

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (null safety, modern features)
