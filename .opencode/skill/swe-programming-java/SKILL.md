---
name: swe-programming-java
description: Java, Spring Framework, and Spring Boot coding standards from authoritative docs/explanation/ documentation
---

# Java Stack Coding Standards

## Purpose

Progressive disclosure of Java stack coding standards for agents writing Java code.

**Coverage**: Java language → Spring Framework → Spring Boot (full technology stack)

**Usage**: Auto-loaded for agents when writing any Java/Spring code. Provides quick reference to idioms, best practices, and antipatterns across the full stack.

---

## Java Language Standards

**Authoritative Source**: [docs/explanation/software-engineering/programming-languages/java/README.md](../../../docs/explanation/software-engineering/programming-languages/java/README.md)

### Naming Conventions

**Classes and Interfaces**: PascalCase

- Classes: `UserAccount`, `PaymentProcessor`
- Interfaces: `Comparable`, `Serializable` (adjective form preferred)
- Abstract classes: `AbstractProcessor`, `BaseEntity`

**Methods and Variables**: camelCase

- Methods: `calculateTotal()`, `findUserById()`
- Variables: `userName`, `totalAmount`
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)

**Packages**: lowercase with dots

- `com.oseplatform.domain.account`
- `com.oseplatform.infrastructure.persistence`

### Modern Java Features (Java 17+)

**Records**: Use for immutable data carriers

```java
public record UserAccount(String id, String name, LocalDateTime createdAt) {}
```

**Sealed Classes**: Use for closed type hierarchies

```java
public sealed interface Payment permits CreditCard, BankTransfer {}
```

**Pattern Matching**: Use for type-safe casts

```java
if (obj instanceof String s) {
    return s.toUpperCase();
}
```

**Text Blocks**: Use for multi-line strings

```java
String json = """
    {
        "name": "value"
    }
    """;
```

### Error Handling

**Checked Exceptions**: For recoverable errors

- Use for business logic failures
- Document with `@throws` javadoc

**Unchecked Exceptions**: For programming errors

- Use for validation failures, illegal state
- Extend `RuntimeException`

**Try-with-resources**: Always use for AutoCloseable

```java
try (var reader = Files.newBufferedReader(path)) {
    // Use reader
}
```

### Testing Standards

**JUnit 5**: Primary testing framework

- `@Test` for test methods
- `@BeforeEach`, `@AfterEach` for setup/teardown
- `@ParameterizedTest` for data-driven tests

**AssertJ**: Fluent assertions

```java
assertThat(result)
    .isNotNull()
    .hasSize(3)
    .containsExactly("a", "b", "c");
```

**Mockito**: Mocking framework

```java
@Mock
private UserRepository repository;
```

### Security Practices

**Input Validation**: Always validate external input

- Use Bean Validation annotations (`@NotNull`, `@Size`)
- Validate before processing

**Sensitive Data**: Never log secrets

- Use `SensitiveDataFilter` for logging
- Clear sensitive data after use

**SQL Injection**: Use prepared statements

```java
var stmt = connection.prepareStatement("SELECT * FROM users WHERE id = ?");
stmt.setString(1, userId);
```

### Java Comprehensive Documentation

- [Java README](../../../docs/explanation/software-engineering/programming-languages/java/README.md)
- [Functional Programming](../../../governance/development/pattern/functional-programming.md)

---

## Spring Framework Standards

**Authoritative Source**: [docs/explanation/software-engineering/platform-web/tools/jvm-spring/README.md](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/README.md)

**Foundation**: Builds on Java language standards above.

### IoC Container and ApplicationContext

- Use `ApplicationContext` for production code
- Prefer annotation-based configuration (`@Configuration`, `@Bean`)
- Use component scanning with explicit base packages

### Dependency Injection Patterns

- **Constructor injection** (preferred): Use for required dependencies
- Field injection (avoid): Creates testing difficulties
- Setter injection: Use for optional dependencies

### Bean Lifecycle and Scopes

- Singleton (default): Stateless services
- Prototype: Stateful objects
- Request/Session: Web-scoped beans
- Use `@PostConstruct` and `@PreDestroy` for lifecycle callbacks

### AOP Patterns

- Use `@Aspect` for cross-cutting concerns
- Prefer declarative transactions (`@Transactional`)
- Apply aspects for logging, security, caching

