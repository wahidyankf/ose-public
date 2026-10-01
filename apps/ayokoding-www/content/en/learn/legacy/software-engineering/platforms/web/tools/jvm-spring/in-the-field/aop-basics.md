---
title: "Aop Basics"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000050
description: "Manual Java dynamic proxies to Spring @Aspect to pointcuts to advice types progression showing declarative cross-cutting concern implementation"
tags: ["spring", "in-the-field", "production", "aop", "aspect", "proxy"]
---

## Why AOP Matters

Production applications have cross-cutting concerns—functionality that spans multiple layers and classes like logging, security checks, transaction management, and performance monitoring. Manual implementation scatters this logic across codebase, violating DRY principle and making maintenance difficult. In production systems handling thousands of zakat transactions requiring audit trails, performance metrics, and security validation, Spring AOP's @Aspect and pointcut expressions enable declarative cross-cutting concerns—centralizing logging, auditing, and monitoring without modifying business logic, reducing code duplication from 50+ scattered locations to single reusable aspects.

## Manual Dynamic Proxy Baseline

Java provides dynamic proxies for intercepting method calls:

```java
import java.lang.reflect.*;
import java.time.LocalDateTime;

// => Interface: business logic contract
public interface ZakatCalculationService {
    double calculateZakat(String accountId, double nisab);
    void recordPayment(String accountId, double amount);
}

// => Implementation: actual business logic
public class ZakatCalculationServiceImpl implements ZakatCalculationService {

    @Override
    public double calculateZakat(String accountId, double nisab) {
        // => Business logic: calculate 2.5% zakat
        double wealth = getAccountWealth(accountId);
        if (wealth < nisab) {
            return 0.0;
        }
        return wealth * 0.025;
    }

    @Override
    public void recordPayment(String accountId, double amount) {
        // => Business logic: record payment
        persistPayment(accountId, amount, LocalDateTime.now());
    }

    private double getAccountWealth(String accountId) {
        // => Database query
        return 100000.0;
    }

    private void persistPayment(String accountId, double amount, LocalDateTime timestamp) {
        // => Database insert
        System.out.println("Payment recorded: " + accountId + " = " + amount);
    }
}

// => Manual invocation handler: intercepts method calls
public class LoggingInvocationHandler implements InvocationHandler {

    // => Wrapped target object
    private final Object target;

    public LoggingInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // => BEFORE advice: log method entry
        System.out.println("[LOG] Entering method: " + method.getName());
        System.out.println("[LOG] Arguments: " + java.util.Arrays.toString(args));
        long startTime = System.currentTimeMillis();

        Object result = null;
        try {
            // => Invoke actual method on target object
            result = method.invoke(target, args);

            // => AFTER RETURNING advice: log successful execution
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("[LOG] Method " + method.getName() + " succeeded");
            System.out.println("[LOG] Execution time: " + duration + "ms");
            System.out.println("[LOG] Return value: " + result);

            return result;

        } catch (InvocationTargetException e) {
            // => AFTER THROWING advice: log exception
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("[ERROR] Method " + method.getName() + " failed");
            System.out.println("[ERROR] Execution time: " + duration + "ms");
            System.out.println("[ERROR] Exception: " + e.getCause().getMessage());

            // => Re-throw original exception
            throw e.getCause();
        }
    }
}

// => Manual proxy creation
public class ProxyFactory {

    public static ZakatCalculationService createLoggingProxy(ZakatCalculationService target) {
        // => Create proxy instance
        // => Proxy implements ZakatCalculationService interface
        // => All method calls intercepted by LoggingInvocationHandler
        return (ZakatCalculationService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),  // => ClassLoader
            new Class<?>[] { ZakatCalculationService.class },  // => Interfaces
            new LoggingInvocationHandler(target)  // => InvocationHandler
        );
    }
}

// => Usage: manual proxy wrapping
public class Application {

    public static void main(String[] args) {
        // => Create actual service instance
        ZakatCalculationService service = new ZakatCalculationServiceImpl();

        // => Wrap with logging proxy
        ZakatCalculationService proxyService = ProxyFactory.createLoggingProxy(service);

        // => Method call intercepted by proxy
        double zakat = proxyService.calculateZakat("ACC001", 85.0);

        // => Output:
        // [LOG] Entering method: calculateZakat
        // [LOG] Arguments: [ACC001, 85.0]
        // [LOG] Method calculateZakat succeeded
        // [LOG] Execution time: 12ms
        // [LOG] Return value: 2500.0
    }
}
```

