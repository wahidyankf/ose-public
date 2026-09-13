---
title: "Best Practices"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 1000001
description: "Boot-specific production patterns: starter dependencies, auto-configuration, application.properties, Spring Boot Actuator"
tags: ["spring-boot", "in-the-field", "production", "best-practices"]
---

## Why Boot-Specific Practices Matter

Spring Boot's "batteries included" philosophy introduces new patterns beyond Spring Framework—starter dependencies, auto-configuration, externalized configuration, and production-ready features. Following Boot-specific best practices prevents common mistakes like over-reliance on auto-configuration, misconfigured starters, and production monitoring gaps.

## Starter Dependency Patterns

### Choose Minimal Starters

**Avoid kitchen-sink dependencies:**

```xml
<!-- BAD: Includes unnecessary dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <!-- => Base starter: includes logging, auto-configuration, YAML support -->
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- => Web starter: includes spring-boot-starter + web + embedded Tomcat + Jackson -->
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- => Data JPA: includes spring-boot-starter + JPA + Hibernate + JDBC -->
</dependency>
<!-- 3 starters = 50+ transitive dependencies -->
```

**Use specific starters:**

```xml
<!-- GOOD: Only what you need -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- => Includes: spring-boot-starter (base) + web + Tomcat + Jackson -->
    <!-- => Transitively includes logging, auto-config, YAML -->
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- => Includes: spring-boot-starter (base) + JPA + Hibernate + HikariCP -->
</dependency>
<!-- 2 starters, overlapping dependencies deduplicated by Maven -->
```

### Exclude Unused Transitive Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- => Exclude Tomcat if using Jetty/Undertow -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- => Use Jetty instead of Tomcat -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
    <!-- => Boot auto-configures Jetty when Tomcat excluded -->
</dependency>
```

**Benefits:**

- Smaller application JAR (fewer dependencies)
- Reduced classpath scanning time (faster startup)
- Fewer potential security vulnerabilities
- Clearer dependency tree

## Auto-Configuration Patterns

### Understand @SpringBootApplication

```java
// => @SpringBootApplication is shorthand for three annotations
@SpringBootApplication  // => @Configuration + @EnableAutoConfiguration + @ComponentScan
public class Application {
    // => @Configuration: Marks class as bean definition source
    // => @EnableAutoConfiguration: Triggers auto-config based on classpath
    // => @ComponentScan: Scans current package + subpackages for @Component/@Service/@Repository
}

// => Equivalent explicit configuration:
@Configuration  // => Bean definitions
@EnableAutoConfiguration  // => Auto-config
@ComponentScan(basePackages = "com.example")  // => Component scanning
public class Application {
}
```

**Customizing component scanning:**

```java
@SpringBootApplication(scanBasePackages = {
    "com.example.zakat",  // => Scan zakat service package
    "com.example.shared"  // => Scan shared utilities
})  // => Limits scanning scope (faster startup)
public class ZakatApplication {
}
```

### Exclude Auto-Configuration Classes

```java
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,  // => Disable auto-configured DataSource
    HibernateJpaAutoConfiguration.class  // => Disable auto-configured JPA
})  // => Use when manually configuring these components
public class Application {

    @Bean  // => Manual DataSource configuration
    public DataSource dataSource() {
        // => Spring Boot won't create default DataSource
        // => Your custom bean takes precedence
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://<prod-db>/zakat");
        config.setMaximumPoolSize(50);
        return new HikariDataSource(config);
    }
}
```

**Why exclude:**

- Custom connection pooling configuration
- Using multiple data sources (requires manual configuration)
- Non-standard database setup (e.g., R2DBC, custom drivers)

### Use @ConditionalOnProperty for Feature Flags

```java
@Configuration
public class CachingConfig {

    @Bean
    @ConditionalOnProperty(
        name = "app.caching.enabled",  // => Property key to check
        havingValue = "true",  // => Required value
        matchIfMissing = false  // => Default if property missing (disabled)
    )  // => Bean only created if app.caching.enabled=true
    public CacheManager cacheManager() {
        return new CaffeineCacheManager("zakatCalculations");
        // => Conditional bean: only exists when caching enabled
    }
}
```

**application-prod.properties:**

```properties
app.caching.enabled=true  # Enable caching in production
```

**application-dev.properties:**

```properties
app.caching.enabled=false  # Disable caching in development
```

## Configuration Best Practices

### Use application.yml for Hierarchical Config

**application.yml (preferred for complex config):**

```yaml
# => YAML: cleaner for nested properties
server:
  port: 8080 # => server.port
  servlet:
    context-path: /api # => server.servlet.context-path
  tomcat:
    threads:
      max: 200 # => server.tomcat.threads.max
      min-spare: 10 # => server.tomcat.threads.min-spare

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}/zakat # => spring.datasource.url
    username: zakat_user # => spring.datasource.username
    password: ${DB_PASSWORD} # => Environment variable substitution
    hikari:
      maximum-pool-size: 50 # => spring.datasource.hikari.maximum-pool-size
      minimum-idle: 10 # => spring.datasource.hikari.minimum-idle

