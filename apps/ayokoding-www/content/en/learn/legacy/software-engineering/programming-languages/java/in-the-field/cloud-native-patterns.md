---
title: "Cloud Native Patterns"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Build production-ready cloud-native Java applications with health checks, metrics, configuration, and fault tolerance
weight: 10000027
tags: ["java", "cloud-native", "microprofile", "observability", "twelve-factor", "microservices"]
---

## Understanding Cloud-Native Java

Cloud-native applications are designed for dynamic, distributed cloud environments. They embrace microservices architecture, containerization, continuous deployment, and observable operation.

**Why cloud-native matters:**

- **Scalability**: Horizontal scaling with stateless services
- **Resilience**: Fault tolerance and graceful degradation
- **Observability**: Health checks, metrics, and distributed tracing
- **Portability**: Run anywhere (on-premises, cloud, hybrid)

This guide covers essential cloud-native patterns using MicroProfile and Spring Boot standards.

## Health Checks - Service Readiness Verification

**Problem**: Orchestrators (Kubernetes, Docker Swarm) need to know if service instances are healthy. Routing traffic to unhealthy instances causes failures.

**Recognition signals:**

- No way to verify service health programmatically
- Load balancer sends traffic to failed instances
- Slow startup causes "connection refused" errors
- Dependencies failure goes undetected
- Manual health verification needed

**Solution**: Expose health endpoints for liveness and readiness checks.

| Check Type | Purpose                  | Failure Action              |
| ---------- | ------------------------ | --------------------------- |
| Liveness   | Is service running?      | Restart container           |
| Readiness  | Ready to accept traffic? | Remove from load balancer   |
| Startup    | Has service started?     | Wait before liveness checks |

**Example (MicroProfile Health):**

```java
import org.eclipse.microprofile.health.*;
// => MicroProfile Health: standard cloud-native health check API
import jakarta.enterprise.context.ApplicationScoped;
// => CDI scope: singleton bean, one instance per application

@Liveness
// => Liveness probe: tells Kubernetes if service should be restarted
// => Failure action: kill and restart container
@ApplicationScoped
// => CDI managed bean: container manages lifecycle
public class LivenessCheck implements HealthCheck {
// => HealthCheck interface: requires call() method returning health status
    @Override
    public HealthCheckResponse call() {
// => Called by framework: executed when /health/live endpoint accessed
        // CHECK: Can service process requests?
        boolean isAlive = checkInternalState();
// => Internal health: checks if service core components functional
// => True: service can process, False: service should restart

        return HealthCheckResponse
// => Builder pattern: constructs health check response
            .named("service-liveness")
// => Check name: identifies this health check in response
            .status(isAlive)
// => Health status: UP if true, DOWN if false
            .withData("uptime", getUptimeSeconds())
// => Additional data: metadata for debugging (uptime seconds)
            .build();
// => Returns response: JSON with status and data
    }

    private boolean checkInternalState() {
// => Internal check: verifies critical service components
        // Verify critical components
        return threadPoolHealthy() && memoryAvailable();
// => Composite check: AND condition (all must be healthy)
// => Thread pool + memory: essential for request processing
    }
}

@Readiness
// => Readiness probe: tells Kubernetes if service can accept traffic
// => Failure action: remove from service load balancer (no restart)
@ApplicationScoped
public class ReadinessCheck implements HealthCheck {
// => Readiness check: verifies external dependencies available
    @Inject
// => CDI injection: container provides database connection
    DatabaseConnection database;
// => Database dependency: service can't function without database

    @Inject
    CacheConnection cache;
// => Cache dependency: performance optimization layer

    @Override
    public HealthCheckResponse call() {
// => Called on /health/ready: executed every readiness probe interval
        // CHECK: Are dependencies available?
        boolean databaseReady = database.ping();
// => Database ping: quick connectivity check (not full query)
// => Returns false: database unreachable or timeout
        boolean cacheReady = cache.ping();
// => Cache ping: verifies cache connection active

        return HealthCheckResponse
            .named("service-readiness")
// => Check name: distinguishes from liveness check
            .status(databaseReady && cacheReady)
// => Status: UP only if BOTH dependencies available
// => Not ready: removed from load balancer until dependencies recover
            .withData("database", databaseReady)
// => Individual status: shows which dependency failed
            .withData("cache", cacheReady)
// => Diagnostic data: helps troubleshoot readiness failures
            .build();
// => Returns JSON: {"status": "UP/DOWN", "checks": [...]}
    }
}
```

