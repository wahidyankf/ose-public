---
title: "Cross Cutting Concerns"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000051
description: "Manual scattered logging/auditing code to AOP aspects progression showing centralized cross-cutting concern implementation for production systems"
tags: ["spring", "in-the-field", "production", "aop", "logging", "auditing", "monitoring"]
---

## Why Centralized Cross-Cutting Concerns Matter

Production applications require consistent logging, auditing, performance monitoring, and error handling across all layers. Manual implementation scatters these concerns throughout codebase—every service method duplicates logging setup, audit code, timer logic, and exception handling. In production zakat management systems processing thousands of financial transactions requiring regulatory compliance, Spring AOP's centralized aspects enable consistent audit trails, performance metrics, and security logging across 50+ service methods without code duplication—reducing maintenance burden from 200+ scattered locations to 5 reusable aspects while ensuring no business logic method misses critical logging or auditing.

## Manual Scattered Cross-Cutting Concerns

Manual implementation duplicates logging, auditing, and monitoring across every method:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;

@Service
public class ZakatServiceManual {

    private static final Logger logger = LoggerFactory.getLogger(ZakatServiceManual.class);

    private final ZakatRepository zakatRepository;
    private final AuditLogRepository auditLogRepository;
    private final MetricsService metricsService;

    public double calculateZakat(String accountId, double nisab) {
        // => PROBLEM: Logging boilerplate duplicated across methods
        logger.info("calculateZakat called: accountId={}, nisab={}", accountId, nisab);
        long startTime = System.currentTimeMillis();

        try {
            // => PROBLEM: Input validation duplicated
            if (accountId == null || accountId.isBlank()) {
                throw new IllegalArgumentException("Account ID is required");
            }

            // => ACTUAL BUSINESS LOGIC (buried in cross-cutting concerns)
            double wealth = getAccountWealth(accountId);
            double zakat = wealth >= nisab ? wealth * 0.025 : 0.0;

            // => PROBLEM: Success logging duplicated
            long duration = System.currentTimeMillis() - startTime;
            logger.info("calculateZakat succeeded: accountId={}, result={}, duration={}ms",
                accountId, zakat, duration);

            // => PROBLEM: Metrics recording duplicated
            metricsService.recordMethodExecution("calculateZakat", duration, true);

            return zakat;

        } catch (Exception e) {
            // => PROBLEM: Exception logging duplicated
            long duration = System.currentTimeMillis() - startTime;
            logger.error("calculateZakat failed: accountId={}, error={}, duration={}ms",
                accountId, e.getMessage(), duration, e);

            // => PROBLEM: Metrics recording duplicated
            metricsService.recordMethodExecution("calculateZakat", duration, false);

            throw e;
        }
    }

    public void recordPayment(String accountId, double amount) {
        // => PROBLEM: Exact same logging pattern as calculateZakat
        logger.info("recordPayment called: accountId={}, amount={}", accountId, amount);
        long startTime = System.currentTimeMillis();

        try {
            // => PROBLEM: Same validation pattern
            if (accountId == null || accountId.isBlank()) {
                throw new IllegalArgumentException("Account ID is required");
            }
            if (amount <= 0) {
                throw new IllegalArgumentException("Amount must be positive");
            }

            // => ACTUAL BUSINESS LOGIC
            ZakatPayment payment = new ZakatPayment(accountId, amount, LocalDateTime.now());
            zakatRepository.save(payment);

            // => PROBLEM: Audit logging duplicated across all state-changing methods
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";

            AuditLog log = new AuditLog();
            log.setAction("RECORD_PAYMENT");
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            log.setDetails(String.format("Account: %s, Amount: %.2f", accountId, amount));
            auditLogRepository.save(log);

            // => PROBLEM: Same success logging pattern
            long duration = System.currentTimeMillis() - startTime;
            logger.info("recordPayment succeeded: accountId={}, amount={}, duration={}ms",
                accountId, amount, duration);

            // => PROBLEM: Same metrics pattern
            metricsService.recordMethodExecution("recordPayment", duration, true);

        } catch (Exception e) {
            // => PROBLEM: Exact same exception handling as calculateZakat
            long duration = System.currentTimeMillis() - startTime;
            logger.error("recordPayment failed: accountId={}, error={}, duration={}ms",
                accountId, e.getMessage(), duration, e);

            metricsService.recordMethodExecution("recordPayment", duration, false);

            throw e;
        }
    }

