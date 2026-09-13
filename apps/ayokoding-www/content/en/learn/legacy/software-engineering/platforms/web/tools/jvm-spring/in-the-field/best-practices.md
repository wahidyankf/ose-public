---
title: "Best Practices"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000001
description: "Production patterns and best practices for Spring Framework applications"
tags: ["spring", "in-the-field", "production", "best-practices"]
---

## Why Best Practices Matter

Spring Framework's flexibility enables both elegant and chaotic architectures. Following production-proven patterns prevents common pitfalls like circular dependencies, configuration sprawl, and runtime surprises. These practices emerged from thousands of enterprise deployments and Spring team recommendations.

## Dependency Injection Patterns

### Prefer Constructor Injection

**Recommended:**

```java
@Service
public class OrderService {
    private final PaymentService paymentService;  // => final ensures immutability
    private final NotificationService notificationService;

    // => Constructor injection: dependencies required, testable, immutable
    // => Spring automatically injects beans when creating OrderService
    public OrderService(PaymentService paymentService,
                       NotificationService notificationService) {
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
}
```

**Avoid - Field Injection:**

```java
@Service
public class OrderService {
    @Autowired  // => Field injection: hides dependencies, harder to test
    private PaymentService paymentService;  // => Mutable, can't guarantee initialization

    @Autowired
    private NotificationService notificationService;
}
```

**Benefits of Constructor Injection:**

- Dependencies explicit in constructor signature
- Enables testing with mock objects (no reflection needed)
- `final` fields prevent accidental reassignment
- Circular dependency detection at startup (fails fast)

### Use @Autowired Only When Necessary

Constructor injection with single constructor doesn't need `@Autowired`:

```java
@Service
public class OrderService {
    private final PaymentService paymentService;

    // => Spring automatically injects when only one constructor exists
    // => No @Autowired annotation needed (less boilerplate)
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

Use `@Autowired` only for:

- Multiple constructors (mark which one Spring should use)
- Setter injection (rare, for optional dependencies)
- Method injection (rare, for post-construct initialization)

## Configuration Patterns

### Centralize Configuration in @Configuration Classes

```java
@Configuration  // => Marks class as bean definition source
                // => Spring processes @Bean methods during startup
public class DataConfig {

    @Bean  // => Registers DataSource bean in Spring container
           // => Method name becomes bean name: "dataSource"
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql:db");
        config.setUsername("user");
        config.setPassword("pass");
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);
    }

    @Bean  // => EntityManagerFactory depends on dataSource bean
           // => Spring automatically injects dataSource when creating this bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);  // => Uses injected DataSource
        em.setPackagesToScan("com.example.domain");
        return em;
    }
}
```

**Benefits:**

- All database configuration in one place
- Bean dependencies explicit (method parameters)
- Easy to test (create @TestConfiguration)
- Profile-specific overrides simple (@Profile on methods)

### Externalize Properties

**Avoid hard-coded values:**

```java
@Configuration
public class DataConfig {
    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://<prod-db>/app");  // => Hard-coded, different per environment
        config.setMaximumPoolSize(50);  // => Hard-coded, can't change without recompile
        return new HikariDataSource(config);
    }
}
```

**Use @Value for externalized config:**

```java
@Configuration
public class DataConfig {

    @Value("${db.url}")  // => Loads from application.properties or environment variable
    private String dbUrl;  // => Value injected by Spring at bean creation time

    @Value("${db.pool.size:10}")  // => :10 provides default if property not found
    private int poolSize;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);  // => Uses externalized value
        config.setMaximumPoolSize(poolSize);
        return new HikariDataSource(config);
    }
}
```

**application.properties:**

```properties
db.url=jdbc:postgresql://${DB_HOST:localhost}:5432/dev
db.pool.size=10
```

**application-prod.properties:**

```properties
db.url=jdbc:postgresql://${DB_HOST:prod-db}:5432/app
db.pool.size=50
```

**Benefits:**

- Different configurations per environment (dev, staging, prod)
- No recompilation for config changes
- Can override via environment variables (`DB_URL=...`)
- Secrets managed outside code (Spring Cloud Config, Vault)

## Bean Lifecycle Management

### Use @PostConstruct for Initialization Logic

```java
@Service
public class CacheWarmupService {
    private final ProductRepository productRepository;
    private final Cache cache;

    public CacheWarmupService(ProductRepository productRepository, Cache cache) {
        this.productRepository = productRepository;
        this.cache = cache;
    }

