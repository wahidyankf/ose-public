---
title: "Bean Lifecycle"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000012
description: "Bean creation, initialization hooks, destruction callbacks, and scope management in Spring applications"
tags: ["spring", "in-the-field", "production", "bean-lifecycle", "scopes"]
---

## Why Bean Lifecycle Matters

Production applications require resource management: database connections must be initialized at startup and closed at shutdown, caches must be warmed, thread pools must be created and destroyed properly. Spring's bean lifecycle hooks provide predictable, declarative control over these critical initialization and cleanup tasks.

## Java Standard Library Baseline

Manual lifecycle management requires explicit initialization and cleanup:

```java
// => Database connection pool: manual lifecycle
public class DatabaseConnectionPool {
    private List<Connection> connections;  // => Connection pool
    private boolean initialized = false;  // => Initialization flag

    // => Constructor: just creates object, doesn't initialize resources
    public DatabaseConnectionPool() {
        // => No connections created yet
        // => Can't connect to database in constructor (might fail)
    }

    // => Manual initialization: must be called explicitly
    public void initialize() {
        // => Check if already initialized (idempotency)
        if (initialized) {
            return;
        }

        try {
            // => Create connection pool (expensive operation)
            connections = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                // => Creates database connection
                Connection conn = DriverManager.getConnection(
                    "jdbc:postgresql:zakat",
                    "admin", "secret"
                );
                connections.add(conn);  // => Adds to pool
            }
            initialized = true;  // => Mark as initialized
            System.out.println("Connection pool initialized with " + connections.size() + " connections");
        } catch (SQLException e) {
            // => Initialization failure: log and rethrow
            throw new RuntimeException("Failed to initialize connection pool", e);
        }
    }

    // => Manual cleanup: must be called explicitly
    public void destroy() {
        // => Close all connections before shutdown
        if (connections != null) {
            for (Connection conn : connections) {
                try {
                    if (conn != null && !conn.isClosed()) {
                        conn.close();  // => Close connection
                    }
                } catch (SQLException e) {
                    // => Log but don't stop cleanup
                    System.err.println("Error closing connection: " + e.getMessage());
                }
            }
            connections.clear();  // => Clear pool
        }
        initialized = false;  // => Mark as destroyed
        System.out.println("Connection pool destroyed");
    }

    public Connection getConnection() {
        // => Check if initialized before use
        if (!initialized) {
            throw new IllegalStateException("Pool not initialized");
        }
        return connections.isEmpty() ? null : connections.get(0);
    }
}

// => Application: manual lifecycle calls
public class Application {
    public static void main(String[] args) {
        DatabaseConnectionPool pool = new DatabaseConnectionPool();

        try {
            // => MUST remember to call initialize()
            pool.initialize();

            // => Use connection pool
            Connection conn = pool.getConnection();
            // Use connection...

        } finally {
            // => MUST remember to call destroy() in finally block
            // => Easy to forget, resource leaks common
            pool.destroy();
        }
    }
}
```

**Limitations:**

- **Manual calls**: Must remember to call initialize() and destroy()
- **No standardization**: Every class has different method names
- **Easy to forget**: No compiler enforcement, resource leaks common
- **Shutdown hooks**: No automatic cleanup on JVM shutdown
- **Order dependency**: Must manually order initialization/destruction

## Spring Bean Lifecycle

Spring manages bean lifecycle with hooks:

```java
// => Spring-managed bean: automatic lifecycle
@Component  // => Registered as Spring bean
public class DatabaseConnectionPool {
    private List<Connection> connections;

    // => Constructor: Spring calls this first
    // => Just object construction, no resource initialization
    public DatabaseConnectionPool() {
        System.out.println("1. Constructor called");
    }

    // => Initialization hook: Spring calls AFTER construction and dependency injection
    @PostConstruct  // => Marks method for post-construction callback
                    // => Spring calls automatically after dependencies injected
    public void initialize() {
        // => Runs once after bean fully constructed
        // => Safe to access all injected dependencies here
        System.out.println("2. @PostConstruct called - initializing resources");

        try {
            connections = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                Connection conn = DriverManager.getConnection(
                    "jdbc:postgresql:zakat",
                    "admin", "secret"
                );
                connections.add(conn);
            }
            System.out.println("Connection pool initialized with " + connections.size() + " connections");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize connection pool", e);
        }
    }

    // => Destruction hook: Spring calls BEFORE shutdown
    @PreDestroy  // => Marks method for pre-destruction callback
                 // => Spring calls automatically during shutdown
    public void destroy() {
        // => Runs once before application shutdown
        // => Cleanup resources: close connections, files, threads
        System.out.println("3. @PreDestroy called - cleaning up resources");

        if (connections != null) {
            for (Connection conn : connections) {
                try {
                    if (conn != null && !conn.isClosed()) {
                        conn.close();
                    }
                } catch (SQLException e) {
                    System.err.println("Error closing connection: " + e.getMessage());
                }
            }
            connections.clear();
        }
        System.out.println("Connection pool destroyed");
    }

    public Connection getConnection() {
        // => Safe to use: Spring guarantees initialize() already called
        return connections.isEmpty() ? null : connections.get(0);
    }
}

// => Application: Spring manages lifecycle automatically
public class Application {
    public static void main(String[] args) {
        // => Creates Spring container
        ApplicationContext context =
            new AnnotationConfigApplicationContext(AppConfig.class);

        // => Spring automatically:
        // 1. Calls constructor
        // 2. Injects dependencies
        // 3. Calls @PostConstruct methods

        // => Retrieve fully-initialized bean
        DatabaseConnectionPool pool = context.getBean(DatabaseConnectionPool.class);

        // => Use connection pool (already initialized)
        Connection conn = pool.getConnection();

        // => Close context: Spring automatically calls @PreDestroy
        ((ConfigurableApplicationContext) context).close();
        // => No manual cleanup needed
    }
}
```

**Benefits:**

- **Automatic calls**: Spring calls initialize/destroy automatically
- **Standardized**: @PostConstruct/@PreDestroy across all beans
- **Guaranteed order**: Dependencies injected before @PostConstruct
- **Shutdown hooks**: Spring registers JVM shutdown hook
- **No leaks**: Destroy called even on unexpected shutdown

## Bean Scopes

Spring provides different bean scopes:

```java
// => Singleton scope: one instance per container (DEFAULT)
@Component  // => No @Scope annotation: defaults to singleton
public class ZakatCalculator {
    // => Created ONCE during startup
    // => Same instance injected everywhere
    // => Shared across all threads: MUST be thread-safe
    // => No mutable state allowed (or use ThreadLocal)

    @PostConstruct
    public void initialize() {
        System.out.println("ZakatCalculator initialized ONCE");
    }
}

// => Prototype scope: new instance per injection
@Component
@Scope("prototype")  // => New instance every time bean requested
public class ZakatReport {
    private final String reportId;  // => Each instance has unique ID

    public ZakatReport() {
        // => Constructor called every time bean requested
        this.reportId = UUID.randomUUID().toString();
        System.out.println("New ZakatReport created: " + reportId);
    }

    @PostConstruct
    public void initialize() {
        // => Called for EACH new instance
        System.out.println("Initializing report: " + reportId);
    }

    @PreDestroy
    public void destroy() {
        // => WARNING: @PreDestroy NOT called for prototype beans
        // => Spring doesn't track prototype instances after creation
        // => Client responsible for cleanup
        System.out.println("Destroying report: " + reportId);
    }
}

// => Request scope: one instance per HTTP request (Spring Web only)
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
// => New instance per HTTP request
// => proxyMode: creates proxy to inject into singleton beans
public class RequestContext {
    private final String requestId;

    public RequestContext() {
        // => Constructor called once per HTTP request
        this.requestId = UUID.randomUUID().toString();
    }

    @PostConstruct
    public void initialize() {
        // => Called once per request
        System.out.println("Request started: " + requestId);
    }

    @PreDestroy
    public void destroy() {
        // => Called when request completes
        System.out.println("Request ended: " + requestId);
    }
}

// => Session scope: one instance per HTTP session (Spring Web only)
@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
// => New instance per HTTP session
// => Lives as long as user session active
public class UserSession {
    private String userId;  // => Mutable state: safe, per session

    @PostConstruct
    public void initialize() {
        // => Called once per session
        System.out.println("Session started");
    }

    @PreDestroy
    public void destroy() {
        // => Called when session expires/invalidated
        System.out.println("Session ended for user: " + userId);
    }
}
```

## Lifecycle Diagram

