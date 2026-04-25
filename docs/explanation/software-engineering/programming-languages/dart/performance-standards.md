---
title: "Dart Performance Standards"
description: Authoritative OSE Platform Dart performance standards (benchmarks, profiling, optimization)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - performance
  - benchmarks
  - profiling
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to measure and optimize Dart performance in THIS codebase, not WHAT performance optimization is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for Dart development in the OSE Platform. Performance work MUST follow the principle: measure first, optimize with evidence.

**Target Audience**: OSE Platform Dart developers tackling performance-sensitive code paths

**Scope**: const constructors, lazy initialization, collection performance, profiling with Flutter DevTools, `dart:developer` Timeline, `benchmark_harness`, AOT benefits

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Benchmarking in CI):

```dart
// benchmark/zakat_calculator_benchmark.dart
import 'package:benchmark_harness/benchmark_harness.dart';

class ZakatCalculationBenchmark extends BenchmarkBase {
  ZakatCalculationBenchmark() : super('ZakatCalculation');

  @override
  void run() {
    // Benchmarked code
    calculateZakat(100000.0, 5000.0);
  }
}

void main() {
  // Run benchmark and report to stdout (parseable by CI)
  ZakatCalculationBenchmark().report();
}

// Run in CI:
// dart run benchmark/zakat_calculator_benchmark.dart
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Performance Markers):

```dart
import 'dart:developer';

Future<ZakatReport> generateReport(List<ZakatTransaction> transactions) async {
  // Explicit timeline events for profiling
  Timeline.startSync('ZakatReport.generate');
  try {
    final report = await Isolate.run(() => _computeReport(transactions));
    return report;
  } finally {
    Timeline.finishSync();
  }
}

// Explicit: const for compile-time constants (no runtime allocation)
static const double zakatRate = 0.025; // compile-time constant
static const int goldNisabGrams = 85;  // compile-time constant
```

### 3. Immutability Over Mutability

**PASS Example** (Const for Zero-Cost Immutability):

```dart
// CORRECT: const objects are shared, not duplicated
const defaultNisab = ZakatThreshold(amount: 5000.0, currency: 'USD');

// Reused by Dart VM - no repeated allocation
for (final tx in transactions) {
  if (tx.nisab == defaultNisab) { // Same object reference
    processWithDefaultNisab(tx);
  }
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Functions Enable JIT Optimization):

```dart
// Pure functions are JIT-optimizable by Dart VM
// The VM can inline, specialize, and cache pure function results
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// Process large lists with pure transformations
List<double> batchCalculateZakat(
  List<double> wealthAmounts,
  double nisab,
) {
  return wealthAmounts
      .where((w) => w >= nisab)   // Pure filter
      .map((w) => w * 0.025)       // Pure transform
      .toList();
}
```

### 5. Reproducibility First

**PASS Example** (Reproducible Benchmarks):

```dart
class ZakatBenchmark extends BenchmarkBase {
  late final List<ZakatTransaction> _testData;

  ZakatBenchmark() : super('ZakatBatchProcess');

  @override
  void setup() {
    // Reproducible test data - fixed seed for determinism
    final random = math.Random(42); // Fixed seed
    _testData = List.generate(
      1000,
      (i) => ZakatTransaction(
        transactionId: 'TX-$i',
        payerId: 'CUST-${random.nextInt(100)}',
        wealth: random.nextDouble() * 100000,
        zakatAmount: 0,
        paidAt: DateTime(2026, 1, 1),
      ),
    );
  }

  @override
  void run() {
    batchProcessTransactions(_testData);
  }
}
```

## Part 1: const Constructors

### When to Use const

**MUST** use `const` constructors for objects that are compile-time constants or created repeatedly with the same values.

```dart
// CORRECT: const constructor - object is canonicalized by Dart VM
@immutable
class ZakatThreshold {
  final double amount;
  final String currency;

  const ZakatThreshold({required this.amount, required this.currency});
}

// Compile-time constants - allocated once, shared
const goldNisab = ZakatThreshold(amount: 5000.0, currency: 'USD');
const silverNisab = ZakatThreshold(amount: 350.0, currency: 'USD');

// In widget trees - const prevents unnecessary rebuilds
const Text('Zakat Calculator')        // Not rebuilt
const SizedBox(height: 16)            // Not rebuilt
const EdgeInsets.all(16)              // Not rebuilt

// CORRECT: Prefer const in lists and maps
final nisabValues = const {
  'gold': ZakatThreshold(amount: 5000.0, currency: 'USD'),
  'silver': ZakatThreshold(amount: 350.0, currency: 'USD'),
};

// WRONG: Non-const when const is possible
final goldNisab2 = ZakatThreshold(amount: 5000.0, currency: 'USD'); // New allocation every time
```

### const vs final Performance

