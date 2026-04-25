---
title: "Kotlin Error Handling Standards"
description: Authoritative OSE Platform Kotlin error handling standards (Result type, sealed hierarchies, coroutine exceptions)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - error-handling
  - result-type
  - sealed-classes
  - exceptions
  - coroutines
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to handle errors in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative error handling standards** for Kotlin development in the OSE Platform. It covers Kotlin's `Result<T>` type, `runCatching`, sealed class error hierarchies, custom exception design, and coroutine-specific exception handling patterns.

**Target Audience**: OSE Platform Kotlin developers, technical reviewers

**Scope**: Result<T> patterns, sealed error types, exception design, CoroutineExceptionHandler, supervisorScope

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Error Propagation):

```kotlin
// Result<T> chains errors automatically without manual null checks
fun processZakatPayment(payerId: String, amount: BigDecimal): Result<ZakatReceipt> =
    zakatRepository.findPayer(payerId)
        .flatMap { payer -> validateZakatAmount(payer, amount) }
        .flatMap { validatedAmount -> zakatRepository.recordPayment(payerId, validatedAmount) }
        .map { transaction -> ZakatReceipt.from(transaction) }
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Error Representation):

```kotlin
// Sealed class makes all error cases explicit at compile time
sealed class ZakatError {
    data class PayerNotFound(val payerId: String) : ZakatError()
    data class WealthBelowNisab(val wealth: BigDecimal, val nisab: BigDecimal) : ZakatError()
    data class InvalidAmount(val amount: BigDecimal, val reason: String) : ZakatError()
    data class RepositoryError(val cause: Throwable) : ZakatError()
}

// when expression is exhaustive - compiler rejects missing branches
fun handleZakatError(error: ZakatError): String = when (error) {
    is ZakatError.PayerNotFound -> "Payer ${error.payerId} not found"
    is ZakatError.WealthBelowNisab -> "Wealth ${error.wealth} is below nisab ${error.nisab}"
    is ZakatError.InvalidAmount -> "Invalid amount: ${error.reason}"
    is ZakatError.RepositoryError -> "Storage error: ${error.cause.message}"
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Error Context):

```kotlin
// Error data classes are immutable val-only records
data class ZakatValidationError(
    val field: String,
    val rejectedValue: Any?,
    val message: String,
    val timestamp: Instant = Instant.now(),
)
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Error Domain Logic):

```kotlin
// Pure validation function - returns Result, no side effects
fun validateMurabahaTerms(
    costPrice: BigDecimal,
    profitMargin: BigDecimal,
    installmentCount: Int,
): Result<MurabahaTerms> = runCatching {
    require(costPrice > BigDecimal.ZERO) { "Cost price must be positive" }
    require(profitMargin >= BigDecimal.ZERO) { "Profit margin cannot be negative" }
    require(installmentCount in 1..360) { "Installment count must be between 1 and 360" }

    val profitRate = profitMargin / costPrice
    require(profitRate <= BigDecimal("0.30")) {
        "Profit rate ${profitRate.toPlainString()} exceeds maximum 30%"
    }

    MurabahaTerms(costPrice, profitMargin, installmentCount)
}
```

### 5. Reproducibility First

**PASS Example** (Deterministic Error Codes):

```kotlin
// Stable error codes for API clients across deployments
sealed class OseError(
    val code: String,  // Stable code - never changes
    override val message: String,
) : Exception(message) {
    class ZakatPayerNotFound(payerId: String) : OseError(
        code = "ZAKAT_001",
        message = "Zakat payer not found: $payerId",
    )
    class ZakatBelowNisab(wealth: BigDecimal) : OseError(
        code = "ZAKAT_002",
        message = "Wealth $wealth is below nisab threshold",
    )
    class MurabahaRateTooHigh(rate: BigDecimal) : OseError(
        code = "MURABAHA_001",
        message = "Profit rate $rate exceeds maximum allowed rate",
    )
}
```

## Result<T> Type

### Basic Usage

**MUST** use `Result<T>` for operations that can fail in domain logic.

```kotlin
// CORRECT: Return Result<T> for fallible operations
fun findZakatPayer(id: String): Result<ZakatPayer> =
    runCatching {
        repository.findById(id) ?: throw ZakatPayerNotFoundException(id)
    }