**Kubernetes integration:**

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: myapp:latest
      livenessProbe:
        httpGet:
          path: /health/live
          port: 8080
        initialDelaySeconds: 30 # Wait for startup
        periodSeconds: 10 # Check every 10s
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
      startupProbe:
        httpGet:
          path: /health/started
          port: 8080
        failureThreshold: 30 # 30 * 10s = 5min max startup
        periodSeconds: 10
```

**Benefits:**

- Automatic restart of failed instances
- No traffic to unready services
- Graceful handling of slow startups

## Metrics - Observable System State

**Problem**: Without metrics, you can't measure performance, detect anomalies, or capacity plan. Troubleshooting requires guessing.

**Recognition signals:**

- No visibility into request rates, latency, errors
- Performance issues discovered by users
- No capacity planning data
- Cannot prove SLA compliance
- Troubleshooting requires adding logging retroactively

**Solution**: Expose standardized metrics for monitoring systems.

### Key Metric Types

| Type      | Purpose                        | Examples                              |
| --------- | ------------------------------ | ------------------------------------- |
| Counter   | Monotonically increasing count | Requests total, errors total          |
| Gauge     | Current value                  | Active connections, memory usage      |
| Histogram | Distribution of values         | Request duration, response size       |
| Timer     | Rate and duration              | Request rate, 95th percentile latency |

**Example (MicroProfile Metrics):**

```java
import org.eclipse.microprofile.metrics.*;
// => MicroProfile Metrics: cloud-native metrics API (Prometheus-compatible)
import org.eclipse.microprofile.metrics.annotation.*;
// => Metric annotations: declarative metrics via @Counted, @Timed, @Gauge
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
// => Singleton bean: one instance for entire application
public class OrderService {
// => Service with metrics: demonstrates annotation-based and programmatic metrics
    @Inject
// => CDI injection: container provides MetricRegistry instance
    MetricRegistry registry;
// => Metric registry: access to programmatic metric creation

    @Counted(name = "orders_created_total", description = "Total orders created")
// => @Counted: automatically increments counter every time method called
// => Counter metric: monotonically increasing count (never decreases)
    @Timed(name = "order_creation_duration", description = "Order creation duration")
// => @Timed: automatically tracks method execution time and call rate
// => Records: call count, sum of durations, min/max/mean, percentiles (p50/p95/p99)
    public Order createOrder(OrderRequest request) {
// => Method instrumented: both counter and timer track this method
        // METRICS: Automatically tracked
// => Automatic: framework intercepts method, records metrics before/after
        return processOrder(request);
// => Business logic: metrics transparent to implementation
    }

    @Gauge(name = "active_orders", unit = MetricUnits.NONE,
           description = "Currently active orders")
// => @Gauge: snapshot of current value (can increase or decrease)
// => Sampled metric: framework calls method when metrics scraped
    public long getActiveOrderCount() {
// => Called on scrape: Prometheus queries this value periodically
        return orderRepository.countActive();
// => Live query: returns current count from database
// => Gauge behavior: value reflects current state (not accumulated)
    }

