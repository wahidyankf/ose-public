---
title: "Spring Boot WebFlux and Reactive Programming"
description: Reactive programming with Spring WebFlux covering when to use WebFlux vs Spring Web MVC, reactive patterns with Mono and Flux, backpressure handling, non-blocking I/O for high-concurrency scenarios, testing reactive applications, performance trade-offs, and R2DBC for reactive database access
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - webflux
  - reactive-programming
  - project-reactor
  - mono
  - flux
  - backpressure
  - r2dbc
  - non-blocking-io
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
  - performance
created: 2026-02-06
updated: 2026-02-06
related:
  - ./ex-soen-plwe-to-jvspbo__rest-apis.md
  - ./ex-soen-plwe-to-jvspbo__performance.md
  - ./ex-soen-plwe-to-jvspbo__testing.md
  - ./ex-soen-plwe-to-jvspbo__data-access.md
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand blocking I/O and thread-per-request models before learning reactive programming. Review [Spring Boot REST APIs](ex-soen-plwe-to-jvspbo__rest-apis.md) for blocking model baseline.

**STRONGLY RECOMMENDED**: Complete AyoKoding Spring Boot Learning Path and Reactive Programming module for practical reactive experience.

**This document is OSE Platform-specific**, not a Spring Boot WebFlux tutorial. We define WHEN and HOW to use WebFlux in THIS platform, not WHAT WebFlux is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **reactive programming standards** for Spring Boot applications in the OSE Platform. Spring WebFlux provides non-blocking, reactive programming model for high-concurrency scenarios where thread efficiency is critical.

**Target Audience**: Spring Boot developers building high-concurrency services

**Scope**: WebFlux vs MVC decision criteria, reactive patterns (Mono/Flux), backpressure, non-blocking I/O, testing, performance trade-offs, R2DBC reactive database access

## Quick Reference

