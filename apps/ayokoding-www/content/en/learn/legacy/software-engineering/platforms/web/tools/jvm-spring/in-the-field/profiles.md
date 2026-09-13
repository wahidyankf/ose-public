---
title: "Profiles"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000014
description: "Environment-specific configuration with @Profile, spring.profiles.active, and application-{profile}.properties"
tags: ["spring", "in-the-field", "production", "profiles", "environment"]
---

## Why Profiles Matter

Production applications run in multiple environments: development (local machine), staging (pre-production testing), production (live system). Each environment requires different configuration: in-memory databases for dev, PostgreSQL for production, mock services for testing, real APIs for production. Spring Profiles enable environment-specific bean registration and configuration without code changes.

## Java Standard Library Baseline

Manual environment handling requires conditional logic everywhere:

```java
// => Environment-aware database factory
public class DatabaseFactory {

    // => Environment detection: reads system property
    private static final String ENV = System.getProperty("env", "dev");

    public static DataSource createDataSource() {
        // => Conditional logic: choose database by environment
        if ("dev".equals(ENV)) {
            // => Development: in-memory H2 database
            // => Fast startup, no persistence, easy testing
            System.out.println("Creating H2 in-memory database");
            return new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2)
                .build();
        } else if ("staging".equals(ENV)) {
            // => Staging: shared PostgreSQL for team testing
            System.out.println("Creating staging PostgreSQL database");
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl("jdbc:postgresql://<staging-db>/zakat");
            config.setUsername("staging_user");
            config.setPassword("staging_pass");
            config.setMaximumPoolSize(5);  // => 5 connections: staging load
            return new HikariDataSource(config);
        } else if ("prod".equals(ENV)) {
            // => Production: dedicated PostgreSQL cluster
            System.out.println("Creating production PostgreSQL database");
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl("jdbc:postgresql://<prod-db-cluster>/zakat");
            config.setUsername("prod_user");
            config.setPassword("prod_pass");
            config.setMaximumPoolSize(50);  // => 50 connections: production load
            config.setConnectionTimeout(30000);  // => 30s timeout
            return new HikariDataSource(config);
        } else {
            throw new IllegalStateException("Unknown environment: " + ENV);
        }
    }
}

// => Email service factory: environment-specific implementations
public class EmailServiceFactory {

    private static final String ENV = System.getProperty("env", "dev");

    public static EmailService createEmailService() {
        // => Conditional logic: mock for dev, real for prod
        if ("dev".equals(ENV)) {
            // => Development: console output, no real emails
            System.out.println("Using console email service");
            return new ConsoleEmailService();
        } else if ("prod".equals(ENV)) {
            // => Production: SMTP server, real emails
            System.out.println("Using SMTP email service");
            return new SmtpEmailService("smtp.gmail.com", 587);
        } else {
            throw new IllegalStateException("Unknown environment: " + ENV);
        }
    }
}

// => Application: manual factory calls
public class Application {
    public static void main(String[] args) {
        // => Must manually call factory for each environment-aware bean
        DataSource dataSource = DatabaseFactory.createDataSource();
        EmailService emailService = EmailServiceFactory.createEmailService();

        // => Use beans...
    }
}

// => Run with environment:
// java -Denv=dev Application     (development)
// java -Denv=staging Application (staging)
// java -Denv=prod Application    (production)
```

**Limitations:**

- **Scattered logic**: if/else in every factory method
- **Error-prone**: Easy to forget environment check
- **Hard to maintain**: Add environment = update all factories
- **No validation**: Misspell "prod" → runtime error
- **Coupling**: Application code knows all environments

## Spring Profiles

Spring Profiles enable declarative environment-specific configuration:

```java
// => Configuration class: profile-specific beans
@Configuration  // => Configuration class
public class DatabaseConfig {

    // => Development profile: in-memory database
    @Bean
    @Profile("dev")  // => Only active when "dev" profile enabled
                     // => Spring skips this bean in other profiles
    public DataSource devDataSource() {
        // => H2: in-memory database for development
        System.out.println("Creating H2 in-memory database");
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .addScript("classpath:schema.sql")  // => Load schema
            .addScript("classpath:test-data.sql")  // => Load test data
            .build();
    }

    // => Staging profile: shared PostgreSQL
    @Bean
    @Profile("staging")  // => Only active when "staging" profile enabled
    public DataSource stagingDataSource() {
        System.out.println("Creating staging PostgreSQL database");
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://<staging-db>/zakat");
        config.setUsername("staging_user");
        config.setPassword("staging_pass");
        config.setMaximumPoolSize(5);
        return new HikariDataSource(config);
    }

    // => Production profile: production PostgreSQL
    @Bean
    @Profile("prod")  // => Only active when "prod" profile enabled
    public DataSource prodDataSource() {
        System.out.println("Creating production PostgreSQL database");
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://<prod-db-cluster>/zakat");
        config.setUsername("prod_user");
        config.setPassword("prod_pass");
        config.setMaximumPoolSize(50);
        config.setConnectionTimeout(30000);
        return new HikariDataSource(config);
    }
}

// => Email service: profile-specific implementations
@Configuration
public class EmailConfig {

    @Bean
    @Profile("dev")  // => Development: mock email service
    public EmailService devEmailService() {
        System.out.println("Using console email service");
        return new ConsoleEmailService();
    }

    @Bean
    @Profile({"staging", "prod"})  // => Staging + Production: real SMTP
                                    // => Multiple profiles: OR logic
    public EmailService smtpEmailService() {
        System.out.println("Using SMTP email service");
        return new SmtpEmailService("smtp.gmail.com", 587);
    }
}

// => Application: Spring activates profile-specific beans
public class Application {
    public static void main(String[] args) {
        // => Creates Spring container with active profile
        ApplicationContext context =
            new AnnotationConfigApplicationContext(DatabaseConfig.class, EmailConfig.class);

        // => Spring registers only beans matching active profile
        // => dev profile: devDataSource + devEmailService
        // => prod profile: prodDataSource + smtpEmailService

        DataSource dataSource = context.getBean(DataSource.class);
        EmailService emailService = context.getBean(EmailService.class);
    }
}

// => Activate profile via system property:
// java -Dspring.profiles.active=dev -jar app.jar
// java -Dspring.profiles.active=staging -jar app.jar
// java -Dspring.profiles.active=prod -jar app.jar
```

**Benefits:**

- **Declarative**: @Profile annotation, no if/else
- **Clean separation**: Each environment = separate bean
- **Type-safe**: Compile-time validation (no typos)
- **Centralized**: Single place to activate profile
- **Testable**: Easy to activate test profile in unit tests

## Profile Activation

### Via System Property

```java
// => Command line activation
// java -Dspring.profiles.active=dev -jar app.jar
// java -Dspring.profiles.active=prod -jar app.jar

// => Multiple profiles: comma-separated
// java -Dspring.profiles.active=prod,aws -jar app.jar
```

### Via Environment Variable

```bash
# => Export environment variable
export SPRING_PROFILES_ACTIVE=prod

# => Run application
java -jar app.jar
```

### Via application.properties

```properties
# => application.properties: default profile
spring.profiles.active=dev
```

### Programmatic Activation

```java
// => Programmatically set active profile
public class Application {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ApplicationConfig.class);
        // => Sets active profile before context creation
        app.setAdditionalProfiles("dev");
        app.run(args);
    }
}
```

### In Tests

```java
// => Test with specific profile
@SpringBootTest
@ActiveProfiles("test")  // => Activates "test" profile for this test
public class ZakatServiceTest {

    @Autowired
    private ZakatService zakatService;  // => Injected with test beans

    @Test
    void testCalculateZakat() {
        // => Uses test profile beans (mock database, etc.)
    }
}
```

## Profile-Specific Configuration Files

Spring loads profile-specific properties files:

```
src/main/resources/
├── application.properties           # => Common properties (all profiles)
├── application-dev.properties       # => Development overrides
├── application-staging.properties   # => Staging overrides
└── application-prod.properties      # => Production overrides
```

**application.properties** (common):

```properties
# => Common configuration (all environments)
app.name=ZakatCalculator
zakat.nisab.gold=85
zakat.nisab.silver=595
```

**application-dev.properties** (development):

```properties
# => Development overrides
spring.datasource.url=jdbc:h2:mem:testdb
logging.level.root=DEBUG  # => Verbose logging for development
```

**application-staging.properties** (staging):

```properties
# => Staging overrides
spring.datasource.url=jdbc:postgresql://${DB_HOST:staging-db}:5432/zakat
spring.datasource.username=staging_user
spring.datasource.password=staging_pass
logging.level.root=INFO
```

**application-prod.properties** (production):

```properties
# => Production overrides
spring.datasource.url=jdbc:postgresql://${DB_HOST:prod-db-cluster}:5432/zakat
spring.datasource.username=prod_user
spring.datasource.password=${DB_PASSWORD}  # => From environment variable
logging.level.root=WARN  # => Minimal logging for production
```

**Loading order:**

1. application.properties (base)
2. application-{profile}.properties (overrides base)
3. System properties (overrides everything)

## Profile Expressions

Advanced profile logic with expressions:

```java
// => NOT operator: exclude profile
@Bean
@Profile("!dev")  // => Active in all profiles EXCEPT dev
public EmailService productionEmailService() {
    return new SmtpEmailService("smtp.gmail.com", 587);
}

// => AND operator: multiple profiles required
@Bean
@Profile("prod & aws")  // => Active only when BOTH prod AND aws active
public CloudStorageService awsStorageService() {
    return new S3StorageService();
}

// => OR operator: any profile matches
@Bean
@Profile("dev | test")  // => Active when dev OR test profile active
public DataSource inMemoryDataSource() {
    return new EmbeddedDatabaseBuilder()
        .setType(EmbeddedDatabaseType.H2)
        .build();
}

// => Complex expression
@Bean
@Profile("(prod | staging) & aws")  // => (prod OR staging) AND aws
public CloudService awsCloudService() {
    return new AwsCloudService();
}
```

## Progression Diagram

```mermaid
graph LR
    A[Manual if/else<br/>System.getProperty] -->|Declarative| B[@Profile Beans<br/>Annotation-based]
    B -->|File-based| C[app-{profile}.properties<br/>External Config]

    A -->|Scattered Logic| D[Hard to Maintain]
    B -->|Centralized| E[Easy to Maintain]
    C -->|Zero Code Changes| F[Deploy-time Config]

    style A fill:#DE8F05,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#0173B2,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#029E73,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#0173B2,stroke:#333,stroke-width:2px,color:#fff
```

## Production Patterns

### Multi-Profile Beans

```java
// => Bean active in multiple profiles
@Configuration
public class CachingConfig {

    @Bean
    @Profile({"staging", "prod"})  // => Active in staging OR prod
    public CacheManager cacheManager() {
        // => Real cache: Redis for staging/prod
        return new RedisCacheManager();
    }

    @Bean
    @Profile("dev")  // => Active in dev only
    public CacheManager devCacheManager() {
        // => No-op cache: no caching overhead in development
        return new NoOpCacheManager();
    }
}
```

### Default Profile

```java
// => Configuration with default profile
@Configuration
public class DatabaseConfig {

    @Bean
    @Profile("default")  // => Active when NO profile specified
    public DataSource defaultDataSource() {
        // => Fallback: in-memory database
        System.out.println("Using default profile (no profile specified)");
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }

    @Bean
    @Profile("prod")
    public DataSource prodDataSource() {
        return new HikariDataSource();
    }
}

// => Set default profile in application.properties
// spring.profiles.default=dev
```

### Profile Groups

