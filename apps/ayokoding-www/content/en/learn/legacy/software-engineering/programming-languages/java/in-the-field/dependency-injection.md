---
title: "Dependency Injection"
date: 2026-02-03T00:00:00+07:00
draft: false
description: Master dependency injection from manual patterns to Spring Framework, building testable, flexible applications
weight: 10000010
tags: ["java", "dependency-injection", "spring", "cdi", "jsr-330", "di"]
---

## Why Dependency Injection Matters

Dependency Injection (DI) is a design pattern that provides objects with their dependencies from outside rather than creating dependencies internally. This fundamental technique enables testability, flexibility, and maintainable architecture.

**Core benefits:**

- **Testability**: Replace real dependencies with mocks in tests
- **Flexibility**: Swap implementations without changing code
- **Decoupling**: Classes don't know about concrete dependencies
- **Configuration centralization**: Wire dependencies in one place
- **Reusability**: Components work with any compatible dependency

**Problem**: Tightly coupled code creates dependencies that are hard to test, change, or reuse.

**Solution**: Inject dependencies from outside, enabling flexible, testable designs that respect the Dependency Inversion Principle.

This guide progresses from manual patterns using only the standard library to framework-based solutions with JSR-330, Spring, and CDI.

## Manual Dependency Injection (Standard Library)

Start with manual DI using only Java standard library features to understand the fundamental patterns before introducing frameworks.

### Constructor Injection Pattern

Constructor injection provides dependencies when creating objects, ensuring complete initialization and enabling immutability.

```java
// SERVICE INTERFACE
public interface NotificationService {
    void send(String recipient, String message);
}

// CONCRETE IMPLEMENTATION
public class EmailService implements NotificationService {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email to " + recipient + ": " + message);
        // => Would connect to SMTP server in real implementation
    }
}

// CLIENT WITH CONSTRUCTOR INJECTION
public class UserRegistration {
    private final NotificationService notificationService;  // => Final ensures immutability

    // => CONSTRUCTOR INJECTION: Dependency provided from outside
    public UserRegistration(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void registerUser(String email, String username) {
        // Business logic
        System.out.println("Registering user: " + username);

        // => Use injected dependency
        notificationService.send(email, "Welcome, " + username + "!");
    }
}

// MANUAL WIRING
public class Application {
    public static void main(String[] args) {
        // => Create dependency
        NotificationService emailService = new EmailService();

        // => Inject dependency through constructor
        UserRegistration registration = new UserRegistration(emailService);

        // => Use configured object
        registration.registerUser("user@example.com", "john");
        // => Output: Registering user: john
        // => Output: Email to user@example.com: Welcome, john!
    }
}
```

**Benefits:**

- Dependencies explicit in constructor signature
- Immutability via final fields
- Impossible to create incomplete objects
- Easy to test (inject mocks)

### Interface-Based Dependencies

Program to interfaces, not implementations, enabling flexible substitution.

```java
// REPOSITORY INTERFACE
public interface UserRepository {
    void save(User user);
    Optional<User> findByEmail(String email);
}

// IN-MEMORY IMPLEMENTATION (for testing)
public class InMemoryUserRepository implements UserRepository {
    private final Map<String, User> users = new HashMap<>();  // => Simple storage

    @Override
    public void save(User user) {
        users.put(user.email(), user);  // => Store in map
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return Optional.ofNullable(users.get(email));  // => Lookup from map
    }
}

// DATABASE IMPLEMENTATION (for production)
public class DatabaseUserRepository implements UserRepository {
    private final DataSource dataSource;  // => JDBC connection pool

    public DatabaseUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(User user) {
        // => Execute INSERT SQL
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "INSERT INTO users (email, name) VALUES (?, ?)")) {

            stmt.setString(1, user.email());
            stmt.setString(2, user.name());
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save user", e);
        }
    }

    @Override
    public Optional<User> findByEmail(String email) {
        // => Execute SELECT SQL
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT email, name FROM users WHERE email = ?")) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new User(
                        rs.getString("email"),
                        rs.getString("name")
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find user", e);
        }
        return Optional.empty();
    }
}

// SERVICE USING INTERFACE
public class UserService {
    private final UserRepository repository;  // => Depends on interface, not implementation

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public void createUser(String email, String name) {
        User user = new User(email, name);
        repository.save(user);  // => Works with ANY UserRepository implementation
    }
}

// CONFIGURATION
public class Application {
    public static void main(String[] args) {
        // PRODUCTION: Use database
        DataSource dataSource = createDataSource();
        UserRepository repository = new DatabaseUserRepository(dataSource);

        // TESTING: Use in-memory
        // UserRepository repository = new InMemoryUserRepository();

        UserService service = new UserService(repository);
        service.createUser("test@example.com", "Test User");
    }

    private static DataSource createDataSource() {
        // => Configure connection pool (HikariCP, etc.)
        return null;  // Placeholder
    }
}
```

