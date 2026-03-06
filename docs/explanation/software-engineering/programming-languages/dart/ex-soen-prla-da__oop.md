---
title: "Dart Object-Oriented Programming"
description: OOP in Dart including classes, constructors, inheritance, abstract classes, mixins, interfaces, generics, class modifiers, and extension methods
category: explanation
subcategory: prog-lang
tags:
  - dart
  - oop
  - classes
  - inheritance
  - mixins
  - generics
  - interfaces
related:
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__functional-programming.md
principles:
  - explicit-over-implicit
  - immutability
updated: 2026-01-29
---

# Dart Object-Oriented Programming

## Quick Reference

### Core OOP Features

**Classes and Constructors**:

```dart
class Donation {
  final String id;
  final double amount;

  // Default constructor
  Donation(this.id, this.amount);

  // Named constructor
  Donation.zakat(String id, double wealth)
      : id = id,
        amount = wealth * 0.025;

  // Factory constructor
  factory Donation.fromJson(Map<String, dynamic> json) {
    return Donation(json['id'], json['amount']);
  }
}
```

**Inheritance and Abstract Classes**:

```dart
abstract class Transaction {
  final String id;
  final double amount;

  Transaction(this.id, this.amount);

  String get description; // Abstract getter
}

class DonationTransaction extends Transaction {
  DonationTransaction(String id, double amount) : super(id, amount);

  @override
  String get description => 'Donation of \$${amount}';
}
```

**Mixins**:

```dart
mixin ValidationMixin {
  void validatePositive(double value, String field) {
    if (value <= 0) throw ArgumentError('$field must be positive');
  }
}

class ZakatCalculator with ValidationMixin {
  double calculate(double wealth) {
    validatePositive(wealth, 'Wealth');
    return wealth * 0.025;
  }
}
```

**Generics**:

```dart
class Repository<T> {
  final List<T> _items = [];

  void add(T item) => _items.add(item);
  List<T> getAll() => List.unmodifiable(_items);
}

final donationRepo = Repository<Donation>();
```

## Overview

Dart provides comprehensive object-oriented programming features including classes, inheritance, abstract classes, mixins, interfaces, and generics. These features enable building robust, maintainable financial applications.

This guide covers **Dart 3.0+ OOP** with Islamic finance examples.

## Classes and Constructors

### Basic Class

```dart
class Money {
  final double amount;
  final String currency;

  Money(this.amount, this.currency);

  Money operator +(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Currency mismatch');
    }
    return Money(amount + other.amount, currency);
  }
}
```

### Named Constructors

```dart
class Payment {
  final double amount;
  final PaymentType type;
  final DateTime timestamp;

  Payment(this.amount, this.type, this.timestamp);

  Payment.zakat(double amount)
      : amount = amount,
        type = PaymentType.zakat,
        timestamp = DateTime.now();

  Payment.sadaqah(double amount)
      : amount = amount,
        type = PaymentType.sadaqah,
        timestamp = DateTime.now();
}

enum PaymentType { zakat, sadaqah }
```

### Factory Constructors

```dart
class Transaction {
  final String id;
  final double amount;

  Transaction._(this.id, this.amount);

  factory Transaction.create(double amount) {
    return Transaction._(generateId(), amount);
  }

  static String generateId() => 'txn-${DateTime.now().millisecondsSinceEpoch}';
}
```

## Inheritance

### Basic Inheritance

```dart
abstract class FinancialInstrument {
  final String id;
  final double amount;

  FinancialInstrument(this.id, this.amount);

  double calculateProfit();
}

class MurabahaContract extends FinancialInstrument {
  final double profitRate;

  MurabahaContract(String id, double amount, this.profitRate)
      : super(id, amount);

  @override
  double calculateProfit() => amount * profitRate;
}
```

## Mixins

### Mixin Example

```dart
mixin LoggingMixin {
  void log(String message) {
    print('[${DateTime.now()}] $message');
  }
}

mixin ValidationMixin {
  void validatePositive(double value, String field) {
    if (value <= 0) {
      throw ArgumentError('$field must be positive');
    }
  }
}

class ZakatService with LoggingMixin, ValidationMixin {
  double calculate(double wealth, double nisab) {
    log('Calculating Zakat');
    validatePositive(wealth, 'Wealth');
    validatePositive(nisab, 'Nisab');

    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}
```

## Generics

### Generic Classes

```dart
class Result<T, E> {
  final T? value;
  final E? error;

  Result.success(this.value) : error = null;
  Result.failure(this.error) : value = null;

  bool get isSuccess => value != null;
  bool get isFailure => error != null;
}

// Usage
Result<double, String> calculateZakat(double wealth) {
  if (wealth < 0) {
    return Result.failure('Wealth cannot be negative');
  }
  return Result.success(wealth * 0.025);
}
```

## Extension Methods

```dart
extension MoneyExtension on double {
  String toUSD() => '\$${toStringAsFixed(2)}';
  double applyZakatRate() => this * 0.025;
}

// Usage
final wealth = 10000.0;
print(wealth.toUSD()); // "$10000.00"
print(wealth.applyZakatRate()); // 250.0
```

## Related Documentation

- [Dart Idioms](./ex-soen-prla-da__idioms.md)
- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Functional Programming](./ex-soen-prla-da__functional-programming.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
