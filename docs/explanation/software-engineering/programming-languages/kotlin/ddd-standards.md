---
title: "Kotlin DDD Standards"
description: Authoritative OSE Platform Kotlin Domain-Driven Design standards (value objects, sealed states, aggregates, domain events)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - ddd
  - domain-driven-design
  - aggregates
  - value-objects
  - sealed-classes
  - domain-events
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to apply Domain-Driven Design in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative Domain-Driven Design standards** for Kotlin development in the OSE Platform. It covers Value Objects with data classes, sealed classes for domain states, Entity identity, Aggregate invariant enforcement, Repository interfaces, Domain Events, and functional domain modeling.

**Target Audience**: OSE Platform Kotlin developers, domain architects, technical reviewers

**Scope**: DDD tactical patterns in Kotlin - aggregates, value objects, domain events, repositories

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Invariant Enforcement):

```kotlin
// require() enforces invariants automatically - no manual validation
data class MurabahaContract private constructor(
    val contractId: ContractId,
    val customerId: CustomerId,
    val costPrice: Money,
    val profitMargin: Money,
    val installmentCount: Int,
    val status: ContractStatus,
) {
    companion object {
        fun create(
            customerId: CustomerId,
            costPrice: Money,
            profitMargin: Money,
            installmentCount: Int,
        ): MurabahaContract {
            // Invariants enforced automatically on construction
            require(costPrice.amount > BigDecimal.ZERO) { "Cost price must be positive" }
            require(profitMargin.amount >= BigDecimal.ZERO) { "Profit margin cannot be negative" }
            require(installmentCount in 1..360) { "Installments must be 1-360" }
            val profitRate = profitMargin.amount / costPrice.amount
            require(profitRate <= BigDecimal("0.30")) {
                "Profit rate $profitRate exceeds Sharia maximum of 30%"
            }

            return MurabahaContract(
                contractId = ContractId.generate(),
                customerId = customerId,
                costPrice = costPrice,
                profitMargin = profitMargin,
                installmentCount = installmentCount,
                status = ContractStatus.PENDING,
            )
        }
    }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Domain State Machine):

```kotlin
// Sealed class makes ALL states explicit - no strings, no "magic values"
sealed class ZakatObligationStatus {
    object NotCalculated : ZakatObligationStatus()
    data class BelowNisab(val currentWealth: Money, val nisab: Money) : ZakatObligationStatus()
    data class Obligated(val amount: Money, val dueDate: LocalDate) : ZakatObligationStatus()
    data class Paid(val paidAmount: Money, val paidAt: Instant, val receiptId: String) : ZakatObligationStatus()
    data class Overdue(val amount: Money, val dueSince: LocalDate) : ZakatObligationStatus()
}

// Every state transition is explicit and exhaustive
fun ZakatObligation.describeStatus(): String = when (status) {
    is ZakatObligationStatus.NotCalculated -> "Calculation pending"
    is ZakatObligationStatus.BelowNisab -> "Wealth below nisab threshold"
    is ZakatObligationStatus.Obligated -> "Zakat of ${status.amount} due by ${status.dueDate}"
    is ZakatObligationStatus.Paid -> "Paid on ${status.paidAt}"
    is ZakatObligationStatus.Overdue -> "OVERDUE since ${status.dueSince}"
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Value Objects):

```kotlin
// Value Object: identity from fields, not reference - data class perfect fit
@JvmInline
value class Money(val amount: BigDecimal) {
    init {
        require(amount.scale() <= 2) { "Money must have at most 2 decimal places" }
    }

    operator fun plus(other: Money): Money = Money(amount + other.amount)
    operator fun minus(other: Money): Money = Money(amount - other.amount)
    operator fun times(rate: BigDecimal): Money = Money((amount * rate).setScale(2, RoundingMode.HALF_UP))

    fun applyZakatRate(): Money = this * BigDecimal("0.025")
}

// Value Objects are always immutable val fields
data class ZakatPayer(
    val id: ZakatPayerId,
    val name: PersonName,
    val goldWealth: Money,
    val silverWealth: Money,
    val cashWealth: Money,
) {
    val totalWealth: Money get() = goldWealth + silverWealth + cashWealth
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Domain Logic):

```kotlin
// Pure extension functions for domain operations - no side effects
fun ZakatPayer.computeObligation(nisab: Money): ZakatObligation =
    if (totalWealth < nisab) {
        ZakatObligation.notObligated(payerId = id, reason = "Wealth below nisab")
    } else {
        ZakatObligation.obligated(
            payerId = id,
            amount = totalWealth.applyZakatRate(),
            dueDate = LocalDate.now().plusYears(1), // Hawl (one year)
        )
    }

