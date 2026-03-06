---
title: Spring Framework DDD Standards for OSE Platform
description: Prescriptive Domain-Driven Design requirements for Spring-based Shariah-compliant financial systems
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - ose-platform
  - domain-driven-design
  - aggregates
  - repositories
  - domain-events
  - value-objects
  - standards
principles:
  - explicit-over-implicit
  - immutability
  - simplicity-over-complexity
created: 2026-02-06
updated: 2026-02-06
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from AyoKoding Spring Learning Path before using these standards.

**This document is OSE Platform-specific**, not a Spring tutorial. We define HOW to apply Spring in THIS codebase, not WHAT Spring is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Spring Framework DDD Standards for OSE Platform

**OSE-specific prescriptive standards** for Domain-Driven Design in Spring-based Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Spring Framework fundamentals from AyoKoding Spring Framework and Domain-Driven Design concepts.

## Purpose

Domain-Driven Design in Spring-based OSE Platform services enables:

- **Aggregate Pattern**: Consistency boundaries for financial transactions
- **Repository Pattern**: Data access abstraction with Spring Data JPA
- **Domain Events**: Decoupled communication with `ApplicationEventPublisher`
- **Value Objects**: Immutable domain primitives as records
- **Bounded Context Organization**: Modular Spring applications by domain
- **Entity Lifecycle**: Spring IoC management of domain entities

### Aggregate Root Definition

**REQUIRED**: All aggregates MUST have a single root entity with Spring `@Entity` annotation.

```java
// REQUIRED: Aggregate root with @Entity
@Entity
@Table(name = "murabaha_contracts")
public class MurabahaContract {

  @Id
  @Column(name = "contract_id", nullable = false, updatable = false)
  private String contractId;

  @Embedded
  private CustomerId customerId;  // Value object

  @Embedded
  private Money principal;  // Value object

  @Column(name = "profit_rate", nullable = false)
  private BigDecimal profitRate;

  @Embedded
  private Money totalAmount;  // Value object

  @Column(name = "installment_count", nullable = false)
  private int installmentCount;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private ContractStatus status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // REQUIRED: Child entities managed through aggregate root
  @OneToMany(
    mappedBy = "contract",
    cascade = CascadeType.ALL,
    orphanRemoval = true,
    fetch = FetchType.LAZY
  )
  private List<MurabahaInstallment> installments = new ArrayList<>();

  // REQUIRED: Protected constructor for JPA
  protected MurabahaContract() {}

  // REQUIRED: Public factory method (not constructor)
  public static MurabahaContract create(
    String contractId,
    CustomerId customerId,
    Money principal,
    BigDecimal profitRate,
    int installmentCount
  ) {
    MurabahaContract contract = new MurabahaContract();
    contract.contractId = contractId;
    contract.customerId = customerId;
    contract.principal = principal;
    contract.profitRate = profitRate;
    contract.installmentCount = installmentCount;
    contract.totalAmount = calculateTotalAmount(principal, profitRate);
    contract.status = ContractStatus.DRAFT;
    contract.createdAt = Instant.now();
    contract.updatedAt = Instant.now();

    return contract;
  }

  // REQUIRED: Business methods (not setters)
  public void activate() {
    if (status != ContractStatus.DRAFT) {
      throw new IllegalStateException("Contract must be in DRAFT status to activate");
    }

    status = ContractStatus.ACTIVE;
    updatedAt = Instant.now();

    // Generate installments
    generateInstallments();
  }

  public void recordPayment(String installmentId, Money amount) {
    MurabahaInstallment installment = findInstallment(installmentId);

    if (installment == null) {
      throw new IllegalArgumentException("Installment not found: " + installmentId);
    }

    installment.recordPayment(amount);
    updatedAt = Instant.now();

    // Check if all installments are paid
    if (installments.stream().allMatch(MurabahaInstallment::isPaid)) {
      status = ContractStatus.COMPLETED;
    }
  }

  // REQUIRED: Private helper methods
  private void generateInstallments() {
    Money installmentAmount = totalAmount.divide(installmentCount);
    LocalDate currentDueDate = LocalDate.now().plusMonths(1);

    for (int i = 0; i < installmentCount; i++) {
      MurabahaInstallment installment = MurabahaInstallment.create(
        UUID.randomUUID().toString(),
        this,
        i + 1,
        installmentAmount,
        currentDueDate
      );

      installments.add(installment);
      currentDueDate = currentDueDate.plusMonths(1);
    }
  }

  private MurabahaInstallment findInstallment(String installmentId) {
    return installments.stream()
      .filter(i -> i.getInstallmentId().equals(installmentId))
      .findFirst()
      .orElse(null);
  }

  private static Money calculateTotalAmount(Money principal, BigDecimal profitRate) {
    BigDecimal profitAmount = principal.getAmount().multiply(profitRate);
    return principal.add(Money.of(profitAmount, principal.getCurrency()));
  }

  // REQUIRED: Getters only (no setters for encapsulation)
  public String getContractId() { return contractId; }
  public CustomerId getCustomerId() { return customerId; }
  public Money getPrincipal() { return principal; }
  public BigDecimal getProfitRate() { return profitRate; }
  public Money getTotalAmount() { return totalAmount; }
  public int getInstallmentCount() { return installmentCount; }
  public ContractStatus getStatus() { return status; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public List<MurabahaInstallment> getInstallments() {
    return Collections.unmodifiableList(installments);
  }
}
```

