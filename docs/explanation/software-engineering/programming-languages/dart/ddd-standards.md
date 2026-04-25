---
title: "Dart DDD Standards"
description: Authoritative OSE Platform Dart domain-driven design standards (aggregates, value-objects, repositories)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - ddd
  - domain-driven-design
  - aggregates
  - value-objects
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to implement Domain-Driven Design in THIS codebase, not WHAT DDD is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative DDD standards** for Dart development in the OSE Platform. Sharia-compliant financial domains (Zakat, Murabaha) require rich domain models with enforced invariants.

**Target Audience**: OSE Platform Dart developers implementing domain models for Zakat calculation, Murabaha contracts, and Islamic finance

**Scope**: Value Objects (records and immutable classes), Entities, Aggregate Roots, Repository interfaces, Domain Events, `freezed` for immutable models, sealed classes for domain states

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Generated Immutable Domain Models):

```dart
// Use freezed to generate immutable domain objects automatically
// Run: dart run build_runner build

import 'package:freezed_annotation/freezed_annotation.dart';

part 'murabaha_contract.freezed.dart';

@freezed
class MurabahaContract with _$MurabahaContract {
  const factory MurabahaContract({
    required ContractId id,
    required CustomerId customerId,
    required Money assetCost,
    required ProfitRate profitRate,
    required int installmentCount,
    @Default(ContractStatus.pending) ContractStatus status,
    @Default([]) List<Payment> payments,
  }) = _MurabahaContract;
}

// freezed auto-generates:
// - copyWith (immutable updates)
// - == and hashCode
// - toString
// - fromJson/toJson (if json_serializable added)
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Domain Invariants):

```dart
// CORRECT: Explicit invariant enforcement in aggregate root
class ZakatCalculation {
  final String id;
  final Money wealth;
  final Money nisab;
  late final Money _zakatAmount;

  ZakatCalculation({
    required this.id,
    required this.wealth,
    required this.nisab,
  }) {
    // Invariant 1: Wealth must be positive
    if (!wealth.isPositive) {
      throw ZakatInvariantException('Wealth must be positive: ${wealth.amount}');
    }
    // Invariant 2: Nisab must be positive
    if (!nisab.isPositive) {
      throw ZakatInvariantException('Nisab must be positive: ${nisab.amount}');
    }
    // Invariant 3: Same currency
    if (wealth.currency != nisab.currency) {
      throw ZakatInvariantException('Wealth and nisab must use same currency');
    }

    // Calculate zakat (only if above nisab)
    _zakatAmount = wealth.isGreaterThanOrEqual(nisab)
        ? wealth.multiply(0.025)
        : Money.zero(currency: wealth.currency);
  }

  Money get zakatAmount => _zakatAmount;
  bool get isEligible => wealth.isGreaterThanOrEqual(nisab);
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Value Objects):

```dart
// CORRECT: Value Object with immutable fields
@immutable
class Money {
  final double amount;
  final String currency;

  const Money({required this.amount, required this.currency}) {
    assert(amount >= 0, 'Money amount cannot be negative');
    assert(currency.isNotEmpty, 'Currency cannot be empty');
  }

  factory Money.zero({required String currency}) =>
      Money(amount: 0, currency: currency);

  bool get isPositive => amount > 0;
  bool get isZero => amount == 0;

  bool isGreaterThanOrEqual(Money other) {
    _assertSameCurrency(other);
    return amount >= other.amount;
  }

  Money add(Money other) {
    _assertSameCurrency(other);
    return Money(amount: amount + other.amount, currency: currency);
  }

  Money multiply(double factor) {
    return Money(amount: amount * factor, currency: currency);
  }

  void _assertSameCurrency(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Currency mismatch: $currency != ${other.currency}');
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Money &&
          other.amount == amount &&
          other.currency == currency;

  @override
  int get hashCode => Object.hash(amount, currency);

  @override
  String toString() => '${amount.toStringAsFixed(2)} $currency';
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Domain Logic):

```dart
// Pure domain calculation functions
Money calculateZakatAmount(Money wealth, Money nisab) {
  if (!wealth.isGreaterThanOrEqual(nisab)) return Money.zero(currency: wealth.currency);
  return wealth.multiply(0.025);
}

