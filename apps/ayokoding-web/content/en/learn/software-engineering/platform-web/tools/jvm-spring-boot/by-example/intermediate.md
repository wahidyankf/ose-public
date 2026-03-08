---
title: "Intermediate"
date: 2025-12-24T00:00:00+07:00
draft: false
weight: 100000002
description: "Intermediate Spring Boot through 30 examples: transactions, validation, security, caching, async processing, WebSocket, API versioning, and advanced patterns"
tags: ["spring-boot", "tutorial", "by-example", "intermediate", "spring-security", "transactions", "testing", "caching"]
---

Learn intermediate Spring Boot patterns through 30 annotated examples covering production-ready techniques: transactions, security, testing, caching, async processing, WebSocket, API versioning, and advanced architectural patterns.

## Prerequisites

- Completed [beginner by-example tutorial](/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/by-example/beginner)
- Spring Boot 3.4.x + Java 17
- Understanding of JPA, REST APIs, and dependency injection

## Group 1: Transactions & Data

### Example 21: @Transactional Basics

Spring's declarative transaction management ensures data consistency through ACID properties.

**Spring Data JPA Auto-Configuration Flow**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Starter["spring-boot-starter-data-jpa"] --> Hibernate["Hibernate JPA Provider"]
    Starter --> DataSource["Auto-Configure DataSource"]
    DataSource --> Pool["HikariCP Connection Pool"]
    Hibernate --> EMF["EntityManagerFactory"]
    Pool --> EMF
    EMF --> Repos["JpaRepository Beans"]
    Repos --> Ready["Ready for @Transactional"]

    style Starter fill:#0173B2,color:#fff
    style Hibernate fill:#DE8F05,color:#fff
    style DataSource fill:#029E73,color:#fff
    style Pool fill:#CC78BC,color:#fff
    style EMF fill:#CA9161,color:#fff
    style Repos fill:#0173B2,color:#fff
    style Ready fill:#DE8F05,color:#fff
```

**Caption**: Spring Boot auto-configures JPA by detecting spring-boot-starter-data-jpa on classpath, creating DataSource, EntityManagerFactory, and repository beans automatically.

**Multiple DataSources Configuration Pattern**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Config["@Configuration Class"] --> Primary["@Primary DataSource"]
    Config --> Secondary["Secondary DataSource"]
    Primary --> PrimaryEMF["Primary EntityManagerFactory"]
    Secondary --> SecondaryEMF["Secondary EntityManagerFactory"]
    PrimaryEMF --> PrimaryRepos["@EnableJpaRepositories(basePackages=primary)"]
    SecondaryEMF --> SecondaryRepos["@EnableJpaRepositories(basePackages=secondary)"]
    PrimaryRepos --> PrimaryTx["Primary TransactionManager"]
    SecondaryRepos --> SecondaryTx["Secondary TransactionManager"]

    style Config fill:#0173B2,color:#fff
    style Primary fill:#DE8F05,color:#fff
    style Secondary fill:#029E73,color:#fff
    style PrimaryEMF fill:#CC78BC,color:#fff
    style SecondaryEMF fill:#CA9161,color:#fff
    style PrimaryRepos fill:#0173B2,color:#fff
    style SecondaryRepos fill:#DE8F05,color:#fff
    style PrimaryTx fill:#029E73,color:#fff
    style SecondaryTx fill:#CC78BC,color:#fff
```

**Caption**: Multiple datasources require separate DataSource, EntityManagerFactory, and TransactionManager beans with @Primary designating the default configuration.

```java
// pom.xml
<dependency>
// => Code line
  <groupId>org.springframework.boot</groupId>
  // => Code line
  <artifactId>spring-boot-starter-data-jpa</artifactId>
  // => Code line
</dependency>
// => Code line

// Domain model
@Entity
// => Annotation applied
public class BankAccount {
    // => Begins block
  @Id @GeneratedValue
  // => Annotation applied
  private Long id;
  // => Declares id field of type Long
  private String owner;
  // => Declares owner field of type String
  private BigDecimal balance;
  // => Declares balance field of type BigDecimal
  // constructors, getters, setters
}
// => Block delimiter

@Entity
// => Annotation applied
public class TransferLog {
    // => Begins block
  @Id @GeneratedValue
  // => Annotation applied
  private Long id;
  // => Declares id field of type Long
  private Long fromAccount;
  // => Declares fromAccount field of type Long
  private Long toAccount;
  // => Declares toAccount field of type Long
  private BigDecimal amount;
  // => Declares amount field of type BigDecimal
  private LocalDateTime timestamp;
  // => Declares timestamp field of type LocalDateTime
  // constructors, getters, setters
}
// => Block delimiter

// Repository
public interface AccountRepository extends JpaRepository<BankAccount, Long> {}
    // => Begins block
public interface TransferLogRepository extends JpaRepository<TransferLog, Long> {}
    // => Begins block

// Service with transactions
@Service
// => Annotation applied
public class TransferService {
    // => Begins block
  @Autowired private AccountRepository accountRepo;
  // => Injected repository for BankAccount CRUD operations
  @Autowired private TransferLogRepository logRepo;
  // => Injected repository for TransferLog audit trail

  @Transactional // Default: REQUIRED propagation, rollback on RuntimeException
  // => Annotation applied
  public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // => Begins block
    BankAccount from = accountRepo.findById(fromId)
      // => Retrieves source account, throws IllegalArgumentException if not found
      .orElseThrow(() -> new IllegalArgumentException("Source not found"));
    // => Executes method
    BankAccount to = accountRepo.findById(toId)
      // => Retrieves destination account for credit operation
      .orElseThrow(() -> new IllegalArgumentException("Destination not found"));
    // => Executes method

    if (from.getBalance().compareTo(amount) < 0) {
    // => Executes method
      throw new IllegalStateException("Insufficient funds"); // => Rollback entire transaction
      // => Assigns > Rollback entire transaction to //
    }
    // => Block delimiter

    from.setBalance(from.getBalance().subtract(amount));
    // => Executes method
    // => Debits source account (new balance = old balance - amount)
    to.setBalance(to.getBalance().add(amount));
    // => Executes method
    // => Credits destination account (new balance = old balance + amount)
    accountRepo.save(from);
    // => Executes method
    // => Persists updated source account to database
    accountRepo.save(to);
    // => Executes method
    // => Persists updated destination account to database

    // Log the transfer
    TransferLog log = new TransferLog();
    // => Creates new instance
    log.setFromAccount(fromId);
    // => Executes method
    log.setToAccount(toId);
    // => Executes method
    log.setAmount(amount);
    // => Executes method
    log.setTimestamp(LocalDateTime.now());
    // => Executes method
    // => Records exact time of transfer for audit trail
    logRepo.save(log);
    // => Executes method
    // => Persists transfer log entry (all-or-nothing with account updates)

    // If exception occurs here, ALL changes (both accounts + log) rollback
  }
  // => Block delimiter
}
// => Block delimiter

// Controller
@RestController
// => Annotation applied
@RequestMapping("/api/transfers")
    // => Executes method
public class TransferController {
    // => Begins block
  @Autowired private TransferService transferService;
  // => Annotation applied

  @PostMapping
  // => Annotation applied
  public ResponseEntity<String> transfer(
    @RequestParam Long fromId,
    @RequestParam Long toId,
    @RequestParam BigDecimal amount
  ) {
    // => Begins block
    try {
    // => Begins block
      transferService.transfer(fromId, toId, amount);
    // => Executes method
      return ResponseEntity.ok("Transfer successful");
    // => Returns value to caller
    } catch (Exception e) {
    // => Executes method
      return ResponseEntity.badRequest().body(e.getMessage());
    // => Returns value to caller
    }
  }
}
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
dependencies {
// => Block begins
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
}

// Domain model using Kotlin data classes with JPA annotations
@Entity
// => JPA entity mapped to database table
@Table(name = "bank_accounts")
// => Specifies database table name
open class BankAccount(
// => Class declaration
    @Id
    // => Primary key field
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // => Auto-generated primary key strategy
    var id: Long? = null,
    // => Mutable variable

    var owner: String = "",
    // => Mutable variable

    var balance: BigDecimal = BigDecimal.ZERO
    // => Mutable variable
    // BigDecimal for precise financial calculations (no floating-point errors)
) {
// => Block begins
    // Must be 'open' class for JPA lazy loading proxies
    // Default values provide no-arg constructor for JPA
}

@Entity
// => JPA entity mapped to database table
@Table(name = "transfer_logs")
// => Specifies database table name
open class TransferLog(
// => Class declaration
    @Id
    // => Primary key field
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // => Auto-generated primary key strategy
    var id: Long? = null,
    // => Mutable variable

    var fromAccount: Long? = null,
    // => Mutable variable
    var toAccount: Long? = null,
    // => Mutable variable
    var amount: BigDecimal = BigDecimal.ZERO,
    // => Mutable variable
    var timestamp: LocalDateTime = LocalDateTime.now()
    // => Mutable variable
)

// Repository interfaces - Kotlin syntax
interface AccountRepository : JpaRepository<BankAccount, Long>
// => Interface definition
interface TransferLogRepository : JpaRepository<TransferLog, Long>
// => Interface definition

// Service with transactions using primary constructor injection
@Service
// => Business logic layer Spring component
class TransferService(
// => Class declaration
    private val accountRepo: AccountRepository,
    // => Private class member
    // => Constructor injection - no @Autowired needed in Kotlin
    private val logRepo: TransferLogRepository
    // => Private class member
    // => Both repositories injected automatically by Spring
) {
// => Block begins

    @Transactional // Default: REQUIRED propagation, rollback on RuntimeException
    // => Wraps method in database transaction
    fun transfer(fromId: Long, toId: Long, amount: BigDecimal) {
    // => Function declaration
        val from = accountRepo.findById(fromId)
        // => Immutable binding (read-only reference)
            // => Retrieves source account, throws if not found
            .orElseThrow { IllegalArgumentException("Source not found") }
        // Lambda syntax for exception supplier

        val to = accountRepo.findById(toId)
        // => Immutable binding (read-only reference)
            // => Retrieves destination account for credit operation
            .orElseThrow { IllegalArgumentException("Destination not found") }

        if (from.balance < amount) {
        // => Block begins
            // Kotlin operator overloading for BigDecimal comparison
            throw IllegalStateException("Insufficient funds")
            // => Exception thrown, method execution terminates
            // => Rollback entire transaction
        }

        from.balance = from.balance - amount
        // => Assignment
        // => Kotlin operator overloading: subtract() method
        // Debits source account (new balance = old balance - amount)

        to.balance = to.balance + amount
        // => Assignment
        // => Kotlin operator overloading: add() method
        // Credits destination account (new balance = old balance + amount)

        accountRepo.save(from)
        // => Persists updated source account to database
        accountRepo.save(to)
        // => Persists updated destination account to database

        // Log the transfer
        val log = TransferLog(
        // => Immutable binding (read-only reference)
            fromAccount = fromId,
            // => Assignment
            toAccount = toId,
            // => Assignment
            amount = amount,
            // => Assignment
            timestamp = LocalDateTime.now()
            // => Assignment
        )
        // => Named parameters make construction clearer
        // Records exact time of transfer for audit trail

        logRepo.save(log)
        // => Persists transfer log entry (all-or-nothing with account updates)

        // If exception occurs here, ALL changes (both accounts + log) rollback
    }
}

// Controller using primary constructor injection
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/transfers")
// => HTTP endpoint mapping
class TransferController(
// => Class declaration
    private val transferService: TransferService
    // => Private class member
) {
// => Block begins

    @PostMapping
    // => HTTP endpoint mapping
    fun transfer(
    // => Function declaration
        @RequestParam fromId: Long,
        // => Annotation applied
        @RequestParam toId: Long,
        // => Annotation applied
        @RequestParam amount: BigDecimal
        // => Annotation applied
    ): ResponseEntity<String> {
    // => Block begins
        return try {
        // => Returns value to caller
            transferService.transfer(fromId, toId, amount)
            ResponseEntity.ok("Transfer successful")
        } catch (e: Exception) {
        // => Block begins
            ResponseEntity.badRequest().body(e.message)
            // e.message is nullable in Kotlin, handled by Jackson
        }
    }

    // Alternative idiomatic Kotlin using runCatching:
    // fun transfer(...) = runCatching {
    //     transferService.transfer(fromId, toId, amount)
    //     ResponseEntity.ok("Transfer successful")
    // }.getOrElse {
    //     ResponseEntity.badRequest().body(it.message)
    // }
    // Result-based error handling, more functional
}
```

**Key Takeaway**: `@Transactional` ensures all-or-nothing execution—either all database changes commit or all rollback on exception.

**Why It Matters**: Spring's declarative transaction management prevents data corruption from partial failures—without @Transactional, a bank transfer could debit one account but crash before crediting another, creating phantom money. Production financial systems rely on transaction boundaries to ensure ACID guarantees, automatically rolling back all database changes when exceptions occur, eliminating error-prone manual rollback code that causes financial discrepancies in non-transactional systems.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant C as Controller
    participant S as TransferService
    participant DB as Database

    C->>S: transfer(fromId, toId, amount)
    activate S
    Note over S: @Transactional begins
    S->>DB: BEGIN TRANSACTION
    S->>DB: UPDATE account SET balance=... WHERE id=fromId
    S->>DB: UPDATE account SET balance=... WHERE id=toId
    S->>DB: INSERT INTO transfer_log...
    alt Success
        S->>DB: COMMIT
        S-->>C: Success
    else Exception
        S->>DB: ROLLBACK
        S-->>C: Error
    end
    deactivate S

```

**Transaction Auto-Configuration Flow**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Starter["spring-boot-starter-data-jpa"] --> TxStarter["Detects spring-tx on classpath"]
    TxStarter --> Manager["Auto-Configure PlatformTransactionManager"]
    Manager --> JpaManager["JpaTransactionManager Bean"]
    JpaManager --> AOP["@EnableTransactionManagement"]
    AOP --> Proxy["Create @Transactional Proxies"]
    Proxy --> Interceptor["TransactionInterceptor"]
    Interceptor --> Ready["Methods Wrapped with TX Logic"]

    style Starter fill:#0173B2,color:#fff
    style TxStarter fill:#DE8F05,color:#fff
    style Manager fill:#029E73,color:#fff
    style JpaManager fill:#CC78BC,color:#fff
    style AOP fill:#CA9161,color:#fff
    style Proxy fill:#0173B2,color:#fff
    style Interceptor fill:#DE8F05,color:#fff
    style Ready fill:#029E73,color:#fff
```

**Caption**: Spring Boot automatically configures transaction management by creating PlatformTransactionManager bean and enabling AOP proxies for @Transactional methods.

---

### Example 22: Isolation Levels

Transaction isolation controls visibility of concurrent changes.

```java
@Service
// => Annotation applied
public class InventoryService {
    // => Begins block
  @Autowired private ProductRepository productRepo;
  // => Annotation applied

  // READ_COMMITTED: Prevents dirty reads
  @Transactional(isolation = Isolation.READ_COMMITTED)
  // => Annotation applied
  public int getStock(Long productId) {
    // => Begins block
    Product p = productRepo.findById(productId).orElseThrow();
    // => Fetches product from database within transaction boundary
    return p.getStock(); // => Sees only committed data from other transactions
    // => Assigns > Sees only committed data from other transactions to //
  }
  // => Block delimiter

  // REPEATABLE_READ: Prevents non-repeatable reads
  @Transactional(isolation = Isolation.REPEATABLE_READ)
  // => Annotation applied
  public void processOrder(Long productId, int quantity) {
    // => Begins block
    Product p = productRepo.findById(productId).orElseThrow();
    // => Fetches product from database within transaction boundary
    int initialStock = p.getStock(); // => 100
    // => Captures initial stock value (locks this value for entire transaction)

    // Simulate delay
    Thread.sleep(1000);
    // => Executes method

    // Even if another transaction updates stock, this transaction still sees 100
    int currentStock = productRepo.findById(productId).get().getStock(); // => Still 100
    // => Result stored in currentStock

    if (currentStock >= quantity) {
    // => Executes method
      p.setStock(currentStock - quantity);
    // => Executes method
      productRepo.save(p);
    // => Executes method
    }
    // => Block delimiter
  }

  // SERIALIZABLE: Strictest isolation (rarely needed)
  @Transactional(isolation = Isolation.SERIALIZABLE)
  public void criticalOperation(Long productId) {
    // => Begins block
    // Locks prevent concurrent access—transactions execute serially
  }
}
```

**Code (Kotlin)**:

```kotlin
@Service
class InventoryService(
    private val productRepo: ProductRepository
    // Constructor injection - no @Autowired needed
) {

    // READ_COMMITTED: Prevents dirty reads
    // Kotlin requires explicit Isolation import
    @Transactional(isolation = Isolation.READ_COMMITTED)
    fun getStock(productId: Long): Int {
        val p = productRepo.findById(productId).orElseThrow()
        // => Fetches product from database within transaction boundary
        return p.stock // => Sees only committed data from other transactions
        // Kotlin property access (no getStock() method call)
    }

    // REPEATABLE_READ: Prevents non-repeatable reads
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    fun processOrder(productId: Long, quantity: Int) {
        val p = productRepo.findById(productId).orElseThrow()
        // => Fetches product from database within transaction boundary
        val initialStock = p.stock // => 100
        // => Captures initial stock value (locks this value for entire transaction)

        // Simulate delay
        Thread.sleep(1000)
        // Kotlin doesn't require try-catch for InterruptedException
        // Unless you specifically need to handle it

        // Even if another transaction updates stock, this transaction still sees 100
        val currentStock = productRepo.findById(productId).get().stock // => Still 100
        // REPEATABLE_READ ensures consistent read within transaction

        if (currentStock >= quantity) {
            p.stock = currentStock - quantity
            productRepo.save(p)
        }
    }

    // SERIALIZABLE: Strictest isolation (rarely needed)
    @Transactional(isolation = Isolation.SERIALIZABLE)
    fun criticalOperation(productId: Long) {
        // Locks prevent concurrent access—transactions execute serially
        // Use only when absolute consistency required (inventory allocation, payment processing)
    }

    // Kotlin-specific: Suspend function for coroutines
    // @Transactional works with suspend functions in Spring 6+
    // @Transactional
    // suspend fun processOrderAsync(productId: Long, quantity: Int) {
    //     val p = productRepo.findById(productId).orElseThrow()
    //     delay(1000) // Non-blocking delay in coroutine
    //     p.stock -= quantity
    //     productRepo.save(p)
    // }
    // Coroutines enable non-blocking transaction processing
}
```

**Key Takeaway**: Higher isolation levels prevent concurrency issues but reduce throughput—choose based on consistency requirements.

**Why It Matters**: Isolation levels balance consistency against concurrency—SERIALIZABLE prevents all concurrency anomalies but reduces throughput to single-threaded performance, while READ_COMMITTED allows higher concurrency but risks non-repeatable reads. Production databases use READ_COMMITTED by default (PostgreSQL, Oracle) to achieve 80% of SERIALIZABLE safety at 300% higher throughput, reserving REPEATABLE_READ for financial transactions where accuracy outweighs performance.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A[Transaction Start] --> B{Isolation Level}

    B -->|READ_COMMITTED| C[Prevent Dirty Reads]
    B -->|REPEATABLE_READ| D[Prevent Dirty + Non-Repeatable Reads]
    B -->|SERIALIZABLE| E[Prevent All Anomalies]

    C --> F[High Concurrency<br/>Lower Consistency]
    D --> G[Medium Concurrency<br/>Medium Consistency]
    E --> H[Low Concurrency<br/>Full Consistency]

    F --> I[Production Default]
    G --> J[Financial Systems]
    H --> K[Critical Operations]

    style A fill:#0173B2,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
    style I fill:#029E73,stroke:#000,color:#fff
```

---

### Example 23: Optimistic Locking

Prevent lost updates with version-based concurrency control.

```java
@Entity
public class Product {
    // => Begins block
  @Id @GeneratedValue
  private Long id;
  // => Primary key auto-generated by database
  private String name;
  // => Product name (e.g., "Laptop", "Mouse")
  private int stock;
  // => Current inventory quantity

  @Version // Optimistic locking version field
  private Long version;
  // => JPA automatically increments this on every update
  // => Used in WHERE clause: UPDATE ... WHERE id=? AND version=?
  // => Throws OptimisticLockException if version changed since read

  // constructors, getters, setters
}

@Service
public class StockService {
    // => Begins block
  @Autowired private ProductRepository productRepo;
  // => Injected JPA repository for Product CRUD operations

  @Transactional
  public void decreaseStock(Long productId, int quantity) {
    // => Begins block
    Product product = productRepo.findById(productId).orElseThrow();
    // => Fetches product with current version (e.g., version=1)
    // => Throws exception if product not found

    product.setStock(product.getStock() - quantity);
    // => Executes method
    // => Decreases stock: new stock = old stock - quantity
    // => Example: 100 - 5 = 95 (not yet persisted)
    productRepo.save(product);
    // => Executes method
    // => SQL: UPDATE product SET stock=95, version=2 WHERE id=? AND version=1
    // => If version still 1 → success, version becomes 2
    // => If version changed to 2 by another transaction → OptimisticLockException
    // => Prevents lost updates in concurrent modifications

    // If another transaction updated product (version=2), this fails with OptimisticLockException
  }

  // Retry logic for conflicts
  @Transactional
  public void decreaseStockWithRetry(Long productId, int quantity) {
    // => Begins block
    int maxRetries = 3;
    // => Assigns value to variable
    // => Allow up to 3 attempts to handle concurrent updates gracefully
    for (int i = 0; i < maxRetries; i++) {
    // => Executes method
      // => Attempt counter: i=0, i=1, i=2
      try {
    // => Begins block
        Product product = productRepo.findById(productId).orElseThrow();
        // => Fetches latest version from database
        product.setStock(product.getStock() - quantity);
    // => Executes method
        // => Calculates new stock quantity
        productRepo.save(product);
    // => Executes method
        // => Attempts save with version check
        return; // Success
        // => Exit method if save succeeds (no exception thrown)
      } catch (OptimisticLockException e) {
    // => Executes method
        // => Another transaction modified product since we read it
        if (i == maxRetries - 1) throw e; // Retries exhausted
    // => Executes method
        // => On final retry (i=2), re-throw exception to caller
        // Retry with fresh data
        // => Loop continues, fetches updated version, tries again
      }
    }
  }
}
```

**Code (Kotlin)**:

```kotlin
@Entity
// => JPA entity - maps to database table
// => JPA entity mapped to database table
@Table(name = "products")
// => Specifies database table name
// => Specifies database table name
open class Product(
// => Class declaration
// => Class declaration
    @Id
    // => JPA primary key field
    // => Primary key field
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // => Auto-generate primary key value
    // => Auto-generated primary key strategy
    var id: Long? = null,
    // => Mutable property
    // => Mutable variable

    var name: String = "",
    // => Mutable property
    // => Mutable variable
    var stock: Int = 0,
    // => Mutable property
    // => Mutable variable

    @Version // Optimistic locking version field
    // => Annotation applied
    // => Annotation applied
    var version: Long? = null
    // => Mutable property
    // => Mutable variable
    // => JPA automatically increments on each update
    // Null initially, set by JPA after first persist
) {
// => Block begins
    // Must be 'open' for JPA proxies
}

@Service
// => Business logic service bean
// => Business logic layer Spring component
class StockService(
// => Class declaration
// => Class declaration
    private val productRepo: ProductRepository
    // => Immutable property
    // => Private class member
) {
// => Block begins

    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun decreaseStock(productId: Long, quantity: Int) {
    // => Function definition
    // => Function declaration
        val product = productRepo.findById(productId).orElseThrow()
        // => Immutable property
        // => Immutable binding (read-only reference)
        // version = 1 (current version from database)

        product.stock -= quantity
        // => Assignment
        // => Assignment
        // Kotlin operator overloading for subtraction
        productRepo.save(product)
        // SQL: UPDATE product SET stock=?, version=2 WHERE id=? AND version=1
        // => Version automatically incremented to 2

        // If another transaction updated product (version=2), this fails with OptimisticLockException
        // Exception rollbacks current transaction
    }

    // Retry logic for conflicts using Kotlin repeat
    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun decreaseStockWithRetry(productId: Long, quantity: Int) {
    // => Function definition
    // => Function declaration
        val maxRetries = 3
        // => Immutable property
        // => Immutable binding (read-only reference)
        repeat(maxRetries) { attempt ->
            try {
            // => Exception handling begins
                val product = productRepo.findById(productId).orElseThrow()
                // => Immutable property
                // => Immutable binding (read-only reference)
                product.stock -= quantity
                // => Assignment
                // => Assignment
                productRepo.save(product)
                return // Success - exit function
                // => Returns to caller
                // => Returns value to caller
            } catch (e: OptimisticLockException) {
            // => Block begins
                if (attempt == maxRetries - 1) throw e // Retries exhausted
                // => Assignment
                // Retry with fresh data (next iteration)
            }
        }
    }

    // Alternative using Kotlin retry utility (more functional)
    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun decreaseStockFunctional(productId: Long, quantity: Int) {
    // => Function definition
    // => Function declaration
        var lastException: OptimisticLockException? = null
        // => Mutable property
        // => Mutable variable

        repeat(3) {
        // => Block begins
            try {
            // => Exception handling begins
                val product = productRepo.findById(productId).orElseThrow()
                // => Immutable property
                // => Immutable binding (read-only reference)
                product.stock -= quantity
                // => Assignment
                // => Assignment
                productRepo.save(product)
                return // Success
                // => Returns to caller
                // => Returns value to caller
            } catch (e: OptimisticLockException) {
            // => Block begins
                lastException = e
                // => Assignment
                // => Assignment
            }
        }

        throw lastException!! // All retries failed
        // => Throws exception
        // => Exception thrown, method execution terminates
    }
}
```

**Key Takeaway**: `@Version` prevents lost updates by failing conflicting transactions—use retry logic for conflict resolution.

**Why It Matters**: Optimistic locking enables high-concurrency updates without pessimistic database locks that block other transactions—version numbers detect conflicting updates at commit time instead of blocking readers during writes. E-commerce platforms use optimistic locking for shopping carts where 99% of updates succeed without conflicts, achieving 10x higher throughput than pessimistic locking while preventing lost updates when two users simultaneously buy the last item, with retry logic handling the rare 1% of conflicts gracefully.

---

### Example 24: Batch Operations

Optimize bulk database operations with batching.

```java
// application.properties
spring.jpa.properties.hibernate.jdbc.batch_size=50
// => Groups SQL statements into batches of 50 (reduces network roundtrips)
spring.jpa.properties.hibernate.order_inserts=true
// => Groups INSERTs by entity type for efficient batching
spring.jpa.properties.hibernate.order_updates=true
// => Groups UPDATEs by entity type for efficient batching

@Service
public class BulkImportService {
    // => Begins block
  @Autowired private ProductRepository productRepo;
  // => Injected JPA repository for Product operations
  @Autowired private EntityManager entityManager;
  // => Direct JPA EntityManager for manual flush/clear control

  // Inefficient: N+1 queries
  @Transactional
  public void importProductsSlow(List<Product> products) {
    // => Begins block
    // => Example: 1000 products
    for (Product p : products) {
    // => Executes method
      productRepo.save(p); // => 1000 products = 1000 INSERT statements
      // => Each save triggers immediate database roundtrip
      // => Total: 1000 network calls (very slow)
    }
    // => Performance: ~10 seconds for 1000 products
  }

  // Better: Batch inserts
  @Transactional
  public void importProductsFast(List<Product> products) {
    // => Begins block
    productRepo.saveAll(products); // => Batches 1000 products into 20 INSERTs (50 per batch)
    // => Hibernate groups inserts: batch_size=50
    // => Total: 20 network calls instead of 1000
    // => Performance: ~2 seconds for 1000 products (5x faster)
  }

  // Best: Manual batch flushing for large datasets
  @Transactional
  public void importProductsOptimal(List<Product> products) {
    // => Begins block
    int batchSize = 50;
    // => Assigns value to variable
    // => Process 50 entities at a time
    for (int i = 0; i < products.size(); i++) {
    // => Executes method
      // => Iterate through all products
      entityManager.persist(products.get(i));
    // => Executes method
      // => Queues entity for insert (not yet executed)
      if (i % batchSize == 0 && i > 0) {
    // => Executes method
        // => Every 50 products: i=50, i=100, i=150...
        entityManager.flush(); // Force batch execution
    // => Executes method
        // => Executes accumulated INSERTs: INSERT INTO product VALUES (...), (...), ...
        entityManager.clear(); // Free memory
    // => Executes method
        // => Detaches entities from persistence context (prevents OutOfMemoryError)
        // => Crucial for processing 100,000+ entities
      }
    }
    // => Final flush happens automatically at transaction commit
    // => Performance: ~1.5 seconds for 1000 products (memory-efficient)
  }

