---
title: "Anti Patterns"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 1000002
description: "Common Spring Boot mistakes: over-reliance on auto-config, @SpringBootApplication misuse, disabling auto-config incorrectly, property configuration anti-patterns"
tags: ["spring-boot", "in-the-field", "production", "anti-patterns"]
---

## Why Anti-Patterns Matter

Spring Boot's "convention over configuration" approach enables rapid development but introduces new failure modes when developers misunderstand auto-configuration, abuse starter dependencies, or misconfigure profiles. Recognizing these anti-patterns prevents production incidents, debugging nightmares, and performance degradation.

## Over-Reliance on Auto-Configuration

### Anti-Pattern: Treating Auto-Configuration as Magic

**Problem:**

```java
@SpringBootApplication  // => Developer assumes "it just works" without understanding what Boot configures
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // => No understanding of:
        // => - Which beans Boot creates automatically
        // => - When auto-configuration triggers
        // => - How to override defaults
    }
}

// => Application runs in development, fails in production
// => Reason: Different classpath, different auto-configuration decisions
```

**Production Failure Scenario:**

```
Development: H2 database on classpath → Boot auto-configures H2 DataSource
Production: PostgreSQL driver added → Boot auto-configures PostgreSQL, but no connection properties set
Result: Application starts but fails on first database access
```

**Solution: Understand Auto-Configuration Conditions**

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        // => Enable debug logging to see auto-configuration decisions
        SpringApplication app = new SpringApplication(Application.class);
        app.setLogStartupInfo(true);  // => Logs all auto-configured beans
        app.run(args);
    }

    // => Explicitly configure critical beans (don't rely solely on auto-config)
    @Bean
    @ConditionalOnMissingBean  // => Only create if Boot didn't auto-configure
    public DataSource dataSource() {
        // => Explicit configuration: clear what happens in all environments
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql:zakat");
        config.setUsername("zakat_user");
        config.setPassword("password");
        return new HikariDataSource(config);
    }
}
```

**application.properties:**

```properties
# => Enable auto-configuration report
debug=true
# => Shows:
# => - Positive matches: auto-configurations that applied
# => - Negative matches: auto-configurations that didn't apply (with reasons)
# => - Exclusions: auto-configurations explicitly excluded
```

**Best Practice:**

- Run with `debug=true` in development to understand Boot's decisions
- Explicitly configure production-critical beans (database, security)
- Document assumptions about classpath dependencies

## @SpringBootApplication Misuse

### Anti-Pattern: Placing @SpringBootApplication in Root Package

**Problem:**

```java
// File: src/main/java/Application.java (root package!)
@SpringBootApplication  // => Scans ENTIRE classpath (root package = all packages)
                        // => Includes third-party libraries if in root
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // => Slow startup: scanning thousands of classes
        // => Potential conflicts: third-party @Component classes registered as beans
    }
}
```

**Consequence:**

```
Startup time: 45 seconds (scanning 10,000+ classes)
Memory usage: 500MB (unnecessary bean registrations)
Conflicts: Third-party library @Component classes registered as beans
```

**Solution: Use Package Structure**

```java
// File: src/main/java/com/example/zakat/Application.java
package com.example.zakat;  // => Clear package boundary

@SpringBootApplication  // => Scans com.example.zakat and subpackages only
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// Project structure:
// com.example.zakat           (Application.java here)
// ├── controller              (@RestController classes)
// ├── service                 (@Service classes)
// ├── repository              (@Repository classes)
// └── config                  (@Configuration classes)
```

**Result:**

```
Startup time: 8 seconds (scanning 150 relevant classes)
Memory usage: 120MB (only necessary beans)
No conflicts: Third-party libraries not scanned
```

### Anti-Pattern: Multiple @SpringBootApplication Classes

**Problem:**

```java
// File: com/example/zakat/ZakatApplication.java
@SpringBootApplication
public class ZakatApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZakatApplication.class, args);
    }
}

// File: com/example/zakat/TestApplication.java
@SpringBootApplication  // => SECOND @SpringBootApplication in same package hierarchy
public class TestApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestApplication.class, args);
    }
}

// => Both applications scan same packages
// => Unpredictable component registration
// => Tests may load wrong application context
```

**Solution: One Main Application, Test Configurations**

```java
// Main application
@SpringBootApplication
public class ZakatApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZakatApplication.class, args);
    }
}

// Test configuration (NOT @SpringBootApplication)
@TestConfiguration  // => Test-specific beans only
public class TestConfig {

    @Bean
    @Primary  // => Overrides production bean for tests
    public DataSource testDataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();  // => In-memory database for tests
    }
}

