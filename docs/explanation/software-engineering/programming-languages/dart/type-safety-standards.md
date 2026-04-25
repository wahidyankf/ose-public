---
title: "Dart Type Safety Standards"
description: Authoritative OSE Platform Dart type safety standards (null-safety, sealed-classes, records, generics)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - type-safety
  - null-safety
  - sealed-classes
  - records
  - generics
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to leverage Dart's type system in THIS codebase, not WHAT null safety is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for Dart development in the OSE Platform. Dart's sound type system and null safety are the foundation of reliable financial software — these standards ensure the type system is used to its fullest potential.

**Target Audience**: OSE Platform Dart developers

**Scope**: Sound null safety, nullable types, null-aware operators, `late` keyword, sealed classes (Dart 3.0+), records as lightweight value types, generics, extension types (Dart 3.3+), avoiding `dynamic`

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Type Checking):

```yaml
# analysis_options.yaml
analyzer:
  strong-mode:
    implicit-casts: false # No automatic type coercion
    implicit-dynamic: false # No dynamic inference

  errors:
    invalid_assignment: error # Type mismatch is an error
    body_might_complete_normally: error # Missing return is an error
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Type Annotations):

```dart
// CORRECT: Explicit types on public APIs
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

Future<List<ZakatTransaction>> loadHistory(String customerId) async {
  return repository.findByCustomerId(customerId);
}

// CORRECT: Explicit nullable return type
ZakatTransaction? findMostRecent(List<ZakatTransaction> transactions) {
  if (transactions.isEmpty) return null; // Explicit null return
  return transactions.reduce((a, b) => a.paidAt.isAfter(b.paidAt) ? a : b);
}

// WRONG: Implicit types on public APIs
calculateZakat(wealth, nisab) { // Missing parameter and return types!
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Typed Collections):

```dart
// CORRECT: Typed immutable collections
const List<String> supportedCurrencies = ['USD', 'SAR', 'MYR', 'IDR'];
const Map<String, double> zakatRates = {
  'gold': 0.025,
  'silver': 0.025,
  'cash': 0.025,
};

// CORRECT: Unmodifiable typed collection
final List<ZakatTransaction> immutableHistory =
    List.unmodifiable(await repository.loadAll());
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Type-Safe Pure Functions):

```dart
// Generic pure transformation
T? findFirst<T>(List<T> items, bool Function(T) predicate) {
  for (final item in items) {
    if (predicate(item)) return item;
  }
  return null;
}

// Usage: type-safe, no dynamic
final firstEligible = findFirst<ZakatTransaction>(
  transactions,
  (tx) => tx.zakatAmount > 0,
);
```

### 5. Reproducibility First

**PASS Example** (Typed Serialization):

```dart
// json_serializable ensures typed, reproducible serialization
@JsonSerializable()
class ZakatTransaction {
  final String id;
  final double amount; // Always double, never dynamic

  const ZakatTransaction({required this.id, required this.amount});

  factory ZakatTransaction.fromJson(Map<String, dynamic> json) =>
      _$ZakatTransactionFromJson(json); // Generated, type-safe
}
```

## Part 1: Sound Null Safety

### Non-Nullable by Default

**MUST** design all APIs with non-nullable types as the default.

```dart
// CORRECT: Non-nullable by default (Dart 3.0+)
class ZakatCalculator {
  final double nisabThreshold;    // Cannot be null
  final String currency;          // Cannot be null

  const ZakatCalculator({
    required this.nisabThreshold,
    required this.currency,
  });

  double calculate(double wealth) { // wealth cannot be null
    return wealth >= nisabThreshold ? wealth * 0.025 : 0.0;
  }
}

// Usage - compiler enforces non-null
final calculator = ZakatCalculator(nisabThreshold: 5000.0, currency: 'USD');
final zakat = calculator.calculate(10000.0); // Cannot pass null here
```

### Nullable Types with `?`

**MUST** use `?` suffix only when `null` is a meaningful domain value.

```dart
// CORRECT: Nullable only when null is meaningful
class ZakatRecord {
  final String customerId;
  final double? lastZakatAmount;   // null = no zakat paid yet
  final DateTime? lastPaidDate;    // null = never paid
  final String? receiptNumber;     // null = payment pending

  const ZakatRecord({
    required this.customerId,
    this.lastZakatAmount,
    this.lastPaidDate,
    this.receiptNumber,
  });

  bool get hasEverPaid => lastPaidDate != null;
}

// WRONG: Making everything nullable "to be safe"
class ZakatRecord2 {
  final String? customerId;     // Wrong! Customer ID is always required
  final double? zakatAmount;    // Wrong! If calculating, it's always a number
  final String? currency;       // Wrong! Currency is always known
}
```

## Part 2: Null-Aware Operators

**MUST** use null-aware operators instead of verbose null checks.

### Null Coalescing (`??`)

```dart
// CORRECT: Concise null coalescing
String displayName(String? name) => name ?? 'Anonymous';
double effectiveNisab(double? customNisab) => customNisab ?? 5000.0;

