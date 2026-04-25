---
title: "Dart Coding Standards"
description: Authoritative OSE Platform Dart coding standards (idioms, best practices, anti-patterns, null-safety, dart-3)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - coding-standards
  - idioms
  - best-practices
  - anti-patterns
  - null-safety
  - dart-3
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to apply Dart in THIS codebase, not WHAT Dart is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Dart development in the OSE Platform. These are prescriptive rules that MUST be followed across all Dart projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Dart developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform idioms, naming conventions, package organization, best practices, and anti-patterns to avoid

## Software Engineering Principles

These standards enforce the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Dart Implements**:

- `dart format` for automated formatting (enforced in pre-commit hooks)
- `dart analyze` for static analysis in CI/CD
- `dart test` for automated testing with coverage
- `build_runner` for code generation (json_serializable, freezed)
- `dart pub` for dependency management

**PASS Example** (Automated Zakat Calculation Validation):

```dart
// analysis_options.yaml - Automated quality enforcement
include: package:lints/recommended.yaml

analyzer:
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false
  errors:
    missing_required_param: error
    missing_return: error

linter:
  rules:
    - prefer_const_constructors
    - prefer_final_fields
    - avoid_dynamic_calls

// zakat_calculator_test.dart - Automated test
import 'package:test/test.dart';
import 'package:zakat_service/zakat_calculator.dart';

void main() {
  group('ZakatCalculator', () {
    test('wealth above nisab returns 2.5%', () {
      // Arrange
      const wealth = 100000.0;
      const nisab = 5000.0;

      // Act
      final zakatAmount = calculateZakat(wealth, nisab);

      // Assert
      expect(zakatAmount, equals(2500.0));
    });
  });
}
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Dart Implements**:

- Explicit null safety annotations (`?` and `!`)
- Explicit `async`/`await` markers on functions
- Explicit type declarations (avoid `var` for complex types)
- Explicit `required` named parameters
- Explicit imports (no wildcard imports)
- No hidden globals or magic constructors

**PASS Example** (Explicit Murabaha Contract):

```dart
// CORRECT: Explicit type declarations and required parameters
class MurabahaContract {
  final String contractId;
  final String customerId;
  final double costPrice;
  final double profitMargin;
  final int installmentCount;
  final DateTime createdAt;

  // Explicit constructor with required named parameters
  const MurabahaContract({
    required this.contractId,
    required this.customerId,
    required this.costPrice,
    required this.profitMargin,
    required this.installmentCount,
    required this.createdAt,
  });

  // Explicit factory with validation
  factory MurabahaContract.create({
    required String customerId,
    required double costPrice,
    required double profitMargin,
    required int installmentCount,
  }) {
    if (costPrice <= 0) {
      throw ArgumentError('Cost price must be positive');
    }
    if (profitMargin < 0) {
      throw ArgumentError('Profit margin cannot be negative');
    }
    return MurabahaContract(
      contractId: _generateId(),
      customerId: customerId,
      costPrice: costPrice,
      profitMargin: profitMargin,
      installmentCount: installmentCount,
      createdAt: DateTime.now(),
    );
  }

  double get totalPrice => costPrice + profitMargin;
}
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes.

**How Dart Implements**:

- `final` fields prevent reassignment
- `const` constructors for compile-time immutable objects
- Spread operators (`...`) for immutable collection updates
- `freezed` package for deeply immutable data classes
- `List.unmodifiable()`, `Map.unmodifiable()` for collection immutability

**PASS Example** (Immutable Zakat Transaction):

