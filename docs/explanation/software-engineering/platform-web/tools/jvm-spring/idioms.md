---
title: Spring Framework Idioms
description: Framework-specific patterns for IoC container, ApplicationContext, bean definitions, component scanning, dependency injection, bean lifecycle, scopes, and property resolution
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - idioms
  - ioc-container
  - dependency-injection
  - bean-lifecycle
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - automation-over-manual
  - immutability
  - pure-functions
created: 2026-01-29
---

# Spring Framework Idioms

**Understanding-oriented documentation** for Spring Framework-specific patterns and idioms.

## Overview

Spring Framework idioms represent the conventional, idiomatic ways to use the framework's core features. These patterns leverage Spring's Inversion of Control (IoC) container, dependency injection, bean lifecycle management, and configuration mechanisms to build maintainable, testable Java and Kotlin applications.

This documentation covers idiomatic Spring Framework usage for enterprise applications with both Java and Kotlin examples, focusing on Islamic finance domain scenarios (Zakat calculation, Murabaha contracts, donation processing).

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [IoC Container and ApplicationContext](#ioc-container-and-applicationcontext)
- [Bean Definitions](#bean-definitions)
- [Component Scanning](#component-scanning)
- [Dependency Injection Patterns](#dependency-injection-patterns)
- [Bean Lifecycle](#bean-lifecycle)
- [Bean Scopes](#bean-scopes)
- [Property Resolution](#property-resolution)
- [Resource Loading](#resource-loading)
- [Conditional Configuration](#conditional-configuration)
- [Profile-Based Configuration](#profile-based-configuration)

### ApplicationContext Types

Spring provides several ApplicationContext implementations for different configuration approaches.

#### AnnotationConfigApplicationContext (Java Config)

**Java Example**:

```java
// Configuration class
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
@PropertySource("classpath:application.properties")
public class ZakatApplicationConfig {

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
    config.setMaximumPoolSize(10);
    config.setMinimumIdle(5);
    return new HikariDataSource(config);
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }

  @Bean
  public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
  }
}

// Bootstrap application
public class ZakatApplication {
  public static void main(String[] args) {
    ApplicationContext context = new AnnotationConfigApplicationContext(
      ZakatApplicationConfig.class
    );

    ZakatCalculationService service = context.getBean(ZakatCalculationService.class);
    // Use service
  }
}
```

**Kotlin Example**:

```kotlin
// Configuration class
@Configuration
@ComponentScan(basePackages = ["com.oseplatform.zakat"])
@PropertySource("classpath:application.properties")
class ZakatApplicationConfig {

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
      maximumPoolSize = 10
      minimumIdle = 5
    }
    return HikariDataSource(config)
  }

  @Bean
  fun jdbcTemplate(dataSource: DataSource): JdbcTemplate = JdbcTemplate(dataSource)

  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)
}

// Bootstrap application
fun main() {
  val context = AnnotationConfigApplicationContext(ZakatApplicationConfig::class.java)
  val service = context.getBean(ZakatCalculationService::class.java)
  // Use service
}
```

#### GenericWebApplicationContext (Web Applications)

**Java Example**:

```java
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.oseplatform.murabaha")
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void configureViewResolvers(ViewResolverRegistry registry) {
    InternalResourceViewResolver resolver = new InternalResourceViewResolver();
    resolver.setPrefix("/WEB-INF/views/");
    resolver.setSuffix(".jsp");
    registry.viewResolver(resolver);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
      .allowedOrigins("https://oseplatform.com")
      .allowedMethods("GET", "POST", "PUT", "DELETE")
      .allowedHeaders("*")
      .maxAge(3600);
  }

  @Bean
  public ObjectMapper objectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
    return mapper;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = ["com.oseplatform.murabaha"])
class WebConfig : WebMvcConfigurer {

  override fun configureViewResolvers(registry: ViewResolverRegistry) {
    val resolver = InternalResourceViewResolver().apply {
      setPrefix("/WEB-INF/views/")
      setSuffix(".jsp")
    }
    registry.viewResolver(resolver)
  }

  override fun addCorsMappings(registry: CorsRegistry) {
    registry.addMapping("/api/**")
      .allowedOrigins("https://oseplatform.com")
      .allowedMethods("GET", "POST", "PUT", "DELETE")
      .allowedHeaders("*")
      .maxAge(3600)
  }

  @Bean
  fun objectMapper(): ObjectMapper = ObjectMapper().apply {
    registerModule(JavaTimeModule())
    configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
  }
}
```

### @Configuration and @Bean

**Java Example** (Zakat Calculator):

```java
@Configuration
public class ZakatConfiguration {

  @Bean
  public ZakatRateProvider zakatRateProvider() {
    return new StandardZakatRateProvider(new BigDecimal("0.025")); // 2.5%
  }

  @Bean
  public NisabCalculator nisabCalculator(
    @Value("${zakat.nisab.gold-grams}") BigDecimal goldGrams,
    @Value("${zakat.nisab.gold-price-per-gram}") BigDecimal goldPrice
  ) {
    return new GoldBasedNisabCalculator(goldGrams, goldPrice);
  }

  @Bean
  public ZakatCalculator zakatCalculator(
    ZakatRateProvider rateProvider,
    NisabCalculator nisabCalculator
  ) {
    return new DefaultZakatCalculator(rateProvider, nisabCalculator);
  }

  @Bean
  @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
  public ZakatCalculation zakatCalculation() {
    return new ZakatCalculation();
  }
}
```

**Kotlin Example** (Zakat Calculator):

```kotlin
@Configuration
class ZakatConfiguration {

  @Bean
  fun zakatRateProvider(): ZakatRateProvider =
    StandardZakatRateProvider(BigDecimal("0.025")) // 2.5%

  @Bean
  fun nisabCalculator(
    @Value("\${zakat.nisab.gold-grams}") goldGrams: BigDecimal,
    @Value("\${zakat.nisab.gold-price-per-gram}") goldPrice: BigDecimal
  ): NisabCalculator = GoldBasedNisabCalculator(goldGrams, goldPrice)

  @Bean
  fun zakatCalculator(
    rateProvider: ZakatRateProvider,
    nisabCalculator: NisabCalculator
  ): ZakatCalculator = DefaultZakatCalculator(rateProvider, nisabCalculator)

  @Bean
  @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
  fun zakatCalculation(): ZakatCalculation = ZakatCalculation()
}
```

### Factory Methods

**Java Example** (Murabaha Contract Factory):

```java
@Configuration
public class MurabahaConfiguration {

  @Bean
  public MurabahaContractFactory contractFactory(
    ProfitRateValidator profitRateValidator,
    AssetValueValidator assetValueValidator
  ) {
    return new MurabahaContractFactory(profitRateValidator, assetValueValidator);
  }

  @Bean
  public MurabahaContract createContract(
    MurabahaContractFactory factory,
    @Qualifier("contractRequest") MurabahaContractRequest request
  ) {
    return factory.createContract(request);
  }

  @Bean
  public ProfitRateValidator profitRateValidator(
    @Value("${murabaha.profit-rate.min}") BigDecimal minRate,
    @Value("${murabaha.profit-rate.max}") BigDecimal maxRate
  ) {
    return new RangeProfitRateValidator(minRate, maxRate);
  }

  @Bean
  public AssetValueValidator assetValueValidator(
    @Value("${murabaha.asset.min-value}") BigDecimal minValue
  ) {
    return new MinimumAssetValueValidator(minValue);
  }
}
```

**Kotlin Example** (Murabaha Contract Factory):

```kotlin
@Configuration
class MurabahaConfiguration {

  @Bean
  fun contractFactory(
    profitRateValidator: ProfitRateValidator,
    assetValueValidator: AssetValueValidator
  ): MurabahaContractFactory =
    MurabahaContractFactory(profitRateValidator, assetValueValidator)

  @Bean
  fun createContract(
    factory: MurabahaContractFactory,
    @Qualifier("contractRequest") request: MurabahaContractRequest
  ): MurabahaContract = factory.createContract(request)

  @Bean
  fun profitRateValidator(
    @Value("\${murabaha.profit-rate.min}") minRate: BigDecimal,
    @Value("\${murabaha.profit-rate.max}") maxRate: BigDecimal
  ): ProfitRateValidator = RangeProfitRateValidator(minRate, maxRate)

  @Bean
  fun assetValueValidator(
    @Value("\${murabaha.asset.min-value}") minValue: BigDecimal
  ): AssetValueValidator = MinimumAssetValueValidator(minValue)
}
```

### @Component, @Service, @Repository

**Java Example** (Donation Processing):

```java
// Domain repository
@Repository
public class JdbcDonationRepository implements DonationRepository {
  private final JdbcTemplate jdbcTemplate;

  public JdbcDonationRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public Optional<Donation> findById(DonationId id) {
    String sql = "SELECT * FROM donations WHERE id = ?";
    try {
      Donation donation = jdbcTemplate.queryForObject(
        sql,
        new DonationRowMapper(),
        id.getValue()
      );
      return Optional.ofNullable(donation);
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  @Override
  @Transactional
  public void save(Donation donation) {
    String sql = """
      INSERT INTO donations (id, amount, category, donor_name, donation_date)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category
      """;

    jdbcTemplate.update(sql,
      donation.getId().getValue(),
      donation.getAmount().getAmount(),
      donation.getCategory().name(),
      donation.getDonorName(),
      donation.getDonationDate()
    );
  }
}

// Application service
@Service
public class DonationService {
  private final DonationRepository repository;
  private final ApplicationEventPublisher eventPublisher;

  public DonationService(
    DonationRepository repository,
    ApplicationEventPublisher eventPublisher
  ) {
    this.repository = repository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public DonationResponse recordDonation(RecordDonationRequest request) {
    Donation donation = Donation.create(
      request.amount(),
      request.category(),
      request.donorName(),
      request.donationDate()
    );

    repository.save(donation);

    eventPublisher.publishEvent(new DonationRecordedEvent(donation.getId()));

    return toResponse(donation);
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId().getValue(),
      donation.getAmount(),
      donation.getCategory(),
      donation.getDonorName(),
      donation.getDonationDate()
    );
  }
}

// Component for event handling
@Component
class DonationEventHandler {
  private static final Logger logger = LoggerFactory.getLogger(DonationEventHandler.class);

  @EventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handleDonationRecorded(DonationRecordedEvent event) {
    logger.info("Donation recorded: {}", event.getDonationId());
    // Send notification, update projection, etc.
  }
}
```

**Kotlin Example** (Donation Processing):

```kotlin
// Domain repository
@Repository
class JdbcDonationRepository(
  private val jdbcTemplate: JdbcTemplate
) : DonationRepository {

  override fun findById(id: DonationId): Optional<Donation> {
    val sql = "SELECT * FROM donations WHERE id = ?"
    return try {
      val donation = jdbcTemplate.queryForObject(
        sql,
        DonationRowMapper(),
        id.value
      )
      Optional.ofNullable(donation)
    } catch (e: EmptyResultDataAccessException) {
      Optional.empty()
    }
  }

  @Transactional
  override fun save(donation: Donation) {
    val sql = """
      INSERT INTO donations (id, amount, category, donor_name, donation_date)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category
      """

    jdbcTemplate.update(sql,
      donation.id.value,
      donation.amount.amount,
      donation.category.name,
      donation.donorName,
      donation.donationDate
    )
  }
}

// Application service
@Service
class DonationService(
  private val repository: DonationRepository,
  private val eventPublisher: ApplicationEventPublisher
) {

  @Transactional
  fun recordDonation(request: RecordDonationRequest): DonationResponse {
    val donation = Donation.create(
      request.amount,
      request.category,
      request.donorName,
      request.donationDate
    )

    repository.save(donation)

    eventPublisher.publishEvent(DonationRecordedEvent(donation.id))

    return donation.toResponse()
  }

  private fun Donation.toResponse(): DonationResponse = DonationResponse(
    id.value,
    amount,
    category,
    donorName,
    donationDate
  )
}

// Component for event handling
@Component
class DonationEventHandler {
  companion object {
    private val logger = LoggerFactory.getLogger(DonationEventHandler::class.java)
  }

  @EventListener
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  fun handleDonationRecorded(event: DonationRecordedEvent) {
    logger.info("Donation recorded: {}", event.donationId)
    // Send notification, update projection, etc.
  }
}
```

### Base Package Configuration

**Java Example**:

```java
@Configuration
@ComponentScan(
  basePackages = {
    "com.oseplatform.zakat",
    "com.oseplatform.murabaha",
    "com.oseplatform.donation"
  },
  includeFilters = @ComponentScan.Filter(
    type = FilterType.ANNOTATION,
    classes = {Service.class, Repository.class, Component.class}
  ),
  excludeFilters = @ComponentScan.Filter(
    type = FilterType.REGEX,
    pattern = "com\\.oseplatform\\..*\\.test\\..*"
  )
)
public class ApplicationConfig {
  // Configuration beans
}
```

**Kotlin Example**:

```kotlin
@Configuration
@ComponentScan(
  basePackages = [
    "com.oseplatform.zakat",
    "com.oseplatform.murabaha",
    "com.oseplatform.donation"
  ],
  includeFilters = [
    ComponentScan.Filter(
      type = FilterType.ANNOTATION,
      classes = [Service::class, Repository::class, Component::class]
    )
  ],
  excludeFilters = [
    ComponentScan.Filter(
      type = FilterType.REGEX,
      pattern = ["com\\.oseplatform\\..*\\.test\\..*"]
    )
  ]
)
class ApplicationConfig {
  // Configuration beans
}
```

### Constructor Injection (Preferred)

**Java Example** (Zakat Calculation):

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;
  private final IdGenerator idGenerator;

  // Constructor injection - dependencies are required and immutable
  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository,
    IdGenerator idGenerator
  ) {
    this.calculator = calculator;
    this.repository = repository;
    this.idGenerator = idGenerator;
  }

  @Transactional
  public ZakatCalculationResponse calculate(CreateZakatCalculationRequest request) {
    String id = idGenerator.generate();

    ZakatCalculationResult result = calculator.calculate(
      request.wealth(),
      request.nisab()
    );

    ZakatCalculation calculation = new ZakatCalculation(
      id,
      request.wealth(),
      request.nisab(),
      result.zakatAmount(),
      result.eligible(),
      LocalDate.now()
    );

    repository.save(calculation);

    return toResponse(calculation);
  }

  private ZakatCalculationResponse toResponse(ZakatCalculation calculation) {
    return new ZakatCalculationResponse(
      calculation.getId(),
      calculation.getWealth(),
      calculation.getNisab(),
      calculation.getZakatAmount(),
      calculation.isEligible(),
      calculation.getCalculationDate()
    );
  }
}
```

**Kotlin Example** (Zakat Calculation):

```kotlin
@Service
class ZakatCalculationService(
  private val calculator: ZakatCalculator,
  private val repository: ZakatCalculationRepository,
  private val idGenerator: IdGenerator
) {

  @Transactional
  fun calculate(request: CreateZakatCalculationRequest): ZakatCalculationResponse {
    val id = idGenerator.generate()

    val result = calculator.calculate(request.wealth, request.nisab)

    val calculation = ZakatCalculation(
      id = id,
      wealth = request.wealth,
      nisab = request.nisab,
      zakatAmount = result.zakatAmount,
      eligible = result.eligible,
      calculationDate = LocalDate.now()
    )

    repository.save(calculation)

    return calculation.toResponse()
  }

  private fun ZakatCalculation.toResponse(): ZakatCalculationResponse = ZakatCalculationResponse(
    id,
    wealth,
    nisab,
    zakatAmount,
    eligible,
    calculationDate
  )
}
```

### Setter Injection (Optional Dependencies)

**Java Example**:

```java
@Service
public class MurabahaReportService {
  private final MurabahaContractRepository repository;
  private ReportFormatter formatter;

  // Constructor injection for required dependencies
  public MurabahaReportService(MurabahaContractRepository repository) {
    this.repository = repository;
    this.formatter = new DefaultReportFormatter(); // Default implementation
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

**Kotlin Example**:

```kotlin
@Service
class MurabahaReportService(
  private val repository: MurabahaContractRepository
) {
  // Lateinit for optional dependencies with setter injection
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

### @Qualifier and @Primary

**Java Example** (Multiple DataSource Configuration):

```java
@Configuration
public class DataSourceConfiguration {

  @Bean
  @Primary
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

  @Bean
  public JdbcTemplate primaryJdbcTemplate(
    @Qualifier("primaryDataSource") DataSource dataSource
  ) {
    return new JdbcTemplate(dataSource);
  }

  @Bean
  public JdbcTemplate reportsJdbcTemplate(
    @Qualifier("reportsDataSource") DataSource dataSource
  ) {
    return new JdbcTemplate(dataSource);
  }
}

@Repository
public class DonationReportsRepository {
  private final JdbcTemplate jdbcTemplate;

  public DonationReportsRepository(
    @Qualifier("reportsJdbcTemplate") JdbcTemplate jdbcTemplate
  ) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<DonationSummary> findMonthlySummaries(YearMonth month) {
    String sql = """
      SELECT category, SUM(amount) as total
      FROM donations
      WHERE DATE_TRUNC('month', donation_date) = ?
      GROUP BY category
      """;

    return jdbcTemplate.query(sql, new DonationSummaryRowMapper(), month);
  }
}
```

**Kotlin Example** (Multiple DataSource Configuration):

```kotlin
@Configuration
class DataSourceConfiguration {

  @Bean
  @Primary
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

  @Bean
  fun primaryJdbcTemplate(
    @Qualifier("primaryDataSource") dataSource: DataSource
  ): JdbcTemplate = JdbcTemplate(dataSource)

  @Bean
  fun reportsJdbcTemplate(
    @Qualifier("reportsDataSource") dataSource: DataSource
  ): JdbcTemplate = JdbcTemplate(dataSource)
}

@Repository
class DonationReportsRepository(
  @Qualifier("reportsJdbcTemplate") private val jdbcTemplate: JdbcTemplate
) {

  fun findMonthlySummaries(month: YearMonth): List<DonationSummary> {
    val sql = """
      SELECT category, SUM(amount) as total
      FROM donations
      WHERE DATE_TRUNC('month', donation_date) = ?
      GROUP BY category
      """

    return jdbcTemplate.query(sql, DonationSummaryRowMapper(), month)
  }
}
```

### @PostConstruct and @PreDestroy

**Java Example** (Connection Pool Initialization):

```java
@Component
public class DatabaseConnectionPool {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionPool.class);

  private HikariDataSource dataSource;

  @Value("${db.url}")
  private String url;

  @Value("${db.username}")
  private String username;

  @Value("${db.password}")
  private String password;

  @PostConstruct
  public void initialize() {
    logger.info("Initializing database connection pool");

    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);
    config.setMaximumPoolSize(20);
    config.setMinimumIdle(5);
    config.setConnectionTimeout(30000);
    config.setIdleTimeout(600000);
    config.setMaxLifetime(1800000);

    dataSource = new HikariDataSource(config);

    logger.info("Database connection pool initialized successfully");
  }

  @PreDestroy
  public void cleanup() {
    logger.info("Shutting down database connection pool");

    if (dataSource != null && !dataSource.isClosed()) {
      dataSource.close();
    }

    logger.info("Database connection pool shut down successfully");
  }

  public HikariDataSource getDataSource() {
    return dataSource;
  }
}
```

**Kotlin Example** (Connection Pool Initialization):

```kotlin
@Component
class DatabaseConnectionPool {
  companion object {
    private val logger = LoggerFactory.getLogger(DatabaseConnectionPool::class.java)
  }

  private lateinit var dataSource: HikariDataSource

  @Value("\${db.url}")
  private lateinit var url: String

  @Value("\${db.username}")
  private lateinit var username: String

  @Value("\${db.password}")
  private lateinit var password: String

  @PostConstruct
  fun initialize() {
    logger.info("Initializing database connection pool")

    val config = HikariConfig().apply {
      jdbcUrl = url
      this.username = username
      this.password = password
      maximumPoolSize = 20
      minimumIdle = 5
      connectionTimeout = 30000
      idleTimeout = 600000
      maxLifetime = 1800000
    }

    dataSource = HikariDataSource(config)

    logger.info("Database connection pool initialized successfully")
  }

  @PreDestroy
  fun cleanup() {
    logger.info("Shutting down database connection pool")

    if (::dataSource.isInitialized && !dataSource.isClosed) {
      dataSource.close()
    }

    logger.info("Database connection pool shut down successfully")
  }

  fun getDataSource(): HikariDataSource = dataSource
}
```

### InitializingBean and DisposableBean

**Java Example** (Cache Initialization):

```java
@Component
public class ZakatCalculationCache implements InitializingBean, DisposableBean {
  private static final Logger logger = LoggerFactory.getLogger(ZakatCalculationCache.class);

  private final CacheManager cacheManager;
  private Cache calculationCache;

  public ZakatCalculationCache(CacheManager cacheManager) {
    this.cacheManager = cacheManager;
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    logger.info("Initializing Zakat calculation cache");

    calculationCache = cacheManager.getCache("zakatCalculations");
    if (calculationCache == null) {
      throw new IllegalStateException("Zakat calculation cache not configured");
    }

    // Pre-populate cache with common nisab values
    prePopulateCache();

    logger.info("Zakat calculation cache initialized successfully");
  }

  @Override
  public void destroy() throws Exception {
    logger.info("Clearing Zakat calculation cache");

    if (calculationCache != null) {
      calculationCache.clear();
    }

    logger.info("Zakat calculation cache cleared successfully");
  }

  private void prePopulateCache() {
    // Pre-populate with standard nisab values
    logger.info("Pre-populating cache with standard nisab values");
  }

  public void put(String key, ZakatCalculation value) {
    calculationCache.put(key, value);
  }

  public ZakatCalculation get(String key) {
    Cache.ValueWrapper wrapper = calculationCache.get(key);
    return wrapper != null ? (ZakatCalculation) wrapper.get() : null;
  }
}
```

**Kotlin Example** (Cache Initialization):

```kotlin
@Component
class ZakatCalculationCache(
  private val cacheManager: CacheManager
) : InitializingBean, DisposableBean {

  companion object {
    private val logger = LoggerFactory.getLogger(ZakatCalculationCache::class.java)
  }

  private lateinit var calculationCache: Cache

  override fun afterPropertiesSet() {
    logger.info("Initializing Zakat calculation cache")

    calculationCache = cacheManager.getCache("zakatCalculations")
      ?: throw IllegalStateException("Zakat calculation cache not configured")

    // Pre-populate cache with common nisab values
    prePopulateCache()

    logger.info("Zakat calculation cache initialized successfully")
  }

  override fun destroy() {
    logger.info("Clearing Zakat calculation cache")

    if (::calculationCache.isInitialized) {
      calculationCache.clear()
    }

    logger.info("Zakat calculation cache cleared successfully")
  }

  private fun prePopulateCache() {
    // Pre-populate with standard nisab values
    logger.info("Pre-populating cache with standard nisab values")
  }

  fun put(key: String, value: ZakatCalculation) {
    calculationCache.put(key, value)
  }

  fun get(key: String): ZakatCalculation? {
    val wrapper = calculationCache.get(key)
    return wrapper?.get() as? ZakatCalculation
  }
}
```

### Singleton (Default)

**Java Example**:

```java
@Service
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
public class NisabService {
  private final NisabCalculator nisabCalculator;

  // Singleton bean - shared across all requests
  public NisabService(NisabCalculator nisabCalculator) {
    this.nisabCalculator = nisabCalculator;
  }

  public BigDecimal calculateCurrentNisab() {
    return nisabCalculator.calculate();
  }
}
```

**Kotlin Example**:

```kotlin
@Service
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
class NisabService(
  private val nisabCalculator: NisabCalculator
) {
  // Singleton bean - shared across all requests
  fun calculateCurrentNisab(): BigDecimal = nisabCalculator.calculate()
}
```

### Prototype

**Java Example**:

```java
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class MurabahaContractBuilder {
  private BigDecimal assetCost;
  private BigDecimal downPayment;
  private BigDecimal profitRate;
  private int termMonths;

  // New instance created for each request
  public MurabahaContractBuilder assetCost(BigDecimal assetCost) {
    this.assetCost = assetCost;
    return this;
  }

  public MurabahaContractBuilder downPayment(BigDecimal downPayment) {
    this.downPayment = downPayment;
    return this;
  }

  public MurabahaContractBuilder profitRate(BigDecimal profitRate) {
    this.profitRate = profitRate;
    return this;
  }

  public MurabahaContractBuilder termMonths(int termMonths) {
    this.termMonths = termMonths;
    return this;
  }

  public MurabahaContract build() {
    return new MurabahaContract(assetCost, downPayment, profitRate, termMonths);
  }
}
```

**Kotlin Example**:

```kotlin
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class MurabahaContractBuilder {
  private var assetCost: BigDecimal? = null
  private var downPayment: BigDecimal? = null
  private var profitRate: BigDecimal? = null
  private var termMonths: Int? = null

  // New instance created for each request
  fun assetCost(assetCost: BigDecimal): MurabahaContractBuilder {
    this.assetCost = assetCost
    return this
  }

  fun downPayment(downPayment: BigDecimal): MurabahaContractBuilder {
    this.downPayment = downPayment
    return this
  }

  fun profitRate(profitRate: BigDecimal): MurabahaContractBuilder {
    this.profitRate = profitRate
    return this
  }

  fun termMonths(termMonths: Int): MurabahaContractBuilder {
    this.termMonths = termMonths
    return this
  }

  fun build(): MurabahaContract = MurabahaContract(
    requireNotNull(assetCost) { "Asset cost is required" },
    requireNotNull(downPayment) { "Down payment is required" },
    requireNotNull(profitRate) { "Profit rate is required" },
    requireNotNull(termMonths) { "Term months is required" }
  )
}
```

### Request and Session Scopes (Web Applications)

**Java Example**:

```java
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class DonationSessionContext {
  private String donorId;
  private String sessionToken;
  private LocalDateTime createdAt;

  @PostConstruct
  public void initialize() {
    this.createdAt = LocalDateTime.now();
  }

  public String getDonorId() {
    return donorId;
  }

  public void setDonorId(String donorId) {
    this.donorId = donorId;
  }

  public String getSessionToken() {
    return sessionToken;
  }

  public void setSessionToken(String sessionToken) {
    this.sessionToken = sessionToken;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}

@RestController
@RequestMapping("/api/v1/donations")
public class DonationController {
  private final DonationService donationService;
  private final DonationSessionContext sessionContext;

  public DonationController(
    DonationService donationService,
    DonationSessionContext sessionContext
  ) {
    this.donationService = donationService;
    this.sessionContext = sessionContext;
  }

  @PostMapping
  public ResponseEntity<DonationResponse> createDonation(
    @RequestBody @Valid CreateDonationRequest request
  ) {
    // Session context is unique per request
    sessionContext.setDonorId(request.donorId());

    DonationResponse response = donationService.processDonation(request);
    return ResponseEntity.ok(response);
  }
}
```

**Kotlin Example**:

```kotlin
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
class DonationSessionContext {
  var donorId: String? = null
  var sessionToken: String? = null
  lateinit var createdAt: LocalDateTime
    private set

  @PostConstruct
  fun initialize() {
    createdAt = LocalDateTime.now()
  }
}

@RestController
@RequestMapping("/api/v1/donations")
class DonationController(
  private val donationService: DonationService,
  private val sessionContext: DonationSessionContext
) {

  @PostMapping
  fun createDonation(
    @RequestBody @Valid request: CreateDonationRequest
  ): ResponseEntity<DonationResponse> {
    // Session context is unique per request
    sessionContext.donorId = request.donorId

    val response = donationService.processDonation(request)
    return ResponseEntity.ok(response)
  }
}
```

### @Value Annotation

**Java Example**:

```java
@Service
public class ZakatConfigurationService {

  @Value("${zakat.rate}")
  private BigDecimal zakatRate;

  @Value("${zakat.nisab.gold-grams}")
  private BigDecimal goldGrams;

  @Value("${zakat.nisab.silver-grams}")
  private BigDecimal silverGrams;

  @Value("${zakat.calculation.rounding-mode:HALF_UP}")
  private RoundingMode roundingMode;

  @Value("${zakat.calculation.precision:2}")
  private int precision;

  @Value("#{systemProperties['user.timezone']}")
  private String timezone;

  public BigDecimal calculateZakat(BigDecimal wealth) {
    return wealth.multiply(zakatRate)
      .setScale(precision, roundingMode);
  }

  public BigDecimal getGoldNisab() {
    return goldGrams;
  }

  public BigDecimal getSilverNisab() {
    return silverGrams;
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class ZakatConfigurationService {

  @Value("\${zakat.rate}")
  private lateinit var zakatRate: BigDecimal

  @Value("\${zakat.nisab.gold-grams}")
  private lateinit var goldGrams: BigDecimal

  @Value("\${zakat.nisab.silver-grams}")
  private lateinit var silverGrams: BigDecimal

  @Value("\${zakat.calculation.rounding-mode:HALF_UP}")
  private lateinit var roundingMode: RoundingMode

  @Value("\${zakat.calculation.precision:2}")
  private var precision: Int = 0

  @Value("#{systemProperties['user.timezone']}")
  private lateinit var timezone: String

  fun calculateZakat(wealth: BigDecimal): BigDecimal =
    wealth.multiply(zakatRate).setScale(precision, roundingMode)

  fun getGoldNisab(): BigDecimal = goldGrams

  fun getSilverNisab(): BigDecimal = silverGrams
}
```

### Environment Abstraction

**Java Example**:

```java
@Configuration
public class DynamicConfiguration {
  private final Environment environment;

  public DynamicConfiguration(Environment environment) {
    this.environment = environment;
  }

  @Bean
  public DonationProcessor donationProcessor() {
    String processorType = environment.getProperty(
      "donation.processor.type",
      "standard"
    );

    return switch (processorType) {
      case "express" -> new ExpressDonationProcessor();
      case "batch" -> new BatchDonationProcessor();
      default -> new StandardDonationProcessor();
    };
  }

  @Bean
  public NotificationService notificationService() {
    boolean emailEnabled = environment.getProperty(
      "notification.email.enabled",
      Boolean.class,
      false
    );

    boolean smsEnabled = environment.getProperty(
      "notification.sms.enabled",
      Boolean.class,
      false
    );

    List<NotificationChannel> channels = new ArrayList<>();

    if (emailEnabled) {
      channels.add(new EmailNotificationChannel(
        environment.getRequiredProperty("notification.email.smtp-host"),
        environment.getRequiredProperty("notification.email.from")
      ));
    }

    if (smsEnabled) {
      channels.add(new SmsNotificationChannel(
        environment.getRequiredProperty("notification.sms.api-key")
      ));
    }

    return new CompositeNotificationService(channels);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class DynamicConfiguration(
  private val environment: Environment
) {

  @Bean
  fun donationProcessor(): DonationProcessor {
    val processorType = environment.getProperty("donation.processor.type", "standard")

    return when (processorType) {
      "express" -> ExpressDonationProcessor()
      "batch" -> BatchDonationProcessor()
      else -> StandardDonationProcessor()
    }
  }

  @Bean
  fun notificationService(): NotificationService {
    val emailEnabled = environment.getProperty(
      "notification.email.enabled",
      Boolean::class.java,
      false
    )

    val smsEnabled = environment.getProperty(
      "notification.sms.enabled",
      Boolean::class.java,
      false
    )

    val channels = mutableListOf<NotificationChannel>()

    if (emailEnabled) {
      channels.add(
        EmailNotificationChannel(
          environment.getRequiredProperty("notification.email.smtp-host"),
          environment.getRequiredProperty("notification.email.from")
        )
      )
    }

    if (smsEnabled) {
      channels.add(
        SmsNotificationChannel(
          environment.getRequiredProperty("notification.sms.api-key")
        )
      )
    }

    return CompositeNotificationService(channels)
  }
}
```

### ResourceLoader Interface

**Java Example**:

```java
@Service
public class ZakatReportTemplateService {
  private final ResourceLoader resourceLoader;

  public ZakatReportTemplateService(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  public String loadTemplate(String templateName) throws IOException {
    Resource resource = resourceLoader.getResource(
      "classpath:templates/zakat/" + templateName + ".html"
    );

    if (!resource.exists()) {
      throw new TemplateNotFoundException("Template not found: " + templateName);
    }

    try (InputStream inputStream = resource.getInputStream()) {
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  public byte[] loadPdfTemplate(String templateName) throws IOException {
    Resource resource = resourceLoader.getResource(
      "classpath:templates/pdf/" + templateName + ".pdf"
    );

    if (!resource.exists()) {
      throw new TemplateNotFoundException("PDF template not found: " + templateName);
    }

    try (InputStream inputStream = resource.getInputStream()) {
      return inputStream.readAllBytes();
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class ZakatReportTemplateService(
  private val resourceLoader: ResourceLoader
) {

  fun loadTemplate(templateName: String): String {
    val resource = resourceLoader.getResource("classpath:templates/zakat/$templateName.html")

    if (!resource.exists()) {
      throw TemplateNotFoundException("Template not found: $templateName")
    }

    resource.inputStream.use { inputStream ->
      return String(inputStream.readAllBytes(), StandardCharsets.UTF_8)
    }
  }

  fun loadPdfTemplate(templateName: String): ByteArray {
    val resource = resourceLoader.getResource("classpath:templates/pdf/$templateName.pdf")

    if (!resource.exists()) {
      throw TemplateNotFoundException("PDF template not found: $templateName")
    }

    resource.inputStream.use { inputStream ->
      return inputStream.readAllBytes()
    }
  }
}
```

### @Conditional Annotation

**Java Example**:

```java
// Custom condition
public class PostgresDatabaseCondition implements Condition {
  @Override
  public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
    Environment environment = context.getEnvironment();
    String dbType = environment.getProperty("database.type");
    return "postgres".equalsIgnoreCase(dbType);
  }
}

@Configuration
public class DatabaseConfiguration {

  @Bean
  @Conditional(PostgresDatabaseCondition.class)
  public DataSource postgresDataSource(
    @Value("${db.postgres.url}") String url,
    @Value("${db.postgres.username}") String username,
    @Value("${db.postgres.password}") String password
  ) {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);
    return new HikariDataSource(config);
  }

  @Bean
  @ConditionalOnMissingBean(DataSource.class)
  public DataSource h2DataSource() {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl("jdbc:h2:mem:testdb");
    config.setUsername("sa");
    config.setPassword("");
    return new HikariDataSource(config);
  }
}
```

**Kotlin Example**:

```kotlin
// Custom condition
class PostgresDatabaseCondition : Condition {
  override fun matches(context: ConditionContext, metadata: AnnotatedTypeMetadata): Boolean {
    val environment = context.environment
    val dbType = environment.getProperty("database.type")
    return "postgres".equals(dbType, ignoreCase = true)
  }
}

@Configuration
class DatabaseConfiguration {

  @Bean
  @Conditional(PostgresDatabaseCondition::class)
  fun postgresDataSource(
    @Value("\${db.postgres.url}") url: String,
    @Value("\${db.postgres.username}") username: String,
    @Value("\${db.postgres.password}") password: String
  ): DataSource {
    val config = HikariConfig().apply {
      jdbcUrl = url
      this.username = username
      this.password = password
    }
    return HikariDataSource(config)
  }

  @Bean
  @ConditionalOnMissingBean(DataSource::class)
  fun h2DataSource(): DataSource {
    val config = HikariConfig().apply {
      jdbcUrl = "jdbc:h2:mem:testdb"
      username = "sa"
      password = ""
    }
    return HikariDataSource(config)
  }
}
```

### @Profile Annotation

**Java Example**:

```java
@Configuration
@Profile("dev")
public class DevelopmentConfiguration {

  @Bean
  public DataSource dataSource() {
    // H2 in-memory database for development
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl("jdbc:h2:mem:testdb");
    config.setUsername("sa");
    config.setPassword("");
    return new HikariDataSource(config);
  }

  @Bean
  public ZakatNotificationService notificationService() {
    // Console logger for development
    return new ConsoleZakatNotificationService();
  }
}

@Configuration
@Profile("prod")
public class ProductionConfiguration {

  @Bean
  public DataSource dataSource(Environment env) {
    // PostgreSQL for production
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(env.getRequiredProperty("db.url"));
    config.setUsername(env.getRequiredProperty("db.username"));
    config.setPassword(env.getRequiredProperty("db.password"));
    config.setMaximumPoolSize(20);
    config.setMinimumIdle(10);
    return new HikariDataSource(config);
  }

  @Bean
  public ZakatNotificationService notificationService(
    @Value("${notification.email.smtp-host}") String smtpHost,
    @Value("${notification.email.from}") String fromEmail
  ) {
    // Email notification service for production
    return new EmailZakatNotificationService(smtpHost, fromEmail);
  }
}

// Activate profiles programmatically
public class ApplicationBootstrap {
  public static void main(String[] args) {
    AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
    context.getEnvironment().setActiveProfiles("prod");
    context.register(ProductionConfiguration.class, DevelopmentConfiguration.class);
    context.refresh();

    // Use beans
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@Profile("dev")
class DevelopmentConfiguration {

  @Bean
  fun dataSource(): DataSource {
    // H2 in-memory database for development
    val config = HikariConfig().apply {
      jdbcUrl = "jdbc:h2:mem:testdb"
      username = "sa"
      password = ""
    }
    return HikariDataSource(config)
  }

  @Bean
  fun notificationService(): ZakatNotificationService {
    // Console logger for development
    return ConsoleZakatNotificationService()
  }
}

@Configuration
@Profile("prod")
class ProductionConfiguration {

  @Bean
  fun dataSource(env: Environment): DataSource {
    // PostgreSQL for production
    val config = HikariConfig().apply {
      jdbcUrl = env.getRequiredProperty("db.url")
      username = env.getRequiredProperty("db.username")
      password = env.getRequiredProperty("db.password")
      maximumPoolSize = 20
      minimumIdle = 10
    }
    return HikariDataSource(config)
  }

  @Bean
  fun notificationService(
    @Value("\${notification.email.smtp-host}") smtpHost: String,
    @Value("\${notification.email.from}") fromEmail: String
  ): ZakatNotificationService {
    // Email notification service for production
    return EmailZakatNotificationService(smtpHost, fromEmail)
  }
}

// Activate profiles programmatically
fun main() {
  val context = AnnotationConfigApplicationContext().apply {
    environment.setActiveProfiles("prod")
    register(ProductionConfiguration::class.java, DevelopmentConfiguration::class.java)
    refresh()
  }

  // Use beans
}
```

### AyoKoding Spring By-Example Resources

Hands-on examples demonstrating Spring Framework idioms:

### AyoKoding Spring In-The-Field Guides

Production patterns using Spring Framework idioms:

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Best Practices](best-practices.md)** - Production standards
- **[Anti-Patterns](anti-patterns.md)** - Common mistakes
- **[Configuration](configuration.md)** - Configuration approaches
- **[Dependency Injection](dependency-injection.md)** - IoC container deep-dive
- **[Security](security.md)** - Spring Security patterns
- **[Performance](performance.md)** - Optimization techniques
- **[Observability](observability.md)** - Monitoring and tracing

### Language Standards

- **[Kotlin](../../../programming-languages/java/README.md)** - Kotlin language documentation

### Development Practices

- **[Functional Programming](../../../../../../governance/development/pattern/functional-programming.md)** - FP principles
- **[Test-Driven Development](../../../development/test-driven-development-tdd/README.md)** - TDD practices

### OSE Platform Principles

- **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - Configuration clarity
- **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Spring IoC automation
- **[Immutability](../../../../../../governance/principles/software-engineering/immutability.md)** - Immutable bean properties
- **[Pure Functions](../../../../../../governance/principles/software-engineering/pure-functions.md)** - Functional bean patterns

## See Also

**OSE Explanation Foundation**:

- [Java Idioms](../../../programming-languages/java/coding-standards.md) - Java baseline patterns
- [Spring Framework Best Practices](./best-practices.md) - Production standards
- [Spring Framework Configuration](./configuration.md) - Configuration patterns
- [Spring Framework Dependency Injection](./dependency-injection.md) - DI deep dive

**Hands-on Learning (AyoKoding)**:

- [Spring In-the-Field - Configuration Management](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/in-the-field/configuration.md) - Production config

**Spring Boot Extension**:

- [Spring Boot Idioms](../jvm-spring-boot/idioms.md) - Auto-configured patterns

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
