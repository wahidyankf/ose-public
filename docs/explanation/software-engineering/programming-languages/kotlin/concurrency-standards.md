---
title: "Kotlin Concurrency Standards"
description: Authoritative OSE Platform Kotlin concurrency standards (coroutines, structured concurrency, Flow, channels)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - concurrency
  - coroutines
  - flow
  - channels
  - structured-concurrency
  - dispatchers
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to use concurrency in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative concurrency standards** for Kotlin development in the OSE Platform. It covers Kotlin Coroutines, structured concurrency, CoroutineScope lifecycle, Flow for reactive streams, StateFlow/SharedFlow, channels, Mutex, and CoroutineDispatcher selection.

**Target Audience**: OSE Platform Kotlin developers, technical reviewers

**Scope**: Coroutine launch patterns, structured concurrency, Flow vs StateFlow, dispatcher selection, Mutex, avoiding thread blocking

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Concurrency with Coroutines):

```kotlin
// Coroutines automate thread management - no manual thread pools
suspend fun processAllZakatPayments(payments: List<ZakatPaymentRequest>): List<ZakatReceipt> =
    coroutineScope {
        payments
            .map { payment -> async { processPayment(payment) } }
            .awaitAll()
    }
// Kotlin manages thread pool, scheduling, and cleanup automatically
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Dispatcher Selection):

```kotlin
// CORRECT: Explicit dispatcher for IO operations
class ZakatRepository(private val db: Database) {
    suspend fun findPayer(id: String): ZakatPayer? =
        withContext(Dispatchers.IO) {  // Explicitly IO-bound
            db.query("SELECT * FROM payers WHERE id = ?", id)
        }
}

// CORRECT: Explicit scope for background work
class ZakatCalculationService(private val scope: CoroutineScope) {
    fun startNightlyCalculation() {
        scope.launch(Dispatchers.Default) {  // CPU-bound calculation
            calculateAllObligations()
        }
    }
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Flow of Zakat Data):

```kotlin
// Flow emits immutable values - no shared mutable state
fun observeZakatObligations(payerId: String): Flow<ZakatObligation> = flow {
    while (true) {
        val obligation = fetchCurrentObligation(payerId)  // val, not var
        emit(obligation)  // Emit immutable value
        delay(1.hours)
    }
}

// StateFlow holds immutable current state
private val _currentNisab = MutableStateFlow(NisabValue.default())
val currentNisab: StateFlow<NisabValue> = _currentNisab.asStateFlow()  // Immutable view
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Zakat Calculation in Flow):

```kotlin
// Flow transformation is pure - no side effects until collected
fun zakatObligationFlow(payerId: String): Flow<BigDecimal> =
    payerDataFlow(payerId)
        .filter { payer -> payer.totalWealth > BigDecimal.ZERO }  // Pure filter
        .map { payer -> calculateZakat(payer.totalWealth, currentNisab) }  // Pure map
        .distinctUntilChanged()  // Only emit when obligation changes
// Side effects (saving, notifying) happen at collection site, not in pipeline
```

### 5. Reproducibility First

**PASS Example** (Deterministic Coroutine Testing):

```kotlin
// runTest with TestCoroutineScheduler for deterministic time control
@Test
fun `zakat calculation retries three times before failing`() = runTest {
    var callCount = 0
    coEvery { repository.fetchNisab() } answers {
        callCount++
        if (callCount < 3) throw IOException("Temporary failure")
        NisabValue.standard()
    }

    val result = zakatService.fetchNisabWithRetry(maxRetries = 3)

    assertTrue(result.isSuccess)
    assertEquals(3, callCount)
}
```

## Coroutine Basics

### launch vs async

**MUST** use `launch` for fire-and-forget coroutines with no result.

**MUST** use `async` when a result is needed (`Deferred<T>`).

```kotlin
// CORRECT: launch for side effects (no return value)
scope.launch {
    notifyZakatPayer(payerId, obligationAmount)
}