// WRONG: Verbose null check
String displayName2(String? name) {
  if (name != null) {
    return name;
  } else {
    return 'Anonymous';
  }
}
```

### Null-Aware Access (`?.`)

```dart
// CORRECT: Null-aware method/property access
ZakatRecord? record = await repository.findLatest(customerId);

final lastAmount = record?.lastZakatAmount;  // null if record is null
final year = record?.lastPaidDate?.year;     // Chained null-aware access
final formatted = record?.receiptNumber?.toUpperCase();

// WRONG: Manual null check before access
double? lastAmount2;
if (record != null) {
  lastAmount2 = record.lastZakatAmount;
}
```

### Null Coalescing Assignment (`??=`)

```dart
// CORRECT: Lazy initialization with ??=
class NisabRateCache {
  Map<String, double>? _rates;

  Future<Map<String, double>> getRates() async {
    _rates ??= await _fetchFromApi(); // Only fetches if null
    return _rates!; // Safe: ??= guarantees non-null
  }
}
```

## Part 3: The `late` Keyword

**SHOULD** use `late` for fields initialized after construction (but before first use).

```dart
// CORRECT: late for deferred initialization
class ZakatReportGenerator {
  late final ZakatStatisticsEngine _engine; // Initialized before use

  ZakatReportGenerator();

  Future<void> initialize() async {
    // Expensive setup - not in constructor
    _engine = await ZakatStatisticsEngine.create();
  }

  Future<ZakatReport> generate(int year) async {
    // _engine guaranteed initialized by now
    return _engine.computeAnnualReport(year);
  }
}

// WRONG: late without guaranteed initialization
class Broken {
  late String name;

  void process() {
    print(name.length); // LateInitializationError if name not set!
  }
}
```

## Part 4: Sealed Classes (Dart 3.0+)

### Defining Sealed Classes

**SHOULD** use sealed classes for exhaustive domain state hierarchies.

```dart
// Sealed class - all subclasses must be in same library
sealed class ZakatEligibility {}

class ZakatEligible extends ZakatEligibility {
  final double wealth;
  final double nisab;
  final double zakatDue;

  const ZakatEligible({
    required this.wealth,
    required this.nisab,
    required this.zakatDue,
  });
}

class ZakatNotEligible extends ZakatEligibility {
  final double wealth;
  final double nisab;
  final double shortfall; // How much below nisab

  const ZakatNotEligible({
    required this.wealth,
    required this.nisab,
    required this.shortfall,
  });
}

class ZakatCalculationError extends ZakatEligibility {
  final String message;
  const ZakatCalculationError(this.message);
}
```

### Exhaustive Pattern Matching

**MUST** use exhaustive `switch` with sealed classes. The compiler enforces all cases are handled.

```dart
ZakatEligibility checkEligibility(double wealth, double nisab) {
  if (wealth < 0 || nisab <= 0) {
    return ZakatCalculationError('Invalid input values');
  }
  if (wealth >= nisab) {
    return ZakatEligible(
      wealth: wealth,
      nisab: nisab,
      zakatDue: wealth * 0.025,
    );
  }
  return ZakatNotEligible(
    wealth: wealth,
    nisab: nisab,
    shortfall: nisab - wealth,
  );
}

// CORRECT: Exhaustive switch - compiler error if case missing
String describeEligibility(ZakatEligibility eligibility) => switch (eligibility) {
  ZakatEligible(:final zakatDue) =>
      'Zakat due: ${zakatDue.toStringAsFixed(2)}',
  ZakatNotEligible(:final shortfall) =>
      'Below nisab by ${shortfall.toStringAsFixed(2)}',
  ZakatCalculationError(:final message) =>
      'Error: $message',
  // No default needed - compiler verifies exhaustiveness
};

// Widget equivalent
Widget buildEligibilityWidget(ZakatEligibility eligibility) => switch (eligibility) {
  ZakatEligible(:final zakatDue, :final wealth) =>
      ZakatDueCard(amount: zakatDue, wealth: wealth),
  ZakatNotEligible(:final shortfall) =>
      BelowNisabCard(shortfall: shortfall),
  ZakatCalculationError(:final message) =>
      ErrorCard(message: message),
};
```

## Part 5: Records as Lightweight Value Types (Dart 3.0+)

### Named Records

**SHOULD** use records for multi-value returns and lightweight data grouping.

```dart
// CORRECT: Record for multiple return values
({double zakatAmount, bool isEligible}) calculateZakatResult(
  double wealth,
  double nisab,
) {
  final eligible = wealth >= nisab;
  return (
    zakatAmount: eligible ? wealth * 0.025 : 0.0,
    isEligible: eligible,
  );
}

// Destructuring in usage
final result = calculateZakatResult(10000.0, 5000.0);
print('Eligible: ${result.isEligible}');
print('Amount: ${result.zakatAmount}');

// Pattern destructuring
final (zakatAmount: amount, isEligible: eligible) = calculateZakatResult(10000, 5000);

// CORRECT: Record as simple value type
typedef MoneyRecord = ({double amount, String currency});

