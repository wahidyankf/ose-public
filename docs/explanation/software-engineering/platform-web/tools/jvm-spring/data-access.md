---
title: Spring Framework Data Access
description: Data persistence covering JdbcTemplate, NamedParameterJdbcTemplate, transaction management, @Transactional, PlatformTransactionManager, transaction propagation/isolation, exception translation, connection pooling, Spring Data JPA integration, and multiple datasources
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - data-access
  - jdbc
  - transactions
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - automation-over-manual
created: 2026-01-29
---

# Spring Framework Data Access

**Understanding-oriented documentation** for data persistence with Spring Framework.

## Overview

Spring Framework provides comprehensive data access abstraction through JdbcTemplate, transaction management, and exception translation, simplifying database operations and ensuring data consistency.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [JdbcTemplate](#jdbctemplate)
- [NamedParameterJdbcTemplate](#namedparameterjdbctemplate)
- [Transaction Management](#transaction-management)
- [Transaction Propagation](#transaction-propagation)
- [Transaction Isolation](#transaction-isolation)
- [Exception Translation](#exception-translation)
- [Connection Pooling](#connection-pooling)
- [Multiple DataSources](#multiple-datasources)

### Basic CRUD Operations

**Java Example** (Zakat Calculation Repository):

```java
@Repository
public class JdbcZakatCalculationRepository implements ZakatCalculationRepository {
  private final JdbcTemplate jdbcTemplate;

  public JdbcZakatCalculationRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public Optional<ZakatCalculation> findById(String id) {
    String sql = "SELECT * FROM zakat_calculations WHERE id = ?";
    try {
      ZakatCalculation calculation = jdbcTemplate.queryForObject(
        sql,
        new ZakatCalculationRowMapper(),
        id
      );
      return Optional.ofNullable(calculation);
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  @Override
  public void save(ZakatCalculation calculation) {
    String sql = """
      INSERT INTO zakat_calculations (id, wealth, nisab, zakat_amount, eligible, calculation_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        wealth = EXCLUDED.wealth,
        nisab = EXCLUDED.nisab,
        zakat_amount = EXCLUDED.zakat_amount,
        eligible = EXCLUDED.eligible
      """;

    jdbcTemplate.update(sql,
      calculation.getId(),
      calculation.getWealth().getAmount(),
      calculation.getNisab().getAmount(),
      calculation.getZakatAmount().getAmount(),
      calculation.isEligible(),
      calculation.getCalculationDate()
    );
  }

  @Override
  public List<ZakatCalculation> findByDateRange(LocalDate startDate, LocalDate endDate) {
    String sql = """
      SELECT * FROM zakat_calculations
      WHERE calculation_date BETWEEN ? AND ?
      ORDER BY calculation_date DESC
      """;

    return jdbcTemplate.query(sql, new ZakatCalculationRowMapper(), startDate, endDate);
  }

  private static class ZakatCalculationRowMapper implements RowMapper<ZakatCalculation> {
    @Override
    public ZakatCalculation mapRow(ResultSet rs, int rowNum) throws SQLException {
      return new ZakatCalculation(
        rs.getString("id"),
        Money.of(rs.getBigDecimal("wealth"), "USD"),
        Money.of(rs.getBigDecimal("nisab"), "USD"),
        Money.of(rs.getBigDecimal("zakat_amount"), "USD"),
        rs.getBoolean("eligible"),
        rs.getDate("calculation_date").toLocalDate()
      );
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Repository
class JdbcZakatCalculationRepository(
  private val jdbcTemplate: JdbcTemplate
) : ZakatCalculationRepository {

  override fun findById(id: String): ZakatCalculation? {
    val sql = "SELECT * FROM zakat_calculations WHERE id = ?"
    return try {
      jdbcTemplate.queryForObject(sql, ZakatCalculationRowMapper(), id)
    } catch (e: EmptyResultDataAccessException) {
      null
    }
  }

  override fun save(calculation: ZakatCalculation) {
    val sql = """
      INSERT INTO zakat_calculations (id, wealth, nisab, zakat_amount, eligible, calculation_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        wealth = EXCLUDED.wealth,
        nisab = EXCLUDED.nisab,
        zakat_amount = EXCLUDED.zakat_amount,
        eligible = EXCLUDED.eligible
      """

    jdbcTemplate.update(sql,
      calculation.id,
      calculation.wealth.amount,
      calculation.nisab.amount,
      calculation.zakatAmount.amount,
      calculation.eligible,
      calculation.calculationDate
    )
  }

  override fun findByDateRange(startDate: LocalDate, endDate: LocalDate): List<ZakatCalculation> {
    val sql = """
      SELECT * FROM zakat_calculations
      WHERE calculation_date BETWEEN ? AND ?
      ORDER BY calculation_date DESC
      """

    return jdbcTemplate.query(sql, ZakatCalculationRowMapper(), startDate, endDate)
  }

  private class ZakatCalculationRowMapper : RowMapper<ZakatCalculation> {
    override fun mapRow(rs: ResultSet, rowNum: Int): ZakatCalculation = ZakatCalculation(
      id = rs.getString("id"),
      wealth = Money.of(rs.getBigDecimal("wealth"), "USD"),
      nisab = Money.of(rs.getBigDecimal("nisab"), "USD"),
      zakatAmount = Money.of(rs.getBigDecimal("zakat_amount"), "USD"),
      eligible = rs.getBoolean("eligible"),
      calculationDate = rs.getDate("calculation_date").toLocalDate()
    )
  }
}
```

## NamedParameterJdbcTemplate

**Java Example**:

```java
@Repository
public class JdbcDonationRepository implements DonationRepository {
  private final NamedParameterJdbcTemplate namedJdbcTemplate;

  public JdbcDonationRepository(NamedParameterJdbcTemplate namedJdbcTemplate) {
    this.namedJdbcTemplate = namedJdbcTemplate;
  }

  @Override
  public void save(Donation donation) {
    String sql = """
      INSERT INTO donations (id, amount, category, donor_id, donation_date)
      VALUES (:id, :amount, :category, :donorId, :donationDate)
      """;

    MapSqlParameterSource params = new MapSqlParameterSource()
      .addValue("id", donation.getId().getValue())
      .addValue("amount", donation.getAmount().getAmount())
      .addValue("category", donation.getCategory().name())
      .addValue("donorId", donation.getDonorId())
      .addValue("donationDate", donation.getDonationDate());

    namedJdbcTemplate.update(sql, params);
  }

  @Override
  public List<Donation> findByDonorId(String donorId) {
    String sql = """
      SELECT * FROM donations
      WHERE donor_id = :donorId
      ORDER BY donation_date DESC
      """;

    MapSqlParameterSource params = new MapSqlParameterSource()
      .addValue("donorId", donorId);

    return namedJdbcTemplate.query(sql, params, new DonationRowMapper());
  }
}
```

**Kotlin Example**:

```kotlin
@Repository
class JdbcDonationRepository(
  private val namedJdbcTemplate: NamedParameterJdbcTemplate
) : DonationRepository {

  override fun save(donation: Donation) {
    val sql = """
      INSERT INTO donations (id, amount, category, donor_id, donation_date)
      VALUES (:id, :amount, :category, :donorId, :donationDate)
      """

    val params = MapSqlParameterSource()
      .addValue("id", donation.id.value)
      .addValue("amount", donation.amount.amount)
      .addValue("category", donation.category.name)
      .addValue("donorId", donation.donorId)
      .addValue("donationDate", donation.donationDate)

    namedJdbcTemplate.update(sql, params)
  }

  override fun findByDonorId(donorId: String): List<Donation> {
    val sql = """
      SELECT * FROM donations
      WHERE donor_id = :donorId
      ORDER BY donation_date DESC
      """

    val params = MapSqlParameterSource().addValue("donorId", donorId)

    return namedJdbcTemplate.query(sql, params, DonationRowMapper())
  }
}
```

### @Transactional Annotation

**Java Example** (Murabaha Contract Service):

```java
@Service
public class MurabahaContractService {
  private final MurabahaContractRepository contractRepository;
  private final PaymentScheduleRepository paymentScheduleRepository;

  public MurabahaContractService(
    MurabahaContractRepository contractRepository,
    PaymentScheduleRepository paymentScheduleRepository
  ) {
    this.contractRepository = contractRepository;
    this.paymentScheduleRepository = paymentScheduleRepository;
  }

  @Transactional
  public MurabahaContractResponse createContract(CreateContractRequest request) {
    // Create contract
    MurabahaContract contract = MurabahaContract.create(
      request.assetCost(),
      request.downPayment(),
      request.profitRate(),
      request.termMonths()
    );

    contractRepository.save(contract);

    // Create payment schedule
    PaymentSchedule schedule = contract.generatePaymentSchedule();
    paymentScheduleRepository.save(schedule);

    // Both operations in same transaction - all or nothing
    return toResponse(contract);
  }

  @Transactional(readOnly = true)
  public Optional<MurabahaContractResponse> findById(String contractId) {
    return contractRepository.findById(contractId)
      .map(this::toResponse);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void archiveOldContracts(LocalDate beforeDate) {
    // New transaction independent of calling transaction
    List<MurabahaContract> oldContracts = contractRepository.findByDateBefore(beforeDate);
    contractRepository.archiveContracts(oldContracts);
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
  private val contractRepository: MurabahaContractRepository,
  private val paymentScheduleRepository: PaymentScheduleRepository
) {

  @Transactional
  fun createContract(request: CreateContractRequest): MurabahaContractResponse {
    // Create contract
    val contract = MurabahaContract.create(
      request.assetCost,
      request.downPayment,
      request.profitRate,
      request.termMonths
    )

    contractRepository.save(contract)

    // Create payment schedule
    val schedule = contract.generatePaymentSchedule()
    paymentScheduleRepository.save(schedule)

    // Both operations in same transaction - all or nothing
    return contract.toResponse()
  }

  @Transactional(readOnly = true)
  fun findById(contractId: String): MurabahaContractResponse? =
    contractRepository.findById(contractId)?.toResponse()

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  fun archiveOldContracts(beforeDate: LocalDate) {
    // New transaction independent of calling transaction
    val oldContracts = contractRepository.findByDateBefore(beforeDate)
    contractRepository.archiveContracts(oldContracts)
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

### Transaction Configuration

**Java Example**:

```java
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
@Configuration
@EnableTransactionManagement
class TransactionConfig {

  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)
}
```

## Transaction Propagation

| Propagation   | Description                                        |
| ------------- | -------------------------------------------------- |
| REQUIRED      | Use existing transaction, create if none (default) |
| REQUIRES_NEW  | Always create new transaction                      |
| SUPPORTS      | Use existing if present, non-transactional if none |
| NOT_SUPPORTED | Always execute non-transactionally                 |
| MANDATORY     | Require existing transaction, error if none        |
| NEVER         | Must execute non-transactionally, error if exists  |
| NESTED        | Execute within nested transaction if supported     |

**Java Example**:

```java
@Service
public class DonationService {

  @Transactional(propagation = Propagation.REQUIRED)
  public void processDonation(Donation donation) {
    // Uses existing transaction or creates new one
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void logDonationEvent(DonationEvent event) {
    // Always creates new transaction
    // Commits independently even if outer transaction rolls back
  }
}
```

## Transaction Isolation

| Isolation        | Description                       | Problems Prevented                |
| ---------------- | --------------------------------- | --------------------------------- |
| READ_UNCOMMITTED | Lowest isolation                  | None                              |
| READ_COMMITTED   | Prevents dirty reads              | Dirty reads                       |
| REPEATABLE_READ  | Prevents dirty and non-repeatable | Dirty reads, non-repeatable reads |
| SERIALIZABLE     | Highest isolation                 | All concurrency issues            |

**Java Example**:

```java
@Service
public class ZakatCalculationService {

  @Transactional(isolation = Isolation.REPEATABLE_READ)
  public ZakatCalculationResponse calculate(CreateZakatCalculationRequest request) {
    // Prevents non-repeatable reads during calculation
  }
}
```

## Exception Translation

Spring translates database-specific exceptions to Spring's `DataAccessException` hierarchy.

**Java Example**:

```java
@Repository
public class JdbcMurabahaContractRepository implements MurabahaContractRepository {
  private final JdbcTemplate jdbcTemplate;

  public JdbcMurabahaContractRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public void save(MurabahaContract contract) {
    try {
      String sql = "INSERT INTO murabaha_contracts (id, asset_cost) VALUES (?, ?)";
      jdbcTemplate.update(sql, contract.getId(), contract.getAssetCost());
    } catch (DuplicateKeyException e) {
      // Spring translates SQLException to DuplicateKeyException
      throw new ContractAlreadyExistsException(contract.getId(), e);
    } catch (DataAccessException e) {
      // Generic data access exception
      throw new ContractPersistenceException("Failed to save contract", e);
    }
  }
}
```

### HikariCP Configuration

**Java Example**:

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

    // Pool size
    config.setMaximumPoolSize(20);
    config.setMinimumIdle(5);

    // Timeouts
    config.setConnectionTimeout(30000);    // 30 seconds
    config.setIdleTimeout(600000);         // 10 minutes
    config.setMaxLifetime(1800000);        // 30 minutes

    // Validation
    config.setValidationTimeout(5000);
    config.setConnectionTestQuery("SELECT 1");

    // Performance
    config.setAutoCommit(false);
    config.setCachePrepStmts(true);
    config.setPrepStmtCacheSize(250);
    config.setPrepStmtCacheSqlLimit(2048);

    return new HikariDataSource(config);
  }
}
```

**Kotlin Example**:

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

      // Pool size
      maximumPoolSize = 20
      minimumIdle = 5

      // Timeouts
      connectionTimeout = 30000    // 30 seconds
      idleTimeout = 600000         // 10 minutes
      maxLifetime = 1800000        // 30 minutes

      // Validation
      validationTimeout = 5000
      connectionTestQuery = "SELECT 1"

      // Performance
      isAutoCommit = false
      addDataSourceProperty("cachePrepStmts", "true")
      addDataSourceProperty("prepStmtCacheSize", "250")
      addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
    }

    return HikariDataSource(config)
  }
}
```

## Multiple DataSources

**Java Example**:

```java
@Configuration
public class MultiDataSourceConfig {

  @Bean
  @Primary
  @Qualifier("primaryDataSource")
  public DataSource primaryDataSource() {
    // Primary database configuration
  }

  @Bean
  @Qualifier("reportsDataSource")
  public DataSource reportsDataSource() {
    // Reports database configuration
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
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[AOP](aop.md)** - AOP for transactions
- **[Best Practices](best-practices.md)** - Transaction patterns

## See Also

**OSE Explanation Foundation**:

- [Java Database Access](../../../programming-languages/java/ddd-standards.md) - Java JDBC baseline
- [Spring Framework Idioms](./idioms.md) - Data access patterns
- [Spring Framework Best Practices](./best-practices.md) - Repository standards
- [Spring Framework Performance](./performance.md) - Query optimization

**Spring Boot Extension**:

- [Spring Boot Data Access](../jvm-spring-boot/data-access.md) - Auto-configured repositories

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
