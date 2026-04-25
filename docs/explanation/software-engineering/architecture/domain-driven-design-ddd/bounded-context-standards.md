---
title: "DDD Bounded Context Standards"
description: OSE Platform standards for bounded context organization, Nx app alignment, and context mapping
category: explanation
subcategory: architecture
tags:
  - ddd
  - bounded-contexts
  - nx
  - standards
principles:
  - explicit-over-implicit
created: 2026-02-09
---

# DDD Bounded Context Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding Domain-Driven Design](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/) before using these standards.

**This document is OSE Platform-specific**, defining how to organize bounded contexts in THIS codebase.

## Purpose

OSE Platform bounded context organization standards. MUST/SHOULD/MAY rules for context boundaries.

## Bounded Context to Nx App Mapping

**RULE**: Use bounded contexts as the **primary guide** for Nx app boundaries, not a strict 1:1 requirement.

### Valid Mappings

**1. One Bounded Context → One Nx App** (Starting Point)

**SHOULD**: Start with one bounded context per Nx app for clear business capabilities.

```
apps/
├── zakat-context/          # Zakat calculation bounded context
├── donation-context/       # Donation management
├── beneficiary-context/    # Beneficiary registry
└── contract-context/       # Islamic contract management
```

**2. One Bounded Context → Multiple Nx Apps** (Scalability)

**OPTIONAL**: Split large contexts into separate apps for scalability or team autonomy.

```
apps/
├── billing-invoicing/      # Billing context: Invoicing service
├── billing-payments/       # Billing context: Payments service
└── billing-reporting/      # Billing context: Reporting service
```

**3. Multiple Bounded Contexts → One Nx App** (Early Stage)

**OPTIONAL**: Implement multiple small, tightly related contexts in one app early in product lifecycle.

```
apps/
├── finance-core/          # Contains: Zakat + Nisab + Hawl contexts
```

### Critical Rule

**PROHIBITED**: One Nx app spanning multiple bounded contexts **in its core domain model**.

**Bad** (mixed domain models):

```typescript
// apps/mixed-context/domain/
├── zakat/              # Zakat bounded context
│   └── ZakatCalculator.ts
├── donation/           # Donation bounded context
│   └── Campaign.ts     # Different ubiquitous language!
```

**Good** (separate or unified under one context):

```typescript
// apps/zakat-context/domain/
└── zakat/
    └── ZakatCalculator.ts

// apps/donation-context/domain/
└── donation/
    └── Campaign.ts
```

## Context Naming

**Format**: `[domain]-context`

**Examples**:

- `zakat-context`
- `donation-context`
- `beneficiary-context`

## Layered Structure

**REQUIRED**: Each bounded context MUST use layered architecture:

```
zakat-context/
├── domain/             # Aggregates, value objects, domain services
├── application/        # Application services, use cases
├── infrastructure/     # Persistence, messaging, external APIs
└── presentation/       # Controllers, GraphQL resolvers
```

## Context Mapping Patterns

**REQUIRED**: Document context relationships using standard patterns.

| Pattern              | OSE Usage                               | Implementation               |
| -------------------- | --------------------------------------- | ---------------------------- |
| Customer/Supplier    | Donation → Beneficiary (requests data)  | REST API calls               |
| Partnership          | Zakat ↔ Payment (collaborate)           | Shared domain events         |
| Shared Kernel        | Multiple contexts share Money           | Shared library (libs/ts-\*/) |
| Conformist           | Reporting → Zakat (conforms to API)     | Client-side adapter          |
| Anticorruption Layer | Internal → Legacy External (translates) | Adapter layer                |