    public void deleteAccount(String accountId) {
        // => PROBLEM: All methods have identical logging/auditing/metrics scaffolding
        logger.info("deleteAccount called: accountId={}", accountId);
        long startTime = System.currentTimeMillis();

        try {
            if (accountId == null || accountId.isBlank()) {
                throw new IllegalArgumentException("Account ID is required");
            }

            // => ACTUAL BUSINESS LOGIC (3 lines)
            zakatRepository.deleteById(accountId);

            // => PROBLEM: 20+ lines of cross-cutting concern code for 3 lines of business logic

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";

            AuditLog log = new AuditLog();
            log.setAction("DELETE_ACCOUNT");
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            log.setDetails(String.format("Account: %s", accountId));
            auditLogRepository.save(log);

            long duration = System.currentTimeMillis() - startTime;
            logger.info("deleteAccount succeeded: accountId={}, duration={}ms", accountId, duration);

            metricsService.recordMethodExecution("deleteAccount", duration, true);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("deleteAccount failed: accountId={}, error={}, duration={}ms",
                accountId, e.getMessage(), duration, e);

            metricsService.recordMethodExecution("deleteAccount", duration, false);

            throw e;
        }
    }
}
```

**Problems with Manual Approach:**

- **Code duplication**: Logging, auditing, metrics duplicated across 50+ service methods
- **Maintenance burden**: Updating logging format requires changing 50+ methods
- **Inconsistency risk**: Easy to forget audit logging in some methods
- **Business logic obscured**: 3 lines of business logic buried in 20+ lines of scaffolding
- **Error-prone**: Copy-paste errors lead to incorrect method names in logs
- **Testing difficulty**: Must test cross-cutting concerns in every method test

## AOP Aspects for Cross-Cutting Concerns

Centralize logging, auditing, and monitoring in reusable aspects:

```java
import org.aspectj.lang.*;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

// => ASPECT 1: Logging Aspect
// => Centralizes logging for all service methods
@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    // => Pointcut: all methods in service package
    @Pointcut("execution(* com.example.service..*(..))")
    public void serviceMethods() {}

    // => Log method entry with parameters
    @Before("serviceMethods()")
    public void logMethodEntry(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        // => getArgs(): method arguments
        Object[] args = joinPoint.getArgs();

        // => Parameterized logging: efficient, secure (prevents log injection)
        logger.info("{} called: args={}", methodName, args);
    }

    // => Log method success with return value
    @AfterReturning(pointcut = "serviceMethods()", returning = "result")
    public void logMethodSuccess(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();

        // => Log return value (avoid sensitive data like passwords)
        logger.info("{} succeeded: result={}", methodName, result);
    }

    // => Log method failure with exception
    @AfterThrowing(pointcut = "serviceMethods()", throwing = "error")
    public void logMethodFailure(JoinPoint joinPoint, Throwable error) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        // => Error level: includes exception stacktrace
        logger.error("{} failed: args={}, error={}",
            methodName, args, error.getMessage(), error);
    }
}

// => ASPECT 2: Performance Monitoring Aspect
// => Centralizes execution time tracking and slow method detection
@Aspect
@Component
public class PerformanceMonitoringAspect {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

    private final MeterRegistry meterRegistry;

    public PerformanceMonitoringAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    // => Around advice: wrap method execution to measure time
    @Around("execution(* com.example.service..*(..))")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();

        // => Start timer: Micrometer Timer.Sample
        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            // => Execute actual method
            Object result = joinPoint.proceed();

            // => Record successful execution duration
            sample.stop(Timer.builder("method.execution")
                .tag("method", methodName)
                .tag("status", "success")
                .description("Method execution time")
                .register(meterRegistry));

            return result;

        } catch (Throwable e) {
            // => Record failed execution duration
            sample.stop(Timer.builder("method.execution")
                .tag("method", methodName)
                .tag("status", "failure")
                .tag("exception", e.getClass().getSimpleName())
                .register(meterRegistry));

            throw e;
        }
    }

    // => Detect slow methods (> 1 second)
    @Around("execution(* com.example.service..*(..))")
    public Object detectSlowMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        Object result = joinPoint.proceed();

        long duration = System.currentTimeMillis() - startTime;

        // => Warn if method exceeds 1 second
        if (duration > 1000) {
            String methodName = joinPoint.getSignature().toShortString();
            Object[] args = joinPoint.getArgs();

            logger.warn("SLOW METHOD DETECTED: {} took {}ms with args={}",
                methodName, duration, args);
        }

        return result;
    }
}

