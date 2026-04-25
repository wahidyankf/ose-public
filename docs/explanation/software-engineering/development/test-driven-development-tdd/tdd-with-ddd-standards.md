---
title: "TDD with DDD Standards"
description: OSE Platform standards for testing aggregates, value objects, entities, and domain events
category: explanation
subcategory: development
tags:
  - tdd
  - ddd
  - domain-testing
principles:
  - explicit-over-implicit
  - pure-functions
created: 2026-02-09
---

# TDD with DDD Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/) and [AyoKoding DDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/) before using these standards.

## Purpose

OSE Platform standards for testing DDD tactical patterns.

## REQUIRED: Test Aggregate Invariants

**REQUIRED**: All aggregate invariants MUST be tested.

```java
@Test
void shouldEnforceMarkupLimit() {
    // Arrange & Act & Assert
    assertThatThrownBy(() ->
        Contract.create(
            Money.usd(10000),
            Money.usd(1100)  // 11% markup - exceeds 10% limit
        )
    )
    .isInstanceOf(InvalidMarkupException.class)
    .hasMessage("Markup cannot exceed 10% of asset price");
}

@Test
void shouldAllowValidMarkup() {
    // Arrange & Act
    Contract contract = Contract.create(
        Money.usd(10000),
        Money.usd(1000)  // 10% markup - valid
    );

    // Assert
    assertThat(contract.getMarkup()).isEqualTo(Money.usd(1000));
}
```

## REQUIRED: Test Value Object Immutability

**REQUIRED**: All value objects MUST test immutability.

```typescript
describe("Money Value Object", () => {
  it("should not mutate original on add operation", () => {
    // Arrange
    const original = Money.usd(100);
    const originalAmount = original.amount;

    // Act
    const sum = original.add(Money.usd(50));

    // Assert
    expect(original.amount).toBe(originalAmount); // Unchanged
    expect(sum.amount).toBe(150); // New instance
  });
});
```

## REQUIRED: Test Value Object Equality

**REQUIRED**: Value objects MUST test equality by value.

```java
@Test
void shouldBeEqualWhenValuesMatch() {
    // Arrange
    Money money1 = Money.usd(100);
    Money money2 = Money.usd(100);

    // Assert
    assertThat(money1.equals(money2)).isTrue();
    assertThat(money1).isNotSameAs(money2); // Different instances
}
```

## REQUIRED: Test Domain Event Emission

**REQUIRED**: Aggregates MUST test domain event emission.

```typescript
describe("ZakatAssessment - Domain Events", () => {
  it("should emit ZakatCalculated event on calculation", () => {
    // Arrange
    const assessment = ZakatAssessment.create(
      UserId.generate(),
      Money.usd(100000),
      NisabThreshold.goldEquivalent(Money.fromGold(87.48)),
    );

    // Act
    assessment.calculate();

    // Assert
    const events = assessment.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ZakatCalculated);
  });

  it("should include correct data in event", () => {
    // Arrange
    const userId = UserId.generate();
    const assessment = ZakatAssessment.create(
      userId,
      Money.usd(100000),
      NisabThreshold.goldEquivalent(Money.fromGold(87.48)),
    );

    // Act
    assessment.calculate();

    // Assert
    const event = assessment.getDomainEvents()[0] as ZakatCalculated;
    expect(event.userId.equals(userId)).toBe(true);
    expect(event.zakatAmount.equals(Money.usd(2500))).toBe(true);
  });
});
```

## REQUIRED: Test Entity Identity

**REQUIRED**: Entities MUST test identity-based equality.

```java
@Test
void shouldBeEqualByIdentity() {
    // Arrange
    DonationId id = DonationId.generate();
    Donation donation1 = new Donation(id, Money.usd(100));
    Donation donation2 = new Donation(id, Money.usd(200));

    // Assert
    assertThat(donation1.equals(donation2)).isTrue(); // Same ID
    assertThat(donation1.getAmount()).isNotEqualTo(donation2.getAmount()); // Different amounts
}
```

## OSE Platform Examples

### Testing Zakat Aggregate

```java
class ZakatAssessmentTest {
    @Test
    void shouldCalculateZakatWhenAboveNisab() {
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
        assertThat(assessment.getStatus())
            .isEqualTo(AssessmentStatus.CALCULATED);
    }

    @Test
    void shouldRejectCalculationBelowNisab() {
        // Arrange
        ZakatAssessment assessment = ZakatAssessment.create(
            UserId.generate(),
            Money.usd(1000), // Below Nisab
            NisabThreshold.goldEquivalent(Money.fromGold(87.48))
        );

        // Act & Assert
        assertThatThrownBy(() -> assessment.calculate())
            .isInstanceOf(BelowNisabException.class);
    }
}
```

### Testing FiscalDate Value Object

```typescript
describe("FiscalDate Value Object", () => {
  it("should validate Hijri month range", () => {
    // Act & Assert
    expect(() => FiscalDate.of(1445, 13, 1)).toThrow("Month must be between 1 and 12");
  });

  it("should compare dates correctly", () => {
    // Arrange
    const earlier = FiscalDate.of(1445, 1, 1);
    const later = FiscalDate.of(1445, 6, 1);

    // Assert
    expect(later.isAfter(earlier)).toBe(true);
  });

  it("should have value equality", () => {
    // Arrange
    const date1 = FiscalDate.of(1445, 1, 1);
    const date2 = FiscalDate.of(1445, 1, 1);

    // Assert
    expect(date1.equals(date2)).toBe(true);
    expect(date1).not.toBe(date2); // Different instances
  });
});
```
