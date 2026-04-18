---
title: "Java Testing Standards"
description: Authoritative OSE Platform testing standards (JUnit 6, AssertJ, Mockito, TestContainers, Cucumber BDD)
category: explanation
subcategory: prog-lang
tags:
  - java
  - testing
  - junit6
  - assertj
  - mockito
  - testcontainers
  - cucumber
  - bdd
  - tdd
principles:
  - automation-over-manual
  - reproducibility
  - explicit-over-implicit
created: 2026-02-03
updated: 2026-02-03
---

# Java Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for Java development in the OSE Platform. These prescriptive rules govern test frameworks, naming conventions, test organization, and testing patterns.

**Target Audience**: OSE Platform Java developers, QA engineers, technical reviewers

**Scope**: JUnit 6 setup, assertion libraries, mocking patterns, integration testing, BDD acceptance tests

## JUnit 6 Setup

**MUST** use JUnit 6 Jupiter (not JUnit 4) for all unit and integration tests.

### Test Class Naming

**MUST** suffix test classes with `Test`.

**Format**: `[ClassUnderTest]Test`

**Examples**:

- `TaxCalculatorTest` (tests `TaxCalculator` class)
- `InvoiceServiceTest` (tests `InvoiceService` class)
- `PaymentRepositoryTest` (tests `PaymentRepository` class)

**Prohibited**:

- ❌ `TestTaxCalculator` (wrong prefix)
- ❌ `TaxCalculatorTests` (wrong suffix - plural)
- ❌ `TaxCalculatorUnitTest` (redundant - all tests in `src/test/java` are tests)

### Test Method Naming

**MUST** use descriptive, behavior-focused method names.

**Format**: `should[ExpectedBehavior]When[Condition]`

**Examples**:

- `shouldCalculateTaxWhenAmountAboveThreshold()`
- `shouldThrowExceptionWhenInvoiceIsNull()`
- `shouldReturnEmptyListWhenNoPaymentsFound()`

**Prohibited**:

- ❌ `testCalculate()` (not descriptive)
- ❌ `test1()` (no business meaning)
- ❌ `calculateTax_success()` (not behavior-focused)

**Rationale**: Descriptive names serve as living documentation and make test failures immediately understandable.

### Test Lifecycle

**MUST** use `@BeforeEach` and `@AfterEach` for setup/cleanup (not JUnit 4 `@Before`/`@After`).

**Example**:

```java
class TaxCalculatorTest {
  private TaxCalculator calculator;

  @BeforeEach
  void setUp() {
    calculator = new TaxCalculator();
  }

  @AfterEach
  void tearDown() {
    // Cleanup if needed
  }

  @Test
  void shouldCalculateTaxWhenAmountIsPositive() {
    // Test implementation
  }
}
```

**Prohibited**:

- ❌ `@Before` / `@After` (JUnit 4 - deprecated)
- ❌ Setup in constructor (not isolated per test)

## Assertion Library

**MUST** use AssertJ for all assertions (not JUnit assertions).

### AssertJ Assertions (Required)

**Correct**:

```java
import static org.assertj.core.api.Assertions.*;

@Test
void shouldCalculateTaxCorrectly() {
  BigDecimal result = calculator.calculateTax(amount);

  assertThat(result)
    .isNotNull()
    .isEqualByComparingTo(expectedTax);
}
```

**Benefits**:

- Fluent, readable API
- Better error messages
- Rich assertion types (collections, exceptions, etc.)

### JUnit Assertions (Prohibited)

**Wrong**:

```java
import static org.junit.jupiter.api.Assertions.*;

@Test
void shouldCalculateTaxCorrectly() {
  BigDecimal result = calculator.calculateTax(amount);

  assertNotNull(result);  // WRONG - use AssertJ
  assertEquals(expectedTax, result);  // WRONG - use AssertJ
}
```

**Why prohibited**: JUnit assertions have inferior error messages and less expressive API compared to AssertJ.

## Mockito Patterns

**MUST** use Mockito for test doubles with JUnit 6 extension.

### Mockito Setup

**MUST** use `@ExtendWith(MockitoExtension.class)` (not `MockitoAnnotations.initMocks()`).

**Correct**:

```java
@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {
  @Mock
  private InvoiceRepository repository;

  @InjectMocks
  private InvoiceService service;

  @Test
  void shouldCreateInvoiceSuccessfully() {
    // Test implementation
  }
}
```

**Prohibited**:

- ❌ `MockitoAnnotations.initMocks(this)` (deprecated)
- ❌ Manual mock creation without extension

### Mocking Strategy

**Constructor injection enables easy mocking** - production code uses constructor injection, test code provides mocks via constructor.

**Example**:

```java
// Production code (constructor injection)
@Service
public class TaxService {
  private final TaxRepository repository;

  public TaxService(TaxRepository repository) {
    this.repository = repository;
  }
}

// Test code (easy mocking)
@Test
void shouldCalculateTax() {
  TaxRepository mockRepository = mock(TaxRepository.class);
  TaxService service = new TaxService(mockRepository);
  // Test with mock
}
```