```mermaid
graph TD
    A[Container Startup] -->|1. Instantiate| B[Constructor Called]
    B -->|2. Inject| C[Dependencies Injected]
    C -->|3. Initialize| D[@PostConstruct Called]
    D -->|4. Ready| E[Bean Ready for Use]

    E -->|Shutdown| F[@PreDestroy Called]
    F -->|Destroy| G[Bean Destroyed]

    H[Prototype Scope] -->|Each Request| B
    H -.->|No Destroy Hook| F

    style A fill:#0173B2,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#DE8F05,stroke:#333,stroke-width:2px,color:#fff
    style H fill:#CC78BC,stroke:#333,stroke-width:2px,color:#fff
```

## Production Patterns

### Cache Warming

```java
@Component  // => Spring-managed bean
public class ZakatRateCache {

    private Map<String, BigDecimal> rateCache;  // => Cache storage
    private final ZakatRateRepository repository;  // => Data source

    // => Constructor injection
    public ZakatRateCache(ZakatRateRepository repository) {
        this.repository = repository;
    }

    @PostConstruct  // => Warm cache at startup
    public void warmCache() {
        // => Runs once after dependencies injected
        // => Pre-loads data into memory for fast access
        System.out.println("Warming zakat rate cache...");

        rateCache = new HashMap<>();
        // => Load all rates from database into cache
        List<ZakatRate> rates = repository.findAll();
        for (ZakatRate rate : rates) {
            rateCache.put(rate.getAssetType(), rate.getRate());
        }

        System.out.println("Cache warmed with " + rateCache.size() + " rates");
    }

    public BigDecimal getRate(String assetType) {
        // => Fast lookup from cache
        return rateCache.get(assetType);
    }

    @PreDestroy  // => Cleanup cache at shutdown
    public void clearCache() {
        // => Release memory before shutdown
        System.out.println("Clearing zakat rate cache...");
        if (rateCache != null) {
            rateCache.clear();
        }
    }
}
```

### Resource Cleanup

```java
@Component  // => Spring-managed bean
public class ReportScheduler {

    private ScheduledExecutorService executor;  // => Thread pool

    @PostConstruct  // => Initialize thread pool
    public void initialize() {
        // => Creates thread pool with 5 threads
        executor = Executors.newScheduledThreadPool(5);
        System.out.println("Report scheduler initialized");

        // => Schedule recurring task: generate reports every hour
        executor.scheduleAtFixedRate(
            this::generateReports,
            0,  // => Initial delay: 0 seconds
            3600,  // => Period: 3600 seconds (1 hour)
            TimeUnit.SECONDS
        );
    }

    @PreDestroy  // => Shutdown thread pool gracefully
    public void destroy() {
        // => Shutdown executor: no new tasks accepted
        System.out.println("Shutting down report scheduler...");
        if (executor != null) {
            executor.shutdown();  // => Graceful shutdown
            try {
                // => Wait up to 30 seconds for tasks to complete
                if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                    // => Force shutdown if tasks don't complete
                    executor.shutdownNow();
                    System.out.println("Forced shutdown of report scheduler");
                }
            } catch (InterruptedException e) {
                // => Interrupted: force shutdown
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        System.out.println("Report scheduler destroyed");
    }

    private void generateReports() {
        // => Recurring task: generates reports
        System.out.println("Generating reports...");
    }
}
```

### Dependency on Other Beans

```java
@Component  // => Spring-managed bean
public class ZakatService {

    private final DatabaseConnectionPool connectionPool;  // => Injected dependency
    private final ZakatRateCache rateCache;  // => Injected dependency

    // => Constructor injection: Spring injects dependencies
    public ZakatService(DatabaseConnectionPool connectionPool, ZakatRateCache rateCache) {
        this.connectionPool = connectionPool;
        this.rateCache = rateCache;
        System.out.println("1. ZakatService constructor");
    }

    @PostConstruct  // => Runs AFTER dependencies initialized
    public void initialize() {
        // => Safe to use dependencies: their @PostConstruct already called
        // => Spring guarantees: dependencies initialized before dependents
        System.out.println("2. ZakatService @PostConstruct");
        System.out.println("   - Connection pool available: " + (connectionPool.getConnection() != null));
        System.out.println("   - Rate cache available: " + (rateCache.getRate("gold") != null));
    }

    @PreDestroy  // => Runs BEFORE dependencies destroyed
    public void destroy() {
        // => Dependencies still available during cleanup
        // => Spring guarantees: dependents destroyed before dependencies
        System.out.println("3. ZakatService @PreDestroy");
    }
}

// => Initialization order:
// 1. DatabaseConnectionPool constructor
// 2. DatabaseConnectionPool @PostConstruct
// 3. ZakatRateCache constructor
// 4. ZakatRateCache @PostConstruct
// 5. ZakatService constructor (dependencies injected)
// 6. ZakatService @PostConstruct

// => Destruction order (reverse):
// 1. ZakatService @PreDestroy
// 2. ZakatRateCache @PreDestroy
// 3. DatabaseConnectionPool @PreDestroy
```

