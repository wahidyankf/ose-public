---
title: "DDD Domain Event Standards"
description: OSE Platform standards for domain event design, naming, and publishing
category: explanation
subcategory: architecture
tags:
  - ddd
  - domain-events
  - event-driven
principles:
  - immutability
  - explicit-over-implicit
created: 2026-02-09
---

# DDD Domain Event Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding DDD Domain Events](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/) before using these standards.

## Purpose

OSE Platform domain event standards for event-driven architecture.

## REQUIRED: Capture Business Occurrences

**REQUIRED**: All significant business occurrences MUST emit domain events.

## Event Naming

**Format**: `[Entity][PastTenseVerb]`

**Examples**:

- `ZakatCalculated`
- `DonationReceived`
- `CampaignFunded`
- `BeneficiaryVerified`
- `ContractApproved`

**PROHIBITED**: Present tense ("ZakatCalculating"), future tense ("ZakatWillCalculate").

## Event Structure

**REQUIRED**: All events MUST be immutable.

```java
public record ZakatCalculated(
    AssessmentId assessmentId,
    UserId userId,
    Money zakatAmount,
    Instant occurredAt
) implements DomainEvent {
    // No setters - immutable
}
```

## OSE Platform Domain Events

| Event                   | When                           | Contains                |
| ----------------------- | ------------------------------ | ----------------------- |
| `ZakatCalculated`       | Zakat amount determined        | AssessmentId, Amount    |
| `DonationReceived`      | Donation payment confirmed     | DonationId, Amount      |
| `CampaignFunded`        | Campaign reaches goal          | CampaignId, TotalRaised |
| `BeneficiaryVerified`   | Eligibility confirmed          | BeneficiaryId, Status   |
| `ContractApproved`      | Shariah board approves         | ContractId, ApprovalId  |
| `DistributionCompleted` | Funds disbursed to beneficiary | DistributionId, Amount  |

## Publishing

**REQUIRED**: Publish events AFTER aggregate persistence succeeds.

**PROHIBITED**: Publishing events before transaction commits.
