---
title: Spring Framework Concurrency Standards for OSE Platform
description: Prescriptive concurrency requirements for Spring-based Shariah-compliant financial systems
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - ose-platform
  - concurrency
  - async
  - virtual-threads
  - thread-safety
  - standards
principles:
  - immutability
  - explicit-over-implicit
created: 2026-02-06
updated: 2026-02-06
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from AyoKoding Spring Learning Path before using these standards.

**This document is OSE Platform-specific**, not a Spring tutorial. We define HOW to apply Spring in THIS codebase, not WHAT Spring is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Spring Framework Concurrency Standards for OSE Platform

**OSE-specific prescriptive standards** for concurrency in Spring-based Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Spring Framework fundamentals from AyoKoding Spring Framework and Java concurrency from Java Concurrency Standards.

## Purpose

Concurrency in Spring-based OSE Platform services extends Java concurrency standards with Spring-specific mechanisms:

- **Virtual Threads with Spring**: Java 21+ virtual thread integration with Spring Boot 3.2+
- **@Async Configuration**: Asynchronous method execution with ExecutorService configuration
- **Thread Pool Sizing**: Separate pools for reactive and blocking operations
- **Thread Safety in Singleton Beans**: Ensuring Spring singleton beans are thread-safe
- **Structured Concurrency Patterns**: Hierarchical task management for financial operations

### Spring Boot 3.2+ Virtual Thread Configuration

**REQUIRED**: Enable virtual threads for all I/O-bound operations in Spring Boot 3.2+.

```java
@Configuration
public class VirtualThreadConfiguration {

  // REQUIRED: Enable virtual threads for web requests
  @Bean
  public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
    return protocolHandler -> {
      protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    };
  }
}
```

**application.properties**:

```properties
# REQUIRED: Enable virtual threads (Spring Boot 3.2+)
spring.threads.virtual.enabled=true
```

**REQUIRED**: Virtual thread configuration MUST:

- Enable virtual threads globally for web requests
- Use virtual threads for `@Async` I/O-bound operations
- Use platform threads for CPU-bound operations (separate executor)

### Virtual Thread @Async Configuration

**REQUIRED**: Configure separate executors for I/O-bound vs CPU-bound async operations.

```java
@Configuration
@EnableAsync
public class AsyncConfiguration implements AsyncConfigurer {

  // REQUIRED: Virtual thread executor for I/O-bound operations
  @Bean(name = "ioTaskExecutor")
  public Executor ioTaskExecutor() {
    ThreadFactory factory = Thread.ofVirtual()
      .name("io-task-", 0)
      .factory();

    return Executors.newThreadPerTaskExecutor(factory);
  }

  // REQUIRED: Platform thread executor for CPU-bound operations
  @Bean(name = "cpuTaskExecutor")
  public Executor cpuTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(Runtime.getRuntime().availableProcessors());
    executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors());
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("cpu-task-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
  }

  // REQUIRED: Default executor for @Async without explicit executor
  @Override
  public Executor getAsyncExecutor() {
    return ioTaskExecutor();  // Default to virtual threads
  }

  // REQUIRED: Global async exception handler
  @Override
  public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
    return new CustomAsyncExceptionHandler();
  }
}

public class CustomAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(CustomAsyncExceptionHandler.class);

  @Override
  public void handleUncaughtException(Throwable ex, Method method, Object... params) {
    logger.error(
      "Uncaught async exception in method: {}, params: {}",
      method.getName(),
      Arrays.toString(params),
      ex
    );
    // REQUIRED: Log to audit trail for financial operations
  }
}
```

### I/O-Bound Async Operations

**REQUIRED**: Use `@Async` with virtual thread executor for I/O-bound operations.

