---
title: "Property Sources"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000015
description: "External configuration with @Value, @PropertySource, Environment abstraction, and placeholder resolution"
tags: ["spring", "in-the-field", "production", "properties", "configuration"]
---

## Why Property Sources Matter

Production applications require external configuration: database URLs change across environments, API keys must be secured, timeouts must be tunable without redeployment. Hardcoded values make applications brittle and insecure. Spring's property sources enable externalized, environment-specific configuration with type-safe injection and hierarchical overrides.

## Java Standard Library Baseline

Manual property management requires explicit file reading:

```java
// => Configuration loader: manual property file reading
public class ConfigLoader {

    private Properties properties;  // => Stores loaded properties

    // => Loads properties from file
    public ConfigLoader(String filename) {
        properties = new Properties();

        try (InputStream input = getClass().getClassLoader()
                .getResourceAsStream(filename)) {
            // => Reads properties file from classpath
            if (input == null) {
                throw new IOException("Unable to find " + filename);
            }
            properties.load(input);  // => Loads into Properties object
            System.out.println("Loaded configuration from: " + filename);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load configuration", e);
        }
    }

    // => Gets property value by key
    public String getProperty(String key) {
        return properties.getProperty(key);
    }

    // => Gets property with default value
    public String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }

    // => Type conversion: manual parsing
    public int getIntProperty(String key, int defaultValue) {
        String value = properties.getProperty(key);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);  // => Manual conversion
        } catch (NumberFormatException e) {
            System.err.println("Invalid integer for key: " + key);
            return defaultValue;
        }
    }
}

// => Database configuration class
public class DatabaseConfig {

    private final String url;
    private final String username;
    private final String password;
    private final int maxConnections;

    // => Constructor: loads properties and creates config
    public DatabaseConfig(ConfigLoader loader) {
        // => Manual property reading for each field
        this.url = loader.getProperty("db.url", "jdbc:h2:mem:testdb");
        this.username = loader.getProperty("db.username", "admin");
        this.password = loader.getProperty("db.password", "secret");
        this.maxConnections = loader.getIntProperty("db.max.connections", 10);
    }

    public DataSource createDataSource() {
        // => Manual DataSource creation with loaded properties
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(maxConnections);
        return new HikariDataSource(config);
    }
}

// => Application: manual property loading
public class Application {
    public static void main(String[] args) {
        // => Loads properties file explicitly
        ConfigLoader loader = new ConfigLoader("application.properties");

        // => Creates config from properties
        DatabaseConfig dbConfig = new DatabaseConfig(loader);
        DataSource dataSource = dbConfig.createDataSource();

        // => Use data source...
    }
}
```

**application.properties**:

```properties
db.url=jdbc:postgresql://${DB_HOST:localhost}:5432/zakat
db.username=admin
db.password=secret
db.max.connections=20
```

**Limitations:**

- **Manual loading**: Must explicitly load each properties file
- **No hierarchy**: Can't override properties (dev vs prod)
- **Type conversion**: Manual parsing for int, boolean, etc.
- **Error handling**: Missing properties = runtime errors
- **No validation**: Invalid values discovered at runtime
- **Scattered usage**: Properties accessed throughout codebase

## Spring @Value Injection

Spring's @Value annotation injects properties directly into fields/parameters:

```java
// => Configuration class with @Value injection
@Configuration
@PropertySource("classpath:application.properties")
// => Loads properties file into Spring Environment
// => Makes properties available for @Value injection
public class DatabaseConfig {

    // => Field injection: reads db.url property
    @Value("${db.url}")  // => Placeholder: ${property.key}
                         // => Spring resolves from loaded properties
    private String url;

    @Value("${db.username}")  // => Injects db.username
    private String username;

    @Value("${db.password}")  // => Injects db.password
    private String password;

    @Value("${db.max.connections:10}")  // => Default value: :10
                                        // => If db.max.connections missing, uses 10
    private int maxConnections;

    @Bean  // => Creates DataSource bean with injected properties
    public DataSource dataSource() {
        // => Properties already injected by Spring
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);  // => Uses injected value
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(maxConnections);
        return new HikariDataSource(config);
    }
}

// => Service with @Value injection
@Service
public class ZakatService {

    @Value("${zakat.nisab.gold}")  // => Injects zakat.nisab.gold
    private BigDecimal goldNisab;

    @Value("${zakat.nisab.silver:595}")  // => Injects with default
    private BigDecimal silverNisab;

    public BigDecimal calculateZakat(BigDecimal goldGrams) {
        // => Uses injected property value
        if (goldGrams.compareTo(goldNisab) >= 0) {
            return goldGrams.multiply(new BigDecimal("0.025"));
        }
        return BigDecimal.ZERO;
    }
}

// => Application: Spring loads and injects properties
public class Application {
    public static void main(String[] args) {
        // => Creates Spring container
        ApplicationContext context =
            new AnnotationConfigApplicationContext(DatabaseConfig.class);

        // => Spring automatically:
        // 1. Loads application.properties via @PropertySource
        // 2. Resolves ${...} placeholders
        // 3. Injects values into @Value-annotated fields

        DataSource dataSource = context.getBean(DataSource.class);
        // => DataSource configured with injected properties
    }
}
```

