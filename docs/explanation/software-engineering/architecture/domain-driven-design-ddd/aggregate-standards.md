---
title: "DDD Aggregate Standards"
description: OSE Platform standards for aggregate design, consistency boundaries, and Islamic finance invariants
category: explanation
subcategory: architecture
tags:
  - ddd
  - aggregates
  - islamic-finance
principles:
  - explicit-over-implicit
  - immutability
created: 2026-02-09
---

# DDD Aggregate Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding DDD Aggregates](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/) before using these standards.

## Purpose

OSE Platform aggregate design standards for Islamic finance systems.

## REQUIRED: Aggregates Enforce Business Invariants

**REQUIRED**: All business rules MUST be enforced by aggregate roots.

### Zakat Assessment Aggregate

```java
public record ZakatAssessment(
    AssessmentId id,
    UserId userId,
    Money totalWealth,
    Money nisabThreshold,  // 87.48g gold equivalent
    ZakatAmount zakatDue,
    AssessmentStatus status
) {
    // MUST enforce: Zakat is 2.5% of wealth exceeding Nisab
    public ZakatAssessment calculate() {
        if (totalWealth.isLessThan(nisabThreshold)) {
            return withStatus(AssessmentStatus.BELOW_NISAB);
        }
        Money zakatAmount = totalWealth.multiply(0.025);
        return new ZakatAssessment(id, userId, totalWealth,
            nisabThreshold, zakatAmount, AssessmentStatus.CALCULATED);
    }

    // MUST enforce: Cannot pay more than owed
    public ZakatAssessment markAsPaid(Money paidAmount) {
        if (paidAmount.isGreaterThan(zakatDue)) {
            throw new InvalidPaymentException("Cannot overpay Zakat");
        }
        return withStatus(AssessmentStatus.PAID);
    }
}
```

## Transaction Boundaries

**REQUIRED**: One aggregate = One transaction.

**PROHIBITED**: Modifying multiple aggregates in single transaction (use eventual consistency via domain events instead).

## Aggregate Size

**SHOULD**: Keep aggregates small (1-5 entities maximum).

**WHY**: Large aggregates cause performance issues and concurrency conflicts.
