---
title: Java DDD Standards for OSE Platform
description: Prescriptive Domain-Driven Design requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - ddd
  - domain-driven-design
  - aggregates
  - domain-events
  - standards
principles:
  - explicit-over-implicit
  - immutability
created: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java DDD Standards for OSE Platform

**OSE-specific prescriptive standards** for Domain-Driven Design in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of DDD fundamentals from [AyoKoding Java DDD](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

Domain-Driven Design in OSE Platform ensures:

- **Modeling Complex Business Rules**: Zakat calculations, Qard Hasan contracts, donation allocations
- **Data Consistency**: Aggregates maintain financial invariants
- **Clear Audit Trails**: Domain events capture all state changes
- **Ubiquitous Language**: Shared vocabulary between developers and domain experts
- **Bounded Contexts**: Clear boundaries between financial domains

### Domain Boundaries

**REQUIRED**: OSE Platform MUST organize code into bounded contexts aligned with business domains.

```
ose-platform/
├── donation-context/           # Donation management
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── zakat-context/              # Zakat calculations and payments
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── account-context/            # Account management
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── compliance-context/         # Shariah compliance validation
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── shared-kernel/              # Shared domain concepts (Money, AccountId)
    └── domain/
```

**REQUIRED**: Bounded contexts MUST:

- Align with business capabilities (donation, zakat, accounts, compliance)
- Have independent domain models (no shared mutable state)
- Communicate via domain events (not direct method calls)
- Define explicit context maps (upstream/downstream relationships)

**PROHIBITED**: Cross-context direct database access (violates encapsulation).

### Aggregate Root Requirements

**REQUIRED**: All aggregates MUST have a single root entity that enforces invariants.

```java
// REQUIRED: Aggregate root for Donation context
@Entity
public class Donation {

 @EmbeddedId
 private DonationId id;  // REQUIRED: Strong-typed ID

 private DonorId donorId;
 private Money amount;
 private DonationStatus status;

 @ElementCollection
 @CollectionTable(name = "donation_allocations")
 private List<DonationAllocation> allocations = new ArrayList<>();

 private Instant createdAt;
 private Instant processedAt;

 // REQUIRED: Private constructor (force factory method)
 private Donation() {}

 // REQUIRED: Factory method for creation
 public static Donation create(DonorId donorId, Money amount) {
  // REQUIRED: Validate invariants
  if (amount.isNegativeOrZero()) {
   throw new IllegalArgumentException("Donation amount must be positive");
  }

  Donation donation = new Donation();
  donation.id = DonationId.generate();
  donation.donorId = donorId;
  donation.amount = amount;
  donation.status = DonationStatus.PENDING;
  donation.createdAt = Instant.now();

  // REQUIRED: Raise domain event
  donation.registerEvent(new DonationCreatedEvent(
   donation.id,
   donation.donorId,
   donation.amount,
   donation.createdAt
  ));

  return donation;
 }

 // REQUIRED: Business logic in aggregate (not service)
 public void allocate(List<DonationAllocation> allocations) {
  // REQUIRED: Validate invariant (total allocation = donation amount)
  Money totalAllocated = allocations.stream()
   .map(DonationAllocation::amount)
   .reduce(Money.ZERO, Money::add);

  if (!totalAllocated.equals(this.amount)) {
   throw new InvariantViolationException(
    "Total allocation must equal donation amount"
   );
  }

  this.allocations = new ArrayList<>(allocations);
  this.status = DonationStatus.ALLOCATED;

  // REQUIRED: Raise domain event
  this.registerEvent(new DonationAllocatedEvent(
   this.id,
   this.allocations,
   Instant.now()
  ));
 }

 // REQUIRED: Expose read-only collections
 public List<DonationAllocation> allocations() {
  return Collections.unmodifiableList(allocations);
 }
}
```

**REQUIRED**: Aggregates MUST:

- Use strong-typed IDs (DonationId, not String)
- Enforce invariants in factory methods and business methods
- Raise domain events for state changes
- Expose immutable views of internal collections
- Keep aggregate size small (< 5 entities per aggregate)

**PROHIBITED**: Mutable getters exposing internal state.

### Value Object Requirements

**REQUIRED**: All domain primitives MUST be implemented as value objects.

```java
// REQUIRED: Value object for Money (immutable, equals by value)
public record Money(BigDecimal value, String currencyCode) {

 // REQUIRED: Canonical constructor with validation
 public Money {
  Objects.requireNonNull(value, "Value cannot be null");
  Objects.requireNonNull(currencyCode, "Currency code cannot be null");

  if (value.scale() > 2) {
   throw new IllegalArgumentException("Money precision limited to 2 decimals");
  }

  if (!VALID_CURRENCIES.contains(currencyCode)) {
   throw new IllegalArgumentException("Invalid currency: " + currencyCode);
  }
 }

 // REQUIRED: Zero constant
 public static final Money ZERO = new Money(BigDecimal.ZERO, "USD");

 // REQUIRED: Factory methods
 public static Money of(String value, String currencyCode) {
  return new Money(new BigDecimal(value), currencyCode);
 }

 // REQUIRED: Domain operations return new instances
 public Money add(Money other) {
  if (!this.currencyCode.equals(other.currencyCode)) {
   throw new CurrencyMismatchException(
    "Cannot add " + currencyCode + " and " + other.currencyCode
   );
  }
  return new Money(this.value.add(other.value), this.currencyCode);
 }

 public Money subtract(Money other) {
  if (!this.currencyCode.equals(other.currencyCode)) {
   throw new CurrencyMismatchException(
    "Cannot subtract " + currencyCode + " and " + other.currencyCode
   );
  }
  return new Money(this.value.subtract(other.value), this.currencyCode);
 }

 public Money multiply(BigDecimal multiplier) {
  return new Money(
   this.value.multiply(multiplier).setScale(2, RoundingMode.HALF_UP),
   this.currencyCode
  );
 }

 public boolean isNegativeOrZero() {
  return value.compareTo(BigDecimal.ZERO) <= 0;
 }

 public boolean greaterThan(Money other) {
  if (!this.currencyCode.equals(other.currencyCode)) {
   throw new CurrencyMismatchException("Cannot compare different currencies");
  }
  return this.value.compareTo(other.value) > 0;
 }
}
```

**REQUIRED**: Value objects MUST:

- Use `record` types for immutability
- Validate invariants in canonical constructor
- Provide factory methods for common creation patterns
- Return new instances from operations (not mutate)
- Implement domain operations (add, subtract, multiply)

**REQUIRED**: Common value objects in OSE Platform:

- **Money**: Amount + currency code
- **AccountId**: Strong-typed account identifier
- **DonorId**: Strong-typed donor identifier
- **ZakatRate**: Immutable rate (2.5%)
- **EmailAddress**: Validated email format

### Event Definition

**REQUIRED**: All state changes MUST publish domain events.

```java
// REQUIRED: Domain event (immutable)
public record DonationCreatedEvent(
 DonationId donationId,
 DonorId donorId,
 Money amount,
 Instant occurredAt
) implements DomainEvent {

 // REQUIRED: Canonical constructor with validation
 public DonationCreatedEvent {
  Objects.requireNonNull(donationId);
  Objects.requireNonNull(donorId);
  Objects.requireNonNull(amount);
  Objects.requireNonNull(occurredAt);
 }
}

// REQUIRED: Base interface for all domain events
public interface DomainEvent {
 Instant occurredAt();
}
```

**REQUIRED**: Domain events MUST:

- Use `record` types for immutability
- Include aggregate ID, event data, and timestamp
- Be named in past tense (DonationCreated, ZakatCalculated)
- Be versioned for schema evolution
- Be publishable to event store

### Event Sourcing

**RECOMMENDED**: Critical aggregates SHOULD use event sourcing.

```java
// RECOMMENDED: Event-sourced aggregate
@Aggregate
public class ZakatAccount {

 @AggregateIdentifier
 private AccountId accountId;

 private Money balance;
 private ZakatStatus zakatStatus;

 // REQUIRED: Command handler
 @CommandHandler
 public ZakatAccount(CreateZakatAccountCommand cmd) {
  // REQUIRED: Apply event (not mutate directly)
  AggregateLifecycle.apply(new ZakatAccountCreatedEvent(
   cmd.accountId(),
   cmd.initialBalance(),
   Instant.now()
  ));
 }

 // REQUIRED: Event handler (rebuild state from events)
 @EventSourcingHandler
 public void on(ZakatAccountCreatedEvent event) {
  this.accountId = event.accountId();
  this.balance = event.initialBalance();
  this.zakatStatus = ZakatStatus.PENDING_CALCULATION;
 }

 // REQUIRED: Command handler for business operations
 @CommandHandler
 public void handle(CalculateZakatCommand cmd) {
  // REQUIRED: Validate preconditions
  if (this.balance.isNegativeOrZero()) {
   throw new IllegalStateException("Cannot calculate Zakat for zero balance");
  }

  Money zakatAmount = this.balance.multiply(new BigDecimal("0.025"));

  // REQUIRED: Apply event
  AggregateLifecycle.apply(new ZakatCalculatedEvent(
   this.accountId,
   this.balance,
   zakatAmount,
   Instant.now()
  ));
 }

 @EventSourcingHandler
 public void on(ZakatCalculatedEvent event) {
  this.zakatStatus = ZakatStatus.CALCULATED;
 }
}
```

**REQUIRED**: Event-sourced aggregates MUST:

- Use Axon Framework `@Aggregate` annotation
- Reconstruct state from events (not load from database)
- Apply events instead of mutating state directly
- Version events for backward compatibility

### Repository Interface

**REQUIRED**: Repositories MUST define domain-focused interfaces.

```java
// REQUIRED: Domain repository interface
public interface DonationRepository {

 // REQUIRED: Save aggregate root
 void save(Donation donation);

 // REQUIRED: Find by aggregate ID
 Optional<Donation> findById(DonationId id);

 // REQUIRED: Domain-specific queries
 List<Donation> findPendingDonationsByDonor(DonorId donorId);

 List<Donation> findDonationsByStatus(DonationStatus status);

 // REQUIRED: Deletion (if needed)
 void delete(DonationId id);
}
```

**REQUIRED**: Repository implementations MUST:

- Be located in infrastructure layer (not domain)
- Use JPA/Hibernate for persistence
- Map domain models to database entities
- Handle optimistic locking for concurrency

```java
// REQUIRED: Infrastructure implementation
@Repository
public class JpaDonationRepository implements DonationRepository {

 private final DonationJpaRepository jpaRepository;
 private final ApplicationEventPublisher eventPublisher;

 @Override
 public void save(Donation donation) {
  // REQUIRED: Publish domain events before saving
  donation.domainEvents().forEach(eventPublisher::publishEvent);

  // REQUIRED: Clear domain events after publishing
  donation.clearDomainEvents();

  // REQUIRED: Persist to database
  jpaRepository.save(donation);
 }

 @Override
 public Optional<Donation> findById(DonationId id) {
  return jpaRepository.findById(id);
 }

 @Override
 public List<Donation> findPendingDonationsByDonor(DonorId donorId) {
  return jpaRepository.findByDonorIdAndStatus(donorId, DonationStatus.PENDING);
 }
}
```

**REQUIRED**: Repository persistence MUST:

- Publish domain events before saving
- Clear domain events after publishing
- Use optimistic locking (`@Version` annotation)
- Handle database-specific concerns in infrastructure layer

### Command-Query Separation

**REQUIRED**: Financial operations MUST separate commands (writes) from queries (reads).

```java
// REQUIRED: Command (write operation)
public record ProcessDonationCommand(
 DonationId donationId,
 List<DonationAllocation> allocations
) {}

// REQUIRED: Command handler
@Service
public class ProcessDonationCommandHandler {

 private final DonationRepository donationRepository;

 public void handle(ProcessDonationCommand cmd) {
  Donation donation = donationRepository.findById(cmd.donationId())
   .orElseThrow(() -> new DonationNotFoundException(cmd.donationId()));

  // REQUIRED: Execute business logic on aggregate
  donation.allocate(cmd.allocations());

  // REQUIRED: Save aggregate (publishes events)
  donationRepository.save(donation);
 }
}

// REQUIRED: Query (read operation)
public record DonationSummaryQuery(
 DonorId donorId,
 Instant startDate,
 Instant endDate
) {}

// REQUIRED: Query handler
@Service
public class DonationSummaryQueryHandler {

 private final DonationReadRepository readRepository;  // Separate read model

 public DonationSummary handle(DonationSummaryQuery query) {
  // REQUIRED: Query optimized read model (not aggregate)
  return readRepository.findDonationSummary(
   query.donorId(),
   query.startDate(),
   query.endDate()
  );
 }
}
```

**REQUIRED**: CQRS MUST:

- Use commands for writes (ProcessDonationCommand)
- Use queries for reads (DonationSummaryQuery)
- Maintain separate read models (optimized for queries)
- Update read models via domain event handlers

**RECOMMENDED**: Use Axon Framework for CQRS implementation.

### Aggregate Testing

**REQUIRED**: Aggregates MUST have unit tests verifying business logic.

```java
// REQUIRED: Test aggregate business logic
class DonationTest {

 @Test
 void shouldCreateDonationWithValidAmount() {
  // Given
  DonorId donorId = DonorId.of("donor-123");
  Money amount = Money.of("100.00", "USD");

  // When
  Donation donation = Donation.create(donorId, amount);

  // Then
  assertThat(donation.amount()).isEqualTo(amount);
  assertThat(donation.status()).isEqualTo(DonationStatus.PENDING);

  // REQUIRED: Verify domain event raised
  assertThat(donation.domainEvents()).hasSize(1);
  assertThat(donation.domainEvents().get(0))
   .isInstanceOf(DonationCreatedEvent.class);
 }

 @Test
 void shouldRejectNegativeDonationAmount() {
  // Given
  DonorId donorId = DonorId.of("donor-123");
  Money negativeAmount = Money.of("-50.00", "USD");

  // When / Then
  assertThatThrownBy(() -> Donation.create(donorId, negativeAmount))
   .isInstanceOf(IllegalArgumentException.class)
   .hasMessageContaining("positive");
 }

 @Test
 void shouldEnforceAllocationInvariant() {
  // Given
  Donation donation = Donation.create(
   DonorId.of("donor-123"),
   Money.of("100.00", "USD")
  );

  List<DonationAllocation> allocations = List.of(
   new DonationAllocation(ProjectId.of("proj-1"), Money.of("60.00", "USD")),
   new DonationAllocation(ProjectId.of("proj-2"), Money.of("30.00", "USD"))
   // Missing $10 - invariant violation!
  );

  // When / Then
  assertThatThrownBy(() -> donation.allocate(allocations))
   .isInstanceOf(InvariantViolationException.class)
   .hasMessageContaining("Total allocation must equal donation amount");
 }
}
```

**REQUIRED**: Aggregate tests MUST verify:

- Valid state transitions
- Invariant enforcement
- Domain event publication
- Edge cases and error conditions

### OSE Platform Standards

- [Error Handling Standards](./error-handling-standards.md) - Domain exception handling
- [Concurrency Standards](./concurrency-standards.md) - Aggregate thread-safety
- [API Standards](./api-standards.md) - Command/query API design

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - DDD aggregates, value objects, domain events, repositories, CQRS
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Domain-Driven Design patterns and tactical patterns
  - **[Domain-Driven Design In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/domain-driven-design.md)** - Bounded contexts, ubiquitous language, event sourcing
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features (including records for value objects)

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Strong-typed IDs (DonationId, not String) make domain concepts explicit
   - Factory methods explicitly enforce invariants at creation
   - Domain events explicitly document state changes
   - CQRS explicitly separates writes (commands) from reads (queries)

2. **[Immutability](../../../../../governance/principles/software-engineering/immutability.md)**
   - Record types for value objects guarantee immutability
   - Domain events are immutable (cannot be modified after creation)
   - Aggregates return new instances from operations (not mutate state)
   - Collections exposed as immutable views (`Collections.unmodifiableList`)

3. **[Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)**
   - Value object operations are pure (Money.add returns new Money, no side effects)
   - Domain logic isolated in aggregates (no infrastructure dependencies)
   - Event sourcing replays events to rebuild state (deterministic)

## Compliance Checklist

Before deploying DDD-based services, verify:

- [ ] Bounded contexts aligned with business domains
- [ ] Aggregates enforce business invariants
- [ ] Strong-typed IDs used (DonationId, not String)
- [ ] Value objects implemented as immutable records
- [ ] Domain events raised for state changes
- [ ] Repositories separate persistence from domain logic
- [ ] CQRS separates commands from queries
- [ ] Read models optimized for queries
- [ ] Event sourcing implemented for critical aggregates
- [ ] Aggregate unit tests verify business logic

---

## Related Documentation

**Project Structure**:

- [Coding Standards](./coding-standards.md) - Domain package structure and hexagonal architecture layers

**Error Handling**:

- [Error Handling Standards](./error-handling-standards.md) - Domain exception patterns and aggregate validation errors

**Testing**:

- [Testing Standards](./testing-standards.md) - Aggregate testing patterns and domain event verification

**Concurrency**:

- [Concurrency Standards](./concurrency-standards.md) - Thread-safe aggregate design and optimistic locking

**Status**: Active (mandatory for all OSE Platform domain-driven services)