**REQUIRED**: Aggregate roots MUST:

- Use `@Entity` and `@Table` annotations
- Have protected no-arg constructor for JPA
- Use factory methods (not public constructors) for creation
- Encapsulate child entities with `@OneToMany` cascade
- Expose business methods (not setters)
- Use value objects (`@Embedded`) for domain primitives
- Update `updatedAt` timestamp on mutations

### Child Entities in Aggregates

**REQUIRED**: Child entities MUST only be accessible through aggregate root.

```java
// REQUIRED: Child entity with @Entity
@Entity
@Table(name = "murabaha_installments")
public class MurabahaInstallment {

  @Id
  @Column(name = "installment_id", nullable = false, updatable = false)
  private String installmentId;

  // REQUIRED: Reference to aggregate root
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "contract_id", nullable = false, updatable = false)
  private MurabahaContract contract;

  @Column(name = "installment_number", nullable = false, updatable = false)
  private int installmentNumber;

  @Embedded
  private Money amount;

  @Column(name = "due_date", nullable = false, updatable = false)
  private LocalDate dueDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private InstallmentStatus status;

  @Column(name = "paid_at")
  private Instant paidAt;

  // REQUIRED: Protected constructor for JPA
  protected MurabahaInstallment() {}

  // REQUIRED: Package-private factory method (not public)
  static MurabahaInstallment create(
    String installmentId,
    MurabahaContract contract,
    int installmentNumber,
    Money amount,
    LocalDate dueDate
  ) {
    MurabahaInstallment installment = new MurabahaInstallment();
    installment.installmentId = installmentId;
    installment.contract = contract;
    installment.installmentNumber = installmentNumber;
    installment.amount = amount;
    installment.dueDate = dueDate;
    installment.status = InstallmentStatus.PENDING;
    return installment;
  }

  // REQUIRED: Package-private business methods (called by aggregate root)
  void recordPayment(Money paymentAmount) {
    if (status == InstallmentStatus.PAID) {
      throw new IllegalStateException("Installment already paid");
    }

    if (!paymentAmount.equals(amount)) {
      throw new IllegalArgumentException("Payment amount must match installment amount");
    }

    status = InstallmentStatus.PAID;
    paidAt = Instant.now();
  }

  boolean isPaid() {
    return status == InstallmentStatus.PAID;
  }

  // REQUIRED: Getters only (no setters)
  public String getInstallmentId() { return installmentId; }
  public int getInstallmentNumber() { return installmentNumber; }
  public Money getAmount() { return amount; }
  public LocalDate getDueDate() { return dueDate; }
  public InstallmentStatus getStatus() { return status; }
  public Instant getPaidAt() { return paidAt; }
}
```

**PROHIBITED**: Direct access to child entities from outside aggregate.

