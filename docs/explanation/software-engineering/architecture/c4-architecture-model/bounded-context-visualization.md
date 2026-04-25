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
created: 2026-02-09
---

# C4 Bounded Context Visualization

## Prerequisite Knowledge

**REQUIRED**: You MUST understand both C4 and DDD fundamentals before using these standards:

- [AyoKoding C4 Architecture Model](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/c4-architecture-model/)
- [AyoKoding Domain-Driven Design](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/)

**This document is OSE Platform-specific**, defining how to visualize DDD bounded contexts in C4 diagrams for THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

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
graph TD
    ZC["Zakat Calculation<br/>Context"]:::blue
    DM["Donation Management<br/>Context"]:::blue
    BR["Beneficiary Registry<br/>Context"]:::blue
    PM["Payment<br/>Context"]:::teal
    CompRep["Compliance Reporting<br/>(External)"]:::orange

    DM -->|"Requests beneficiary<br/>data<br/>[Customer/Supplier]<br/>[HTTPS/REST]"| BR
    ZC -->|"Collaborates on<br/>payment processing<br/>[Partnership]<br/>[HTTPS/REST]"| PM
    DM -->|"Collaborates on<br/>payment processing<br/>[Partnership]<br/>[HTTPS/REST]"| PM
    ZC -->|"Reports obligations<br/>[Conformist]<br/>[HTTPS/JSON]"| CompRep
    DM -->|"Reports distributions<br/>[Conformist]<br/>[HTTPS/JSON]"| CompRep

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef teal fill:#029E73,stroke:#000,color:#FFF
    classDef orange fill:#DE8F05,stroke:#000,color:#000
```

### Container Diagram (Single System with Multiple Contexts)

```mermaid
graph TD
    ZakatWeb["Zakat Web UI<br/>[Container: Next.js]<br/>User interface"]:::blue

    ZakatAPI["Zakat Calculation Context<br/>[Container: Spring Boot]<br/>Calculate Zakat obligations"]:::blue
    ZakatDB["Zakat Database<br/>[Container: PostgreSQL]<br/>Zakat assessment storage"]:::teal

    DonationAPI["Donation Management Context<br/>[Container: Spring Boot]<br/>Manage campaigns"]:::blue
    DonationDB["Donation Database<br/>[Container: PostgreSQL]<br/>Campaign storage"]:::teal

    BeneficiaryAPI["Beneficiary Registry Context<br/>[Container: Spring Boot]<br/>Register beneficiaries"]:::blue
    BeneficiaryDB["Beneficiary Database<br/>[Container: PostgreSQL]<br/>Beneficiary storage"]:::teal

    MQ["Event Bus<br/>[Container: RabbitMQ]<br/>Domain events"]:::teal

    ZakatWeb -->|"Makes API calls<br/>[HTTPS/REST]"| ZakatAPI
    ZakatWeb -->|"Makes API calls<br/>[HTTPS/REST]"| DonationAPI
    ZakatAPI -->|"Reads/writes<br/>[TCP/SQL]"| ZakatDB
    DonationAPI -->|"Requests beneficiary data<br/>[Customer/Supplier]<br/>[HTTPS/REST]"| BeneficiaryAPI
    DonationAPI -->|"Reads/writes<br/>[TCP/SQL]"| DonationDB
    BeneficiaryAPI -->|"Reads/writes<br/>[TCP/SQL]"| BeneficiaryDB
    ZakatAPI -->|"Publishes ZakatCalculated<br/>[AMQP]"| MQ
    DonationAPI -->|"Publishes DonationReceived<br/>[AMQP]"| MQ

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef teal fill:#029E73,stroke:#000,color:#FFF
```

## Component Diagram (Bounded Context Internals)

### OPTIONAL: Show Aggregates and Domain Services

**Component diagrams** can show tactical DDD patterns within a bounded context.

**Example: Zakat Calculation Context Internals**

```mermaid
graph TD
    Controller["Zakat Controller<br/>[Component: REST Controller]<br/>HTTP endpoints"]:::blue
    CalcService["Calculation Service<br/>[Component: Domain Service]<br/>Orchestrates calculations"]:::blue
    Assessment["Assessment Aggregate<br/>[Component: Aggregate Root]<br/>Zakat assessment lifecycle"]:::blue
    Calculator["Zakat Calculator<br/>[Component: Domain Service]<br/>Pure calculation logic"]:::blue
    AssessmentRepo["Assessment Repository<br/>[Component: Repository]<br/>Persistence"]:::teal
    EventPublisher["Event Publisher<br/>[Component: Infrastructure]<br/>Domain events"]:::teal

    Controller -->|"Calls"| CalcService
    CalcService -->|"Creates/updates"| Assessment
    CalcService -->|"Uses"| Calculator
    Assessment -->|"Persists via"| AssessmentRepo
    Assessment -->|"Publishes events via"| EventPublisher

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef teal fill:#029E73,stroke:#000,color:#FFF
```

## Shared Kernel Visualization

### REQUIRED: Show Shared Kernel as Supporting Components

**Shared Kernel** (shared domain models) should be shown as supporting components.

**Example: Money Value Object Shared Across Contexts**

```mermaid
graph TD
    SharedLib["Shared Domain Library<br/>[Library: ts-shared-domain]<br/>Money, Currency value objects"]:::purple

    ZakatAPI["Zakat Calculation Context<br/>[Container: Spring Boot]"]:::blue
    DonationAPI["Donation Management Context<br/>[Container: Spring Boot]"]:::blue
    PaymentAPI["Payment Context<br/>[Container: Spring Boot]"]:::blue

    ZakatAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib
    DonationAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib
    PaymentAPI -.->|"Uses Money<br/>[Shared Kernel]"| SharedLib

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef purple fill:#CC78BC,stroke:#000,color:#000
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

- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: By explicitly labeling context mapping patterns on relationships and showing clear bounded context boundaries, architectural decisions become visible rather than hidden in code.
