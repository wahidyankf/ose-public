---
title: "Kotlin Type Safety Standards"
description: Authoritative OSE Platform Kotlin type safety standards (null safety, sealed classes, data classes, generics, value classes)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - type-safety
  - null-safety
  - sealed-classes
  - generics
  - data-classes
  - value-classes
  - variance
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to use Kotlin's type system in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for Kotlin development in the OSE Platform. It covers Kotlin's null safety system, sealed classes for exhaustive `when`, data classes for value types, inline value classes, generics with variance (`in`/`out`), reified generics, type aliases, and prohibitions on `Any`/dynamic patterns.

**Target Audience**: OSE Platform Kotlin developers, technical reviewers

**Scope**: Kotlin type system usage patterns, null safety discipline, generic design, type alias usage

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Compiler-Enforced Type Safety):

```kotlin
// Kotlin compiler catches null dereferences at compile time - no runtime NPE
fun processZakatApplication(application: ZakatApplication?) {
    // application?.approve() - safe call, compiler knows it might be null
    val approved = application?.approve(currentReviewerId)
        ?: return  // Elvis operator: early return if null

    // Here, `approved` is non-null - compiler knows this
    repository.save(approved)
}
// Zero runtime NullPointerExceptions when ? and ?: are used correctly
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Nullable Types in API):

```kotlin
// Nullable types are explicit in signatures - no guessing
interface ZakatRepository {
    suspend fun findById(id: String): ZakatPayer?  // ? is visible - can return null
    suspend fun findAll(): List<ZakatPayer>         // Non-null - always returns list
    suspend fun save(payer: ZakatPayer): ZakatPayer // Non-null input and output
}

// WRONG: Hiding nullability with Optional (Java pattern)
interface BadRepository {
    fun findById(id: String): Optional<ZakatPayer>  // Java-ism, use ? instead
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Data Classes):

```kotlin
// data class creates immutable value type
data class ZakatPeriod(
    val year: Int,
    val month: Int,  // 1-12 (Hijri calendar month)
) {
    init {
        require(year in 1000..9999) { "Invalid Hijri year: $year" }
        require(month in 1..12) { "Invalid Hijri month: $month" }
    }

    // copy() creates new instance - original unchanged
    fun nextMonth(): ZakatPeriod = when (month) {
        12 -> copy(year = year + 1, month = 1)
        else -> copy(month = month + 1)
    }
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Generic Transformation):

```kotlin
// Pure generic function - type-safe transformation without side effects
fun <T, R> List<T>.mapResult(transform: (T) -> Result<R>): Result<List<R>> {
    val results = mutableListOf<R>()
    for (item in this) {
        val result = transform(item)
        if (result.isFailure) return result.map { emptyList() }
        results.add(result.getOrThrow())
    }
    return Result.success(results)
}

// Usage: Type-safe batch Zakat calculation
val obligations: Result<List<ZakatObligation>> =
    payers.mapResult { payer ->
        runCatching { calculateObligation(payer) }
    }
```

### 5. Reproducibility First

**PASS Example** (Type Aliases for Stable API):

```kotlin
// Type aliases create stable names even if underlying types change
typealias ZakatPayerId = String   // Can change to value class without breaking callers
typealias NisabAmount = BigDecimal
typealias ZakatRate = BigDecimal

fun calculateZakat(
    wealth: NisabAmount,  // Self-documenting parameter types
    nisab: NisabAmount,
    rate: ZakatRate = BigDecimal("0.025"),
): NisabAmount = if (wealth >= nisab) (wealth * rate).setScale(2, RoundingMode.HALF_UP)
else BigDecimal.ZERO
```

## Null Safety System

### Nullable vs Non-Nullable Types

**MUST** use non-nullable types as default. Use `?` only when null is a meaningful value.

```kotlin
// CORRECT: Non-nullable as default
data class ZakatPayer(
    val id: String,           // Always has a value
    val name: String,         // Always has a value
    val goldWealth: BigDecimal,  // Always has a value (may be 0)
    val notes: String?,       // Nullable: notes are optional, null means "no notes"
)

// CORRECT: Nullable return when entity may not exist
suspend fun findPayer(id: String): ZakatPayer? = repository.findById(id)

// WRONG: Everything nullable (defeats Kotlin's type system)
data class BadZakatPayer(
    val id: String?,       // ID should never be null
    val name: String?,     // Name should never be null
    val wealth: BigDecimal?,  // Wealth should be 0, not null
)
```

### Safe Call Operator (?.)

**MUST** use safe call operator for nullable chain operations.

```kotlin
// CORRECT: Safe call chain
val payerName: String? = repository.findById(payerId)?.name
val obligationAmount: BigDecimal? = repository.findById(payerId)?.let {
    if (it.totalWealth >= currentNisab) it.totalWealth.applyZakatRate() else null
}

