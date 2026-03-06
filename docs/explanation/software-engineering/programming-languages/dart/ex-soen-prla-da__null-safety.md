---
title: "Dart Null Safety"
description: Comprehensive guide to Dart's sound null safety system including non-nullable by default, nullable types, null-aware operators, late variables, migration strategies, and best practices
category: explanation
subcategory: prog-lang
tags:
  - dart
  - null-safety
  - type-safety
  - sound-null-safety
  - nullable-types
  - null-aware-operators
  - migration
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__idioms.md
  - ./ex-soen-prla-da__anti-patterns.md
  - ./ex-soen-prla-da__error-handling.md
principles:
  - explicit-over-implicit
  - immutability
updated: 2026-01-29
---

# Dart Null Safety

## Quick Reference

### Core Null Safety Concepts

**Type System**:

- [Non-Nullable by Default](#1-non-nullable-by-default) - Variables cannot be null unless marked
- [Nullable Types with ?](#2-nullable-types) - Explicit nullable annotation
- [Null Safety Guarantees](#3-null-safety-guarantees) - Compile-time safety

**Operators**:

- [Null-Aware Operators](#4-null-aware-operators) - ??, ?., ?[], ??=
- [Null Assertion (!)](#5-null-assertion-operator) - Force unwrap (use sparingly)
- [Type Promotion](#6-type-promotion) - Automatic null checks

**Language Features**:

- [Late Variables](#7-late-variables) - Deferred initialization
- [Required Parameters](#8-required-parameters) - Mandatory named parameters
- [Definite Assignment](#9-definite-assignment) - Flow analysis

**Migration**:

- [Migration Strategies](#10-null-safety-migration) - Migrating legacy code
- [Migration Tools](#11-migration-tools) - dart migrate command
- [Common Patterns](#12-common-migration-patterns) - Typical scenarios

### Quick Syntax Reference

```dart
// Non-nullable (default)
String name = 'Ahmed';           // Cannot be null
int age = 25;                    // Cannot be null

// Nullable (explicit with ?)
String? optionalName;            // Can be null
int? optionalAge;                // Can be null

// Null-aware operators
String greeting = name ?? 'Guest';           // Null coalescing
int? length = optionalName?.length;          // Null-aware access
String first = optionalName?[0] ?? '';       // Null-aware index
cache ??= loadFromDisk();                    // Null-aware assignment

// Null assertion (!)
String definite = optionalName!;             // Asserts non-null (risky)

// Late variables
late String config;                          // Initialized before use
late final String apiKey;                    // Late + final

// Required parameters
class User {
  User({required String id, String? email}); // id required, email optional
}

// Type promotion
void process(String? value) {
  if (value != null) {
    print(value.length); // value promoted to String (non-null)
  }
}
```

## Overview

Dart's sound null safety is a type system feature that eliminates null reference errors at compile time. Introduced in Dart 2.12 and mandatory in Dart 3.0+, null safety prevents the infamous "null pointer exception" that plagues many programming languages.

This guide covers **Dart 3.0+ null safety** for the Open Sharia Enterprise platform, focusing on practical patterns for financial domain applications where data integrity is critical.

### Why Null Safety Matters

- **Correctness**: Eliminates entire class of null reference errors
- **Reliability**: Guarantees at compile time, not runtime
- **Performance**: Compiler optimizations for non-nullable types
- **Developer Experience**: Better IDE support and autocomplete
- **Financial Domain**: Critical for handling monetary calculations where null could mean loss of funds

### Target Audience

This document targets developers building Dart applications for the Open Sharia Enterprise platform, particularly those handling financial calculations (Zakat, Murabaha, donations) where null safety prevents catastrophic errors.

## Core Null Safety Features

### 1. Non-Nullable by Default

**Pattern**: Variables are non-nullable unless explicitly marked with `?`.

**Principle**: "Null must be explicit" - the opposite of most languages.

**Basic Non-Nullable Types**:

```dart
// ✅ Non-nullable - cannot be null
String donorName = 'Ahmed Abdullah';
double amount = 1000.0;
int count = 5;
DateTime timestamp = DateTime.now();

// ❌ Compile error - cannot assign null
// donorName = null;
// amount = null;
```

**Class Fields**:

```dart
class Donation {
  // All fields non-nullable - must be initialized
  final String id;
  final String donorId;
  final double amount;
  final DateTime timestamp;

  Donation({
    required this.id,
    required this.donorId,
    required this.amount,
    required this.timestamp,
  });
}

// ✅ All required fields must be provided
final donation = Donation(
  id: 'don-123',
  donorId: 'donor-456',
  amount: 500.0,
  timestamp: DateTime.now(),
);

// ❌ Compile error - missing required fields
// final donation = Donation(id: 'don-123');
```

**Islamic Finance Example**:

```dart
class ZakatCalculation {
  // Core fields - non-nullable (always required)
  final String userId;
  final double wealth;
  final double nisab;
  final DateTime calculationDate;

  // Calculated fields - non-nullable (derived from core)
  late final bool isEligible;
  late final double zakatAmount;

  ZakatCalculation({
    required this.userId,
    required this.wealth,
    required this.nisab,
    DateTime? calculationDate,
  }) : calculationDate = calculationDate ?? DateTime.now() {
    // Calculate derived fields
    isEligible = wealth >= nisab;
    zakatAmount = isEligible ? wealth * 0.025 : 0.0;
  }

  // All getters return non-null values
  String get eligibilityStatus => isEligible
      ? 'Eligible - Zakat due: \$${zakatAmount.toStringAsFixed(2)}'
      : 'Not eligible - below nisab threshold';
}

// Usage - guaranteed non-null
final calculation = ZakatCalculation(
  userId: 'user-123',
  wealth: 10000.0,
  nisab: 5000.0,
);

// ✅ No null checks needed - compiler guarantees
print(calculation.userId.toUpperCase());
print(calculation.zakatAmount * 2);
```

### 2. Nullable Types

**Pattern**: Use `?` suffix to mark types as nullable.

**Principle**: "Make optionality explicit" - nullable types require explicit handling.

**Basic Nullable Types**:

```dart
// Nullable types - can be null
String? optionalName;        // null by default
int? optionalAge;            // null by default
double? optionalAmount;      // null by default

// Explicit null assignment
optionalName = null;         // ✅ OK
optionalName = 'Ahmed';      // ✅ OK

// Must handle null before using
// print(optionalName.length); // ❌ Compile error - might be null

// ✅ Safe access with null check
if (optionalName != null) {
  print(optionalName.length); // Safe - type promoted to String
}
```

**Optional Class Fields**:

```dart
class DonationRecord {
  // Required fields (non-nullable)
  final String id;
  final String donorId;
  final double amount;

  // Optional fields (nullable)
  final String? notes;              // Optional notes
  final String? receiptNumber;      // Optional receipt
  final String? category;           // Optional categorization

  DonationRecord({
    required this.id,
    required this.donorId,
    required this.amount,
    this.notes,              // Nullable - defaults to null
    this.receiptNumber,
    this.category,
  });

  // Method handling nullable fields
  String getDisplayText() {
    final buffer = StringBuffer();
    buffer.writeln('Donation: \$${amount.toStringAsFixed(2)}');

    // Null-aware access
    if (notes != null) {
      buffer.writeln('Notes: $notes');
    }

    if (receiptNumber != null) {
      buffer.writeln('Receipt: $receiptNumber');
    }

    return buffer.toString();
  }
}
```

**Islamic Finance Example**:

```dart
class MurabahaContract {
  // Core contract data (non-nullable)
  final String contractId;
  final String customerId;
  final double assetCost;
  final double profitRate;
  final int installmentMonths;
  final DateTime startDate;

  // Optional metadata (nullable)
  final String? notes;
  final String? collateralDescription;
  final DateTime? earlyPaymentDate;
  final double? earlyPaymentAmount;

  MurabahaContract({
    required this.contractId,
    required this.customerId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
    DateTime? startDate,
    this.notes,
    this.collateralDescription,
    this.earlyPaymentDate,
    this.earlyPaymentAmount,
  }) : startDate = startDate ?? DateTime.now();

  // Total amount (always calculable)
  double get totalAmount => assetCost * (1 + profitRate);

  // Monthly payment (always calculable)
  double get monthlyPayment => totalAmount / installmentMonths;

  // Check if early payment was made
  bool get hasEarlyPayment => earlyPaymentDate != null && earlyPaymentAmount != null;

  // Generate report handling nullable fields
  Map<String, dynamic> toReport() {
    return {
      'contractId': contractId,
      'customerId': customerId,
      'assetCost': assetCost,
      'profitRate': profitRate,
      'totalAmount': totalAmount,
      'monthlyPayment': monthlyPayment,
      'notes': notes ?? 'No notes',                    // Default for null
      'collateral': collateralDescription ?? 'None',   // Default for null
      'hasEarlyPayment': hasEarlyPayment,
      if (hasEarlyPayment) 'earlyPaymentAmount': earlyPaymentAmount,
    };
  }
}
```

### 3. Null Safety Guarantees

**Pattern**: Dart's null safety provides compile-time guarantees.

**Guarantees**:

1. **Non-nullable types never contain null**
2. **Nullable types must be checked before use**
3. **No null pointer exceptions** for properly written null-safe code
4. **Flow analysis** tracks null state through control flow

**Flow Analysis Example**:

```dart
void processWealth(double? wealth, double nisab) {
  // wealth is nullable here

  if (wealth == null) {
    print('Wealth data not available');
    return;
  }

  // ✅ Flow analysis: Dart knows wealth is non-null here
  final zakatAmount = wealth * 0.025; // No error!

  if (wealth >= nisab) {
    print('Eligible for Zakat: \$${zakatAmount.toStringAsFixed(2)}');
  }
}

void processWithEarlyReturn(String? donorId) {
  if (donorId == null) {
    return; // Early return
  }

  // ✅ Dart knows donorId is non-null after early return check
  print(donorId.toUpperCase());
  print(donorId.substring(0, 5));
}
```

**Definite Assignment Analysis**:

```dart
String getMessage(bool isEligible, double amount) {
  String message; // Uninitialized

  if (isEligible) {
    message = 'Zakat due: \$${amount.toStringAsFixed(2)}';
  } else {
    message = 'Not eligible for Zakat';
  }

  // ✅ Dart knows message is definitely assigned
  return message; // No error!
}

String getMessageBad(bool condition) {
  String message;

  if (condition) {
    message = 'True branch';
  }

  // ❌ Compile error - message might not be assigned
  // return message;
}
```

### 4. Null-Aware Operators

**Pattern**: Use null-aware operators for concise null handling.

**Null Coalescing Operator (`??`)**:

```dart
// Returns left if non-null, otherwise right
String getDonorName(String? name) {
  return name ?? 'Anonymous'; // Provides default
}

// Can chain multiple operators
String getDisplayName(String? firstName, String? lastName, String? username) {
  return firstName ?? lastName ?? username ?? 'Guest';
}

// Islamic Finance Example
double getZakatRate(String? assetType) {
  const rates = {
    'wealth': 0.025,
    'crops': 0.10,
    'livestock': 0.025,
  };

  return rates[assetType] ?? 0.025; // Default to 2.5%
}
```

**Null-Aware Access (`?.`)**:

```dart
// Accesses property/method only if receiver is non-null
int? getNameLength(String? name) {
  return name?.length; // Returns null if name is null
}

// Chaining null-aware access
String? getEmailDomain(User? user) {
  return user?.email?.split('@').last;
  // Returns null if user or email is null
}

// Islamic Finance Example
class Donor {
  final String id;
  final ContactInfo? contactInfo;

  Donor(this.id, this.contactInfo);
}

class ContactInfo {
  final String? email;
  final String? phone;

  ContactInfo({this.email, this.phone});
}

String? getDonorEmail(Donor? donor) {
  return donor?.contactInfo?.email;
  // Safely traverses nullable chain
}
```

**Null-Aware Index (`?[]`)**:

```dart
// Accesses map/list index only if receiver is non-null
String? getConfigValue(Map<String, String>? config, String key) {
  return config?[key]; // Returns null if config is null
}

// Islamic Finance Example
class NisabThresholds {
  final Map<String, double>? customThresholds;

  NisabThresholds({this.customThresholds});

  double getThreshold(String assetType) {
    // Try custom threshold first, fallback to defaults
    return customThresholds?[assetType] ?? getDefaultThreshold(assetType);
  }

  double getDefaultThreshold(String assetType) {
    const defaults = {
      'gold': 5100.0,
      'silver': 476.0,
      'cash': 5000.0,
    };
    return defaults[assetType] ?? 5000.0;
  }
}
```

**Null-Aware Assignment (`??=`)**:

```dart
String? cache;

void ensureCache() {
  // Assigns only if null
  cache ??= loadFromDisk();
}

// Islamic Finance Example
class ZakatCalculatorService {
  Map<String, double>? _exchangeRates;

  Future<Map<String, double>> getExchangeRates() async {
    // Load only once (lazy initialization)
    _exchangeRates ??= await fetchExchangeRates();
    return _exchangeRates!;
  }

  Future<Map<String, double>> fetchExchangeRates() async {
    // Fetch from API
    return {'USD': 1.0, 'EUR': 0.85};
  }
}
```

### 5. Null Assertion Operator (!)

**Pattern**: Use `!` to assert a value is non-null (use sparingly).

**Warning**: Runtime exception if value is actually null.

**When to Use**:

```dart
// ✅ Safe - you KNOW it's non-null from external context
String loadConfig() {
  final env = Platform.environment;
  // Environment variable definitely set in production
  return env['API_KEY']!; // Safe assertion
}

// ⚠️ Risky - prefer null-aware operators
String? getName() => 'Ahmed';

void printName() {
  final name = getName()!; // ⚠️ Could crash if getName() changes
  print(name);
}

// ✅ Better - use null-aware operator
void printNameSafe() {
  final name = getName() ?? 'Guest'; // Safer
  print(name);
}
```

**Islamic Finance Example**:

```dart
class DonationService {
  final Map<String, Donation> _donations = {};

  // ✅ Safe - we just added it
  void addDonation(Donation donation) {
    _donations[donation.id] = donation;
    final retrieved = _donations[donation.id]!; // Safe - we just added it
    print('Added: ${retrieved.id}');
  }

  // ❌ Risky - might not exist
  void processDonationBad(String donationId) {
    final donation = _donations[donationId]!; // ❌ Could crash!
    sendReceipt(donation);
  }

  // ✅ Better - handle null case
  void processDonation(String donationId) {
    final donation = _donations[donationId];

    if (donation != null) {
      sendReceipt(donation);
    } else {
      print('Donation $donationId not found');
    }
  }

  void sendReceipt(Donation donation) {
    print('Sending receipt for ${donation.id}');
  }
}
```

### 6. Type Promotion

**Pattern**: Dart automatically promotes nullable types to non-nullable after null checks.

**Basic Type Promotion**:

```dart
void processDonor(String? donorId) {
  // donorId is String? here

  if (donorId != null) {
    // ✅ donorId promoted to String (non-null)
    print(donorId.toUpperCase());
    print(donorId.substring(0, 5));
    // No null checks needed
  }
}

void processWithComparison(double? wealth) {
  // wealth is double? here

  if (wealth != null && wealth >= 5000.0) {
    // ✅ wealth promoted to double (non-null)
    final zakat = wealth * 0.025;
    print('Zakat: \$${zakat.toStringAsFixed(2)}');
  }
}
```

**Type Promotion with is**:

```dart
void processValue(Object value) {
  // value is Object here

  if (value is String) {
    // ✅ value promoted to String
    print(value.toUpperCase());
  } else if (value is int) {
    // ✅ value promoted to int
    print(value * 2);
  }
}
```

**Islamic Finance Example**:

```dart
class PaymentProcessor {
  void processPayment(Payment? payment) {
    if (payment == null) {
      print('No payment to process');
      return;
    }

    // ✅ payment promoted to Payment (non-null)
    print('Processing payment: ${payment.id}');
    print('Amount: \$${payment.amount.toStringAsFixed(2)}');

    if (payment.amount >= 1000.0) {
      generateReceipt(payment); // No null check needed
    }
  }

  void generateReceipt(Payment payment) {
    print('Receipt for ${payment.id}');
  }
}

class Payment {
  final String id;
  final double amount;

  Payment({required this.id, required this.amount});
}
```

### 7. Late Variables

**Pattern**: Use `late` for variables initialized after declaration but before first use.

**Basic Late Variables**:

```dart
// Late variable - initialized before use
late String apiKey;

void initializeConfig() {
  apiKey = loadApiKey();
}

void makeRequest() {
  // apiKey must be initialized before this
  print('Using key: $apiKey');
}

String loadApiKey() => 'key-123';
```

**Late Final Variables**:

```dart
class DatabaseConnection {
  late final String connectionString;
  late final int maxConnections;

  DatabaseConnection(Map<String, dynamic> config) {
    // Initialize late variables in constructor
    connectionString = config['connectionString'] as String;
    maxConnections = config['maxConnections'] as int? ?? 10;
  }

  void connect() {
    print('Connecting to: $connectionString');
  }
}
```

**Lazy Initialization with Late**:

```dart
class ReportGenerator {
  // Expensive initialization - happens only when first accessed
  late final String reportContent = _generateReport();

  String _generateReport() {
    print('Generating report...'); // Called once
    return 'Report for ${DateTime.now().year}';
  }

  void printReport() {
    print(reportContent); // Triggers initialization on first access
  }
}

// Usage
final generator = ReportGenerator();
// Report not generated yet
generator.printReport(); // "Generating report..." then prints
generator.printReport(); // Just prints (already generated)
```

**Islamic Finance Example**:

```dart
class ZakatCalculationService {
  late final double nisabThreshold;
  late final Map<String, double> exchangeRates;

  ZakatCalculationService() {
    _initialize();
  }

  Future<void> _initialize() async {
    nisabThreshold = await fetchNisabThreshold();
    exchangeRates = await fetchExchangeRates();
  }

  Future<double> fetchNisabThreshold() async {
    // Fetch from API
    await Future.delayed(Duration(seconds: 1));
    return 5000.0;
  }

  Future<Map<String, double>> fetchExchangeRates() async {
    // Fetch from API
    await Future.delayed(Duration(seconds: 1));
    return {'USD': 1.0, 'EUR': 0.85};
  }

  Future<double> calculateZakat(double wealth, String currency) async {
    // Wait for initialization
    while (!_isInitialized()) {
      await Future.delayed(Duration(milliseconds: 100));
    }

    final adjustedWealth = wealth * exchangeRates[currency]!;
    return adjustedWealth >= nisabThreshold ? adjustedWealth * 0.025 : 0.0;
  }

  bool _isInitialized() {
    try {
      // Access late variables to check initialization
      return nisabThreshold > 0 && exchangeRates.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
```

### 8. Required Parameters

**Pattern**: Use `required` keyword for mandatory named parameters.

**Basic Required Parameters**:

```dart
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

// ❌ Compile error - missing required parameters
// final donation = Donation();

// ✅ Must provide all required parameters
final donation = Donation(
  id: 'don-123',
  donorId: 'donor-456',
  amount: 500.0,
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
    required this.wealth,      // Required
    required this.nisab,       // Required
    this.notes,                // Optional (nullable)
    DateTime? calculationDate, // Optional with default
  }) : calculationDate = calculationDate ?? DateTime.now();
}
```

**Islamic Finance Example**:

```dart
class MurabahaContract {
  final String contractId;
  final String customerId;
  final double assetCost;
  final double profitRate;
  final int installmentMonths;
  final String? collateralDescription;
  final DateTime startDate;

  MurabahaContract({
    required this.contractId,
    required this.customerId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
    this.collateralDescription,        // Optional
    DateTime? startDate,
  }) : startDate = startDate ?? DateTime.now() {
    // Validation
    if (assetCost <= 0) {
      throw ArgumentError('Asset cost must be positive');
    }
    if (profitRate < 0) {
      throw ArgumentError('Profit rate cannot be negative');
    }
    if (installmentMonths <= 0) {
      throw ArgumentError('Installment months must be positive');
    }
  }

  double get totalAmount => assetCost * (1 + profitRate);
  double get monthlyPayment => totalAmount / installmentMonths;
}

// Usage
final contract = MurabahaContract(
  contractId: 'MUR-001',
  customerId: 'cust-456',
  assetCost: 10000.0,
  profitRate: 0.10,
  installmentMonths: 12,
  // collateralDescription is optional
);
```

### 9. Definite Assignment

**Pattern**: Dart's flow analysis ensures variables are definitely assigned before use.

**Basic Definite Assignment**:

```dart
String getMessage(bool isEligible) {
  String message;

  if (isEligible) {
    message = 'Eligible for Zakat';
  } else {
    message = 'Not eligible';
  }

  // ✅ Dart knows message is definitely assigned
  return message;
}
```

**Switch Statements**:

```dart
String getStatusMessage(DonationStatus status) {
  String message;

  switch (status) {
    case DonationStatus.pending:
      message = 'Donation pending';
      break;
    case DonationStatus.processed:
      message = 'Donation processed';
      break;
    case DonationStatus.failed:
      message = 'Donation failed';
      break;
  }

  // ✅ All cases covered - definitely assigned
  return message;
}

enum DonationStatus { pending, processed, failed }
```

**Islamic Finance Example**:

```dart
String calculateZakatMessage(double wealth, double nisab) {
  String eligibilityMessage;
  double zakatAmount;

  if (wealth >= nisab) {
    eligibilityMessage = 'You are eligible for Zakat';
    zakatAmount = wealth * 0.025;
  } else {
    eligibilityMessage = 'You are not eligible for Zakat';
    zakatAmount = 0.0;
  }

  // ✅ Both variables definitely assigned
  return '$eligibilityMessage. Amount: \$${zakatAmount.toStringAsFixed(2)}';
}
```

## Migration and Best Practices

### 10. Null Safety Migration

**Pattern**: Migrate legacy Dart code to null safety.

**Migration Strategy**:

1. Update dependencies to null-safe versions
2. Run `dart migrate` tool
3. Review and resolve migration suggestions
4. Test thoroughly
5. Enable null safety

**Before Migration** (Dart 2.x):

```dart
// Legacy code - no null safety
class Donation {
  String id;
  String donorId;
  double amount;
  String notes; // Could be null!

  Donation(this.id, this.donorId, this.amount, this.notes);
}

void processDonation(Donation donation) {
  // Unsafe - notes could be null
  print(donation.notes.toUpperCase()); // Runtime error if null!
}
```

**After Migration** (Dart 3.0+):

```dart
// Null-safe code
class Donation {
  final String id;
  final String donorId;
  final double amount;
  final String? notes; // Explicitly nullable

  Donation({
    required this.id,
    required this.donorId,
    required this.amount,
    this.notes,
  });
}

void processDonation(Donation donation) {
  // Safe - handles null
  final notesText = donation.notes ?? 'No notes';
  print(notesText.toUpperCase());
}
```

### 11. Migration Tools

**dart migrate Command**:

```bash
# Run migration tool
dart migrate

# Review suggested changes in browser
# Accept/reject suggestions
# Complete migration
```

**Migration Output**:

```
Migrating /path/to/project

Analyzing project...
  Found 50 files requiring migration
  Identified 120 null safety issues

Suggested changes:
  - Add 45 nullable type annotations (?)
  - Add 30 non-nullable assertions (!)
  - Add 25 null checks
  - Add 20 required parameters

Review changes at: http://localhost:8080
```

### 12. Common Migration Patterns

**Pattern 1: Optional Parameters**:

```dart
// Before
void createDonation(String id, String donorId, double amount, [String notes]) {
  // notes could be null
}

// After
void createDonation({
  required String id,
  required String donorId,
  required double amount,
  String? notes,
}) {
  // notes explicitly nullable
}
```

**Pattern 2: Default Values**:

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

**Pattern 3: Late Initialization**:

```dart
// Before
class Service {
  String apiKey; // Initialized later

  void initialize(String key) {
    apiKey = key;
  }
}

// After
class Service {
  late String apiKey; // Late initialization

  void initialize(String key) {
    apiKey = key;
  }
}
```

## Related Documentation

**Core Dart**:

- [Dart Best Practices](./ex-soen-prla-da__best-practices.md) - Production standards
- [Dart Idioms](./ex-soen-prla-da__idioms.md) - Language patterns
- [Dart Anti-Patterns](./ex-soen-prla-da__anti-patterns.md) - Common mistakes

**Specialized Topics**:

- [Error Handling](./ex-soen-prla-da__error-handling.md) - Exception handling
- [Async Programming](./ex-soen-prla-da__async-programming.md) - Future and Stream
- [OOP](./ex-soen-prla-da__oop.md) - Object-oriented programming

**Platform**:

- [Programming Languages Index](../README.md) - Parent languages documentation

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (sound null safety mandatory)
