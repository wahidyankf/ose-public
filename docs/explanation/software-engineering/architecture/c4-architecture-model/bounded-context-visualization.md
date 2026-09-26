---
title: "C4 Bounded Context Visualization"
description: Standards for mapping DDD bounded contexts to C4 containers and visualizing context mapping patterns
category: explanation
subcategory: architecture
tags:
  - c4-model
  - ddd
  - bounded-contexts
  - context-mapping
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-09
---

# C4 Bounded Context Visualization

## Prerequisite Knowledge

**REQUIRED**: You MUST understand both C4 and DDD fundamentals before using these standards:

- [AyoKoding C4 Architecture Model](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/c4-model/)
- [AyoKoding Domain-Driven Design](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/domain-driven-design-ddd/)

**This document is OSE Platform-specific**, defining how to visualize DDD bounded contexts in C4 diagrams for THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative standards** for visualizing DDD bounded contexts using C4 architecture diagrams in OSE Platform.

**Target Audience**: OSE Platform architects, DDD practitioners

**Scope**: Mapping bounded contexts to C4 containers, visualizing context mapping patterns

## Mapping Bounded Contexts to C4 Levels

### System Context = Enterprise Context Map

**System Context diagrams** show how bounded contexts relate across the entire enterprise.

- Each box = One bounded context
- Relationships = Context mapping patterns (Customer/Supplier, Partnership, etc.)

**Use when**: Documenting multiple bounded contexts and their relationships.

### Container to Bounded Context Mapping

**SHOULD**: Use bounded contexts as the **primary guide** for C4 Container boundaries.

**Common Patterns**:

1. **One Container = One Bounded Context** (Default visualization for microservices)
2. **One Bounded Context = Multiple Containers** (Large context split for scalability)
3. **Multiple Bounded Contexts = One Container** (Early stage, small contexts)

**Critical Rule**: Each container's domain model must maintain single ubiquitous language. No container should mix multiple bounded contexts' domain models.

**Container Boundaries**:

- SHOULD align with bounded context boundaries
- Each container represents cohesive domain model with consistent ubiquitous language
- Containers communicate via well-defined APIs (context mapping patterns)

**Use when**: Documenting internal structure of a single system with bounded contexts.

### Component = Aggregates and Domain Services

**OPTIONAL**: Component diagrams show tactical DDD patterns within a bounded context.

- Components = Aggregates, Domain Services, Repositories
- Show relationships between aggregates
- Show FSM states when applicable

**Use when**: Documenting complex bounded context internals.

## Bounded Context Container Requirements

### Container Naming

**REQUIRED**: Container names MUST reflect the bounded context name and domain.

**Format**: `"[Bounded Context Name]<br/>[Container: Technology]<br/>Domain responsibility"`

**Examples**:

- `"Zakat Calculation Context<br/>[Container: Spring Boot]<br/>Calculate Zakat obligations"`
- `"Donation Management Context<br/>[Container: Spring Boot]<br/>Manage campaigns and donations"`
- `"Beneficiary Registry Context<br/>[Container: Spring Boot]<br/>Register and verify beneficiaries"`

### Container Boundaries

**REQUIRED**: Container boundaries MUST align with bounded context boundaries.

- No shared database between bounded contexts
- Each bounded context has its own data store
- Communication only via APIs or events

### Context Mapping Patterns in C4

**REQUIRED**: Relationship labels MUST indicate context mapping patterns.

