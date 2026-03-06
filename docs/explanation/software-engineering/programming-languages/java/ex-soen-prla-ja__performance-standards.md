---
title: Java Performance Standards for OSE Platform
description: Prescriptive performance requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - performance
  - jvm-tuning
  - sla
  - standards
principles:
  - simplicity-over-complexity
  - automation-over-manual
created: 2026-02-03
updated: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java Performance Standards for OSE Platform

**OSE-specific prescriptive standards** for performance in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Java performance fundamentals from [AyoKoding Java Performance](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

Performance in OSE Platform is critical for:

- **Transaction Throughput**: Process thousands of donations, Zakat calculations, and Qard Hasan operations per second
- **Latency Requirements**: Sub-100ms response times for user-facing financial operations
- **Resource Efficiency**: Reduce infrastructure costs through optimized resource utilization
- **Scalability**: Handle growth from hundreds to millions of users without re-architecture
- **User Experience**: Fast responses improve user satisfaction and conversion rates

### Latency Requirements

**REQUIRED**: All OSE Platform services MUST meet the following latency targets (p95).

| Service Type           | p95 Latency | p99 Latency | Notes                                |
| ---------------------- | ----------- | ----------- | ------------------------------------ |
| User-facing APIs       | < 100ms     | < 200ms     | Account queries, balance checks      |
| Financial transactions | < 500ms     | < 1000ms    | Debits, credits, transfers           |
| Batch operations       | < 5s        | < 10s       | Zakat calculations for 1000 accounts |
| Background jobs        | < 30s       | < 60s       | Report generation, audit exports     |

**REQUIRED**: All services MUST instrument latency metrics and alert on SLO violations.

```java
// REQUIRED: Instrument API latency
@Timed(value = "api.donation.process", percentiles = {0.50, 0.95, 0.99})
public Result<DonationReceipt, DonationError> processDonation(
 DonationRequest request
) {
 // Implementation
}
```

### Throughput Requirements

**REQUIRED**: OSE Platform services MUST support minimum throughput targets.

| Service Type        | Min Throughput | Target Throughput | Notes                      |
| ------------------- | -------------- | ----------------- | -------------------------- |
| Donation processing | 100 req/s      | 500 req/s         | Peak load during campaigns |
| Account queries     | 1000 req/s     | 5000 req/s        | Read-heavy operations      |
| Zakat calculations  | 50 req/s       | 200 req/s         | CPU-intensive operations   |
| API gateway         | 5000 req/s     | 20000 req/s       | All incoming requests      |

**REQUIRED**: Load tests MUST verify throughput requirements under sustained load.

### Heap Size Configuration

**REQUIRED**: Production JVM heap MUST be sized based on workload analysis.

```bash
# REQUIRED: Explicit heap configuration for financial services
java \
 -Xms4g \           # Initial heap: 4GB
 -Xmx4g \           # Maximum heap: 4GB (REQUIRED: Same as Xms)
 -XX:MaxMetaspaceSize=512m \  # Metaspace limit
 -jar ose-donation-service.jar
```

**REQUIRED**: Heap sizing MUST:

- Set `-Xms` equal to `-Xmx` (prevent heap resizing overhead)
- Reserve 25-30% of system memory for off-heap (JVM overhead, OS)
- Configure explicit `-XX:MaxMetaspaceSize` (prevent unbounded metaspace growth)
- Base sizing on actual heap usage analysis (profiling)

**RECOMMENDED**: Heap sizing by service type:

- **API services**: 2-4GB (moderate memory footprint)
- **Batch processors**: 4-8GB (large data processing)
- **Microservices**: 512MB-1GB (lightweight services)

### Garbage Collection Configuration

**REQUIRED**: Production services MUST use G1GC or ZGC for predictable latency.

**G1GC (Default for most services)**:

```bash
# REQUIRED: G1GC configuration for low-latency services
java \
 -XX:+UseG1GC \
 -XX:MaxGCPauseMillis=100 \    # Target 100ms pause time
 -XX:G1HeapRegionSize=16m \    # Match object allocation patterns
 -XX:InitiatingHeapOccupancyPercent=45 \  # Start concurrent marking early
 -jar ose-service.jar
```

**ZGC (For ultra-low latency services)**:

```bash
# RECOMMENDED: ZGC for <10ms pause time requirements
java \
 -XX:+UseZGC \
 -XX:ZCollectionInterval=5 \   # Proactive GC every 5 seconds
 -Xmx8g \
 -jar ose-ultra-low-latency-service.jar
```

**REQUIRED**: GC configuration MUST:

- Set explicit pause time target (G1: 100-200ms, ZGC: 10ms)
- Enable GC logging for production troubleshooting
- Monitor GC pause times with alerting on violations

**PROHIBITED**: Using Serial GC or Parallel GC in production (high pause times).

### GC Logging Configuration

**REQUIRED**: All production services MUST enable GC logging.

```bash
# REQUIRED: GC logging for production troubleshooting
java \
 -Xlog:gc*:file=/var/log/ose/gc.log:time,uptime,level,tags \
 -Xlog:gc:file=/var/log/ose/gc-summary.log:time,uptime \
 -XX:+UseGCLogFileRotation \
 -XX:NumberOfGCLogFiles=10 \
 -XX:GCLogFileSize=50M \
 -jar ose-service.jar
```

**REQUIRED**: GC logs MUST:

- Rotate to prevent disk exhaustion
- Include timestamps for correlation with application logs
- Be retained for minimum 7 days
- Be monitored for pause time violations

### Redis Configuration

**REQUIRED**: All caching MUST use Redis with explicit TTL and eviction policies.

```java
// REQUIRED: Redis cache configuration
@Configuration
public class CacheConfig {

 @Bean
 public RedisCacheConfiguration defaultCacheConfig() {
  return RedisCacheConfiguration.defaultCacheConfig()
   .entryTtl(Duration.ofMinutes(10))  // REQUIRED: Explicit TTL
   .disableCachingNullValues()        // REQUIRED: Don't cache nulls
   .serializeKeysWith(
    RedisSerializationContext.SerializationPair
     .fromSerializer(new StringRedisSerializer())
   )
   .serializeValuesWith(
    RedisSerializationContext.SerializationPair
     .fromSerializer(new GenericJackson2JsonRedisSerializer())
   );
 }

 // REQUIRED: Account balance cache (short TTL for financial data)
 @Bean
 public RedisCacheConfiguration accountBalanceCacheConfig() {
  return defaultCacheConfig()
   .entryTtl(Duration.ofSeconds(30));  // REQUIRED: 30s TTL for balance
 }

 // REQUIRED: Zakat rate cache (long TTL for constants)
 @Bean
 public RedisCacheConfiguration zakatRateCacheConfig() {
  return defaultCacheConfig()
   .entryTtl(Duration.ofHours(24));  // REQUIRED: 24h TTL for rate
 }
}
```

**REQUIRED**: Cache configuration MUST:

- Set explicit TTL for every cache (no infinite caching)
- Use short TTLs for financial data (account balances, transaction status)
- Use long TTLs for constants (Zakat rates, currency codes)
- Disable caching of null values (cache pollution)
- Configure eviction policy (LRU for memory-constrained scenarios)

### Cache Invalidation

**REQUIRED**: Financial data mutations MUST invalidate related cache entries.

```java
// REQUIRED: Invalidate cache on balance update
@CacheEvict(cacheNames = "accountBalance", key = "#accountId")
public void updateBalance(AccountId accountId, Money newBalance) {
 accountRepository.updateBalance(accountId, newBalance);
 // Cache automatically invalidated by @CacheEvict
}

// REQUIRED: Invalidate multiple caches atomically
@Caching(evict = {
 @CacheEvict(cacheNames = "accountBalance", key = "#accountId"),
 @CacheEvict(cacheNames = "accountTransactions", key = "#accountId")
})
public void processTransaction(AccountId accountId, Transaction txn) {
 transactionService.execute(txn);
}
```

**REQUIRED**: Cache invalidation MUST:

- Be synchronous with database writes (no stale data)
- Invalidate all related cache entries atomically
- Log invalidation events for troubleshooting
- Use cache-aside pattern (not write-through)

**PROHIBITED**: Caching financial data without explicit invalidation strategy.

### N+1 Query Prevention

**REQUIRED**: All repository methods MUST prevent N+1 query problems.

```java
// WRONG: N+1 query problem
public List<DonationWithDonor> getDonations(List<DonationId> ids) {
 return ids.stream()
  .map(id -> donationRepository.findById(id))  // 1 query per ID!
  .map(donation -> {
   Donor donor = donorRepository.findById(donation.donorId());  // Another query!
   return new DonationWithDonor(donation, donor);
  })
  .toList();
 // Total: 1 + N + N queries = 2N+1 queries!
}

// CORRECT: Single query with JOIN
@Query("""
 SELECT d, donor
 FROM Donation d
 JOIN FETCH d.donor donor
 WHERE d.id IN :ids
 """)
List<DonationWithDonor> findDonationsWithDonors(@Param("ids") List<DonationId> ids);
```

**REQUIRED**: Repository methods MUST:

- Use `JOIN FETCH` for eager loading related entities
- Batch queries with `IN` clause (not individual SELECTs)
- Use `@EntityGraph` for complex fetch strategies
- Document fetch strategy in method Javadoc

**RECOMMENDED**: Enable Hibernate query logging in development to detect N+1 queries.

### Pagination Requirements

**REQUIRED**: All list endpoints MUST implement cursor-based pagination.

```java
// REQUIRED: Cursor-based pagination for large result sets
@GetMapping("/api/donations")
public Page<Donation> getDonations(
 @RequestParam(required = false) String cursor,
 @RequestParam(defaultValue = "50") int pageSize
) {
 // REQUIRED: Validate page size (prevent abuse)
 if (pageSize > 100) {
  throw new IllegalArgumentException("Max page size: 100");
 }

 // REQUIRED: Use cursor (last seen ID) for consistent pagination
 Instant cursorTimestamp = cursor != null
  ? Instant.parse(cursor)
  : Instant.now();

 List<Donation> donations = donationRepository
  .findDonationsAfter(cursorTimestamp, pageSize + 1);

 // REQUIRED: Return next cursor for client
 String nextCursor = donations.size() > pageSize
  ? donations.get(pageSize).createdAt().toString()
  : null;

 return new Page<>(
  donations.subList(0, Math.min(pageSize, donations.size())),
  nextCursor
 );
}
```

**REQUIRED**: Pagination MUST:

- Use cursor-based pagination (not offset-based) for consistency
- Enforce maximum page size (100 items)
- Return opaque cursor for next page
- Use indexed columns for cursor (timestamp, ID)

**PROHIBITED**: Offset-based pagination for large datasets (inconsistent results, poor performance).

### Production Profiling

**REQUIRED**: All production services MUST enable async-profiler integration.

```bash
# REQUIRED: Enable async-profiler in production (low overhead)
java \
 -XX:+UnlockDiagnosticVMOptions \
 -XX:+DebugNonSafepoints \      # Better profiling accuracy
 -agentpath:/opt/async-profiler/libasyncProfiler.so=start,event=cpu,interval=10ms,file=/tmp/profile.html \
 -jar ose-service.jar
```

**REQUIRED**: Profiling MUST:

- Use async-profiler (low overhead, production-safe)
- Profile CPU and allocation hotspots
- Generate flame graphs for analysis
- Be triggerable on-demand (not continuous)

**PROHIBITED**: Using VisualVM or JProfiler in production (high overhead).

### Performance Testing

**REQUIRED**: All services MUST have JMH benchmarks for critical paths.

```java
// REQUIRED: JMH benchmark for Zakat calculation
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
@Fork(value = 1, jvmArgs = {"-Xms2g", "-Xmx2g"})
@State(Scope.Benchmark)
public class ZakatCalculationBenchmark {

 private Account account;
 private ZakatCalculator calculator;

 @Setup
 public void setup() {
  account = new Account(
   AccountId.of("12345"),
   Money.of("100000.00"),
   Instant.now(),
   AccountStatus.ACTIVE
  );
  calculator = new ZakatCalculator();
 }

 @Benchmark
 public ZakatResult calculateZakat() {
  return calculator.calculate(account);
 }
}

// REQUIRED: Run benchmarks in CI
// mvn exec:exec -Dexec.executable=java -Dexec.args="-jar target/benchmarks.jar"
```

**REQUIRED**: Performance tests MUST:

- Use JMH for microbenchmarks
- Run in CI/CD pipeline (detect regressions)
- Compare against baseline (fail on >10% regression)
- Cover critical financial operations (Zakat calculation, transaction processing)

### Application Performance Monitoring (APM)

**REQUIRED**: All production services MUST integrate APM tooling.

```yaml
# REQUIRED: Micrometer metrics configuration
management:
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
      slo:
        http.server.requests: 100ms, 200ms, 500ms, 1s
```

**REQUIRED**: APM MUST track:

- Request latency (p50, p95, p99)
- Request throughput (req/s)
- Error rate (errors/total)
- JVM metrics (heap usage, GC pause time, thread count)
- Database query time
- Cache hit/miss ratio

**REQUIRED**: Alerts MUST fire on:

- p95 latency > SLO (100ms for APIs)
- Error rate > 1%
- GC pause time > 200ms
- Heap usage > 80%
- Database query time > 500ms

### OSE Platform Standards

- [Concurrency Standards](./ex-soen-prla-ja__concurrency-standards.md) - Thread pool sizing, parallel processing
- [Error Handling Standards](./ex-soen-prla-ja__error-handling-standards.md) - Error handling performance
- [API Standards](./ex-soen-prla-ja__api-standards.md) - API performance requirements

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - JVM tuning, garbage collection, profiling, optimization techniques
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Performance optimization patterns and JVM tuning practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features (including performance improvements)

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - JMH benchmarks run automatically in CI/CD pipeline (detect performance regressions)
   - async-profiler provides automated profiling in production (low overhead)
   - APM automatically tracks latency, throughput, and error rates
   - Alerts fire automatically on SLO violations (p95 latency > 100ms)
   - G1GC auto-tuning eliminates manual GC parameter tweaking
   - Cursor-based pagination simplifies large result sets (no offset complexity)
   - Redis caching with explicit TTL prevents cache complexity

2. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - JMH benchmarks provide reproducible performance measurements across environments
   - JVM configuration pinned in startup scripts (same heap, GC settings everywhere)
   - TestContainers ensure consistent database performance in tests

## Compliance Checklist

Before deploying financial services, verify:

- [ ] SLO targets defined (latency, throughput)
- [ ] JVM heap sized based on profiling data
- [ ] G1GC or ZGC configured with explicit pause target
- [ ] GC logging enabled with rotation
- [ ] Redis caching configured with explicit TTLs
- [ ] Cache invalidation strategy implemented
- [ ] N+1 queries prevented (JOIN FETCH used)
- [ ] Cursor-based pagination implemented
- [ ] JMH benchmarks for critical paths
- [ ] APM integrated with SLO alerting

---

## Related Documentation

**Concurrency**:

- [Concurrency Standards](./ex-soen-prla-ja__concurrency-standards.md) - Virtual threads, async patterns, and thread pool configuration for performance

**Build Configuration**:

- [Build Configuration](./ex-soen-prla-ja__build-configuration.md) - JVM tuning parameters and GC configuration in Maven

**Testing**:

- [Testing Standards](./ex-soen-prla-ja__testing-standards.md) - Performance testing, load testing, and profiling patterns

**Last Updated**: 2026-02-04

**Status**: Active (mandatory for all OSE Platform Java services)
