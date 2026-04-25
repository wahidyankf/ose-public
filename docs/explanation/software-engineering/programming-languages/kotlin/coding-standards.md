---
title: "Kotlin Coding Standards"
description: Authoritative OSE Platform Kotlin coding standards (idioms, best practices, anti-patterns to avoid)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - coding-standards
  - idioms
  - best-practices
  - anti-patterns
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to apply Kotlin in THIS codebase, not WHAT Kotlin is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Kotlin development in the OSE Platform. These are prescriptive rules that MUST be followed across all Kotlin projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Kotlin developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform idioms, naming conventions, package organization, Effective Kotlin idioms, scope functions, null safety patterns, and anti-patterns to avoid

## Software Engineering Principles

These standards enforce the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Kotlin Implements**:

- `ktlint` for automated formatting and style enforcement
- `detekt` for automated static analysis and code smell detection
- `kover` for automated coverage measurement and enforcement
- Gradle tasks for automated build, test, and quality checks
- KSP (Kotlin Symbol Processing) for automated code generation

**PASS Example** (Automated Zakat Calculation Validation):

```kotlin
// build.gradle.kts - Automated quality checks
tasks.check {
    dependsOn(tasks.ktlintCheck, tasks.detekt, tasks.koverVerify)
}

kover {
    verify {
        rule {
            minBound(95) // Enforce 95% line coverage
        }
    }
}

// ZakatCalculatorTest.kt - Automated test verification
class ZakatCalculatorTest {

    private val calculator = ZakatCalculator()

    @Test
    fun `calculateZakat returns 2_5 percent when wealth above nisab`() {
        val wealth = BigDecimal("100000.00")
        val nisab = BigDecimal("5000.00")
        val expectedZakat = BigDecimal("2500.00")

        val actualZakat = calculator.calculate(wealth, nisab)

        assertEquals(expectedZakat, actualZakat)
    }

    @Test
    fun `calculateZakat returns zero when wealth below nisab`() {
        val wealth = BigDecimal("3000.00")
        val nisab = BigDecimal("5000.00")

        val actualZakat = calculator.calculate(wealth, nisab)

        assertEquals(BigDecimal.ZERO, actualZakat)
    }
}
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Kotlin Implements**:

- Explicit null safety with `?` and `!!` operators (intent is visible in code)
- Explicit type declarations for public API surface (avoid `val x = ...` for public members)
- Explicit coroutine scope management (no fire-and-forget without scope)
- Explicit `when` exhaustiveness with sealed classes (compiler enforces all branches)
- Explicit data class components (named parameters avoid positional confusion)

**PASS Example** (Explicit Murabaha Contract):

```kotlin
// Explicit data class with named parameters - no ambiguity
data class MurabahaContract(
    val contractId: String,
    val customerId: String,
    val costPrice: BigDecimal,
    val profitMargin: BigDecimal,
    val installmentCount: Int,
) {
    // Computed property - explicitly derived, not stored
    val totalPrice: BigDecimal get() = costPrice + profitMargin
    val installmentAmount: BigDecimal get() = totalPrice / installmentCount.toBigDecimal()
}

// Explicit function signature - return type always declared for public API
fun createMurabahaContract(
    customerId: String,
    costPrice: BigDecimal,
    profitMargin: BigDecimal,
    installmentCount: Int,
    config: MurabahaConfig,
): Result<MurabahaContract> {
    // Explicit validation with descriptive messages
    require(costPrice >= config.minimumCostPrice) {
        "Cost price $costPrice must be at least ${config.minimumCostPrice}"
    }
    require(installmentCount in 1..config.maximumInstallments) {
        "Installment count $installmentCount must be between 1 and ${config.maximumInstallments}"
    }

    return Result.success(
        MurabahaContract(
            contractId = java.util.UUID.randomUUID().toString(),
            customerId = customerId,
            costPrice = costPrice,
            profitMargin = profitMargin,
            installmentCount = installmentCount,
        )
    )
}
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes and enable safer concurrent code.

