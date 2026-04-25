---
title: Spring Framework Testing
description: Testing strategies covering Spring TestContext Framework, @ContextConfiguration, @MockBean/@SpyBean, @DirtiesContext, integration testing, unit testing, @Transactional in tests, MockMvc, and TestContext caching
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - testing
  - junit
  - mockito
  - java
  - kotlin
principles:
  - automation-over-manual
created: 2026-01-29
---

# Spring Framework Testing

**Understanding-oriented documentation** for testing Spring applications.

## Overview

Spring Framework provides comprehensive testing support through the Spring TestContext Framework, enabling both unit and integration testing with dependency injection, mocking, and transaction management.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Spring TestContext Framework](#spring-testcontext-framework)
- [Unit Testing](#unit-testing-without-spring)
- [Integration Testing](#integration-testing-with-spring)
- [@MockBean and @SpyBean](#mockbean-and-spybean)
- [Testing Transactions](#testing-transactions)
- [Testing Web Layer](#testing-web-layer-with-mockmvc)
- [TestContext Caching](#testcontext-caching)

### Basic Integration Test

**Java Example** (Zakat Calculation Service):

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

### Pure Unit Tests

**Java Example** (Domain Model):

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

### Unit Tests with Mockito

**Java Example** (Service with Mocked Dependencies):

```java
class DonationServiceTest {

  @Mock
  private DonationRepository repository;

  @Mock
  private DonationValidator validator;

  @Mock
  private ApplicationEventPublisher eventPublisher;

  @InjectMocks
  private DonationService service;

  @BeforeEach
  void setup() {
    MockitoAnnotations.openMocks(this);
  }

  @Test
  void processDonation_validRequest_savesDonation() {
    // Given
    CreateDonationRequest request = new CreateDonationRequest(
      new BigDecimal("100.00"),
      DonationCategory.ZAKAT,
      "donor-123",
      LocalDate.now()
    );

    ValidationResult validationResult = ValidationResult.success();
    when(validator.validate(request)).thenReturn(validationResult);

    // When
    DonationResponse response = service.processDonation(request);

    // Then
    verify(repository).save(any(Donation.class));
    verify(eventPublisher).publishEvent(any(DonationCreatedEvent.class));
    assertThat(response.amount()).isEqualByComparingTo("100.00");
  }

  @Test
  void processDonation_invalidRequest_throwsException() {
    // Given
    CreateDonationRequest request = new CreateDonationRequest(
      new BigDecimal("-10.00"),
      DonationCategory.ZAKAT,
      "donor-123",
      LocalDate.now()
    );

    ValidationResult validationResult = ValidationResult.withErrors(
      List.of("Amount must be positive")
    );
    when(validator.validate(request)).thenReturn(validationResult);

    // When/Then
    assertThatThrownBy(() -> service.processDonation(request))
      .isInstanceOf(DonationValidationException.class);

    verify(repository, never()).save(any(Donation.class));
  }
}
```

### Test Configuration

**Java Example**:

```java
@Configuration
@EnableTransactionManagement
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class TestConfig {

  @Bean
  public DataSource dataSource() {
    // H2 in-memory database for testing
    EmbeddedDatabaseBuilder builder = new EmbeddedDatabaseBuilder();
    return builder
      .setType(EmbeddedDatabaseType.H2)
      .addScript("classpath:schema.sql")
      .addScript("classpath:test-data.sql")
      .build();
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
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableTransactionManagement
@ComponentScan(basePackages = ["com.oseplatform.zakat"])
class TestConfig {

  @Bean
  fun dataSource(): DataSource {
    // H2 in-memory database for testing
    val builder = EmbeddedDatabaseBuilder()
    return builder
      .setType(EmbeddedDatabaseType.H2)
      .addScript("classpath:schema.sql")
      .addScript("classpath:test-data.sql")
      .build()
  }

  @Bean
  fun jdbcTemplate(dataSource: DataSource): JdbcTemplate = JdbcTemplate(dataSource)

  @Bean
  fun transactionManager(dataSource: DataSource): PlatformTransactionManager =
    DataSourceTransactionManager(dataSource)
}
```

## @MockBean and @SpyBean

**Java Example** (Mocking External Dependencies):

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
class MurabahaContractServiceIntegrationTest {

  @Autowired
  private MurabahaContractService service;

  @MockBean
  private GoldPriceService goldPriceService;  // Mock external service

  @SpyBean
  private MurabahaContractRepository repository;  // Spy on real repository

  @Test
  void createContract_withMockedGoldPrice_calculatesCorrectly() {
    // Given
    when(goldPriceService.getCurrentPrice("USD"))
      .thenReturn(new BigDecimal("60.00"));

    CreateContractRequest request = new CreateContractRequest(
      new BigDecimal("10000"),
      new BigDecimal("2000"),
      new BigDecimal("0.10"),
      12
    );

    // When
    MurabahaContractResponse response = service.createContract(request);

    // Then
    verify(goldPriceService).getCurrentPrice("USD");
    verify(repository).save(any(MurabahaContract.class));
    assertThat(response.assetCost()).isEqualByComparingTo("10000");
  }
}
```

## Testing Transactions

**Java Example** (@Transactional in Tests):

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
@Transactional  // Rolls back after each test
class DonationServiceTransactionTest {

  @Autowired
  private DonationService service;

  @Autowired
  private DonationRepository repository;

  @Test
  void processDonation_rollsBackOnException() {
    // Given
    CreateDonationRequest request = new CreateDonationRequest(
      new BigDecimal("100.00"),
      DonationCategory.ZAKAT,
      "donor-123",
      LocalDate.now()
    );

    // When/Then - Exception causes rollback
    assertThatThrownBy(() -> service.processDonationWithError(request))
      .isInstanceOf(RuntimeException.class);

    // Verify rollback - no donation saved
    assertThat(repository.findAll()).isEmpty();
  }

  @Test
  @Commit  // Override rollback for this test
  void processDonation_commitChanges() {
    // Given
    CreateDonationRequest request = new CreateDonationRequest(
      new BigDecimal("100.00"),
      DonationCategory.ZAKAT,
      "donor-123",
      LocalDate.now()
    );

    // When
    DonationResponse response = service.processDonation(request);

    // Then - Changes are committed
    assertThat(repository.findById(response.id())).isPresent();
  }
}
```

## Testing Web Layer with MockMvc

**Java Example** (Controller Testing):

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {WebConfig.class, TestConfig.class})
@WebAppConfiguration
class ZakatCalculationControllerTest {

  @Autowired
  private WebApplicationContext wac;

  private MockMvc mockMvc;

  @MockBean
  private ZakatCalculationService service;

  @BeforeEach
  void setup() {
    mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
  }

  @Test
  void calculate_validRequest_returns200() throws Exception {
    // Given
    CreateZakatCalculationRequest request = new CreateZakatCalculationRequest(
      new BigDecimal("10000"),
      new BigDecimal("5000"),
      LocalDate.now()
    );

    ZakatCalculationResponse response = new ZakatCalculationResponse(
      "zakat-123",
      new BigDecimal("10000"),
      new BigDecimal("5000"),
      new BigDecimal("250.00"),
      true,
      LocalDate.now()
    );

    when(service.calculate(any())).thenReturn(response);

    // When/Then
    mockMvc.perform(post("/api/v1/zakat/calculate")
        .contentType(MediaType.APPLICATION_JSON)
        .content(new ObjectMapper().writeValueAsString(request)))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.zakatAmount").value("250.00"))
      .andExpect(jsonPath("$.eligible").value(true));
  }

  @Test
  void calculate_invalidRequest_returns400() throws Exception {
    // Given - Invalid request (negative wealth)
    String invalidRequest = """
      {
        "wealth": -1000,
        "nisab": 5000,
        "calculationDate": "2026-01-29"
      }
      """;

    // When/Then
    mockMvc.perform(post("/api/v1/zakat/calculate")
        .contentType(MediaType.APPLICATION_JSON)
        .content(invalidRequest))
      .andExpect(status().isBadRequest());
  }

  @Test
  void getCalculation_notFound_returns404() throws Exception {
    // Given
    when(service.findById("nonexistent")).thenReturn(Optional.empty());

    // When/Then
    mockMvc.perform(get("/api/v1/zakat/calculations/nonexistent"))
      .andExpect(status().isNotFound());
  }
}
```

**Kotlin Example**:

```kotlin
@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [WebConfig::class, TestConfig::class])
@WebAppConfiguration
class ZakatCalculationControllerTest {

  @Autowired
  private lateinit var wac: WebApplicationContext

  private lateinit var mockMvc: MockMvc

  @MockBean
  private lateinit var service: ZakatCalculationService

  @BeforeEach
  fun setup() {
    mockMvc = MockMvcBuilders.webAppContextSetup(wac).build()
  }

  @Test
  fun `calculate valid request returns 200`() {
    // Given
    val request = CreateZakatCalculationRequest(
      wealth = BigDecimal("10000"),
      nisab = BigDecimal("5000"),
      calculationDate = LocalDate.now()
    )

    val response = ZakatCalculationResponse(
      id = "zakat-123",
      wealth = BigDecimal("10000"),
      nisab = BigDecimal("5000"),
      zakatAmount = BigDecimal("250.00"),
      eligible = true,
      calculationDate = LocalDate.now()
    )

    whenever(service.calculate(any())).thenReturn(response)

    // When/Then
    mockMvc.perform(post("/api/v1/zakat/calculate")
        .contentType(MediaType.APPLICATION_JSON)
        .content(ObjectMapper().writeValueAsString(request)))
      .andExpect(status().isCreated)
      .andExpect(jsonPath("$.zakatAmount").value("250.00"))
      .andExpect(jsonPath("$.eligible").value(true))
  }
}
```

## TestContext Caching

Spring caches ApplicationContext instances across tests for performance.

**Java Example** (Reusing Context):

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
class ZakatServiceTest1 {
  // Uses cached context
}

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
class ZakatServiceTest2 {
  // Reuses same cached context (fast)
}

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = DifferentTestConfig.class)
class DonationServiceTest {
  // Creates new context (slower)
}
```

### @DirtiesContext

**Java Example** (Invalidating Cache):

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
class ModifyingTest {

  @Test
  @DirtiesContext  // Invalidates context after this test
  void testThatModifiesContext() {
    // Test that changes application state
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Best Practices](best-practices.md)** - Testing strategies

## See Also

**OSE Explanation Foundation**:

- [Java Testing](../../../programming-languages/java/testing-standards.md) - Java test baseline
- [Spring Framework Idioms](./idioms.md) - Testing patterns
- [Spring Framework Best Practices](./best-practices.md) - Test standards
- [Spring Framework Data Access](./data-access.md) - Repository testing

**Spring Boot Extension**:

- [Spring Boot Testing](../jvm-spring-boot/testing.md) - Auto-configured tests

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
