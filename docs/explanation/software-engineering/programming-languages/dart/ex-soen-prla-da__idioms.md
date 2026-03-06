---
title: "Dart Idioms"
description: Dart-specific patterns and idiomatic language usage for clean, maintainable code
category: explanation
subcategory: prog-lang
tags:
  - dart
  - idioms
  - patterns
  - cascade-notation
  - null-safety
  - extension-methods
  - mixins
  - named-constructors
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__anti-patterns.md
  - ./ex-soen-prla-da__null-safety.md
  - ./ex-soen-prla-da__oop.md
  - ../../../../../governance/development/pattern/functional-programming.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
updated: 2026-01-29
---

### Core Dart Idioms

**Syntactic Patterns**:

- [Cascade Notation](#1-cascade-notation) - Chaining operations on same object
- [Named Constructors](#2-named-constructors) - Multiple construction strategies
- [Factory Constructors](#3-factory-constructors) - Controlled instance creation
- [Extension Methods](#4-extension-methods) - Adding functionality to existing types

**Null Safety Patterns**:

- [Null Safety Operators](#5-null-safety-patterns) - ??, ?., !, late
- [Required Parameters](#6-required-parameters) - Mandatory named parameters
- [Late Variables](#7-late-variables) - Deferred initialization

**Collection Patterns**:

- [Collection Literals](#8-collection-literals) - Concise collection creation
- [Spread Operators](#9-spread-operators) - Collection merging
- [Collection If/For](#10-collection-if-and-for) - Conditional/iterative construction

**Language Features**:

- [String Interpolation](#11-string-interpolation) - Expression embedding
- [Const Constructors](#12-const-constructors) - Compile-time constants
- [Mixins](#13-mixins) - Code reuse without inheritance
- [Operator Overloading](#14-operator-overloading) - Domain-specific operators

### Quick Pattern Reference

```dart
// Cascade notation
final donation = Donation()
  ..amount = 100.0
  ..recipient = 'Orphanage'
  ..category = DonationType.sadaqah;

// Named constructor
final zakat = Payment.zakat(1000.0);
final sadaqah = Payment.sadaqah(500.0);

// Factory constructor
final instance = Singleton.instance;

// Extension method
extension MoneyExtension on double {
  String toUSD() => '\$${toStringAsFixed(2)}';
}

// Null safety
String name = user?.name ?? 'Guest';
late String config; // Initialized before use

// Collection literals
final numbers = [1, 2, 3];
final unique = {1, 2, 3};
final mapping = {'key': 'value'};

// Spread operator
final combined = [...list1, ...list2];

// Collection if/for
final qualified = [
  for (var donor in donors)
    if (donor.zakatEligible)
      donor.name,
];

// String interpolation
print('Zakat: ${amount * 0.025}');

// Const constructor
const nisab = Money(5000, 'USD');

// Mixin
class ZakatCalculator with ValidationMixin, LoggingMixin {}

// Operator overloading
Money operator +(Money other) => Money(amount + other.amount, currency);
```

## Overview

Dart idioms are established patterns that leverage Dart's language features for clean, maintainable code. These idioms reflect Dart's philosophy of optimized UI development, productive iteration, and sound null safety.

This guide covers **Dart 3.0+ idioms**, emphasizing null safety, modern syntax, and patterns aligned with the Open Sharia Enterprise platform's financial domain requirements.

### Why Dart Idioms Matter

- **Readability**: Idiomatic code is easier to understand and maintain
- **Type Safety**: Leverage Dart's sound null safety system
- **Performance**: Compiler optimizations for idiomatic patterns
- **Tooling**: Better IDE support for standard patterns
- **Community**: Align with Dart ecosystem conventions

### Target Audience

This document targets developers building Dart applications for the Open Sharia Enterprise platform, particularly those working on cross-platform mobile apps (Flutter), server-side services, and financial domain logic.

### 1. Cascade Notation

**Pattern**: Use `..` to perform multiple operations on the same object without repeating the variable name.

**Idiom**: "Cascade" operations on an object to configure it fluently.

**Basic Cascade**:

```dart
// ❌ Without cascade - repetitive
final donation = Donation();
donation.amount = 100.0;
donation.recipient = 'Masjid Fund';
donation.category = DonationType.sadaqah;
donation.timestamp = DateTime.now();

// ✅ With cascade - fluent
final donation = Donation()
  ..amount = 100.0
  ..recipient = 'Masjid Fund'
  ..category = DonationType.sadaqah
  ..timestamp = DateTime.now();
```

**Cascade with Method Calls**:

```dart
class ZakatCalculator {
  double wealth = 0.0;
  double nisab = 5000.0;

  void setWealth(double value) => wealth = value;
  void setNisab(double value) => nisab = value;
  double calculate() => wealth >= nisab ? wealth * 0.025 : 0.0;
}

// ❌ Without cascade
final calculator = ZakatCalculator();
calculator.setWealth(10000.0);
calculator.setNisab(5000.0);
final zakat = calculator.calculate();

// ✅ With cascade
final zakat = (ZakatCalculator()
  ..setWealth(10000.0)
  ..setNisab(5000.0))
  .calculate();
```

**Nested Cascades** (Use Sparingly):

```dart
class MurabahaContract {
  final List<Payment> payments = [];
  DateTime? startDate;

  void addPayment(Payment payment) => payments.add(payment);
}

final contract = MurabahaContract()
  ..startDate = DateTime.now()
  ..addPayment(Payment()
    ..amount = 500.0
    ..paymentDate = DateTime.now().add(Duration(days: 30)))
  ..addPayment(Payment()
    ..amount = 500.0
    ..paymentDate = DateTime.now().add(Duration(days: 60)));
```

**When to Use**:

- ✅ Configuring objects with multiple properties
- ✅ Building complex objects fluently
- ✅ Method chaining on mutable objects
- ❌ Avoid deep nesting (readability suffers)
- ❌ Avoid mixing cascades with conditional logic

**Islamic Finance Example**:

```dart
// Zakat calculation with cascade
final calculation = ZakatCalculation()
  ..wealth = 50000.0
  ..nisab = 5000.0
  ..goldPrice = 60.0
  ..silverPrice = 0.80
  ..calculationDate = DateTime.now()
  ..calculationType = CalculationType.wealth;

print('Zakat: ${calculation.calculate()}');
```

### 2. Named Constructors

**Pattern**: Use named constructors to provide multiple ways to create instances with clear semantic meaning.

**Idiom**: "Name your construction strategy" for domain clarity.

**Basic Named Constructors**:

```dart
class Payment {
  final double amount;
  final DateTime date;
  final PaymentType type;

  // Default constructor
  Payment({
    required this.amount,
    required this.date,
    required this.type,
  });

  // Named constructor for Zakat
  Payment.zakat(double amount)
      : amount = amount,
        date = DateTime.now(),
        type = PaymentType.zakat;

  // Named constructor for Sadaqah
  Payment.sadaqah(double amount)
      : amount = amount,
        date = DateTime.now(),
        type = PaymentType.sadaqah;

  // Named constructor for Murabaha payment
  Payment.murabaha({
    required double principal,
    required double profit,
  })  : amount = principal + profit,
        date = DateTime.now(),
        type = PaymentType.murabaha;
}

// Usage
final zakatPayment = Payment.zakat(1000.0);
final sadaqahPayment = Payment.sadaqah(500.0);
final murabahaPayment = Payment.murabaha(
  principal: 5000.0,
  profit: 500.0,
);
```

**Parsing Named Constructors**:

```dart
class Money {
  final double amount;
  final String currency;

  Money(this.amount, this.currency);

  // Named constructor for parsing
  Money.fromJson(Map<String, dynamic> json)
      : amount = (json['amount'] as num).toDouble(),
        currency = json['currency'] as String;

  // Named constructor for string parsing
  Money.parse(String value) {
    final parts = value.split(' ');
    if (parts.length != 2) {
      throw FormatException('Invalid money format: $value');
    }
    amount = double.parse(parts[0]);
    currency = parts[1];
  }

  // Convert to JSON
  Map<String, dynamic> toJson() => {
        'amount': amount,
        'currency': currency,
      };
}

// Usage
final money1 = Money.fromJson({'amount': 100.0, 'currency': 'USD'});
final money2 = Money.parse('50.00 EUR');
```

**Forwarding Named Constructors**:

```dart
class ZakatCalculation {
  final double wealth;
  final double nisab;

  ZakatCalculation({required this.wealth, required this.nisab});

  // Named constructor forwarding to main constructor
  ZakatCalculation.fromWealth(double wealth)
      : this(wealth: wealth, nisab: 5000.0);

  // Named constructor with validation
  ZakatCalculation.validated({
    required double wealth,
    required double nisab,
  }) : this(
          wealth: wealth >= 0 ? wealth : throw ArgumentError('Wealth must be non-negative'),
          nisab: nisab >= 0 ? nisab : throw ArgumentError('Nisab must be non-negative'),
        );

  double calculate() => wealth >= nisab ? wealth * 0.025 : 0.0;
}
```

**Islamic Finance Example**:

```dart
class DonationRecord {
  final String donorId;
  final double amount;
  final DonationType type;
  final DateTime timestamp;
  final String? notes;

  DonationRecord({
    required this.donorId,
    required this.amount,
    required this.type,
    required this.timestamp,
    this.notes,
  });

  // Zakat donation
  DonationRecord.zakat({
    required String donorId,
    required double amount,
    String? notes,
  }) : this(
          donorId: donorId,
          amount: amount,
          type: DonationType.zakat,
          timestamp: DateTime.now(),
          notes: notes,
        );

  // Sadaqah donation
  DonationRecord.sadaqah({
    required String donorId,
    required double amount,
    String? notes,
  }) : this(
          donorId: donorId,
          amount: amount,
          type: DonationType.sadaqah,
          timestamp: DateTime.now(),
          notes: notes,
        );

  // Emergency donation (Sadaqah Jariyah)
  DonationRecord.emergency({
    required String donorId,
    required double amount,
    required String cause,
  }) : this(
          donorId: donorId,
          amount: amount,
          type: DonationType.sadaqahJariyah,
          timestamp: DateTime.now(),
          notes: 'Emergency: $cause',
        );
}

// Usage
final zakatDonation = DonationRecord.zakat(
  donorId: 'donor-123',
  amount: 500.0,
  notes: 'Annual Zakat',
);

final emergencyDonation = DonationRecord.emergency(
  donorId: 'donor-456',
  amount: 1000.0,
  cause: 'Flood Relief',
);
```

### 3. Factory Constructors

**Pattern**: Use factory constructors to control instance creation, return cached instances, or return subtypes.

**Idiom**: "Control creation" for singletons, caching, or polymorphism.

**Singleton Pattern**:

```dart
class DatabaseConnection {
  static final DatabaseConnection _instance = DatabaseConnection._internal();

  // Private constructor
  DatabaseConnection._internal();

  // Factory constructor returns singleton
  factory DatabaseConnection() => _instance;

  void query(String sql) {
    print('Executing: $sql');
  }
}

// Usage - always returns same instance
final db1 = DatabaseConnection();
final db2 = DatabaseConnection();
assert(identical(db1, db2)); // true - same instance
```

**Factory with Subtype Selection**:

```dart
abstract class Transaction {
  final double amount;
  final DateTime timestamp;

  Transaction(this.amount, this.timestamp);

  // Factory constructor returns appropriate subtype
  factory Transaction.create({
    required double amount,
    required TransactionType type,
  }) {
    switch (type) {
      case TransactionType.zakat:
        return ZakatTransaction(amount);
      case TransactionType.sadaqah:
        return SadaqahTransaction(amount);
      case TransactionType.murabaha:
        return MurabahaTransaction(amount);
    }
  }

  String get description;
}

class ZakatTransaction extends Transaction {
  ZakatTransaction(double amount) : super(amount, DateTime.now());

  @override
  String get description => 'Zakat payment of \$${amount.toStringAsFixed(2)}';
}

class SadaqahTransaction extends Transaction {
  SadaqahTransaction(double amount) : super(amount, DateTime.now());

  @override
  String get description => 'Sadaqah donation of \$${amount.toStringAsFixed(2)}';
}

class MurabahaTransaction extends Transaction {
  MurabahaTransaction(double amount) : super(amount, DateTime.now());

  @override
  String get description => 'Murabaha payment of \$${amount.toStringAsFixed(2)}';
}

// Usage
final transaction = Transaction.create(
  amount: 1000.0,
  type: TransactionType.zakat,
);
print(transaction.description); // "Zakat payment of $1000.00"
```

**Factory with Caching**:

```dart
class NisabCalculator {
  final double goldPrice;
  final double silverPrice;

  static final Map<String, NisabCalculator> _cache = {};

  NisabCalculator._internal(this.goldPrice, this.silverPrice);

  // Factory with caching
  factory NisabCalculator({
    required double goldPrice,
    required double silverPrice,
  }) {
    final key = '${goldPrice}_$silverPrice';
    return _cache.putIfAbsent(
      key,
      () => NisabCalculator._internal(goldPrice, silverPrice),
    );
  }

  double calculateGoldNisab() => 85 * goldPrice; // 85 grams
  double calculateSilverNisab() => 595 * silverPrice; // 595 grams
}

// Usage - returns cached instance if prices match
final calc1 = NisabCalculator(goldPrice: 60.0, silverPrice: 0.80);
final calc2 = NisabCalculator(goldPrice: 60.0, silverPrice: 0.80);
assert(identical(calc1, calc2)); // true - same cached instance
```

**Islamic Finance Example**:

```dart
abstract class FinancialInstrument {
  final String id;
  final double amount;

  FinancialInstrument(this.id, this.amount);

  // Factory constructor for parsing JSON
  factory FinancialInstrument.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String;
    final id = json['id'] as String;
    final amount = (json['amount'] as num).toDouble();

    switch (type) {
      case 'murabaha':
        return MurabahaContract.fromJson(json);
      case 'musharaka':
        return MushараkaContract.fromJson(json);
      case 'ijara':
        return IjaraContract.fromJson(json);
      default:
        throw ArgumentError('Unknown instrument type: $type');
    }
  }

  double calculateProfit();
}

class MurabahaContract extends FinancialInstrument {
  final double profitRate;

  MurabahaContract({
    required String id,
    required double amount,
    required this.profitRate,
  }) : super(id, amount);

  factory MurabahaContract.fromJson(Map<String, dynamic> json) {
    return MurabahaContract(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      profitRate: (json['profitRate'] as num).toDouble(),
    );
  }

  @override
  double calculateProfit() => amount * profitRate;
}

// Similar classes for Musharaka and Ijara...
```

### 4. Extension Methods

**Pattern**: Add functionality to existing types without modifying their source code.

**Idiom**: "Extend existing types" for domain-specific operations.

**Basic Extension**:

```dart
// Extension on built-in type
extension MoneyDouble on double {
  String toUSD() => '\$${toStringAsFixed(2)}';
  String toEUR() => '€${toStringAsFixed(2)}';

  double applyZakatRate() => this * 0.025;
  bool isAboveNisab(double nisab) => this >= nisab;
}

// Usage
final wealth = 10000.0;
print(wealth.toUSD()); // "$10000.00"
print(wealth.applyZakatRate()); // 250.0
print(wealth.isAboveNisab(5000.0)); // true
```

**Extension on Custom Types**:

```dart
class Money {
  final double amount;
  final String currency;

  const Money(this.amount, this.currency);
}

extension MoneyOperations on Money {
  Money add(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Currency mismatch: $currency != ${other.currency}');
    }
    return Money(amount + other.amount, currency);
  }

  Money multiply(double factor) {
    return Money(amount * factor, currency);
  }

  bool isGreaterThan(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Cannot compare different currencies');
    }
    return amount > other.amount;
  }

  String format() => '${amount.toStringAsFixed(2)} $currency';
}

// Usage
final price1 = Money(100.0, 'USD');
final price2 = Money(50.0, 'USD');
final total = price1.add(price2);
print(total.format()); // "150.00 USD"
```

**Extension with Generics**:

```dart
extension ListExtension<T> on List<T> {
  T? firstWhereOrNull(bool Function(T) test) {
    for (var element in this) {
      if (test(element)) return element;
    }
    return null;
  }

  List<T> whereNotNull() {
    return where((element) => element != null).toList();
  }
}

// Usage
final donations = [
  Donation(100.0),
  Donation(200.0),
  Donation(50.0),
];

final largeDonation = donations.firstWhereOrNull((d) => d.amount > 150.0);
```

**Islamic Finance Example**:

```dart
class ZakatCalculation {
  final double wealth;
  final double nisab;

  ZakatCalculation(this.wealth, this.nisab);
}

extension ZakatCalculationExtension on ZakatCalculation {
  bool get isEligible => wealth >= nisab;

  double get zakatAmount => isEligible ? wealth * 0.025 : 0.0;

  String get eligibilityStatus => isEligible
      ? 'Eligible - Zakat: ${zakatAmount.toStringAsFixed(2)}'
      : 'Not eligible - Below nisab threshold';

  Map<String, dynamic> toReport() => {
        'wealth': wealth,
        'nisab': nisab,
        'eligible': isEligible,
        'zakatAmount': zakatAmount,
        'status': eligibilityStatus,
      };
}

// Usage
final calculation = ZakatCalculation(10000.0, 5000.0);
print(calculation.eligibilityStatus);
print(calculation.toReport());
```

### 5. Null Safety Patterns

**Pattern**: Use Dart's null safety operators for safe, concise null handling.

**Idiom**: "Make null explicit" with sound null safety.

**Null-Aware Operators**:

```dart
// ?? (null-coalescing)
String getUserName(String? name) {
  return name ?? 'Guest'; // Returns 'Guest' if name is null
}

// ?. (null-aware access)
String? getEmailDomain(User? user) {
  return user?.email?.split('@').last; // Returns null if user or email is null
}

// ??= (null-aware assignment)
String? cachedValue;
String getValue() {
  cachedValue ??= fetchFromDatabase(); // Assigns only if null
  return cachedValue!;
}

// ?[] (null-aware index)
Map<String, String>? settings;
String? theme = settings?['theme']; // Returns null if settings is null
```

**Null Assertion (!)**:

```dart
// Use ! when you KNOW the value is non-null
class DonationService {
  late String serviceId; // Will be initialized

  void initialize() {
    serviceId = 'service-123';
  }

  void processDonation(double amount) {
    // Safe - we know serviceId is initialized
    final id = serviceId; // No ! needed if you're certain

    // If you must use !
    final upperCaseId = serviceId.toUpperCase(); // Runtime error if not initialized
  }
}
```

**Late Variables**:

```dart
class ConfigurationService {
  late final String apiKey; // Initialized before use
  late final int port;

  ConfigurationService() {
    _loadConfiguration();
  }

  void _loadConfiguration() {
    apiKey = 'key-123'; // Must initialize before access
    port = 8080;
  }

  String getEndpoint() {
    return 'https://api.example.com:$port?key=$apiKey';
  }
}
```

**Islamic Finance Example**:

```dart
class DonationRecord {
  final String donorId;
  final double amount;
  final String? notes; // Nullable
  final DateTime timestamp;

  DonationRecord({
    required this.donorId,
    required this.amount,
    this.notes,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now(); // Default to now if null

  String getDisplayText() {
    // Null-aware operators
    final notesText = notes ?? 'No notes';
    final formattedAmount = amount.toStringAsFixed(2);

    return 'Donation: \$$formattedAmount - $notesText';
  }

  Map<String, dynamic> toJson() => {
        'donorId': donorId,
        'amount': amount,
        'notes': notes, // Can be null in JSON
        'timestamp': timestamp.toIso8601String(),
      };
}

// Usage
final donation1 = DonationRecord(
  donorId: 'donor-123',
  amount: 100.0,
  notes: 'Monthly Zakat',
);

final donation2 = DonationRecord(
  donorId: 'donor-456',
  amount: 50.0,
  // notes is null
);

print(donation1.getDisplayText()); // "Donation: $100.00 - Monthly Zakat"
print(donation2.getDisplayText()); // "Donation: $50.00 - No notes"
```

### 6. Required Parameters

**Pattern**: Use `required` keyword for mandatory named parameters.

**Idiom**: "Make mandatory parameters explicit" with `required`.

**Basic Required Parameters**:

```dart
class MurabahaContract {
  final String contractId;
  final double assetCost;
  final double profitRate;
  final int installmentMonths;

  MurabahaContract({
    required this.contractId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
  });

  double get totalAmount => assetCost * (1 + profitRate);
  double get monthlyPayment => totalAmount / installmentMonths;
}

// ❌ Compile error - missing required parameters
// final contract = MurabahaContract();

// ✅ Must provide all required parameters
final contract = MurabahaContract(
  contractId: 'MUR-001',
  assetCost: 10000.0,
  profitRate: 0.10,
  installmentMonths: 12,
);
```

**Mixing Required and Optional**:

```dart
class ZakatCalculation {
  final double wealth;
  final double nisab;
  final String? notes;
  final DateTime calculationDate;

  ZakatCalculation({
    required this.wealth,
    required this.nisab,
    this.notes, // Optional
    DateTime? calculationDate,
  }) : calculationDate = calculationDate ?? DateTime.now();

  double calculate() => wealth >= nisab ? wealth * 0.025 : 0.0;
}

// ✅ Required parameters must be provided
final calculation = ZakatCalculation(
  wealth: 10000.0,
  nisab: 5000.0,
  // notes and calculationDate are optional
);
```

**Islamic Finance Example**:

```dart
class DonationTransaction {
  final String transactionId;
  final String donorId;
  final double amount;
  final DonationType type;
  final String? recipientOrganization;
  final String? notes;
  final DateTime timestamp;

  DonationTransaction({
    required this.transactionId,
    required this.donorId,
    required this.amount,
    required this.type,
    this.recipientOrganization,
    this.notes,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now() {
    // Validation
    if (amount <= 0) {
      throw ArgumentError('Amount must be positive');
    }
  }

  bool get isZakat => type == DonationType.zakat;
  bool get isSadaqah => type == DonationType.sadaqah;
}

// Usage
final zakatTransaction = DonationTransaction(
  transactionId: 'TXN-001',
  donorId: 'donor-123',
  amount: 500.0,
  type: DonationType.zakat,
  notes: 'Annual Zakat payment',
);
```

### 7. Late Variables

**Pattern**: Use `late` modifier for variables that are initialized before use but not at declaration.

**Idiom**: "Defer initialization" with compile-time guarantees.

**Late Final Variables**:

```dart
class DatabaseService {
  late final String connectionString;
  late final int maxConnections;

  DatabaseService(Map<String, dynamic> config) {
    // Initialize late variables in constructor
    connectionString = config['connectionString'] as String;
    maxConnections = config['maxConnections'] as int? ?? 10;
  }

  void connect() {
    print('Connecting to: $connectionString');
  }
}
```

**Late with Lazy Initialization**:

```dart
class ZakatReportGenerator {
  late final String reportContent;

  ZakatReportGenerator() {
    // Expensive initialization - happens only once when first accessed
    reportContent = _generateReport();
  }

  String _generateReport() {
    // Expensive operation
    print('Generating report...');
    return 'Zakat Report for ${DateTime.now().year}';
  }

  void printReport() {
    print(reportContent); // Initialized on first access
  }
}

// Usage
final generator = ZakatReportGenerator();
// Report not generated yet
generator.printReport(); // "Generating report..." then prints
generator.printReport(); // Just prints (already generated)
```

**Late vs. Nullable**:

```dart
class ConfigService {
  // ❌ Nullable - requires null checks everywhere
  String? apiKey;

  void loadConfig() {
    apiKey = 'key-123';
  }

  void makeRequest() {
    // Must check for null
    if (apiKey != null) {
      print('Using key: $apiKey');
    }
  }
}

class BetterConfigService {
  // ✅ Late - non-nullable but deferred initialization
  late String apiKey;

  void loadConfig() {
    apiKey = 'key-123';
  }

  void makeRequest() {
    // No null check needed - guaranteed to be initialized
    print('Using key: $apiKey');
  }
}
```

**Islamic Finance Example**:

```dart
class MurabahaCalculationService {
  late final List<Payment> paymentSchedule;
  late final double totalProfit;

  final double assetCost;
  final double profitRate;
  final int installmentMonths;

  MurabahaCalculationService({
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
  }) {
    // Calculate once during initialization
    totalProfit = assetCost * profitRate;
    paymentSchedule = _generatePaymentSchedule();
  }

  List<Payment> _generatePaymentSchedule() {
    final totalAmount = assetCost + totalProfit;
    final monthlyAmount = totalAmount / installmentMonths;

    return List.generate(
      installmentMonths,
      (index) => Payment(
        amount: monthlyAmount,
        dueDate: DateTime.now().add(Duration(days: 30 * (index + 1))),
      ),
    );
  }
}

class Payment {
  final double amount;
  final DateTime dueDate;

  Payment({required this.amount, required this.dueDate});
}
```

### 8. Collection Literals

**Pattern**: Use collection literals for concise, readable collection creation.

**Idiom**: "Prefer literals over constructors" for collections.

**List Literals**:

```dart
// ❌ Verbose constructor syntax
final donations1 = List<double>();
donations1.add(100.0);
donations1.add(200.0);
donations1.add(50.0);

// ✅ Concise literal syntax
final donations2 = <double>[100.0, 200.0, 50.0];

// Type inference
final donations3 = [100.0, 200.0, 50.0]; // Inferred as List<double>
```

**Set Literals**:

```dart
// ❌ Verbose
final donorIds1 = Set<String>();
donorIds1.add('donor-1');
donorIds1.add('donor-2');

// ✅ Concise
final donorIds2 = <String>{'donor-1', 'donor-2'};

// Automatic deduplication
final unique = {1, 2, 2, 3}; // {1, 2, 3}
```

**Map Literals**:

```dart
// ❌ Verbose
final nisabValues1 = Map<String, double>();
nisabValues1['gold'] = 5100.0;
nisabValues1['silver'] = 476.0;

// ✅ Concise
final nisabValues2 = <String, double>{
  'gold': 5100.0,
  'silver': 476.0,
};

// Type inference
final nisabValues3 = {
  'gold': 5100.0,
  'silver': 476.0,
}; // Inferred as Map<String, double>
```

**Islamic Finance Example**:

```dart
class ZakatConfiguration {
  final Map<String, double> rates;
  final List<String> eligibleAssets;
  final Set<String> exemptCategories;

  ZakatConfiguration()
      : rates = {
          'wealth': 0.025,
          'crops': 0.10,
          'livestock': 0.025,
        },
        eligibleAssets = [
          'cash',
          'gold',
          'silver',
          'stocks',
          'business_inventory',
        ],
        exemptCategories = {
          'personal_residence',
          'personal_vehicle',
          'work_equipment',
        };

  bool isAssetEligible(String asset) => eligibleAssets.contains(asset);
  bool isExempt(String category) => exemptCategories.contains(category);
  double getRate(String type) => rates[type] ?? 0.025;
}

// Usage
final config = ZakatConfiguration();
print(config.isAssetEligible('gold')); // true
print(config.getRate('crops')); // 0.10
```

### 9. Spread Operators

**Pattern**: Use spread operators `...` and `...?` to merge collections inline.

**Idiom**: "Spread collections" for clean merging.

**Basic Spread**:

```dart
final list1 = [1, 2, 3];
final list2 = [4, 5, 6];

// ❌ Verbose
final combined1 = <int>[];
combined1.addAll(list1);
combined1.addAll(list2);

// ✅ Concise with spread
final combined2 = [...list1, ...list2]; // [1, 2, 3, 4, 5, 6]
```

**Null-Aware Spread**:

```dart
List<double>? optionalDonations;

// ❌ Manual null check
final allDonations1 = <double>[100.0, 200.0];
if (optionalDonations != null) {
  allDonations1.addAll(optionalDonations);
}

// ✅ Null-aware spread
final allDonations2 = [
  100.0,
  200.0,
  ...?optionalDonations, // Spreads if not null, ignored if null
];
```

**Spread with Maps**:

```dart
final defaults = {'theme': 'light', 'language': 'en'};
final userPrefs = {'theme': 'dark'};

// Merge maps (later entries override earlier)
final settings = {...defaults, ...userPrefs};
// {'theme': 'dark', 'language': 'en'}
```

**Islamic Finance Example**:

```dart
class DonationAggregator {
  final List<double> zakatDonations;
  final List<double> sadaqahDonations;
  final List<double>? emergencyDonations;

  DonationAggregator({
    required this.zakatDonations,
    required this.sadaqahDonations,
    this.emergencyDonations,
  });

  List<double> getAllDonations() {
    return [
      ...zakatDonations,
      ...sadaqahDonations,
      ...?emergencyDonations, // Include if present
    ];
  }

  double getTotalAmount() {
    final all = getAllDonations();
    return all.fold(0.0, (sum, amount) => sum + amount);
  }
}

// Usage
final aggregator = DonationAggregator(
  zakatDonations: [500.0, 1000.0],
  sadaqahDonations: [100.0, 200.0],
  emergencyDonations: [1500.0],
);

print(aggregator.getAllDonations());
// [500.0, 1000.0, 100.0, 200.0, 1500.0]
print(aggregator.getTotalAmount()); // 3300.0
```

### 10. Collection If and For

**Pattern**: Use `if` and `for` inside collection literals for conditional and iterative construction.

**Idiom**: "Build collections declaratively" with collection control flow.

**Collection If**:

```dart
bool includeEmergency = true;

final donationTypes = [
  'Zakat',
  'Sadaqah',
  if (includeEmergency) 'Emergency Fund',
];
// ['Zakat', 'Sadaqah', 'Emergency Fund']

// Multiple conditions
bool showZakat = true;
bool showSadaqah = false;

final types = [
  if (showZakat) 'Zakat',
  if (showSadaqah) 'Sadaqah',
];
// ['Zakat']
```

**Collection For**:

```dart
final donorIds = ['donor-1', 'donor-2', 'donor-3'];

// Generate donation records
final donations = [
  for (var id in donorIds)
    DonationRecord(donorId: id, amount: 100.0),
];
```

**Collection If-For Combined**:

```dart
class Donor {
  final String id;
  final bool zakatEligible;
  final double wealth;

  Donor(this.id, this.zakatEligible, this.wealth);
}

final donors = [
  Donor('donor-1', true, 10000.0),
  Donor('donor-2', false, 3000.0),
  Donor('donor-3', true, 15000.0),
];

// Filter and transform
final eligibleDonorNames = [
  for (var donor in donors)
    if (donor.zakatEligible)
      'Donor ${donor.id} - Wealth: ${donor.wealth}',
];
// ['Donor donor-1 - Wealth: 10000.0', 'Donor donor-3 - Wealth: 15000.0']
```

**Islamic Finance Example**:

```dart
class MurabahaPaymentScheduleGenerator {
  final double assetCost;
  final double profitRate;
  final int installmentMonths;
  final bool includeDownPayment;
  final double? downPaymentAmount;

  MurabahaPaymentScheduleGenerator({
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
    this.includeDownPayment = false,
    this.downPaymentAmount,
  });

  List<Payment> generateSchedule() {
    final totalProfit = assetCost * profitRate;
    final totalAmount = assetCost + totalProfit;

    final amountToFinance = includeDownPayment && downPaymentAmount != null
        ? totalAmount - downPaymentAmount!
        : totalAmount;

    final monthlyAmount = amountToFinance / installmentMonths;

    return [
      // Down payment if applicable
      if (includeDownPayment && downPaymentAmount != null)
        Payment(
          amount: downPaymentAmount!,
          dueDate: DateTime.now(),
          type: PaymentType.downPayment,
        ),

      // Monthly installments
      for (var i = 0; i < installmentMonths; i++)
        Payment(
          amount: monthlyAmount,
          dueDate: DateTime.now().add(Duration(days: 30 * (i + 1))),
          type: PaymentType.installment,
        ),
    ];
  }
}

enum PaymentType { downPayment, installment }

class Payment {
  final double amount;
  final DateTime dueDate;
  final PaymentType type;

  Payment({
    required this.amount,
    required this.dueDate,
    required this.type,
  });
}

// Usage
final generator = MurabahaPaymentScheduleGenerator(
  assetCost: 10000.0,
  profitRate: 0.10,
  installmentMonths: 12,
  includeDownPayment: true,
  downPaymentAmount: 2000.0,
);

final schedule = generator.generateSchedule();
// First payment is down payment, followed by 12 installments
```

### 11. String Interpolation

**Pattern**: Embed expressions directly in strings using `$` and `${}`.

**Idiom**: "Interpolate, don't concatenate" for readable string composition.

**Basic Interpolation**:

```dart
final donorName = 'Ahmed';
final amount = 500.0;

// ❌ Concatenation
final message1 = 'Thank you, ' + donorName + ', for your donation of $' + amount.toString();

// ✅ Interpolation
final message2 = 'Thank you, $donorName, for your donation of \$$amount';
```

**Expression Interpolation**:

```dart
final wealth = 10000.0;
final nisab = 5000.0;

// Simple variable
print('Wealth: $wealth');

// Expression with {}
print('Zakat amount: ${wealth * 0.025}');
print('Eligible: ${wealth >= nisab}');
print('Percentage: ${(wealth / nisab * 100).toStringAsFixed(1)}%');
```

**Method Calls**:

```dart
class Money {
  final double amount;
  final String currency;

  Money(this.amount, this.currency);

  String format() => '${amount.toStringAsFixed(2)} $currency';
}

final price = Money(1000.0, 'USD');
print('Total: ${price.format()}'); // "Total: 1000.00 USD"
```

**Islamic Finance Example**:

```dart
class ZakatReport {
  final String donorName;
  final double wealth;
  final double nisab;
  final DateTime calculationDate;

  ZakatReport({
    required this.donorName,
    required this.wealth,
    required this.nisab,
    required this.calculationDate,
  });

  double get zakatAmount => wealth >= nisab ? wealth * 0.025 : 0.0;
  bool get isEligible => wealth >= nisab;

  String generateReport() {
    return '''
Zakat Calculation Report
========================
Donor: $donorName
Date: ${calculationDate.toIso8601String().split('T').first}

Financial Details:
  Total Wealth: \$${wealth.toStringAsFixed(2)}
  Nisab Threshold: \$${nisab.toStringAsFixed(2)}
  Wealth/Nisab Ratio: ${(wealth / nisab * 100).toStringAsFixed(1)}%

Calculation:
  Eligible: ${isEligible ? 'Yes' : 'No'}
  Zakat Amount: \$${zakatAmount.toStringAsFixed(2)}
  Rate Applied: ${isEligible ? '2.5%' : 'N/A'}

${isEligible ? 'Please remit Zakat amount promptly.' : 'Wealth below nisab - no Zakat obligation.'}
''';
  }
}

// Usage
final report = ZakatReport(
  donorName: 'Ahmed Abdullah',
  wealth: 10000.0,
  nisab: 5000.0,
  calculationDate: DateTime.now(),
);

print(report.generateReport());
```

### 12. Const Constructors

**Pattern**: Create compile-time constant instances with `const` constructors.

**Idiom**: "Const by default" for immutable value types.

**Basic Const Constructor**:

```dart
class Money {
  final double amount;
  final String currency;

  // Const constructor - all fields must be final
  const Money(this.amount, this.currency);
}

// Compile-time constants
const nisabUSD = Money(5000.0, 'USD');
const nisabEUR = Money(4500.0, 'EUR');

// Identical instances
const m1 = Money(100.0, 'USD');
const m2 = Money(100.0, 'USD');
assert(identical(m1, m2)); // true - same instance
```

**Const Collections**:

```dart
class ZakatConfiguration {
  // Const collections
  static const zakatRates = {
    'wealth': 0.025,
    'agriculture': 0.10,
    'livestock': 0.025,
  };

  static const exemptAssets = [
    'personal_residence',
    'personal_vehicle',
    'tools_of_trade',
  ];
}

// Usage
final wealthRate = ZakatConfiguration.zakatRates['wealth']; // 0.025
```

**Benefits of Const**:

```dart
// Memory efficiency - same instance reused
const donation1 = Money(100.0, 'USD');
const donation2 = Money(100.0, 'USD');
// donation1 and donation2 point to same object in memory

// Performance - evaluated at compile time
const total = 100 + 200; // Computed at compile time

// Immutability guarantee
// donation1.amount = 200; // ❌ Compile error - const is deeply immutable
```

**Islamic Finance Example**:

```dart
class NisabThreshold {
  final double goldGrams;
  final double silverGrams;
  final String standard;

  const NisabThreshold({
    required this.goldGrams,
    required this.silverGrams,
    required this.standard,
  });

  // Predefined constants
  static const hanafi = NisabThreshold(
    goldGrams: 87.48,
    silverGrams: 612.36,
    standard: 'Hanafi',
  );

  static const shafi = NisabThreshold(
    goldGrams: 85.0,
    silverGrams: 595.0,
    standard: 'Shafi',
  );

  double calculateGoldNisab(double goldPrice) => goldGrams * goldPrice;
  double calculateSilverNisab(double silverPrice) => silverGrams * silverPrice;
}

// Usage - compile-time constants
const hanafi = NisabThreshold.hanafi;
const shafi = NisabThreshold.shafi;

print('Hanafi gold nisab at \$60/g: ${hanafi.calculateGoldNisab(60.0)}');
```

### 13. Mixins

**Pattern**: Reuse code across class hierarchies without inheritance.

**Idiom**: "Compose behavior with mixins" for horizontal code reuse.

**Basic Mixin**:

```dart
// Mixin for logging
mixin LoggingMixin {
  void log(String message) {
    print('[${DateTime.now()}] $message');
  }
}

// Mixin for validation
mixin ValidationMixin {
  bool validatePositive(double value, String fieldName) {
    if (value < 0) {
      throw ArgumentError('$fieldName must be non-negative');
    }
    return true;
  }
}

class ZakatCalculator with LoggingMixin, ValidationMixin {
  double calculateZakat(double wealth, double nisab) {
    log('Calculating Zakat');
    validatePositive(wealth, 'Wealth');
    validatePositive(nisab, 'Nisab');

    return wealth >= nisab ? wealth * 0.025 : 0.0;
  }
}

// Usage
final calculator = ZakatCalculator();
final zakat = calculator.calculateZakat(10000.0, 5000.0);
// Logs: "[2026-01-29...] Calculating Zakat"
```

**Mixin with `on` Constraint**:

```dart
abstract class Financial {
  double get amount;
}

// Mixin only applicable to Financial classes
mixin TaxCalculation on Financial {
  double calculateTax(double rate) {
    return amount * rate;
  }
}

class Invoice extends Financial with TaxCalculation {
  @override
  final double amount;

  Invoice(this.amount);
}

// Usage
final invoice = Invoice(1000.0);
print(invoice.calculateTax(0.10)); // 100.0
```

**Islamic Finance Example**:

```dart
// Mixin for Zakat eligibility
mixin ZakatEligibilityMixin {
  double get totalValue;

  bool isZakatEligible(double nisab) => totalValue >= nisab;

  double calculateZakat(double nisab) {
    return isZakatEligible(nisab) ? totalValue * 0.025 : 0.0;
  }
}

// Mixin for Islamic compliance validation
mixin ShariaComplianceMixin {
  bool isHalal(String assetType) {
    const prohibitedTypes = ['alcohol', 'gambling', 'interest-bearing'];
    return !prohibitedTypes.contains(assetType);
  }

  void validateCompliance(List<String> assetTypes) {
    for (var type in assetTypes) {
      if (!isHalal(type)) {
        throw ArgumentError('Asset type $type is not Sharia-compliant');
      }
    }
  }
}

class InvestmentPortfolio with ZakatEligibilityMixin, ShariaComplianceMixin {
  final Map<String, double> assets;

  InvestmentPortfolio(this.assets);

  @override
  double get totalValue => assets.values.fold(0.0, (sum, value) => sum + value);

  Map<String, dynamic> generateZakatReport(double nisab) {
    // Validate all assets are Sharia-compliant
    validateCompliance(assets.keys.toList());

    return {
      'totalValue': totalValue,
      'nisab': nisab,
      'eligible': isZakatEligible(nisab),
      'zakatAmount': calculateZakat(nisab),
      'assets': assets,
    };
  }
}

// Usage
final portfolio = InvestmentPortfolio({
  'stocks': 5000.0,
  'gold': 3000.0,
  'cash': 2000.0,
});

final report = portfolio.generateZakatReport(5000.0);
print(report);
```

### 14. Operator Overloading

**Pattern**: Define custom behavior for operators on domain types.

**Idiom**: "Make types natural" with operator overloading.

**Arithmetic Operators**:

```dart
class Money {
  final double amount;
  final String currency;

  const Money(this.amount, this.currency);

  // Addition
  Money operator +(Money other) {
    _validateCurrency(other);
    return Money(amount + other.amount, currency);
  }

  // Subtraction
  Money operator -(Money other) {
    _validateCurrency(other);
    return Money(amount - other.amount, currency);
  }

  // Multiplication by scalar
  Money operator *(double factor) {
    return Money(amount * factor, currency);
  }

  // Division by scalar
  Money operator /(double divisor) {
    return Money(amount / divisor, currency);
  }

  void _validateCurrency(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Currency mismatch: $currency vs ${other.currency}');
    }
  }
}

// Usage
const price1 = Money(100.0, 'USD');
const price2 = Money(50.0, 'USD');

final total = price1 + price2; // Money(150.0, 'USD')
final difference = price1 - price2; // Money(50.0, 'USD')
final doubled = price1 * 2; // Money(200.0, 'USD')
final halved = price1 / 2; // Money(50.0, 'USD')
```

**Comparison Operators**:

```dart
class Money {
  final double amount;
  final String currency;

  const Money(this.amount, this.currency);

  // Equality
  @override
  bool operator ==(Object other) {
    return other is Money &&
           amount == other.amount &&
           currency == other.currency;
  }

  @override
  int get hashCode => Object.hash(amount, currency);

  // Greater than
  bool operator >(Money other) {
    _validateCurrency(other);
    return amount > other.amount;
  }

  // Less than
  bool operator <(Money other) {
    _validateCurrency(other);
    return amount < other.amount;
  }

  // Greater than or equal
  bool operator >=(Money other) {
    _validateCurrency(other);
    return amount >= other.amount;
  }

  // Less than or equal
  bool operator <=(Money other) {
    _validateCurrency(other);
    return amount <= other.amount;
  }

  void _validateCurrency(Money other) {
    if (currency != other.currency) {
      throw ArgumentError('Cannot compare different currencies');
    }
  }
}

// Usage
const price1 = Money(100.0, 'USD');
const price2 = Money(50.0, 'USD');

print(price1 > price2); // true
print(price1 == Money(100.0, 'USD')); // true
```

**Index Operators**:

```dart
class PaymentSchedule {
  final List<Payment> _payments;

  PaymentSchedule(this._payments);

  // Index access
  Payment operator  => _payments[index];

  // Index assignment
  void operator []=(int index, Payment payment) {
    _payments[index] = payment;
  }

  int get length => _payments.length;
}

class Payment {
  final double amount;
  final DateTime dueDate;

  Payment(this.amount, this.dueDate);
}

// Usage
final schedule = PaymentSchedule([
  Payment(500.0, DateTime.now()),
  Payment(500.0, DateTime.now().add(Duration(days: 30))),
]);

final firstPayment = schedule[0]; // Using [] operator
schedule[1] = Payment(600.0, DateTime.now().add(Duration(days: 30))); // Using []= operator
```

**Islamic Finance Example**:

```dart
class ZakatableWealth {
  final double cash;
  final double gold;
  final double silver;
  final double stocks;
  final double businessAssets;

  const ZakatableWealth({
    this.cash = 0.0,
    this.gold = 0.0,
    this.silver = 0.0,
    this.stocks = 0.0,
    this.businessAssets = 0.0,
  });

  double get totalValue => cash + gold + silver + stocks + businessAssets;

  // Addition of wealth
  ZakatableWealth operator +(ZakatableWealth other) {
    return ZakatableWealth(
      cash: cash + other.cash,
      gold: gold + other.gold,
      silver: silver + other.silver,
      stocks: stocks + other.stocks,
      businessAssets: businessAssets + other.businessAssets,
    );
  }

  // Multiplication by factor (for growth projections)
  ZakatableWealth operator *(double factor) {
    return ZakatableWealth(
      cash: cash * factor,
      gold: gold * factor,
      silver: silver * factor,
      stocks: stocks * factor,
      businessAssets: businessAssets * factor,
    );
  }

  // Comparison based on total value
  bool operator >(ZakatableWealth other) => totalValue > other.totalValue;
  bool operator <(ZakatableWealth other) => totalValue < other.totalValue;
  bool operator >=(ZakatableWealth other) => totalValue >= other.totalValue;
  bool operator <=(ZakatableWealth other) => totalValue <= other.totalValue;

  @override
  bool operator ==(Object other) {
    return other is ZakatableWealth &&
           cash == other.cash &&
           gold == other.gold &&
           silver == other.silver &&
           stocks == other.stocks &&
           businessAssets == other.businessAssets;
  }

  @override
  int get hashCode => Object.hash(cash, gold, silver, stocks, businessAssets);

  double calculateZakat(double nisab) {
    return totalValue >= nisab ? totalValue * 0.025 : 0.0;
  }
}

// Usage
const wealth2024 = ZakatableWealth(
  cash: 5000.0,
  gold: 3000.0,
  stocks: 2000.0,
);

const wealth2025 = ZakatableWealth(
  cash: 6000.0,
  gold: 3500.0,
  stocks: 2500.0,
);

final totalWealth = wealth2024 + wealth2025;
final projectedWealth = wealth2025 * 1.10; // 10% growth

print('Total: ${totalWealth.totalValue}');
print('Projected: ${projectedWealth.totalValue}');
print('2025 > 2024: ${wealth2025 > wealth2024}'); // true
```

## Related Documentation

**Core Dart**:

- [Dart Best Practices](./ex-soen-prla-da__best-practices.md) - Production standards
- [Dart Anti-Patterns](./ex-soen-prla-da__anti-patterns.md) - Common mistakes

**Language Features**:

- [Null Safety](./ex-soen-prla-da__null-safety.md) - Sound null safety system
- [Object-Oriented Programming](./ex-soen-prla-da__oop.md) - OOP patterns
- [Collections](./ex-soen-prla-da__collections.md) - List, Set, Map

**Platform**:

- [Programming Languages Index](../README.md) - Parent languages documentation
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md) - Cross-language FP principles

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (null safety, modern features)