### Data Access

- Use `JdbcTemplate` for SQL operations
- Prefer Spring Data JPA repositories
- Apply transaction management at service layer
- Use `@Transactional` for declarative transactions

### Web MVC

- Use `@RestController` for REST APIs
- Apply `@RequestMapping` for endpoint routing
- Use `@Valid` for request validation
- Implement `@ControllerAdvice` for global exception handling

### Spring Framework Comprehensive Documentation

**Core Patterns**:

- [Idioms](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__idioms.md)
- [Best Practices](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__best-practices.md)
- [Anti-Patterns](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__anti-patterns.md)

**Configuration & Architecture**:

- [Configuration](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__configuration.md)
- [Dependency Injection](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__dependency-injection.md)
- [AOP](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__aop.md)
- [Build Configuration](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__build-configuration.md)

**Data & Web**:

- [Data Access](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__data-access.md)
- [Web MVC](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__web-mvc.md)
- [REST APIs](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__rest-apis.md)

**Quality & Operations**:

- [Security](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__security.md)
- [Testing](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__testing.md)
- [Performance](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__performance.md)
- [Observability](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__observability.md)
- [Deployment](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__deployment.md)
- [Code Quality](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__code-quality.md)

**Domain & Design**:

- [DDD Standards](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__ddd-standards.md)
- [API Standards](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__api-standards.md)
- [Concurrency Standards](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__concurrency-standards.md)
- [Error Handling Standards](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__error-handling-standards.md)
- [Version Migration](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring/ex-soen-plwe-to-jvsp__version-migration.md)

---

## Spring Boot Standards

**Authoritative Source**: [docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/README.md](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/README.md)

**Foundation**: Builds on Spring Framework standards above.

### Auto-configuration and Starters

- Use Spring Boot starters for dependency management
- Customize auto-configuration with `application.yml` properties
- Exclude unnecessary auto-configurations explicitly
- Document custom auto-configurations

### Configuration Properties

- Use `@ConfigurationProperties` for type-safe configuration
- Group related properties in dedicated classes
- Validate configuration with Bean Validation annotations
- Use profiles for environment-specific configuration

### REST API Development

- Use `@RestController` for REST endpoints
- Apply `@Valid` for request validation
- Implement global exception handling with `@ControllerAdvice`
- Use HATEOAS for hypermedia-driven APIs
- Document APIs with OpenAPI/Swagger

### Spring Boot Data Access

- Use Spring Data JPA repositories
- Prefer derived query methods over `@Query`
- Apply `@Transactional` at service layer
- Use `@DataJpaTest` for repository testing

### Spring Boot Security

- Use Spring Security with OAuth2/JWT
- Implement method-level security with `@PreAuthorize`
- Configure CORS for API access
- Use `@AuthenticationPrincipal` for user context

### Spring Boot Testing

- Use `@SpringBootTest` for integration tests
- Apply test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`
- Use TestContainers for external dependencies
- Mock external services with `@MockBean`

### Observability

- Enable Spring Boot Actuator for monitoring
- Expose custom metrics with Micrometer
- Implement custom health indicators
- Use structured logging with Logback

### Spring Boot Comprehensive Documentation

**Core Patterns**:

- [Idioms](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__idioms.md)
- [Best Practices](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__best-practices.md)
- [Anti-Patterns](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__anti-patterns.md)

**Configuration & Architecture**:

- [Configuration](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__configuration.md)
- [Dependency Injection](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__dependency-injection.md)
- [AOP](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__aop.md)

**Data & Web**:

- [Data Access](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__data-access.md)
- [REST APIs](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__rest-apis.md)
- [WebFlux Reactive](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__webflux-reactive.md)

**Quality & Operations**:

- [Security](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__security.md)
- [Testing](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__testing.md)
- [Performance](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__performance.md)
- [Observability](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__observability.md)
- [Deployment](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__deployment.md)

**Domain & Design**:

- [Domain-Driven Design](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__domain-driven-design.md)
- [Functional Programming](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__functional-programming.md)
- [Version Migration](../../../docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__version-migration.md)

---

## Related Skills

- docs-applying-content-quality
- repo-practicing-trunk-based-development
