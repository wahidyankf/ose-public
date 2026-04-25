---
title: "Java Framework Integration"
description: Authoritative standards for Spring Boot 4 and Jakarta EE 11 integration in OSE Platform
category: explanation
subcategory: prog-lang
tags:
  - java
  - spring-boot
  - jakarta-ee
  - dependency-injection
  - transaction-management
principles:
  - explicit-over-implicit
  - automation-over-manual
  - reproducibility
created: 2026-02-03
---

# Java Framework Integration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative framework integration standards** for Java development in the OSE Platform. These prescriptive rules govern how Spring Boot 4 and Jakarta EE 11 are used across all Java applications.

**Target Audience**: OSE Platform Java developers, framework architects, technical reviewers

**Scope**: Spring Boot configuration, Jakarta EE integration, dependency injection patterns, transaction management

## Spring Boot 4 Integration

**MUST** use Spring Boot 4 for all web applications and microservices.

### Configuration Classes

**MUST** use `@Configuration` classes for all Spring configuration (not XML).

**Example**:

```java
@Configuration
public class TaxServiceConfiguration {
  @Bean
  public TaxCalculator taxCalculator() {
    return new StandardTaxCalculator();
  }
}
```

**Prohibited**:

- ❌ XML-based configuration (applicationContext.xml)
- ❌ Mixing XML and annotation-based config

### Component Scanning

**MUST** use explicit component scanning with base packages declared.

**Correct**:

```java
@SpringBootApplication
@ComponentScan(basePackages = {
  "com.oseplatform.tax.application",
  "com.oseplatform.tax.infrastructure"
})
public class TaxServiceApplication {
  // ...
}
```

**Prohibited**:

- ❌ Implicit scanning without declared base packages
- ❌ Scanning entire classpath

**Rationale**: Explicit scanning prevents accidental bean registration and improves startup performance.

### Properties Configuration

**MUST** use `application.yml` for all configuration (not `application.properties`).

**Correct**: `src/main/resources/application.yml`

```yaml
server:
  port: 8080
spring:
  application:
    name: tax-service
  datasource:
    url: jdbc:postgresql://localhost:5432/taxdb
```

**Prohibited**:

- ❌ `application.properties` format
- ❌ Mixing `.yml` and `.properties` files

**Rationale**: YAML format supports hierarchical configuration, easier to read, and aligns with platform standards.

### Environment Profiles

**MUST** define separate profiles for dev, staging, and prod environments.

**Required profiles**:

- `application-dev.yml` - Development environment
- `application-staging.yml` - Staging environment
- `application-prod.yml` - Production environment

**Profile activation**:

```bash
# Development
java -jar app.jar --spring.profiles.active=dev

# Production
java -jar app.jar --spring.profiles.active=prod
```

**Prohibited**:

- ❌ Single configuration for all environments
- ❌ Hardcoding environment-specific values in code

## Jakarta EE 11 Integration

**MUST** use Jakarta EE 11 for enterprise features (CDI, JPA, Bean Validation, JAX-RS).

### CDI for Dependency Injection

**MUST** use CDI (Contexts and Dependency Injection) when Jakarta EE is the primary framework.

**Example**:

```java
@ApplicationScoped
public class InvoiceService {
  @Inject
  private InvoiceRepository repository;

  public Invoice createInvoice(InvoiceData data) {
    // ...
  }
}
```

**Prohibited**:

- ❌ Manual instantiation (`new InvoiceService()`)
- ❌ Service locator pattern

### JPA for Persistence

**MUST** use JPA (Jakarta Persistence API) for all database persistence.

**Required configuration**: `persistence.xml`

```xml
<persistence xmlns="https://jakarta.ee/xml/ns/persistence" version="3.0">
  <persistence-unit name="tax-pu" transaction-type="JTA">
    <jta-data-source>java:jboss/datasources/TaxDS</jta-data-source>
  </persistence-unit>
</persistence>
```

### Bean Validation

**MUST** use Jakarta Bean Validation for all input validation.

**Example**:

```java
public class TaxRequest {
  @NotNull
  @Positive
  private BigDecimal amount;

  @NotBlank
  private String taxType;
}
```

**Prohibited**:

- ❌ Manual validation logic
- ❌ Custom validation without annotations

### JAX-RS for REST APIs

**MUST** use JAX-RS when not using Spring Boot (standalone Jakarta EE applications).