**Limitations:**

- **Interface requirement**: Dynamic proxies only work with interfaces (cannot proxy classes)
- **Manual proxy creation**: Must manually wrap every service instance with proxy
- **No pointcut expressions**: Cannot selectively apply to methods matching patterns
- **Single concern per proxy**: Combining logging + security + performance requires nested proxies
- **Boilerplate code**: Must implement InvocationHandler for each cross-cutting concern
- **No Spring integration**: Proxy creation separate from dependency injection

## Spring AOP @Aspect Solution

Spring AOP provides declarative aspects with pointcut expressions:

```java
import org.aspectj.lang.*;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import java.util.Arrays;

// => Aspect: encapsulates cross-cutting concern
// => @Aspect marks class as aspect
// => @Component makes it Spring-managed bean
@Aspect
@Component
public class LoggingAspect {

    // => Pointcut: defines where advice applies
    // => execution(): method execution join points
    // => * com.example.service..*(..) matches:
    //    - any return type (*)
    //    - any method in com.example.service package and subpackages (..)
    //    - any parameters (..)
    @Pointcut("execution(* com.example.service..*(..))")
    public void serviceMethods() {
        // => Pointcut signature: reusable expression
    }

    // => Before advice: executes before method
    // => @Before applies to serviceMethods() pointcut
    @Before("serviceMethods()")
    public void logMethodEntry(JoinPoint joinPoint) {
        // => JoinPoint: execution context
        String methodName = joinPoint.getSignature().getName();
        // => getArgs(): method arguments
        Object[] args = joinPoint.getArgs();

        System.out.println("[LOG] Entering method: " + methodName);
        System.out.println("[LOG] Arguments: " + Arrays.toString(args));
    }

    // => AfterReturning advice: executes after successful method execution
    // => returning = "result": binds return value to parameter
    @AfterReturning(pointcut = "serviceMethods()", returning = "result")
    public void logMethodSuccess(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();

        System.out.println("[LOG] Method " + methodName + " succeeded");
        System.out.println("[LOG] Return value: " + result);
    }

    // => AfterThrowing advice: executes when method throws exception
    // => throwing = "error": binds exception to parameter
    @AfterThrowing(pointcut = "serviceMethods()", throwing = "error")
    public void logMethodFailure(JoinPoint joinPoint, Throwable error) {
        String methodName = joinPoint.getSignature().getName();

        System.out.println("[ERROR] Method " + methodName + " failed");
        System.out.println("[ERROR] Exception: " + error.getMessage());
    }

    // => Around advice: wraps method execution
    // => ProceedingJoinPoint: allows proceeding to actual method
    // => Most powerful advice type
    @Around("serviceMethods()")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        long startTime = System.currentTimeMillis();

        try {
            // => Proceed to actual method
            Object result = joinPoint.proceed();

            long duration = System.currentTimeMillis() - startTime;
            System.out.println("[PERF] Method " + methodName + " executed in " + duration + "ms");

            return result;

        } catch (Throwable e) {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("[PERF] Method " + methodName + " failed after " + duration + "ms");
            throw e;
        }
    }

    // => After advice: executes after method (success or failure)
    // => Like finally block
    @After("serviceMethods()")
    public void logMethodCompletion(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[LOG] Method " + methodName + " completed");
    }
}

// => Service class: no logging code
// => Cross-cutting concern separated from business logic
@Service
public class ZakatCalculationService {

    // => Pure business logic: no logging, no performance tracking
    public double calculateZakat(String accountId, double nisab) {
        double wealth = getAccountWealth(accountId);
        if (wealth < nisab) {
            return 0.0;
        }
        return wealth * 0.025;
    }

    public void recordPayment(String accountId, double amount) {
        persistPayment(accountId, amount, LocalDateTime.now());
    }

    private double getAccountWealth(String accountId) {
        return 100000.0;
    }

    private void persistPayment(String accountId, double amount, LocalDateTime timestamp) {
        System.out.println("Payment recorded: " + accountId + " = " + amount);
    }
}

// => Spring configuration: enable AOP
@Configuration
@EnableAspectJAutoProxy  // => Enables Spring AOP proxy creation
@ComponentScan(basePackages = "com.example")
public class AopConfiguration {
    // => Spring automatically creates proxies for beans matching pointcuts
    // => No manual proxy creation needed
}

// => Usage: Spring injects proxied service
@RestController
@RequestMapping("/api/zakat")
public class ZakatController {

    // => Spring injects AOP-proxied service
    // => Logging aspect automatically applied
    private final ZakatCalculationService zakatService;

    public ZakatController(ZakatCalculationService zakatService) {
        this.zakatService = zakatService;
    }

    @PostMapping("/calculate")
    public double calculate(@RequestParam String accountId, @RequestParam double nisab) {
        // => Method call intercepted by LoggingAspect
        // => Before advice → method execution → AfterReturning advice → Around advice
        return zakatService.calculateZakat(accountId, nisab);
    }
}
```