**Benefits:**

- Swap implementations without changing UserService
- Test with in-memory implementation (fast, no database)
- Production uses database implementation

### Factory Pattern for Object Creation

Factories centralize object creation and dependency wiring.

```java
// SIMPLE FACTORY
public class ServiceFactory {
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ServiceFactory() {
        // => Create shared dependencies once
        this.userRepository = new InMemoryUserRepository();
        this.notificationService = new EmailService();
    }

    public UserRegistration createUserRegistration() {
        // => Wire dependencies
        return new UserRegistration(notificationService);
    }

    public UserService createUserService() {
        // => Wire dependencies
        return new UserService(userRepository);
    }
}

// USAGE
public class Application {
    public static void main(String[] args) {
        ServiceFactory factory = new ServiceFactory();  // => Single factory

        UserRegistration registration = factory.createUserRegistration();
        UserService userService = factory.createUserService();

        // => Use services
        registration.registerUser("test@example.com", "john");
    }
}
```

**Benefits:**

- Centralized dependency configuration
- Consistent object creation
- Easy to change wiring

### Service Locator Pattern (Anti-Pattern)

Service Locator hides dependencies and creates tight coupling. Avoid this pattern.

```java
// SERVICE LOCATOR (ANTI-PATTERN)
public class ServiceLocator {
    private static final Map<Class<?>, Object> services = new HashMap<>();

    public static <T> void register(Class<T> serviceClass, T implementation) {
        services.put(serviceClass, implementation);  // => Register service
    }

    public static <T> T get(Class<T> serviceClass) {
        return serviceClass.cast(services.get(serviceClass));  // => Retrieve service
    }
}

// CLIENT USING SERVICE LOCATOR (BAD)
public class UserRegistrationBad {
    public void registerUser(String email, String username) {
        // => HIDDEN DEPENDENCY: NotificationService not visible in constructor
        NotificationService service = ServiceLocator.get(NotificationService.class);
        service.send(email, "Welcome!");
    }
}

// SETUP
public class Application {
    public static void main(String[] args) {
        // => Global registration
        ServiceLocator.register(NotificationService.class, new EmailService());

        UserRegistrationBad registration = new UserRegistrationBad();
        registration.registerUser("test@example.com", "john");
    }
}
```

**Why Service Locator is an anti-pattern:**

- **Hidden dependencies**: Can't see what UserRegistrationBad needs
- **Hard to test**: Must configure global state before testing
- **Runtime failures**: Missing services cause NullPointerException
- **Tight coupling**: Code depends on ServiceLocator infrastructure

**Prefer constructor injection**: Dependencies explicit, testable, no global state.

### Why Manual DI Becomes Complex

Manual dependency injection works for small applications but becomes problematic as systems grow.

**Challenges:**

| Problem             | Impact                                       | Example                                     |
| ------------------- | -------------------------------------------- | ------------------------------------------- |
| **Wiring overhead** | Must manually create and wire all objects    | 50 classes = 50 manual instantiations       |
| **Configuration**   | Hard to manage different environments        | Test vs production vs staging configuration |
| **Lifecycle**       | Managing singletons vs per-request instances | When to create, when to destroy             |
| **Circular deps**   | Manual resolution of A → B → A               | UserService ↔ AuditService                  |
| **Aspect concerns** | Cross-cutting logic (logging, transactions)  | Add logging to all service methods          |

**Solution**: DI frameworks automate wiring, manage lifecycles, and provide advanced features.

## JSR-330 (Standard - javax.inject / jakarta.inject)

JSR-330 defines standard annotations for dependency injection across frameworks. Use these annotations for framework-agnostic code.

### @Inject Annotation

Mark injection points with @Inject (constructor, field, or method).

```java
import jakarta.inject.Inject;  // => Standard DI annotation

public class UserService {
    private final UserRepository repository;  // => Dependency

    @Inject  // => Mark constructor for injection
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public void createUser(String email, String name) {
        repository.save(new User(email, name));
    }
}
```

**Note**: Use `jakarta.inject` (Jakarta EE 9+) or `javax.inject` (older versions). Jakarta is the modern standard.

### @Named and @Qualifier

Disambiguate multiple implementations with @Named or custom qualifiers.