  // Bulk update with JPQL
  @Transactional
  public void discountAllProducts(BigDecimal discountPercent) {
    // => Begins block
    // => Example: discountPercent = 0.10 (10% discount)
    int updated = entityManager.createQuery(
    // => Assigns value to variable
      "UPDATE Product p SET p.price = p.price * :factor"
      // => JPQL query: updates ALL products in single SQL statement
    ).setParameter("factor", BigDecimal.ONE.subtract(discountPercent))
      // => factor = 1.0 - 0.10 = 0.90 (multiply price by 0.90 for 10% off)
     .executeUpdate(); // => Single UPDATE statement for all rows
     // => SQL: UPDATE product SET price = price * 0.90
     // => Updates 10,000 products in ~100ms (vs 10 seconds with individual saves)
     // => Returns number of updated rows

    System.out.println("Updated " + updated + " products");
    // => Output: Updated 10000 products
  }
}
```

**Code (Kotlin)**:

```properties
# application.properties - same for Kotlin
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

```kotlin
@Service
// => Business logic service bean
// => Business logic layer Spring component
class ProductImportService(
// => Class declaration
// => Class declaration
    private val productRepo: ProductRepository,
    // => Immutable property
    // => Private class member
    private val entityManager: EntityManager
    // => Immutable property
    // => Private class member
    // EntityManager injection for manual flush/clear
) {
// => Block begins

    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun importProducts(csvFile: String) {
    // => Function definition
    // => Function declaration
        val products = parseCsv(csvFile)
        // => Immutable property
        // => Immutable binding (read-only reference)
        // => Returns List<Product> from CSV parsing

        // Small batch: Use saveAll() - simple and effective
        productRepo.saveAll(products)
        // => Hibernate batches inserts based on batch_size property (50)
        // Executes: INSERT INTO product ... (50 values per batch)
    }

    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun importLargeDataset(csvFile: String) {
    // => Function definition
    // => Function declaration
        val products = parseCsv(csvFile)
        // => Immutable property
        // => Immutable binding (read-only reference)
        // => Could be 100,000+ products

        products.chunked(50).forEach { batch ->
            // Kotlin chunked() splits list into batches of 50
            productRepo.saveAll(batch)
            // => Saves batch of 50 products

            entityManager.flush()
            // => Forces Hibernate to execute SQL immediately
            entityManager.clear()
            // => Clears persistence context (prevents memory leak)
            // Critical for large datasets - releases processed entities from memory
        }

        println("Imported ${products.size} products")
        // => Output: see string template value above
        // String template instead of concatenation
    }

    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun bulkPriceUpdate(category: String, discount: Double) {
    // => Function definition
    // => Function declaration
        // JPQL bulk update - most efficient for mass updates
        val updated = entityManager.createQuery(
        // => Immutable property
        // => Immutable binding (read-only reference)
            "UPDATE Product p SET p.price = p.price * :discount WHERE p.category = :category"
            // => Assignment
            // => Assignment
        )
            .setParameter("discount", discount)
            .setParameter("category", category)
            .executeUpdate()
        // => Executes single SQL: UPDATE product SET price = price * ? WHERE category = ?
        // Updates all matching rows without loading entities into memory

        println("Updated $updated products")
        // => Output: see string template value above
        // String template for logging
    }

    private fun parseCsv(file: String): List<Product> {
    // => Function definition
    // => Function declaration
        // CSV parsing implementation
        return emptyList() // Placeholder
        // => Returns to caller
        // => Returns value to caller
    }
}

// Alternative using Kotlin sequence for streaming large files
@Service
// => Business logic service bean
// => Business logic layer Spring component
class StreamingImportService(
// => Class declaration
// => Class declaration
    private val productRepo: ProductRepository,
    // => Immutable property
    // => Private class member
    private val entityManager: EntityManager
    // => Immutable property
    // => Private class member
) {
// => Block begins

    @Transactional
    // => Wrap in database transaction
    // => Wraps method in database transaction
    fun importProductsStreaming(csvFile: String) {
    // => Function definition
    // => Function declaration
        File(csvFile).useLines { lines ->
            // useLines automatically closes file - Kotlin resource management
            lines
                .drop(1) // Skip header row
                .chunked(50) // Process in batches of 50
                .forEach { batch ->
                    val products = batch.map { parseLine(it) }
                    // => Immutable property
                    // => Immutable binding (read-only reference)
                    productRepo.saveAll(products)
                    entityManager.flush()
                    entityManager.clear()
                }
        }
        // File automatically closed after useLines block
        // Memory efficient - processes file line by line
    }

    private fun parseLine(line: String): Product {
    // => Function definition
    // => Function declaration
        // Parse single CSV line to Product
        return Product() // Placeholder
        // => Returns to caller
        // => Returns value to caller
    }
}
```

**Key Takeaway**: Batch operations reduce database round-trips—use `saveAll()` for small batches, manual flushing for large datasets.

**Why It Matters**: Batch operations reduce database roundtrips significantly (for example, from 1000 individual INSERTs to 20 batched operations with 50 items per batch)—critical for ETL jobs processing large datasets. Production data pipelines use batch updates with manual flush/clear to import large volumes of data without exhausting memory, while JPQL bulk updates execute single SQL statements that modify many rows without loading entities into memory.

---

## Group 2: Spring Security

### Example 25: Security Auto-Configuration

Spring Boot auto-configures basic security by default.

```java
// pom.xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
  // => Adding this dependency triggers Spring Security auto-configuration
  // => No additional code needed for basic authentication
</dependency>

// With just the dependency, Spring Boot:
// 1. Generates random password on startup (console log)
//    => Password changes every restart (check console output)
// 2. Secures all endpoints with HTTP Basic Auth
//    => Requires username + password in Authorization header
// 3. Default username: "user"
//    => Configurable via spring.security.user.name property
// 4. CSRF protection enabled
//    => Prevents cross-site request forgery attacks
// 5. Session management configured
//    => HTTP sessions created for authenticated users

@RestController
public class SecuredController {
    // => Begins block
  @GetMapping("/public")
    // => Executes method
  public String publicEndpoint() {
    // => Begins block
    return "Accessible without auth"; // => Still requires login by default!
    // => Spring Security secures ALL endpoints unless explicitly permitted
    // => Returns 401 Unauthorized if no credentials provided
  }

  @GetMapping("/api/data")
    // => Executes method
  public String securedEndpoint() {
    // => Begins block
    return "Protected data"; // => Requires authentication
    // => HTTP Basic authentication required
    // => Returns data only if valid username/password provided
  }
}

// Run the app and see console:
// Using generated security password: a1b2c3d4-e5f6-7890-abcd-ef1234567890
// => Copy this password from console output (changes every restart)

// curl http://localhost:8080/api/data => 401 Unauthorized
// => No credentials provided → request rejected

// curl -u user:a1b2c3d4-e5f6-7890-abcd-ef1234567890 http://localhost:8080/api/data => "Protected data"
// => -u flag provides username:password
// => Authorization header: Basic dXNlcjphMWIyYzNkNC4uLg== (base64 encoded)
// => Authentication succeeds → data returned
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
dependencies {
// => Block begins
    implementation("org.springframework.boot:spring-boot-starter-security")
}

// With just the dependency, Spring Boot:
// 1. Generates random password on startup (console log)
// 2. Secures all endpoints with HTTP Basic Auth
// 3. Default username: "user"
// 4. CSRF protection enabled
// 5. Session management configured

@RestController
// => Combines @Controller and @ResponseBody
class SecuredController {
// => Class declaration

    @GetMapping("/public")
    // => HTTP endpoint mapping
    fun publicEndpoint(): String {
    // => Function declaration
        return "Accessible without auth" // => Still requires login by default!
        // Spring Security secures ALL endpoints unless explicitly permitted
    }

    @GetMapping("/api/data")
    // => HTTP endpoint mapping
    fun securedEndpoint(): String {
    // => Function declaration
        return "Protected data" // => Requires authentication
        // Returns data only if authenticated via HTTP Basic
    }
}

// Run the app and see console:
// Using generated security password: a1b2c3d4-e5f6-7890-abcd-ef1234567890
// curl http://localhost:8080/api/data => 401 Unauthorized
// curl -u user:a1b2c3d4-e5f6-7890-abcd-ef1234567890 http://localhost:8080/api/data => "Protected data"

// Kotlin tip: Access authenticated user in controller
@RestController
// => Combines @Controller and @ResponseBody
class AuthenticatedController {
// => Class declaration

    @GetMapping("/me")
    // => HTTP endpoint mapping
    fun currentUser(@AuthenticationPrincipal user: UserDetails): String {
    // => Function declaration
        // @AuthenticationPrincipal injects authenticated user
        return "Hello, ${user.username}"
        // => Returns value to caller
        // String template for user greeting
    }

    // Alternative using SecurityContextHolder (less idiomatic)
    @GetMapping("/me-manual")
    // => HTTP endpoint mapping
    fun currentUserManual(): String {
    // => Function declaration
        val auth = SecurityContextHolder.getContext().authentication
        // => Immutable binding (read-only reference)
        return "Hello, ${auth.name}"
        // => Returns value to caller
    }
}
```

**Key Takeaway**: Spring Security auto-configuration secures everything by default—customize with `SecurityFilterChain` beans.

**Why It Matters**: Spring Security's auto-configuration prevents 80% of OWASP Top 10 vulnerabilities (CSRF, session fixation, clickjacking) through secure defaults, eliminating manual security code that developers implement incorrectly. However, default form login exposes application structure through /login pages—production systems replace it with JWT or OAuth2 for stateless authentication that scales horizontally without session affinity, enabling load balancers to distribute traffic across instances without sticky sessions.

---

### Example 26: Custom Authentication

Configure users, passwords, and access rules.

```java
@Configuration
// => Configuration class - contains @Bean methods
// => Spring configuration class - defines bean factory methods
// => Annotation applied
@EnableWebSecurity
// => Enables Spring Security configuration
// => Enables Spring Security web/method security
// => Annotation applied
public class SecurityConfig {
// => Class declaration
// => Class definition begins
    // => Begins block

  @Bean
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  // => Annotation applied
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
  // => Method definition
  // => Method definition
    // => Begins block
    http // => Configure HTTP security chain
      .authorizeHttpRequests(auth -> auth // => Define authorization rules
        .requestMatchers("/public/**").permitAll() // => Public endpoints (no auth required)
        .requestMatchers("/admin/**").hasRole("ADMIN") // => Admin endpoints (requires ADMIN role)
        .anyRequest().authenticated() // => All other endpoints require authentication
        // => Executes method call
      )
      .formLogin(form -> form // => Configure form-based login
        .loginPage("/login") // => Custom login page URL
        // => Executes method call
        .permitAll()
    // => Executes method
      )
      .logout(logout -> logout.permitAll()); // => Enable logout endpoint
      // => Assigns > Enable logout endpoint to //

    return http.build(); // => Build SecurityFilterChain bean
    // => Assigns > Build SecurityFilterChain bean to //
  }
  // => Block delimiter

  @Bean
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  // => Annotation applied
  public UserDetailsService userDetailsService() {
  // => Method definition
  // => Method definition
    // => Begins block
    // => In-memory users (for demo—use database/LDAP in production)
    UserDetails user = User.builder() // => Create user with builder pattern
      .username("user") // => Username for authentication
      .password(passwordEncoder().encode("password123")) // => BCrypt-hashed password
      .roles("USER") // => Granted authority: ROLE_USER
      .build(); // => Immutable UserDetails object
      // => Assigns > Immutable UserDetails object to //

    UserDetails admin = User.builder() // => Create admin user
      .username("admin") // => Admin username
      .password(passwordEncoder().encode("admin123")) // => BCrypt-hashed admin password
      .roles("ADMIN", "USER") // => Multiple roles: ROLE_ADMIN + ROLE_USER
      .build(); // => Admin has both USER and ADMIN privileges
      // => Assigns > Admin has both USER and ADMIN privileges to //

    return new InMemoryUserDetailsManager(user, admin); // => Store users in memory (non-persistent)
    // => Assigns > Store users in memory (non-persistent) to //
  }

  @Bean
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  public PasswordEncoder passwordEncoder() {
  // => Method definition
  // => Method definition
    // => Begins block
    return new BCryptPasswordEncoder(); // => BCrypt with automatic salt generation (industry standard)
    // => Assigns > BCrypt with automatic salt generation (industry standard) to //
  }
}

// Controller
@RestController
// => REST controller - returns JSON directly
// => REST controller - combines @Controller + @ResponseBody
public class ApiController {
// => Class declaration
// => Class definition begins
    // => Begins block
  @GetMapping("/public/hello")
  // => HTTP GET endpoint
  // => HTTP endpoint mapping
    // => Executes method
  public String publicHello() {
  // => Method definition
  // => Method definition
    // => Begins block
    return "Public endpoint"; // => Accessible without login
    // => Assigns > Accessible without login to //
  }

  @GetMapping("/api/user-data")
  // => HTTP GET endpoint
  // => HTTP endpoint mapping
    // => Executes method
  public String userData() {
  // => Method definition
  // => Method definition
    // => Begins block
    return "User data"; // => Requires USER or ADMIN role
    // => Assigns > Requires USER or ADMIN role to //
  }

  @GetMapping("/admin/dashboard")
  // => HTTP GET endpoint
  // => HTTP endpoint mapping
    // => Executes method
  public String adminDashboard() {
  // => Method definition
  // => Method definition
    // => Begins block
    return "Admin dashboard"; // => Requires ADMIN role only
    // => Assigns > Requires ADMIN role only to //
  }
}
```

**Code (Kotlin)**:

```kotlin
@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
@EnableWebSecurity
// => Enables Spring Security configuration
// => Annotation applied
open class SecurityConfig {
// => Class declaration
// => Class declaration

    @Bean
    // => Defines a Spring-managed bean
    // => Declares a Spring-managed bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    // => Function definition
    // => Function declaration
        // Kotlin DSL for Spring Security configuration
        http {
        // => Block begins
            // Lambda-based configuration (Kotlin DSL)
            authorizeHttpRequests {
            // => Block begins
                authorize("/public/**", permitAll) // => Public endpoints (no auth required)
                authorize("/admin/**", hasRole("ADMIN")) // => Admin endpoints (requires ADMIN role)
                authorize(anyRequest, authenticated) // => All other endpoints require authentication
            }
            formLogin {
            // => Block begins
                loginPage = "/login" // => Custom login page URL
                permitAll()
            }
            logout {
            // => Block begins
                permitAll()
            }
        }
        return http.build() // => Build SecurityFilterChain bean
    }

    @Bean
    // => Defines a Spring-managed bean
    // => Declares a Spring-managed bean
    open fun userDetailsService(): UserDetailsService {
    // => Function definition
    // => Function declaration
        // In-memory users (for demo—use database/LDAP in production)
        val user = User.builder() // => Create user with builder pattern
            .username("user") // => Username for authentication
            .password(passwordEncoder().encode("password123")) // => BCrypt-hashed password
            .roles("USER") // => Granted authority: ROLE_USER
            .build() // => Immutable UserDetails object

        val admin = User.builder() // => Create admin user
            .username("admin") // => Admin username
            .password(passwordEncoder().encode("admin123")) // => BCrypt-hashed admin password
            .roles("ADMIN", "USER") // => Multiple roles: ROLE_ADMIN + ROLE_USER
            .build() // => Admin has both USER and ADMIN privileges

        return InMemoryUserDetailsManager(user, admin)
        // => Returns to caller
        // => Returns value to caller
        // => Store users in memory (non-persistent)
        // Kotlin allows direct constructor call without 'new'
    }

    @Bean
    // => Defines a Spring-managed bean
    // => Declares a Spring-managed bean
    open fun passwordEncoder(): PasswordEncoder {
    // => Function definition
    // => Function declaration
        return BCryptPasswordEncoder()
        // => Returns to caller
        // => Returns value to caller
        // => BCrypt with automatic salt generation (industry standard)
    }
}

// Controller using Kotlin
@RestController
// => REST controller - returns JSON directly
// => Combines @Controller and @ResponseBody
class ApiController {
// => Class declaration
// => Class declaration

    @GetMapping("/public/hello")
    // => HTTP GET endpoint
    // => HTTP endpoint mapping
    fun publicHello() = "Public endpoint"
    // => Function definition
    // => Function declaration
    // Expression body - concise for simple returns
    // => Accessible without login

    @GetMapping("/api/user-data")
    // => HTTP GET endpoint
    // => HTTP endpoint mapping
    fun userData() = "User data"
    // => Function definition
    // => Function declaration
    // => Requires USER or ADMIN role

    @GetMapping("/admin/dashboard")
    // => HTTP GET endpoint
    // => HTTP endpoint mapping
    fun adminDashboard() = "Admin dashboard"
    // => Function definition
    // => Function declaration
    // => Requires ADMIN role only

    // Access authenticated user details
    @GetMapping("/api/profile")
    // => HTTP GET endpoint
    // => HTTP endpoint mapping
    fun userProfile(@AuthenticationPrincipal user: UserDetails): Map<String, Any> {
    // => Function definition
    // => Function declaration
        return mapOf(
        // => Returns to caller
        // => Returns value to caller
            "username" to user.username,
            // => Statement
            "authorities" to user.authorities.map { it.authority }
        )
        // => Returns {"username":"user","authorities":["ROLE_USER"]}
        // mapOf creates immutable map, to is infix function for Pair
    }
}
```

**Key Takeaway**: `SecurityFilterChain` defines authorization rules—combine with `UserDetailsService` for custom user storage.