**Benefits:**

- **Declarative pointcuts**: Pattern-based method matching (no manual wrapping)
- **Multiple advice types**: @Before, @After, @AfterReturning, @AfterThrowing, @Around
- **Spring integration**: Automatic proxy creation via @EnableAspectJAutoProxy
- **No interface requirement**: CGLIB proxies support class-based proxying
- **Aspect composition**: Multiple aspects applied automatically
- **Clean separation**: Business logic free from cross-cutting concerns

## Pointcut Expression Patterns

Common pointcut expressions for production use:

```java
@Aspect
@Component
public class AdvancedPointcuts {

    // => 1. Execution: method execution join points
    // => Matches any method in service package
    @Pointcut("execution(* com.example.service..*(..))")
    public void anyServiceMethod() {}

    // => 2. Within: type-based matching
    // => Matches methods in ZakatService class
    @Pointcut("within(com.example.service.ZakatService)")
    public void zakatServiceMethods() {}

    // => 3. Bean: Spring bean name matching
    // => Matches methods in bean named "zakatService"
    @Pointcut("bean(zakatService)")
    public void zakatServiceBean() {}

    // => 4. Annotation: method annotation matching
    // => Matches methods annotated with @Transactional
    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void transactionalMethods() {}

    // => 5. Args: parameter type matching
    // => Matches methods with String first parameter
    @Pointcut("args(String, ..)")
    public void methodsWithStringFirstParam() {}

    // => 6. Combining pointcuts: AND, OR, NOT
    // => Matches service methods that are transactional
    @Pointcut("anyServiceMethod() && transactionalMethods()")
    public void transactionalServiceMethods() {}

    // => 7. Parameter binding
    // => Binds first parameter to advice method parameter
    @Before("execution(* com.example.service..*(String, ..)) && args(accountId, ..)")
    public void logAccountId(String accountId) {
        System.out.println("[LOG] Account ID: " + accountId);
    }

    // => 8. Annotation parameter binding
    // => Binds annotation to advice parameter
    @Around("@annotation(transactional)")
    public Object logTransactional(ProceedingJoinPoint joinPoint,
                                   org.springframework.transaction.annotation.Transactional transactional) throws Throwable {
        System.out.println("[TX] Transaction timeout: " + transactional.timeout());
        return joinPoint.proceed();
    }
}
```

## AOP Proxy Mechanism Diagram

