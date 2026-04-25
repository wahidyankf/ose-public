---
title: Spring Framework AOP
description: Aspect-Oriented Programming covering AOP concepts, @Aspect, pointcut expressions, advice types, AspectJ syntax, proxy-based AOP, @Transactional, security interception, logging/auditing, performance monitoring, and limitations
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - aop
  - aspects
  - cross-cutting-concerns
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - automation-over-manual
created: 2026-01-29
---

# Spring Framework AOP

**Understanding-oriented documentation** for Aspect-Oriented Programming with Spring Framework.

## Overview

Aspect-Oriented Programming (AOP) modularizes cross-cutting concerns such as logging, security, and transactions. Spring AOP uses proxy-based approach to intercept method calls and apply additional behavior.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [AOP Concepts](#aop-concepts)
- [@Aspect Annotation](#aspect-annotation)
- [Pointcut Expressions](#pointcut-expressions)
- [Advice Types](#advice-types)
- [Transaction Management](#transaction-management-with-aop)
- [Logging and Auditing](#logging-and-auditing-aspects)
- [Performance Monitoring](#performance-monitoring)
- [AOP Limitations](#aop-limitations)

### Core Terminology

- **Aspect**: Modular cross-cutting concern (e.g., logging aspect, transaction aspect)
- **Join Point**: Point in program execution (method call, exception throw)
- **Pointcut**: Expression selecting join points
- **Advice**: Action taken at join point (@Before, @After, @Around)
- **Weaving**: Linking aspects with application code

### Enable AOP

**Java Example**:

```java
@Configuration
@EnableAspectJAutoProxy
public class AopConfiguration {
  // AOP enabled
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableAspectJAutoProxy
class AopConfiguration {
  // AOP enabled
}
```

### Basic Aspect

**Java Example** (Logging Aspect):

```java
@Aspect
@Component
public class LoggingAspect {
  private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

  @Before("execution(* com.oseplatform.zakat.service.*.*(..))")
  public void logBefore(JoinPoint joinPoint) {
    logger.info("Entering method: {}", joinPoint.getSignature().toShortString());
  }

  @AfterReturning(
    pointcut = "execution(* com.oseplatform.zakat.service.*.*(..))",
    returning = "result"
  )
  public void logAfterReturning(JoinPoint joinPoint, Object result) {
    logger.info("Method returned: {} with result: {}",
      joinPoint.getSignature().toShortString(), result);
  }

  @AfterThrowing(
    pointcut = "execution(* com.oseplatform.zakat.service.*.*(..))",
    throwing = "exception"
  )
  public void logAfterThrowing(JoinPoint joinPoint, Exception exception) {
    logger.error("Method threw exception: {}",
      joinPoint.getSignature().toShortString(), exception);
  }
}
```

**Kotlin Example** (Logging Aspect):

```kotlin
@Aspect
@Component
class LoggingAspect {
  companion object {
    private val logger = LoggerFactory.getLogger(LoggingAspect::class.java)
  }

  @Before("execution(* com.oseplatform.zakat.service.*.*(..))")
  fun logBefore(joinPoint: JoinPoint) {
    logger.info("Entering method: {}", joinPoint.signature.toShortString())
  }

  @AfterReturning(
    pointcut = "execution(* com.oseplatform.zakat.service.*.*(..))",
    returning = "result"
  )
  fun logAfterReturning(joinPoint: JoinPoint, result: Any?) {
    logger.info("Method returned: {} with result: {}",
      joinPoint.signature.toShortString(), result)
  }

  @AfterThrowing(
    pointcut = "execution(* com.oseplatform.zakat.service.*.*(..))",
    throwing = "exception"
  )
  fun logAfterThrowing(joinPoint: JoinPoint, exception: Exception) {
    logger.error("Method threw exception: {}",
      joinPoint.signature.toShortString(), exception)
  }
}
```

### Execution Pointcuts

**Java Example**:

```java
@Aspect
@Component
public class PointcutExamples {

  // All methods in service package
  @Pointcut("execution(* com.oseplatform.zakat.service.*.*(..))")
  public void serviceMethods() {}

  // All public methods
  @Pointcut("execution(public * *(..))")
  public void publicMethods() {}

  // Methods returning ZakatCalculationResponse
  @Pointcut("execution(com.oseplatform.zakat.dto.ZakatCalculationResponse *(..))")
  public void zakatCalculationMethods() {}

  // Methods with @Transactional annotation
  @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
  public void transactionalMethods() {}

  // Combine pointcuts
  @Around("serviceMethods() && transactionalMethods()")
  public Object aroundServiceTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
    // Advice logic
    return joinPoint.proceed();
  }
}
```

**Kotlin Example**:

```kotlin
@Aspect
@Component
class PointcutExamples {

  // All methods in service package
  @Pointcut("execution(* com.oseplatform.zakat.service.*.*(..))")
  fun serviceMethods() {}

  // All public methods
  @Pointcut("execution(public * *(..))")
  fun publicMethods() {}

  // Methods returning ZakatCalculationResponse
  @Pointcut("execution(com.oseplatform.zakat.dto.ZakatCalculationResponse *(..))")
  fun zakatCalculationMethods() {}

  // Methods with @Transactional annotation
  @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
  fun transactionalMethods() {}

  // Combine pointcuts
  @Around("serviceMethods() && transactionalMethods()")
  fun aroundServiceTransaction(joinPoint: ProceedingJoinPoint): Any? {
    // Advice logic
    return joinPoint.proceed()
  }
}
```

### @Before Advice

**Java Example** (Validation):

```java
@Aspect
@Component
public class ValidationAspect {

  @Before("execution(* com.oseplatform.donation.service.*.processDonation(..))")
  public void validateDonation(JoinPoint joinPoint) {
    Object[] args = joinPoint.getArgs();
    if (args.length > 0 && args[0] instanceof CreateDonationRequest request) {
      if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
        throw new InvalidDonationException("Donation amount must be positive");
      }
    }
  }
}
```

### @Around Advice

**Java Example** (Performance Monitoring):

```java
@Aspect
@Component
public class PerformanceMonitoringAspect {
  private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

  @Around("execution(* com.oseplatform.murabaha.service.*.*(..))")
  public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
    String methodName = joinPoint.getSignature().toShortString();
    long startTime = System.currentTimeMillis();

    try {
      Object result = joinPoint.proceed();
      long duration = System.currentTimeMillis() - startTime;

      logger.info("Method {} executed in {}ms", methodName, duration);

      if (duration > 5000) {
        logger.warn("Slow method execution: {} took {}ms", methodName, duration);
      }

      return result;
    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;
      logger.error("Method {} failed after {}ms", methodName, duration, e);
      throw e;
    }
  }
}
```

**Kotlin Example** (Performance Monitoring):

```kotlin
@Aspect
@Component
class PerformanceMonitoringAspect {
  companion object {
    private val logger = LoggerFactory.getLogger(PerformanceMonitoringAspect::class.java)
  }

  @Around("execution(* com.oseplatform.murabaha.service.*.*(..))")
  fun monitorPerformance(joinPoint: ProceedingJoinPoint): Any? {
    val methodName = joinPoint.signature.toShortString()
    val startTime = System.currentTimeMillis()

    return try {
      val result = joinPoint.proceed()
      val duration = System.currentTimeMillis() - startTime

      logger.info("Method {} executed in {}ms", methodName, duration)

      if (duration > 5000) {
        logger.warn("Slow method execution: {} took {}ms", methodName, duration)
      }

      result
    } catch (e: Exception) {
      val duration = System.currentTimeMillis() - startTime
      logger.error("Method {} failed after {}ms", methodName, duration, e)
      throw e
    }
  }
}
```

## Transaction Management with AOP

**Java Example**:

```java
@Service
public class MurabahaContractService {

  @Transactional
  public MurabahaContractResponse createContract(CreateContractRequest request) {
    // @Transactional intercepted by TransactionInterceptor (AOP-based)
    // Starts transaction before method
    // Commits on success, rolls back on exception
  }
}
```

## Logging and Auditing Aspects

**Java Example** (Audit Logging):

```java
@Aspect
@Component
public class AuditAspect {
  private final AuditLogRepository auditLogRepository;

  public AuditAspect(AuditLogRepository auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  @AfterReturning(
    pointcut = "@annotation(auditable)",
    returning = "result"
  )
  public void logAuditEvent(JoinPoint joinPoint, Auditable auditable, Object result) {
    AuditLog auditLog = new AuditLog(
      auditable.action(),
      joinPoint.getSignature().toShortString(),
      getCurrentUserId(),
      Instant.now(),
      result
    );

    auditLogRepository.save(auditLog);
  }

  private String getCurrentUserId() {
    // Get from SecurityContext
    return "current-user-id";
  }
}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
  String action();
}

// Usage
@Service
public class DonationService {

  @Auditable(action = "DONATION_CREATED")
  public DonationResponse createDonation(CreateDonationRequest request) {
    // Method implementation
  }
}
```

## Performance Monitoring

**Java Example** (Metrics Collection):

```java
@Aspect
@Component
public class MetricsAspect {
  private final MeterRegistry meterRegistry;

  public MetricsAspect(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  @Around("execution(* com.oseplatform.zakat.service.*.*(..))")
  public Object recordMetrics(ProceedingJoinPoint joinPoint) throws Throwable {
    String methodName = joinPoint.getSignature().toShortString();
    Timer.Sample sample = Timer.start(meterRegistry);

    try {
      Object result = joinPoint.proceed();
      sample.stop(Timer.builder("method.execution.time")
        .tag("method", methodName)
        .tag("status", "success")
        .register(meterRegistry));
      return result;
    } catch (Exception e) {
      sample.stop(Timer.builder("method.execution.time")
        .tag("method", methodName)
        .tag("status", "error")
        .register(meterRegistry));
      throw e;
    }
  }
}
```

### Self-Invocation Problem

**Problem**: AOP proxies don't intercept self-invocation.

**Java Example** (Problem):

```java
@Service
public class ZakatCalculationService {

  public void calculate(BigDecimal wealth) {
    // This calls saveCalculation directly, bypassing proxy
    this.saveCalculation(wealth);  // @Transactional ignored!
  }

  @Transactional
  public void saveCalculation(BigDecimal wealth) {
    // Transaction not started
  }
}
```

**Solution**: Extract to separate bean or make top-level method transactional.

### Only Method Execution Join Points

Spring AOP only supports method execution join points. Cannot intercept field access, constructor calls, or static method calls.

### Proxy-Based Limitations

- JDK dynamic proxies: Requires interface
- CGLIB proxies: Cannot proxy final classes or methods
- Performance overhead of proxy creation

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Idioms](idioms.md)** - Framework patterns
- **[Data Access](data-access.md)** - Transaction management

## See Also

**OSE Explanation Foundation**:

- [Java Patterns](../../../programming-languages/java/coding-standards.md) - Java baseline patterns
- [Spring Framework Idioms](./idioms.md) - Spring patterns
- [Spring Framework Best Practices](./best-practices.md) - AOP best practices
- [Spring Framework Security](./security.md) - Security aspects

**Spring Boot Extension**:

- [Spring Boot AOP](../jvm-spring-boot/aop.md) - Auto-configured aspects

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