**Why It Matters**: Custom authentication and authorization with SecurityFilterChain provides fine-grained access control beyond default form login—URL patterns, HTTP methods, and user roles combine to enforce security policies that prevent unauthorized access. Production applications use method-level security (@PreAuthorize, @Secured) for business logic protection where URL security alone is insufficient, implementing complex authorization rules (resource ownership, tenant isolation) that URL patterns cannot express.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    A[HTTP Request] --> B{Security Filter Chain}
    B -->|/public/**| C[Permit All]
    B -->|/admin/**| D{Has ADMIN Role?}
    B -->|Other| E{Authenticated?}

    D -->|Yes| F[Allow Access]
    D -->|No| G[403 Forbidden]

    E -->|Yes| F
    E -->|No| H[Redirect to Login]

    H --> I[UserDetailsService]
    I --> J[Check Credentials]
    J -->|Valid| K[Create Authentication]
    J -->|Invalid| L[401 Unauthorized]

    K --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
    style G fill:#CC78BC,stroke:#000,color:#fff
    style L fill:#CC78BC,stroke:#000,color:#fff
```

---

### Example 27: Method-Level Authorization

Secure individual methods with annotations.

```java
@Configuration
// => Spring configuration class - defines bean factory methods
// => Annotation applied
@EnableMethodSecurity // Enable method security annotations
// => Enables Spring Security web/method security
// => Annotation applied
public class MethodSecurityConfig {}
// => Class definition begins
    // => Begins block

@Service
// => Business logic layer Spring component
// => Annotation applied
public class OrderService {
// => Class definition begins
    // => Begins block
  @Autowired private OrderRepository orderRepo;
  // => Spring injects dependency automatically
  // => Annotation applied

  @PreAuthorize("hasRole('USER')") // => Check role BEFORE method execution
  public List<Order> getMyOrders(String username) { // => username parameter from authenticated user
    return orderRepo.findByUsername(username); // => Query orders filtered by username
    // => Assigns > Query orders filtered by username to //
  }
  // => Block delimiter

  @PreAuthorize("hasRole('ADMIN')") // => ADMIN role required (throws AccessDeniedException if missing)
  public List<Order> getAllOrders() { // => Admin-only endpoint
    return orderRepo.findAll(); // => Returns ALL orders (no filtering)
    // => Assigns > Returns ALL orders (no filtering) to //
  }
  // => Block delimiter

  @PreAuthorize("#username == authentication.name") // => SpEL expression: method param matches authenticated username
  // => Annotation applied
  public Order getOrder(String username, Long orderId) {
  // => Method definition
    // => Begins block
    return orderRepo.findByIdAndUsername(orderId, username) // => Query with composite key
      .orElseThrow(() -> new AccessDeniedException("Not authorized")); // => Explicit access denial
      // => Assigns > Explicit access denial to //
  }
  // => Block delimiter

  @PreAuthorize("hasRole('ADMIN') or #order.username == authentication.name") // => Admin OR resource owner can update
  // => Annotation applied
  public Order updateOrder(Order order) {
  // => Method definition
    // => Begins block
    return orderRepo.save(order); // => Persist updated order (authorization already checked)
    // => Assigns > Persist updated order (authorization already checked) to //
  }

  @PostAuthorize("returnObject.username == authentication.name") // => Check AFTER execution (compare returned order's owner)
  public Order loadOrder(Long orderId) {
  // => Method definition
    // => Begins block
    return orderRepo.findById(orderId).orElseThrow(); // => Fetch order first
    // => THEN Spring verifies returnObject.username matches authentication.name
  }
}

// Controller
@RestController
// => REST controller - combines @Controller + @ResponseBody
@RequestMapping("/api/orders")
// => Annotation applied
    // => Executes method
public class OrderController {
// => Class definition begins
    // => Begins block
  @Autowired private OrderService orderService;
  // => Spring injects dependency automatically

  @GetMapping("/my-orders") // => Endpoint: GET /api/orders/my-orders
  public List<Order> getMyOrders(@AuthenticationPrincipal UserDetails user) { // => Inject authenticated user
    return orderService.getMyOrders(user.getUsername()); // => Pass authenticated username to service layer
    // => Assigns > Pass authenticated username to service layer to //
  }

  @GetMapping("/all")
  // => HTTP endpoint mapping
    // => Executes method
  public List<Order> getAllOrders() {
  // => Method definition
    // => Begins block
    return orderService.getAllOrders(); // => Service method checks @PreAuthorize("hasRole('ADMIN')")
    // => Sets // to string literal
  }
}
```

**Code (Kotlin)**:

```kotlin
@Configuration
// => Marks class as Spring configuration (bean factory)
@EnableMethodSecurity // Enable method security annotations in Kotlin
// => Annotation applied
open class MethodSecurityConfig
// => Class declaration

@Service
// => Business logic layer Spring component
class OrderService(
// => Class declaration
    private val orderRepo: OrderRepository
    // => Private class member
) {
// => Block begins

    @PreAuthorize("hasRole('USER')") // => Check role BEFORE method execution
    fun getMyOrders(username: String): List<Order> {
    // => Function declaration
        // username parameter from authenticated user
        return orderRepo.findByUsername(username)
        // => Returns value to caller
        // => Query orders filtered by username
    }

    @PreAuthorize("hasRole('ADMIN')")
    // => Annotation applied
    // => ADMIN role required (throws AccessDeniedException if missing)
    fun getAllOrders(): List<Order> {
    // => Function declaration
        return orderRepo.findAll() // => Returns ALL orders (no filtering)
    }

    @PreAuthorize("#username == authentication.name")
    // => Annotation applied
    // => SpEL expression: method param matches authenticated username
    // #username refers to method parameter, authentication is Spring Security context
    fun getOrder(username: String, orderId: Long): Order {
    // => Function declaration
        return orderRepo.findByIdAndUsername(orderId, username)
        // => Returns value to caller
            .orElseThrow { AccessDeniedException("Not authorized") }
        // => Kotlin lambda for exception supplier
    }

    @PreAuthorize("hasRole('ADMIN') or #order.username == authentication.name")
    // => Annotation applied
    // => Admin OR resource owner can update
    // SpEL expression with 'or' operator and property access
    fun updateOrder(order: Order): Order {
    // => Function declaration
        return orderRepo.save(order)
        // => Returns value to caller
        // => Persist updated order (authorization already checked)
    }

    @PostAuthorize("returnObject.username == authentication.name")
    // => Annotation applied
    // => Check AFTER execution (compare returned order's owner)
    // returnObject is SpEL variable for method return value
    fun loadOrder(orderId: Long): Order {
    // => Function declaration
        return orderRepo.findById(orderId).orElseThrow()
        // => Returns value to caller
        // => Fetch order first
        // => THEN Spring verifies returnObject.username matches authentication.name
    }
}

// Controller using Kotlin
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/orders")
// => HTTP endpoint mapping
class OrderController(
// => Class declaration
    private val orderService: OrderService
    // => Private class member
) {
// => Block begins

    @GetMapping("/my-orders")
    // => HTTP endpoint mapping
    // => Endpoint: GET /api/orders/my-orders
    fun getMyOrders(@AuthenticationPrincipal user: UserDetails): List<Order> {
    // => Function declaration
        // => Inject authenticated user details
        return orderService.getMyOrders(user.username)
        // => Returns value to caller
        // => Pass authenticated username to service layer
        // Kotlin property access (no getUsername() call)
    }

    @GetMapping("/all")
    // => HTTP endpoint mapping
    fun getAllOrders(): List<Order> {
    // => Function declaration
        return orderService.getAllOrders()
        // => Returns value to caller
        // => Service method checks @PreAuthorize("hasRole('ADMIN')")
    }

    // Kotlin-specific: Extension function for SpEL expressions
    @GetMapping("/{id}")
    // => HTTP endpoint mapping
    fun getOrder(
    // => Function declaration
        @PathVariable id: Long,
        // => Annotation applied
        @AuthenticationPrincipal user: UserDetails
        // => Annotation applied
    ): Order {
    // => Block begins
        return orderService.getOrder(user.username, id)
        // => Returns value to caller
        // Method-level security validates access
    }
}
```

**Key Takeaway**: `@PreAuthorize` and `@PostAuthorize` enable fine-grained authorization at the method level using SpEL expressions.

**Why It Matters**: Method-level authorization enforces business rules at the code level where they can't be bypassed—URL-level security (`/admin/**`) fails when developers add new endpoints that forget URL patterns, while `@PreAuthorize` prevents access attempts at method invocation. Production SaaS applications use SpEL expressions for tenant isolation (`#order.tenantId == principal.tenantId`) that ensure users can't access other tenants' data even if URL tampering bypasses endpoint security, preventing data leaks that cause compliance violations and customer churn.

---

### Example 28: JWT Authentication

Implement stateless authentication with JSON Web Tokens using the JJWT library for token generation and validation in Spring Security filter chains.

> **Why Not Core Features**: Spring Security 6 includes built-in JWT support via `oauth2ResourceServer().jwt()` (available since Spring Security 5.1) that validates JWTs without any external library — sufficient for consuming JWTs issued by external identity providers (Auth0, Keycloak, Okta). The JJWT library (`io.jsonwebtoken:jjwt-api`) is needed when your application must **generate and sign** JWTs itself (acting as the auth server), not just validate them. If you're building a resource server that only validates tokens from an external identity provider, prefer Spring Security's built-in OAuth2 resource server support over JJWT.

```java
// pom.xml
<dependency>
// => Executes
// => Code line
// => Code line
  <groupId>io.jsonwebtoken</groupId>
  // => Code line
  // => Code line
  <artifactId>jjwt-api</artifactId>
  // => Code line
  // => Code line
  <version>0.12.3</version>
  // => Code line
  // => Code line
</dependency>
// => Code line
// => Code line
<dependency>
// => Code line
// => Code line
  <groupId>io.jsonwebtoken</groupId>
  // => Code line
  // => Code line
  <artifactId>jjwt-impl</artifactId>
  // => Code line
  // => Code line
  <version>0.12.3</version>
  // => Code line
  // => Code line
</dependency>
// => Code line
// => Code line

// JWT utility class
@Component
// => @Component annotation applied
// => Spring component - detected by component scan
// => Spring-managed component
// => Annotation applied
public class JwtUtil {
// => Class definition begins
// => Class declaration
// => Class definition begins
    // => Begins block
  private String secret = "mySecretKey1234567890123456789012"; // 256-bit key
  // => Assigns value
  // => Private field
    // => Assigns value to variable
  private long expiration = 86400000; // 24 hours
  // => Assigns value
  // => Private field
  // => Sets expiration to 86400000

  public String generateToken(String username) { // => Create JWT token for authenticated user
    return Jwts.builder() // => Start JWT builder
      .subject(username) // => Set "sub" claim (token owner)
      .issuedAt(new Date()) // => Set "iat" claim (issued at timestamp)
      .expiration(new Date(System.currentTimeMillis() + expiration)) // => Set "exp" claim (24h from now)
      .signWith(Keys.hmacShaKeyFor(secret.getBytes())) // => Sign with HS256 algorithm
      .compact(); // => Serialize to Base64-encoded string
    // => Result format: header.payload.signature (JWT standard)
  }
  // => Block delimiter

  public String extractUsername(String token) { // => Parse JWT and extract username
    return Jwts.parser() // => Create JWT parser
      .verifyWith(Keys.hmacShaKeyFor(secret.getBytes())) // => Verify signature with same secret key
      .build() // => Build parser instance
      .parseSignedClaims(token) // => Parse and validate JWT (throws if invalid/expired)
      .getPayload() // => Extract claims (payload section)
      .getSubject(); // => Get "sub" claim (username)
      // => Sets // to string literal
  }
  // => Block delimiter

  public boolean isTokenValid(String token, String username) { // => Comprehensive token validation
  // => Executes method call
    try {
    // => Code line
    // => Block begins
    // => Begins block
      String extractedUser = extractUsername(token); // => Parse token (throws if tampered/invalid)
      return extractedUser.equals(username) && !isTokenExpired(token); // => Check username match + expiration
    } catch (Exception e) { // => Catch signature verification failures, malformed tokens
      return false; // => Invalid token
      // => Assigns > Invalid token to //
    }
    // => Block delimiter
  }
  // => Block delimiter

  private boolean isTokenExpired(String token) { // => Check if token has expired
    Date expiration = Jwts.parser() // => Create parser
      .verifyWith(Keys.hmacShaKeyFor(secret.getBytes())) // => Verify signature
      .build() // => Build parser
      .parseSignedClaims(token) // => Parse JWT
      .getPayload() // => Extract claims
      .getExpiration(); // => Get "exp" claim (expiration timestamp)
    return expiration.before(new Date()); // => Compare exp with current time
    // => Assigns > Compare exp with current time to //
  }
  // => Block delimiter
}
// => Block delimiter

// JWT authentication filter
@Component
// => Spring component - detected by component scan
// => Spring-managed component
// => Annotation applied
public class JwtAuthFilter extends OncePerRequestFilter {
// => Class declaration
// => Class definition begins
    // => Begins block
  @Autowired private JwtUtil jwtUtil; // => Inject JWT utility for token operations
  @Autowired private UserDetailsService userDetailsService; // => Inject user details service
  // => Annotation applied

  @Override
  // => Overrides parent method
  // => Overrides inherited method from parent class/interface
  // => Annotation applied
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
    // => Executes method
    throws ServletException, IOException {
    // => Block begins
    // => Begins block

    String header = request.getHeader("Authorization"); // => Extract Authorization header
    if (header != null && header.startsWith("Bearer ")) { // => Check for Bearer token format
      String token = header.substring(7); // => Remove "Bearer " prefix (7 chars)
      String username = jwtUtil.extractUsername(token); // => Parse JWT to extract username
      // => Result stored in username

      if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) { // => Valid username + not already authenticated
        UserDetails user = userDetailsService.loadUserByUsername(username); // => Load user from database/cache
        if (jwtUtil.isTokenValid(token, username)) { // => Verify signature + expiration + username match
          UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken( // => Create Spring Security auth token
            user, null, user.getAuthorities() // => principal, credentials (null for JWT), authorities
            // => Retrieves data
          );
          SecurityContextHolder.getContext().setAuthentication(auth); // => Set authentication in security context
          // => Assigns > Set authentication in security context to //
        }
        // => Block delimiter
      }
      // => Block delimiter
    }
    chain.doFilter(request, response); // => Continue filter chain (with or without authentication)
    // => Assigns > Continue filter chain (with or without authentication) to //
  }
  // => Block delimiter
}

// Security config
@Configuration
// => Configuration class - contains @Bean methods
// => Spring configuration class - defines bean factory methods
@EnableWebSecurity
// => Enables Spring Security configuration
// => Enables Spring Security web/method security
public class JwtSecurityConfig {
// => Class declaration
// => Class definition begins
    // => Begins block
  @Autowired private JwtAuthFilter jwtAuthFilter;
  // => Spring injects matching bean by type
  // => Spring injects dependency automatically

  @Bean
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
  // => Method definition
  // => Method definition
    // => Begins block
    http
      .csrf(csrf -> csrf.disable()) // => Disable CSRF (not needed for stateless JWT APIs)
      .authorizeHttpRequests(auth -> auth // => Configure authorization
        .requestMatchers("/auth/**").permitAll() // => Public auth endpoints (login, register)
        .anyRequest().authenticated() // => All other endpoints require JWT
        // => Executes method call
      )
      .sessionManagement(session -> session // => Configure session management
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // => No HTTP sessions (JWT is stateless)
        // => Executes method call
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // => Insert JWT filter before default auth filter
      // => Assigns > Insert JWT filter before default auth filter to //

    return http.build(); // => Build SecurityFilterChain bean
    // => Assigns > Build SecurityFilterChain bean to //
  }
}

// Auth controller
@RestController
// => REST controller - returns JSON directly
// => REST controller - combines @Controller + @ResponseBody
@RequestMapping("/auth")
// => Base URL path for all endpoints in class
// => Annotation applied
    // => Executes method
public class AuthController {
// => Class declaration
// => Class definition begins
    // => Begins block
  @Autowired private AuthenticationManager authManager; // => Spring Security authentication manager
  @Autowired private JwtUtil jwtUtil; // => Inject JWT utility

  @PostMapping("/login") // => Endpoint: POST /auth/login
  public ResponseEntity<String> login(@RequestBody LoginRequest request) { // => Accept JSON login request
    authManager.authenticate( // => Validate username + password (throws if invalid)
      new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()) // => Create auth token
    ); // => If authentication fails, throws BadCredentialsException
    String token = jwtUtil.generateToken(request.getUsername()); // => Generate JWT for authenticated user
    return ResponseEntity.ok(token); // => Return JWT to client
    // => Assigns > Return JWT to client to //
  }
}

// Usage:
// POST /auth/login {"username":"user1","password":"pass123"}
// Response: "eyJhbGciOiJIUzI1NiJ9..."
// GET /api/data with Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
dependencies {
// => Block begins
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")
}

// JWT utility class in Kotlin
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class JwtUtil {
// => Class declaration
// => Class declaration
    private val secret = "mySecretKey1234567890123456789012" // 256-bit key
    // => Immutable property
    // => Private class member
    private val expiration = 86400000L // 24 hours (Long type)
    // => Immutable property
    // => Private class member

    fun generateToken(username: String): String {
    // => Function definition
    // => Function declaration
        return Jwts.builder()
        // => Returns to caller
        // => Returns value to caller
            .subject(username) // => Set "sub" claim (token owner)
            .issuedAt(Date()) // => Set "iat" claim (issued at timestamp)
            .expiration(Date(System.currentTimeMillis() + expiration))
            .signWith(Keys.hmacShaKeyFor(secret.toByteArray()))
            .compact() // => Serialize to Base64-encoded string
        // => Result format: header.payload.signature (JWT standard)
    }

    fun extractUsername(token: String): String {
    // => Function definition
    // => Function declaration
        return Jwts.parser()
        // => Returns to caller
        // => Returns value to caller
            .verifyWith(Keys.hmacShaKeyFor(secret.toByteArray()))
            .build()
            .parseSignedClaims(token)
            .payload
            .subject // Kotlin property access
    }

    fun isTokenValid(token: String, username: String): Boolean {
    // => Function definition
    // => Function declaration
        return try {
        // => Returns to caller
        // => Returns value to caller
            val extractedUser = extractUsername(token)
            // => Immutable property
            // => Immutable binding (read-only reference)
            extractedUser == username && !isTokenExpired(token)
            // => Assignment
        } catch (e: Exception) {
        // => Block begins
            false // Invalid token
        }
    }

    private fun isTokenExpired(token: String): Boolean {
    // => Function definition
    // => Function declaration
        val expiration = Jwts.parser()
        // => Immutable property
        // => Immutable binding (read-only reference)
            .verifyWith(Keys.hmacShaKeyFor(secret.toByteArray()))
            .build()
            .parseSignedClaims(token)
            .payload
            .expiration
        return expiration.before(Date())
        // => Returns to caller
        // => Returns value to caller
    }
}

// JWT filter extending OncePerRequestFilter
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class JwtAuthFilter(
// => Class declaration
// => Class declaration
    private val jwtUtil: JwtUtil,
    // => Immutable property
    // => Private class member
    private val userDetailsService: UserDetailsService
    // => Immutable property
    // => Private class member
) : OncePerRequestFilter() {
// => Block begins

    override fun doFilterInternal(
    // => Function definition
    // => Overrides parent class/interface method
        request: HttpServletRequest,
        // => Statement
        response: HttpServletResponse,
        // => Statement
        filterChain: FilterChain
    ) {
    // => Block begins
        val header = request.getHeader("Authorization")
        // => Immutable property
        // => Immutable binding (read-only reference)
        if (header != null && header.startsWith("Bearer ")) {
        // => Assignment
        // => Block begins
            val token = header.substring(7)
            // => Immutable property
            // => Immutable binding (read-only reference)
            val username = jwtUtil.extractUsername(token)
            // => Immutable property
            // => Immutable binding (read-only reference)

            if (username != null && SecurityContextHolder.getContext().authentication == null) {
            // => Block begins
                val user = userDetailsService.loadUserByUsername(username)
                // => Immutable property
                // => Immutable binding (read-only reference)
                if (jwtUtil.isTokenValid(token, username)) {
                // => Block begins
                    val auth = UsernamePasswordAuthenticationToken(
                    // => Immutable property
                    // => Immutable binding (read-only reference)
                        user, null, user.authorities
                    )
                    SecurityContextHolder.getContext().authentication = auth
                    // => Assignment
                    // => Assignment
                }
            }
        }
        filterChain.doFilter(request, response)
    }
}

// Security config with JWT
@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
@EnableWebSecurity
// => Enables Spring Security configuration
// => Annotation applied
open class JwtSecurityConfig(
// => Class declaration
// => Class declaration
    private val jwtAuthFilter: JwtAuthFilter
    // => Immutable property
    // => Private class member
) {
// => Block begins

    @Bean
    // => Defines a Spring-managed bean
    // => Declares a Spring-managed bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    // => Function definition
    // => Function declaration
        http {
        // => Block begins
            csrf { disable() }
            authorizeHttpRequests {
            // => Block begins
                authorize("/auth/**", permitAll)
                authorize(anyRequest, authenticated)
            }
            sessionManagement {
            // => Block begins
                sessionCreationPolicy = SessionCreationPolicy.STATELESS
                // => Assignment
                // => Assignment
            }
            addFilterBefore<UsernamePasswordAuthenticationFilter>(jwtAuthFilter)
        }
        return http.build()
        // => Returns to caller
        // => Returns value to caller
    }
}

// Login request DTO
data class LoginRequest(
// => Data class: auto-generates equals/hashCode/toString/copy
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
    val username: String,
    // => Immutable property
    val password: String
    // => Immutable property
)

// Auth controller
@RestController
// => REST controller - returns JSON directly
// => Combines @Controller and @ResponseBody
@RequestMapping("/auth")
// => Base URL path for all endpoints in class
// => HTTP endpoint mapping
class AuthController(
// => Class declaration
// => Class declaration
    private val authManager: AuthenticationManager,
    // => Immutable property
    // => Private class member
    private val jwtUtil: JwtUtil
    // => Immutable property
    // => Private class member
) {
// => Block begins

    @PostMapping("/login")
    // => HTTP POST endpoint
    // => HTTP endpoint mapping
    fun login(@RequestBody request: LoginRequest): ResponseEntity<String> {
    // => Function definition
    // => Function declaration
        authManager.authenticate(
            UsernamePasswordAuthenticationToken(request.username, request.password)
        )
        val token = jwtUtil.generateToken(request.username)
        // => Immutable property
        // => Immutable binding (read-only reference)
        return ResponseEntity.ok(token)
        // => Returns to caller
        // => Returns value to caller
    }
}

// Usage:
// POST /auth/login {"username":"user1","password":"pass123"}
// Response: "eyJhbGciOiJIUzI1NiJ9..."
// GET /api/data with Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Key Takeaway**: JWT enables stateless authentication—clients include tokens in headers, eliminating server-side session storage.

**Why It Matters**: JWT enables stateless authentication essential for horizontal scaling—servers don't share session state, so load balancers distribute requests to any instance without session replication overhead. However, JWT tokens can't be revoked before expiration (unlike sessions), requiring short expiration times (15 minutes) with refresh tokens for security, balancing convenience (fewer re-logins) against blast radius (stolen tokens valid until expiration), a trade-off production systems at Auth0 and Okta tune based on threat models.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant C as Client
    participant A as Auth Controller
    participant F as JWT Filter
    participant S as Secured API

    C->>A: POST /auth/login (username, password)
    A->>A: Authenticate credentials
    A->>A: Generate JWT token
    A-->>C: Return JWT

    Note over C: Store JWT #40;localStorage/cookie#41;

    C->>F: GET /api/data<br/>Header: Authorization: Bearer {JWT}
    F->>F: Extract & validate JWT
    F->>F: Load user details
    F->>F: Set SecurityContext
    F->>S: Forward request (authenticated)
    S-->>C: Return data

```

---

### Example 29: OAuth2 Integration

Enable social login with OAuth2 providers.

```java
// pom.xml
<dependency>
// => Executes
// => Code execution
  <groupId>org.springframework.boot</groupId>
  // => Code execution
  <artifactId>spring-boot-starter-oauth2-client</artifactId>
  // => Code execution
</dependency>
// => Code execution

// application.yml
spring:
// => Code execution
  security:
  // => Code execution
    oauth2:
    // => Code execution
      client:
      // => Code execution
        registration:
        // => Code execution
          google:
          // => Code execution
            client-id: YOUR_GOOGLE_CLIENT_ID
            // => Code execution
            client-secret: YOUR_GOOGLE_CLIENT_SECRET
            // => Code execution
            scope:
            // => Code line
              - email
              // => Code line
              - profile
              // => Code line
          github:
          // => Code line
            client-id: YOUR_GITHUB_CLIENT_ID
            // => Code line
            client-secret: YOUR_GITHUB_CLIENT_SECRET
            // => Code line
            scope:
            // => Code line
              - user:email
              // => Code line
              - read:user
              // => Code line

// Security config
@Configuration
// => Annotation applied
@EnableWebSecurity
// => Annotation applied
public class OAuth2Config {
    // => Begins block
  @Bean
  // => Annotation applied
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    // => Begins block
    http
      .authorizeHttpRequests(auth -> auth // => Configure URL authorization
        .requestMatchers("/", "/login", "/error").permitAll() // => Public pages
        .anyRequest().authenticated() // => All others require OAuth2 login
        // => Executes method call
      )
      .oauth2Login(oauth2 -> oauth2 // => Configure OAuth2 login
        .loginPage("/login") // => Custom login page (links to Google/GitHub)
        .defaultSuccessUrl("/dashboard") // => Redirect after successful OAuth2 authentication
        // => Executes method call
      );
      // => Executes statement

    return http.build(); // => Build SecurityFilterChain bean
    // => Assigns > Build SecurityFilterChain bean to //
  }
  // => Block delimiter
}

// Controller
@RestController
public class ProfileController {
    // => Begins block
  @GetMapping("/dashboard") // => Protected endpoint
  public String dashboard(@AuthenticationPrincipal OAuth2User principal) { // => Inject OAuth2 authenticated user
    String name = principal.getAttribute("name"); // => Extract "name" claim from provider
    String email = principal.getAttribute("email"); // => Extract "email" claim
    // => Result stored in email
    return "Welcome, " + name + " (" + email + ")";
    // => Returns value to caller
    // => Extracts user info from OAuth2 provider
  }

  @GetMapping("/user-info")
    // => Executes method
  public Map<String, Object> userInfo(@AuthenticationPrincipal OAuth2User principal) {
    // => Begins block
    return principal.getAttributes(); // => Complete OAuth2 profile (name, email, picture, etc.)
    // => Result stored in //
  }
}

// Flow:
// 1. User clicks "Login with Google"
// 2. Redirects to Google's login page
// 3. User authenticates with Google
// 4. Google redirects back with authorization code
// 5. Spring exchanges code for access token
// 6. Spring fetches user info from Google
// 7. User logged in, redirected to /dashboard
```

**Code (Kotlin)**:

```kotlin
// application.properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
// => Assignment
spring.security.oauth2.client.registration.google.client-secret=YOUR_SECRET
// => Assignment
spring.security.oauth2.client.registration.google.scope=profile,email
// => Assignment

// Security configuration
@Configuration
// => Marks class as Spring configuration (bean factory)
@EnableWebSecurity
// => Annotation applied
open class OAuth2SecurityConfig {
// => Class declaration
  @Bean
  // => Declares a Spring-managed bean
  open fun filterChain(http: HttpSecurity): SecurityFilterChain {
  // => Function declaration
    http {
    // => Block begins
      authorizeHttpRequests {
      // => Block begins
        authorize("/", permitAll)
        authorize("/login/**", permitAll)  // OAuth2 login endpoints
        authorize(anyRequest, authenticated)
      }
      oauth2Login {
      // => Block begins
        defaultSuccessUrl("/dashboard", true)  // Redirect after successful login
      }
      // => Enables OAuth2 login flow with Google
    }
    return http.build()
    // => Returns value to caller
  }
}

// Controller handling OAuth2 user
@RestController
// => Combines @Controller and @ResponseBody
class OAuth2Controller {
// => Class declaration
  @GetMapping("/dashboard")
  // => HTTP endpoint mapping
  fun dashboard(@AuthenticationPrincipal principal: OAuth2User): String {
  // => Function declaration
    val name = principal.getAttribute<String>("name") ?: "User"
    // => Immutable binding (read-only reference)
    return "Welcome, $name!"  // String template with null safety
    // => Returns value to caller
    // => Extracts user info from OAuth2 provider
  }

  @GetMapping("/user-info")
  // => HTTP endpoint mapping
  fun userInfo(@AuthenticationPrincipal principal: OAuth2User): Map<String, Any> {
  // => Function declaration
    return principal.attributes  // Complete OAuth2 profile (name, email, picture, etc.)
    // => Returns value to caller
  }
}

// Flow:
// 1. User clicks "Login with Google"
// 2. Redirects to Google's login page
// 3. User authenticates with Google
// 4. Google redirects back with authorization code
// 5. Spring exchanges code for access token
// 6. Spring fetches user info from Google
// 7. User logged in, redirected to /dashboard

// Kotlin-specific: Use getAttribute<T> with type parameter for type-safe extraction
// Alternative with scope functions:
// val name = principal.getAttribute<String>("name")?.also { println("User $it logged in") } ?: "User"
```

**Key Takeaway**: Spring OAuth2 client simplifies social login—configure provider credentials and Spring handles the OAuth2 flow.

**Why It Matters**: OAuth2 delegates authentication to specialized providers (Google, GitHub, AWS Cognito) that invest millions in security infrastructure, enabling applications to avoid storing passwords that require expensive PCI/SOC2 compliance. Social login reduces signup friction by 30-50% (no password memorization), but introduces dependency on external providers—production systems implement fallback authentication for when OAuth providers have outages, preventing login failures that lock out all users during downtime.

---

## Group 3: Testing

### Example 30: @SpringBootTest

Full integration testing with complete application context.

```java
// Test class
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// => Starts full Spring application context with embedded server on random port
// => RANDOM_PORT avoids port conflicts when running parallel tests
// => Loads all beans: controllers, services, repositories, configurations
public class ProductControllerIntegrationTest {
  @Autowired private TestRestTemplate restTemplate; // HTTP client for testing
  // => Injected HTTP client configured for random port
  // => Automatically includes correct base URL (http://localhost:random-port)
  @Autowired private ProductRepository productRepo;
  // => Injected repository for database operations in tests

  @BeforeEach
  void setup() {
    productRepo.deleteAll(); // Clean database before each test
    // => Ensures test isolation (each test starts with empty database)
    // => Prevents test interdependencies and flakiness
  }

  @Test
  void testCreateAndRetrieveProduct() {
    // Create product
    Product product = new Product("Laptop", 999.99);
    // => Creates entity object (not yet persisted)
    ResponseEntity<Product> createResponse = restTemplate.postForEntity(
      "/api/products", product, Product.class
      // => HTTP POST to /api/products with product as JSON body
      // => Server deserializes JSON → Product object → save to DB
    );
    assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
    // => Verifies controller returns 201 Created status
    Long productId = createResponse.getBody().getId();
    // => Extracts auto-generated ID from response body
    // => Example: productId = 1 (database sequence)

    // Retrieve product
    ResponseEntity<Product> getResponse = restTemplate.getForEntity(
      "/api/products/" + productId, Product.class
      // => HTTP GET to /api/products/1
      // => Server queries database and returns JSON
    );
    assertEquals(HttpStatus.OK, getResponse.getStatusCode());
    // => Verifies controller returns 200 OK status
    assertEquals("Laptop", getResponse.getBody().getName());
    // => Verifies retrieved product has correct name
    // => Full end-to-end test: controller → service → repository → database
    // => Tests complete request-response cycle including JSON serialization
  }

  @Test
  void testDeleteProduct() {
    Product product = productRepo.save(new Product("Mouse", 25.00));
    // => Directly persists product to database (bypasses controller)
    // => Returns saved entity with generated ID (e.g., id=2)

    restTemplate.delete("/api/products/" + product.getId());
    // => HTTP DELETE to /api/products/2
    // => Triggers controller → service → repository.deleteById(2)

    assertFalse(productRepo.existsById(product.getId()));
    // => Verifies deletion through full stack
    // => Queries database to confirm product no longer exists
    // => False means product successfully deleted
  }
}

// Mocking external dependencies
@SpringBootTest
// => Loads full application context (no web server needed for this test)
public class OrderServiceTest {
  @Autowired private OrderService orderService;
  // => Injected real OrderService bean (tests real service logic)

  @MockBean // Replace real bean with mock
  private PaymentGateway paymentGateway;
  // => Replaces real PaymentGateway bean with Mockito mock
  // => Prevents real payment API calls during tests
  // => Mock behavior defined in test methods

  @Test
  void testProcessOrder() {
    // Stub mock behavior
    when(paymentGateway.charge(any(), any())).thenReturn(true);
    // => Configures mock: when charge() called with ANY arguments → return true
    // => Simulates successful payment without calling real gateway
    // => any() = Mockito matcher for any argument value

    Order order = new Order("user1", 100.00);
    // => Creates test order object (username="user1", amount=100.00)
    orderService.processOrder(order);
    // => Calls real service method (which calls mocked gateway)
    // => Service logic executes normally, but gateway.charge() uses mock

    verify(paymentGateway, times(1)).charge(eq("user1"), eq(100.00));
    // => Verifies mock was called exactly once with specific arguments
    // => eq("user1") = Mockito matcher for exact value match
    // => Ensures service passed correct parameters to gateway
    // => Tests order processing without calling real payment gateway
    // => Avoids network calls, payment charges, and external dependencies
  }
}
```

**Code (Kotlin)**:

```kotlin
// Test class
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// => Annotation applied
// => Annotation applied
class ProductControllerIntegrationTest {
// => Class declaration
// => Class declaration
  @Autowired private lateinit var restTemplate: TestRestTemplate  // HTTP client for testing
  // => Spring injects matching bean by type
  // => Injects Spring-managed dependency
  @Autowired private lateinit var productRepo: ProductRepository
  // => Spring injects matching bean by type
  // => Injects Spring-managed dependency

  @BeforeEach
  // => Annotation applied
  // => Annotation applied
  fun setup() {
  // => Function definition
  // => Function declaration
    productRepo.deleteAll()  // Clean database before each test
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testCreateAndRetrieveProduct() {
  // => Function definition
  // => Function declaration
    // Create product
    val product = Product("Laptop", 999.99)
    // => Immutable property
    // => Immutable binding (read-only reference)
    val createResponse = restTemplate.postForEntity(
    // => Immutable property
    // => Immutable binding (read-only reference)
      "/api/products", product, Product::class.java
    )
    assertEquals(HttpStatus.CREATED, createResponse.statusCode)
    val productId = createResponse.body!!.id  // Non-null assertion (test environment controlled)
    // => Immutable property
    // => Immutable binding (read-only reference)

    // Retrieve product
    val getResponse = restTemplate.getForEntity(
    // => Immutable property
    // => Immutable binding (read-only reference)
      "/api/products/$productId", Product::class.java  // String template
    )
    assertEquals(HttpStatus.OK, getResponse.statusCode)
    assertEquals("Laptop", getResponse.body!!.name)
    // => Full end-to-end test: controller → service → repository → database
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testDeleteProduct() {
  // => Function definition
  // => Function declaration
    val product = productRepo.save(Product("Mouse", 25.00))
    // => Immutable property
    // => Immutable binding (read-only reference)

    restTemplate.delete("/api/products/${product.id}")  // String template for URL

    assertFalse(productRepo.existsById(product.id!!))
    // => Verifies deletion through full stack
  }
}

// Mocking external dependencies
@SpringBootTest
// => Annotation applied
// => Annotation applied
class OrderServiceTest {
// => Class declaration
// => Class declaration
  @Autowired private lateinit var orderService: OrderService
  // => Spring injects matching bean by type
  // => Injects Spring-managed dependency

  @MockBean  // Replace real bean with mock
  // => Annotation applied
  // => Annotation applied
  private lateinit var paymentGateway: PaymentGateway

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testProcessOrder() {
  // => Function definition
  // => Function declaration
    // Stub mock behavior
    `when`(paymentGateway.charge(any(), any())).thenReturn(true)  // Backticks escape Kotlin keyword

    val order = Order("user1", 100.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    orderService.processOrder(order)

    verify(paymentGateway, times(1)).charge(eq("user1"), eq(100.00))
    // => Tests order processing without calling real payment gateway
  }
}

// Kotlin-specific: Use backticks to escape 'when' keyword when calling Mockito's when() method
// Alternative with MockK (Kotlin mocking library):
// every { paymentGateway.charge(any(), any()) } returns true
// verify(exactly = 1) { paymentGateway.charge("user1", 100.00) }
```

**Key Takeaway**: `@SpringBootTest` loads full application context—use `@MockBean` to replace real dependencies with mocks.

**Why It Matters**: Integration tests verify controller-to-database flows including JSON serialization, exception handling, and transaction management—catching bugs that unit tests miss because mocks don't behave like real implementations. However, @SpringBootTest loads the full context (2-5 seconds per test), making large test suites slow (20 minutes for 500 tests), requiring careful test design where unit tests cover 80% of logic with @WebMvcTest, reserving integration tests for critical paths that justify the performance cost.

---

### Example 31: @WebMvcTest

Test controllers in isolation without full context.

```java
@WebMvcTest(ProductController.class) // Only load ProductController
    // => Executes method
public class ProductControllerUnitTest {
    // => Begins block
  @Autowired private MockMvc mockMvc; // Simulates HTTP requests
  // => Annotation applied

  @MockBean // Mock the service layer
  // => Annotation applied
  private ProductService productService;
  // => Declares productService field of type ProductService

  @Test
  // => Annotation applied
  void testGetProduct() throws Exception {
    // => Executes method
    // Arrange
    Product product = new Product(1L, "Laptop", 999.99);
    // => Creates new instance
    when(productService.findById(1L)).thenReturn(Optional.of(product));
    // => Executes method

    // Act & Assert
    mockMvc.perform(get("/api/products/1"))
    // => Executes method
      .andExpect(status().isOk())
    // => Executes method
      .andExpect(jsonPath("$.name").value("Laptop"))
    // => Executes method
      .andExpect(jsonPath("$.price").value(999.99));
    // => Executes method
    // => Tests controller logic without starting full app
  }
  // => Block delimiter

  @Test
  // => Annotation applied
  void testCreateProduct() throws Exception {
    // => Executes method
    Product product = new Product("Mouse", 25.00);
    // => Creates new instance
    when(productService.save(any(Product.class))).thenReturn(product);
    // => Executes method

    mockMvc.perform(post("/api/products")
    // => Executes method
        .contentType(MediaType.APPLICATION_JSON)
    // => Executes method
        .content("{\"name\":\"Mouse\",\"price\":25.00}"))
    // => Executes method
      .andExpect(status().isCreated())
    // => Executes method
      .andExpect(jsonPath("$.name").value("Mouse"));
    // => Executes method
  }
  // => Block delimiter

  @Test
  // => Annotation applied
  void testGetProductNotFound() throws Exception {
    // => Executes method
    when(productService.findById(999L)).thenReturn(Optional.empty());
    // => Executes method

    mockMvc.perform(get("/api/products/999"))
    // => Executes method
      .andExpect(status().isNotFound());
    // => Executes method
    // => Tests error handling
  }
  // => Block delimiter
}
```

**Code (Kotlin)**:

```kotlin
@WebMvcTest(ProductController::class)  // Only load ProductController
// => Annotation applied
// => Annotation applied
class ProductControllerUnitTest {
// => Class declaration
// => Class declaration
  @Autowired private lateinit var mockMvc: MockMvc  // Simulates HTTP requests
  // => Spring injects matching bean by type
  // => Injects Spring-managed dependency

  @MockBean  // Mock the service layer
  // => Annotation applied
  // => Annotation applied
  private lateinit var productService: ProductService

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testGetProduct() {
  // => Function definition
  // => Function declaration
    // Arrange
    val product = Product(1L, "Laptop", 999.99)
    // => Immutable property
    // => Immutable binding (read-only reference)
    `when`(productService.findById(1L)).thenReturn(Optional.of(product))

    // Act & Assert
    mockMvc.perform(get("/api/products/1"))
      .andExpect(status().isOk)
      .andExpect(jsonPath("$.name").value("Laptop"))
      .andExpect(jsonPath("$.price").value(999.99))
    // => Tests controller logic without starting full app
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testCreateProduct() {
  // => Function definition
  // => Function declaration
    val product = Product("Mouse", 25.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    `when`(productService.save(any(Product::class.java))).thenReturn(product)

    mockMvc.perform(post("/api/products")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""{"name":"Mouse","price":25.00}"""))  // Triple-quoted string
      .andExpect(status().isCreated)
      .andExpect(jsonPath("$.name").value("Mouse"))
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testGetProductNotFound() {
  // => Function definition
  // => Function declaration
    `when`(productService.findById(999L)).thenReturn(Optional.empty())

    mockMvc.perform(get("/api/products/999"))
      .andExpect(status().isNotFound)
    // => Tests error handling
  }
}

// Kotlin-specific: Use triple-quoted strings for JSON payloads to avoid escaping
// Alternative idiomatic approach with companion object for test data:
// companion object {
//   private val SAMPLE_PRODUCT = Product(1L, "Laptop", 999.99)
// }
```

**Key Takeaway**: `@WebMvcTest` loads only web layer—faster than `@SpringBootTest`, ideal for controller logic testing.

**Why It Matters**: MockMvc tests verify REST API contracts (request mapping, response codes, JSON structure) 10x faster than integration tests because they don't start HTTP servers or load full contexts, enabling rapid TDD feedback loops. Production teams use MockMvc for controller logic and @JsonTest for serialization verification, achieving 95% branch coverage with 2-minute test suite execution that enables continuous deployment where every commit triggers automated tests before merging to main.

---

### Example 32: TestContainers

Test with real databases using Docker containers.

```java
// pom.xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.3</version>
  <scope>test</scope>
  // => TestContainers dependency for running Docker containers in tests
  // => Scope 'test' means only used during test execution
</dependency>

// Test class
@SpringBootTest
// => Loads full Spring application context for integration testing
@Testcontainers // Enable TestContainers support
// => Manages lifecycle of Docker containers for tests
// => Automatically starts containers before tests, stops after
public class ProductRepositoryTestContainersTest {
  @Container // Start PostgreSQL container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    // => Creates PostgreSQL 16 Docker container instance
    // => Static field shared across all test methods (container reused)
    // => Wildcard <?> for container type parameter
    .withDatabaseName("testdb")
    // => Creates database named "testdb" inside container
    .withUsername("test")
    // => Sets PostgreSQL username for connections
    .withPassword("test");
    // => Sets PostgreSQL password for connections
    // => Container exposes random port (e.g., 54321 → 5432 mapping)

  @DynamicPropertySource // Configure Spring to use container
  static void properties(DynamicPropertyRegistry registry) {
    // => Dynamically sets Spring properties AFTER container starts
    // => Executes before application context initialization
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    // => Sets JDBC URL with container's random port
    // => Example: jdbc:postgresql://localhost:54321/testdb
    registry.add("spring.datasource.username", postgres::getUsername);
    // => Sets datasource username to "test"
    registry.add("spring.datasource.password", postgres::getPassword);
    // => Sets datasource password to "test"
    // => Method reference syntax (postgres::getJdbcUrl) provides lazy evaluation
  }

  @Autowired private ProductRepository productRepo;
  // => Injected repository connected to TestContainers PostgreSQL

  @Test
  void testSaveAndFind() {
    Product product = new Product("Keyboard", 75.00);
    // => Creates entity object (not yet persisted)
    productRepo.save(product);
    // => Persists to real PostgreSQL database in Docker container
    // => Auto-generates ID (e.g., id=1)

    Optional<Product> found = productRepo.findById(product.getId());
    // => Queries real database by generated ID
    // => Returns Optional<Product> (present if found, empty if not)
    assertTrue(found.isPresent());
    // => Verifies product was successfully persisted and retrieved
    assertEquals("Keyboard", found.get().getName());
    // => Verifies retrieved product has correct name
    // => Tests against real PostgreSQL database in Docker
    // => More realistic than H2 in-memory database (tests actual PostgreSQL SQL dialect)
  }

  @Test
  void testCustomQuery() {
    productRepo.save(new Product("Mouse", 20.00));
    // => Persists product with price=20.00
    productRepo.save(new Product("Keyboard", 75.00));
    // => Persists product with price=75.00
    productRepo.save(new Product("Monitor", 300.00));
    // => Persists product with price=300.00
    // => Database now contains 3 products

    List<Product> expensive = productRepo.findByPriceGreaterThan(50.00);
    // => Custom query method: SELECT * FROM product WHERE price > 50.00
    // => Executes against real PostgreSQL (tests actual query execution)
    // => Returns 2 products: Keyboard (75.00) and Monitor (300.00)
    assertEquals(2, expensive.size());
    // => Verifies custom queries against real database
    // => Catches SQL dialect issues that H2 might not reveal
    // => Container automatically cleans up after test suite completes
  }
}
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
testImplementation("org.testcontainers:postgresql:1.19.3")

// Test class
@SpringBootTest
// => Annotation applied
// => Annotation applied
@Testcontainers  // Enable TestContainers support
// => Annotation applied
// => Annotation applied
class ProductRepositoryTestContainersTest {
// => Class declaration
// => Class declaration
  companion object {
  // => Companion object: static-like members in Kotlin
    @Container  // Start PostgreSQL container
    // => Annotation applied
    // => Annotation applied
    @JvmStatic
    // => Annotation applied
    // => Annotation applied
    val postgres = PostgreSQLContainer<Nothing>("postgres:16").apply {
    // => Immutable property
    // => Immutable binding (read-only reference)
      withDatabaseName("testdb")
      withUsername("test")
      withPassword("test")
    }

    @DynamicPropertySource  // Configure Spring to use container
    // => Annotation applied
    // => Annotation applied
    @JvmStatic
    // => Annotation applied
    // => Annotation applied
    fun properties(registry: DynamicPropertyRegistry) {
    // => Function definition
    // => Function declaration
      registry.add("spring.datasource.url", postgres::getJdbcUrl)
      registry.add("spring.datasource.username", postgres::getUsername)
      registry.add("spring.datasource.password", postgres::getPassword)
      // => Sets datasource password to "test"
    }
  }

  @Autowired private lateinit var productRepo: ProductRepository
  // => Spring injects matching bean by type
  // => Injects Spring-managed dependency

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testSaveAndFind() {
  // => Function definition
  // => Function declaration
    val product = Product("Keyboard", 75.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    productRepo.save(product)

    val found = productRepo.findById(product.id!!)
    // => Immutable property
    // => Immutable binding (read-only reference)
    assertTrue(found.isPresent)
    assertEquals("Keyboard", found.get().name)
    // => Tests against real PostgreSQL database in Docker
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testCustomQuery() {
  // => Function definition
  // => Function declaration
    listOf(
      Product("Mouse", 20.00),
      // => Statement
      Product("Keyboard", 75.00),
      // => Statement
      Product("Monitor", 300.00)
    ).forEach { productRepo.save(it) }  // Idiomatic forEach with lambda

    val expensive = productRepo.findByPriceGreaterThan(50.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    assertEquals(2, expensive.size)
    // => Verifies custom queries against real database
  }
}

// Kotlin-specific: Use companion object for static container and @JvmStatic for Java interop
// Alternative with apply scope function for container configuration (as shown above)
// TestContainers automatically manages container lifecycle (starts before tests, stops after)
```

**Testcontainers Lifecycle with @DynamicPropertySource**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant Test as Test Class
    participant TC as @Testcontainers
    participant Docker as Docker Engine
    participant DPS as @DynamicPropertySource
    participant Spring as Spring Context

    Test->>TC: Test class initialized
    TC->>Docker: Start PostgreSQL container
    Docker-->>TC: Container started (random port)
    TC->>DPS: Call static properties() method
    DPS->>DPS: Get container JDBC URL/credentials
    DPS->>Spring: Register dynamic properties
    Spring->>Spring: Initialize ApplicationContext
    Spring->>Spring: Configure DataSource with container URL
    Spring-->>Test: Context ready
    Test->>Test: Execute test methods
    Test->>Spring: Use real PostgreSQL
    Test->>TC: Tests complete
    TC->>Docker: Stop and remove container
    Docker-->>TC: Container cleaned up

    Note over TC,Docker: Container lifecycle managed automatically
    Note over DPS,Spring: Properties set BEFORE context init
```

**Caption**: @DynamicPropertySource dynamically configures Spring properties with Testcontainers URLs after container startup but before ApplicationContext initialization.

**Key Takeaway**: TestContainers provides real databases for tests—eliminates mocking discrepancies between H2 and production databases.

**Why It Matters**: TestRestTemplate tests verify the complete HTTP stack including security filters, exception handlers, and content negotiation—catching integration issues where MockMvc succeeds but real HTTP requests fail due to filter ordering or missing CORS headers. Production pipelines use TestRestTemplate for smoke tests that verify deployments serve traffic correctly before switching load balancer endpoints, preventing broken deployments where internal tests pass but external clients receive 500 errors.

---

### Example 33: Mocking with Mockito

Isolate units under test with mocks.

```java
@ExtendWith(MockitoExtension.class) // Enable Mockito
    // => Executes method
public class OrderServiceUnitTest {
    // => Begins block
  @Mock // Create mock
  // => Annotation applied
  private OrderRepository orderRepo;
  // => Declares orderRepo field of type OrderRepository

  @Mock
  // => Annotation applied
  private PaymentService paymentService;
  // => Declares paymentService field of type PaymentService

  @InjectMocks // Inject mocks into service
  // => Annotation applied
  private OrderService orderService;
  // => Declares orderService field of type OrderService

  @Test
  // => Annotation applied
  void testProcessOrder() {
    // => Executes method
    // Arrange
    Order order = new Order("user1", 100.00);
    // => Creates new instance
    when(orderRepo.save(any(Order.class))).thenReturn(order);
    // => Executes method
    when(paymentService.charge(anyString(), anyDouble())).thenReturn(true);
    // => Executes method

    // Act
    Order result = orderService.processOrder(order);
    // => Calls processOrder()
    // => Stores result in result

    // Assert
    assertNotNull(result);
    // => Executes method
    verify(orderRepo, times(1)).save(order); // Verify method called once
    // => Executes method
    verify(paymentService, times(1)).charge("user1", 100.00);
    // => Executes method
  }
  // => Block delimiter

  @Test
  // => Annotation applied
  void testProcessOrderPaymentFailure() {
    // => Executes method
    Order order = new Order("user1", 100.00);
    // => Creates new instance
    when(paymentService.charge(anyString(), anyDouble())).thenReturn(false);
    // => Executes method

    assertThrows(PaymentException.class, () -> {
    // => Executes method
      orderService.processOrder(order);
    // => Executes method
    });
    // => Executes statement

    verify(orderRepo, never()).save(any()); // Verify save never called
    // => Executes method
    // => Tests failure scenarios
  }

  @Test
  void testArgumentCaptor() {
    // => Executes method
    Order order = new Order("user1", 100.00);
    // => Creates new instance
    when(paymentService.charge(anyString(), anyDouble())).thenReturn(true);
    // => Executes method

    orderService.processOrder(order);
    // => Executes method

    ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
    // => Calls forClass()
    // => Stores result in captor
    verify(orderRepo).save(captor.capture());
    // => Executes method

    Order captured = captor.getValue();
    // => Calls getValue()
    // => Stores result in captured
    assertEquals("PROCESSED", captured.getStatus());
    // => Executes method
    // => Captures arguments passed to mocked methods
  }
}
```

**Code (Kotlin)**:

```kotlin
@ExtendWith(MockitoExtension::class)  // Enable Mockito
// => Annotation applied
// => Annotation applied
class OrderServiceUnitTest {
// => Class declaration
// => Class declaration
  @Mock  // Create mock
  // => Annotation applied
  // => Annotation applied
  private lateinit var orderRepo: OrderRepository

  @Mock
  // => Annotation applied
  // => Annotation applied
  private lateinit var paymentService: PaymentService

  @InjectMocks  // Inject mocks into service
  // => Annotation applied
  // => Dependency injection
  private lateinit var orderService: OrderService

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testProcessOrder() {
  // => Function definition
  // => Function declaration
    // Arrange
    val order = Order("user1", 100.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    `when`(orderRepo.save(any(Order::class.java))).thenReturn(order)
    `when`(paymentService.charge(anyString(), anyDouble())).thenReturn(true)

    // Act
    val result = orderService.processOrder(order)
    // => Immutable property
    // => Immutable binding (read-only reference)

    // Assert
    assertNotNull(result)
    verify(orderRepo, times(1)).save(order)  // Verify method called once
    verify(paymentService, times(1)).charge("user1", 100.00)
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testProcessOrderPaymentFailure() {
  // => Function definition
  // => Function declaration
    val order = Order("user1", 100.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    `when`(paymentService.charge(anyString(), anyDouble())).thenReturn(false)

    assertThrows<PaymentException> {
    // => Block begins
      orderService.processOrder(order)
    }

    verify(orderRepo, never()).save(any())  // Verify save never called
    // => Tests failure scenarios
  }

  @Test
  // => Annotation applied
  // => Annotation applied
  fun testArgumentCaptor() {
  // => Function definition
  // => Function declaration
    val order = Order("user1", 100.00)
    // => Immutable property
    // => Immutable binding (read-only reference)
    `when`(paymentService.charge(anyString(), anyDouble())).thenReturn(true)

    orderService.processOrder(order)

    val captor = argumentCaptor<Order>()  // Kotlin extension function
    // => Immutable property
    // => Immutable binding (read-only reference)
    verify(orderRepo).save(captor.capture())

    val captured = captor.firstValue
    // => Immutable property
    // => Immutable binding (read-only reference)
    assertEquals("PROCESSED", captured.status)
    // => Captures arguments passed to mocked methods
  }
}

// Kotlin-specific: Use backticks for 'when' keyword, assertThrows<T> type parameter
// Alternative with MockK (Kotlin-native mocking library):
// every { orderRepo.save(any()) } returns order
// every { paymentService.charge(any(), any()) } returns true
// val slot = slot<Order>()
// verify { orderRepo.save(capture(slot)) }
// assertEquals("PROCESSED", slot.captured.status)
```

**Key Takeaway**: Mockito enables fast, isolated unit tests—use `when().thenReturn()` for stubbing, `verify()` for interaction verification.

**Why It Matters**: Mockito enables fast unit tests (milliseconds vs seconds for integration tests) by replacing slow dependencies (databases, external APIs, message queues) with in-memory mocks that return predetermined responses. However, over-mocking creates brittle tests that pass with green checkmarks but fail in production because mocks don't behave like real implementations—production teams limit mocking to external boundaries (APIs, databases) while testing internal logic with real objects to balance speed against accuracy.

---

## Group 4: Caching & Performance

### Example 34: Cache Abstraction

Transparent caching with Spring's cache abstraction.

```java
// pom.xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-cache</artifactId>
  // => Adds Spring Cache abstraction (provider-agnostic)
  // => Default: ConcurrentHashMap in-memory cache
  // => Production: Redis, Caffeine, EhCache
</dependency>

// Enable caching
@SpringBootApplication
@EnableCaching // Enable cache annotations
// => Activates @Cacheable, @CachePut, @CacheEvict, @Caching
// => Creates CacheManager bean (default: ConcurrentMapCacheManager)
public class Application {
    // => Begins block
  public static void main(String[] args) {
    // => Begins block
    SpringApplication.run(Application.class, args);
    // => Executes method
  }
}

// Service with caching
@Service
public class ProductService {
    // => Begins block
  @Autowired private ProductRepository productRepo;
  // => Injected repository for database operations

  @Cacheable("products") // Cache results by method arguments
    // => Executes method
  // => Cache name: "products", key: method arguments (id)
  // => Cache key generated from argument: findById(1L) → key="1"
  public Product findById(Long id) {
    // => Begins block
    System.out.println("Fetching from database: " + id);
    // => Prints to console
    // => Only prints on cache miss (first call for given id)
    return productRepo.findById(id).orElseThrow();
    // => Returns value to caller
    // First call: prints "Fetching..." and queries database
    // => Result stored in cache with key="1"
    // Subsequent calls: returns cached value, no database query
    // => Cache hit: method body NOT executed, cached value returned
  }

  @Cacheable(value = "products", key = "#name") // Custom cache key
  // => Cache name: "products", key: SpEL expression #name (method parameter)
  // => findByName("Laptop") → cache key="Laptop"
  public List<Product> findByName(String name) {
    // => Begins block
    System.out.println("Querying database for: " + name);
    // => Prints to console
    // => Prints only on cache miss
    return productRepo.findByNameContaining(name);
    // => Queries database: SELECT * FROM product WHERE name LIKE '%Laptop%'
    // => Result cached: subsequent calls return cached list
  }

  @CachePut(value = "products", key = "#result.id") // Update cache after method
  // => ALWAYS executes method AND updates cache
  // => key="#result.id" uses SpEL to extract id from return value
  // => save(Product) → method executes → result.id extracted → cache updated
  public Product save(Product product) {
    return productRepo.save(product);
    // => Saves to database AND updates cache with new value
    // => Example: save(Product{id=1, name="Laptop"}) → cache["1"] = updated Product
    // => Keeps cache synchronized with database writes
  }

  @CacheEvict(value = "products", key = "#id") // Remove from cache
  // => Evicts single entry from cache by key
  // => deleteById(1L) → removes cache entry with key="1"
  public void deleteById(Long id) {
    productRepo.deleteById(id);
    // => Deletes from database AND evicts from cache
    // => Prevents stale cached data after deletion
  }

  @CacheEvict(value = "products", allEntries = true) // Clear entire cache
  // => Evicts ALL entries from "products" cache
  // => Use after bulk operations or scheduled cache refresh
  public void clearCache() {
    System.out.println("Cache cleared");
    // => Manual cache invalidation (all cached products removed)
  }

  @Caching(evict = {
    @CacheEvict(value = "products", key = "#product.id"),
    @CacheEvict(value = "categories", key = "#product.categoryId")
  })
  // => Multiple cache evictions in single operation
  // => Evicts from "products" cache (key=product.id) AND "categories" cache (key=product.categoryId)
  public Product update(Product product) {
    return productRepo.save(product);
    // => Evicts multiple cache entries
    // => Updates database and invalidates related caches
    // => Ensures consistency across multiple cache regions
  }
}

// Usage
Product p1 = productService.findById(1L); // => Database query
// => Cache miss: executes method, queries DB, caches result
// => Output: "Fetching from database: 1"
// => cache["1"] = Product{id=1, ...}
Product p2 = productService.findById(1L); // => Cached (no query)
// => Cache hit: returns cached Product without executing method
// => No database query, no console output
productService.deleteById(1L); // => Evicts cache
// => Deletes from DB and removes cache entry
// => cache["1"] = null (evicted)
Product p3 = productService.findById(1L); // => Database query again
// => Cache miss again: executes method, queries DB
// => Output: "Fetching from database: 1"
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
implementation("org.springframework.boot:spring-boot-starter-cache")

// Enable caching
@SpringBootApplication
// => Entry point: @Configuration + @EnableAutoConfiguration + @ComponentScan
// => Combines @Configuration, @EnableAutoConfiguration, @ComponentScan
@EnableCaching  // Enable cache annotations
// => Annotation applied
// => Annotation applied
open class Application
// => Class declaration
// => Class declaration

fun main(args: Array<String>) {
// => Function definition
// => Function declaration
  runApplication<Application>(*args)
}

// Service with caching
@Service
// => Business logic service bean
// => Business logic layer Spring component
open class ProductService(
// => Class declaration
// => Class declaration
  private val productRepo: ProductRepository
  // => Immutable property
  // => Private class member
) {
// => Block begins
  @Cacheable("products")  // Cache results by method arguments
  // => Cache method result
  // => Caches method result; returns cached value on repeat calls
  open fun findById(id: Long): Product {
  // => Function definition
  // => Function declaration
    println("Fetching from database: $id")  // String template
    // => Output: see string template value above
    return productRepo.findById(id).orElseThrow()
    // => Returns to caller
    // => Returns value to caller
    // First call: prints "Fetching..." and queries database
    // Subsequent calls: returns cached value, no database query
  }

  @Cacheable(value = ["products"], key = "#name")  // Custom cache key
  // => Cache method result
  // => Caches method result; returns cached value on repeat calls
  open fun findByName(name: String): List<Product> {
  // => Function definition
  // => Function declaration
    println("Querying database for: $name")
    // => Output: see string template value above
    return productRepo.findByNameContaining(name)
    // => Returns to caller
    // => Returns value to caller
  }

  @CachePut(value = ["products"], key = "#result.id")  // Update cache after method
  // => Annotation applied
  // => Annotation applied
  open fun save(product: Product): Product {
  // => Function definition
  // => Function declaration
    return productRepo.save(product)
    // => Returns to caller
    // => Returns value to caller
    // => Saves to database AND updates cache with new value
  }

  @CacheEvict(value = ["products"], key = "#id")  // Remove from cache
  // => Evict cache entry
  // => Evicts entry from cache when method executes
  open fun deleteById(id: Long) {
  // => Function definition
  // => Function declaration
    productRepo.deleteById(id)
    // => Deletes from database AND evicts from cache
  }

  @CacheEvict(value = ["products"], allEntries = true)  // Clear entire cache
  // => Evict cache entry
  // => Evicts entry from cache when method executes
  open fun clearCache() {
  // => Function definition
  // => Function declaration
    println("Cache cleared")
    // => Output: see string template value above
  }

  @Caching(evict = [
  // => Annotation applied
  // => Annotation applied
    CacheEvict(value = ["products"], key = "#product.id"),
    // => Assignment
    // => Assignment
    CacheEvict(value = ["categories"], key = "#product.categoryId")
    // => Assignment
    // => Assignment
  ])
  open fun update(product: Product): Product {
  // => Function definition
  // => Function declaration
    return productRepo.save(product)
    // => Returns to caller
    // => Returns value to caller
    // => Evicts multiple cache entries
  }
}

// Usage
val p1 = productService.findById(1L)  // => Database query
val p2 = productService.findById(1L)  // => Cached (no query)
productService.deleteById(1L)  // => Evicts cache
val p3 = productService.findById(1L)  // => Database query again

// Kotlin-specific: Methods must be open for proxy-based caching (Spring uses CGLIB)
// Alternative configuration with Kotlin All-Open plugin in build.gradle.kts:
// kotlin { allOpen { annotation("org.springframework.cache.annotation.Cacheable") } }
```

**Key Takeaway**: Spring's cache abstraction decouples caching from business logic—annotate methods to cache, update, or evict automatically.

**Why It Matters**: Spring's cache abstraction decouples caching from business logic—adding @Cacheable doesn't modify method behavior, enabling gradual cache adoption where teams can cache slow queries without refactoring service layers. Production systems use caching to reduce database load by 90% for read-heavy workloads (product catalogs, user profiles), with cache hit rates of 95%+ that keep API latency under 50ms even when databases struggle under write pressure during peak traffic.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    A[Client Request] --> B{Cache Check}
    B -->|Cache Hit| C[Return Cached Value]
    B -->|Cache Miss| D[Execute Method]
    D --> E[Query Database]
    E --> F[Store in Cache]
    F --> G[Return Result]

    H[Update Operation] --> I[@CachePut]
    I --> J[Update Database]
    J --> K[Update Cache]

    L[Delete Operation] --> M[@CacheEvict]
    M --> N[Delete from Database]
    N --> O[Remove from Cache]

    style A fill:#0173B2,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style E fill:#DE8F05,stroke:#000,color:#fff
    style K fill:#CC78BC,stroke:#000,color:#fff
    style O fill:#CA9161,stroke:#000,color:#fff
```

---

### Example 35: Redis Integration

Use Redis as distributed cache backend for distributed caching, session storage, and pub/sub messaging across multiple application instances.

> **Why Not Core Features**: Spring's `@Cacheable` with the default `ConcurrentHashMap` cache or `spring-boot-starter-cache` with Caffeine provides excellent in-memory caching for single-instance applications — no Redis required. Use Redis when you need **distributed caching** across multiple application instances (horizontal scaling), **cache persistence** across application restarts, or **shared session storage** in a clustered deployment. For single-instance applications or development environments, Caffeine (`com.github.ben-manes.caffeine:caffeine`) offers higher performance than Redis without the infrastructure overhead.

```java
// pom.xml
<dependency>
// => Code execution
  <groupId>org.springframework.boot</groupId>
  // => Code execution
  <artifactId>spring-boot-starter-data-redis</artifactId>
  // => Code execution
</dependency>
// => Code execution

// application.yml
spring:
// => Code execution
  data:
  // => Code execution
    redis:
    // => Code execution
      host: localhost
      // => Code execution
      port: 6379
      // => Code execution
  cache:
  // => Code execution
    type: redis
    // => Code line
    redis:
    // => Code line
      time-to-live: 600000 # 10 minutes in milliseconds
      // => Code line

// Redis config
@Configuration
// => Annotation applied
@EnableCaching
// => Annotation applied
public class RedisCacheConfig {
    // => Begins block
  @Bean
  // => Annotation applied
  public CacheManager cacheManager(RedisConnectionFactory factory) {
    // => Begins block
    RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
    // => Executes method call
      .entryTtl(Duration.ofMinutes(10)) // Cache expiration
    // => Executes method
      .serializeKeysWith(
      // => Code line
        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
    // => Executes method
      )
      // => Code line
      .serializeValuesWith(
      // => Code line
        RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
    // => Executes method
      );
      // => Executes statement

    return RedisCacheManager.builder(factory)
    // => Returns value to caller
      .cacheDefaults(config)
    // => Executes method
      .build();
    // => Executes method
  }
  // => Block delimiter
}
// => Block delimiter

// Service (same annotations as Example 34)
@Service
// => Annotation applied
public class UserService {
    // => Begins block
  @Cacheable("users") // Now uses Redis instead of in-memory cache
    // => Executes method
  public User findById(Long id) {
    // => Begins block
    return userRepo.findById(id).orElseThrow();
    // => Returns value to caller
  }
  // => Block delimiter
}
// => Block delimiter

// Direct Redis operations (without cache abstraction)
@Service
// => Annotation applied
public class SessionService {
    // => Begins block
  @Autowired private RedisTemplate<String, Object> redisTemplate;
  // => Annotation applied

  public void saveSession(String sessionId, UserSession session) {
    // => Begins block
    redisTemplate.opsForValue().set("session:" + sessionId, session, Duration.ofMinutes(30));
    // => Executes method
    // => Key: "session:abc123", Value: serialized UserSession, TTL: 30 minutes
  }
  // => Block delimiter

  public UserSession getSession(String sessionId) {
    // => Begins block
    return (UserSession) redisTemplate.opsForValue().get("session:" + sessionId);
    // => Returns value to caller
    // => Returns null if expired or not found
  }

  public void deleteSession(String sessionId) {
    // => Begins block
    redisTemplate.delete("session:" + sessionId);
    // => Executes method
  }
}
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts
implementation("org.springframework.boot:spring-boot-starter-data-redis")

// application.yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
  cache:
    type: redis
    redis:
      time-to-live: 600000  # 10 minutes in milliseconds

// Redis config
@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
@EnableCaching
// => Annotation applied
// => Annotation applied
open class RedisCacheConfig {
// => Class declaration
// => Class declaration
  @Bean
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  open fun cacheManager(factory: RedisConnectionFactory): CacheManager {
  // => Function definition
  // => Function declaration
    val config = RedisCacheConfiguration.defaultCacheConfig()
    // => Immutable property
    // => Immutable binding (read-only reference)
      .entryTtl(Duration.ofMinutes(10))  // Cache expiration
      .serializeKeysWith(
        RedisSerializationContext.SerializationPair.fromSerializer(StringRedisSerializer())
      )
      .serializeValuesWith(
        RedisSerializationContext.SerializationPair.fromSerializer(GenericJackson2JsonRedisSerializer())
      )

    return RedisCacheManager.builder(factory)
    // => Returns to caller
    // => Returns value to caller
      .cacheDefaults(config)
      .build()
  }
}

// Service (same annotations as Example 34)
@Service
// => Business logic service bean
// => Business logic layer Spring component
open class UserService(
// => Class declaration
// => Class declaration
  private val userRepo: UserRepository
  // => Immutable property
  // => Private class member
) {
// => Block begins
  @Cacheable("users")  // Now uses Redis instead of in-memory cache
  // => Cache method result
  // => Caches method result; returns cached value on repeat calls
  open fun findById(id: Long): User {
  // => Function definition
  // => Function declaration
    return userRepo.findById(id).orElseThrow()
    // => Returns to caller
    // => Returns value to caller
  }
}

// Direct Redis operations (without cache abstraction)
@Service
// => Business logic service bean
// => Business logic layer Spring component
class SessionService(
// => Class declaration
// => Class declaration
  private val redisTemplate: RedisTemplate<String, Any>
  // => Immutable property
  // => Private class member
) {
// => Block begins
  fun saveSession(sessionId: String, session: UserSession) {
  // => Function definition
  // => Function declaration
    redisTemplate.opsForValue().set("session:$sessionId", session, Duration.ofMinutes(30))
    // => Key: "session:abc123", Value: serialized UserSession, TTL: 30 minutes
  }

  fun getSession(sessionId: String): UserSession? {
  // => Function definition
  // => Function declaration
    return redisTemplate.opsForValue().get("session:$sessionId") as? UserSession
    // => Returns to caller
    // => Returns value to caller
    // => Returns null if expired or not found
  }

  fun deleteSession(sessionId: String) {
  // => Function definition
  // => Function declaration
    redisTemplate.delete("session:$sessionId")
  }
}

// Kotlin-specific: Use string templates for Redis keys, safe cast (as?) for type conversion
// Alternative with inline reified functions for type-safe operations:
// inline fun <reified T> RedisTemplate<String, Any>.getTyped(key: String): T? =
//   opsForValue().get(key) as? T
```

**Key Takeaway**: Redis provides distributed caching across multiple application instances—configure TTL for automatic expiration.

**Why It Matters**: Redis distributed caching enables horizontal scaling where all application instances share cache entries, unlike in-memory caches where each instance maintains separate caches causing inconsistent reads. Production systems use Redis to cache session data across many application instances, achieving sub-millisecond cache response times at high request volumes, with Redis persistence options (RDB snapshots, AOF logs) preventing cache warm-up delays after crashes that would overwhelm databases with cold cache load.

---

### Example 36: Cache Strategies

Common caching patterns and pitfalls.

```java
@Service
public class CacheStrategyService {
  @Autowired private ProductRepository productRepo;
  // => Injected repository for database operations
  @Autowired private CacheManager cacheManager;
  // => Injected cache manager for manual cache control

  // Cache-Aside (Lazy Loading)
  @Cacheable("products")
  // => Strategy: Data loaded into cache only when requested (lazy)
  // => Cache miss: query database → store result in cache
  // => Cache hit: return cached value (no database query)
  public Product findById(Long id) {
    return productRepo.findById(id).orElseThrow();
    // => Load on demand, cache misses query database
    // => First call: database query + cache store
    // => Subsequent calls: cache hit (no database query)
  }

  // Write-Through (Eager Update)
  @CachePut(value = "products", key = "#result.id")
  // => Strategy: Cache updated synchronously with database writes
  // => ALWAYS executes method (no cache hit shortcut)
  // => Updates cache with return value (key=result.id)
  public Product save(Product product) {
    return productRepo.save(product);
    // => Writes to database AND cache simultaneously
    // => Ensures cache consistency (no stale data)
    // => Trade-off: Slower writes (both DB + cache), guaranteed consistency
  }

  // Cache Stampede Prevention
  @Cacheable(value = "expensive-data", sync = true) // Synchronize cache loading
  // => sync=true: Serializes cache loading for same key
  // => Scenario: 100 threads request same uncached key simultaneously
  // => Without sync: 100 threads execute expensive computation (stampede)
  // => With sync: 1 thread computes, 99 threads wait for cache result
  public ExpensiveData loadExpensiveData(String key) {
    // Only one thread loads data, others wait for cached result
    // => Prevents database/computation overload on cache miss
    return computeExpensiveData(key);
    // => Expensive computation (e.g., 5 seconds, complex SQL aggregation)
    // => First thread: executes computation, caches result
    // => Other threads: blocked until cache populated, then return cached value
  }

  // Conditional Caching
  @Cacheable(value = "products", condition = "#id > 100") // Only cache if id > 100
  // => condition: Evaluated BEFORE method execution
  // => if (id > 100) → check cache → cache miss → execute method → store in cache
  // => if (id <= 100) → skip caching entirely (always execute method)
  // => Use case: Cache only frequently accessed items (high IDs)
  public Product findByIdConditional(Long id) {
    return productRepo.findById(id).orElseThrow();
    // => id=150 → cached (high-traffic products)
    // => id=5 → NOT cached (low-traffic products)
  }

  @Cacheable(value = "products", unless = "#result.price < 10") // Don't cache cheap products
  // => unless: Evaluated AFTER method execution (can access result)
  // => Method always executes → if (result.price < 10) → DON'T cache
  // => if (result.price >= 10) → store in cache
  // => Use case: Cache only expensive products (worth caching overhead)
  public Product findByIdUnless(Long id) {
    return productRepo.findById(id).orElseThrow();
    // => Product{price=5.00} → NOT cached (cheap items change frequently)
    // => Product{price=500.00} → cached (expensive items worth caching)
  }

  // Manual Cache Control
  public void warmUpCache() {
    List<Product> topProducts = productRepo.findTop100ByOrderBySalesDesc();
    // => Query top 100 best-selling products from database
    Cache cache = cacheManager.getCache("products");
    // => Get reference to "products" cache region
    topProducts.forEach(p -> cache.put(p.getId(), p));
    // => Manually populate cache with pre-selected products
    // => Pre-populate cache with frequently accessed data
    // => Use case: Application startup or scheduled refresh
    // => Prevents cold cache performance issues
  }

  // Cache Invalidation Pattern
  @Scheduled(cron = "0 0 3 * * ?") // Every day at 3 AM
  // => Cron expression: seconds minutes hours day month weekday
  // => "0 0 3 * * ?" = 3:00 AM every day (any day of week)
  public void scheduledCacheEviction() {
    cacheManager.getCacheNames().forEach(name -> {
      // => Iterate through all cache regions: "products", "users", "categories"...
      cacheManager.getCache(name).clear();
      // => Clears ALL entries from cache region
    });
    System.out.println("All caches cleared");
    // => Use case: Daily cache refresh for stale data prevention
    // => Trade-off: Temporary performance drop after eviction (cold cache)
  }
}

// Common Pitfalls
@Service
public class CachePitfallsService {
  // ❌ Wrong: Self-invocation bypasses proxy
  public Product getProduct(Long id) {
    return this.findById(id); // Cache annotation IGNORED (no proxy)
    // => Direct method call within same class (this.findById)
    // => Bypasses Spring's caching proxy (AOP interceptor)
    // => Result: @Cacheable annotation has NO effect
    // => Method ALWAYS executes, cache NEVER consulted
  }

  @Cacheable("products")
  public Product findById(Long id) {
    return productRepo.findById(id).orElseThrow();
    // => @Cacheable only works when called through Spring proxy
    // => Internal call (this.findById) bypasses proxy
  }

  // ✅ Correct: Inject self-reference
  @Autowired private CachePitfallsService self;
  // => Injects Spring-managed proxy bean (not raw instance)
  // => Proxy intercepts method calls and applies caching logic

  public Product getProductCorrect(Long id) {
    return self.findById(id); // Cache annotation WORKS (via proxy)
    // => External call through proxy (self.findById)
    // => Spring proxy intercepts call
    // => Caching logic executes: check cache → hit/miss → store result
    // => @Cacheable annotation NOW effective
  }
}
```

**Code (Kotlin)**:

```kotlin
@Service
// => Business logic layer Spring component
open class CacheStrategyService(
// => Class declaration
  private val productRepo: ProductRepository,
  // => Private class member
  private val cacheManager: CacheManager
  // => Private class member
) {
// => Block begins
  // Cache-Aside (Lazy Loading)
  @Cacheable("products")
  // => Caches method result; returns cached value on repeat calls
  open fun findById(id: Long): Product {
  // => Function declaration
    return productRepo.findById(id).orElseThrow()
    // => Returns value to caller
    // => Load on demand, cache misses query database
  }

  // Write-Through (Eager Update)
  @CachePut(value = ["products"], key = "#result.id")
  // => Annotation applied
  open fun save(product: Product): Product {
  // => Function declaration
    return productRepo.save(product)
    // => Returns value to caller
    // => Writes to database AND cache simultaneously
  }

  // Cache Stampede Prevention
  @Cacheable(value = ["expensive-data"], sync = true)  // Synchronize cache loading
  // => Caches method result; returns cached value on repeat calls
  open fun loadExpensiveData(key: String): ExpensiveData {
  // => Function declaration
    // Only one thread loads data, others wait for cached result
    return computeExpensiveData(key)
    // => Returns value to caller
  }

  // Conditional Caching
  @Cacheable(value = ["products"], condition = "#id > 100")  // Only cache if id > 100
  // => Caches method result; returns cached value on repeat calls
  open fun findByIdConditional(id: Long): Product {
  // => Function declaration
    return productRepo.findById(id).orElseThrow()
    // => Returns value to caller
  }

  @Cacheable(value = ["products"], unless = "#result.price < 10")  // Don't cache cheap products
  // => Caches method result; returns cached value on repeat calls
  open fun findByIdUnless(id: Long): Product {
  // => Function declaration
    return productRepo.findById(id).orElseThrow()
    // => Returns value to caller
  }

  // Manual Cache Control
  fun warmUpCache() {
  // => Function declaration
    val topProducts = productRepo.findTop100ByOrderBySalesDesc()
    // => Immutable binding (read-only reference)
    val cache = cacheManager.getCache("products")!!
    // => Immutable binding (read-only reference)
    topProducts.forEach { cache.put(it.id, it) }
    // => Pre-populate cache with frequently accessed data
  }

  // Cache Invalidation Pattern
  @Scheduled(cron = "0 0 3 * * ?")  // Every day at 3 AM
  // => Scheduled task execution
  fun scheduledCacheEviction() {
  // => Function declaration
    cacheManager.cacheNames.forEach { name ->
      cacheManager.getCache(name)?.clear()
    }
    println("All caches cleared")
    // => Output: see string template value above
  }
}

// Common Pitfalls
@Service
// => Business logic layer Spring component
open class CachePitfallsService(
// => Class declaration
  private val productRepo: ProductRepository
  // => Private class member
) {
// => Block begins
  // ❌ Wrong: Self-invocation bypasses proxy
  fun getProduct(id: Long): Product {
  // => Function declaration
    return this.findById(id)  // Cache annotation IGNORED (no proxy)
    // => Returns value to caller
  }

  @Cacheable("products")
  // => Caches method result; returns cached value on repeat calls
  open fun findById(id: Long): Product {
  // => Function declaration
    return productRepo.findById(id).orElseThrow()
    // => Returns value to caller
  }

  // ✅ Correct: Inject self-reference
  @Autowired private lateinit var self: CachePitfallsService
  // => Injects Spring-managed dependency

  fun getProductCorrect(id: Long): Product {
  // => Function declaration
    return self.findById(id)  // Cache annotation WORKS (via proxy)
    // => Returns value to caller
  }
}

// Kotlin-specific: Methods must be open for Spring proxy, use lateinit for self-injection
// Alternative with lazy delegate:
// private val self: CachePitfallsService by lazy {
//   applicationContext.getBean(CachePitfallsService::class.java)
// }
```

**Key Takeaway**: Choose caching strategies based on consistency needs—cache-aside for reads, write-through for updates, sync for stampede prevention.

**Why It Matters**: Cache-aside pattern with sync=true prevents cache stampedes where 1000 concurrent requests for an expired cache entry trigger 1000 identical database queries, causing database CPU spikes that cascade into timeouts. Production caching strategies use short TTLs (minutes) for frequently changing data versus long TTLs (hours/days) for static data, with cache warming during deployment preventing cold cache performance degradation where the first user request experiences 5-second latency while loading cache.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A[1000 Concurrent Requests] --> B{Cache Entry Expired?}

    B -->|Without sync=true| C[1000 Threads Query DB]
    C --> D[Database Overload]
    D --> E[Timeouts & Errors]

    B -->|With sync=true| F[First Thread Locks]
    F --> G[Thread 1: Query DB]
    F --> H[Threads 2-1000: Wait]
    G --> I[Load Result]
    I --> J[Store in Cache]
    J --> K[Release Lock]
    K --> L[All Threads Get Cached Value]
    L --> M[No Database Overload]

    style A fill:#0173B2,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#DE8F05,stroke:#000,color:#fff
    style J fill:#029E73,stroke:#000,color:#fff
    style M fill:#029E73,stroke:#000,color:#fff
```

---

## Group 5: Async & Events

### Example 37: @Async Methods

Execute methods asynchronously with thread pools.

```java
// Enable async support
@SpringBootApplication
@EnableAsync // Enable @Async annotation
// => Activates Spring's async method execution capability
// => Creates default TaskExecutor (SimpleAsyncTaskExecutor)
// => Scans for @Async methods and wraps them in async proxies
public class Application {
    // => Begins block
  public static void main(String[] args) {
    // => Begins block
    SpringApplication.run(Application.class, args);
    // => Executes method
  }
}

// Async service
@Service
public class EmailService {
    // => Begins block
  @Async // Runs in separate thread
  // => Method execution delegated to TaskExecutor thread pool
  // => Calling thread returns immediately (non-blocking)
  // => Default thread pool: unlimited threads (not production-ready)
  public void sendEmail(String to, String subject, String body) {
    // => Begins block
    System.out.println("Sending email to " + to + " - Thread: " + Thread.currentThread().getName());
    // => Prints to console
    // => Output: "Sending email to user@example.com - Thread: task-1"
    // => Shows execution in async thread (not HTTP request thread)
    // Simulate delay
    try { Thread.sleep(3000); } catch (InterruptedException e) {}
    // => Executes method
    // => Simulates slow email sending operation (3 seconds)
    // => HTTP request thread already returned response (doesn't wait)
    System.out.println("Email sent to " + to);
    // => Prints to console
    // => Prints 3 seconds after method call (asynchronously)
  }

  @Async
  public CompletableFuture<String> sendEmailWithResult(String to) {
    // => Begins block
    System.out.println("Sending email - Thread: " + Thread.currentThread().getName());
    // => Prints to console
    // => Executes in async thread pool
    try { Thread.sleep(2000); } catch (InterruptedException e) {}
    // => Executes method
    // => 2-second delay simulating email sending
    return CompletableFuture.completedFuture("Email sent to " + to);
    // => Returns value to caller
    // => Returns CompletableFuture for async result handling
    // => Caller can chain .thenApply(), .exceptionally(), .whenComplete()
    // => Allows non-blocking result processing
  }

  @Async
  public CompletableFuture<Integer> processLargeFile(String filename) {
    // => Begins block
    System.out.println("Processing " + filename);
    // => Prints to console
    // => Output: "Processing file1.csv" (in async thread)
    try { Thread.sleep(5000); } catch (InterruptedException e) {}
    // => Executes method
    // => 5-second delay simulating file processing
    return CompletableFuture.completedFuture(10000); // Processed 10000 records
    // => Returns value to caller
    // => Returns count of processed records
    // => CompletableFuture allows caller to combine multiple async operations
  }
}

// Controller
@RestController
@RequestMapping("/api/async")
    // => Executes method
public class AsyncController {
    // => Begins block
  @Autowired private EmailService emailService;
  // => Injected service proxy (Spring wraps @Async methods)

  @PostMapping("/send-email")
  public ResponseEntity<String> sendEmail(@RequestParam String to) {
    emailService.sendEmail(to, "Welcome", "Hello!");
    // => Calls async method: delegates to thread pool, returns immediately
    // => HTTP request thread does NOT wait for email to send
    return ResponseEntity.ok("Email queued"); // Returns immediately
    // => Response sent to client in ~1ms (without waiting 3 seconds)
    // => Controller thread doesn't wait for email to send
    // => Email sending continues in background thread
    // => Use case: Fire-and-forget operations (notifications, logging, analytics)
  }

  @GetMapping("/send-with-result")
  public CompletableFuture<String> sendWithResult(@RequestParam String to) {
    return emailService.sendEmailWithResult(to)
      // => Returns CompletableFuture<String> immediately
      // => Spring MVC waits for CompletableFuture to complete before sending response
      .thenApply(result -> "Result: " + result);
      // => Transforms async result when available
      // => Non-blocking—returns CompletableFuture
      // => HTTP thread released while waiting (servlet async support)
      // => Response sent when CompletableFuture completes (~2 seconds)
  }

  @GetMapping("/process-multiple")
  public CompletableFuture<String> processMultiple() {
    CompletableFuture<Integer> file1 = emailService.processLargeFile("file1.csv");
    // => Starts file1 processing in async thread (returns immediately)
    CompletableFuture<Integer> file2 = emailService.processLargeFile("file2.csv");
    // => Starts file2 processing in parallel (different thread)
    CompletableFuture<Integer> file3 = emailService.processLargeFile("file3.csv");
    // => Starts file3 processing in parallel (3 files processing concurrently)

    return CompletableFuture.allOf(file1, file2, file3)
      // => Waits for ALL three futures to complete
      // => allOf() returns CompletableFuture<Void> when all complete
      .thenApply(v -> {
        // => Executes when all 3 files processed (~5 seconds, not 15)
        int total = file1.join() + file2.join() + file3.join();
        // => join() extracts result from CompletableFuture (blocks until ready)
        // => file1.join()=10000, file2.join()=10000, file3.join()=10000
        // => total = 30000
        return "Total records processed: " + total;
        // => Returns "Total records processed: 30000"
      });
    // => Processes 3 files in parallel, waits for all to complete
    // => Sequential would take 15 seconds, parallel takes ~5 seconds
    // => HTTP response sent when thenApply completes
  }
}
```

**Code (Kotlin)**:

```kotlin
// Enable async support
@SpringBootApplication
// => Combines @Configuration, @EnableAutoConfiguration, @ComponentScan
@EnableAsync  // Enable @Async annotation
// => Annotation applied
open class Application
// => Class declaration

fun main(args: Array<String>) {
// => Function declaration
  runApplication<Application>(*args)
}

// Async service
@Service
// => Business logic layer Spring component
open class EmailService {
// => Class declaration
  @Async  // Runs in separate thread
  // => Executes method in separate thread pool
  open fun sendEmail(to: String, subject: String, body: String) {
  // => Function declaration
    println("Sending email to $to - Thread: ${Thread.currentThread().name}")
    // => Output: see string template value above
    // Simulate delay
    Thread.sleep(3000)
    println("Email sent to $to")
    // => Output: see string template value above
  }

  @Async
  // => Executes method in separate thread pool
  open fun sendEmailWithResult(to: String): CompletableFuture<String> {
  // => Function declaration
    println("Sending email - Thread: ${Thread.currentThread().name}")
    // => Output: see string template value above
    Thread.sleep(2000)
    return CompletableFuture.completedFuture("Email sent to $to")
    // => Returns value to caller
    // => Returns CompletableFuture for async result handling
  }

  @Async
  // => Executes method in separate thread pool
  open fun processLargeFile(filename: String): CompletableFuture<Int> {
  // => Function declaration
    println("Processing $filename")
    // => Output: see string template value above
    Thread.sleep(5000)
    return CompletableFuture.completedFuture(10000)  // Processed 10000 records
    // => Returns value to caller
  }
}

// Controller
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/async")
// => HTTP endpoint mapping
class AsyncController(
// => Class declaration
  private val emailService: EmailService
  // => Private class member
) {
// => Block begins
  @PostMapping("/send-email")
  // => HTTP endpoint mapping
  fun sendEmail(@RequestParam to: String): ResponseEntity<String> {
  // => Function declaration
    emailService.sendEmail(to, "Welcome", "Hello!")
    return ResponseEntity.ok("Email queued")  // Returns immediately
    // => Returns value to caller
    // => Controller thread doesn't wait for email to send
  }

  @GetMapping("/send-with-result")
  // => HTTP endpoint mapping
  fun sendWithResult(@RequestParam to: String): CompletableFuture<String> {
  // => Function declaration
    return emailService.sendEmailWithResult(to)
    // => Returns value to caller
      .thenApply { result -> "Result: $result" }
    // => Non-blocking—returns CompletableFuture
  }

  @GetMapping("/process-multiple")
  // => HTTP endpoint mapping
  fun processMultiple(): CompletableFuture<String> {
  // => Function declaration
    val file1 = emailService.processLargeFile("file1.csv")
    // => Immutable binding (read-only reference)
    val file2 = emailService.processLargeFile("file2.csv")
    // => Immutable binding (read-only reference)
    val file3 = emailService.processLargeFile("file3.csv")
    // => Immutable binding (read-only reference)

    return CompletableFuture.allOf(file1, file2, file3)
    // => Returns value to caller
      .thenApply {
      // => Block begins
        val total = file1.join() + file2.join() + file3.join()
        // => Immutable binding (read-only reference)
        "Total records processed: $total"
      }
    // => Processes 3 files in parallel, waits for all to complete
  }
}

// Kotlin-specific: Methods must be open for @Async proxy
// Alternative with Kotlin Coroutines (more idiomatic):
// suspend fun sendEmail(to: String) = withContext(Dispatchers.IO) { ... }
// suspend fun processMultiple() = coroutineScope {
//   val d1 = async { processLargeFile("file1.csv") }
//   val d2 = async { processLargeFile("file2.csv") }
//   val d3 = async { processLargeFile("file3.csv") }
//   "Total: ${d1.await() + d2.await() + d3.await()}"
// }
```

**Key Takeaway**: `@Async` offloads work to background threads—use `CompletableFuture` return types for composable async operations.

**Why It Matters**: Async methods prevent slow operations (email sending, PDF generation) from blocking HTTP request threads, enabling APIs to respond in 50ms while offloading 5-second background work to thread pools. However, @Async without custom thread pools shares the default pool with all async operations, causing thread starvation where one slow operation delays all others—production systems configure separate thread pools (email-pool, report-pool) sized to each operation's concurrency needs.

---

### Example 38: Task Executors

Configure thread pools for async execution.

```java
@Configuration
// => Annotation applied
@EnableAsync
// => Annotation applied
public class AsyncConfig implements AsyncConfigurer {
    // => Begins block

  @Override
  // => Annotation applied
  public Executor getAsyncExecutor() {
    // => Begins block
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    // => Creates new instance
    executor.setCorePoolSize(5); // Minimum threads
    // => Executes method
    executor.setMaxPoolSize(10); // Maximum threads
    // => Executes method
    executor.setQueueCapacity(100); // Queue size before rejecting tasks
    // => Executes method
    executor.setThreadNamePrefix("async-"); // Thread naming
    // => Executes method
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    // => Executes method
    executor.initialize();
    // => Executes method
    return executor;
    // => Returns result
  }
  // => Block delimiter

  // Custom executor for specific tasks
  @Bean(name = "emailExecutor")
  // => Annotation applied
  public Executor emailExecutor() {
    // => Begins block
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    // => Creates new instance
    executor.setCorePoolSize(2);
    // => Executes method
    executor.setMaxPoolSize(5);
    // => Executes method
    executor.setQueueCapacity(50);
    // => Executes method
    executor.setThreadNamePrefix("email-");
    // => Executes method
    executor.initialize();
    // => Executes method
    return executor;
    // => Returns result
  }
  // => Block delimiter

  @Bean(name = "reportExecutor")
  // => Annotation applied
  public Executor reportExecutor() {
    // => Begins block
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    // => Creates new instance
    executor.setCorePoolSize(1);
    // => Executes method
    executor.setMaxPoolSize(3);
    // => Executes method
    executor.setQueueCapacity(20);
    // => Executes method
    executor.setThreadNamePrefix("report-");
    // => Executes method
    executor.initialize();
    // => Executes method
    return executor;
    // => Returns result
  }
  // => Block delimiter
}
// => Block delimiter

// Service with custom executors
@Service
// => Annotation applied
public class NotificationService {
    // => Begins block
  @Async("emailExecutor") // Use specific executor
    // => Executes method
  public void sendEmailNotification(String to) {
    // => Begins block
    System.out.println("Email thread: " + Thread.currentThread().getName());
    // => Prints to console
    // => Thread name: email-1, email-2, etc.
  }
  // => Block delimiter

  @Async("reportExecutor")
    // => Executes method
  public CompletableFuture<Report> generateReport(Long id) {
    // => Begins block
    System.out.println("Report thread: " + Thread.currentThread().getName());
    // => Prints to console
    // => Thread name: report-1, report-2, etc.
    return CompletableFuture.completedFuture(new Report(id));
    // => Returns value to caller
  }
  // => Block delimiter
}
```

**Code (Kotlin)**:

```kotlin
@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
@EnableAsync
// => Annotation applied
// => Annotation applied
open class AsyncConfig : AsyncConfigurer {
// => Class declaration
// => Class declaration
  override fun getAsyncExecutor(): Executor {
  // => Function definition
  // => Overrides parent class/interface method
    val executor = ThreadPoolTaskExecutor()
    // => Immutable property
    // => Immutable binding (read-only reference)
    executor.corePoolSize = 5  // Minimum threads
    // => Assignment
    // => Assignment
    executor.maxPoolSize = 10  // Maximum threads
    // => Assignment
    // => Assignment
    executor.queueCapacity = 100  // Queue size before rejecting tasks
    // => Assignment
    // => Assignment
    executor.setThreadNamePrefix("async-")  // Thread naming
    executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
    executor.initialize()
    return executor
    // => Returns to caller
    // => Returns value to caller
  }

  // Custom executor for specific tasks
  @Bean(name = ["emailExecutor"])
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  open fun emailExecutor(): Executor {
  // => Function definition
  // => Function declaration
    return ThreadPoolTaskExecutor().apply {
    // => Returns to caller
    // => Returns value to caller
      corePoolSize = 2
      // => Assignment
      // => Assignment
      maxPoolSize = 5
      // => Assignment
      // => Assignment
      queueCapacity = 50
      // => Assignment
      // => Assignment
      setThreadNamePrefix("email-")
      initialize()
    }
  }

  @Bean(name = ["reportExecutor"])
  // => Defines a Spring-managed bean
  // => Declares a Spring-managed bean
  open fun reportExecutor(): Executor {
  // => Function definition
  // => Function declaration
    return ThreadPoolTaskExecutor().apply {
    // => Returns to caller
    // => Returns value to caller
      corePoolSize = 1
      // => Assignment
      // => Assignment
      maxPoolSize = 3
      // => Assignment
      // => Assignment
      queueCapacity = 20
      // => Assignment
      // => Assignment
      setThreadNamePrefix("report-")
      initialize()
    }
  }
}

// Service with custom executors
@Service
// => Business logic service bean
// => Business logic layer Spring component
open class NotificationService {
// => Class declaration
// => Class declaration
  @Async("emailExecutor")  // Use specific executor
  // => Execute in async thread pool
  // => Executes method in separate thread pool
  open fun sendEmailNotification(to: String) {
  // => Function definition
  // => Function declaration
    println("Email thread: ${Thread.currentThread().name}")
    // => Output: see string template value above
    // => Thread name: email-1, email-2, etc.
  }

  @Async("reportExecutor")
  // => Execute in async thread pool
  // => Executes method in separate thread pool
  open fun generateReport(id: Long): CompletableFuture<Report> {
  // => Function definition
  // => Function declaration
    println("Report thread: ${Thread.currentThread().name}")
    // => Output: see string template value above
    // => Thread name: report-1, report-2, etc.
    return CompletableFuture.completedFuture(Report(id))
    // => Returns to caller
    // => Returns value to caller
  }
}

// Kotlin-specific: Use apply scope function for builder-style configuration
// Alternative with property syntax:
// ThreadPoolTaskExecutor().apply {
//   this.corePoolSize = 5
//   this.maxPoolSize = 10
// }
// Note: Coroutines provide more idiomatic async model:
// @OptIn(ExperimentalCoroutinesApi::class)
// val emailDispatcher = Dispatchers.IO.limitedParallelism(5)
```

**Key Takeaway**: Configure `ThreadPoolTaskExecutor` for fine-grained control—separate executors isolate thread pools for different task types.

**Why It Matters**: Custom thread pools isolate failure domains—if report generation consumes all threads, email sending continues using its dedicated pool instead of queueing behind slow operations. Production configurations tune core pool size (CPU-bound: core count, I/O-bound: core count \* 2-4) and queue capacity (buffer for traffic spikes without rejection) based on monitoring data, preventing OutOfMemoryErrors from unbounded queues that accumulate tasks faster than threads can process them.

---

### Example 39: Application Events

Decouple components with Spring's event publishing mechanism.

```java
// Custom event
public class OrderPlacedEvent extends ApplicationEvent {
    // => Begins block
  // => Custom event type extending Spring's ApplicationEvent
  // => All Spring events inherit from ApplicationEvent for type safety
  private final Order order;
  // => Immutable field (final) carrying event payload

  public OrderPlacedEvent(Object source, Order order) {
    // => Begins block
    super(source);
    // => Executes method
    // => source = event publisher (typically "this" from publishing service)
    // => Stored in ApplicationEvent.source field for traceability
    this.order = order;
    // => Event payload: the order that was placed
  }

  public Order getOrder() {
    // => Begins block
    return order;
    // => Returns result
    // => Getter for event payload (accessed by listeners)
  }
}

// Event publisher
@Service
public class OrderService {
    // => Begins block
  @Autowired private ApplicationEventPublisher eventPublisher;
  // => Injected publisher for broadcasting events to listeners
  @Autowired private OrderRepository orderRepo;
  // => Injected repository for database operations

  public Order placeOrder(Order order) {
    // => Begins block
    order.setStatus("PLACED");
    // => Executes method
    // => Sets order status to "PLACED"
    Order saved = orderRepo.save(order);
    // => Persists order to database (generates ID)

    // Publish event
    eventPublisher.publishEvent(new OrderPlacedEvent(this, saved));
    // => Executes method
    // => Broadcasts event to ALL registered @EventListener methods
    // => this = event source (OrderService instance)
    // => saved = event payload (persisted Order object)
    // => Listeners are notified asynchronously
    // => By default: synchronous execution (listeners run in same thread)
    // => With @Async: asynchronous execution (listeners run in thread pool)

    return saved;
    // => Returns result
    // => Returns saved order to caller
    // => Publisher doesn't know about listeners (decoupling)
  }
}

// Event listeners
@Component
public class EmailNotificationListener {
    // => Begins block
  @EventListener // Subscribe to event
  // => Registers method as listener for OrderPlacedEvent
  // => Spring auto-detects event type from method parameter
  public void handleOrderPlaced(OrderPlacedEvent event) {
    // => Begins block
    Order order = event.getOrder();
    // => Extracts order from event payload
    System.out.println("Sending confirmation email for order " + order.getId());
    // => Prints to console
    // => Logs email sending operation
    // => Executes synchronously by default
    // => Runs in same thread as eventPublisher.publishEvent()
    // => Blocks placeOrder() method until email sending completes
  }
}

@Component
public class InventoryListener {
    // => Begins block
  @EventListener
  @Async // Make listener async
  // => Executes in separate thread from async executor
  // => placeOrder() returns immediately (doesn't wait for inventory update)
  public void handleOrderPlaced(OrderPlacedEvent event) {
    // => Begins block
    System.out.println("Updating inventory - Thread: " + Thread.currentThread().getName());
    // => Prints to console
    // => Output: "Updating inventory - Thread: async-1"
    // => Executes in background thread
    // => Non-blocking: order placement completes without waiting
    // => Use case: Independent operations that don't affect order placement success
  }
}

@Component
public class AnalyticsListener {
    // => Begins block
  @EventListener
  @Async
  // => Async listener: runs in parallel with InventoryListener
  public void handleOrderPlaced(OrderPlacedEvent event) {
    // => Begins block
    System.out.println("Recording analytics for order " + event.getOrder().getId());
    // => Prints to console
    // => Output: "Recording analytics for order 123"
    // => Runs in async thread (non-blocking)
    // => Multiple async listeners execute concurrently
  }
}

// Conditional listeners
@Component
public class LargeOrderListener {
  @EventListener(condition = "#event.order.total > 1000") // Only for large orders
  // => SpEL condition: listener ONLY invoked if order.total > 1000
  // => #event = method parameter (OrderPlacedEvent)
  // => #event.order.total = navigates to Order.total field
  // => If total <= 1000, method NOT called (optimization)
  public void handleLargeOrder(OrderPlacedEvent event) {
    System.out.println("Large order detected: " + event.getOrder().getTotal());
    // => Only executes for high-value orders (e.g., total=1500.00)
    // => Use case: Special processing for premium orders (fraud check, manager notification)
  }
}

// Transaction-aware events
@Component
public class TransactionalListener {
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT) // After transaction commits
  // => Event listener tied to transaction lifecycle
  // => Fires ONLY after database transaction commits successfully
  // => If transaction rolls back → listener NOT invoked
  // => Phases: AFTER_COMMIT (default), AFTER_ROLLBACK, AFTER_COMPLETION, BEFORE_COMMIT
  public void handleOrderPlaced(OrderPlacedEvent event) {
    System.out.println("Order committed, safe to send external API call");
    // => Only fires if transaction succeeds
    // => Guaranteed: order persisted in database before this executes
    // => Safe to call external APIs, send webhooks, update external systems
    // => Use case: Prevent external calls if transaction rolls back
    // => Example: Don't charge payment gateway if order save fails
  }
}
```

**Code (Kotlin)**:

```kotlin
// Custom event (data class instead of extending ApplicationEvent)
data class OrderPlacedEvent(
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  val order: Order,
  val source: Any = Object()
  // => Immutable binding (read-only reference)
)

// Event publisher
@Service
// => Business logic layer Spring component
class OrderService(
// => Class declaration
  private val eventPublisher: ApplicationEventPublisher,
  // => Private class member
  private val orderRepo: OrderRepository
  // => Private class member
) {
// => Block begins
  fun placeOrder(order: Order): Order {
  // => Function declaration
    order.status = "PLACED"
    // => Assignment
    val saved = orderRepo.save(order)
    // => Immutable binding (read-only reference)

    // Publish event
    eventPublisher.publishEvent(OrderPlacedEvent(saved, this))
    // => Listeners are notified asynchronously

    return saved
    // => Returns value to caller
  }
}

// Event listeners
@Component
// => Spring-managed component bean
class EmailNotificationListener {
// => Class declaration
  @EventListener  // Subscribe to event
  // => Handles application events of specified type
  fun handleOrderPlaced(event: OrderPlacedEvent) {
  // => Function declaration
    val order = event.order
    // => Immutable binding (read-only reference)
    println("Sending confirmation email for order ${order.id}")
    // => Output: see string template value above
    // => Executes synchronously by default
  }
}

@Component
// => Spring-managed component bean
class InventoryListener {
// => Class declaration
  @Async  // Process asynchronously
  // => Executes method in separate thread pool
  @EventListener
  // => Handles application events of specified type
  fun handleOrderPlaced(event: OrderPlacedEvent) {
  // => Function declaration
    println("Reducing inventory for order ${event.order.id}")
    // => Output: see string template value above
    // => Runs in separate thread
  }
}

// Conditional listeners
@Component
// => Spring-managed component bean
class LargeOrderListener {
// => Class declaration
  @EventListener(condition = "#event.order.total > 1000")  // Only for large orders
  // => Handles application events of specified type
  fun handleLargeOrder(event: OrderPlacedEvent) {
  // => Function declaration
    println("Large order detected: ${event.order.total}")
    // => Output: see string template value above
  }
}

// Transaction-aware events
@Component
// => Spring-managed component bean
class TransactionalListener {
// => Class declaration
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)  // After transaction commits
  // => Wraps method in database transaction
  fun handleOrderPlaced(event: OrderPlacedEvent) {
  // => Function declaration
    println("Order committed, safe to send external API call")
    // => Output: see string template value above
    // => Only fires if transaction succeeds
  }
}

// Kotlin-specific: Use data class for events (cleaner than extending ApplicationEvent)
// Alternative with sealed classes for event hierarchies:
// sealed class OrderEvent
// data class OrderPlacedEvent(val order: Order) : OrderEvent()
// data class OrderCancelledEvent(val order: Order) : OrderEvent()
// @EventListener fun handle(event: OrderEvent) = when(event) {
//   is OrderPlacedEvent -> handlePlaced(event)
//   is OrderCancelledEvent -> handleCancelled(event)
// }
```

**Key Takeaway**: Events decouple publishers from listeners—use `@Async` for parallel processing, `@TransactionalEventListener` for transaction safety.

**Why It Matters**: Application events decouple components through publish-subscribe messaging—order placement triggers inventory reduction, email sending, and analytics recording without OrderService knowing about these dependencies, enabling feature toggles where new event listeners activate without modifying existing code. Production event-driven architectures support eventual consistency where events propagate asynchronously, accepting temporary inconsistency (order placed, inventory not yet reduced) for higher throughput than synchronous request/response chains that wait for all operations to complete.

---

### Example 40: Scheduling

Execute tasks on fixed schedules with `@Scheduled`.

```java
// Enable scheduling
@SpringBootApplication
@EnableScheduling // Enable @Scheduled annotation
// => Activates scheduled task execution via Spring TaskScheduler
// => Creates default single-threaded scheduler (ScheduledExecutorService)
// => Scans for @Scheduled methods and registers them for execution
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}

// Scheduled tasks
@Component
public class ScheduledTasks {

  // Fixed rate: Executes every 5 seconds (from start of previous execution)
  @Scheduled(fixedRate = 5000)
  // => fixedRate = time between execution starts (in milliseconds)
  // => 5000ms = 5 seconds interval
  // => Timing: measured from START of previous execution to START of next
  public void reportCurrentTime() {
    System.out.println("Current time: " + LocalDateTime.now());
    // => Prints current timestamp every 5 seconds
    // If task takes 2 seconds, next execution starts at: 0s, 5s, 10s, 15s...
    // => Even if task takes 2s, next execution starts at 5s mark (may overlap)
    // => Possible overlap: if task takes >5s, new execution starts before previous finishes
    // => Use fixedDelay to prevent overlap
  }

  // Fixed delay: Waits 5 seconds AFTER previous execution finishes
  @Scheduled(fixedDelay = 5000)
  // => fixedDelay = wait time AFTER previous execution completes
  // => Guarantees NO overlap between executions
  // => Next execution waits until: previous finishes + 5000ms delay
  public void processQueueWithDelay() {
    System.out.println("Processing queue at " + LocalDateTime.now());
    // => Prints start time
    try { Thread.sleep(3000); } catch (InterruptedException e) {}
    // => Simulates 3-second task (e.g., processing queue messages)
    // Next execution starts 5 seconds after this finishes
    // Execution pattern: 0s, 8s, 16s, 24s... (3s task + 5s delay)
    // => Task duration: 3s, delay: 5s → total cycle: 8s
    // => Prevents task overlap (safer for non-idempotent operations)
  }

  // Initial delay: Wait 10 seconds before first execution
  @Scheduled(initialDelay = 10000, fixedRate = 5000)
  // => initialDelay = wait time before FIRST execution (10000ms = 10s)
  // => After first execution, runs every 5s (fixedRate)
  public void delayedStart() {
    System.out.println("Delayed task executed");
    // First execution at 10s, then every 5s: 10s, 15s, 20s...
    // => Use case: Wait for application initialization to complete before running
    // => Example: Wait for database connection pool warmup before running health checks
  }

  // Cron expression: Every day at 2:00 AM
  @Scheduled(cron = "0 0 2 * * ?")
  // => Cron format: second minute hour day-of-month month day-of-week
  // => "0 0 2 * * ?" = second=0, minute=0, hour=2, any day, any month, any weekday
  // => Executes at 02:00:00 every day (server timezone)
  public void dailyBackup() {
    System.out.println("Running daily backup at " + LocalDateTime.now());
    // => Use case: Daily database backup during low-traffic hours
    // => Runs once per day at 2:00 AM (off-peak time)
  }

  // Cron: Every weekday at 9:00 AM
  @Scheduled(cron = "0 0 9 ? * MON-FRI")
  // => "0 0 9 ? * MON-FRI"
  // => second=0, minute=0, hour=9, day-of-month=?, month=*, weekday=MON-FRI
  // => ? = no specific value (used when both day-of-month and day-of-week specified)
  // => Executes Monday through Friday at 09:00:00
  public void weekdayReport() {
    System.out.println("Weekday report generated");
    // => Use case: Business reports generated only on workdays
    // => Skips weekends automatically
  }

  // Cron: Every 15 minutes
  @Scheduled(cron = "0 */15 * * * ?")
  // => "0 */15 * * * ?"
  // => */15 = every 15 minutes (shorthand for 0,15,30,45)
  // => Executes at: 00:00, 00:15, 00:30, 00:45, 01:00, 01:15...
  public void quarterHourlyCheck() {
    System.out.println("15-minute check at " + LocalDateTime.now());
    // Runs at: 00:00, 00:15, 00:30, 00:45, 01:00, 01:15...
    // => Use case: Periodic health checks, cache warmup, metrics collection
    // => 96 executions per day (24 hours * 4 per hour)
  }

  // Cron from configuration
  @Scheduled(cron = "${app.cleanup.schedule}") // Read from application.properties
  // => Property placeholder: reads value from application.properties
  // => Example property: app.cleanup.schedule=0 0 3 * * ?
  // => Allows configurable schedule without code changes
  public void configurableSchedule() {
    System.out.println("Cleanup task running");
    // => Use case: Different schedules per environment
    // => Dev: frequent (every hour), Prod: infrequent (daily at 3 AM)
    // => application-dev.properties: app.cleanup.schedule=0 0 * * * ?
    // => application-prod.properties: app.cleanup.schedule=0 0 3 * * ?
  }
}