```dart
// const: compile-time constant, shared instance, zero-cost
const maxInstallments = 60;
const zakatRate = 0.025;

// final: runtime constant, allocated once
final transactionId = uuid.v4();  // Runtime - cannot be const

// WRONG: Using non-const for values that could be const
var zakatRate = 0.025;     // Mutable - wrong
final zakatRate2 = 0.025;  // Better but not const
const zakatRate3 = 0.025;  // Best - compile-time constant
```

## Part 2: Lazy Initialization

### late Keyword for Deferred Initialization

**SHOULD** use `late` for expensive initializations that may not always be needed.

```dart
class ZakatReportService {
  // Lazy: only initialized when first accessed
  late final ZakatStatisticsEngine _statsEngine = ZakatStatisticsEngine(
    config: StatisticsConfig.fromEnvironment(),
  );

  // Called only when reports are generated
  Future<ZakatReport> generateAnnualReport(int year) async {
    // _statsEngine initialized here on first call
    return _statsEngine.computeAnnualReport(year);
  }

  // If generateAnnualReport is never called, _statsEngine is never created
}

// WRONG: Eager initialization of expensive object
class ZakatReportService2 {
  final ZakatStatisticsEngine _statsEngine = ZakatStatisticsEngine(
    config: StatisticsConfig.fromEnvironment(), // Always created, even if unused
  );
}
```

### Lazy Cache Pattern

```dart
class NisabRateService {
  Map<String, double>? _cachedRates; // null until first fetch

  Future<Map<String, double>> getRates() async {
    // Lazy fetch: only hits network on first call
    _cachedRates ??= await _fetchRatesFromApi();
    return _cachedRates!;
  }

  Future<Map<String, double>> _fetchRatesFromApi() async {
    // Network call
    final response = await http.get(Uri.parse('https://api.oseplatform.com/nisab-rates'));
    return Map.fromEntries(
      (jsonDecode(response.body) as List).map(
        (e) => MapEntry(e['currency'] as String, (e['rate'] as num).toDouble()),
      ),
    );
  }
}
```

## Part 3: Collection Operations

### Efficient Collection Processing

**MUST** use efficient Dart collection patterns for financial data processing.

```dart
// CORRECT: Single pass with fold for aggregation
double totalZakatPaid(List<ZakatTransaction> transactions) {
  return transactions.fold(0.0, (sum, tx) => sum + tx.zakatAmount);
}

// CORRECT: where + map chains are lazy (no intermediate allocations)
List<ZakatTransaction> eligibleTransactions = transactions
    .where((tx) => tx.zakatAmount > 0)     // Lazy filter
    .where((tx) => tx.paidAt.year == 2026) // Lazy filter
    .toList();                              // Single allocation at end

// WRONG: Intermediate toList() causes extra allocation
List<ZakatTransaction> eligibleTransactions2 = transactions
    .where((tx) => tx.zakatAmount > 0)
    .toList()                              // Unnecessary intermediate list
    .where((tx) => tx.paidAt.year == 2026)
    .toList();
```

### Pre-allocation

**MUST** pre-allocate collections when size is known.

```dart
// CORRECT: Pre-allocate with known size
List<double> calculateBatchZakat(List<double> wealthAmounts, double nisab) {
  // Pre-allocate result list
  final results = List<double>.filled(wealthAmounts.length, 0.0);
  for (int i = 0; i < wealthAmounts.length; i++) {
    results[i] = wealthAmounts[i] >= nisab ? wealthAmounts[i] * 0.025 : 0.0;
  }
  return results;
}

// CORRECT: growable: false for fixed-size lists
final payments = List<Payment>.generate(
  installmentCount,
  (i) => Payment(amount: monthlyAmount, dueDate: startDate.add(Duration(days: 30 * i))),
  growable: false, // Slight memory optimization
);
```

### String Building Performance

**MUST** use `StringBuffer` for string concatenation in loops.

```dart
// WRONG: String concatenation in loop (creates many string objects)
String formatTransactionList(List<ZakatTransaction> transactions) {
  String result = '';
  for (final tx in transactions) {
    result += 'TX: ${tx.transactionId} - Amount: ${tx.zakatAmount}\n'; // Slow!
  }
  return result;
}

// CORRECT: StringBuffer
String formatTransactionList2(List<ZakatTransaction> transactions) {
  final buffer = StringBuffer();
  for (final tx in transactions) {
    buffer.write('TX: ');
    buffer.write(tx.transactionId);
    buffer.write(' - Amount: ');
    buffer.writeln(tx.zakatAmount);
  }
  return buffer.toString();
}
```

## Part 4: Profiling with Flutter DevTools

### Connecting DevTools

```bash
# Start Flutter app in profile mode
flutter run --profile

# DevTools connects automatically, or:
flutter pub global activate devtools
flutter pub global run devtools
```

### Using Timeline Events

**SHOULD** add `dart:developer` Timeline events to code for profiling visibility.

