---
title: "DDD Entity Standards"
description: OSE Platform standards for entity identity management and lifecycle tracking
category: explanation
subcategory: architecture
tags:
  - ddd
  - entities
  - identity
principles:
  - explicit-over-implicit
created: 2026-02-09
---

# DDD Entity Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding DDD Entities](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/by-example/) before using these standards.

## Purpose

OSE Platform entity standards for identity and lifecycle management.

## REQUIRED: Identity-Based Equality

**REQUIRED**: Entities MUST be compared by identity, not by attributes.

```java
public class ZakatAssessment {
    private final AssessmentId id;  // Identity
    private Money totalWealth;      // Mutable attributes

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof ZakatAssessment other)) return false;
        return this.id.equals(other.id);  // Identity comparison
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
```

## Identity Types

**REQUIRED**: Use strongly-typed IDs.

**Good**:

```java
public record AssessmentId(UUID value) {}
public record DonationId(UUID value) {}
```

**Bad** (primitive obsession):

```java
UUID assessmentId;  // Not type-safe
String donationId;  // Can be confused with other strings
```

## Lifecycle Tracking

**OPTIONAL**: Entities MAY track lifecycle with FSM when state transitions have business meaning.

**See**: [FSM Standards](../finite-state-machine-fsm/README.md)