// Cron format: second minute hour day-of-month month day-of-week
// => second: 0-59
// => minute: 0-59
// => hour: 0-23
// => day-of-month: 1-31
// => month: 1-12 (or JAN-DEC)
// => day-of-week: 0-6 (SUN-SAT) or MON,TUE,WED,THU,FRI,SAT,SUN
// => Special characters: * (any), ? (no specific value), - (range), , (list), / (increment)
// Examples:
// "0 0 * * * ?" - Every hour
// => Runs at 00:00, 01:00, 02:00... (top of every hour)
// "0 30 9 * * ?" - 9:30 AM daily
// => Runs at 09:30:00 every day
// "0 0 12 1 * ?" - 12:00 PM on 1st day of month
// => Runs at 12:00:00 on 1st of every month (monthly billing, reports)
```

**Code (Kotlin)**:

```kotlin
// Enable scheduling
@SpringBootApplication
// => Combines @Configuration, @EnableAutoConfiguration, @ComponentScan
@EnableScheduling  // Enable @Scheduled annotation
// => Annotation applied
open class Application
// => Class declaration

fun main(args: Array<String>) {
// => Function declaration
  runApplication<Application>(*args)
}

// Scheduled tasks
@Component
// => Spring-managed component bean
class ScheduledTasks {
// => Class declaration
  // Fixed rate: Executes every 5 seconds (from start of previous execution)
  @Scheduled(fixedRate = 5000)
  // => Scheduled task execution
  fun reportCurrentTime() {
  // => Function declaration
    println("Current time: ${LocalDateTime.now()}")
    // => Output: see string template value above
    // If task takes 2 seconds, next execution starts at: 0s, 5s, 10s, 15s...
  }

