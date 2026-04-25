---
title: Spring Framework Configuration
description: Configuration approaches including Java-based config with @Configuration, @ComponentScan, @Bean, @Profile, @PropertySource, Environment, @Conditional, @Import, XML config, and mixed strategies
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - configuration
  - java-config
  - annotations
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - automation-over-manual
  - reproducibility
created: 2026-01-29
---

# Spring Framework Configuration

**Understanding-oriented documentation** for Spring Framework configuration approaches and strategies.

## Overview

Spring Framework provides multiple configuration approaches for defining beans and application context. This document explores Java-based configuration (recommended), annotation-based configuration, XML configuration (legacy), and hybrid strategies for Islamic finance applications.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Java-Based Configuration](#java-based-configuration)
- [Component Scanning](#component-scanning)
- [Bean Definition with @Bean](#bean-definition-with-bean)
- [Profile-Based Configuration](#profile-based-configuration)
- [Property Sources](#property-sources)
- [Environment Abstraction](#environment-abstraction)
- [Conditional Configuration](#conditional-configuration)
- [Configuration Import](#configuration-import)
- [XML Configuration (Legacy)](#xml-configuration-legacy)
- [Mixed Configuration Strategies](#mixed-configuration-strategies)

### @Configuration Classes

Java configuration uses `@Configuration` classes with `@Bean` methods to define beans.

**Java Example** (Zakat Application):

```java
@Configuration
@EnableTransactionManagement
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
    config.setMaximumPoolSize(20);
    config.setMinimumIdle(5);
    config.setConnectionTimeout(30000);
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

  @Bean
  public ZakatRateProvider zakatRateProvider() {
    return new StandardZakatRateProvider(new BigDecimal("0.025"));
  }

  @Bean
  public NisabCalculator nisabCalculator(
    @Value("${zakat.nisab.gold-grams}") BigDecimal goldGrams,
    GoldPriceService goldPriceService
  ) {
    return new GoldBasedNisabCalculator(goldGrams, goldPriceService);
  }

  @Bean
  public ZakatCalculator zakatCalculator(
    ZakatRateProvider rateProvider,
    NisabCalculator nisabCalculator
  ) {
    return new DefaultZakatCalculator(rateProvider, nisabCalculator);
  }
}
```

**Kotlin Example** (Zakat Application):

```kotlin
@Configuration
@EnableTransactionManagement
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
      maximumPoolSize = 20
      minimumIdle = 5
      connectionTimeout = 30000
    }
    return HikariDataSource(config)
  }

  @Bean
  fun jdbcTemplate(dataSource: DataSource): JdbcTemplate = JdbcTemplate(dataSource)

  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)

  @Bean
  fun zakatRateProvider(): ZakatRateProvider =
    StandardZakatRateProvider(BigDecimal("0.025"))

  @Bean
  fun nisabCalculator(
    @Value("\${zakat.nisab.gold-grams}") goldGrams: BigDecimal,
    goldPriceService: GoldPriceService
  ): NisabCalculator = GoldBasedNisabCalculator(goldGrams, goldPriceService)

  @Bean
  fun zakatCalculator(
    rateProvider: ZakatRateProvider,
    nisabCalculator: NisabCalculator
  ): ZakatCalculator = DefaultZakatCalculator(rateProvider, nisabCalculator)
}
```

### Bootstrap Application with Java Config

**Java Example**:

```java
public class ZakatApplication {
  public static void main(String[] args) {
    // Bootstrap with Java configuration
    ApplicationContext context = new AnnotationConfigApplicationContext(
      ZakatApplicationConfig.class
    );

    // Retrieve beans
    ZakatCalculationService service = context.getBean(ZakatCalculationService.class);

    // Use service
    CreateZakatCalculationRequest request = new CreateZakatCalculationRequest(
      new BigDecimal("10000"),
      new BigDecimal("5000"),
      LocalDate.now()
    );

    ZakatCalculationResponse response = service.calculate(request);
    System.out.println("Zakat Amount: " + response.zakatAmount());

    // Close context
    ((AnnotationConfigApplicationContext) context).close();
  }
}
```

**Kotlin Example**:

```kotlin
fun main() {
  // Bootstrap with Java configuration
  val context = AnnotationConfigApplicationContext(ZakatApplicationConfig::class.java)

  // Retrieve beans
  val service = context.getBean(ZakatCalculationService::class.java)

  // Use service
  val request = CreateZakatCalculationRequest(
    wealth = BigDecimal("10000"),
    nisab = BigDecimal("5000"),
    calculationDate = LocalDate.now()
  )

  val response = service.calculate(request)
  println("Zakat Amount: ${response.zakatAmount}")

  // Close context
  context.close()
}
```

### @ComponentScan Configuration

**Java Example** (Murabaha Application):

```java
@Configuration
@ComponentScan(
  basePackages = {
    "com.oseplatform.murabaha.domain",
    "com.oseplatform.murabaha.application",
    "com.oseplatform.murabaha.infrastructure"
  },
  includeFilters = @ComponentScan.Filter(
    type = FilterType.ANNOTATION,
    classes = {Service.class, Repository.class, Component.class}
  ),
  excludeFilters = @ComponentScan.Filter(
    type = FilterType.REGEX,
    pattern = "com\\.oseplatform\\.murabaha\\..*\\.test\\..*"
  )
)
public class MurabahaApplicationConfig {
  // Additional bean definitions
}
```

**Kotlin Example** (Murabaha Application):

```kotlin
@Configuration
@ComponentScan(
  basePackages = [
    "com.oseplatform.murabaha.domain",
    "com.oseplatform.murabaha.application",
    "com.oseplatform.murabaha.infrastructure"
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
      pattern = ["com\\.oseplatform\\.murabaha\\..*\\.test\\..*"]
    )
  ]
)
class MurabahaApplicationConfig {
  // Additional bean definitions
}
```

### Type-Safe Base Packages

**Java Example**:

```java
@Configuration
@ComponentScan(basePackageClasses = {
  ZakatCalculationService.class,
  MurabahaContractService.class,
  DonationService.class
})
public class ApplicationConfig {
  // Scanning based on marker classes (type-safe)
}
```

**Kotlin Example**:

```kotlin
@Configuration
@ComponentScan(basePackageClasses = [
  ZakatCalculationService::class,
  MurabahaContractService::class,
  DonationService::class
])
class ApplicationConfig {
  // Scanning based on marker classes (type-safe)
}
```

### Simple Bean Definition

**Java Example** (Donation Processing):

```java
@Configuration
public class DonationConfiguration {

  @Bean
  public DonationValidator donationValidator(
    @Value("${donation.min-amount}") BigDecimal minAmount,
    @Value("${donation.max-amount}") BigDecimal maxAmount
  ) {
    return new DonationValidator(minAmount, maxAmount);
  }

  @Bean
  public DonationProcessor donationProcessor(
    DonationRepository repository,
    DonationValidator validator,
    NotificationService notificationService
  ) {
    return new DonationProcessor(repository, validator, notificationService);
  }

  @Bean
  public NotificationService notificationService(
    @Value("${notification.email.enabled}") boolean emailEnabled,
    @Value("${notification.sms.enabled}") boolean smsEnabled
  ) {
    List<NotificationChannel> channels = new ArrayList<>();

    if (emailEnabled) {
      channels.add(new EmailNotificationChannel());
    }

    if (smsEnabled) {
      channels.add(new SmsNotificationChannel());
    }

    return new CompositeNotificationService(channels);
  }
}
```

**Kotlin Example** (Donation Processing):

```kotlin
@Configuration
class DonationConfiguration {

  @Bean
  fun donationValidator(
    @Value("\${donation.min-amount}") minAmount: BigDecimal,
    @Value("\${donation.max-amount}") maxAmount: BigDecimal
  ): DonationValidator = DonationValidator(minAmount, maxAmount)

  @Bean
  fun donationProcessor(
    repository: DonationRepository,
    validator: DonationValidator,
    notificationService: NotificationService
  ): DonationProcessor = DonationProcessor(repository, validator, notificationService)

  @Bean
  fun notificationService(
    @Value("\${notification.email.enabled}") emailEnabled: Boolean,
    @Value("\${notification.sms.enabled}") smsEnabled: Boolean
  ): NotificationService {
    val channels = buildList {
      if (emailEnabled) add(EmailNotificationChannel())
      if (smsEnabled) add(SmsNotificationChannel())
    }

    return CompositeNotificationService(channels)
  }
}
```

### Bean Lifecycle Methods

**Java Example**:

```java
@Configuration
public class CacheConfiguration {

  @Bean(initMethod = "initialize", destroyMethod = "cleanup")
  public ZakatCalculationCache zakatCalculationCache(CacheManager cacheManager) {
    return new ZakatCalculationCache(cacheManager);
  }
}

public class ZakatCalculationCache {
  private final CacheManager cacheManager;
  private Cache cache;

  public ZakatCalculationCache(CacheManager cacheManager) {
    this.cacheManager = cacheManager;
  }

  // Called after bean construction
  public void initialize() {
    this.cache = cacheManager.getCache("zakatCalculations");
    // Pre-populate cache
  }

  // Called before bean destruction
  public void cleanup() {
    if (cache != null) {
      cache.clear();
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class CacheConfiguration {

  @Bean(initMethod = "initialize", destroyMethod = "cleanup")
  fun zakatCalculationCache(cacheManager: CacheManager): ZakatCalculationCache =
    ZakatCalculationCache(cacheManager)
}

class ZakatCalculationCache(private val cacheManager: CacheManager) {
  private lateinit var cache: Cache

  // Called after bean construction
  fun initialize() {
    cache = cacheManager.getCache("zakatCalculations")
      ?: throw IllegalStateException("Zakat calculations cache not found")
    // Pre-populate cache
  }

  // Called before bean destruction
  fun cleanup() {
    if (::cache.isInitialized) {
      cache.clear()
    }
  }
}
```

### @Profile Annotation

**Java Example** (Environment-Specific Configuration):

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
  public NotificationService notificationService() {
    // Console logger for development
    return new ConsoleNotificationService();
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
    config.setConnectionTimeout(30000);
    config.setValidationTimeout(5000);
    return new HikariDataSource(config);
  }

  @Bean
  public NotificationService notificationService(
    @Value("${notification.email.smtp-host}") String smtpHost,
    @Value("${notification.email.from}") String fromEmail
  ) {
    // Email notification service for production
    return new EmailNotificationService(smtpHost, fromEmail);
  }
}
```

**Kotlin Example** (Environment-Specific Configuration):

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
  fun notificationService(): NotificationService {
    // Console logger for development
    return ConsoleNotificationService()
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
      connectionTimeout = 30000
      validationTimeout = 5000
    }
    return HikariDataSource(config)
  }

  @Bean
  fun notificationService(
    @Value("\${notification.email.smtp-host}") smtpHost: String,
    @Value("\${notification.email.from}") fromEmail: String
  ): NotificationService {
    // Email notification service for production
    return EmailNotificationService(smtpHost, fromEmail)
  }
}
```

### Activating Profiles

**Java Example**:

```java
// Programmatically
AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
context.getEnvironment().setActiveProfiles("prod");
context.register(ApplicationConfig.class);
context.refresh();

// Via system property
-Dspring.profiles.active=prod

// Via environment variable
SPRING_PROFILES_ACTIVE=prod

// Multiple profiles
context.getEnvironment().setActiveProfiles("prod", "aws");
```

**Kotlin Example**:

```kotlin
// Programmatically
val context = AnnotationConfigApplicationContext().apply {
  environment.setActiveProfiles("prod")
  register(ApplicationConfig::class.java)
  refresh()
}

// Multiple profiles
context.environment.setActiveProfiles("prod", "aws")
```

### @PropertySource Annotation

**Java Example**:

```java
@Configuration
@PropertySource("classpath:application.properties")
@PropertySource("classpath:zakat.properties")
@PropertySource("classpath:murabaha.properties")
public class ApplicationConfig {

  @Value("${zakat.rate}")
  private BigDecimal zakatRate;

  @Value("${murabaha.profit-rate.max}")
  private BigDecimal maxProfitRate;

  @Bean
  public ZakatRateProvider zakatRateProvider() {
    return new StandardZakatRateProvider(zakatRate);
  }

  @Bean
  public ProfitRateValidator profitRateValidator() {
    return new RangeProfitRateValidator(BigDecimal.ZERO, maxProfitRate);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@PropertySource("classpath:application.properties")
@PropertySource("classpath:zakat.properties")
@PropertySource("classpath:murabaha.properties")
class ApplicationConfig {

  @Value("\${zakat.rate}")
  private lateinit var zakatRate: BigDecimal

  @Value("\${murabaha.profit-rate.max}")
  private lateinit var maxProfitRate: BigDecimal

  @Bean
  fun zakatRateProvider(): ZakatRateProvider =
    StandardZakatRateProvider(zakatRate)

  @Bean
  fun profitRateValidator(): ProfitRateValidator =
    RangeProfitRateValidator(BigDecimal.ZERO, maxProfitRate)
}
```

### Property Files

**application.properties**:

```properties
# Database Configuration
db.url=jdbc:postgresql://localhost:5432/ose_platform
db.username=ose_user
db.password=${DB_PASSWORD:changeme}

# Zakat Configuration
zakat.rate=0.025
zakat.nisab.gold-grams=85
zakat.nisab.silver-grams=595

# Murabaha Configuration
murabaha.profit-rate.min=0.01
murabaha.profit-rate.max=0.15
murabaha.asset.min-value=1000

# Donation Configuration
donation.min-amount=1.00
donation.max-amount=1000000.00

# Notification Configuration
notification.email.enabled=true
notification.sms.enabled=false
notification.email.smtp-host=smtp.gmail.com
notification.email.from=noreply@oseplatform.com
```

### Using Environment Interface

**Java Example**:

```java
@Configuration
public class DynamicConfiguration {
  private final Environment environment;

  public DynamicConfiguration(Environment environment) {
    this.environment = environment;
  }

  @Bean
  public DataSource dataSource() {
    String dbType = environment.getProperty("database.type", "postgres");

    HikariConfig config = new HikariConfig();

    if ("postgres".equalsIgnoreCase(dbType)) {
      config.setJdbcUrl(environment.getRequiredProperty("db.postgres.url"));
      config.setUsername(environment.getRequiredProperty("db.postgres.username"));
      config.setPassword(environment.getRequiredProperty("db.postgres.password"));
    } else if ("h2".equalsIgnoreCase(dbType)) {
      config.setJdbcUrl("jdbc:h2:mem:testdb");
      config.setUsername("sa");
      config.setPassword("");
    }

    config.setMaximumPoolSize(
      environment.getProperty("db.pool.max-size", Integer.class, 20)
    );

    return new HikariDataSource(config);
  }

  @Bean
  public ZakatCalculator zakatCalculator() {
    String calculatorType = environment.getProperty(
      "zakat.calculator.type",
      "standard"
    );

    return switch (calculatorType) {
      case "gold-based" -> new GoldBasedZakatCalculator();
      case "silver-based" -> new SilverBasedZakatCalculator();
      default -> new StandardZakatCalculator();
    };
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class DynamicConfiguration(private val environment: Environment) {

  @Bean
  fun dataSource(): DataSource {
    val dbType = environment.getProperty("database.type", "postgres")

    val config = HikariConfig().apply {
      when (dbType.lowercase()) {
        "postgres" -> {
          jdbcUrl = environment.getRequiredProperty("db.postgres.url")
          username = environment.getRequiredProperty("db.postgres.username")
          password = environment.getRequiredProperty("db.postgres.password")
        }
        "h2" -> {
          jdbcUrl = "jdbc:h2:mem:testdb"
          username = "sa"
          password = ""
        }
      }

      maximumPoolSize = environment.getProperty("db.pool.max-size", Int::class.java, 20)
    }

    return HikariDataSource(config)
  }

  @Bean
  fun zakatCalculator(): ZakatCalculator {
    val calculatorType = environment.getProperty("zakat.calculator.type", "standard")

    return when (calculatorType) {
      "gold-based" -> GoldBasedZakatCalculator()
      "silver-based" -> SilverBasedZakatCalculator()
      else -> StandardZakatCalculator()
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

  @Bean
  @ConditionalOnProperty(name = "caching.enabled", havingValue = "true")
  public CacheManager cacheManager() {
    SimpleCacheManager cacheManager = new SimpleCacheManager();
    cacheManager.setCaches(Arrays.asList(
      new ConcurrentMapCache("zakatCalculations"),
      new ConcurrentMapCache("nisabValues")
    ));
    return cacheManager;
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

  @Bean
  @ConditionalOnProperty(name = ["caching.enabled"], havingValue = "true")
  fun cacheManager(): CacheManager {
    val cacheManager = SimpleCacheManager()
    cacheManager.setCaches(listOf(
      ConcurrentMapCache("zakatCalculations"),
      ConcurrentMapCache("nisabValues")
    ))
    return cacheManager
  }
}
```

### @Import Annotation

**Java Example**:

```java
@Configuration
@Import({
  DataSourceConfig.class,
  TransactionConfig.class,
  WebConfig.class,
  SecurityConfig.class
})
public class ApplicationConfig {
  // Main application configuration
}

@Configuration
public class DataSourceConfig {
  @Bean
  public DataSource dataSource() {
    // DataSource configuration
  }
}

@Configuration
@EnableTransactionManagement
public class TransactionConfig {
  @Bean
  public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
  }
}

@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
  // Web configuration
}
```

**Kotlin Example**:

```kotlin
@Configuration
@Import(
  DataSourceConfig::class,
  TransactionConfig::class,
  WebConfig::class,
  SecurityConfig::class
)
class ApplicationConfig {
  // Main application configuration
}

@Configuration
class DataSourceConfig {
  @Bean
  fun dataSource(): DataSource {
    // DataSource configuration
  }
}

@Configuration
@EnableTransactionManagement
class TransactionConfig {
  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)
}

@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {
  // Web configuration
}
```

### Basic XML Configuration

**applicationContext.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="
           http://www.springframework.org/schema/beans
           http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/context
           http://www.springframework.org/schema/context/spring-context.xsd">

  <!-- Property placeholder -->
  <context:property-placeholder location="classpath:application.properties"/>

  <!-- Component scanning -->
  <context:component-scan base-package="com.oseplatform.zakat"/>

  <!-- DataSource bean -->
  <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" destroy-method="close">
    <property name="jdbcUrl" value="${db.url}"/>
    <property name="username" value="${db.username}"/>
    <property name="password" value="${db.password}"/>
    <property name="maximumPoolSize" value="20"/>
  </bean>

  <!-- JdbcTemplate bean -->
  <bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
    <constructor-arg ref="dataSource"/>
  </bean>

  <!-- Transaction manager -->
  <bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
    <constructor-arg ref="dataSource"/>
  </bean>
</beans>
```

### Loading XML Configuration

**Java Example**:

```java
public class ZakatApplication {
  public static void main(String[] args) {
    // Load XML configuration
    ApplicationContext context = new ClassPathXmlApplicationContext(
      "applicationContext.xml"
    );

    ZakatCalculationService service = context.getBean(ZakatCalculationService.class);

    // Use service

    ((ClassPathXmlApplicationContext) context).close();
  }
}
```

### Combining Java Config and Component Scanning

**Java Example**:

```java
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class HybridConfiguration {

  // Explicit bean definitions for infrastructure
  @Bean
  public DataSource dataSource() {
    // Infrastructure bean
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }

  // Services, repositories discovered via component scanning
  // (annotated with @Service, @Repository)
}
```

**Kotlin Example**:

```kotlin
@Configuration
@ComponentScan(basePackages = ["com.oseplatform.zakat"])
class HybridConfiguration {

  // Explicit bean definitions for infrastructure
  @Bean
  fun dataSource(): DataSource {
    // Infrastructure bean
  }

  @Bean
  fun jdbcTemplate(dataSource: DataSource): JdbcTemplate = JdbcTemplate(dataSource)

  // Services, repositories discovered via component scanning
  // (annotated with @Service, @Repository)
}
```

### Importing XML into Java Config

**Java Example**:

```java
@Configuration
@ImportResource("classpath:legacy-config.xml")
public class MigrationConfiguration {

  // New Java-based beans
  @Bean
  public ZakatCalculator zakatCalculator() {
    return new DefaultZakatCalculator();
  }

  // Legacy XML beans available for injection
  @Autowired
  private DataSource dataSource;  // From XML
}
```

**Kotlin Example**:

```kotlin
@Configuration
@ImportResource("classpath:legacy-config.xml")
class MigrationConfiguration {

  // New Java-based beans
  @Bean
  fun zakatCalculator(): ZakatCalculator = DefaultZakatCalculator()

  // Legacy XML beans available for injection
  @Autowired
  private lateinit var dataSource: DataSource  // From XML
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Idioms](idioms.md)** - Framework patterns
- **[Best Practices](best-practices.md)** - Production standards
- **[Dependency Injection](dependency-injection.md)** - IoC container

### Development Practices

- **[Reproducible Environments](../../../../../../governance/development/workflow/reproducible-environments.md)** - Environment management

## See Also

**OSE Explanation Foundation**:

- [Java Configuration](../../../programming-languages/java/build-configuration.md) - Java baseline configuration
- [Spring Framework Idioms](./idioms.md) - Configuration patterns
- [Spring Framework Dependency Injection](./dependency-injection.md) - Bean wiring
- [Spring Framework Best Practices](./best-practices.md) - Configuration standards

**Spring Boot Extension**:

- [Spring Boot Configuration](../jvm-spring-boot/configuration.md) - Auto-configuration patterns

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
