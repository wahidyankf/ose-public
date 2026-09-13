---
title: "SQL Database"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Comprehensive guide to SQL database integration in Java using JDBC, connection pooling, transactions, and testing strategies
weight: 10000016
tags: ["java", "sql", "jdbc", "database", "hikaricp", "jpa", "hibernate", "testcontainers"]
---

## Why SQL Databases Matter

SQL databases are the backbone of most enterprise applications, storing business-critical data with ACID guarantees. Java provides robust database integration through JDBC and higher-level abstractions.

**Core Benefits**:

- **Data persistence**: Store application state reliably
- **ACID transactions**: Ensure data consistency
- **Complex queries**: Join and aggregate data efficiently
- **Concurrent access**: Multiple users/processes safely
- **Data integrity**: Constraints and foreign keys

**Problem**: Raw JDBC is verbose, error-prone (resource leaks, SQL injection), and requires manual transaction management.

**Solution**: Use connection pooling, prepared statements, and modern libraries for safe, efficient database access.

## Database Access Layers

| Approach                | Abstraction Level | Pros                          | Cons                             | Use When                 |
| ----------------------- | ----------------- | ----------------------------- | -------------------------------- | ------------------------ |
| **Raw JDBC**            | Low               | Full control, no dependencies | Verbose, error-prone             | Simple queries, learning |
| **HikariCP + JDBC**     | Low + Pooling     | Fast, production-ready        | Still manual SQL                 | Performance-critical     |
| **Spring JdbcTemplate** | Medium            | Less verbose, safe            | Spring dependency                | Spring applications      |
| **jOOQ**                | Medium            | Type-safe SQL, DSL            | Learning curve                   | Complex queries          |
| **JPA/Hibernate**       | High              | ORM, portable                 | Performance overhead, complexity | Domain-driven design     |

**Recommendation**: Start with JDBC + HikariCP, move to JPA for complex domain models.

## JDBC Fundamentals

JDBC (Java Database Connectivity) is the standard API for database access in Java.

### Establishing Connections

**Pattern** (without pooling):

```java
String url = "jdbc:postgresql:mydb";  // => JDBC connection URL
                                                         // => Format: jdbc:<database>://<host>:<port>/<database-name>
                                                         // => postgresql is database type; the short form defaults the server to localhost:5432
String user = "dbuser";  // => Database username
String password = "dbpass";  // => Database password (NEVER hardcode in production - use environment variables!)

try (Connection conn = DriverManager.getConnection(url, user, password)) {  // => Establishes TCP connection to database
                                                                             // => Authenticates with username/password
                                                                             // => Connection is "conn" object
                                                                             // => try-with-resources auto-closes connection
    // Use connection  // => Execute queries, inserts, updates, deletes
} catch (SQLException e) {  // => Catches database errors (connection failed, authentication failed)
    System.err.println("Connection error: " + e.getMessage());  // => Prints error message
}  // => Connection automatically closed here (try-with-resources)
```

**Problem**: Creating connections is expensive (TCP handshake, authentication). Creating per-query is inefficient.

**Solution**: Use connection pooling (see HikariCP section).

### Executing Queries

**SELECT query**:

```java
String sql = "SELECT id, name, email FROM users WHERE active = true";

try (Connection conn = getConnection();
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery(sql)) {

    while (rs.next()) {
        long id = rs.getLong("id");
        String name = rs.getString("name");
        String email = rs.getString("email");

        System.out.printf("User %d: %s (%s)%n", id, name, email);
    }
} catch (SQLException e) {
    System.err.println("Query error: " + e.getMessage());
}
```

**INSERT/UPDATE/DELETE**:

```java
String sql = "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')";

try (Connection conn = getConnection();
     Statement stmt = conn.createStatement()) {

    int rowsAffected = stmt.executeUpdate(sql);
    System.out.println("Inserted " + rowsAffected + " row(s)");
} catch (SQLException e) {
    System.err.println("Insert error: " + e.getMessage());
}
```

### Prepared Statements (SQL Injection Prevention)

**CRITICAL**: Never concatenate user input into SQL - it enables SQL injection attacks.

**Vulnerable code** (SQL injection risk):

```java
// DANGEROUS - SQL INJECTION VULNERABILITY
String username = request.getParameter("username");  // => Gets username from HTTP request (user-controlled input!)
String sql = "SELECT * FROM users WHERE username = '" + username + "'";  // => String concatenation creates SQL
                                                                          // => If username = "alice", SQL is: SELECT * FROM users WHERE username = 'alice'
                                                                          // => If username = "' OR '1'='1", SQL is: SELECT * FROM users WHERE username = '' OR '1'='1'
                                                                          // => Attack SQL returns ALL users (bypasses authentication!)
// Attack: username = "' OR '1'='1"  // => Attacker closes quote, adds OR condition always true
                                     // => '1'='1' is always true → query returns all rows
                                     // => Can also use: "; DROP TABLE users; --" to delete table
```