```java
import jakarta.inject.Inject;
import jakarta.inject.Named;

// MULTIPLE IMPLEMENTATIONS
public class EmailNotificationService implements NotificationService {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email: " + message);
    }
}

public class SmsNotificationService implements NotificationService {
    @Override
    public void send(String recipient, String message) {
        System.out.println("SMS: " + message);
    }
}

// DISAMBIGUATE WITH @Named
public class UserRegistration {
    private final NotificationService emailService;
    private final NotificationService smsService;

    @Inject
    public UserRegistration(
        @Named("email") NotificationService emailService,  // => Inject "email" implementation
        @Named("sms") NotificationService smsService       // => Inject "sms" implementation
    ) {
        this.emailService = emailService;
        this.smsService = smsService;
    }

    public void registerUser(String email, String phone) {
        emailService.send(email, "Welcome!");
        smsService.send(phone, "Account created");
    }
}
```

### Provider\<T> for Lazy Initialization

Use Provider\<T> to delay object creation until needed.

```java
import jakarta.inject.Inject;
import jakarta.inject.Provider;

public class ReportGenerator {
    private final Provider<ExpensiveResource> resourceProvider;  // => Lazy provider

    @Inject
    public ReportGenerator(Provider<ExpensiveResource> resourceProvider) {
        this.resourceProvider = resourceProvider;
    }

    public void generateReport() {
        // => Resource created only when get() called
        ExpensiveResource resource = resourceProvider.get();
        resource.generateData();
    }
}

// EXPENSIVE RESOURCE (created only when needed)
public class ExpensiveResource {
    public ExpensiveResource() {
        System.out.println("Creating expensive resource...");  // => Delayed until needed
    }

    public void generateData() {
        System.out.println("Generating data...");
    }
}
```

**Benefits:**

- Delay creation until actually needed
- Avoid circular dependencies
- Create multiple instances on demand

### Singleton Scope (@Singleton)

Mark classes as singletons to share one instance across application.

```java
import jakarta.inject.Inject;
import jakarta.inject.Singleton;

@Singleton  // => One instance shared by all clients
public class ConfigurationService {
    private final Map<String, String> config = new HashMap<>();

    public ConfigurationService() {
        // => Load configuration once
        config.put("app.name", "MyApp");
        config.put("app.version", "1.0");
    }

    public String get(String key) {
        return config.get(key);
    }
}

// BOTH SERVICES SHARE SAME ConfigurationService INSTANCE
public class ServiceA {
    @Inject
    public ServiceA(ConfigurationService config) {
        // => Same instance as ServiceB receives
    }
}

public class ServiceB {
    @Inject
    public ServiceB(ConfigurationService config) {
        // => Same instance as ServiceA receives
    }
}
```

### Standard Annotations Only (No Implementation)

JSR-330 provides annotations but not the implementation. You need a DI container:

- **Spring Framework** (most popular)
- **CDI** (Jakarta EE standard)
- **Guice** (Google's lightweight DI)
- **Dagger** (compile-time DI for Android)

```java
// JSR-330 annotations work with ANY compatible container
import jakarta.inject.Inject;
import jakarta.inject.Singleton;

@Singleton
public class MyService {
    @Inject
    public MyService(Dependency dependency) {
        // => Spring, CDI, Guice all understand these annotations
    }
}
```

**Benefits:**

- Write once, run anywhere (any JSR-330 container)
- No vendor lock-in
- Standard annotations across projects

## Spring Dependency Injection

Spring Framework provides comprehensive DI with extensive features for enterprise applications.

### Component Scanning (@Component, @Service, @Repository)

Mark classes for automatic discovery and registration.

```java
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Repository;

// GENERIC COMPONENT
@Component  // => Spring discovers and creates instance
public class EmailValidator {
    public boolean isValid(String email) {
        return email.contains("@");
    }
}

// SERVICE LAYER (business logic)
@Service  // => @Component specialized for services
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public void createUser(String email, String name) {
        repository.save(new User(email, name));
    }
}

// REPOSITORY LAYER (data access)
@Repository  // => @Component specialized for persistence
public class UserRepository {
    public void save(User user) {
        // Database operations
    }
}
```

**Annotation purposes:**

| Annotation  | Purpose                     | Layer         |
| ----------- | --------------------------- | ------------- |
| @Component  | Generic Spring-managed bean | Any           |
| @Service    | Business logic              | Service layer |
| @Repository | Data access                 | Data layer    |
| @Controller | Web controllers             | Web layer     |

### @Autowired (Field, Constructor, Setter Injection)

Mark injection points with @Autowired (Spring-specific, but supports JSR-330 @Inject too).

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    // FIELD INJECTION (NOT RECOMMENDED - see constructor injection)
    @Autowired
    private PaymentService paymentService;

    // SETTER INJECTION (for optional dependencies)
    private NotificationService notificationService;

    @Autowired(required = false)  // => Optional dependency
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void processOrder(Order order) {
        paymentService.process(order);
        if (notificationService != null) {
            notificationService.send(order.customerEmail(), "Order processed");
        }
    }
}
```

### Constructor Injection (Recommended Approach)

Prefer constructor injection for required dependencies (immutability, testability, clarity).

```java
import org.springframework.stereotype.Service;