  // Fixed delay: Waits 5 seconds AFTER previous execution finishes
  @Scheduled(fixedDelay = 5000)
  // => Scheduled task execution
  fun processQueueWithDelay() {
  // => Function declaration
    println("Processing queue at ${LocalDateTime.now()}")
    // => Output: see string template value above
    Thread.sleep(3000)
    // Next execution starts 5 seconds after this finishes
    // Execution pattern: 0s, 8s, 16s, 24s... (3s task + 5s delay)
  }

  // Initial delay: Wait 10 seconds before first execution
  @Scheduled(initialDelay = 10000, fixedRate = 5000)
  // => Scheduled task execution
  fun delayedStart() {
  // => Function declaration
    println("Delayed task executed")
    // => Output: see string template value above
    // First execution at 10s, then every 5s: 10s, 15s, 20s...
  }

  // Cron expression: Every day at 2:00 AM
  @Scheduled(cron = "0 0 2 * * ?")
  // => Scheduled task execution
  fun dailyBackup() {
  // => Function declaration
    println("Running daily backup at ${LocalDateTime.now()}")
    // => Output: see string template value above
  }

  // Cron: Every weekday at 9:00 AM
  @Scheduled(cron = "0 0 9 ? * MON-FRI")
  // => Scheduled task execution
  fun weekdayReport() {
  // => Function declaration
    println("Weekday report generated")
    // => Output: see string template value above
  }

