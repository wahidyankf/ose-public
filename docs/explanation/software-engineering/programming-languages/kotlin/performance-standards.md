---
title: "Kotlin Performance Standards"
description: Authoritative OSE Platform Kotlin performance standards (inline functions, lazy initialization, sequences, benchmarks)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - performance
  - inline-functions
  - reified-generics
  - lazy-initialization
  - sequences
  - benchmarks
  - jmh
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to optimize performance in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for Kotlin development in the OSE Platform. It covers inline functions for lambda overhead elimination, reified generics, lazy initialization, sequence vs eager collection operations, JVM JIT considerations, JMH benchmarking, and memory allocation profiling.

**Target Audience**: OSE Platform Kotlin developers, performance engineers, technical reviewers

**Scope**: Kotlin-specific performance optimizations, measurement approaches, when to optimize

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Performance Measurement):

```kotlin
// JMH benchmark - automated, reproducible performance measurement
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
open class ZakatCalculationBenchmark {

    private val payers = generateZakatPayers(10_000)
    private val nisab = BigDecimal("5000.00")

    @Benchmark
    fun calculateEager(): BigDecimal =
        payers
            .filter { it.totalWealth > nisab }
            .map { calculateZakat(it.totalWealth, nisab) }
            .fold(BigDecimal.ZERO, BigDecimal::add)

    @Benchmark
    fun calculateSequence(): BigDecimal =
        payers.asSequence()
            .filter { it.totalWealth > nisab }
            .map { calculateZakat(it.totalWealth, nisab) }
            .fold(BigDecimal.ZERO, BigDecimal::add)
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit inline Annotation):

```kotlin
// Explicit inline keyword - communicates performance intent to readers
inline fun <T> measureZakatOperation(operationName: String, block: () -> T): T {
    val start = System.nanoTime()
    val result = block()
    val durationMs = (System.nanoTime() - start) / 1_000_000
    logger.debug("Zakat operation '$operationName' completed in ${durationMs}ms")
    return result
}

// No boxing: inline eliminates lambda object allocation
val obligation = measureZakatOperation("calculate") {
    calculateZakat(wealth, nisab)
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Collections for Performance Safety):

```kotlin
// Immutable collections prevent accidental mutation - safe to share across coroutines
val zakatRates: Map<String, BigDecimal> = mapOf(
    "GOLD" to BigDecimal("0.025"),
    "SILVER" to BigDecimal("0.025"),
    "CASH" to BigDecimal("0.025"),
    "TRADE_GOODS" to BigDecimal("0.025"),
)
// No concurrent modification risk - no locking overhead needed
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure, JIT-Friendly Calculation):

```kotlin
// Pure function: JIT can inline and optimize aggressively
fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal {
    if (wealth < nisab) return BigDecimal.ZERO
    return (wealth * ZAKAT_RATE).setScale(2, RoundingMode.HALF_UP)
}

// No side effects = JIT can hoist out of loops, cache results
val totalZakat = payers.sumOf { calculateZakat(it.totalWealth, nisab) }
```

### 5. Reproducibility First

**PASS Example** (Reproducible Benchmark Results):

```kotlin
// JMH fork ensures each benchmark runs in a fresh JVM
@Fork(value = 2, jvmArgs = ["-Xms2g", "-Xmx2g"])
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
open class ZakatCalculationBenchmark {
    // Fixed JVM flags and warmup ensure reproducible results
}
```

## Inline Functions

### When to Use inline

**MUST** use `inline` for higher-order functions used in hot paths to eliminate lambda object allocation.

```kotlin
// CORRECT: inline eliminates Function1 object allocation on each call
inline fun <T> List<T>.sumOfBigDecimal(selector: (T) -> BigDecimal): BigDecimal {
    var sum = BigDecimal.ZERO
    for (element in this) {
        sum += selector(element)  // selector call is inlined, no object created
    }
    return sum
}

// Usage - no lambda object allocated at call site
val totalWealth = payers.sumOfBigDecimal { it.totalWealth }

// WITHOUT inline - Function1 object created on every call
fun <T> List<T>.sumOfBigDecimalSlow(selector: (T) -> BigDecimal): BigDecimal {
    // selector is a Function1 object - allocated every call
}
```

**MUST NOT** use `inline` for functions that do not accept lambdas (no benefit).

```kotlin
// WRONG: inline on non-lambda function (no performance benefit, adds complexity)
inline fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal { ... }

// CORRECT: Regular function for non-lambda logic
fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal { ... }
```

### noinline and crossinline

**SHOULD** use `noinline` for lambda parameters that must remain as objects.

```kotlin
// crossinline for lambdas passed to non-inline contexts
inline fun performZakatAsync(
    payerId: String,
    crossinline onComplete: (ZakatReceipt) -> Unit,  // Passed to coroutine - must crossinline
) {
    scope.launch {
        val receipt = processPayment(payerId)
        onComplete(receipt)
    }
}
```

## Reified Generics

**MUST** use `reified` generics with `inline` to access type information at runtime without reflection overhead.

```kotlin
// CORRECT: reified type parameter - no Class<T> parameter needed
inline fun <reified T : ZakatDomainError> Result<*>.getErrorAs(): T? =
    exceptionOrNull() as? T

// Usage - clean, no cast visible to caller
val notFoundError = result.getErrorAs<ZakatDomainError.PayerNotFound>()

// WITHOUT reified - requires explicit Class parameter
fun <T : ZakatDomainError> Result<*>.getErrorAs(clazz: Class<T>): T? =
    clazz.cast(exceptionOrNull())  // Verbose, reflection overhead