List<Money> generateInstallmentSchedule({
  required Money totalAmount,
  required int installmentCount,
}) {
  final baseAmount = totalAmount.amount / installmentCount;
  final roundedBase = (baseAmount * 100).floor() / 100;
  final remainder = totalAmount.amount - (roundedBase * installmentCount);

  return [
    Money(amount: roundedBase + remainder, currency: totalAmount.currency),
    ...List.generate(
      installmentCount - 1,
      (_) => Money(amount: roundedBase, currency: totalAmount.currency),
    ),
  ];
}
```

### 5. Reproducibility First

**PASS Example** (Deterministic Domain Operations):

```dart
// Inject ID generation for testability
class ZakatTransactionFactory {
  final String Function() _generateId;

  const ZakatTransactionFactory({String Function()? generateId})
      : _generateId = generateId ?? _defaultIdGenerator;

  static String _defaultIdGenerator() => 'TX-${DateTime.now().millisecondsSinceEpoch}';

  ZakatTransaction create({
    required String customerId,
    required Money wealth,
    required Money nisab,
  }) {
    return ZakatTransaction(
      id: _generateId(), // Injected - testable
      customerId: customerId,
      wealth: wealth,
      zakatAmount: calculateZakatAmount(wealth, nisab),
    );
  }
}
```

## Part 1: Value Objects

### Using Records (Dart 3.0+)

**SHOULD** use records for simple value types without behavior.

```dart
// Dart 3.0+ record type aliases
typedef ContractId = ({String value});
typedef CustomerId = ({String value});

// Usage
const contractId = (value: 'CONTRACT-001');
const customerId = (value: 'CUST-001');

// Records provide structural equality automatically
print(contractId == (value: 'CONTRACT-001')); // true

// Extension methods add behavior
extension ContractIdExtension on ContractId {
  bool get isValid => value.isNotEmpty && value.startsWith('CONTRACT-');
}
```

### Immutable Value Object Classes

**MUST** use immutable classes for Value Objects with behavior.

```dart
@immutable
class ProfitRate {
  final double value; // As decimal (0.08 = 8%)

  const ProfitRate(this.value) {
    assert(value >= 0, 'Profit rate cannot be negative');
    assert(value <= 1, 'Profit rate cannot exceed 100%');
  }

  factory ProfitRate.fromPercent(double percent) {
    return ProfitRate(percent / 100);
  }

  double get asPercent => value * 100;

  Money applyTo(Money principal) {
    return principal.multiply(value);
  }

  @override
  bool operator ==(Object other) =>
      other is ProfitRate && other.value == value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => '${asPercent.toStringAsFixed(2)}%';
}

// Using freezed for Value Objects with multiple fields
@freezed
class Address with _$Address {
  const factory Address({
    required String street,
    required String city,
    required String country,
    required String postalCode,
  }) = _Address;

  const Address._();

  // Custom logic with freezed
  bool get isValid =>
      street.isNotEmpty && city.isNotEmpty && country.isNotEmpty;
}
```

## Part 2: Entities

### Entity with Identity

**MUST** implement entities with explicit identity. Two entities with the same ID are the same entity regardless of other field values.

```dart
abstract class Entity<TId> {
  final TId id;

  const Entity(this.id);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Entity<TId> && other.id == id);

  @override
  int get hashCode => id.hashCode;
}

// Zakat Transaction Entity
class ZakatTransaction extends Entity<String> {
  final String customerId;
  final Money wealth;
  final Money zakatAmount;
  final DateTime paidAt;
  final String receiptNumber;

  ZakatTransaction({
    required String id,
    required this.customerId,
    required this.wealth,
    required this.zakatAmount,
    required this.paidAt,
    required this.receiptNumber,
  }) : super(id) {
    // Invariant: zakat amount must be consistent with wealth
    if (zakatAmount.amount > 0 && zakatAmount.currency != wealth.currency) {
      throw ZakatInvariantException('Zakat and wealth currencies must match');
    }
  }
}
```

## Part 3: Aggregate Roots

### Aggregate Root Pattern

**MUST** implement Aggregate Roots to enforce transactional consistency boundaries.

```dart
// MurabahaContract Aggregate Root
class MurabahaContractAggregate {
  final String id;
  final String customerId;
  final Money assetCost;
  final ProfitRate profitRate;
  final int installmentCount;

  ContractStatus _status;
  final List<Payment> _payments;
  final List<DomainEvent> _domainEvents;

