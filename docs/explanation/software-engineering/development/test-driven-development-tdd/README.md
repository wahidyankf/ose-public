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
---

# Test-Driven Development (TDD)

TDD is a practical way to turn a small, observable expectation into safer code. This is the authoritative TDD standard for OSE Platform, with the repository-specific rules that sit around the familiar red–green–refactor loop.

All code developed for the OSE Platform MUST follow the TDD methodology and standards documented here.

## Testing Framework and Tool Requirements

**REQUIRED Testing Frameworks:**

- **TypeScript**: Vitest (NOT Jest), Testing Library
- **Rust**: Built-in `#[test]` + `cargo-llvm-cov`, `cucumber` crate for Gherkin
- **.NET/F#**: xUnit, FsUnit, FsCheck

**REQUIRED Test Runner:**

- **Nx Monorepo**:
  `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:quick`
  (pre-push gate),
  `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:unit`
  (isolated unit tests), and
  `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:quick`
  (affected projects). See
  [Nx Target Standards](../../../../../repo-governance/development/infra/nx-targets.md) for canonical
  target names.

**PROHIBITED:**

- Jest (use Vitest for TypeScript)
- Mocha/Chai (use Vitest)

## Before You Start

These are **OSE Platform-specific TDD standards**, not a first lesson in unit testing. If red–green–refactor is new to you, use the learning material first; otherwise, continue to the standards below.

**You MUST understand TDD fundamentals before using these standards:**

- **[Test-Driven Development Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/development/test-driven-development-tdd/)** - Educational foundation for TDD practices
- **[Test-Driven Development Overview](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/development/test-driven-development-tdd/overview.md)** - Core TDD concepts (Red-Green-Refactor, test types, FIRST principles)
- **[Test-Driven Development By Example](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/development/test-driven-development-tdd/by-example/)** - Practical TDD examples

**What this documentation covers**: OSE Platform-specific TDD patterns, Islamic finance domain testing, Nx monorepo testing strategy, repository-specific test organization, integration with DDD patterns.

**What this documentation does NOT cover**: TDD fundamentals, Red-Green-Refactor basics, generic testing patterns (those are in ayokoding-www).

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Software Engineering Principles

TDD standards in OSE Platform align with core software engineering principles:

1. **[Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)** - Red-Green-Refactor cycle automates verification. Tests run constantly (every 1-2 minutes), replacing manual testing entirely. FIRST principles enable continuous automated testing.

2. **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)** - Test-first approach makes requirements explicit before implementation. AAA pattern (Arrange-Act-Assert) explicitly declares test structure. Test names explicitly describe expected behaviour.

3. **[Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)** - FIRST principles (Independent, Repeatable) ensure reproducible test execution. Deterministic tests produce same results across environments and time. No flaky tests.

4. **[Pure Functions Over Side Effects](../../../../../repo-governance/principles/software-engineering/pure-functions.md)** - Pure functions are inherently testable—no mocks, no setup, no teardown. TDD drives toward pure, composable functions through test feedback.

5. **[Simplicity Over Complexity](../../../../../repo-governance/principles/general/simplicity-over-complexity.md)** - Green phase enforces simplest code to pass. Refactor phase improves design incrementally. Each cycle takes minutes—simplicity through tiny verified steps.

## OSE Platform TDD Standards

### 1. Red-Green-Refactor Cycle

**[Red-Green-Refactor Cycle Standards](./tdd-cycle-standards.md) — OSE Platform standards for the three-phase TDD rhythm**

- REQUIRED: Follow Red-Green-Refactor rhythm
- REQUIRED: See red before green
- REQUIRED: Each cycle 2-10 minutes maximum

### 2. Test Structure and Organization

**[Testing Standards](./testing-standards.md) — OSE Platform standards for test structure, FIRST principles, and test organization**

- REQUIRED: FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely)
- REQUIRED: AAA pattern (Arrange-Act-Assert)
- REQUIRED: One logical assertion per test

### 3. Test Doubles

**[Test Doubles Standards](./test-doubles-standards.md) — OSE Platform standards for mocks, stubs, spies, and fakes**

- REQUIRED: Use in-memory implementations over mocks when possible
- REQUIRED: Verify interactions only when testing behaviour, not implementation

### 4. Three-Tier Testing Model

**[Three-Tier Testing Model](./three-tier-testing.md) — Authoritative OSE Platform definition of unit, integration, and E2E test tiers**

