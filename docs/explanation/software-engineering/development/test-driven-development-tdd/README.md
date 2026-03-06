---
title: "Test-Driven Development (TDD)"
description: OSE Platform TDD standards for Red-Green-Refactor cycle, testing frameworks, and domain-driven testing
category: explanation
subcategory: development
tags:
  - tdd
  - testing
  - red-green-refactor
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-09
updated: 2026-02-09
---

# Test-Driven Development (TDD)

**This is THE authoritative reference** for Test-Driven Development standards in OSE Platform.

All code developed for the OSE Platform MUST follow the TDD methodology and standards documented here.

## Testing Framework and Tool Requirements

**REQUIRED Testing Frameworks:**

- **Java**: JUnit 5 (Jupiter), Mockito, AssertJ
- **TypeScript**: Vitest (NOT Jest), Testing Library
- **Go**: Built-in `testing` package, testify/assert
- **Python**: pytest, pytest-mock
- **Elixir**: ExUnit (built-in)

**REQUIRED Test Runner:**

- **Nx Monorepo**: `nx run [project-name]:test:quick` (pre-push gate), `nx run [project-name]:test:unit` (isolated unit tests), `nx affected -t test:quick` (affected projects). See [Nx Target Standards](../../../../../governance/development/infra/nx-targets.md) for canonical target names.

**PROHIBITED:**

- Jest (use Vitest for TypeScript)
- JUnit 4 (use JUnit 5)
- Mocha/Chai (use Vitest)

## Prerequisite Knowledge

**REQUIRED**: This documentation assumes you have completed the AyoKoding Test-Driven Development learning path. These are **OSE Platform-specific TDD standards**, not educational tutorials.

**You MUST understand TDD fundamentals before using these standards:**

- **[Test-Driven Development Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/)** - Educational foundation for TDD practices
- **[Test-Driven Development Overview](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/overview.md)** - Core TDD concepts (Red-Green-Refactor, test types, FIRST principles)
- **[Test-Driven Development By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/)** - Practical TDD examples

**What this documentation covers**: OSE Platform-specific TDD patterns, Islamic finance domain testing, Nx monorepo testing strategy, repository-specific test organization, integration with DDD patterns.

**What this documentation does NOT cover**: TDD fundamentals, Red-Green-Refactor basics, generic testing patterns (those are in ayokoding-web).

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Software Engineering Principles

TDD standards in OSE Platform align with core software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Red-Green-Refactor cycle automates verification. Tests run constantly (every 1-2 minutes), replacing manual testing entirely. FIRST principles enable continuous automated testing.

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - Test-first approach makes requirements explicit before implementation. AAA pattern (Arrange-Act-Assert) explicitly declares test structure. Test names explicitly describe expected behavior.

3. **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)** - FIRST principles (Independent, Repeatable) ensure reproducible test execution. Deterministic tests produce same results across environments and time. No flaky tests.

4. **[Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)** - Pure functions are inherently testable—no mocks, no setup, no teardown. TDD drives toward pure, composable functions through test feedback.

5. **[Simplicity Over Complexity](../../../../../governance/principles/general/simplicity-over-complexity.md)** - Green phase enforces simplest code to pass. Refactor phase improves design incrementally. Each cycle takes minutes—simplicity through tiny verified steps.

## OSE Platform TDD Standards

### 1. Red-Green-Refactor Cycle

**[Red-Green-Refactor Cycle Standards](./ex-soen-de-tedrdetd__tdd-cycle-standards.md)**

- REQUIRED: Follow Red-Green-Refactor rhythm
- REQUIRED: See red before green
- REQUIRED: Each cycle 2-10 minutes maximum

### 2. Test Structure and Organization

**[Testing Standards](./ex-soen-de-tedrdetd__testing-standards.md)**

- REQUIRED: FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely)
- REQUIRED: AAA pattern (Arrange-Act-Assert)
- REQUIRED: One logical assertion per test

### 3. Test Doubles

**[Test Doubles Standards](./ex-soen-de-tedrdetd__test-doubles-standards.md)**

- REQUIRED: Use in-memory implementations over mocks when possible
- REQUIRED: Verify interactions only when testing behavior, not implementation

### 4. Three-Tier Testing Model

**[Three-Tier Testing Model](./ex-soen-de-tedrdetd__three-tier-testing.md)**

- REQUIRED: Unit and integration tests MUST mock all external I/O
- REQUIRED: E2E tests MUST NOT mock anything
- REQUIRED: Separate unit, integration, and E2E tests by directory

### 5. Integration Testing

**[Integration Testing Standards](./ex-soen-de-tedrdetd__integration-testing-standards.md)**

- REQUIRED: Use in-memory repository implementations (NOT Testcontainers)
- REQUIRED: Use MSW (TypeScript) or WireMock (Java) for outbound HTTP
- REQUIRED: Separate unit tests from integration tests
- PROHIBITED: Real databases, real network calls in integration tests

### 6. TDD with Domain-Driven Design

**[TDD with DDD Standards](./ex-soen-de-tedrdetd__tdd-with-ddd-standards.md)**