// => ASPECT 3: Audit Logging Aspect
// => Centralizes audit trail for state-changing operations
@Aspect
@Component
@Order(1)  // => Execute before other aspects (high priority)
public class AuditLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(AuditLoggingAspect.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLoggingAspect(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    // => Pointcut: state-changing methods (create, update, delete, record)
    @Pointcut("execution(* com.example.service..create*(..)) || " +
              "execution(* com.example.service..update*(..)) || " +
              "execution(* com.example.service..delete*(..)) || " +
              "execution(* com.example.service..record*(..))")
    public void stateChangingMethods() {}

    // => Audit successful state changes
    @AfterReturning(pointcut = "stateChangingMethods()", returning = "result")
    public void auditStateChange(JoinPoint joinPoint, Object result) {
        try {
            String methodName = joinPoint.getSignature().getName();
            Object[] args = joinPoint.getArgs();

            // => Get authenticated user from SecurityContext
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";

            // => Serialize arguments to JSON for audit trail
            String argsJson = objectMapper.writeValueAsString(args);

            // => Create audit log entry
            AuditLog log = new AuditLog();
            log.setAction(methodName.toUpperCase());
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            log.setDetails(argsJson);
            log.setIpAddress(getCurrentIpAddress());

            // => Persist audit log
            auditLogRepository.save(log);

            logger.info("AUDIT: {} performed {} with args={}",
                username, methodName, argsJson);

        } catch (Exception e) {
            // => Audit failure should not break business logic
            logger.error("Audit logging failed: {}", e.getMessage(), e);
        }
    }

    // => Audit failed state changes (security-relevant)
    @AfterThrowing(pointcut = "stateChangingMethods()", throwing = "error")
    public void auditFailedStateChange(JoinPoint joinPoint, Throwable error) {
        try {
            String methodName = joinPoint.getSignature().getName();
            Object[] args = joinPoint.getArgs();

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";

            String argsJson = objectMapper.writeValueAsString(args);

            AuditLog log = new AuditLog();
            log.setAction(methodName.toUpperCase() + "_FAILED");
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            log.setDetails(String.format("Args: %s, Error: %s", argsJson, error.getMessage()));
            log.setIpAddress(getCurrentIpAddress());

            auditLogRepository.save(log);

            logger.warn("AUDIT FAILURE: {} attempted {} with args={}, error={}",
                username, methodName, argsJson, error.getMessage());

        } catch (Exception e) {
            logger.error("Audit logging failed: {}", e.getMessage(), e);
        }
    }

    private String getCurrentIpAddress() {
        // => Extract IP from RequestContextHolder (Spring MVC)
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attrs.getRequest();
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}

// => ASPECT 4: Exception Logging Aspect
// => Centralizes exception logging with context
@Aspect
@Component
public class ExceptionLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ExceptionLoggingAspect.class);

    // => Log all service exceptions with full context
    @AfterThrowing(pointcut = "execution(* com.example.service..*(..))", throwing = "error")
    public void logException(JoinPoint joinPoint, Throwable error) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        // => Structured logging: class, method, args, exception
        logger.error("Exception in {}.{}: args={}, exception={}",
            className, methodName, args, error.getClass().getSimpleName(), error);

        // => Categorize exceptions for monitoring
        if (error instanceof IllegalArgumentException) {
            // => Client error: invalid input
            logger.warn("Client validation error in {}.{}", className, methodName);
        } else if (error instanceof DataAccessException) {
            // => Database error: infrastructure issue
            logger.error("Database error in {}.{}", className, methodName);
        } else if (error instanceof SecurityException) {
            // => Security error: potential attack
            logger.error("SECURITY VIOLATION in {}.{}", className, methodName);
        }
    }
}

// => Clean service: business logic only, no cross-cutting concerns
@Service
public class ZakatService {

    private final ZakatRepository zakatRepository;

    public ZakatService(ZakatRepository zakatRepository) {
        this.zakatRepository = zakatRepository;
    }

    // => PURE BUSINESS LOGIC
    // => No logging, no auditing, no metrics, no exception handling
    public double calculateZakat(String accountId, double nisab) {
        // => Validation
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException("Account ID is required");
        }