```java
// ❌ WRONG: Direct repository access to child entity
@Repository
public interface MurabahaInstallmentRepository extends JpaRepository<MurabahaInstallment, String> {
  // PROHIBITED: Child entities should not have repositories
}

// ❌ WRONG: Service accessing child entity directly
@Service
public class PaymentService {
  private final MurabahaInstallmentRepository installmentRepository;  // PROHIBITED

  public void recordPayment(String installmentId, Money amount) {
    MurabahaInstallment installment = installmentRepository.findById(installmentId).orElseThrow();
    installment.recordPayment(amount);  // PROHIBITED: Bypasses aggregate root
    installmentRepository.save(installment);
  }
}
```

### Spring Data JPA Repository

**REQUIRED**: One repository per aggregate root.

```java
// REQUIRED: Repository for aggregate root
@Repository
public interface MurabahaContractRepository extends JpaRepository<MurabahaContract, String> {

  // REQUIRED: Query methods following Spring Data naming conventions
  List<MurabahaContract> findByCustomerId(CustomerId customerId);

  List<MurabahaContract> findByStatus(ContractStatus status);

  @Query("SELECT c FROM MurabahaContract c WHERE c.status = :status AND c.createdAt >= :since")
  List<MurabahaContract> findActiveContractsSince(
    @Param("status") ContractStatus status,
    @Param("since") Instant since
  );

  // REQUIRED: Pagination support
  Page<MurabahaContract> findByCustomerId(CustomerId customerId, Pageable pageable);
}
```

**REQUIRED**: Repository interfaces MUST:

- Extend `JpaRepository<Entity, ID>`
- Use `@Repository` annotation
- Follow Spring Data query method naming conventions
- Support pagination with `Pageable`
- Define custom queries with `@Query` when needed

### JdbcTemplate Repository (Alternative)

**REQUIRED**: Use JdbcTemplate for fine-grained SQL control.

```java
@Repository
public class ZakatCalculationRepository {

  private final JdbcTemplate jdbcTemplate;
  private final RowMapper<ZakatCalculation> rowMapper;

  public ZakatCalculationRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
    this.rowMapper = (rs, rowNum) -> {
      return new ZakatCalculation(
        rs.getString("calculation_id"),
        rs.getString("account_id"),
        Money.of(rs.getBigDecimal("wealth"), rs.getString("currency")),
        Money.of(rs.getBigDecimal("nisab"), rs.getString("currency")),
        Money.of(rs.getBigDecimal("zakat_amount"), rs.getString("currency")),
        rs.getTimestamp("calculation_date").toInstant()
      );
    };
  }

  public Optional<ZakatCalculation> findById(String calculationId) {
    String sql = """
      SELECT calculation_id, account_id, wealth, nisab, zakat_amount, currency, calculation_date
      FROM zakat_calculations
      WHERE calculation_id = ?
    """;

    try {
      ZakatCalculation calculation = jdbcTemplate.queryForObject(sql, rowMapper, calculationId);
      return Optional.ofNullable(calculation);
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  public void save(ZakatCalculation calculation) {
    String sql = """
      INSERT INTO zakat_calculations (calculation_id, account_id, wealth, nisab, zakat_amount, currency, calculation_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (calculation_id) DO UPDATE SET
        wealth = EXCLUDED.wealth,
        nisab = EXCLUDED.nisab,
        zakat_amount = EXCLUDED.zakat_amount,
        calculation_date = EXCLUDED.calculation_date
    """;

    jdbcTemplate.update(
      sql,
      calculation.getCalculationId(),
      calculation.getAccountId(),
      calculation.getWealth().getAmount(),
      calculation.getNisab().getAmount(),
      calculation.getZakatAmount().getAmount(),
      calculation.getWealth().getCurrency(),
      Timestamp.from(calculation.getCalculationDate())
    );
  }

  public List<ZakatCalculation> findByAccountId(String accountId) {
    String sql = """
      SELECT calculation_id, account_id, wealth, nisab, zakat_amount, currency, calculation_date
      FROM zakat_calculations
      WHERE account_id = ?
      ORDER BY calculation_date DESC
    """;

    return jdbcTemplate.query(sql, rowMapper, accountId);
  }
}
```