@Service
public class UserRegistration {
    private final UserRepository repository;          // => Final = immutable
    private final NotificationService notification;   // => Final = immutable
    private final EmailValidator validator;           // => Final = immutable

    // CONSTRUCTOR INJECTION (RECOMMENDED)
    // => No @Autowired needed in Spring 4.3+ for single constructor
    public UserRegistration(UserRepository repository,
                           NotificationService notification,
                           EmailValidator validator) {
        this.repository = repository;
        this.notification = notification;
        this.validator = validator;
    }

    public void registerUser(String email, String name) {
        if (!validator.isValid(email)) {
            throw new IllegalArgumentException("Invalid email");
        }

        User user = new User(email, name);
        repository.save(user);
        notification.send(email, "Welcome!");
    }
}
```

**Why constructor injection is recommended:**

- **Immutability**: Final fields prevent accidental changes
- **Testability**: Easy to pass mocks in tests
- **Required dependencies**: Impossible to create incomplete objects
- **No Spring dependency**: Constructor works without Spring annotations

**Testing example:**

```java
@Test
void testRegisterUser() {
    // => Create mocks
    UserRepository mockRepo = mock(UserRepository.class);
    NotificationService mockNotif = mock(NotificationService.class);
    EmailValidator mockValidator = mock(EmailValidator.class);

    // => Inject mocks via constructor (no Spring needed)
    UserRegistration registration = new UserRegistration(
        mockRepo, mockNotif, mockValidator
    );

    // => Configure mock behavior
    when(mockValidator.isValid(anyString())).thenReturn(true);

    // => Test
    registration.registerUser("test@example.com", "John");

    // => Verify interactions
    verify(mockRepo).save(any(User.class));
    verify(mockNotif).send(eq("test@example.com"), anyString());
}
```

### @Qualifier for Disambiguation

Use @Qualifier when multiple beans of same type exist.

```java
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

// MULTIPLE IMPLEMENTATIONS
@Component
@Qualifier("email")  // => Tag with "email"
public class EmailNotificationService implements NotificationService {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email: " + message);
    }
}

@Component
@Qualifier("sms")  // => Tag with "sms"
public class SmsNotificationService implements NotificationService {
    @Override
    public void send(String recipient, String message) {
        System.out.println("SMS: " + message);
    }
}

// INJECT SPECIFIC IMPLEMENTATION
@Service
public class UserRegistration {
    private final NotificationService emailService;
    private final NotificationService smsService;

    public UserRegistration(
        @Qualifier("email") NotificationService emailService,  // => Inject "email" bean
        @Qualifier("sms") NotificationService smsService       // => Inject "sms" bean
    ) {
        this.emailService = emailService;
        this.smsService = smsService;
    }
}
```

### @Primary Annotation

Mark default implementation when multiple exist.

```java
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary  // => Default choice when no @Qualifier specified
public class EmailNotificationService implements NotificationService {
    // Default implementation
}

@Component
public class SmsNotificationService implements NotificationService {
    // Alternative implementation
}

@Service
public class UserService {
    private final NotificationService notificationService;

    public UserService(NotificationService notificationService) {
        // => Receives EmailNotificationService (marked @Primary)
        this.notificationService = notificationService;
    }
}
```

### @Profile for Environment-Specific Beans

Configure different beans for different environments (dev, test, production).

```java
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

// DEVELOPMENT: In-memory repository
@Repository
@Profile("dev")  // => Active only when "dev" profile enabled
public class InMemoryUserRepository implements UserRepository {
    private final Map<String, User> users = new HashMap<>();

    @Override
    public void save(User user) {
        users.put(user.email(), user);
    }
}

// PRODUCTION: Database repository
@Repository
@Profile("prod")  // => Active only when "prod" profile enabled
public class DatabaseUserRepository implements UserRepository {
    private final DataSource dataSource;

    public DatabaseUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(User user) {
        // Database operations
    }
}

// ACTIVATE PROFILE
// Option 1: application.properties
// spring.profiles.active=dev

// Option 2: Command line
// java -Dspring.profiles.active=prod -jar app.jar