// Pure state transition - new object returned, original unchanged
fun MurabahaContract.approve(approvedBy: UserId): Pair<MurabahaContract, ContractApproved> {
    check(status == ContractStatus.PENDING) { "Only PENDING contracts can be approved" }

    val approved = copy(status = ContractStatus.APPROVED)
    val event = ContractApproved(
        contractId = contractId,
        approvedBy = approvedBy,
        approvedAt = Instant.now(),
    )
    return approved to event  // Return new state + domain event
}
```

### 5. Reproducibility First

**PASS Example** (Deterministic Domain ID Generation):

```kotlin
// Stable ID type wrappers - always same format
@JvmInline
value class ZakatPayerId(val value: String) {
    companion object {
        fun generate(): ZakatPayerId = ZakatPayerId("PAYER-${UUID.randomUUID()}")
        fun of(value: String): ZakatPayerId {
            require(value.startsWith("PAYER-")) { "Invalid ZakatPayerId format: $value" }
            return ZakatPayerId(value)
        }
    }
}
```

## Value Objects

**MUST** use `data class` or inline `value class` for all Value Objects.

```kotlin
// Simple Value Object with data class
data class PersonName(
    val firstName: String,
    val lastName: String,
) {
    init {
        require(firstName.isNotBlank()) { "First name must not be blank" }
        require(lastName.isNotBlank()) { "Last name must not be blank" }
        require(firstName.length <= 50) { "First name too long" }
    }

    val fullName: String get() = "$firstName $lastName"
}

// Performance-optimized Value Object with inline value class
@JvmInline
value class ContractId(val value: String) {
    init {
        require(value.startsWith("CONTRACT-")) { "Invalid ContractId: $value" }
    }

    companion object {
        fun generate(): ContractId = ContractId("CONTRACT-${UUID.randomUUID()}")
    }
}

// Monetary Value Object
@JvmInline
value class Money(val amount: BigDecimal) {
    init {
        require(amount >= BigDecimal.ZERO) { "Money amount cannot be negative: $amount" }
    }

    operator fun compareTo(other: Money): Int = amount.compareTo(other.amount)
    operator fun plus(other: Money): Money = Money(amount + other.amount)
    operator fun minus(other: Money): Money {
        val result = amount - other.amount
        require(result >= BigDecimal.ZERO) { "Subtraction would result in negative money" }
        return Money(result)
    }
}
```

## Entities

**MUST** define Entities with explicit identity that persists through state changes.

```kotlin
// Entity: identity through ID, not field values
class ZakatApplication(
    val id: ZakatApplicationId,  // Identity field - never changes
    private var status: ApplicationStatus,
    private var applicantId: ZakatPayerId,
    private var requestedAmount: Money,
    private val events: MutableList<DomainEvent> = mutableListOf(),
) {
    // Expose only needed state via getters
    fun getStatus(): ApplicationStatus = status
    fun getApplicantId(): ZakatPayerId = applicantId
    fun pullEvents(): List<DomainEvent> = events.toList().also { events.clear() }

    // State transitions are explicit operations
    fun approve(reviewerId: UserId): ZakatApplication {
        check(status == ApplicationStatus.PENDING) { "Cannot approve non-PENDING application" }
        status = ApplicationStatus.APPROVED
        events.add(ZakatApplicationApproved(id, reviewerId, Instant.now()))
        return this
    }

    fun reject(reviewerId: UserId, reason: String): ZakatApplication {
        check(status == ApplicationStatus.PENDING) { "Cannot reject non-PENDING application" }
        status = ApplicationStatus.REJECTED
        events.add(ZakatApplicationRejected(id, reviewerId, reason, Instant.now()))
        return this
    }
}
```

## Aggregate Roots

**MUST** enforce all business invariants through the Aggregate Root.

```kotlin
// Aggregate Root: enforces all Murabaha Sharia compliance invariants
class MurabahaAgreement private constructor(
    val id: AgreementId,
    private var status: AgreementStatus,
    private val terms: MurabahaTerms,
    private val installments: MutableList<Installment>,
    private val events: MutableList<DomainEvent>,
) {
    companion object {
        fun initiate(
            buyerId: BuyerId,
            sellerId: SellerId,
            assetDescription: String,
            costPrice: Money,
            profitMargin: Money,
            installmentCount: Int,
        ): MurabahaAgreement {
            // All Sharia compliance rules enforced here
            require(costPrice.amount > BigDecimal.ZERO) { "Cost price must be positive" }
            val profitRate = profitMargin.amount / costPrice.amount
            require(profitRate <= BigDecimal("0.30")) {
                "Murabaha profit rate $profitRate exceeds Sharia maximum 30%"
            }
            require(installmentCount in 1..360) {
                "Installment count must be between 1 and 360 months"
            }

            val terms = MurabahaTerms(costPrice, profitMargin, installmentCount)
            val installments = terms.generateInstallmentSchedule()
            val agreement = MurabahaAgreement(
                id = AgreementId.generate(),
                status = AgreementStatus.INITIATED,
                terms = terms,
                installments = installments.toMutableList(),
                events = mutableListOf(),
            )
            agreement.events.add(
                MurabahaAgreementInitiated(agreement.id, buyerId, sellerId, terms)
            )
            return agreement
        }
    }

    // Only Aggregate Root can modify installment state
    fun recordPayment(installmentId: InstallmentId, amount: Money): MurabahaAgreement {
        check(status == AgreementStatus.ACTIVE) { "Cannot record payment on non-ACTIVE agreement" }
        val installment = installments.find { it.id == installmentId }
            ?: throw InstallmentNotFoundException(installmentId)
        installment.markAsPaid(amount)
        if (installments.all { it.isPaid }) {
            status = AgreementStatus.COMPLETED
            events.add(MurabahaAgreementCompleted(id, Instant.now()))
        }
        return this
    }

    fun pullEvents(): List<DomainEvent> = events.toList().also { events.clear() }
}
```

## Repository Interfaces

**MUST** define Repository interfaces in the domain layer (no infrastructure dependencies).

```kotlin
// Domain layer - Repository interface
interface ZakatApplicationRepository {
    suspend fun save(application: ZakatApplication): ZakatApplication
    suspend fun findById(id: ZakatApplicationId): ZakatApplication?
    suspend fun findByApplicantId(applicantId: ZakatPayerId): List<ZakatApplication>
    suspend fun findAllPending(): List<ZakatApplication>
}