  MurabahaContractAggregate({
    required this.id,
    required this.customerId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentCount,
  })  : _status = ContractStatus.pending,
        _payments = [],
        _domainEvents = [] {
    // Enforce aggregate invariants
    if (assetCost.amount <= 0) {
      throw MurabahaInvariantException('Asset cost must be positive');
    }
    if (installmentCount < 1 || installmentCount > 360) {
      throw MurabahaInvariantException(
          'Installment count must be between 1 and 360');
    }

    // Record creation event
    _domainEvents.add(MurabahaContractCreatedEvent(contractId: id));
  }

  // Aggregate state accessors
  ContractStatus get status => _status;
  List<Payment> get payments => List.unmodifiable(_payments);
  List<DomainEvent> get domainEvents => List.unmodifiable(_domainEvents);

  // Domain operations enforce invariants
  Money get totalAmount => assetCost.multiply(1 + profitRate.value);
  Money get totalPaid => _payments.fold(
        Money.zero(currency: assetCost.currency),
        (sum, p) => sum.add(p.amount),
      );
  Money get remainingBalance => totalAmount.add(
        Money(amount: -totalPaid.amount, currency: totalPaid.currency),
      );

  void activateContract() {
    if (_status != ContractStatus.pending) {
      throw MurabahaInvariantException(
          'Can only activate pending contracts, current: $_status');
    }
    _status = ContractStatus.active;
    _domainEvents.add(MurabahaContractActivatedEvent(contractId: id));
  }

  void recordPayment(Payment payment) {
    // Invariant: can only record payments for active contracts
    if (_status != ContractStatus.active) {
      throw MurabahaInvariantException(
          'Can only record payments for active contracts');
    }

    // Invariant: payment cannot exceed remaining balance
    if (payment.amount.amount > remainingBalance.amount) {
      throw InvalidPaymentException(
        paymentAmount: payment.amount.amount,
        remainingBalance: remainingBalance.amount,
      );
    }

    _payments.add(payment);
    _domainEvents.add(PaymentRecordedEvent(
      contractId: id,
      paymentAmount: payment.amount,
    ));

    // Auto-complete when fully paid
    if (remainingBalance.amount <= 0) {
      _status = ContractStatus.completed;
      _domainEvents.add(MurabahaContractCompletedEvent(contractId: id));
    }
  }

  void clearDomainEvents() {
    _domainEvents.clear();
  }
}
```

## Part 4: Repository Interfaces

**MUST** define repositories as abstract classes (interfaces) in the domain layer.

```dart
// Domain layer: abstract repository interface
abstract class ZakatTransactionRepository {
  Future<ZakatTransaction?> findById(String id);
  Future<List<ZakatTransaction>> findByCustomerId(String customerId);
  Future<ZakatTransaction> save(ZakatTransaction transaction);
  Future<void> delete(String id);
  Stream<List<ZakatTransaction>> watchByCustomerId(String customerId);
}

abstract class MurabahaContractRepository {
  Future<MurabahaContractAggregate?> findById(String id);
  Future<List<MurabahaContractAggregate>> findByCustomerId(String customerId);
  Future<void> save(MurabahaContractAggregate contract);
}

// Infrastructure layer: concrete implementation
class SqliteZakatTransactionRepository implements ZakatTransactionRepository {
  final Database _db;

  SqliteZakatTransactionRepository(this._db);

  @override
  Future<ZakatTransaction?> findById(String id) async {
    final result = _db.select(
      'SELECT * FROM zakat_transactions WHERE id = ?',
      [id],
    );
    if (result.isEmpty) return null;
    return _mapRowToEntity(result.first);
  }