**REQUIRED**: JdbcTemplate repositories MUST:

- Use constructor injection for `JdbcTemplate`
- Define `RowMapper` for result mapping
- Use parameterized queries (prevent SQL injection)
- Handle `EmptyResultDataAccessException` for optional results

### Publishing Domain Events

**REQUIRED**: Use `ApplicationEventPublisher` for domain events.

```java
@Service
public class DonationService {

  private static final Logger logger = LoggerFactory.getLogger(DonationService.class);

  private final DonationRepository donationRepository;
  private final ApplicationEventPublisher eventPublisher;  // REQUIRED: Inject event publisher

  public DonationService(
    DonationRepository donationRepository,
    ApplicationEventPublisher eventPublisher
  ) {
    this.donationRepository = donationRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public Donation create(CreateDonationRequest request) throws DonationException {
    // Create donation
    Donation donation = Donation.create(
      UUID.randomUUID().toString(),
      request.donorId(),
      request.amount(),
      request.charityCategory(),
      LocalDate.now()
    );

    // Persist
    donationRepository.save(donation);

    // REQUIRED: Publish domain event
    DonationCreatedEvent event = new DonationCreatedEvent(
      donation.getId(),
      donation.getDonorId(),
      donation.getAmount(),
      donation.getCharityCategory(),
      donation.getDonationDate()
    );

    eventPublisher.publishEvent(event);  // REQUIRED: Publish after persistence

    logger.info("Donation created: {}", donation.getId());

    return donation;
  }
}
```

**REQUIRED**: Domain event publishing MUST:

- Publish events AFTER successful persistence (within `@Transactional`)
- Use `ApplicationEventPublisher.publishEvent()`
- Include all relevant event data in event object

### Domain Event Definition

**REQUIRED**: Domain events MUST be immutable records.

```java
// REQUIRED: Immutable domain event as record
public record DonationCreatedEvent(
  String donationId,
  String donorId,
  Money amount,
  String charityCategory,
  LocalDate donationDate
) {
  // REQUIRED: Validation in compact constructor
  public DonationCreatedEvent {
    Objects.requireNonNull(donationId, "Donation ID is required");
    Objects.requireNonNull(donorId, "Donor ID is required");
    Objects.requireNonNull(amount, "Amount is required");
    Objects.requireNonNull(charityCategory, "Charity category is required");
    Objects.requireNonNull(donationDate, "Donation date is required");
  }
}
```

### Event Listeners

**REQUIRED**: Use `@EventListener` for event handlers.

```java
@Component
public class DonationEventListener {

  private static final Logger logger = LoggerFactory.getLogger(DonationEventListener.class);

  private final NotificationService notificationService;
  private final AuditLogService auditLogService;

  public DonationEventListener(
    NotificationService notificationService,
    AuditLogService auditLogService
  ) {
    this.notificationService = notificationService;
    this.auditLogService = auditLogService;
  }

  // REQUIRED: @EventListener for synchronous handling
  @EventListener
  public void handleDonationCreated(DonationCreatedEvent event) {
    logger.info("Handling DonationCreatedEvent: {}", event.donationId());

    // Record in audit log (synchronous, transactional)
    auditLogService.recordDonationCreated(event);
  }

  // REQUIRED: @Async @EventListener for asynchronous handling
  @Async("ioTaskExecutor")
  @EventListener
  public void sendDonationConfirmation(DonationCreatedEvent event) {
    logger.info("Sending donation confirmation for: {}", event.donationId());

    // Send notification (asynchronous, non-blocking)
    notificationService.sendDonationReceipt(event.donorId(), event.amount());
  }

  // REQUIRED: @TransactionalEventListener for transactional handling
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void publishToExternalSystem(DonationCreatedEvent event) {
    logger.info("Publishing donation to external system: {}", event.donationId());

    // Publish to external system AFTER transaction commits
    // Prevents external side effects if transaction rolls back
  }
}
```