interface MurabahaAgreementRepository {
    suspend fun save(agreement: MurabahaAgreement): MurabahaAgreement
    suspend fun findById(id: AgreementId): MurabahaAgreement?
    suspend fun findByBuyerId(buyerId: BuyerId): List<MurabahaAgreement>
}

// Infrastructure layer - Implementation (separate module)
class PostgresZakatApplicationRepository(
    private val db: Database,
) : ZakatApplicationRepository {
    override suspend fun save(application: ZakatApplication): ZakatApplication =
        withContext(Dispatchers.IO) {
            // JPA or Exposed mapping here
            application
        }

    override suspend fun findById(id: ZakatApplicationId): ZakatApplication? =
        withContext(Dispatchers.IO) {
            db.findById(id.value)?.toDomain()
        }
}
```

## Domain Events

**MUST** publish Domain Events for cross-aggregate communication.

```kotlin
// Domain Event base - immutable value type
sealed class DomainEvent {
    abstract val occurredAt: Instant
}

// Zakat domain events
data class ZakatPaymentReceived(
    val transactionId: String,
    val payerId: ZakatPayerId,
    val amount: Money,
    override val occurredAt: Instant = Instant.now(),
) : DomainEvent()

data class ZakatApplicationApproved(
    val applicationId: ZakatApplicationId,
    val reviewerId: UserId,
    override val occurredAt: Instant = Instant.now(),
) : DomainEvent()

data class MurabahaAgreementInitiated(
    val agreementId: AgreementId,
    val buyerId: BuyerId,
    val sellerId: SellerId,
    val terms: MurabahaTerms,
    override val occurredAt: Instant = Instant.now(),
) : DomainEvent()

// Event publisher interface (domain layer)
interface DomainEventPublisher {
    suspend fun publish(event: DomainEvent)
    suspend fun publishAll(events: List<DomainEvent>)
}

// Use case coordinates aggregate + event publishing
class ApproveZakatApplicationUseCase(
    private val repository: ZakatApplicationRepository,
    private val eventPublisher: DomainEventPublisher,
) {
    suspend fun execute(applicationId: ZakatApplicationId, reviewerId: UserId): Result<ZakatApplication> =
        runCatching {
            val application = repository.findById(applicationId)
                ?: throw ZakatApplicationNotFoundException(applicationId)

            val approved = application.approve(reviewerId)
            val savedApplication = repository.save(approved)
            eventPublisher.publishAll(savedApplication.pullEvents())
            savedApplication
        }
}
```

## Enforcement

- **Sealed class exhaustiveness** - Compiler enforces all domain states handled
- **Kotlin `require`/`check`** - Runtime invariant enforcement with clear messages
- **`value class` init blocks** - Value object constraints enforced at construction
- **Code reviews** - Verify invariants in Aggregate Root, no repository in domain layer

**Pre-commit checklist**:

- [ ] Value Objects use `data class` or `@JvmInline value class`
- [ ] All business invariants in Aggregate Root constructor or factory
- [ ] Domain events published for cross-aggregate side effects
- [ ] Repository interfaces in domain layer (no JPA/Exposed imports)
- [ ] Sealed classes used for domain state machines
- [ ] `require()` / `check()` used for preconditions and invariants

## Related Standards

- [Coding Standards](./coding-standards.md) - Sealed class and data class patterns
- [Type Safety Standards](./type-safety-standards.md) - Inline value classes, sealed classes
- [Error Handling Standards](./error-handling-standards.md) - Domain error hierarchies
- [Concurrency Standards](./concurrency-standards.md) - Async repository patterns

## Related Documentation

- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | DDD: Tactical patterns with Kotlin data classes and sealed hierarchies
