---
title: "Dart Performance"
description: Performance optimization for Dart including VM performance, AOT vs JIT, memory management, collection optimization, async performance, isolates, profiling, and benchmarking
category: explanation
subcategory: prog-lang
tags:
  - dart
  - performance
  - optimization
  - profiling
  - memory-management
  - isolates
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__async-programming.md
  - ./ex-soen-prla-da__collections.md
principles:
  - automation-over-manual
updated: 2026-01-29
---

# Dart Performance

## Quick Reference

### Performance Best Practices

**Collection Optimization**:

```dart
// ❌ Slow - O(n*m)
List<Donation> filterBySlow(List<Donation> donations, List<String> ids) {
  return donations.where((d) => ids.contains(d.donorId)).toList();
}

// ✅ Fast - O(n+m)
List<Donation> filterByFast(List<Donation> donations, List<String> ids) {
  final idSet = ids.toSet();
  return donations.where((d) => idSet.contains(d.donorId)).toList();
}
```

**Lazy Evaluation**:

```dart
// Lazy - only computes when needed
final zakats = donations.map((d) => d.amount * 0.025);
final first = zakats.first; // Only calculates first element
```

**Const Constructors**:

```dart
const nisab = Money(5000.0, 'USD'); // Compile-time constant
```

## Overview

Dart provides excellent performance through JIT/AOT compilation, efficient memory management, and optimization features. Understanding performance characteristics is critical for financial applications processing large datasets.

This guide covers **Dart 3.0+ performance** optimization strategies.

## Dart VM Performance

### AOT vs JIT

**JIT (Development)**:

- Fast iteration with hot reload
- Runtime optimization
- Slower startup

**AOT (Production)**:

- Fast startup
- Smaller binary
- Better performance

```bash
# Compile to native
dart compile exe bin/zakat_calculator.dart

# Run compiled binary
./bin/zakat_calculator.exe
```

## Memory Management

### Avoid Memory Leaks

```dart
class DonationStream {
  final _controller = StreamController<Donation>();

  Stream<Donation> get stream => _controller.stream;

  void addDonation(Donation donation) {
    _controller.add(donation);
  }

  // ✅ Always dispose
  Future<void> dispose() async {
    await _controller.close();
  }
}
```

## Collection Optimization

```dart
// ✅ Use Set for lookups
final donorIds = donations.map((d) => d.donorId).toSet();
final exists = donorIds.contains('donor-1'); // O(1)

// ❌ Avoid List for lookups
final donorIdsList = donations.map((d) => d.donorId).toList();
final exists2 = donorIdsList.contains('donor-1'); // O(n)
```

## Async Performance

```dart
// ✅ Parallel execution
final results = await Future.wait([
  fetchWealth(),
  fetchNisab(),
  fetchExchangeRates(),
]);

// ❌ Sequential execution (slower)
final wealth = await fetchWealth();
final nisab = await fetchNisab();
final rates = await fetchExchangeRates();
```

## Profiling

```bash
# Profile Dart application
dart run --observe myapp.dart

# Flutter profiling
flutter run --profile
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Async Programming](./ex-soen-prla-da__async-programming.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