logging:
  level:
    com.example.zakat: DEBUG # => Package-specific logging
    org.springframework: INFO # => Framework logging
```

**application.properties (acceptable for simple config):**

```properties
# => Properties file: flatter structure
server.port=8080
server.servlet.context-path=/api
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}/zakat
spring.datasource.username=zakat_user
```

**When to use which:**

- YAML: Complex hierarchical config, multiple profiles, better readability
- Properties: Simple config, legacy codebases, IDE auto-completion support

### Profile-Specific Configuration

**File structure:**

```
src/main/resources/
├── application.yml              # => Base config (all profiles)
├── application-dev.yml          # => Development overrides
├── application-staging.yml      # => Staging overrides
└── application-prod.yml         # => Production overrides
```

**application.yml (base):**

```yaml
# => Shared across all profiles
spring:
  application:
    name: zakat-service # => Service name (same everywhere)

app:
  zakat:
    nisab-threshold: 85 # => Business logic (same everywhere)
```

**application-prod.yml:**

```yaml
# => Production-specific overrides
server:
  port: 8080
  tomcat:
    threads:
      max: 200 # => Production threading

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:prod-db.example.com}/zakat # => Production database
    hikari:
      maximum-pool-size: 50 # => Production pool size

logging:
  level:
    com.example.zakat: INFO # => Production log level (less verbose)
```

**application-dev.yml:**

```yaml
# => Development overrides
server:
  port: 8080
  tomcat:
    threads:
      max: 10 # => Development: fewer threads

spring:
  datasource:
    url: jdbc:h2:mem:zakatdb # => Development: in-memory database
    hikari:
      maximum-pool-size: 5 # => Development: small pool

logging:
  level:
    com.example.zakat: DEBUG # => Development: verbose logging
```

**Activating profiles:**

```bash
# Via command line
java -jar zakat-service.jar --spring.profiles.active=prod

# Via environment variable
export SPRING_PROFILES_ACTIVE=prod
java -jar zakat-service.jar

# Via application.yml
spring:
  profiles:
    active: dev  # => Default profile if none specified
```

### Externalize Secrets

**AVOID hardcoding secrets:**

```yaml
# BAD: Secrets in application.yml
spring:
  datasource:
    username: prod_user
    password: MySecretPassword123 # => NEVER commit secrets to Git
```

**USE environment variables:**

```yaml
# GOOD: Reference environment variables
spring:
  datasource:
    username: ${DB_USERNAME} # => Loaded from environment
    password: ${DB_PASSWORD} # => Loaded from environment
```

**Set via environment:**

```bash
export DB_USERNAME=prod_user
export DB_PASSWORD=SecurePasswordFromVault
java -jar zakat-service.jar
```

**Or use Spring Cloud Config Server / HashiCorp Vault:**

```yaml
spring:
  cloud:
    config:
      uri: https://config-server.example.com # => Central config management
  config:
    import: vault://secret/zakat-service # => Secrets from Vault
```

### Use @ConfigurationProperties for Type-Safe Config

**application.yml:**

```yaml
app:
  zakat:
    nisab-threshold: 85 # => Grams of gold
    zakat-percentage: 0.025 # => 2.5%
    currencies:
      - USD
      - EUR
      - IDR
```

**Configuration class:**

```java
@Configuration
@ConfigurationProperties(prefix = "app.zakat")  // => Binds properties with app.zakat prefix
public class ZakatProperties {
    // => Spring Boot automatically maps app.zakat.nisab-threshold to this field
    // => Supports validation (@Min, @Max, @NotNull)
    private BigDecimal nisabThreshold;  // => Type-safe: BigDecimal instead of String

    // => Maps to app.zakat.zakat-percentage
    private BigDecimal zakatPercentage;

    // => Maps to app.zakat.currencies list
    private List<String> currencies;

    // Getters and setters
    public BigDecimal getNisabThreshold() {
        return nisabThreshold;
    }

    public void setNisabThreshold(BigDecimal nisabThreshold) {
        this.nisabThreshold = nisabThreshold;
    }

    public BigDecimal getZakatPercentage() {
        return zakatPercentage;
    }

