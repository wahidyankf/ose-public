---
title: Java Concurrency Standards for OSE Platform
description: Prescriptive concurrency requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - concurrency
  - virtual-threads
  - thread-safety
  - standards
principles:
  - immutability
  - explicit-over-implicit
created: 2026-02-03
updated: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java Concurrency Standards for OSE Platform

**OSE-specific prescriptive standards** for concurrency in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Java concurrency fundamentals from [AyoKoding Java Concurrency](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

Concurrency in OSE Platform enables critical capabilities for financial operations:

- **Throughput**: Process 10,000+ concurrent transactions without blocking
- **Responsiveness**: Keep UI responsive during complex Zakat calculations
- **Resource Utilization**: Maximize CPU usage for batch processing (donation processing, end-of-year Zakat calculations)
- **Scalability**: Support growth from hundreds to millions of concurrent users
- **Data Integrity**: Ensure thread-safe financial calculations and atomic transactions

### Virtual Thread Requirements

**REQUIRED**: All I/O-bound operations MUST use virtual threads (Java 21+).

```java
// REQUIRED: Virtual thread executor for I/O-bound financial operations
private final ExecutorService executor =
 Executors.newVirtualThreadPerTaskExecutor();

// REQUIRED: Process donations concurrently with virtual threads
public List<ProcessingResult> processDonationsBatch(List<Donation> donations)
  throws InterruptedException {

 List<CompletableFuture<ProcessingResult>> futures = donations.stream()
  .map(donation -> CompletableFuture.supplyAsync(
   () -> processSingleDonation(donation),
   executor  // REQUIRED: Use virtual thread executor
  ))
  .toList();

 return futures.stream()
  .map(CompletableFuture::join)
  .toList();
}
```

**REQUIRED**: Virtual threads MUST be used for:

- Database queries (account lookups, transaction history)
- External API calls (payment gateways, regulatory reporting)
- File I/O operations (audit log writes, document generation)
- Network operations (microservice communication)

**PROHIBITED**: Using virtual threads for CPU-bound operations (use platform threads with ForkJoinPool instead).

### Virtual Thread Naming

**REQUIRED**: Virtual threads MUST have descriptive names for debugging.

```java
// REQUIRED: Name virtual threads for observability
Thread vThread = Thread.ofVirtual()
 .name("zakat-calc-" + accountId)  // REQUIRED: Include operation + entity ID
 .start(() -> calculateZakat(accountId));
```

**REQUIRED**: Thread naming pattern: `{operation}-{entity-type}-{entity-id}`

Examples:

- `donation-processor-12345`
- `zakat-calc-account-67890`
- `murabaha-validator-contract-45678`

### Structured Concurrency

**REQUIRED**: Use structured concurrency for hierarchical task management (Java 21+).

```java
// REQUIRED: Structured concurrency for related subtasks
public DonationProcessingResult processDonationWithValidation(Donation donation)
  throws InterruptedException, ExecutionException {

 try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  // Launch parallel subtasks
  Subtask<ValidationResult> validation = scope.fork(() -> validateDonor(donation));
  Subtask<AccountStatus> accountCheck = scope.fork(() -> checkAccountStatus(donation));
  Subtask<ComplianceResult> compliance = scope.fork(() -> checkCompliance(donation));

  scope.join();           // REQUIRED: Wait for all subtasks
  scope.throwIfFailed();  // REQUIRED: Propagate any failures

  // All subtasks succeeded - process donation
  return processDonation(
   validation.get(),
   accountCheck.get(),
   compliance.get()
  );
 }
}
```

**REQUIRED**: Structured concurrency MUST:

- Use try-with-resources for automatic cleanup
- Wait for all subtasks with `join()`
- Propagate failures immediately with `throwIfFailed()`
- Cancel remaining tasks on first failure (financial integrity)

**PROHIBITED**: Using ExecutorService directly for related tasks (use StructuredTaskScope instead).

### Immutability Requirements

**REQUIRED**: All domain models MUST be immutable (thread-safe by default).

```java
// REQUIRED: Immutable domain model (thread-safe)
public record Account(
 AccountId id,
 Money balance,
 Instant createdAt,
 AccountStatus status
) {
 // REQUIRED: Defensive copying for mutable fields (if any)
 public Account {
  Objects.requireNonNull(id);
  Objects.requireNonNull(balance);
  Objects.requireNonNull(createdAt);
  Objects.requireNonNull(status);
 }
}

// REQUIRED: Updates create new instances (not mutation)
public Account debit(Money amount) {
 return new Account(
  this.id,
  this.balance.subtract(amount),  // New Money instance
  this.createdAt,
  this.status
 );
}
```

**REQUIRED**: Domain models MUST:

- Use `record` types for automatic immutability
- Use `final` fields for class-based models
- Return new instances for updates (not modify state)
- Defensively copy mutable fields (dates, collections)

**PROHIBITED**: Mutable domain models in concurrent contexts.

### Synchronization Requirements

**REQUIRED**: Synchronization MUST be used ONLY when immutability is impossible.

```java
// REQUIRED: Fine-grained synchronization for mutable state
public class AccountBalanceCache {
 private final ConcurrentHashMap<AccountId, AtomicReference<Money>> balances =
  new ConcurrentHashMap<>();

 // REQUIRED: Use atomic operations, not synchronized blocks
 public void updateBalance(AccountId accountId, Money newBalance) {
  balances.computeIfAbsent(
   accountId,
   id -> new AtomicReference<>(Money.ZERO)
  ).set(newBalance);
 }

 // REQUIRED: Atomic compare-and-swap for conditional updates
 public boolean debitIfSufficient(AccountId accountId, Money amount) {
  AtomicReference<Money> balanceRef = balances.get(accountId);
  if (balanceRef == null) return false;

  return balanceRef.updateAndGet(current -> {
   return current.greaterThanOrEqual(amount)
    ? current.subtract(amount)
    : current;  // Insufficient funds - no change
  }) != balanceRef.get();  // Returns true if update succeeded
 }
}
```

**REQUIRED**: Synchronization MUST:

- Use `ConcurrentHashMap` instead of synchronized HashMap
- Use `AtomicReference` for atomic updates
- Use `compareAndSet` for conditional updates
- Minimize synchronized block scope

**PROHIBITED**: Synchronized methods (too coarse-grained).

### Lock-Free Data Structures

**REQUIRED**: Use lock-free concurrent collections for high-throughput operations.

```java
// REQUIRED: ConcurrentHashMap for thread-safe caching
private final ConcurrentHashMap<AccountId, AccountBalance> balanceCache =
 new ConcurrentHashMap<>();

// REQUIRED: ConcurrentLinkedQueue for audit events
private final ConcurrentLinkedQueue<AuditEvent> auditQueue =
 new ConcurrentLinkedQueue<>();

// REQUIRED: CopyOnWriteArrayList for rarely-updated lists
private final CopyOnWriteArrayList<ObserverSubscriber> subscribers =
 new CopyOnWriteArrayList<>();
```

**REQUIRED**: Use appropriate concurrent collections:

- **ConcurrentHashMap**: Frequently read/written maps (account caches, session stores)
- **ConcurrentLinkedQueue**: High-throughput queues (audit events, notification queues)
- **CopyOnWriteArrayList**: Rarely updated lists with frequent reads (event subscribers)
- **ConcurrentSkipListMap**: Sorted maps (time-ordered transaction logs)

**PROHIBITED**: Using synchronized wrappers (`Collections.synchronizedMap`) for high-concurrency scenarios.

### Parallel Streams Requirements

**REQUIRED**: Use parallel streams for CPU-bound batch operations.

```java
// REQUIRED: Parallel Zakat calculation for batch processing
public Map<AccountId, ZakatResult> calculateZakatForAllAccounts(
 List<Account> accounts
) {
 return accounts.parallelStream()
  .collect(Collectors.toConcurrentMap(
   Account::id,
   this::calculateZakatForAccount
  ));
}

// REQUIRED: Must be stateless and thread-safe
private ZakatResult calculateZakatForAccount(Account account) {
 // Pure function - no shared mutable state
 BigDecimal nisab = getNisabThreshold();  // Constant
 BigDecimal zakatRate = new BigDecimal("0.025");  // Constant

 if (account.balance().greaterThan(nisab)) {
  Money zakatAmount = account.balance().multiply(zakatRate);
  return new ZakatResult(account.id(), zakatAmount, Instant.now());
 } else {
  return ZakatResult.exempt(account.id());
 }
}
```

**REQUIRED**: Parallel stream operations MUST:

- Be stateless (no shared mutable state)
- Be thread-safe (use immutable data structures)
- Have independent computations (no dependencies between elements)
- Use `Collectors.toConcurrentMap` for concurrent accumulation

**PROHIBITED**: Using parallel streams with stateful operations (side effects, mutable collectors).

### ForkJoinPool Configuration

**REQUIRED**: Configure custom ForkJoinPool for CPU-intensive financial calculations.

```java
// REQUIRED: Custom pool sizing for CPU-bound operations
private static final ForkJoinPool COMPUTATION_POOL = new ForkJoinPool(
 Runtime.getRuntime().availableProcessors(),  // CPU cores
 ForkJoinPool.defaultForkJoinWorkerThreadFactory,
 null,  // No custom exception handler
 false  // Non-async mode
);

// REQUIRED: Use custom pool for parallel streams
public List<ZakatResult> calculateZakatBatch(List<Account> accounts) {
 try {
  return COMPUTATION_POOL.submit(() ->
   accounts.parallelStream()
    .map(this::calculateZakatForAccount)
    .toList()
  ).get();
 } catch (InterruptedException | ExecutionException e) {
  throw new ZakatCalculationException("Batch calculation failed", e);
 }
}
```

**REQUIRED**: ForkJoinPool configuration MUST:

- Size pool to CPU core count for CPU-bound work
- Use separate pools for I/O-bound vs CPU-bound work
- Set explicit thread names for observability

**PROHIBITED**: Using common ForkJoinPool for both I/O and CPU-bound work (contention).

### Race Condition Detection

**REQUIRED**: Concurrent tests MUST verify thread-safety with stress testing.

```java
// REQUIRED: Stress test for concurrent balance updates
@Test
void concurrentBalanceUpdatesShouldBeThreadSafe() throws InterruptedException {
 Account account = new Account(
  AccountId.of("12345"),
  Money.of("1000.00"),
  Instant.now(),
  AccountStatus.ACTIVE
 );

 int threadCount = 100;
 int operationsPerThread = 100;
 ExecutorService executor = Executors.newFixedThreadPool(threadCount);
 CountDownLatch latch = new CountDownLatch(threadCount);

 // Launch 100 threads, each performing 100 debits
 for (int i = 0; i < threadCount; i++) {
  executor.submit(() -> {
   try {
    for (int j = 0; j < operationsPerThread; j++) {
     accountService.debit(account.id(), Money.of("1.00"));
    }
   } finally {
    latch.countDown();
   }
  });
 }

 latch.await();
 executor.shutdown();

 // REQUIRED: Verify final balance is correct (no lost updates)
 Money expectedBalance = Money.of("1000.00")
  .subtract(Money.of("1.00").multiply(threadCount * operationsPerThread));
 assertThat(accountService.getBalance(account.id()))
  .isEqualByComparingTo(expectedBalance);
}
```

**REQUIRED**: Concurrency tests MUST:

- Use high thread counts (100+) to expose race conditions
- Verify final state correctness (no lost updates)
- Use `CountDownLatch` for coordinated thread execution
- Test both successful and failure scenarios

**RECOMMENDED**: Use tools like JCStress for deep concurrency testing.

### Property-Based Concurrency Testing

**RECOMMENDED**: Use property-based testing for concurrent invariants.

```java
// RECOMMENDED: Property-based test for concurrent operations
@Property
void concurrentBalanceOperationsShouldMaintainInvariants(
 @ForAll @Positive BigDecimal initialBalance,
 @ForAll List<@Positive BigDecimal> debits
) {
 // Given: Account with initial balance
 Account account = createAccount(Money.of(initialBalance));

 // When: Concurrent debits from multiple threads
 debits.parallelStream()
  .forEach(amount -> accountService.debit(account.id(), Money.of(amount)));

 // Then: Final balance should equal initial minus sum of debits
 Money expectedBalance = Money.of(initialBalance)
  .subtract(debits.stream()
   .map(Money::of)
   .reduce(Money.ZERO, Money::add));

 assertThat(accountService.getBalance(account.id()))
  .isEqualByComparingTo(expectedBalance);
}
```

### Thread Pool Sizing

**REQUIRED**: Thread pool sizing MUST match workload characteristics.

**I/O-Bound Operations** (virtual threads):

- **Pool size**: Unbounded (virtual threads are lightweight)
- **Use case**: Database queries, API calls, file I/O
- **Configuration**: `Executors.newVirtualThreadPerTaskExecutor()`

**CPU-Bound Operations** (platform threads):

- **Pool size**: CPU core count
- **Use case**: Complex calculations, cryptographic operations
- **Configuration**: `new ForkJoinPool(Runtime.getRuntime().availableProcessors())`

**Mixed Workloads**:

- **Separate pools**: One for I/O (virtual threads), one for CPU (platform threads)
- **Isolation**: Prevents I/O blocking from starving CPU work

### Concurrency Monitoring

**REQUIRED**: Production deployments MUST monitor concurrency metrics.

```java
// REQUIRED: Instrument virtual thread pools
private final ExecutorService executor =
 Executors.newVirtualThreadPerTaskExecutor();

// REQUIRED: Track active tasks, throughput, latency
public void monitorConcurrency() {
 // ThreadMXBean for platform threads
 ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
 long platformThreadCount = threadBean.getThreadCount();

 // Custom metrics for virtual threads (via instrumentation)
 long activeVirtualThreads = getActiveVirtualThreadCount();
 long queuedTasks = getQueuedTaskCount();

 // REQUIRED: Alert if thresholds exceeded
 if (activeVirtualThreads > VIRTUAL_THREAD_WARNING_THRESHOLD) {
  alertOperations("High virtual thread count: " + activeVirtualThreads);
 }
}
```

**REQUIRED**: Monitor:

- Active thread count (platform and virtual)
- Queued task count
- Task execution time (p50, p95, p99)
- Thread pool saturation
- Deadlock detection

### OSE Platform Standards

- [Error Handling Standards](./ex-soen-prla-ja__error-handling-standards.md) - Concurrent error propagation
- [Performance Standards](./ex-soen-prla-ja__performance-standards.md) - Performance implications of concurrency
- [Security Standards](./ex-soen-prla-ja__security-standards.md) - Thread-safe security patterns

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - Virtual threads, structured concurrency, parallel streams, CompletableFuture
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Concurrency patterns and thread safety practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21 (virtual threads), and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Immutability](../../../../../governance/principles/software-engineering/immutability.md)**
   - Record types for domain models guarantee thread safety by default
   - Updates create new instances (not mutate shared state)
   - Immutable collections prevent concurrent modification exceptions

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Virtual thread naming makes operations traceable in debugging (`zakat-calc-account-67890`)
   - StructuredTaskScope explicitly defines task relationships and cancellation policies
   - Atomic operations (`compareAndSet`) make concurrency guarantees explicit
   - Virtual threads eliminate callback complexity (write sequential code, get concurrency)
   - Parallel streams provide high-level concurrency (no manual thread management)
   - ConcurrentHashMap replaces low-level synchronization with simple API

