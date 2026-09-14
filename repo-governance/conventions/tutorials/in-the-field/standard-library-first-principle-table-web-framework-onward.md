---
description: The second half of the standard-library-to-framework topic progression table (Web Framework through Service Discovery).
when_to_use: Use when looking up which production framework a specific topic (caching, messaging, security, etc.) progresses to.
---

# Standard Library First Principle: Topic Progression Table (Continued)

| Topic                     | Standard Library                    | Limitations                               | Production Framework      | When Framework Justified              |
| ------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------- | ------------------------------------- |
| **Web Framework**         | `com.sun.net.httpserver`            | No routing, no middleware, manual parsing | Spring Boot, JAX-RS       | REST APIs, web apps                   |
| **Caching**               | `Map` or manual caching             | No eviction, no TTL, memory leaks         | Caffeine, Redis           | Performance critical (DB queries)     |
| **Messaging**             | Manual queue implementation         | No persistence, no retry, no ordering     | Kafka, RabbitMQ, JMS      | Distributed systems, async processing |
| **Security**              | Manual password hashing             | No salt, weak algorithms                  | Spring Security, BCrypt   | Authentication required               |
| **Monitoring**            | Manual metrics collection           | No aggregation, no alerting               | Prometheus, Micrometer    | Production observability              |
| **Serialization**         | Java Serialization                  | Version incompatibility, slow             | Protocol Buffers, Avro    | Cross-language, performance           |
| **Validation**            | Manual if/else checks               | Verbose, inconsistent                     | Bean Validation (JSR 380) | Complex validation rules              |
| **Scheduling**            | `Timer`, `ScheduledExecutorService` | No distributed scheduling, no persistence | Quartz, Spring Scheduler  | Cron jobs, background tasks           |
| **Reactive Streams**      | Callbacks, `ExecutorService`        | Callback hell, manual backpressure        | Project Reactor, RxJava   | Streaming data, high concurrency      |
| **API Documentation**     | Manual documentation                | Out of sync, no testing                   | OpenAPI/Swagger           | Public APIs, contract-first           |
| **Testing (Integration)** | Manual setup/teardown               | Slow, brittle                             | Testcontainers            | Database/external service testing     |
| **Circuit Breaker**       | Manual retry logic                  | No fallback, cascading failures           | Resilience4j, Hystrix     | Microservices, distributed systems    |
| **Service Discovery**     | Hardcoded URLs                      | Manual updates, no load balancing         | Eureka, Consul            | Microservices (>5 services)           |