```java
// => Configuration with profile groups
@Configuration
public class AppConfig {

    @Bean
    @Profile("cloud")  // => Cloud profile group
    public CloudService cloudService() {
        return new AwsCloudService();
    }

    @Bean
    @Profile("messaging")  // => Messaging profile group
    public MessageService messageService() {
        return new KafkaMessageService();
    }
}

// => Activate profile groups in application.properties
// spring.profiles.group.prod=cloud,messaging,monitoring
// spring.profiles.active=prod
// => Activates: prod, cloud, messaging, monitoring
```

### Component-Level Profiles

```java
// => Component with profile
@Component
@Profile("prod")  // => Component only in production
public class ProductionScheduler {

    @Scheduled(cron = "0 0 2 * * *")  // => Runs at 2 AM daily
    public void generateReports() {
        // => Production-only scheduled task
    }
}

// => Service with profile
@Service
@Profile("dev")  // => Service only in development
public class DevDataSeeder {

    @PostConstruct
    public void seedData() {
        // => Seeds test data in development
    }
}
```

### Conditional on Profile

```java
// => Custom condition based on profile
@Component
@Conditional(OnProductionProfile.class)
public class ProductionMonitoring {
    // => Complex profile logic via custom condition
}

public class OnProductionProfile implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String[] activeProfiles = context.getEnvironment().getActiveProfiles();
        // => Custom logic: prod profile + AWS environment
        return Arrays.asList(activeProfiles).contains("prod")
            && System.getenv("AWS_REGION") != null;
    }
}
```

## Trade-offs and When to Use

| Approach           | Maintenance | Flexibility | Type Safety | Externalization |
| ------------------ | ----------- | ----------- | ----------- | --------------- |
| Manual if/else     | Hard        | High        | Low         | None            |
| @Profile Beans     | Easy        | Medium      | High        | Medium          |
| Profile Properties | Very Easy   | High        | High        | High            |

**When to Use Manual if/else:**

- Simple scripts without Spring
- Single environment deployment
- Learning conditional logic patterns

**When to Use @Profile Beans:**

- Complex initialization logic per environment
- Need different bean implementations
- Type-safe environment-specific beans

**When to Use Profile Properties:**

- Configuration values (URLs, credentials, timeouts)
- No code changes between environments
- Externalized configuration preference

## Best Practices

**1. Use Profiles for Environment Separation**

```java
// => PREFER: profiles for environments
@Bean
@Profile("dev")
public DataSource devDataSource() { /* ... */ }

@Bean
@Profile("prod")
public DataSource prodDataSource() { /* ... */ }
```

**2. Externalize Configuration**

```java
// => AVOID: hardcoded values in code
@Bean
@Profile("prod")
public DataSource prodDataSource() {
    config.setJdbcUrl("jdbc:postgresql://<prod-db>/zakat");
    config.setPassword("hardcoded");  // => DANGER!
}

// => PREFER: externalized in application-prod.properties
@Bean
@Profile("prod")
public DataSource prodDataSource(
        @Value("${spring.datasource.url}") String url,
        @Value("${spring.datasource.password}") String password) {
    config.setJdbcUrl(url);
    config.setPassword(password);
}
```

**3. Use Profile Groups for Complex Deployments**

```properties
# => application.properties
spring.profiles.group.prod-aws=prod,aws,monitoring,caching
spring.profiles.group.prod-azure=prod,azure,monitoring,caching
```

**4. Default Profile for Safety**

```properties
# => application.properties: safe default
spring.profiles.default=dev
```

**5. Validate Profile Activation**

```java
@Component
public class ProfileValidator {

    @Autowired
    private Environment environment;

    @PostConstruct
    public void validateProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            throw new IllegalStateException("No active profile! Set spring.profiles.active");
        }
        System.out.println("Active profiles: " + Arrays.toString(activeProfiles));
    }
}
```

## See Also

- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Java config patterns
- [Property Sources](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/property-sources) - External configuration
- [Bean Lifecycle](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/bean-lifecycle) - Initialization hooks
- [Component Scanning](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/component-scanning) - Auto-discovery