```dart
import 'dart:developer';

Future<ZakatReport> generateReport(List<ZakatTransaction> transactions) async {
  // Mark start of measurable operation
  Timeline.startSync('ZakatReport.generate', arguments: {
    'transactionCount': transactions.length,
  });

  try {
    Timeline.startSync('ZakatReport.aggregate');
    final aggregated = _aggregateByYear(transactions);
    Timeline.finishSync();

    Timeline.startSync('ZakatReport.format');
    final report = _formatReport(aggregated);
    Timeline.finishSync();

    return report;
  } finally {
    Timeline.finishSync();
  }
}

// Manual performance measurement
void measureZakatCalculation() {
  final stopwatch = Stopwatch()..start();

  for (int i = 0; i < 10000; i++) {
    calculateZakat(100000.0, 5000.0);
  }

  stopwatch.stop();
  log('10,000 calculations: ${stopwatch.elapsedMilliseconds}ms');
}
```

## Part 5: benchmark_harness

### Writing Benchmarks

**SHOULD** write benchmarks for performance-critical paths using `benchmark_harness`.

```dart
// pubspec.yaml
// dev_dependencies:
//   benchmark_harness: ^2.2.4

import 'package:benchmark_harness/benchmark_harness.dart';

class ZakatBatchCalculationBenchmark extends BenchmarkBase {
  static const int batchSize = 10000;
  late final List<double> _wealthAmounts;
  static const double _nisab = 5000.0;

  ZakatBatchCalculationBenchmark() : super('ZakatBatchCalculation($batchSize)');

  @override
  void setup() {
    // Pre-generate test data outside the timed section
    _wealthAmounts = List.generate(
      batchSize,
      (i) => (i % 20000).toDouble(), // Values above and below nisab
    );
  }

  @override
  void run() {
    // This is the timed section
    for (final wealth in _wealthAmounts) {
      calculateZakat(wealth, _nisab);
    }
  }

  @override
  void teardown() {
    // Cleanup after benchmarking
  }
}

class MurabahaInstallmentBenchmark extends BenchmarkBase {
  MurabahaInstallmentBenchmark() : super('MurabahaInstallmentSchedule');

  @override
  void run() {
    generateInstallmentSchedule(
      costPrice: 50000.0,
      profitRate: 0.08,
      installments: 24,
    );
  }
}

void main() {
  ZakatBatchCalculationBenchmark().report();
  MurabahaInstallmentBenchmark().report();
}
```

## Part 6: AOT Compilation Benefits

### AOT vs JIT Performance

Dart supports two compilation modes:

- **JIT (Just-In-Time)**: Used during development (`dart run`, `flutter run`)
  - Enables hot reload
  - Slower startup
  - Runtime optimization

- **AOT (Ahead-Of-Time)**: Used in production (`dart compile exe`, `flutter build`)
  - Faster startup
  - More predictable performance
  - Smaller memory footprint

```bash
# Development: JIT (fast iteration)
dart run bin/zakat_service.dart
flutter run

# Production: AOT (fast execution)
dart compile exe bin/zakat_service.dart -o bin/zakat_service
flutter build apk --release
flutter build ios --release
```

### AOT-Friendly Patterns

**SHOULD** write AOT-friendly code:

```dart
// CORRECT: AOT-friendly - static dispatch (faster)
class ZakatCalculator {
  // Static method - AOT can inline this
  static double calculate(double wealth, double nisab) {
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}

// CORRECT: Avoid dynamic dispatch when possible
double processZakat(double wealth, double nisab) {
  return ZakatCalculator.calculate(wealth, nisab); // Static call - AOT can optimize
}

// WRONG: Unnecessary dynamic dispatch
double processZakat2(dynamic calculator, double wealth, double nisab) {
  return calculator.calculate(wealth, nisab); // dynamic - AOT cannot optimize
}
```

## Enforcement

Performance standards are enforced through:

- **benchmark_harness** - Automated benchmarks in CI
- **Flutter DevTools** - Timeline analysis for regressions
- **Code reviews** - Verify const usage, lazy initialization, collection patterns
- **Profiling gates** - Performance regressions block merge for critical paths

**Pre-commit checklist**:

- [ ] `const` used for compile-time constant objects
- [ ] No string concatenation in loops (use `StringBuffer`)
- [ ] Collection chains use lazy operations (no intermediate `toList()`)
- [ ] CPU-intensive work uses `Isolate.run()` (see [Concurrency Standards](./concurrency-standards.md))
- [ ] `Timeline` markers added to operations requiring profiling

## Related Standards

- [Concurrency Standards](./concurrency-standards.md) - Isolates for CPU-bound work
- [Type Safety Standards](./type-safety-standards.md) - Typed code enables AOT optimization
- [Build Configuration](./build-configuration.md) - AOT compilation setup

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Profiling Tools**: Flutter DevTools, dart:developer Timeline, benchmark_harness