- REQUIRED: Test aggregate invariants
- REQUIRED: Test value object immutability and equality
- REQUIRED: Verify domain events emitted

## OSE Platform Testing Examples

### Zakat Assessment Aggregate Testing

```java
@Test
void shouldCalculateZakatWhenWealthExceedsNisab() {
    // Arrange
    ZakatAssessment assessment = ZakatAssessment.create(
        UserId.generate(),
        Money.usd(100000),
        NisabThreshold.goldEquivalent(Money.fromGold(87.48))
    );

    // Act
    assessment.calculate();

    // Assert
    assertThat(assessment.getZakatDue())
        .isEqualTo(Money.usd(2500)); // 2.5% of wealth
}

@Test
void shouldRejectCalculationWhenBelowNisab() {
    // Arrange
    ZakatAssessment assessment = ZakatAssessment.create(
        UserId.generate(),
        Money.usd(1000), // Below Nisab
        NisabThreshold.goldEquivalent(Money.fromGold(87.48))
    );

    // Act & Assert
    assertThatThrownBy(() -> assessment.calculate())
        .isInstanceOf(BelowNisabException.class)
        .hasMessage("Wealth below Nisab threshold");
}
```

### Money Value Object Testing

```typescript
describe("Money Value Object", () => {
  it("should enforce immutability on operations", () => {
    // Arrange
    const original = Money.usd(100);
    const originalAmount = original.amount;

    // Act
    const sum = original.add(Money.usd(50));

    // Assert
    expect(original.amount).toBe(originalAmount); // Unchanged
    expect(sum.amount).toBe(150); // New instance
  });

  it("should reject currency mismatch", () => {
    // Arrange
    const usd = Money.usd(100);
    const eur = Money.eur(100);

    // Act & Assert
    expect(() => usd.add(eur)).toThrow(CurrencyMismatchError);
  });
});
```

### Domain Event Testing

```java
@Test
void shouldEmitDonationReceivedEventOnConfirmation() {
    // Arrange
    Donation donation = Donation.create(
        DonationId.generate(),
        CampaignId.of("CAMPAIGN-001"),
        Money.usd(500)
    );

    // Act
    donation.confirm();

    // Assert
    List<DomainEvent> events = donation.getDomainEvents();
    assertThat(events).hasSize(1);
    assertThat(events.get(0)).isInstanceOf(DonationReceived.class);
}
```

## Test Organization in Nx Monorepo

**REQUIRED Test Directory Structure:**

```
apps/
  zakat-context/
    src/
      test/
        unit/          # Fast unit tests
        integration/   # Database, API tests
        e2e/          # End-to-end flows
```

**REQUIRED Test Naming:**

- Unit tests: `*.spec.ts` (TypeScript), `*Test.java` (Java), `*_test.go` (Go)
- Integration tests: `*.integration.spec.ts`, `*IntegrationTest.java`
- E2E tests: `*.e2e.spec.ts`, `*E2ETest.java`

## Coverage Requirements

**REQUIRED Coverage Minimums:**

- Unit tests: 85% code coverage
- Integration tests: Critical paths covered
- E2E tests: Happy paths + critical error scenarios

**PROHIBITED:**

- Chasing 100% coverage (diminishing returns)
- Testing framework code or external libraries
- Testing getters/setters without logic

## Validation Checklist

Before merging code, verify:

- [ ] **Red-Green-Refactor cycle followed**: Each feature has failing test first
- [ ] **FIRST principles satisfied**: Tests are Fast, Independent, Repeatable, Self-validating, Timely
- [ ] **AAA pattern used**: Arrange-Act-Assert structure clear
- [ ] **Domain invariants tested**: Aggregate business rules verified
- [ ] **Value objects immutable**: Tests verify immutability
- [ ] **Domain events emitted**: Tests verify event emission on domain actions
- [ ] **85% coverage minimum**: Critical business logic covered
- [ ] **Integration tests mock external I/O**: In-memory repos and MSW/WireMock — no real DB, no real network
- [ ] **E2E tests use no mocking**: All external dependencies are real
- [ ] **No flaky tests**: All tests pass consistently

## Related Standards

- **[Domain-Driven Design Standards](../../architecture/domain-driven-design-ddd/README.md)** - Testing DDD tactical patterns
- **[BDD Standards](../behavior-driven-development-bdd/README.md)** - Acceptance testing with Gherkin
- **[Java Coding Standards](../../programming-languages/java/README.md)** - Java testing conventions
- **[TypeScript Coding Standards](../../programming-languages/typescript/README.md)** - TypeScript testing conventions

## Principles Implemented

- **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**: By automating verification through Red-Green-Refactor cycles and continuous test execution, TDD eliminates manual testing and provides immediate feedback.

- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: By writing tests first, requirements become explicit specifications. AAA pattern and descriptive test names make expected behavior clear.

- **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)**: By enforcing FIRST principles (Independent, Repeatable), tests produce consistent results across environments and time, enabling reliable CI/CD pipelines.

---

**Last Updated**: 2026-02-09