```mermaid
graph TB
    accTitle: AOP Proxy Mechanism Diagram
    accDescr: Graph with 12 nodes and 15 connections. Nodes: Client, AOP Proxy, Pointcut Matches?, Execute @Before Advice, Direct Method Call, Execute Target Method, Execute @AfterReturning, Execute @AfterThrowing, Return Result, Throw Exception, @Around Advice, LoggingAspect. Connections: Client to AOP Proxy (1. Call method), AOP Proxy to Pointcut Matches? (2. Match pointcuts), Pointcut Matches? to Execute @Before Advice (Yes), Pointcut Matches? to Direct Method Call (No), Execute @Before Advice to Execute Target Method, Execute Target Method to Execute @AfterReturning (Success), Execute Target Method to Execute @AfterThrowing (Exception), Execute @AfterReturning to Return Result, Execute @AfterThrowing to Throw Exception, Direct Method Call to Execute Target Method, @Around Advice to Execute Target Method (Wraps entire flow), LoggingAspect to Execute @Before Advice (Provides), and 3 more.
    A[Client] -->|1. Call method| B[AOP Proxy]
    B -->|2. Match pointcuts| C{Pointcut<br/>Matches?}
    C -->|Yes| D[Execute @Before<br/>Advice]
    C -->|No| H[Direct Method Call]
    D --> E[Execute Target<br/>Method]
    E -->|Success| F[Execute<br/>@AfterReturning]
    E -->|Exception| G[Execute<br/>@AfterThrowing]
    F --> I[Return Result]
    G --> J[Throw Exception]
    H --> E

    K[@Around Advice] -->|Wraps entire flow| E

    L[LoggingAspect] -.->|Provides| D
    L -.->|Provides| F
    L -.->|Provides| G
    L -.->|Provides| K

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class B pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class C pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class D pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-CA9161
    class F pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    class G pal-CC78BC
    class K pal-0173B2
    class L pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Patterns

### Security Aspect with Custom Annotation

```java
import org.aspectj.lang.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// => Custom annotation: marks methods requiring admin access
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAdmin {
    String message() default "Admin access required";
}

// => Security aspect: enforces admin access
@Aspect
@Component
public class SecurityAspect {

    // => Pointcut: methods annotated with @RequireAdmin
    @Before("@annotation(requireAdmin)")
    public void checkAdminAccess(RequireAdmin requireAdmin) {
        // => Get authenticated user from SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            // => Not authenticated
            throw new AccessDeniedException("Authentication required");
        }

        // => Check if user has ADMIN role
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        if (!hasAdminRole) {
            // => Not admin: throw exception
            throw new AccessDeniedException(requireAdmin.message());
        }

        // => Admin access granted: proceed to method
    }
}

// => Service method: declarative security
@Service
public class AdminService {

    // => Method requires admin access
    @RequireAdmin(message = "Only admin can delete accounts")
    public void deleteAccount(String accountId) {
        // => Business logic: delete account
        System.out.println("Deleting account: " + accountId);
    }

    // => No annotation: no security check
    public List<Account> listAccounts() {
        return accountRepository.findAll();
    }
}
```

### Performance Monitoring Aspect

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.micrometer.core.instrument.*;

@Aspect
@Component
public class PerformanceMonitoringAspect {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

    private final MeterRegistry meterRegistry;

    public PerformanceMonitoringAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    // => Monitor all service methods
    @Around("execution(* com.example.service..*(..))")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();

        // => Start timer
        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            // => Execute method
            Object result = joinPoint.proceed();

            // => Record successful execution
            sample.stop(Timer.builder("method.execution")
                .tag("method", methodName)
                .tag("status", "success")
                .register(meterRegistry));

            return result;

        } catch (Throwable e) {
            // => Record failed execution
            sample.stop(Timer.builder("method.execution")
                .tag("method", methodName)
                .tag("status", "failure")
                .tag("exception", e.getClass().getSimpleName())
                .register(meterRegistry));

            throw e;
        }
    }

    // => Log slow methods
    @Around("execution(* com.example.service..*(..))")
    public Object logSlowMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        Object result = joinPoint.proceed();

        long duration = System.currentTimeMillis() - startTime;

        // => Log if method takes more than 1 second
        if (duration > 1000) {
            String methodName = joinPoint.getSignature().toShortString();
            logger.warn("Slow method detected: {} took {}ms", methodName, duration);
        }

        return result;
    }
}
```

### Audit Logging Aspect