3. **[Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)**
   - Parallel stream operations must be stateless (no shared mutable state)
   - Zakat calculation functions are pure (same input always produces same output)
   - Thread-safe by construction (no side effects)

## Compliance Checklist

Before deploying concurrent financial services, verify:

- [ ] All I/O-bound operations use virtual threads
- [ ] Domain models are immutable (record types or final fields)
- [ ] Synchronization minimized (lock-free data structures preferred)
- [ ] Parallel streams use stateless, thread-safe operations
- [ ] Custom ForkJoinPool configured for CPU-bound work
- [ ] Virtual threads have descriptive names for debugging
- [ ] Structured concurrency used for related subtasks
- [ ] Concurrency stress tests verify thread-safety
- [ ] Thread pool sizing matches workload characteristics
- [ ] Production monitoring tracks concurrency metrics

---

## Related Documentation

**Performance**:

- [Performance Standards](./ex-soen-prla-ja__performance-standards.md) - Thread pool sizing, async performance optimization, and JVM tuning

**Testing**:

- [Testing Standards](./ex-soen-prla-ja__testing-standards.md) - Concurrency testing patterns and race condition detection

**Security**:

- [Security Standards](./ex-soen-prla-ja__security-standards.md) - Thread-safe security context and concurrent authentication

**Last Updated**: 2026-02-04

**Status**: Active (mandatory for all OSE Platform Java services)