**REQUIRED**: Event listeners MUST:

- Use `@EventListener` for synchronous handling
- Use `@Async @EventListener` for asynchronous handling
- Use `@TransactionalEventListener` for transactional handling
- Handle exceptions gracefully (don't propagate to publisher)

### Value Object Definition

**REQUIRED**: Value objects MUST be immutable records with `@Embeddable`.

```java
// REQUIRED: Value object as record with @Embeddable
@Embeddable
public record Money(
  @Column(name = "amount", nullable = false)
  BigDecimal amount,

  @Column(name = "currency", nullable = false, length = 3)
  String currency
) {
  // REQUIRED: Validation in compact constructor
  public Money {
    Objects.requireNonNull(amount, "Amount is required");
    Objects.requireNonNull(currency, "Currency is required");

    if (amount.scale() > 2) {
      throw new IllegalArgumentException("Amount scale cannot exceed 2 decimal places");
    }

    if (currency.length() != 3) {
      throw new IllegalArgumentException("Currency must be ISO 4217 code (3 characters)");
    }
  }

  // REQUIRED: Factory methods for common cases
  public static Money of(BigDecimal amount, String currency) {
    return new Money(amount, currency);
  }

  public static Money of(String amount, String currency) {
    return new Money(new BigDecimal(amount), currency);
  }

  public static final Money ZERO = new Money(BigDecimal.ZERO, "USD");

  // REQUIRED: Business methods (immutable operations)
  public Money add(Money other) {
    ensureSameCurrency(other);
    return new Money(amount.add(other.amount), currency);
  }

  public Money subtract(Money other) {
    ensureSameCurrency(other);
    return new Money(amount.subtract(other.amount), currency);
  }

  public Money multiply(BigDecimal multiplier) {
    return new Money(amount.multiply(multiplier), currency);
  }

  public Money divide(int divisor) {
    return new Money(amount.divide(BigDecimal.valueOf(divisor), 2, RoundingMode.HALF_UP), currency);
  }

  public boolean greaterThan(Money other) {
    ensureSameCurrency(other);
    return amount.compareTo(other.amount) > 0;
  }

  public boolean greaterThanOrEqual(Money other) {
    ensureSameCurrency(other);
    return amount.compareTo(other.amount) >= 0;
  }

  public boolean lessThan(Money other) {
    ensureSameCurrency(other);
    return amount.compareTo(other.amount) < 0;
  }

  public boolean isZero() {
    return amount.compareTo(BigDecimal.ZERO) == 0;
  }

  private void ensureSameCurrency(Money other) {
    if (!currency.equals(other.currency)) {
      throw new IllegalArgumentException(
        String.format("Currency mismatch: %s vs %s", currency, other.currency)
      );
    }
  }
}
```

**REQUIRED**: Value objects MUST:

- Be immutable (all fields final)
- Use `@Embeddable` for JPA persistence
- Validate inputs in compact constructor
- Provide factory methods for construction
- Implement business methods (immutable operations)
- Use `equals()` and `hashCode()` (automatic with records)

### Entity-Embedded Value Objects

**REQUIRED**: Embed value objects in entities with `@Embedded`.

```java
@Entity
@Table(name = "accounts")
public class Account {

  @Id
  @Column(name = "account_id", nullable = false, updatable = false)
  private String accountId;

  // REQUIRED: Embed value object
  @Embedded
  private Money balance;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private AccountStatus status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Account() {}

  public static Account create(String accountId, Money initialBalance) {
    Account account = new Account();
    account.accountId = accountId;
    account.balance = initialBalance;
    account.status = AccountStatus.ACTIVE;
    account.createdAt = Instant.now();
    return account;
  }

  public void debit(Money amount) {
    if (balance.lessThan(amount)) {
      throw new InsufficientFundsException(amount, balance);
    }

    balance = balance.subtract(amount);  // Immutable operation
  }

  public void credit(Money amount) {
    balance = balance.add(amount);  // Immutable operation
  }

  // Getters only
  public String getAccountId() { return accountId; }
  public Money getBalance() { return balance; }
  public AccountStatus getStatus() { return status; }
  public Instant getCreatedAt() { return createdAt; }
}
```

### Module Structure

**REQUIRED**: Organize Spring applications by bounded context.

```
com.oseplatform.zakat/
├── domain/                    # Domain layer
│   ├── model/
│   │   ├── ZakatCalculation.java
│   │   ├── Account.java
│   │   └── Money.java (value object)
│   ├── repository/
│   │   └── ZakatCalculationRepository.java
│   └── event/
│       └── ZakatCalculatedEvent.java
├── application/               # Application layer
│   ├── service/
│   │   └── ZakatCalculationService.java
│   └── dto/
│       ├── CalculateZakatRequest.java
│       └── ZakatCalculationResponse.java
├── infrastructure/            # Infrastructure layer
│   ├── persistence/
│   │   └── JpaZakatCalculationRepository.java
│   └── event/
│       └── ZakatEventListener.java
└── presentation/              # Presentation layer
    └── api/
        └── ZakatController.java

com.oseplatform.donation/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

**REQUIRED**: Bounded context modules MUST:

- Use package-by-feature (not package-by-layer)
- Separate domain, application, infrastructure, presentation layers
- Avoid cross-context dependencies (use events for communication)

### OSE Platform Standards

- **[Spring Error Handling Standards](./ex-soen-plwe-to-jvsp__error-handling-standards.md)** - Domain exception hierarchy
- **[Spring API Standards](./ex-soen-plwe-to-jvsp__api-standards.md)** - DTO to domain model conversion
- **[Spring Concurrency Standards](./ex-soen-plwe-to-jvsp__concurrency-standards.md)** - Thread-safe domain models

### Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Dependency Injection](./ex-soen-plwe-to-jvsp__dependency-injection.md)** - Spring bean scopes
- **[Data Access](./ex-soen-plwe-to-jvsp__data-access.md)** - Spring Data JPA and JdbcTemplate

### Learning Resources

For learning Spring Framework fundamentals and concepts referenced in these standards, see:

- **[Spring By Example](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/_index.md)** - Annotated Spring code examples

**Note**: These standards assume you've learned Spring basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Aggregate roots make consistency boundaries explicit
   - Domain events make side effects explicit
   - Repository interfaces make data access explicit

2. **[Immutability](../../../../../../governance/principles/software-engineering/immutability.md)**
   - Value objects are immutable records
   - Domain events are immutable records
   - Business methods return new instances (not mutate state)

3. **[Simplicity Over Complexity](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - One repository per aggregate (not per entity)
   - Factory methods for creation (not complex constructors)
   - Package-by-feature simplifies navigation

## Compliance Checklist

Before deploying Spring DDD applications, verify:

- [ ] All aggregates have single root entity with `@Entity`
- [ ] Child entities only accessible through aggregate root
- [ ] One repository per aggregate root (no child entity repositories)
- [ ] Domain events published AFTER persistence (within `@Transactional`)
- [ ] Domain events are immutable records
- [ ] Event listeners use `@EventListener` or `@TransactionalEventListener`
- [ ] Value objects are immutable records with `@Embeddable`
- [ ] Value objects validate inputs in compact constructor
- [ ] Bounded contexts organized by package-by-feature
- [ ] No cross-context dependencies (use events for communication)

## See Also

**OSE Explanation Foundation**:

- [Java Domain Modeling](../../../programming-languages/java/ex-soen-prla-ja__ddd-standards.md) - Java DDD baseline
- [Spring Framework Idioms](./ex-soen-plwe-to-jvsp__idioms.md) - DDD patterns
- [Spring Framework Data Access](./ex-soen-plwe-to-jvsp__data-access.md) - Repository implementation
- [Spring Framework Best Practices](./ex-soen-plwe-to-jvsp__best-practices.md) - DDD standards

**Spring Boot Extension**:

- [Spring Boot Domain-Driven Design](../jvm-spring-boot/ex-soen-plwe-to-jvspbo__domain-driven-design.md) - Boot DDD patterns

---

**Last Updated**: 2026-02-06

**Status**: Mandatory (required for all OSE Platform Spring services)
