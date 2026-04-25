---
title: "Kotlin Framework Integration Standards"
description: Authoritative OSE Platform Kotlin framework integration standards (Ktor 3.x, Spring Boot 3.x, coroutine integration)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - ktor
  - spring-boot
  - android
  - framework-integration
  - coroutines
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Framework Integration Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to integrate frameworks in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative framework integration standards** for Kotlin development in the OSE Platform. It covers Ktor 3.x server setup, Spring Boot 3.x with Kotlin idioms, Kotlin-specific Spring annotations, coroutine integration with Spring, and Android basics (ViewModel/LiveData/Compose).

**Target Audience**: OSE Platform Kotlin developers, technical architects, technical reviewers

**Scope**: Ktor plugin installation, routing DSL, Spring Boot Kotlin idioms, coroutine-Spring bridge, framework selection criteria

## Framework Selection

**Use Ktor 3.x when**:

- Building a new lightweight HTTP service or API gateway
- Service requires maximum async performance with coroutines
- Spring ecosystem features are not needed
- Team prefers minimal framework magic

**Use Spring Boot 3.x when**:

- Service requires Spring ecosystem (Spring Data, Spring Security, Spring Batch)
- Complex enterprise features (transactions, AOP, event-driven with Spring Events)
- Existing Spring infrastructure must be integrated
- Project needs Spring Boot Actuator for observability

**MUST NOT** mix both frameworks in the same service.

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Ktor Plugin Automation):

```kotlin
// Ktor plugins handle cross-cutting concerns automatically
fun Application.configure() {
    install(ContentNegotiation) { json() }   // Auto-serializes responses
    install(Authentication) { jwt("auth") { ... } }  // Auto-validates tokens
    install(StatusPages) { exception<Exception> { ... } }  // Auto-handles errors
    install(CallLogging) { level = Level.INFO }  // Auto-logs requests
    install(Compression) { gzip() }             // Auto-compresses responses
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Spring Configuration):

```kotlin
// Explicit Spring configuration - no XML, no magic scanning
@Configuration
class ZakatServiceConfig {
    @Bean
    fun zakatRepository(dataSource: DataSource): ZakatRepository =
        PostgresZakatRepository(dataSource)

    @Bean
    fun zakatService(repository: ZakatRepository): ZakatService =
        ZakatServiceImpl(repository)

    @Bean
    fun zakatController(service: ZakatService): ZakatController =
        ZakatController(service)
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Spring Beans via Constructor Injection):

```kotlin
// Constructor injection makes dependencies immutable (val, not lateinit var)
@Service
class ZakatService(
    private val repository: ZakatRepository,  // val - set once, immutable
    private val nisabProvider: NisabProvider,
    private val eventPublisher: ApplicationEventPublisher,
)
// No setter injection, no lateinit var for Spring beans
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Suspend Functions as Pure Service Layer):

```kotlin
// Service functions are suspend - explicit async, pure domain logic
@Service
class MurabahaService(private val repository: MurabahaAgreementRepository) {

    // Pure suspend function - result determined by inputs
    suspend fun calculateRepaymentSchedule(
        costPrice: Money,
        profitMargin: Money,
        installmentCount: Int,
    ): List<InstallmentPayment> {
        val totalAmount = costPrice + profitMargin
        val installmentAmount = totalAmount / installmentCount.toBigDecimal()
        return (1..installmentCount).map { month ->
            InstallmentPayment(
                month = month,
                amount = installmentAmount,
                dueDate = LocalDate.now().plusMonths(month.toLong()),
            )
        }
    }
}
```

### 5. Reproducibility First

**PASS Example** (Deterministic Spring Boot Application):

```kotlin
// Kotlin Spring Boot entry point - always the same
@SpringBootApplication
class MurabahaApplication

fun main(args: Array<String>) {
    runApplication<MurabahaApplication>(*args)
}
// No annotations needed on main() - Kotlin idiom vs Java @SpringBootApplication on class
```

## Ktor 3.x Integration

### Application Module Pattern

**MUST** structure Ktor applications with separate configuration functions per concern.

```kotlin
// Application.kt - Main entry point
fun main() {
    embeddedServer(
        factory = Netty,
        port = System.getenv("PORT")?.toInt() ?: 8080,
        host = "0.0.0.0",
        module = Application::module,
    ).start(wait = true)
}

