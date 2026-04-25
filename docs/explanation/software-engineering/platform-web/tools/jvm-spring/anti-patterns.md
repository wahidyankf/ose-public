---
title: Spring Framework Anti-Patterns
description: Common mistakes to avoid including field injection, circular dependencies, god beans, inappropriate scopes, transaction mistakes, configuration anti-patterns, resource leaks, and threading issues
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - anti-patterns
  - common-mistakes
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
created: 2026-01-29
---

# Spring Framework Anti-Patterns

**Understanding-oriented documentation** for common Spring Framework mistakes and anti-patterns to avoid.

## Overview

This document identifies problematic patterns in Spring Framework development and provides guidance on avoiding them. Understanding these anti-patterns helps build more maintainable, testable, and performant applications.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Field Injection Anti-Pattern](#field-injection-anti-pattern)
- [Circular Dependencies](#circular-dependencies)
- [God Beans](#god-beans-overly-complex-services)
- [Inappropriate Bean Scopes](#inappropriate-bean-scopes)
- [Transaction Management Mistakes](#transaction-management-mistakes)
- [Configuration Anti-Patterns](#configuration-anti-patterns)
- [Resource Leak Patterns](#resource-leak-patterns)
- [Threading Issues in Singleton Beans](#threading-issues-in-singleton-beans)
- [Overusing XML Configuration](#overusing-xml-configuration)
- [Missing Exception Handling](#missing-exception-handling)

### ❌ Problem: Field Injection

Field injection makes dependencies implicit, hinders testability, and prevents immutability.

**Java Example** (Bad):

```java
@Service
public class ZakatCalculationService {
  @Autowired  // ❌ Field injection
  private ZakatCalculator calculator;

  @Autowired  // ❌ Field injection
  private ZakatCalculationRepository repository;

  @Autowired  // ❌ Field injection
  private IdGenerator idGenerator;

  // Problems:
  // 1. Cannot create immutable fields (final)
  // 2. Difficult to test without Spring container
  // 3. No compile-time guarantee of dependencies
  // 4. Hidden dependencies - not visible in constructor
  // 5. Violates Single Responsibility if too many dependencies
}
```

**Kotlin Example** (Bad):

```kotlin
@Service
class ZakatCalculationService {
  @Autowired  // ❌ Field injection
  private lateinit var calculator: ZakatCalculator

  @Autowired  // ❌ Field injection
  private lateinit var repository: ZakatCalculationRepository

  @Autowired  // ❌ Field injection
  private lateinit var idGenerator: IdGenerator

  // Problems:
  // 1. Requires lateinit (nullable or lateinit workaround)
  // 2. Runtime initialization - not guaranteed at construction
  // 3. Difficult to test without Spring container
  // 4. Hidden dependencies
}
```

### ✅ Solution: Constructor Injection

Use constructor injection for required dependencies with immutable fields.

**Java Example** (Good):

```java
@Service
public class ZakatCalculationService {
  // Final fields - immutable after construction
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;
  private final IdGenerator idGenerator;

  // ✅ Constructor injection - dependencies are required and immutable
  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository,
    IdGenerator idGenerator
  ) {
    this.calculator = calculator;
    this.repository = repository;
    this.idGenerator = idGenerator;
  }

  // Benefits:
  // 1. Immutable fields (thread-safe)
  // 2. Easy to test with mock dependencies
  // 3. Compile-time guarantee of dependencies
  // 4. Visible dependencies in constructor
  // 5. Constructor parameters indicate potential SRP violation
}
```

**Kotlin Example** (Good):

```kotlin
@Service
class ZakatCalculationService(
  // ✅ Constructor injection with val properties - immutable
  private val calculator: ZakatCalculator,
  private val repository: ZakatCalculationRepository,
  private val idGenerator: IdGenerator
) {
  // Benefits:
  // 1. Val properties are immutable (thread-safe)
  // 2. Easy to test with mock dependencies
  // 3. Guaranteed initialization at construction
  // 4. Visible dependencies in constructor
  // 5. Concise Kotlin syntax
}
```

### ❌ Problem: Circular Bean Dependencies

Two or more beans depending on each other creates circular dependencies, causing initialization failures.

**Java Example** (Bad):

```java
@Service
public class MurabahaContractService {
  private final DonationService donationService;

  // ❌ Circular dependency: MurabahaContractService → DonationService → MurabahaContractService
  public MurabahaContractService(DonationService donationService) {
    this.donationService = donationService;
  }

  public void processContract(MurabahaContract contract) {
    // Uses donationService
    donationService.allocateFunds(contract.getId());
  }
}

@Service
public class DonationService {
  private final MurabahaContractService contractService;

  // ❌ Circular dependency
  public DonationService(MurabahaContractService contractService) {
    this.contractService = contractService;
  }

  public void allocateFunds(String contractId) {
    // Uses contractService
    MurabahaContract contract = contractService.getContract(contractId);
  }
}
```

### ✅ Solution: Refactor to Remove Circular Dependencies

**Java Example**:

```java
// ✅ New shared service extracts common logic
@Service
public class FundsAllocationService {
  private final FundsAllocationRepository repository;

  public FundsAllocationService(FundsAllocationRepository repository) {
    this.repository = repository;
  }

  public void allocateFunds(String contractId, Money amount) {
    repository.recordAllocation(contractId, amount);
  }

  public FundsAllocation getFundsAllocation(String contractId) {
    return repository.findByContractId(contractId)
      .orElseThrow(() -> new AllocationNotFoundException(contractId));
  }
}

@Service
public class MurabahaContractService {
  private final FundsAllocationService fundsAllocationService;

  // ✅ No circular dependency
  public MurabahaContractService(FundsAllocationService fundsAllocationService) {
    this.fundsAllocationService = fundsAllocationService;
  }

  public void processContract(MurabahaContract contract) {
    fundsAllocationService.allocateFunds(contract.getId(), contract.getAmount());
  }
}

@Service
public class DonationService {
  private final FundsAllocationService fundsAllocationService;

  // ✅ No circular dependency
  public DonationService(FundsAllocationService fundsAllocationService) {
    this.fundsAllocationService = fundsAllocationService;
  }

  public void processDonation(Donation donation) {
    FundsAllocation allocation = fundsAllocationService.getFundsAllocation(donation.getContractId());
    // Process donation
  }
}
```

**Kotlin Example**:

```kotlin
// ✅ New shared service extracts common logic
@Service
class FundsAllocationService(
  private val repository: FundsAllocationRepository
) {
  fun allocateFunds(contractId: String, amount: Money) {
    repository.recordAllocation(contractId, amount)
  }

  fun getFundsAllocation(contractId: String): FundsAllocation =
    repository.findByContractId(contractId)
      ?: throw AllocationNotFoundException(contractId)
}

@Service
class MurabahaContractService(
  // ✅ No circular dependency
  private val fundsAllocationService: FundsAllocationService
) {
  fun processContract(contract: MurabahaContract) {
    fundsAllocationService.allocateFunds(contract.id, contract.amount)
  }
}

@Service
class DonationService(
  // ✅ No circular dependency
  private val fundsAllocationService: FundsAllocationService
) {
  fun processDonation(donation: Donation) {
    val allocation = fundsAllocationService.getFundsAllocation(donation.contractId)
    // Process donation
  }
}
```

**Java Example**:

```java
// ✅ Use events to decouple services
@Service
public class MurabahaContractService {
  private final ApplicationEventPublisher eventPublisher;

  public MurabahaContractService(ApplicationEventPublisher eventPublisher) {
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public void processContract(MurabahaContract contract) {
    // Process contract
    // Publish event instead of direct dependency
    eventPublisher.publishEvent(new ContractProcessedEvent(contract.getId(), contract.getAmount()));
  }
}

@Service
public class DonationService {
  // ✅ No dependency on MurabahaContractService

  @EventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handleContractProcessed(ContractProcessedEvent event) {
    // React to contract processing without direct dependency
    allocateFundsForContract(event.getContractId(), event.getAmount());
  }

  private void allocateFundsForContract(String contractId, Money amount) {
    // Implementation
  }
}
```

**Kotlin Example**:

```kotlin
// ✅ Use events to decouple services
@Service
class MurabahaContractService(
  private val eventPublisher: ApplicationEventPublisher
) {

  @Transactional
  fun processContract(contract: MurabahaContract) {
    // Process contract
    // Publish event instead of direct dependency
    eventPublisher.publishEvent(ContractProcessedEvent(contract.id, contract.amount))
  }
}

@Service
class DonationService {
  // ✅ No dependency on MurabahaContractService

  @EventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  fun handleContractProcessed(event: ContractProcessedEvent) {
    // React to contract processing without direct dependency
    allocateFundsForContract(event.contractId, event.amount)
  }

  private fun allocateFundsForContract(contractId: String, amount: Money) {
    // Implementation
  }
}
```

### ❌ Problem: Service with Too Many Responsibilities

A single service handling too many concerns violates Single Responsibility Principle.

**Java Example** (Bad):

```java
@Service
public class ZakatService {
  // ❌ God bean - too many dependencies and responsibilities
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository calculationRepository;
  private final DonorRepository donorRepository;
  private final PaymentRepository paymentRepository;
  private final NotificationService notificationService;
  private final ReportGenerator reportGenerator;
  private final AuditLogger auditLogger;
  private final EmailService emailService;
  private final SmsService smsService;

  public ZakatService(
    ZakatCalculator calculator,
    ZakatCalculationRepository calculationRepository,
    DonorRepository donorRepository,
    PaymentRepository paymentRepository,
    NotificationService notificationService,
    ReportGenerator reportGenerator,
    AuditLogger auditLogger,
    EmailService emailService,
    SmsService smsService
  ) {
    // ❌ Too many constructor parameters - code smell
    this.calculator = calculator;
    this.calculationRepository = calculationRepository;
    this.donorRepository = donorRepository;
    this.paymentRepository = paymentRepository;
    this.notificationService = notificationService;
    this.reportGenerator = reportGenerator;
    this.auditLogger = auditLogger;
    this.emailService = emailService;
    this.smsService = smsService;
  }

  // ❌ Handles calculation
  public ZakatCalculation calculate(BigDecimal wealth, BigDecimal nisab) {
    // Implementation
  }

  // ❌ Handles payment processing
  public void processPayment(String donorId, BigDecimal amount) {
    // Implementation
  }

  // ❌ Handles notification
  public void sendNotification(String donorId, ZakatCalculation calculation) {
    // Implementation
  }

  // ❌ Handles report generation
  public byte[] generateReport(YearMonth month) {
    // Implementation
  }

  // ❌ Handles audit logging
  public void logActivity(String activity, String userId) {
    // Implementation
  }

  // Too many methods - god bean anti-pattern
}
```

### ✅ Solution: Split into Focused Services

**Java Example** (Good):

```java
// ✅ Focused service - calculation only
@Service
public class ZakatCalculationService {
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;

  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository
  ) {
    this.calculator = calculator;
    this.repository = repository;
  }

  @Transactional
  public ZakatCalculation calculate(BigDecimal wealth, BigDecimal nisab) {
    ZakatCalculation calculation = calculator.calculate(wealth, nisab);
    repository.save(calculation);
    return calculation;
  }
}

// ✅ Focused service - payment processing only
@Service
public class ZakatPaymentService {
  private final PaymentRepository paymentRepository;
  private final DonorRepository donorRepository;

  public ZakatPaymentService(
    PaymentRepository paymentRepository,
    DonorRepository donorRepository
  ) {
    this.paymentRepository = paymentRepository;
    this.donorRepository = donorRepository;
  }

  @Transactional
  public Payment processPayment(String donorId, BigDecimal amount) {
    Donor donor = donorRepository.findById(donorId)
      .orElseThrow(() -> new DonorNotFoundException(donorId));

    Payment payment = Payment.create(donor.getId(), amount, LocalDate.now());
    paymentRepository.save(payment);

    return payment;
  }
}

// ✅ Focused service - notifications only
@Service
public class ZakatNotificationService {
  private final EmailService emailService;
  private final SmsService smsService;

  public ZakatNotificationService(EmailService emailService, SmsService smsService) {
    this.emailService = emailService;
    this.smsService = smsService;
  }

  public void sendCalculationNotification(Donor donor, ZakatCalculation calculation) {
    String message = formatNotification(calculation);

    if (donor.hasEmailPreference()) {
      emailService.send(donor.getEmail(), "Zakat Calculation", message);
    }

    if (donor.hasSmsPreference()) {
      smsService.send(donor.getPhoneNumber(), message);
    }
  }

  private String formatNotification(ZakatCalculation calculation) {
    return String.format(
      "Your Zakat calculation: Amount %s, Eligible: %s",
      calculation.getZakatAmount(),
      calculation.isEligible()
    );
  }
}

// ✅ Focused service - reporting only
@Service
public class ZakatReportService {
  private final ReportGenerator reportGenerator;
  private final ZakatCalculationRepository repository;

  public ZakatReportService(
    ReportGenerator reportGenerator,
    ZakatCalculationRepository repository
  ) {
    this.reportGenerator = reportGenerator;
    this.repository = repository;
  }

  public byte[] generateMonthlyReport(YearMonth month) {
    List<ZakatCalculation> calculations = repository.findByMonth(month);
    return reportGenerator.generatePdf(calculations);
  }
}
```

**Kotlin Example** (Good):

```kotlin
// ✅ Focused service - calculation only
@Service
class ZakatCalculationService(
  private val calculator: ZakatCalculator,
  private val repository: ZakatCalculationRepository
) {

  @Transactional
  fun calculate(wealth: BigDecimal, nisab: BigDecimal): ZakatCalculation {
    val calculation = calculator.calculate(wealth, nisab)
    repository.save(calculation)
    return calculation
  }
}

// ✅ Focused service - payment processing only
@Service
class ZakatPaymentService(
  private val paymentRepository: PaymentRepository,
  private val donorRepository: DonorRepository
) {

  @Transactional
  fun processPayment(donorId: String, amount: BigDecimal): Payment {
    val donor = donorRepository.findById(donorId)
      ?: throw DonorNotFoundException(donorId)

    val payment = Payment.create(donor.id, amount, LocalDate.now())
    paymentRepository.save(payment)

    return payment
  }
}

// ✅ Focused service - notifications only
@Service
class ZakatNotificationService(
  private val emailService: EmailService,
  private val smsService: SmsService
) {

  fun sendCalculationNotification(donor: Donor, calculation: ZakatCalculation) {
    val message = formatNotification(calculation)

    if (donor.hasEmailPreference()) {
      emailService.send(donor.email, "Zakat Calculation", message)
    }

    if (donor.hasSmsPreference()) {
      smsService.send(donor.phoneNumber, message)
    }
  }

  private fun formatNotification(calculation: ZakatCalculation): String =
    "Your Zakat calculation: Amount ${calculation.zakatAmount}, Eligible: ${calculation.eligible}"
}

// ✅ Focused service - reporting only
@Service
class ZakatReportService(
  private val reportGenerator: ReportGenerator,
  private val repository: ZakatCalculationRepository
) {

  fun generateMonthlyReport(month: YearMonth): ByteArray {
    val calculations = repository.findByMonth(month)
    return reportGenerator.generatePdf(calculations)
  }
}
```

### ❌ Problem: Singleton Beans with Mutable State

Singleton beans (default scope) should be stateless. Storing mutable state causes threading issues.

**Java Example** (Bad):

```java
@Service  // ❌ Singleton by default with mutable state
public class DonationProcessingService {
  // ❌ Mutable state in singleton bean
  private BigDecimal currentDonationTotal = BigDecimal.ZERO;
  private int donationCount = 0;

  public void processDonation(Donation donation) {
    // ❌ Thread-unsafe mutation in singleton
    currentDonationTotal = currentDonationTotal.add(donation.getAmount());
    donationCount++;

    // Race condition: Multiple threads accessing/modifying shared state
  }

  public BigDecimal getCurrentTotal() {
    // ❌ Returns potentially inconsistent state
    return currentDonationTotal;
  }
}
```

### ✅ Solution: Stateless Singleton or Appropriate Scope

**Java Example**:

```java
@Service  // ✅ Singleton with no mutable state
public class DonationProcessingService {
  private final DonationRepository repository;

  public DonationProcessingService(DonationRepository repository) {
    this.repository = repository;
  }

  // ✅ Stateless method - computes from database
  @Transactional
  public void processDonation(Donation donation) {
    repository.save(donation);
    // No mutable state
  }

  // ✅ Computes total from repository (no state)
  public BigDecimal getCurrentTotal() {
    return repository.calculateTotal();
  }
}
```

**Java Example**:

```java
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class DonationSessionContext {
  // ✅ Mutable state is safe in request-scoped bean
  private BigDecimal sessionTotal = BigDecimal.ZERO;
  private List<Donation> sessionDonations = new ArrayList<>();

  public void addDonation(Donation donation) {
    sessionDonations.add(donation);
    sessionTotal = sessionTotal.add(donation.getAmount());
  }

  public BigDecimal getSessionTotal() {
    return sessionTotal;
  }

  public List<Donation> getSessionDonations() {
    return Collections.unmodifiableList(sessionDonations);
  }
}

@Service  // Singleton service
public class DonationProcessingService {
  private final DonationRepository repository;
  private final DonationSessionContext sessionContext;

  public DonationProcessingService(
    DonationRepository repository,
    DonationSessionContext sessionContext  // Injected request-scoped proxy
  ) {
    this.repository = repository;
    this.sessionContext = sessionContext;
  }

  @Transactional
  public void processDonation(Donation donation) {
    repository.save(donation);
    sessionContext.addDonation(donation);  // Safe per-request state
  }
}
```

### ❌ Problem: Missing @Transactional on Write Operations

Forgetting `@Transactional` on methods that modify data can lead to inconsistent state.

**Java Example** (Bad):

```java
@Service
public class MurabahaContractService {
  private final MurabahaContractRepository repository;
  private final PaymentScheduleRepository paymentScheduleRepository;

  public MurabahaContractService(
    MurabahaContractRepository repository,
    PaymentScheduleRepository paymentScheduleRepository
  ) {
    this.repository = repository;
    this.paymentScheduleRepository = paymentScheduleRepository;
  }

  // ❌ Missing @Transactional - partial updates possible
  public void createContract(MurabahaContract contract) {
    repository.save(contract);  // Committed immediately

    // If this fails, contract is saved but payment schedule is not
    paymentScheduleRepository.save(contract.getPaymentSchedule());

    // Inconsistent state!
  }
}
```

### ✅ Solution: Add @Transactional

**Java Example** (Good):

```java
@Service
public class MurabahaContractService {
  private final MurabahaContractRepository repository;
  private final PaymentScheduleRepository paymentScheduleRepository;

  public MurabahaContractService(
    MurabahaContractRepository repository,
    PaymentScheduleRepository paymentScheduleRepository
  ) {
    this.repository = repository;
    this.paymentScheduleRepository = paymentScheduleRepository;
  }

  // ✅ Transactional - all-or-nothing
  @Transactional
  public void createContract(MurabahaContract contract) {
    repository.save(contract);

    // If this fails, everything rolls back
    paymentScheduleRepository.save(contract.getPaymentSchedule());

    // Consistent state guaranteed
  }
}
```

### ❌ Problem: Calling @Transactional Methods from Same Class

Spring AOP proxies don't intercept self-invocation, so `@Transactional` is ignored.

**Java Example** (Bad):

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;

  public ZakatCalculationService(ZakatCalculationRepository repository) {
    this.repository = repository;
  }

  public void calculateAndSave(BigDecimal wealth, BigDecimal nisab) {
    ZakatCalculation calculation = ZakatCalculation.calculate(wealth, nisab);

    // ❌ Self-invocation - @Transactional ignored
    this.saveCalculation(calculation);  // No transaction!
  }

  @Transactional  // ❌ Not invoked through proxy
  public void saveCalculation(ZakatCalculation calculation) {
    repository.save(calculation);
  }
}
```

### ✅ Solution: Extract to Separate Bean or Make Top-Level Method Transactional

**Java Example** (Good):

```java
// Option 1: Make top-level method transactional
@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;

  public ZakatCalculationService(ZakatCalculationRepository repository) {
    this.repository = repository;
  }

  // ✅ Top-level method is transactional
  @Transactional
  public void calculateAndSave(BigDecimal wealth, BigDecimal nisab) {
    ZakatCalculation calculation = ZakatCalculation.calculate(wealth, nisab);
    repository.save(calculation);  // Within transaction
  }
}

// Option 2: Extract to separate bean
@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;
  private final ZakatCalculationPersistence persistence;

  public ZakatCalculationService(
    ZakatCalculationRepository repository,
    ZakatCalculationPersistence persistence
  ) {
    this.repository = repository;
    this.persistence = persistence;
  }

  public void calculateAndSave(BigDecimal wealth, BigDecimal nisab) {
    ZakatCalculation calculation = ZakatCalculation.calculate(wealth, nisab);

    // ✅ Calls separate bean through proxy - @Transactional works
    persistence.save(calculation);
  }
}

@Component
class ZakatCalculationPersistence {
  private final ZakatCalculationRepository repository;

  ZakatCalculationPersistence(ZakatCalculationRepository repository) {
    this.repository = repository;
  }

  @Transactional  // ✅ Invoked through proxy
  public void save(ZakatCalculation calculation) {
    repository.save(calculation);
  }
}
```

### ❌ Problem: Hardcoded Configuration Values

Hardcoding configuration in code makes it impossible to change without recompilation.

**Java Example** (Bad):

```java
@Configuration
public class DataSourceConfig {

  @Bean
  public DataSource dataSource() {
    HikariConfig config = new HikariConfig();
    // ❌ Hardcoded values
    config.setJdbcUrl("jdbc:postgresql://localhost:5432/ose_platform");
    config.setUsername("ose_user");
    config.setPassword("changeme");
    config.setMaximumPoolSize(20);
    return new HikariDataSource(config);
  }
}
```

### ✅ Solution: Externalize Configuration

**Java Example** (Good):

```java
@Configuration
@PropertySource("classpath:application.properties")
public class DataSourceConfig {

  @Bean
  public DataSource dataSource(
    @Value("${db.url}") String url,
    @Value("${db.username}") String username,
    @Value("${db.password}") String password,
    @Value("${db.pool.max-size:20}") int maxPoolSize
  ) {
    HikariConfig config = new HikariConfig();
    // ✅ Externalized configuration
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);
    config.setMaximumPoolSize(maxPoolSize);
    return new HikariDataSource(config);
  }
}
```

**application.properties**:

```properties
# Externalized configuration
db.url=jdbc:postgresql://localhost:5432/ose_platform
db.username=ose_user
db.password=${DB_PASSWORD:changeme}
db.pool.max-size=20
```

### ❌ Problem: Not Closing Resources

Failing to close resources (connections, files, streams) leads to resource exhaustion.

**Java Example** (Bad):

```java
@Service
public class DonationReportService {
  private final DonationRepository repository;

  public DonationReportService(DonationRepository repository) {
    this.repository = repository;
  }

  public void generateReport(YearMonth month, String outputPath) throws IOException {
    List<Donation> donations = repository.findByMonth(month);

    // ❌ Resources not closed properly
    FileOutputStream fos = new FileOutputStream(outputPath);
    PdfWriter writer = new PdfWriter(fos);
    PdfDocument pdfDoc = new PdfDocument(writer);

    // Write report...

    // ❌ If exception occurs, resources leak
    pdfDoc.close();
    writer.close();
    fos.close();
  }
}
```

### ✅ Solution: Use Try-With-Resources

**Java Example** (Good):

```java
@Service
public class DonationReportService {
  private final DonationRepository repository;

  public DonationReportService(DonationRepository repository) {
    this.repository = repository;
  }

  public void generateReport(YearMonth month, String outputPath) throws IOException {
    List<Donation> donations = repository.findByMonth(month);

    // ✅ Try-with-resources ensures cleanup
    try (
      FileOutputStream fos = new FileOutputStream(outputPath);
      PdfWriter writer = new PdfWriter(fos);
      PdfDocument pdfDoc = new PdfDocument(writer)
    ) {
      // Write report...
      // Resources automatically closed even if exception occurs
    }
  }
}
```

**Kotlin Example** (Good):

```kotlin
@Service
class DonationReportService(
  private val repository: DonationRepository
) {

  fun generateReport(month: YearMonth, outputPath: String) {
    val donations = repository.findByMonth(month)

    // ✅ Kotlin's use extension ensures cleanup
    FileOutputStream(outputPath).use { fos ->
      PdfWriter(fos).use { writer ->
        PdfDocument(writer).use { pdfDoc ->
          // Write report...
          // Resources automatically closed even if exception occurs
        }
      }
    }
  }
}
```

### ❌ Problem: Sharing Mutable State

Singleton beans sharing mutable state across threads cause race conditions.

**Java Example** (Bad):

```java
@Service
public class ZakatCalculationService {
  // ❌ Mutable shared state in singleton
  private int calculationCount = 0;

  public void calculate(BigDecimal wealth, BigDecimal nisab) {
    // ❌ Race condition: multiple threads can increment simultaneously
    calculationCount++;

    // Calculation logic...
  }

  public int getCalculationCount() {
    // ❌ Returns potentially inconsistent value
    return calculationCount;
  }
}
```

### ✅ Solution: Use Thread-Safe Mechanisms

**Java Example** (Good with AtomicInteger):

```java
@Service
public class ZakatCalculationService {
  // ✅ Thread-safe counter
  private final AtomicInteger calculationCount = new AtomicInteger(0);

  public void calculate(BigDecimal wealth, BigDecimal nisab) {
    // ✅ Thread-safe increment
    calculationCount.incrementAndGet();

    // Calculation logic...
  }

  public int getCalculationCount() {
    // ✅ Returns consistent value
    return calculationCount.get();
  }
}
```

**Java Example** (Good with Stateless Design - Preferred):

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;

  public ZakatCalculationService(ZakatCalculationRepository repository) {
    this.repository = repository;
  }

  // ✅ Stateless - thread-safe by design
  public void calculate(BigDecimal wealth, BigDecimal nisab) {
    // Calculation logic...
  }

  // ✅ Computes count from repository (no shared state)
  public long getCalculationCount() {
    return repository.count();
  }
}
```

### ❌ Problem: XML Configuration Over Java Config

XML configuration is verbose, not type-safe, and harder to maintain than Java configuration.

**XML Example** (Bad - applicationContext.xml):

```xml
<!-- ❌ Verbose, not type-safe -->
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

  <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
    <property name="jdbcUrl" value="jdbc:postgresql://localhost:5432/ose_platform"/>
    <property name="username" value="ose_user"/>
    <property name="password" value="changeme"/>
    <property name="maximumPoolSize" value="20"/>
  </bean>

  <bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
    <constructor-arg ref="dataSource"/>
  </bean>

  <bean id="zakatCalculationService" class="com.oseplatform.zakat.service.ZakatCalculationService">
    <constructor-arg ref="zakatCalculator"/>
    <constructor-arg ref="zakatCalculationRepository"/>
  </bean>
</beans>
```

### ✅ Solution: Use Java Configuration

**Java Example** (Good):

```java
@Configuration
@PropertySource("classpath:application.properties")
public class ApplicationConfig {

  @Bean
  public DataSource dataSource(
    @Value("${db.url}") String url,
    @Value("${db.username}") String username,
    @Value("${db.password}") String password
  ) {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);
    config.setMaximumPoolSize(20);
    return new HikariDataSource(config);
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }

  // ✅ Type-safe, refactorable, IDE-friendly
}
```

### ❌ Problem: Catching Generic Exception

Catching generic `Exception` hides specific errors and makes debugging difficult.

**Java Example** (Bad):

```java
@Service
public class MurabahaContractService {

  @Transactional
  public void createContract(MurabahaContract contract) {
    try {
      // Business logic
      repository.save(contract);
    } catch (Exception e) {
      // ❌ Too broad - catches everything
      logger.error("Error creating contract", e);
      // What went wrong? Validation? Database? Network?
    }
  }
}
```

### ✅ Solution: Catch Specific Exceptions

**Java Example** (Good):

```java
@Service
public class MurabahaContractService {

  @Transactional
  public void createContract(MurabahaContract contract) {
    try {
      // Business logic
      repository.save(contract);
    } catch (ContractValidationException e) {
      // ✅ Specific exception - clear intent
      logger.error("Contract validation failed: {}", e.getMessage());
      throw new ContractCreationException("Invalid contract data", e);
    } catch (DataAccessException e) {
      // ✅ Specific exception - database error
      logger.error("Database error creating contract", e);
      throw new ContractCreationException("Failed to persist contract", e);
    }
    // ✅ Other exceptions propagate naturally
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Idioms](idioms.md)** - Framework patterns
- **[Best Practices](best-practices.md)** - Production standards
- **[Configuration](configuration.md)** - Configuration approaches

### Development Practices

- **[Code Quality Standards](../../../../../../governance/development/quality/code.md)** - Quality requirements
- **[Functional Programming](../../../../../../governance/development/pattern/functional-programming.md)** - FP principles

## See Also

**OSE Explanation Foundation**:

- [Java Anti-Patterns](../../../programming-languages/java/coding-standards.md) - Java baseline anti-patterns
- [Spring Framework Best Practices](./best-practices.md) - Recommended practices
- [Spring Framework Idioms](./idioms.md) - Correct patterns
- [Spring Framework Dependency Injection](./dependency-injection.md) - Proper DI usage

**Spring Boot Extension**:

- [Spring Boot Anti-Patterns](../jvm-spring-boot/anti-patterns.md) - Boot-specific mistakes

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