```dart
// CORRECT: Immutable transaction with const constructor
@immutable
class ZakatTransaction {
  final String transactionId;
  final String payerId;
  final double wealth;
  final double zakatAmount;
  final DateTime paidAt;

  const ZakatTransaction({
    required this.transactionId,
    required this.payerId,
    required this.wealth,
    required this.zakatAmount,
    required this.paidAt,
  });

  // CopyWith creates new instance instead of mutating
  ZakatTransaction copyWith({
    double? zakatAmount,
  }) {
    return ZakatTransaction(
      transactionId: transactionId,
      payerId: payerId,
      wealth: wealth,
      zakatAmount: zakatAmount ?? this.zakatAmount,
      paidAt: paidAt,
    );
  }
}

// CORRECT: Immutable list update using spread
List<ZakatTransaction> addTransaction(
  List<ZakatTransaction> transactions,
  ZakatTransaction newTx,
) {
  return [...transactions, newTx]; // Creates new list
}
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free.

**How Dart Implements**:

- Top-level functions without class state
- Explicit dependencies as function parameters
- Separate domain logic from I/O operations
- `const` functions for compile-time evaluation

**PASS Example** (Pure Zakat Calculation):

```dart
// CORRECT: Pure function - same inputs always return same output
double calculateZakat(double wealth, double nisab) {
  if (wealth < nisab) return 0.0;
  return wealth * 0.025;
}

// CORRECT: Pure domain logic separated from async I/O
double applyIslamicRounding(double amount) {
  // Round to nearest dirham (smallest unit)
  return (amount * 100).round() / 100;
}

// WRONG: Side effects in calculation
double calculateZakatWithSideEffects(double wealth, double nisab) {
  print('Calculating zakat for wealth: $wealth'); // Side effect!
  final result = wealth >= nisab ? wealth * 0.025 : 0.0;
  _globalCache['last_result'] = result; // Side effect!
  return result;
}
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments.

**How Dart Implements**:

- `pubspec.lock` committed to git for exact dependency versions
- SDK version constraint in `pubspec.yaml`
- `dart pub get --offline` for offline reproducible builds
- Pinned exact tool versions in CI/CD

**PASS Example** (Reproducible Environment):

```yaml
# pubspec.yaml - Exact version constraints
name: zakat_service
version: 1.0.0
environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  http: ^1.1.0
  json_annotation: ^4.8.1
  freezed_annotation: ^2.4.1
  decimal: ^2.3.3

dev_dependencies:
  test: ^1.24.0
  mockito: ^5.4.4
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  lints: ^3.0.0
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Part 1: Naming Conventions

### Variables and Methods

**MUST** use `lowerCamelCase` for variables, parameters, and methods.

```dart
// CORRECT: lowerCamelCase
String customerName = 'Ahmed';
double zakatAmount = 2500.0;
int installmentCount = 12;

void calculateZakat() {}
Future<void> recordPayment() async {}
bool isEligibleForZakat(double wealth) => true;

// WRONG: snake_case for variables/methods (Python-style)
String customer_name = 'Ahmed'; // Wrong!
void calculate_zakat() {} // Wrong!
```

### Classes, Enums, and Type Aliases

**MUST** use `UpperCamelCase` for classes, enums, mixins, typedefs, and type aliases.

```dart
// CORRECT: UpperCamelCase
class MurabahaContract {}
enum ContractStatus { active, completed, cancelled }
mixin ZakatEligibility {}
typedef ZakatCalculator = double Function(double, double);

// WRONG: lowerCamelCase for class names
class murabahaContract {} // Wrong!
enum contractStatus { active } // Wrong!
```

### Files and Packages

**MUST** use `lowercase_with_underscores` for file names and package names.

```dart
// CORRECT file names:
// zakat_calculator.dart
// murabaha_contract.dart
// islamic_finance_service.dart
// zakat_calculator_test.dart

// WRONG file names:
// ZakatCalculator.dart  (UpperCamelCase - wrong)
// zakatCalculator.dart  (lowerCamelCase - wrong)
// murabaha-contract.dart (hyphens - wrong)
```

### Constants

**MUST** use `lowerCamelCase` for constants (Dart style, unlike Java/Go).

```dart
// CORRECT: lowerCamelCase constants in Dart
const double zakatRate = 0.025;
const int maxInstallments = 60;
const String defaultCurrency = 'USD';

// WRONG: SCREAMING_SNAKE_CASE (Java/C style - not Dart)
const double ZAKAT_RATE = 0.025; // Wrong in Dart!
```

### Private Members

**MUST** use `_` prefix for private members (library-private in Dart).

```dart
class ZakatService {
  // Private fields
  final double _nisabThreshold;
  final String _currency;

