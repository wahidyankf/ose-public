---
title: "Spring Boot Best Practices"
description: Production-ready Spring Boot development standards and proven approaches
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - best-practices
  - production
  - code-quality
  - standards
related:
  - ./ex-soen-plwe-jvspbo__idioms.md
  - ./ex-soen-plwe-jvspbo__anti-patterns.md
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
updated: 2026-01-25
---

### Project Organization

- [Project Structure](#project-structure) - Package organization and layering
- [Dependency Management](#dependency-management) - Managing dependencies
- [Configuration Management](#configuration-management) - Externalized config

### Code Quality

- [Dependency Injection](#dependency-injection) - Constructor injection patterns
- [Naming Conventions](#naming-conventions) - Clear, descriptive names
- [Error Handling](#error-handling) - Exception handling strategies
- [Logging](#logging) - Effective logging practices

### Data and Persistence

- [Data Access](#data-access-patterns) - Repository and query patterns
- [Transaction Management](#transaction-management) - @Transactional usage
- [Database Migrations](#database-migrations) - Flyway/Liquibase

### API Design

- [REST API Design](#rest-api-design) - RESTful conventions
- [Request Validation](#request-validation) - Input validation
- [Response DTOs](#response-dtos) - Proper API responses
- [Null Safety](#null-safety) - JSpecify + NullAway compile-time null checking

### Security

- [Security Configuration](#security-configuration) - Spring Security setup
- [Authentication](#authentication) - OAuth2, JWT patterns
- [Input Validation](#input-validation-and-sanitization) - Security boundaries

### Testing

- [Testing Strategy](#testing-strategy) - Unit, integration, E2E tests
- [Test Organization](#test-organization) - Test structure

### Production Readiness

- [Observability](#observability) - Monitoring and metrics
- [Performance](#performance-optimization) - Optimization techniques

## Overview

This document provides proven best practices for building production-ready Spring Boot applications in the open-sharia-enterprise platform. These practices emphasize maintainability, testability, security, and operational excellence.

### Package Organization

**Recommended: Package by Feature (Bounded Context)**

```
src/main/java/com/oseplatform/[domain]/
├── zakat/                              # Zakat bounded context
│   ├── ZakatCalculation.java          # Aggregate root
│   ├── ZakatCalculationService.java   # Application service
│   ├── ZakatCalculationRepository.java
│   ├── ZakatCalculationController.java
│   ├── dto/
│   │   ├── CreateZakatCalculationRequest.java
│   │   └── ZakatCalculationResponse.java
│   └── events/
│       └── ZakatCalculatedEvent.java
├── murabaha/                           # Murabaha contracts
│   ├── MurabahaContract.java
│   ├── MurabahaContractService.java
│   ├── MurabahaContractRepository.java
│   └── MurabahaContractController.java
├── shared/                             # Shared kernel
│   ├── Money.java                     # Value objects
│   ├── Email.java
│   └── AuditMetadata.java
└── config/                             # Cross-cutting configuration
    ├── SecurityConfig.java
    ├── DatabaseConfig.java
    └── ObservabilityConfig.java
```

**Alternative: Layered Architecture**

```
src/main/java/com/oseplatform/[domain]/
├── domain/                    # Domain layer
│   ├── model/                # Entities, value objects
│   ├── repository/           # Repository interfaces
│   └── service/              # Domain services
├── application/              # Application layer
│   ├── service/             # Application services
│   ├── dto/                 # DTOs
│   └── usecase/             # Use cases
├── infrastructure/           # Infrastructure
│   ├── persistence/         # JPA implementations
│   ├── messaging/           # Event publishers
│   └── integration/         # External clients
└── api/                      # API layer
    ├── rest/                # REST controllers
    └── exception/           # Exception handlers
```

**Best Practice**: Choose package-by-feature for domain-driven microservices, layered for larger monoliths.

### Resource Organization

```
src/main/resources/
├── application.yml              # Main configuration
├── application-dev.yml          # Dev profile
├── application-prod.yml         # Production profile
├── db/
│   └── migration/              # Flyway migrations
│       ├── V1__initial_schema.sql
│       ├── V2__add_zakat_table.sql
│       └── V3__add_murabaha_table.sql
├── static/                     # Static resources
└── templates/                  # Templates (if using server-side rendering)
```

### Use Spring Boot Starters

**PASS**:

```kotlin
dependencies {
    // Spring Boot starters - curated dependencies
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Database
    runtimeOnly("org.postgresql:postgresql")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

**FAIL**:

```kotlin
dependencies {
    // ❌ Don't include individual libraries when starters exist
    implementation("org.springframework:spring-web")
    implementation("org.springframework:spring-webmvc")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    // ... many more individual dependencies
}
```

### Version Management

**PASS** - Use Spring Boot BOM:

```kotlin
// build.gradle.kts
plugins {
    id("org.springframework.boot") version "3.3.0"
    id("io.spring.dependency-management") version "1.1.4"
}

dependencies {
    // Versions managed by Spring Boot BOM
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
}
```

**Use Gradle Version Catalog**:

```toml
# gradle/libs.versions.toml
[versions]
springBoot = "3.3.0"
postgresql = "42.7.2"
flyway = "10.8.1"

[libraries]
spring-boot-web = { module = "org.springframework.boot:spring-boot-starter-web" }
postgresql = { module = "org.postgresql:postgresql", version.ref = "postgresql" }
flyway-core = { module = "org.flywaydb:flyway-core", version.ref = "flyway" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "springBoot" }
```

### Externalize Configuration

**PASS** - Environment variables for sensitive data:

```yaml
# application.yml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ose}
    username: ${DATABASE_USERNAME:dev_user}
    password: ${DATABASE_PASSWORD:dev_password}

ose:
  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration-ms: ${JWT_EXPIRATION_MS:3600000}

  payment:
    gateway:
      api-key: ${PAYMENT_GATEWAY_API_KEY}
      api-url: ${PAYMENT_GATEWAY_URL}
```

**FAIL** - Hardcoded secrets:

```yaml
# ❌ Never commit secrets
spring:
  datasource:
    url: jdbc:postgresql://prod-db.example.com:5432/ose
    username: prod_user
    password: SuperSecretPassword123! # ❌ NEVER DO THIS

ose:
  security:
    jwt:
      secret: MyHardcodedJWTSecret # ❌ NEVER DO THIS
```

### Use Type-Safe Configuration Properties

**PASS**:

```java
@ConfigurationProperties(prefix = "ose.zakat")
@Validated
public class ZakatProperties {

    @NotNull
    private BigDecimal nisabPercentage = new BigDecimal("0.025");

    @Min(1)
    private int hawalDays = 354;  // Lunar year

    @NotNull
    private Currency defaultCurrency = Currency.getInstance("USD");

    // Getters and setters
}

@Configuration
@EnableConfigurationProperties(ZakatProperties.class)
public class ZakatConfig {
    // Properties auto-injected
}
```

**FAIL** - @Value for complex configuration:

```java
// ❌ Avoid @Value for grouped properties
@Service
public class ZakatService {
    @Value("${ose.zakat.nisab-percentage}")
    private BigDecimal nisabPercentage;

    @Value("${ose.zakat.hawal-days}")
    private int hawalDays;

    // Hard to test, no validation, scattered
}
```

### Profile-Specific Configuration

**Best Practices**:

1. **Common config** in `application.yml`
2. **Profile-specific** in `application-{profile}.yml`
3. **Activate via environment**: `SPRING_PROFILES_ACTIVE=prod`

```yaml
# application.yml (common)
spring:
  application:
    name: payment-service
  jpa:
    hibernate:
      ddl-auto: validate

# application-dev.yml
spring:
  jpa:
    show-sql: true
logging:
  level:
    com.oseplatform: DEBUG

# application-prod.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
logging:
  level:
    com.oseplatform: INFO
```

### Always Use Constructor Injection

**PASS**:

```java
@Service
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;
    private final ZakatProperties properties;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor injection - no @Autowired needed (Spring 4.3+)
    public ZakatCalculationService(
        ZakatCalculationRepository repository,
        ZakatProperties properties,
        ApplicationEventPublisher eventPublisher
    ) {
        this.repository = repository;
        this.properties = properties;
        this.eventPublisher = eventPublisher;
    }
}
```

**FAIL** - Field injection:

```java
// ❌ Avoid field injection
@Service
public class ZakatCalculationService {
    @Autowired  // Hard to test, hidden dependencies
    private ZakatCalculationRepository repository;

    @Autowired
    private ZakatProperties properties;
}
```

### Use @RequiredArgsConstructor (Lombok) Carefully

**PASS** - With final fields:

```java
@Service
@RequiredArgsConstructor  // Generates constructor for final fields
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;
    private final ZakatProperties properties;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor auto-generated
}
```

**Note**: Constructor injection without Lombok is more explicit and preferred for critical services.

### Class Names

- **Controllers**: `*Controller` - `ZakatCalculationController`
- **Services**: `*Service` - `ZakatCalculationService`
- **Repositories**: `*Repository` - `ZakatCalculationRepository`
- **DTOs**: `*Request`, `*Response` - `CreateZakatRequest`, `ZakatResponse`
- **Events**: `*Event` - `ZakatCalculatedEvent`
- **Exceptions**: `*Exception` - `ZakatNotFoundException`

### Method Names

**REST Controllers**:

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    // Use verbs for actions
    @PostMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(...) {}

    // Use nouns for resources
    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(...) {}

    @GetMapping
    public ResponseEntity<List<ZakatResponse>> list(...) {}
}
```

**Services**:

```java
@Service
public class ZakatCalculationService {

    // Action verbs
    public ZakatResponse calculate(CreateZakatRequest request) {}
    public void deleteCalculation(String id) {}

    // Query methods
    public Optional<ZakatResponse> findById(String id) {}
    public List<ZakatResponse> findByUserId(String userId) {}
}
```

**Repositories**:

```java
public interface ZakatCalculationRepository extends JpaRepository<ZakatCalculation, String> {

    // Spring Data query derivation
    List<ZakatCalculation> findByUserIdAndEligible(String userId, boolean eligible);
    Optional<ZakatCalculation> findByUserIdAndCalculationDate(String userId, LocalDate date);
    boolean existsByUserIdAndCalculationDateBetween(String userId, LocalDate start, LocalDate end);
}
```

### Use @ControllerAdvice for Global Exception Handling

**PASS**:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ZakatNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
        ZakatNotFoundException ex,
        WebRequest request
    ) {
        logger.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.NOT_FOUND.value())
            .error("Not Found")
            .message(ex.getMessage())
            .path(extractPath(request))
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ZakatValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
        ZakatValidationException ex,
        WebRequest request
    ) {
        logger.warn("Validation failed: {}", ex.getErrors());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Validation Failed")
            .message("Zakat calculation validation failed")
            .validationErrors(ex.getErrors())
            .path(extractPath(request))
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
        MethodArgumentNotValidException ex,
        WebRequest request
    ) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                error -> error.getDefaultMessage() != null
                    ? error.getDefaultMessage()
                    : "Invalid value"
            ));

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Invalid Request")
            .message("Request validation failed")
            .validationErrors(errors)
            .path(extractPath(request))
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
        Exception ex,
        WebRequest request
    ) {
        logger.error("Unexpected error occurred", ex);

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error("Internal Server Error")
            .message("An unexpected error occurred")
            .path(extractPath(request))
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String extractPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
```

### Custom Exception Hierarchy

```java
// Base exception
public abstract class OseBusinessException extends RuntimeException {
    protected OseBusinessException(String message) {
        super(message);
    }

    protected OseBusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}

// Domain-specific exceptions
public class ZakatNotFoundException extends OseBusinessException {
    public ZakatNotFoundException(String id) {
        super("Zakat calculation not found: " + id);
    }
}

public class ZakatValidationException extends OseBusinessException {
    private final Map<String, String> errors;

    public ZakatValidationException(Map<String, String> errors) {
        super("Zakat calculation validation failed");
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
```

### Use SLF4J with Logback

**PASS**:

```java
@Service
public class ZakatCalculationService {
    private final Logger logger = LoggerFactory.getLogger(ZakatCalculationService.class);

    private final ZakatCalculationRepository repository;

    @Transactional
    public ZakatResponse calculate(CreateZakatRequest request) {
        logger.debug("Calculating Zakat for wealth: {}, nisab: {}",
            request.wealth(), request.nisab());

        try {
            ZakatCalculation calculation = ZakatCalculation.calculate(
                request.wealth(),
                request.nisab(),
                request.calculationDate()
            );

            ZakatCalculation saved = repository.save(calculation);

            logger.info("Zakat calculated successfully. ID: {}, Amount: {}",
                saved.getId(), saved.getZakatAmount());

            return ZakatMapper.toResponse(saved);

        } catch (Exception ex) {
            logger.error("Failed to calculate Zakat for wealth: {}",
                request.wealth(), ex);
            throw ex;
        }
    }
}
```

### Logging Levels

- **ERROR**: Application errors requiring immediate attention
- **WARN**: Unexpected but recoverable situations
- **INFO**: Important business events (calculations, transactions)
- **DEBUG**: Detailed diagnostic information
- **TRACE**: Very detailed diagnostic information

### Structured Logging (Production)

```xml
<!-- logback-spring.xml -->
<configuration>
    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <includeContext>false</includeContext>
                <fieldNames>
                    <timestamp>timestamp</timestamp>
                    <message>message</message>
                    <logger>logger</logger>
                    <level>level</level>
                    <thread>thread</thread>
                </fieldNames>
            </encoder>
        </appender>

        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

### Repository Best Practices

**PASS** - Interface-based repositories:

```java
public interface ZakatCalculationRepository extends JpaRepository<ZakatCalculation, String> {

    // Query derivation
    List<ZakatCalculation> findByUserIdAndEligible(String userId, boolean eligible);

    // Custom query for complex logic
    @Query("""
        SELECT z FROM ZakatCalculation z
        WHERE z.userId = :userId
        AND z.calculationDate BETWEEN :startDate AND :endDate
        ORDER BY z.calculationDate DESC
        """)
    List<ZakatCalculation> findByUserIdAndDateRange(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Join fetch to prevent N+1
    @Query("SELECT z FROM ZakatCalculation z JOIN FETCH z.assets WHERE z.id = :id")
    Optional<ZakatCalculation> findByIdWithAssets(@Param("id") String id);

    // Projection for read models
    @Query("""
        SELECT new com.oseplatform.zakat.dto.ZakatSummary(
            z.id,
            z.zakatAmount,
            z.calculationDate
        )
        FROM ZakatCalculation z
        WHERE z.userId = :userId
        """)
    List<ZakatSummary> findSummariesByUserId(@Param("userId") String userId);
}
```

### Prevent N+1 Queries

**PASS** - Use JOIN FETCH:

```java
public interface MurabahaContractRepository extends JpaRepository<MurabahaContract, String> {

    @Query("SELECT c FROM MurabahaContract c JOIN FETCH c.payments WHERE c.id = :id")
    Optional<MurabahaContract> findByIdWithPayments(@Param("id") String id);
}
```

**PASS** - Use @EntityGraph:

```java
public interface MurabahaContractRepository extends JpaRepository<MurabahaContract, String> {

    @EntityGraph(attributePaths = {"payments", "customer"})
    Optional<MurabahaContract> findById(String id);
}
```

### Use Projections for Read Models

**PASS** - DTO projections:

```java
// Projection interface
public interface ZakatSummaryProjection {
    String getId();
    BigDecimal getZakatAmount();
    LocalDate getCalculationDate();
    boolean isEligible();
}

// Repository
public interface ZakatCalculationRepository extends JpaRepository<ZakatCalculation, String> {

    List<ZakatSummaryProjection> findByUserId(String userId);
}
```

### Use @Transactional Appropriately

**PASS**:

```java
@Service
public class ZakatCalculationService {

    // Write operation - needs transaction
    @Transactional
    public ZakatResponse calculate(CreateZakatRequest request) {
        ZakatCalculation calculation = ZakatCalculation.calculate(
            request.wealth(),
            request.nisab(),
            request.calculationDate()
        );

        ZakatCalculation saved = repository.save(calculation);
        eventPublisher.publishEvent(new ZakatCalculatedEvent(saved.getId()));

        return ZakatMapper.toResponse(saved);
    }

    // Read operation - read-only transaction
    @Transactional(readOnly = true)
    public Optional<ZakatResponse> findById(String id) {
        return repository.findById(id)
            .map(ZakatMapper::toResponse);
    }

    // Complex read - read-only optimization
    @Transactional(readOnly = true)
    public ZakatReport generateAnnualReport(String userId, int year) {
        List<ZakatCalculation> calculations = repository.findByUserIdAndYear(userId, year);
        // Complex aggregation logic
        return ZakatReportGenerator.generate(calculations);
    }
}
```

**Best Practices**:

- Use `@Transactional` on service layer, not controllers
- Use `readOnly=true` for queries (enables optimizations)
- Keep transactions short-lived
- Avoid long-running operations in transactions
- Let unchecked exceptions trigger rollback (default behavior)

### Use Flyway for Schema Management

**Project Structure**:

```
src/main/resources/db/migration/
├── V1__initial_schema.sql
├── V2__add_zakat_table.sql
├── V3__add_murabaha_table.sql
└── V4__add_indexes.sql
```

**Migration Example**:

```sql
-- V2__add_zakat_table.sql
CREATE TABLE zakat_calculations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    wealth DECIMAL(19, 2) NOT NULL,
    nisab DECIMAL(19, 2) NOT NULL,
    zakat_amount DECIMAL(19, 2) NOT NULL,
    eligible BOOLEAN NOT NULL,
    calculation_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_zakat_user_id ON zakat_calculations(user_id);
CREATE INDEX idx_zakat_calculation_date ON zakat_calculations(calculation_date);
```

**Configuration**:

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    validate-on-migrate: true
```

**Best Practices**:

- Never modify existing migrations
- Use versioned migrations (`V*`)
- Include rollback scripts for complex changes
- Test migrations on staging before production
- Keep migrations idempotent where possible

### Follow RESTful Conventions

**PASS**:

```java
@RestController
@RequestMapping("/api/v1/zakat")
@Validated
public class ZakatCalculationController {

    // POST /api/v1/zakat/calculations - Create
    @PostMapping("/calculations")
    public ResponseEntity<ZakatResponse> create(
        @Valid @RequestBody CreateZakatRequest request
    ) {
        ZakatResponse response = service.calculate(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.id())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    // GET /api/v1/zakat/calculations/{id} - Read one
    @GetMapping("/calculations/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/v1/zakat/calculations - Read many
    @GetMapping("/calculations")
    public ResponseEntity<Page<ZakatResponse>> list(
        @RequestParam(required = false) String userId,
        @RequestParam(required = false) Boolean eligible,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ZakatResponse> calculations = service.findAll(userId, eligible, pageable);
        return ResponseEntity.ok(calculations);
    }

    // PUT /api/v1/zakat/calculations/{id} - Update
    @PutMapping("/calculations/{id}")
    public ResponseEntity<ZakatResponse> update(
        @PathVariable String id,
        @Valid @RequestBody UpdateZakatRequest request
    ) {
        ZakatResponse response = service.update(id, request);
        return ResponseEntity.ok(response);
    }

    // DELETE /api/v1/zakat/calculations/{id} - Delete
    @DeleteMapping("/calculations/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### API Versioning

**URI Versioning** (Recommended):

```java
@RestController
@RequestMapping("/api/v1/zakat")  // Version in URI
public class ZakatCalculationController {
    // v1 endpoints
}

@RestController
@RequestMapping("/api/v2/zakat")  // New version
public class ZakatCalculationV2Controller {
    // v2 endpoints with breaking changes
}
```

### Use DTOs, Never Expose Entities

**PASS** - DTOs for API:

```java
// Request DTO
public record CreateZakatRequest(
    @NotNull @DecimalMin("0.0") BigDecimal wealth,
    @NotNull @DecimalMin("0.0") BigDecimal nisab,
    @NotNull LocalDate calculationDate
) {}

// Response DTO
public record ZakatResponse(
    String id,
    BigDecimal wealth,
    BigDecimal nisab,
    BigDecimal zakatAmount,
    boolean eligible,
    LocalDate calculationDate,
    Instant createdAt
) {}
```

**FAIL** - Exposing JPA entities:

```java
// ❌ Never expose JPA entities directly
@GetMapping("/{id}")
public ResponseEntity<ZakatCalculation> getById(@PathVariable String id) {
    return repository.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

### Use Bean Validation

**PASS**:

```java
public record CreateZakatRequest(
    @NotNull(message = "Wealth is required")
    @DecimalMin(value = "0.0", message = "Wealth cannot be negative")
    BigDecimal wealth,

    @NotNull(message = "Nisab is required")
    @DecimalMin(value = "0.01", message = "Nisab must be positive")
    BigDecimal nisab,

    @NotNull(message = "Calculation date is required")
    @PastOrPresent(message = "Calculation date cannot be in the future")
    LocalDate calculationDate
) {}

@RestController
@RequestMapping("/api/v1/zakat")
@Validated  // Enable validation
public class ZakatCalculationController {

    @PostMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(
        @Valid @RequestBody CreateZakatRequest request  // @Valid triggers validation
    ) {
        ZakatResponse response = service.calculate(request);
        return ResponseEntity.ok(response);
    }
}
```

### Null Safety

Use JSpecify annotations with NullAway to enforce null safety at compile time. The standard Spring
Boot 4 approach is:

1. Annotate every package with `@NullMarked` in `package-info.java` — this makes every unannotated
   type non-null by default
2. Mark only genuinely nullable values with `@Nullable`
3. Run NullAway via `mvn compile -Pnullcheck` (or `nx typecheck <project>`) to catch violations
   before tests run

**`package-info.java` — apply `@NullMarked` to the whole package**:

```java
@NullMarked
package com.organiclever.be.controller;

import org.jspecify.annotations.NullMarked;
```

**Service method — use `@Nullable` only where a value can genuinely be absent**:

```java
import org.jspecify.annotations.Nullable;

@Service
public class UserService {

    // Return type is non-null by default (@NullMarked on package)
    public UserResponse findByIdOrThrow(String id) {
        return repository.findById(id)
            .map(UserMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    // Explicitly nullable — caller must handle null
    public @Nullable UserResponse findByEmail(String email) {
        return repository.findByEmail(email)
            .map(UserMapper::toResponse)
            .orElse(null);
    }
}
```

**Run the null-safety check**:

```bash
# Via Nx (preferred — wired into pre-push hook)
nx typecheck demo-be-jasb

# Via Maven directly
mvn compile -Pnullcheck
```

NullAway activates only in the `nullcheck` Maven profile so regular `build` and `test:quick` runs
carry no Error Prone overhead.

### Custom Validators

```java
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IslamicDateValidator.class)
public @interface ValidIslamicDate {
    String message() default "Invalid Islamic date";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class IslamicDateValidator implements ConstraintValidator<ValidIslamicDate, LocalDate> {

    @Override
    public boolean isValid(LocalDate date, ConstraintValidatorContext context) {
        if (date == null) {
            return true;  // Use @NotNull for null check
        }

        // Validate Islamic calendar date
        // Implementation details...
        return true;
    }
}
```

### Use Spring Security with OAuth2/JWT

**PASS**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/public/**")
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/zakat/**").hasRole("USER")
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter =
            new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
}
```

### Unit Tests - No Spring Context

**PASS**:

```java
class ZakatCalculationTest {

    @Test
    void calculate_wealthAboveNisab_calculatesZakat() {
        // Given
        BigDecimal wealth = new BigDecimal("10000");
        BigDecimal nisab = new BigDecimal("5000");
        LocalDate date = LocalDate.now();

        // When
        ZakatCalculation calculation = ZakatCalculation.calculate(wealth, nisab, date);

        // Then
        assertThat(calculation.getZakatAmount())
            .isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(calculation.isEligible()).isTrue();
    }

    @ParameterizedTest
    @CsvSource({
        "10000, 5000, 250.00, true",
        "5000, 5000, 125.00, true",
        "3000, 5000, 0.00, false"
    })
    void calculate_variousScenarios(
        BigDecimal wealth,
        BigDecimal nisab,
        BigDecimal expectedZakat,
        boolean expectedEligible
    ) {
        ZakatCalculation calculation = ZakatCalculation.calculate(
            wealth, nisab, LocalDate.now()
        );

        assertThat(calculation.getZakatAmount()).isEqualByComparingTo(expectedZakat);
        assertThat(calculation.isEligible()).isEqualTo(expectedEligible);
    }
}
```

### Integration Tests - With Spring Boot

**PASS** - Use TestContainers:

```java
@SpringBootTest
@Testcontainers
class ZakatCalculationServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("test_db")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ZakatCalculationService service;

    @Autowired
    private ZakatCalculationRepository repository;

    @Test
    void calculate_savesToDatabase() {
        // Given
        CreateZakatRequest request = new CreateZakatRequest(
            new BigDecimal("10000"),
            new BigDecimal("5000"),
            LocalDate.now()
        );

        // When
        ZakatResponse response = service.calculate(request);

        // Then
        assertThat(response.zakatAmount()).isEqualByComparingTo("250.00");

        Optional<ZakatCalculation> saved = repository.findById(response.id());
        assertThat(saved).isPresent();
        assertThat(saved.get().getZakatAmount()).isEqualByComparingTo("250.00");
    }
}
```

### Controller Tests - Use @WebMvcTest

**PASS**:

```java
@WebMvcTest(ZakatCalculationController.class)
class ZakatCalculationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ZakatCalculationService service;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void calculate_validRequest_returns200() throws Exception {
        // Given
        CreateZakatRequest request = new CreateZakatRequest(
            new BigDecimal("10000"),
            new BigDecimal("5000"),
            LocalDate.now()
        );

        ZakatResponse response = new ZakatResponse(
            "zakat-123",
            new BigDecimal("10000"),
            new BigDecimal("5000"),
            new BigDecimal("250.00"),
            true,
            LocalDate.now(),
            Instant.now()
        );

        when(service.calculate(any())).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/v1/zakat/calculate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.zakatAmount").value("250.00"))
            .andExpect(jsonPath("$.eligible").value(true));

        verify(service).calculate(any());
    }
}
```

### Enable Spring Boot Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
```

### Custom Health Indicators

```java
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    private final PaymentGatewayClient client;

    public PaymentGatewayHealthIndicator(PaymentGatewayClient client) {
        this.client = client;
    }

    @Override
    public Health health() {
        try {
            boolean isHealthy = client.checkHealth();

            if (isHealthy) {
                return Health.up()
                    .withDetail("gateway", "Payment gateway is responsive")
                    .build();
            } else {
                return Health.down()
                    .withDetail("gateway", "Payment gateway is not responding")
                    .build();
            }
        } catch (Exception ex) {
            return Health.down()
                .withDetail("error", ex.getMessage())
                .build();
        }
    }
}
```

### Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "zakatCalculations",
            "nisabRates"
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10))
        );

        return cacheManager;
    }
}

@Service
public class NisabRateService {

    @Cacheable(value = "nisabRates", key = "#currency + '-' + #date")
    public BigDecimal getNisabRate(String currency, LocalDate date) {
        // Expensive calculation or external API call
        return fetchNisabRate(currency, date);
    }
}
```

## Related Documentation

- **[Spring Boot Idioms](ex-soen-plwe-to-jvspbo__idioms.md)** - Framework patterns
- **[Spring Boot Anti-Patterns](ex-soen-plwe-to-jvspbo__anti-patterns.md)** - Common mistakes
- **[Configuration](ex-soen-plwe-to-jvspbo__configuration.md)** - Configuration management
- **[REST APIs](ex-soen-plwe-to-jvspbo__rest-apis.md)** - RESTful services
- **[Data Access](ex-soen-plwe-to-jvspbo__data-access.md)** - Spring Data JPA
- **[Security](ex-soen-plwe-to-jvspbo__security.md)** - Spring Security
- **[Testing](ex-soen-plwe-to-jvspbo__testing.md)** - Testing strategies

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Best Practices](../jvm-spring/ex-soen-plwe-to-jvsp__best-practices.md) - Manual Spring standards
- [Java Best Practices](../../../programming-languages/java/ex-soen-prla-ja__coding-standards.md) - Java baseline standards
- [Spring Boot Idioms](./ex-soen-plwe-to-jvspbo__idioms.md) - Boot patterns
- [Spring Boot Anti-Patterns](./ex-soen-plwe-to-jvspbo__anti-patterns.md) - Common mistakes

---

**Last Updated**: 2026-01-25
**Spring Boot Version**: 3.3+