```java
@Service
public class DonationNotificationService {

  private static final Logger logger = LoggerFactory.getLogger(DonationNotificationService.class);

  private final EmailService emailService;
  private final SmsService smsService;

  // REQUIRED: @Async with virtual thread executor for I/O operations
  @Async("ioTaskExecutor")
  public CompletableFuture<NotificationResult> sendDonationReceipt(Donation donation) {
    try {
      // I/O-bound: Email sending
      emailService.sendReceipt(donation.getDonorEmail(), formatReceipt(donation));

      // I/O-bound: SMS sending
      smsService.sendConfirmation(donation.getDonorPhone(), formatSmsMessage(donation));

      return CompletableFuture.completedFuture(
        new NotificationResult(donation.getId(), true, "Sent successfully")
      );

    } catch (Exception ex) {
      logger.error("Failed to send donation receipt for: {}", donation.getId(), ex);
      return CompletableFuture.completedFuture(
        new NotificationResult(donation.getId(), false, ex.getMessage())
      );
    }
  }

  private String formatReceipt(Donation donation) {
    return String.format(
      "Thank you for your donation of %s to %s on %s",
      donation.getAmount(),
      donation.getCharityCategory(),
      donation.getDonationDate()
    );
  }

  private String formatSmsMessage(Donation donation) {
    return String.format("Donation confirmed: %s", donation.getAmount());
  }
}
```

**REQUIRED**: I/O-bound `@Async` operations MUST:

- Use `@Async("ioTaskExecutor")` explicitly
- Return `CompletableFuture<T>` for async results
- Handle exceptions gracefully (no silent failures)
- Log errors to audit trail

### CPU-Bound Async Operations

**REQUIRED**: Use `@Async` with platform thread executor for CPU-bound operations.

```java
@Service
public class ZakatBatchCalculationService {

  private static final Logger logger = LoggerFactory.getLogger(ZakatBatchCalculationService.class);

  private final ZakatCalculator zakatCalculator;

  // REQUIRED: @Async with platform thread executor for CPU-bound work
  @Async("cpuTaskExecutor")
  public CompletableFuture<List<ZakatResult>> calculateZakatForBatch(List<Account> accounts) {
    logger.info("Starting batch Zakat calculation for {} accounts", accounts.size());

    try {
      // CPU-bound: Complex Zakat calculations
      List<ZakatResult> results = accounts.parallelStream()
        .map(this::calculateZakatForAccount)
        .toList();

      logger.info("Completed batch Zakat calculation for {} accounts", accounts.size());
      return CompletableFuture.completedFuture(results);

    } catch (Exception ex) {
      logger.error("Batch Zakat calculation failed", ex);
      return CompletableFuture.failedFuture(ex);
    }
  }

  private ZakatResult calculateZakatForAccount(Account account) {
    Money nisab = zakatCalculator.getNisabThreshold(account.getCurrency());
    Money zakatAmount = zakatCalculator.calculate(account.getBalance(), nisab);

    return new ZakatResult(
      account.getId(),
      account.getBalance(),
      zakatAmount,
      Instant.now()
    );
  }
}
```

**REQUIRED**: CPU-bound `@Async` operations MUST:

- Use `@Async("cpuTaskExecutor")` explicitly
- Use parallel streams for parallel processing
- Return `CompletableFuture<T>` for async results
- Log start and completion for long-running operations

### Composing Async Operations

**REQUIRED**: Use `CompletableFuture` composition for dependent async operations.

```java
@Service
public class MurabahaContractActivationService {

  private final ContractRepository contractRepository;
  private final PaymentGatewayClient paymentGatewayClient;
  private final NotificationService notificationService;

  @Async("ioTaskExecutor")
  public CompletableFuture<ActivationResult> activateContract(String contractId) {
    // Step 1: Load contract (I/O)
    CompletableFuture<MurabahaContract> contractFuture =
      CompletableFuture.supplyAsync(
        () -> contractRepository.findById(contractId)
          .orElseThrow(() -> new ContractNotFoundException(contractId)),
        ioTaskExecutor
      );

    // Step 2: Charge payment (I/O) - depends on contract
    CompletableFuture<String> paymentFuture = contractFuture
      .thenApplyAsync(
        contract -> paymentGatewayClient.chargeInitialPayment(
          contract.getCustomerId(),
          contract.getInitialPayment()
        ),
        ioTaskExecutor
      );

    // Step 3: Update contract and send notification (parallel)
    return paymentFuture.thenComposeAsync(paymentId -> {
      CompletableFuture<MurabahaContract> updateFuture = contractFuture
        .thenApplyAsync(contract -> {
          contract.activate();
          contract.recordPayment(paymentId);
          return contractRepository.save(contract);
        }, ioTaskExecutor);

      CompletableFuture<Void> notificationFuture = contractFuture
        .thenAcceptAsync(
          contract -> notificationService.sendActivationConfirmation(contract),
          ioTaskExecutor
        );

      // Wait for both to complete
      return CompletableFuture.allOf(updateFuture, notificationFuture)
        .thenApply(v -> new ActivationResult(contractId, paymentId, true));

    }, ioTaskExecutor);
  }
}
```