**Benefits:**

- **Automatic loading**: @PropertySource loads properties
- **Type conversion**: Spring converts String to int, boolean, BigDecimal
- **Default values**: `:defaultValue` syntax for missing properties
- **Centralized**: Properties in external file, not code

## Spring Environment Abstraction

Environment provides programmatic access to properties:

```java
@Configuration
@PropertySource("classpath:application.properties")
public class AppConfig {

    @Autowired
    private Environment environment;  // => Spring's property resolver

    @Bean
    public DataSource dataSource() {
        // => Programmatic property access
        String url = environment.getProperty("db.url");  // => Returns String or null
        String username = environment.getProperty("db.username");
        String password = environment.getProperty("db.password");

        // => Type-safe property access with default
        int maxConnections = environment.getProperty("db.max.connections", Integer.class, 10);
        // => Converts to Integer automatically
        // => Returns 10 if property missing or invalid

        // => Required property: throws if missing
        String requiredUrl = environment.getRequiredProperty("db.url");
        // => IllegalStateException if db.url not found

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(maxConnections);
        return new HikariDataSource(config);
    }

    @Bean
    public ZakatCalculator zakatCalculator() {
        // => Check if property exists
        if (environment.containsProperty("zakat.custom.rate")) {
            BigDecimal customRate = environment.getProperty("zakat.custom.rate", BigDecimal.class);
            return new ZakatCalculator(customRate);
        }
        // => Use default
        return new ZakatCalculator(new BigDecimal("0.025"));
    }
}
```

## Property Hierarchy and Overrides

Spring loads properties from multiple sources with precedence:

```
1. System properties (java -Ddb.url=...)           ← Highest priority
2. Environment variables (DB_URL=...)
3. application-{profile}.properties
4. application.properties
5. @PropertySource files                           ← Lowest priority
```

**Example files:**

**application.properties** (base):

```properties
# => Base configuration (all environments)
app.name=ZakatCalculator
zakat.nisab.gold=85
zakat.nisab.silver=595
db.url=jdbc:h2:mem:testdb
db.username=admin
db.password=secret
db.max.connections=10
```

**application-prod.properties** (production overrides):

```properties
# => Production overrides
db.url=jdbc:postgresql://${DB_HOST:prod-db}:5432/zakat
db.username=prod_user
db.password=${DB_PASSWORD}  # => From environment variable
db.max.connections=50       # => Overrides base value
```

**application-dev.properties** (development overrides):

```properties
# => Development overrides
db.url=jdbc:h2:mem:devdb
logging.level.root=DEBUG
```

**Resolution example:**

```java
@Configuration
public class AppConfig {

    @Autowired
    private Environment env;

    @PostConstruct
    public void showProperties() {
        // => With profile "prod" and DB_PASSWORD env var:
        System.out.println(env.getProperty("app.name"));
        // => "ZakatCalculator" (from application.properties)

        System.out.println(env.getProperty("db.url"));
        // => "jdbc:postgresql://<host>:<port>/<database>" resolved to prod-db:5432/zakat (from application-prod.properties)

        System.out.println(env.getProperty("db.password"));
        // => Value of DB_PASSWORD environment variable (resolved placeholder)

        System.out.println(env.getProperty("db.max.connections"));
        // => "50" (from application-prod.properties, overrides base)
    }
}
```

## Type-Safe Configuration Properties

@ConfigurationProperties provides structured, type-safe property binding:

```java
// => Configuration properties class: type-safe property group
@ConfigurationProperties(prefix = "zakat")
// => Binds properties with prefix "zakat"
// => zakat.nisab.gold → nisab.gold field
@Component  // => Registers as Spring bean
public class ZakatProperties {

    private NisabConfig nisab;  // => Nested property group
    private RateConfig rate;

    // => Nested configuration: zakat.nisab.*
    public static class NisabConfig {
        private BigDecimal gold;     // => zakat.nisab.gold
        private BigDecimal silver;   // => zakat.nisab.silver

        // => Getters/setters for property binding
        public BigDecimal getGold() { return gold; }
        public void setGold(BigDecimal gold) { this.gold = gold; }
        public BigDecimal getSilver() { return silver; }
        public void setSilver(BigDecimal silver) { this.silver = silver; }
    }

    // => Nested configuration: zakat.rate.*
    public static class RateConfig {
        private BigDecimal general;  // => zakat.rate.general

        public BigDecimal getGeneral() { return general; }
        public void setGeneral(BigDecimal general) { this.general = general; }
    }

    // => Getters/setters for nested objects
    public NisabConfig getNisab() { return nisab; }
    public void setNisab(NisabConfig nisab) { this.nisab = nisab; }
    public RateConfig getRate() { return rate; }
    public void setRate(RateConfig rate) { this.rate = rate; }
}

// => Service using configuration properties
@Service
public class ZakatCalculator {

    private final ZakatProperties properties;  // => Injected properties

    // => Constructor injection: Spring injects bound properties
    public ZakatCalculator(ZakatProperties properties) {
        this.properties = properties;
    }

    public BigDecimal calculateZakat(BigDecimal goldGrams) {
        // => Type-safe property access: properties.getNisab().getGold()
        BigDecimal nisab = properties.getNisab().getGold();
        BigDecimal rate = properties.getRate().getGeneral();

        if (goldGrams.compareTo(nisab) >= 0) {
            return goldGrams.multiply(rate);
        }
        return BigDecimal.ZERO;
    }
}
```

**application.properties**:

```properties
zakat.nisab.gold=85
zakat.nisab.silver=595
zakat.rate.general=0.025
```

**Benefits:**

- **Type-safe**: IDE autocomplete, compile-time validation
- **Structured**: Nested properties, clear hierarchy
- **Validation**: Can use @Valid + JSR-303 annotations
- **Refactor-safe**: Rename field = IDE updates usage

## Progression Diagram

```mermaid
graph TD
    A[Manual Properties<br/>Properties.load] -->|Auto Injection| B[@Value<br/>Placeholder Resolution]
    B -->|Programmatic Access| C[Environment<br/>Abstraction]
    C -->|Type-Safe| D[@ConfigurationProperties<br/>Structured Binding]

    A -->|Manual Parsing| E[Error-Prone]
    B -->|String-based| F[Refactor Risk]
    D -->|Type-Safe| G[IDE Support]

    style A fill:#DE8F05,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#0173B2,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#0173B2,stroke:#333,stroke-width:2px,color:#fff
```

## Production Patterns

### Externalizing Secrets

```java
@Configuration
@PropertySource("classpath:application.properties")
public class SecurityConfig {

    @Value("${jwt.secret}")  // => Read from environment variable
    private String jwtSecret;

    @Value("${db.password}")  // => Never hardcode passwords
    private String dbPassword;

    @Bean
    public JwtTokenProvider tokenProvider() {
        // => jwtSecret loaded from external source
        return new JwtTokenProvider(jwtSecret);
    }
}
```

**application.properties**:

```properties
# => Use placeholders for secrets
jwt.secret=${JWT_SECRET}        # => From environment variable
db.password=${DB_PASSWORD}      # => From environment variable
```

**Set environment variables:**

```bash
export JWT_SECRET=super-secret-key-change-in-prod
export DB_PASSWORD=db-secret-password
```

### Profile-Specific Properties

```java
@Configuration
@PropertySource("classpath:application.properties")
@PropertySource(value = "classpath:application-${spring.profiles.active}.properties", ignoreResourceNotFound = true)
// => Loads profile-specific properties if available
// => ignoreResourceNotFound: doesn't fail if file missing
public class AppConfig {

    @Value("${db.url}")
    private String dbUrl;  // => Overridden by profile-specific file
}
```