    public void recordPaymentProcessing(long durationMillis) {
// => Manual metric: programmatic alternative to annotations
        // CUSTOM HISTOGRAM
        Histogram paymentDuration = registry.histogram(
// => Histogram: tracks distribution of values (duration buckets)
// => Use case: percentile calculations (p50, p95, p99 latency)
            Metadata.builder()
// => Builder pattern: constructs metric metadata
                .withName("payment_processing_duration")
// => Metric name: Prometheus metric identifier
                .withDescription("Payment processing time in milliseconds")
// => Description: appears in Prometheus HELP comment
                .build()
        );
        paymentDuration.update(durationMillis);
// => Records value: adds duration to histogram distribution
// => Prometheus calculates: percentiles, min, max, mean from distribution
    }
}
```

**Prometheus exposition format:**

```
# HELP orders_created_total Total orders created
# TYPE orders_created_total counter
orders_created_total 1547

# HELP order_creation_duration_seconds Order creation duration
# TYPE order_creation_duration_seconds summary
order_creation_duration_seconds_count 1547
order_creation_duration_seconds_sum 45.234
order_creation_duration_seconds{quantile="0.5"} 0.023
order_creation_duration_seconds{quantile="0.95"} 0.087
order_creation_duration_seconds{quantile="0.99"} 0.154

# HELP active_orders Currently active orders
# TYPE active_orders gauge
active_orders 23
```

### RED Method (Request-based Services)

Monitor three key metrics for every service:

| Metric       | Meaning                  | Alert Threshold         |
| ------------ | ------------------------ | ----------------------- |
| **R**ate     | Requests per second      | Spike or drop 50%+      |
| **E**rrors   | Error rate (%)           | > 1%                    |
| **D**uration | Response time (p95, p99) | p95 > SLA, p99 > 2x SLA |

```java
@ApplicationScoped
// => Singleton: one metrics collector instance for app
public class MetricsCollector {
// => RED Method implementation: Rate, Errors, Duration metrics
    @Inject
    MetricRegistry registry;
// => Injected registry: programmatic metric access

    public void recordRequest(long durationMillis, boolean success) {
// => Records request: tracks all three RED metrics
        // RATE: Request counter
        Counter requests = registry.counter("http_requests_total");
// => Counter: total requests (all successes + failures)
// => Rate calculation: Prometheus derives requests/sec from counter
        requests.inc();
// => Increments by 1: each request increases counter
// => Prometheus PromQL: rate(http_requests_total[5m]) for requests/sec

        // ERRORS: Error counter
        if (!success) {
// => Conditional increment: only failed requests
            Counter errors = registry.counter("http_requests_errors_total");
// => Error counter: subset of total requests
            errors.inc();
// => Error rate: (errors_total / requests_total) * 100 = error percentage
        }

        // DURATION: Response time histogram
        Histogram duration = registry.histogram("http_request_duration_milliseconds");
// => Histogram: tracks response time distribution
// => Percentiles: p50 (median), p95, p99 latency calculated from histogram
        duration.update(durationMillis);
// => Records duration: adds to distribution for percentile calculation
// => Alerting: p95 > SLA threshold triggers alert
    }
}
```

## Configuration - Externalized Settings

**Problem**: Hardcoded configuration requires recompilation for environment changes. Secrets in source code create security risks.

**Recognition signals:**

- Database URLs hardcoded
- Different builds for each environment
- Secrets committed to version control
- Cannot change configuration without redeployment
- Configuration scattered across code

**Solution**: Externalize configuration, inject at runtime.

### Twelve-Factor Configuration

**Principle**: Store config in environment (separate from code).

```java
import org.eclipse.microprofile.config.inject.ConfigProperty;
// => MicroProfile Config: standard cloud-native configuration API
import jakarta.inject.Inject;
// => CDI injection: injects configuration values at runtime

@ApplicationScoped
// => Application-scoped bean: singleton for entire application
public class DatabaseService {
// => Service with externalized config: follows Twelve-Factor App principles
    @Inject
// => CDI injection: triggers configuration resolution
    @ConfigProperty(name = "database.url")
// => Config property: reads from env vars, system props, or application.properties
// => Source priority: System props > Env vars > Config files
    String databaseUrl;
// => Injected at startup: value resolved when bean created
// => Environment-specific: different URL per environment (dev/staging/prod)