// WRONG: Explicit null check (verbose Java-style)
val payer = repository.findById(payerId)
val payerName = if (payer != null) payer.name else null
```

### Elvis Operator (?:)

**MUST** use Elvis operator for null defaults and early returns.

```kotlin
// CORRECT: Default value
val displayName = payer.name ?: "Unknown Payer"

// CORRECT: Early return
val payer = repository.findById(payerId)
    ?: return Result.failure(ZakatPayerNotFoundException(payerId))

// CORRECT: Exception throw
val contract = contractRepository.findById(contractId)
    ?: throw MurabahaContractNotFoundException(contractId)
```

### Non-Null Assertion (!!)

**PROHIBITED**: Using `!!` without explicit justification.

```kotlin
// WRONG: !! without justification (crashes at runtime if null)
val payerName = payer!!.name

// ACCEPTABLE ONLY: !! when null is a programmer error (with justification)
// Justification: JWT token subject is validated as non-null by authentication middleware
// before this function is called. Null here indicates a bug in authentication config.
val userId = jwtPrincipal!!.subject

// PREFERRED: Use require() instead of !! for clarity
val userId = requireNotNull(jwtPrincipal?.subject) {
    "JWT token missing subject claim - authentication middleware misconfigured"
}
```

### Smart Casts

**MUST** leverage Kotlin smart casts for efficient null and type checks.

```kotlin
// CORRECT: Smart cast in if block
fun processObligation(obligation: ZakatObligation?) {
    if (obligation != null) {
        // Smart cast: obligation is ZakatObligation (non-null) here
        val amount = obligation.amount  // No ?. needed
    }
}

// CORRECT: Smart cast in when
fun describeObligation(status: ZakatObligationStatus): String = when (status) {
    is ZakatObligationStatus.Obligated -> {
        // Smart cast: status.amount accessible without cast
        "Due: ${status.amount}"
    }
    is ZakatObligationStatus.Paid -> "Paid: ${status.paidAmount}"
    else -> "N/A"
}
```

## Sealed Classes

**MUST** use sealed classes for exhaustive domain state representation.

```kotlin
// Complete sealed class hierarchy for Zakat application lifecycle
sealed class ZakatApplicationState {
    data class Draft(val applicantId: String) : ZakatApplicationState()
    data class Submitted(val submittedAt: Instant) : ZakatApplicationState()
    data class UnderReview(val reviewerId: String, val startedAt: Instant) : ZakatApplicationState()
    data class Approved(
        val reviewerId: String,
        val approvedAt: Instant,
        val obligationAmount: BigDecimal,
    ) : ZakatApplicationState()
    data class Rejected(val reviewerId: String, val reason: String) : ZakatApplicationState()
    object Withdrawn : ZakatApplicationState()
}

// Compiler enforces ALL states are handled
fun ZakatApplicationState.toDisplayString(): String = when (this) {
    is ZakatApplicationState.Draft -> "Draft application by ${applicantId}"
    is ZakatApplicationState.Submitted -> "Submitted at ${submittedAt}"
    is ZakatApplicationState.UnderReview -> "Under review by ${reviewerId}"
    is ZakatApplicationState.Approved -> "Approved - obligation: ${obligationAmount}"
    is ZakatApplicationState.Rejected -> "Rejected: ${reason}"
    is ZakatApplicationState.Withdrawn -> "Withdrawn"
    // No else needed - sealed class is exhaustive
}
```

## Data Classes

**MUST** use data classes for value objects and DTOs.

```kotlin
// Data class provides: equals, hashCode, copy, toString, componentN
data class MurabahaTerms(
    val costPrice: BigDecimal,
    val profitMargin: BigDecimal,
    val installmentCount: Int,
) {
    val totalAmount: BigDecimal get() = costPrice + profitMargin
    val installmentAmount: BigDecimal get() =
        (totalAmount / installmentCount.toBigDecimal()).setScale(2, RoundingMode.HALF_UP)
}

// copy() for safe state transitions
val updatedTerms = originalTerms.copy(installmentCount = 24)

// WRONG: Using data class as mutable entity
data class MutableEntity(
    var id: String,  // var in data class defeats immutability purpose
    var status: String,
)
```

## Inline Value Classes

**MUST** use `@JvmInline value class` for type-safe domain identifiers and monetary types.

```kotlin
// Type-safe identifier prevents mixing IDs from different domains
@JvmInline
value class ZakatPayerId(val value: String) {
    companion object {
        fun generate(): ZakatPayerId = ZakatPayerId("PAYER-${UUID.randomUUID()}")
    }
}