**Example**:

```java
@Path("/invoices")
@Produces(MediaType.APPLICATION_JSON)
public class InvoiceResource {
  @GET
  @Path("/{id}")
  public Response getInvoice(@PathParam("id") Long id) {
    // ...
  }
}
```

**When to use JAX-RS vs Spring MVC**:

- Use JAX-RS for standalone Jakarta EE apps
- Use Spring MVC (`@RestController`) for Spring Boot apps

## Dependency Injection

**MUST** use constructor injection (not field injection) for all dependencies.

### Constructor Injection (Required)

**Correct**:

```java
@Service
public class TaxService {
  private final TaxRepository repository;
  private final TaxCalculator calculator;

  public TaxService(TaxRepository repository, TaxCalculator calculator) {
    this.repository = repository;
    this.calculator = calculator;
  }
}
```

**Benefits**:

- Immutable dependencies (final fields)
- Easy to test (constructor parameters)
- Explicit dependencies (no hidden coupling)

### Field Injection (Prohibited)

**Wrong**:

```java
@Service
public class TaxService {
  @Autowired  // WRONG - field injection
  private TaxRepository repository;
}
```

**Why prohibited**:

- Difficult to test (requires reflection or Spring context)
- Mutable dependencies (not final)
- Hidden dependencies (unclear what class needs)

## Transaction Management

**MUST** use `@Transactional` at service layer only (not repository or controller layer).

### Service Layer Transactions (Required)

**Correct**:

```java
@Service
public class InvoiceService {
  @Transactional
  public Invoice createInvoice(InvoiceData data) {
    Invoice invoice = repository.save(new Invoice(data));
    eventPublisher.publish(new InvoiceCreatedEvent(invoice));
    return invoice;
  }
}
```

### Repository Layer Transactions (Prohibited)

**Wrong**:

```java
@Repository
public class InvoiceRepository {
  @Transactional  // WRONG - transaction at repository level
  public Invoice save(Invoice invoice) {
    // ...
  }
}
```

**Rationale**: Service layer manages business transactions (multiple repository calls), repository layer handles data access only.

### Transaction Configuration

**MUST** configure transaction isolation and propagation explicitly when default is insufficient.

**Example**:

```java
@Transactional(
  isolation = Isolation.READ_COMMITTED,
  propagation = Propagation.REQUIRED,
  rollbackFor = BusinessException.class
)
public void processPayment(Payment payment) {
  // ...
}
```

## Enforcement

Framework integration standards are enforced through:

- **ArchUnit** - Validates architectural rules (e.g., `@Transactional` only in service layer)
- **Code reviews** - Human verification of constructor injection, configuration patterns
- **Starter templates** - Pre-configured project templates with correct framework setup

See [Java Code Quality](./code-quality.md) for ArchUnit configuration.

## Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - Spring Boot, dependency injection, web services
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Framework integration patterns and architectural design
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

## Related Standards

- [Java Coding Standards](./coding-standards.md) - Package organization, naming conventions
- [Java Testing Standards](./testing-standards.md) - Testing Spring Boot and Jakarta EE components
- [Java Build Configuration](./build-configuration.md) - Maven dependency management for frameworks
- [Java Code Quality](./code-quality.md) - Automated architectural validation

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Spring Boot auto-configuration for common patterns (no boilerplate setup)
   - Framework-managed dependency injection (no manual object instantiation)
   - Automatic transaction management with `@Transactional`

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Explicit component scanning with declared base packages (not classpath-wide)
   - Constructor injection makes dependencies visible in code
   - YAML configuration explicitly declares all settings (no hidden defaults)

3. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Environment profiles (`dev`, `staging`, `prod`) ensure consistent configuration across environments
   - Explicit Spring Boot version in parent POM
   - Configuration externalized in `application.yml` (not hardcoded)

---

## Related Documentation

**Project Organization**:

- [Coding Standards](./coding-standards.md) - Package structure and hexagonal architecture conventions
- [Build Configuration](./build-configuration.md) - Spring Boot and Jakarta EE dependency management

**Domain Patterns**:

- [DDD Standards](./ddd-standards.md) - Dependency injection for aggregates and domain services

**Testing**:

- [Testing Standards](./testing-standards.md) - Spring Test and TestContainers for integration testing

**Maintainers**: Platform Documentation Team
