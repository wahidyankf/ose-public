---
title: "Spring Boot Idioms"
description: Spring Boot-specific patterns and idiomatic framework usage
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - idioms
  - patterns
  - auto-configuration
  - dependency-injection
  - framework
related:
  - ./ex-soen-plwe-jvspbo__best-practices.md
  - ./ex-soen-plwe-jvspbo__anti-patterns.md
principles:
  - automation-over-manual
  - explicit-over-implicit
updated: 2026-01-25
---

### Core Spring Boot Patterns

**Auto-Configuration**:

- [Auto-Configuration](#auto-configuration-embrace-convention-over-configuration) - Embrace convention over configuration
- [Starter Dependencies](#starter-dependencies) - Curated dependency bundles
- [Conditional Beans](#conditional-bean-registration) - Environment-specific beans

**Dependency Injection**:

- [Constructor Injection](#constructor-injection-over-field-injection) - Recommended DI pattern
- [Component Scanning](#component-scanning-and-stereotypes) - @Component, @Service, @Repository
- [Bean Scopes](#bean-scopes-and-lifecycle) - Singleton, prototype, request scopes

**Configuration**:

- [Configuration Properties](#configuration-properties) - Type-safe config with @ConfigurationProperties
- [Profiles](#profile-based-configuration) - Environment-specific settings
- [Externalized Config](#externalized-configuration) - Environment variables, application.yml

**Application Patterns**:

- [REST Controllers](#rest-controllers) - @RestController for RESTful APIs
- [Domain Events](#domain-events-with-applicationevent) - Event-driven architecture
- [Transaction Management](#declarative-transaction-management) - @Transactional boundaries

### Related Documentation

- [Best Practices](ex-soen-plwe-to-jvspbo__best-practices.md)
- [Anti-Patterns](ex-soen-plwe-to-jvspbo__anti-patterns.md)
- [Configuration](ex-soen-plwe-to-jvspbo__configuration.md)
- [Dependency Injection](ex-soen-plwe-to-jvspbo__dependency-injection.md)
- [REST APIs](ex-soen-plwe-to-jvspbo__rest-apis.md)

## Overview

Spring Boot idioms are established patterns that leverage the framework's features to build applications with minimal boilerplate while maintaining explicitness and clarity. These patterns align with Spring Boot's philosophy of convention over configuration while ensuring the code remains understandable and maintainable.

This guide focuses on **Spring Boot 3.x idioms** with Java 17+, incorporating examples from Islamic financial domains including Zakat calculation, Murabaha contracts, and donation management.

### Why Spring Boot Idioms Matter

- **Productivity**: Idiomatic Spring Boot reduces boilerplate and accelerates development
- **Maintainability**: Following framework conventions makes code easier to understand
- **Auto-Configuration**: Leverage Spring Boot's intelligent defaults
- **Testability**: Spring Boot idioms naturally lead to testable code
- **Production Readiness**: Built-in production features (Actuator, metrics, health checks)

### Target Audience

This document targets developers building Spring Boot applications in the open-sharia-enterprise platform, particularly those working on financial services and domain-driven design implementations.

### 1. Auto-Configuration: Embrace Convention Over Configuration

**Pattern**: Let Spring Boot auto-configure components based on classpath and properties, override only when necessary.

**Idiom**: Minimal explicit configuration, maximum auto-configuration.

**Example - Default Auto-Configuration**:

```java
@SpringBootApplication  // Combines @Configuration, @EnableAutoConfiguration, @ComponentScan
public class PaymentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }
}
```

**What Auto-Configuration Provides**:

- **DataSource**: Automatically configured from `spring.datasource.*` properties
- **JPA**: EntityManagerFactory and TransactionManager configured
- **Web**: Embedded Tomcat, DispatcherServlet, error handling
- **Jackson**: JSON serialization/deserialization
- **Validation**: Bean Validation integration
- **Actuator**: Production-ready endpoints

**Customizing Auto-Configuration**:

```java
@Configuration
public class DataSourceConfig {

    // Override auto-configured DataSource when needed
    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
```

**When to Override**:

- Production-specific tuning (connection pooling, timeouts)
- Custom security requirements
- Integration with proprietary systems
- Performance optimization

### 2. Starter Dependencies

**Pattern**: Use Spring Boot starters to pull in curated dependency bundles.

**Idiom**: Add starters, not individual libraries.

**Common Starters**:

```kotlin
dependencies {
    // Web development
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Data access
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Production features
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

**Benefits**:

- **Curated Dependencies**: Compatible versions managed by Spring Boot
- **Transitive Resolution**: Related dependencies pulled automatically
- **Version Management**: Spring Boot BOM manages versions
- **Consistency**: Same stack across projects

### 3. Constructor Injection Over Field Injection

**Pattern**: Always use constructor injection for dependencies.

**Idiom**: Constructor-based DI with `final` fields.

**Idiomatic Spring Boot**:

```java
@Service
public class ZakatCalculationService {
    private final ZakatCalculationRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final Logger logger = LoggerFactory.getLogger(ZakatCalculationService.class);

    // Constructor injection (no @Autowired needed in Spring 4.3+)
    public ZakatCalculationService(
        ZakatCalculationRepository repository,
        ApplicationEventPublisher eventPublisher
    ) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ZakatCalculationResponse calculate(CreateZakatCalculationRequest request) {
        ZakatCalculation calculation = ZakatCalculation.calculate(
            request.wealth(),
            request.nisab(),
            request.calculationDate()
        );

        ZakatCalculation saved = repository.save(calculation);
        eventPublisher.publishEvent(new ZakatCalculatedEvent(saved.getId()));

        logger.info("Calculated Zakat: {}", saved.getId());
        return ZakatCalculationMapper.toResponse(saved);
    }
}
```

**Anti-Pattern - Field Injection**:

```java
// ❌ AVOID: Field injection
@Service
public class ZakatCalculationService {
    @Autowired  // Hard to test, hidden dependencies
    private ZakatCalculationRepository repository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;
}
```

**Why Constructor Injection**:

- **Testability**: Easy to mock dependencies in unit tests
- **Immutability**: Dependencies declared `final`
- **Explicitness**: Dependencies visible in constructor
- **Null Safety**: Constructor ensures all dependencies provided
- **Circular Dependency Detection**: Constructor injection catches cycles early

### 4. Component Scanning and Stereotypes

**Pattern**: Use stereotype annotations for automatic bean detection.

**Idiom**: `@Component`, `@Service`, `@Repository`, `@Controller` for semantic clarity.

**Service Layer**:

```java
@Service  // Application/domain service
public class MurabahaContractService {
    private final MurabahaContractRepository contractRepository;
    private final PaymentScheduleCalculator calculator;

    public MurabahaContractService(
        MurabahaContractRepository contractRepository,
        PaymentScheduleCalculator calculator
    ) {
        this.contractRepository = contractRepository;
        this.calculator = calculator;
    }

    @Transactional
    public MurabahaContractResponse createContract(CreateContractRequest request) {
        PaymentSchedule schedule = calculator.calculate(
            request.assetCost(),
            request.profitRate(),
            request.termMonths()
        );

        MurabahaContract contract = MurabahaContract.create(
            request.assetCost(),
            request.profitRate(),
            schedule
        );

        MurabahaContract saved = contractRepository.save(contract);
        return MurabahaContractMapper.toResponse(saved);
    }
}
```

**Repository Layer**:

```java
@Repository  // Data access layer (exception translation)
public interface ZakatCalculationRepository extends JpaRepository<ZakatCalculation, String> {

    List<ZakatCalculation> findByUserIdAndCalculationDateBetween(
        String userId,
        LocalDate startDate,
        LocalDate endDate
    );

    @Query("SELECT z FROM ZakatCalculation z WHERE z.eligible = true AND z.userId = :userId")
    List<ZakatCalculation> findEligibleCalculations(@Param("userId") String userId);
}
```

**REST Controller**:

```java
@RestController  // Combines @Controller and @ResponseBody
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {
    private final ZakatCalculationService service;

    public ZakatCalculationController(ZakatCalculationService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    public ResponseEntity<ZakatCalculationResponse> calculate(
        @Valid @RequestBody CreateZakatCalculationRequest request
    ) {
        ZakatCalculationResponse response = service.calculate(request);
        return ResponseEntity.ok(response);
    }
}
```

**Component** (Generic):

```java
@Component  // Generic Spring-managed component
public class PaymentScheduleCalculator {

    public PaymentSchedule calculate(
        Money assetCost,
        BigDecimal profitRate,
        int termMonths
    ) {
        // Pure calculation logic
        Money totalAmount = assetCost.multiply(
            BigDecimal.ONE.add(profitRate)
        );

        Money monthlyPayment = totalAmount.divide(
            BigDecimal.valueOf(termMonths)
        );

        return PaymentSchedule.create(monthlyPayment, termMonths);
    }
}
```

**Stereotype Semantics**:

- **@Service**: Business logic, orchestration, domain services
- **@Repository**: Data access, persistence operations
- **@Controller/@RestController**: Web layer, REST endpoints
- **@Component**: Generic beans (utilities, calculators, helpers)

### 5. Configuration Properties

**Pattern**: Use `@ConfigurationProperties` for type-safe configuration.

**Idiom**: Group related properties in dedicated classes with validation.

**Configuration Properties Class**:

```java
@ConfigurationProperties(prefix = "ose.payment")
@Validated
public class PaymentProperties {

    @NotNull
    private Currency defaultCurrency = Currency.getInstance("USD");

    @Min(1)
    @Max(360)
    private int maxTermMonths = 60;

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private BigDecimal maxProfitRate = new BigDecimal("0.25");

    @NotNull
    private Gateway gateway;

    // Getters and setters
    public Currency getDefaultCurrency() { return defaultCurrency; }
    public void setDefaultCurrency(Currency defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }

    public int getMaxTermMonths() { return maxTermMonths; }
    public void setMaxTermMonths(int maxTermMonths) {
        this.maxTermMonths = maxTermMonths;
    }

    public BigDecimal getMaxProfitRate() { return maxProfitRate; }
    public void setMaxProfitRate(BigDecimal maxProfitRate) {
        this.maxProfitRate = maxProfitRate;
    }

    public Gateway getGateway() { return gateway; }
    public void setGateway(Gateway gateway) {
        this.gateway = gateway;
    }

    public static class Gateway {
        @NotBlank
        private String apiKey;

        @NotBlank
        private String apiUrl;

        @Min(1000)
        @Max(60000)
        private int timeoutMs = 30000;

        // Getters and setters
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }

        public String getApiUrl() { return apiUrl; }
        public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

        public int getTimeoutMs() { return timeoutMs; }
        public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
    }
}
```

**Enable Configuration Properties**:

```java
@Configuration
@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentConfig {
    // Configuration properties now available for injection
}
```

**Using Configuration Properties**:

```java
@Service
public class PaymentGatewayClient {
    private final PaymentProperties properties;
    private final WebClient webClient;

    public PaymentGatewayClient(PaymentProperties properties, WebClient.Builder webClientBuilder) {
        this.properties = properties;
        this.webClient = webClientBuilder
            .baseUrl(properties.getGateway().getApiUrl())
            .defaultHeader("X-API-Key", properties.getGateway().getApiKey())
            .build();
    }

    public PaymentResponse processPayment(PaymentRequest request) {
        // Use configured timeout
        return webClient.post()
            .uri("/payments")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(PaymentResponse.class)
            .timeout(Duration.ofMillis(properties.getGateway().getTimeoutMs()))
            .block();
    }
}
```

**application.yml**:

```yaml
ose:
  payment:
    default-currency: USD
    max-term-months: 60
    max-profit-rate: 0.25
    gateway:
      api-key: ${PAYMENT_GATEWAY_API_KEY}
      api-url: https://api.payment-gateway.com
      timeout-ms: 30000
```

**Benefits**:

- **Type Safety**: Compile-time checking of property types
- **Validation**: Bean Validation annotations enforce constraints
- **IDE Support**: Autocomplete and documentation
- **Centralization**: Related properties grouped together
- **Environment Variables**: Support for externalized config

### 6. Profile-Based Configuration

**Pattern**: Use Spring profiles for environment-specific configuration.

**Idiom**: `application-{profile}.yml` for profile-specific settings.

**application.yml** (Common):

```yaml
spring:
  application:
    name: payment-service
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

logging:
  level:
    com.oseplatform: INFO
```

**application-dev.yml**:

```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  devtools:
    restart:
      enabled: true

logging:
  level:
    com.oseplatform: DEBUG
    org.hibernate.SQL: DEBUG
```

**application-prod.yml**:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
  jpa:
    show-sql: false

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics

logging:
  level:
    com.oseplatform: INFO
```

**Profile-Specific Beans**:

```java
@Configuration
@Profile("dev")
public class DevConfig {

    @Bean
    public CommandLineRunner dataSeeder(ZakatCalculationRepository repository) {
        return args -> {
            // Seed development data
            ZakatCalculation sample = ZakatCalculation.calculate(
                new BigDecimal("10000"),
                new BigDecimal("5000"),
                LocalDate.now()
            );
            repository.save(sample);
        };
    }
}

@Configuration
@Profile("prod")
public class ProdConfig {

    @Bean
    public DataSource dataSource() {
        // Production-specific DataSource configuration
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(20);
        config.setConnectionTimeout(30000);
        // ... production settings
        return new HikariDataSource(config);
    }
}
```

**Activating Profiles**:

```bash
# Command line
java -jar app.jar --spring.profiles.active=prod

# Environment variable
export SPRING_PROFILES_ACTIVE=prod

# application.yml default
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

### 7. Externalized Configuration

**Pattern**: Use environment variables for sensitive and environment-specific values.

**Idiom**: `${ENV_VAR:default}` syntax in application.yml.

**application.yml with Externalized Config**:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ose_platform}
    username: ${DATABASE_USERNAME:dev_user}
    password: ${DATABASE_PASSWORD:dev_password}

ose:
  payment:
    gateway:
      api-key: ${PAYMENT_GATEWAY_API_KEY}
      api-url: ${PAYMENT_GATEWAY_URL:https://sandbox.payment-gateway.com}

  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration-ms: ${JWT_EXPIRATION_MS:3600000}

management:
  endpoints:
    web:
      exposure:
        include: ${ACTUATOR_ENDPOINTS:health,info}
```

**Environment Variables (Production)**:

```bash
export DATABASE_URL=jdbc:postgresql://prod-db.example.com:5432/ose_platform
export DATABASE_USERNAME=prod_user
export DATABASE_PASSWORD=SecurePassword123!
export PAYMENT_GATEWAY_API_KEY=pk_live_abcdef123456
export JWT_SECRET=VerySecureJWTSecret!
export ACTUATOR_ENDPOINTS=health,info,metrics,prometheus
```

**Best Practices**:

- **Never commit secrets** to version control
- **Use defaults** for local development
- **Validate presence** of required environment variables at startup
- **Document** required environment variables in README.md
- **Use secret management** tools in production (Vault, AWS Secrets Manager)

### 8. REST Controllers

**Pattern**: Use `@RestController` for RESTful APIs with proper HTTP semantics.

**Idiom**: `@RestController` + `@RequestMapping` + HTTP method annotations.

**Idiomatic REST Controller**:

```java
@RestController
@RequestMapping("/api/v1/murabaha")
@Validated
public class MurabahaContractController {
    private final MurabahaContractService service;

    public MurabahaContractController(MurabahaContractService service) {
        this.service = service;
    }

    @PostMapping("/contracts")
    public ResponseEntity<MurabahaContractResponse> createContract(
        @Valid @RequestBody CreateContractRequest request
    ) {
        MurabahaContractResponse response = service.createContract(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.id())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/contracts/{id}")
    public ResponseEntity<MurabahaContractResponse> getContract(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/contracts")
    public ResponseEntity<Page<MurabahaContractResponse>> listContracts(
        @RequestParam(required = false) ContractStatus status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt,desc") String[] sort
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<MurabahaContractResponse> contracts = service.findAll(status, pageable);
        return ResponseEntity.ok(contracts);
    }

    @PutMapping("/contracts/{id}/payments")
    public ResponseEntity<Void> recordPayment(
        @PathVariable String id,
        @Valid @RequestBody RecordPaymentRequest request
    ) {
        service.recordPayment(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> cancelContract(@PathVariable String id) {
        service.cancelContract(id);
        return ResponseEntity.noContent().build();
    }

    private Sort.Order[] parseSort(String[] sortParams) {
        return Arrays.stream(sortParams)
            .map(param -> {
                String[] parts = param.split(",");
                String property = parts[0];
                Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc")
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
                return new Sort.Order(direction, property);
            })
            .toArray(Sort.Order[]::new);
    }
}
```

**HTTP Semantics**:

- **POST**: Create new resources (201 Created + Location header)
- **GET**: Retrieve resources (200 OK, 404 Not Found)
- **PUT**: Update resources (204 No Content, 200 OK with body)
- **DELETE**: Remove resources (204 No Content)
- **PATCH**: Partial updates (200 OK, 204 No Content)

### 9. Declarative Transaction Management

**Pattern**: Use `@Transactional` to define transaction boundaries.

**Idiom**: `@Transactional` on service methods, `readOnly=true` for queries.

**Service with Transactions**:

```java
@Service
public class DonationService {
    private final DonationRepository donationRepository;
    private final DonorRepository donorRepository;
    private final ApplicationEventPublisher eventPublisher;

    public DonationService(
        DonationRepository donationRepository,
        DonorRepository donorRepository,
        ApplicationEventPublisher eventPublisher
    ) {
        this.donationRepository = donationRepository;
        this.donorRepository = donorRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional  // Write transaction
    public DonationResponse processDonation(CreateDonationRequest request) {
        // Find or create donor
        Donor donor = donorRepository.findByEmail(request.donorEmail())
            .orElseGet(() -> donorRepository.save(Donor.create(request.donorEmail())));

        // Create donation
        Donation donation = Donation.create(
            donor.getId(),
            request.amount(),
            request.category(),
            request.message()
        );

        // Validate business rules
        ValidationResult validation = donation.validate();
        if (validation.hasErrors()) {
            throw new DonationValidationException(validation.errors());
        }

        // Save and publish event
        Donation saved = donationRepository.save(donation);
        eventPublisher.publishEvent(new DonationReceivedEvent(saved.getId(), saved.getAmount()));

        return DonationMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)  // Read-only transaction
    public Optional<DonationResponse> findById(String id) {
        return donationRepository.findById(id)
            .map(DonationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public DonationSummary generateMonthlySummary(YearMonth month) {
        List<Donation> donations = donationRepository.findByMonth(month);

        Money totalAmount = donations.stream()
            .map(Donation::getAmount)
            .reduce(Money.ZERO, Money::add);

        Map<String, Money> byCategory = donations.stream()
            .collect(Collectors.groupingBy(
                Donation::getCategory,
                Collectors.reducing(Money.ZERO, Donation::getAmount, Money::add)
            ));

        return new DonationSummary(month, totalAmount, byCategory);
    }
}
```

**Transaction Attributes**:

```java
@Transactional(
    readOnly = true,           // Optimize for read-only operations
    timeout = 30,              // Transaction timeout in seconds
    isolation = Isolation.READ_COMMITTED,  // Isolation level
    propagation = Propagation.REQUIRED     // Transaction propagation
)
```

**Best Practices**:

- Use `readOnly=true` for queries (enables optimizations)
- Keep transactions short-lived
- Avoid long-running operations in transactions
- Handle exceptions appropriately (rollback on unchecked exceptions)
- Use propagation wisely (default REQUIRED is usually correct)

### 10. Domain Events with ApplicationEvent

**Pattern**: Use Spring's event mechanism for domain events.

**Idiom**: `ApplicationEventPublisher` + `@EventListener` for event-driven architecture.

**Domain Event**:

```java
public class PaymentRecordedEvent {
    private final String contractId;
    private final Money amount;
    private final LocalDate paymentDate;
    private final Instant occurredAt;

    public PaymentRecordedEvent(String contractId, Money amount, LocalDate paymentDate) {
        this.contractId = contractId;
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.occurredAt = Instant.now();
    }

    // Getters
    public String getContractId() { return contractId; }
    public Money getAmount() { return amount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public Instant getOccurredAt() { return occurredAt; }
}
```

**Publishing Events**:

```java
@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentService(
        PaymentRepository paymentRepository,
        ApplicationEventPublisher eventPublisher
    ) {
        this.paymentRepository = paymentRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void recordPayment(String contractId, RecordPaymentRequest request) {
        Payment payment = Payment.create(
            contractId,
            request.amount(),
            request.paymentDate()
        );

        Payment saved = paymentRepository.save(payment);

        // Publish domain event
        eventPublisher.publishEvent(
            new PaymentRecordedEvent(contractId, saved.getAmount(), saved.getPaymentDate())
        );
    }
}
```

**Event Listeners**:

```java
@Component
public class PaymentEventHandler {
    private final NotificationService notificationService;
    private final ContractRepository contractRepository;

    public PaymentEventHandler(
        NotificationService notificationService,
        ContractRepository contractRepository
    ) {
        this.notificationService = notificationService;
        this.contractRepository = contractRepository;
    }

    @EventListener
    public void handlePaymentRecorded(PaymentRecordedEvent event) {
        // Send notification to user
        notificationService.sendPaymentConfirmation(
            event.getContractId(),
            event.getAmount()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void updateContractAfterPayment(PaymentRecordedEvent event) {
        // Update contract status after transaction commits
        contractRepository.findById(event.getContractId())
            .ifPresent(contract -> {
                contract.markPaymentReceived(event.getAmount(), event.getPaymentDate());
                contractRepository.save(contract);
            });
    }
}
```

**Transaction-Aware Event Listeners**:

```java
@Component
public class ZakatEventHandler {

    // Fires after transaction commits successfully
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleZakatCalculated(ZakatCalculatedEvent event) {
        // Safe to send external notifications here
        // Transaction is guaranteed to have committed
    }

    // Fires if transaction rolls back
    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void handleCalculationFailed(ZakatCalculatedEvent event) {
        // Log failure, send alert
    }
}
```

**Benefits**:

- **Decoupling**: Publishers don't know about subscribers
- **Flexibility**: Add handlers without modifying publishers
- **Transaction Awareness**: `@TransactionalEventListener` ensures consistency
- **Async Support**: Can make event processing asynchronous with `@Async`

### 11. Conditional Bean Registration

**Pattern**: Register beans conditionally based on properties, classes, or environment.

**Idiom**: `@Conditional*` annotations for environment-specific beans.

**Conditional on Property**:

```java
@Configuration
public class CacheConfig {

    @Bean
    @ConditionalOnProperty(name = "ose.cache.type", havingValue = "redis")
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }

    @Bean
    @ConditionalOnProperty(name = "ose.cache.type", havingValue = "caffeine", matchIfMissing = true)
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10)));
        return cacheManager;
    }
}
```

**Conditional on Class**:

```java
@Configuration
@ConditionalOnClass(name = "org.springframework.security.oauth2.jwt.JwtDecoder")
public class OAuth2SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}
```

**Conditional on Missing Bean**:

```java
@Configuration
public class DefaultConfig {

    @Bean
    @ConditionalOnMissingBean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
```

**Conditional on Profile**:

```java
@Configuration
@Profile("!prod")  // Not production
public class DevToolsConfig {

    @Bean
    public CommandLineRunner databaseSeeder() {
        return args -> {
            // Seed development data
        };
    }
}
```

### 12. Custom Auto-Configuration Patterns

**Pattern**: Create reusable auto-configurations for domain-specific functionality.

**Idiom**: `@Configuration` + `@ConditionalOnClass` + `@EnableConfigurationProperties` + `spring.factories`.

**Domain Auto-Configuration**:

```java
@Configuration
@ConditionalOnClass(ZakatCalculationService.class)
@EnableConfigurationProperties(ZakatProperties.class)
public class ZakatAutoConfiguration {
    private final ZakatProperties properties;

    public ZakatAutoConfiguration(ZakatProperties properties) {
        this.properties = properties;
    }

    @Bean
    @ConditionalOnMissingBean
    public NisabCalculator nisabCalculator() {
        return new DefaultNisabCalculator(
            properties.getGoldPriceSource(),
            properties.getSilverPriceSource()
        );
    }

    @Bean
    @ConditionalOnMissingBean
    public ZakatRateProvider zakatRateProvider() {
        return new StandardZakatRateProvider(properties.getRate());
    }

    @Bean
    @ConditionalOnBean(NisabCalculator.class)
    public ZakatCalculationService zakatCalculationService(
        NisabCalculator nisabCalculator,
        ZakatRateProvider rateProvider,
        ZakatCalculationRepository repository
    ) {
        return new ZakatCalculationService(nisabCalculator, rateProvider, repository);
    }
}
```

**Configuration Properties for Auto-Configuration**:

```java
@ConfigurationProperties(prefix = "ose.zakat")
@Validated
public class ZakatProperties {

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private BigDecimal rate = new BigDecimal("0.025");  // 2.5%

    @NotBlank
    private String goldPriceSource = "https://api.metals.live/v1/spot/gold";

    @NotBlank
    private String silverPriceSource = "https://api.metals.live/v1/spot/silver";

    @NotNull
    private NisabCalculationMode calculationMode = NisabCalculationMode.GOLD;

    private boolean enableAutomaticCalculation = false;

    // Getters and setters
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }

    public String getGoldPriceSource() { return goldPriceSource; }
    public void setGoldPriceSource(String goldPriceSource) {
        this.goldPriceSource = goldPriceSource;
    }

    public String getSilverPriceSource() { return silverPriceSource; }
    public void setSilverPriceSource(String silverPriceSource) {
        this.silverPriceSource = silverPriceSource;
    }

    public NisabCalculationMode getCalculationMode() { return calculationMode; }
    public void setCalculationMode(NisabCalculationMode calculationMode) {
        this.calculationMode = calculationMode;
    }

    public boolean isEnableAutomaticCalculation() { return enableAutomaticCalculation; }
    public void setEnableAutomaticCalculation(boolean enableAutomaticCalculation) {
        this.enableAutomaticCalculation = enableAutomaticCalculation;
    }

    public enum NisabCalculationMode {
        GOLD, SILVER, MINIMUM
    }
}
```

**Auto-Configuration Ordering**:

```java
@Configuration
@AutoConfigureBefore(DataSourceAutoConfiguration.class)
public class CustomDataSourceAutoConfiguration {
    // Runs before Spring Boot's DataSource auto-configuration
}

@Configuration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
public class DataSourceMonitoringAutoConfiguration {
    // Runs after DataSource is configured
}
```

**Register Auto-Configuration** (`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`):

```text
com.oseplatform.autoconfigure.ZakatAutoConfiguration
com.oseplatform.autoconfigure.MurabahaAutoConfiguration
com.oseplatform.autoconfigure.DonationAutoConfiguration
```

**Using the Auto-Configuration**:

```yaml
ose:
  zakat:
    rate: 0.025
    gold-price-source: https://api.metals.live/v1/spot/gold
    calculation-mode: GOLD
    enable-automatic-calculation: true
```

**Benefits**:

- **Reusability**: Share configurations across multiple services
- **Convention over Configuration**: Sensible defaults with override capability
- **Discoverability**: IDE autocomplete for configuration properties
- **Modularity**: Package domain logic with configuration

### 13. Event-Driven Architecture Depth

**Pattern**: Leverage Spring's event infrastructure for decoupled domain interactions.

**Idiom**: `ApplicationEventPublisher` + `@EventListener` + `@TransactionalEventListener` + `@Async`.

**Complex Domain Event**:

```java
public class ContractStatusChangedEvent {
    private final String contractId;
    private final ContractStatus previousStatus;
    private final ContractStatus newStatus;
    private final Instant changedAt;
    private final String reason;

    public ContractStatusChangedEvent(
        String contractId,
        ContractStatus previousStatus,
        ContractStatus newStatus,
        String reason
    ) {
        this.contractId = contractId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedAt = Instant.now();
        this.reason = reason;
    }

    // Getters
    public String getContractId() { return contractId; }
    public ContractStatus getPreviousStatus() { return previousStatus; }
    public ContractStatus getNewStatus() { return newStatus; }
    public Instant getChangedAt() { return changedAt; }
    public String getReason() { return reason; }
}
```

**Asynchronous Event Processing**:

```java
@Component
@EnableAsync
public class AsyncEventHandler {
    private final Logger logger = LoggerFactory.getLogger(AsyncEventHandler.class);
    private final EmailService emailService;
    private final AuditLogService auditService;

    public AsyncEventHandler(EmailService emailService, AuditLogService auditService) {
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Async
    @EventListener
    public void sendContractStatusEmail(ContractStatusChangedEvent event) {
        // Runs asynchronously, won't block transaction
        logger.info("Sending status change email for contract: {}", event.getContractId());
        emailService.sendContractStatusUpdate(
            event.getContractId(),
            event.getNewStatus()
        );
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void auditStatusChange(ContractStatusChangedEvent event) {
        // Audit only after successful transaction
        auditService.logStatusChange(
            event.getContractId(),
            event.getPreviousStatus(),
            event.getNewStatus(),
            event.getReason()
        );
    }
}
```

**Event Ordering with @Order**:

```java
@Component
public class OrderedEventHandlers {

    @EventListener
    @Order(1)
    public void firstHandler(PaymentRecordedEvent event) {
        // Executes first
    }

    @EventListener
    @Order(2)
    public void secondHandler(PaymentRecordedEvent event) {
        // Executes second
    }

    @EventListener
    @Order(3)
    public void thirdHandler(PaymentRecordedEvent event) {
        // Executes third
    }
}
```

**Transaction Boundary Awareness**:

```java
@Component
public class TransactionAwareEventHandler {

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void beforeCommit(DonationReceivedEvent event) {
        // Executes before transaction commits
        // Still part of transaction, can cause rollback
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(DonationReceivedEvent event) {
        // Executes after successful commit
        // Safe for external integrations
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void afterRollback(DonationReceivedEvent event) {
        // Executes if transaction rolls back
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMPLETION)
    public void afterCompletion(DonationReceivedEvent event) {
        // Executes after commit OR rollback
    }
}
```

**Benefits**:

- **Decoupling**: Components communicate without direct dependencies
- **Transaction Safety**: `@TransactionalEventListener` ensures consistency
- **Scalability**: `@Async` enables concurrent processing
- **Flexibility**: Add/remove handlers without modifying publishers

### 14. Conditional Bean Registration Strategies

**Pattern**: Advanced conditional bean registration for flexible configuration.

**Idiom**: Multiple `@Conditional*` annotations with custom conditions.

**Property-Based Conditional**:

```java
@Configuration
public class PaymentGatewayConfig {

    @Bean
    @ConditionalOnProperty(
        name = "ose.payment.gateway.provider",
        havingValue = "stripe"
    )
    public PaymentGateway stripeGateway(StripeProperties properties) {
        return new StripePaymentGateway(properties);
    }

    @Bean
    @ConditionalOnProperty(
        name = "ose.payment.gateway.provider",
        havingValue = "paypal"
    )
    public PaymentGateway paypalGateway(PayPalProperties properties) {
        return new PayPalPaymentGateway(properties);
    }

    @Bean
    @ConditionalOnProperty(
        name = "ose.payment.gateway.provider",
        havingValue = "mock",
        matchIfMissing = true  // Default to mock if not specified
    )
    public PaymentGateway mockGateway() {
        return new MockPaymentGateway();
    }
}
```

**Bean Presence Conditional**:

```java
@Configuration
public class CachingConfig {

    @Bean
    @ConditionalOnBean(CacheManager.class)
    public CachedZakatCalculationService cachedService(
        ZakatCalculationService delegate,
        CacheManager cacheManager
    ) {
        return new CachedZakatCalculationService(delegate, cacheManager);
    }

    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public ZakatCalculationService noCacheService(
        ZakatCalculationRepository repository,
        NisabCalculator nisabCalculator
    ) {
        return new ZakatCalculationService(repository, nisabCalculator);
    }
}
```

**SpEL Expression Conditional**:

```java
@Configuration
public class AdvancedConfig {

    @Bean
    @ConditionalOnExpression(
        "${ose.features.advanced-analytics:false} and ${ose.features.ml-enabled:false}"
    )
    public AnalyticsService advancedAnalytics(MachineLearningService mlService) {
        return new MLEnhancedAnalyticsService(mlService);
    }

    @Bean
    @ConditionalOnExpression(
        "!'${ose.deployment.environment}'.equals('production') or ${ose.debug.enabled:false}"
    )
    public DebugToolsConfiguration debugTools() {
        return new DebugToolsConfiguration();
    }
}
```

**Custom Condition Implementation**:

```java
public class ShariahComplianceCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        Environment env = context.getEnvironment();

        // Check if Shariah compliance is required
        boolean complianceRequired = env.getProperty(
            "ose.shariah.compliance.required",
            Boolean.class,
            false
        );

        // Check if certification is valid
        String certificationExpiry = env.getProperty("ose.shariah.certification.expiry");
        boolean certificationValid = certificationExpiry != null &&
            LocalDate.parse(certificationExpiry).isAfter(LocalDate.now());

        return complianceRequired && certificationValid;
    }
}

@Configuration
@Conditional(ShariahComplianceCondition.class)
public class ShariahComplianceConfig {

    @Bean
    public InterestValidator interestValidator() {
        return new StrictInterestValidator();
    }

    @Bean
    public ContractValidator contractValidator() {
        return new ShariahCompliantContractValidator();
    }
}
```

**Benefits**:

- **Flexibility**: Adapt application behavior based on environment
- **Modularity**: Enable/disable features without code changes
- **Safety**: Prevent invalid bean combinations
- **Testability**: Easily create different configurations for testing

### 15. Spring Boot Lifecycle Hooks

**Pattern**: Execute code at specific points in application lifecycle.

**Idiom**: `ApplicationRunner`, `CommandLineRunner`, `@PostConstruct`, `@PreDestroy`, `@Order`.

**ApplicationRunner vs CommandLineRunner**:

```java
@Component
@Order(1)
public class DatabaseInitializer implements ApplicationRunner {

    private final DatabaseMigrationService migrationService;
    private final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

    public DatabaseInitializer(DatabaseMigrationService migrationService) {
        this.migrationService = migrationService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Access to ApplicationArguments (named options, source args)
        logger.info("Running database migrations...");

        if (args.containsOption("skip-migration")) {
            logger.info("Skipping migration (--skip-migration flag detected)");
            return;
        }

        migrationService.runMigrations();
        logger.info("Database migrations completed");
    }
}

@Component
@Order(2)
public class DataSeeder implements CommandLineRunner {

    private final ZakatCalculationRepository repository;
    private final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    public DataSeeder(ZakatCalculationRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Access to raw String[] arguments
        logger.info("Seeding initial data...");

        if (args.length > 0 && args[0].equals("--no-seed")) {
            logger.info("Skipping data seeding");
            return;
        }

        // Seed data
        repository.save(createSampleCalculation());
        logger.info("Data seeding completed");
    }

    private ZakatCalculation createSampleCalculation() {
        return ZakatCalculation.calculate(
            new BigDecimal("10000"),
            new BigDecimal("5000"),
            LocalDate.now()
        );
    }
}
```

**Bean Lifecycle with @PostConstruct and @PreDestroy**:

```java
@Component
public class CacheWarmer {

    private final ZakatCalculationService zakatService;
    private final CacheManager cacheManager;
    private final Logger logger = LoggerFactory.getLogger(CacheWarmer.class);

    public CacheWarmer(ZakatCalculationService zakatService, CacheManager cacheManager) {
        this.zakatService = zakatService;
        this.cacheManager = cacheManager;
    }

    @PostConstruct
    public void warmCache() {
        // Executes after dependency injection
        logger.info("Warming cache with frequently accessed data...");

        try {
            // Pre-load common calculations
            zakatService.preloadCommonNisabValues();
            logger.info("Cache warming completed");
        } catch (Exception e) {
            logger.error("Cache warming failed", e);
        }
    }

    @PreDestroy
    public void cleanupCache() {
        // Executes before bean destruction
        logger.info("Flushing cache before shutdown...");

        cacheManager.getCacheNames()
            .forEach(cacheName -> {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            });

        logger.info("Cache cleanup completed");
    }
}
```

**Lifecycle Ordering with @Order**:

```java
@Component
@Order(1)
public class FirstRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        // Executes first
    }
}

@Component
@Order(2)
public class SecondRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        // Executes second
    }
}

@Component
@Order(3)
public class ThirdRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        // Executes third
    }
}
```

**Benefits**:

- **Initialization**: Execute startup logic after context is ready
- **Cleanup**: Graceful shutdown with resource cleanup
- **Ordering**: Control execution sequence with `@Order`
- **Flexibility**: Choose between `ApplicationRunner` (structured args) or `CommandLineRunner` (raw args)

## Related Documentation

- **[Spring Boot Best Practices](ex-soen-plwe-to-jvspbo__best-practices.md)** - Production standards
- **[Spring Boot Anti-Patterns](ex-soen-plwe-to-jvspbo__anti-patterns.md)** - Common mistakes
- **[Configuration](ex-soen-plwe-to-jvspbo__configuration.md)** - Configuration management
- **[Dependency Injection](ex-soen-plwe-to-jvspbo__dependency-injection.md)** - DI patterns
- **[Functional Programming](ex-soen-plwe-to-jvspbo__functional-programming.md)** - FP with Spring Boot

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Idioms](../jvm-spring/ex-soen-plwe-to-jvsp__idioms.md) - Manual Spring setup patterns
- [Java Best Practices](../../../programming-languages/java/ex-soen-prla-ja__coding-standards.md) - Java baseline standards
- [Spring Boot Configuration](./ex-soen-plwe-to-jvspbo__configuration.md) - Type-safe configuration patterns
- [Spring Boot Dependency Injection](./ex-soen-plwe-to-jvspbo__dependency-injection.md) - DI best practices

---

**Last Updated**: 2026-01-25
**Spring Boot Version**: 3.3+