**How Kotlin Implements**:

- `val` over `var` (immutable references as default)
- `data class` with `copy()` for state transitions (no in-place mutation)
- `listOf`/`mapOf`/`setOf` for immutable collections (not `mutableListOf`)
- Immutable data classes for all domain value types
- `copy()` pattern for updating domain objects

**PASS Example** (Immutable Zakat Transaction):

```kotlin
// Immutable data class - val-only properties
data class ZakatTransaction(
    val transactionId: String,
    val payerId: String,
    val wealth: BigDecimal,
    val zakatAmount: BigDecimal,
    val paidAt: Instant,
    val auditHash: String,
) {
    companion object {
        fun create(
            payerId: String,
            wealth: BigDecimal,
            zakatAmount: BigDecimal,
        ): ZakatTransaction {
            val paidAt = Instant.now()
            val tx = ZakatTransaction(
                transactionId = java.util.UUID.randomUUID().toString(),
                payerId = payerId,
                wealth = wealth,
                zakatAmount = zakatAmount,
                paidAt = paidAt,
                auditHash = "", // Temporary
            )
            return tx.copy(auditHash = calculateHash(tx))
        }

        private fun calculateHash(tx: ZakatTransaction): String =
            "${tx.transactionId}:${tx.payerId}:${tx.zakatAmount}".hashCode().toString()
    }
}

// Correction creates NEW transaction via copy() - never mutates original
fun correctZakatTransaction(
    original: ZakatTransaction,
    correctedAmount: BigDecimal,
): ZakatTransaction = ZakatTransaction.create(
    payerId = original.payerId,
    wealth = original.wealth,
    zakatAmount = correctedAmount,
)
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free for predictable, testable code.

**How Kotlin Implements**:

- Top-level functions and extension functions for pure transformations
- Separate pure domain logic from I/O (Ktor handlers call pure domain services)
- `sealed class` with pure `when` matching for domain transitions
- No companion object mutable state in calculation classes

**PASS Example** (Pure Zakat Calculation):

```kotlin
// Pure top-level function - same inputs always return same output
fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal {
    if (wealth < nisab) return BigDecimal.ZERO
    val zakatRate = BigDecimal("0.025")
    return (wealth * zakatRate).setScale(2, RoundingMode.HALF_UP)
}

// Pure extension function for domain objects
fun ZakatPayer.computeZakatObligation(nisab: BigDecimal): ZakatObligation =
    when {
        totalWealth < nisab -> ZakatObligation.NotObligated(reason = "Wealth below nisab threshold")
        else -> ZakatObligation.Obligated(amount = calculateZakat(totalWealth, nisab))
    }

// Sealed class with exhaustive when - pure state machine
sealed class ZakatObligation {
    data class Obligated(val amount: BigDecimal) : ZakatObligation()
    data class NotObligated(val reason: String) : ZakatObligation()
}
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Kotlin Implements**:

- `libs.versions.toml` version catalog with exact dependency versions
- Gradle Wrapper with pinned Gradle version (`gradle-wrapper.properties`)
- SDKMAN `.sdkmanrc` for JDK version pinning
- Kotlin version in `build.gradle.kts` via version catalog
- Deterministic Gradle build cache

**PASS Example** (Reproducible Environment):

```toml
# gradle/libs.versions.toml - Exact dependency versions
[versions]
kotlin = "2.1.0"
ktor = "3.1.0"
kotlinx-coroutines = "1.10.1"
kotlinx-serialization = "1.8.0"
kover = "0.9.1"
detekt = "1.23.7"
ktlint = "12.2.0"

[libraries]
ktor-server-core = { module = "io.ktor:ktor-server-core", version.ref = "ktor" }
ktor-server-netty = { module = "io.ktor:ktor-server-netty", version.ref = "ktor" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
ktor = { id = "io.ktor.plugin", version.ref = "ktor" }
kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint" }
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Part 1: Naming Conventions

### Packages

**MUST** use lowercase with dots as separators, domain-prefixed hierarchy.

```kotlin
// CORRECT
package com.ose.zakat.calculation
package com.ose.murabaha.domain
package com.ose.shared.types