// CORRECT: Chain operations with flatMap
fun calculateObligation(payerId: String): Result<ZakatObligation> =
    findZakatPayer(payerId)
        .map { payer -> payer.computeZakatObligation(currentNisab()) }

// WRONG: Nullable return without Result context for domain logic
fun findZakatPayer(id: String): ZakatPayer? = ... // Loses error information
```

### runCatching

**SHOULD** use `runCatching` to wrap exception-throwing code into `Result<T>`.

```kotlin
// CORRECT: Wrap exception-throwing code
suspend fun fetchZakatRates(): Result<ZakatRates> = runCatching {
    httpClient.get("https://api.zakat.rates/current").body<ZakatRates>()
}

// CORRECT: getOrElse for default values
val rates = fetchZakatRates().getOrElse { ZakatRates.default() }

// CORRECT: getOrThrow when failure is not expected
val payer = findZakatPayer(verifiedId).getOrThrow()  // Throw if not found

// CORRECT: fold for transforming both success and failure
val response = processZakatPayment(payerId, amount).fold(
    onSuccess = { receipt -> ZakatReceiptResponse.from(receipt) },
    onFailure = { error -> ErrorResponse.from(error) },
)
```

### Custom Result Extension

**SHOULD** define `flatMap` extension for Result chaining (not in Kotlin stdlib).

```kotlin
// Extension to enable monadic chaining
fun <T, R> Result<T>.flatMap(transform: (T) -> Result<R>): Result<R> =
    fold(
        onSuccess = { transform(it) },
        onFailure = { Result.failure(it) },
    )

// Usage: Clean chain without nested try-catch
fun processZakatApplication(request: ZakatApplicationRequest): Result<ZakatApplication> =
    validateRequest(request)
        .flatMap { validRequest -> createApplication(validRequest) }
        .flatMap { application -> notifyPayer(application) }
        .map { notifiedApplication -> notifiedApplication }
```

## Sealed Class Error Hierarchies

### Domain Error Hierarchy

**MUST** define domain-specific error sealed classes for business operations.

```kotlin
// Sealed hierarchy for Zakat domain
sealed class ZakatDomainError {
    // Validation errors (4xx equivalent)
    sealed class ValidationError : ZakatDomainError() {
        data class WealthBelowNisab(
            val currentWealth: BigDecimal,
            val requiredNisab: BigDecimal,
        ) : ValidationError()

        data class InvalidPayerId(val payerId: String) : ValidationError()

        data class DuplicatePayment(
            val existingTransactionId: String,
            val period: String,
        ) : ValidationError()
    }

    // Infrastructure errors (5xx equivalent)
    sealed class InfrastructureError : ZakatDomainError() {
        data class RepositoryUnavailable(val cause: Throwable) : InfrastructureError()
        data class ExternalServiceError(val service: String, val cause: Throwable) : InfrastructureError()
    }

    // Business rule violations
    data class ShariaComplianceViolation(val rule: String, val details: String) : ZakatDomainError()
}

// Exhaustive handling in use case
fun handleZakatError(error: ZakatDomainError): HttpResponse = when (error) {
    is ZakatDomainError.ValidationError.WealthBelowNisab ->
        HttpResponse.badRequest("Wealth ${error.currentWealth} below nisab ${error.requiredNisab}")
    is ZakatDomainError.ValidationError.InvalidPayerId ->
        HttpResponse.notFound("Payer ${error.payerId} not found")
    is ZakatDomainError.ValidationError.DuplicatePayment ->
        HttpResponse.conflict("Duplicate payment: ${error.existingTransactionId}")
    is ZakatDomainError.InfrastructureError.RepositoryUnavailable ->
        HttpResponse.serviceUnavailable("Storage unavailable")
    is ZakatDomainError.InfrastructureError.ExternalServiceError ->
        HttpResponse.badGateway("External service ${error.service} failed")
    is ZakatDomainError.ShariaComplianceViolation ->
        HttpResponse.unprocessableEntity("Sharia rule violation: ${error.rule}")
}
```

## Custom Exception Classes

**MUST** create custom exceptions that extend `Exception` with stable error codes.

```kotlin
// Base exception for OSE Platform
abstract class OsePlatformException(
    val errorCode: String,
    message: String,
    cause: Throwable? = null,
) : Exception(message, cause)

