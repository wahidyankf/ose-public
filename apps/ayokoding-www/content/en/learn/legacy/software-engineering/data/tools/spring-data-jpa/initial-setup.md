---
title: "Initial Setup"
date: 2026-01-29T00:00:00+07:00
draft: false
weight: 100001
description: "Get Spring Data JPA installed and running with Spring Boot - installation, verification, and your first working entity"
tags: ["java", "spring", "spring-data-jpa", "jpa", "hibernate", "installation", "setup", "beginner"]
---

**Want to start working with databases in Spring?** This initial setup guide gets Spring Data JPA installed and working in your Spring Boot project. By the end, you'll have Spring Data JPA running and will create your first entity with queries.

This tutorial provides 0-5% coverage - just enough to get Spring Data JPA working. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/data/tools/spring-data-jpa/quick-start) (5-30% coverage).

## Prerequisites

Before installing Spring Data JPA, you need:

- Java 17+ installed (LTS version recommended)
- Maven 3.6+ or Gradle 7+ for build management
- A database server (H2, PostgreSQL, or MySQL)
- An IDE (IntelliJ IDEA, Eclipse, VS Code with Java extensions)
- Basic Java knowledge (classes, interfaces, annotations)

No prior Spring or JPA experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Create** a Spring Boot project with Spring Data JPA dependencies
2. **Configure** database connection properties
3. **Define** your first JPA entity with annotations
4. **Create** a repository interface for database operations
5. **Execute** basic CRUD operations using Spring Data JPA

## Install Java and Maven

Spring Data JPA requires Java 17+ and a build tool (Maven or Gradle).

### Verify Java Installation

```bash
java -version
```

**Expected output**:

```
openjdk version "17.0.9" 2023-10-17 LTS
OpenJDK Runtime Environment (build 17.0.9+9-LTS)
```

If Java is not installed, see [Java Initial Setup](/en/learn/software-engineering/programming-languages/java/initial-setup).

### Verify Maven Installation

```bash
mvn -version
```

**Expected output**:

```
Apache Maven 3.9.5 (57804ffe001d7215b5e7bcb531cf83df38f93546)
Maven home: /usr/local/maven
Java version: 17.0.9, vendor: Eclipse Adoptium
```

**Install Maven** if missing:

**macOS** (Homebrew):

```bash
brew install maven
```

**Ubuntu/Debian**:

```bash
sudo apt update
sudo apt install -y maven
```

