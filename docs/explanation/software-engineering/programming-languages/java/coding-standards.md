---
title: "Java Coding Standards"
description: Authoritative OSE Platform Java coding standards (naming conventions, package organization, code structure)
category: explanation
subcategory: prog-lang
tags:
  - java
  - coding-standards
  - naming-conventions
  - package-structure
  - hexagonal-architecture
principles:
  - automation-over-manual
  - explicit-over-implicit
created: 2026-02-03
---

# Java Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Java development in the OSE Platform. These are prescriptive rules that MUST be followed across all Java projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Java developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform naming conventions, package organization, project structure, code organization rules

## Naming Conventions

### Classes and Interfaces

**MUST** use PascalCase for all class and interface names.

**Format**: `[Concept][Type]` (e.g., `TaxCalculation`, `OrderService`, `PaymentRepository`)

**Examples**:

- `TaxCalculation` (domain model)
- `InvoiceValidator` (validator)
- `OrderRepository` (repository interface)
- `PaymentServiceImpl` (service implementation)

**Prohibited**:

- ❌ `taxCalculation` (camelCase - incorrect for classes)
- ❌ `TAX_CALCULATION` (UPPER_SNAKE_CASE - reserved for constants)
- ❌ `Tax_Calculation` (snake_case - non-standard)

### Methods and Variables

**MUST** use camelCase for all method and variable names.

**Format**: `[verb][Noun][Context]` for methods, `[noun][Context]` for variables

**Examples**:

- `calculateTax()` (method)
- `validateInvoice()` (method)
- `taxAmount` (variable)
- `invoiceDate` (variable)

**Prohibited**:

- ❌ `CalculateTax()` (PascalCase - incorrect for methods)
- ❌ `calculate_tax()` (snake_case - non-standard)
- ❌ `CALCULATE_TAX()` (UPPER_SNAKE_CASE - reserved for constants)

### Constants

**MUST** use UPPER_SNAKE_CASE for all constants (final static fields).

**Format**: `[CONCEPT]_[CONTEXT]`

**Examples**:

- `MAX_RETRY_COUNT`
- `DEFAULT_TAX_RATE`
- `CONNECTION_TIMEOUT_SECONDS`

**Prohibited**:

- ❌ `maxRetryCount` (camelCase - incorrect for constants)
- ❌ `MaxRetryCount` (PascalCase - incorrect for constants)

### Packages

**MUST** use lowercase with dot notation for all package names.

**Format**: `com.oseplatform.[domain].[layer]`

**Examples**:

- `com.oseplatform.tax.domain` (domain models)
- `com.oseplatform.invoice.application` (use cases)
- `com.oseplatform.payment.infrastructure` (adapters)
- `com.oseplatform.order.api` (REST endpoints)

**Prohibited**:

- ❌ `com.osePlatform.tax.Domain` (mixed case - non-standard)
- ❌ `com.ose_platform.tax.domain` (underscores - non-standard)

## Package Organization

**MUST** follow hexagonal architecture (ports and adapters) for package structure.

### Standard Package Structure

```
com.oseplatform.[domain]/
├── domain/                     # Domain models, value objects, domain services
│   ├── model/                  # Entities and aggregates
│   ├── service/                # Domain services
│   └── repository/             # Repository interfaces (ports)
├── application/                # Use cases, application services
│   ├── usecase/                # Business use cases
│   └── dto/                    # Data transfer objects
├── infrastructure/             # Adapters, implementations
│   ├── persistence/            # Database adapters
│   ├── messaging/              # Message queue adapters
│   └── external/               # External service clients
└── api/                        # API layer (REST, GraphQL)
    ├── rest/                   # REST controllers
    └── graphql/                # GraphQL resolvers
```

### Package Organization Rules

**MUST** keep domain logic isolated from infrastructure concerns.

- Domain layer **MUST NOT** depend on infrastructure or API layers
- Application layer **MAY** depend on domain layer only
- Infrastructure layer implements domain repository interfaces
- API layer orchestrates application use cases

**Example**:

- ✅ `com.oseplatform.tax.domain.repository.TaxRepository` (interface in domain)
- ✅ `com.oseplatform.tax.infrastructure.persistence.JpaTaxRepository` (implementation in infrastructure)

## Project Structure

**MUST** use Maven multi-module structure for all Java projects.

### Standard Maven Multi-Module Layout

```
[project-root]/
├── pom.xml                     # Parent POM
├── [domain]-domain/            # Domain module
│   └── pom.xml
├── [domain]-application/       # Application module
│   └── pom.xml
├── [domain]-infrastructure/    # Infrastructure module
│   └── pom.xml
└── [domain]-api/               # API module
    └── pom.xml
```

**Rationale**: Multi-module structure enforces architectural boundaries, enables independent testing, and supports dependency management.

## Code Organization

### Method Length

**MUST** keep methods ≤20 lines of code (excluding blank lines and comments).

**Rationale**: Short methods improve readability, testability, and adherence to Single Responsibility Principle.

**When exceeding 20 lines**:

1. Extract private helper methods
2. Consider extracting to separate service class
3. Re-evaluate method's single responsibility

### Class Focus

**MUST** ensure each class has a single, well-defined responsibility.

**Indicators of violation**:

- Class name contains "and" or "or" (e.g., `OrderAndInvoiceManager` - wrong)
- Class has multiple unrelated public methods
- Class has >500 lines of code

**Solution**: Extract cohesive responsibilities into separate classes.

### File Organization

**MUST** organize class members in standard order:

1. Static constants
2. Instance variables (private)
3. Constructors
4. Public methods
5. Package-private methods
6. Private methods
7. Nested classes (if needed)

## Enforcement

These standards are enforced through:

- **Spotless** - Auto-formats code on compilation
- **Checkstyle** - Validates naming conventions and structure
- **ArchUnit** - Validates architectural boundaries
- **Code reviews** - Human verification of standards compliance

See [Java Code Quality](./code-quality.md) for enforcement configuration.

## Related Standards

- [Java Framework Integration](./framework-integration.md) - Spring Boot and Jakarta EE standards
- [Java Testing Standards](./testing-standards.md) - JUnit 6 and test naming conventions
- [Java Build Configuration](./build-configuration.md) - Maven POM structure
- [Java Code Quality](./code-quality.md) - Automated quality tools

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Spotless auto-formats code on every compile (no manual formatting needed)
   - Checkstyle validates naming conventions automatically
   - ArchUnit validates architectural boundaries in tests

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - PascalCase for classes makes types immediately recognizable
   - Package structure explicitly shows hexagonal architecture layers
   - Method names start with verbs (explicit action: `calculateTax`, `validateInvoice`)
   - Methods limited to ≤20 lines (enforce single responsibility)
   - One class per file (no nested public classes)
   - Clear separation of concerns (domain vs infrastructure vs API)

## Related Documentation

**Enforced by**:

- [Code Quality Standards](./code-quality.md) - Checkstyle enforces these naming and structure conventions

**Build Infrastructure**:

- [Build Configuration](./build-configuration.md) - Maven module organization follows package structure defined here

**Application**:

- [Framework Integration](./framework-integration.md) - Spring/Jakarta EE package organization
- [DDD Standards](./ddd-standards.md) - Domain package structure and hexagonal architecture

---

**Maintainers**: Platform Documentation Team
