---
title: "Dart Async Programming"
description: Comprehensive guide to asynchronous programming in Dart including Future, async/await, Stream, error handling, isolates, and async patterns for concurrent operations
category: explanation
subcategory: prog-lang
tags:
  - dart
  - async
  - future
  - stream
  - async-await
  - concurrency
  - isolates
  - error-handling
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__anti-patterns.md
  - ./ex-soen-prla-da__error-handling.md
  - ./ex-soen-prla-da__performance.md
principles:
  - explicit-over-implicit
  - immutability
updated: 2026-01-29
---

# Dart Async Programming

## Quick Reference

### Core Async Concepts

**Future**:

- [Future Basics](#1-future-basics) - Single async value
- [Async/Await](#2-async-await) - Readable async code
- [Future Combinators](#3-future-combinators) - wait, any, forEach
- [Error Handling](#4-async-error-handling) - try-catch in async

**Stream**:

- [Stream Basics](#5-stream-basics) - Multiple async values
- [Stream Transformations](#6-stream-transformations) - map, where, expand
- [StreamController](#7-stream-controller) - Creating streams
- [Broadcast Streams](#8-broadcast-streams) - Multiple listeners

**Advanced**:

- [Async Generators](#9-async-generators) - async\*, yield
- [Timeout Handling](#10-timeout-handling) - Preventing hangs
- [Isolates](#11-isolates) - True parallelism

### Quick Syntax

```dart
// Future with async/await
Future<double> calculateZakat(double wealth) async {
  final nisab = await fetchNisab();
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// Stream listening
Stream<Donation> donations = getDonationStream();
await for (final donation in donations) {
  print('Received: ${donation.amount}');
}

// Stream creation
Stream<int> countStream() async* {
  for (var i = 1; i <= 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

// Parallel operations
final results = await Future.wait([
  fetchWealth(),
  fetchNisab(),
  fetchExchangeRate(),
]);

// Error handling
try {
  await saveDonation(donation);
} on NetworkException catch (e) {
  print('Network error: $e');
} catch (e) {
  print('Unexpected error: $e');
}
```

## Overview

Dart's async programming model provides first-class support for asynchronous operations through Future and Stream. This enables non-blocking I/O, network requests, and concurrent computation essential for modern applications.

This guide covers **Dart 3.0+ async programming** for the Open Sharia Enterprise platform, focusing on financial operations where async patterns are critical for database access, API calls, and real-time updates.

### Why Async Programming Matters

- **Responsiveness**: Keep UI responsive during I/O operations
- **Performance**: Execute multiple operations concurrently
- **Scalability**: Handle many concurrent requests efficiently
- **Financial Domain**: Real-time Zakat calculations, donation processing, market data

### Target Audience

This document targets developers building async Dart applications, particularly those handling financial transactions, real-time data streams, and concurrent operations.

## Future and Async/Await

### 1. Future Basics

**Pattern**: Future represents a value that will be available in the future.

**Basic Future**:

```dart
// Function returning Future
Future<double> fetchNisabThreshold() {
  return Future.delayed(
    Duration(seconds: 1),
    () => 5000.0,
  );
}

// Using .then()
void getNisab() {
  fetchNisabThreshold().then((nisab) {
    print('Nisab: \$${nisab}');
  });
}
```

**Islamic Finance Example**:

```dart
class ZakatService {
  Future<double> calculateZakat(String userId) {
    return fetchUserWealth(userId).then((wealth) {
      return fetchNisabThreshold().then((nisab) {
        return wealth >= nisab ? wealth * 0.025 : 0.0;
      });
    });
  }

  Future<double> fetchUserWealth(String userId) async {
    // Simulate database query
    await Future.delayed(Duration(seconds: 1));
    return 10000.0;
  }

  Future<double> fetchNisabThreshold() async {
    // Simulate API call
    await Future.delayed(Duration(seconds: 1));
    return 5000.0;
  }
}
```

### 2. Async/Await

**Pattern**: Use async/await for readable asynchronous code.

**Basic Async/Await**:

```dart
// Async function
Future<double> calculateZakat(double wealth, double nisab) async {
  // Simulate async calculation
  await Future.delayed(Duration(milliseconds: 100));
  return wealth >= nisab ? wealth * 0.025 : 0.0;
}

// Using async/await
Future<void> processZakat(String userId) async {
  final wealth = await fetchUserWealth(userId);
  final nisab = await fetchNisabThreshold();
  final zakat = await calculateZakat(wealth, nisab);

  print('Zakat for $userId: \$${zakat.toStringAsFixed(2)}');
}

Future<double> fetchUserWealth(String userId) async {
  await Future.delayed(Duration(seconds: 1));
  return 10000.0;
}

Future<double> fetchNisabThreshold() async {
  await Future.delayed(Duration(seconds: 1));
  return 5000.0;
}
```

**Islamic Finance Example**:

```dart
class DonationProcessor {
  Future<void> processDonation(Donation donation) async {
    // Sequential operations
    await validateDonation(donation);
    await saveDonation(donation);
    await updateDonorRecord(donation.donorId, donation.amount);
    await sendConfirmationEmail(donation.donorId);

    print('Donation ${donation.id} processed successfully');
  }

  Future<void> validateDonation(Donation donation) async {
    if (donation.amount <= 0) {
      throw ArgumentError('Donation amount must be positive');
    }
    await Future.delayed(Duration(milliseconds: 100));
  }

  Future<void> saveDonation(Donation donation) async {
    // Simulate database save
    await Future.delayed(Duration(milliseconds: 500));
  }

  Future<void> updateDonorRecord(String donorId, double amount) async {
    // Simulate database update
    await Future.delayed(Duration(milliseconds: 300));
  }

  Future<void> sendConfirmationEmail(String donorId) async {
    // Simulate email sending
    await Future.delayed(Duration(milliseconds: 200));
  }
}

class Donation {
  final String id;
  final String donorId;
  final double amount;

  Donation(this.id, this.donorId, this.amount);
}
```

### 3. Future Combinators

**Pattern**: Combine multiple futures for concurrent execution.

**Future.wait (Parallel)**:

```dart
Future<ZakatReport> generateReport(String userId) async {
  // Execute in parallel
  final results = await Future.wait([
    fetchUserWealth(userId),
    fetchNisabThreshold(),
    fetchExchangeRates(),
  ]);

  final wealth = results[0] as double;
  final nisab = results[1] as double;
  final rates = results[2] as Map<String, double>;

  final zakatAmount = wealth >= nisab ? wealth * 0.025 : 0.0;

  return ZakatReport(
    userId: userId,
    wealth: wealth,
    nisab: nisab,
    zakatAmount: zakatAmount,
    exchangeRates: rates,
  );
}

Future<double> fetchUserWealth(String userId) async {
  await Future.delayed(Duration(seconds: 1));
  return 10000.0;
}

Future<double> fetchNisabThreshold() async {
  await Future.delayed(Duration(seconds: 1));
  return 5000.0;
}

Future<Map<String, double>> fetchExchangeRates() async {
  await Future.delayed(Duration(seconds: 1));
  return {'USD': 1.0, 'EUR': 0.85};
}

class ZakatReport {
  final String userId;
  final double wealth;
  final double nisab;
  final double zakatAmount;
  final Map<String, double> exchangeRates;

  ZakatReport({
    required this.userId,
    required this.wealth,
    required this.nisab,
    required this.zakatAmount,
    required this.exchangeRates,
  });
}
```

**Future.any (First to Complete)**:

```dart
Future<double> getNisabThreshold() async {
  // Returns first successful result
  return await Future.any([
    fetchFromPrimaryAPI(),
    fetchFromBackupAPI(),
    fetchFromCache(),
  ]);
}

Future<double> fetchFromPrimaryAPI() async {
  await Future.delayed(Duration(seconds: 2));
  return 5000.0;
}

Future<double> fetchFromBackupAPI() async {
  await Future.delayed(Duration(seconds: 1));
  return 5000.0; // Completes first
}

Future<double> fetchFromCache() async {
  await Future.delayed(Duration(seconds: 3));
  return 5000.0;
}
```

### 4. Async Error Handling

**Pattern**: Handle errors in async code with try-catch.

**Basic Error Handling**:

```dart
Future<void> processDonation(Donation donation) async {
  try {
    await validateDonation(donation);
    await saveDonation(donation);
    print('Donation processed successfully');
  } on ValidationException catch (e) {
    print('Validation error: ${e.message}');
  } on DatabaseException catch (e) {
    print('Database error: ${e.message}');
    // Retry logic
    await retryDonation(donation);
  } catch (e, stackTrace) {
    print('Unexpected error: $e');
    print('Stack trace: $stackTrace');
  }
}

Future<void> validateDonation(Donation donation) async {
  if (donation.amount <= 0) {
    throw ValidationException('Amount must be positive');
  }
}

Future<void> saveDonation(Donation donation) async {
  // Simulate save that might fail
  if (DateTime.now().second % 2 == 0) {
    throw DatabaseException('Connection failed');
  }
}

Future<void> retryDonation(Donation donation) async {
  print('Retrying donation...');
  await Future.delayed(Duration(seconds: 1));
  await saveDonation(donation);
}

class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
}

class DatabaseException implements Exception {
  final String message;
  DatabaseException(this.message);
}
```

**Islamic Finance Example**:

```dart
class MurabahaContractService {
  Future<MurabahaContract> createContract({
    required String customerId,
    required double assetCost,
    required double profitRate,
    required int installmentMonths,
  }) async {
    try {
      // Validate Sharia compliance
      await validateShariaCompliance(assetCost, profitRate);

      // Create contract
      final contract = MurabahaContract(
        contractId: generateId(),
        customerId: customerId,
        assetCost: assetCost,
        profitRate: profitRate,
        installmentMonths: installmentMonths,
      );

      // Save to database
      await saveContract(contract);

      // Generate payment schedule
      await generatePaymentSchedule(contract);

      return contract;
    } on ShariaComplianceException catch (e) {
      print('Sharia compliance violation: ${e.message}');
      rethrow;
    } on DatabaseException catch (e, stackTrace) {
      print('Database error: ${e.message}');
      print('Stack trace: $stackTrace');
      throw ContractCreationException('Failed to save contract', e);
    } catch (e) {
      print('Unexpected error creating contract: $e');
      throw ContractCreationException('Contract creation failed', e);
    }
  }

  Future<void> validateShariaCompliance(double assetCost, double profitRate) async {
    await Future.delayed(Duration(milliseconds: 100));

    if (profitRate > 0.50) {
      throw ShariaComplianceException('Profit rate exceeds 50% limit');
    }
    if (assetCost <= 0) {
      throw ShariaComplianceException('Asset cost must be positive');
    }
  }

  Future<void> saveContract(MurabahaContract contract) async {
    await Future.delayed(Duration(milliseconds: 500));
  }

  Future<void> generatePaymentSchedule(MurabahaContract contract) async {
    await Future.delayed(Duration(milliseconds: 300));
  }

  String generateId() => 'MUR-${DateTime.now().millisecondsSinceEpoch}';
}

class MurabahaContract {
  final String contractId;
  final String customerId;
  final double assetCost;
  final double profitRate;
  final int installmentMonths;

  MurabahaContract({
    required this.contractId,
    required this.customerId,
    required this.assetCost,
    required this.profitRate,
    required this.installmentMonths,
  });
}

class ShariaComplianceException implements Exception {
  final String message;
  ShariaComplianceException(this.message);
}

class ContractCreationException implements Exception {
  final String message;
  final Object? cause;
  ContractCreationException(this.message, [this.cause]);
}
```

## Streams

### 5. Stream Basics

**Pattern**: Stream represents multiple async values over time.

**Basic Stream**:

```dart
Stream<int> countStream() async* {
  for (var i = 1; i <= 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

// Listening to stream
Future<void> listenToCount() async {
  await for (final count in countStream()) {
    print('Count: $count');
  }
}

// Stream subscription
void subscribeToCount() {
  final subscription = countStream().listen(
    (count) {
      print('Count: $count');
    },
    onError: (error) {
      print('Error: $error');
    },
    onDone: () {
      print('Stream completed');
    },
  );

  // Cancel subscription
  // subscription.cancel();
}
```

**Islamic Finance Example**:

```dart
class DonationStream {
  Stream<Donation> getDonationStream() async* {
    // Simulate real-time donations
    final donations = [
      Donation('don-1', 'donor-1', 100.0),
      Donation('don-2', 'donor-2', 250.0),
      Donation('don-3', 'donor-3', 500.0),
    ];

    for (final donation in donations) {
      await Future.delayed(Duration(seconds: 1));
      yield donation;
    }
  }

  Future<void> processDonations() async {
    var totalAmount = 0.0;

    await for (final donation in getDonationStream()) {
      totalAmount += donation.amount;
      print('Received donation: \$${donation.amount}');
      print('Total so far: \$${totalAmount}');
    }

    print('All donations processed. Total: \$${totalAmount}');
  }
}
```

### 6. Stream Transformations

**Pattern**: Transform streams with map, where, expand, etc.

**Stream Operations**:

```dart
Stream<Donation> getDonations() async* {
  yield Donation('don-1', 'donor-1', 100.0);
  yield Donation('don-2', 'donor-2', 250.0);
  yield Donation('don-3', 'donor-3', 500.0);
  yield Donation('don-4', 'donor-4', 50.0);
}

Future<void> processTransformedStream() async {
  // Filter large donations
  final largeDonations = getDonations().where((d) => d.amount >= 100.0);

  // Transform to amounts
  final amounts = largeDonations.map((d) => d.amount);

  // Calculate total
  final total = await amounts.reduce((sum, amount) => sum + amount);
  print('Total large donations: \$${total}');
}

Future<void> expandStream() async {
  // Expand each donation into multiple events
  final expanded = getDonations().expand((donation) {
    return [
      'Donation received: ${donation.id}',
      'Amount: \$${donation.amount}',
      'From donor: ${donation.donorId}',
    ];
  });

  await for (final event in expanded) {
    print(event);
  }
}
```

**Islamic Finance Example**:

```dart
class ZakatCalculationStream {
  Stream<UserWealth> getWealthUpdates() async* {
    // Simulate real-time wealth updates
    yield UserWealth('user-1', 10000.0);
    await Future.delayed(Duration(seconds: 1));
    yield UserWealth('user-2', 7000.0);
    await Future.delayed(Duration(seconds: 1));
    yield UserWealth('user-3', 3000.0);
  }

  Future<void> processZakatCalculations() async {
    const nisab = 5000.0;

    // Transform wealth to zakat calculations
    final zakatStream = getWealthUpdates().map((wealth) {
      final isEligible = wealth.amount >= nisab;
      final zakatAmount = isEligible ? wealth.amount * 0.025 : 0.0;

      return ZakatCalculation(
        userId: wealth.userId,
        wealth: wealth.amount,
        nisab: nisab,
        zakatAmount: zakatAmount,
        isEligible: isEligible,
      );
    });

    // Filter eligible users
    final eligibleStream = zakatStream.where((calc) => calc.isEligible);

    // Process eligible calculations
    await for (final calculation in eligibleStream) {
      print('User ${calculation.userId}: Zakat due \$${calculation.zakatAmount.toStringAsFixed(2)}');
    }
  }
}

class UserWealth {
  final String userId;
  final double amount;

  UserWealth(this.userId, this.amount);
}

class ZakatCalculation {
  final String userId;
  final double wealth;
  final double nisab;
  final double zakatAmount;
  final bool isEligible;

  ZakatCalculation({
    required this.userId,
    required this.wealth,
    required this.nisab,
    required this.zakatAmount,
    required this.isEligible,
  });
}
```

### 7. StreamController

**Pattern**: Create and control streams with StreamController.

**Basic StreamController**:

```dart
class DonationBroadcaster {
  final _controller = StreamController<Donation>();

  Stream<Donation> get stream => _controller.stream;

  void addDonation(Donation donation) {
    _controller.add(donation);
  }

  void addError(Object error) {
    _controller.addError(error);
  }

  Future<void> close() async {
    await _controller.close();
  }
}

// Usage
Future<void> useBroadcaster() async {
  final broadcaster = DonationBroadcaster();

  // Listen to stream
  broadcaster.stream.listen(
    (donation) {
      print('Donation: \$${donation.amount}');
    },
    onError: (error) {
      print('Error: $error');
    },
  );

  // Add donations
  broadcaster.addDonation(Donation('don-1', 'donor-1', 100.0));
  broadcaster.addDonation(Donation('don-2', 'donor-2', 250.0));

  await broadcaster.close();
}
```

### 8. Broadcast Streams

**Pattern**: Allow multiple listeners with broadcast streams.

**Broadcast Stream**:

```dart
class DonationNotifier {
  final _controller = StreamController<Donation>.broadcast();

  Stream<Donation> get stream => _controller.stream;

  void notify(Donation donation) {
    _controller.add(donation);
  }

  Future<void> dispose() async {
    await _controller.close();
  }
}

// Usage - multiple listeners
Future<void> multipleListeners() async {
  final notifier = DonationNotifier();

  // Listener 1 - logs all donations
  notifier.stream.listen((donation) {
    print('Logger: Donation ${donation.id} for \$${donation.amount}');
  });

  // Listener 2 - tracks total
  var total = 0.0;
  notifier.stream.listen((donation) {
    total += donation.amount;
    print('Tracker: Total donations: \$${total}');
  });

  // Listener 3 - alerts for large donations
  notifier.stream.where((d) => d.amount >= 500.0).listen((donation) {
    print('Alert: Large donation \$${donation.amount}!');
  });

  // Send notifications
  notifier.notify(Donation('don-1', 'donor-1', 100.0));
  notifier.notify(Donation('don-2', 'donor-2', 600.0));

  await Future.delayed(Duration(seconds: 1));
  await notifier.dispose();
}
```

## Advanced Patterns

### 9. Async Generators

**Pattern**: Create streams with async\* and yield.

**Async Generator**:

```dart
Stream<ZakatReport> generateMonthlyReports(String userId) async* {
  for (var month = 1; month <= 12; month++) {
    // Fetch data for month
    final wealth = await fetchMonthlyWealth(userId, month);
    final nisab = await fetchNisabForMonth(month);

    // Calculate zakat
    final zakatAmount = wealth >= nisab ? wealth * 0.025 : 0.0;

    // Yield report
    yield ZakatReport(
      userId: userId,
      month: month,
      wealth: wealth,
      nisab: nisab,
      zakatAmount: zakatAmount,
    );
  }
}

Future<double> fetchMonthlyWealth(String userId, int month) async {
  await Future.delayed(Duration(milliseconds: 100));
  return 10000.0 + (month * 100);
}

Future<double> fetchNisabForMonth(int month) async {
  await Future.delayed(Duration(milliseconds: 50));
  return 5000.0;
}

class ZakatReport {
  final String userId;
  final int month;
  final double wealth;
  final double nisab;
  final double zakatAmount;

  ZakatReport({
    required this.userId,
    required this.month,
    required this.wealth,
    required this.nisab,
    required this.zakatAmount,
  });
}
```

### 10. Timeout Handling

**Pattern**: Prevent operations from hanging indefinitely.

**Timeout Example**:

```dart
Future<double> fetchNisabWithTimeout() async {
  try {
    return await fetchNisab().timeout(
      Duration(seconds: 5),
      onTimeout: () {
        throw TimeoutException('Nisab fetch timed out');
      },
    );
  } on TimeoutException catch (e) {
    print('Timeout: ${e.message}');
    // Return cached value
    return 5000.0;
  }
}

Future<double> fetchNisab() async {
  // Simulate slow API
  await Future.delayed(Duration(seconds: 10));
  return 5000.0;
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
}
```

### 11. Isolates

**Pattern**: True parallelism with isolates.

**Basic Isolate**:

```dart
import 'dart:isolate';

Future<double> calculateZakatInIsolate(double wealth) async {
  final receivePort = ReceivePort();

  await Isolate.spawn(_zakatCalculation, receivePort.sendPort);

  final sendPort = await receivePort.first as SendPort;
  final responsePort = ReceivePort();

  sendPort.send([wealth, responsePort.sendPort]);

  final result = await responsePort.first as double;
  return result;
}

void _zakatCalculation(SendPort sendPort) {
  final port = ReceivePort();
  sendPort.send(port.sendPort);

  port.listen((message) {
    final wealth = message[0] as double;
    final responsePort = message[1] as SendPort;

    // CPU-intensive calculation
    final zakat = wealth * 0.025;

    responsePort.send(zakat);
  });
}
```

## Related Documentation

**Core Dart**:

- [Dart Best Practices](./ex-soen-prla-da__best-practices.md) - Async best practices
- [Dart Anti-Patterns](./ex-soen-prla-da__anti-patterns.md) - Async anti-patterns
- [Error Handling](./ex-soen-prla-da__error-handling.md) - Exception handling
- [Performance](./ex-soen-prla-da__performance.md) - Async performance

**Platform**:

- [Programming Languages Index](../README.md) - Parent documentation

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ (async patterns, null safety)
