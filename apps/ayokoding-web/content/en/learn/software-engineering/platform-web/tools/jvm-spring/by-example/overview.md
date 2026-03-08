---
title: "Overview"
weight: 100000000
date: 2025-01-29T00:00:00+07:00
draft: false
description: "Learn Spring Framework through 75-90 heavily annotated code examples covering IoC, dependency injection, data access, transactions, AOP, and web MVC"
tags: ["spring", "java", "kotlin", "examples", "tutorial"]
---

## Learning Approach

This **By Example** series teaches Spring Framework through **code-first learning** with heavily annotated examples. Each example is self-contained and runnable, demonstrating specific Spring Framework concepts.

**Target**: 75-90 examples achieving **95% Spring Framework coverage**

**Annotation Density**: 1.0-2.25 comment lines per code line (per example)

**Format**: All examples in both **Java and Kotlin**

## Why By Example?

Traditional tutorials often provide long explanations before showing code. This approach inverts that pattern:

**Code First**: Start with working, runnable examples
**Inline Documentation**: Every line annotated with `// =>` explaining what happens
**Incremental Complexity**: Simple examples first, building to advanced patterns
**Islamic Finance Context**: Real-world scenarios (Zakat, Murabaha, Sadaqah)

## Structure

### Beginner Examples (0-50% Coverage)

**Topics Covered**:

- IoC Container basics
- Bean definitions with `@Configuration` and `@Bean`
- Component scanning with `@Component`, `@Service`, `@Repository`
- Dependency injection (constructor, setter, field)
- Bean scopes (singleton, prototype)
- Lifecycle callbacks (`@PostConstruct`, `@PreDestroy`)
- Property injection with `@Value`
- Profile-based configuration (`@Profile`)

**Example Count**: ~25-30 examples

**Skill Level**: No prior Spring knowledge required

### Intermediate Examples (50-85% Coverage)

**Topics Covered**:

- Advanced dependency injection (qualifiers, primary beans)
- Data access with JdbcTemplate
- Transaction management (`@Transactional`)
- Spring AOP (aspects, pointcuts, advice types)
- Event publishing and handling
- SpEL (Spring Expression Language)
- Resource handling
- Validation with Bean Validation API
- Testing with Spring Test framework

**Example Count**: ~30-35 examples

**Skill Level**: Completed beginner examples or equivalent knowledge

### Advanced Examples (85-95% Coverage)

**Topics Covered**:

- Custom bean post-processors
- Advanced AOP (custom annotations, around advice)
- Programmatic transaction management
- Custom scope implementations
- Conditional bean registration
- Spring Web MVC (controllers, REST APIs)
- Exception handling strategies
- Async processing with `@Async`
- Caching with `@Cacheable`
- Integration testing strategies

**Example Count**: ~20-25 examples

**Skill Level**: Completed intermediate examples or production Spring experience

## Example Format

Each example follows a **five-part structure**:

### 1. Concept Introduction

A 1-3 sentence explanation of what the example demonstrates, often including an Islamic finance scenario for real-world context.

### 2. Heavily Annotated Code

Self-contained, runnable Java and Kotlin implementations with `// =>` annotations on every significant line.

**Annotation density**: 1.0-2.25 comment lines per code line

**Example**:

```java
@Service  // => Marks as Spring-managed service component
public class ZakatService {

    private final ZakatRepository repository;  // => Final field - immutable
    // => Constructor injection (recommended)
    // => Spring automatically injects repository parameter
    public ZakatService(ZakatRepository repository) {
        this.repository = repository;  // => Dependency injected
    }

    @Transactional  // => Transaction boundary
    public void recordPayment(BigDecimal amount) {
        repository.save(new ZakatRecord(amount));  // => Persists within transaction
        // => Auto-commit on success
    }
}
```

### 3. Optional Diagram

Mermaid diagrams for complex concepts showing data flow, object hierarchies, or execution sequences.

### 4. Key Takeaways

Bullet points highlighting critical concepts and common pitfalls.

### 5. Why It Matters

50-100 words explaining the business and production relevance of the concept, specifically in the context of Islamic finance systems.

## Islamic Finance Context

Examples use authentic Islamic finance scenarios:

### Zakat (Obligatory Charity)

**Definition**: 2.5% annual payment on qualifying wealth above nisab threshold

**Examples**:

- Calculating Zakat on savings
- Recording Zakat payments
- Tracking distribution to eligible recipients

### Murabaha (Cost-Plus Financing)

**Definition**: Shariah-compliant financing where financier buys asset and sells at disclosed profit

**Examples**:

- Calculating payment schedules
- Recording installments
- Profit distribution calculations

### Sadaqah (Voluntary Charity)

**Definition**: Voluntary charitable giving beyond obligatory Zakat

**Examples**:

- Recording donations
- Tracking campaigns
- Generating tax receipts

### Qard Hassan (Benevolent Loan)

**Definition**: Interest-free loan as act of charity

**Examples**:

- Loan disbursement
- Repayment tracking
- Beneficiary management

## How to Use This Series

### Sequential Learning (Recommended)

Follow examples in order:

1. **Start**: Beginner examples (foundational concepts)
2. **Progress**: Intermediate examples (practical patterns)
3. **Master**: Advanced examples (production techniques)

### Reference Learning

Jump to specific topics using index:

- Need transaction management? → Intermediate #15
- Need REST APIs? → Advanced #08
- Need custom annotations? → Advanced #12

### Practice-Based Learning

After each example:

1. **Read** the annotated code
2. **Type** the code yourself (muscle memory)
3. **Modify** the example (experiment)
4. **Test** your changes (verify understanding)

## Prerequisites

### Required Knowledge

**Java or Kotlin**:

- OOP concepts (classes, interfaces, inheritance)
- Generics basics
- Lambda expressions (Java 8+) or Kotlin functions

**Build Tools**:

- Maven or Gradle basics
- Dependency management concepts

**Database Basics**:

- SQL fundamentals (SELECT, INSERT, UPDATE)
- JDBC concepts (connections, statements)

### Setup Requirements

Complete [Initial Setup](/en/learn/software-engineering/platform-web/tools/jvm-spring/initial-setup) to have:

- Java 17+ or Kotlin 1.9+ installed
- Maven or Gradle configured
- IDE configured (IntelliJ IDEA recommended)

## Learning Outcomes

After completing all examples, you will:

**Understand**:

- Spring IoC container architecture
- Dependency injection patterns and best practices
- Bean lifecycle and scopes
- Transaction management strategies
- AOP concepts and applications

**Apply**:

- Java-based configuration effectively
- Component scanning and stereotype annotations
- JdbcTemplate for data access
- Declarative transaction management
- Testing strategies with Spring Test

**Evaluate**:

- When to use Spring Framework vs Spring Boot
- Trade-offs between injection types
- Appropriate transaction boundaries
- Performance implications of AOP

## Example Catalog

### Core Container (Examples 1-15)

**Beginner Level**:

1. Basic bean definition with `@Bean`
2. Constructor injection
3. Setter injection
4. Component scanning with `@Component`
5. Autowiring by type
6. Singleton vs prototype scope
7. `@PostConstruct` and `@PreDestroy`
8. `@Value` property injection
9. Profile-based configuration
10. Multiple configuration classes

**Intermediate Level**:

1. `@Qualifier` for disambiguation
2. `@Primary` for default beans
3. Method injection with `@Lookup`
4. Circular dependency resolution
5. Lazy initialization with `@Lazy`

### Data Access (Examples 16-35)

**Beginner Level**:

1. JdbcTemplate basics - insert
2. JdbcTemplate - query with RowMapper
3. JdbcTemplate - update and delete
4. Named parameters with NamedParameterJdbcTemplate

**Intermediate Level**:

1. `@Transactional` basics
2. Transaction propagation (REQUIRED, REQUIRES_NEW)
3. Transaction isolation levels
4. Rollback rules
5. Programmatic transaction management
6. Multiple DataSource configuration
7. Connection pooling with HikariCP
8. Database initialization with schema.sql

**Advanced Level**:

1. Custom TransactionManager
2. Distributed transactions overview
3. Optimistic locking patterns
4. Batch operations with JdbcTemplate
5. Stored procedure calls
6. Custom exception translation
7. JDBC testing strategies
8. Transaction testing with `@Transactional` rollback

### AOP (Examples 36-50)

**Intermediate Level**:

1. Basic aspect with `@Before` advice
2. `@After` and `@AfterReturning` advice
3. `@Around` advice for method interception
4. Pointcut expressions
5. Custom annotations as pointcuts
6. Passing arguments to advice
7. Aspect ordering

**Advanced Level**:

1. Introduction aspects (`@DeclareParents`)
2. Performance monitoring aspect
3. Logging aspect
4. Security aspect (authorization checks)
5. Retry logic with AOP
6. Caching with AOP
7. Async execution with AOP
8. AOP testing strategies

### Web MVC (Examples 51-70)

**Intermediate Level**:

1. Basic `@Controller` with request mapping
2. `@RequestParam` for query parameters
3. `@PathVariable` for URL variables
4. `@RequestBody` for JSON input
5. `@ResponseBody` for JSON output
6. Model and View resolution
7. Form handling with `@ModelAttribute`
8. Validation with Bean Validation API
9. Exception handling with `@ExceptionHandler`
10. RESTful API with `@RestController`

**Advanced Level**:

1. Content negotiation
2. Custom argument resolvers
3. Interceptors for request processing
4. File upload handling
5. Async request processing
6. Server-Sent Events (SSE)
7. CORS configuration
8. Security headers
9. REST API testing
10. Integration testing with MockMvc

### Advanced Topics (Examples 71-90)

1. Event publishing with `ApplicationEventPublisher`
2. Event listening with `@EventListener`
3. SpEL in annotations
4. Resource loading
5. Custom property sources
6. Custom scope implementation
7. Bean post-processors
8. `@Conditional` annotations
9. Caching with `@Cacheable`
10. Async methods with `@Async`
11. Scheduling with `@Scheduled`
12. Custom validators
13. Type conversion with ConversionService
14. Internationalization (i18n)
15. Profile-specific beans
16. Environment abstraction
17. Application context events
18. Graceful shutdown
19. Health checks
20. Metrics collection

## Navigation

**Start Learning**:

- **[Beginner Examples](/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/beginner)** - Examples 1-30 (0-50% coverage)
- **[Intermediate Examples](/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/intermediate)** - Examples 31-65 (50-85% coverage)
- **[Advanced Examples](/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/advanced)** - Examples 66-90 (85-95% coverage)

**Other Learning Paths**:

- **[Overview](/en/learn/software-engineering/platform-web/tools/jvm-spring/overview)** - Conceptual introduction
- **[Initial Setup](/en/learn/software-engineering/platform-web/tools/jvm-spring/initial-setup)** - Installation and project setup
- **[Quick Start](/en/learn/software-engineering/platform-web/tools/jvm-spring/quick-start)** - Complete working application