// Domain-specific exceptions
class ZakatPayerNotFoundException(
    val payerId: String,
) : OsePlatformException(
    errorCode = "ZAKAT_001",
    message = "Zakat payer not found with ID: $payerId",
)

class MurabahaRateExceededException(
    val appliedRate: BigDecimal,
    val maximumRate: BigDecimal,
) : OsePlatformException(
    errorCode = "MURABAHA_001",
    message = "Applied rate $appliedRate exceeds maximum allowed rate $maximumRate",
)

// WRONG: Generic exception with no domain context
throw IllegalArgumentException("Invalid")  // Not enough context
throw RuntimeException("Error occurred")   // No error code, no domain info
```

## Coroutine Exception Handling

### CoroutineExceptionHandler

**MUST** install `CoroutineExceptionHandler` at top-level scope for uncaught exceptions.

```kotlin
// CORRECT: Exception handler at application scope
val zakatServiceScope = CoroutineScope(
    SupervisorJob() +
        Dispatchers.IO +
        CoroutineExceptionHandler { _, exception ->
            logger.error("Unhandled exception in ZakatService scope", exception)
            // Send to monitoring (Sentry, etc.)
        }
)

class ZakatBackgroundService {
    fun startPeriodicCalculation() {
        zakatServiceScope.launch {
            while (isActive) {
                runCatching { calculateAndNotifyPayers() }
                    .onFailure { logger.warn("Calculation cycle failed", it) }
                delay(24.hours)
            }
        }
    }
}
```

### supervisorScope for Independent Child Jobs

**MUST** use `supervisorScope` when child coroutine failures should not cancel siblings.

```kotlin
// CORRECT: supervisorScope - one failure doesn't cancel others
suspend fun calculateAllZakatObligations(payers: List<ZakatPayer>): List<Result<ZakatObligation>> =
    supervisorScope {
        payers.map { payer ->
            async {
                runCatching {
                    calculateObligationForPayer(payer)  // Failure isolated per payer
                }
            }
        }.awaitAll()
    }

// WRONG: coroutineScope - one failure cancels ALL calculations
suspend fun calculateAllBad(payers: List<ZakatPayer>): List<ZakatObligation> =
    coroutineScope {
        payers.map { payer ->
            async { calculateObligationForPayer(payer) }  // One failure stops all
        }.awaitAll()
    }
```

### try-catch in Coroutines

**MUST** catch exceptions at appropriate suspension points.

```kotlin
// CORRECT: Catch at the suspension point boundary
suspend fun processZakatWithRetry(payerId: String, maxRetries: Int = 3): Result<ZakatReceipt> {
    var lastError: Throwable? = null
    repeat(maxRetries) { attempt ->
        try {
            val receipt = zakatRepository.processPayment(payerId)
            return Result.success(receipt)
        } catch (e: RepositoryUnavailableException) {
            lastError = e
            delay(exponentialBackoff(attempt))
        }
    }
    return Result.failure(lastError ?: RuntimeException("Unknown error"))
}

// CORRECT: CancellationException must not be caught and suppressed
try {
    suspendableOperation()
} catch (e: CancellationException) {
    throw e  // Re-throw cancellation - never suppress it
} catch (e: Exception) {
    logger.error("Operation failed", e)
}
```

## Enforcement

- **Sealed class exhaustiveness** - Kotlin compiler enforces all branches in `when`
- **Detekt** - `TooGenericExceptionCaught`, `TooGenericExceptionThrown` rules flag bad practices
- **Code reviews** - Verify `CancellationException` is not suppressed, Result<T> used for domain logic

**Pre-commit checklist**:

- [ ] Domain operations return `Result<T>` not nullable
- [ ] Error sealed classes cover all business failure modes
- [ ] `CancellationException` never swallowed in coroutines
- [ ] Custom exceptions have stable `errorCode` fields
- [ ] `supervisorScope` used for independent parallel operations

## Related Standards

- [Coding Standards](./coding-standards.md) - Sealed class naming patterns
- [Concurrency Standards](./concurrency-standards.md) - Structured concurrency and coroutine scopes
- [API Standards](./api-standards.md) - HTTP error response mapping from domain errors

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Error Handling: Result<T>, sealed classes, CoroutineExceptionHandler