**REQUIRED**: CompletableFuture composition MUST:

- Use `thenApplyAsync` for dependent transformations
- Use `thenComposeAsync` for chaining async operations
- Use `CompletableFuture.allOf` for parallel execution
- Specify executor explicitly (avoid default ForkJoinPool)

### Thread-Safe Singleton Service Beans

**REQUIRED**: All Spring singleton beans MUST be thread-safe.

```java
// ✅ CORRECT: Thread-safe singleton with immutable dependencies
@Service
public class ZakatCalculationService {

  // REQUIRED: Immutable dependencies (injected once, never changed)
  private final ZakatCalculator calculator;
  private final ZakatCalculationRepository repository;
  private final ApplicationEventPublisher eventPublisher;

  public ZakatCalculationService(
    ZakatCalculator calculator,
    ZakatCalculationRepository repository,
    ApplicationEventPublisher eventPublisher
  ) {
    this.calculator = calculator;
    this.repository = repository;
    this.eventPublisher = eventPublisher;
  }

  // REQUIRED: Stateless methods (no shared mutable state)
  public ZakatResult calculateZakat(String accountId) {
    Account account = repository.findAccountById(accountId)
      .orElseThrow(() -> new AccountNotFoundException(accountId));

    Money nisab = calculator.getNisabThreshold(account.getCurrency());
    Money zakatAmount = calculator.calculate(account.getBalance(), nisab);

    ZakatResult result = new ZakatResult(accountId, zakatAmount, Instant.now());

    // Thread-safe event publishing
    eventPublisher.publishEvent(new ZakatCalculatedEvent(result));

    return result;
  }
}
```

**PROHIBITED**: Mutable state in singleton beans.

```java
// ❌ WRONG: Mutable state in singleton bean (NOT thread-safe)
@Service
public class ZakatCalculationService {

  private final ZakatCalculator calculator;

  // ❌ Shared mutable state - race condition!
  private Money lastCalculatedZakat;
  private int calculationCount;

  public ZakatResult calculateZakat(String accountId) {
    // ❌ Multiple threads will corrupt these fields!
    calculationCount++;
    lastCalculatedZakat = calculator.calculate(accountId);

    return new ZakatResult(accountId, lastCalculatedZakat, Instant.now());
  }
}
```

**REQUIRED**: Thread-safe singleton beans MUST:

- Use only immutable dependencies (final fields)
- Avoid instance variables for request-scoped data
- Use stateless methods (all state passed as parameters)
- Use thread-safe collections if caching is required

### Thread-Safe Caching in Singleton Beans

**REQUIRED**: Use `ConcurrentHashMap` for thread-safe caching.

```java
@Service
public class NisabService {

  private static final Logger logger = LoggerFactory.getLogger(NisabService.class);

  private final GoldPriceService goldPriceService;

  // REQUIRED: Thread-safe cache (ConcurrentHashMap)
  private final ConcurrentHashMap<String, CachedNisab> nisabCache = new ConcurrentHashMap<>();

  public Money getNisabThreshold(String currency) {
    CachedNisab cached = nisabCache.get(currency);

    // Check if cache is valid (5 minutes TTL)
    if (cached != null && cached.isValid()) {
      logger.debug("Cache hit for Nisab: {}", currency);
      return cached.getValue();
    }

    // Cache miss - fetch fresh value
    logger.debug("Cache miss for Nisab: {}", currency);
    Money nisab = calculateNisab(currency);

    // REQUIRED: Thread-safe cache update (computeIfAbsent)
    nisabCache.put(currency, new CachedNisab(nisab, Instant.now()));

    return nisab;
  }

  private Money calculateNisab(String currency) {
    BigDecimal goldPricePerGram = goldPriceService.getCurrentPrice(currency);
    BigDecimal nisabGoldGrams = new BigDecimal("85");
    BigDecimal nisabValue = goldPricePerGram.multiply(nisabGoldGrams);
    return Money.of(nisabValue, currency);
  }

  // Immutable cache entry
  private record CachedNisab(Money value, Instant timestamp) {
    private static final Duration TTL = Duration.ofMinutes(5);

    public boolean isValid() {
      return Duration.between(timestamp, Instant.now()).compareTo(TTL) < 0;
    }
  }
}
```