| Pattern              | C4 Label Format                                                    | Example                                                     |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Customer/Supplier    | `"Requests/provides<br/>[Pattern: Customer/Supplier]<br/>[HTTPS]"` | Donation Context requests beneficiary data from Registry    |
| Partnership          | `"Collaborates<br/>[Pattern: Partnership]<br/>[HTTPS]"`            | Zakat Context and Payment Context collaborate on processing |
| Shared Kernel        | `"Shares domain<br/>[Pattern: Shared Kernel]<br/>[Library]"`       | Multiple contexts share Money value object                  |
| Conformist           | `"Conforms to<br/>[Pattern: Conformist]<br/>[HTTPS]"`              | Reporting Context conforms to Zakat Context API             |
| Anticorruption Layer | `"Translates via ACL<br/>[Pattern: ACL]<br/>[HTTPS]"`              | Internal context wraps legacy external system               |
| Open Host Service    | `"Exposes API<br/>[Pattern: Open Host]<br/>[HTTPS/REST]"`          | Zakat Context exposes public API                            |
| Published Language   | `"Uses standard<br/>[Pattern: Published Language]<br/>[HTTPS]"`    | Multiple contexts use standard JSON Schema                  |

## Example: OSE Platform Bounded Contexts

### System Context (Enterprise Context Map)

```mermaid
graph LR
    accTitle: System Context Enterprise Context Map
    accDescr: Donation Management Context leads to Beneficiary Registry Context; Zakat Calculation Context leads to Payment Context; Donation Management Context leads to Payment Context; Zakat Calculation Context leads to Compliance Reporting External; and 1 more links.
    ZC["Zakat Calculation<br/>Context"]:::blue
    DM["Donation Management<br/>Context"]:::blue
    BR["Beneficiary Registry<br/>Context"]:::blue
    PM["Payment<br/>Context"]:::teal
    CompRep["Compliance Reporting<br/>(External)"]:::orange

    DM --> BR
    ZC --> PM
    DM --> PM
    ZC --> CompRep
    DM --> CompRep

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

### Container Diagram (Single System with Multiple Contexts)

**Frontend and API layer:**

```mermaid
graph LR
    accTitle: Container Diagram Single System with Multiple Contexts
    accDescr: Zakat Web UI Container: Next.js User interface leads to Zakat Calculation Context Container: Spring Boot Calculate Zakat; Zakat Web UI Container: Next.js User interface leads to Donation Management Container: Spring Boot Manage campaigns; and 1 more links.
    ZakatWeb["Zakat Web UI<br/>[Container: Next.js]<br/>User interface"]:::blue
    ZakatAPI["Zakat Calculation<br/>Context<br/>[Container: Spring<br/>Boot]<br/>Calculate Zakat"]:::blue
    DonationAPI["Donation Management<br/>[Container: Spring<br/>Boot]<br/>Manage campaigns"]:::blue
    BeneficiaryAPI["Beneficiary<br/>Registry<br/>[Container: Spring<br/>Boot]<br/>Register<br/>beneficiaries"]:::blue

    ZakatWeb --> ZakatAPI
    ZakatWeb --> DonationAPI
    DonationAPI --> BeneficiaryAPI

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Persistence and messaging layer:**