// Option 3: Test annotation
// @ActiveProfiles("dev")
```

### ApplicationContext (Container)

ApplicationContext is Spring's IoC container that manages beans and dependencies.

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

// CONFIGURATION CLASS
@Configuration
@ComponentScan(basePackages = "com.example.app")  // => Scan for @Component classes
public class AppConfig {
    // Configuration here
}

// MANUAL CONTAINER USAGE (rare, Spring Boot does this automatically)
public class Application {
    public static void main(String[] args) {
        // => Create container
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

        // => Retrieve beans
        UserService userService = context.getBean(UserService.class);
        userService.createUser("test@example.com", "John");

        // => All dependencies auto-wired by Spring
    }
}
```

### Bean Scopes

Control bean lifecycle with scopes.

```java
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import org.springframework.web.context.annotation.SessionScope;

// SINGLETON (DEFAULT): One instance per container
@Component
@Scope("singleton")  // => Default, can omit
public class ConfigurationService {
    // Shared instance across entire application
}

// PROTOTYPE: New instance every time
@Component
@Scope("prototype")  // => New instance per injection
public class ReportGenerator {
    // Fresh instance for each use
}

// REQUEST: One instance per HTTP request (web apps)
@Component
@RequestScope  // => New instance per HTTP request
public class RequestContext {
    // Separate instance per web request
}

// SESSION: One instance per HTTP session (web apps)
@Component
@SessionScope  // => New instance per user session
public class ShoppingCart {
    // User's cart maintained across requests in same session
}
```

**Scope comparison:**

| Scope     | Lifetime              | Use Case                       |
| --------- | --------------------- | ------------------------------ |
| singleton | Application lifecycle | Stateless services, config     |
| prototype | Created on demand     | Stateful objects, unique state |
| request   | HTTP request          | Request-specific data (web)    |
| session   | HTTP session          | User session data (web)        |

## Spring Boot Auto-Configuration

Spring Boot eliminates boilerplate configuration through intelligent defaults and auto-configuration.

### @SpringBootApplication

Single annotation that enables component scanning, auto-configuration, and configuration properties.

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication  // => Combines @Configuration, @EnableAutoConfiguration, @ComponentScan
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // => Starts embedded server, configures beans, scans components
    }
}
```

**What @SpringBootApplication does:**

- **@Configuration**: Declares configuration class
- **@EnableAutoConfiguration**: Auto-configures beans based on classpath
- **@ComponentScan**: Scans package and subpackages for components

### @EnableAutoConfiguration

Auto-configures beans based on dependencies on classpath.

```java
// AUTOMATIC DATASOURCE CONFIGURATION
// If spring-boot-starter-data-jpa on classpath:
// - Creates DataSource bean from application.properties
// - Creates EntityManagerFactory
// - Creates TransactionManager
// - No manual configuration needed!

// application.properties
// spring.datasource.url=jdbc:postgresql:mydb
// spring.datasource.username=user
// spring.datasource.password=pass

@Service
public class UserService {
    private final UserRepository repository;