  // Private method
  double _applyRounding(double amount) {
    return (amount * 100).round() / 100;
  }

  // Public method
  double calculateZakat(double wealth) {
    if (wealth < _nisabThreshold) return 0.0;
    return _applyRounding(wealth * zakatRate);
  }
}
```

## Part 2: Package Organization

### Directory Structure

**MUST** follow standard Dart package structure:

```
my_package/
├── lib/
│   ├── src/                    # Implementation files
│   │   ├── domain/             # Domain models and logic
│   │   │   ├── zakat/
│   │   │   │   ├── zakat_calculator.dart
│   │   │   │   └── zakat_transaction.dart
│   │   │   └── murabaha/
│   │   │       └── murabaha_contract.dart
│   │   ├── infrastructure/     # External services
│   │   └── application/        # Use cases / services
│   └── my_package.dart         # Public API barrel file
├── test/
│   ├── domain/
│   │   └── zakat/
│   │       └── zakat_calculator_test.dart
│   └── my_package_test.dart
├── pubspec.yaml
├── pubspec.lock
├── analysis_options.yaml
└── README.md
```

**MUST** export public API through barrel file:

```dart
// lib/zakat_service.dart - Public API barrel
export 'src/domain/zakat/zakat_calculator.dart';
export 'src/domain/zakat/zakat_transaction.dart';
export 'src/domain/murabaha/murabaha_contract.dart';

// Internal implementation not exported:
// src/infrastructure/... stays private
```

### Import Ordering

**MUST** follow Dart import ordering convention:

```dart
// CORRECT: Dart imports first, then package imports, then relative
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:decimal/decimal.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:http/http.dart' as http;

import '../domain/zakat_transaction.dart';
import 'murabaha_contract.dart';
```

## Part 3: Effective Dart Idioms

### Cascade Notation

**SHOULD** use cascade notation (`..`) for multiple operations on the same object.

```dart
// CORRECT: Cascade notation
final contract = MurabahaBuilder()
  ..setCustomerId('CUST-001')
  ..setCostPrice(50000.0)
  ..setProfitRate(0.08)
  ..setInstallmentCount(24);

final buffer = StringBuffer()
  ..write('Contract ID: ')
  ..writeln(contractId)
  ..write('Amount: ')
  ..writeln(totalAmount);

// WRONG: Repetitive object reference
final contract2 = MurabahaBuilder();
contract2.setCustomerId('CUST-001');
contract2.setCostPrice(50000.0);
contract2.setProfitRate(0.08);
```

### Collection If and For

**SHOULD** use collection if and collection for for concise collection construction.

```dart
// CORRECT: Collection if
List<String> buildZakatReport({bool includeDetails = false}) {
  return [
    'Zakat Calculation Report',
    'Date: ${DateTime.now()}',
    if (includeDetails) 'Detailed breakdown:',
    if (includeDetails) '  - Wealth: ${wealth}',
    if (includeDetails) '  - Nisab: ${nisab}',
    'Total Zakat: ${zakatAmount}',
  ];
}

// CORRECT: Collection for
List<Widget> buildInstallmentWidgets(List<Installment> installments) {
  return [
    const Text('Installments'),
    for (final installment in installments)
      InstallmentCard(installment: installment),
    const SizedBox(height: 16),
  ];
}
```

### Spread Operators

**SHOULD** use spread operators for combining collections immutably.

```dart
// CORRECT: Spread for immutable list combination
List<ZakatTransaction> mergeTransactions(
  List<ZakatTransaction> existing,
  List<ZakatTransaction> newTransactions,
) {
  return [...existing, ...newTransactions];
}

// CORRECT: Conditional spread
List<String> buildPermissions(bool isAdmin) {
  return [
    'view_reports',
    'calculate_zakat',
    ...if (isAdmin) ['manage_users', 'export_data'],
  ];
}
```

### Null Safety Patterns

**MUST** use null-aware operators instead of null checks where appropriate.

```dart
// CORRECT: Null-aware operators
String? customerName;

// Null coalescing
String displayName = customerName ?? 'Anonymous';

// Null-aware method call
int? nameLength = customerName?.length;