        // => Business logic
        double wealth = getAccountWealth(accountId);
        return wealth >= nisab ? wealth * 0.025 : 0.0;
    }

    // => PURE BUSINESS LOGIC
    public void recordPayment(String accountId, double amount) {
        // => Validation
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException("Account ID is required");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        // => Business logic
        ZakatPayment payment = new ZakatPayment(accountId, amount, LocalDateTime.now());
        zakatRepository.save(payment);
    }

    // => PURE BUSINESS LOGIC
    public void deleteAccount(String accountId) {
        // => Validation
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException("Account ID is required");
        }

        // => Business logic
        zakatRepository.deleteById(accountId);
    }

    private double getAccountWealth(String accountId) {
        return zakatRepository.getWealth(accountId);
    }
}
```

**Benefits of AOP Approach:**

- **No code duplication**: Logging/auditing/metrics defined once, applied everywhere
- **Clean business logic**: Service methods contain only validation and business logic
- **Consistent behavior**: All service methods automatically get same logging/auditing
- **Easy maintenance**: Update logging format in one place (LoggingAspect)
- **No forgotten logging**: Pointcut ensures ALL service methods are logged
- **Separation of concerns**: Cross-cutting concerns isolated in aspects

## Cross-Cutting Concerns Architecture Diagram

```mermaid
graph TB
    accTitle: Cross-Cutting Concerns Architecture Diagram
    accDescr: Graph with 12 nodes and 15 connections. Nodes: Controller, Service Method Business Logic Only, LoggingAspect, Performance MonitoringAspect, AuditLoggingAspect, ExceptionLogging Aspect, Success?, Return Result, Throw Exception, SLF4J Logger, Micrometer Metrics, Audit Log Database. Connections: Controller to Service Method Business Logic Only (Call method), LoggingAspect to Service Method Business Logic Only (@Before), LoggingAspect to Service Method Business Logic Only (@AfterReturning), LoggingAspect to Service Method Business Logic Only (@AfterThrowing), Performance MonitoringAspect to Service Method Business Logic Only (@Around), AuditLoggingAspect to Service Method Business Logic Only (@AfterReturning), ExceptionLogging Aspect to Service Method Business Logic Only (@AfterThrowing), LoggingAspect to Performance MonitoringAspect, Service Method Business Logic Only to Success?, Success? to Return Result (Yes), Success? to Throw Exception (No), LoggingAspect to SLF4J Logger, and 3 more.
    A[Controller] -->|Call method| B[Service Method<br/>Business Logic Only]

    C[LoggingAspect] -.->|@Before| B
    C -.->|@AfterReturning| B
    C -.->|@AfterThrowing| B

    D[Performance<br/>MonitoringAspect] -.->|@Around| B
    E[AuditLoggingAspect] -.->|@AfterReturning| B
    F[ExceptionLogging<br/>Aspect] -.->|@AfterThrowing| B

    C --- D

    B --> G{Success?}
    G -->|Yes| H[Return Result]
    G -->|No| I[Throw Exception]

    C --> J[SLF4J Logger]
    D --> K[Micrometer Metrics]
    E --> L[Audit Log Database]
    F --> J

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:3px
    class B pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class C pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class D pal-DE8F05
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    class F pal-CA9161
    classDef pal-029E73-2 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class J pal-029E73-2
    class K pal-029E73-2
    class L pal-029E73-2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Patterns

### Security Auditing Aspect for Sensitive Operations