  // Cron: Every 15 minutes
  @Scheduled(cron = "0 */15 * * * ?")
  // => Scheduled task execution
  fun quarterHourlyCheck() {
  // => Function declaration
    println("15-minute check at ${LocalDateTime.now()}")
    // => Output: see string template value above
    // Runs at: 00:00, 00:15, 00:30, 00:45, 01:00, 01:15...
  }

  // Cron from configuration
  @Scheduled(cron = "\${app.cleanup.schedule}")  // Read from application.properties
  // => Scheduled task execution
  fun configurableSchedule() {
  // => Function declaration
    println("Cleanup task running")
    // => Output: see string template value above
  }
}

// Cron format: second minute hour day-of-month month day-of-week
// Examples:
// "0 0 * * * ?" - Every hour
// "0 30 9 * * ?" - 9:30 AM daily
// "0 0 12 1 * ?" - 12:00 PM on 1st day of month

// Kotlin-specific: Use string templates in println, escape $ in property placeholder with \$
// Alternative with Kotlin Coroutines for cancellable scheduled tasks:
// @OptIn(DelicateCoroutinesApi::class)
// GlobalScope.launch {
//   while(isActive) {
//     println("Coroutine task: ${LocalDateTime.now()}")
//     delay(5000)  // Non-blocking delay
//   }
// }
```

**Key Takeaway**: Use `fixedRate` for periodic tasks, `fixedDelay` to prevent overlap, `cron` for specific times—Spring handles scheduling automatically.

**Why It Matters**: Scheduled tasks automate maintenance operations (cleanup, backups, report generation) that would require manual intervention, reducing operational overhead and human error. However, @Scheduled without distributed locking causes duplicate execution in multi-instance deployments where all instances run the same scheduled method—production systems use ShedLock to ensure only one instance executes each task, preventing duplicate payments or duplicate email sends that frustrate customers and waste resources.

---

## Group 6: Web Patterns & Advanced Controllers

### Example 41: WebSocket - Real-Time Communication

WebSocket enables bidirectional, real-time communication between server and clients for chat, notifications, and live updates.

```java
// pom.xml: spring-boot-starter-websocket

@Configuration
// => Spring configuration class - defines bean factory methods
// => Annotation applied
@EnableWebSocketMessageBroker
// => Annotation applied
// => Annotation applied
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
// => Class definition begins
    // => Begins block
    @Override
    // => Overrides inherited method from parent class/interface
    // => Annotation applied
    public void configureMessageBroker(MessageBrokerRegistry config) {
    // => Method definition
    // => Begins block
        config.enableSimpleBroker("/topic", "/queue"); // => Broadcast and P2P channels
        // => Assigns > Broadcast and P2P channels to //
        config.setApplicationDestinationPrefixes("/app");
    // => Executes method
    }
    // => Block delimiter

    @Override
    // => Overrides inherited method from parent class/interface
    // => Annotation applied
    public void registerStompEndpoints(StompEndpointRegistry registry) {
    // => Method definition
    // => Begins block
        registry.addEndpoint("/ws")
    // => Executes method
            .setAllowedOrigins("http://localhost:3000")
    // => Executes method
            .withSockJS(); // => Fallback for browsers without WebSocket
            // => Assigns > Fallback for browsers without WebSocket to //
    }
    // => Block delimiter
}
// => Block delimiter

@Controller
// => Annotation applied
// => Annotation applied
public class ChatController {
// => Class definition begins
    // => Begins block
    @MessageMapping("/chat.send") // Client sends to /app/chat.send
    // => Annotation applied
    // => Executes method
    @SendTo("/topic/messages") // Broadcast to all subscribers of /topic/messages
    // => Annotation applied
    // => Executes method
    public ChatMessage sendMessage(ChatMessage message) {
    // => Method definition
    // => Begins block
        message.setTimestamp(LocalDateTime.now());
    // => Executes method
        return message; // => Broadcasts to all connected clients
        // => Assigns > Broadcasts to all connected clients to //
    }

    @MessageMapping("/chat.private")
    // => Annotation applied
    // => Executes method
    @SendToUser("/queue/private") // Send to specific user's queue
    // => Annotation applied
    // => Executes method
    public ChatMessage sendPrivateMessage(ChatMessage message, Principal principal) {
    // => Method definition
    // => Begins block
        message.setRecipient(principal.getName());
    // => Executes method
        return message; // => Only recipient receives this
        // => Assigns > Only recipient receives this to //
    }
}

record ChatMessage(String sender, String content, String recipient, LocalDateTime timestamp) {}
    // => Executes method
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts: implementation("org.springframework.boot:spring-boot-starter-websocket")

@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
@EnableWebSocketMessageBroker
// => Annotation applied
// => Annotation applied
open class WebSocketConfig : WebSocketMessageBrokerConfigurer {
// => Class declaration
// => Class declaration
  override fun configureMessageBroker(config: MessageBrokerRegistry) {
  // => Function definition
  // => Overrides parent class/interface method
    config.enableSimpleBroker("/topic", "/queue")  // => Broadcast and P2P channels
    config.setApplicationDestinationPrefixes("/app")
  }

  override fun registerStompEndpoints(registry: StompEndpointRegistry) {
  // => Function definition
  // => Overrides parent class/interface method
    registry.addEndpoint("/ws")
      .setAllowedOrigins("http://localhost:3000")
      .withSockJS()  // => Fallback for browsers without WebSocket
  }
}

@Controller
// => Annotation applied
// => Annotation applied
class ChatController {
// => Class declaration
// => Class declaration
  @MessageMapping("/chat.send")  // Client sends to /app/chat.send
  // => Annotation applied
  // => Annotation applied
  @SendTo("/topic/messages")  // Broadcast to all subscribers of /topic/messages
  // => Annotation applied
  // => Annotation applied
  fun sendMessage(message: ChatMessage): ChatMessage {
  // => Function definition
  // => Function declaration
    return message.copy(timestamp = LocalDateTime.now())
    // => Returns to caller
    // => Returns value to caller
    // => Broadcasts to all connected clients
  }

  @MessageMapping("/chat.private")
  // => Annotation applied
  // => Annotation applied
  @SendToUser("/queue/private")  // Send to specific user's queue
  // => Annotation applied
  // => Annotation applied
  fun sendPrivateMessage(message: ChatMessage, principal: Principal): ChatMessage {
  // => Function definition
  // => Function declaration
    return message.copy(recipient = principal.name)
    // => Returns to caller
    // => Returns value to caller
    // => Only recipient receives this
  }
}

data class ChatMessage(
// => Data class: auto-generates equals/hashCode/toString/copy
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  val sender: String,
  // => Immutable property
  val content: String,
  // => Immutable property
  val recipient: String? = null,
  // => Immutable property
  // => Immutable binding (read-only reference)
  val timestamp: LocalDateTime? = null
  // => Immutable property
  // => Immutable binding (read-only reference)
)

// Kotlin-specific: Use data class with default parameters instead of Java record
// Alternative with sealed class for message types:
// sealed class ChatMessage
// data class BroadcastMessage(val sender: String, val content: String, val timestamp: LocalDateTime) : ChatMessage()
// data class PrivateMessage(val sender: String, val recipient: String, val content: String) : ChatMessage()
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant C1 as Client 1
    participant S as Spring Server
    participant C2 as Client 2

    C1->>S: Connect /ws (WebSocket handshake)
    C2->>S: Connect /ws (WebSocket handshake)
    C1->>S: Subscribe /topic/messages
    C2->>S: Subscribe /topic/messages

    C1->>S: Send /app/chat.send {"sender":"Alice","content":"Hello"}
    S->>C1: Broadcast /topic/messages
    S->>C2: Broadcast /topic/messages

    Note over C1,C2: Both clients receive message in real-time

```

**Key Takeaway**: WebSocket enables real-time bidirectional communication—use `@MessageMapping` for client messages, `@SendTo` for broadcast to all subscribers, and `@SendToUser` for user-specific messages.

**Why It Matters**: Spring's declarative transaction management prevents data corruption from partial failures—without @Transactional, a bank transfer could debit one account but crash before crediting another, creating phantom money. Production financial systems rely on transaction boundaries to ensure ACID guarantees, automatically rolling back all database changes when exceptions occur, eliminating error-prone manual rollback code that causes financial discrepancies in non-transactional systems.

---

### Example 42: Server-Sent Events (SSE) - Unidirectional Streaming

SSE streams server updates to clients over HTTP, simpler than WebSocket for one-way communication.

```java
@RestController
// => Annotation applied
@RequestMapping("/api/sse")
    // => Executes method
public class SseController {
    // => Begins block
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    // => Annotation applied
    public Flux<ServerSentEvent<String>> streamEvents() {
    // => Begins block
        return Flux.interval(Duration.ofSeconds(1))
    // => Returns value to caller
            .map(seq -> ServerSentEvent.<String>builder()
    // => Executes method
                .id(String.valueOf(seq))
    // => Executes method
                .event("message")
    // => Executes method
                .data("Server time: " + LocalDateTime.now())
    // => Executes method
                .build()
    // => Executes method
            );
        // => Sends event every second: data: Server time: 2024-12-24T10:00:00
    }
    // => Block delimiter

