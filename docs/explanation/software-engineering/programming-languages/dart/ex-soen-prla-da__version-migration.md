---
title: "Dart Version Migration"
description: Migrating Dart applications between versions including Dart 2.x to 3.0 migration, null safety migration, breaking changes, dependency compatibility, and migration tools
category: explanation
subcategory: prog-lang
tags:
  - dart
  - migration
  - null-safety
  - dart-3
  - breaking-changes
  - upgrade
related:
  - ./ex-soen-prla-da__null-safety.md
  - ./ex-soen-prla-da__best-practices.md
principles:
  - explicit-over-implicit
  - automation-over-manual
updated: 2026-01-29
---

# Dart Version Migration

## Quick Reference

### Migration Command

```bash
# Run Dart migration tool
dart migrate

# Review changes in browser UI
# Accept/reject suggestions
# Complete migration
```

### Key Changes in Dart 3.0

**Null Safety Mandatory**:

```dart
// Dart 2.x (optional null safety)
String? name;

// Dart 3.0 (mandatory null safety)
String name = 'Ahmed';  // Non-nullable by default
String? optionalName;   // Nullable with ?
```

**Class Modifiers**:

```dart
// Dart 3.0 - sealed classes
sealed class Transaction {}

class ZakatTransaction extends Transaction {}
class DonationTransaction extends Transaction {}
```

**Pattern Matching**:

```dart
// Dart 3.0 - switch expressions
String getType(Transaction transaction) {
  return switch (transaction) {
    ZakatTransaction() => 'Zakat',
    DonationTransaction() => 'Donation',
  };
}
```

## Overview

Dart version migrations, especially to Dart 3.0 with mandatory null safety, require systematic approaches. Understanding breaking changes and migration tools ensures smooth upgrades.

This guide covers **migrating to Dart 3.0+** from earlier versions.

## Dart 2.x to 3.0 Migration

### Breaking Changes

**1. Null Safety Mandatory**:

```dart
// Before (Dart 2.x)
String name;  // Could be null

// After (Dart 3.0)
String name = 'Ahmed';  // Must initialize or make nullable
String? optionalName;   // Explicitly nullable
```

**2. Constructor Tear-offs**:

```dart
// Before
List<Money> moneys = amounts.map((a) => Money(a, 'USD')).toList();

// After (constructor tear-off)
List<Money> moneys = amounts.map(Money.new).toList();
```

### Migration Process

**Step 1: Update Dependencies**:

```yaml
# pubspec.yaml
environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  http: ^1.1.0 # Null-safe versions
```

**Step 2: Run Migration Tool**:

```bash
dart migrate
```

**Step 3: Review Changes**:

The migration tool opens a web UI showing suggested changes:

- Nullable type annotations (?)
- Non-nullable assertions (!)
- Required parameters
- Late variables

**Step 4: Apply Changes**:

Accept/reject suggestions in the migration UI.

**Step 5: Test Thoroughly**:

```bash
dart test
```

## Common Migration Patterns

### Pattern 1: Optional to Nullable

```dart
// Before
void createDonation(String id, [String notes]) {
  // notes could be null
}

// After
void createDonation(String id, {String? notes}) {
  // notes explicitly nullable
}
```

### Pattern 2: Default Values

```dart
// Before
class Config {
  String apiUrl;
  Config([this.apiUrl = 'https://api.example.com']);
}

// After
class Config {
  final String apiUrl;
  Config({this.apiUrl = 'https://api.example.com'});
}
```

### Pattern 3: Late Initialization

```dart
// Before
class Service {
  String apiKey;  // Nullable

  void initialize(String key) {
    apiKey = key;
  }
}

// After
class Service {
  late String apiKey;  // Non-nullable, late initialization

  void initialize(String key) {
    apiKey = key;
  }
}
```

## Dependency Compatibility

```yaml
# Check dependency compatibility
dependencies:
  # Null-safe versions
  http: ^1.1.0
  logging: ^1.2.0

  # Legacy package (not null-safe)
  # old_package: ^0.5.0  # Remove or find alternative
```

## Testing After Migration

```dart
// Verify null safety
void main() {
  test('non-nullable types cannot be null', () {
    String name = 'Ahmed';
    // name = null;  // Compile error - good!

    String? optionalName;
    optionalName = null;  // OK - nullable type
  });

  test('required parameters enforced', () {
    // Donation('don-1');  // Compile error - missing parameters

    Donation(id: 'don-1', donorId: 'donor-1', amount: 100.0);  // OK
  });
}

class Donation {
  final String id;
  final String donorId;
  final double amount;

  Donation({
    required this.id,
    required this.donorId,
    required this.amount,
  });
}
```

## Related Documentation

- [Null Safety](./ex-soen-prla-da__null-safety.md)
- [Best Practices](./ex-soen-prla-da__best-practices.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (migration from 2.x)