// WRONG
package com.ose.Zakat.Calculation   // No PascalCase in packages
package com.ose.zakat_calculation   // No underscores in packages
package ZakatCalculation             // No unqualified package names
```

### Classes and Interfaces

**MUST** use PascalCase for all class and interface names.

```kotlin
// CORRECT
class ZakatCalculator
interface ZakatRepository
data class MurabahaContract(...)
sealed class PaymentStatus
object ZakatConstants

// WRONG
class zakatCalculator      // camelCase class name
interface IZakatRepository // "I" prefix is Java-ism, not idiomatic Kotlin
class Zakatcalculator      // Missing capital for each word
```

### Functions and Properties

**MUST** use camelCase for all function and property names.

```kotlin
// CORRECT
fun calculateZakat(wealth: BigDecimal): BigDecimal
val zakatAmount: BigDecimal
var paymentStatus: PaymentStatus

// WRONG
fun CalculateZakat(...)   // PascalCase is for classes/types, not functions
fun calculate_zakat(...)  // Snake_case is not Kotlin idiomatic
val ZakatAmount: BigDecimal // PascalCase for property
```

### Constants

**MUST** use UPPER_SNAKE_CASE for compile-time constants in companion objects and top-level declarations.

```kotlin
// CORRECT: Constants in companion objects
class ZakatCalculator {
    companion object {
        const val ZAKAT_RATE = 0.025
        const val MINIMUM_NISAB_GRAMS_GOLD = 85.0
        const val MINIMUM_NISAB_GRAMS_SILVER = 595.0
    }
}

// CORRECT: Top-level constants
const val MURABAHA_MAX_PROFIT_RATE = 0.30
const val DEFAULT_INSTALLMENT_COUNT = 12

// WRONG
val zakatRate = 0.025             // Not const, not UPPER_SNAKE_CASE
const val zakatRate = 0.025       // const but not UPPER_SNAKE_CASE
```

### Test Functions

**MUST** use backtick-quoted descriptive names for test functions.

```kotlin
// CORRECT
@Test
fun `calculateZakat returns 2_5 percent when wealth exceeds nisab`() { ... }

@Test
fun `createMurabahaContract fails with invalid profit margin`() { ... }

// WRONG
@Test
fun testCalculateZakat() { ... }  // Not descriptive enough

@Test
fun test_calculate_zakat() { ... } // Snake_case mixed with Kotlin style
```

## Part 2: Effective Kotlin Idioms

### Data Classes

**MUST** use data classes for value objects and DTOs (request/response models).

```kotlin
// CORRECT: Data class for value object
data class ZakatPayer(
    val id: String,
    val name: String,
    val goldWealth: BigDecimal,
    val silverWealth: BigDecimal,
    val cashWealth: BigDecimal,
) {
    val totalWealth: BigDecimal get() = goldWealth + silverWealth + cashWealth
}

// WRONG: Regular class for value object (loses equals/hashCode/copy/toString)
class ZakatPayer(
    val id: String,
    val name: String,
)
```

**MUST** use `copy()` for state transitions, not mutation.

```kotlin
// CORRECT: Immutable state transition
val updatedPayer = payer.copy(cashWealth = payer.cashWealth + depositAmount)

// WRONG: Mutation (requires var, breaks immutability)
payer.cashWealth += depositAmount // Cannot do this with val
```

### When Expressions

**MUST** use `when` as an expression (not statement) for exhaustive matching.

```kotlin
// CORRECT: When as expression, exhaustive with sealed class
sealed class ZakatStatus {
    object Pending : ZakatStatus()
    data class Approved(val amount: BigDecimal) : ZakatStatus()
    data class Rejected(val reason: String) : ZakatStatus()
}

fun describeStatus(status: ZakatStatus): String = when (status) {
    is ZakatStatus.Pending -> "Awaiting calculation"
    is ZakatStatus.Approved -> "Zakat of ${status.amount} is due"
    is ZakatStatus.Rejected -> "Rejected: ${status.reason}"
    // Compiler enforces all branches - no else needed
}