    @Inject
    @ConfigProperty(name = "database.pool.size", defaultValue = "10")
// => Default value: fallback if property not defined in any source
// => Optional config: service still starts without explicit configuration
    int poolSize;
// => Type conversion: MicroProfile Config converts string to int automatically

    @Inject
    @ConfigProperty(name = "database.username")
// => Username injection: no default, property required
    String username;

    @Inject
    @ConfigProperty(name = "database.password")
    String password;  // INJECT: Never hardcode
// => Secret injection: password from env var (DATABASE_PASSWORD)
// => Security: keeps credentials out of source code
// => Kubernetes: secret mounted as environment variable

    public Connection getConnection() {
// => Uses injected config: no hardcoded values
        // USE: Injected configuration
        return DriverManager.getConnection(databaseUrl, username, password);
// => Runtime values: configuration resolved based on deployment environment
// => Twelve-Factor: same code deployed to all environments, config externalized
    }
}
```

**Configuration sources (priority order):**

1. System properties (`-Ddatabase.url=...`)
2. Environment variables (`DATABASE_URL=...`)
3. application.properties file
4. Default values (`defaultValue = "10"`)

**Example: Environment-specific configuration**

```properties
# application.properties (defaults)
database.pool.size=10
cache.ttl=3600

# dev environment: Override via environment variables
DATABASE_URL=jdbc:postgresql:dev
DATABASE_USERNAME=dev_user
DATABASE_PASSWORD=dev_password

# prod environment: Override via Kubernetes secrets
DATABASE_URL=jdbc:postgresql://${DB_HOST:prod-db}:5432/production
DATABASE_USERNAME=prod_user
DATABASE_PASSWORD=${DB_PASSWORD}  # From Kubernetes secret
```

**Kubernetes secret injection:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
type: Opaque
data:
  password: <base64-encoded-password>
---
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: password
```

## Fault Tolerance - Graceful Degradation

**Problem**: Distributed systems have partial failures. Without fault tolerance, one failing service cascades to entire system.

**Solution**: Circuit breakers, timeouts, retries, and fallbacks.

**MicroProfile Fault Tolerance:**

```java
import org.eclipse.microprofile.faulttolerance.*;
// => MicroProfile Fault Tolerance: circuit breakers, retries, timeouts, fallbacks
import java.time.temporal.ChronoUnit;
// => Time units: MILLIS, SECONDS for timeout/delay configuration

@ApplicationScoped
// => Singleton bean: one client instance for app
public class ExternalServiceClient {
// => Client with fault tolerance: prevents cascading failures
    @Retry(
// => Retry annotation: automatically retries failed operations
        maxRetries = 3,
// => Max 3 retries: attempts operation up to 4 times total (initial + 3 retries)
        delay = 100,
// => Delay between retries: waits 100 milliseconds before retry
        delayUnit = ChronoUnit.MILLIS,
// => Time unit: delay specified in milliseconds
        jitter = 50
// => Jitter: random delay ±50ms to prevent thundering herd (all clients retrying simultaneously)
    )
    @Timeout(value = 2, unit = ChronoUnit.SECONDS)
// => Timeout: aborts operation after 2 seconds, throws TimeoutException
// => Prevents hanging: doesn't wait indefinitely for slow external service
    @CircuitBreaker(
// => Circuit breaker: stops calling failing service to allow recovery
        requestVolumeThreshold = 10,
// => Minimum requests: circuit opens after 10 requests (statistical significance)
        failureRatio = 0.5,
// => Failure threshold: opens circuit if 50% of requests fail
// => Circuit states: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing) → CLOSED
        delay = 10000
// => Recovery delay: waits 10 seconds before trying HALF_OPEN state
    )
    @Fallback(fallbackMethod = "getCachedData")
// => Fallback: calls getCachedData() if operation fails after retries/timeout/circuit open
    public String fetchData(String key) {
// => Protected method: all fault tolerance annotations apply
        // PROTECTED: Retry + Timeout + Circuit Breaker + Fallback
// => Execution order: Retry → Timeout → Circuit Breaker → Fallback
        return externalService.get(key);
// => External call: may fail, timeout, or be blocked by open circuit
// => Graceful degradation: fallback provides alternative result
    }

    public String getCachedData(String key) {
// => Fallback method: must have same signature as protected method
        // FALLBACK: Return cached data if available
        String cached = cache.get(key);
// => Cache lookup: provides stale data when external service unavailable
        return cached != null ? cached : "Service temporarily unavailable";
// => Degraded service: returns cache or default message instead of failing
// => User experience: partial functionality better than complete failure
    }

    @Bulkhead(value = 10, waitingTaskQueue = 20)
// => Bulkhead: limits concurrent executions to prevent resource exhaustion
// => Thread isolation: maximum 10 threads executing simultaneously
// => Queue: up to 20 requests waiting in queue
    public void processRequest(Request request) {
// => Rate-limited method: rejects requests when 10 active + 20 queued
        // RATE LIMIT: Max 10 concurrent, 20 queued
// => Rejection: throws BulkheadException when queue full (request 31+)
        // Prevents resource exhaustion
// => Protects service: prevents one slow operation from consuming all threads
    }
}
```

