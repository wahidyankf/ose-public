---
description: "Uses the Java by-example tutorial as a worked reference for core-features-first, and lists the checker agent's validation criteria."
when_to_use: "Read when you need a concrete worked example of core-features-first applied across levels, or the exact criteria the checker agent validates."
---

# Core Features First: Java Reference Implementation and Validation Criteria

## Java By-Example as Reference Implementation

The Java by-example tutorial demonstrates this principle for programming languages:

**Beginner section** (Examples 1-30):

- ✅ JSON processing using standard library (`javax.json`) before Jackson
- ✅ HTTP client using `java.net.http.HttpClient` (Java 11+)
- ✅ Threading using `Thread` and `ExecutorService`
- ✅ File I/O using `java.nio.file.*`
- ✅ Testing with assertions before JUnit

**Intermediate section** (Examples 31-50):

- Introduces JUnit after teaching testing fundamentals
- Uses Spring Boot for REST API patterns (complex production requirement)
- Still prioritizes standard library for data structures, streams, concurrency

**Advanced section** (Examples 51-75):

- Compares standard library approaches with frameworks
- Evaluates when frameworks add value vs complexity
- Example: `ExecutorService` performance vs virtual threads (Project Loom)

## Validation Criteria

The tutorial-by-example-checker validates:

- **Beginner dependency count**: 0 external dependencies/abstractions (CRITICAL)
- **Intermediate dependency justification**: Each external dependency has explicit "Why Not Core Features" explanation (HIGH)
- **Dependency documentation**: Installation steps and version requirements present when dependencies introduced (MEDIUM)
- **Coverage progression**: Core feature examples precede framework/library examples for same capability (MEDIUM)
- **Abstraction foundation**: External abstractions reference primitive foundation they build upon (MEDIUM)