// Test class
@SpringBootTest  // => Loads ZakatApplication context
@Import(TestConfig.class)  // => Adds test-specific beans
class ZakatServiceTest {
    // => Uses main application configuration + test overrides
}
```

## Disabling Auto-Configuration Incorrectly

### Anti-Pattern: Excluding Too Much

**Problem:**

```java
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,  // => Excludes DataSource
    HibernateJpaAutoConfiguration.class,  // => Excludes JPA
    TransactionAutoConfiguration.class,  // => Excludes transactions
    JdbcTemplateAutoConfiguration.class  // => Excludes JDBC template
})  // => Must now manually configure ALL these components
public class Application {
    // => Developer wanted to customize DataSource
    // => Accidentally disabled ALL data access auto-configuration
}
```

**Consequence:**

```java
@Service
public class ZakatService {
    @Autowired
    private JdbcTemplate jdbcTemplate;  // => Bean not found!
                                        // => JdbcTemplateAutoConfiguration excluded
}

// Error: No qualifying bean of type 'JdbcTemplate' available
```

**Solution: Exclude Minimally, Override Specifically**

```java
@SpringBootApplication  // => Let Boot auto-configure MOST things
public class Application {

    // => Override specific bean instead of excluding entire auto-configuration
    @Bean
    @Primary  // => Takes precedence over Boot's auto-configured DataSource
    public DataSource dataSource() {
        // => Custom DataSource: Boot's auto-configuration backs off
        // => Other data access components still auto-configured
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql:zakat");
        config.setMaximumPoolSize(50);  // => Custom pool size
        return new HikariDataSource(config);
    }

    // => JdbcTemplate, TransactionManager, etc. still auto-configured
    // => Use custom DataSource automatically
}
```

**When to Exclude:**

- **Multiple data sources**: Exclude `DataSourceAutoConfiguration`, manually configure all
- **Custom persistence**: Using MyBatis instead of JPA → exclude JPA auto-config
- **No database**: Exclude all data-related auto-configs

### Anti-Pattern: Fighting Auto-Configuration

**Problem:**

```java
@SpringBootApplication(exclude = WebMvcAutoConfiguration.class)  // => Disabled Web MVC
public class Application {

    @Bean  // => Manually recreating what Boot already provides
    public RequestMappingHandlerMapping requestMappingHandlerMapping() {
        return new RequestMappingHandlerMapping();
    }

    @Bean  // => Recreating Jackson configuration
    public MappingJackson2HttpMessageConverter messageConverter() {
        return new MappingJackson2HttpMessageConverter();
    }

    @Bean  // => Recreating view resolver
    public ViewResolver viewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
    // => 50+ more beans to manually configure...
}
```

**Solution: Customize via Properties**

```yaml
# application.yml: Configure Boot's auto-configured components
spring:
  mvc:
    view:
      prefix: /WEB-INF/views/ # => Customizes view resolver
      suffix: .jsp # => Boot's auto-configuration uses these values
  jackson:
    serialization:
      indent-output: true # => Customizes Jackson (already auto-configured)
    date-format: yyyy-MM-dd # => Date format

server:
  servlet:
    context-path: /api # => Context path for servlet container
```

**Principle: Customize, Don't Replace**

Use Boot's auto-configuration, customize via properties. Only exclude when fundamentally incompatible.

## Property Configuration Anti-Patterns

### Anti-Pattern: Hardcoding Environment-Specific Values

**Problem:**

```java
@Configuration
public class DataConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://<prod-db.example.com>/zakat");  // => Hard-coded production URL
        config.setUsername("prod_user");  // => Hard-coded credentials
        config.setPassword("SecretPassword123");  // => SECURITY VIOLATION: password in code
        config.setMaximumPoolSize(50);  // => Hard-coded production pool size
        return new HikariDataSource(config);
    }
}

// => Cannot run in development (prod database required)
// => Cannot change password without recompiling
// => Password visible in Git history
```

**Solution: Externalize All Environment-Specific Config**

```yaml
# application.yml: No environment-specific values
spring:
  datasource:
    url: ${DB_URL}  # => Environment variable
    username: ${DB_USERNAME}  # => Environment variable
    password: ${DB_PASSWORD}  # => Environment variable (secret)
    hikari:
      maximum-pool-size: ${DB_POOL_SIZE:10}  # => Default 10 if not set

# application-prod.yml: Production defaults (still overridable)
spring:
  datasource:
    hikari:
      maximum-pool-size: 50  # => Production default (can be overridden by env var)

# application-dev.yml: Development defaults
spring:
  datasource:
    url: jdbc:h2:mem:zakatdb  # => Development: in-memory database
    hikari:
      maximum-pool-size: 5  # => Development: small pool