    @PostConstruct  // => Called after dependency injection completes
                    // => Ensures productRepository and cache available
    public void warmupCache() {
        List<Product> products = productRepository.findAll();  // => Safe to call dependencies
        products.forEach(p -> cache.put(p.getId(), p));  // => Cache ready before app serves requests
        System.out.println("Cache warmed with " + products.size() + " products");
    }
}
```

**Lifecycle Order:**

1. Spring creates bean instance (`new CacheWarmupService(...)`)
2. Spring injects dependencies (constructor parameters)
3. Spring calls `@PostConstruct` methods
4. Bean ready for use

**Use Cases:**

- Database connection validation
- Cache pre-loading
- External service health checks
- Resource initialization requiring dependencies

### Use @PreDestroy for Cleanup

```java
@Service
public class FileProcessorService {
    private final ExecutorService executor;

    public FileProcessorService() {
        // => Creates thread pool for async file processing
        this.executor = Executors.newFixedThreadPool(5);
    }

    @PreDestroy  // => Called during application shutdown
                 // => Ensures graceful cleanup before JVM exits
    public void shutdown() {
        executor.shutdown();  // => Stop accepting new tasks
        try {
            // => Wait up to 30 seconds for running tasks to complete
            if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                executor.shutdownNow();  // => Force shutdown if timeout
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
```

## Component Scanning Best Practices

### Limit Component Scanning Scope

**Avoid scanning entire classpath:**

```java
@Configuration
@ComponentScan("com.example")  // => Scans all packages, slow startup
public class AppConfig {
}
```

**Scan specific packages:**

```java
@Configuration
@ComponentScan(basePackages = {
    "com.example.service",  // => Only scan service package
    "com.example.repository"  // => And repository package
})  // => Faster startup, explicit dependencies
public class AppConfig {
}
```

**Benefits:**

- Faster application startup (fewer classes scanned)
- Explicit about which components managed by Spring
- Prevents accidental bean registration from third-party libraries

### Use Stereotype Annotations Meaningfully

```java
@Repository  // => Data access layer: Spring adds persistence exception translation
public class OrderRepository {
    // => Unchecked JDBC exceptions converted to Spring's DataAccessException
}

@Service  // => Business logic layer: no special behavior, documents intent
public class OrderService {
    // => Semantic meaning: this class contains business logic
}

@Controller  // => Web layer: Spring MVC adds request mapping support
public class OrderController {
    // => Spring MVC processes @RequestMapping annotations
}
```

**Don't use @Component everywhere:**

```java
// Bad - unclear purpose
@Component
public class OrderThing {  // => Is this service? Repository? Utility?
}

// Good - explicit role
@Service
public class OrderService {  // => Clear: business logic layer
}
```

## Transaction Management

### Use @Transactional at Service Layer

```java
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    public OrderService(OrderRepository orderRepository, PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
    }

    @Transactional  // => Opens transaction before method, commits after
                    // => Rolls back on unchecked exceptions (RuntimeException)
    public void processOrder(Order order) {
        orderRepository.save(order);  // => Part of transaction
        paymentService.charge(order.getTotal());  // => Part of same transaction
        // => If charge() throws exception, save() rolls back
    }
}
```

**Don't put @Transactional on repository:**

```java
// Bad - transaction boundary too small
@Repository
public class OrderRepository {
    @Transactional
    public void save(Order order) {  // => Transaction per DB call
    }
}

// Good - transaction spans business operation
@Service
public class OrderService {
    @Transactional
    public void processOrder(Order order) {
        orderRepository.save(order);  // => Multiple DB calls in one transaction
        paymentRepository.save(payment);
    }
}
```

### Specify Read-Only Transactions

```java
@Service
public class OrderQueryService {

    @Transactional(readOnly = true)  // => Optimization hint to database
                                     // => Enables query optimizations, prevents accidental writes
    public List<Order> findOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId);  // => Read-only, no writes allowed
    }
}
```

## Testing Best Practices

### Use Constructor Injection for Easy Testing

```java
@Service
public class OrderService {
    private final PaymentService paymentService;

    // => Constructor injection: easy to create with mocks
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}

// Test class
class OrderServiceTest {
    @Test
    void testProcessOrder() {
        PaymentService mockPayment = mock(PaymentService.class);  // => Create mock
        OrderService service = new OrderService(mockPayment);  // => Inject mock via constructor

        service.processOrder(order);  // => Test with mock dependency
        verify(mockPayment).charge(100.0);
    }
}
```

## Error Handling

### Use @ControllerAdvice for Global Exception Handling

```java
@ControllerAdvice  // => Applies to all controllers in application
                   // => Centralizes exception handling logic
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)  // => Handles this exception type
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);  // => Returns 404
    }

    @ExceptionHandler(Exception.class)  // => Catch-all for unexpected exceptions
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = new ErrorResponse("INTERNAL_ERROR", "An error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);  // => Returns 500
    }
}
```

## See Also

- [Spring Anti-Patterns](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/anti-patterns) - Common mistakes to avoid
- [Dependency Injection](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/dependency-injection) - DI patterns in depth
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Configuration management
- [Transaction Management](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/transaction-management) - Transaction best practices