    public void setZakatPercentage(BigDecimal zakatPercentage) {
        this.zakatPercentage = zakatPercentage;
    }

    public List<String> getCurrencies() {
        return currencies;
    }

    public void setCurrencies(List<String> currencies) {
        this.currencies = currencies;
    }
}

// => Usage in service
@Service
public class ZakatService {
    private final ZakatProperties properties;

    public ZakatService(ZakatProperties properties) {
        this.properties = properties;  // => Injected by Spring Boot
    }

    public BigDecimal calculateZakat(BigDecimal goldGrams) {
        // => Type-safe access to configuration
        if (goldGrams.compareTo(properties.getNisabThreshold()) >= 0) {
            return goldGrams.multiply(properties.getZakatPercentage());
        }
        return BigDecimal.ZERO;
    }
}
```

**Benefits:**

- Type-safe configuration (compile-time checking)
- Validation support (`@Validated`, JSR-303 annotations)
- IDE auto-completion for properties
- Centralized configuration model

## Spring Boot Actuator Best Practices

### Enable Production Endpoints

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <!-- => Production features: health checks, metrics, info -->
</dependency>
```

**application-prod.yml:**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info # => Expose specific endpoints
        # => NEVER expose all: include: "*" (security risk)
  endpoint:
    health:
      show-details: when-authorized # => Hide details from unauthenticated users
      # => Prevents leaking internal system information
  metrics:
    export:
      prometheus:
        enabled: true # => Enable Prometheus metrics export
```

### Add Custom Health Indicators

```java
@Component
public class ZakatServiceHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public ZakatServiceHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        // => Custom health check: verify database connectivity
        try (Connection conn = dataSource.getConnection()) {
            // => Attempts database connection
            boolean isValid = conn.isValid(5);  // => 5 second timeout
            if (isValid) {
                return Health.up()  // => Healthy
                    .withDetail("database", "operational")
                    .withDetail("connection-pool", "available")
                    .build();
            } else {
                return Health.down()  // => Unhealthy
                    .withDetail("database", "connection timeout")
                    .build();
            }
        } catch (SQLException e) {
            // => Exception: service unhealthy
            return Health.down()
                .withDetail("database", "unavailable")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

**Health endpoint response:**

```json
{
  "status": "UP",
  "components": {
    "zakatService": {
      "status": "UP",
      "details": {
        "database": "operational",
        "connection-pool": "available"
      }
    }
  }
}
```

### Custom Metrics

```java
@Service
public class ZakatService {
    private final MeterRegistry meterRegistry;
    private final Counter zakatCalculations;

    public ZakatService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        // => Create custom counter metric
        this.zakatCalculations = Counter.builder("zakat.calculations.total")
            .description("Total zakat calculations performed")
            .tag("service", "zakat")  // => Tag for filtering in metrics system
            .register(meterRegistry);
    }

    public BigDecimal calculateZakat(BigDecimal goldGrams) {
        zakatCalculations.increment();  // => Increment counter on each calculation
        // => Calculation logic...
        return BigDecimal.ZERO;
    }
}
```

**Metrics endpoint response (Prometheus format):**

```
# HELP zakat_calculations_total Total zakat calculations performed
# TYPE zakat_calculations_total counter
zakat_calculations_total{service="zakat",} 12547.0
```

## Application Lifecycle

### Use CommandLineRunner for Startup Tasks

```java
@Component
public class DataInitializer implements CommandLineRunner {

    private final ZakatRepository zakatRepository;

    public DataInitializer(ZakatRepository zakatRepository) {
        this.zakatRepository = zakatRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // => Runs AFTER Spring Boot completes startup
        // => All beans initialized and ready
        if (zakatRepository.count() == 0) {
            // => Seed database with initial data
            zakatRepository.save(new ZakatRecord(/* ... */));
            System.out.println("Database seeded with initial zakat records");
        }
    }
}
```

### Graceful Shutdown

```yaml
server:
  shutdown: graceful # => Wait for active requests to complete before shutdown

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # => Maximum wait time for shutdown
```

```java
@Component
public class GracefulShutdownHandler {

    @PreDestroy  // => Called during application shutdown
    public void cleanup() {
        // => Close connections, flush caches, complete pending tasks
        System.out.println("Performing graceful shutdown...");
    }
}
```

## See Also

- [Spring Boot Anti-Patterns](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/anti-patterns) - Common mistakes
- [Spring Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Spring Framework config patterns
- [Spring Best Practices](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/best-practices) - Foundation patterns
- [Spring Boot Actuator Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html) - Official documentation
