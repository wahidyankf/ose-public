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

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/development/test-driven-development-tdd/by-example/) before using these standards.

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

```rust
#[test]
fn should_calculate_zakat_for_wealth_above_nisab() {
    // ARRANGE: Set up test data
    let wealth = Money::usd(100_000);
    let nisab = NisabThreshold::gold_equivalent(Money::from_gold(87.48));

    // ACT: Execute behaviour
    let zakat = ZakatCalculator::calculate(wealth, nisab);

    // ASSERT: Verify outcome
    assert_eq!(zakat, Money::usd(2_500));
}
```

## Test Naming

**REQUIRED**: Test names MUST describe behaviour in plain language.

**Format**: `should [expected behaviour] when [context]`

**Examples**:

- ✅ `shouldCalculateZakatWhenWealthExceedsNisab`
- ✅ `shouldRejectDonationWhenCampaignExpired`
- ❌ `test1` (vague)
- ❌ `testCalculate` (doesn't describe behaviour)

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

```rust
mod tests {
    use super::*;

    fn make_repository() -> InMemoryDonationRepository {
        // Fresh repository for each test — call this in every test function
        InMemoryDonationRepository::new()
    }

    #[test]
    fn should_save_donation() {
        let mut repository = make_repository();
        let donation = build_donation();
        repository.save(donation.clone());

        assert!(repository.find_by_id(&donation.id).is_some());
    }
}
```

## Boundary Contract

- **Unit**: mandatory in-process production behaviour with filesystem, environment, process,
  network, clock, and randomness replaced by deterministic injected ports; a shell script or harness
  plugin subject follows [Script-Subject Unit Proof](../../../../../repo-governance/development/behaviour-driven-development/script-subject-unit-proof.md) instead.
- **Integration**: at least one real isolated same-machine resource, optionally an allowlisted
  loopback socket the test owns, and zero external network. In-memory repositories and intercepted
  HTTP remain Unit proof.
- **E2E**: a real public browser, HTTP/API, or published process boundary with isolated synthetic
  identity/data and no fallback to developer, staging, or production state.

**See**: [Three-Level Testing Model](./three-tier-testing.md) for full definitions, applicability,
and examples.

## OSE Platform Test Organization

**REQUIRED Directory Structure:**

```
src/
  test/
    unit/               # Mandatory in-process deterministic tests
    integration/        # Real isolated local resources; no external network
    e2e/                # Real public browser/API/process boundary
```

**File Naming:**

- Unit: `zakat_calculator_test.rs` (Rust `#[cfg(test)]` module), `ZakatCalculator.unit.test.ts`
- Integration: `member_list_integration_test.rs`, `member-list.integration.test.tsx`
- E2E: `*.feature` + step definitions (Gherkin-driven via Playwright / Cucumber)