- [When to Use Spring WebFlux vs Spring Web MVC](#when-to-use-spring-webflux-vs-spring-web-mvc)
- [Reactive Programming Patterns](#reactive-programming-patterns-mono-flux-project-reactor)
- [Backpressure Handling](#backpressure-handling)
- [Non-Blocking I/O for High-Concurrency](#non-blocking-io-for-high-concurrency-scenarios)
- [Testing Reactive Applications](#testing-reactive-applications)
- [Performance Trade-offs](#performance-trade-offs-thread-efficiency-vs-complexity)
- [Reactive Database Access (R2DBC)](#reactive-database-access-r2dbc)

### Decision Matrix

| Factor                    | Spring Web MVC (Blocking)  | Spring WebFlux (Reactive)      |
| ------------------------- | -------------------------- | ------------------------------ |
| **Request Volume**        | Low-Medium (<1000 req/s)   | High (>1000 req/s)             |
| **I/O Operations**        | Few blocking calls         | Many concurrent I/O operations |
| **Thread Efficiency**     | Thread-per-request         | Event loop (few threads)       |
| **Database Access**       | JDBC (blocking)            | R2DBC (non-blocking)           |
| **External API Calls**    | RestTemplate (blocking)    | WebClient (non-blocking)       |
| **Backpressure Required** | No                         | Yes (streaming large datasets) |
| **Team Experience**       | Familiar with blocking I/O | Comfortable with reactive      |
| **Complexity**            | Simple, straightforward    | Complex, steep learning curve  |
| **Debugging**             | Easy stack traces          | Challenging async stack traces |
| **OSE Platform Default**  | ✅ Default                 | ⚠️ Use when justified          |

### Use Spring Web MVC When

**✅ Correct - Blocking I/O Scenarios**:

- CRUD operations with traditional relational databases (JPA/Hibernate)
- Synchronous business logic (Zakat calculation, Murabaha validation)
- Team unfamiliar with reactive programming
- Application doesn't have high-concurrency requirements
- Existing codebase uses blocking libraries

**Example - Zakat Calculation Service** (MVC appropriate):

```kotlin
@RestController
@RequestMapping("/api/v1/zakat")
class ZakatController(
    private val service: ZakatCalculationService
) {

    @PostMapping("/calculate")
    fun calculate(@RequestBody request: CreateZakatRequest): ZakatCalculationResponse {
        // Synchronous calculation - no I/O, pure computation
        return service.calculate(request, getCurrentUserId())
    }
}
```

### Use Spring WebFlux When

**✅ Correct - Non-Blocking I/O Scenarios**:

- High-concurrency API gateway (>1000 concurrent connections)
- Real-time data streaming (Zakat reminders, Waqf donation events)
- Multiple parallel external API calls (credit check, KYC verification, payment gateway)
- WebSocket connections for live updates
- Server-Sent Events (SSE) for notifications

**Example - Real-Time Donation Stream** (WebFlux appropriate):

```kotlin
@RestController
@RequestMapping("/api/v1/waqf")
class WaqfStreamController(
    private val donationService: ReactiveDonationService
) {

    @GetMapping("/donations/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun streamDonations(): Flux<DonationEvent> {
        // Non-blocking stream of donation events
        return donationService.streamDonations()
    }
}
```

### OSE Platform Guidelines

**Default**: Use **Spring Web MVC** unless specific reactive requirements justify WebFlux.

**Justification Required** for WebFlux:

1. Documented performance bottleneck with blocking I/O (load testing results)
2. Technical design review approval
3. Team training plan for reactive programming
4. Monitoring strategy for reactive metrics

### Mono (0 or 1 Element)

**✅ Correct - Single Value Reactive Stream**:

```kotlin
@Service
class ReactiveZakatCalculationService(
    private val repository: ReactiveZakatCalculationRepository,
    private val nisabService: ReactiveNisabThresholdService
) {

    fun calculate(request: CreateZakatRequest, userId: String): Mono<ZakatCalculationResponse> {
        return nisabService.getCurrentNisab(request.currency)
            .flatMap { nisab ->
                val calculation = ZakatCalculation.calculate(
                    wealth = Money(request.wealth, request.currency),
                    nisab = nisab,
                    userId = userId,
                    date = LocalDate.now()
                )

                repository.save(calculation)
            }
            .map { ZakatCalculationMapper.toResponse(it) }
            .doOnSuccess { logger.info("Zakat calculated for user: {}", userId) }
            .doOnError { logger.error("Failed to calculate Zakat", it) }
    }
}
```

**Key Mono Operators**:

- `flatMap()` - Transform and flatten nested Mono
- `map()` - Transform value
- `filter()` - Conditional emission
- `switchIfEmpty()` - Fallback value
- `defaultIfEmpty()` - Default value if empty
- `doOnSuccess()` - Side effect on success
- `doOnError()` - Side effect on error

### Flux (0 to N Elements)

**✅ Correct - Multiple Values Reactive Stream**:

```kotlin
@Service
class ReactiveDonationService(
    private val repository: ReactiveDonationRepository
) {

    fun streamDonations(): Flux<DonationEvent> {
        return repository.findAll()
            .map { DonationMapper.toEvent(it) }
            .delayElements(Duration.ofMillis(100))  // Throttle stream
    }

    fun findDonationsByProject(projectId: String): Flux<Donation> {
        return repository.findByProjectId(projectId)
            .filter { it.amount.value > BigDecimal("100") }  // Filter large donations
            .sort { a, b -> b.createdAt.compareTo(a.createdAt) }  // Sort descending
            .take(100)  // Limit to 100 results
    }

    fun aggregateDonations(projectId: String): Mono<DonationSummary> {
        return repository.findByProjectId(projectId)
            .reduce(DonationSummary.empty()) { summary, donation ->
                summary.add(donation)
            }
    }
}
```

**Key Flux Operators**:

- `flatMap()` - Transform and flatten nested Flux
- `map()` - Transform elements
- `filter()` - Conditional emission
- `take(n)` - Limit elements
- `skip(n)` - Skip elements
- `delayElements()` - Throttle emission
- `buffer()` - Group elements
- `reduce()` - Aggregate elements
- `collectList()` - Collect to List (Mono<List<T>>)

### Combining Multiple Streams

**✅ Correct - Parallel External API Calls**:

```kotlin
@Service
class ReactiveMurabahaApplicationService(
    private val creditCheckClient: ReactiveCreditCheckClient,
    private val kycVerificationClient: ReactiveKycClient,
    private val riskAssessmentClient: ReactiveRiskAssessmentClient
) {

    fun processApplication(request: CreateMurabahaApplicationRequest): Mono<ApplicationResponse> {
        val applicantId = request.applicantId

        // Execute 3 external calls in parallel (non-blocking)
        val creditCheckMono = creditCheckClient.checkCredit(applicantId)
        val kycVerificationMono = kycVerificationClient.verifyIdentity(applicantId)
        val riskAssessmentMono = riskAssessmentClient.assessRisk(request)

        // Wait for all 3 to complete
        return Mono.zip(creditCheckMono, kycVerificationMono, riskAssessmentMono)
            .flatMap { tuple ->
                val (creditScore, kycResult, riskAssessment) = tuple

                if (creditScore.score < 650) {
                    Mono.error(ApplicationRejectedException("Credit score too low"))
                } else if (!kycResult.isVerified) {
                    Mono.error(ApplicationRejectedException("KYC verification failed"))
                } else if (riskAssessment.level == RiskLevel.HIGH) {
                    Mono.error(ApplicationRejectedException("Risk level too high"))
                } else {
                    createApplication(request, creditScore, kycResult, riskAssessment)
                }
            }
    }

    private fun createApplication(
        request: CreateMurabahaApplicationRequest,
        creditScore: CreditScore,
        kycResult: KycResult,
        riskAssessment: RiskAssessment
    ): Mono<ApplicationResponse> {
        // Create and save application
        val application = MurabahaApplication.create(request, creditScore, riskAssessment)
        return repository.save(application)
            .map { MurabahaApplicationMapper.toResponse(it) }
    }
}
```

**Combining Operators**:

- `Mono.zip()` - Combine multiple Monos (parallel execution)
- `Flux.zip()` - Combine multiple Fluxes element-wise
- `Mono.zipWith()` - Combine two Monos
- `Flux.merge()` - Merge multiple Fluxes (interleaved)
- `Flux.concat()` - Concatenate Fluxes (sequential)

### Error Handling

**✅ Correct - Reactive Error Handling**:

```kotlin
@Service
class ReactivePaymentService(
    private val paymentGateway: ReactivePaymentGateway,
    private val donationRepository: ReactiveDonationRepository
) {

    fun processPayment(donation: Donation): Mono<PaymentResult> {
        return paymentGateway.charge(donation.amount, donation.paymentMethod)
            .timeout(Duration.ofSeconds(30))  // Timeout after 30s
            .retry(3)  // Retry 3 times on failure
            .onErrorResume { error ->
                // Fallback on error
                logger.error("Payment failed", error)
                Mono.just(PaymentResult.failed(error.message))
            }
            .doOnSuccess { result ->
                if (result.isSuccess) {
                    donationRepository.updatePaymentStatus(donation.id, PaymentStatus.COMPLETED)
                        .subscribe()  // Fire-and-forget
                }
            }
    }
}
```

**Error Operators**:

- `timeout()` - Emit error if no value within duration
- `retry()` - Retry on error
- `retryWhen()` - Conditional retry with backoff
- `onErrorResume()` - Fallback Mono on error
- `onErrorReturn()` - Fallback value on error
- `onErrorMap()` - Transform error

## Backpressure Handling

Backpressure occurs when producer emits faster than consumer can process. Project Reactor automatically handles backpressure.

**✅ Correct - Backpressure with Buffering**:

```kotlin
@RestController
@RequestMapping("/api/v1/waqf")
class WaqfReportController(
    private val donationService: ReactiveDonationService
) {

    @GetMapping("/donations/export", produces = [MediaType.APPLICATION_NDJSON_VALUE])
    fun exportDonations(
        @RequestParam projectId: String
    ): Flux<DonationRecord> {
        return donationService.findByProjectId(projectId)
            .buffer(100)  // Buffer 100 elements
            .flatMap { batch ->
                Flux.fromIterable(batch)
                    .delayElements(Duration.ofMillis(10))  // Throttle emission
            }
            .onBackpressureBuffer(1000)  // Buffer up to 1000 elements
    }
}
```

**Backpressure Strategies**:

- `onBackpressureBuffer()` - Buffer elements (with max size)
- `onBackpressureDrop()` - Drop elements when consumer can't keep up
- `onBackpressureLatest()` - Keep only latest element
- `onBackpressureError()` - Emit error when backpressure occurs

**❌ Prohibited - Ignoring Backpressure**:

```kotlin
// ❌ BAD - No backpressure handling (memory leak risk)
@GetMapping("/donations/stream")
fun streamDonations(): Flux<Donation> {
    return donationRepository.findAll()
        // Fast producer, slow consumer = OutOfMemoryError
}

// ✅ GOOD - Explicit backpressure handling
@GetMapping("/donations/stream")
fun streamDonations(): Flux<Donation> {
    return donationRepository.findAll()
        .onBackpressureBuffer(1000, BufferOverflowStrategy.DROP_OLDEST)
        .delayElements(Duration.ofMillis(100))  // Throttle
}
```

### Thread Model Comparison

**Spring Web MVC (Blocking)**:

```
Request 1 → Thread 1 (blocked on I/O) → Response 1
Request 2 → Thread 2 (blocked on I/O) → Response 2
...
Request 200 → Thread 200 (blocked on I/O) → Response 200

Thread pool: 200 threads (high memory overhead)
```

**Spring WebFlux (Non-Blocking)**:

```
Request 1 → Event Loop (schedules I/O) → Callback → Response 1
Request 2 → Event Loop (schedules I/O) → Callback → Response 2
...
Request 10000 → Event Loop (schedules I/O) → Callback → Response 10000

Event loop: 8 threads (CPU cores * 2)
```

### Reactive REST Controller

**✅ Correct - Non-Blocking REST API**:

```kotlin
@RestController
@RequestMapping("/api/v1/murabaha")
class ReactiveMurabahaController(
    private val applicationService: ReactiveMurabahaApplicationService
) {

    @PostMapping("/applications")
    fun createApplication(
        @RequestBody request: CreateMurabahaApplicationRequest
    ): Mono<ApplicationResponse> {
        return applicationService.processApplication(request)
            .doOnSuccess { logger.info("Application created: {}", it.id) }
    }

    @GetMapping("/applications/{id}")
    fun getApplication(@PathVariable id: String): Mono<ApplicationResponse> {
        return applicationService.findById(id)
            .switchIfEmpty(Mono.error(ResourceNotFoundException("Application not found")))
    }

    @GetMapping("/applications")
    fun listApplications(
        @RequestParam(required = false) status: ApplicationStatus?
    ): Flux<ApplicationResponse> {
        return if (status != null) {
            applicationService.findByStatus(status)
        } else {
            applicationService.findAll()
        }
    }
}
```

### Reactive WebClient (Non-Blocking HTTP Client)

**✅ Correct - WebClient for External APIs**:

```kotlin
@Component
class ReactiveCreditCheckClient(
    private val webClient: WebClient
) {

    fun checkCredit(applicantId: String): Mono<CreditScore> {
        return webClient.get()
            .uri("/api/credit-check/{applicantId}", applicantId)
            .retrieve()
            .bodyToMono<CreditScore>()
            .timeout(Duration.ofSeconds(10))
            .retry(3)
            .doOnError { logger.error("Credit check failed for applicant: {}", applicantId, it) }
    }
}

@Configuration
class WebClientConfig {

    @Bean
    fun webClient(): WebClient {
        return WebClient.builder()
            .baseUrl("https://credit-api.example.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build()
    }
}
```

**❌ Prohibited - Blocking RestTemplate in WebFlux**:

```kotlin
// ❌ BAD - RestTemplate blocks event loop thread
@Component
class BadCreditCheckClient(
    private val restTemplate: RestTemplate  // ❌ Blocking!
) {

    fun checkCredit(applicantId: String): Mono<CreditScore> {
        return Mono.fromCallable {
            // ❌ Blocks event loop thread (defeats WebFlux purpose)
            restTemplate.getForObject(
                "https://credit-api.example.com/api/credit-check/{applicantId}",
                CreditScore::class.java,
                applicantId
            )
        }
    }
}
```

### Unit Testing with StepVerifier

**✅ Correct - Test Mono with StepVerifier**:

```kotlin
class ReactiveZakatCalculationServiceTest {

    private lateinit var service: ReactiveZakatCalculationService
    private lateinit var repository: ReactiveZakatCalculationRepository
    private lateinit var nisabService: ReactiveNisabThresholdService

    @BeforeEach
    fun setup() {
        repository = mockk()
        nisabService = mockk()
        service = ReactiveZakatCalculationService(repository, nisabService)
    }

    @Test
    fun `calculate should return ZakatCalculationResponse when wealth above nisab`() {
        // Given
        val currency = Currency.getInstance("USD")
        val wealth = Money(BigDecimal("10000"), currency)
        val nisab = Money(BigDecimal("5000"), currency)

        every { nisabService.getCurrentNisab(currency) } returns Mono.just(nisab)
        every { repository.save(any()) } answers { Mono.just(firstArg()) }

        val request = CreateZakatRequest(wealth.value, currency.currencyCode)

        // When
        val result = service.calculate(request, "user-123")

        // Then
        StepVerifier.create(result)
            .assertNext { response ->
                assertThat(response.zakatAmount.value).isEqualByComparingTo(BigDecimal("250"))  // 2.5%
            }
            .verifyComplete()
    }

    @Test
    fun `calculate should return error when nisab service fails`() {
        // Given
        val currency = Currency.getInstance("USD")
        every { nisabService.getCurrentNisab(currency) } returns
            Mono.error(NisabServiceException("Service unavailable"))

        val request = CreateZakatRequest(BigDecimal("10000"), currency.currencyCode)

        // When
        val result = service.calculate(request, "user-123")

        // Then
        StepVerifier.create(result)
            .expectError(NisabServiceException::class.java)
            .verify()
    }
}
```

### Testing Flux Streams

**✅ Correct - Test Flux with StepVerifier**:

```kotlin
class ReactiveDonationServiceTest {

    @Test
    fun `streamDonations should emit donation events`() {
        // Given
        val donations = listOf(
            Donation(id = "1", amount = Money(BigDecimal("100"), Currency.getInstance("USD"))),
            Donation(id = "2", amount = Money(BigDecimal("200"), Currency.getInstance("USD"))),
            Donation(id = "3", amount = Money(BigDecimal("300"), Currency.getInstance("USD")))
        )

        every { repository.findAll() } returns Flux.fromIterable(donations)

        // When
        val result = service.streamDonations()

        // Then
        StepVerifier.create(result)
            .expectNextCount(3)
            .verifyComplete()
    }

    @Test
    fun `findDonationsByProject should filter by amount`() {
        // Given
        val projectId = "project-123"
        val donations = listOf(
            Donation(projectId = projectId, amount = Money(BigDecimal("50"), Currency.getInstance("USD"))),
            Donation(projectId = projectId, amount = Money(BigDecimal("150"), Currency.getInstance("USD"))),
            Donation(projectId = projectId, amount = Money(BigDecimal("250"), Currency.getInstance("USD")))
        )

        every { repository.findByProjectId(projectId) } returns Flux.fromIterable(donations)

        // When
        val result = service.findDonationsByProject(projectId)

        // Then
        StepVerifier.create(result)
            .expectNextMatches { it.amount.value > BigDecimal("100") }  // 150
            .expectNextMatches { it.amount.value > BigDecimal("100") }  // 250
            .verifyComplete()
    }
}
```

### Integration Testing with @WebFluxTest

**✅ Correct - Test Reactive Controller**:

```kotlin
@WebFluxTest(ReactiveMurabahaController::class)
class ReactiveMurabahaControllerTest {

    @Autowired
    private lateinit var webTestClient: WebTestClient

    @MockkBean
    private lateinit var applicationService: ReactiveMurabahaApplicationService

    @Test
    fun `createApplication should return 201 with application response`() {
        // Given
        val request = CreateMurabahaApplicationRequest(
            applicantId = "applicant-123",
            amount = BigDecimal("50000"),
            currency = "USD",
            installmentMonths = 24
        )

        val response = ApplicationResponse(
            id = "app-123",
            applicantId = request.applicantId,
            status = ApplicationStatus.PENDING
        )

        every { applicationService.processApplication(request) } returns Mono.just(response)

        // When / Then
        webTestClient.post()
            .uri("/api/v1/murabaha/applications")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(request)
            .exchange()
            .expectStatus().isCreated
            .expectBody<ApplicationResponse>()
            .consumeWith { result ->
                assertThat(result.responseBody?.id).isEqualTo("app-123")
                assertThat(result.responseBody?.status).isEqualTo(ApplicationStatus.PENDING)
            }
    }

    @Test
    fun `getApplication should return 404 when not found`() {
        // Given
        val applicationId = "non-existent"
        every { applicationService.findById(applicationId) } returns Mono.empty()

        // When / Then
        webTestClient.get()
            .uri("/api/v1/murabaha/applications/{id}", applicationId)
            .exchange()
            .expectStatus().isNotFound
    }
}
```

### Benchmarks (OSE Platform)

**Scenario**: 5000 concurrent requests, each making 3 external API calls (credit check, KYC, risk assessment)

| Metric                   | Spring Web MVC (Blocking) | Spring WebFlux (Reactive) |
| ------------------------ | ------------------------- | ------------------------- |
| **Threads**              | 200 (max pool size)       | 8 (CPU cores \* 2)        |
| **Memory**               | 850 MB                    | 320 MB                    |
| **Average Response**     | 1200 ms                   | 450 ms                    |
| **95th Percentile**      | 2500 ms                   | 850 ms                    |
| **Throughput**           | 400 req/s                 | 1800 req/s                |
| **Thread Contention**    | High (200 threads)        | Low (8 threads)           |
| **Complexity**           | Low (simple code)         | High (reactive chains)    |
| **Debugging Difficulty** | Easy                      | Challenging               |

### When WebFlux Wins

**✅ WebFlux Appropriate** (high I/O, high concurrency):

```kotlin
@Service
class ReactiveMurabahaApplicationService(
    private val creditCheckClient: ReactiveCreditCheckClient,
    private val kycClient: ReactiveKycClient,
    private val riskAssessmentClient: ReactiveRiskAssessmentClient,
    private val paymentGateway: ReactivePaymentGateway,
    private val notificationService: ReactiveNotificationService
) {

    // 5 external API calls in parallel (non-blocking)
    fun processApplication(request: CreateMurabahaApplicationRequest): Mono<ApplicationResponse> {
        return Mono.zip(
            creditCheckClient.checkCredit(request.applicantId),
            kycClient.verifyIdentity(request.applicantId),
            riskAssessmentClient.assessRisk(request),
            paymentGateway.reserveFunds(request.amount),
            notificationService.sendConfirmation(request.applicantId)
        ).flatMap { (credit, kyc, risk, payment, notification) ->
            // Process results
            createApplication(request, credit, kyc, risk)
        }
    }
}
```

**Blocking Equivalent** (requires 200 threads to handle 5000 concurrent requests):

```kotlin
// Each request blocks thread for ~1.5s waiting for 5 sequential API calls
```

### When MVC Wins

**✅ MVC Appropriate** (low I/O, CPU-bound computation):

```kotlin
@Service
class ZakatCalculationService(
    private val repository: ZakatCalculationRepository
) {

    // Pure computation (no I/O) - blocking is fine
    fun calculate(request: CreateZakatRequest, userId: String): ZakatCalculationResponse {
        val nisab = Money(BigDecimal("5000"), Currency.getInstance(request.currency))

        val calculation = ZakatCalculation.calculate(
            wealth = Money(request.wealth, Currency.getInstance(request.currency)),
            nisab = nisab,
            userId = userId,
            date = LocalDate.now()
        )

        return ZakatCalculationMapper.toResponse(repository.save(calculation))
    }
}
```

**Reactive Equivalent** (unnecessary complexity, no benefit):

```kotlin
// ❌ BAD - Reactive adds complexity with no benefit
fun calculate(request: CreateZakatRequest, userId: String): Mono<ZakatCalculationResponse> {
    return Mono.fromCallable {
        // Still blocks thread for computation
        ZakatCalculation.calculate(...)
    }.flatMap { calculation ->
        repository.save(calculation)
    }.map { ZakatCalculationMapper.toResponse(it) }
}
```

### R2DBC Configuration

**✅ Correct - R2DBC PostgreSQL**:

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql")
}

// application.yml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/ose_platform
    username: zakat_user
    password: ${DATABASE_PASSWORD}
    pool:
      initial-size: 10
      max-size: 20
```

### Reactive Repository

**✅ Correct - R2DBC Repository**:

```kotlin
interface ReactiveZakatCalculationRepository : ReactiveCrudRepository<ZakatCalculation, String> {

    fun findByUserId(userId: String): Flux<ZakatCalculation>

    fun findByUserIdAndCalculationDateAfter(userId: String, date: LocalDate): Flux<ZakatCalculation>

    @Query("SELECT * FROM zakat_calculations WHERE user_id = :userId ORDER BY calculation_date DESC LIMIT 1")
    fun findLatestByUserId(userId: String): Mono<ZakatCalculation>
}
```

### Reactive Entity

**✅ Correct - R2DBC Entity**:

```kotlin
@Table("zakat_calculations")
data class ZakatCalculation(
    @Id val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val wealthAmount: BigDecimal,
    val wealthCurrency: String,
    val nisabAmount: BigDecimal,
    val nisabCurrency: String,
    val zakatAmount: BigDecimal,
    val zakatCurrency: String,
    val calculationDate: LocalDate,
    val createdAt: Instant = Instant.now()
) {

    companion object {
        fun calculate(wealth: Money, nisab: Money, userId: String, date: LocalDate): ZakatCalculation {
            val zakatAmount = if (wealth >= nisab) {
                wealth * BigDecimal("0.025")  // 2.5%
            } else {
                Money(BigDecimal.ZERO, wealth.currency)
            }

            return ZakatCalculation(
                userId = userId,
                wealthAmount = wealth.value,
                wealthCurrency = wealth.currency.currencyCode,
                nisabAmount = nisab.value,
                nisabCurrency = nisab.currency.currencyCode,
                zakatAmount = zakatAmount.value,
                zakatCurrency = zakatAmount.currency.currencyCode,
                calculationDate = date
            )
        }
    }
}
```

**❌ Prohibited - JPA with WebFlux**:

```kotlin
// ❌ BAD - JPA blocks threads (defeats WebFlux purpose)
interface ZakatCalculationRepository : JpaRepository<ZakatCalculation, String> {
    // ❌ Blocking JDBC calls
}
```

**Rule**: If using WebFlux, MUST use R2DBC (not JPA/JDBC). Mixing blocking and non-blocking defeats reactive benefits.

## Software Engineering Principles

These reactive programming standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Reactive types (Mono/Flux) make asynchronicity explicit in method signatures
   - Backpressure strategies explicitly configured (`onBackpressureBuffer()`)
   - Error handling explicit with `onErrorResume()` and `onErrorReturn()`

2. **[Simplicity Over Complexity](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Use blocking MVC by default (simpler)
   - Reactive WebFlux only when justified (high-concurrency, many I/O operations)
   - Avoid reactive for CPU-bound or simple CRUD operations

3. **[Pure Functions Over Side Effects](../../../../../../governance/principles/software-engineering/pure-functions.md)**
   - Non-blocking I/O maximizes thread efficiency (8 threads handle 10,000 concurrent requests)
   - Backpressure prevents memory exhaustion
   - Parallel API calls reduce latency

## Related Documentation

**Prerequisites**:

- **[Spring Boot REST APIs](ex-soen-plwe-to-jvspbo__rest-apis.md)** - Blocking REST API baseline

**Spring Boot Documentation**:

- **[Performance](ex-soen-plwe-to-jvspbo__performance.md)** - Performance tuning and benchmarks
- **[Testing](ex-soen-plwe-to-jvspbo__testing.md)** - Testing strategies including reactive
- **[Data Access](ex-soen-plwe-to-jvspbo__data-access.md)** - R2DBC and JPA comparison

**External Resources**:

- [Spring WebFlux Reference](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [Project Reactor Documentation](https://projectreactor.io/docs/core/release/reference/)
- [R2DBC Specification](https://r2dbc.io/spec/1.0.0.RELEASE/spec/html/)

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Concurrency](../jvm-spring/ex-soen-plwe-to-jvsp__concurrency-standards.md) - Async patterns
- [Java Concurrency](../../../programming-languages/java/ex-soen-prla-ja__concurrency-standards.md) - Java threading baseline
- [Spring Boot Idioms](./ex-soen-plwe-to-jvspbo__idioms.md) - Reactive patterns
- [Spring Boot Performance](./ex-soen-plwe-to-jvspbo__performance.md) - Reactive performance

---

**Status**: Optional (use when justified) for OSE Platform Spring Boot applications
**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-06
