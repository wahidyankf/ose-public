---
description: The production-implementation focus, in-scope/out-of-scope coverage, and the 20-40 guide-count target for In-the-Field content.
when_to_use: Use when scoping what an In-the-Field guide should and should not cover, or deciding how many guides a language needs.
---

# Core Characteristics: Focus, Coverage, and Topic Count

## 1. Production Implementation Focus

**Philosophy**: Show how to implement patterns used in actual production systems, not educational simplifications.

In-the-field prioritizes:

- Production-grade code with comprehensive error handling
- Framework integration and configuration
- Enterprise patterns (DI, transaction management, caching, security)
- Real-world trade-offs and architectural decisions
- Integration testing and deployment considerations

## 2. Coverage Focus: Production Scenarios

**What production scenarios mean**: Specific real-world implementation patterns, not comprehensive language coverage.

**Included in production scenarios**:

- Test-Driven Development and Behaviour-Driven Development
- Build tools (Maven, Gradle) and CI/CD pipelines
- Docker containerization and Kubernetes orchestration
- Authentication (Basic Auth, JWT, OAuth2/OIDC)
- Security practices (input validation, secret management)
- SQL database integration (JDBC → HikariCP → JPA/Hibernate)
- NoSQL database integration (MongoDB, Redis, Cassandra)
- Messaging systems (JMS, Kafka, RabbitMQ)
- Caching strategies (Caffeine, Redis, Spring Cache)
- Performance optimization (profiling, tuning, APM)
- Logging frameworks (SLF4J, Logback, structured logging)
- Domain-Driven Design patterns
- Dependency Injection frameworks (Spring, Guice)
- Web services (JAX-RS, Spring Boot REST)
- API integration (HTTP clients, SDK patterns)
- Configuration management (externalized config, secrets)
- Concurrency patterns (thread pools, reactive programming)
- Reactive programming (Project Reactor, RxJava)

**Excluded from production scenarios**:

- Basic language syntax (covered in by-example beginner)
- Language fundamentals (covered in by-example/by-concept)
- Comprehensive language coverage (by-example achieves 95%)
- Sequential skill building (by-example/by-concept handle this)

**Coverage verification**: The content-checker agent validates production scenario completeness.

## 3. Topic Count: 20-40 Production Guides

**Target range**: 20-40 production implementation guides per language or framework

**Actual production counts** (ayokoding-www Java in-the-field):

- Current: 31 guides (authentication, security, TDD, BDD, build tools, CI/CD, Docker/K8s, SQL, NoSQL, messaging, caching, performance, logging, DDD, DI, web services, API integration, configuration, concurrency, reactive, resilience patterns, cloud-native patterns, design principles, best practices, anti-patterns, finite state machines, functional programming, type safety, CLI apps, linting/formatting)

**Rationale**:

- 20-40 guides covers major production patterns without overwhelming learners
- Each guide addresses a specific production scenario with depth
- Fewer guides than by-example (20-40 vs 75-85) because guides cover broader topics
- Range allows flexibility based on ecosystem maturity
