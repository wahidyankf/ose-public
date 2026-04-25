---
title: "Dart Concurrency Standards"
description: Authoritative OSE Platform Dart concurrency standards (async-await, Future, Stream, Isolates)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - concurrency
  - async-await
  - future
  - stream
  - isolates
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to handle concurrency in THIS codebase, not WHAT async/await is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative concurrency standards** for Dart development in the OSE Platform. Correct concurrency patterns prevent race conditions, avoid blocking the event loop, and enable efficient I/O-bound and CPU-bound processing.

**Target Audience**: OSE Platform Dart developers working with async operations, background processing, or stream-based data

**Scope**: async/await patterns, Future vs Stream selection, StreamController, async generators, Isolates for CPU work, event loop management

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Concurrency Detection):

```yaml
# analysis_options.yaml
linter:
  rules:
    - unawaited_futures # Detects missed await
    - avoid_void_async # Prefer Future<void> over void async
    - cancel_subscriptions # Require subscription cancellation
    - close_sinks # Require sink closure
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Async Markers):

```dart
// CORRECT: Explicit async/await markers
Future<ZakatTransaction> recordZakatPayment({
  required String customerId,
  required double amount,
}) async {
  // async marker is explicit
  final customer = await customerRepository.findById(customerId); // await is explicit
  final transaction = await transactionService.create(customer, amount);
  return transaction;
}

// WRONG: Missing async/await (synchronous-looking code that actually returns Future)
Future<ZakatTransaction> recordZakatPayment2({
  required String customerId,
  required double amount,
}) {
  return customerRepository.findById(customerId).then((customer) {
    return transactionService.create(customer, amount);
  }); // Hard to read, error-prone
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Data in Streams):

```dart
// CORRECT: Stream emits immutable objects
Stream<ZakatTransaction> watchTransactions(String customerId) {
  return transactionRepository
      .watchByCustomer(customerId)
      .map((transactions) => List.unmodifiable(transactions)); // Immutable list
}

// CORRECT: StreamController with immutable events
final controller = StreamController<ZakatSummary>.broadcast();

void emitSummary(ZakatSummary summary) {
  // summary is immutable (const fields)
  controller.add(summary);
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Async Data Transformation):

```dart
// CORRECT: Pure transformation in stream pipeline
Stream<double> zakatAmountStream(Stream<CustomerWealth> wealthStream) {
  return wealthStream
    .where((w) => w.amount >= w.nisabThreshold) // Pure filter
    .map((w) => w.amount * 0.025);              // Pure transform
}

// No side effects in stream transformations
// Side effects belong at the stream consumer level
```

### 5. Reproducibility First

**PASS Example** (Testable Async Code):

```dart
// Injectable async dependencies for testable, reproducible tests
class ZakatScheduler {
  final Future<void> Function(Duration) _delay;

  const ZakatScheduler({
    Future<void> Function(Duration)? delay,
  }) : _delay = delay ?? Future.delayed;

  Future<void> scheduleReminder(DateTime dueDate) async {
    final waitDuration = dueDate.difference(DateTime.now());
    await _delay(waitDuration); // Injected - testable
    await sendReminderNotification();
  }
}

// In tests: inject instant delay
final scheduler = ZakatScheduler(delay: (_) async {});
```

## Part 1: async/await Best Practices

### Always Mark Async Functions Explicitly

**MUST** mark functions with `async` keyword when they contain `await` expressions.

```dart
// CORRECT: Explicit async marker
Future<List<ZakatTransaction>> loadHistory(String customerId) async {
  final rawData = await database.query(
    'SELECT * FROM transactions WHERE customer_id = ?',
    [customerId],
  );
  return rawData.map(ZakatTransaction.fromRow).toList();
}

// WRONG: Returning Future without async/await (hard to maintain)
Future<List<ZakatTransaction>> loadHistory2(String customerId) {
  return database.query(
    'SELECT * FROM transactions WHERE customer_id = ?',
    [customerId],
  ).then((rawData) => rawData.map(ZakatTransaction.fromRow).toList());
}
```

### Await All Futures

**MUST** await all Futures. Never fire-and-forget without explicit `unawaited()`.

```dart
// WRONG: Unawaited Future (silent failure)
void recordPayment(ZakatTransaction tx) async {
  repository.save(tx); // Not awaited - failure is silent!
  notifier.send(tx);   // Not awaited!
}

// CORRECT: Await all Futures
Future<void> recordPayment(ZakatTransaction tx) async {
  await repository.save(tx);
  await notifier.send(tx);
}

// CORRECT: Explicit fire-and-forget with unawaited()
void fireAndForget(ZakatTransaction tx) {
  unawaited(auditLogger.logAsync(tx)); // Explicit: intentional, non-critical
}
```

### Parallel Execution with Future.wait

**SHOULD** use `Future.wait` for independent concurrent operations.

```dart
// CORRECT: Parallel execution (faster than sequential)
Future<ZakatDashboard> loadDashboard(String customerId) async {
  // These three calls are independent - run them in parallel
  final (history, balance, settings) = await (
    transactionRepository.findByCustomer(customerId),
    walletService.getBalance(customerId),
    preferencesService.load(customerId),
  ).wait; // Dart 3.0+ record .wait

  return ZakatDashboard(
    transactions: history,
    balance: balance,
    settings: settings,
  );
}