**Annotation effects:**

| Annotation        | Effect                        | Configuration              |
| ----------------- | ----------------------------- | -------------------------- |
| `@Retry`          | Retry failed operations       | max retries, delay, jitter |
| `@Timeout`        | Abort long-running operations | duration                   |
| `@CircuitBreaker` | Stop calling failing service  | failure threshold, delay   |
| `@Fallback`       | Provide alternative result    | fallback method            |
| `@Bulkhead`       | Limit concurrent executions   | max concurrent, queue size |

## Distributed Tracing - Request Flow Visibility

**Problem**: In microservices, single request spans multiple services. Troubleshooting requires correlating logs across services.

**Solution**: Distributed tracing propagates trace context across service boundaries.

```java
import io.opentelemetry.api.trace.*;
// => OpenTelemetry: vendor-neutral observability framework (tracing, metrics, logs)
import io.opentelemetry.context.Context;
// => Context propagation: carries trace context across threads and services

@ApplicationScoped
// => Singleton service: one instance for entire app
public class OrderService {
// => Service with distributed tracing: tracks requests across service boundaries
    @Inject
// => Injected tracer: OpenTelemetry tracer instance
    Tracer tracer;
// => Tracer: creates and manages spans for operations

    public Order createOrder(OrderRequest request) {
// => Parent operation: root span for order creation workflow
        // CREATE SPAN: Track operation
        Span span = tracer.spanBuilder("create-order")
// => Span builder: constructs span for operation tracking
// => Span name: identifies operation in trace visualization
            .setSpanKind(SpanKind.SERVER)
// => SERVER span: this service receives request (vs CLIENT for outgoing)
            .startSpan();
// => Starts span: begins timing and creates trace ID if none exists

        try (var scope = span.makeCurrent()) {
// => Try-with-resources: makes span current context (automatic cleanup)
// => Context propagation: child spans inherit trace ID
            span.setAttribute("order.id", request.getId());
// => Span attribute: adds metadata for filtering/search in trace UI
            span.setAttribute("order.items", request.getItems().size());
// => Business data: enriches trace with domain-specific details

            // NESTED OPERATION: Child span
            validateOrder(request);
// => Creates child span: validateOrder() creates nested span under current
// => Parent-child relationship: visualizes operation hierarchy

            // EXTERNAL CALL: Propagate trace context
            paymentService.processPayment(request);
// => Cross-service call: HTTP headers carry trace ID to payment service
// => Distributed trace: payment service creates child span with same trace ID

            span.setStatus(StatusCode.OK);
// => Success status: marks span as successful operation
            return saveOrder(request);
// => Returns order: span remains active until try block exits
        } catch (Exception e) {
// => Exception handling: records error in span
            span.recordException(e);
// => Records exception: captures stack trace in trace backend
            span.setStatus(StatusCode.ERROR, e.getMessage());
// => Error status: marks span as failed, shows error message
            throw e;
// => Propagates exception: re-throws after recording in trace
        } finally {
            span.end();
// => Ends span: stops timing, sends to trace collector (Jaeger, Zipkin)
// => Always executed: span finalized even if exception thrown
        }
    }

    private void validateOrder(OrderRequest request) {
// => Nested operation: creates child span under parent
        Span span = tracer.spanBuilder("validate-order")
// => Child span: inherits trace ID from parent context
            .startSpan();
// => Starts child: linked to parent span automatically
        try (var scope = span.makeCurrent()) {
// => Makes current: subsequent operations see this as parent
            // Validation logic
// => Business logic: duration tracked by span
        } finally {
            span.end();
// => Ends span: child span duration recorded
// => Trace visualization: shows validate-order nested under create-order
        }
    }
}
```