// Or HOCON-driven (preferred for production)
fun Application.module() {
    // Order matters: security before routing
    val config = ZakatConfig.from(environment.config)
    val dependencies = DependencyGraph.build(config)

    configureContentNegotiation()
    configureSecurity(config.jwt)
    configureStatusPages()
    configureCallLogging()
    configureRouting(dependencies)
}
```

### Dependency Injection in Ktor

**MUST** use constructor parameters or a DI library (Koin, Hilt) for dependencies.

```kotlin
// Manual DI in Ktor (simple services)
object DependencyGraph {
    fun build(config: ZakatConfig): Dependencies {
        val dataSource = createDataSource(config.database)
        val repository = PostgresZakatRepository(dataSource)
        val nisabService = NisabService(config.nisab)
        val zakatService = ZakatServiceImpl(repository, nisabService)
        return Dependencies(zakatService)
    }
}

data class Dependencies(
    val zakatService: ZakatService,
)

// Inject via Application attribute
fun Application.configureRouting(deps: Dependencies) {
    routing {
        zakatRoutes(deps.zakatService)
    }
}

// Koin DI (for larger Ktor services)
val zakatModule = module {
    single<ZakatRepository> { PostgresZakatRepository(get()) }
    single<ZakatService> { ZakatServiceImpl(get(), get()) }
}

fun Application.configureDI() {
    install(KoinPlugin) {
        modules(zakatModule)
    }
}
```

### Ktor Testing

**MUST** use `testApplication` from `ktor-server-test-host` for route tests.

```kotlin
// Ktor route test with testApplication
class ZakatRoutesTest {

    @Test
    fun `GET zakat obligations returns 200 for existing payer`() = testApplication {
        application {
            configureContentNegotiation()
            configureRouting(testDependencies())
        }

        val response = client.get("/zakat/obligations/PAYER-001") {
            header(HttpHeaders.Authorization, "Bearer ${testJwtToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<ZakatObligationResponse>()
        assertEquals("PAYER-001", body.payerId)
    }

    private fun testDependencies(): Dependencies {
        val mockService = mockk<ZakatService>()
        coEvery { mockService.getObligation("PAYER-001") } returns
            Result.success(ZakatObligation.testFixture())
        return Dependencies(mockService)
    }
}
```

## Spring Boot 3.x with Kotlin

### Application Setup

**MUST** use `runApplication<T>()` Kotlin idiom (not `SpringApplication.run()`).

```kotlin
// CORRECT: Kotlin idiomatic Spring Boot entry point
@SpringBootApplication
class ZakatApplication

fun main(args: Array<String>) {
    runApplication<ZakatApplication>(*args)
}

// WRONG: Java-style entry point (works but not idiomatic)
@SpringBootApplication
class ZakatApplication {
    companion object {
        @JvmStatic
        fun main(args: Array<String>) {
            SpringApplication.run(ZakatApplication::class.java, *args)
        }
    }
}
```

### Spring Kotlin Plugin Requirements

**MUST** apply `kotlin("plugin.spring")` to open Spring-proxied classes.

```kotlin
// build.gradle.kts - Required for Spring AOP to work with Kotlin classes
plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"   // Opens @Component, @Service, etc.
    kotlin("plugin.jpa") version "2.1.0"      // Adds no-arg constructors to JPA entities
    id("org.springframework.boot") version "3.4.1"
}

// Without plugin.spring: Spring cannot create proxies for @Transactional, @Cacheable, etc.
// because Kotlin classes are final by default
```

### Constructor Injection Pattern

**MUST** use constructor injection with `val` for all Spring beans.

```kotlin
// CORRECT: Constructor injection, immutable dependencies
@Service
class ZakatCalculationService(
    private val repository: ZakatRepository,    // val - set once
    private val nisabProvider: NisabProvider,   // val - set once
    private val eventPublisher: ApplicationEventPublisher,
) {
    // No @Autowired, no lateinit var, no field injection
    suspend fun calculateObligation(payerId: String): Result<ZakatObligation> =
        runCatching {
            val payer = repository.findById(payerId)
                ?: throw ZakatPayerNotFoundException(payerId)
            val nisab = nisabProvider.getCurrentNisab()
            payer.computeObligation(nisab)
        }
}

// WRONG: Field injection (Detekt will flag @Autowired on fields)
@Service
class BadService {
    @Autowired
    private lateinit var repository: ZakatRepository  // Field injection - hard to test
}
```

### Spring Data with Kotlin

**MUST** use Kotlin-friendly Spring Data repository extensions.

```kotlin
// JPA Entity with JPA plugin (adds no-arg constructor)
@Entity
@Table(name = "zakat_payers")
class ZakatPayerEntity(
    @Id
    val id: String,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "total_wealth", precision = 15, scale = 2)
    val totalWealth: BigDecimal,