```java
@Aspect
@Component
@Order(1)  // => Execute first (before other aspects)
public class SecurityAuditingAspect {

    private static final Logger logger = LoggerFactory.getLogger(SecurityAuditingAspect.class);

    private final SecurityAuditRepository securityAuditRepository;

    // => Custom annotation: marks methods requiring security audit
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface SecurityAudit {
        String operation();
        boolean includeResult() default false;
    }

    // => Audit methods annotated with @SecurityAudit
    @Around("@annotation(securityAudit)")
    public Object auditSecurityOperation(ProceedingJoinPoint joinPoint,
                                         SecurityAudit securityAudit) throws Throwable {

        // => Get security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "ANONYMOUS";
        String ipAddress = getCurrentIpAddress();

        // => Before execution: log attempt
        logger.info("SECURITY AUDIT: {} attempting {} from IP {}",
            username, securityAudit.operation(), ipAddress);

        long startTime = System.currentTimeMillis();
        Object result = null;

        try {
            // => Execute method
            result = joinPoint.proceed();

            // => Success: log security audit
            long duration = System.currentTimeMillis() - startTime;

            SecurityAuditLog log = new SecurityAuditLog();
            log.setUsername(username);
            log.setOperation(securityAudit.operation());
            log.setIpAddress(ipAddress);
            log.setTimestamp(LocalDateTime.now());
            log.setStatus("SUCCESS");
            log.setDuration(duration);

            if (securityAudit.includeResult() && result != null) {
                log.setResult(result.toString());
            }

            securityAuditRepository.save(log);

            return result;

        } catch (Throwable e) {
            // => Failure: log security audit with error
            long duration = System.currentTimeMillis() - startTime;

            SecurityAuditLog log = new SecurityAuditLog();
            log.setUsername(username);
            log.setOperation(securityAudit.operation());
            log.setIpAddress(ipAddress);
            log.setTimestamp(LocalDateTime.now());
            log.setStatus("FAILURE");
            log.setDuration(duration);
            log.setError(e.getMessage());

            securityAuditRepository.save(log);

            // => Log security failure at ERROR level
            logger.error("SECURITY AUDIT FAILURE: {} failed {} from IP {}: {}",
                username, securityAudit.operation(), ipAddress, e.getMessage());

            throw e;
        }
    }
}

// => Service method: declarative security auditing
@Service
public class AdminService {

    // => Automatically audited: no manual audit code
    @SecurityAudit(operation = "DELETE_ACCOUNT")
    public void deleteAccount(String accountId) {
        // => Pure business logic
        accountRepository.deleteById(accountId);
    }

    // => Automatically audited with result logging
    @SecurityAudit(operation = "EXPORT_FINANCIAL_DATA", includeResult = true)
    public String exportFinancialData(String accountId) {
        return financialDataService.exportToJson(accountId);
    }
}
```

### Transaction Logging Aspect

```java
@Aspect
@Component
public class TransactionLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(TransactionLoggingAspect.class);

    // => Log all @Transactional method boundaries
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object logTransactionBoundaries(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();

        // => Log transaction start
        logger.debug("TX START: {}", methodName);

        try {
            Object result = joinPoint.proceed();

            // => Log transaction commit
            logger.debug("TX COMMIT: {}", methodName);

            return result;

        } catch (Throwable e) {
            // => Log transaction rollback
            logger.warn("TX ROLLBACK: {} - {}", methodName, e.getMessage());

            throw e;
        }
    }
}
```

### Rate Limiting Aspect

```java
@Aspect
@Component
public class RateLimitingAspect {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingAspect.class);

    private final RateLimiter rateLimiter;

    public RateLimitingAspect(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    // => Custom annotation: defines rate limit
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RateLimit {
        int requestsPerMinute();
    }

    // => Enforce rate limit before method execution
    @Before("@annotation(rateLimit)")
    public void enforceRateLimit(JoinPoint joinPoint, RateLimit rateLimit) {
        // => Get user from SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "ANONYMOUS";

        // => Check rate limit
        String key = username + ":" + joinPoint.getSignature().getName();
        int limit = rateLimit.requestsPerMinute();

        if (!rateLimiter.tryAcquire(key, limit, 60)) {
            // => Rate limit exceeded
            logger.warn("RATE LIMIT EXCEEDED: {} for method {}",
                username, joinPoint.getSignature().getName());

            throw new RateLimitExceededException(
                "Rate limit exceeded: " + limit + " requests per minute");
        }
    }
}

// => Service method: declarative rate limiting
@Service
public class ZakatService {

    // => Maximum 10 calculations per minute per user
    @RateLimit(requestsPerMinute = 10)
    public double calculateZakat(String accountId, double nisab) {
        return zakatCalculationEngine.calculate(accountId, nisab);
    }
}
```

### Input Sanitization Aspect

