---
title: Spring Framework Best Practices
description: Production standards for project structure, constructor injection, configuration management, transaction strategies, exception handling, testing, logging, and performance
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - best-practices
  - production
  - testing
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - automation-over-manual
  - immutability
  - reproducibility
created: 2026-01-29
---

# Spring Framework Best Practices

**Understanding-oriented documentation** for production-ready Spring Framework development standards.

## Overview

This document establishes Spring Framework best practices for building maintainable, testable, performant enterprise applications. These standards apply to both Java and Kotlin projects targeting Islamic finance domains (Zakat, Murabaha, donations).

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Project Structure](#project-structure)
- [Configuration Management](#configuration-management)
- [Constructor Injection (Preferred)](#constructor-injection-preferred)
- [Bean Naming Conventions](#bean-naming-conventions)
- [Transaction Management](#transaction-management)
- [Exception Handling](#exception-handling)
- [Testing Strategies](#testing-strategies)
- [Logging Best Practices](#logging-best-practices)
- [Performance Optimization](#performance-optimization)
- [Resource Management](#resource-management)

### Layered Architecture

Organize Spring projects following clean architecture principles with clear layer boundaries.

**Standard Package Structure**:

```
src/main/java/com/oseplatform/[bounded-context]/
├── domain/                    # Domain layer (pure business logic)
│   ├── model/                # Aggregates, entities, value objects
│   │   ├── ZakatCalculation.java
│   │   ├── Money.java
│   │   └── NisabThreshold.java
│   ├── repository/           # Repository interfaces (ports)
│   │   └── ZakatCalculationRepository.java
│   └── service/              # Domain services
│       └── ZakatDomainService.java
├── application/              # Application layer (use cases)
│   ├── service/             # Application services
│   │   └── ZakatCalculationService.java
│   ├── dto/                 # Data transfer objects
│   │   ├── CreateZakatCalculationRequest.java
│   │   └── ZakatCalculationResponse.java
│   └── usecase/             # Use case implementations
│       └── CalculateZakatUseCase.java
├── infrastructure/           # Infrastructure layer (adapters)
│   ├── persistence/         # JDBC/JPA repositories (adapters)
│   │   └── JdbcZakatCalculationRepository.java
│   ├── config/              # Spring configuration
│   │   ├── ApplicationConfig.java
│   │   ├── DataSourceConfig.java
│   │   └── TransactionConfig.java
│   └── integration/         # External service clients
│       └── GoldPriceApiClient.java
└── api/                      # API layer (REST controllers)
    ├── controller/          # Spring MVC controllers
    │   └── ZakatCalculationController.java
    ├── request/             # Request DTOs
    │   └── CalculateZakatRequest.java
    └── response/            # Response DTOs
        └── ZakatCalculationApiResponse.java
```

**Java Example** (Domain Model):

```java
// domain/model/ZakatCalculation.java
package com.oseplatform.zakat.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ZakatCalculation {
  private final String id;
  private final Money wealth;
  private final Money nisab;
  private final Money zakatAmount;
  private final boolean eligible;
  private final LocalDate calculationDate;

  // Private constructor enforces factory method usage
  private ZakatCalculation(
    String id,
    Money wealth,
    Money nisab,
    Money zakatAmount,
    boolean eligible,
    LocalDate calculationDate
  ) {
    this.id = id;
    this.wealth = wealth;
    this.nisab = nisab;
    this.zakatAmount = zakatAmount;
    this.eligible = eligible;
    this.calculationDate = calculationDate;
  }

  // Factory method with business logic
  public static ZakatCalculation calculate(
    String id,
    Money wealth,
    Money nisab,
    ZakatRate rate,
    LocalDate calculationDate
  ) {
    boolean eligible = wealth.isGreaterThanOrEqual(nisab);
    Money zakatAmount = eligible ? wealth.multiply(rate.getValue()) : Money.zero(wealth.getCurrency());

    return new ZakatCalculation(id, wealth, nisab, zakatAmount, eligible, calculationDate);
  }

  // Getters only - immutable aggregate
  public String getId() {
    return id;
  }

  public Money getWealth() {
    return wealth;
  }

  public Money getNisab() {
    return nisab;
  }

  public Money getZakatAmount() {
    return zakatAmount;
  }

  public boolean isEligible() {
    return eligible;
  }

  public LocalDate getCalculationDate() {
    return calculationDate;
  }
}
```

**Kotlin Example** (Domain Model):

```kotlin
// domain/model/ZakatCalculation.kt
package com.oseplatform.zakat.domain.model

import java.math.BigDecimal
import java.time.LocalDate

data class ZakatCalculation private constructor(
  val id: String,
  val wealth: Money,
  val nisab: Money,
  val zakatAmount: Money,
  val eligible: Boolean,
  val calculationDate: LocalDate
) {
  companion object {
    // Factory method with business logic
    fun calculate(
      id: String,
      wealth: Money,
      nisab: Money,
      rate: ZakatRate,
      calculationDate: LocalDate
    ): ZakatCalculation {
      val eligible = wealth >= nisab
      val zakatAmount = if (eligible) wealth * rate.value else Money.zero(wealth.currency)

      return ZakatCalculation(id, wealth, nisab, zakatAmount, eligible, calculationDate)
    }
  }
}
```

### Configuration Organization

Separate configuration classes by concern for better maintainability.

**Java Example**:

```java
// infrastructure/config/ApplicationConfig.java
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
@Import({DataSourceConfig.class, TransactionConfig.class, WebConfig.class})
public class ApplicationConfig {
  // Application-wide beans
}

// infrastructure/config/DataSourceConfig.java
@Configuration
@PropertySource("classpath:database.properties")
public class DataSourceConfig {

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
    config.setMinimumIdle(5);
    config.setConnectionTimeout(30000);
    config.setValidationTimeout(5000);
    return new HikariDataSource(config);
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}

// infrastructure/config/TransactionConfig.java
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

  @Bean
  public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
  }
}
```

**Kotlin Example**:

```kotlin
// infrastructure/config/ApplicationConfig.kt
@Configuration
@ComponentScan(basePackages = ["com.oseplatform.zakat"])
@Import(DataSourceConfig::class, TransactionConfig::class, WebConfig::class)
class ApplicationConfig {
  // Application-wide beans
}

// infrastructure/config/DataSourceConfig.kt
@Configuration
@PropertySource("classpath:database.properties")
class DataSourceConfig {

  @Bean
  fun dataSource(
    @Value("\${db.url}") url: String,
    @Value("\${db.username}") username: String,
    @Value("\${db.password}") password: String
  ): DataSource {
    val config = HikariConfig().apply {
      jdbcUrl = url
      this.username = username
      this.password = password
      maximumPoolSize = 20
      minimumIdle = 5
      connectionTimeout = 30000
      validationTimeout = 5000
    }
    return HikariDataSource(config)
  }

  @Bean
  fun jdbcTemplate(dataSource: DataSource): JdbcTemplate = JdbcTemplate(dataSource)
}

// infrastructure/config/TransactionConfig.kt
@Configuration
@EnableTransactionManagement
class TransactionConfig {

  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)
}
```

### Externalized Configuration

Use properties files and environment variables for configuration management.

**application.properties**:

```properties
# Database Configuration
db.url=jdbc:postgresql://localhost:5432/ose_platform
db.username=ose_user
db.password=${DB_PASSWORD:changeme}
db.pool.max-size=20
db.pool.min-idle=5

# Zakat Configuration
zakat.rate=0.025
zakat.nisab.gold-grams=85
zakat.nisab.silver-grams=595
zakat.nisab.currency=USD

# Murabaha Configuration
murabaha.profit-rate.min=0.01
murabaha.profit-rate.max=0.15
murabaha.asset.min-value=1000

# Logging
logging.level.com.oseplatform=INFO
logging.level.org.springframework.jdbc=DEBUG
```

**Java Example** (Type-Safe Configuration):

```java
@Component
@ConfigurationProperties(prefix = "zakat")
public class ZakatConfigurationProperties {
  private BigDecimal rate;
  private Nisab nisab;
  private Calculation calculation;

  // Getters and setters
  public BigDecimal getRate() {
    return rate;
  }

  public void setRate(BigDecimal rate) {
    this.rate = rate;
  }

  public Nisab getNisab() {
    return nisab;
  }

  public void setNisab(Nisab nisab) {
    this.nisab = nisab;
  }

  public Calculation getCalculation() {
    return calculation;
  }

  public void setCalculation(Calculation calculation) {
    this.calculation = calculation;
  }

  public static class Nisab {
    private BigDecimal goldGrams;
    private BigDecimal silverGrams;
    private String currency;

    // Getters and setters
    public BigDecimal getGoldGrams() {
      return goldGrams;
    }

    public void setGoldGrams(BigDecimal goldGrams) {
      this.goldGrams = goldGrams;
    }

    public BigDecimal getSilverGrams() {
      return silverGrams;
    }

    public void setSilverGrams(BigDecimal silverGrams) {
      this.silverGrams = silverGrams;
    }

    public String getCurrency() {
      return currency;
    }

    public void setCurrency(String currency) {
      this.currency = currency;
    }
  }

  public static class Calculation {
    private RoundingMode roundingMode;
    private int precision;

    // Getters and setters
    public RoundingMode getRoundingMode() {
      return roundingMode;
    }

    public void setRoundingMode(RoundingMode roundingMode) {
      this.roundingMode = roundingMode;
    }

    public int getPrecision() {
      return precision;
    }

    public void setPrecision(int precision) {
      this.precision = precision;
    }
  }
}
```

**Kotlin Example** (Type-Safe Configuration):

```kotlin
@Component
@ConfigurationProperties(prefix = "zakat")
data class ZakatConfigurationProperties(
  var rate: BigDecimal = BigDecimal.ZERO,
  var nisab: Nisab = Nisab(),
  var calculation: Calculation = Calculation()
) {
  data class Nisab(
    var goldGrams: BigDecimal = BigDecimal.ZERO,
    var silverGrams: BigDecimal = BigDecimal.ZERO,
    var currency: String = "USD"
  )

  data class Calculation(
    var roundingMode: RoundingMode = RoundingMode.HALF_UP,
    var precision: Int = 2
  )
}
```

### Why Constructor Injection

Constructor injection ensures:

- **Immutability** - Dependencies are final/val
- **Testability** - Easy to mock dependencies in unit tests
- **Required Dependencies** - Compile-time guarantee of dependency availability
- **Thread Safety** - Immutable fields are thread-safe

**Java Example** (Murabaha Service):

```java
@Service
public class MurabahaContractService {
  // Final fields - immutable after construction
  private final MurabahaContractRepository repository;
  private final ProfitRateCalculator profitRateCalculator;
  private final ContractValidator contractValidator;
  private final ApplicationEventPublisher eventPublisher;

  // Constructor injection - all dependencies required
  public MurabahaContractService(
    MurabahaContractRepository repository,
    ProfitRateCalculator profitRateCalculator,
    ContractValidator contractValidator,
    ApplicationEventPublisher eventPublisher
  ) {
    this.repository = repository;
    this.profitRateCalculator = profitRateCalculator;
    this.contractValidator = contractValidator;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public MurabahaContractResponse createContract(CreateContractRequest request) {
    // Validate request
    ValidationResult validation = contractValidator.validate(request);
    if (validation.hasErrors()) {
      throw new ContractValidationException(validation.errors());
    }

    // Calculate profit
    BigDecimal totalProfit = profitRateCalculator.calculate(
      request.assetCost(),
      request.profitRate(),
      request.termMonths()
    );

    // Create contract
    MurabahaContract contract = MurabahaContract.create(
      request.assetCost(),
      request.downPayment(),
      request.profitRate(),
      request.termMonths(),
      totalProfit
    );

    // Persist
    repository.save(contract);

    // Publish event
    eventPublisher.publishEvent(new ContractCreatedEvent(contract.getId()));

    return toResponse(contract);
  }

  private MurabahaContractResponse toResponse(MurabahaContract contract) {
    return new MurabahaContractResponse(
      contract.getId(),
      contract.getAssetCost(),
      contract.getTotalAmount(),
      contract.getStatus(),
      contract.getCreatedAt()
    );
  }
}
```

**Kotlin Example** (Murabaha Service):

```kotlin
@Service
class MurabahaContractService(
  // Val properties - immutable after construction
  private val repository: MurabahaContractRepository,
  private val profitRateCalculator: ProfitRateCalculator,
  private val contractValidator: ContractValidator,
  private val eventPublisher: ApplicationEventPublisher
) {

  @Transactional
  fun createContract(request: CreateContractRequest): MurabahaContractResponse {
    // Validate request
    val validation = contractValidator.validate(request)
    if (validation.hasErrors()) {
      throw ContractValidationException(validation.errors())
    }

    // Calculate profit
    val totalProfit = profitRateCalculator.calculate(
      request.assetCost,
      request.profitRate,
      request.termMonths
    )

    // Create contract
    val contract = MurabahaContract.create(
      request.assetCost,
      request.downPayment,
      request.profitRate,
      request.termMonths,
      totalProfit
    )

    // Persist
    repository.save(contract)

    // Publish event
    eventPublisher.publishEvent(ContractCreatedEvent(contract.id))

    return contract.toResponse()
  }

  private fun MurabahaContract.toResponse(): MurabahaContractResponse = MurabahaContractResponse(
    id,
    assetCost,
    totalAmount,
    status,
    createdAt
  )
}
```

### Avoiding Field Injection

**❌ Bad Practice** (Field Injection):

```java
@Service
public class ZakatCalculationService {
  @Autowired  // Avoid field injection
  private ZakatCalculator calculator;

  @Autowired  // Avoid field injection
  private ZakatCalculationRepository repository;

  // Cannot create immutable fields
  // Difficult to test without Spring container
  // No compile-time guarantee of dependency availability
}
```

**✅ Good Practice** (Constructor Injection):

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;

  // Constructor injection
  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository
  ) {
    this.calculator = calculator;
    this.repository = repository;
  }

  // Immutable fields
  // Easy to test with mock dependencies
  // Compile-time guarantee of dependencies
}
```

### Consistent Naming

Use consistent, descriptive bean names that reflect their purpose.

**Naming Patterns**:

- **Services**: `[Entity]Service` - `ZakatCalculationService`, `MurabahaContractService`
- **Repositories**: `[Entity]Repository` or `Jdbc[Entity]Repository` - `ZakatCalculationRepository`, `JdbcDonationRepository`
- **Controllers**: `[Entity]Controller` - `ZakatCalculationController`, `DonationController`
- **Validators**: `[Entity]Validator` - `ContractValidator`, `DonationValidator`
- **Calculators**: `[Domain]Calculator` - `ZakatCalculator`, `ProfitRateCalculator`
- **Factories**: `[Entity]Factory` - `MurabahaContractFactory`

**Java Example**:

```java
@Service("zakatCalculationService")  // Explicit bean name (optional)
public class ZakatCalculationService {
  // Implementation
}

@Repository("jdbcZakatCalculationRepository")  // Explicit bean name
public class JdbcZakatCalculationRepository implements ZakatCalculationRepository {
  // Implementation
}

@Component("goldPriceApiClient")  // Explicit bean name
public class GoldPriceApiClient {
  // Implementation
}
```

**Kotlin Example**:

```kotlin
@Service("zakatCalculationService")  // Explicit bean name (optional)
class ZakatCalculationService {
  // Implementation
}

@Repository("jdbcZakatCalculationRepository")  // Explicit bean name
class JdbcZakatCalculationRepository : ZakatCalculationRepository {
  // Implementation
}

@Component("goldPriceApiClient")  // Explicit bean name
class GoldPriceApiClient {
  // Implementation
}
```

### Declarative Transactions

Use `@Transactional` annotation for declarative transaction management.

**Best Practices**:

- Place `@Transactional` on service layer methods (not repositories)
- Use `readOnly = true` for read operations to optimize performance
- Specify propagation and isolation levels explicitly when needed
- Keep transactions short and focused

**Java Example** (Donation Service):

```java
@Service
public class DonationService {
  private final DonationRepository repository;
  private final DonorRepository donorRepository;
  private final NotificationService notificationService;

  public DonationService(
    DonationRepository repository,
    DonorRepository donorRepository,
    NotificationService notificationService
  ) {
    this.repository = repository;
    this.donorRepository = donorRepository;
    this.notificationService = notificationService;
  }

  // Write transaction - default propagation (REQUIRED)
  @Transactional
  public DonationResponse recordDonation(RecordDonationRequest request) {
    // Find or create donor
    Donor donor = donorRepository.findByEmail(request.donorEmail())
      .orElseGet(() -> {
        Donor newDonor = Donor.create(request.donorEmail(), request.donorName());
        donorRepository.save(newDonor);
        return newDonor;
      });

    // Create donation
    Donation donation = Donation.create(
      request.amount(),
      request.category(),
      donor.getId(),
      LocalDate.now()
    );

    repository.save(donation);

    // Send notification (non-transactional)
    try {
      notificationService.sendDonationReceipt(donor.getEmail(), donation);
    } catch (Exception e) {
      // Log error but don't rollback transaction
      logger.error("Failed to send donation receipt", e);
    }

    return toResponse(donation);
  }

  // Read-only transaction for optimization
  @Transactional(readOnly = true)
  public Optional<DonationResponse> findById(String id) {
    return repository.findById(DonationId.of(id))
      .map(this::toResponse);
  }

  // Read-only transaction with explicit timeout
  @Transactional(readOnly = true, timeout = 30)
  public List<DonationResponse> findDonationsByDateRange(
    LocalDate startDate,
    LocalDate endDate
  ) {
    return repository.findByDateRange(startDate, endDate).stream()
      .map(this::toResponse)
      .toList();
  }

  // New transaction for independent operation
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void archiveOldDonations(LocalDate beforeDate) {
    List<Donation> oldDonations = repository.findByDateBefore(beforeDate);
    repository.archiveDonations(oldDonations);
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId().getValue(),
      donation.getAmount(),
      donation.getCategory(),
      donation.getDonorId(),
      donation.getDonationDate()
    );
  }
}
```

**Kotlin Example** (Donation Service):

```kotlin
@Service
class DonationService(
  private val repository: DonationRepository,
  private val donorRepository: DonorRepository,
  private val notificationService: NotificationService
) {
  companion object {
    private val logger = LoggerFactory.getLogger(DonationService::class.java)
  }

  // Write transaction - default propagation (REQUIRED)
  @Transactional
  fun recordDonation(request: RecordDonationRequest): DonationResponse {
    // Find or create donor
    val donor = donorRepository.findByEmail(request.donorEmail)
      ?: run {
        val newDonor = Donor.create(request.donorEmail, request.donorName)
        donorRepository.save(newDonor)
        newDonor
      }

    // Create donation
    val donation = Donation.create(
      request.amount,
      request.category,
      donor.id,
      LocalDate.now()
    )

    repository.save(donation)

    // Send notification (non-transactional)
    try {
      notificationService.sendDonationReceipt(donor.email, donation)
    } catch (e: Exception) {
      // Log error but don't rollback transaction
      logger.error("Failed to send donation receipt", e)
    }

    return donation.toResponse()
  }

  // Read-only transaction for optimization
  @Transactional(readOnly = true)
  fun findById(id: String): DonationResponse? {
    return repository.findById(DonationId.of(id))
      ?.toResponse()
  }

  // Read-only transaction with explicit timeout
  @Transactional(readOnly = true, timeout = 30)
  fun findDonationsByDateRange(
    startDate: LocalDate,
    endDate: LocalDate
  ): List<DonationResponse> {
    return repository.findByDateRange(startDate, endDate)
      .map { it.toResponse() }
  }

  // New transaction for independent operation
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  fun archiveOldDonations(beforeDate: LocalDate) {
    val oldDonations = repository.findByDateBefore(beforeDate)
    repository.archiveDonations(oldDonations)
  }

  private fun Donation.toResponse(): DonationResponse = DonationResponse(
    id.value,
    amount,
    category,
    donorId,
    donationDate
  )
}
```

### Controller Advice for Global Exception Handling

**Java Example**:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleEntityNotFound(
    EntityNotFoundException ex,
    HttpServletRequest request
  ) {
    logger.warn("Entity not found: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.NOT_FOUND.value(),
      "Entity Not Found",
      ex.getMessage(),
      request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<ErrorResponse> handleValidationError(
    ValidationException ex,
    HttpServletRequest request
  ) {
    logger.warn("Validation failed: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.BAD_REQUEST.value(),
      "Validation Failed",
      ex.getMessage(),
      request.getRequestURI(),
      ex.getErrors()
    );

    return ResponseEntity.badRequest().body(error);
  }

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> handleDataAccessException(
    DataAccessException ex,
    HttpServletRequest request
  ) {
    logger.error("Database error", ex);

    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.INTERNAL_SERVER_ERROR.value(),
      "Database Error",
      "An error occurred while accessing the database",
      request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGlobalException(
    Exception ex,
    HttpServletRequest request
  ) {
    logger.error("Unexpected error", ex);

    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.INTERNAL_SERVER_ERROR.value(),
      "Internal Server Error",
      "An unexpected error occurred",
      request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }
}

public record ErrorResponse(
  Instant timestamp,
  int status,
  String error,
  String message,
  String path,
  List<String> validationErrors
) {
  public ErrorResponse(Instant timestamp, int status, String error, String message, String path) {
    this(timestamp, status, error, message, path, List.of());
  }
}
```

**Kotlin Example**:

```kotlin
@ControllerAdvice
class GlobalExceptionHandler {
  companion object {
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
  }

  @ExceptionHandler(EntityNotFoundException::class)
  fun handleEntityNotFound(
    ex: EntityNotFoundException,
    request: HttpServletRequest
  ): ResponseEntity<ErrorResponse> {
    logger.warn("Entity not found: {}", ex.message)

    val error = ErrorResponse(
      timestamp = Instant.now(),
      status = HttpStatus.NOT_FOUND.value(),
      error = "Entity Not Found",
      message = ex.message ?: "Entity not found",
      path = request.requestURI
    )

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
  }

  @ExceptionHandler(ValidationException::class)
  fun handleValidationError(
    ex: ValidationException,
    request: HttpServletRequest
  ): ResponseEntity<ErrorResponse> {
    logger.warn("Validation failed: {}", ex.message)

    val error = ErrorResponse(
      timestamp = Instant.now(),
      status = HttpStatus.BAD_REQUEST.value(),
      error = "Validation Failed",
      message = ex.message ?: "Validation failed",
      path = request.requestURI,
      validationErrors = ex.errors
    )

    return ResponseEntity.badRequest().body(error)
  }

  @ExceptionHandler(DataAccessException::class)
  fun handleDataAccessException(
    ex: DataAccessException,
    request: HttpServletRequest
  ): ResponseEntity<ErrorResponse> {
    logger.error("Database error", ex)

    val error = ErrorResponse(
      timestamp = Instant.now(),
      status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
      error = "Database Error",
      message = "An error occurred while accessing the database",
      path = request.requestURI
    )

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
  }

  @ExceptionHandler(Exception::class)
  fun handleGlobalException(
    ex: Exception,
    request: HttpServletRequest
  ): ResponseEntity<ErrorResponse> {
    logger.error("Unexpected error", ex)

    val error = ErrorResponse(
      timestamp = Instant.now(),
      status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
      error = "Internal Server Error",
      message = "An unexpected error occurred",
      path = request.requestURI
    )

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
  }
}

data class ErrorResponse(
  val timestamp: Instant,
  val status: Int,
  val error: String,
  val message: String,
  val path: String,
  val validationErrors: List<String> = emptyList()
)
```

### Unit Testing (Without Spring Context)

**Java Example**:

```java
class ZakatCalculationTest {

  @Test
  void calculate_wealthAboveNisab_calculatesCorrectZakat() {
    // Given
    Money wealth = Money.of(new BigDecimal("10000"), "USD");
    Money nisab = Money.of(new BigDecimal("5000"), "USD");
    ZakatRate rate = ZakatRate.of(new BigDecimal("0.025"));

    // When
    ZakatCalculation calculation = ZakatCalculation.calculate(
      "zakat-123",
      wealth,
      nisab,
      rate,
      LocalDate.now()
    );

    // Then
    assertThat(calculation.getZakatAmount().getAmount())
      .isEqualByComparingTo(new BigDecimal("250.00"));
    assertThat(calculation.isEligible()).isTrue();
  }

  @Test
  void calculate_wealthBelowNisab_notEligibleForZakat() {
    // Given
    Money wealth = Money.of(new BigDecimal("3000"), "USD");
    Money nisab = Money.of(new BigDecimal("5000"), "USD");
    ZakatRate rate = ZakatRate.of(new BigDecimal("0.025"));

    // When
    ZakatCalculation calculation = ZakatCalculation.calculate(
      "zakat-123",
      wealth,
      nisab,
      rate,
      LocalDate.now()
    );

    // Then
    assertThat(calculation.getZakatAmount().getAmount())
      .isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(calculation.isEligible()).isFalse();
  }
}
```

**Kotlin Example**:

```kotlin
class ZakatCalculationTest {

  @Test
  fun `calculate wealth above nisab calculates correct zakat`() {
    // Given
    val wealth = Money.of(BigDecimal("10000"), "USD")
    val nisab = Money.of(BigDecimal("5000"), "USD")
    val rate = ZakatRate.of(BigDecimal("0.025"))

    // When
    val calculation = ZakatCalculation.calculate(
      id = "zakat-123",
      wealth = wealth,
      nisab = nisab,
      rate = rate,
      calculationDate = LocalDate.now()
    )

    // Then
    assertThat(calculation.zakatAmount.amount).isEqualByComparingTo(BigDecimal("250.00"))
    assertThat(calculation.eligible).isTrue()
  }

  @Test
  fun `calculate wealth below nisab not eligible for zakat`() {
    // Given
    val wealth = Money.of(BigDecimal("3000"), "USD")
    val nisab = Money.of(BigDecimal("5000"), "USD")
    val rate = ZakatRate.of(BigDecimal("0.025"))

    // When
    val calculation = ZakatCalculation.calculate(
      id = "zakat-123",
      wealth = wealth,
      nisab = nisab,
      rate = rate,
      calculationDate = LocalDate.now()
    )

    // Then
    assertThat(calculation.zakatAmount.amount).isEqualByComparingTo(BigDecimal.ZERO)
    assertThat(calculation.eligible).isFalse()
  }
}
```

### Integration Testing (With Spring Context)

**Java Example**:

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
@Transactional
class ZakatCalculationServiceIntegrationTest {

  @Autowired
  private ZakatCalculationService service;

  @Autowired
  private ZakatCalculationRepository repository;

  @Test
  void calculate_validRequest_savesCalculation() {
    // Given
    CreateZakatCalculationRequest request = new CreateZakatCalculationRequest(
      new BigDecimal("10000"),
      new BigDecimal("5000"),
      LocalDate.now()
    );

    // When
    ZakatCalculationResponse response = service.calculate(request);

    // Then
    assertThat(response.zakatAmount()).isEqualByComparingTo("250.00");
    assertThat(response.eligible()).isTrue();

    // Verify persistence
    Optional<ZakatCalculation> saved = repository.findById(response.id());
    assertThat(saved).isPresent();
    assertThat(saved.get().getZakatAmount().getAmount())
      .isEqualByComparingTo("250.00");
  }
}
```

**Kotlin Example**:

```kotlin
@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [TestConfig::class])
@Transactional
class ZakatCalculationServiceIntegrationTest {

  @Autowired
  private lateinit var service: ZakatCalculationService

  @Autowired
  private lateinit var repository: ZakatCalculationRepository

  @Test
  fun `calculate valid request saves calculation`() {
    // Given
    val request = CreateZakatCalculationRequest(
      wealth = BigDecimal("10000"),
      nisab = BigDecimal("5000"),
      calculationDate = LocalDate.now()
    )

    // When
    val response = service.calculate(request)

    // Then
    assertThat(response.zakatAmount).isEqualByComparingTo("250.00")
    assertThat(response.eligible).isTrue()

    // Verify persistence
    val saved = repository.findById(response.id)
    assertThat(saved).isPresent
    assertThat(saved.get().zakatAmount.amount).isEqualByComparingTo("250.00")
  }
}
```

## Logging Best Practices

**Java Example**:

```java
@Service
public class MurabahaContractService {
  private static final Logger logger = LoggerFactory.getLogger(MurabahaContractService.class);

  private final MurabahaContractRepository repository;

  public MurabahaContractService(MurabahaContractRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public MurabahaContractResponse createContract(CreateContractRequest request) {
    logger.info("Creating Murabaha contract for asset cost: {}", request.assetCost());

    try {
      MurabahaContract contract = MurabahaContract.create(
        request.assetCost(),
        request.downPayment(),
        request.profitRate(),
        request.termMonths()
      );

      repository.save(contract);

      logger.info("Murabaha contract created successfully: {}", contract.getId());

      return toResponse(contract);
    } catch (ContractValidationException e) {
      logger.error("Contract validation failed: {}", e.getMessage());
      throw e;
    } catch (Exception e) {
      logger.error("Unexpected error creating contract", e);
      throw new ContractCreationException("Failed to create contract", e);
    }
  }

  private MurabahaContractResponse toResponse(MurabahaContract contract) {
    return new MurabahaContractResponse(
      contract.getId(),
      contract.getAssetCost(),
      contract.getTotalAmount(),
      contract.getStatus(),
      contract.getCreatedAt()
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class MurabahaContractService(
  private val repository: MurabahaContractRepository
) {
  companion object {
    private val logger = LoggerFactory.getLogger(MurabahaContractService::class.java)
  }

  @Transactional
  fun createContract(request: CreateContractRequest): MurabahaContractResponse {
    logger.info("Creating Murabaha contract for asset cost: {}", request.assetCost)

    try {
      val contract = MurabahaContract.create(
        request.assetCost,
        request.downPayment,
        request.profitRate,
        request.termMonths
      )

      repository.save(contract)

      logger.info("Murabaha contract created successfully: {}", contract.id)

      return contract.toResponse()
    } catch (e: ContractValidationException) {
      logger.error("Contract validation failed: {}", e.message)
      throw e
    } catch (e: Exception) {
      logger.error("Unexpected error creating contract", e)
      throw ContractCreationException("Failed to create contract", e)
    }
  }

  private fun MurabahaContract.toResponse(): MurabahaContractResponse = MurabahaContractResponse(
    id,
    assetCost,
    totalAmount,
    status,
    createdAt
  )
}
```

### Connection Pooling

**Java Example** (HikariCP Configuration):

```java
@Configuration
public class DataSourceConfig {

  @Bean
  public DataSource dataSource(
    @Value("${db.url}") String url,
    @Value("${db.username}") String username,
    @Value("${db.password}") String password
  ) {
    HikariConfig config = new HikariConfig();

    // Connection properties
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);

    // Pool size configuration
    config.setMaximumPoolSize(20);  // Maximum connections
    config.setMinimumIdle(5);       // Minimum idle connections

    // Timeout configuration
    config.setConnectionTimeout(30000);    // 30 seconds
    config.setIdleTimeout(600000);         // 10 minutes
    config.setMaxLifetime(1800000);        // 30 minutes

    // Validation
    config.setValidationTimeout(5000);     // 5 seconds
    config.setConnectionTestQuery("SELECT 1");

    // Performance optimization
    config.setAutoCommit(false);  // Manual transaction management
    config.setCachePrepStmts(true);
    config.setPrepStmtCacheSize(250);
    config.setPrepStmtCacheSqlLimit(2048);

    return new HikariDataSource(config);
  }
}
```

**Kotlin Example** (HikariCP Configuration):

```kotlin
@Configuration
class DataSourceConfig {

  @Bean
  fun dataSource(
    @Value("\${db.url}") url: String,
    @Value("\${db.username}") username: String,
    @Value("\${db.password}") password: String
  ): DataSource {
    val config = HikariConfig().apply {
      // Connection properties
      jdbcUrl = url
      this.username = username
      this.password = password

      // Pool size configuration
      maximumPoolSize = 20  // Maximum connections
      minimumIdle = 5       // Minimum idle connections

      // Timeout configuration
      connectionTimeout = 30000    // 30 seconds
      idleTimeout = 600000         // 10 minutes
      maxLifetime = 1800000        // 30 minutes

      // Validation
      validationTimeout = 5000     // 5 seconds
      connectionTestQuery = "SELECT 1"

      // Performance optimization
      isAutoCommit = false  // Manual transaction management
      addDataSourceProperty("cachePrepStmts", "true")
      addDataSourceProperty("prepStmtCacheSize", "250")
      addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
    }

    return HikariDataSource(config)
  }
}
```

### Caching

**Java Example** (Spring Cache):

```java
@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    SimpleCacheManager cacheManager = new SimpleCacheManager();
    cacheManager.setCaches(Arrays.asList(
      new ConcurrentMapCache("zakatCalculations"),
      new ConcurrentMapCache("nisabValues"),
      new ConcurrentMapCache("donationCategories")
    ));
    return cacheManager;
  }
}

@Service
public class NisabService {
  private static final Logger logger = LoggerFactory.getLogger(NisabService.class);

  private final GoldPriceApiClient goldPriceClient;

  public NisabService(GoldPriceApiClient goldPriceClient) {
    this.goldPriceClient = goldPriceClient;
  }

  @Cacheable(value = "nisabValues", key = "#currency")
  public Money calculateCurrentNisab(String currency) {
    logger.info("Calculating nisab for currency: {}", currency);

    BigDecimal goldPricePerGram = goldPriceClient.getCurrentPrice(currency);
    BigDecimal nisabGoldGrams = new BigDecimal("85");

    BigDecimal nisabValue = goldPricePerGram.multiply(nisabGoldGrams);

    return Money.of(nisabValue, currency);
  }

  @CacheEvict(value = "nisabValues", allEntries = true)
  public void clearNisabCache() {
    logger.info("Clearing nisab cache");
  }
}
```

**Kotlin Example** (Spring Cache):

```kotlin
@Configuration
@EnableCaching
class CacheConfig {

  @Bean
  fun cacheManager(): CacheManager {
    val cacheManager = SimpleCacheManager()
    cacheManager.setCaches(listOf(
      ConcurrentMapCache("zakatCalculations"),
      ConcurrentMapCache("nisabValues"),
      ConcurrentMapCache("donationCategories")
    ))
    return cacheManager
  }
}

@Service
class NisabService(
  private val goldPriceClient: GoldPriceApiClient
) {
  companion object {
    private val logger = LoggerFactory.getLogger(NisabService::class.java)
  }

  @Cacheable(value = ["nisabValues"], key = "#currency")
  fun calculateCurrentNisab(currency: String): Money {
    logger.info("Calculating nisab for currency: $currency")

    val goldPricePerGram = goldPriceClient.getCurrentPrice(currency)
    val nisabGoldGrams = BigDecimal("85")

    val nisabValue = goldPricePerGram * nisabGoldGrams

    return Money.of(nisabValue, currency)
  }

  @CacheEvict(value = ["nisabValues"], allEntries = true)
  fun clearNisabCache() {
    logger.info("Clearing nisab cache")
  }
}
```

### Proper Resource Cleanup

**Java Example**:

```java
@Component
public class DonationReportGenerator {
  private static final Logger logger = LoggerFactory.getLogger(DonationReportGenerator.class);

  private final DonationRepository repository;

  public DonationReportGenerator(DonationRepository repository) {
    this.repository = repository;
  }

  public void generatePdfReport(YearMonth month, OutputStream outputStream) throws IOException {
    logger.info("Generating PDF report for month: {}", month);

    // Use try-with-resources for automatic resource management
    try (
      PdfWriter writer = new PdfWriter(outputStream);
      PdfDocument pdfDoc = new PdfDocument(writer)
    ) {
      List<Donation> donations = repository.findByMonth(month);

      // Generate PDF content
      for (Donation donation : donations) {
        // Write donation data to PDF
      }

      logger.info("PDF report generated successfully for {} donations", donations.size());
    } catch (IOException e) {
      logger.error("Error generating PDF report", e);
      throw e;
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Component
class DonationReportGenerator(
  private val repository: DonationRepository
) {
  companion object {
    private val logger = LoggerFactory.getLogger(DonationReportGenerator::class.java)
  }

  fun generatePdfReport(month: YearMonth, outputStream: OutputStream) {
    logger.info("Generating PDF report for month: $month")

    // Use Kotlin's use extension for automatic resource management
    PdfWriter(outputStream).use { writer ->
      PdfDocument(writer).use { pdfDoc ->
        val donations = repository.findByMonth(month)

        // Generate PDF content
        donations.forEach { donation ->
          // Write donation data to PDF
        }

        logger.info("PDF report generated successfully for ${donations.size} donations")
      }
    }
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Idioms](idioms.md)** - Framework patterns
- **[Anti-Patterns](anti-patterns.md)** - Common mistakes
- **[Configuration](configuration.md)** - Configuration approaches
- **[Testing](testing.md)** - Testing strategies

### Development Practices

- **[Code Quality Standards](../../../../../../governance/development/quality/code.md)** - Quality requirements
- **[Implementation Workflow](../../../../../../governance/development/workflow/implementation.md)** - Development process

## See Also

**OSE Explanation Foundation**:

- [Java Best Practices](../../../programming-languages/java/coding-standards.md) - Java baseline standards
- [Spring Framework Idioms](./idioms.md) - Core Spring patterns
- [Spring Framework Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid
- [Spring Framework Testing](./testing.md) - Testing strategies

**Spring Boot Extension**:

- [Spring Boot Best Practices](../jvm-spring-boot/best-practices.md) - Auto-configured standards

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