// Alternative: Future.wait for dynamic lists
Future<void> processAllCustomers(List<String> customerIds) async {
  await Future.wait(
    customerIds.map((id) => processCustomerZakat(id)),
    eagerError: true, // Fail fast on first error
  );
}

// WRONG: Sequential when parallel is possible (slow)
Future<ZakatDashboard> loadDashboardSlowly(String customerId) async {
  final history = await transactionRepository.findByCustomer(customerId);
  final balance = await walletService.getBalance(customerId); // Waits unnecessarily
  final settings = await preferencesService.load(customerId); // Waits unnecessarily
  return ZakatDashboard(history: history, balance: balance, settings: settings);
}
```

### Error Handling in Async Code

**MUST** handle async errors explicitly. See [Error Handling Standards](./error-handling-standards.md) for exception patterns.

```dart
Future<void> processZakatPayment(String customerId, double amount) async {
  try {
    await validateCustomer(customerId);
    await deductFromWallet(customerId, amount);
    await recordTransaction(customerId, amount);
    await notifyCustomer(customerId);
  } on CustomerNotFoundException catch (e) {
    log.warning('Customer not found for zakat payment', e);
    rethrow;
  } on InsufficientFundsException catch (e) {
    log.info('Insufficient funds for zakat payment', e);
    rethrow;
  } finally {
    await auditLog.recordAttempt(customerId, amount);
  }
}
```

## Part 2: Future vs Stream

### When to Use Future

**MUST** use `Future` for single async results.

```dart
// CORRECT: Future for single value
Future<ZakatTransaction> recordPayment(String customerId, double amount) async {
  return await transactionRepository.create(customerId, amount);
}

Future<double> calculateCurrentZakat(String customerId) async {
  final wealth = await wealthService.getCurrentWealth(customerId);
  final nisab = await nisabService.getCurrentNisab();
  return calculateZakat(wealth, nisab);
}
```

### When to Use Stream

**MUST** use `Stream` for multiple values over time.

```dart
// CORRECT: Stream for real-time updates
Stream<ZakatTransaction> watchTransactionHistory(String customerId) {
  return transactionRepository.watchByCustomer(customerId);
}

Stream<double> watchNisabThreshold() {
  return nisabService.watchCurrentNisab();
}

// CORRECT: Stream for paginated data
Stream<List<ZakatTransaction>> paginatedHistory(
  String customerId, {
  required int pageSize,
}) async* {
  int page = 0;
  while (true) {
    final batch = await transactionRepository.fetchPage(
      customerId: customerId,
      page: page,
      pageSize: pageSize,
    );
    if (batch.isEmpty) break;
    yield batch;
    page++;
  }
}
```

## Part 3: StreamController

### Single-Listener StreamController

**MUST** use single-listener `StreamController` for one-to-one stream relationships.

```dart
class ZakatCalculationService {
  final _calculationController = StreamController<ZakatCalculation>();

  // Expose stream (not sink) publicly
  Stream<ZakatCalculation> get calculations => _calculationController.stream;

  Future<void> processCalculation(double wealth, double nisab) async {
    try {
      final amount = calculateZakat(wealth, nisab);
      final calculation = ZakatCalculation(
        wealth: wealth,
        nisab: nisab,
        amount: amount,
        calculatedAt: DateTime.now(),
      );
      _calculationController.add(calculation);
    } catch (e, stackTrace) {
      _calculationController.addError(e, stackTrace);
    }
  }

  // MUST close controller to prevent memory leaks
  Future<void> dispose() async {
    await _calculationController.close();
  }
}
```

### Broadcast StreamController

**MUST** use `broadcast()` for multiple listeners on the same stream.

```dart
class ZakatEventBus {
  // Broadcast stream allows multiple listeners
  final _eventController = StreamController<ZakatEvent>.broadcast();

  Stream<ZakatEvent> get events => _eventController.stream;

  // Filter for specific event types
  Stream<ZakatPaymentEvent> get paymentEvents =>
      events.whereType<ZakatPaymentEvent>();

  Stream<ZakatReminderEvent> get reminderEvents =>
      events.whereType<ZakatReminderEvent>();

  void emit(ZakatEvent event) {
    if (!_eventController.isClosed) {
      _eventController.add(event);
    }
  }

  Future<void> dispose() async {
    await _eventController.close();
  }
}
```

### Subscription Management

**MUST** cancel stream subscriptions to prevent memory leaks.

```dart
// CORRECT: Cancel subscription when done
class ZakatMonitor {
  StreamSubscription<ZakatTransaction>? _subscription;