**Safe code** (parameterized):

```java
String sql = "SELECT * FROM users WHERE username = ?";  // => Parameterized query with ? placeholder
                                                          // => ? is parameter marker (NOT string concatenation)
                                                          // => Database treats parameter as DATA, never as SQL code

try (Connection conn = getConnection();  // => Gets connection from pool or DriverManager
     PreparedStatement stmt = conn.prepareStatement(sql)) {  // => Creates PreparedStatement (compiles SQL once)
                                                              // => PreparedStatement is reusable, efficient

    stmt.setString(1, username);  // Parameter binding prevents injection  // => Binds username to parameter 1 (first ?)
                                                                            // => Parameter index starts at 1 (NOT 0!)
                                                                            // => Database escapes special characters automatically
                                                                            // => If username = "' OR '1'='1", treated as LITERAL string (not SQL)
                                                                            // => Attack SQL becomes: SELECT * FROM users WHERE username = '\' OR \'1\'=\'1\''
                                                                            // => Returns zero rows (safe!)

    try (ResultSet rs = stmt.executeQuery()) {  // => Executes prepared statement
                                                 // => Returns ResultSet with query results
        while (rs.next()) {  // => Iterates through result rows
            // Process results  // => Extract columns with rs.getString(), rs.getInt(), etc.
        }
    }  // => ResultSet auto-closed
} catch (SQLException e) {  // => Catches database errors
    System.err.println("Query error: " + e.getMessage());
}  // => PreparedStatement and Connection auto-closed
```

**Type-safe parameter binding**:

```java
stmt.setString(1, "Alice");           // String
stmt.setInt(2, 30);                   // Integer
stmt.setTimestamp(3, timestamp);      // Timestamp
stmt.setBigDecimal(4, amount);        // BigDecimal (for money)
```

**Problem**: String concatenation allows SQL injection attacks.

**Solution**: Always use PreparedStatement with parameter binding.

### Getting Generated Keys

Retrieve auto-generated IDs after INSERT.

**Pattern**:

```java
String sql = "INSERT INTO users (name, email) VALUES (?, ?)";

try (Connection conn = getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

    stmt.setString(1, "Alice");
    stmt.setString(2, "alice@example.com");

    int rowsAffected = stmt.executeUpdate();

    try (ResultSet rs = stmt.getGeneratedKeys()) {
        if (rs.next()) {
            long id = rs.getLong(1);
            System.out.println("Inserted user with ID: " + id);
        }
    }
} catch (SQLException e) {
    System.err.println("Insert error: " + e.getMessage());
}
```

## Connection Pooling with HikariCP

HikariCP is the fastest, most reliable connection pool for Java.

### Why Connection Pooling

**Without pooling**:

- Create connection: ~50-100ms (TCP handshake, auth)
- Execute query: ~10ms
- Close connection: ~10ms
- **Total**: ~70-120ms per query

**With pooling**:

- Get connection from pool: ~1ms
- Execute query: ~10ms
- Return to pool: ~1ms
- **Total**: ~12ms per query (6-10x faster)

### HikariCP Configuration

**Maven dependency**:

```xml
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>6.2.1</version>
</dependency>
```

**Pattern**:

```java
import com.zaxxer.hikari.*;

HikariConfig config = new HikariConfig();  // => Creates configuration object
config.setJdbcUrl("jdbc:postgresql:mydb");  // => Database connection URL
config.setUsername("dbuser");  // => Database username
config.setPassword("dbpass");  // => Database password (use environment variables in production!)

// Pool configuration
config.setMaximumPoolSize(10);              // Max connections  // => Maximum 10 connections in pool
                                                                 // => Requests wait if all connections busy
                                                                 // => Too many connections waste memory, too few causes contention
config.setMinimumIdle(2);                   // Min idle connections  // => Keeps 2 connections ready (minimizes wait time)
                                                                       // => Pool grows from 2 to 10 based on demand
config.setConnectionTimeout(30000);          // 30s connection timeout  // => Wait max 30 seconds for connection before throwing exception
                                                                         // => Prevents infinite waiting if pool exhausted
config.setIdleTimeout(600000);              // 10min idle timeout  // => Idle connections closed after 10 minutes (saves resources)
                                                                    // => Pool shrinks back to minimumIdle when idle
config.setMaxLifetime(1800000);             // 30min max lifetime  // => Connections recycled after 30 minutes (prevents stale connections)
                                                                    // => Database may close connections after idle time - this prevents errors

HikariDataSource dataSource = new HikariDataSource(config);  // => Creates connection pool
                                                              // => Opens minimum idle connections immediately
                                                              // => Pool ready for requests

// Use connections
try (Connection conn = dataSource.getConnection()) {  // => Gets connection from pool (fast: ~1ms vs ~50-100ms without pooling)
                                                       // => Waits if all connections busy (up to connectionTimeout)
    // Execute queries  // => Use connection for database operations
}  // => try-with-resources returns connection to pool (NOT closed, reused!)
   // => Connection immediately available for next request

// Shutdown pool
dataSource.close();  // => Closes all connections in pool
                     // => Call on application shutdown ONLY (not per request!)
```

**Recommended pool sizes**:

- **Web apps**: `connections = (core_count * 2) + effective_spindle_count`
- **Example** (4 cores, 1 disk): 10 connections
- **Rule**: Start small (10), measure, increase only if needed

**Problem**: Creating connections per request is slow and wasteful.

**Solution**: HikariCP reuses connections, dramatically improving performance.

## Transaction Management

Transactions ensure data consistency with ACID properties (Atomicity, Consistency, Isolation, Durability).

### Manual Transaction Control

**Pattern**:

```java
Connection conn = null;  // => Declare outside try for finally access
try {
    conn = dataSource.getConnection();  // => Gets connection from pool
    conn.setAutoCommit(false);  // Start transaction  // => Disables auto-commit (default: each statement commits immediately)
                                                        // => Transaction starts - changes not visible until commit()

    // Multiple operations in transaction
    updateInventory(conn, productId, -quantity);  // => UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?
                                                   // => Deducts quantity from inventory
    createOrder(conn, userId, productId, quantity);  // => INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)
                                                      // => Creates order record
    chargePayment(conn, userId, amount);  // => INSERT INTO payments (user_id, amount) VALUES (?, ?)
                                          // => Charges customer
                                          // => All three operations in SAME transaction - atomic

    conn.commit();  // Commit if all succeed  // => Makes all changes permanent
                                               // => Other connections can see changes
                                               // => Releases locks
} catch (SQLException e) {  // => Catches ANY database error in transaction
    if (conn != null) {  // => Check connection not null
        try {
            conn.rollback();  // Rollback on error  // => Undoes ALL changes in transaction
                                                     // => Inventory NOT deducted, order NOT created, payment NOT charged
                                                     // => Database returns to state before transaction
                                                     // => CRITICAL: All-or-nothing guarantee
        } catch (SQLException ex) {  // => Rollback can also fail (connection lost)
            ex.printStackTrace();
        }
    }
    throw new RuntimeException("Transaction failed", e);  // => Re-throw to caller
} finally {  // => Always executes (success or failure)
    if (conn != null) {
        try {
            conn.setAutoCommit(true);  // Restore auto-commit  // => Re-enables auto-commit for connection reuse
            conn.close();  // => Returns connection to pool (doesn't actually close)
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### Transaction Isolation Levels

Control concurrent transaction behavior.

**Isolation levels** (from weakest to strongest):

- **READ_UNCOMMITTED**: Dirty reads possible
- **READ_COMMITTED**: Default (PostgreSQL), prevents dirty reads
- **REPEATABLE_READ**: Prevents non-repeatable reads
- **SERIALIZABLE**: Strictest, prevents phantom reads

**Pattern**:

```java
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
```

**Problem**: Default isolation may not match business requirements.

**Solution**: Choose appropriate isolation level based on consistency needs vs. performance.

### Savepoints

Create savepoints for partial rollback within transactions.

**Pattern**:

```java
conn.setAutoCommit(false);

Savepoint savepoint1 = conn.setSavepoint("beforeRiskyOperation");

try {
    riskyOperation(conn);
} catch (SQLException e) {
    conn.rollback(savepoint1);  // Rollback to savepoint
}

conn.commit();
```

## ResultSet Handling

### Extracting Data

**Type-safe extraction**:

```java
while (rs.next()) {
    long id = rs.getLong("id");
    String name = rs.getString("name");
    LocalDate birthDate = rs.getObject("birth_date", LocalDate.class);
    BigDecimal balance = rs.getBigDecimal("balance");

    User user = new User(id, name, birthDate, balance);
}
```

**Null handling**:

```java
String email = rs.getString("email");
if (rs.wasNull()) {
    email = "no-email@example.com";  // Default for null
}
```

### Mapping to Objects

**Pattern** (manual mapping):

```java
public User mapUser(ResultSet rs) throws SQLException {
    return new User(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("email"),
        rs.getTimestamp("created_at").toLocalDateTime()
    );
}