- REQUIRED: Unit tests remain in-process and use no real filesystem, environment, process, network, clock, or random boundary
- REQUIRED: Integration tests may use deterministic local resources, processes, and an allowlisted loopback socket the test owns, but no external network
- REQUIRED: E2E tests exercise a public browser, HTTP/API, or process boundary with isolated synthetic data
- REQUIRED: Separate unit, integration, and E2E tests by directory

### 5. Integration Testing

**[Integration Testing Standards](./integration-testing-standards.md) — OSE Platform standards for deterministic local-resource and process integration testing**

- REQUIRED: Use isolated local fixtures, embedded databases accessed without network transport,
  filesystems, process environment, or subprocess streams only when the exercised boundary requires them
- REQUIRED: Replace outbound network dependencies with in-process fakes; a loopback server the test did not start belongs to E2E
- REQUIRED: Separate unit tests from integration tests
- PROHIBITED: Networked databases, external HTTP/TCP/UDP, or an unallowlisted loopback socket in Integration tests

### 6. TDD with Domain-Driven Design

**[TDD with DDD Standards](./tdd-with-ddd-standards.md) — OSE Platform standards for testing aggregates, value objects, entities, and domain events**

- REQUIRED: Test aggregate invariants
- REQUIRED: Test value object immutability and equality
- REQUIRED: Verify domain events emitted

## OSE Platform Testing Examples

### Zakat Assessment Aggregate Testing

```rust
#[test]
fn should_calculate_zakat_when_wealth_exceeds_nisab() {
    // Arrange
    let assessment = ZakatAssessment::create(
        UserId::generate(),
        Money::usd(100_000),
        NisabThreshold::gold_equivalent(Money::from_gold(87.48)),
    );

    // Act
    let result = assessment.calculate();

    // Assert
    assert_eq!(result.unwrap().zakat_due, Money::usd(2_500)); // 2.5% of wealth
}

#[test]
fn should_reject_calculation_when_below_nisab() {
    // Arrange
    let assessment = ZakatAssessment::create(
        UserId::generate(),
        Money::usd(1_000), // Below Nisab
        NisabThreshold::gold_equivalent(Money::from_gold(87.48)),
    );

    // Act & Assert
    let err = assessment.calculate().unwrap_err();
    assert!(matches!(err, ZakatError::BelowNisab));
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

```rust
#[test]
fn should_emit_donation_received_event_on_confirmation() {
    // Arrange
    let mut donation = Donation::create(
        DonationId::generate(),
        CampaignId::new("CAMPAIGN-001"),
        Money::usd(500),
    );

    // Act
    donation.confirm();

    // Assert
    let events = donation.domain_events();
    assert_eq!(events.len(), 1);
    assert!(matches!(events[0], DomainEvent::DonationReceived(_)));
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
        integration/   # Real isolated local resources; no external network
        e2e/           # Public browser, HTTP/API, or process flows
```

**REQUIRED Test Naming:**

- Unit tests: `*.spec.ts` (TypeScript), `*_test.rs` in `#[cfg(test)]` modules (Rust), `*Tests.fs` (F#)
- Integration tests: `*.integration.spec.ts`, `*_integration_tests.rs` (Rust)
- E2E tests: `*.e2e.spec.ts` (TypeScript Playwright)

## Coverage Requirements

**REQUIRED Coverage Minimums:**

- Unit tests: hard minimum 99% line coverage in `test:unit`
- Integration tests: every applicable isolated non-network local-resource path covered
- E2E tests: every applicable public-boundary happy path and critical error scenario covered

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
- [ ] **99% Unit line coverage minimum**: `test:unit` owns and enforces the native runtime threshold
- [ ] **Integration boundary is real and owned**: Isolated local resources, plus loopback only when allowlisted; no external network
- [ ] **E2E enters through a public boundary**: Browser, HTTP/API, or process path with isolated synthetic data; no uncontrolled external service
- [ ] **No flaky tests**: All tests pass consistently

## Related Standards

- **[Domain-Driven Design Standards](../../architecture/domain-driven-design-ddd/README.md)** - Testing DDD tactical patterns
- **[BDD Standards](../behaviour-driven-development-bdd/README.md)** - Acceptance testing with Gherkin
- **[TypeScript Coding Standards](../../programming-languages/typescript/README.md)** - TypeScript testing conventions

## Principles Implemented

- **[Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)**: By automating verification through Red-Green-Refactor cycles and continuous test execution, TDD eliminates manual testing and provides immediate feedback.

- **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)**: By writing tests first, requirements become explicit specifications. AAA pattern and descriptive test names make expected behaviour clear.

- **[Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)**: By enforcing FIRST principles (Independent, Repeatable), tests produce consistent results across environments and time, enabling reliable CI/CD pipelines.