```

**Setting environment variables:**

```bash
# Production environment
export DB_URL=jdbc:postgresql://${DB_HOST:-prod-db.example.com}/zakat
export DB_USERNAME=prod_user
export DB_PASSWORD=$(vault read -field=password secret/zakat/db)  # From Vault
export DB_POOL_SIZE=50
export SPRING_PROFILES_ACTIVE=prod

java -jar zakat-service.jar
```

### Anti-Pattern: Duplicating Properties Across Profile Files

**Problem:**

```yaml
# application-dev.yml
server:
  port: 8080  # => Duplicated
spring:
  application:
    name: zakat-service  # => Duplicated
  datasource:
    url: jdbc:h2:mem:zakatdb
logging:
  level:
    com.example.zakat: DEBUG

# application-staging.yml
server:
  port: 8080  # => Duplicated
spring:
  application:
    name: zakat-service  # => Duplicated
  datasource:
    url: jdbc:postgresql://${DB_HOST:staging-db}/zakat
logging:
  level:
    com.example.zakat: INFO

# application-prod.yml
server:
  port: 8080  # => Duplicated (3 times!)
spring:
  application:
    name: zakat-service  # => Duplicated (3 times!)
  datasource:
    url: jdbc:postgresql://${DB_HOST:prod-db}/zakat
logging:
  level:
    com.example.zakat: INFO
```

**Solution: Base Config + Profile Overrides**

```yaml
# application.yml: Shared across ALL profiles
server:
  port: 8080  # => Default port (single source of truth)

spring:
  application:
    name: zakat-service  # => Same in all environments

# application-dev.yml: ONLY dev-specific overrides
spring:
  datasource:
    url: jdbc:h2:mem:zakatdb  # => Only what differs from base

logging:
  level:
    com.example.zakat: DEBUG  # => Verbose logging for development

# application-prod.yml: ONLY prod-specific overrides
spring:
  datasource:
    url: ${DB_URL}  # => Only what differs from base

logging:
  level:
    com.example.zakat: INFO  # => Less verbose for production
```

### Anti-Pattern: Ignoring Property Precedence

**Problem:**

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:zakatdb  # => Developer expects this

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:prod-db}/zakat  # => Production override

# Command line
java -jar zakat-service.jar --spring.datasource.url=jdbc:postgresql://${DB_HOST:-staging-db}/zakat

# Developer confused: "Why isn't it using application-prod.yml?"
# => Answer: Command-line arguments override property files
```

**Solution: Understand Property Precedence (Highest to Lowest)**

1. Command-line arguments: `--spring.datasource.url=...`
2. Java system properties: `-Dspring.datasource.url=...`
3. OS environment variables: `SPRING_DATASOURCE_URL=...`
4. Profile-specific properties: `application-{profile}.yml`
5. Base properties: `application.yml`

**Use precedence intentionally:**

```yaml
# application-prod.yml: Production defaults
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:prod-db}/zakat  # => Default for prod profile
    hikari:
      maximum-pool-size: 50

# Override at runtime for specific scenarios:
java -jar zakat-service.jar \
  --spring.profiles.active=prod \
  --spring.datasource.url=jdbc:postgresql://${DB_HOST:-prod-db-replica}/zakat  # => Override default
```

## Starter Dependency Anti-Patterns

### Anti-Pattern: Including Conflicting Starters

**Problem:**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- => Includes Tomcat embedded server -->
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
        <!-- => Includes Reactor Netty server -->
        <!-- => CONFLICT: Cannot run both servlet (Tomcat) and reactive (Netty) -->
    </dependency>
</dependencies>
```

**Consequence:**

```
Application startup failure:
Both 'webflux' and 'web' starters detected
Cannot run both servlet and reactive stacks simultaneously
```

**Solution: Choose One Web Stack**

```xml
<!-- Servlet stack (Spring MVC + Tomcat) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- OR -->

<!-- Reactive stack (WebFlux + Netty) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<!-- NOT both! -->
```

### Anti-Pattern: Not Excluding Transitive Dependencies

**Problem:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
    <!-- => Includes Logback (Boot's default) -->
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
    <!-- => Includes Log4j2 -->
    <!-- => CONFLICT: Both logging frameworks on classpath -->
</dependency>
```

**Consequence:**

```
Multiple SLF4J bindings detected:
- Logback (from spring-boot-starter-logging)
- Log4j2 (from spring-boot-starter-log4j2)
Result: Unpredictable logging behavior
```

**Solution: Exclude Default Logging**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- => Exclude Boot's default Logback dependency -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
    <!-- => Now Log4j2 is ONLY logging framework -->
</dependency>
```

## See Also

- [Spring Boot Best Practices](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/best-practices) - Correct patterns
- [Spring Anti-Patterns](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/anti-patterns) - Foundation anti-patterns
- [Spring Boot Auto-Configuration Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.auto-configuration) - Understanding auto-config
- [Spring Boot Properties Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html) - All configuration properties
