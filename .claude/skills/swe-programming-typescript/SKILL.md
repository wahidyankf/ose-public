---
name: swe-programming-typescript
description: TypeScript coding standards from authoritative docs/explanation/software-engineering/programming-languages/typescript/ documentation
---

# TypeScript Coding Standards

## Purpose

Progressive disclosure of TypeScript coding standards for agents writing TypeScript code.

**Authoritative Source**: [docs/explanation/software-engineering/programming-languages/typescript/README.md](../../../docs/explanation/software-engineering/programming-languages/typescript/README.md)

**Usage**: Auto-loaded for agents when writing TypeScript code. Provides quick reference to idioms, best practices, and antipatterns.

## Quick Standards Reference

### Naming Conventions

**Types and Interfaces**: PascalCase

- Types: `UserAccount`, `PaymentDetails`
- Interfaces: `IPaymentProcessor` or `PaymentProcessor` (no prefix preferred)
- Type aliases: `type UserId = string`

**Functions and Variables**: camelCase

- Functions: `calculateTotal()`, `findUserById()`
- Variables: `userName`, `totalAmount`
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `API_ENDPOINT`)

**Files**: kebab-case

- `user-account.ts`, `payment-processor.ts`

### Modern TypeScript Features

**Type Inference**: Let TypeScript infer when obvious

```typescript
const name = "John"; // string inferred
const count = 42; // number inferred
```

**Union Types**: Use for multiple possible types

```typescript
type Result = Success | Error;
type Status = "pending" | "completed" | "failed";
```

**Type Guards**: Use for type narrowing

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}
```

**Generics**: Use for reusable type-safe code

```typescript
function identity<T>(value: T): T {
  return value;
}
```

**Utility Types**: Leverage built-in utilities

- `Partial<T>`: Make all properties optional
- `Pick<T, K>`: Select specific properties
- `Omit<T, K>`: Remove specific properties
- `Readonly<T>`: Make all properties readonly

### Error Handling

**Result Pattern**: Prefer over throwing exceptions

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

**Error Types**: Define specific error types

```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

### Testing Standards

**Jest/Vitest**: Primary testing frameworks

- `describe()` for test suites
- `it()` or `test()` for individual tests
- `beforeEach()`, `afterEach()` for setup

**Type-safe Tests**: Ensure tests are type-checked

```typescript
it("should return user", () => {
  const user: User = findUser("123");
  expect(user.name).toBe("John");
});
```

### Security Practices

**No `any`**: Avoid `any` type

- Use `unknown` for truly unknown types
- Use generics for flexible typing

**Input Validation**: Validate external data

- Use Zod or similar for runtime validation
- Validate before processing

**XSS Prevention**: Sanitize user input

- Use framework escaping (React, Angular)
- Never use `dangerouslySetInnerHTML` without sanitization

## Comprehensive Documentation

For detailed guidance, refer to:

- **[Idioms](../../../docs/explanation/software-engineering/programming-languages/typescript/idioms.md)** - TypeScript-specific patterns
- **[Best Practices](../../../docs/explanation/software-engineering/programming-languages/typescript/best-practices.md)** - Clean code standards
- **[Anti-Patterns](../../../docs/explanation/software-engineering/programming-languages/typescript/anti-patterns.md)** - Common mistakes

## Test-Driven Development

TDD is required for all TypeScript code changes. Write the failing Vitest test first, confirm it
fails for the right reason, implement the minimum code to pass, then refactor. For TypeScript the
primary levels are unit (Vitest), integration (MSW for network boundaries), E2E (Playwright), and
property/fuzz (fast-check for invariants over generated inputs). Pick the cheapest level that
captures the behavior.

**Canonical reference**:
[Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)

## Related Skills

- docs-applying-content-quality
- repo-practicing-trunk-based-development

## References

- [TypeScript README](../../../docs/explanation/software-engineering/programming-languages/typescript/README.md)
- [Functional Programming](../../../governance/development/pattern/functional-programming.md)