### DependsOn for Explicit Ordering

```java
@Component  // => First bean
public class ConfigLoader {

    @PostConstruct
    public void loadConfig() {
        // => Loads configuration from external source
        System.out.println("1. Loading configuration...");
    }
}

@Component  // => Second bean: depends on ConfigLoader
@DependsOn("configLoader")  // => Bean name (camelCase)
// => Forces Spring to initialize configLoader BEFORE this bean
public class DatabaseInitializer {

    @PostConstruct
    public void initializeDatabase() {
        // => Runs after ConfigLoader.loadConfig() completes
        // => Can safely use loaded configuration
        System.out.println("2. Initializing database with loaded config...");
    }
}
```

## Trade-offs and When to Use

| Approach     | Lifecycle Control | Standardization            | Error Handling    | Ordering         |
| ------------ | ----------------- | -------------------------- | ----------------- | ---------------- |
| Manual Java  | Manual            | None                       | Try-catch         | Manual           |
| Spring Hooks | Automatic         | @PostConstruct/@PreDestroy | Container-managed | Dependency-based |

**When to Use Manual Java:**

- Simple scripts without Spring
- Single-use objects (create/use/dispose inline)
- Learning resource management patterns

**When to Use Spring Lifecycle:**

- Enterprise applications with complex initialization
- Resource management (connections, threads, caches)
- Need guaranteed cleanup on shutdown
- Dependency-ordered initialization required

## Best Practices

**1. Use @PostConstruct for Initialization**

```java
@Component
public class CacheService {
    private Map<String, Object> cache;

    @PostConstruct  // => PREFER: Spring-managed initialization
    public void initialize() {
        cache = new HashMap<>();
        // Warm cache...
    }
}
```

**2. Keep @PostConstruct Lightweight**

```java
@Component
public class DataLoader {

    @PostConstruct
    public void initialize() {
        // => AVOID: blocking I/O in @PostConstruct delays startup
        // loadMillionsOfRecords();  // Takes 5 minutes

        // => PREFER: schedule background load
        CompletableFuture.runAsync(this::loadMillionsOfRecords);
    }
}
```

**3. Idempotent Initialization**

```java
@Component
public class ConnectionPool {
    private boolean initialized = false;

    @PostConstruct
    public void initialize() {
        // => Check if already initialized (idempotency)
        if (initialized) {
            return;
        }
        // Initialize resources...
        initialized = true;
    }
}
```

**4. Graceful Shutdown in @PreDestroy**

```java
@Component
public class TaskExecutor {
    private ExecutorService executor;

    @PreDestroy
    public void destroy() {
        if (executor != null) {
            executor.shutdown();  // => Graceful shutdown
            try {
                // => Wait for tasks to complete
                if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                    executor.shutdownNow();  // => Force shutdown
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
```

**5. Avoid Mutable State in Singleton Beans**

```java
@Component  // => Singleton: shared across threads
public class ZakatCalculator {
    private BigDecimal lastCalculation;  // => DANGER: mutable state in singleton

    public BigDecimal calculate(BigDecimal amount) {
        // => Race condition: multiple threads modify lastCalculation
        lastCalculation = amount.multiply(new BigDecimal("0.025"));
        return lastCalculation;
    }
}

// => PREFER: stateless or ThreadLocal
@Component
public class ZakatCalculator {
    public BigDecimal calculate(BigDecimal amount) {
        // => No mutable state: thread-safe
        return amount.multiply(new BigDecimal("0.025"));
    }
}
```

## See Also

- [Dependency Injection](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/dependency-injection) - IoC container patterns
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Bean definition patterns
- [Component Scanning](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/component-scanning) - Auto-discovery
- Spring Threading - Thread safety in beans
