---
title: "Anti Patterns"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000002
description: "Common Spring mistakes and how to avoid them in production applications"
tags: ["spring", "in-the-field", "production", "anti-patterns"]
---

## Why Anti-Patterns Matter

Spring Framework's flexibility creates opportunities for misuse that compile successfully but fail in production. These anti-patterns emerged from debugging thousands of Spring applications experiencing circular dependencies, memory leaks, and runtime errors. Learning to recognize and avoid them prevents costly production incidents.

## Circular Dependencies

### The Problem

```java
@Service
public class OrderService {
    @Autowired
    private PaymentService paymentService;  // => OrderService depends on PaymentService

    public void processOrder(Order order) {
        paymentService.charge(order);
    }
}

@Service
public class PaymentService {
    @Autowired
    private OrderService orderService;  // => PaymentService depends on OrderService
    // => Circular dependency: OrderService → PaymentService → OrderService

    public void refund(Payment payment) {
        Order order = orderService.findOrder(payment.getOrderId());  // => Why does payment service need order service?
    }
}
```

**Runtime Error:**

```
BeanCurrentlyInCreationException: Error creating bean with name 'orderService':
Requested bean is currently in creation: Is there an unresolvable circular reference?
```

### The Solution

**Extract shared logic to separate service:**

```java
@Service
public class OrderService {
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;  // => Access data directly

    public OrderService(PaymentService paymentService, OrderRepository orderRepository) {
        this.paymentService = paymentService;
        this.orderRepository = orderRepository;
    }

    public void processOrder(Order order) {
        paymentService.charge(order);
    }
}

@Service
public class PaymentService {
    private final OrderRepository orderRepository;  // => No dependency on OrderService

    public PaymentService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void refund(Payment payment) {
        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow();  // => Direct repository access
    }
}
```

**Key Insight**: Circular dependencies indicate poor separation of concerns. Services should depend on repositories, not other services at the same layer.

## Field Injection Overuse

### The Problem

```java
@Service
public class OrderService {
    @Autowired  // => Field injection: dependencies hidden
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ShippingService shippingService;  // => How many dependencies does this service have?
    // => Can't tell without reading entire class
}
```

**Problems:**

- Dependencies not visible in API (hidden in implementation)
- Can't create instance for testing without Spring context
- Encourages god classes (too many dependencies)
- Can't make fields `final` (immutability lost)

### The Solution

```java
@Service
public class OrderService {
    private final PaymentService paymentService;  // => final ensures initialization
    private final NotificationService notificationService;
    private final InventoryService inventoryService;
    private final ShippingService shippingService;

    // => Constructor injection: dependencies explicit, testable
    public OrderService(PaymentService paymentService,
                       NotificationService notificationService,
                       InventoryService inventoryService,
                       ShippingService shippingService) {
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.inventoryService = inventoryService;
        this.shippingService = shippingService;
    }
}
```

**When constructor gets too large** (more than 5 dependencies), it signals design problem:

```java
// Too many dependencies? Split the class
@Service
public class OrderProcessingService {
    private final PaymentService paymentService;
    private final InventoryService inventoryService;

    // Focus on order processing only
}

@Service
public class OrderNotificationService {
    private final NotificationService notificationService;

    // Focus on notifications only
}
```

## @Transactional Misuse

### Wrong Layer

**Don't put @Transactional on controllers:**

```java
@RestController
public class OrderController {
    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/orders")
    @Transactional  // => WRONG: Transaction boundary too high
                    // => Transaction stays open during HTTP response writing
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        orderRepository.save(order);  // => Transaction active during network I/O
        return ResponseEntity.ok(order);  // => Delays transaction commit
    }
}
```

**Problems:**

- Transaction stays open during network I/O (slow)
- Database connections held longer than necessary
- Higher risk of deadlocks

**Use @Transactional on service layer:**

```java
@RestController
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        Order created = orderService.processOrder(order);  // => Service handles transaction
        return ResponseEntity.ok(created);  // => Transaction already committed
    }
}

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    @Transactional  // => CORRECT: Transaction boundary at business logic
    public Order processOrder(Order order) {
        return orderRepository.save(order);  // => Transaction commit happens here
    }  // => Connection released immediately
}
```

### Ignoring Rollback Rules

```java
@Service
public class OrderService {

    @Transactional  // => Rolls back on RuntimeException only
    public void processOrder(Order order) throws IOException {
        orderRepository.save(order);
        fileService.writeReceipt(order);  // => Throws IOException (checked exception)
        // => IOException does NOT trigger rollback!
        // => Order saved even though receipt writing failed
    }
}
```

**Solution - Specify rollback for checked exceptions:**

```java
@Service
public class OrderService {

    @Transactional(rollbackFor = Exception.class)  // => Rolls back on ANY exception
    public void processOrder(Order order) throws IOException {
        orderRepository.save(order);
        fileService.writeReceipt(order);  // => IOException triggers rollback
        // => Order save rolled back if receipt fails
    }
}
```

## Component Scanning Anti-Patterns

### Scanning Too Broadly

```java
@SpringBootApplication
@ComponentScan("com")  // => WRONG: Scans entire com.* package tree
                       // => Includes third-party libraries, test code, everything
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**Problems:**

- Slow startup (scans thousands of classes)
- Accidental bean registration from dependencies
- Test classes registered as beans in production

**Solution - Scan specific packages:**

```java
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.example.service",  // => Only application packages
    "com.example.repository",
    "com.example.controller"
})
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### Using @Component for Everything

