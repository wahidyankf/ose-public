---
title: "Spring Boot Anti-Patterns"
description: Common Spring Boot mistakes and problematic patterns to avoid
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - anti-patterns
  - code-smells
  - mistakes
  - avoid
related:
  - ./ex-soen-plwe-jvspbo__idioms.md
  - ./ex-soen-plwe-jvspbo__best-practices.md
updated: 2026-01-25
---

### Dependency Injection Anti-Patterns

- [Field Injection](#1-field-injection) - Using @Autowired on fields
- [Circular Dependencies](#2-circular-dependencies) - Services depending on each other
- [God Services](#3-god-services) - Services doing too much

### Data Access Anti-Patterns

- [Exposing JPA Entities](#4-exposing-jpa-entities-in-rest-apis) - Returning entities from controllers
- [N+1 Queries](#5-n1-query-problem) - Missing JOIN FETCH
- [Overusing @Transactional](#6-overusing-transactional) - Transactions everywhere

### Configuration Anti-Patterns

- [Hardcoded Configuration](#7-hardcoded-configuration-values) - Secrets in code
- [Missing Validation](#8-missing-configuration-validation) - Unvalidated properties
- [Profile Misuse](#9-profile-misuse) - Wrong profile usage

### API Anti-Patterns

- [Missing Exception Handling](#10-missing-global-exception-handling) - No @ControllerAdvice
- [Ignoring HTTP Semantics](#11-ignoring-http-semantics) - Wrong status codes
- [Missing Validation](#12-missing-request-validation) - No @Valid

### Testing Anti-Patterns

- [Overusing @SpringBootTest](#13-overusing-springboottest) - Too many integration tests
- [Not Using Test Slices](#14-not-using-test-slices) - Loading full context unnecessarily

## Overview

This document identifies common anti-patterns in Spring Boot applications that lead to maintainability issues, performance problems, or security vulnerabilities. Each anti-pattern includes a FAIL example showing the problem and a PASS example demonstrating the correct approach.

### ❌ FAIL - Field Injection

**Problem**: Field injection makes testing difficult, hides dependencies, and prevents immutability.

```java
@Service
public class ZakatCalculationService {

    @Autowired  // ❌ Field injection
    private ZakatCalculationRepository repository;

    @Autowired  // ❌ Hidden dependency
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private ZakatProperties properties;

    public ZakatResponse calculate(CreateZakatRequest request) {
        // Hard to test - cannot mock dependencies easily
        // Cannot make fields final
        // Dependencies not visible in constructor
    }
}
```

**Issues**:

- Cannot make dependencies `final` (no immutability)
- Hard to write unit tests (need reflection to inject mocks)
- Dependencies hidden from API consumers
- Null pointer exceptions if autowiring fails silently
- Circular dependencies detected later at runtime

### ✅ PASS - Constructor Injection

```java
@Service
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final ZakatProperties properties;

    // Constructor injection - clear, testable, immutable
    public ZakatCalculationService(
        ZakatCalculationRepository repository,
        ApplicationEventPublisher eventPublisher,
        ZakatProperties properties
    ) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.properties = properties;
    }

    public ZakatResponse calculate(CreateZakatRequest request) {
        // Easy to test - pass mocks in constructor
        // All fields final - immutable
        // Dependencies explicit and visible
    }
}

// Unit test is straightforward
class ZakatCalculationServiceTest {
    @Test
    void calculate_test() {
        var mockRepo = mock(ZakatCalculationRepository.class);
        var mockPublisher = mock(ApplicationEventPublisher.class);
        var mockProperties = mock(ZakatProperties.class);

        var service = new ZakatCalculationService(mockRepo, mockPublisher, mockProperties);
        // Easy to test!
    }
}
```

### ❌ FAIL - Circular Dependency

```java
@Service
public class ZakatCalculationService {
    private final DonationService donationService;

    public ZakatCalculationService(DonationService donationService) {
        this.donationService = donationService;
    }

    public void calculate() {
        donationService.processDonation(...);
    }
}

@Service
public class DonationService {
    private final ZakatCalculationService zakatService;  // ❌ Circular!

    public DonationService(ZakatCalculationService zakatService) {
        this.zakatService = zakatService;
    }

    public void processDonation() {
        zakatService.calculate(...);
    }
}
// Result: BeanCurrentlyInCreationException at startup
```

### ✅ PASS - Refactor to Remove Cycle

**Solution 1: Extract Common Dependency**

```java
@Service
public class FinancialCalculationService {
    public Money calculateZakat(BigDecimal wealth, BigDecimal nisab) {
        // Shared calculation logic
    }
}

@Service
public class ZakatCalculationService {
    private final FinancialCalculationService calculationService;

    public ZakatCalculationService(FinancialCalculationService calculationService) {
        this.calculationService = calculationService;
    }
}

@Service
public class DonationService {
    private final FinancialCalculationService calculationService;

    public DonationService(FinancialCalculationService calculationService) {
        this.calculationService = calculationService;
    }
}
```

**Solution 2: Use Event-Driven Approach**

```java
@Service
public class ZakatCalculationService {
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void calculate() {
        // Calculate zakat
        eventPublisher.publishEvent(new ZakatCalculatedEvent(...));
        // No direct dependency on DonationService
    }
}

@Component
public class DonationEventHandler {
    private final DonationService donationService;

    @EventListener
    public void handleZakatCalculated(ZakatCalculatedEvent event) {
        donationService.processDonation(...);
    }
}
```

### ❌ FAIL - God Service

```java
@Service
public class FinancialService {  // ❌ Does everything!

    // Too many dependencies
    private final ZakatRepository zakatRepo;
    private final DonationRepository donationRepo;
    private final MurabahaRepository murabahaRepo;
    private final PaymentGatewayClient paymentClient;
    private final EmailService emailService;
    private final SmsService smsService;
    private final PdfGenerator pdfGenerator;
    private final ReportGenerator reportGenerator;
    // ... 20 more dependencies

    // Zakat methods
    public ZakatResponse calculateZakat() {}
    public void processZakatPayment() {}
    public void sendZakatReceipt() {}

    // Donation methods
    public DonationResponse processDonation() {}
    public void sendDonationReceipt() {}

    // Murabaha methods
    public MurabahaResponse createContract() {}
    public void processPayment() {}

    // Report methods
    public Report generateAnnualReport() {}
    public Report generateMonthlyReport() {}

    // ... 50+ methods
}
```

**Issues**:

- Violates Single Responsibility Principle
- Hard to test (too many dependencies to mock)
- Hard to understand and maintain
- Multiple reasons to change
- Becomes bottleneck in development

### ✅ PASS - Focused Services

```java
@Service
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    // Focused on Zakat calculation only
    public ZakatResponse calculate(CreateZakatRequest request) {
        // Single responsibility
    }
}

@Service
public class DonationService {
    private final DonationRepository repository;
    private final PaymentGatewayClient paymentClient;

    // Focused on donations only
    public DonationResponse processDonation(CreateDonationRequest request) {
        // Single responsibility
    }
}

@Service
public class MurabahaContractService {
    private final MurabahaContractRepository repository;
    private final PaymentScheduleCalculator calculator;

    // Focused on Murabaha contracts only
    public MurabahaContractResponse createContract(CreateContractRequest request) {
        // Single responsibility
    }
}

@Service
public class ReceiptService {
    private final EmailService emailService;
    private final PdfGenerator pdfGenerator;

    // Focused on receipt generation only
    public void sendReceipt(ReceiptRequest request) {
        // Single responsibility
    }
}
```

### ❌ FAIL - Returning Entities

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    @Autowired
    private ZakatCalculationRepository repository;

    @GetMapping("/{id}")
    public ResponseEntity<ZakatCalculation> getById(@PathVariable String id) {
        // ❌ Exposing JPA entity directly
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}

// Problems with ZakatCalculation entity:
@Entity
public class ZakatCalculation {
    @Id
    private String id;

    private String userId;
    private BigDecimal wealth;

    // ❌ Sensitive fields exposed
    private String internalNotes;
    private String auditLog;

    // ❌ Lazy collections cause LazyInitializationException
    @OneToMany(fetch = FetchType.LAZY)
    private List<Asset> assets;

    // ❌ JPA annotations leak to API
    @Version
    private Long version;
}
```

**Issues**:

- API coupled to database schema
- Cannot change database without breaking API
- Exposes internal/sensitive fields
- LazyInitializationException with lazy collections
- JSON serialization issues with bidirectional relationships
- Cannot version API independently

### ✅ PASS - Use DTOs

```java
// Request DTO
public record CreateZakatRequest(
    @NotNull BigDecimal wealth,
    @NotNull BigDecimal nisab,
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
) {
    // Only fields intended for API
    // No JPA annotations
    // Complete control over API contract
}

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {
    private final ZakatCalculationService service;

    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        // Returns DTO, not entity
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(
        @Valid @RequestBody CreateZakatRequest request
    ) {
        ZakatResponse response = service.calculate(request);
        return ResponseEntity.ok(response);
    }
}

// Service maps between entities and DTOs
@Service
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;

    public Optional<ZakatResponse> findById(String id) {
        return repository.findById(id)
            .map(ZakatMapper::toResponse);  // Entity -> DTO
    }

    public ZakatResponse calculate(CreateZakatRequest request) {
        ZakatCalculation calculation = ZakatCalculation.calculate(
            request.wealth(),
            request.nisab(),
            request.calculationDate()
        );

        ZakatCalculation saved = repository.save(calculation);
        return ZakatMapper.toResponse(saved);  // Entity -> DTO
    }
}
```

### ❌ FAIL - Missing JOIN FETCH

```java
@Service
public class MurabahaContractService {

    @Transactional(readOnly = true)
    public List<MurabahaContractResponse> findAllWithPayments() {
        List<MurabahaContract> contracts = contractRepository.findAll();  // 1 query

        return contracts.stream()
            .map(contract -> {
                // ❌ N queries - one for each contract's payments
                List<Payment> payments = contract.getPayments();  // Lazy load
                return MurabahaMapper.toResponse(contract, payments);
            })
            .toList();
        // Total: 1 + N queries (N = number of contracts)
    }
}
```

**Console Output**:

```
Hibernate: select ... from murabaha_contracts  -- 1 query
Hibernate: select ... from payments where contract_id=?  -- Query for contract 1
Hibernate: select ... from payments where contract_id=?  -- Query for contract 2
Hibernate: select ... from payments where contract_id=?  -- Query for contract 3
... (N queries total)
```

### ✅ PASS - Use JOIN FETCH

```java
public interface MurabahaContractRepository extends JpaRepository<MurabahaContract, String> {

    // Solution 1: JOIN FETCH in JPQL
    @Query("SELECT c FROM MurabahaContract c JOIN FETCH c.payments")
    List<MurabahaContract> findAllWithPayments();

    // Solution 2: @EntityGraph
    @EntityGraph(attributePaths = {"payments"})
    List<MurabahaContract> findAll();

    // Solution 3: Specific query with JOIN FETCH
    @Query("SELECT c FROM MurabahaContract c JOIN FETCH c.payments WHERE c.userId = :userId")
    List<MurabahaContract> findByUserIdWithPayments(@Param("userId") String userId);
}

@Service
public class MurabahaContractService {

    @Transactional(readOnly = true)
    public List<MurabahaContractResponse> findAllWithPayments() {
        // Single query with JOIN
        List<MurabahaContract> contracts = contractRepository.findAllWithPayments();

        return contracts.stream()
            .map(contract -> {
                // No additional query - payments already loaded
                List<Payment> payments = contract.getPayments();
                return MurabahaMapper.toResponse(contract, payments);
            })
            .toList();
        // Total: 1 query only
    }
}
```

### ❌ FAIL - @Transactional Everywhere

```java
@Service
public class ZakatCalculationService {

    // ❌ Read-only method doesn't need write transaction
    @Transactional
    public Optional<ZakatResponse> findById(String id) {
        return repository.findById(id)
            .map(ZakatMapper::toResponse);
    }

    // ❌ Simple calculation doesn't need transaction
    @Transactional
    public BigDecimal calculateNisab(String currency) {
        return nisabRateService.getRate(currency)
            .multiply(new BigDecimal("85"));
    }

    // ❌ Controller calling transactional method
    @Transactional  // Don't put on controllers!
    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

### ✅ PASS - Appropriate @Transactional Usage

```java
@Service
public class ZakatCalculationService {

    // ✅ Read-only transaction for queries
    @Transactional(readOnly = true)
    public Optional<ZakatResponse> findById(String id) {
        return repository.findById(id)
            .map(ZakatMapper::toResponse);
    }

    // ✅ No transaction for pure calculation
    public BigDecimal calculateNisab(String currency) {
        // Pure function - no database access
        return nisabRateService.getRate(currency)
            .multiply(new BigDecimal("85"));
    }

    // ✅ Write transaction for state changes
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
}

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {
    // ✅ No @Transactional on controllers
    // Transactions belong in service layer

    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        return service.findById(id)  // Service handles transaction
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

### ❌ FAIL - Hardcoded Values

```java
@Service
public class PaymentGatewayClient {

    private static final String API_URL = "https://api.payment-gateway.com";  // ❌ Hardcoded
    private static final String API_KEY = "pk_live_abc123def456";  // ❌ Secret in code!
    private static final int TIMEOUT_MS = 30000;  // ❌ Not configurable

    public PaymentResponse processPayment(PaymentRequest request) {
        // Using hardcoded values
        WebClient client = WebClient.builder()
            .baseUrl(API_URL)
            .defaultHeader("X-API-Key", API_KEY)
            .build();

        // Cannot change without code change
        // Cannot use different values per environment
    }
}
```

### ✅ PASS - Externalized Configuration

```java
@ConfigurationProperties(prefix = "ose.payment.gateway")
@Validated
public class PaymentGatewayProperties {

    @NotBlank
    private String apiUrl;

    @NotBlank
    private String apiKey;

    @Min(1000)
    @Max(60000)
    private int timeoutMs = 30000;

    // Getters and setters
}

@Service
public class PaymentGatewayClient {
    private final PaymentGatewayProperties properties;
    private final WebClient webClient;

    public PaymentGatewayClient(
        PaymentGatewayProperties properties,
        WebClient.Builder webClientBuilder
    ) {
        this.properties = properties;
        this.webClient = webClientBuilder
            .baseUrl(properties.getApiUrl())
            .defaultHeader("X-API-Key", properties.getApiKey())
            .build();
    }

    public PaymentResponse processPayment(PaymentRequest request) {
        return webClient.post()
            .uri("/payments")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(PaymentResponse.class)
            .timeout(Duration.ofMillis(properties.getTimeoutMs()))
            .block();
    }
}
```

**application.yml**:

```yaml
ose:
  payment:
    gateway:
      api-url: ${PAYMENT_GATEWAY_URL} # From environment
      api-key: ${PAYMENT_GATEWAY_API_KEY} # Secret from env
      timeout-ms: 30000
```

### ❌ FAIL - No Validation

```java
@ConfigurationProperties(prefix = "ose.zakat")
public class ZakatProperties {
    private BigDecimal nisabPercentage;  // ❌ Could be null or negative!
    private int hawalDays;  // ❌ Could be 0 or negative!
    private String defaultCurrency;  // ❌ Could be invalid!

    // No validation - runtime errors likely
}
```

### ✅ PASS - Validated Configuration

```java
@ConfigurationProperties(prefix = "ose.zakat")
@Validated  // Enable validation
public class ZakatProperties {

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("1.0")
    private BigDecimal nisabPercentage = new BigDecimal("0.025");

    @Min(1)
    @Max(366)
    private int hawalDays = 354;

    @NotBlank
    @Pattern(regexp = "[A-Z]{3}", message = "Currency must be 3-letter ISO code")
    private String defaultCurrency = "USD";

    // Validation ensures application won't start with invalid config
}
```

### ❌ FAIL - Profiles for Features

```java
// ❌ Don't use profiles for feature toggles
@Configuration
@Profile("premium")  // Wrong use of profiles
public class PremiumFeaturesConfig {

    @Bean
    public AdvancedZakatCalculator advancedCalculator() {
        return new AdvancedZakatCalculator();
    }
}

@Configuration
@Profile("basic")  // Wrong use of profiles
public class BasicFeaturesConfig {

    @Bean
    public SimpleZakatCalculator simpleCalculator() {
        return new SimpleZakatCalculator();
    }
}
```

### ✅ PASS - Profiles for Environments

```java
// ✅ Use profiles for environments
@Configuration
@Profile("dev")
public class DevConfig {

    @Bean
    public DataSource dataSource() {
        // H2 in-memory database for development
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }

    @Bean
    public CommandLineRunner dataSeeder() {
        return args -> {
            // Seed development data
        };
    }
}

@Configuration
@Profile("prod")
public class ProdConfig {

    @Bean
    public DataSource dataSource() {
        // Production PostgreSQL
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(20);
        // Production-specific settings
        return new HikariDataSource(config);
    }
}

// ✅ Use configuration properties for feature toggles
@ConfigurationProperties(prefix = "ose.features")
public class FeatureFlags {

    private boolean advancedCalculations = false;
    private boolean exportReports = false;
    private boolean emailNotifications = true;

    // Getters and setters
}

@Service
public class ZakatCalculationService {
    private final FeatureFlags features;

    public ZakatResponse calculate(CreateZakatRequest request) {
        if (features.isAdvancedCalculations()) {
            return advancedCalculator.calculate(request);
        } else {
            return simpleCalculator.calculate(request);
        }
    }
}
```

### ❌ FAIL - No Exception Handler

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        // ❌ No exception handling
        ZakatResponse response = service.findById(id)
            .orElseThrow(() -> new ZakatNotFoundException(id));
        return ResponseEntity.ok(response);
    }
    // Exception leaks to user as ugly stack trace
}
```

**User sees**:

```json
{
  "timestamp": "2026-01-25T10:30:00.000+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "trace": "com.oseplatform.zakat.ZakatNotFoundException: Zakat not found: zakat-123\n\tat com.oseplatform...",
  "message": "Zakat not found: zakat-123",
  "path": "/api/v1/zakat/zakat-123"
}
```

### ✅ PASS - @ControllerAdvice

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ZakatNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
        ZakatNotFoundException ex,
        WebRequest request
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.NOT_FOUND.value())
            .error("Not Found")
            .message(ex.getMessage())
            .path(extractPath(request))
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    private String extractPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
```

**User sees**:

```json
{
  "timestamp": "2026-01-25T10:30:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Zakat calculation not found: zakat-123",
  "path": "/api/v1/zakat/zakat-123"
}
```

### ❌ FAIL - Wrong HTTP Methods and Status Codes

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    // ❌ Using GET for state-changing operation
    @GetMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(
        @RequestParam BigDecimal wealth,
        @RequestParam BigDecimal nisab
    ) {
        // Should be POST - this changes state
        return ResponseEntity.ok(service.calculate(wealth, nisab));
    }

    // ❌ Wrong status code for creation
    @PostMapping("/calculations")
    public ResponseEntity<ZakatResponse> create(@RequestBody CreateZakatRequest request) {
        ZakatResponse response = service.calculate(request);
        return ResponseEntity.ok(response);  // ❌ Should be 201 Created
    }

    // ❌ Returns 200 for deletion
    @DeleteMapping("/{id}")
    public ResponseEntity<ZakatResponse> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();  // ❌ Should be 204 No Content
    }
}
```

### ✅ PASS - Correct HTTP Semantics

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    // ✅ POST for state-changing operations
    @PostMapping("/calculations")
    public ResponseEntity<ZakatResponse> calculate(
        @Valid @RequestBody CreateZakatRequest request
    ) {
        ZakatResponse response = service.calculate(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.id())
            .toUri();

        // ✅ 201 Created with Location header
        return ResponseEntity.created(location).body(response);
    }

    // ✅ GET for retrieval - safe and idempotent
    @GetMapping("/{id}")
    public ResponseEntity<ZakatResponse> getById(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)  // ✅ 200 OK
            .orElse(ResponseEntity.notFound().build());  // ✅ 404 Not Found
    }

    // ✅ DELETE with 204 No Content
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();  // ✅ 204 No Content
    }

    // ✅ PUT for full updates
    @PutMapping("/{id}")
    public ResponseEntity<ZakatResponse> update(
        @PathVariable String id,
        @Valid @RequestBody UpdateZakatRequest request
    ) {
        ZakatResponse response = service.update(id, request);
        return ResponseEntity.ok(response);  // ✅ 200 OK
    }
}
```

### ❌ FAIL - No Validation

```java
public record CreateZakatRequest(
    BigDecimal wealth,  // ❌ Could be null or negative
    BigDecimal nisab,  // ❌ Could be null or zero
    LocalDate calculationDate  // ❌ Could be null or future
) {}

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    @PostMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(
        @RequestBody CreateZakatRequest request  // ❌ No @Valid
    ) {
        // Invalid data can cause runtime errors
        return ResponseEntity.ok(service.calculate(request));
    }
}
```

### ✅ PASS - Bean Validation

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
@Validated  // ✅ Enable validation
public class ZakatCalculationController {

    @PostMapping("/calculate")
    public ResponseEntity<ZakatResponse> calculate(
        @Valid @RequestBody CreateZakatRequest request  // ✅ Validate
    ) {
        // Guaranteed valid data
        return ResponseEntity.ok(service.calculate(request));
    }
}
```

### ❌ FAIL - Everything is @SpringBootTest

```java
@SpringBootTest  // ❌ Loads entire application context - slow!
class ZakatCalculationControllerTest {

    @Autowired
    private MockMvc mockMvc;  // Won't work - MockMvc not auto-configured

    @MockBean
    private ZakatCalculationService service;

    @Test
    void calculate_test() throws Exception {
        // Slow test - entire Spring context loaded unnecessarily
    }
}

@SpringBootTest  // ❌ No database needed - unit test
class MoneyTest {

    @Test
    void add_samesCurrency_addsAmounts() {
        Money money1 = new Money(BigDecimal.TEN, "USD");
        Money money2 = new Money(BigDecimal.ONE, "USD");

        Money result = money1.add(money2);

        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.valueOf(11));
    }
}
```

### ✅ PASS - Use Test Slices

```java
// ✅ @WebMvcTest for controller tests
@WebMvcTest(ZakatCalculationController.class)
class ZakatCalculationControllerTest {

    @Autowired
    private MockMvc mockMvc;  // Auto-configured

    @MockBean
    private ZakatCalculationService service;

    @Test
    void calculate_validRequest_returns200() throws Exception {
        // Fast - only web layer loaded
        mockMvc.perform(post("/api/v1/zakat/calculate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("..."))
            .andExpect(status().isOk());
    }
}

// ✅ Plain JUnit for unit tests
class MoneyTest {
    // No Spring annotations - fastest tests

    @Test
    void add_sameCurrency_addsAmounts() {
        Money money1 = new Money(BigDecimal.TEN, "USD");
        Money money2 = new Money(BigDecimal.ONE, "USD");

        Money result = money1.add(money2);

        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.valueOf(11));
    }
}

// ✅ @DataJpaTest for repository tests
@DataJpaTest
class ZakatCalculationRepositoryTest {

    @Autowired
    private ZakatCalculationRepository repository;

    @Test
    void findByUserId_returnsCalculations() {
        // Fast - only JPA components loaded
    }
}

// ✅ @SpringBootTest only for integration tests
@SpringBootTest
@Testcontainers
class ZakatCalculationIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
    }

    @Test
    void endToEnd_zakatCalculationFlow() {
        // Full integration test - justified use of @SpringBootTest
    }
}
```

## 14. Not Using Test Slices

**See #13 above** - Use appropriate test slices:

- Plain JUnit for unit tests (fastest)
- `@WebMvcTest` for controller tests
- `@DataJpaTest` for repository tests
- `@SpringBootTest` only for full integration tests

## Related Documentation

- **[Spring Boot Idioms](ex-soen-plwe-to-jvspbo__idioms.md)** - Correct patterns
- **[Spring Boot Best Practices](ex-soen-plwe-to-jvspbo__best-practices.md)** - Production standards
- **[Testing](ex-soen-plwe-to-jvspbo__testing.md)** - Testing strategies

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Anti-Patterns](../jvm-spring/ex-soen-plwe-to-jvsp__anti-patterns.md) - Manual Spring mistakes
- [Java Anti-Patterns](../../../programming-languages/java/ex-soen-prla-ja__coding-standards.md) - Java baseline anti-patterns
- [Spring Boot Best Practices](./ex-soen-plwe-to-jvspbo__best-practices.md) - Recommended practices
- [Spring Boot Idioms](./ex-soen-plwe-to-jvspbo__idioms.md) - Correct patterns

---

**Last Updated**: 2026-01-25
**Spring Boot Version**: 3.3+