// Null coalescing assignment
customerName ??= 'Default Name';

// Null-aware cascade
customerName?.toUpperCase();

// WRONG: Manual null check where operator suffices
String displayName2 = customerName != null ? customerName : 'Anonymous'; // Verbose
```

### Records and Pattern Matching (Dart 3.0+)

**SHOULD** use records for lightweight value types and pattern matching for exhaustive handling.

```dart
// CORRECT: Record as return type for multiple values
(double zakatAmount, bool isEligible) calculateZakatResult(
  double wealth,
  double nisab,
) {
  final eligible = wealth >= nisab;
  return (eligible ? wealth * 0.025 : 0.0, eligible);
}

// Usage with destructuring
final (amount, eligible) = calculateZakatResult(10000, 5000);
print('Eligible: $eligible, Amount: $amount');

// CORRECT: Pattern matching with sealed classes
sealed class ZakatResult {}
class ZakatDue extends ZakatResult {
  final double amount;
  const ZakatDue(this.amount);
}
class ZakatNotDue extends ZakatResult {
  final String reason;
  const ZakatNotDue(this.reason);
}

String formatResult(ZakatResult result) => switch (result) {
  ZakatDue(:final amount) => 'Zakat due: \$${amount.toStringAsFixed(2)}',
  ZakatNotDue(:final reason) => 'No zakat: $reason',
};
```

### Const Constructors

**MUST** use `const` constructors for immutable objects where possible.

```dart
// CORRECT: Const constructor enables compile-time constants
class ZakatThreshold {
  final double amount;
  final String currency;

  const ZakatThreshold({required this.amount, required this.currency});
}

// Can be used as compile-time constant
const goldNisab = ZakatThreshold(amount: 5000.0, currency: 'USD');
const silverNisab = ZakatThreshold(amount: 350.0, currency: 'USD');

// WRONG: Non-const when const is possible
class ZakatThreshold2 {
  final double amount;
  ZakatThreshold2(this.amount); // Missing const keyword
}
```

### Factory Constructors

**SHOULD** use factory constructors for complex initialization, caching, or subtype selection.

```dart
// CORRECT: Factory constructor with validation
class IslamicFinanceRate {
  final double rate;
  final String description;

  const IslamicFinanceRate._(this.rate, this.description);

  factory IslamicFinanceRate.murabaha(double markupPercent) {
    if (markupPercent < 0 || markupPercent > 100) {
      throw ArgumentError('Markup must be between 0 and 100');
    }
    return IslamicFinanceRate._(markupPercent / 100, 'Murabaha markup');
  }

  factory IslamicFinanceRate.zakat() {
    return const IslamicFinanceRate._(0.025, 'Annual Zakat rate');
  }

  factory IslamicFinanceRate.fromJson(Map<String, dynamic> json) {
    return IslamicFinanceRate._(
      (json['rate'] as num).toDouble(),
      json['description'] as String,
    );
  }
}
```

### Extension Methods

**SHOULD** use extension methods to add functionality to existing types without subclassing.

```dart
// CORRECT: Extension on double for financial operations
extension MoneyExtension on double {
  double applyZakatRate() => this * 0.025;
  double applyMurabahaMarkup(double markupRate) => this * (1 + markupRate);

  String formatAsCurrency(String currency) {
    return '${toStringAsFixed(2)} $currency';
  }

  bool isAboveNisab(double nisab) => this >= nisab;
}

// Usage reads naturally
final wealth = 10000.0;
final zakat = wealth.applyZakatRate(); // 250.0
final displayAmount = wealth.formatAsCurrency('USD'); // "10000.00 USD"
final eligible = wealth.isAboveNisab(5000.0); // true

// Extension on DateTime for Islamic calendar helpers
extension IslamicDateExtension on DateTime {
  bool get isRamadan {
    // Simplified check - real implementation uses hijri calendar
    return month == 3; // Placeholder
  }
}
```

## Part 4: Anti-Patterns to Avoid

### Avoid Dynamic Types

**PROHIBITED**: Using `dynamic` type annotation removes Dart's type safety benefits.

```dart
// WRONG: Using dynamic
dynamic calculateZakat(dynamic wealth, dynamic nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0; // No type safety!
}