    // => DataSource automatically configured and injected into JPA repository
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

**Common auto-configurations:**

| Dependency                     | Auto-configures                     |
| ------------------------------ | ----------------------------------- |
| spring-boot-starter-web        | Embedded Tomcat, Spring MVC         |
| spring-boot-starter-data-jpa   | DataSource, JPA, TransactionManager |
| spring-boot-starter-security   | Security filters, authentication    |
| spring-boot-starter-data-redis | Redis connection factory            |

### Conditional Beans

Create beans only when specific conditions met.

```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationConfig {

    // CONDITIONAL ON PROPERTY
    @Bean
    @ConditionalOnProperty(name = "notification.email.enabled", havingValue = "true")
    public NotificationService emailService() {
        return new EmailNotificationService();  // => Created only if property = true
    }

    // CONDITIONAL ON CLASS PRESENCE
    @Bean
    @ConditionalOnClass(name = "com.twilio.Twilio")  // => Check if Twilio SDK on classpath
    public NotificationService smsService() {
        return new SmsNotificationService();  // => Created only if Twilio available
    }

    // CONDITIONAL ON MISSING BEAN (fallback)
    @Bean
    @ConditionalOnMissingBean(NotificationService.class)
    public NotificationService defaultService() {
        return new ConsoleNotificationService();  // => Created only if no other NotificationService
    }
}
```

**Common conditional annotations:**

| Annotation                | Bean created when...              |
| ------------------------- | --------------------------------- |
| @ConditionalOnProperty    | Property has specific value       |
| @ConditionalOnClass       | Class present on classpath        |
| @ConditionalOnMissingBean | No bean of type exists            |
| @ConditionalOnBean        | Bean of type exists               |
| @ConditionalOnExpression  | SpEL expression evaluates to true |

### Custom Auto-Configuration

Create reusable auto-configuration for libraries.

```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// CONFIGURATION PROPERTIES
@ConfigurationProperties(prefix = "mylib")
public class MyLibraryProperties {
    private String apiKey;      // => mylib.api-key
    private int timeout = 30;   // => mylib.timeout (default: 30)

    // Getters and setters
}

// AUTO-CONFIGURATION CLASS
@Configuration
@ConditionalOnClass(MyLibraryClient.class)  // => Only if library on classpath
@EnableConfigurationProperties(MyLibraryProperties.class)
public class MyLibraryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyLibraryClient myLibraryClient(MyLibraryProperties properties) {
        // => Create client from properties
        return new MyLibraryClient(properties.getApiKey(), properties.getTimeout());
    }
}

// Register in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// com.example.MyLibraryAutoConfiguration
```

### application.properties/yaml Configuration

Configure beans through external properties.

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql:mydb
    username: user
    password: pass
  jpa:
    hibernate:
      ddl-auto: validate

notification:
  email:
    enabled: true
    from: noreply@example.com
  sms:
    enabled: false

mylib:
  api-key: abc123
  timeout: 60
```

**Inject properties into beans:**

```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EmailService {
    private final String fromAddress;

    public EmailService(@Value("${notification.email.from}") String fromAddress) {
        this.fromAddress = fromAddress;  // => Injected from application.yml
    }

    public void sendEmail(String to, String message) {
        System.out.println("From: " + fromAddress);  // => noreply@example.com
        System.out.println("To: " + to);
        System.out.println("Message: " + message);
    }
}
```

## CDI (Contexts and Dependency Injection - Jakarta EE)

CDI is the Jakarta EE standard for dependency injection, providing similar features to Spring but following Java EE specifications.

### Scopes (@ApplicationScoped, @RequestScoped, @SessionScoped)

Control bean lifecycle with CDI scopes.

```java
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.RequestScoped;
import jakarta.enterprise.context.SessionScoped;
import jakarta.inject.Inject;
import java.io.Serializable;

// APPLICATION SCOPE: One instance per application
@ApplicationScoped
public class ConfigurationService {
    // Singleton behavior
}

// REQUEST SCOPE: One instance per HTTP request
@RequestScoped
public class RequestLogger {
    private long startTime;

    @PostConstruct
    public void init() {
        startTime = System.currentTimeMillis();  // => Track request start
    }

    @PreDestroy
    public void cleanup() {
        long duration = System.currentTimeMillis() - startTime;
        System.out.println("Request took " + duration + "ms");
    }
}

// SESSION SCOPE: One instance per HTTP session
@SessionScoped
public class ShoppingCart implements Serializable {  // => Must be serializable
    private List<Item> items = new ArrayList<>();

    public void addItem(Item item) {
        items.add(item);  // => Persists across requests in same session
    }
}
```

### @Produces for Factory Methods

Create beans programmatically with producer methods.

```java
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import javax.sql.DataSource;

@ApplicationScoped
public class DatabaseProducer {

    @Produces
    @ApplicationScoped
    public DataSource createDataSource() {
        // => Produce DataSource bean
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql:mydb");
        config.setUsername("user");
        config.setPassword("pass");
        return new HikariDataSource(config);
    }

    @Produces
    @RequestScoped
    public EntityManager createEntityManager(EntityManagerFactory emf) {
        // => Produce EntityManager per request
        return emf.createEntityManager();
    }
}

// INJECT PRODUCED BEANS
@ApplicationScoped
public class UserRepository {
    @Inject
    private DataSource dataSource;  // => Injected from producer

    @Inject
    private EntityManager entityManager;  // => Injected from producer
}
```

### Interceptors

Add cross-cutting concerns (logging, transactions) with interceptors.

```java
import jakarta.interceptor.InterceptorBinding;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.InvocationContext;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.*;

// DEFINE INTERCEPTOR BINDING
@InterceptorBinding
@Retention(RUNTIME)
@Target({TYPE, METHOD})
public @interface Logged {
}

// IMPLEMENT INTERCEPTOR
@Logged
@Interceptor
@Priority(1000)
public class LoggingInterceptor {

    @AroundInvoke
    public Object logMethodCall(InvocationContext context) throws Exception {
        String methodName = context.getMethod().getName();
        System.out.println("Calling: " + methodName);  // => Before method

        Object result = context.proceed();  // => Execute actual method

        System.out.println("Completed: " + methodName);  // => After method
        return result;
    }
}

// APPLY INTERCEPTOR
@ApplicationScoped
public class UserService {

