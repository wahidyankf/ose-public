---
title: "Dart Anti-Patterns"
description: Common mistakes and problematic patterns to avoid in Dart development including null safety violations, async anti-patterns, mutable state issues, memory leaks, and testing anti-patterns
category: explanation
subcategory: prog-lang
tags:
  - dart
  - anti-patterns
  - mistakes
  - pitfalls
  - code-quality
  - null-safety
  - async
  - memory-leaks
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__null-safety.md
  - ./ex-soen-prla-da__async-programming.md
  - ./ex-soen-prla-da__testing.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
updated: 2026-01-29
---

# Dart Anti-Patterns

## Quick Reference

### Anti-Patterns by Category

**Null Safety Violations**:

- [Unnecessary Null Assertions](#1-unnecessary-null-assertions) - Overusing `!` operator
- [Nullable Everything](#2-nullable-everything) - Making everything nullable
- [Ignoring Null Safety](#3-ignoring-null-safety) - Using `dynamic` to bypass checks

**Async Anti-Patterns**:

- [Forgotten Await](#4-forgotten-await) - Missing `await` keywords
- [Sequential Instead of Parallel](#5-sequential-instead-of-parallel) - Not using Future.wait
- [Mixing Then and Async](#6-mixing-then-and-async) - Inconsistent async patterns
- [Uncaught Async Errors](#7-uncaught-async-errors) - Missing error handling

**Mutable State Issues**:

- [Excessive Mutability](#8-excessive-mutability) - Overusing `var` instead of `final`
- [Shared Mutable State](#9-shared-mutable-state) - Global mutable variables
- [Modifying Collections In-Place](#10-modifying-collections-in-place) - Side effects on shared collections

**Memory Leaks**:

- [Unclosed Streams](#11-unclosed-streams) - Not closing StreamControllers
- [Uncanceled Subscriptions](#12-uncanceled-subscriptions) - Leaking stream subscriptions
- [Uncanceled Timers](#13-uncanceled-timers) - Forgetting to cancel timers

**Type System Abuse**:

- [Inappropriate Dynamic](#14-inappropriate-dynamic) - Overusing `dynamic`
- [Type Casting Instead of Guards](#15-type-casting-instead-of-guards) - Unsafe `as` casts
- [Breaking Encapsulation](#16-breaking-encapsulation) - Exposing internal state

**Testing Anti-Patterns**:

- [No Tests](#17-no-tests) - Skipping testing entirely
- [Testing Implementation](#18-testing-implementation) - Testing private methods
- [Brittle Tests](#19-brittle-tests) - Over-specific assertions

### Quick Warning Signs

```dart
// ❌ Anti-pattern indicators
value!                              // Null assertion (!)
dynamic data                        // Overusing dynamic
var mutable = 1; mutable = 2;      // Mutable state
fetchData(); // Missing await       // Forgotten await
global List<String> cache = [];    // Global mutable state
await fetch1(); await fetch2();    // Sequential when could be parallel
data as String                      // Unchecked cast
```

## Overview

Dart anti-patterns are common mistakes that lead to bugs, poor performance, or unmaintainable code. This guide identifies these patterns and provides better alternatives.

This document covers **Dart 3.0+ anti-patterns** for the Open Sharia Enterprise platform, focusing on null safety violations, async pitfalls, and memory management issues.

### Why Avoid Anti-Patterns

- **Correctness**: Anti-patterns often lead to runtime errors and bugs
- **Maintainability**: Code becomes harder to understand and modify
- **Performance**: Many anti-patterns have performance implications
- **Safety**: Type safety and null safety protections are compromised
- **Testing**: Anti-patterns make code difficult or impossible to test

### Target Audience

This document targets developers building Dart applications for the Open Sharia Enterprise platform, particularly those transitioning from other languages or learning Dart's null safety and async systems.

## Null Safety Violations

### 1. Unnecessary Null Assertions

**Anti-Pattern**: Overusing the `!` operator instead of proper null handling.

**Problem**: Runtime crashes when the value is unexpectedly null.

**❌ Bad Example**:

```dart
class DonationService {
  String? getDonorName(String donorId) {
    // Might return null
    return donors[donorId]?.name;
  }

  void processDonation(String donorId, double amount) {
    // ❌ Risky null assertion
    final name = getDonorName(donorId)!; // Crashes if null!
    print('Processing donation from $name');
  }
}
```

**✅ Good Solution**:

```dart
class DonationService {
  String? getDonorName(String donorId) {
    return donors[donorId]?.name;
  }

  void processDonation(String donorId, double amount) {
    // ✅ Safe null handling
    final name = getDonorName(donorId) ?? 'Anonymous';
    print('Processing donation from $name');

    // Or use explicit null check
    final donorName = getDonorName(donorId);
    if (donorName != null) {
      print('Processing donation from $donorName');
    }
  }
}
```

**Islamic Finance Example**:

```dart
class ZakatCalculationService {
  // ❌ Bad - null assertion
  Future<double> calculateZakatBad(String userId) async {
    final wealth = await fetchUserWealth(userId);
    return wealth! * 0.025; // ❌ Crashes if wealth is null
  }

  // ✅ Good - proper null handling
  Future<double> calculateZakat(String userId) async {
    final wealth = await fetchUserWealth(userId);

    if (wealth == null) {
      throw ZakatCalculationException('Wealth data not found for user $userId');
    }

    return wealth * 0.025;
  }

  // ✅ Alternative - default value
  Future<double> calculateZakatWithDefault(String userId) async {
    final wealth = await fetchUserWealth(userId) ?? 0.0;
    return wealth * 0.025;
  }

  Future<double?> fetchUserWealth(String userId) async {
    // Fetch from database
    return null; // Example
  }
}
```

### 2. Nullable Everything

**Anti-Pattern**: Making all fields nullable when they should be required.

**Problem**: Forces null checks everywhere and loses type safety benefits.

**❌ Bad Example**:

```dart
class MurabahaContract {
  String? contractId;     // ❌ Should always be present
  double? assetCost;      // ❌ Should always be present
  double? profitRate;     // ❌ Should always be present
  int? installmentMonths; // ❌ Should always be present

  // Now every usage requires null checks
  double? getTotalAmount() {
    if (assetCost != null && profitRate != null) {
      return assetCost! * (1 + profitRate!);
    }
    return null;
  }
}
```

**✅ Good Solution**:

```dart
class MurabahaContract {
  final String contractId;      // ✅ Non-nullable required field
  final double assetCost;       // ✅ Non-nullable required field
  final double profitRate;      // ✅ Non-nullable required field
  final int installmentMonths;  // ✅ Non-nullable required field
  final String? notes;          // ✅ Legitimately optional

  MurabahaContract({
    required this.contractId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
    this.notes,
  });

  // No null checks needed
  double get totalAmount => assetCost * (1 + profitRate);
}
```

### 3. Ignoring Null Safety

**Anti-Pattern**: Using `dynamic` or `Object?` to bypass null safety.

**Problem**: Loses all type safety benefits and nullability guarantees.

**❌ Bad Example**:

```dart
// ❌ Using dynamic to avoid null safety
dynamic fetchDonationAmount(String donationId) {
  // Could return null, could return number, no safety
  return donations[donationId];
}

void processDonation() {
  final amount = fetchDonationAmount('don-123');
  // No compile-time safety!
  print(amount * 2); // Runtime error if null or non-numeric
}
```

**✅ Good Solution**:

```dart
// ✅ Proper typing with nullable return
double? fetchDonationAmount(String donationId) {
  return donations[donationId];
}

void processDonation() {
  final amount = fetchDonationAmount('don-123');

  if (amount != null) {
    print(amount * 2); // Safe - null checked
  } else {
    print('Donation not found');
  }
}
```

## Async Anti-Patterns

### 4. Forgotten Await

**Anti-Pattern**: Forgetting to `await` async operations.

**Problem**: Code continues without waiting for async result, leading to race conditions and incorrect behavior.

**❌ Bad Example**:

```dart
class DonationProcessor {
  Future<void> processDonation(Donation donation) async {
    // ❌ Missing await - continues immediately!
    saveDonation(donation); // Future ignored!
    sendConfirmationEmail(donation.donorId); // Might send before save completes!

    print('Donation processed'); // Prints before save completes!
  }

  Future<void> saveDonation(Donation donation) async {
    // Save to database
  }

  Future<void> sendConfirmationEmail(String donorId) async {
    // Send email
  }
}
```

**✅ Good Solution**:

```dart
class DonationProcessor {
  Future<void> processDonation(Donation donation) async {
    // ✅ Await async operations
    await saveDonation(donation);
    await sendConfirmationEmail(donation.donorId);

    print('Donation processed'); // Correct timing
  }

  Future<void> saveDonation(Donation donation) async {
    // Save to database
  }

  Future<void> sendConfirmationEmail(String donorId) async {
    // Send email
  }
}
```

**Islamic Finance Example**:

```dart
class ZakatDistributionService {
  // ❌ Bad - missing await
  Future<void> distributeZakatBad(double amount) async {
    validateAmount(amount); // ❌ Future ignored!
    recordTransaction(amount); // ❌ Future ignored!
    print('Distribution complete'); // ❌ Prints before validation/recording!
  }

  // ✅ Good - proper await
  Future<void> distributeZakat(double amount) async {
    await validateAmount(amount);
    await recordTransaction(amount);
    await notifyRecipients(amount);
    print('Distribution complete'); // ✅ Correct timing
  }

  Future<void> validateAmount(double amount) async {
    if (amount <= 0) {
      throw ArgumentError('Amount must be positive');
    }
  }

  Future<void> recordTransaction(double amount) async {
    // Database operation
  }

  Future<void> notifyRecipients(double amount) async {
    // Send notifications
  }
}
```

### 5. Sequential Instead of Parallel

**Anti-Pattern**: Running independent async operations sequentially.

**Problem**: Unnecessary slowdown - operations that could run concurrently are forced to wait.

**❌ Bad Example**:

```dart
class ReportGenerator {
  // ❌ Bad - sequential (takes 3 seconds total)
  Future<ZakatReport> generateReportBad(String userId) async {
    final wealth = await fetchWealth(userId);        // 1 second
    final donations = await fetchDonations(userId);  // 1 second
    final nisab = await fetchNisab();                // 1 second

    return ZakatReport(wealth, donations, nisab);
  }

  Future<double> fetchWealth(String userId) async {
    await Future.delayed(Duration(seconds: 1));
    return 10000.0;
  }

  Future<List<Donation>> fetchDonations(String userId) async {
    await Future.delayed(Duration(seconds: 1));
    return [];
  }

  Future<double> fetchNisab() async {
    await Future.delayed(Duration(seconds: 1));
    return 5000.0;
  }
}
```

**✅ Good Solution**:

```dart
class ReportGenerator {
  // ✅ Good - parallel (takes 1 second total)
  Future<ZakatReport> generateReport(String userId) async {
    final results = await Future.wait([
      fetchWealth(userId),
      fetchDonations(userId),
      fetchNisab(),
    ]);

    final wealth = results[0] as double;
    final donations = results[1] as List<Donation>;
    final nisab = results[2] as double;

    return ZakatReport(wealth, donations, nisab);
  }

  // Or use record syntax (Dart 3.0+)
  Future<ZakatReport> generateReportWithRecords(String userId) async {
    final (wealth, donations, nisab) = await (
      fetchWealth(userId),
      fetchDonations(userId),
      fetchNisab(),
    ).wait;

    return ZakatReport(wealth, donations, nisab);
  }

  Future<double> fetchWealth(String userId) async {
    await Future.delayed(Duration(seconds: 1));
    return 10000.0;
  }

  Future<List<Donation>> fetchDonations(String userId) async {
    await Future.delayed(Duration(seconds: 1));
    return [];
  }

  Future<double> fetchNisab() async {
    await Future.delayed(Duration(seconds: 1));
    return 5000.0;
  }
}
```

### 6. Mixing Then and Async

**Anti-Pattern**: Mixing `.then()` with `async/await` in the same code.

**Problem**: Inconsistent style, harder to read, and easy to make mistakes.

**❌ Bad Example**:

```dart
// ❌ Mixed style - confusing
Future<void> processDonation(Donation donation) async {
  final validated = await validateDonation(donation);

  // ❌ Mixing .then() with async/await
  saveDonation(donation).then((result) {
    print('Saved: $result');
  });

  await sendConfirmation(donation);
}
```

**✅ Good Solution**:

```dart
// ✅ Consistent async/await style
Future<void> processDonation(Donation donation) async {
  final validated = await validateDonation(donation);
  final result = await saveDonation(donation);
  print('Saved: $result');
  await sendConfirmation(donation);
}
```

### 7. Uncaught Async Errors

**Anti-Pattern**: Not handling errors in async operations.

**Problem**: Errors are silently swallowed or crash the application.

**❌ Bad Example**:

```dart
class DonationService {
  // ❌ No error handling
  Future<void> processDonationBad(Donation donation) async {
    await saveDonation(donation); // ❌ What if this fails?
    await sendEmail(donation);    // ❌ What if this fails?
  }

  Future<void> saveDonation(Donation donation) async {
    throw DatabaseException('Connection failed'); // Uncaught!
  }

  Future<void> sendEmail(Donation donation) async {
    throw NetworkException('SMTP error'); // Uncaught!
  }
}
```

**✅ Good Solution**:

```dart
class DonationService {
  final Logger _log;

  DonationService(this._log);

  // ✅ Proper error handling
  Future<void> processDonation(Donation donation) async {
    try {
      await saveDonation(donation);
      await sendEmail(donation);
    } on DatabaseException catch (e) {
      _log.error('Database error: $e');
      throw DonationProcessingException('Failed to save donation', e);
    } on NetworkException catch (e) {
      _log.warning('Email failed: $e - continuing anyway');
      // Don't fail entire operation for email error
    } catch (e, stackTrace) {
      _log.error('Unexpected error processing donation', e, stackTrace);
      rethrow;
    }
  }

  Future<void> saveDonation(Donation donation) async {
    // Database operation
  }

  Future<void> sendEmail(Donation donation) async {
    // Email operation
  }
}
```

## Mutable State Issues

### 8. Excessive Mutability

**Anti-Pattern**: Using `var` for everything instead of `final`.

**Problem**: Makes code harder to reason about and introduces potential bugs.

**❌ Bad Example**:

```dart
class ZakatCalculator {
  // ❌ Mutable fields when they should be final
  var wealth = 0.0;
  var nisab = 0.0;
  var rate = 0.025;

  ZakatCalculator(this.wealth, this.nisab);

  double calculate() {
    // ❌ Mutable - could be accidentally modified
    rate = 0.03; // Bug! Rate should be constant
    return wealth * rate;
  }
}
```

**✅ Good Solution**:

```dart
class ZakatCalculator {
  // ✅ Immutable fields
  final double wealth;
  final double nisab;
  static const double rate = 0.025; // Const for constants

  ZakatCalculator(this.wealth, this.nisab);

  double calculate() {
    // rate = 0.03; // ❌ Compile error - cannot modify const
    return wealth >= nisab ? wealth * rate : 0.0;
  }
}
```

### 9. Shared Mutable State

**Anti-Pattern**: Using global mutable variables.

**Problem**: Hard to track modifications, causes bugs in concurrent code, makes testing impossible.

**❌ Bad Example**:

```dart
// ❌ Global mutable state
var globalDonationCache = <String, Donation>{};
var globalTotalDonations = 0.0;

class DonationService {
  void addDonation(Donation donation) {
    // ❌ Modifying global state - dangerous!
    globalDonationCache[donation.id] = donation;
    globalTotalDonations += donation.amount;
  }

  Donation? getDonation(String id) {
    // ❌ Reading global state
    return globalDonationCache[id];
  }
}
```

**✅ Good Solution**:

```dart
// ✅ Encapsulated state
class DonationService {
  final Map<String, Donation> _donationCache = {};
  double _totalDonations = 0.0;

  void addDonation(Donation donation) {
    _donationCache[donation.id] = donation;
    _totalDonations += donation.amount;
  }

  Donation? getDonation(String id) {
    return _donationCache[id];
  }

  double get totalDonations => _totalDonations;
}
```

### 10. Modifying Collections In-Place

**Anti-Pattern**: Modifying collections passed as parameters.

**Problem**: Side effects that are hard to track, violates immutability principles.

**❌ Bad Example**:

```dart
// ❌ Modifies input list (side effect)
List<Donation> filterLargeDonationsBad(List<Donation> donations) {
  donations.removeWhere((d) => d.amount < 1000.0); // ❌ Modifies input!
  return donations;
}

void processDonations() {
  final allDonations = [
    Donation('d1', 500.0),
    Donation('d2', 1500.0),
  ];

  final large = filterLargeDonationsBad(allDonations);
  // ❌ allDonations is now modified!
  print(allDonations.length); // 1, not 2!
}
```

**✅ Good Solution**:

```dart
// ✅ Returns new list (no side effects)
List<Donation> filterLargeDonations(List<Donation> donations) {
  return donations.where((d) => d.amount >= 1000.0).toList();
}

void processDonations() {
  final allDonations = [
    Donation('d1', 500.0),
    Donation('d2', 1500.0),
  ];

  final large = filterLargeDonations(allDonations);
  // ✅ allDonations unchanged
  print(allDonations.length); // 2
  print(large.length); // 1
}
```

## Memory Leaks

### 11. Unclosed Streams

**Anti-Pattern**: Not closing StreamControllers.

**Problem**: Memory leaks and resource exhaustion.

**❌ Bad Example**:

```dart
class DonationNotifier {
  // ❌ Never closed - memory leak!
  final _controller = StreamController<Donation>();

  Stream<Donation> get donations => _controller.stream;

  void notifyDonation(Donation donation) {
    _controller.add(donation);
  }

  // ❌ Missing dispose method
}
```

**✅ Good Solution**:

```dart
class DonationNotifier {
  final _controller = StreamController<Donation>();

  Stream<Donation> get donations => _controller.stream;

  void notifyDonation(Donation donation) {
    _controller.add(donation);
  }

  // ✅ Dispose method to close stream
  Future<void> dispose() async {
    await _controller.close();
  }
}

// Usage
final notifier = DonationNotifier();
// Use notifier...
await notifier.dispose(); // ✅ Always close
```

### 12. Uncanceled Subscriptions

**Anti-Pattern**: Not canceling stream subscriptions.

**Problem**: Listeners keep running even when no longer needed, causing memory leaks.

**❌ Bad Example**:

```dart
class DonationDashboard {
  // ❌ Subscription never canceled
  void startListening(Stream<Donation> donations) {
    donations.listen((donation) {
      print('Received: ${donation.amount}');
      // ❌ Listener keeps running forever!
    });
  }
}
```

**✅ Good Solution**:

```dart
class DonationDashboard {
  StreamSubscription<Donation>? _subscription;

  void startListening(Stream<Donation> donations) {
    _subscription = donations.listen((donation) {
      print('Received: ${donation.amount}');
    });
  }

  // ✅ Cancel subscription when done
  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
```

### 13. Uncanceled Timers

**Anti-Pattern**: Not canceling periodic timers.

**Problem**: Timers continue running, wasting resources and causing unexpected behavior.

**❌ Bad Example**:

```dart
class ZakatReminder {
  // ❌ Timer never canceled
  void startReminders() {
    Timer.periodic(Duration(days: 30), (timer) {
      sendZakatReminder();
      // ❌ Runs forever!
    });
  }

  void sendZakatReminder() {
    print('Time to pay Zakat!');
  }
}
```

**✅ Good Solution**:

```dart
class ZakatReminder {
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

  void sendZakatReminder() {
    print('Time to pay Zakat!');
  }
}
```

## Type System Abuse

### 14. Inappropriate Dynamic

**Anti-Pattern**: Using `dynamic` instead of proper types.

**Problem**: Loses type safety, no autocomplete, runtime errors.

**❌ Bad Example**:

```dart
// ❌ Everything is dynamic
class DonationProcessor {
  dynamic processDonation(dynamic donation) {
    // ❌ No type safety at all
    return donation['amount'] * 2; // Could crash!
  }

  dynamic calculateZakat(dynamic wealth) {
    // ❌ No compile-time checks
    return wealth * 0.025;
  }
}
```

**✅ Good Solution**:

```dart
// ✅ Proper typing
class DonationProcessor {
  double processDonation(Donation donation) {
    return donation.amount * 2; // ✅ Type-safe
  }

  double calculateZakat(double wealth) {
    return wealth * 0.025; // ✅ Type-safe
  }
}
```

### 15. Type Casting Instead of Guards

**Anti-Pattern**: Using `as` casts without checking type first.

**Problem**: Runtime errors when cast fails.

**❌ Bad Example**:

```dart
// ❌ Unsafe casting
void processDonation(Object data) {
  final donation = data as Donation; // ❌ Crashes if not Donation!
  print(donation.amount);
}
```

**✅ Good Solution**:

```dart
// ✅ Type guard with is check
void processDonation(Object data) {
  if (data is Donation) {
    // ✅ Type-safe - Dart knows data is Donation
    print(data.amount);
  } else {
    print('Not a donation');
  }
}

// ✅ Alternative - pattern matching (Dart 3.0+)
void processDonationPattern(Object data) {
  switch (data) {
    case Donation donation:
      print(donation.amount);
    default:
      print('Not a donation');
  }
}
```

### 16. Breaking Encapsulation

**Anti-Pattern**: Exposing internal mutable collections.

**Problem**: External code can modify internal state.

**❌ Bad Example**:

```dart
class DonationService {
  final List<Donation> _donations = [];

  // ❌ Exposes internal mutable list
  List<Donation> get donations => _donations;

  void addDonation(Donation donation) {
    _donations.add(donation);
  }
}

// Usage
final service = DonationService();
service.addDonation(Donation('d1', 100.0));

// ❌ External code can modify internal state!
service.donations.clear(); // Broke encapsulation!
```

**✅ Good Solution**:

```dart
class DonationService {
  final List<Donation> _donations = [];

  // ✅ Return unmodifiable view
  List<Donation> get donations => List.unmodifiable(_donations);

  // ✅ Or return copy
  List<Donation> get donationsCopy => [..._donations];

  void addDonation(Donation donation) {
    _donations.add(donation);
  }
}

// Usage
final service = DonationService();
service.addDonation(Donation('d1', 100.0));

// ✅ Cannot modify internal state
// service.donations.clear(); // Throws UnsupportedError
```

## Testing Anti-Patterns

### 17. No Tests

**Anti-Pattern**: Shipping code without tests.

**Problem**: No safety net for refactoring, bugs go unnoticed.

**❌ Bad Example**:

```dart
// ❌ No tests for critical business logic
class ZakatCalculator {
  double calculate(double wealth, double nisab) {
    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }

  // ❌ What if there's a bug? No tests to catch it!
}
```

**✅ Good Solution**:

```dart
// ✅ Comprehensive tests
// File: zakat_calculator_test.dart
import 'package:test/test.dart';
import 'package:zakat_calculator/zakat_calculator.dart';

void main() {
  group('ZakatCalculator', () {
    late ZakatCalculator calculator;

    setUp(() {
      calculator = ZakatCalculator();
    });

    test('calculates Zakat when wealth >= nisab', () {
      final result = calculator.calculate(10000.0, 5000.0);
      expect(result, equals(250.0));
    });

    test('returns 0 when wealth < nisab', () {
      final result = calculator.calculate(3000.0, 5000.0);
      expect(result, equals(0.0));
    });

    test('handles edge case: wealth == nisab', () {
      final result = calculator.calculate(5000.0, 5000.0);
      expect(result, equals(125.0));
    });
  });
}
```

### 18. Testing Implementation

**Anti-Pattern**: Testing private implementation details.

**Problem**: Brittle tests that break on refactoring.

**❌ Bad Example**:

```dart
// ❌ Testing private methods
class ZakatCalculator {
  double _applyRate(double amount) => amount * 0.025;

  double calculate(double wealth, double nisab) {
    return wealth >= nisab ? _applyRate(wealth) : 0.0;
  }
}

// ❌ Bad test - tests private method
test('_applyRate applies correct rate', () {
  final calculator = ZakatCalculator();
  // Can't actually test private method directly
  // This couples test to implementation
});
```

**✅ Good Solution**:

```dart
// ✅ Test public API only
test('calculates correct Zakat amount', () {
  final calculator = ZakatCalculator();
  final result = calculator.calculate(10000.0, 5000.0);

  // ✅ Tests behavior, not implementation
  expect(result, equals(250.0));
});
```

### 19. Brittle Tests

**Anti-Pattern**: Over-specific assertions that break easily.

**Problem**: Tests fail on minor, acceptable changes.

**❌ Bad Example**:

```dart
// ❌ Brittle test - too specific
test('generates report', () {
  final report = generateZakatReport(10000.0, 5000.0);

  // ❌ Breaks if format changes slightly
  expect(
    report,
    equals('Zakat Report\nWealth: \$10000.00\nNisab: \$5000.00\nZakat: \$250.00'),
  );
});
```

**✅ Good Solution**:

```dart
// ✅ Flexible test - checks key content
test('generates report with correct data', () {
  final report = generateZakatReport(10000.0, 5000.0);

  // ✅ Check key information is present
  expect(report, contains('10000.00'));
  expect(report, contains('5000.00'));
  expect(report, contains('250.00'));

  // Or parse and validate structure
  final parsed = parseZakatReport(report);
  expect(parsed.wealth, equals(10000.0));
  expect(parsed.nisab, equals(5000.0));
  expect(parsed.zakatAmount, equals(250.0));
});
```

## Related Documentation

**Core Dart**:

- [Dart Best Practices](./ex-soen-prla-da__best-practices.md) - Correct patterns
- [Dart Idioms](./ex-soen-prla-da__idioms.md) - Language patterns

**Specialized Topics**:

- [Null Safety](./ex-soen-prla-da__null-safety.md) - Sound null safety
- [Async Programming](./ex-soen-prla-da__async-programming.md) - Future and Stream
- [Testing](./ex-soen-prla-da__testing.md) - Testing strategies
- [Error Handling](./ex-soen-prla-da__error-handling.md) - Exception handling

**Platform**:

- [Programming Languages Index](../README.md) - Parent languages documentation

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (null safety, modern features)