List<User> users = new ArrayList<>();
while (rs.next()) {
    users.add(mapUser(rs));
}
```

## Batch Operations

Execute multiple statements efficiently in one database round-trip.

**Pattern**:

```java
String sql = "INSERT INTO users (name, email) VALUES (?, ?)";

try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql)) {

    conn.setAutoCommit(false);

    for (User user : users) {
        stmt.setString(1, user.getName());
        stmt.setString(2, user.getEmail());
        stmt.addBatch();

        if (users.indexOf(user) % 100 == 0) {
            stmt.executeBatch();  // Execute every 100 rows
        }
    }

    stmt.executeBatch();  // Execute remaining
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
    throw e;
}
```

**Performance**:

- **Individual inserts**: 1000 inserts = 1000 round-trips (~10s)
- **Batch inserts**: 1000 inserts = 10 batches (~1s, 10x faster)

## Database Migrations

Manage schema changes with version-controlled migration scripts.

### Flyway

Flyway applies SQL migrations in order, tracking applied versions.

**Maven dependency**:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>11.1.0</version>
</dependency>
```

**Migration files** (src/main/resources/db/migration):

- `V1__create_users_table.sql`
- `V2__add_email_column.sql`
- `V3__create_orders_table.sql`

**V1\_\_create_users_table.sql**:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Java code**:

```java
import org.flywaydb.core.Flyway;

Flyway flyway = Flyway.configure()
    .dataSource(dataSource)
    .load();

flyway.migrate();  // Apply pending migrations
```

**Problem**: Manual schema changes cause inconsistency across environments.

**Solution**: Flyway automates migrations, ensuring all environments have same schema version.

### Liquibase Alternative

Liquibase supports XML/YAML/JSON in addition to SQL.

**changelog.xml**:

```xml
<changeSet id="1" author="alice">
    <createTable tableName="users">
        <column name="id" type="bigint" autoIncrement="true">
            <constraints primaryKey="true"/>
        </column>
        <column name="name" type="varchar(255)">
            <constraints nullable="false"/>
        </column>
    </createTable>
</changeSet>
```

## JPA and Hibernate Basics

JPA (Java Persistence API) provides ORM (Object-Relational Mapping) for automatic database mapping.

### Entity Mapping

**Pattern**:

```java
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Getters/setters
}
```

### EntityManager Operations

**Pattern**:

```java
EntityManagerFactory emf = Persistence.createEntityManagerFactory("myapp");
EntityManager em = emf.createEntityManager();

// Begin transaction
em.getTransaction().begin();

// Create
User user = new User();
user.setName("Alice");
user.setEmail("alice@example.com");
em.persist(user);

// Read
User found = em.find(User.class, 1L);

// Update
found.setEmail("newemail@example.com");
em.merge(found);

// Delete
em.remove(found);

// Commit transaction
em.getTransaction().commit();

em.close();
emf.close();
```

### JPQL Queries

**Pattern**:

```java
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u WHERE u.email LIKE :pattern",
    User.class
);
query.setParameter("pattern", "%@example.com");

List<User> users = query.getResultList();
```

**Problem**: JPA simplifies CRUD but can hide performance issues (N+1 queries).

**Solution**: Use JPA for simple CRUD, optimize with JPQL/native queries for complex operations.

## Testing with Databases

### In-Memory H2 Database

H2 provides fast in-memory database for testing.

**Maven dependency**:

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>2.3.232</version>
    <scope>test</scope>
</dependency>
```

**Pattern**:

```java
@Test
void testUserRepository() {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl("jdbc:h2:mem:test");
    config.setUsername("sa");
    config.setPassword("");

    HikariDataSource dataSource = new HikariDataSource(config);

    // Run migrations
    Flyway.configure()
        .dataSource(dataSource)
        .load()
        .migrate();

    // Test database operations
    UserRepository repo = new UserRepository(dataSource);
    User user = repo.create("Alice", "alice@example.com");

    assertThat(user.getId()).isNotNull();
    assertThat(repo.findById(user.getId())).isPresent();

    dataSource.close();
}
```

### TestContainers

TestContainers runs real databases in Docker for integration testing.

**Maven dependency**:

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.20.4</version>
    <scope>test</scope>
</dependency>
```