```java
@Component  // => Generic, unclear purpose
public class OrderHandler {
    // Is this a service? Repository? Controller? Utility?
}

@Component  // => Loses semantic meaning
public class OrderRepository {
    // Should be @Repository for exception translation
}
```

**Solution - Use stereotype annotations:**

```java
@Repository  // => Data access: Spring adds exception translation
public class OrderRepository {
    // => SQLException converted to DataAccessException
}

@Service  // => Business logic layer
public class OrderService {
}

@Controller  // => Web layer: Spring MVC support
public class OrderController {
}
```

## Bean Scope Misuse

### Singleton Beans with Mutable State

```java
@Service  // => Default scope: singleton (one instance for entire app)
public class OrderService {
    private Order currentOrder;  // => WRONG: Mutable state in singleton
    // => All requests share the same instance
    // => Concurrent requests overwrite each other's data

    public void processOrder(Order order) {
        this.currentOrder = order;  // => Race condition: thread 1 sets order A
        // => Thread 2 immediately overwrites with order B
        // => Thread 1 processes order B instead of A!

        // Process order...
    }
}
```

**Problems:**

- Thread safety violations
- Data corruption under concurrent load
- Intermittent bugs hard to reproduce

**Solution - Keep singletons stateless:**

```java
@Service
public class OrderService {
    private final PaymentService paymentService;  // => final: immutable dependency

    // => No mutable state: thread-safe
    public Order processOrder(Order order) {
        // => order parameter: local to this method call, not shared
        Payment payment = paymentService.charge(order.getTotal());
        return order.withPayment(payment);
    }
}
```

## @Autowired Optional Dependencies

### Wrong Approach

```java
@Service
public class NotificationService {
    @Autowired(required = false)  // => WRONG: Hides missing dependency until runtime
    private EmailService emailService;

    public void notify(User user) {
        if (emailService != null) {  // => Must check null everywhere
            emailService.send(user.getEmail(), "Welcome!");
        }
    }
}
```

**Problems:**

- Null checks scattered throughout code
- Easy to forget null check (NullPointerException)
- Configuration errors go unnoticed

**Solution - Use Optional explicitly:**

```java
@Service
public class NotificationService {
    private final Optional<EmailService> emailService;  // => Explicit optional dependency

    public NotificationService(@Autowired(required = false) EmailService emailService) {
        this.emailService = Optional.ofNullable(emailService);  // => Wrap in Optional once
    }

    public void notify(User user) {
        emailService.ifPresent(service ->  // => Functional style, no null checks
            service.send(user.getEmail(), "Welcome!")
        );
    }
}
```

## Hard-Coded Configuration

### The Problem

```java
@Configuration
public class DataConfig {
    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql:dev");  // => Hard-coded
        config.setUsername("postgres");  // => Hard-coded
        config.setPassword("secret123");  // => Hard-coded, security risk
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);
    }
}
```

**Problems:**

- Different values per environment (dev, staging, prod)
- Secrets in source code
- Requires recompilation for changes

**Solution - Externalize all configuration:**

```java
@Configuration
public class DataConfig {

    @Value("${spring.datasource.url}")  // => Externalized
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")  // => Can use encrypted values
    private String password;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")  // => Default: 10
    private int poolSize;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(poolSize);
        return new HikariDataSource(config);
    }
}
```

**application-dev.properties:**

```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:5432/dev
spring.datasource.username=dev_user
spring.datasource.password=${DEV_DB_PASSWORD}
```

**application-prod.properties:**

```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST:prod-db}:5432/app
spring.datasource.username=prod_user
spring.datasource.password=${PROD_DB_PASSWORD}
```

## Exception Swallowing

### The Problem

```java
@Service
public class OrderService {

    public void processOrder(Order order) {
        try {
            paymentService.charge(order.getTotal());
        } catch (PaymentException e) {
            // => WRONG: Exception swallowed silently
            // => Caller thinks payment succeeded
        }

        orderRepository.save(order);  // => Saved even though payment failed!
    }
}
```

**Problems:**

- Data inconsistency (order saved, payment failed)
- Silent failures hard to debug
- Violates fail-fast principle

**Solution - Let exceptions propagate or handle properly:**

```java
@Service
public class OrderService {

    @Transactional(rollbackFor = Exception.class)
    public void processOrder(Order order) throws PaymentException {
        paymentService.charge(order.getTotal());  // => Let exception propagate
        orderRepository.save(order);  // => Only saved if payment succeeds
        // => Exception triggers transaction rollback
    }
}

// Or handle exception explicitly
@Service
public class OrderService {

    @Transactional(rollbackFor = Exception.class)
    public void processOrder(Order order) {
        try {
            paymentService.charge(order.getTotal());
        } catch (PaymentException e) {
            // => Log error
            logger.error("Payment failed for order {}", order.getId(), e);
            // => Re-throw to trigger rollback
            throw new OrderProcessingException("Payment failed", e);
        }
        orderRepository.save(order);
    }
}
```

## See Also

- [Spring Best Practices](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/best-practices) - Recommended patterns
- [Dependency Injection](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/dependency-injection) - DI done right
- [Transaction Management](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/transaction-management) - Transaction patterns
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Configuration best practices