// CORRECT: Explicit types
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// WRONG: Dynamic map
Map<String, dynamic> result = {'amount': 250.0}; // Only when interfacing JSON!

// CORRECT: Typed model
class ZakatResult {
  final double amount;
  final bool isEligible;
  const ZakatResult({required this.amount, required this.isEligible});
}
```

### Avoid Null Assertion Operator Overuse

**PROHIBITED**: Overusing `!` (null assertion) defeats null safety.

```dart
// WRONG: Null assertion without guarantee
String? name;
print(name!.length); // Throws NullPointerException at runtime!

// CORRECT: Null-aware access
print(name?.length ?? 0);

// CORRECT: Conditional guard
if (name != null) {
  print(name.length); // Dart promotes to non-null here
}

// CORRECT: Use ! only when logically guaranteed
class ZakatService {
  String? _lastTransactionId;

  void processTransaction() {
    _lastTransactionId = _generateId();
    // Here ! is safe because we just set it
    print('Processing: $_lastTransactionId!');
  }
}
```

### Avoid Catching Base Exception or Object

**PROHIBITED**: Catching `Exception` or `Object` loses error type information.

```dart
// WRONG: Catching base types
try {
  await processZakatPayment();
} catch (e) { // Catches everything including Errors!
  print('Error: $e');
}

try {
  await processZakatPayment();
} on Exception catch (e) { // Still too broad
  print('Exception: $e');
}

// CORRECT: Typed exception catching
try {
  await processZakatPayment();
} on InsufficientFundsException catch (e) {
  handleInsufficientFunds(e);
} on ZakatValidationException catch (e) {
  handleValidationError(e);
} on NetworkException catch (e) {
  handleNetworkError(e);
}
```

### Avoid Mutable Global State

**PROHIBITED**: Mutable global variables create unpredictable behavior.

```dart
// WRONG: Mutable global state
double globalNisabThreshold = 5000.0; // Mutable global!

void updateNisab(double newValue) {
  globalNisabThreshold = newValue; // Affects all callers!
}

// CORRECT: Inject dependencies
class ZakatCalculator {
  final double nisabThreshold;

  const ZakatCalculator({required this.nisabThreshold});

  double calculate(double wealth) {
    return wealth >= nisabThreshold ? wealth * 0.025 : 0.0;
  }
}

// Instantiate with specific threshold
final calculator = ZakatCalculator(nisabThreshold: 5000.0);
```

### Avoid Using `var` for Complex Types

**SHOULD NOT** use `var` when the type is not immediately obvious from the right-hand side.

```dart
// WRONG: var obscures type
var result = processContracts(contracts); // What type is result?
var rate = getIslamicRate(); // What does this return?

// CORRECT: Explicit types for clarity
MurabahaCalculationResult result = processContracts(contracts);
IslamicFinanceRate rate = getIslamicRate();

// OK: var when type is obvious from literal or constructor
var name = 'Ahmed'; // clearly String
var count = 0; // clearly int
var contracts = <MurabahaContract>[]; // clearly List<MurabahaContract>
```

## Enforcement

These standards are enforced through:

- **dart format** - Auto-formats code (enforced in pre-commit hooks)
- **dart analyze** - Static analysis with analysis_options.yaml
- **dart test** - Automated testing
- **Code reviews** - Human verification of standards compliance

**Pre-commit checklist**:

- [ ] Code formatted with `dart format`
- [ ] Passes `dart analyze` with zero warnings
- [ ] All tests pass with `dart test`
- [ ] No `dynamic` types without justification
- [ ] No `!` assertions without guaranteed non-null context
- [ ] Typed exception catching used

## Related Standards

- [Testing Standards](./testing-standards.md) - Testing patterns with package:test
- [Code Quality Standards](./code-quality-standards.md) - dart analyze, lints configuration
- [Error Handling Standards](./error-handling-standards.md) - Exception patterns
- [Type Safety Standards](./type-safety-standards.md) - Null safety, sealed classes, records
- [Build Configuration](./build-configuration.md) - pubspec.yaml structure

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
