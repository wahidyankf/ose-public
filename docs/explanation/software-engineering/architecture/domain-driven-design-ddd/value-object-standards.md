---
title: "DDD Value Object Standards"
description: OSE Platform standards for immutable value objects in Islamic finance domains
category: explanation
subcategory: architecture
tags:
  - ddd
  - value-objects
  - immutability
principles:
  - immutability
  - explicit-over-implicit
created: 2026-02-09
---

# DDD Value Object Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding DDD Value Objects](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/) before using these standards.

## Purpose

OSE Platform value object standards for domain primitives.

## REQUIRED: Use Immutable Value Objects

**REQUIRED**: All domain primitives MUST be implemented as immutable value objects.

**Implementation**:

- **Java**: Use `record` (Java 17+)
- **TypeScript**: Use `readonly` properties
- **Go**: Use immutable structs

## OSE Platform Value Objects

### Money

**REQUIRED for all financial amounts**:

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }

    public Money add(Money other) {
        assertSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money multiply(double factor) {
        return new Money(amount.multiply(BigDecimal.valueOf(factor)), currency);
    }
}
```

### FiscalDate

**REQUIRED for Zakat calculations (Islamic calendar)**:

```java
public record FiscalDate(int hijriYear, int hijriMonth, int hijriDay) {
    // Validation, conversion methods
}
```

### NisabThreshold

**REQUIRED for Zakat obligation checks**:

```java
public record NisabThreshold(Money goldEquivalent) {
    private static final BigDecimal GOLD_GRAMS = BigDecimal.valueOf(87.48);

    public boolean exceeds(Money wealth) {
        return wealth.isGreaterThan(goldEquivalent);
    }
}
```

## Validation

**REQUIRED**: All value objects MUST validate invariants in constructor.

**PROHIBITED**: Setters (value objects are immutable).
