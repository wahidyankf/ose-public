---
title: "TDD Red-Green-Refactor Cycle Standards"
description: OSE Platform standards for the three-phase TDD rhythm
category: explanation
subcategory: development
tags:
  - tdd
  - red-green-refactor
  - testing-workflow
principles:
  - automation-over-manual
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-09
---

# TDD Red-Green-Refactor Cycle Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for the Red-Green-Refactor TDD cycle.

## REQUIRED: Follow Three-Phase Rhythm

**REQUIRED**: All production code MUST be developed using Red-Green-Refactor cycle.

### Red Phase: Write Failing Test

**REQUIRED**: Write failing test first.

**REQUIRED**: Verify test fails for correct reason (missing functionality, not typo).

**Example (Zakat Calculation)**:

```typescript
describe("ZakatCalculator", () => {
  it("should calculate 2.5% of wealth above Nisab", () => {
    // Arrange
    const wealth = Money.usd(100000);
    const nisab = NisabThreshold.goldEquivalent(Money.fromGold(87.48));

    // Act
    const zakat = ZakatCalculator.calculate(wealth, nisab);

    // Assert
    expect(zakat.equals(Money.usd(2500))).toBe(true);
  });
});

// Test fails ❌: ZakatCalculator.calculate is not defined
```

### Green Phase: Make It Pass

**REQUIRED**: Write simplest code to pass.

**PROHIBITED**: Adding features not covered by current test.

```typescript
class ZakatCalculator {
  static calculate(wealth: Money, nisab: NisabThreshold): Money {
    return wealth.multiply(0.025); // Simplest implementation
  }
}

// Test passes ✅
```

### Refactor Phase: Improve Design

**REQUIRED**: Refactor only when all tests green.

**REQUIRED**: Run tests after each small refactoring step.

```typescript
class ZakatCalculator {
  private static readonly ZAKAT_RATE = 0.025; // 2.5%

  static calculate(wealth: Money, nisab: NisabThreshold): Money {
    return wealth.multiply(this.ZAKAT_RATE);
  }
}

// Tests still pass ✅
```

## Cycle Timing

**REQUIRED**: Each cycle MUST take 2-10 minutes maximum.

**If longer**: Break into smaller steps.

## OSE Platform Examples

### Contract Activation Workflow

```java
// RED: Test contract activation
@Test
void shouldActivateContractWhenPendingAndValid() {
    // Arrange
    Contract contract = Contract.create(
        ContractId.generate(),
        Money.usd(10000),
        Money.usd(500) // 5% markup
    );

    // Act
    contract.activate();

    // Assert
    assertThat(contract.getStatus()).isEqualTo(ContractStatus.ACTIVE);
}

// Test fails ❌: activate() method doesn't exist

// GREEN: Implement activation
public void activate() {
    this.status = ContractStatus.ACTIVE;
}

// Test passes ✅

// REFACTOR: Add validation
public void activate() {
    if (this.status != ContractStatus.PENDING) {
        throw new IllegalStateException("Cannot activate non-pending contract");
    }
    this.status = ContractStatus.ACTIVE;
}

// Tests still pass ✅
```
