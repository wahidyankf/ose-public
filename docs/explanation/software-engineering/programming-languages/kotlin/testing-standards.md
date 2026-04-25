---
title: "Kotlin Testing Standards"
description: Authoritative OSE Platform Kotlin testing standards (JUnit 5, Kotest, MockK, coroutine testing)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - testing-standards
  - junit5
  - kotest
  - mockk
  - coroutines-test
  - coverage
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to apply Kotlin testing in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for Kotlin development in the OSE Platform. It covers test framework selection, coroutine testing, mocking with MockK, coverage requirements, and integration test patterns.

**Target Audience**: OSE Platform Kotlin developers, technical reviewers, CI/CD automation

**Scope**: Unit tests, integration tests, coroutine tests, BDD tests, coverage enforcement

## Software Engineering Principles

### 1. Automation Over Manual

**How Kotlin Testing Implements**:

- Gradle `test` task runs all tests automatically on every build
- Kover enforces >=95% coverage gate as part of `check` task
- TestContainers provisions real databases automatically, no manual setup
- CI/CD runs tests on every push

**PASS Example** (Automated Test Pipeline):

```kotlin
// build.gradle.kts - Automated test configuration
tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}

kover {
    verify {
        rule {
            minBound(95) // Fails build if below 95% coverage
        }
    }
}

// ZakatCalculatorTest.kt - Automated Zakat validation
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ZakatCalculatorTest {
    private val calculator = ZakatCalculator()

    @ParameterizedTest
    @MethodSource("zakatTestCases")
    fun `calculate returns correct zakat amount for wealth level`(
        wealth: BigDecimal,
        nisab: BigDecimal,
        expectedZakat: BigDecimal,
    ) {
        assertEquals(expectedZakat, calculator.calculate(wealth, nisab))
    }

    companion object {
        @JvmStatic
        fun zakatTestCases() = listOf(
            Arguments.of(BigDecimal("100000"), BigDecimal("5000"), BigDecimal("2500.00")),
            Arguments.of(BigDecimal("3000"), BigDecimal("5000"), BigDecimal("0.00")),
            Arguments.of(BigDecimal("5000"), BigDecimal("5000"), BigDecimal("125.00")),
        )
    }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Test Arrangement):

```kotlin
// Explicit Arrange-Act-Assert structure
@Test
fun `approveMurabahaContract transitions status to approved`() {
    // Arrange - explicit setup, no magic injection
    val contractId = "CONTRACT-001"
    val contract = MurabahaContract(
        contractId = contractId,
        customerId = "CUST-001",
        costPrice = BigDecimal("10000.00"),
        profitMargin = BigDecimal("2000.00"),
        installmentCount = 12,
        status = ContractStatus.PENDING,
    )
    every { contractRepository.findById(contractId) } returns contract

    // Act - single action under test
    val result = contractService.approve(contractId)

    // Assert - explicit expectations
    assertTrue(result.isSuccess)
    val approvedContract = result.getOrThrow()
    assertEquals(ContractStatus.APPROVED, approvedContract.status)
    verify(exactly = 1) { contractRepository.save(any()) }
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Test Data):

```kotlin
// Test fixtures as immutable val declarations
class ZakatPayerFixtures {
    companion object {
        val defaultPayer = ZakatPayer(
            id = "PAYER-001",
            name = "Ahmad bin Abdullah",
            goldWealth = BigDecimal("50000.00"),
            silverWealth = BigDecimal("20000.00"),
            cashWealth = BigDecimal("30000.00"),
        )

        // Derive variant using copy() - never mutate shared fixture
        val lowWealthPayer = defaultPayer.copy(
            id = "PAYER-002",
            cashWealth = BigDecimal("1000.00"),
            goldWealth = BigDecimal.ZERO,
            silverWealth = BigDecimal.ZERO,
        )
    }
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Domain Logic Testing):

```kotlin
// Pure function test - no mocking needed
class ZakatCalculationTest {
    @Test
    fun `calculateZakat is pure - same inputs always produce same output`() {
        val wealth = BigDecimal("100000.00")
        val nisab = BigDecimal("5000.00")

        val result1 = calculateZakat(wealth, nisab)
        val result2 = calculateZakat(wealth, nisab)
        val result3 = calculateZakat(wealth, nisab)

        assertEquals(result1, result2)
        assertEquals(result2, result3)
    }
}
```

### 5. Reproducibility First

**PASS Example** (Reproducible Test Environment):

```kotlin
// TestContainers for reproducible database tests
@Testcontainers
@SpringBootTest
class ZakatRepositoryIntegrationTest {

