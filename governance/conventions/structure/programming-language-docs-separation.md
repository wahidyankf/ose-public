---
title: "Programming Language Documentation Separation Convention"
description: Establishes the relationship between docs/explanation/programming-languages/ repository-specific style guides and ayokoding-web educational content
category: explanation
subcategory: conventions
tags:
  - documentation
  - programming-languages
  - style-guides
  - content-separation
  - dry-principle
created: 2026-02-04
---

# Programming Language Documentation Separation Convention

This convention establishes the clear separation between **repository-specific programming language style guides** in `docs/explanation/software-engineering/programming-languages/` and **educational programming language content** in ayokoding-web. It prevents duplication, defines scope boundaries, and ensures prerequisite knowledge relationships.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Clear separation of concerns prevents confusion about where content belongs. One source for learning (ayokoding-web), one source for OSE Platform style (docs/explanation/)

- **[Documentation First](../../principles/content/documentation-first.md)**: Explicit prerequisite knowledge statements ensure developers know where to learn languages before applying OSE Platform styles. Documentation acknowledges the educational foundation

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Required prerequisite statements make dependencies explicit. No assumption that developers already know languages - we tell them where to learn

## Purpose

This convention prevents duplication and confusion by defining:

- **What belongs in `docs/explanation/software-engineering/programming-languages/{language}/`**: Repository-specific style guides, coding standards, and conventions
- **What belongs in ayokoding-web**: Educational programming language content (0-95% coverage, by-example, in-practice, tutorials)
- **How to link between them**: Explicit prerequisite knowledge statements

