---
title: Spring Framework Performance
description: Optimization covering bean initialization, lazy initialization, connection pooling, caching with Spring Cache, @Async, virtual threads, transaction optimization, query optimization, profiling, and memory management
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - performance
  - optimization
  - caching
  - java
  - kotlin
principles:
  - automation-over-manual
created: 2026-01-29
---

# Spring Framework Performance

**Understanding-oriented documentation** for optimizing Spring Framework applications.

## Overview

This document covers performance optimization techniques for Spring applications, including caching, async processing, connection pooling, and query optimization for Islamic finance workloads.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Bean Initialization Optimization](#bean-initialization-optimization)
- [Connection Pooling](#connection-pooling-configuration)
- [Caching](#caching-with-spring-cache)
- [Async Execution](#async-execution)
- [Virtual Threads (Java 21+)](#virtual-threads-java-21)
- [Transaction Optimization](#transaction-optimization)
- [Query Optimization](#query-optimization)

### Lazy Initialization

**Java Example**:

```java
@Configuration
public class PerformanceConfig {

  @Bean
  @Lazy
  public ExpensiveService expensiveService() {
    // Only initialized when first requested
    return new ExpensiveService();
  }

  @Bean
  public LazyInitializationBeanFactoryPostProcessor lazyInitialization() {
    // Global lazy initialization (use with caution)
    return new LazyInitializationBeanFactoryPostProcessor();
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class PerformanceConfig {

  @Bean
  @Lazy
  fun expensiveService(): ExpensiveService {
    // Only initialized when first requested
    return ExpensiveService()
  }
}
```

### HikariCP Optimization

**Java Example**:

```java
@Configuration
public class DataSourceConfig {

  @Bean
  public DataSource dataSource() {
    HikariConfig config = new HikariConfig();

    // Connection pool size
    config.setMaximumPoolSize(20);      // Maximum connections
    config.setMinimumIdle(5);           // Minimum idle connections

    // Timeouts (milliseconds)
    config.setConnectionTimeout(30000);  // 30 seconds
    config.setIdleTimeout(600000);       // 10 minutes
    config.setMaxLifetime(1800000);      // 30 minutes
    config.setValidationTimeout(5000);   // 5 seconds

    // Performance settings
    config.setAutoCommit(false);         // Manual transaction management
    config.setConnectionTestQuery("SELECT 1");

    // PreparedStatement cache
    config.addDataSourceProperty("cachePrepStmts", "true");
    config.addDataSourceProperty("prepStmtCacheSize", "250");
    config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

    return new HikariDataSource(config);
  }
}
```

### Enable Caching

**Java Example**:

```java
@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager cacheManager = new CaffeineCacheManager(
      "zakatCalculations",
      "nisabValues",
      "donationCategories"
    );

    cacheManager.setCaffeine(Caffeine.newBuilder()
      .maximumSize(1000)
      .expireAfterWrite(10, TimeUnit.MINUTES)
      .recordStats()
    );

    return cacheManager;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableCaching
class CacheConfig {

  @Bean
  fun cacheManager(): CacheManager {
    val cacheManager = CaffeineCacheManager(
      "zakatCalculations",
      "nisabValues",
      "donationCategories"
    )

    cacheManager.setCaffeine(Caffeine.newBuilder()
      .maximumSize(1000)
      .expireAfterWrite(10, TimeUnit.MINUTES)
      .recordStats()
    )

    return cacheManager
  }
}
```

### Using @Cacheable

**Java Example** (Nisab Service):

```java
@Service
public class NisabService {
  private static final Logger logger = LoggerFactory.getLogger(NisabService.class);

  private final GoldPriceService goldPriceService;

  public NisabService(GoldPriceService goldPriceService) {
    this.goldPriceService = goldPriceService;
  }

  @Cacheable(value = "nisabValues", key = "#currency")
  public Money calculateCurrentNisab(String currency) {
    logger.info("Calculating nisab for currency: {} (cache miss)", currency);

    BigDecimal goldPricePerGram = goldPriceService.getCurrentPrice(currency);
    BigDecimal nisabGoldGrams = new BigDecimal("85");
    BigDecimal nisabValue = goldPricePerGram.multiply(nisabGoldGrams);

    return Money.of(nisabValue, currency);
  }

  @CacheEvict(value = "nisabValues", allEntries = true)
  public void clearNisabCache() {
    logger.info("Clearing nisab cache");
  }

  @CachePut(value = "nisabValues", key = "#currency")
  public Money updateNisab(String currency, Money nisab) {
    logger.info("Updating nisab for currency: {}", currency);
    return nisab;
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class NisabService(private val goldPriceService: GoldPriceService) {
  companion object {
    private val logger = LoggerFactory.getLogger(NisabService::class.java)
  }

  @Cacheable(value = ["nisabValues"], key = "#currency")
  fun calculateCurrentNisab(currency: String): Money {
    logger.info("Calculating nisab for currency: {} (cache miss)", currency)

    val goldPricePerGram = goldPriceService.getCurrentPrice(currency)
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

### Enable Async

**Java Example**:

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(10);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("async-");
    executor.initialize();
    return executor;
  }
}
```

### Using @Async

**Java Example** (Email Notification):

```java
@Service
public class EmailNotificationService {
  private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

  @Async
  public CompletableFuture<Void> sendDonationReceipt(String email, Donation donation) {
    logger.info("Sending donation receipt to: {}", email);

    try {
      // Simulate email sending (expensive operation)
      Thread.sleep(2000);

      logger.info("Donation receipt sent successfully to: {}", email);
      return CompletableFuture.completedFuture(null);
    } catch (InterruptedException e) {
      logger.error("Failed to send donation receipt", e);
      return CompletableFuture.failedFuture(e);
    }
  }
}

@Service
public class DonationService {
  private final EmailNotificationService emailService;

  public DonationService(EmailNotificationService emailService) {
    this.emailService = emailService;
  }

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    Donation donation = Donation.create(request);
    repository.save(donation);

    // Async email - doesn't block transaction
    emailService.sendDonationReceipt(request.donorEmail(), donation);

    return toResponse(donation);
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class EmailNotificationService {
  companion object {
    private val logger = LoggerFactory.getLogger(EmailNotificationService::class.java)
  }

  @Async
  fun sendDonationReceipt(email: String, donation: Donation): CompletableFuture<Unit> {
    logger.info("Sending donation receipt to: $email")

    return try {
      // Simulate email sending (expensive operation)
      Thread.sleep(2000)

      logger.info("Donation receipt sent successfully to: $email")
      CompletableFuture.completedFuture(Unit)
    } catch (e: InterruptedException) {
      logger.error("Failed to send donation receipt", e)
      CompletableFuture.failedFuture(e)
    }
  }
}
```

## Virtual Threads (Java 21+)

**Java Example**:

```java
@Configuration
@EnableAsync
public class VirtualThreadAsyncConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    // Use virtual threads for async execution (Java 21+)
    return Executors.newVirtualThreadPerTaskExecutor();
  }
}
```

### Read-Only Transactions

**Java Example**:

```java
@Service
public class DonationQueryService {

  @Transactional(readOnly = true)
  public List<DonationResponse> findDonations(
    String donorId,
    LocalDate startDate,
    LocalDate endDate
  ) {
    // Read-only optimization - no flush, no dirty checking
    return repository.findByDonorIdAndDateRange(donorId, startDate, endDate).stream()
      .map(this::toResponse)
      .toList();
  }
}
```

### Batch Operations

**Java Example** (Batch Insert):

```java
@Repository
public class JdbcDonationRepository {
  private final JdbcTemplate jdbcTemplate;

  public JdbcDonationRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public void saveBatch(List<Donation> donations) {
    String sql = """
      INSERT INTO donations (id, amount, category, donor_id, donation_date)
      VALUES (?, ?, ?, ?, ?)
      """;

    List<Object[]> batchArgs = donations.stream()
      .map(donation -> new Object[]{
        donation.getId().getValue(),
        donation.getAmount().getAmount(),
        donation.getCategory().name(),
        donation.getDonorId(),
        donation.getDonationDate()
      })
      .toList();

    jdbcTemplate.batchUpdate(sql, batchArgs);
  }
}
```

### Efficient Queries

**Java Example**:

```java
@Repository
public class OptimizedZakatRepository {

  // ❌ Bad: N+1 query problem
  public List<ZakatCalculation> findAllWithDonor() {
    List<ZakatCalculation> calculations = jdbcTemplate.query(
      "SELECT * FROM zakat_calculations",
      new ZakatCalculationRowMapper()
    );

    // Each iteration queries database again (N+1)
    calculations.forEach(calc -> {
      Donor donor = findDonorById(calc.getDonorId());  // N queries
      calc.setDonor(donor);
    });

    return calculations;
  }

  // ✅ Good: Single query with JOIN
  public List<ZakatCalculation> findAllWithDonorOptimized() {
    String sql = """
      SELECT zc.*, d.name, d.email
      FROM zakat_calculations zc
      JOIN donors d ON zc.donor_id = d.id
      """;

    return jdbcTemplate.query(sql, (rs, rowNum) -> {
      ZakatCalculation calculation = new ZakatCalculation(
        rs.getString("id"),
        // ... other fields
      );

      Donor donor = new Donor(
        rs.getString("donor_id"),
        rs.getString("name"),
        rs.getString("email")
      );

      calculation.setDonor(donor);
      return calculation;
    });
  }
}
```

### Pagination

**Java Example**:

```java
@Service
public class DonationQueryService {

  @Transactional(readOnly = true)
  public Page<DonationResponse> findDonations(int page, int size) {
    int offset = page * size;

    String countSql = "SELECT COUNT(*) FROM donations";
    long total = jdbcTemplate.queryForObject(countSql, Long.class);

    String sql = """
      SELECT * FROM donations
      ORDER BY donation_date DESC
      LIMIT ? OFFSET ?
      """;

    List<DonationResponse> donations = jdbcTemplate.query(
      sql,
      new DonationRowMapper(),
      size,
      offset
    ).stream()
      .map(this::toResponse)
      .toList();

    return new Page<>(donations, page, size, total);
  }
}
```

### Enable Virtual Threads

**Java Example** (Spring Configuration):

```java
@Configuration
@EnableAsync
public class VirtualThreadConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    // Use virtual threads for async execution (Java 21+)
    return Executors.newVirtualThreadPerTaskExecutor();
  }

  @Override
  public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
    return (throwable, method, params) -> {
      logger.error("Async method {} threw exception", method.getName(), throwable);
    };
  }
}

@Configuration
public class VirtualThreadWebConfig implements WebMvcConfigurer {

  @Bean
  public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
    return protocolHandler -> {
      // Enable virtual threads for Tomcat request processing
      protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    };
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableAsync
class VirtualThreadConfig : AsyncConfigurer {

  override fun getAsyncExecutor(): Executor {
    // Use virtual threads for async execution (Java 21+)
    return Executors.newVirtualThreadPerTaskExecutor()
  }

  override fun getAsyncUncaughtExceptionHandler(): AsyncUncaughtExceptionHandler {
    return AsyncUncaughtExceptionHandler { throwable, method, params ->
      logger.error("Async method ${method.name} threw exception", throwable)
    }
  }
}

@Configuration
class VirtualThreadWebConfig : WebMvcConfigurer {

  @Bean
  fun protocolHandlerVirtualThreadExecutorCustomizer(): TomcatProtocolHandlerCustomizer<*> {
    return TomcatProtocolHandlerCustomizer { protocolHandler ->
      // Enable virtual threads for Tomcat request processing
      protocolHandler.executor = Executors.newVirtualThreadPerTaskExecutor()
    }
  }
}
```

### Virtual Thread Best Practices

**Java Example** (High-Throughput Donation Processing):

```java
@Service
public class VirtualThreadDonationService {
  private static final Logger logger = LoggerFactory.getLogger(VirtualThreadDonationService.class);

  private final DonationRepository repository;
  private final ExecutorService virtualThreadExecutor;

  public VirtualThreadDonationService(DonationRepository repository) {
    this.repository = repository;
    this.virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();
  }

  public List<DonationResponse> processBatchDonations(List<CreateDonationRequest> requests) {
    // ✅ Correct: Virtual threads excel at I/O-bound tasks
    List<CompletableFuture<DonationResponse>> futures = requests.stream()
      .map(request -> CompletableFuture.supplyAsync(
        () -> processSingleDonation(request),
        virtualThreadExecutor
      ))
      .toList();

    return futures.stream()
      .map(CompletableFuture::join)
      .toList();
  }

  private DonationResponse processSingleDonation(CreateDonationRequest request) {
    // I/O-bound operation - perfect for virtual threads
    Donation donation = Donation.create(request);
    repository.save(donation);
    return toResponse(donation);
  }

  // ❌ Incorrect: Don't use virtual threads for CPU-bound tasks
  public List<BigDecimal> calculateZakatAmountsBad(List<Money> wealths) {
    // CPU-bound calculation - use platform threads instead
    return wealths.stream()
      .map(wealth -> CompletableFuture.supplyAsync(
        () -> wealth.multiply(new BigDecimal("0.025")),
        virtualThreadExecutor  // ❌ Bad: Wastes virtual thread on CPU work
      ))
      .map(CompletableFuture::join)
      .toList();
  }

  // ✅ Correct: Use parallel stream for CPU-bound tasks
  public List<BigDecimal> calculateZakatAmountsGood(List<Money> wealths) {
    // CPU-bound calculation - use ForkJoinPool
    return wealths.parallelStream()
      .map(wealth -> wealth.getAmount().multiply(new BigDecimal("0.025")))
      .toList();
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(donation.getId(), donation.getAmount());
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class VirtualThreadDonationService(private val repository: DonationRepository) {
  companion object {
    private val logger = LoggerFactory.getLogger(VirtualThreadDonationService::class.java)
  }

  private val virtualThreadExecutor: ExecutorService = Executors.newVirtualThreadPerTaskExecutor()

  fun processBatchDonations(requests: List<CreateDonationRequest>): List<DonationResponse> {
    // ✅ Correct: Virtual threads excel at I/O-bound tasks
    val futures = requests.map { request ->
      CompletableFuture.supplyAsync(
        { processSingleDonation(request) },
        virtualThreadExecutor
      )
    }

    return futures.map { it.join() }
  }

  private fun processSingleDonation(request: CreateDonationRequest): DonationResponse {
    // I/O-bound operation - perfect for virtual threads
    val donation = Donation.create(request)
    repository.save(donation)
    return donation.toResponse()
  }

  // ✅ Correct: Use parallel stream for CPU-bound tasks
  fun calculateZakatAmounts(wealths: List<Money>): List<BigDecimal> {
    // CPU-bound calculation - use parallel streams
    return wealths.parallelStream()
      .map { wealth -> wealth.amount * BigDecimal("0.025") }
      .toList()
  }

  private fun Donation.toResponse(): DonationResponse =
    DonationResponse(id, amount)
}
```

### Virtual Thread Monitoring

**Java Example**:

```java
@Service
public class VirtualThreadMonitoringService {
  private final MeterRegistry meterRegistry;

  public VirtualThreadMonitoringService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;

    // Monitor virtual thread metrics
    Gauge.builder("jvm.threads.virtual", () -> {
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
        // Virtual thread count (Java 21+)
        return Thread.getAllStackTraces().keySet().stream()
          .filter(Thread::isVirtual)
          .count();
      })
      .description("Number of active virtual threads")
      .register(meterRegistry);
  }
}
```

### HikariCP Pool Sizing Formulas

**Optimal Pool Size Calculation**:

```
connections = ((core_count * 2) + effective_spindle_count)

For example:
- 4 cores, 1 SSD (effectively 0 spindles) = (4 * 2) + 0 = 8 connections
- 8 cores, RAID array (4 spindles) = (8 * 2) + 4 = 20 connections
```

**Java Example** (Dynamic Pool Sizing):

```java
@Configuration
public class DynamicHikariConfig {

  @Bean
  public DataSource dataSource(
    @Value("${db.url}") String url,
    @Value("${db.username}") String username,
    @Value("${db.password}") String password
  ) {
    HikariConfig config = new HikariConfig();

    // Calculate optimal pool size
    int coreCount = Runtime.getRuntime().availableProcessors();
    int spindleCount = 0; // SSD = 0, HDD RAID = actual spindle count
    int optimalPoolSize = (coreCount * 2) + spindleCount;

    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);

    // Pool sizing
    config.setMaximumPoolSize(optimalPoolSize);
    config.setMinimumIdle(Math.max(2, optimalPoolSize / 2));

    // Connection timeout
    config.setConnectionTimeout(30000); // 30 seconds

    // Idle timeout (10 minutes)
    config.setIdleTimeout(600000);

    // Max lifetime (30 minutes - less than database connection timeout)
    config.setMaxLifetime(1800000);

    // Leak detection threshold (2 minutes)
    config.setLeakDetectionThreshold(120000);

    // Validation timeout (5 seconds)
    config.setValidationTimeout(5000);

    // Connection test query
    config.setConnectionTestQuery("SELECT 1");

    // Performance optimizations
    config.setAutoCommit(false); // Manual transaction management
    config.addDataSourceProperty("cachePrepStmts", "true");
    config.addDataSourceProperty("prepStmtCacheSize", "250");
    config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
    config.addDataSourceProperty("useServerPrepStmts", "true");
    config.addDataSourceProperty("useLocalSessionState", "true");
    config.addDataSourceProperty("rewriteBatchedStatements", "true");
    config.addDataSourceProperty("cacheResultSetMetadata", "true");
    config.addDataSourceProperty("cacheServerConfiguration", "true");
    config.addDataSourceProperty("elideSetAutoCommits", "true");
    config.addDataSourceProperty("maintainTimeStats", "false");

    return new HikariDataSource(config);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class DynamicHikariConfig {

  @Bean
  fun dataSource(
    @Value("\${db.url}") url: String,
    @Value("\${db.username}") username: String,
    @Value("\${db.password}") password: String
  ): DataSource {
    val config = HikariConfig().apply {
      // Calculate optimal pool size
      val coreCount = Runtime.getRuntime().availableProcessors()
      val spindleCount = 0 // SSD = 0, HDD RAID = actual spindle count
      val optimalPoolSize = (coreCount * 2) + spindleCount

      jdbcUrl = url
      this.username = username
      this.password = password

      // Pool sizing
      maximumPoolSize = optimalPoolSize
      minimumIdle = maxOf(2, optimalPoolSize / 2)

      // Timeouts
      connectionTimeout = 30000 // 30 seconds
      idleTimeout = 600000      // 10 minutes
      maxLifetime = 1800000     // 30 minutes
      leakDetectionThreshold = 120000  // 2 minutes
      validationTimeout = 5000  // 5 seconds

      // Connection test
      connectionTestQuery = "SELECT 1"

      // Performance optimizations
      isAutoCommit = false
      addDataSourceProperty("cachePrepStmts", "true")
      addDataSourceProperty("prepStmtCacheSize", "250")
      addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
      addDataSourceProperty("useServerPrepStmts", "true")
      addDataSourceProperty("useLocalSessionState", "true")
      addDataSourceProperty("rewriteBatchedStatements", "true")
      addDataSourceProperty("cacheResultSetMetadata", "true")
      addDataSourceProperty("cacheServerConfiguration", "true")
      addDataSourceProperty("elideSetAutoCommits", "true")
      addDataSourceProperty("maintainTimeStats", "false")
    }

    return HikariDataSource(config)
  }
}
```

### Connection Pool Monitoring

**Java Example**:

```java
@Service
public class ConnectionPoolMonitoringService {
  private final HikariDataSource dataSource;
  private final MeterRegistry meterRegistry;

  public ConnectionPoolMonitoringService(
    DataSource dataSource,
    MeterRegistry meterRegistry
  ) {
    this.dataSource = (HikariDataSource) dataSource;
    this.meterRegistry = meterRegistry;

    setupPoolMetrics();
  }

  private void setupPoolMetrics() {
    HikariPoolMXBean poolMXBean = dataSource.getHikariPoolMXBean();

    Gauge.builder("hikari.connections.active", poolMXBean, HikariPoolMXBean::getActiveConnections)
      .description("Active database connections")
      .register(meterRegistry);

    Gauge.builder("hikari.connections.idle", poolMXBean, HikariPoolMXBean::getIdleConnections)
      .description("Idle database connections")
      .register(meterRegistry);

    Gauge.builder("hikari.connections.total", poolMXBean, HikariPoolMXBean::getTotalConnections)
      .description("Total database connections")
      .register(meterRegistry);

    Gauge.builder("hikari.connections.pending", poolMXBean, HikariPoolMXBean::getThreadsAwaitingConnection)
      .description("Threads awaiting database connections")
      .register(meterRegistry);
  }
}
```

### Caffeine vs Redis Decision Matrix

**When to use Caffeine (Local Cache)**:

- ✅ Read-heavy workloads with infrequent writes
- ✅ Single instance deployments
- ✅ Latency-sensitive operations (< 1ms)
- ✅ Small dataset (< 1GB)
- ✅ No need for cache sharing across instances

**When to use Redis (Distributed Cache)**:

- ✅ Multi-instance deployments
- ✅ Large dataset (> 1GB)
- ✅ Cache sharing required
- ✅ Cache persistence needed
- ✅ Complex data structures (lists, sets, sorted sets)

### Caffeine Configuration and Eviction Policies

**Java Example** (Advanced Caffeine Setup):

```java
@Configuration
@EnableCaching
public class CaffeineCacheConfig {

  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager cacheManager = new CaffeineCacheManager();

    // Different eviction policies for different caches
    cacheManager.registerCustomCache("zakatCalculations",
      Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .recordStats()
        .build()
    );

    cacheManager.registerCustomCache("nisabValues",
      Caffeine.newBuilder()
        .maximumSize(100)
        .expireAfterAccess(1, TimeUnit.HOURS)  // Expire after last access
        .refreshAfterWrite(30, TimeUnit.MINUTES)  // Refresh periodically
        .recordStats()
        .build()
    );

    cacheManager.registerCustomCache("donorProfiles",
      Caffeine.newBuilder()
        .maximumWeight(10_000_000)  // 10MB weight limit
        .weigher((String key, DonorProfile value) -> {
          // Custom weight calculation
          return value.getEmail().length() + value.getName().length() + 100;
        })
        .expireAfterWrite(1, TimeUnit.HOURS)
        .removalListener((String key, DonorProfile value, RemovalCause cause) -> {
          logger.info("Cache entry removed: key={}, cause={}", key, cause);
        })
        .recordStats()
        .build()
    );

    return cacheManager;
  }

  @Bean
  public CacheManagerCustomizer<CaffeineCacheManager> cacheManagerCustomizer() {
    return cacheManager -> {
      cacheManager.setCaffeine(Caffeine.newBuilder()
        .maximumSize(500)
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .recordStats()
      );
    };
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableCaching
class CaffeineCacheConfig {

  @Bean
  fun cacheManager(): CacheManager {
    val cacheManager = CaffeineCacheManager()

    // Different eviction policies for different caches
    cacheManager.registerCustomCache("zakatCalculations",
      Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .recordStats()
        .build()
    )

    cacheManager.registerCustomCache("nisabValues",
      Caffeine.newBuilder()
        .maximumSize(100)
        .expireAfterAccess(1, TimeUnit.HOURS)  // Expire after last access
        .refreshAfterWrite(30, TimeUnit.MINUTES)  // Refresh periodically
        .recordStats()
        .build()
    )

    cacheManager.registerCustomCache("donorProfiles",
      Caffeine.newBuilder()
        .maximumWeight(10_000_000)  // 10MB weight limit
        .weigher { key: String, value: DonorProfile ->
          // Custom weight calculation
          value.email.length + value.name.length + 100
        }
        .expireAfterWrite(1, TimeUnit.HOURS)
        .removalListener { key: String?, value: DonorProfile?, cause ->
          logger.info("Cache entry removed: key=$key, cause=$cause")
        }
        .recordStats()
        .build()
    )

    return cacheManager
  }
}
```

### Redis Cache Configuration

**Java Example**:

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {

  @Bean
  public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
    RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(10))
      .serializeKeysWith(
        RedisSerializationContext.SerializationPair.fromSerializer(
          new StringRedisSerializer()
        )
      )
      .serializeValuesWith(
        RedisSerializationContext.SerializationPair.fromSerializer(
          new GenericJackson2JsonRedisSerializer()
        )
      )
      .disableCachingNullValues();

    Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

    // Zakat calculations: 10 minutes TTL
    cacheConfigurations.put("zakatCalculations",
      defaultConfig.entryTtl(Duration.ofMinutes(10))
    );

    // Nisab values: 1 hour TTL
    cacheConfigurations.put("nisabValues",
      defaultConfig.entryTtl(Duration.ofHours(1))
    );

    // Donor profiles: 2 hours TTL
    cacheConfigurations.put("donorProfiles",
      defaultConfig.entryTtl(Duration.ofHours(2))
    );

    return RedisCacheManager.builder(connectionFactory)
      .cacheDefaults(defaultConfig)
      .withInitialCacheConfigurations(cacheConfigurations)
      .transactionAware()
      .build();
  }

  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
    template.setHashKeySerializer(new StringRedisSerializer());
    template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
    return template;
  }
}
```

### Detecting N+1 Queries

**Java Example** (N+1 Problem):

```java
@Repository
public interface DonationRepository extends JpaRepository<Donation, String> {
  List<Donation> findAll();
}

@Service
public class DonationService {

  // ❌ Bad: N+1 query problem
  @Transactional(readOnly = true)
  public List<DonationWithDonorResponse> findAllWithDonorBad() {
    List<Donation> donations = donationRepository.findAll();

    return donations.stream()
      .map(donation -> {
        // This triggers a separate query for EACH donation (N queries)
        Donor donor = donorRepository.findById(donation.getDonorId()).orElse(null);
        return new DonationWithDonorResponse(donation, donor);
      })
      .toList();
  }
}
```

### Solution 1: JPQL Fetch Join

**Java Example**:

```java
@Repository
public interface DonationRepository extends JpaRepository<Donation, String> {

  // ✅ Good: Single query with JOIN FETCH
  @Query("""
    SELECT d FROM Donation d
    JOIN FETCH d.donor
    ORDER BY d.donationDate DESC
    """)
  List<Donation> findAllWithDonor();

  // ✅ Good: Multiple fetch joins
  @Query("""
    SELECT d FROM Donation d
    JOIN FETCH d.donor donor
    JOIN FETCH d.category category
    WHERE d.donationDate >= :startDate
    ORDER BY d.donationDate DESC
    """)
  List<Donation> findAllWithDonorAndCategory(@Param("startDate") LocalDate startDate);
}

@Service
public class DonationService {

  @Transactional(readOnly = true)
  public List<DonationWithDonorResponse> findAllWithDonorGood() {
    // Single query with JOIN FETCH
    List<Donation> donations = donationRepository.findAllWithDonor();

    return donations.stream()
      .map(donation -> new DonationWithDonorResponse(donation, donation.getDonor()))
      .toList();
  }
}
```

### Solution 2: Entity Graphs

**Java Example**:

```java
@Entity
@Table(name = "donations")
@NamedEntityGraph(
  name = "Donation.withDonor",
  attributeNodes = @NamedAttributeNode("donor")
)
@NamedEntityGraph(
  name = "Donation.withDonorAndCategory",
  attributeNodes = {
    @NamedAttributeNode("donor"),
    @NamedAttributeNode("category")
  }
)
public class Donation {
  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "donor_id")
  private Donor donor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private DonationCategory category;

  // Other fields
}

@Repository
public interface DonationRepository extends JpaRepository<Donation, String> {

  // ✅ Good: Use entity graph
  @EntityGraph(value = "Donation.withDonor", type = EntityGraph.EntityGraphType.FETCH)
  List<Donation> findAll();

  @EntityGraph(value = "Donation.withDonorAndCategory", type = EntityGraph.EntityGraphType.FETCH)
  List<Donation> findByDonationDateAfter(LocalDate date);
}
```

### Solution 3: Batch Fetching

**Java Example**:

```java
@Entity
@Table(name = "donations")
public class Donation {
  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "donor_id")
  @BatchSize(size = 10)  // Fetch in batches of 10
  private Donor donor;

  // Other fields
}

// Alternative: Global batch size in properties
// hibernate.default_batch_fetch_size=10
```

### N+1 Query Monitoring

**Java Example** (Hibernate Statistics):

```java
@Configuration
public class HibernateStatisticsConfig {

  @Bean
  public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
    return hibernateProperties -> {
      hibernateProperties.put("hibernate.generate_statistics", "true");
    };
  }
}

@Service
public class QueryPerformanceMonitoringService {
  private static final Logger logger = LoggerFactory.getLogger(QueryPerformanceMonitoringService.class);

  @PersistenceContext
  private EntityManager entityManager;

  public void logStatistics() {
    SessionFactory sessionFactory = entityManager.getEntityManagerFactory()
      .unwrap(SessionFactory.class);

    Statistics statistics = sessionFactory.getStatistics();

    logger.info("Hibernate Statistics:");
    logger.info("  Queries executed: {}", statistics.getQueryExecutionCount());
    logger.info("  Cache hits: {}", statistics.getSecondLevelCacheHitCount());
    logger.info("  Cache misses: {}", statistics.getSecondLevelCacheMissCount());
    logger.info("  Entities loaded: {}", statistics.getEntityLoadCount());
    logger.info("  Entities fetched: {}", statistics.getEntityFetchCount());
    logger.info("  Collections loaded: {}", statistics.getCollectionLoadCount());
    logger.info("  Collections fetched: {}", statistics.getCollectionFetchCount());

    // Log slow queries
    String[] queries = statistics.getQueries();
    for (String query : queries) {
      QueryStatistics queryStats = statistics.getQueryStatistics(query);
      if (queryStats.getExecutionAvgTime() > 100) {
        logger.warn("Slow query detected: {} (avg: {}ms)",
          query, queryStats.getExecutionAvgTime());
      }
    }
  }
}
```

### Automation Over Manual

**Applied in Performance**:

- ✅ Automatic connection pool sizing based on CPU cores
- ✅ Automatic cache eviction policies
- ✅ Automatic N+1 query detection with statistics
- ✅ Virtual thread auto-scaling

### Explicit Over Implicit

**Applied in Performance**:

- ✅ Explicit cache strategies (Caffeine vs Redis)
- ✅ Explicit fetch strategies (JOIN FETCH, Entity Graphs)
- ✅ Explicit pool sizing formulas
- ✅ Explicit virtual thread configuration

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Data Access](data-access.md)** - Database optimization
- **[Best Practices](best-practices.md)** - Performance patterns

## See Also

**OSE Explanation Foundation**:

- [Java Performance](../../../programming-languages/java/performance-standards.md) - Java JVM tuning
- [Spring Framework Idioms](./idioms.md) - Performance patterns
- [Spring Framework Data Access](./data-access.md) - Query optimization
- [Spring Framework Observability](./observability.md) - Performance monitoring

**Spring Boot Extension**:

- [Spring Boot Performance](../jvm-spring-boot/performance.md) - Auto-configured optimization

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