**Pattern**:

```java
import org.testcontainers.containers.PostgreSQLContainer;
import org.junit.jupiter.api.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UserRepositoryIntegrationTest {

    private PostgreSQLContainer<?> postgres;
    private HikariDataSource dataSource;

    @BeforeAll
    void setUp() {
        postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

        postgres.start();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(postgres.getJdbcUrl());
        config.setUsername(postgres.getUsername());
        config.setPassword(postgres.getPassword());

        dataSource = new HikariDataSource(config);

        // Run migrations
        Flyway.configure()
            .dataSource(dataSource)
            .load()
            .migrate();
    }

    @AfterAll
    void tearDown() {
        dataSource.close();
        postgres.stop();
    }

    @Test
    void testCreateUser() {
        UserRepository repo = new UserRepository(dataSource);
        User user = repo.create("Alice", "alice@example.com");

        assertThat(user.getId()).isNotNull();
    }
}
```

**Problem**: H2 in-memory differs from production database (PostgreSQL, MySQL).

**Solution**: TestContainers runs real database in Docker for accurate integration tests.

## Best Practices

### 1. Always Use Prepared Statements

Prevent SQL injection by never concatenating user input into SQL.

**Before**: `"SELECT * FROM users WHERE name = '" + name + "'"`
**After**: `PreparedStatement` with parameter binding

### 2. Close Resources in Try-With-Resources

Prevent connection leaks by using try-with-resources for auto-closing.

**Pattern**:

```java
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql);
     ResultSet rs = stmt.executeQuery()) {
    // Use resources
}  // Automatically closed
```

### 3. Use Connection Pooling

Never create connections directly - always use pooling.

**Before**: `DriverManager.getConnection()` per request
**After**: HikariCP connection pool

### 4. Handle NULL Values

SQL NULL is not the same as Java null.

**Pattern**:

```java
BigDecimal balance = rs.getBigDecimal("balance");
if (rs.wasNull()) {
    balance = BigDecimal.ZERO;
}
```

### 5. Use BigDecimal for Money

Never use float/double for financial calculations.

**Before**: `double amount = rs.getDouble("amount")`
**After**: `BigDecimal amount = rs.getBigDecimal("amount")`

### 6. Index Frequently Queried Columns

Add database indexes for WHERE/JOIN columns.

**SQL**:

```sql
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_orders_user_id ON orders (user_id);
```

### 7. Batch Large Operations

Use batch operations for bulk inserts/updates.

**Before**: 1000 individual inserts (~10s)
**After**: Batch of 100 per execute (~1s)

## Common Patterns

### Repository Pattern

**Pattern**:

```java
public class UserRepository {
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<User> findById(Long id) {
        String sql = "SELECT id, name, email FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error finding user", e);
        }

        return Optional.empty();
    }

    public User create(String name, String email) {
        String sql = "INSERT INTO users (name, email) VALUES (?, ?) RETURNING id";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, name);
            stmt.setString(2, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    long id = rs.getLong("id");
                    return new User(id, name, email);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error creating user", e);
        }

        throw new RuntimeException("Failed to create user");
    }

    private User mapUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("email")
        );
    }
}
```

## Related Content

### Core Java Topics

- **[Java Best Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/best-practices)** - General coding standards
- **[Test-Driven Development](/en/learn/software-engineering/programming-languages/java/in-the-field/test-driven-development)** - Testing database code

### External Resources

**JDBC & Connection Pooling**:

- [JDBC Tutorial](https://docs.oracle.com/javase/tutorial/jdbc/) - Official Oracle JDBC guide
- [HikariCP](https://github.com/brettwooldridge/HikariCP) - High-performance connection pool
- [HikariCP Configuration](https://github.com/brettwooldridge/HikariCP#configuration-knobs-baby) - Pool tuning guide

**Database Migrations**:

- [Flyway](https://flywaydb.org/) - Database migration tool
- [Liquibase](https://www.liquibase.org/) - Alternative migration tool

**ORM**:

- [Hibernate ORM](https://hibernate.org/orm/) - Most popular JPA implementation
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa) - Spring integration

**Testing**:

- [TestContainers](https://testcontainers.com/) - Docker-based testing
- [H2 Database](https://www.h2database.com/) - In-memory database

---

**Last Updated**: 2026-02-03
**Java Version**: 17+ (baseline), 21+ (recommended)
**Framework Versions**: HikariCP 6.2.1, Flyway 11.1.0, Hibernate 6.6.5, TestContainers 1.20.4