**Trace visualization:**

```
TraceID: abc123
├─ create-order (200ms)
   ├─ validate-order (10ms)
   ├─ payment-service.process (150ms)
   │  ├─ database.query (50ms)
   │  └─ external-api.call (100ms)
   └─ database.save (40ms)
```

## Twelve-Factor App Checklist

| Factor                 | Description                          | Implementation             |
| ---------------------- | ------------------------------------ | -------------------------- |
| I. Codebase            | One codebase, many deploys           | Git repository             |
| II. Dependencies       | Explicitly declared dependencies     | Maven/Gradle               |
| III. Config            | Store config in environment          | MicroProfile Config        |
| IV. Backing services   | Treat as attached resources          | Injected dependencies      |
| V. Build, release, run | Strict separation                    | CI/CD pipeline             |
| VI. Processes          | Stateless processes                  | Horizontal scaling         |
| VII. Port binding      | Export services via port             | Embedded server (Undertow) |
| VIII. Concurrency      | Scale out via process model          | Container orchestration    |
| IX. Disposability      | Fast startup, graceful shutdown      | Health checks              |
| X. Dev/prod parity     | Keep environments similar            | Containers                 |
| XI. Logs               | Treat logs as event streams          | stdout, log aggregation    |
| XII. Admin processes   | Run admin tasks as one-off processes | Management endpoints       |

## Guidelines

**When to use cloud-native patterns:**

- ✓ Microservices architectures
- ✓ Container deployments (Docker, Kubernetes)
- ✓ Distributed systems
- ✓ Production environments requiring high availability

**When to simplify:**

- ✗ Monolithic applications
- ✗ Single-server deployments
- ✗ Development/test environments
- ✗ Simple CRUD applications

**Best practices:**

1. **Implement all health checks**: Liveness, readiness, startup
2. **Expose key metrics**: RED method (rate, errors, duration)
3. **Externalize all config**: No hardcoded URLs, credentials
4. **Add fault tolerance**: Timeouts, retries, circuit breakers
5. **Enable distributed tracing**: Correlate requests across services

## Conclusion

Cloud-native Java requires:

- **Health checks**: Service readiness verification
- **Metrics**: Observable system state (RED method)
- **Configuration**: Externalized, environment-specific settings
- **Fault tolerance**: Graceful degradation under failure
- **Distributed tracing**: Request flow visibility

MicroProfile and Spring Boot provide standardized APIs for cloud-native patterns. Adopt incrementally: start with health checks and metrics (observability), then add configuration externalization (portability), and finally implement fault tolerance (resilience). Cloud-native patterns enable reliable, scalable, observable production systems.