@JvmInline
value class MurabahaContractId(val value: String) {
    companion object {
        fun generate(): MurabahaContractId = MurabahaContractId("CONTRACT-${UUID.randomUUID()}")
    }
}

// CORRECT: Compiler prevents mixing up IDs
fun approveContract(contractId: MurabahaContractId, reviewerId: ZakatPayerId) { ... }

// Type error: Cannot pass ZakatPayerId where MurabahaContractId expected
// approveContract(zakatPayerId, reviewerId)  // Compile error!

// WRONG: Using raw String - no type safety
fun badApproveContract(contractId: String, reviewerId: String) { ... }
// approveContract(reviewerId, contractId)  // Compiles but silently wrong!
```

## Generics with Variance

**MUST** use `out` for covariant types (producers) and `in` for contravariant types (consumers).

```kotlin
// Covariant (out) - read-only producer
interface ZakatObligationProvider<out T : ZakatObligation> {
    fun get(): T  // Can return T or any subtype
}

// Contravariant (in) - write-only consumer
interface ZakatObligationProcessor<in T : ZakatObligation> {
    fun process(obligation: T)  // Can accept T or any supertype
}

// Invariant - read and write
interface ZakatRepository<T : ZakatEntity> {
    fun save(entity: T): T  // Must be T exactly (both in and out positions)
    fun find(id: String): T?
}

// Use-site variance when declaration-site is not possible
fun sumZakatAmounts(obligations: List<out ZakatObligation>): BigDecimal =
    obligations.sumOf { it.obligatedAmount }
```

## Type Aliases

**SHOULD** use type aliases for domain-specific type names and complex generic types.

```kotlin
// Domain type aliases for readability
typealias ZakatPaymentProcessor = suspend (ZakatPayment) -> Result<ZakatReceipt>
typealias ZakatObligationMap = Map<String, ZakatObligation>

// Complex generic alias
typealias ValidationResult<T> = Result<T>
typealias ZakatFlow<T> = Flow<Result<T>>

// Usage: self-documenting code
fun processAllPayments(
    payments: List<ZakatPayment>,
    processor: ZakatPaymentProcessor,
): Flow<Result<ZakatReceipt>> = payments.asFlow().map { processor(it) }
```

## Avoiding Any and Dynamic

**PROHIBITED**: Using `Any` or `@JvmField` dynamic patterns that lose type safety.

```kotlin
// WRONG: Using Any loses type safety
fun processZakatData(data: Any) {
    when (data) {
        is String -> processString(data)
        is BigDecimal -> processAmount(data)
        else -> throw IllegalArgumentException("Unknown type: ${data::class}")
    }
}

// CORRECT: Use sealed class for known types
sealed class ZakatData {
    data class PayerReference(val payerId: String) : ZakatData()
    data class Amount(val value: BigDecimal) : ZakatData()
}

fun processZakatData(data: ZakatData) = when (data) {
    is ZakatData.PayerReference -> processPayer(data.payerId)
    is ZakatData.Amount -> processAmount(data.value)
}

// WRONG: Unchecked cast from Any
fun parseZakatAmount(raw: Any): BigDecimal = raw as BigDecimal  // ClassCastException risk

// CORRECT: Safe cast with check
fun parseZakatAmount(raw: Any): BigDecimal {
    return raw as? BigDecimal
        ?: throw IllegalArgumentException("Expected BigDecimal but got ${raw::class.simpleName}")
}
```

## Enforcement

- **Kotlin compiler** - Null safety enforced at compile time (no nullability warnings with `allWarningsAsErrors`)
- **Detekt** - `UnsafeCallOnNullableType` flags `!!`, `UnsafeCast` flags unchecked casts
- **Sealed class exhaustiveness** - Compiler requires all branches in `when` expressions
- **Code reviews** - Verify value class usage for IDs, sealed classes for state machines

**Pre-commit checklist**:

- [ ] No `!!` without justification comment
- [ ] `Any` parameter replaced with sealed class or generic bound
- [ ] Domain IDs use `@JvmInline value class` instead of raw `String`
- [ ] Sealed classes used for all domain state machines
- [ ] Generic variance (`in`/`out`) applied correctly
- [ ] Type aliases used for complex generic types

## Related Standards

- [Coding Standards](./coding-standards.md) - Null safety idioms and sealed class patterns
- [DDD Standards](./ddd-standards.md) - Value Objects with data classes and value classes
- [Error Handling Standards](./error-handling-standards.md) - Sealed error hierarchies

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Type System: Null safety, sealed classes, value classes, generics variance