// CORRECT: reified for JSON deserialization
inline fun <reified T> String.fromJson(): T =
    Json.decodeFromString<T>(this)

val payer: ZakatPayer = jsonString.fromJson()
```

## Lazy Initialization

**MUST** use `by lazy` for expensive initialization that may not be needed.

```kotlin
// CORRECT: Lazy initialization of expensive resources
class ZakatRateService {
    // HttpClient initialized only on first use, not at service construction
    private val httpClient by lazy {
        HttpClient(CIO) {
            install(ContentNegotiation) {
                json()
            }
            install(HttpTimeout) {
                requestTimeoutMillis = 5_000
            }
        }
    }

    // Cached nisab value - computed once per day
    private val dailyNisab: BigDecimal by lazy { fetchNisabFromOracle() }

    suspend fun getRates(): ZakatRates = httpClient.get("https://rates.ose.com/zakat").body()
}

// CORRECT: Thread-safe lazy by default (SYNCHRONIZED mode)
private val expensiveCache: Map<String, BigDecimal> by lazy {
    buildZakatRateCache()  // Called at most once
}

// CORRECT: Non-thread-safe lazy for single-thread contexts
private val localCache by lazy(LazyThreadSafetyMode.NONE) {
    buildLocalCache()  // Faster, no synchronization overhead
}
```

## Sequences vs Lists (Lazy vs Eager)

**MUST** use sequences for multi-step transformations on large collections to avoid intermediate list creation.

```kotlin
// WRONG: Eager evaluation creates 3 intermediate lists
fun filterAndCalculateEager(payers: List<ZakatPayer>): List<BigDecimal> =
    payers
        .filter { it.totalWealth > nisab }        // Creates list 1
        .filter { it.isActive }                    // Creates list 2
        .map { calculateZakat(it.totalWealth, nisab) }  // Creates list 3

// CORRECT: Sequence is lazy - no intermediate lists
fun filterAndCalculateLazy(payers: List<ZakatPayer>): List<BigDecimal> =
    payers.asSequence()
        .filter { it.totalWealth > nisab }         // No intermediate allocation
        .filter { it.isActive }                     // No intermediate allocation
        .map { calculateZakat(it.totalWealth, nisab) }  // Only final list created
        .toList()

// GUIDELINE: Use sequence when:
// - Collection has >1000 elements
// - Multiple filter/map/flatMap operations chained
// - Short-circuit operations (first, any, none) are expected to terminate early
```

## Avoiding Primitive Boxing

**MUST** use primitive-backed types for numeric computation.

```kotlin
// WRONG: List<Int> boxes each Int into Integer object
val counts: List<Int> = zakatPayers.map { it.installmentCount }
val total: Int = counts.sum()

// CORRECT: IntArray avoids boxing
val counts: IntArray = zakatPayers.map { it.installmentCount }.toIntArray()
val total: Int = counts.sum()

// CORRECT: Direct sum without intermediate collection
val total: Int = zakatPayers.sumOf { it.installmentCount }

// Kotlin inline value class avoids boxing for wrapper types
@JvmInline
value class ZakatAmount(val value: BigDecimal) {
    operator fun plus(other: ZakatAmount): ZakatAmount = ZakatAmount(value + other.value)
}
// ZakatAmount is represented as BigDecimal at runtime - no wrapper object
```

## JMH Benchmarking

**SHOULD** use JMH for measuring performance of hot paths.

```kotlin
// build.gradle.kts - JMH dependency
dependencies {
    jmhImplementation("org.openjdk.jmh:jmh-core:1.37")
    jmhAnnotationProcessor("org.openjdk.jmh:jmh-generator-annprocess:1.37")
}

// ZakatBenchmark.kt
@State(Scope.Benchmark)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Fork(2)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
open class ZakatCalculationBenchmark {
    private lateinit var largePayers: List<ZakatPayer>

    @Setup
    fun setup() {
        largePayers = (1..100_000).map { i ->
            ZakatPayer(
                id = "PAYER-$i",
                totalWealth = BigDecimal(i * 1000),
            )
        }
    }

    @Benchmark
    fun eagerCollections(): BigDecimal =
        largePayers.filter { it.totalWealth > nisab }.sumOf { calculateZakat(it.totalWealth, nisab) }

    @Benchmark
    fun lazySequence(): BigDecimal =
        largePayers.asSequence().filter { it.totalWealth > nisab }.sumOf { calculateZakat(it.totalWealth, nisab) }
}
```

## Enforcement

- **Kotlin compiler** - Warns when `inline` is ineffective (on non-lambda functions)
- **Detekt** - `SpreadOperator` rule flags performance-degrading spread operator usage
- **Code reviews** - Verify sequence usage for large collection pipelines and inline on hot path functions
- **JMH benchmarks** - Required for performance-critical domain operations before optimization

**Pre-commit checklist** (for performance-sensitive code):

- [ ] `inline` used for higher-order functions in hot paths
- [ ] `reified` used instead of `Class<T>` parameters where applicable
- [ ] `by lazy` for expensive singleton initialization
- [ ] Sequences used for multi-step transformations on collections >1000 elements
- [ ] No `Double`/`Float` for financial calculations (`BigDecimal` required)
- [ ] Benchmarks written before optimizing hot paths (measure first)

## Related Standards

- [Coding Standards](./coding-standards.md) - General idioms including sequence usage
- [Concurrency Standards](./concurrency-standards.md) - Coroutine performance (dispatcher selection)
- [Type Safety Standards](./type-safety-standards.md) - Inline value classes

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Implementation Workflow](../../../../../governance/development/workflow/implementation.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Performance Tools: JMH 1.37, Kotlin inline functions, kotlinx.collections