  void startMonitoring(String customerId) {
    _subscription = transactionRepository
        .watchByCustomer(customerId)
        .listen(
          (tx) => _handleTransaction(tx),
          onError: (Object e, StackTrace st) => _handleError(e, st),
          onDone: () => _handleDone(),
        );
  }

  Future<void> stopMonitoring() async {
    await _subscription?.cancel();
    _subscription = null;
  }

  void _handleTransaction(ZakatTransaction tx) {
    // Process transaction
  }
}

// In Flutter: use StreamBuilder (handles subscription lifecycle)
StreamBuilder<List<ZakatTransaction>>(
  stream: transactionRepository.watchAll(),
  builder: (context, snapshot) {
    if (snapshot.hasError) return ErrorWidget(snapshot.error!);
    if (!snapshot.hasData) return const LoadingWidget();
    return ZakatHistoryList(transactions: snapshot.data!);
  },
)
```

## Part 4: Async Generators

### async\* and yield

**SHOULD** use `async*` and `yield` for generating stream values.

```dart
// CORRECT: async* for lazy stream generation
Stream<ZakatReminder> generateYearlyReminders(
  String customerId,
  int years,
) async* {
  for (int year = 0; year < years; year++) {
    // Can await inside async* generators
    final wealth = await wealthService.getAnnualWealth(customerId, year);
    final nisab = await nisabService.getNisabForYear(year);

    if (wealth >= nisab) {
      yield ZakatReminder(
        customerId: customerId,
        year: year,
        estimatedZakat: wealth * 0.025,
      );
    }
  }
}

// CORRECT: sync* for synchronous generators
Iterable<int> zakatPaymentSchedule(int totalAmount, int installments) sync* {
  final baseAmount = totalAmount ~/ installments;
  final remainder = totalAmount % installments;

  for (int i = 0; i < installments; i++) {
    yield i == 0 ? baseAmount + remainder : baseAmount;
  }
}
```

## Part 5: Isolates for CPU-Intensive Work

### When to Use Isolates

**MUST** use Isolates for CPU-intensive operations that would block the event loop.

CPU-intensive examples:

- Parsing large JSON datasets (>1MB)
- Complex financial report generation
- Image processing
- Cryptographic operations on large datasets

```dart
// CORRECT: Isolate.run for CPU-intensive work
Future<ZakatReport> generateDetailedReport(
  List<ZakatTransaction> transactions,
) async {
  // Heavy computation runs in separate Isolate (doesn't block UI/event loop)
  return await Isolate.run(() {
    // This runs in a separate Isolate
    return _computeReport(transactions);
  });
}

ZakatReport _computeReport(List<ZakatTransaction> transactions) {
  // CPU-intensive: complex aggregations, sorting, calculations
  final byYear = <int, List<ZakatTransaction>>{};
  for (final tx in transactions) {
    byYear.putIfAbsent(tx.paidAt.year, () => []).add(tx);
  }

  final yearlyTotals = byYear.map((year, txs) => MapEntry(
    year,
    txs.fold(0.0, (sum, tx) => sum + tx.zakatAmount),
  ));

  return ZakatReport(yearlyTotals: yearlyTotals);
}

// CORRECT: compute() in Flutter (uses Isolate internally)
// import 'package:flutter/foundation.dart';
Future<ZakatReport> generateReportFlutter(
  List<ZakatTransaction> transactions,
) {
  return compute(_computeReport, transactions);
}
```

### Avoiding Blocking the Event Loop

**PROHIBITED**: Performing CPU-intensive work directly on the main Isolate.

```dart
// WRONG: Blocks the event loop (freezes UI in Flutter, delays HTTP responses in server)
Future<ZakatReport> generateReportBlocking(
  List<ZakatTransaction> transactions,
) async {
  // Directly processing 100k transactions on main isolate!
  return _computeReport(transactions); // BLOCKS EVENT LOOP
}

// CORRECT: Use Isolate.run to offload CPU work
Future<ZakatReport> generateReportCorrect(
  List<ZakatTransaction> transactions,
) async {
  return await Isolate.run(() => _computeReport(transactions));
}
```

## Enforcement

Concurrency standards are enforced through:

- **dart analyze** - `unawaited_futures`, `cancel_subscriptions`, `close_sinks` rules
- **Code reviews** - Verify Future.wait for parallel ops, subscription cleanup
- **Performance testing** - Event loop blocking detection

**Pre-commit checklist**:

- [ ] All Futures awaited (or explicitly `unawaited()`)
- [ ] `StreamController` closed in `dispose()` method
- [ ] Stream subscriptions cancelled in teardown
- [ ] CPU-intensive work uses `Isolate.run()` or `compute()`
- [ ] Parallel independent operations use `Future.wait` or record `.wait`
- [ ] `async*`/`yield` used for stream generators (not `StreamController.add()` in loops)

## Related Standards

- [Coding Standards](./coding-standards.md) - Async naming conventions
- [Error Handling Standards](./error-handling-standards.md) - Async error patterns
- [Performance Standards](./performance-standards.md) - Event loop performance
- [Framework Integration](./framework-integration.md) - Flutter async patterns

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