    @Enumerated(EnumType.STRING)
    val status: PayerStatus = PayerStatus.ACTIVE,
)

// Spring Data Repository - Kotlin-idiomatic
@Repository
interface ZakatPayerRepository : JpaRepository<ZakatPayerEntity, String> {
    // Kotlin nullable return type (Spring Data handles the Optional conversion)
    fun findByIdAndStatus(id: String, status: PayerStatus): ZakatPayerEntity?

    // Derived query with list return
    fun findAllByStatus(status: PayerStatus): List<ZakatPayerEntity>

    // @Query with Kotlin parameters
    @Query("SELECT p FROM ZakatPayerEntity p WHERE p.totalWealth >= :nisabAmount AND p.status = 'ACTIVE'")
    fun findActivePayersAboveNisab(@Param("nisabAmount") nisabAmount: BigDecimal): List<ZakatPayerEntity>
}
```

### Coroutine Integration with Spring

**SHOULD** use suspend functions in Spring services for async operations.

```kotlin
// Suspend functions in Spring services (Spring 5.2+ supports coroutines)
@Service
class ZakatNotificationService(
    private val emailClient: EmailClient,
    private val smsClient: SmsClient,
) {
    // Suspend function in Spring service
    suspend fun notifyZakatDue(payerId: String, amount: Money): Unit =
        coroutineScope {
            val emailJob = async { emailClient.sendZakatNotification(payerId, amount) }
            val smsJob = async { smsClient.sendZakatReminder(payerId, amount) }
            awaitAll(emailJob, smsJob)
        }
}

// Spring WebFlux with Kotlin coroutines (reactive endpoint)
@RestController
class ZakatController(private val service: ZakatCalculationService) {

    // suspend function automatically integrated with Reactor Mono
    @GetMapping("/zakat/obligations/{payerId}")
    suspend fun getObligation(@PathVariable payerId: String): ResponseEntity<ZakatObligationResponse> {
        return service.calculateObligation(payerId).fold(
            onSuccess = { ResponseEntity.ok(it.toResponse()) },
            onFailure = { ResponseEntity.notFound().build() },
        )
    }
}
```

### Spring Events with Kotlin

**SHOULD** use Kotlin-idiomatic Spring Application Events for domain event publishing.

```kotlin
// Publish domain event via Spring ApplicationEventPublisher
@Service
class ZakatApplicationService(
    private val repository: ZakatApplicationRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {
    fun approve(applicationId: String, reviewerId: String) {
        val application = repository.findById(applicationId)
            ?: throw ZakatApplicationNotFoundException(applicationId)
        val approved = application.approve(UserId(reviewerId))
        repository.save(approved)
        approved.pullEvents().forEach { event -> eventPublisher.publishEvent(event) }
    }
}

// Event listener - Kotlin idiomatic with @EventListener
@Service
class ZakatNotificationListener {
    @EventListener
    fun onZakatApplicationApproved(event: ZakatApplicationApproved) {
        // Send notification when application is approved
        sendNotification(event.applicationId, event.reviewerId)
    }

    @Async
    @EventListener
    fun onZakatPaymentReceived(event: ZakatPaymentReceived) {
        // Async processing of payment receipt
        generateReceipt(event.transactionId)
    }
}
```

## Enforcement

- **Kotlin Spring plugin** - Required in all Spring Boot Kotlin projects (build check)
- **Detekt** - Flags field injection with `@Autowired` as anti-pattern
- **Code reviews** - Verify constructor injection, `val` dependencies, Kotlin idioms
- **`testApplication`** - Ktor route integration tests required for all routes

**Pre-commit checklist**:

- [ ] `kotlin("plugin.spring")` applied in Spring Boot projects
- [ ] Constructor injection used exclusively (no `@Autowired` field injection)
- [ ] `runApplication<T>()` used in Spring Boot main function
- [ ] Ktor plugins installed before routing in correct order
- [ ] Coroutines integrated correctly with Spring (suspend functions in services)

## Related Standards

- [API Standards](./api-standards.md) - Ktor routing patterns and REST conventions
- [Security Standards](./security-standards.md) - Spring Security and Ktor authentication
- [Build Configuration](./build-configuration.md) - Kotlin plugin configuration in Gradle
- [Concurrency Standards](./concurrency-standards.md) - Coroutine-Spring bridge patterns

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Frameworks: Ktor 3.1.0, Spring Boot 3.4.1