    companion object {
        @Container
        val postgres = PostgreSQLContainer<Nothing>("postgres:16-alpine").apply {
            withDatabaseName("zakat_test")
            withUsername("test")
            withPassword("test")
        }

        @JvmStatic
        @DynamicPropertySource
        fun registerProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired
    private lateinit var repository: ZakatRepository

    @Test
    fun `save and retrieve zakat transaction`() {
        val transaction = ZakatTransaction.create(
            payerId = "PAYER-001",
            wealth = BigDecimal("100000.00"),
            zakatAmount = BigDecimal("2500.00"),
        )

        repository.save(transaction)
        val found = repository.findById(transaction.transactionId)

        assertNotNull(found)
        assertEquals(transaction.zakatAmount, found!!.zakatAmount)
    }
}
```

## Framework Selection

### JUnit 5 (Default for Spring Boot Projects)

**MUST** use JUnit 5 with Kotlin when the project uses Spring Boot.

```kotlin
// Standard JUnit 5 test structure
@ExtendWith(MockKExtension::class)  // MockK integration
class ZakatServiceTest {

    @MockK
    private lateinit var zakatRepository: ZakatRepository

    @InjectMockKs
    private lateinit var zakatService: ZakatService

    @BeforeEach
    fun setUp() {
        every { zakatRepository.findById(any()) } returns null
    }