    @GetMapping(value = "/stock-prices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    // => Annotation applied
    public Flux<ServerSentEvent<StockPrice>> streamStockPrices() {
    // => Begins block
        return Flux.interval(Duration.ofSeconds(2))
    // => Returns value to caller
            .map(i -> ServerSentEvent.<StockPrice>builder()
    // => Executes method
                .data(new StockPrice("AAPL", 150.0 + Math.random() * 10))
    // => Executes method
                .build()
    // => Executes method
            );
        // => Streams stock updates every 2 seconds
    }
    // => Block delimiter
}
// => Block delimiter

record StockPrice(String symbol, double price) {}
    // => Executes method
```

**Code (Kotlin)**:

```kotlin
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/sse")
// => HTTP endpoint mapping
class SseController {
// => Class declaration
  @GetMapping(value = ["/stream"], produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
  // => HTTP endpoint mapping
  fun streamEvents(): Flux<ServerSentEvent<String>> {
  // => Function declaration
    return Flux.interval(Duration.ofSeconds(1))
    // => Returns value to caller
      .map { seq ->
        ServerSentEvent.builder<String>()
          .id(seq.toString())
          .event("message")
          .data("Server time: ${LocalDateTime.now()}")
          .build()
      }
    // => Sends event every second: data: Server time: 2024-12-24T10:00:00
  }

  @GetMapping(value = ["/stock-prices"], produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
  // => HTTP endpoint mapping
  fun streamStockPrices(): Flux<ServerSentEvent<StockPrice>> {
  // => Function declaration
    return Flux.interval(Duration.ofSeconds(2))
    // => Returns value to caller
      .map {
      // => Block begins
        ServerSentEvent.builder<StockPrice>()
          .data(StockPrice("AAPL", 150.0 + Math.random() * 10))
          .build()
      }
    // => Streams stock updates every 2 seconds
  }
}

data class StockPrice(val symbol: String, val price: Double)
// => Data class: auto-generates equals/hashCode/toString/copy/componentN

// Kotlin-specific: Use data class instead of record, string templates in data content
// Alternative with Kotlin Flow (more idiomatic than Reactor):
// @GetMapping("/stream-flow", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
// fun streamEventsFlow(): Flow<ServerSentEvent<String>> = flow {
//   var seq = 0L
//   while(true) {
//     emit(ServerSentEvent.builder<String>()
//       .id((seq++).toString())
//       .data("Server time: ${LocalDateTime.now()}")
//       .build())
//     delay(1000)
//   }
// }
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    Server[Spring Server] -->|SSE Stream| C1[Client 1]
    Server -->|SSE Stream| C2[Client 2]
    Server -->|SSE Stream| C3[Client 3]

    Note1[data: event 1] --> Server
    Note2[data: event 2] --> Server
    Note3[data: event 3] --> Server

    style Server fill:#0173B2,color:#fff
    style C1 fill:#029E73,color:#fff
    style C2 fill:#DE8F05,color:#fff
    style C3 fill:#CC78BC,color:#fff
```

**Key Takeaway**: SSE provides unidirectional server-to-client streaming over HTTP—simpler than WebSocket for use cases like live dashboards, notifications, and progress updates where bidirectional communication isn't needed.

**Why It Matters**: Isolation levels balance consistency against concurrency—SERIALIZABLE prevents all concurrency anomalies but reduces throughput to single-threaded performance, while READ_COMMITTED allows higher concurrency but risks non-repeatable reads. Production databases use READ_COMMITTED by default (PostgreSQL, Oracle) to achieve 80% of SERIALIZABLE safety at 300% higher throughput, reserving REPEATABLE_READ for financial transactions where accuracy outweighs performance.

---

### Example 43: API Versioning Strategies

Manage API evolution while maintaining backward compatibility through URL, header, or parameter versioning.

```java
// Strategy 1: URL Path Versioning
@RestController
// => Annotation applied
@RequestMapping("/api/v1/users")
    // => Executes method
public class UserV1Controller {
    // => Begins block
    @GetMapping("/{id}")
    // => Executes method
    public UserV1 getUser(@PathVariable Long id) {
    // => Begins block
        return new UserV1(id, "Alice", "alice@example.com");
    // => Returns value to caller
        // => /api/v1/users/1 returns version 1 format
    }
    // => Block delimiter
}
// => Block delimiter

@RestController
// => Annotation applied
@RequestMapping("/api/v2/users")
    // => Executes method
public class UserV2Controller {
    // => Begins block
    @GetMapping("/{id}")
    // => Executes method
    public UserV2 getUser(@PathVariable Long id) {
    // => Begins block
        return new UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890");
    // => Returns value to caller
        // => /api/v2/users/1 returns version 2 format (added lastName, phone)
    }
    // => Block delimiter
}
// => Block delimiter

record UserV1(Long id, String name, String email) {}
    // => Executes method
record UserV2(Long id, String firstName, String lastName, String email, String phone) {}
    // => Executes method

// Strategy 2: Header Versioning
@RestController
// => Annotation applied
@RequestMapping("/api/users")
    // => Executes method
public class UserHeaderVersionController {
    // => Begins block
    @GetMapping(value = "/{id}", headers = "X-API-Version=1")
    // => Annotation applied
    public UserV1 getUserV1(@PathVariable Long id) {
    // => Begins block
        return new UserV1(id, "Alice", "alice@example.com");
    // => Returns value to caller
        // => Header: X-API-Version: 1
    }
    // => Block delimiter

    @GetMapping(value = "/{id}", headers = "X-API-Version=2")
    // => Annotation applied
    public UserV2 getUserV2(@PathVariable Long id) {
    // => Begins block
        return new UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890");
    // => Returns value to caller
        // => Header: X-API-Version: 2
    }
    // => Block delimiter
}
// => Block delimiter

// Strategy 3: Content Negotiation (Accept Header)
@RestController
// => Annotation applied
@RequestMapping("/api/users")
    // => Executes method
public class UserContentNegotiationController {
    // => Begins block
    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v1+json")
    // => Annotation applied
    public UserV1 getUserV1(@PathVariable Long id) {
    // => Begins block
        return new UserV1(id, "Alice", "alice@example.com");
    // => Returns value to caller
        // => Header: Accept: application/vnd.myapp.v1+json
    }
    // => Block delimiter

    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v2+json")
    public UserV2 getUserV2(@PathVariable Long id) {
    // => Begins block
        return new UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890");
    // => Returns value to caller
        // => Header: Accept: application/vnd.myapp.v2+json
    }
}

// Strategy 4: Request Parameter Versioning
@RestController
@RequestMapping("/api/users")
    // => Executes method
public class UserParamVersionController {
    // => Begins block
    @GetMapping("/{id}")
    // => Executes method
    public Object getUser(@PathVariable Long id, @RequestParam(defaultValue = "1") int version) {
    // => Assigns value to variable
        if (version == 2) {
    // => Executes method
            return new UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890");
    // => Returns value to caller
        }
        return new UserV1(id, "Alice", "alice@example.com");
    // => Returns value to caller
        // => /api/users/1?version=2
    }
}
```

**Code (Kotlin)**:

```kotlin
// Strategy 1: URL Path Versioning
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/v1/users")
// => HTTP endpoint mapping
class UserV1Controller {
// => Class declaration
  @GetMapping("/{id}")
  // => HTTP endpoint mapping
  fun getUser(@PathVariable id: Long): UserV1 {
  // => Function declaration
    return UserV1(id, "Alice", "alice@example.com")
    // => Returns value to caller
    // => /api/v1/users/1 returns version 1 format
  }
}

@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/v2/users")
// => HTTP endpoint mapping
class UserV2Controller {
// => Class declaration
  @GetMapping("/{id}")
  // => HTTP endpoint mapping
  fun getUser(@PathVariable id: Long): UserV2 {
  // => Function declaration
    return UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890")
    // => Returns value to caller
    // => /api/v2/users/1 returns version 2 format (added lastName, phone)
  }
}

data class UserV1(val id: Long, val name: String, val email: String)
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
data class UserV2(val id: Long, val firstName: String, val lastName: String, val email: String, val phone: String)
// => Data class: auto-generates equals/hashCode/toString/copy/componentN

// Strategy 2: Header Versioning
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/users")
// => HTTP endpoint mapping
class UserHeaderVersionController {
// => Class declaration
  @GetMapping(value = ["/{id}"], headers = ["X-API-Version=1"])
  // => HTTP endpoint mapping
  fun getUserV1(@PathVariable id: Long): UserV1 {
  // => Function declaration
    return UserV1(id, "Alice", "alice@example.com")
    // => Returns value to caller
    // => Header: X-API-Version: 1
  }

  @GetMapping(value = ["/{id}"], headers = ["X-API-Version=2"])
  // => HTTP endpoint mapping
  fun getUserV2(@PathVariable id: Long): UserV2 {
  // => Function declaration
    return UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890")
    // => Returns value to caller
    // => Header: X-API-Version: 2
  }
}

// Strategy 3: Content Negotiation (Accept Header)
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/users")
// => HTTP endpoint mapping
class UserContentNegotiationController {
// => Class declaration
  @GetMapping(value = ["/{id}"], produces = ["application/vnd.myapp.v1+json"])
  // => HTTP endpoint mapping
  fun getUserV1(@PathVariable id: Long): UserV1 {
  // => Function declaration
    return UserV1(id, "Alice", "alice@example.com")
    // => Returns value to caller
    // => Header: Accept: application/vnd.myapp.v1+json
  }

  @GetMapping(value = ["/{id}"], produces = ["application/vnd.myapp.v2+json"])
  // => HTTP endpoint mapping
  fun getUserV2(@PathVariable id: Long): UserV2 {
  // => Function declaration
    return UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890")
    // => Returns value to caller
    // => Header: Accept: application/vnd.myapp.v2+json
  }
}

// Strategy 4: Request Parameter Versioning
@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/users")
// => HTTP endpoint mapping
class UserParamVersionController {
// => Class declaration
  @GetMapping("/{id}")
  // => HTTP endpoint mapping
  fun getUser(@PathVariable id: Long, @RequestParam(defaultValue = "1") version: Int): Any {
  // => Function declaration
    return when (version) {
    // => Returns value to caller
      2 -> UserV2(id, "Alice", "Smith", "alice@example.com", "123-456-7890")
      else -> UserV1(id, "Alice", "alice@example.com")
    }
    // => /api/users/1?version=2
  }
}

// Kotlin-specific: Use when expression instead of if-else chain, data classes for DTOs
// Alternative with sealed classes for type-safe versioning:
// sealed class UserResponse
// data class UserV1Response(val id: Long, val name: String, val email: String) : UserResponse()
// data class UserV2Response(val id: Long, val firstName: String, val lastName: String,
//                           val email: String, val phone: String) : UserResponse()
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Client[API Client] --> V1[/api/v1/users]
    Client --> V2[/api/v2/users]

    V1 --> R1["UserV1<br/>{id, name, email}"]
    V2 --> R2["UserV2<br/>{id, firstName, lastName,<br/>email, phone}"]

    Note1["URL Versioning<br/>Most visible"] --> V1
    Note2["Backward Compatible<br/>New fields added"] --> V2

    style Client fill:#0173B2,color:#fff
    style V1 fill:#029E73,color:#fff
    style V2 fill:#DE8F05,color:#fff
    style R1 fill:#CC78BC,color:#fff
    style R2 fill:#CA9161,color:#fff
```

**Key Takeaway**: Choose versioning strategy based on client capabilities—URL versioning is most visible and cacheable, header versioning keeps URLs clean, content negotiation follows REST standards, and parameter versioning is simplest for internal APIs.

**Why It Matters**: Optimistic locking enables high-concurrency updates without pessimistic database locks that block other transactions—version numbers detect conflicting updates at commit time instead of blocking readers during writes. E-commerce platforms use optimistic locking for shopping carts where 99% of updates succeed without conflicts, achieving 10x higher throughput than pessimistic locking while preventing lost updates when two users simultaneously buy the last item, with retry logic handling the rare 1% of conflicts gracefully.

---

### Example 44: Custom Argument Resolvers

Create custom argument resolvers to extract and inject domain objects from requests.

```java
// Custom annotation
@Target(ElementType.PARAMETER)
    // => Executes method
@Retention(RetentionPolicy.RUNTIME)
    // => Executes method
public @interface CurrentUser {}
    // => Begins block

// Argument resolver
@Component
// => Annotation applied
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
    // => Begins block
    @Override
    // => Annotation applied
    public boolean supportsParameter(MethodParameter parameter) {
    // => Begins block
        return parameter.hasParameterAnnotation(CurrentUser.class)
    // => Returns value to caller
            && parameter.getParameterType().equals(User.class);
    // => Executes method
        // => Activates when @CurrentUser User parameter detected
    }
    // => Block delimiter

    @Override
    // => Annotation applied
    public Object resolveArgument(
    // => Code line
        MethodParameter parameter,
        // => Code line
        ModelAndViewContainer mavContainer,
        // => Code line
        NativeWebRequest webRequest,
        // => Code line
        WebDataBinderFactory binderFactory
        // => Code line
    ) {
    // => Begins block
        String authHeader = webRequest.getHeader("Authorization");
    // => Assigns value to variable
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
    // => Executes method
            String token = authHeader.substring(7);
    // => Assigns value to variable
            return extractUserFromToken(token);
    // => Returns value to caller
            // => Extracts user from JWT token
        }
        // => Block delimiter
        return null;
    // => Returns result
    }
    // => Block delimiter

    private User extractUserFromToken(String token) {
    // => Begins block
        return new User(1L, "alice", "alice@example.com");
    // => Returns value to caller
        // => Simplified token parsing
    }
    // => Block delimiter
}
// => Block delimiter

// Register resolver
@Configuration
// => Annotation applied
public class WebConfig implements WebMvcConfigurer {
    // => Begins block
    @Autowired
    // => Annotation applied
    private CurrentUserArgumentResolver currentUserArgumentResolver;
    // => Declares currentUserArgumentResolver field of type CurrentUserArgumentResolver

    @Override
    // => Annotation applied
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    // => Begins block
        resolvers.add(currentUserArgumentResolver);
    // => Executes method
    }
    // => Block delimiter
}
// => Block delimiter

// Usage in controller
@RestController
// => Annotation applied
@RequestMapping("/api/profile")
    // => Executes method
public class ProfileController {
    // => Begins block
    @GetMapping
    // => Annotation applied
    public User getProfile(@CurrentUser User user) {
    // => Begins block
        // user automatically resolved from JWT token
        return user; // => No need to manually parse Authorization header
        // => Assigns > No need to manually parse Authorization header to //
    }
    // => Block delimiter

    @PutMapping
    public User updateProfile(@CurrentUser User user, @RequestBody ProfileUpdate update) {
    // => Begins block
        // Both user and request body available
        return user;
    // => Returns result
    }
}

record User(Long id, String username, String email) {}
    // => Executes method
record ProfileUpdate(String email, String phone) {}
    // => Executes method
```

**Code (Kotlin)**:

```kotlin
// Custom annotation
@Target(AnnotationTarget.VALUE_PARAMETER)
// => Annotation applied
// => Annotation applied
@Retention(AnnotationRetention.RUNTIME)
// => Annotation applied
// => Annotation applied
annotation class CurrentUser
// => Class declaration

// Argument resolver
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class CurrentUserArgumentResolver : HandlerMethodArgumentResolver {
// => Class declaration
// => Class declaration
  override fun supportsParameter(parameter: MethodParameter): Boolean {
  // => Function definition
  // => Overrides parent class/interface method
    return parameter.hasParameterAnnotation(CurrentUser::class.java) &&
    // => Returns to caller
    // => Returns value to caller
           parameter.parameterType == User::class.java
           // => Assignment
    // => Activates when @CurrentUser User parameter detected
  }

  override fun resolveArgument(
  // => Function definition
  // => Overrides parent class/interface method
    parameter: MethodParameter,
    // => Statement
    mavContainer: ModelAndViewContainer?,
    // => Statement
    webRequest: NativeWebRequest,
    // => Statement
    binderFactory: WebDataBinderFactory?
  ): Any? {
  // => Block begins
    val authHeader = webRequest.getHeader("Authorization")
    // => Immutable property
    // => Immutable binding (read-only reference)
    return authHeader?.takeIf { it.startsWith("Bearer ") }
    // => Returns to caller
    // => Returns value to caller
      ?.substring(7)
      ?.let { extractUserFromToken(it) }
    // => Extracts user from JWT token using safe call chains
  }

  private fun extractUserFromToken(token: String): User {
  // => Function definition
  // => Function declaration
    return User(1L, "alice", "alice@example.com")
    // => Returns to caller
    // => Returns value to caller
    // => Simplified token parsing
  }
}

// Register resolver
@Configuration
// => Configuration class - contains @Bean methods
// => Marks class as Spring configuration (bean factory)
class WebConfig(
// => Class declaration
// => Class declaration
  private val currentUserArgumentResolver: CurrentUserArgumentResolver
  // => Immutable property
  // => Private class member
) : WebMvcConfigurer {
// => Block begins
  override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
  // => Function definition
  // => Overrides parent class/interface method
    resolvers.add(currentUserArgumentResolver)
  }
}

// Usage in controller
@RestController
// => REST controller - returns JSON directly
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/profile")
// => Base URL path for all endpoints in class
// => HTTP endpoint mapping
class ProfileController {
// => Class declaration
// => Class declaration
  @GetMapping
  // => HTTP GET endpoint
  // => HTTP endpoint mapping
  fun getProfile(@CurrentUser user: User): User {
  // => Function definition
  // => Function declaration
    // user automatically resolved from JWT token
    return user  // => No need to manually parse Authorization header
  }

  @PutMapping
  // => HTTP PUT endpoint
  // => HTTP endpoint mapping
  fun updateProfile(@CurrentUser user: User, @RequestBody update: ProfileUpdate): User {
  // => Function definition
  // => Function declaration
    // Both user and request body available
    return user
    // => Returns to caller
    // => Returns value to caller
  }
}

data class User(val id: Long, val username: String, val email: String)
// => Data class: auto-generates equals/hashCode/toString/copy
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
data class ProfileUpdate(val email: String, val phone: String)
// => Data class: auto-generates equals/hashCode/toString/copy
// => Data class: auto-generates equals/hashCode/toString/copy/componentN

// Kotlin-specific: Use safe call operators (?., ?:) and scope functions for null-safe extraction
// Alternative with extension function:
// fun NativeWebRequest.extractBearerToken(): String? =
//   getHeader("Authorization")?.takeIf { it.startsWith("Bearer ") }?.substring(7)
```

**Key Takeaway**: Custom argument resolvers eliminate repetitive parameter extraction—implement `HandlerMethodArgumentResolver` to automatically inject domain objects from headers, cookies, or custom authentication mechanisms.

**Why It Matters**: Batch operations reduce database roundtrips significantly (for example, from 1000 individual INSERTs to 20 batched operations with 50 items per batch)—critical for ETL jobs processing large datasets. Production data pipelines use batch updates with manual flush/clear to import large volumes of data without exhausting memory, while JPQL bulk updates execute single SQL statements that modify many rows without loading entities into memory.

---

### Example 45: Filter vs Interceptor vs AOP

Understand the differences and use cases for filters, interceptors, and AOP for cross-cutting concerns.

```java
// 1. Servlet Filter - Operates at servlet container level
@Component
// => Annotation applied
@Order(1)
    // => Executes method
public class RequestResponseLoggingFilter implements Filter {
    // => Begins block
    @Override
    // => Annotation applied
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
    // => Executes method call
        throws IOException, ServletException {
    // => Begins block
        HttpServletRequest req = (HttpServletRequest) request;
        // => Calls ()
        // => Stores result in req
        System.out.println("FILTER: Before request - " + req.getRequestURI());
    // => Prints to console
        // => Executes before DispatcherServlet

        chain.doFilter(request, response); // => Continue filter chain (with or without authentication)
        // => Assigns > Continue filter chain (with or without authentication) to //

        System.out.println("FILTER: After response");
    // => Prints to console
        // => Executes after response sent
    }
    // => Block delimiter
}
// => Block delimiter

// 2. HandlerInterceptor - Operates at Spring MVC level
@Component
// => Annotation applied
public class PerformanceInterceptor implements HandlerInterceptor {
    // => Begins block
    @Override
    // => Annotation applied
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    // => Begins block
        request.setAttribute("startTime", System.currentTimeMillis());
    // => Executes method
        System.out.println("INTERCEPTOR: Before controller method");
    // => Prints to console
        return true;
    // => Returns result
        // => Executes after DispatcherServlet, before controller
    }
    // => Block delimiter

    @Override
    // => Annotation applied
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
    // => Code line
                          Object handler, ModelAndView modelAndView) {
    // => Begins block
        System.out.println("INTERCEPTOR: After controller method, before view");
    // => Prints to console
        // => Executes after controller, only if no exception
    }
    // => Block delimiter

    @Override
    // => Annotation applied
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                               Object handler, Exception ex) {
    // => Begins block
        long duration = System.currentTimeMillis() - (Long) request.getAttribute("startTime");
    // => Assigns value to variable
        System.out.println("INTERCEPTOR: Request completed in " + duration + "ms");
    // => Prints to console
        // => Always executes, even if exception occurred
    }
}

// 3. AOP Aspect - Operates at method level
@Aspect
@Component
public class LoggingAspect {
    // => Begins block
    @Before("execution(* com.example.demo.service.*.*(..))")
    // => Executes method
    public void logBefore(JoinPoint joinPoint) {
    // => Begins block
        System.out.println("AOP: Before method - " + joinPoint.getSignature().getName());
    // => Prints to console
        // => Executes before any service method
    }

    @AfterReturning(pointcut = "execution(* com.example.demo.service.*.*(..))", returning = "result")
    // => Assigns value to variable
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
    // => Begins block
        System.out.println("AOP: Method returned - " + result);
    // => Prints to console
        // => Executes after successful method execution
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    // => Executes method
    public Object logTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
    // => Begins block
        System.out.println("AOP: Transaction starting");
    // => Prints to console
        Object result = joinPoint.proceed();
    // => Assigns value to variable
        System.out.println("AOP: Transaction completed");
    // => Prints to console
        return result;
    // => Returns result
        // => Wraps @Transactional methods
    }
}
```

**Code (Kotlin)**:

```kotlin
// 1. Servlet Filter - Operates at servlet container level
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
@Order(1)
// => Annotation applied
// => Annotation applied
class RequestResponseLoggingFilter : Filter {
// => Class declaration
// => Class declaration
  override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
  // => Function definition
  // => Overrides parent class/interface method
    val req = request as HttpServletRequest
    // => Immutable property
    // => Immutable binding (read-only reference)
    println("FILTER: Before request - ${req.requestURI}")
    // => Output: see string template value above
    // => Executes before DispatcherServlet

    chain.doFilter(request, response)  // => Continue filter chain (with or without authentication)

    println("FILTER: After response")
    // => Output: see string template value above
    // => Executes after response sent
  }
}

// 2. HandlerInterceptor - Operates at Spring MVC level
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class PerformanceInterceptor : HandlerInterceptor {
// => Class declaration
// => Class declaration
  override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
  // => Function definition
  // => Overrides parent class/interface method
    request.setAttribute("startTime", System.currentTimeMillis())
    println("INTERCEPTOR: Before controller method")
    // => Output: see string template value above
    return true
    // => Returns to caller
    // => Returns value to caller
    // => Executes after DispatcherServlet, before controller
  }

  override fun postHandle(
  // => Function definition
  // => Overrides parent class/interface method
    request: HttpServletRequest,
    // => Statement
    response: HttpServletResponse,
    // => Statement
    handler: Any,
    // => Statement
    modelAndView: ModelAndView?
  ) {
  // => Block begins
    println("INTERCEPTOR: After controller method, before view")
    // => Output: see string template value above
    // => Executes after controller, only if no exception
  }

  override fun afterCompletion(
  // => Function definition
  // => Overrides parent class/interface method
    request: HttpServletRequest,
    // => Statement
    response: HttpServletResponse,
    // => Statement
    handler: Any,
    // => Statement
    ex: Exception?
  ) {
  // => Block begins
    val duration = System.currentTimeMillis() - (request.getAttribute("startTime") as Long)
    // => Immutable property
    // => Immutable binding (read-only reference)
    println("INTERCEPTOR: Request completed in ${duration}ms")
    // => Output: see string template value above
    // => Always executes, even if exception occurred
  }
}

// 3. AOP Aspect - Operates at method level
@Aspect
// => Annotation applied
// => Annotation applied
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class LoggingAspect {
// => Class declaration
// => Class declaration
  @Before("execution(* com.example.demo.service.*.*(..))")
  // => Annotation applied
  // => Annotation applied
  fun logBefore(joinPoint: JoinPoint) {
  // => Function definition
  // => Function declaration
    println("AOP: Before method - ${joinPoint.signature.name}")
    // => Output: see string template value above
    // => Executes before any service method
  }

  @AfterReturning(pointcut = "execution(* com.example.demo.service.*.*(..))", returning = "result")
  // => Annotation applied
  // => Annotation applied
  fun logAfterReturning(joinPoint: JoinPoint, result: Any?) {
  // => Function definition
  // => Function declaration
    println("AOP: Method returned - $result")
    // => Output: see string template value above
    // => Executes after successful method execution
  }

  @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
  // => Annotation applied
  // => Annotation applied
  fun logTransaction(joinPoint: ProceedingJoinPoint): Any? {
  // => Function definition
  // => Function declaration
    println("AOP: Transaction starting")
    // => Output: see string template value above
    val result = joinPoint.proceed()
    // => Immutable property
    // => Immutable binding (read-only reference)
    println("AOP: Transaction completed")
    // => Output: see string template value above
    return result
    // => Returns to caller
    // => Returns value to caller
    // => Wraps @Transactional methods
  }
}

// Kotlin-specific: Use string templates, safe cast (as?), nullable types (Any?, Exception?)
// Alternative with inline reified functions for type-safe getAttribute:
// inline fun <reified T> HttpServletRequest.getTypedAttribute(name: String): T? =
//   getAttribute(name) as? T
// val duration = System.currentTimeMillis() - (request.getTypedAttribute<Long>("startTime") ?: 0L)
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    Request[HTTP Request] --> Filter[Servlet Filter]
    Filter --> DispatcherServlet[DispatcherServlet]
    DispatcherServlet --> InterceptorPre[Interceptor preHandle]
    InterceptorPre --> AOP_Before[AOP @Before]
    AOP_Before --> Controller[Controller Method]
    Controller --> AOP_After[AOP @AfterReturning]
    AOP_After --> InterceptorPost[Interceptor postHandle]
    InterceptorPost --> View[View Rendering]
    View --> InterceptorAfter[Interceptor afterCompletion]
    InterceptorAfter --> FilterAfter[Filter doFilter return]
    FilterAfter --> Response[HTTP Response]

    style Request fill:#0173B2,color:#fff
    style Filter fill:#DE8F05,color:#fff
    style DispatcherServlet fill:#029E73,color:#fff
    style InterceptorPre fill:#CC78BC,color:#fff
    style AOP_Before fill:#CA9161,color:#fff
    style Controller fill:#0173B2,color:#fff
    style Response fill:#029E73,color:#fff
```

**Key Takeaway**: Use **Filters** for servlet-level concerns (encoding, security, CORS), **Interceptors** for Spring MVC concerns (authentication, logging, request/response modification), and **AOP** for business logic concerns (transactions, caching, auditing) targeting specific methods.

**Why It Matters**: Spring Security's auto-configuration prevents 80% of OWASP Top 10 vulnerabilities (CSRF, session fixation, clickjacking) through secure defaults, eliminating manual security code that developers implement incorrectly. However, default form login exposes application structure through /login pages—production systems replace it with JWT or OAuth2 for stateless authentication that scales horizontally without session affinity, enabling load balancers to distribute traffic across instances without sticky sessions.

---

### Example 46: Custom Annotations with AOP

Combine custom annotations with AOP for declarative cross-cutting concerns.

```java
// Custom annotation
@Target(ElementType.METHOD)
    // => Executes method
@Retention(RetentionPolicy.RUNTIME)
    // => Executes method
public @interface LogExecutionTime {}
    // => Begins block

// AOP Aspect
@Aspect
// => Annotation applied
@Component
// => Annotation applied
@Slf4j
// => Annotation applied
public class ExecutionTimeAspect {
    // => Begins block
    @Around("@annotation(LogExecutionTime)")
    // => Executes method
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    // => Begins block
        long start = System.currentTimeMillis();
        // => Calls currentTimeMillis()
        // => Stores result in start

        Object result = joinPoint.proceed(); // => Execute method
        // => Result stored in result

        long duration = System.currentTimeMillis() - start;
        // => Calls currentTimeMillis()
        // => Stores result in duration
        log.info("{} executed in {}ms", joinPoint.getSignature(), duration);
    // => Executes method
        // => Logs: com.example.demo.service.UserService.findUser(..) executed in 45ms

        return result;
    // => Returns result
    }
    // => Block delimiter
}
// => Block delimiter

// Custom audit annotation
@Target(ElementType.METHOD)
    // => Executes method
@Retention(RetentionPolicy.RUNTIME)
    // => Executes method
public @interface Audit {
    // => Begins block
    String action();
    // => Executes method
}
// => Block delimiter

@Aspect
// => Annotation applied
@Component
// => Annotation applied
public class AuditAspect {
    // => Begins block
    @Autowired
    // => Annotation applied
    private AuditLogRepository auditLogRepository;
    // => Declares auditLogRepository field of type AuditLogRepository

    @AfterReturning("@annotation(audit)")
    // => Executes method
    public void logAudit(JoinPoint joinPoint, Audit audit) {
    // => Begins block
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
    // => Assigns value to variable
        String methodName = joinPoint.getSignature().getName();
    // => Assigns value to variable

        AuditLog log = new AuditLog(
    // => Creates new instance
            username,
            // => Code line
            audit.action(),
    // => Executes method
            methodName,
            // => Code line
            LocalDateTime.now()
    // => Executes method
        );
        // => Executes statement
        auditLogRepository.save(log);
    // => Executes method
        // => Automatically logs all audited operations
    }
    // => Block delimiter
}
// => Block delimiter

// Usage in service
@Service
// => Annotation applied
public class UserService {
    // => Begins block
    @LogExecutionTime
    @Audit(action = "USER_CREATED")
    public User createUser(User user) {
    // => Begins block
        // Method automatically timed and audited
        return userRepository.save(user);
    // => Returns value to caller
    }

    @LogExecutionTime
    public List<User> findAll() {
    // => Begins block
        // Only execution time logged (no audit)
        return userRepository.findAll();
    // => Returns value to caller
    }
}
```

**Code (Kotlin)**:

```kotlin
// Custom annotation
@Target(AnnotationTarget.FUNCTION)
// => Annotation applied
@Retention(AnnotationRetention.RUNTIME)
// => Annotation applied
annotation class LogExecutionTime

@Aspect
// => Annotation applied
@Component
// => Spring-managed component bean
class ExecutionTimeAspect {
// => Class declaration
  @Around("@annotation(LogExecutionTime)")
  // => Annotation applied
  fun logExecutionTime(joinPoint: ProceedingJoinPoint): Any? {
  // => Function declaration
    val start = System.currentTimeMillis()
    // => Immutable binding (read-only reference)

    val result = joinPoint.proceed()  // Execute method
    // => Immutable binding (read-only reference)

    val duration = System.currentTimeMillis() - start
    // => Immutable binding (read-only reference)
    println("${joinPoint.signature} executed in ${duration}ms")
    // => Output: see string template value above
    // => Logs: com.example.demo.service.UserService.findUser(..) executed in 45ms

    return result
    // => Returns value to caller
  }
}

// Custom audit annotation
@Target(AnnotationTarget.FUNCTION)
// => Annotation applied
@Retention(AnnotationRetention.RUNTIME)
// => Annotation applied
annotation class Audit(val action: String)

@Aspect
// => Annotation applied
@Component
// => Spring-managed component bean
class AuditAspect(
// => Class declaration
  private val auditLogRepository: AuditLogRepository
  // => Private class member
) {
// => Block begins
  @AfterReturning("@annotation(audit)")
  // => Annotation applied
  fun logAudit(joinPoint: JoinPoint, audit: Audit) {
  // => Function declaration
    val username = SecurityContextHolder.getContext().authentication.name
    // => Immutable binding (read-only reference)
    val methodName = joinPoint.signature.name
    // => Immutable binding (read-only reference)

    val log = AuditLog(
    // => Immutable binding (read-only reference)
      username = username,
      // => Assignment
      action = audit.action,
      // => Assignment
      methodName = methodName,
      // => Assignment
      timestamp = LocalDateTime.now()
      // => Assignment
    )
    auditLogRepository.save(log)
    // => Automatically logs all audited operations
  }
}

