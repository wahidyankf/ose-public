---
title: "Dart Functional Programming"
description: Functional programming in Dart including first-class functions, higher-order functions, pure functions, immutability, closures, function composition, and pattern matching
category: explanation
subcategory: prog-lang
tags:
  - dart
  - functional-programming
  - pure-functions
  - immutability
  - higher-order-functions
  - pattern-matching
related:
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__collections.md
  - ./ex-soen-prla-da__oop.md
  - ../../../../../governance/development/pattern/functional-programming.md
principles:
  - immutability
  - pure-functions
updated: 2026-01-29
---

# Dart Functional Programming

## Quick Reference

### Core FP Concepts

**First-Class Functions**:

```dart
double Function(double) zakatCalculator = (wealth) => wealth * 0.025;
final zakat = zakatCalculator(10000.0); // 250.0
```

**Higher-Order Functions**:

```dart
List<double> apply(List<double> amounts, double Function(double) fn) {
  return amounts.map(fn).toList();
}

final zakats = apply([10000.0, 15000.0], (w) => w * 0.025);
```

**Pure Functions**:

```dart
// Pure - no side effects, same input = same output
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}
```

**Immutability**:

```dart
class Money {
  final double amount;
  final String currency;

  const Money(this.amount, this.currency);

  Money add(Money other) {
    if (currency != other.currency) throw ArgumentError('Currency mismatch');
    return Money(amount + other.amount, currency);
  }
}
```

## Overview

Dart supports functional programming through first-class functions, immutability, and functional collection operations. FP principles lead to more predictable, testable code.

This guide covers **Dart 3.0+ functional programming** with Islamic finance examples.

## First-Class Functions

```dart
// Function as value
double Function(double) createMultiplier(double factor) {
  return (value) => value * factor;
}

final zakatCalculator = createMultiplier(0.025);
final zakat = zakatCalculator(10000.0); // 250.0
```

## Higher-Order Functions

```dart
List<double> transform(List<double> values, double Function(double) fn) {
  return values.map(fn).toList();
}

final amounts = [10000.0, 15000.0, 20000.0];
final zakats = transform(amounts, (w) => w * 0.025);
```

## Pure Functions

```dart
// Pure function - no side effects
double calculateZakat(double wealth, double nisab) {
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// Impure - has side effects
var totalZakat = 0.0;
void recordZakat(double amount) {
  totalZakat += amount; // Side effect
  print('Total: $totalZakat'); // Side effect
}

// Better - pure with explicit state passing
double addToTotal(double total, double amount) {
  return total + amount; // Pure
}
```

## Immutability

```dart
class ZakatCalculation {
  final double wealth;
  final double nisab;
  final double zakatAmount;

  ZakatCalculation(this.wealth, this.nisab)
      : zakatAmount = wealth >= nisab ? wealth * 0.025 : 0.0;

  // Returns new instance - immutable
  ZakatCalculation updateWealth(double newWealth) {
    return ZakatCalculation(newWealth, nisab);
  }
}
```

## Closures

```dart
double Function(double) createZakatCalculator(double nisab) {
  return (wealth) => wealth >= nisab ? wealth * 0.025 : 0.0;
}

final calculator = createZakatCalculator(5000.0);
print(calculator(10000.0)); // 250.0
print(calculator(3000.0)); // 0.0
```

## Function Composition

```dart
typedef Transformer = double Function(double);

Transformer compose(Transformer f, Transformer g) {
  return (x) => f(g(x));
}

final addTax = (amount) => amount * 1.10;
final applyZakat = (amount) => amount * 0.025;

final combined = compose(addTax, applyZakat);
final result = combined(10000.0);
```

## Pattern Matching (Dart 3.0+)

```dart
String getPaymentType(Object payment) {
  return switch (payment) {
    ZakatPayment() => 'Zakat',
    SadaqahPayment() => 'Sadaqah',
    _ => 'Unknown',
  };
}

class ZakatPayment {}
class SadaqahPayment {}
```

## Related Documentation

- [Dart Idioms](./ex-soen-prla-da__idioms.md)
- [Collections](./ex-soen-prla-da__collections.md)
- [Functional Programming Principle](../../../../../governance/development/pattern/functional-programming.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