// CORRECT: async for parallel computation with results
suspend fun calculatePortfolioZakat(portfolios: List<Portfolio>): BigDecimal =
    coroutineScope {
        val zakatAmounts = portfolios.map { portfolio ->
            async { calculateZakat(portfolio.totalValue, currentNisab()) }
        }
        zakatAmounts.awaitAll().fold(BigDecimal.ZERO, BigDecimal::add)
    }

// WRONG: async when result is not used (use launch instead)
scope.async { notifyPayer(payerId) }  // Deferred is unused - use launch
```

### Structured Concurrency

**MUST** follow structured concurrency - coroutines live within a defined scope.

```kotlin
// CORRECT: Structured - coroutines are children of their scope
class ZakatProcessingService(private val scope: CoroutineScope) {

    // All launched coroutines are children of `scope`
    fun processPayment(payment: ZakatPaymentRequest) {
        scope.launch {
            val receipt = processZakatPayment(payment)
            updatePayerRecord(payment.payerId, receipt)
        }
    }
    // When scope is cancelled, all child coroutines are cancelled
}

// CORRECT: coroutineScope for temporary parallel work
suspend fun processPayments(payments: List<ZakatPaymentRequest>): List<ZakatReceipt> =
    coroutineScope {
        payments.map { payment -> async { processPayment(payment) } }.awaitAll()
    }
// Scope ends when all children complete

// WRONG: GlobalScope breaks structured concurrency
GlobalScope.launch {  // Scope not tied to any lifecycle - potential leak
    processPayment(payment)
}
```

### CoroutineScope Lifecycle

**MUST** tie `CoroutineScope` to a lifecycle (Service, Request, etc.).

```kotlin
// CORRECT: Ktor service with managed scope
class ZakatService : Service {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun start() {
        scope.launch { runCalculationLoop() }
    }

    fun stop() {
        scope.cancel()  // All child coroutines cancelled
    }
}

// CORRECT: Spring service with @PreDestroy cleanup
@Service
class ZakatCalculationService {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @PreDestroy
    fun cleanup() {
        scope.cancel("Service shutting down")
    }
}
```

## CoroutineDispatchers

### Dispatcher Selection

**MUST** select the correct dispatcher for each operation type.

```kotlin
// Dispatchers.IO - Blocking I/O (database, file, network)
suspend fun saveZakatTransaction(transaction: ZakatTransaction) =
    withContext(Dispatchers.IO) {
        database.save(transaction)
    }

// Dispatchers.Default - CPU-intensive calculation
suspend fun calculateAllObligations(payers: List<ZakatPayer>): List<ZakatObligation> =
    withContext(Dispatchers.Default) {
        payers.map { payer -> calculateObligation(payer) }  // CPU work
    }

// Dispatchers.Main - UI updates (Android only)
// Not used in server-side Kotlin services

// Dispatchers.Unconfined - Only for specific testing scenarios
// SHOULD NOT be used in production code

// WRONG: No dispatcher for blocking I/O (blocks coroutine thread pool)
suspend fun saveTransactionWrong(transaction: ZakatTransaction) {
    database.save(transaction)  // Blocking call without IO dispatcher!
}
```

### Avoiding Thread Blocking

**MUST NOT** call blocking APIs directly in coroutines without `withContext(Dispatchers.IO)`.

```kotlin
// WRONG: Thread.sleep blocks the coroutine thread
suspend fun waitForProcessing() {
    Thread.sleep(1000)  // Blocks thread, not coroutine!
}

// CORRECT: delay suspends the coroutine
suspend fun waitForProcessing() {
    delay(1.seconds)  // Suspends coroutine, thread is free
}

// WRONG: Blocking network call without IO dispatcher
suspend fun fetchNisabRate(): BigDecimal {
    return OkHttpClient().newCall(request).execute().body.string().toBigDecimal()  // Blocking!
}

// CORRECT: Blocking call wrapped in IO context
suspend fun fetchNisabRate(): BigDecimal =
    withContext(Dispatchers.IO) {
        OkHttpClient().newCall(request).execute().body?.string()?.toBigDecimal()
            ?: throw IOException("Empty response")
    }
