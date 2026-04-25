---
title: Spring Framework Observability
description: Monitoring covering Micrometer integration, custom metrics, logging, distributed tracing with Sleuth, application events, JMX, health indicators, APM integration, structured logging, MDC, and performance monitoring
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - observability
  - monitoring
  - metrics
  - micrometer
  - distributed-tracing
  - logging
  - java
  - kotlin
principles:
  - automation-over-manual
  - explicit-over-implicit
created: 2026-01-29
---

# Spring Framework Observability

**Understanding-oriented documentation** for monitoring Spring applications with comprehensive observability.

## Overview

Observability enables understanding system behavior through metrics, logging, and tracing. Spring Framework integrates with Micrometer for comprehensive monitoring of Islamic finance applications. This document covers metrics collection, distributed tracing, structured logging, APM integration, and custom domain metrics for Zakat calculations, donation tracking, and Murabaha contracts.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Micrometer Integration](#micrometer-integration)
- [Custom Metrics](#custom-metrics)
- [Distributed Tracing](#distributed-tracing-with-spring-cloud-sleuth)
- [Logging Best Practices](#logging-best-practices)
- [Application Events](#application-events)
- [APM Integration](#apm-integration)
- [Health Indicators](#health-indicators)

### Registry Configuration

**Java Example** (Multi-Registry Setup):

```java
@Configuration
public class MetricsConfig {

  @Bean
  public MeterRegistry meterRegistry(
    @Value("${metrics.prometheus.enabled:true}") boolean prometheusEnabled,
    @Value("${metrics.datadog.enabled:false}") boolean datadogEnabled,
    @Value("${metrics.datadog.api-key:}") String datadogApiKey
  ) {
    CompositeMeterRegistry composite = new CompositeMeterRegistry();

    // Prometheus registry for scraping
    if (prometheusEnabled) {
      PrometheusMeterRegistry prometheusRegistry = new PrometheusMeterRegistry(
        PrometheusConfig.DEFAULT
      );
      composite.add(prometheusRegistry);
    }

    // Datadog registry for push-based metrics
    if (datadogEnabled && !datadogApiKey.isEmpty()) {
      DatadogConfig datadogConfig = new DatadogConfig() {
        @Override
        public String apiKey() {
          return datadogApiKey;
        }

        @Override
        public Duration step() {
          return Duration.ofSeconds(10);
        }

        @Override
        public String get(String key) {
          return null;
        }
      };

      DatadogMeterRegistry datadogRegistry = new DatadogMeterRegistry(
        datadogConfig,
        Clock.SYSTEM
      );
      composite.add(datadogRegistry);
    }

    return composite;
  }

  @Bean
  public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
    return registry -> registry.config()
      .commonTags(
        "application", "ose-donation-system",
        "environment", System.getenv().getOrDefault("ENV", "dev"),
        "region", System.getenv().getOrDefault("REGION", "us-east-1")
      )
      .meterFilter(MeterFilter.deny(id -> {
        // Filter out metrics we don't need
        String name = id.getName();
        return name.startsWith("jvm.threads.") ||
               name.startsWith("process.") ||
               name.startsWith("system.");
      }));
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class MetricsConfig {

  @Bean
  fun meterRegistry(
    @Value("\${metrics.prometheus.enabled:true}") prometheusEnabled: Boolean,
    @Value("\${metrics.datadog.enabled:false}") datadogEnabled: Boolean,
    @Value("\${metrics.datadog.api-key:}") datadogApiKey: String
  ): MeterRegistry {
    val composite = CompositeMeterRegistry()

    // Prometheus registry for scraping
    if (prometheusEnabled) {
      val prometheusRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
      composite.add(prometheusRegistry)
    }

    // Datadog registry for push-based metrics
    if (datadogEnabled && datadogApiKey.isNotEmpty()) {
      val datadogConfig = object : DatadogConfig {
        override fun apiKey(): String = datadogApiKey
        override fun step(): Duration = Duration.ofSeconds(10)
        override fun get(key: String): String? = null
      }

      val datadogRegistry = DatadogMeterRegistry(datadogConfig, Clock.SYSTEM)
      composite.add(datadogRegistry)
    }

    return composite
  }

  @Bean
  fun metricsCommonTags(): MeterRegistryCustomizer<MeterRegistry> {
    return MeterRegistryCustomizer { registry ->
      registry.config()
        .commonTags(
          "application", "ose-donation-system",
          "environment", System.getenv().getOrDefault("ENV", "dev"),
          "region", System.getenv().getOrDefault("REGION", "us-east-1")
        )
        .meterFilter(MeterFilter.deny { id ->
          // Filter out metrics we don't need
          val name = id.name
          name.startsWith("jvm.threads.") ||
          name.startsWith("process.") ||
          name.startsWith("system.")
        })
    }
  }
}
```

### Timer Metrics

**Java Example** (Request Processing Time):

```java
@Service
public class DonationService {
  private final DonationRepository repository;
  private final MeterRegistry meterRegistry;
  private final Timer donationTimer;

  public DonationService(DonationRepository repository, MeterRegistry meterRegistry) {
    this.repository = repository;
    this.meterRegistry = meterRegistry;

    this.donationTimer = Timer.builder("donations.processing.time")
      .description("Donation processing time")
      .tags("service", "donation")
      .publishPercentiles(0.5, 0.90, 0.95, 0.99)  // Percentiles: p50, p90, p95, p99
      .publishPercentileHistogram()
      .minimumExpectedValue(Duration.ofMillis(100))
      .maximumExpectedValue(Duration.ofSeconds(10))
      .register(meterRegistry);
  }

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    return donationTimer.record(() -> {
      Donation donation = Donation.create(request);
      repository.save(donation);
      return toResponse(donation);
    });
  }

  // Alternative: Manual timer control
  @Transactional
  public DonationResponse processDonationManual(CreateDonationRequest request) {
    Timer.Sample sample = Timer.start(meterRegistry);
    try {
      Donation donation = Donation.create(request);
      repository.save(donation);

      sample.stop(Timer.builder("donations.processing.time")
        .tag("status", "success")
        .register(meterRegistry));

      return toResponse(donation);
    } catch (Exception e) {
      sample.stop(Timer.builder("donations.processing.time")
        .tag("status", "error")
        .register(meterRegistry));
      throw e;
    }
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId(),
      donation.getAmount(),
      donation.getCategory()
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class DonationService(
  private val repository: DonationRepository,
  private val meterRegistry: MeterRegistry
) {
  private val donationTimer: Timer = Timer.builder("donations.processing.time")
    .description("Donation processing time")
    .tags("service", "donation")
    .publishPercentiles(0.5, 0.90, 0.95, 0.99)  // Percentiles: p50, p90, p95, p99
    .publishPercentileHistogram()
    .minimumExpectedValue(Duration.ofMillis(100))
    .maximumExpectedValue(Duration.ofSeconds(10))
    .register(meterRegistry)

  @Transactional
  fun processDonation(request: CreateDonationRequest): DonationResponse {
    return donationTimer.record {
      val donation = Donation.create(request)
      repository.save(donation)
      donation.toResponse()
    }
  }

  // Alternative: Manual timer control
  @Transactional
  fun processDonationManual(request: CreateDonationRequest): DonationResponse {
    val sample = Timer.start(meterRegistry)
    return try {
      val donation = Donation.create(request)
      repository.save(donation)

      sample.stop(Timer.builder("donations.processing.time")
        .tag("status", "success")
        .register(meterRegistry))

      donation.toResponse()
    } catch (e: Exception) {
      sample.stop(Timer.builder("donations.processing.time")
        .tag("status", "error")
        .register(meterRegistry))
      throw e
    }
  }

  private fun Donation.toResponse(): DonationResponse =
    DonationResponse(id, amount, category)
}
```

### Counter Metrics

**Java Example**:

```java
@Service
public class DonationMetricsService {
  private final MeterRegistry meterRegistry;

  public DonationMetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  public void recordDonationCreated(Donation donation) {
    Counter.builder("donations.created.total")
      .description("Total donations created")
      .tag("category", donation.getCategory().name())
      .tag("currency", donation.getAmount().getCurrency())
      .register(meterRegistry)
      .increment();
  }

  public void recordDonationFailed(String category, String reason) {
    Counter.builder("donations.failed.total")
      .description("Total donation failures")
      .tag("category", category)
      .tag("reason", reason)
      .register(meterRegistry)
      .increment();
  }
}
```

### Gauge Metrics

**Java Example** (Active Donations):

```java
@Service
public class DonationMonitoringService {
  private final DonationRepository repository;
  private final MeterRegistry meterRegistry;

  public DonationMonitoringService(
    DonationRepository repository,
    MeterRegistry meterRegistry
  ) {
    this.repository = repository;
    this.meterRegistry = meterRegistry;

    // Register gauge for active donations count
    Gauge.builder("donations.active.count", repository, repo -> {
        return repo.countByStatus(DonationStatus.ACTIVE);
      })
      .description("Number of active donations")
      .tag("type", "count")
      .register(meterRegistry);

    // Register gauge for total donation amount
    Gauge.builder("donations.amount.total", repository, repo -> {
        return repo.sumAmountByStatus(DonationStatus.ACTIVE).doubleValue();
      })
      .description("Total amount of active donations")
      .tag("type", "amount")
      .baseUnit("currency")
      .register(meterRegistry);
  }
}
```

### Distribution Summary

**Java Example** (Donation Amounts):

```java
@Service
public class DonationAnalyticsService {
  private final DistributionSummary donationAmountSummary;

  public DonationAnalyticsService(MeterRegistry meterRegistry) {
    this.donationAmountSummary = DistributionSummary.builder("donations.amount.distribution")
      .description("Distribution of donation amounts")
      .baseUnit("currency")
      .publishPercentiles(0.5, 0.75, 0.90, 0.95, 0.99)
      .minimumExpectedValue(10.0)
      .maximumExpectedValue(100000.0)
      .register(meterRegistry);
  }

  public void recordDonation(Donation donation) {
    donationAmountSummary.record(donation.getAmount().getAmount().doubleValue());
  }
}
```

### Business Metrics for Domain Events

**Java Example** (Zakat Calculation Metrics):

```java
@Service
public class ZakatMetricsService {
  private final MeterRegistry meterRegistry;
  private final Counter calculationsTotal;
  private final Counter eligibleCalculations;
  private final Counter ineligibleCalculations;
  private final DistributionSummary zakatAmountSummary;
  private final Timer calculationTimer;

  public ZakatMetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;

    this.calculationsTotal = Counter.builder("zakat.calculations.total")
      .description("Total Zakat calculations performed")
      .tag("service", "zakat")
      .register(meterRegistry);

    this.eligibleCalculations = Counter.builder("zakat.calculations.eligible")
      .description("Zakat calculations where donor is eligible")
      .tag("service", "zakat")
      .register(meterRegistry);

    this.ineligibleCalculations = Counter.builder("zakat.calculations.ineligible")
      .description("Zakat calculations where donor is ineligible")
      .tag("service", "zakat")
      .register(meterRegistry);

    this.zakatAmountSummary = DistributionSummary.builder("zakat.amount.distribution")
      .description("Distribution of Zakat amounts calculated")
      .baseUnit("currency")
      .publishPercentiles(0.5, 0.90, 0.95, 0.99)
      .minimumExpectedValue(10.0)
      .maximumExpectedValue(1000000.0)
      .register(meterRegistry);

    this.calculationTimer = Timer.builder("zakat.calculation.time")
      .description("Time to perform Zakat calculation")
      .publishPercentiles(0.5, 0.90, 0.95, 0.99)
      .register(meterRegistry);
  }

  public void recordCalculation(ZakatCalculation calculation) {
    calculationsTotal.increment();

    if (calculation.isEligible()) {
      eligibleCalculations.increment();
      zakatAmountSummary.record(calculation.getZakatAmount().getAmount().doubleValue());

      // Record by currency
      Counter.builder("zakat.calculations.by.currency")
        .tag("currency", calculation.getZakatAmount().getCurrency())
        .tag("eligible", "true")
        .register(meterRegistry)
        .increment();
    } else {
      ineligibleCalculations.increment();
    }
  }

  public <T> T recordCalculationTime(Supplier<T> supplier) {
    return calculationTimer.record(supplier);
  }

  public void recordNisabCheck(String currency, boolean eligible, BigDecimal wealth) {
    Counter.builder("zakat.nisab.checks")
      .tag("currency", currency)
      .tag("eligible", String.valueOf(eligible))
      .register(meterRegistry)
      .increment();

    // Record wealth distribution
    DistributionSummary.builder("zakat.wealth.distribution")
      .tag("currency", currency)
      .tag("eligible", String.valueOf(eligible))
      .baseUnit("currency")
      .register(meterRegistry)
      .record(wealth.doubleValue());
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class ZakatMetricsService(private val meterRegistry: MeterRegistry) {
  private val calculationsTotal: Counter = Counter.builder("zakat.calculations.total")
    .description("Total Zakat calculations performed")
    .tag("service", "zakat")
    .register(meterRegistry)

  private val eligibleCalculations: Counter = Counter.builder("zakat.calculations.eligible")
    .description("Zakat calculations where donor is eligible")
    .tag("service", "zakat")
    .register(meterRegistry)

  private val ineligibleCalculations: Counter = Counter.builder("zakat.calculations.ineligible")
    .description("Zakat calculations where donor is ineligible")
    .tag("service", "zakat")
    .register(meterRegistry)

  private val zakatAmountSummary: DistributionSummary =
    DistributionSummary.builder("zakat.amount.distribution")
      .description("Distribution of Zakat amounts calculated")
      .baseUnit("currency")
      .publishPercentiles(0.5, 0.90, 0.95, 0.99)
      .minimumExpectedValue(10.0)
      .maximumExpectedValue(1000000.0)
      .register(meterRegistry)

  private val calculationTimer: Timer = Timer.builder("zakat.calculation.time")
    .description("Time to perform Zakat calculation")
    .publishPercentiles(0.5, 0.90, 0.95, 0.99)
    .register(meterRegistry)

  fun recordCalculation(calculation: ZakatCalculation) {
    calculationsTotal.increment()

    if (calculation.isEligible) {
      eligibleCalculations.increment()
      zakatAmountSummary.record(calculation.zakatAmount.amount.toDouble())

      // Record by currency
      Counter.builder("zakat.calculations.by.currency")
        .tag("currency", calculation.zakatAmount.currency)
        .tag("eligible", "true")
        .register(meterRegistry)
        .increment()
    } else {
      ineligibleCalculations.increment()
    }
  }

  fun <T> recordCalculationTime(supplier: () -> T): T {
    return calculationTimer.record(supplier)
  }

  fun recordNisabCheck(currency: String, eligible: Boolean, wealth: BigDecimal) {
    Counter.builder("zakat.nisab.checks")
      .tag("currency", currency)
      .tag("eligible", eligible.toString())
      .register(meterRegistry)
      .increment()

    // Record wealth distribution
    DistributionSummary.builder("zakat.wealth.distribution")
      .tag("currency", currency)
      .tag("eligible", eligible.toString())
      .baseUnit("currency")
      .register(meterRegistry)
      .record(wealth.toDouble())
  }
}
```

### Donation Tracking Metrics

**Java Example**:

```java
@Service
public class DonationTrackingMetricsService {
  private final MeterRegistry meterRegistry;

  public DonationTrackingMetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  public void recordDonationCreated(Donation donation) {
    // Total donations counter
    Counter.builder("donations.created.total")
      .tag("category", donation.getCategory().name())
      .tag("currency", donation.getAmount().getCurrency())
      .register(meterRegistry)
      .increment();

    // Donation amount distribution
    DistributionSummary.builder("donations.amount.distribution")
      .tag("category", donation.getCategory().name())
      .tag("currency", donation.getAmount().getCurrency())
      .baseUnit("currency")
      .register(meterRegistry)
      .record(donation.getAmount().getAmount().doubleValue());

    // Time-based metrics
    Counter.builder("donations.by.hour")
      .tag("hour", String.valueOf(LocalDateTime.now().getHour()))
      .tag("category", donation.getCategory().name())
      .register(meterRegistry)
      .increment();

    // Daily donation target gauge
    AtomicDouble dailyTotal = new AtomicDouble(0.0);
    Gauge.builder("donations.daily.total", dailyTotal, AtomicDouble::get)
      .description("Total donations today")
      .tag("currency", donation.getAmount().getCurrency())
      .baseUnit("currency")
      .register(meterRegistry);

    dailyTotal.addAndGet(donation.getAmount().getAmount().doubleValue());
  }

  public void recordDonationCompleted(Donation donation, Duration processingTime) {
    Counter.builder("donations.completed.total")
      .tag("category", donation.getCategory().name())
      .register(meterRegistry)
      .increment();

    Timer.builder("donations.completion.time")
      .tag("category", donation.getCategory().name())
      .register(meterRegistry)
      .record(processingTime);
  }

  public void recordDonationFailed(String category, String reason) {
    Counter.builder("donations.failed.total")
      .tag("category", category)
      .tag("reason", reason)
      .register(meterRegistry)
      .increment();
  }
}
```

### Enable Distributed Tracing

**Dependencies** (Maven):

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

**Configuration** (application.yml):

```yaml
spring:
  sleuth:
    sampler:
      probability: 0.1 # Sample 10% of requests
  zipkin:
    base-url: http://localhost:9411
    sender:
      type: web # or 'rabbit', 'kafka'
```

### Trace Context Propagation

**Java Example** (Donation Service with Tracing):

```java
@Service
public class DonationTracingService {
  private static final Logger logger = LoggerFactory.getLogger(DonationTracingService.class);

  private final DonationRepository repository;
  private final EmailNotificationService emailService;
  private final Tracer tracer;

  public DonationTracingService(
    DonationRepository repository,
    EmailNotificationService emailService,
    Tracer tracer
  ) {
    this.repository = repository;
    this.emailService = emailService;
    this.tracer = tracer;
  }

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    Span span = tracer.nextSpan().name("processDonation").start();

    try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
      span.tag("donation.category", request.category().name());
      span.tag("donation.currency", request.amount().getCurrency());
      span.tag("donation.amount", request.amount().getAmount().toString());

      logger.info("Processing donation: traceId={}, spanId={}",
        span.context().traceId(), span.context().spanId());

      // Save donation - creates child span automatically
      Donation donation = Donation.create(request);
      repository.save(donation);

      // Send notification - creates child span automatically
      emailService.sendDonationReceipt(request.donorEmail(), donation);

      span.tag("donation.id", donation.getId());
      span.event("donation.created");

      return toResponse(donation);
    } catch (Exception e) {
      span.tag("error", "true");
      span.tag("error.message", e.getMessage());
      throw e;
    } finally {
      span.end();
    }
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId(),
      donation.getAmount(),
      donation.getCategory()
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class DonationTracingService(
  private val repository: DonationRepository,
  private val emailService: EmailNotificationService,
  private val tracer: Tracer
) {
  companion object {
    private val logger = LoggerFactory.getLogger(DonationTracingService::class.java)
  }

  @Transactional
  fun processDonation(request: CreateDonationRequest): DonationResponse {
    val span = tracer.nextSpan().name("processDonation").start()

    return try {
      tracer.withSpan(span).use {
        span.tag("donation.category", request.category.name)
        span.tag("donation.currency", request.amount.currency)
        span.tag("donation.amount", request.amount.amount.toString())

        logger.info("Processing donation: traceId={}, spanId={}",
          span.context().traceId(), span.context().spanId())

        // Save donation - creates child span automatically
        val donation = Donation.create(request)
        repository.save(donation)

        // Send notification - creates child span automatically
        emailService.sendDonationReceipt(request.donorEmail, donation)

        span.tag("donation.id", donation.id)
        span.event("donation.created")

        donation.toResponse()
      }
    } catch (e: Exception) {
      span.tag("error", "true")
      span.tag("error.message", e.message ?: "Unknown error")
      throw e
    } finally {
      span.end()
    }
  }

  private fun Donation.toResponse(): DonationResponse =
    DonationResponse(id, amount, category)
}
```

### Custom Span Creation

**Java Example** (Zakat Calculation with Custom Spans):

```java
@Service
public class ZakatCalculationTracingService {
  private final Tracer tracer;
  private final NisabService nisabService;
  private final ZakatCalculator calculator;

  public ZakatCalculationTracingService(
    Tracer tracer,
    NisabService nisabService,
    ZakatCalculator calculator
  ) {
    this.tracer = tracer;
    this.nisabService = nisabService;
    this.calculator = calculator;
  }

  public ZakatCalculationResponse calculate(CalculateZakatRequest request) {
    // Create parent span for entire calculation
    Span calculationSpan = tracer.nextSpan().name("zakat.calculate").start();

    try (Tracer.SpanInScope ws = tracer.withSpan(calculationSpan)) {
      calculationSpan.tag("wealth.amount", request.wealth().toString());
      calculationSpan.tag("currency", request.currency());

      // Child span 1: Nisab retrieval
      Money nisab = tracedNisabRetrieval(request.currency());
      calculationSpan.tag("nisab.amount", nisab.getAmount().toString());

      // Child span 2: Eligibility check
      boolean eligible = tracedEligibilityCheck(request.wealth(), nisab);
      calculationSpan.tag("eligible", String.valueOf(eligible));

      if (!eligible) {
        calculationSpan.event("ineligible.for.zakat");
        return ZakatCalculationResponse.ineligible();
      }

      // Child span 3: Zakat calculation
      Money zakatAmount = tracedZakatCalculation(request.wealth());
      calculationSpan.tag("zakat.amount", zakatAmount.getAmount().toString());
      calculationSpan.event("zakat.calculated");

      return ZakatCalculationResponse.eligible(zakatAmount);
    } finally {
      calculationSpan.end();
    }
  }

  private Money tracedNisabRetrieval(String currency) {
    Span span = tracer.nextSpan().name("nisab.retrieve").start();
    try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
      span.tag("currency", currency);
      Money nisab = nisabService.getCurrentNisab(currency);
      span.event("nisab.retrieved");
      return nisab;
    } finally {
      span.end();
    }
  }

  private boolean tracedEligibilityCheck(Money wealth, Money nisab) {
    Span span = tracer.nextSpan().name("eligibility.check").start();
    try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
      boolean eligible = wealth.isGreaterThanOrEqualTo(nisab);
      span.tag("eligible", String.valueOf(eligible));
      span.event("eligibility.checked");
      return eligible;
    } finally {
      span.end();
    }
  }

  private Money tracedZakatCalculation(Money wealth) {
    Span span = tracer.nextSpan().name("zakat.compute").start();
    try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
      Money zakatAmount = calculator.calculate(wealth);
      span.tag("zakat.amount", zakatAmount.getAmount().toString());
      span.event("zakat.computed");
      return zakatAmount;
    } finally {
      span.end();
    }
  }
}
```

### Baggage Propagation

**Java Example** (Propagating Donor Context):

```java
@Service
public class DonationBaggageService {
  private final Tracer tracer;
  private final BaggageField donorIdField;
  private final BaggageField donorTierField;

  public DonationBaggageService(Tracer tracer) {
    this.tracer = tracer;
    this.donorIdField = BaggageField.create("donor.id");
    this.donorTierField = BaggageField.create("donor.tier");
  }

  public void setDonorContext(String donorId, String tier) {
    TraceContext context = tracer.currentSpan().context();
    donorIdField.updateValue(context, donorId);
    donorTierField.updateValue(context, tier);
  }

  public String getDonorId() {
    TraceContext context = tracer.currentSpan().context();
    return donorIdField.getValue(context);
  }

  public String getDonorTier() {
    TraceContext context = tracer.currentSpan().context();
    return donorTierField.getValue(context);
  }
}
```

### Structured Logging with Logback

**Configuration** (logback-spring.xml):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

  <!-- JSON encoder for structured logging -->
  <appender name="JSON_CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdc>true</includeMdc>
      <includeContext>true</includeContext>
      <includeStructuredArguments>true</includeStructuredArguments>
      <includeTags>true</includeTags>

      <!-- Custom field names -->
      <fieldNames>
        <timestamp>@timestamp</timestamp>
        <message>message</message>
        <logger>logger</logger>
        <level>level</level>
        <thread>thread</thread>
        <stackTrace>stack_trace</stackTrace>
      </fieldNames>

      <!-- Include trace context -->
      <provider class="net.logstash.logback.composite.loggingevent.ArgumentsJsonProvider"/>
      <provider class="net.logstash.logback.composite.loggingevent.MdcJsonProvider"/>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="JSON_CONSOLE"/>
  </root>
</configuration>
```

### MDC (Mapped Diagnostic Context)

**Java Example** (Request Context Logging):

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
  private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    try {
      // Add request context to MDC
      MDC.put("request.id", UUID.randomUUID().toString());
      MDC.put("request.method", request.getMethod());
      MDC.put("request.uri", request.getRequestURI());
      MDC.put("request.remote.address", request.getRemoteAddr());

      // Extract donor ID from authentication
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      if (auth != null && auth.isAuthenticated()) {
        MDC.put("donor.id", auth.getName());
        if (auth.getAuthorities() != null) {
          String roles = auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));
          MDC.put("donor.roles", roles);
        }
      }

      logger.info("Request started");

      filterChain.doFilter(request, response);

      MDC.put("response.status", String.valueOf(response.getStatus()));
      logger.info("Request completed");
    } finally {
      // Always clear MDC to prevent memory leaks
      MDC.clear();
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Component
class RequestLoggingFilter : OncePerRequestFilter() {
  companion object {
    private val logger = LoggerFactory.getLogger(RequestLoggingFilter::class.java)
  }

  override fun doFilterInternal(
    request: HttpServletRequest,
    response: HttpServletResponse,
    filterChain: FilterChain
  ) {
    try {
      // Add request context to MDC
      MDC.put("request.id", UUID.randomUUID().toString())
      MDC.put("request.method", request.method)
      MDC.put("request.uri", request.requestURI)
      MDC.put("request.remote.address", request.remoteAddr)

      // Extract donor ID from authentication
      val auth = SecurityContextHolder.getContext().authentication
      if (auth != null && auth.isAuthenticated) {
        MDC.put("donor.id", auth.name)
        auth.authorities?.let { authorities ->
          val roles = authorities.joinToString(",") { it.authority }
          MDC.put("donor.roles", roles)
        }
      }

      logger.info("Request started")

      filterChain.doFilter(request, response)

      MDC.put("response.status", response.status.toString())
      logger.info("Request completed")
    } finally {
      // Always clear MDC to prevent memory leaks
      MDC.clear()
    }
  }
}
```

### Correlation IDs

**Java Example** (Correlation ID Propagation):

```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
  private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
  private static final String CORRELATION_ID_MDC_KEY = "correlation.id";

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    try {
      // Extract or generate correlation ID
      String correlationId = request.getHeader(CORRELATION_ID_HEADER);
      if (correlationId == null || correlationId.isEmpty()) {
        correlationId = UUID.randomUUID().toString();
      }

      // Add to MDC
      MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

      // Add to response header
      response.setHeader(CORRELATION_ID_HEADER, correlationId);

      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(CORRELATION_ID_MDC_KEY);
    }
  }
}

@Service
public class DonationLoggingService {
  private static final Logger logger = LoggerFactory.getLogger(DonationLoggingService.class);

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    // Correlation ID automatically included in all log statements
    logger.info("Processing donation: amount={}, category={}",
      request.amount(), request.category());

    try {
      Donation donation = Donation.create(request);
      repository.save(donation);

      logger.info("Donation created successfully: donationId={}", donation.getId());
      return toResponse(donation);
    } catch (Exception e) {
      logger.error("Failed to create donation: amount={}", request.amount(), e);
      throw e;
    }
  }
}
```

### Structured Logging

**Java Example** (Structured Fields):

```java
@Service
public class StructuredLoggingService {
  private static final Logger logger = LoggerFactory.getLogger(StructuredLoggingService.class);

  public void logDonationCreated(Donation donation) {
    // Using Logstash markers for structured fields
    logger.info(
      append("donation.id", donation.getId())
        .and(append("donation.amount", donation.getAmount().getAmount()))
        .and(append("donation.currency", donation.getAmount().getCurrency()))
        .and(append("donation.category", donation.getCategory().name()))
        .and(append("donor.id", donation.getDonorId())),
      "Donation created"
    );
  }

  public void logZakatCalculation(ZakatCalculation calculation) {
    logger.info(
      append("calculation.id", calculation.getId())
        .and(append("wealth.amount", calculation.getWealth()))
        .and(append("nisab.amount", calculation.getNisab()))
        .and(append("zakat.amount", calculation.getZakatAmount()))
        .and(append("eligible", calculation.isEligible()))
        .and(append("donor.id", calculation.getDonorId())),
      "Zakat calculation performed"
    );
  }

  public void logError(String operation, Exception e, Map<String, Object> context) {
    Marker marker = append("error.type", e.getClass().getSimpleName())
      .and(append("operation", operation));

    context.forEach((key, value) -> marker.and(append(key, value)));

    logger.error(marker, "Operation failed: {}", operation, e);
  }
}
```

## Application Events

**Java Example** (Donation Events):

```java
public class DonationCreatedEvent extends ApplicationEvent {
  private final DonationId donationId;
  private final Money amount;
  private final DonationCategory category;

  public DonationCreatedEvent(Object source, DonationId donationId, Money amount, DonationCategory category) {
    super(source);
    this.donationId = donationId;
    this.amount = amount;
    this.category = category;
  }

  // Getters
}

@Service
public class DonationService {
  private final ApplicationEventPublisher eventPublisher;

  @Transactional
  public DonationResponse processDonation(CreateDonationRequest request) {
    Donation donation = Donation.create(request);
    repository.save(donation);

    eventPublisher.publishEvent(new DonationCreatedEvent(
      this,
      donation.getId(),
      donation.getAmount(),
      donation.getCategory()
    ));

    return toResponse(donation);
  }
}

@Component
class DonationEventListener {
  private static final Logger logger = LoggerFactory.getLogger(DonationEventListener.class);
  private final MeterRegistry meterRegistry;

  public DonationEventListener(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  @EventListener
  @Async
  public void handleDonationCreated(DonationCreatedEvent event) {
    logger.info("Donation created event: donationId={}, amount={}",
      event.getDonationId(), event.getAmount());

    Counter.builder("donations.events.created")
      .tag("category", event.getCategory().name())
      .register(meterRegistry)
      .increment();
  }
}
```

### Datadog APM

**Configuration** (application.yml):

```yaml
management:
  metrics:
    export:
      datadog:
        enabled: true
        api-key: ${DATADOG_API_KEY}
        application-key: ${DATADOG_APP_KEY}
        uri: https://api.datadoghq.com
        step: 10s
        descriptions: true
        connect-timeout: 1s
        read-timeout: 10s
```

**Java Example** (Datadog Custom Metrics):

```java
@Service
public class DatadogMetricsService {
  private final MeterRegistry meterRegistry;

  public DatadogMetricsService(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  public void recordBusinessMetric(String metricName, double value, Map<String, String> tags) {
    Gauge.builder(metricName, () -> value)
      .tags(Tags.of(tags.entrySet().stream()
        .map(e -> Tag.of(e.getKey(), e.getValue()))
        .collect(Collectors.toList())))
      .register(meterRegistry);
  }
}
```

### New Relic APM

**Configuration**:

```yaml
management:
  metrics:
    export:
      newrelic:
        enabled: true
        api-key: ${NEW_RELIC_API_KEY}
        account-id: ${NEW_RELIC_ACCOUNT_ID}
        uri: https://metric-api.newrelic.com/metric/v1
        step: 10s
```

### Dynatrace APM

**Configuration**:

```yaml
management:
  metrics:
    export:
      dynatrace:
        enabled: true
        api-token: ${DYNATRACE_API_TOKEN}
        uri: ${DYNATRACE_ENVIRONMENT_URL}/api/v2/metrics/ingest
        device-id: ${DYNATRACE_DEVICE_ID}
        step: 10s
```

## Health Indicators

**Java Example** (Custom Health Check):

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
  private final JdbcTemplate jdbcTemplate;

  public DatabaseHealthIndicator(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public Health health() {
    try {
      jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      return Health.up()
        .withDetail("database", "PostgreSQL")
        .withDetail("status", "Connected")
        .build();
    } catch (Exception e) {
      return Health.down()
        .withDetail("database", "PostgreSQL")
        .withDetail("status", "Disconnected")
        .withException(e)
        .build();
    }
  }
}
```

**Kotlin Example**:

```kotlin
@Component
class DatabaseHealthIndicator(
  private val jdbcTemplate: JdbcTemplate
) : HealthIndicator {

  override fun health(): Health {
    return try {
      jdbcTemplate.queryForObject("SELECT 1", Int::class.java)
      Health.up()
        .withDetail("database", "PostgreSQL")
        .withDetail("status", "Connected")
        .build()
    } catch (e: Exception) {
      Health.down()
        .withDetail("database", "PostgreSQL")
        .withDetail("status", "Disconnected")
        .withException(e)
        .build()
    }
  }
}
```

### Automation Over Manual

**Applied in Observability**:

- ✅ Automatic metric collection with Micrometer
- ✅ Automatic trace propagation with Sleuth
- ✅ Automatic MDC population in filters
- ✅ Health checks auto-registered

### Explicit Over Implicit

**Applied in Observability**:

- ✅ Explicit metric tags for filtering
- ✅ Explicit span names for tracing
- ✅ Explicit correlation IDs in logs
- ✅ Explicit structured logging fields

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Performance](performance.md)** - Optimization techniques

## See Also

**OSE Explanation Foundation**:

- [Java Monitoring](../../../programming-languages/java/performance-standards.md) - Java JMX baseline
- [Spring Framework Idioms](./idioms.md) - Observability patterns
- [Spring Framework Performance](./performance.md) - Performance metrics
- [Spring Framework Best Practices](./best-practices.md) - Monitoring standards

**Spring Boot Extension**:

- [Spring Boot Observability](../jvm-spring-boot/observability.md) - Auto-configured metrics

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