// Usage in service
@Service
// => Business logic layer Spring component
open class UserService(
// => Class declaration
  private val userRepository: UserRepository
  // => Private class member
) {
// => Block begins
  @LogExecutionTime
  // => Annotation applied
  @Audit(action = "USER_CREATED")
  // => Annotation applied
  open fun createUser(user: User): User {
  // => Function declaration
    // Method automatically timed and audited
    return userRepository.save(user)
    // => Returns value to caller
  }

  @LogExecutionTime
  // => Annotation applied
  open fun findAll(): List<User> {
  // => Function declaration
    // Only execution time logged (no audit)
    return userRepository.findAll()
    // => Returns value to caller
  }
}

// Kotlin-specific: Use named parameters in data class for audit log, string templates
// Alternative with inline class for action type safety:
// @JvmInline value class AuditAction(val value: String)
// annotation class Audit(val action: AuditAction)
// @Audit(action = AuditAction("USER_CREATED"))
```

**Key Takeaway**: Combine custom annotations with AOP for declarative cross-cutting concerns—create domain-specific annotations (`@LogExecutionTime`, `@Audit`, `@RateLimit`) and implement behavior in aspects for clean, reusable functionality.

**Why It Matters**: Method-level authorization enforces business rules at the code level where they can't be bypassed—URL-level security (`/admin/**`) fails when developers add new endpoints that forget URL patterns, while `@PreAuthorize` prevents access attempts at method invocation. Production SaaS applications use SpEL expressions for tenant isolation (`#order.tenantId == principal.tenantId`) that ensure users can't access other tenants' data even if URL tampering bypasses endpoint security, preventing data leaks that cause compliance violations and customer churn.

---

### Example 47: Bean Post Processors

Modify or enhance beans during initialization with BeanPostProcessor.

```java
// Custom annotation for initialization
@Target(ElementType.TYPE)
    // => Executes method
@Retention(RetentionPolicy.RUNTIME)
    // => Executes method
public @interface InitializeOnStartup {}
    // => Begins block

// Bean post processor
@Component
// => Annotation applied
public class InitializationBeanPostProcessor implements BeanPostProcessor {
    // => Begins block
    @Override
    // => Annotation applied
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
    // => Begins block
        // Called before @PostConstruct
        if (bean.getClass().isAnnotationPresent(InitializeOnStartup.class)) {
    // => Executes method
            System.out.println("Initializing bean: " + beanName);
    // => Prints to console
        }
        // => Block delimiter
        return bean;
    // => Returns result
    }
    // => Block delimiter

    @Override
    // => Annotation applied
    public Object postProcessAfterInitialization(Object bean, String beanName) {
    // => Begins block
        // Called after @PostConstruct
        if (bean instanceof CacheManager) {
    // => Executes method
            System.out.println("CacheManager bean ready: " + beanName);
    // => Prints to console
            ((CacheManager) bean).warmUpCache();
    // => Executes method
            // => Automatically warm up cache after initialization
        }
        // => Block delimiter
        return bean;
    // => Returns result
    }
    // => Block delimiter
}
// => Block delimiter

// Auto-proxy creation example
@Component
// => Annotation applied
public class PerformanceProxyBeanPostProcessor implements BeanPostProcessor {
    // => Begins block
    @Override
    // => Annotation applied
    public Object postProcessAfterInitialization(Object bean, String beanName) {
    // => Begins block
        if (bean.getClass().getPackageName().startsWith("com.example.demo.service")) {
    // => Executes method
            // Wrap service beans in performance monitoring proxy
            return createProxy(bean);
    // => Returns value to caller
        }
        // => Block delimiter
        return bean;
    // => Returns result
    }
    // => Block delimiter

    private Object createProxy(Object target) {
    // => Begins block
        return Proxy.newProxyInstance(
    // => Returns result
            target.getClass().getClassLoader(),
    // => Executes method
            target.getClass().getInterfaces(),
    // => Executes method
            (proxy, method, args) -> {
    // => Executes method
                long start = System.currentTimeMillis();
                // => Calls currentTimeMillis()
                // => Stores result in start
                Object result = method.invoke(target, args);
                // => Calls invoke()
                // => Stores result in result
                long duration = System.currentTimeMillis() - start;
                // => Calls currentTimeMillis()
                // => Stores result in duration
                System.out.println(method.getName() + " took " + duration + "ms");
    // => Prints to console
                return result;
    // => Returns result
            }
            // => Block delimiter
        );
        // => Executes statement
    }
    // => Block delimiter
}
// => Block delimiter

@InitializeOnStartup
// => Annotation applied
@Service
// => Annotation applied
public class DataPreloadService {
    // => Begins block
    @PostConstruct
    public void init() {
    // => Begins block
        System.out.println("Preloading data...");
    // => Prints to console
    }
}
```

**Code (Kotlin)**:

```kotlin
// Custom annotation for initialization
@Target(AnnotationTarget.CLASS)
// => Annotation applied
// => Annotation applied
@Retention(AnnotationRetention.RUNTIME)
// => Annotation applied
// => Annotation applied
annotation class InitializeOnStartup
// => Class declaration

// Bean post processor
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class InitializationBeanPostProcessor : BeanPostProcessor {
// => Class declaration
// => Class declaration
  override fun postProcessBeforeInitialization(bean: Any, beanName: String): Any {
  // => Function definition
  // => Overrides parent class/interface method
    // Called before @PostConstruct
    if (bean::class.java.isAnnotationPresent(InitializeOnStartup::class.java)) {
    // => Block begins
      println("Initializing bean: $beanName")
      // => Output: see string template value above
    }
    return bean
    // => Returns to caller
    // => Returns value to caller
  }

  override fun postProcessAfterInitialization(bean: Any, beanName: String): Any {
  // => Function definition
  // => Overrides parent class/interface method
    // Called after @PostConstruct
    if (bean is CacheManager) {
    // => Block begins
      println("CacheManager bean ready: $beanName")
      // => Output: see string template value above
      bean.warmUpCache()
      // => Automatically warm up cache after initialization
    }
    return bean
    // => Returns to caller
    // => Returns value to caller
  }
}

// Auto-proxy creation example
@Component
// => Spring component - detected by component scan
// => Spring-managed component bean
class PerformanceProxyBeanPostProcessor : BeanPostProcessor {
// => Class declaration
// => Class declaration
  override fun postProcessAfterInitialization(bean: Any, beanName: String): Any {
  // => Function definition
  // => Overrides parent class/interface method
    return if (bean::class.java.packageName.startsWith("com.example.demo.service")) {
    // => Returns to caller
    // => Returns value to caller
      // Wrap service beans in performance monitoring proxy
      createProxy(bean)
    } else {
    // => Block begins
      bean
    }
  }

  private fun createProxy(target: Any): Any {
  // => Function definition
  // => Function declaration
    return Proxy.newProxyInstance(
    // => Returns to caller
    // => Returns value to caller
      target::class.java.classLoader,
      // => Statement
      target::class.java.interfaces
    ) { _, method, args ->
      val start = System.currentTimeMillis()
      // => Immutable property
      // => Immutable binding (read-only reference)
      val result = method.invoke(target, *args.orEmpty())
      // => Immutable property
      // => Immutable binding (read-only reference)
      val duration = System.currentTimeMillis() - start
      // => Immutable property
      // => Immutable binding (read-only reference)
      println("${method.name} took ${duration}ms")
      // => Output: see string template value above
      result
    }
  }
}

@InitializeOnStartup
// => Annotation applied
// => Annotation applied
@Service
// => Business logic service bean
// => Business logic layer Spring component
class DataPreloadService {
// => Class declaration
// => Class declaration
  @PostConstruct
  // => Annotation applied
  // => Annotation applied
  fun init() {
  // => Function definition
  // => Function declaration
    println("Preloading data...")
    // => Output: see string template value above
  }
}

// Kotlin-specific: Use is operator for type checking, spread operator (*) for varargs
// Alternative with extension function:
// fun Any.isInPackage(packagePrefix: String): Boolean =
//   this::class.java.packageName.startsWith(packagePrefix)
// if (bean.isInPackage("com.example.demo.service")) { createProxy(bean) } else { bean }
```

**Key Takeaway**: BeanPostProcessors enable bean customization during initialization—use `postProcessBeforeInitialization` for pre-init configuration and `postProcessAfterInitialization` for auto-proxying, validation, or post-init setup.

**Why It Matters**: JWT enables stateless authentication essential for horizontal scaling—servers don't share session state, so load balancers distribute requests to any instance without session replication overhead. However, JWT tokens can't be revoked before expiration (unlike sessions), requiring short expiration times (15 minutes) with refresh tokens for security, balancing convenience (fewer re-logins) against blast radius (stolen tokens valid until expiration), a trade-off production systems at Auth0 and Okta tune based on threat models.

---

### Example 48: Custom Spring Boot Starter (Simplified)

Create a lightweight auto-configuration module for reusable functionality.

```java
// 1. Create auto-configuration class
@Configuration
// => Annotation applied
@ConditionalOnClass(EmailService.class)
    // => Executes method
@EnableConfigurationProperties(EmailProperties.class)
    // => Executes method
public class EmailAutoConfiguration {
    // => Begins block
    @Bean
    // => Annotation applied
    @ConditionalOnMissingBean
    // => Annotation applied
    public EmailService emailService(EmailProperties properties) {
    // => Begins block
        return new EmailService(properties);
    // => Returns value to caller
    }
    // => Block delimiter
}
// => Block delimiter

// 2. Configuration properties
@ConfigurationProperties(prefix = "app.email")
// => Annotation applied
public class EmailProperties {
    // => Begins block
    private String host = "smtp.gmail.com";
    // => Assigns value to variable
    private int port = 587;
    // => Assigns value to variable
    private String username;
    // => Declares username field of type String
    private String password;
    // => Declares password field of type String
    // getters/setters
}
// => Block delimiter

// 3. Service implementation
public class EmailService {
    // => Begins block
    private final EmailProperties properties;
    // => Declares properties field of type final

    public EmailService(EmailProperties properties) {
    // => Begins block
        this.properties = properties;
        // => Assigns properties to this.properties
    }
    // => Block delimiter

    public void sendEmail(String to, String subject, String body) {
    // => Begins block
        System.out.println("Sending email to " + to + " via " + properties.getHost());
    // => Prints to console
        // Actual email sending logic
    }
    // => Block delimiter
}
// => Block delimiter

// 4. Register auto-configuration
// Create: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// Add line: com.example.starter.EmailAutoConfiguration

// 5. Usage in application
// Just add dependency and configure:
// app.email.username=user@gmail.com
// app.email.password=secret

@Service
// => Annotation applied
public class NotificationService {
    // => Begins block
    @Autowired
    // => Annotation applied
    private EmailService emailService; // Automatically available!
    // => Declares available! field of type EmailService

    public void notifyUser(String email) {
    // => Begins block
        emailService.sendEmail(email, "Welcome", "Thanks for signing up!");
    // => Executes method
    }
    // => Block delimiter
}
// => Block delimiter
```

**Code (Kotlin)**:

```kotlin
// 1. Create auto-configuration class
@Configuration
// => Marks class as Spring configuration (bean factory)
@ConditionalOnClass(EmailService::class)
// => Bean created only if specified class is on classpath
@EnableConfigurationProperties(EmailProperties::class)
// => Registers @ConfigurationProperties classes as Spring beans
open class EmailAutoConfiguration {
// => Class declaration
  @Bean
  // => Declares a Spring-managed bean
  @ConditionalOnMissingBean
  // => Bean created only if no other bean of type exists
  open fun emailService(properties: EmailProperties): EmailService {
  // => Function declaration
    return EmailService(properties)
    // => Returns value to caller
  }
}

// 2. Configuration properties
@ConfigurationProperties(prefix = "app.email")
// => Marks class as Spring configuration (bean factory)
data class EmailProperties(
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  var host: String = "smtp.gmail.com",
  // => Mutable variable
  var port: Int = 587,
  // => Mutable variable
  var username: String? = null,
  // => Mutable variable
  var password: String? = null
  // => Mutable variable
)

// 3. Service implementation
class EmailService(
// => Class declaration
  private val properties: EmailProperties
  // => Private class member
) {
// => Block begins
  fun sendEmail(to: String, subject: String, body: String) {
  // => Function declaration
    println("Sending email to $to via ${properties.host}")
    // => Output: see string template value above
    // Actual email sending logic
  }
}

// 4. Register auto-configuration
// Create: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// Add line: com.example.starter.EmailAutoConfiguration

// 5. Usage in application
// Just add dependency and configure:
// app.email.username=user@gmail.com
// app.email.password=secret

@Service
// => Business logic layer Spring component
class NotificationService(
// => Class declaration
  private val emailService: EmailService  // Automatically available!
  // => Private class member
) {
// => Block begins
  fun notifyUser(email: String) {
  // => Function declaration
    emailService.sendEmail(email, "Welcome", "Thanks for signing up!")
  }
}

// Kotlin-specific: Use data class with var properties for @ConfigurationProperties binding
// Alternative with sealed class for multiple email providers:
// sealed class EmailProvider
// data class SmtpProvider(val host: String, val port: Int) : EmailProvider()
// data class SendGridProvider(val apiKey: String) : EmailProvider()
// @ConfigurationProperties(prefix = "app.email")
// data class EmailProperties(var provider: EmailProvider)
```

**Key Takeaway**: Create Spring Boot starters for reusable auto-configuration—define `@Configuration` with `@ConditionalOnClass` and `@EnableConfigurationProperties`, register in `AutoConfiguration.imports`, and users get automatic bean registration with type-safe properties.

**Why It Matters**: OAuth2 delegates authentication to specialized providers (Google, GitHub, AWS Cognito) that invest millions in security infrastructure, enabling applications to avoid storing passwords that require expensive PCI/SOC2 compliance. Social login reduces signup friction by 30-50% (no password memorization), but introduces dependency on external providers—production systems implement fallback authentication for when OAuth providers have outages, preventing login failures that lock out all users during downtime.

---

### Example 49: Reactive Repositories with R2DBC

Use R2DBC for reactive, non-blocking database access.

```java
// pom.xml: spring-boot-starter-data-r2dbc, r2dbc-h2

@Entity
// => Annotation applied
@Table(name = "products")
// => Annotation applied
public class Product {
    // => Begins block
    @Id
    // => Annotation applied
    private Long id;
    // => Declares id field of type Long
    private String name;
    // => Declares name field of type String
    private BigDecimal price;
    // => Declares price field of type BigDecimal
    // getters/setters
}
// => Block delimiter

// Reactive repository
public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    // => Begins block
    Flux<Product> findByNameContaining(String name); // => Returns Flux (0..N items)
    Mono<Product> findByName(String name); // => Returns Mono (0..1 item)
    // => Result stored in //

    @Query("SELECT * FROM products WHERE price > :minPrice")
    // => Executes method
    Flux<Product> findExpensiveProducts(BigDecimal minPrice);
    // => Executes method
}
// => Block delimiter

@Service
// => Annotation applied
public class ProductService {
    // => Begins block
    @Autowired
    // => Annotation applied
    private ProductRepository productRepository;
    // => Declares productRepository field of type ProductRepository

    public Flux<Product> getAllProducts() {
    // => Begins block
        return productRepository.findAll();
    // => Returns value to caller
        // => Non-blocking stream of products
    }
    // => Block delimiter

    public Mono<Product> createProduct(Product product) {
    // => Begins block
        return productRepository.save(product);
    // => Returns value to caller
        // => Non-blocking save operation
    }
    // => Block delimiter

    public Flux<Product> searchProducts(String keyword) {
    // => Begins block
        return productRepository.findByNameContaining(keyword)
    // => Returns value to caller
            .filter(p -> p.getPrice().compareTo(BigDecimal.ZERO) > 0)
    // => Executes method
            .map(p -> {
    // => Begins block
                p.setName(p.getName().toUpperCase());
    // => Executes method
                return p;
    // => Returns result
            });
        // => Reactive pipeline: fetch → filter → transform
    }
    // => Block delimiter
}
// => Block delimiter

@RestController
// => Annotation applied
@RequestMapping("/api/products")
    // => Executes method
public class ProductController {
    // => Begins block
    @Autowired
    // => Annotation applied
    private ProductService productService;
    // => Declares productService field of type ProductService

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Product> streamProducts() {
    // => Begins block
        return productService.getAllProducts();
    // => Returns value to caller
        // => Streams products as Server-Sent Events
    }

    @PostMapping
    public Mono<Product> createProduct(@RequestBody Product product) {
    // => Begins block
        return productService.createProduct(product);
    // => Returns value to caller
        // => Non-blocking POST handling
    }
}

// application.yml
// spring:
//   r2dbc:
//     url: r2dbc:h2:mem:///testdb
//     username: sa
//     password:
```

**Code (Kotlin)**:

```kotlin
// build.gradle.kts: implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
// implementation("io.r2dbc:r2dbc-h2")

@Entity
// => JPA entity mapped to database table
@Table(name = "products")
// => Specifies database table name
data class Product(
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  @Id var id: Long? = null,
  // => Primary key field
  var name: String = "",
  // => Mutable variable
  var price: BigDecimal = BigDecimal.ZERO
  // => Mutable variable
)

// Reactive repository
interface ProductRepository : ReactiveCrudRepository<Product, Long> {
// => Interface definition
  fun findByNameContaining(name: String): Flux<Product>  // => Returns Flux (0..N items)
  fun findByName(name: String): Mono<Product>  // => Returns Mono (0..1 item)

  @Query("SELECT * FROM products WHERE price > :minPrice")
  // => Annotation applied
  fun findExpensiveProducts(minPrice: BigDecimal): Flux<Product>
  // => Function declaration
}

@Service
// => Business logic layer Spring component
class ProductService(
// => Class declaration
  private val productRepository: ProductRepository
  // => Private class member
) {
// => Block begins
  fun getAllProducts(): Flux<Product> {
  // => Function declaration
    return productRepository.findAll()
    // => Returns value to caller
    // => Non-blocking stream of products
  }

  fun createProduct(product: Product): Mono<Product> {
  // => Function declaration
    return productRepository.save(product)
    // => Returns value to caller
    // => Non-blocking save operation
  }

  fun searchProducts(keyword: String): Flux<Product> {
  // => Function declaration
    return productRepository.findByNameContaining(keyword)
    // => Returns value to caller
      .filter { it.price > BigDecimal.ZERO }
      .map { product ->
        product.copy(name = product.name.uppercase())
        // => Assignment
      }
    // => Reactive pipeline: fetch → filter → transform
  }
}

@RestController
// => Combines @Controller and @ResponseBody
@RequestMapping("/api/products")
// => HTTP endpoint mapping
class ProductController(
// => Class declaration
  private val productService: ProductService
  // => Private class member
) {
// => Block begins
  @GetMapping(produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
  // => HTTP endpoint mapping
  fun streamProducts(): Flux<Product> {
  // => Function declaration
    return productService.getAllProducts()
    // => Returns value to caller
    // => Streams products as Server-Sent Events
  }

  @PostMapping
  // => HTTP endpoint mapping
  fun createProduct(@RequestBody product: Product): Mono<Product> {
  // => Function declaration
    return productService.createProduct(product)
    // => Returns value to caller
    // => Non-blocking POST handling
  }
}

// application.yml
// spring:
//   r2dbc:
//     url: r2dbc:h2:mem:///testdb
//     username: sa
//     password:

// Kotlin-specific: Use copy() for immutable transformations, operator overloading for BigDecimal
// Alternative with coroutines (more idiomatic than Reactor):
// interface ProductRepository : CoroutineCrudRepository<Product, Long> {
//   suspend fun findByNameContaining(name: String): Flow<Product>
//   suspend fun findByName(name: String): Product?
// }
// suspend fun searchProducts(keyword: String): Flow<Product> = flow {
//   productRepository.findByNameContaining(keyword)
//     .filter { it.price > BigDecimal.ZERO }
//     .map { it.copy(name = it.name.uppercase()) }
//     .collect { emit(it) }
// }
```

**Key Takeaway**: R2DBC enables reactive database access—use `ReactiveCrudRepository` for non-blocking queries returning `Mono<T>` (0..1) or `Flux<T>` (0..N), enabling end-to-end reactive pipelines from database to HTTP response.

**Why It Matters**: Integration tests verify controller-to-database flows including JSON serialization, exception handling, and transaction management—catching bugs that unit tests miss because mocks don't behave like real implementations. However, @SpringBootTest loads the full context (2-5 seconds per test), making large test suites slow (20 minutes for 500 tests), requiring careful test design where unit tests cover 80% of logic with @WebMvcTest, reserving integration tests for critical paths that justify the performance cost.

---

### Example 50: Composite Keys and Embedded IDs

Handle composite primary keys with `@IdClass` or `@EmbeddedId`.

```java
// Strategy 1: @IdClass
@IdClass(OrderItemId.class)
    // => Executes method
@Entity
// => Annotation applied
public class OrderItem {
    // => Begins block
    @Id
    // => Annotation applied
    private Long orderId;
    // => Declares orderId field of type Long

    @Id
    // => Annotation applied
    private Long productId;
    // => Declares productId field of type Long

    private int quantity;
    // => Declares quantity field of type int
    private BigDecimal price;
    // => Declares price field of type BigDecimal

    // Constructors, getters, setters
}
// => Block delimiter

// Composite key class
public class OrderItemId implements Serializable {
    // => Begins block
    private Long orderId;
    // => Declares orderId field of type Long
    private Long productId;
    // => Declares productId field of type Long

    // Must have equals() and hashCode()
    @Override
    // => Annotation applied
    public boolean equals(Object o) {
    // => Begins block
        if (this == o) return true;
    // => Returns value to caller
        if (!(o instanceof OrderItemId)) return false;
    // => Returns value to caller
        OrderItemId that = (OrderItemId) o;
        // => Calls ()
        // => Stores result in that
        return Objects.equals(orderId, that.orderId) &&
    // => Returns value to caller
               Objects.equals(productId, that.productId);
    // => Executes method
    }
    // => Block delimiter

    @Override
    // => Annotation applied
    public int hashCode() {
    // => Begins block
        return Objects.hash(orderId, productId);
    // => Returns value to caller
    }
    // => Block delimiter
}
// => Block delimiter

// Repository with composite key
public interface OrderItemRepository extends JpaRepository<OrderItem, OrderItemId> {
    // => Begins block
    List<OrderItem> findByOrderId(Long orderId);
    // => Executes method
}
// => Block delimiter

// Usage
OrderItemId id = new OrderItemId();
    // => Creates new instance
id.setOrderId(1L);
    // => Executes method
id.setProductId(100L);
    // => Executes method
Optional<OrderItem> item = orderItemRepository.findById(id);
// => Calls findById()
// => Stores result in item

// Strategy 2: @EmbeddedId (recommended)
@Embeddable
// => Annotation applied
public class OrderItemKey implements Serializable {
    // => Begins block
    private Long orderId;
    // => Declares orderId field of type Long
    private Long productId;
    // => Declares productId field of type Long

    // equals(), hashCode(), getters, setters
}
// => Block delimiter

@Entity
// => Annotation applied
public class OrderItemEmbedded {
    // => Begins block
    @EmbeddedId
    // => Annotation applied
    private OrderItemKey id;
    // => Declares id field of type OrderItemKey

    private int quantity;
    // => Declares quantity field of type int
    private BigDecimal price;
    // => Declares price field of type BigDecimal

    // Access composite key fields
    public Long getOrderId() {
    // => Begins block
        return id.getOrderId();
    // => Returns value to caller
    }
}

// Repository
public interface OrderItemEmbeddedRepository extends JpaRepository<OrderItemEmbedded, OrderItemKey> {
    // => Begins block
    @Query("SELECT o FROM OrderItemEmbedded o WHERE o.id.orderId = :orderId")
    List<OrderItemEmbedded> findByOrderId(Long orderId);
    // => Executes method
}

// Usage
OrderItemKey key = new OrderItemKey(1L, 100L);
    // => Creates new instance
OrderItemEmbedded item = new OrderItemEmbedded();
    // => Creates new instance
item.setId(key);
    // => Executes method
item.setQuantity(5);
    // => Executes method
orderItemEmbeddedRepository.save(item);
    // => Executes method
```

**Code (Kotlin)**:

```kotlin
// Strategy 1: @IdClass
@IdClass(OrderItemId::class)
// => Primary key field
@Entity
// => JPA entity mapped to database table
open class OrderItem(
// => Class declaration
  @Id var orderId: Long? = null,
  // => Primary key field
  @Id var productId: Long? = null,
  // => Primary key field
  var quantity: Int = 0,
  // => Mutable variable
  var price: BigDecimal = BigDecimal.ZERO
  // => Mutable variable
)

// Composite key class
data class OrderItemId(
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  var orderId: Long? = null,
  // => Mutable variable
  var productId: Long? = null
  // => Mutable variable
) : Serializable {
// => Block begins
  // equals() and hashCode() auto-generated by data class
}

// Repository with composite key
interface OrderItemRepository : JpaRepository<OrderItem, OrderItemId> {
// => Interface definition
  fun findByOrderId(orderId: Long): List<OrderItem>
  // => Function declaration
}

// Usage
val id = OrderItemId(orderId = 1L, productId = 100L)
// => Immutable binding (read-only reference)
val item = orderItemRepository.findById(id)
// => Immutable binding (read-only reference)

// Strategy 2: @EmbeddedId (recommended)
@Embeddable
// => Annotation applied
data class OrderItemKey(
// => Data class: auto-generates equals/hashCode/toString/copy/componentN
  var orderId: Long? = null,
  // => Mutable variable
  var productId: Long? = null
  // => Mutable variable
) : Serializable
// equals() and hashCode() auto-generated by data class

@Entity
// => JPA entity mapped to database table
open class OrderItemEmbedded(
// => Class declaration
  @EmbeddedId var id: OrderItemKey? = null,
  // => Annotation applied
  var quantity: Int = 0,
  // => Mutable variable
  var price: BigDecimal = BigDecimal.ZERO
  // => Mutable variable
) {
// => Block begins
  // Access composite key fields
  val orderId: Long?
    get() = id?.orderId
    // => Assignment
}

// Repository
interface OrderItemEmbeddedRepository : JpaRepository<OrderItemEmbedded, OrderItemKey> {
// => Interface definition
  @Query("SELECT o FROM OrderItemEmbedded o WHERE o.id.orderId = :orderId")
  // => Annotation applied
  fun findByOrderId(orderId: Long): List<OrderItemEmbedded>
  // => Function declaration
}

// Usage
val key = OrderItemKey(orderId = 1L, productId = 100L)
// => Immutable binding (read-only reference)
val item = OrderItemEmbedded(
// => Immutable binding (read-only reference)
  id = key,
  // => Assignment
  quantity = 5,
  // => Assignment
  price = BigDecimal("29.99")
  // => Assignment
)
orderItemEmbeddedRepository.save(item)

// Kotlin-specific: Use data class for automatic equals()/hashCode() implementation
// Alternative with inline value class for type safety (Kotlin 1.5+):
// @JvmInline value class OrderId(val value: Long)
// @JvmInline value class ProductId(val value: Long)
// @Embeddable
// data class OrderItemKey(val orderId: OrderId, val productId: ProductId) : Serializable
```

**Key Takeaway**: Use `@EmbeddedId` over `@IdClass` for composite keys—it encapsulates key fields in a single object, provides better type safety, and makes queries clearer by explicitly referencing the embedded ID.

**Why It Matters**: MockMvc tests verify REST API contracts (request mapping, response codes, JSON structure) 10x faster than integration tests because they don't start HTTP servers or load full contexts, enabling rapid TDD feedback loops. Production teams use MockMvc for controller logic and @JsonTest for serialization verification, achieving 95% branch coverage with 2-minute test suite execution that enables continuous deployment where every commit triggers automated tests before merging to main.

---

## Summary

You've learned 30 intermediate Spring Boot patterns:

**Transactions & Data**:

- `@Transactional` for ACID operations
- Isolation levels for concurrency control
- Optimistic locking with `@Version`
- Batch operations for performance

**Spring Security**:

- Auto-configuration and custom security chains
- Method-level authorization with `@PreAuthorize`
- JWT stateless authentication
- OAuth2 social login

**Testing**:

- `@SpringBootTest` for integration tests
- `@WebMvcTest` for controller tests
- TestContainers for real databases
- Mockito for unit testing

**Caching & Performance**:

- Cache abstraction with `@Cacheable`
- Redis distributed caching
- Cache strategies and pitfalls

**Async & Events**:

- `@Async` methods with CompletableFuture
- Custom thread pools with TaskExecutor
- Application events for decoupling
- `@Scheduled` tasks for automation

**Real-Time & Advanced Patterns**:

- WebSocket for bidirectional real-time communication
- Server-Sent Events for unidirectional streaming
- API versioning strategies (URL, header, content negotiation)
- Custom argument resolvers for parameter extraction
- Filter vs Interceptor vs AOP comparisons
- Custom annotations with AOP for declarative concerns
- Bean post processors for bean customization
- Custom Spring Boot starters
- Reactive repositories with R2DBC
- Composite keys and embedded IDs

## Next Steps

- [Advanced by-example tutorial](/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/by-example/advanced) - Microservices, observability, advanced patterns