MoneyRecord addMoney(MoneyRecord a, MoneyRecord b) {
  assert(a.currency == b.currency, 'Currency mismatch');
  return (amount: a.amount + b.amount, currency: a.currency);
}
```

### Positional Records

```dart
// Positional record for ordered tuples
(String id, double amount, DateTime date) parsePaymentLine(String csv) {
  final parts = csv.split(',');
  return (parts[0], double.parse(parts[1]), DateTime.parse(parts[2]));
}

final (id, amount, date) = parsePaymentLine('TX-001,250.00,2026-03-09');
```

## Part 6: Generics

### Generic Functions

**MUST** use generics for reusable type-safe utilities.

```dart
// CORRECT: Generic type-safe utilities
T? firstOrNull<T>(List<T> items, bool Function(T) predicate) {
  for (final item in items) {
    if (predicate(item)) return item;
  }
  return null;
}

List<R> mapNonNull<T, R>(List<T?> items, R Function(T) mapper) {
  return [
    for (final item in items)
      if (item != null) mapper(item),
  ];
}

// CORRECT: Generic Result type
sealed class Result<T> {}
class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}
class Failure<T> extends Result<T> {
  final Exception error;
  const Failure(this.error);
}

// Generic function for safe operations
Result<T> tryRun<T>(T Function() operation) {
  try {
    return Success(operation());
  } on Exception catch (e) {
    return Failure(e);
  }
}
```

### Generic Classes

```dart
// Generic repository interface
abstract class Repository<T, TId> {
  Future<T?> findById(TId id);
  Future<List<T>> findAll();
  Future<T> save(T entity);
  Future<void> delete(TId id);
}

// Implementation
class ZakatTransactionRepository
    extends Repository<ZakatTransaction, String> {
  @override
  Future<ZakatTransaction?> findById(String id) async { /* ... */ }

  @override
  Future<List<ZakatTransaction>> findAll() async { /* ... */ }

  @override
  Future<ZakatTransaction> save(ZakatTransaction entity) async { /* ... */ }

  @override
  Future<void> delete(String id) async { /* ... */ }
}
```

## Part 7: Extension Types (Dart 3.3+)

**MAY** use extension types for zero-cost type wrappers that add domain semantics.

```dart
// Extension type - zero runtime cost (no boxing)
extension type CustomerId(String _value) {
  // Validation at construction
  CustomerId.validated(String value)
      : this(_validateCustomerId(value));

  static String _validateCustomerId(String value) {
    if (value.isEmpty || !RegExp(r'^CUST-\d+$').hasMatch(value)) {
      throw ArgumentError('Invalid customer ID format: $value');
    }
    return value;
  }

  String get value => _value;
  bool get isValid => _value.isNotEmpty;
}

extension type TransactionId(String _value) {
  TransactionId.generate()
      : this('TX-${DateTime.now().millisecondsSinceEpoch}');

  String get value => _value;
}

// Type-safe function signatures
Future<ZakatTransaction?> findTransaction(TransactionId id) async {
  return repository.findById(id.value);
}

// WRONG: Passing wrong ID type is a compile error
final customerId = CustomerId('CUST-001');
await findTransaction(customerId); // Compile error: CustomerId != TransactionId
```

## Part 8: Avoid dynamic

**PROHIBITED**: Using `dynamic` type removes all type safety.

```dart
// WRONG: dynamic everywhere
dynamic calculateZakat(dynamic wealth, dynamic nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0; // No type checking!
}

Map<String, dynamic> contract = {}; // dynamic values
contract['amount'] = 'not a number'; // Silent bug!

// CORRECT: Explicit types
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// CORRECT: Use dynamic ONLY for JSON deserialization boundary
@JsonSerializable()
class ZakatRequest {
  final double wealth;
  final double nisab;

  const ZakatRequest({required this.wealth, required this.nisab});

  // fromJson accepts Map<String, dynamic> - necessary for JSON
  factory ZakatRequest.fromJson(Map<String, dynamic> json) =>
      _$ZakatRequestFromJson(json); // Generated code handles type safety

  // Once deserialized, all fields are strongly typed
}
```

## Enforcement

Type safety is enforced through:

- **Dart analyzer** - `implicit-casts: false`, `implicit-dynamic: false`
- **dart analyze** - Type error detection in CI/CD
- **Code reviews** - Verify no `dynamic` without justification, sealed class exhaustiveness
- **Tests** - Type contract testing for public APIs

**Pre-commit checklist**:

- [ ] No `dynamic` types (except JSON deserialization boundary)
- [ ] All public API functions have explicit return type annotations
- [ ] Nullable types (`?`) only when `null` is a meaningful domain value
- [ ] `late` used only with guaranteed initialization
- [ ] Sealed classes used for exhaustive domain states (Dart 3.0+)
- [ ] `switch` on sealed class covers all cases (no `default` needed)
- [ ] `!` operator used only when non-null is logically guaranteed

## Related Standards

- [Coding Standards](./coding-standards.md) - Type naming conventions
- [Error Handling Standards](./error-handling-standards.md) - Typed exceptions
- [DDD Standards](./ddd-standards.md) - Sealed classes for domain states
- [Performance Standards](./performance-standards.md) - Extension types zero-cost

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Key Features**: Sound null safety, records (3.0+), sealed classes (3.0+), extension types (3.3+)