// WRONG: Non-exhaustive when, or else-catch-all hiding missing branches
fun describeStatus(status: ZakatStatus): String = when (status) {
    is ZakatStatus.Pending -> "Pending"
    else -> "Unknown" // Hides when new ZakatStatus subtypes are added
}
```

### Extension Functions

**SHOULD** use extension functions for pure transformations on domain types.

```kotlin
// CORRECT: Extension function as pure transformation
fun BigDecimal.applyZakatRate(): BigDecimal =
    (this * BigDecimal("0.025")).setScale(2, RoundingMode.HALF_UP)

fun List<ZakatPayer>.totalObligatedZakat(nisab: BigDecimal): BigDecimal =
    filter { it.totalWealth >= nisab }
        .sumOf { it.totalWealth.applyZakatRate() }

// Usage reads naturally
val communityZakat = payers.totalObligatedZakat(currentNisab)
```

### Scope Functions

**MUST** use scope functions (`let`, `run`, `with`, `apply`, `also`) purposefully and consistently.

```kotlin
// CORRECT: let for null-safe transformation
val zakatAmount = payer?.totalWealth?.let { wealth ->
    if (wealth >= nisab) wealth.applyZakatRate() else null
}

// CORRECT: apply for builder-style object configuration
val config = MurabahaConfig().apply {
    minimumCostPrice = BigDecimal("1000.00")
    maximumInstallments = 60
    maximumProfitRate = BigDecimal("0.30")
}

// CORRECT: also for side effects (logging) while returning original object
val contract = createMurabahaContract(request)
    .also { logger.info("Created contract: ${it.contractId}") }

// CORRECT: with for operating on a non-null object without repetition
val summary = with(zakatReport) {
    "Report for ${payerId}: total=${totalWealth}, zakat=${zakatAmount}"
}

// WRONG: Nested scope functions (hard to read)
payer?.let { p ->
    p.totalWealth.let { wealth ->
        wealth.let { w -> w.applyZakatRate() }  // Over-nesting
    }
}
```

### Null Safety

**MUST** use safe call operator (`?.`) for nullable chains.

**MUST** use Elvis operator (`?:`) for null defaults.

**PROHIBITED**: Using non-null assertion `!!` without explicit justification in a comment.

```kotlin
// CORRECT: Safe navigation chain
val payerName: String? = repository.findById(id)?.name

// CORRECT: Elvis operator for defaults
val displayName = payerName ?: "Anonymous"

// CORRECT: Elvis with throw for mandatory values
val contract = repository.findContract(id)
    ?: throw ContractNotFoundException("Contract $id not found")

// WRONG: !! without justification (crashes if null)
val name = payer!!.name  // Crash if payer is null

// ACCEPTABLE: !! only when null is a programmer error (not user input)
// Safe: configuration is guaranteed non-null after startup validation
val config = applicationConfig!!  // Known non-null after init() called
```

### Companion Objects vs Top-Level Functions

**MUST** use top-level functions for pure utility functions that don't need class context.

**SHOULD** use companion objects for factory methods and class-specific constants.

```kotlin
// CORRECT: Top-level pure function
fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal {
    if (wealth < nisab) return BigDecimal.ZERO
    return (wealth * BigDecimal("0.025")).setScale(2, RoundingMode.HALF_UP)
}

// CORRECT: Companion object for factory and constants
data class MurabahaContract(
    val contractId: String,
    val costPrice: BigDecimal,
    val profitMargin: BigDecimal,
) {
    companion object {
        const val MAX_PROFIT_RATE = 0.30
        const val MIN_COST_PRICE = 1000.0

        fun create(costPrice: BigDecimal, profitMargin: BigDecimal): MurabahaContract =
            MurabahaContract(
                contractId = java.util.UUID.randomUUID().toString(),
                costPrice = costPrice,
                profitMargin = profitMargin,
            )
    }
}