```java
@Aspect
@Component
@Order(0)  // => Execute first (before business logic)
public class InputSanitizationAspect {

    private static final Logger logger = LoggerFactory.getLogger(InputSanitizationAspect.class);

    // => Sanitize all string arguments to service methods
    @Around("execution(* com.example.service..*(..))")
    public Object sanitizeInputs(ProceedingJoinPoint joinPoint) throws Throwable {
        Object[] args = joinPoint.getArgs();

        // => Process each argument
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof String) {
                String original = (String) args[i];

                // => Sanitize: remove SQL injection patterns
                String sanitized = sanitizeSql(original);

                // => Sanitize: remove XSS patterns
                sanitized = sanitizeXss(sanitized);

                // => Log if changed
                if (!original.equals(sanitized)) {
                    logger.warn("INPUT SANITIZED in {}: '{}' -> '{}'",
                        joinPoint.getSignature().getName(), original, sanitized);
                }

                args[i] = sanitized;
            }
        }

        // => Proceed with sanitized arguments
        return joinPoint.proceed(args);
    }

    private String sanitizeSql(String input) {
        // => Remove SQL injection patterns
        // => Production: use parameterized queries, this is defense in depth
        return input.replaceAll("('|(--)|;|\\*|\\b(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP)\\b)",
            "");
    }

    private String sanitizeXss(String input) {
        // => Remove XSS patterns
        return input.replaceAll("<script>|</script>|javascript:", "");
    }
}
```

## Trade-offs and When to Use

| Approach              | Code Duplication | Maintainability | Consistency | Testing Complexity | Production Ready |
| --------------------- | ---------------- | --------------- | ----------- | ------------------ | ---------------- |
| Manual Scattered Code | Very High        | Very Low        | Low         | High               | No               |
| AOP Aspects           | None             | High            | Very High   | Low                | Yes              |

**When to Use Manual Scattered Code:**

- Prototype/proof-of-concept code
- Single method with unique requirements
- Learning exercise (understanding fundamentals)
- Temporary code (will be replaced)

**When to Use AOP Aspects:**

- **Production applications** (default choice)
- Multiple methods sharing same cross-cutting concern
- Consistent logging/auditing/monitoring required
- Regulatory compliance (audit trails)
- Performance monitoring and alerting
- Security enforcement across layers
- Maintenance burden reduction

## Best Practices

**1. Order Aspects with @Order for Predictable Execution**

```java
@Aspect
@Component
@Order(1)  // Executes first
public class SecurityAspect { }

@Aspect
@Component
@Order(2)  // Executes second
public class AuditAspect { }

@Aspect
@Component
@Order(3)  // Executes third
public class LoggingAspect { }
```

**2. Use Specific Pointcuts to Avoid Performance Impact**

```java
// ❌ Too broad: matches ALL methods in application
@Pointcut("execution(* *(..))")

// ✅ Specific: matches only service layer
@Pointcut("execution(* com.example.service..*(..))")
```

**3. Handle Aspect Failures Gracefully**

```java
@AfterReturning("serviceMethods()")
public void auditMethod(JoinPoint jp) {
    try {
        // Audit logic
        auditLogRepository.save(log);
    } catch (Exception e) {
        // ✅ Log error but don't break business logic
        logger.error("Audit failed: {}", e.getMessage());
    }
}
```

**4. Avoid Sensitive Data in Logs**

```java
@Before("serviceMethods()")
public void logMethod(JoinPoint jp) {
    Object[] args = jp.getArgs();

    // ❌ Logs password
    logger.info("Args: {}", args);

    // ✅ Filter sensitive fields
    logger.info("Args: {}", sanitizeArgs(args));
}
```

**5. Use Metrics for Production Observability**

```java
@Around("serviceMethods()")
public Object recordMetrics(ProceedingJoinPoint jp) throws Throwable {
    Timer.Sample sample = Timer.start(meterRegistry);

    try {
        Object result = jp.proceed();

        // Record success metric
        sample.stop(Timer.builder("method.execution")
            .tag("status", "success")
            .register(meterRegistry));

        return result;
    } catch (Throwable e) {
        // Record failure metric
        sample.stop(Timer.builder("method.execution")
            .tag("status", "failure")
            .register(meterRegistry));

        throw e;
    }
}
```

## See Also

- [AOP Basics](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/aop-basics) - @Aspect fundamentals and pointcut expressions
- [Transaction Management](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/transaction-management) - @Transactional AOP implementation
- [Spring Security Basics](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-security-basics) - Security filter chain (AOP-based)
- [Exception Handling](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/exception-handling) - @ControllerAdvice patterns
- [Caching](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/caching) - @Cacheable AOP implementation