```mermaid
graph LR
    accTitle: Container Diagram Single System with Multiple Contexts 2
    accDescr: Zakat Calculation Container: Spring Boot leads to Zakat Database Container: PostgreSQL Zakat assessment storage; Zakat Calculation Container: Spring Boot leads to Event Bus Container: RabbitMQ Domain events; and 3 more links.
    ZakatAPI["Zakat Calculation<br/>[Container: Spring<br/>Boot]"]:::blue
    DonationAPI["Donation Management<br/>[Container: Spring<br/>Boot]"]:::blue
    ZakatDB["Zakat Database<br/>[Container:<br/>PostgreSQL]<br/>Zakat assessment<br/>storage"]:::teal
    DonationDB["Donation Database<br/>[Container:<br/>PostgreSQL]<br/>Campaign storage"]:::teal
    BeneficiaryDB["Beneficiary<br/>Database<br/>[Container:<br/>PostgreSQL]<br/>Beneficiary storage"]:::teal
    MQ["Event Bus<br/>[Container:<br/>RabbitMQ]<br/>Domain events"]:::teal

    ZakatAPI --> ZakatDB
    ZakatAPI --> MQ
    DonationAPI --> DonationDB
    DonationAPI --> BeneficiaryDB
    DonationAPI --> MQ

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Component Diagram (Bounded Context Internals)

### OPTIONAL: Show Aggregates and Domain Services

**Component diagrams** can show tactical DDD patterns within a bounded context.

**Example: Zakat Calculation Context Internals**

```mermaid
graph LR
    accTitle: OPTIONAL: Show Aggregates and Domain Services
    accDescr: Zakat Controller Component: REST Controller HTTP endpoints leads to Calculation Service Component: Domain Service Orchestrates calculations; Calculation Service Component: Domain Service Orchestrates calculations leads to Assessment Aggregate Component: Aggregate Root Zakat assessment lifecycle; and 3 more links.
    Controller["Zakat Controller<br/>[Component: REST<br/>Controller]<br/>HTTP endpoints"]:::blue
    CalcService["Calculation Service<br/>[Component: Domain<br/>Service]<br/>Orchestrates<br/>calculations"]:::blue
    Assessment["Assessment<br/>Aggregate<br/>[Component:<br/>Aggregate Root]<br/>Zakat assessment<br/>lifecycle"]:::blue
    Calculator["Zakat Calculator<br/>[Component: Domain<br/>Service]<br/>Pure calculation<br/>logic"]:::blue
    AssessmentRepo["Assessment<br/>Repository<br/>[Component:<br/>Repository]<br/>Persistence"]:::teal
    EventPublisher["Event Publisher<br/>[Component:<br/>Infrastructure]<br/>Domain events"]:::teal

    Controller --> CalcService
    CalcService --> Assessment
    CalcService --> Calculator
    Assessment --> AssessmentRepo
    Assessment --> EventPublisher

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Shared Kernel Visualization

### REQUIRED: Show Shared Kernel as Supporting Components

**Shared Kernel** (shared domain models) should be shown as supporting components.

**Example: Money Value Object Shared Across Contexts**

```mermaid
graph TD
    accTitle: REQUIRED: Show Shared Kernel as Supporting Components
    accDescr: Zakat Calculation Context Container: Spring Boot leads to Shared Domain Library Library: ts-shared-domain Money, Currency value objects via Uses Money Shared Kernel; and 2 more links.
    SharedLib["Shared Domain<br/>Library<br/>[Library:<br/>ts-shared-domain]<br/>Money, Currency<br/>value objects"]:::purple

    ZakatAPI["Zakat Calculation<br/>Context<br/>[Container: Spring<br/>Boot]"]:::blue
    DonationAPI["Donation Management<br/>Context<br/>[Container: Spring<br/>Boot]"]:::blue
    PaymentAPI["Payment Context<br/>[Container: Spring<br/>Boot]"]:::blue

    ZakatAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib
    DonationAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib
    PaymentAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Note**: Use dashed lines (`-.->`) for library dependencies to distinguish from runtime communication.

## Validation Checklist

Before committing a bounded context visualization, verify:

- [ ] **One Container = One Bounded Context**: Container boundaries align with bounded context boundaries
- [ ] **No shared database**: Each bounded context has its own data store
- [ ] **Context mapping patterns labeled**: All relationships indicate the pattern (Customer/Supplier, Partnership, etc.)
- [ ] **Clear API boundaries**: Communication between contexts via well-defined APIs
- [ ] **Domain events shown**: Event-driven communication visualized through message broker
- [ ] **Shared Kernel visualized**: Shared domain models shown as supporting libraries

## Related Standards

- **[Diagram Standards](./diagram-standards.md)** - When to create diagrams, required levels
- **[DDD Standards](../domain-driven-design-ddd/README.md)** - Domain-Driven Design tactical patterns
- **[DDD Context Mapping](../domain-driven-design-ddd/bounded-context-standards.md)** - Context mapping pattern details

## Principles Implemented

- **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)**: By explicitly labeling context mapping patterns on relationships and showing clear bounded context boundaries, architectural decisions become visible rather than hidden in code.
