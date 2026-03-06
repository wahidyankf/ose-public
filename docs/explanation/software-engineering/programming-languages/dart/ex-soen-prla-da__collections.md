---
title: "Dart Collections"
description: Comprehensive guide to Dart collections including List, Set, Map, collection literals, spread operators, collection if/for, iterable operations, lazy evaluation, and immutable collections
category: explanation
subcategory: prog-lang
tags:
  - dart
  - collections
  - list
  - set
  - map
  - iterable
  - functional-programming
  - immutability
related:
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__functional-programming.md
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__performance.md
principles:
  - immutability
  - pure-functions
updated: 2026-01-29
---

# Dart Collections

## Quick Reference

### Core Collection Types

**List** - Ordered, indexed, allows duplicates
**Set** - Unordered, unique elements
**Map** - Key-value pairs

### Collection Operations

```dart
// List
final donations = [100.0, 200.0, 300.0];
donations.add(400.0);
final first = donations[0];
final filtered = donations.where((d) => d >= 200.0).toList();

// Set
final donorIds = {'donor-1', 'donor-2', 'donor-3'};
donorIds.add('donor-4');
final contains = donorIds.contains('donor-1');

// Map
final nisabValues = {'gold': 5100.0, 'silver': 476.0};
nisabValues['cash'] = 5000.0;
final goldNisab = nisabValues['gold'];

// Spread operator
final combined = [...list1, ...list2];

// Collection if/for
final eligible = [
  for (var donor in donors)
    if (donor.zakatEligible)
      donor.name,
];

// Functional operations
final total = donations.reduce((sum, amount) => sum + amount);
final doubled = donations.map((d) => d * 2).toList();
```

## Overview

Dart provides three main collection types (List, Set, Map) with rich APIs for functional-style transformations. Collections are fundamental to organizing and processing data in financial applications.

This guide covers **Dart 3.0+ collections** for the Open Sharia Enterprise platform, focusing on immutable patterns and functional operations for financial data processing.

## Collection Types

### List - Ordered Collection

```dart
// List literal
final donations = [100.0, 200.0, 300.0];

// Type annotation
final List<double> amounts = [100.0, 200.0];

// Empty list
final empty = <String>[];

// Fixed-length list
final fixed = List.filled(3, 0.0); // [0.0, 0.0, 0.0]

// List operations
donations.add(400.0);
donations.remove(100.0);
final first = donations.first;
final last = donations.last;
final length = donations.length;

// Islamic Finance Example
class DonationList {
  final List<double> _donations = [];

  void addDonation(double amount) {
    _donations.add(amount);
  }

  double get total => _donations.fold(0.0, (sum, d) => sum + d);

  List<double> getLargeDonations(double threshold) {
    return _donations.where((d) => d >= threshold).toList();
  }

  List<double> getDonations() => List.unmodifiable(_donations);
}
```

### Set - Unique Elements

```dart
// Set literal
final donorIds = {'donor-1', 'donor-2', 'donor-3'};

// Removes duplicates
final unique = {1, 2, 2, 3}; // {1, 2, 3}

// Set operations
donorIds.add('donor-4');
final contains = donorIds.contains('donor-1');
final union = set1.union(set2);
final intersection = set1.intersection(set2);

// Islamic Finance Example
class EligibleDonors {
  final Set<String> _eligible = {};

  void markEligible(String donorId) {
    _eligible.add(donorId);
  }

  bool isEligible(String donorId) => _eligible.contains(donorId);

  Set<String> getEligibleDonors() => Set.unmodifiable(_eligible);
}
```

### Map - Key-Value Pairs

```dart
// Map literal
final nisabValues = {
  'gold': 5100.0,
  'silver': 476.0,
  'cash': 5000.0,
};

// Access and modify
final goldNisab = nisabValues['gold'];
nisabValues['stocks'] = 5000.0;

// Null-safe access
final value = nisabValues['unknown'] ?? 0.0;

// Islamic Finance Example
class ZakatRates {
  final Map<String, double> _rates = {
    'wealth': 0.025,
    'crops': 0.10,
    'livestock': 0.025,
  };

  double getRate(String assetType) {
    return _rates[assetType] ?? 0.025; // Default 2.5%
  }

  void setRate(String assetType, double rate) {
    _rates[assetType] = rate;
  }

  Map<String, double> getRates() => Map.unmodifiable(_rates);
}
```

## Functional Operations

### Map, Where, Reduce

```dart
final donations = [100.0, 200.0, 300.0, 50.0];

// Map - transform each element
final doubled = donations.map((d) => d * 2).toList();
// [200.0, 400.0, 600.0, 100.0]

// Where - filter elements
final large = donations.where((d) => d >= 100.0).toList();
// [100.0, 200.0, 300.0]

// Reduce - combine all elements
final total = donations.reduce((sum, d) => sum + d);
// 650.0

// Fold - reduce with initial value
final totalWithInitial = donations.fold(0.0, (sum, d) => sum + d);

// Islamic Finance Example
class ZakatCalculator {
  double calculateTotalZakat(List<AssetValue> assets, double nisab) {
    return assets
        .where((asset) => asset.value >= nisab)
        .map((asset) => asset.value * 0.025)
        .fold(0.0, (total, zakat) => total + zakat);
  }

  List<String> getEligibleAssets(List<AssetValue> assets, double nisab) {
    return assets
        .where((asset) => asset.value >= nisab)
        .map((asset) => asset.name)
        .toList();
  }
}

class AssetValue {
  final String name;
  final double value;

  AssetValue(this.name, this.value);
}
```

## Immutable Collections

```dart
// Unmodifiable list
final donations = [100.0, 200.0, 300.0];
final immutable = List.unmodifiable(donations);
// immutable.add(400.0); // Error

// Unmodifiable set
final donorIds = {'donor-1', 'donor-2'};
final immutableSet = Set.unmodifiable(donorIds);

// Unmodifiable map
final rates = {'wealth': 0.025};
final immutableMap = Map.unmodifiable(rates);

// Islamic Finance Example
class DonationRecord {
  final String id;
  final List<double> amounts;

  DonationRecord(this.id, List<double> amounts)
      : amounts = List.unmodifiable(amounts);

  double get total => amounts.fold(0.0, (sum, a) => sum + a);
}
```

## Related Documentation

- [Dart Idioms](./ex-soen-prla-da__idioms.md)
- [Functional Programming](./ex-soen-prla-da__functional-programming.md)
- [Best Practices](./ex-soen-prla-da__best-practices.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