// WRONG: Unnecessary companion object for top-level utilities
class ZakatUtils {
    companion object {
        fun calculateZakat(wealth: BigDecimal): BigDecimal { ... } // Should be top-level
    }
}
```

## Part 3: Anti-Patterns to Avoid

### Java-isms in Kotlin

**PROHIBITED**: Java patterns that have idiomatic Kotlin equivalents.

```kotlin
// WRONG: Java-style null checks
if (payer != null) {
    println(payer.name)
}

// CORRECT: Kotlin safe call
println(payer?.name)

// WRONG: Java-style static utility class
object ZakatUtils {
    @JvmStatic
    fun calculateZakat(...) { ... }
}

// CORRECT: Top-level function
fun calculateZakat(...) { ... }

// WRONG: Java-style getter/setter
class ZakatPayer {
    private var _name: String = ""
    fun getName(): String = _name
    fun setName(name: String) { _name = name }
}

// CORRECT: Kotlin property with backing field if needed
class ZakatPayer {
    var name: String = ""
        private set // Or use data class
}
```

### Mutable State Overuse

**PROHIBITED**: Using `var` when `val` suffices.

```kotlin
// WRONG: Unnecessary mutable state
var zakatAmount = BigDecimal.ZERO
if (wealth >= nisab) {
    zakatAmount = wealth * BigDecimal("0.025")
}

// CORRECT: Single expression with val
val zakatAmount = if (wealth >= nisab) {
    (wealth * BigDecimal("0.025")).setScale(2, RoundingMode.HALF_UP)
} else {
    BigDecimal.ZERO
}
```

### Excessive Object Creation in Calculations

**PROHIBITED**: Creating intermediate objects unnecessarily in tight loops.

```kotlin
// WRONG: String concatenation in loop
var report = ""
for (payer in payers) {
    report += "Payer: ${payer.name}, Zakat: ${payer.zakatAmount}\n" // Allocates new string each time
}

// CORRECT: StringBuilder or joinToString
val report = payers.joinToString("\n") { payer ->
    "Payer: ${payer.name}, Zakat: ${payer.zakatAmount}"
}
```

### Float/Double for Financial Calculations

**PROHIBITED**: Using `Float` or `Double` for monetary amounts.

```kotlin
// WRONG: Float precision loss in Zakat calculation
val zakatRate: Double = 0.025
val wealth: Double = 100_000.0
val zakatAmount = wealth * zakatRate  // 2499.9999999999998 due to floating-point!

// CORRECT: BigDecimal for monetary precision
val zakatRate = BigDecimal("0.025")
val wealth = BigDecimal("100000.00")
val zakatAmount = (wealth * zakatRate).setScale(2, RoundingMode.HALF_UP) // 2500.00
```

## Enforcement

These standards are enforced through:

- **ktlint** - Auto-formats code and enforces naming conventions
- **Detekt** - Detects code smells, complexity issues, and Java-isms
- **Kotlin compiler** - `allWarningsAsErrors = true` prevents ignoring warnings
- **Kover** - Enforces >=95% line coverage for domain logic
- **Code reviews** - Human verification of idiom compliance and domain patterns

**Pre-commit checklist**:

- [ ] Code formatted with ktlint (run `./gradlew ktlintFormat`)
- [ ] Passes Detekt analysis (run `./gradlew detekt`)
- [ ] All tests pass (run `./gradlew test`)
- [ ] Coverage >=95% for domain logic
- [ ] No `var` where `val` suffices
- [ ] No `!!` without justification comment
- [ ] No `Double`/`Float` for financial amounts
- [ ] Scope functions used appropriately

## Related Standards

- [Testing Standards](./testing-standards.md) - Test structure and coverage requirements
- [Code Quality Standards](./code-quality-standards.md) - ktlint and Detekt configuration
- [Type Safety Standards](./type-safety-standards.md) - Null safety and sealed classes
- [Error Handling Standards](./error-handling-standards.md) - Result<T> and sealed error hierarchies

## Related Documentation

- [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 (supports 1.9+)