### Hierarchical Task Management

**REQUIRED**: Use Java 21 StructuredTaskScope for related concurrent operations.

```java
@Service
public class DonationProcessingService {

  private final DonationValidator validator;
  private final PaymentProcessor paymentProcessor;
  private final NotificationService notificationService;
  private final AuditLogger auditLogger;

  public DonationProcessingResult processDonation(CreateDonationRequest request)
    throws InterruptedException, ExecutionException {

    // REQUIRED: Structured concurrency for related validation tasks
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

      // Launch parallel validation tasks
      Subtask<ValidationResult> donorValidation =
        scope.fork(() -> validator.validateDonor(request.donorId()));

      Subtask<ValidationResult> amountValidation =
        scope.fork(() -> validator.validateAmount(request.amount()));

      Subtask<ValidationResult> categoryValidation =
        scope.fork(() -> validator.validateCategory(request.category()));

      // REQUIRED: Wait for all validations
      scope.join();
      scope.throwIfFailed();  // Fail fast if any validation fails

      // All validations passed - process payment
      PaymentResult payment = paymentProcessor.processPayment(
        request.donorId(),
        request.amount()
      );

      // Async notification and audit (non-blocking)
      CompletableFuture.allOf(
        CompletableFuture.runAsync(
          () -> notificationService.sendConfirmation(request.donorId(), payment),
          ioTaskExecutor
        ),
        CompletableFuture.runAsync(
          () -> auditLogger.logDonation(request, payment),
          ioTaskExecutor
        )
      );

      return new DonationProcessingResult(payment.donationId(), payment.amount(), true);
    }
  }
}
```

**REQUIRED**: Structured concurrency MUST:

- Use try-with-resources for automatic cleanup
- Use `ShutdownOnFailure` for financial operations (fail fast)
- Wait for all subtasks with `join()`
- Propagate failures with `throwIfFailed()`

### ThreadPoolTaskExecutor Configuration

**REQUIRED**: Configure thread pools based on workload characteristics.

```java
@Configuration
public class ExecutorConfiguration {

  // REQUIRED: Database I/O thread pool (virtual threads)
  @Bean(name = "databaseTaskExecutor")
  public Executor databaseTaskExecutor() {
    ThreadFactory factory = Thread.ofVirtual()
      .name("db-task-", 0)
      .factory();
    return Executors.newThreadPerTaskExecutor(factory);
  }

  // REQUIRED: External API thread pool (virtual threads)
  @Bean(name = "externalApiTaskExecutor")
  public Executor externalApiTaskExecutor() {
    ThreadFactory factory = Thread.ofVirtual()
      .name("api-task-", 0)
      .factory();
    return Executors.newThreadPerTaskExecutor(factory);
  }

  // REQUIRED: Batch processing thread pool (platform threads)
  @Bean(name = "batchTaskExecutor")
  public Executor batchTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(Runtime.getRuntime().availableProcessors());
    executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors() * 2);
    executor.setQueueCapacity(500);
    executor.setThreadNamePrefix("batch-task-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(60);
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    executor.initialize();
    return executor;
  }
}
```

**REQUIRED**: Thread pool configuration MUST:

- Use virtual threads for I/O-bound operations
- Use platform threads for CPU-bound operations
- Set descriptive thread name prefixes
- Configure graceful shutdown (`waitForTasksToCompleteOnShutdown`)
- Set rejection policy (`CallerRunsPolicy` for backpressure)

### Metrics Configuration

**REQUIRED**: Enable thread pool metrics for production monitoring.

