---
title: "TDD Testing Standards"
description: OSE Platform standards for test structure, FIRST principles, and test organization
category: explanation
subcategory: development
tags:
  - tdd
  - testing
  - first-principles
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-09
---

# TDD Testing Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/) before using these standards.

## Purpose

OSE Platform testing standards for test structure and organization.

## REQUIRED: FIRST Principles

**REQUIRED**: All tests MUST follow FIRST principles.

- **F**ast: Unit tests complete in milliseconds
- **I**ndependent: No shared state between tests
- **R**epeatable: Same results every run
- **S**elf-validating: Pass/fail, no manual verification
- **T**imely: Written before production code (Red-Green-Refactor)

## REQUIRED: AAA Pattern

**REQUIRED**: All tests MUST use Arrange-Act-Assert pattern.

```java
@Test
void shouldCalculateZakatForWealthAboveNisab() {
    // ARRANGE: Set up test data
    Money wealth = Money.usd(100000);
    NisabThreshold nisab = NisabThreshold.goldEquivalent(Money.fromGold(87.48));

    // ACT: Execute behavior
    Money zakat = ZakatCalculator.calculate(wealth, nisab);

    // ASSERT: Verify outcome
    assertThat(zakat).isEqualTo(Money.usd(2500));
}
```

## Test Naming

**REQUIRED**: Test names MUST describe behavior in plain language.

**Format**: `should [expected behavior] when [context]`

**Examples**:

- ✅ `shouldCalculateZakatWhenWealthExceedsNisab`
- ✅ `shouldRejectDonationWhenCampaignExpired`
- ❌ `test1` (vague)
- ❌ `testCalculate` (doesn't describe behavior)

## One Logical Assertion Per Test

**REQUIRED**: Each test MUST verify one logical assertion.

**Good** (single logical assertion):

```typescript
it("should reject negative donation amount", () => {
  // Act & Assert
  expect(() => Donation.create(Money.usd(-100))).toThrow(InvalidDonationError);
});
```

**Bad** (multiple unrelated assertions):

```typescript
it("should handle donation", () => {
  // Testing too many things at once
  expect(donation.amount).toBe(100);
  expect(donation.status).toBe("PENDING");
  expect(donation.campaign).toBeDefined();
  expect(donation.createdAt).toBeInstanceOf(Date);
});
```

## Test Independence

**REQUIRED**: Tests MUST NOT depend on execution order.

**PROHIBITED**: Shared mutable state between tests.

**Good** (independent tests):

```java
@BeforeEach
void setUp() {
    // Fresh repository for each test
    repository = new InMemoryDonationRepository();
}

@Test
void shouldSaveDonation() {
    Donation donation = buildDonation();
    repository.save(donation);

    assertThat(repository.findById(donation.getId()))
        .isPresent();
}
```

## Mocking Boundary

**REQUIRED**: Unit and integration tests MUST mock all external I/O.

**REQUIRED**: E2E tests MUST NOT mock anything.

| Tier        | External I/O | DB                      | Outbound HTTP  |
| ----------- | ------------ | ----------------------- | -------------- |
| Unit        | Mocked       | Mocked / in-memory impl | Mocked         |
| Integration | Mocked       | In-memory impl          | MSW / WireMock |
| E2E         | Real         | Real                    | Real           |

**See**: [Three-Tier Testing Model](./three-tier-testing.md) for full definitions and examples.

## OSE Platform Test Organization

**REQUIRED Directory Structure:**

```
src/
  test/
    unit/               # Fast isolated tests — all collaborators mocked
    integration/        # Internal layers wired — external I/O mocked
    e2e/               # Full system — no mocking
```

**File Naming:**

- Unit: `ZakatCalculatorTest.java`, `ZakatCalculator.unit.test.ts`
- Integration: `MemberListIntegrationTest.java`, `member-list.integration.test.tsx`
- E2E: `*.feature` + step definitions (Gherkin-driven via Playwright / Cucumber)