This separation follows the **DRY principle** (Don't Repeat Yourself) - educational content lives in ONE place (ayokoding-web), style guides live in ANOTHER place (docs/explanation/), and they reference each other.

## Scope

### What This Convention Covers

- Scope boundaries for `docs/explanation/software-engineering/programming-languages/{language}/`
- Scope boundaries for ayokoding-web learning content
- Required prerequisite knowledge statements
- Linking patterns between educational and style guide content
- Content organization for all programming languages in the repository

### What This Convention Does NOT Cover

- **How to write educational content** - Covered in tutorial conventions ([Programming Language Content Standard](../tutorials/programming-language-content.md), [By Example Tutorial](../tutorials/by-example.md))
- **How to write style guides** - Covered in [Content Quality Principles](../writing/quality.md)
- **Diátaxis framework application** - Covered in [Diátaxis Framework Convention](./diataxis-framework.md)
- **Hugo content conventions** - Covered in Hugo conventions ([ayokoding](../hugo/ayokoding.md), [shared](../hugo/shared.md))

## Content Separation Rules

### Rule 1: docs/explanation/ Focus - Repository-Specific Style Guides ONLY

**PASS: Repository-specific style guides**:

```
docs/explanation/software-engineering/programming-languages/golang/
├── README.md                                        # Overview + links to ayokoding-web
├── coding-standards.md            # OSE Platform Go conventions
├── code-quality-standards.md      # OSE Platform Go code quality
├── error-handling-standards.md    # OSE Platform error patterns
├── security-standards.md          # OSE Platform security standards
└── testing-standards.md           # OSE Platform testing standards
```

> **Note**: Go (along with Java and Elixir) follows the "Domain-Specific Standards Pattern" — multiple topic-focused standards files — rather than the "Three-Document Pattern" (idioms/best-practices/anti-patterns) used by TypeScript, Python, and Dart. Both patterns are valid. See `docs/explanation/software-engineering/programming-languages/README.md` for details.

**Content includes**:

- Naming conventions specific to OSE Platform (variable naming, file structure)
- Framework choices for the platform (Gin vs Echo, why we chose X)
- Repository-specific patterns (how we structure services, how we handle errors)
- Platform-specific anti-patterns (mistakes to avoid in OSE Platform context)
- Alignment with governance/principles/software-engineering/ principles
- References to ayokoding-web for language fundamentals

**FAIL: Educational content** (move to ayokoding-web):

- ❌ Language syntax tutorials (variables, loops, functions)
- ❌ By-example learning content (75-85 annotated examples)
- ❌ In-practice practical guides (domain-driven design, security, testing)
- ❌ Beginner/intermediate/advanced learning paths
- ❌ Comprehensive language coverage (0-95%)

### Rule 2: ayokoding-web Focus - Educational Content (0-95% Coverage)

**PASS: Educational programming language content**:

```
apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/
├── _index.md                                   # Language overview
├── initial-setup.md                            # Installation, IDE setup
├── quick-start.md                              # First program, hello world
├── by-example/                                 # 75-85 annotated examples (PRIORITY)
│   ├── _index.md
│   ├── overview.md
│   ├── beginner.md                             # 0-40% coverage
│   ├── intermediate.md                         # 40-75% coverage
│   └── advanced.md                             # 75-95% coverage
├── in-practice/                                # Practical deep-dive guides
│   ├── error-handling.md                       # Generic Go error patterns
│   ├── domain-driven-design.md                 # DDD in Go (language-agnostic)
│   ├── security-practices.md                   # Go security basics
│   └── type-safety.md                          # Go type system
└── cookbook/                                   # 30+ practical recipes
    ├── _index.md
    └── common-tasks.md
```

**Content includes**:

- Language fundamentals (syntax, types, control flow)
- By-example annotated code (1-2.25 comment-to-code ratio)
- In-practice practical guides (generic patterns, not OSE Platform-specific)
- Cookbook recipes (copy-paste solutions to common problems)
- Progressive learning (0-30% foundational → 95% comprehensive)

**FAIL: Repository-specific content** (move to docs/explanation/):

- ❌ OSE Platform naming conventions
- ❌ OSE Platform framework choices
- ❌ OSE Platform architecture patterns
- ❌ OSE Platform-specific anti-patterns

### Rule 3: Explicit Prerequisite Knowledge Statements

**REQUIRED**: Every `docs/explanation/software-engineering/programming-languages/{language}/README.md` MUST include explicit prerequisite knowledge statement linking to ayokoding-web.

**Template**:

```markdown
## Prerequisite Knowledge

**This documentation assumes you have completed the ayokoding-web {LANGUAGE} learning path**:

- [ayokoding-web {LANGUAGE} Overview](https://ayokoding.com/en/learn/software-engineering/programming-languages/{language}/)
- [By Example Tutorial](https://ayokoding.com/en/learn/software-engineering/programming-languages/{language}/by-example/) (0-95% coverage, 75-85 examples)
- [In Practice Guides](https://ayokoding.com/en/learn/software-engineering/programming-languages/{language}/in-practice/)

If you're new to {LANGUAGE}, **start with ayokoding-web first**. This documentation focuses exclusively on OSE Platform-specific style guides and conventions, not language fundamentals.

## What This Documentation Covers

This documentation is the **authoritative reference for {LANGUAGE} coding standards in the OSE Platform**. It covers:

- Repository-specific naming conventions
- Framework choices and rationale (why we chose X)
- Architecture patterns specific to OSE Platform
- Anti-patterns to avoid in OSE Platform context
- Alignment with [Software Engineering Principles](../../principles/software-engineering/README.md)

**This is NOT a {LANGUAGE} tutorial** - see ayokoding-web for comprehensive language education.
```

**Examples**:

**PASS: Clear prerequisite statement**:

```markdown
## Prerequisite Knowledge

**This documentation assumes you have completed the ayokoding-web Golang learning path**:

- [ayokoding-web Golang Overview](https://ayokoding.com/en/learn/software-engineering/programming-languages/golang/)
- [By Example Tutorial](https://ayokoding.com/en/learn/software-engineering/programming-languages/golang/by-example/)

If you're new to Go, **start with ayokoding-web first**.
```

**FAIL: No prerequisite statement**:

```markdown
# Golang

Go is used for high-performance services...

## Best Practices

Use goroutines for concurrency...
```

**Why it fails**: Doesn't tell developers where to learn Go fundamentals. Assumes knowledge.

### Rule 4: No Duplication Between Platforms

**CRITICAL**: Content covered in ayokoding-web MUST NOT be duplicated in docs/explanation/.

**Decision tree**:

```
Is this content about {LANGUAGE} fundamentals or generic patterns?
├─ Yes → ayokoding-web (educational content)
│   Examples: syntax, by-example code, generic error patterns, DDD in Go
│
└─ No → Is this content OSE Platform-specific?
    ├─ Yes → docs/explanation/ (style guide)
    │   Examples: "We use Gin for HTTP", "Name variables like this in OSE Platform"
    │
    └─ No → Still ayokoding-web (generic programming knowledge)
```

**Example - Error Handling**:

**ayokoding-web** (`apps/ayokoding-web/content/en/learn/.../golang/in-practice/error-handling.md`):

````markdown
# Error Handling in Go

This guide covers generic Go error patterns.

## Error Interface

Go's error interface is simple:

```go
type error interface {
    Error() string
}
```
````

Use `errors.New()` to create errors, `fmt.Errorf()` to wrap them...

````

**docs/explanation/** (`docs/explanation/.../golang/error-handling.md`):

```markdown
# Go Error Handling - OSE Platform Standards

**Prerequisite**: Complete [ayokoding-web Error Handling](https://ayokoding.com/en/learn/.../golang/in-practice/error-handling/) first.

## OSE Platform Error Standards

In OSE Platform, all errors MUST:

1. Use structured logging with `slog` package
2. Include request IDs for tracing
3. Follow error code taxonomy: `ERRZAKAT001`, `ERRWAQF001`

Example:

```go
// OSE Platform pattern
if err != nil {
    logger.Error("zakat calculation failed",
        "request_id", reqID,
        "error_code", "ERRZAKAT001",
        "error", err)
    return nil, fmt.Errorf("ERRZAKAT001: %w", err)
}
````

**Why**: Enables distributed tracing, compliance auditing, Shariah audit trails.

````

**Key differences**:

- **ayokoding-web**: Generic Go error patterns (what `error` interface is, how to use `errors.New()`)
- **docs/explanation/**: OSE Platform-specific error conventions (structured logging, error codes, audit requirements)

### Rule 5: Cross-Referencing Pattern

**Required linking between platforms**:

**From docs/explanation/ → ayokoding-web**:

```markdown
## Prerequisite Knowledge

**This documentation assumes you have completed the ayokoding-web {LANGUAGE} learning path**:

- [ayokoding-web {LANGUAGE} Overview](https://ayokoding.com/en/learn/.../programming-languages/{language}/)
- [By Example Tutorial](https://ayokoding.com/en/learn/.../programming-languages/{language}/by-example/)

If you're new to {LANGUAGE}, **start with ayokoding-web first**.
````

**From ayokoding-web → docs/explanation/** (optional, when relevant):

```markdown
## Repository-Specific Guides

For OSE Platform-specific {LANGUAGE} conventions, see:

- OSE Platform {LANGUAGE} Style Guide: `docs/explanation/software-engineering/programming-languages/{language}/`
```

**Linking rules**:

- docs/explanation/ README.md MUST link to ayokoding-web (prerequisite)
- ayokoding-web MAY link to docs/explanation/ (optional, for contributors)
- Use absolute URLs for ayokoding-web (Hugo site)
- Use relative paths for docs/explanation/ (GitHub markdown)

## Scope for All Programming Languages

This convention applies to **ALL** programming languages in the repository:

**Current languages**:

- Java (JVM) - `docs/explanation/.../java/`, `apps/ayokoding-web/.../java/`
- Kotlin (JVM) - `docs/explanation/.../kotlin/`, `apps/ayokoding-web/.../kotlin/`
- Python - `docs/explanation/.../python/`, `apps/ayokoding-web/.../python/`
- TypeScript (Node.js) - `docs/explanation/.../typescript/`, `apps/ayokoding-web/.../typescript/`
- Golang - `docs/explanation/.../golang/`, `apps/ayokoding-web/.../golang/`
- Elixir (BEAM) - `docs/explanation/.../elixir/`, `apps/ayokoding-web/.../elixir/`
- Dart (Flutter) - `docs/explanation/.../dart/`, `apps/ayokoding-web/.../dart/`
- Rust - `docs/explanation/.../rust/`, `apps/ayokoding-web/.../rust/`
- Clojure (JVM) - `docs/explanation/.../clojure/`, `apps/ayokoding-web/.../clojure/`
- F# (.NET) - `docs/explanation/.../f-sharp/`, `apps/ayokoding-web/.../f-sharp/`
- C# (.NET) - `docs/explanation/.../c-sharp/`, `apps/ayokoding-web/.../c-sharp/`

**Future languages**: Apply same separation pattern when adding new languages.

## Alignment with Software Engineering Principles

Programming language style guides in `docs/explanation/` MUST align with the software engineering principles from [governance/principles/software-engineering/](../../principles/software-engineering/README.md):

### 1. Automation Over Manual

Style guides document automated tooling:

- Linters (golangci-lint for Go, Ruff for Python)
- Formatters (gofmt for Go, Black for Python)
- Code generators (protoc for gRPC)
- CI/CD pipelines enforcing standards

### 2. Explicit Over Implicit

Style guides enforce explicitness:

- Explicit error handling (no silent failures)
- Explicit configuration (no hidden magic)
- Explicit imports (no wildcards)
- Explicit types where beneficial

### 3. Immutability Over Mutability

Style guides encourage immutable patterns:

- Value objects and immutable data structures
- Functional approaches where applicable
- Const correctness and readonly semantics

### 4. Pure Functions Over Side Effects

Style guides promote pure functions:

- Functional core, imperative shell architecture
- Pure domain logic, isolated side effects
- Testable business logic without mocks

### 5. Reproducibility First

Style guides enable reproducible builds:

- Dependency version pinning (go.mod, requirements.txt)
- Lockfiles (go.sum, poetry.lock)
- Docker build reproducibility

**Example alignment** (Golang):

```markdown
## Software Engineering Principles

Go development in OSE Platform follows the software engineering principles:

1. **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)** - Go automates through golangci-lint, gofmt, go test, code generation
2. **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** - Go enforces through explicit error handling, no hidden control flow
3. **[Immutability Over Mutability](../../principles/software-engineering/immutability.md)** - Go encourages through value receivers, const correctness
4. **[Pure Functions Over Side Effects](../../principles/software-engineering/pure-functions.md)** - Go supports through functional core architecture
5. **[Reproducibility First](../../principles/software-engineering/reproducibility.md)** - Go enables through go.mod, go.sum, reproducible builds

See [Golang README](./README.md#software-engineering-principles) for detailed examples.
```

## Examples

### Example 1: Golang - Correct Separation

**ayokoding-web** (`apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/by-example/beginner.md`):

````markdown
# Go By Example - Beginner

Educational content covering Go fundamentals (0-40% coverage).

## Variables

Go variables are explicitly typed:

```go
// Explicitly typed
var name string = "Alice"

// Type inference
age := 30 // Type: int

// Multiple variables
var x, y int = 1, 2
```
````

Key takeaway: Go supports both explicit types and type inference via `:=`.

````

**docs/explanation/** (`docs/explanation/software-engineering/programming-languages/golang/best-practices.md`):

```markdown
# Go Best Practices - OSE Platform

**Prerequisite**: Complete [ayokoding-web Golang By Example](https://ayokoding.com/en/learn/software-engineering/programming-languages/golang/by-example/).

## Naming Conventions

OSE Platform Go code follows these conventions:

### Variable Naming

- **Domain entities**: CamelCase structs (`ZakatPayment`, `WaqfDonation`)
- **Repository methods**: Prefix with entity (`GetZakatPayment`, `SaveWaqfDonation`)
- **Service methods**: Business operation verbs (`CalculateZakat`, `ProcessDonation`)

### Package Naming

- **Domain packages**: Single word, singular (`zakat`, `waqf`, `murabaha`)
- **Infrastructure packages**: Technical function (`repository`, `handler`, `middleware`)

**Rationale**: Aligns with [Explicit Over Implicit principle](../../principles/software-engineering/explicit-over-implicit.md) - names clearly indicate Islamic finance domain concepts.
````

**Why this works**:

- **Separation**: ayokoding-web teaches Go variables (generic), docs/explanation/ defines OSE Platform naming
- **Prerequisite**: docs/explanation/ explicitly links to ayokoding-web
- **No duplication**: Variable syntax in ayokoding-web, naming conventions in docs/explanation/
- **Clear scope**: ayokoding-web = education, docs/explanation/ = OSE Platform standards

### Example 2: Python - Correct Separation

**ayokoding-web** (`apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/python/in-practice/error-handling.md`):

````markdown
# Error Handling in Python

Generic Python error patterns.

## Exception Handling

Python uses try/except for error handling:

```python
try:
    result = risky_operation()
except ValueError as e:
    print(f"Invalid value: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
finally:
    cleanup()
```
````

Key takeaway: Use specific exception types, always handle errors explicitly.

````

**docs/explanation/** (`docs/explanation/software-engineering/programming-languages/python/error-handling.md`):

```markdown
# Python Error Handling - OSE Platform Standards

**Prerequisite**: Complete [ayokoding-web Python Error Handling](https://ayokoding.com/en/learn/software-engineering/programming-languages/python/in-practice/error-handling/).

## OSE Platform Exception Hierarchy

OSE Platform defines a domain exception hierarchy for Shariah compliance:

```python
# Domain exceptions
class ShariaComplianceError(Exception):
    """Base exception for Shariah violations"""
    pass

class InterestViolationError(ShariaComplianceError):
    """Raised when interest (riba) is detected"""
    def __init__(self, amount: Decimal, transaction_id: str):
        self.amount = amount
        self.transaction_id = transaction_id
        super().__init__(f"Interest detected: {amount} in {transaction_id}")

class ProhibitedInvestmentError(ShariaComplianceError):
    """Raised when investment violates Shariah"""
    pass
````

**Usage in services**:

```python
def validate_transaction(transaction: Transaction) -> None:
    if transaction.interest_amount > 0:
        raise InterestViolationError(
            amount=transaction.interest_amount,
            transaction_id=transaction.id
        )
```

**Why**: Domain exceptions enable Shariah audit trails, compliance monitoring, clear error semantics.

````

**Why this works**:

- **Separation**: ayokoding-web teaches Python exceptions (generic), docs/explanation/ defines OSE Platform domain exceptions
- **Prerequisite**: docs/explanation/ explicitly links to ayokoding-web
- **No duplication**: Generic try/except in ayokoding-web, domain hierarchy in docs/explanation/
- **Clear scope**: ayokoding-web = Python fundamentals, docs/explanation/ = Shariah compliance patterns

### Example 3: Java - Correct Separation

**ayokoding-web** (`apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/intermediate.md`):

```markdown
# Java By Example - Intermediate

Educational content covering Java intermediate concepts (40-75% coverage).

## Optional for Null Safety

Java's `Optional<T>` prevents null pointer exceptions:

```java
Optional<String> optional = Optional.of("value");

// Check presence
if (optional.isPresent()) {
    String value = optional.get();
}

// Provide default
String value = optional.orElse("default");

// Map transformation
Optional<Integer> length = optional.map(String::length);
````

Key takeaway: Use `Optional<T>` to explicitly represent absence, never return null.

````

**docs/explanation/** (`docs/explanation/software-engineering/programming-languages/java/type-safety.md`):

```markdown
# Java Type Safety - OSE Platform Standards

**Prerequisite**: Complete [ayokoding-web Java By Example](https://ayokoding.com/en/learn/software-engineering/programming-languages/java/by-example/).

## Mandatory Optional Usage

In OSE Platform Java code, `Optional<T>` is **REQUIRED** for:

1. **Domain entity optional fields**:

```java
public class ZakatPayment {
    private final UUID id;
    private final Decimal amount;
    private final Optional<String> referenceNumber; // REQUIRED: Use Optional
    private final Optional<Instant> completedAt;   // REQUIRED: Use Optional
}
````

1. **Repository query methods**:

```java
public interface ZakatPaymentRepository {
    Optional<ZakatPayment> findById(UUID id);        // REQUIRED
    Optional<ZakatPayment> findByReference(String ref); // REQUIRED
}
```

**FORBIDDEN patterns**:

```java
// ❌ FORBIDDEN: Returning null
ZakatPayment findById(UUID id) {
    return null; // Violates Explicit Over Implicit
}

// ✅ REQUIRED: Return Optional
Optional<ZakatPayment> findById(UUID id) {
    return Optional.empty(); // Explicit absence
}
```

**Rationale**: Aligns with [Explicit Over Implicit principle](../../principles/software-engineering/explicit-over-implicit.md) - absence is explicit, checked at compile-time.

````

**Why this works**:

- **Separation**: ayokoding-web teaches `Optional<T>` API (generic), docs/explanation/ mandates OSE Platform usage
- **Prerequisite**: docs/explanation/ explicitly links to ayokoding-web
- **No duplication**: Generic `Optional` usage in ayokoding-web, mandatory patterns in docs/explanation/
- **Clear scope**: ayokoding-web = Java `Optional` education, docs/explanation/ = OSE Platform enforcement

## Common Mistakes to Avoid

### Mistake 1: Duplicating Educational Content

**FAIL: Duplicating in docs/explanation/**:

```markdown
# docs/explanation/.../golang/best-practices.md

## Variables in Go

Go variables can be declared in multiple ways:

```go
var x int = 10
y := 20
````

Use `:=` for local variables, `var` for package-level...

````

**Why it fails**: This is educational content about Go syntax. Belongs in ayokoding-web, not docs/explanation/.

**PASS: Repository-specific convention**:

```markdown
# docs/explanation/.../golang/best-practices.md

**Prerequisite**: Complete [ayokoding-web Golang By Example](https://ayokoding.com/en/learn/.../golang/by-example/).

## Variable Naming in OSE Platform

OSE Platform Go code follows these conventions:

- Domain entities: `ZakatPayment`, `WaqfDonation`
- Repository variables: `zakatRepo`, `waqfRepo`
- Service variables: `zakatService`, `donationService`

**Rationale**: Explicit domain terminology for Shariah compliance clarity.
````

**Why it passes**: Focuses on OSE Platform-specific naming, links to ayokoding-web for fundamentals.

### Mistake 2: Missing Prerequisite Statement

**FAIL: No prerequisite link**:

```markdown
# docs/explanation/.../python/README.md

# Python

Python is used for data processing...

## Best Practices

Follow PEP 8 standards...
```

**Why it fails**: Doesn't tell developers where to learn Python. Assumes knowledge.

**PASS: Explicit prerequisite**:

```markdown
# docs/explanation/.../python/README.md

# Python

## Prerequisite Knowledge

**This documentation assumes you have completed the ayokoding-web Python learning path**:

- [ayokoding-web Python Overview](https://ayokoding.com/en/learn/.../python/)
- [By Example Tutorial](https://ayokoding.com/en/learn/.../python/by-example/)

If you're new to Python, **start with ayokoding-web first**.

## What This Documentation Covers

OSE Platform-specific Python conventions...
```

**Why it passes**: Explicit prerequisite statement, clear scope definition.

### Mistake 3: Repository-Specific Content in ayokoding-web

**FAIL: OSE Platform patterns in ayokoding-web**:

````markdown
# apps/ayokoding-web/.../golang/in-practice/error-handling.md

## Error Handling

In OSE Platform, all errors must include request IDs and error codes:

```go
if err != nil {
    logger.Error("operation failed",
        "request_id", reqID,
        "error_code", "ERRZAKAT001")
}
```
````

````

**Why it fails**: This is OSE Platform-specific convention. Belongs in docs/explanation/, not ayokoding-web.

**PASS: Generic Go error patterns**:

```markdown
# apps/ayokoding-web/.../golang/in-practice/error-handling.md

## Error Handling in Go

Go uses explicit error returns:

```go
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 2)
if err != nil {
    return fmt.Errorf("divide failed: %w", err)
}
````

Key takeaway: Check errors explicitly, wrap with context using `%w`.

```

**Why it passes**: Generic Go error patterns, no OSE Platform-specific conventions.

## Validation Checklist

Before publishing programming language documentation:

### For docs/explanation/ Style Guides

- [ ] README.md includes explicit prerequisite statement linking to ayokoding-web
- [ ] Content focuses on OSE Platform-specific conventions, not language fundamentals
- [ ] No duplication of educational content from ayokoding-web
- [ ] Alignment section links to [Software Engineering Principles](../../principles/software-engineering/README.md)
- [ ] Cross-references to ayokoding-web for language learning
- [ ] Clear scope: "This is NOT a tutorial, see ayokoding-web"

### For ayokoding-web Educational Content

- [ ] Content covers language fundamentals and generic patterns (0-95% coverage)
- [ ] No OSE Platform-specific conventions (framework choices, naming standards)
- [ ] By-example tutorial follows [By Example Convention](../tutorials/by-example.md)
- [ ] In-practice guides follow [Programming Language Content Standard](../tutorials/programming-language-content.md)
- [ ] Optional cross-reference to docs/explanation/ for contributors
- [ ] Clear scope: Generic programming education, not repository-specific

## Related Conventions

**Documentation Organization**:

- [Diátaxis Framework](./diataxis-framework.md) - Four-category documentation organization (docs/ follows this)
- [File Naming Convention](./file-naming.md) - Kebab-case file naming rules
- [Plans Organization](./plans.md) - Project planning structure (not covered here)

**Tutorial Standards**:

- [Programming Language Content Standard](../tutorials/programming-language-content.md) - Full Set Tutorial Package for programming languages (ayokoding-web follows this)
- [By Example Tutorial](../tutorials/by-example.md) - Code-first tutorial standards (Component 3 of Full Set)
- [Tutorial Naming](../tutorials/naming.md) - Tutorial type standards and naming patterns

**Content Quality**:

- [Content Quality Principles](../writing/quality.md) - Universal quality standards for markdown content
- [README Quality](../writing/readme-quality.md) - README-specific quality standards

**Hugo Content**:

- [Hugo Content - ayokoding](../hugo/ayokoding.md) - Hextra theme conventions (ayokoding-web specific)
- [Hugo Content - Shared](../hugo/shared.md) - Common Hugo conventions (applies to ayokoding-web)

**Principles**:

- [Documentation First](../../principles/content/documentation-first.md) - Documentation is mandatory, not optional
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) - Clear separation prevents confusion
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) - Explicit prerequisite statements
- [Software Engineering Principles Index](../../principles/software-engineering/README.md) - Software engineering principles that style guides align with

## References

**Platform Documentation**:

- [Software Design Index](../../../docs/explanation/software-engineering/README.md) - Parent documentation for programming language style guides
- [ayokoding-web Hugo Site](../../../apps/ayokoding-web/README.md) - Educational programming content platform

**Repository Architecture**:

- [Repository Governance Architecture](../../repository-governance-architecture.md) - Six-layer architecture (this convention is Layer 2)
- [Conventions Index](../README.md) - Index of all documentation conventions

**External Resources**:

- [ayokoding.com](https://ayokoding.com/en/learn/software-engineering/programming-languages/) - Live educational platform (public URL)

## Agents

**Makers**:

- `docs-maker` - Creates style guide content in docs/explanation/ following this convention
- `apps-ayokoding-web-general-maker` - Creates educational content in ayokoding-web following this convention
- `apps-ayokoding-web-by-example-maker` - Creates by-example tutorials following separation rules

**Checkers**:

- `docs-checker` - Validates style guides follow this convention (prerequisite statements, no duplication)
- `apps-ayokoding-web-general-checker` - Validates educational content scope (no OSE Platform-specific content)
- `apps-ayokoding-web-facts-checker` - Validates factual correctness of educational content

**Fixers**:

- `docs-fixer` - Fixes style guide violations (adds missing prerequisite statements, removes duplicated content)
- `apps-ayokoding-web-general-fixer` - Fixes educational content violations (removes OSE Platform-specific content)

---

**Scope**: All programming languages in repository (Java, Python, Golang, TypeScript, Elixir, Kotlin, Dart, Rust, Clojure, F#, C#)
**Maintainers**: Repository Governance Team
```