```java
@Configuration
public class MetricsConfiguration {

  @Bean
  public MeterBinder threadPoolMetrics(
    @Qualifier("cpuTaskExecutor") ThreadPoolTaskExecutor cpuExecutor,
    @Qualifier("batchTaskExecutor") ThreadPoolTaskExecutor batchExecutor
  ) {
    return registry -> {
      // CPU executor metrics
      Gauge.builder("executor.pool.size", cpuExecutor.getThreadPoolExecutor(), ThreadPoolExecutor::getPoolSize)
        .tag("executor", "cpu")
        .description("Current thread pool size")
        .register(registry);

      Gauge.builder("executor.active", cpuExecutor.getThreadPoolExecutor(), ThreadPoolExecutor::getActiveCount)
        .tag("executor", "cpu")
        .description("Active thread count")
        .register(registry);

      Gauge.builder("executor.queued", cpuExecutor.getThreadPoolExecutor(), e -> e.getQueue().size())
        .tag("executor", "cpu")
        .description("Queued task count")
        .register(registry);

      // Batch executor metrics
      Gauge.builder("executor.pool.size", batchExecutor.getThreadPoolExecutor(), ThreadPoolExecutor::getPoolSize)
        .tag("executor", "batch")
        .description("Current thread pool size")
        .register(registry);

      Gauge.builder("executor.active", batchExecutor.getThreadPoolExecutor(), ThreadPoolExecutor::getActiveCount)
        .tag("executor", "batch")
        .description("Active thread count")
        .register(registry);

      Gauge.builder("executor.queued", batchExecutor.getThreadPoolExecutor(), e -> e.getQueue().size())
        .tag("executor", "batch")
        .description("Queued task count")
        .register(registry);
    };
  }
}
```

**application.properties**:

```properties
# REQUIRED: Enable thread pool metrics
management.endpoints.web.exposure.include=health,info,metrics,threaddump
management.metrics.enable.executor=true
management.metrics.enable.jvm=true
```

### OSE Platform Standards

- **[Spring Error Handling Standards](./ex-soen-plwe-to-jvsp__error-handling-standards.md)** - Async exception handling
- **[Spring API Standards](./ex-soen-plwe-to-jvsp__api-standards.md)** - Async REST API patterns (this file references the API standards file to be created)

### Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Dependency Injection](./ex-soen-plwe-to-jvsp__dependency-injection.md)** - Spring bean scopes and lifecycle
- **[Testing](./ex-soen-plwe-to-jvsp__testing.md)** - Async testing patterns

### Learning Resources

For learning Spring Framework fundamentals and concepts referenced in these standards, see:

- **[Spring By Example](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/_index.md)** - Annotated Spring code examples

**Note**: These standards assume you've learned Spring basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Immutability](../../../../../../governance/principles/software-engineering/immutability.md)**
   - Singleton beans use only immutable dependencies (final fields)
   - Stateless methods prevent concurrent modification issues
   - Immutable cache entries ensure thread safety

2. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - `@Async("ioTaskExecutor")` explicitly specifies executor
   - Thread pool configuration makes sizing and policies explicit
   - Virtual thread naming makes operations traceable

3. **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Spring Boot auto-configures virtual threads with property flag
   - @Async automatically handles thread management
   - Structured concurrency automatically cancels subtasks on failure

## Compliance Checklist

Before deploying Spring-based concurrent financial services, verify:

- [ ] Virtual threads enabled in Spring Boot 3.2+ (`spring.threads.virtual.enabled=true`)
- [ ] Separate executors for I/O-bound vs CPU-bound operations
- [ ] All `@Async` methods specify executor explicitly
- [ ] All `@Async` methods return `CompletableFuture<T>`
- [ ] Singleton beans are thread-safe (immutable dependencies, stateless methods)
- [ ] Caching uses `ConcurrentHashMap` or thread-safe collections
- [ ] Thread pools configured with descriptive names and graceful shutdown
- [ ] Structured concurrency used for related concurrent operations
- [ ] Thread pool metrics enabled for monitoring
- [ ] Async exception handler configured globally

## See Also

**OSE Explanation Foundation**:

- [Java Concurrency](../../../programming-languages/java/ex-soen-prla-ja__concurrency-standards.md) - Java threading baseline
- [Spring Framework Idioms](./ex-soen-plwe-to-jvsp__idioms.md) - Async patterns
- [Spring Framework Best Practices](./ex-soen-plwe-to-jvsp__best-practices.md) - Concurrency standards
- [Spring Framework Performance](./ex-soen-plwe-to-jvsp__performance.md) - Thread pool tuning

**Spring Boot Extension**:

- [Spring Boot WebFlux Reactive](../jvm-spring-boot/ex-soen-plwe-to-jvspbo__webflux-reactive.md) - Reactive programming

---

**Last Updated**: 2026-02-06

**Status**: Mandatory (required for all OSE Platform Spring services)