```

## Flow

### Basic Flow Patterns

**MUST** use `Flow` for reactive data streams with backpressure support.

```kotlin
// CORRECT: Flow for stream of Zakat obligation updates
fun zakatObligationUpdates(payerId: String): Flow<ZakatObligation> = flow {
    while (true) {
        emit(fetchCurrentObligation(payerId))
        delay(1.hours)
    }
}

// CORRECT: Flow operators for transformation pipeline
fun zakatDashboard(payerId: String): Flow<ZakatDashboardState> =
    combine(
        zakatObligationUpdates(payerId),
        nisabUpdates(),
        paymentHistoryFlow(payerId),
    ) { obligation, nisab, history ->
        ZakatDashboardState(obligation, nisab, history)
    }
```

### StateFlow and SharedFlow

**MUST** use `StateFlow` for observable state with a current value.

**MUST** use `SharedFlow` for event broadcasting (no current value needed).

```kotlin
// StateFlow - observable state, always has a current value
class ZakatNisabService {
    private val _currentNisab = MutableStateFlow(NisabValue.default())
    val currentNisab: StateFlow<NisabValue> = _currentNisab.asStateFlow()

    suspend fun updateNisab(newValue: NisabValue) {
        _currentNisab.value = newValue  // Atomic update
    }
}

// SharedFlow - event broadcasting, no buffering by default
class ZakatEventBus {
    private val _events = MutableSharedFlow<ZakatEvent>()
    val events: SharedFlow<ZakatEvent> = _events.asSharedFlow()

    suspend fun publish(event: ZakatEvent) {
        _events.emit(event)
    }
}

// WRONG: Exposing MutableStateFlow directly
class BadService {
    val currentNisab = MutableStateFlow(NisabValue.default())  // Allows external mutation!
}
```

## Channels

**SHOULD** use `Channel` for producer-consumer patterns with explicit buffering.

```kotlin
// Producer-consumer with Channel
class ZakatPaymentQueue {
    private val queue = Channel<ZakatPaymentRequest>(capacity = 100)

    suspend fun enqueue(payment: ZakatPaymentRequest) {
        queue.send(payment)  // Suspends if queue is full
    }

    fun startProcessing(scope: CoroutineScope) {
        scope.launch {
            for (payment in queue) {  // consumeEach alternative
                processPayment(payment)
            }
        }
    }
}
```

## Mutex and Semaphore

**MUST** use `Mutex` for coroutine-safe shared state access.

```kotlin
// CORRECT: Mutex for coroutine-safe state
class ZakatRateCache {
    private val mutex = Mutex()
    private var cachedRate: BigDecimal? = null

    suspend fun getRate(): BigDecimal = mutex.withLock {
        cachedRate ?: fetchRateFromApi().also { cachedRate = it }
    }

    suspend fun invalidate() = mutex.withLock {
        cachedRate = null
    }
}

// WRONG: Java synchronized in coroutines (blocks thread)
class BadCache {
    @Synchronized  // Blocks thread, not coroutine-friendly
    fun getRate(): BigDecimal { ... }
}
```

## Enforcement

- **Detekt coroutine rules** - Flags `GlobalScope`, `Thread.sleep`, `SleepInsteadOfDelay`
- **Detekt `RedundantSuspendModifier`** - Removes unnecessary `suspend` modifiers
- **Code reviews** - Verify structured concurrency, correct dispatcher selection
- **kotlinx-coroutines-test** - `runTest` catches dangling coroutines as test failures

**Pre-commit checklist**:

- [ ] No `GlobalScope` usage (use structured scope)
- [ ] No `Thread.sleep` in coroutines (use `delay`)
- [ ] Blocking I/O wrapped in `withContext(Dispatchers.IO)`
- [ ] `MutableStateFlow` never exposed directly (use `asStateFlow()`)
- [ ] `supervisorScope` used for independent parallel operations
- [ ] `CoroutineScope` lifecycle tied to service/component lifecycle

## Related Standards

- [Error Handling Standards](./error-handling-standards.md) - CoroutineExceptionHandler, supervisorScope
- [API Standards](./api-standards.md) - Ktor suspend route handlers
- [Testing Standards](./testing-standards.md) - runTest and coroutine test patterns

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Coroutines: kotlinx.coroutines 1.10.1