**Windows**: Download from [maven.apache.org](https://maven.apache.org/download.cgi) and add to PATH.

## Create Spring Boot Project

Use Spring Initializr to create a project with Spring Data JPA.

### Option 1: Web-Based Initializr

1. Visit [start.spring.io](https://start.spring.io)
2. Configure project:
   - **Project**: Maven
   - **Language**: Java
   - **Spring Boot**: 3.2.2 (latest stable)
   - **Project Metadata**:
     - Group: `com.example`
     - Artifact: `spring-data-jpa-tutorial`
     - Name: `spring-data-jpa-tutorial`
     - Package name: `com.example.springdatajpatutorial`
     - Packaging: Jar
     - Java: 17
3. Add dependencies:
   - **Spring Data JPA** (ORM framework)
   - **H2 Database** (in-memory database for testing)
   - **Spring Web** (REST endpoints for testing)
   - **Lombok** (optional, reduces boilerplate)
4. Click **Generate** to download ZIP
5. Extract ZIP and open in IDE

### Option 2: Command-Line Initializr

```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=data-jpa,h2,web,lombok \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.2 \
  -d groupId=com.example \
  -d artifactId=spring-data-jpa-tutorial \
  -d packageName=com.example.springdatajpatutorial \
  -d javaVersion=17 \
  -o spring-data-jpa-tutorial.zip

unzip spring-data-jpa-tutorial.zip
cd spring-data-jpa-tutorial
```

### Option 3: Manual Maven Project

Create `pom.xml` manually:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>spring-data-jpa-tutorial</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>spring-data-jpa-tutorial</name>
    <description>Spring Data JPA Tutorial Project</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- H2 Database (in-memory) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Spring Web (for REST testing) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Lombok (optional, reduces boilerplate) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Download Dependencies

```bash
mvn clean install
```

**Expected output**:

```
[INFO] BUILD SUCCESS
[INFO] Total time:  12.345 s
```

## Project Structure

Understand the generated project structure.

```
spring-data-jpa-tutorial/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/springdatajpatutorial/
│   │   │       └── SpringDataJpaTutorialApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   └── test/
│       └── java/
├── pom.xml
└── mvnw (Maven wrapper)
```

**Key files**:

- `SpringDataJpaTutorialApplication.java`: Main application entry point
- `application.properties`: Configuration file
- `pom.xml`: Maven dependencies and build configuration

## Configure Database Connection

Configure Spring Data JPA to connect to H2 in-memory database.

### Edit application.properties

Open `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**Configuration explained**:

- `spring.datasource.url`: JDBC URL for H2 in-memory database
- `spring.jpa.hibernate.ddl-auto=update`: Auto-create/update tables from entities
- `spring.jpa.show-sql=true`: Log SQL queries to console
- `spring.h2.console.enabled=true`: Enable H2 web console at `/h2-console`

### PostgreSQL Configuration (Alternative)

For PostgreSQL instead of H2, add dependency to `pom.xml`:

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

Update `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:5432/spring_jpa_tutorial
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### MySQL Configuration (Alternative)

For MySQL, add dependency to `pom.xml`:

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

Update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:3306/spring_jpa_tutorial
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

## Create Your First Entity

Entities are Java classes mapped to database tables.

### Create User Entity

Create `src/main/java/com/example/springdatajpatutorial/entity/User.java`:

```java
package com.example.springdatajpatutorial.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column
    private Integer age;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Annotations explained**:

- `@Entity`: Marks class as JPA entity (database-mapped)
- `@Table(name = "users")`: Specifies table name
- `@Id`: Marks primary key field
- `@GeneratedValue(strategy = IDENTITY)`: Auto-increment primary key
- `@Column`: Configures column properties (nullable, unique, length)
- `@PrePersist`: Lifecycle callback before insert
- `@PreUpdate`: Lifecycle callback before update

**Lombok annotations** (optional):

- `@Data`: Generates getters, setters, toString, equals, hashCode
- `@NoArgsConstructor`: Generates no-args constructor
- `@AllArgsConstructor`: Generates all-args constructor

**Without Lombok** (manual implementation):

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column
    private Integer age;

    // Constructors
    public User() {}

    public User(String username, String email, Integer age) {
        this.username = username;
        this.email = email;
        this.age = age;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
```

## Create Repository Interface

Repositories provide database access methods without implementation.

### Create UserRepository

Create `src/main/java/com/example/springdatajpatutorial/repository/UserRepository.java`:

```java
package com.example.springdatajpatutorial.repository;

import com.example.springdatajpatutorial.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA automatically implements these methods
    // based on method naming conventions

    // Find user by username
    Optional<User> findByUsername(String username);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Find users by age greater than
    List<User> findByAgeGreaterThan(Integer age);

    // Find users by username containing (case-insensitive)
    List<User> findByUsernameContainingIgnoreCase(String username);

    // Check if username exists
    boolean existsByUsername(String username);
}
```

**Repository explained**:

- `extends JpaRepository<User, Long>`: Inherits CRUD methods (save, findById, findAll, delete)
- `@Repository`: Marks as Spring Data repository
- Method naming conventions: Spring generates implementation from method names
  - `findBy[Field]`: Find entities by field value
  - `findBy[Field]GreaterThan`: Find with comparison
  - `existsBy[Field]`: Check existence
  - `countBy[Field]`: Count matching entities

**Inherited methods** (no implementation needed):

- `save(entity)`: Insert or update
- `findById(id)`: Find by primary key
- `findAll()`: Retrieve all entities
- `deleteById(id)`: Delete by primary key
- `count()`: Count all entities

## Run the Application

Start Spring Boot application and verify setup.

### Run Application

```bash
mvn spring-boot:run

./mvnw spring-boot:run
```

**Expected output**:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v3.2.2)

INFO: Started SpringDataJpaTutorialApplication in 3.456 seconds
INFO: Tomcat started on port 8080 (http)
```

**What happens**:

1. Spring Boot starts embedded Tomcat server (port 8080)
2. Spring Data JPA initializes Hibernate ORM
3. Hibernate creates `users` table from `User` entity
4. H2 console becomes available at `http://localhost:8080/h2-console`

### Verify Database Creation

Open browser and visit `http://localhost:8080/h2-console`:

1. **JDBC URL**: `jdbc:h2:mem:testdb` (from application.properties)
2. **Username**: `sa`
3. **Password**: (empty)
4. Click **Connect**

**Run SQL query** to verify table:

```sql
SELECT
  *
FROM
  users;
```

**Expected result**: Empty table with columns: id, username, email, age, created_at, updated_at.

## Your First CRUD Operations

Execute database operations using Spring Data JPA.

### Create Service Class

Create `src/main/java/com/example/springdatajpatutorial/service/UserService.java`:

```java
package com.example.springdatajpatutorial.service;

import com.example.springdatajpatutorial.entity.User;
import com.example.springdatajpatutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // Create user
    public User createUser(User user) {
        return userRepository.save(user);
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Get user by username
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Update user
    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    user.setEmail(updatedUser.getEmail());
                    user.setAge(updatedUser.getAge());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Delete user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

### Create REST Controller

Create `src/main/java/com/example/springdatajpatutorial/controller/UserController.java`:

```java
package com.example.springdatajpatutorial.controller;

import com.example.springdatajpatutorial.entity.User;
import com.example.springdatajpatutorial.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Create user
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.ok(created);
    }

    // Get all users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(updated);
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Test with curl

