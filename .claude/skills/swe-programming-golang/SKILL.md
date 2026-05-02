---
name: swe-programming-golang
description: Go coding standards from authoritative docs/explanation/software-engineering/programming-languages/golang/ documentation
---

# Go Coding Standards

## Purpose

Progressive disclosure of Go coding standards for agents writing Go code.

**Authoritative Source**: [docs/explanation/software-engineering/programming-languages/golang/README.md](../../../docs/explanation/software-engineering/programming-languages/golang/README.md)

**Usage**: Auto-loaded for agents when writing Go code. Provides quick reference to idioms, best practices, and antipatterns.

## Prerequisite Knowledge

**IMPORTANT**: This skill provides **OSE Platform-specific style guides**, not educational tutorials.

**You MUST understand Go fundamentals before using these standards.** Complete the AyoKoding Go learning path first:

1. **[Go Learning Path](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/)** - Initial setup, language overview, quick start guide (0-95% language coverage)
2. **[Go By Example](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/by-example/)** - 75+ heavily annotated code examples (beginner to advanced patterns)
3. **[Go In the Field](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/in-the-field/)** - 37+ production implementation guides (standard library first, framework integration)
4. **[Go Release Highlights](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/release-highlights/)** - Go 1.18-1.26 features (generics, fuzzing, PGO, iterators, Green Tea GC default, self-referential generics, errors.AsType)

**What this skill covers**: OSE Platform naming conventions, framework choices, repository-specific patterns, how to apply Go knowledge in THIS codebase.

**What this skill does NOT cover**: Go syntax, language fundamentals, generic patterns (those are in ayokoding-web).

**See**: [Programming Language Documentation Separation](../../../governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Quick Standards Reference

### Naming Conventions

**Packages**: lowercase, single word

- `http`, `json`, `user`, `payment`
- Avoid underscores

**Types and Functions**: MixedCaps

- Exported: `UserAccount`, `CalculateTotal()`
- Unexported: `userAccount`, `calculateTotal()`

**Variables**: Short names in limited scope

- `i`, `j` for loop counters
- `r` for reader, `w` for writer
- Descriptive names for package-level: `defaultTimeout`

**Constants**: MixedCaps (not UPPER_CASE)

- `MaxRetries`, `DefaultTimeout`

### Modern Go Features (Go 1.18+)

**Generics**: Use for type-safe data structures

```go
func Map[T, U any](slice []T, f func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = f(v)
    }
    return result
}
```

**Error Wrapping**: Use `fmt.Errorf` with `%w`

```go
if err != nil {
    return fmt.Errorf("failed to process user: %w", err)
}
```

**Struct Embedding**: Use for composition

```go
type User struct {
    BaseModel
    Name string
}
```

### Error Handling

**Explicit Error Returns**: Always check errors

```go
result, err := doSomething()
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}
```

**Custom Error Types**: Define for specific cases

```go
type ValidationError struct {
    Field string
    Err   error
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for %s: %v", e.Field, e.Err)
}
```

**Error Wrapping**: Preserve error chain

```go
return fmt.Errorf("processing user %s: %w", userID, err)
```

### Concurrency

**Goroutines**: Use for concurrent operations

```go
go func() {
    // Concurrent work
}()
```

**Channels**: Use for communication

```go
ch := make(chan Result, 10) // Buffered
ch <- result                // Send
result := <-ch              // Receive
```

**Context**: Use for cancellation and timeouts

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

### Testing Standards

**Table-Driven Tests**: Preferred testing pattern

```go
tests := []struct {
    name     string
    input    int
    expected int
}{
    {"positive", 5, 10},
    {"zero", 0, 0},
    {"negative", -5, -10},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        result := double(tt.input)
        if result != tt.expected {
            t.Errorf("got %d, want %d", result, tt.expected)
        }
    })
}
```

**Test Helpers**: Use `t.Helper()` for helper functions

```go
func assertEqual(t *testing.T, got, want any) {
    t.Helper()
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}
```

### Security Practices

**Input Validation**: Validate all external input

- Check bounds, formats, and types
- Reject invalid input early

**SQL Injection**: Use parameterized queries

```go
rows, err := db.Query("SELECT * FROM users WHERE id = ?", userID)
```

**Context Timeouts**: Always set timeouts

```go
ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
defer cancel()
```

## Comprehensive Documentation

**Authoritative Index**: [docs/explanation/software-engineering/programming-languages/golang/README.md](../../../docs/explanation/software-engineering/programming-languages/golang/README.md)

### Mandatory Standards (All Go Code MUST Follow)

1. **[Coding Standards](../../../docs/explanation/software-engineering/programming-languages/golang/coding-standards.md)** - Naming conventions, package organization, Effective Go idioms
2. **[Testing Standards](../../../docs/explanation/software-engineering/programming-languages/golang/testing-standards.md)** - Table-driven tests, testify, gomock, TestContainers, Godog
3. **[Code Quality Standards](../../../docs/explanation/software-engineering/programming-languages/golang/code-quality-standards.md)** - golangci-lint, gofmt, staticcheck, go vet
4. **[Build Configuration](../../../docs/explanation/software-engineering/programming-languages/golang/build-configuration.md)** - go.mod structure, Makefile patterns, CI/CD integration

### Context-Specific Standards (Apply When Relevant)

1. **[Error Handling Standards](../../../docs/explanation/software-engineering/programming-languages/golang/error-handling-standards.md)** - Error wrapping, sentinel errors, custom error types
2. **[Concurrency Standards](../../../docs/explanation/software-engineering/programming-languages/golang/concurrency-standards.md)** - Goroutines, channels, context, race detection
3. **[Type Safety Standards](../../../docs/explanation/software-engineering/programming-languages/golang/type-safety-standards.md)** - Generics, type parameters, constraints, type assertions
4. **[Performance Standards](../../../docs/explanation/software-engineering/programming-languages/golang/performance-standards.md)** - Profiling with pprof, benchmarking, memory optimization
5. **[Security Standards](../../../docs/explanation/software-engineering/programming-languages/golang/security-standards.md)** - Input validation, injection prevention, crypto practices
6. **[API Standards](../../../docs/explanation/software-engineering/programming-languages/golang/api-standards.md)** - REST conventions, HTTP routing, middleware patterns
7. **[DDD Standards](../../../docs/explanation/software-engineering/programming-languages/golang/ddd-standards.md)** - Domain-Driven Design tactical patterns without classes
8. **[Dependency Standards](../../../docs/explanation/software-engineering/programming-languages/golang/dependency-standards.md)** - Go modules, version selection, replace directives
9. **[Design Patterns](../../../docs/explanation/software-engineering/programming-languages/golang/design-patterns.md)** - Common Go patterns (functional options, interface design)

## Test-Driven Development

TDD is required for all Go code changes. Write the failing test first using Go `testing` (or a
Godog step definition consuming a Gherkin scenario from `specs/apps/<app-name>/`), confirm it fails
for the right reason, implement the minimum code to pass, then refactor. For Go CLI projects the
primary levels are unit (Go `testing` + Godog, mocked I/O via package-level function vars) and
integration (Godog `//go:build integration` + real `/tmp` filesystem). Property-based testing via
gopter covers invariants over generated inputs.

**Canonical reference**:
[Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)

## Related Skills

- docs-applying-content-quality
- repo-practicing-trunk-based-development

## References

- [Go README](../../../docs/explanation/software-engineering/programming-languages/golang/README.md)
- [Functional Programming](../../../governance/development/pattern/functional-programming.md)