### Verification

**SHOULD** verify behavior, not implementation details.

**Correct** (verify behavior):

```java
@Test
void shouldSaveInvoiceWhenCreated() {
  service.createInvoice(data);

  verify(repository).save(any(Invoice.class));
}
```

**Avoid** (verify implementation):

```java
@Test
void shouldCallValidateBeforeSave() {
  service.createInvoice(data);

  // AVOID - tests implementation, not behavior
  InOrder inOrder = inOrder(validator, repository);
  inOrder.verify(validator).validate(any());
  inOrder.verify(repository).save(any());
}
```

**Rationale**: Behavior verification allows refactoring without breaking tests.

## Integration Testing — In-Memory Repositories and WireMock

**REQUIRED**: Integration tests MUST mock all external I/O.

**PROHIBITED**: Testcontainers, real databases, real network calls in integration tests.
Testcontainers belongs in E2E tests only.

**See**: [Three-Tier Testing Model](../../development/test-driven-development-tdd/three-tier-testing.md) and
[Integration Testing Standards](../../development/test-driven-development-tdd/integration-testing-standards.md).

### In-Memory Repository Implementations

**REQUIRED**: Use in-memory repository implementations for integration tests.

Implement the same repository interface as production, backed by an in-memory `Map` or `List`.

```java
// In-memory implementation for integration tests
public class InMemoryInvoiceRepository implements InvoiceRepository {
    private final Map<InvoiceId, Invoice> store = new HashMap<>();

    @Override
    public Optional<Invoice> findById(InvoiceId id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Invoice> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void save(Invoice invoice) {
        store.put(invoice.getId(), invoice);
    }

    @Override
    public void delete(InvoiceId id) {
        store.remove(id);
    }
}

// Integration test — wires real service with in-memory repo
class InvoiceServiceIntegrationTest {
    private InvoiceRepository repository;
    private InvoiceService service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryInvoiceRepository(); // ✅ no real DB
        service = new InvoiceService(repository);
    }

    @Test
    void shouldPersistInvoiceAndRetrieveById() {
        // Arrange
        Invoice invoice = Invoice.create(InvoiceId.generate(), Money.usd(1000));

        // Act
        service.create(invoice);
        Optional<Invoice> retrieved = repository.findById(invoice.getId());

        // Assert
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getAmount()).isEqualTo(Money.usd(1000));
    }
}
```

### MockMvc for API Layer Integration Tests

**REQUIRED**: Use MockMvc with `@MockBean` to test Spring controllers. MockMvc tests
the full Spring request-response pipeline without starting a real HTTP server or touching a real DB.

```java
@SpringBootTest
@AutoConfigureMockMvc
class InvoiceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InvoiceRepository invoiceRepository; // ✅ real DB replaced with mock

    @Test
    void shouldReturnInvoiceById() throws Exception {
        Invoice invoice = Invoice.create(InvoiceId.of("INV-001"), Money.usd(1000));
        when(invoiceRepository.findById(InvoiceId.of("INV-001")))
            .thenReturn(Optional.of(invoice));

        mockMvc.perform(get("/api/invoices/INV-001")
                .header("Authorization", "Bearer test-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.amount").value(1000));
    }

    @Test
    void shouldReturn404WhenInvoiceNotFound() throws Exception {
        when(invoiceRepository.findById(any())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/invoices/NONEXISTENT"))
            .andExpect(status().isNotFound());
    }
}
```

### WireMock for Outbound HTTP

**REQUIRED**: Use WireMock to stub outbound HTTP calls to external services in integration tests.

```java
@ExtendWith(WireMockExtension.class)
class PaymentServiceIntegrationTest {

    @RegisterExtension
    static WireMockExtension wireMock = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort())
        .build();

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(new HttpPaymentGatewayClient(wireMock.baseUrl()));
    }

    @Test
    void shouldChargeSuccessfully() {
        wireMock.stubFor(post(urlEqualTo("/charge"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"transactionId\": \"TXN-123\", \"status\": \"approved\"}")));

        PaymentResult result = service.charge(Money.usd(500), "card-token");

        assertThat(result.getTransactionId()).isEqualTo("TXN-123");
        assertThat(result.getStatus()).isEqualTo("approved");
        wireMock.verify(postRequestedFor(urlEqualTo("/charge")));
        // ✅ WireMock intercepted — no real payment gateway
    }
}
```

## TestContainers (E2E Only)

**REQUIRED**: Use Testcontainers in E2E tests that require a real database.

**PROHIBITED**: Testcontainers in unit or integration tests.

```java
// ✅ Correct — Testcontainers in E2E test project
@Testcontainers
class InvoiceApiE2ETest {
    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("e2e_db")
            .withUsername("test")
            .withPassword("test");

    @Test
    void shouldPersistInvoiceEndToEnd() {
        // Real HTTP → real Spring Boot → real PostgreSQL
    }
}
```

**Prohibited in integration tests**:

- ❌ `@Testcontainers` annotation in `src/test/java` integration tests
- ❌ `PostgreSQLContainer`, `MySQLContainer`, or any real DB container in integration tests
- ❌ Real HTTP calls to external payment gateways, notification services, or external APIs

## BDD Process

**SHOULD** use Cucumber for acceptance tests (BDD - Behavior-Driven Development).

### Gherkin Scenarios

**Location**: `src/test/resources/features/`

**Example**: `src/test/resources/features/tax-calculation.feature`

```gherkin
Feature: Tax Calculation

  Scenario: Calculate tax for standard invoice
    Given an invoice with amount of 1000
    When tax is calculated
    Then the tax amount should be 150
```

### Step Definitions

**Location**: Test packages (e.g., `com.oseplatform.tax.steps`)

**Example**:

```java
public class TaxCalculationSteps {
  private Invoice invoice;
  private BigDecimal taxAmount;

  @Given("an invoice with amount of {int}")
  public void anInvoiceWithAmount(int amount) {
    invoice = new Invoice(BigDecimal.valueOf(amount));
  }

  @When("tax is calculated")
  public void taxIsCalculated() {
    taxAmount = calculator.calculateTax(invoice.getAmount());
  }

  @Then("the tax amount should be {int}")
  public void theTaxAmountShouldBe(int expected) {
    assertThat(taxAmount).isEqualByComparingTo(BigDecimal.valueOf(expected));
  }
}
```

**When to use BDD**:

- Acceptance tests with business stakeholders
- End-to-end user journey validation
- Complex business rules requiring clear specification

**When NOT to use BDD**:

- Simple unit tests (use JUnit + AssertJ directly)
- Technical integration tests (use MockMvc + WireMock + in-memory repos directly)

## Test Organization

**MUST** organize tests into three categories:

### Unit Tests (Fast)

- **Location**: `src/test/java`
- **Dependencies**: None (mocks only)
- **Run frequency**: Every commit
- **Naming**: `[Class]Test.java`

### Integration Tests (In-Memory + MockMvc + WireMock)

- **Location**: `src/test/java` (separate package: `*.integration`)
- **Dependencies**: In-memory repository implementations + WireMock for outbound HTTP
- **External I/O**: NONE — all external dependencies mocked
- **Run frequency**: Pre-push, CI/CD
- **Naming**: `[Component]IntegrationTest.java`

### E2E Tests (Playwright + Testcontainers)

- **Location**: Separate project (`[project]-e2e`)
- **Dependencies**: Real deployed application + real database (Testcontainers)
- **External I/O**: Real — no mocking
- **Run frequency**: Scheduled CI/CD only
- **Naming**: `*.feature` (Gherkin scenarios)

## Coverage Requirements

**MUST** maintain ≥85% line coverage measured by JaCoCo.

**Coverage enforcement**: CI/CD pipeline fails if coverage drops below threshold.

**See**: [Java Code Quality](./code-quality.md) for JaCoCo configuration.

## Enforcement

Testing standards are enforced through:

- **Maven Surefire/Failsafe** - Runs unit and integration tests
- **JaCoCo** - Measures code coverage, enforces ≥85% threshold
- **Code reviews** - Human verification of test quality
- **CI/CD pipeline** - Blocks merges if tests fail or coverage drops

## Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Intermediate Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/intermediate.md)** - Testing with JUnit, Mockito, AssertJ
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - TestContainers, integration testing
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Test-Driven Development (TDD) and Behavior-Driven Development (BDD) practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

## Related Standards

- [Java Coding Standards](./coding-standards.md) - Constructor injection enables easy testing
- [Java Framework Integration](./framework-integration.md) - Testing Spring Boot and Jakarta EE components
- [Java Code Quality](./code-quality.md) - JaCoCo coverage configuration
- [Java Build Configuration](./build-configuration.md) - Maven test dependencies

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Maven Surefire/Failsafe automatically run tests on every build
   - JaCoCo enforces ≥85% coverage threshold (build fails if not met)
   - CI/CD pipeline runs all tests before merge approval

2. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - In-memory repositories reset in `@BeforeEach` — identical state every test run
   - WireMock stubs provide deterministic external service responses
   - Testcontainers (E2E only) spin up identical database instances for real system tests
   - Tests isolated with `@BeforeEach` setup (no shared state between tests)
   - Cucumber BDD scenarios provide reproducible acceptance criteria

3. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Test names explicitly describe behavior (`shouldCalculateTaxWhenAmountAboveThreshold`)
   - AssertJ provides explicit, readable assertions (`assertThat(result).isNotNull().isEqualByComparingTo(expected)`)
   - `@ExtendWith(MockitoExtension.class)` makes mocking framework explicit

## Related Documentation

**Test Organization**:

- [Coding Standards](./coding-standards.md) - Test class naming, package structure, and file organization

**Domain Testing**:

- [DDD Standards](./ddd-standards.md) - Aggregate testing patterns, domain event verification, and repository testing

**Coverage Requirements**:

- [Code Quality Standards](./code-quality.md) - JaCoCo coverage enforcement and quality gate thresholds

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-04