Restart application and test endpoints:

**Create user**:

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "age": 30
  }'
```

**Expected response**:

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "age": 30,
  "createdAt": "2026-01-29T10:30:45",
  "updatedAt": "2026-01-29T10:30:45"
}
```

**Get all users**:

```bash
curl http://localhost:8080/api/users
```

**Get user by ID**:

```bash
curl http://localhost:8080/api/users/1
```

**Update user**:

```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice.updated@example.com",
    "age": 31
  }'
```

**Delete user**:

```bash
curl -X DELETE http://localhost:8080/api/users/1
```

## Common JPA Annotations

Master essential JPA annotations for entity mapping.

### Entity Mapping

```java
@Entity                         // Marks class as JPA entity
@Table(name = "users")         // Custom table name
public class User {
    @Id                         // Primary key
    @GeneratedValue            // Auto-generated value
    private Long id;
}
```

### Column Mapping

```java
@Column(
    name = "user_name",        // Custom column name
    nullable = false,          // NOT NULL constraint
    unique = true,             // UNIQUE constraint
    length = 50,               // VARCHAR(50)
    columnDefinition = "TEXT"  // Custom SQL type
)
private String username;
```

### Relationships

```java
// One-to-Many
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
private List<Post> posts;

// Many-to-One
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private User user;

// Many-to-Many
@ManyToMany
@JoinTable(
    name = "user_roles",
    joinColumns = @JoinColumn(name = "user_id"),
    inverseJoinColumns = @JoinColumn(name = "role_id")
)
private Set<Role> roles;
```

### Lifecycle Callbacks

```java
@PrePersist    // Before insert
@PostPersist   // After insert
@PreUpdate     // Before update
@PostUpdate    // After update
@PreRemove     // Before delete
@PostRemove    // After delete
```

## Next Steps

You now have Spring Data JPA installed and working. Here's what to learn next:

1. **[Quick Start](/en/learn/software-engineering/data/tools/spring-data-jpa/quick-start)** - Build a complete application with relationships, queries, and transactions (5-30% coverage)
2. **[By-Example Tutorial](/en/learn/software-engineering/data/tools/spring-data-jpa/by-example)** - Learn through annotated examples covering 95% of Spring Data JPA
3. **[Spring Data JPA Documentation](https://spring.io/projects/spring-data-jpa)** - Comprehensive reference and guides

## Summary

In this initial setup tutorial, you learned how to:

1. Create Spring Boot project with Spring Data JPA dependencies
2. Configure database connection in application.properties
3. Define JPA entity with annotations (@Entity, @Table, @Column)
4. Create repository interface extending JpaRepository
5. Implement service layer for business logic
6. Create REST controller for HTTP endpoints
7. Execute basic CRUD operations (create, read, update, delete)

You're now ready to explore Spring Data JPA's powerful features: relationships, custom queries, specifications, and transactions. Continue to the Quick Start tutorial to build a real application.

## Common Issues and Solutions

### Application Fails to Start

**Problem**: Spring Boot fails with bean creation errors

**Solutions**:

1. Verify Java 17+ is installed: `java -version`
2. Clean and rebuild: `mvn clean install`
3. Check for typos in `application.properties`
4. Ensure database driver dependency matches datasource URL

### Table Not Created

**Problem**: Entity class doesn't create database table

**Solutions**:

1. Verify `@Entity` annotation on class
2. Check `spring.jpa.hibernate.ddl-auto=update` in properties
3. Ensure entity package is scanned by Spring Boot
4. Check logs for Hibernate DDL statements

### Repository Methods Not Working

**Problem**: Custom query methods return empty or fail

**Solutions**:

1. Verify method naming follows Spring Data conventions
2. Check entity field names match method names exactly
3. Use `@Query` annotation for complex queries
4. Enable SQL logging: `spring.jpa.show-sql=true`

### Connection Refused

**Problem**: Can't connect to database

**Solutions**:

1. Verify database server is running
2. Check hostname/port in `spring.datasource.url`
3. Verify credentials (username/password)
4. For H2, use in-memory database: `jdbc:h2:mem:testdb`

## Additional Resources

- [Spring Data JPA Documentation](https://spring.io/projects/spring-data-jpa)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Hibernate Documentation](https://hibernate.org/orm/documentation/)
- [Baeldung Spring Data JPA](https://www.baeldung.com/spring-data-jpa-tutorial)
- [Spring Guides](https://spring.io/guides)