  @override
  Future<ZakatTransaction> save(ZakatTransaction transaction) async {
    _db.execute(
      '''INSERT OR REPLACE INTO zakat_transactions
         (id, customer_id, wealth_amount, wealth_currency,
          zakat_amount, zakat_currency, paid_at, receipt_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
      [
        transaction.id,
        transaction.customerId,
        transaction.wealth.amount,
        transaction.wealth.currency,
        transaction.zakatAmount.amount,
        transaction.zakatAmount.currency,
        transaction.paidAt.toIso8601String(),
        transaction.receiptNumber,
      ],
    );
    return transaction;
  }

  ZakatTransaction _mapRowToEntity(Row row) {
    return ZakatTransaction(
      id: row['id'] as String,
      customerId: row['customer_id'] as String,
      wealth: Money(
        amount: row['wealth_amount'] as double,
        currency: row['wealth_currency'] as String,
      ),
      zakatAmount: Money(
        amount: row['zakat_amount'] as double,
        currency: row['zakat_currency'] as String,
      ),
      paidAt: DateTime.parse(row['paid_at'] as String),
      receiptNumber: row['receipt_number'] as String,
    );
  }
}
```

## Part 5: Domain Events

**SHOULD** implement Domain Events for cross-aggregate communication.

```dart
// Domain event base class
abstract class DomainEvent {
  final String eventId;
  final DateTime occurredAt;
  final String aggregateId;

  const DomainEvent({
    required this.eventId,
    required this.occurredAt,
    required this.aggregateId,
  });
}

// Specific domain events
class MurabahaContractCreatedEvent extends DomainEvent {
  final String contractId;

  MurabahaContractCreatedEvent({required this.contractId})
      : super(
          eventId: 'EVT-${DateTime.now().millisecondsSinceEpoch}',
          occurredAt: DateTime.now(),
          aggregateId: contractId,
        );
}

class PaymentRecordedEvent extends DomainEvent {
  final String contractId;
  final Money paymentAmount;

  PaymentRecordedEvent({
    required this.contractId,
    required this.paymentAmount,
  }) : super(
          eventId: 'EVT-${DateTime.now().millisecondsSinceEpoch}',
          occurredAt: DateTime.now(),
          aggregateId: contractId,
        );
}

class ZakatDueReminderEvent extends DomainEvent {
  final String customerId;
  final Money estimatedZakat;
  final DateTime dueDate;

  ZakatDueReminderEvent({
    required this.customerId,
    required this.estimatedZakat,
    required this.dueDate,
  }) : super(
          eventId: 'EVT-${DateTime.now().millisecondsSinceEpoch}',
          occurredAt: DateTime.now(),
          aggregateId: customerId,
        );
}
```

## Part 6: Sealed Classes for Domain States

**SHOULD** use sealed classes (Dart 3.0+) for exhaustive domain state handling.

```dart
// Sealed class for contract processing result
sealed class ZakatProcessingResult {}

class ZakatProcessingSuccess extends ZakatProcessingResult {
  final ZakatTransaction transaction;
  final Money zakatAmount;

  ZakatProcessingSuccess({
    required this.transaction,
    required this.zakatAmount,
  });
}

class ZakatProcessingBelowNisab extends ZakatProcessingResult {
  final Money wealth;
  final Money nisab;

  ZakatProcessingBelowNisab({required this.wealth, required this.nisab});
}

class ZakatProcessingValidationFailure extends ZakatProcessingResult {
  final List<String> errors;

  ZakatProcessingValidationFailure(this.errors);
}

// Exhaustive pattern matching - compiler ensures all cases handled
Widget buildResultWidget(ZakatProcessingResult result) => switch (result) {
  ZakatProcessingSuccess(:final zakatAmount) =>
    ZakatSuccessCard(amount: zakatAmount),
  ZakatProcessingBelowNisab(:final nisab) =>
    BelowNisabCard(nisab: nisab),
  ZakatProcessingValidationFailure(:final errors) =>
    ValidationErrorCard(errors: errors),
};
```

## Enforcement

DDD standards are enforced through:

- **Code reviews** - Domain model review against ubiquitous language
- **Unit tests** - Invariant enforcement tested (invalid state must throw)
- **Architecture tests** - Domain layer must not import infrastructure layer

**Pre-commit checklist**:

- [ ] Value Objects implement `==`, `hashCode`, are `@immutable`
- [ ] Aggregate Roots enforce all invariants in constructors/methods
- [ ] Repository interfaces defined in domain layer (abstract classes)
- [ ] Domain Events use past-tense naming (`ContractCreatedEvent`)
- [ ] Sealed classes used for exhaustive domain state (Dart 3.0+)
- [ ] `freezed` used for complex immutable value types

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions for domain objects
- [Error Handling Standards](./error-handling-standards.md) - Domain exception hierarchy
- [Testing Standards](./testing-standards.md) - Testing invariant enforcement
- [Type Safety Standards](./type-safety-standards.md) - Sealed classes and records

## Related Documentation

- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**DDD Libraries**: freezed, json_serializable
