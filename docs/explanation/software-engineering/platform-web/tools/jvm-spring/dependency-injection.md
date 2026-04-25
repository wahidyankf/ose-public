---
title: Spring Framework Dependency Injection
description: IoC container deep-dive covering ApplicationContext types, constructor/setter/field injection, @Autowired/@Qualifier/@Primary, bean scopes, @Lazy, bean lifecycle, BeanPostProcessor, and circular dependency resolution
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - dependency-injection
  - ioc-container
  - autowiring
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - immutability
  - automation-over-manual
created: 2026-01-29
---

# Spring Framework Dependency Injection

**Understanding-oriented documentation** for Spring Framework's IoC container and dependency injection mechanisms.

## Overview

Dependency Injection (DI) is Spring Framework's core capability, implementing Inversion of Control (IoC) to manage object lifecycles and dependencies. This document explores the IoC container, injection patterns, bean scopes, lifecycle management, and advanced DI techniques.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [ApplicationContext Types](#applicationcontext-types)
- [Constructor Injection](#constructor-injection-recommended)
- [Setter Injection](#setter-injection)
- [Field Injection](#field-injection-discouraged)
- [@Autowired Annotation](#autowired-annotation)
- [@Qualifier and @Primary](#qualifier-and-primary)
- [Bean Scopes](#bean-scopes)
- [Lazy Initialization](#lazy-initialization)
- [Bean Lifecycle](#bean-lifecycle)
- [BeanPostProcessor](#beanpostprocessor)
- [Circular Dependency Resolution](#circular-dependency-resolution)

### AnnotationConfigApplicationContext

Used for Java-based configuration without XML.

**Java Example** (Zakat Application):

```java
// Configuration class
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class ZakatApplicationConfig {

  @Bean
  public DataSource dataSource() {
    // Configuration
  }
}

// Bootstrap
public class ZakatApplication {
  public static void main(String[] args) {
    ApplicationContext context = new AnnotationConfigApplicationContext(
      ZakatApplicationConfig.class
    );

    ZakatCalculationService service = context.getBean(ZakatCalculationService.class);
    // Use service

    ((AnnotationConfigApplicationContext) context).close();
  }
}
```

**Kotlin Example**:

```kotlin
// Configuration class
@Configuration
@ComponentScan(basePackages = ["com.oseplatform.zakat"])
class ZakatApplicationConfig {

  @Bean
  fun dataSource(): DataSource {
    // Configuration
  }
}

// Bootstrap
fun main() {
  val context = AnnotationConfigApplicationContext(ZakatApplicationConfig::class.java)

  val service = context.getBean(ZakatCalculationService::class.java)
  // Use service

  context.close()
}
```

### ClassPathXmlApplicationContext

Used for XML-based configuration (legacy).

**Java Example**:

```java
ApplicationContext context = new ClassPathXmlApplicationContext(
  "applicationContext.xml"
);

ZakatCalculationService service = context.getBean("zakatCalculationService", ZakatCalculationService.class);
```

### GenericWebApplicationContext

Used for web applications.

**Java Example**:

```java
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.oseplatform.murabaha.api")
public class WebConfig implements WebMvcConfigurer {
  // Web configuration
}

// Initialized by Spring in web.xml or WebApplicationInitializer
```

## Constructor Injection (Recommended)

Constructor injection is the preferred DI method because it ensures immutable dependencies and makes testing easier.

### Basic Constructor Injection

**Java Example** (Donation Service):

```java
@Service
public class DonationService {
  private final DonationRepository repository;
  private final DonationValidator validator;
  private final ApplicationEventPublisher eventPublisher;

  // Constructor injection - all dependencies required
  public DonationService(
    DonationRepository repository,
    DonationValidator validator,
    ApplicationEventPublisher eventPublisher
  ) {
    this.repository = repository;
    this.validator = validator;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    // Validate
    ValidationResult validation = validator.validate(request);
    if (validation.hasErrors()) {
      throw new DonationValidationException(validation.errors());
    }

    // Create donation
    Donation donation = Donation.create(
      request.amount(),
      request.category(),
      request.donorId(),
      LocalDate.now()
    );

    // Persist
    repository.save(donation);

    // Publish event
    eventPublisher.publishEvent(new DonationCreatedEvent(donation.getId()));

    return toResponse(donation);
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
  // Constructor injection with val - immutable properties
  private val repository: DonationRepository,
  private val validator: DonationValidator,
  private val eventPublisher: ApplicationEventPublisher
) {

  @Transactional
  fun processDonation(request: CreateDonationRequest): DonationResponse {
    // Validate
    val validation = validator.validate(request)
    if (validation.hasErrors()) {
      throw DonationValidationException(validation.errors())
    }

    // Create donation
    val donation = Donation.create(
      request.amount,
      request.category,
      request.donorId,
      LocalDate.now()
    )

    // Persist
    repository.save(donation)

    // Publish event
    eventPublisher.publishEvent(DonationCreatedEvent(donation.id))

    return donation.toResponse()
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

### Constructor Injection with @Autowired (Optional)

Since Spring 4.3, `@Autowired` is optional for single-constructor classes.

**Java Example**:

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;

  // @Autowired optional for single constructor
  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository
  ) {
    this.calculator = calculator;
    this.repository = repository;
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class ZakatCalculationService(
  // @Autowired optional for single constructor
  private val calculator: ZakatCalculator,
  private val repository: ZakatCalculationRepository
)
```

## Setter Injection

Setter injection is used for optional dependencies or when reconfiguration is needed.

### Basic Setter Injection

**Java Example** (Report Service):

```java
@Service
public class MurabahaReportService {
  private final MurabahaContractRepository repository;
  private ReportFormatter formatter;

  // Constructor injection for required dependencies
  public MurabahaReportService(MurabahaContractRepository repository) {
    this.repository = repository;
    this.formatter = new DefaultReportFormatter();  // Default
  }

  // Setter injection for optional dependencies
  @Autowired(required = false)
  public void setFormatter(ReportFormatter formatter) {
    this.formatter = formatter;
  }

  public String generateReport(YearMonth month) {
    List<MurabahaContract> contracts = repository.findByMonth(month);
    return formatter.format(contracts);
  }
}
```

**Kotlin Example** (Report Service):

```kotlin
@Service
class MurabahaReportService(
  // Constructor injection for required dependencies
  private val repository: MurabahaContractRepository
) {
  // Var for optional dependency with setter injection
  private var formatter: ReportFormatter = DefaultReportFormatter()

  @Autowired(required = false)
  fun setFormatter(formatter: ReportFormatter) {
    this.formatter = formatter
  }

  fun generateReport(month: YearMonth): String {
    val contracts = repository.findByMonth(month)
    return formatter.format(contracts)
  }
}
```

## Field Injection (Discouraged)

Field injection is convenient but has drawbacks: prevents immutability, hinders testing, and hides dependencies.

### Field Injection Example

**Java Example** (Discouraged):

```java
@Service
public class ZakatCalculationService {
  // ❌ Field injection - not recommended
  @Autowired
  private ZakatCalculator calculator;

  @Autowired
  private ZakatCalculationRepository repository;

  // Problems:
  // - Cannot use final (immutability lost)
  // - Difficult to test (requires Spring container)
  // - Hidden dependencies
  // - No compile-time guarantee
}
```

**Kotlin Example** (Discouraged):

```kotlin
@Service
class ZakatCalculationService {
  // ❌ Field injection - not recommended
  @Autowired
  private lateinit var calculator: ZakatCalculator

  @Autowired
  private lateinit var repository: ZakatCalculationRepository

  // Problems:
  // - Requires lateinit (nullable workaround)
  // - Difficult to test
  // - Hidden dependencies
  // - Runtime initialization
}
```

### @Autowired on Constructor

**Java Example**:

```java
@Service
public class MurabahaContractService {
  private final MurabahaContractRepository repository;
  private final ProfitRateCalculator profitRateCalculator;

  @Autowired  // Optional for single constructor
  public MurabahaContractService(
    MurabahaContractRepository repository,
    ProfitRateCalculator profitRateCalculator
  ) {
    this.repository = repository;
    this.profitRateCalculator = profitRateCalculator;
  }
}
```

### @Autowired with Required Flag

**Java Example**:

```java
@Service
public class DonationNotificationService {
  private EmailService emailService;
  private SmsService smsService;

  @Autowired(required = false)
  public void setEmailService(EmailService emailService) {
    this.emailService = emailService;
  }

  @Autowired(required = false)
  public void setSmsService(SmsService smsService) {
    this.smsService = smsService;
  }

  public void sendNotification(Donation donation) {
    if (emailService != null) {
      emailService.send(donation.getDonorEmail(), formatMessage(donation));
    }

    if (smsService != null) {
      smsService.send(donation.getDonorPhone(), formatMessage(donation));
    }
  }

  private String formatMessage(Donation donation) {
    return String.format("Thank you for your donation of %s", donation.getAmount());
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class DonationNotificationService {
  private var emailService: EmailService? = null
  private var smsService: SmsService? = null

  @Autowired(required = false)
  fun setEmailService(emailService: EmailService) {
    this.emailService = emailService
  }

  @Autowired(required = false)
  fun setSmsService(smsService: SmsService) {
    this.smsService = smsService
  }

  fun sendNotification(donation: Donation) {
    emailService?.send(donation.donorEmail, formatMessage(donation))
    smsService?.send(donation.donorPhone, formatMessage(donation))
  }

  private fun formatMessage(donation: Donation): String =
    "Thank you for your donation of ${donation.amount}"
}
```

### @Qualifier for Disambiguating Beans

**Java Example** (Multiple DataSource):

```java
@Configuration
public class DataSourceConfiguration {

  @Bean
  @Qualifier("primaryDataSource")
  public DataSource primaryDataSource() {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl("jdbc:postgresql://localhost:5432/ose_primary");
    config.setUsername("primary_user");
    config.setPassword("primary_password");
    return new HikariDataSource(config);
  }

  @Bean
  @Qualifier("reportsDataSource")
  public DataSource reportsDataSource() {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl("jdbc:postgresql://localhost:5432/ose_reports");
    config.setUsername("reports_user");
    config.setPassword("reports_password");
    return new HikariDataSource(config);
  }
}

@Repository
public class ZakatCalculationRepository {
  private final JdbcTemplate jdbcTemplate;

  public ZakatCalculationRepository(
    @Qualifier("primaryDataSource") DataSource dataSource
  ) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }
}

@Repository
public class DonationReportsRepository {
  private final JdbcTemplate jdbcTemplate;

  public DonationReportsRepository(
    @Qualifier("reportsDataSource") DataSource dataSource
  ) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class DataSourceConfiguration {

  @Bean
  @Qualifier("primaryDataSource")
  fun primaryDataSource(): DataSource {
    val config = HikariConfig().apply {
      jdbcUrl = "jdbc:postgresql://localhost:5432/ose_primary"
      username = "primary_user"
      password = "primary_password"
    }
    return HikariDataSource(config)
  }

  @Bean
  @Qualifier("reportsDataSource")
  fun reportsDataSource(): DataSource {
    val config = HikariConfig().apply {
      jdbcUrl = "jdbc:postgresql://localhost:5432/ose_reports"
      username = "reports_user"
      password = "reports_password"
    }
    return HikariDataSource(config)
  }
}

@Repository
class ZakatCalculationRepository(
  @Qualifier("primaryDataSource") dataSource: DataSource
) {
  private val jdbcTemplate = JdbcTemplate(dataSource)
}

@Repository
class DonationReportsRepository(
  @Qualifier("reportsDataSource") dataSource: DataSource
) {
  private val jdbcTemplate = JdbcTemplate(dataSource)
}
```

### @Primary for Default Bean

**Java Example**:

```java
@Configuration
public class NotificationConfiguration {

  @Bean
  @Primary
  public NotificationService emailNotificationService() {
    return new EmailNotificationService();
  }

  @Bean
  public NotificationService smsNotificationService() {
    return new SmsNotificationService();
  }
}

@Service
public class DonationService {
  private final NotificationService notificationService;

  // Injects emailNotificationService (marked as @Primary)
  public DonationService(NotificationService notificationService) {
    this.notificationService = notificationService;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class NotificationConfiguration {

  @Bean
  @Primary
  fun emailNotificationService(): NotificationService = EmailNotificationService()

  @Bean
  fun smsNotificationService(): NotificationService = SmsNotificationService()
}

@Service
class DonationService(
  // Injects emailNotificationService (marked as @Primary)
  private val notificationService: NotificationService
)
```

### Singleton (Default)

One instance per Spring container.

**Java Example**:

```java
@Service
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)  // Default, can omit
public class NisabService {
  private final GoldPriceService goldPriceService;

  public NisabService(GoldPriceService goldPriceService) {
    this.goldPriceService = goldPriceService;
  }

  public Money calculateCurrentNisab(String currency) {
    BigDecimal goldPricePerGram = goldPriceService.getCurrentPrice(currency);
    BigDecimal nisabGoldGrams = new BigDecimal("85");
    BigDecimal nisabValue = goldPricePerGram.multiply(nisabGoldGrams);
    return Money.of(nisabValue, currency);
  }
}
```

### Prototype

New instance for each request.

**Java Example**:

```java
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class ZakatCalculationBuilder {
  private Money wealth;
  private Money nisab;
  private LocalDate calculationDate;

  public ZakatCalculationBuilder wealth(Money wealth) {
    this.wealth = wealth;
    return this;
  }

  public ZakatCalculationBuilder nisab(Money nisab) {
    this.nisab = nisab;
    return this;
  }

  public ZakatCalculationBuilder calculationDate(LocalDate calculationDate) {
    this.calculationDate = calculationDate;
    return this;
  }

  public ZakatCalculation build() {
    return ZakatCalculation.calculate(
      UUID.randomUUID().toString(),
      wealth,
      nisab,
      ZakatRate.standard(),
      calculationDate
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class ZakatCalculationBuilder {
  private var wealth: Money? = null
  private var nisab: Money? = null
  private var calculationDate: LocalDate? = null

  fun wealth(wealth: Money): ZakatCalculationBuilder {
    this.wealth = wealth
    return this
  }

  fun nisab(nisab: Money): ZakatCalculationBuilder {
    this.nisab = nisab
    return this
  }

  fun calculationDate(calculationDate: LocalDate): ZakatCalculationBuilder {
    this.calculationDate = calculationDate
    return this
  }

  fun build(): ZakatCalculation = ZakatCalculation.calculate(
    id = UUID.randomUUID().toString(),
    wealth = requireNotNull(wealth) { "Wealth is required" },
    nisab = requireNotNull(nisab) { "Nisab is required" },
    rate = ZakatRate.standard(),
    calculationDate = requireNotNull(calculationDate) { "Calculation date is required" }
  )
}
```

### Request and Session Scopes

**Java Example**:

```java
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class DonationSessionContext {
  private String donorId;
  private List<Donation> sessionDonations = new ArrayList<>();

  public void addDonation(Donation donation) {
    sessionDonations.add(donation);
  }

  public List<Donation> getSessionDonations() {
    return Collections.unmodifiableList(sessionDonations);
  }

  public String getDonorId() {
    return donorId;
  }

  public void setDonorId(String donorId) {
    this.donorId = donorId;
  }
}
```

### @Lazy Annotation

**Java Example**:

```java
@Configuration
public class ApplicationConfiguration {

  @Bean
  @Lazy
  public ExpensiveResource expensiveResource() {
    // Only initialized when first requested
    return new ExpensiveResource();
  }
}

@Service
public class MurabahaContractService {
  private final MurabahaContractRepository repository;
  private final ExpensiveResource expensiveResource;

  public MurabahaContractService(
    MurabahaContractRepository repository,
    @Lazy ExpensiveResource expensiveResource  // Lazy injection
  ) {
    this.repository = repository;
    this.expensiveResource = expensiveResource;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class ApplicationConfiguration {

  @Bean
  @Lazy
  fun expensiveResource(): ExpensiveResource {
    // Only initialized when first requested
    return ExpensiveResource()
  }
}

@Service
class MurabahaContractService(
  private val repository: MurabahaContractRepository,
  @Lazy private val expensiveResource: ExpensiveResource  // Lazy injection
)
```

### Initialization Callbacks

**Java Example**:

```java
@Component
public class DatabaseConnectionPool implements InitializingBean, DisposableBean {
  private HikariDataSource dataSource;

  @Value("${db.url}")
  private String url;

  @Override
  public void afterPropertiesSet() throws Exception {
    // Initialization callback
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(url);
    dataSource = new HikariDataSource(config);
  }

  @Override
  public void destroy() throws Exception {
    // Destruction callback
    if (dataSource != null && !dataSource.isClosed()) {
      dataSource.close();
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Component
class DatabaseConnectionPool : InitializingBean, DisposableBean {
  private lateinit var dataSource: HikariDataSource

  @Value("\${db.url}")
  private lateinit var url: String

  override fun afterPropertiesSet() {
    // Initialization callback
    val config = HikariConfig().apply {
      jdbcUrl = url
    }
    dataSource = HikariDataSource(config)
  }

  override fun destroy() {
    // Destruction callback
    if (::dataSource.isInitialized && !dataSource.isClosed) {
      dataSource.close()
    }
  }
}
```

### @PostConstruct and @PreDestroy

**Java Example**:

```java
@Component
public class ZakatCalculationCache {
  private Cache cache;

  @PostConstruct
  public void initialize() {
    // Called after dependency injection
    cache = CacheBuilder.newBuilder()
      .maximumSize(1000)
      .expireAfterWrite(10, TimeUnit.MINUTES)
      .build();
  }

  @PreDestroy
  public void cleanup() {
    // Called before bean destruction
    if (cache != null) {
      cache.invalidateAll();
    }
  }
}
```

### Custom BeanPostProcessor

**Java Example**:

```java
@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {
  private static final Logger logger = LoggerFactory.getLogger(LoggingBeanPostProcessor.class);

  @Override
  public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
    logger.debug("Initializing bean: {}", beanName);
    return bean;
  }

  @Override
  public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
    logger.debug("Bean initialized: {}", beanName);
    return bean;
  }
}
```

**Kotlin Example**:

```kotlin
@Component
class LoggingBeanPostProcessor : BeanPostProcessor {
  companion object {
    private val logger = LoggerFactory.getLogger(LoggingBeanPostProcessor::class.java)
  }

  override fun postProcessBeforeInitialization(bean: Any, beanName: String): Any {
    logger.debug("Initializing bean: {}", beanName)
    return bean
  }

  override fun postProcessAfterInitialization(bean: Any, beanName: String): Any {
    logger.debug("Bean initialized: {}", beanName)
    return bean
  }
}
```

### Problem: Circular Dependencies

**Java Example** (Bad):

```java
@Service
public class MurabahaContractService {
  private final DonationService donationService;

  public MurabahaContractService(DonationService donationService) {
    this.donationService = donationService;
  }
}

@Service
public class DonationService {
  private final MurabahaContractService contractService;

  public DonationService(MurabahaContractService contractService) {
    this.contractService = contractService;
  }
}
// Circular dependency error!
```

### Solution: Refactor Architecture

**Java Example** (Good - Extract Shared Service):

```java
@Service
public class FundsAllocationService {
  private final FundsAllocationRepository repository;

  public FundsAllocationService(FundsAllocationRepository repository) {
    this.repository = repository;
  }

  public void allocateFunds(String contractId, Money amount) {
    repository.recordAllocation(contractId, amount);
  }
}

@Service
public class MurabahaContractService {
  private final FundsAllocationService fundsAllocationService;

  public MurabahaContractService(FundsAllocationService fundsAllocationService) {
    this.fundsAllocationService = fundsAllocationService;
  }
}

@Service
public class DonationService {
  private final FundsAllocationService fundsAllocationService;

  public DonationService(FundsAllocationService fundsAllocationService) {
    this.fundsAllocationService = fundsAllocationService;
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Idioms](idioms.md)** - Framework patterns
- **[Best Practices](best-practices.md)** - Production standards
- **[Configuration](configuration.md)** - Configuration approaches

## See Also

**OSE Explanation Foundation**:

- [Java Dependency Management](../../../programming-languages/java/framework-integration.md) - Java baseline DI
- [Spring Framework Idioms](./idioms.md) - DI patterns
- [Spring Framework Configuration](./configuration.md) - Bean configuration
- [Spring Framework Best Practices](./best-practices.md) - DI best practices

**Hands-on Learning (AyoKoding)**:

- [Spring In-the-Field - DI Strategies](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/in-the-field/dependency-injection.md) - Production patterns

**Spring Boot Extension**:

- [Spring Boot Dependency Injection](../jvm-spring-boot/dependency-injection.md) - Auto-wired patterns

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