    @Test
    fun `calculateForPayer returns zero obligation when payer not found`() {
        val result = zakatService.calculateForPayer("UNKNOWN-ID")

        assertTrue(result.isFailure)
        verify { zakatRepository.findById("UNKNOWN-ID") }
    }
}
```

### Kotest (Preferred for Ktor Projects)

**SHOULD** use Kotest for Ktor projects for idiomatic Kotlin BDD-style tests.

```kotlin
// Kotest describe/it style - readable BDD structure
class ZakatCalculatorSpec : DescribeSpec({

    val calculator = ZakatCalculator()
    val nisab = BigDecimal("5000.00")

    describe("calculateZakat") {
        context("when wealth exceeds nisab") {
            it("returns 2.5% of total wealth") {
                val wealth = BigDecimal("100000.00")
                val result = calculator.calculate(wealth, nisab)
                result shouldBe BigDecimal("2500.00")
            }

            it("rounds to 2 decimal places") {
                val wealth = BigDecimal("10001.00")
                val result = calculator.calculate(wealth, nisab)
                result.scale() shouldBe 2
            }
        }

        context("when wealth is below nisab") {
            it("returns zero") {
                val wealth = BigDecimal("3000.00")
                val result = calculator.calculate(wealth, nisab)
                result shouldBe BigDecimal.ZERO
            }
        }
    }
})
```

## MockK Patterns

### Basic Mocking

**MUST** use MockK for mocking in Kotlin (NOT Mockito - MockK is coroutine-aware).

```kotlin
// CORRECT: MockK basic usage
val repository = mockk<ZakatRepository>()
every { repository.findById("PAYER-001") } returns ZakatPayerFixtures.defaultPayer
every { repository.save(any()) } just Runs

val service = ZakatService(repository)
val result = service.getObligations("PAYER-001")

verify(exactly = 1) { repository.findById("PAYER-001") }
```

### Coroutine Mocking with MockK

**MUST** use `coEvery` and `coVerify` for `suspend` function mocking.

```kotlin
// CORRECT: Coroutine-aware mocking
val repository = mockk<ZakatRepository>()
coEvery { repository.findByIdSuspend("PAYER-001") } returns ZakatPayerFixtures.defaultPayer
coEvery { repository.saveSuspend(any()) } just Runs

runTest {
    val result = zakatService.calculateForPayerAsync("PAYER-001")
    assertTrue(result.isSuccess)
    coVerify(exactly = 1) { repository.saveSuspend(any()) }
}

// WRONG: Using every for suspend functions
every { repository.findByIdSuspend("PAYER-001") } returns ... // Will not work for suspend
```

### Slot Capture

**SHOULD** use `slot` to capture arguments for verification.

```kotlin
val savedTransactionSlot = slot<ZakatTransaction>()
every { repository.save(capture(savedTransactionSlot)) } just Runs

zakatService.processZakatPayment(payerId = "PAYER-001", amount = BigDecimal("2500.00"))

val capturedTransaction = savedTransactionSlot.captured
assertEquals("PAYER-001", capturedTransaction.payerId)
assertEquals(BigDecimal("2500.00"), capturedTransaction.zakatAmount)
```

## Coroutine Testing

### runTest for Suspend Functions

**MUST** use `runTest` from `kotlinx-coroutines-test` for testing coroutines.

```kotlin
// CORRECT: Testing suspend functions with runTest
@Test
fun `fetchZakatHistory returns sorted transactions`() = runTest {
    // Arrange
    val expectedTransactions = listOf(
        ZakatTransaction.create("PAYER-001", BigDecimal("100000"), BigDecimal("2500")),
        ZakatTransaction.create("PAYER-001", BigDecimal("95000"), BigDecimal("2375")),
    )
    coEvery { repository.findAllForPayer("PAYER-001") } returns expectedTransactions

    // Act
    val history = zakatService.fetchHistory("PAYER-001")

    // Assert
    assertEquals(2, history.size)
    assertTrue(history.first().paidAt >= history.last().paidAt)
}
```

### Flow Testing

**MUST** use `turbine` library or `toList()` for testing Flow emissions.

```kotlin
// Testing Flow with turbine
@Test
fun `zakatStatusFlow emits status updates in order`() = runTest {
    val statusFlow = zakatService.observeStatus("CONTRACT-001")

    statusFlow.test {
        assertEquals(ZakatStatus.Pending, awaitItem())
        zakatService.approve("CONTRACT-001")
        assertEquals(ZakatStatus.Approved, awaitItem())
        awaitComplete()
    }
}

// Testing Flow with toList() for finite streams
@Test
fun `calculateAllObligations emits obligation for each payer`() = runTest {
    val payers = listOf(ZakatPayerFixtures.defaultPayer, ZakatPayerFixtures.lowWealthPayer)
    coEvery { repository.findAll() } returns payers.asFlow()

    val obligations = zakatService.calculateAllObligations().toList()

    assertEquals(2, obligations.size)
}
```

## Arrange-Act-Assert Pattern

**MUST** structure all tests with clear Arrange-Act-Assert sections using comments.

```kotlin
@Test
fun `approveMurabahaContract saves contract with APPROVED status`() {
    // Arrange
    val contractId = "CONTRACT-001"
    val pendingContract = MurabahaContract.create(
        customerId = "CUST-001",
        costPrice = BigDecimal("10000.00"),
        profitMargin = BigDecimal("2000.00"),
        installmentCount = 12,
    )
    every { contractRepository.findById(contractId) } returns pendingContract
    every { contractRepository.save(any()) } answers { firstArg() }

    // Act
    val result = contractService.approve(contractId)

    // Assert
    assertTrue(result.isSuccess)
    val approvedContract = result.getOrThrow()
    assertEquals(ContractStatus.APPROVED, approvedContract.status)
    verify(exactly = 1) { contractRepository.save(match { it.status == ContractStatus.APPROVED }) }
}
```

## Coverage Requirements

**MUST** achieve >=95% line coverage for domain logic.

Coverage is measured with Kover and enforced in CI:

```kotlin
// build.gradle.kts - Coverage enforcement
kover {
    verify {
        rule {
            minBound(95) // Minimum 95% line coverage
        }
    }

    reports {
        filters {
            excludes {
                // Exclude generated code and configuration
                classes("*.*Generated*", "*.config.*", "*.Application")
            }
        }
    }
}
```

## Enforcement

- **Kover** - Enforces >=95% line coverage in CI/CD gate
- **MockK** - Coroutine-aware mocking (MockK violations caught by Detekt coroutine rules)
- **Code reviews** - Human verification of AAA structure and test quality

**Pre-commit checklist**:

- [ ] All tests pass (`./gradlew test`)
- [ ] Coverage >=95% (`./gradlew koverVerify`)
- [ ] MockK used (not Mockito) for mocking
- [ ] `coEvery`/`coVerify` used for suspend functions
- [ ] `runTest` used for coroutine tests
- [ ] AAA structure clear in all tests
- [ ] No test logic in production code

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions for test methods
- [Code Quality Standards](./code-quality-standards.md) - Kover configuration details
- [Concurrency Standards](./concurrency-standards.md) - Coroutine patterns under test
- [Build Configuration](./build-configuration.md) - Gradle test task configuration

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Testing Stack: JUnit 5, Kotest, MockK, kotlinx-coroutines-test, TestContainers