    @Logged  // => LoggingInterceptor wraps this method
    public void createUser(String email, String name) {
        System.out.println("Creating user: " + name);
    }
}

// OUTPUT when createUser called:
// Calling: createUser
// Creating user: John
// Completed: createUser
```

### CDI vs Spring Comparison

| Feature               | Spring                    | CDI                                |
| --------------------- | ------------------------- | ---------------------------------- |
| **Standard**          | Framework-specific        | Jakarta EE standard                |
| **Injection**         | @Autowired or @Inject     | @Inject                            |
| **Component marking** | @Component, @Service      | @Named or none (beans.xml)         |
| **Scopes**            | @Scope, @RequestScope     | @ApplicationScoped, @RequestScoped |
| **Producers**         | @Bean in @Configuration   | @Produces                          |
| **Qualifiers**        | @Qualifier                | @Qualifier                         |
| **Interceptors**      | @Aspect (AOP)             | @Interceptor                       |
| **Ecosystem**         | Spring Boot, Spring Cloud | Jakarta EE servers                 |
| **Server**            | Embedded (Tomcat, Jetty)  | Application server (WildFly, etc.) |

**When to use:**

- **Spring**: Microservices, Spring ecosystem, Spring Boot convenience
- **CDI**: Jakarta EE applications, application servers, standards compliance

## Testing with Dependency Injection

Dependency injection makes testing easier by enabling mock injection.

### Constructor Injection Benefits for Testing

Constructor injection enables testing without frameworks.

```java
// PRODUCTION CODE
public class UserService {
    private final UserRepository repository;
    private final NotificationService notification;

    public UserService(UserRepository repository, NotificationService notification) {
        this.repository = repository;
        this.notification = notification;
    }

    public void createUser(String email, String name) {
        User user = new User(email, name);
        repository.save(user);
        notification.send(email, "Welcome!");
    }
}

// UNIT TEST (no Spring needed)
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Test
    void testCreateUser() {
        // => Create mocks
        UserRepository mockRepo = mock(UserRepository.class);
        NotificationService mockNotif = mock(NotificationService.class);

        // => Inject mocks via constructor (no DI framework needed)
        UserService service = new UserService(mockRepo, mockNotif);

        // => Test
        service.createUser("test@example.com", "John");

        // => Verify interactions
        verify(mockRepo).save(any(User.class));
        verify(mockNotif).send(eq("test@example.com"), eq("Welcome!"));
    }
}
```

### Mocking Dependencies (Mockito)

Use Mockito to create test doubles.

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderServiceTest {

    @Mock  // => Mockito creates mock
    private PaymentService paymentService;

    @Mock
    private InventoryService inventoryService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);  // => Initialize mocks

        // => Inject mocks
        orderService = new OrderService(paymentService, inventoryService);
    }

    @Test
    void testProcessOrder() {
        Order order = new Order("123", BigDecimal.valueOf(100));

        // => Configure mock behavior
        when(inventoryService.checkStock(order.getId())).thenReturn(true);
        when(paymentService.charge(order.getAmount())).thenReturn(true);

        // => Test
        boolean result = orderService.processOrder(order);

        // => Assertions
        assertTrue(result);
        verify(inventoryService).checkStock("123");
        verify(paymentService).charge(BigDecimal.valueOf(100));
        verify(inventoryService).reserveStock("123");
    }

    @Test
    void testProcessOrderInsufficientStock() {
        Order order = new Order("123", BigDecimal.valueOf(100));

        // => Configure mock to return false
        when(inventoryService.checkStock(order.getId())).thenReturn(false);

        // => Test
        boolean result = orderService.processOrder(order);

        // => Assertions
        assertFalse(result);
        verify(inventoryService).checkStock("123");
        verify(paymentService, never()).charge(any());  // => Payment should not be called
    }
}
```

### Spring Test Support

Test Spring components with Spring Test framework.

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest  // => Load Spring application context
class UserServiceIntegrationTest {

    @Autowired  // => Inject real UserService bean
    private UserService userService;

    @MockBean  // => Replace UserRepository bean with mock
    private UserRepository userRepository;

    @MockBean  // => Replace NotificationService bean with mock
    private NotificationService notificationService;

    @Test
    void testCreateUser() {
        // => Configure mock behavior
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // => Test with real UserService, mocked dependencies
        userService.createUser("test@example.com", "John");

        // => Verify
        verify(userRepository).save(any(User.class));
        verify(notificationService).send("test@example.com", "Welcome!");
    }
}
```

**@SpringBootTest features:**

- Loads full application context
- Real bean wiring
- @MockBean replaces specific beans with mocks
- Integration testing with partial mocking

## Best Practices

### Prefer Constructor Injection Over Field Injection

Constructor injection provides immutability, testability, and explicit dependencies.

**Avoid field injection:**

```java
// BAD: Field injection
@Service
public class UserService {
    @Autowired  // => Mutable, hard to test
    private UserRepository repository;