```java
import com.fasterxml.jackson.databind.ObjectMapper;

@Aspect
@Component
public class AuditLoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(AuditLoggingAspect.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    // => Log zakat payment operations
    @AfterReturning(
        pointcut = "execution(* com.example.service.ZakatService.recordPayment(..))",
        returning = "result"
    )
    public void auditZakatPayment(JoinPoint joinPoint, Object result) {
        // => Extract method arguments
        Object[] args = joinPoint.getArgs();
        String accountId = (String) args[0];
        double amount = (double) args[1];

        // => Get authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "SYSTEM";

        // => Create audit log entry
        AuditLog log = new AuditLog();
        log.setAction("ZAKAT_PAYMENT");
        log.setUsername(username);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(String.format("Account: %s, Amount: %.2f", accountId, amount));

        // => Persist audit log
        auditLogRepository.save(log);

        logger.info("Audit: {} recorded zakat payment {} for account {}",
            username, amount, accountId);
    }

    // => Log all state-changing operations
    @AfterReturning(
        pointcut = "execution(* com.example.service..*(..)) && " +
                   "(execution(* create*(..)) || execution(* update*(..)) || execution(* delete*(..)))",
        returning = "result"
    )
    public void auditStateChanges(JoinPoint joinPoint, Object result) throws Exception {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "SYSTEM";

        // => Serialize arguments to JSON
        String argsJson = objectMapper.writeValueAsString(args);

        AuditLog log = new AuditLog();
        log.setAction(methodName.toUpperCase());
        log.setUsername(username);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(argsJson);

        auditLogRepository.save(log);
    }
}
```

## Trade-offs and When to Use

| Approach             | Flexibility | Complexity | Spring Integration | Proxy Type         | Production Ready |
| -------------------- | ----------- | ---------- | ------------------ | ------------------ | ---------------- |
| Manual Dynamic Proxy | Low         | High       | None               | Interface-based    | No               |
| Spring AOP @Aspect   | High        | Medium     | Full               | Interface or CGLIB | Yes              |
| AspectJ Compile-time | Very High   | Very High  | Optional           | Bytecode weaving   | Yes (advanced)   |

**When to Use Manual Dynamic Proxy:**

- Learning Java proxy mechanism fundamentals
- Simple single-concern interception
- No Spring dependency required
- Educational purposes

**When to Use Spring AOP @Aspect:**

- **Production applications** (default choice)
- Declarative cross-cutting concerns (logging, security, auditing)
- Multiple aspects with different priorities
- Spring-managed beans
- Most common scenarios (method execution join points)

**When to Use AspectJ Compile-time Weaving:**

- Field access interception (not just method execution)
- Constructor interception
- Static method interception
- Non-Spring-managed objects
- Maximum performance (no runtime proxy overhead)

## Best Practices

**1. Use Specific Pointcuts**

```java
// ❌ Too broad: matches everything
@Pointcut("execution(* *(..))")

// ✅ Specific: matches service layer only
@Pointcut("execution(* com.example.service..*(..))")
```

**2. Avoid @Around When Simpler Advice Suffices**

```java
// ❌ Overkill for simple logging
@Around("serviceMethods()")
public Object log(ProceedingJoinPoint jp) throws Throwable {
    System.out.println("Before");
    return jp.proceed();
}

// ✅ Use @Before for before-only logic
@Before("serviceMethods()")
public void log() {
    System.out.println("Before");
}
```

**3. Order Aspects with @Order**

```java
@Aspect
@Component
@Order(1)  // Executes first
public class SecurityAspect { }

@Aspect
@Component
@Order(2)  // Executes second
public class LoggingAspect { }
```

**4. Handle Exceptions in Advice**

```java
@Around("serviceMethods()")
public Object advice(ProceedingJoinPoint jp) throws Throwable {
    try {
        return jp.proceed();
    } catch (Throwable e) {
        // Log exception, don't swallow
        logger.error("Method failed: {}", e.getMessage());
        throw e;  // Re-throw
    }
}
```

**5. Use SLF4J for Production Logging**

```java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before("serviceMethods()")
    public void logMethodEntry(JoinPoint jp) {
        // Use parameterized logging (not string concatenation)
        logger.debug("Entering method: {}", jp.getSignature().getName());
    }
}
```

## See Also

- [Cross-Cutting Concerns](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/cross-cutting-concerns) - Logging, auditing, performance monitoring aspects
- [Transaction Management](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/transaction-management) - @Transactional AOP implementation
- [Spring Security Basics](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-security-basics) - Security filter chain (AOP-based)
- [Caching](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/caching) - @Cacheable AOP implementation
- [Exception Handling](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/exception-handling) - Exception handling aspects
