---
title: Domain-Driven Design (DDD)
description: OSE Platform Authoritative DDD Standards for Islamic Finance Business Systems
category: explanation
subcategory: architecture
tags:
  - ddd
  - domain-driven-design
  - bounded-contexts
  - aggregates
  - standards
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
created: 2026-01-25
updated: 2026-02-09
---

# Domain-Driven Design (DDD)

**This is THE authoritative reference** for Domain-Driven Design standards in OSE Platform.

All DDD implementations in OSE Platform MUST comply with the standards documented here. These standards are mandatory, not optional. Non-compliance blocks code review and merge approval.

## DDD Pattern Requirements

OSE Platform Islamic finance systems MUST use the following DDD patterns:

**Strategic Patterns:**

- **Bounded Contexts** - MUST align with Nx app boundaries
- **Context Mapping** - MUST document relationships between contexts
- **Ubiquitous Language** - MUST use domain expert terminology

**Tactical Patterns:**

- **Aggregates** - MUST enforce business invariants (Zakat rules, contract validity)
- **Value Objects** - MUST use for domain primitives (Money, FiscalDate, InterestRate)
- **Domain Events** - MUST capture business occurrences (ZakatCalculated, DonationReceived)
- **Repositories** - MUST abstract persistence for aggregates

**Integration Requirements:**

- MUST align bounded contexts with C4 containers
- MUST use FSM for entity lifecycles when applicable
- MUST use immutable value objects (Java records, TypeScript readonly)

## Prerequisite Knowledge

**REQUIRED**: This documentation assumes you have completed the AyoKoding Domain-Driven Design learning path. These are **OSE Platform-specific DDD standards**, not educational tutorials.

**You MUST understand DDD fundamentals before using these standards:**

- **[Domain-Driven Design Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/)** - Educational foundation for DDD concepts
- **[Domain-Driven Design Overview](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/overview.md)** - Core DDD principles (Ubiquitous Language, Bounded Contexts, Strategic/Tactical patterns)
- **[Domain-Driven Design By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/)** - Practical DDD implementation examples

**What this documentation covers**: OSE Platform-specific DDD patterns, Islamic finance domain modeling, aggregate boundaries, bounded context mapping in OSE Platform, integration with C4 and FSM, repository-specific tactical patterns.

**What this documentation does NOT cover**: DDD fundamentals, basic aggregate/entity/value object concepts, generic strategic design (those are in ayokoding-web).

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Software Engineering Principles

DDD in OSE Platform enforces foundational software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - MUST make domain concepts explicit through Ubiquitous Language, bounded context boundaries must be explicit in code structure, business rules must be explicit in domain logic not hidden in infrastructure

2. **[Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)** - MUST use immutable value objects (Java records, TypeScript readonly), domain events must be immutable, aggregate state changes must create new instances in functional approaches

3. **[Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)** - MUST implement domain logic as pure functions, validation rules must be pure and deterministic, business calculations must have no side effects

## OSE Platform DDD Standards (Authoritative)

**MUST follow these mandatory standards for all DDD implementations in OSE Platform:**

1. **[Bounded Context Standards](./ex-soen-ar-dodrdedd__bounded-context-standards.md)** - Nx app alignment, context mapping, ubiquitous language
2. **[Aggregate Standards](./ex-soen-ar-dodrdedd__aggregate-standards.md)** - Consistency boundaries, transaction rules, Islamic finance invariants
3. **[Value Object Standards](./ex-soen-ar-dodrdedd__value-object-standards.md)** - Immutable primitives (Money, FiscalDate, Rate), validation rules
4. **[Domain Event Standards](./ex-soen-ar-dodrdedd__domain-event-standards.md)** - Event naming, immutability, publishing patterns
5. **[Entity Standards](./ex-soen-ar-dodrdedd__entity-standards.md)** - Identity management, lifecycle tracking

## Bounded Context Organization

### Bounded Context to Nx App Mapping

**SHOULD**: Use bounded contexts as the **primary guide** for Nx app boundaries.

**Common Patterns**:

1. **One Bounded Context → One Nx App** (Default starting point)
2. **One Bounded Context → Multiple Nx Apps** (For scalability/team autonomy)
3. **Multiple Small Bounded Contexts → One Nx App** (Early product, tight relation)

**Critical Rule - PROHIBITED**: One Nx app spanning multiple bounded contexts **in its core domain model**. Each app's domain layer must maintain single ubiquitous language.

```
apps/
├── zakat-context/          # Zakat calculation bounded context
│   ├── domain/             # Domain layer (aggregates, value objects)
│   ├── application/        # Application services
│   └── infrastructure/     # Persistence, messaging
├── donation-context/       # Donation management bounded context
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── beneficiary-context/    # Beneficiary registry bounded context
    ├── domain/
    ├── application/
    └── infrastructure/
```

**See**: [Bounded Context Standards](./ex-soen-ar-dodrdedd__bounded-context-standards.md) for detailed mapping strategies

## Aggregate Design for Islamic Finance

### REQUIRED: Aggregates Enforce Business Invariants

**REQUIRED**: Aggregates MUST enforce Islamic finance business rules.

**Examples**:

**Zakat Assessment Aggregate**:

- MUST enforce minimum Nisab threshold (87.48g gold equivalent)
- MUST calculate 2.5% of qualifying wealth
- MUST verify Haul (lunar year holding period)

**Contract Aggregate (Murabaha)**:

- MUST enforce profit disclosure
- MUST validate asset ownership transfer
- MUST ensure Shariah compliance verification

**Donation Campaign Aggregate**:

- MUST enforce funding goal
- MUST validate Shariah-compliant causes
- MUST track distribution to eligible beneficiaries

**See**: [Aggregate Standards](./ex-soen-ar-dodrdedd__aggregate-standards.md)

## Value Object Requirements

### REQUIRED: Use Immutable Value Objects

**REQUIRED**: All domain primitives MUST be value objects.

**OSE Platform Value Objects**:

- `Money` - Amount + Currency (e.g., "100.00 USD", "500.00 SAR")
- `FiscalDate` - Islamic calendar date for Zakat calculations
- `NisabThreshold` - Minimum wealth threshold for Zakat obligation
- `Rate` - Interest rate or profit margin (Murabaha)
- `ZakatPercentage` - Fixed 2.5% for most Zakat calculations

**Implementation**:

- **Java**: Use `record` (Java 17+)
- **TypeScript**: Use `readonly` properties
- **Go**: Use immutable structs

**See**: [Value Object Standards](./ex-soen-ar-dodrdedd__value-object-standards.md)

## Domain Event Requirements

### REQUIRED: Capture Business Occurrences

**REQUIRED**: All significant business occurrences MUST emit domain events.

**OSE Platform Domain Events**:

- `ZakatCalculated` - Zakat obligation calculated
- `DonationReceived` - Donation accepted
- `CampaignFunded` - Campaign reaches funding goal
- `BeneficiaryVerified` - Beneficiary eligibility confirmed
- `ContractApproved` - Shariah board approves contract

**Event Naming Convention**:

- Format: `[Entity][PastTenseVerb]` (e.g., `AssessmentCreated`, `PaymentProcessed`)
- MUST be past tense (represents something that happened)
- MUST be immutable (never modified after creation)

**See**: [Domain Event Standards](./ex-soen-ar-dodrdedd__domain-event-standards.md)

## Integration with OSE Platform Architecture

### C4 Container Alignment

**REQUIRED**: Bounded contexts MUST align with C4 containers.

- One bounded context = One C4 container
- Context boundaries = Container boundaries
- Context mapping patterns visualized in C4 diagrams

**See**: [C4 Bounded Context Visualization](../c4-architecture-model/ex-soen-ar-c4armo__bounded-context-visualization.md)

### FSM Integration

**OPTIONAL**: Entity lifecycles MAY use FSM when state transitions have business meaning.

**Examples**:

- Zakat Assessment: `DRAFT` → `CALCULATED` → `PAID`
- Campaign: `PLANNING` → `ACTIVE` → `FUNDED` → `COMPLETED`
- Contract: `NEGOTIATION` → `APPROVED` → `ACTIVE` → `SETTLED`

**See**: [FSM Standards](../finite-state-machine-fsm/README.md)

## Documentation Structure

### Quick Reference

**Mandatory Standards (All DDD practitioners MUST follow)**:

1. [Bounded Context Standards](./ex-soen-ar-dodrdedd__bounded-context-standards.md) - Nx app alignment, context mapping
2. [Aggregate Standards](./ex-soen-ar-dodrdedd__aggregate-standards.md) - Consistency boundaries, invariants
3. [Value Object Standards](./ex-soen-ar-dodrdedd__value-object-standards.md) - Immutable primitives

**Context-Specific Standards (Apply when relevant)**:

- **Event-Driven Systems**: [Domain Event Standards](./ex-soen-ar-dodrdedd__domain-event-standards.md) - Event publishing patterns
- **Entity Management**: [Entity Standards](./ex-soen-ar-dodrdedd__entity-standards.md) - Identity and lifecycle

## Validation and Compliance

DDD implementations MUST pass the following validation checks:

1. **Bounded Context Check**: Each Nx app represents exactly one bounded context
2. **Aggregate Check**: All business invariants enforced in aggregate roots
3. **Value Object Check**: All domain primitives are immutable value objects
4. **Domain Event Check**: All significant business occurrences emit events
5. **Ubiquitous Language Check**: Code matches domain expert terminology

**Validation Tools**:

- Code review by domain experts
- Aggregate boundary analysis
- Event storming session validation

## Example: Zakat Calculation Bounded Context

### Aggregate: ZakatAssessment

```java
// Java implementation (Spring Boot)
public record ZakatAssessment(
    AssessmentId id,
    UserId userId,
    FiscalDate calculationDate,
    Money totalWealth,
    Money nisabThreshold,
    ZakatAmount zakatDue,
    AssessmentStatus status
) {
    // Business invariant: Zakat is 2.5% of wealth exceeding Nisab
    public ZakatAssessment calculate() {
        if (totalWealth.isLessThan(nisabThreshold)) {
            return new ZakatAssessment(id, userId, calculationDate,
                totalWealth, nisabThreshold, Money.zero(),
                AssessmentStatus.BELOW_NISAB);
        }

        Money zakatAmount = totalWealth.multiply(0.025);
        return new ZakatAssessment(id, userId, calculationDate,
            totalWealth, nisabThreshold, zakatAmount,
            AssessmentStatus.CALCULATED);
    }
}
```

### Value Objects

```java
// Money value object
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }

    public Money multiply(double factor) {
        return new Money(amount.multiply(BigDecimal.valueOf(factor)), currency);
    }

    public boolean isLessThan(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) < 0;
    }

    public static Money zero() {
        return new Money(BigDecimal.ZERO, Currency.getInstance("USD"));
    }
}
```

### Domain Event

```java
// ZakatCalculated event
public record ZakatCalculated(
    AssessmentId assessmentId,
    UserId userId,
    Money zakatAmount,
    Instant occurredAt
) implements DomainEvent {
    // Immutable event - no setters
}
```

## Related Documentation

- **[C4 Architecture Model](../c4-architecture-model/README.md)** - Visualizing bounded contexts
- **[FSM Standards](../finite-state-machine-fsm/README.md)** - Entity lifecycle state machines
- **[Java DDD Standards](../../programming-languages/java/ex-soen-prla-ja__ddd-standards.md)** - Java-specific tactical patterns

## Principles Implemented/Respected

This documentation implements/respects the following core principles:

- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: By requiring Ubiquitous Language in code and explicit bounded context boundaries, domain concepts become visible rather than hidden in technical abstractions.

- **[Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)**: By mandating immutable value objects and domain events, entire categories of bugs related to shared mutable state are eliminated.

- **[Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)**: By requiring domain logic to be pure functions without side effects, business rules become testable, composable, and maintainable.

---

**Last Updated**: 2026-02-09