    // Cannot create UserService without Spring
}
```

**Use constructor injection:**

```java
// GOOD: Constructor injection
@Service
public class UserService {
    private final UserRepository repository;  // => Immutable

    public UserService(UserRepository repository) {  // => Easy to test
        this.repository = repository;
    }

    // Can create UserService(mockRepo) in tests
}
```

### Avoid Field Injection

Field injection makes testing harder and hides dependencies.

**Problems:**

- Cannot create object without reflection
- Cannot enforce required dependencies
- Mutable fields (not final)
- Hidden dependencies (not in constructor signature)

### Use Interfaces for Dependencies

Program to interfaces for flexibility and testability.

```java
// INTERFACE
public interface PaymentProcessor {
    boolean process(Order order);
}

// IMPLEMENTATIONS
@Component
public class StripePaymentProcessor implements PaymentProcessor { /* ... */ }

@Component
public class PayPalPaymentProcessor implements PaymentProcessor { /* ... */ }

// CLIENT DEPENDS ON INTERFACE
@Service
public class OrderService {
    private final PaymentProcessor paymentProcessor;  // => Interface, not concrete class

    public OrderService(PaymentProcessor paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }
}
```

**Benefits:**

- Swap implementations without changing OrderService
- Test with mock implementations
- Multiple payment processors possible

### Minimize Circular Dependencies

Circular dependencies indicate design problems.

**Example circular dependency:**

```java
// BAD: A → B → A
@Service
public class UserService {
    @Autowired
    private AuditService auditService;  // => UserService depends on AuditService

    public void createUser(User user) {
        auditService.log("Creating user");  // => Calls AuditService
    }
}

@Service
public class AuditService {
    @Autowired
    private UserService userService;  // => AuditService depends on UserService

    public void log(String message) {
        User currentUser = userService.getCurrentUser();  // => Calls UserService
        // CIRCULAR: UserService → AuditService → UserService
    }
}
```

**Solution: Introduce event or extract shared dependency:**

```java
// GOOD: Break cycle with event
@Service
public class UserService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public void createUser(User user) {
        eventPublisher.publishEvent(new UserCreatedEvent(user));  // => Fire event
    }
}

@Service
public class AuditService {
    @EventListener
    public void onUserCreated(UserCreatedEvent event) {
        // => Listen for event, no direct UserService dependency
        log("User created: " + event.getUser().getName());
    }
}
```

### Document Bean Scopes

Clearly document expected lifecycle behavior.

```java
/**
 * Manages shopping cart state for a user session.
 * Scope: SESSION - One instance per HTTP session, maintains state across requests.
 * Thread-safety: Not thread-safe, relies on session isolation.
 */
@Component
@SessionScope
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();

    public void addItem(Item item) {
        items.add(item);
    }
}

/**
 * Configuration service holding application settings.
 * Scope: SINGLETON - One shared instance across entire application.
 * Thread-safety: Immutable after initialization, thread-safe for reading.
 */
@Component
@Singleton
public class ConfigurationService {
    private final Map<String, String> config;

    public ConfigurationService() {
        this.config = loadConfiguration();
    }
}
```

## Conclusion

Dependency injection enables testable, flexible, maintainable architectures:

- **Manual DI**: Understand fundamental patterns (constructor injection, interfaces, factories)
- **JSR-330**: Standard annotations work across frameworks (@Inject, @Qualifier, @Singleton)
- **Spring**: Comprehensive DI with @Component, @Autowired, @Profile, and rich ecosystem
- **Spring Boot**: Auto-configuration eliminates boilerplate (@SpringBootApplication, conditionals)
- **CDI**: Jakarta EE standard with @Produces, interceptors, and application server integration

**Key principles:**

- Prefer constructor injection (immutability, testability, clarity)
- Program to interfaces (flexibility, testability)
- Start simple (manual DI), add frameworks when complexity warrants
- Test with mocks injected via constructors
- Document bean scopes and lifecycle expectations

Begin with constructor injection and interfaces using standard library. Introduce Spring when managing multiple dependencies becomes cumbersome. Use JSR-330 annotations for portability across frameworks.

**Related content:**

- [Design Principles](/en/learn/software-engineering/programming-languages/java/in-the-field/design-principles) - Dependency Inversion Principle (DIP)
- [Best Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/best-practices) - DI usage patterns
- [Test-Driven Development](/en/learn/software-engineering/programming-languages/java/in-the-field/test-driven-development) - Testing with DI