### Property Validation

```java
@ConfigurationProperties(prefix = "zakat")
@Validated  // => Enable validation
@Component
public class ZakatProperties {

    @NotNull  // => Property required
    @Min(1)   // => Minimum value: 1
    private BigDecimal nisabGold;

    @NotBlank  // => String not blank
    @Pattern(regexp = "^0\\.\\d{3}$")  // => Format: 0.025
    private String rate;

    // => Spring validates at startup
    // => Application fails to start if validation fails

    // Getters/setters...
}
```

### Placeholder Resolution in Annotations

```java
@Configuration
public class CachingConfig {

    @Bean
    public CacheManager cacheManager(
            @Value("${cache.ttl:3600}") int ttl,  // => TTL from properties
            @Value("${cache.max.size:1000}") int maxSize) {

        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(ttl, TimeUnit.SECONDS)  // => Configurable TTL
            .maximumSize(maxSize));  // => Configurable max size
        return cacheManager;
    }
}
```

### YAML Configuration

Spring also supports YAML format:

**application.yml**:

```yaml
zakat:
  nisab:
    gold: 85
    silver: 595
  rate:
    general: 0.025

db:
  url: jdbc:postgresql://${DB_HOST:localhost}:5432/zakat
  username: admin
  password: ${DB_PASSWORD}
  max:
    connections: 20

spring:
  profiles:
    active: dev
```

**YAML benefits:**

- Hierarchical structure (less repetition)
- Lists and complex objects
- Better readability for nested config

## Trade-offs and When to Use

| Approach                 | Type Safety | Validation | Refactoring | Complexity |
| ------------------------ | ----------- | ---------- | ----------- | ---------- |
| Manual Properties        | Low         | None       | Hard        | Low        |
| @Value                   | Medium      | None       | Hard        | Low        |
| Environment              | Medium      | Manual     | Easy        | Medium     |
| @ConfigurationProperties | High        | Automatic  | Easy        | Medium     |

**When to Use Manual Properties:**

- Simple scripts without Spring
- One-time configuration reading
- Learning Java I/O

**When to Use @Value:**

- Single property injection
- Simple types (String, int, boolean)
- Ad-hoc configuration needs

**When to Use Environment:**

- Programmatic property access
- Conditional logic based on properties
- Dynamic property resolution

**When to Use @ConfigurationProperties:**

- Structured configuration (nested objects)
- Type-safe property groups
- Need validation
- Large configuration sets

## Best Practices

**1. Externalize All Configuration**

```java
// => AVOID: hardcoded values
@Bean
public DataSource dataSource() {
    config.setJdbcUrl("jdbc:postgresql:zakat");  // => DANGER!
}

// => PREFER: externalized properties
@Bean
public DataSource dataSource(@Value("${db.url}") String url) {
    config.setJdbcUrl(url);
}
```

**2. Use @ConfigurationProperties for Groups**

```java
// => AVOID: scattered @Value
@Value("${db.url}") String dbUrl;
@Value("${db.username}") String dbUsername;
@Value("${db.password}") String dbPassword;
@Value("${db.max.connections}") int dbMaxConnections;

// => PREFER: grouped properties
@ConfigurationProperties(prefix = "db")
public class DatabaseProperties {
    private String url;
    private String username;
    private String password;
    private int maxConnections;
}
```

**3. Provide Defaults**

```java
// => Always provide sensible defaults
@Value("${cache.ttl:3600}")  // => 1 hour default
private int cacheTtl;

@Value("${thread.pool.size:10}")  // => 10 threads default
private int threadPoolSize;
```

**4. Never Commit Secrets**

```properties
# => AVOID: secrets in application.properties
db.password=actual-password  # => Committed to git!

# => PREFER: placeholder for environment variable
db.password=${DB_PASSWORD}  # => Resolved at runtime
```

**5. Validate Critical Properties**

```java
@ConfigurationProperties(prefix = "app")
@Validated
public class AppProperties {

    @NotBlank  // => Required
    private String name;

    @Min(1) @Max(100)  // => Range validation
    private int maxConnections;
}
```

## See Also

- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Java config patterns
- [Profiles](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/profiles) - Environment-specific config
- [Bean Lifecycle](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/bean-lifecycle) - Property injection timing
- Spring Security - Secret management
