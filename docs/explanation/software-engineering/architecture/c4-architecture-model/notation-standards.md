---
title: "C4 Notation Standards"
description: WCAG-compliant color palette, Mermaid syntax, and labeling conventions for C4 diagrams
category: explanation
subcategory: architecture
tags:
  - c4-model
  - notation
  - wcag
  - accessibility
  - mermaid
principles:
  - explicit-over-implicit
  - reproducibility
created: 2026-02-09
---

# C4 Notation Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C4 fundamentals from [AyoKoding C4 Architecture Model](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/c4-architecture-model/) before using these standards.

**This document is OSE Platform-specific**, not a C4 tutorial. We define HOW to apply C4 notation in THIS codebase, not WHAT C4 notation is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative notation standards** for C4 diagrams in OSE Platform, ensuring accessibility, consistency, and maintainability.

**Target Audience**: OSE Platform architects, developers, technical writers

**Scope**: WCAG colors, Mermaid syntax, labeling conventions, accessibility requirements

## Color Palette (REQUIRED)

### WCAG AA-Compliant Colors

**REQUIRED**: All C4 diagrams MUST use the following color-blind friendly palette.

These colors meet WCAG AA contrast standards and are distinguishable for all types of color blindness.

| Color Name | Hex Code | Usage                        | Text Color |
| ---------- | -------- | ---------------------------- | ---------- |
| Blue       | #0173B2  | Primary systems/containers   | White #FFF |
| Orange     | #DE8F05  | External actors (people)     | Black #000 |
| Teal       | #029E73  | External systems/data stores | White #FFF |
| Purple     | #CC78BC  | Optional/future components   | Black #000 |

### Mermaid Class Definitions

**REQUIRED**: Use these exact Mermaid class definitions in all diagrams.

```mermaid
classDef blue fill:#0173B2,stroke:#000,color:#FFF
classDef orange fill:#DE8F05,stroke:#000,color:#000
classDef teal fill:#029E73,stroke:#000,color:#FFF
classDef purple fill:#CC78BC,stroke:#000,color:#000
```

### C4 Element Type to Color Mapping (REQUIRED)

**CRITICAL**: Use this exact mapping for all C4 diagrams to ensure consistency across the platform.

| C4 Element Type            | Color  | Hex Code | Text Color | Usage Context                               |
| -------------------------- | ------ | -------- | ---------- | ------------------------------------------- |
| **Person** (External)      | Orange | #DE8F05  | Black #000 | Users, actors interacting with the system   |
| **Software System** (This) | Blue   | #0173B2  | White #FFF | The system being documented (focus)         |
| **Software System** (Ext)  | Teal   | #029E73  | White #FFF | External systems, third-party APIs          |
| **Container** (Internal)   | Blue   | #0173B2  | White #FFF | Apps, services, web frontends (our system)  |
| **Container** (Database)   | Teal   | #029E73  | White #FFF | Databases, message brokers, caches          |
| **Component** (Core)       | Blue   | #0173B2  | White #FFF | Controllers, services, domain logic         |
| **Component** (Infra)      | Teal   | #029E73  | White #FFF | Repositories, clients, infrastructure       |
| **Future/Planned**         | Purple | #CC78BC  | Black #000 | Optional, experimental, not-yet-implemented |

### Color Usage Rules by Diagram Level

**System Context (Level 1)**:

- **Orange**: All Person elements (donors, administrators, users)
- **Blue**: The single Software System being documented
- **Teal**: All External Software Systems (payment gateway, compliance system)

**Container (Level 2)**:

- **Blue**: All internal Containers (web apps, APIs, services)
- **Teal**: All data stores and infrastructure (databases, message queues, caches)
- **Purple**: OPTIONAL - Future/planned containers not yet implemented

**Component (Level 3)**:

- **Blue**: Core business Components (controllers, services, aggregates)
- **Teal**: Infrastructure Components (repositories, API clients, adapters)
- **Purple**: OPTIONAL - Experimental/future components

### Consistency Principle

**CRITICAL**: The same element type MUST always use the same color across all diagrams.

- ✅ Person → Always Orange
- ✅ This System/Internal Containers/Core Components → Always Blue
- ✅ External Systems/Databases/Infrastructure → Always Teal
- ✅ Future/Planned → Always Purple

This ensures readers can instantly recognize element types by color across all C4 documentation.

### Prohibited Colors

**MUST NOT use**:

- ❌ Red (common color blindness issue)
- ❌ Green (common color blindness issue)
- ❌ Yellow (low contrast)
- ❌ Gray (low contrast, unclear semantic meaning)
- ❌ Any colors not in the approved palette

## Mermaid Syntax Standards

### Graph Direction

**REQUIRED**: Use `graph TD` (top-down) for all C4 diagrams.

```mermaid
graph TD
    %% diagram content here
```

**PROHIBITED**: Do NOT use `graph LR` (left-right), as it makes long labels hard to read.

### Node Definition Format

**REQUIRED**: All nodes MUST use bracket notation with descriptive labels.

**Format**: `NodeID["Label<br/>Additional info"]:::className`

**Example**:

```mermaid
ZMS["Zakat Management System<br/>[System]"]:::blue
API["Zakat API<br/>[Container: Spring Boot]<br/>Business logic"]:::blue
```

### Relationship Labels

**REQUIRED**: All relationships MUST have descriptive labels with protocols.

**Format**: `-->|"Action description<br/>[Protocol]"|`

**Examples**:

```mermaid
Web -->|"Makes API calls<br/>[HTTPS/REST]"| API
API -->|"Reads/writes<br/>[TCP/SQL]"| DB
API -->|"Publishes events<br/>[AMQP]"| MQ
```

**Protocol Notation**:

- `[HTTPS/REST]` - RESTful HTTP APIs
- `[HTTPS/JSON]` - Generic HTTP with JSON payload
- `[HTTPS/GraphQL]` - GraphQL APIs
- `[gRPC]` - gRPC services
- `[TCP/SQL]` - Database connections
- `[AMQP]` - Message queue protocols
- `[WebSocket]` - WebSocket connections
- `[TCP/Redis]` - Redis connections

### Line Breaks

**REQUIRED**: Use `<br/>` for line breaks in multi-line labels.

**Good**:

```mermaid
API["Zakat API<br/>[Container: Spring Boot]<br/>Business logic"]:::blue
```

**Bad** (no line breaks):

```mermaid
API["Zakat API [Container: Spring Boot] Business logic"]:::blue
```

## Labeling Conventions

### System Context Labels

**System Box**:

- Format: `"[System Name]"`
- Example: `"Zakat Management System"`

**External Actors**:

- Format: `"[Role]<br/>(Person)"`
- Example: `"Donor<br/>(Person)"`

**External Systems**:

- Format: `"[System Name]<br/>(External System)"`
- Example: `"Payment Gateway<br/>(External System)"`

### Container Labels

**Containers**:

- Format: `"[Purpose] [Type]<br/>[Container: Technology]<br/>Description"`
- Example: `"Zakat Web UI<br/>[Container: Next.js]<br/>User interface for<br/>Zakat calculations"`

**Data Stores**:

- Format: `"[Purpose] [Type]<br/>[Container: Technology]<br/>Storage description"`
- Example: `"Zakat Database<br/>[Container: PostgreSQL]<br/>Stores Zakat<br/>assessments"`

### Component Labels

**Components**:

- Format: `"[Responsibility]<br/>[Component: Type]<br/>Description"`
- Example: `"Calculation Service<br/>[Component: Domain Service]<br/>Zakat calculations"`

## Accessibility Requirements

### WCAG AA Compliance

**REQUIRED**: All diagrams MUST meet WCAG AA contrast standards.

- **Minimum contrast ratio**: 4.5:1 for text
- **Large text**: 3:1 (18pt+ or 14pt+ bold)
- **Color-blind friendly**: All colors distinguishable for protanopia, deuteranopia, tritanopia

### Alternative Text

**REQUIRED**: All diagram code blocks MUST have descriptive alt text in the surrounding markdown.

**Example**:

```markdown
**System Context Diagram**: The Zakat Management System interacts with donors, beneficiaries, payment gateway, and compliance reporting systems via HTTPS/JSON protocols.

[diagram code block here]
```

### Screen Reader Support

**SHOULD provide**:

- Descriptive heading before diagram
- Text summary of key relationships
- Link to textual architecture documentation

## Complete Example

### System Context Diagram

```mermaid
graph TD
    ZMS["Zakat Management System"]:::blue
    Donor["Donor<br/>(Person)"]:::orange
    Beneficiary["Beneficiary<br/>(Person)"]:::orange
    Admin["Administrator<br/>(Person)"]:::orange
    PayGW["Payment Gateway<br/>(External System)"]:::teal
    CompRep["Compliance Reporting<br/>(External System)"]:::teal

    Donor -->|"Submits Zakat<br/>calculation<br/>[HTTPS/JSON]"| ZMS
    ZMS -->|"Displays Zakat<br/>obligations<br/>[HTTPS/JSON]"| Donor
    Admin -->|"Manages<br/>distributions<br/>[HTTPS/JSON]"| ZMS
    ZMS -->|"Processes<br/>payments<br/>[HTTPS/JSON]"| PayGW
    ZMS -->|"Reports<br/>distributions<br/>[HTTPS/JSON]"| CompRep
    ZMS -->|"Disburses funds<br/>[HTTPS/JSON]"| Beneficiary

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef orange fill:#DE8F05,stroke:#000,color:#000
    classDef teal fill:#029E73,stroke:#000,color:#FFF
```

### Container Diagram

```mermaid
graph TD
    Web["Zakat Web UI<br/>[Container: Next.js]<br/>User interface"]:::blue
    API["Zakat API<br/>[Container: Spring Boot]<br/>Business logic"]:::blue
    DB["Zakat Database<br/>[Container: PostgreSQL]<br/>Assessment storage"]:::teal
    MQ["Message Broker<br/>[Container: RabbitMQ]<br/>Event distribution"]:::teal
    Cache["Session Cache<br/>[Container: Redis]<br/>User sessions"]:::teal

    Web -->|"Makes API calls<br/>[HTTPS/REST]"| API
    Web -->|"Reads sessions<br/>[TCP/Redis]"| Cache
    API -->|"Reads/writes<br/>[TCP/SQL]"| DB
    API -->|"Publishes events<br/>[AMQP]"| MQ

    classDef blue fill:#0173B2,stroke:#000,color:#FFF
    classDef teal fill:#029E73,stroke:#000,color:#FFF
```

## Validation Checklist

Before committing a C4 diagram, verify:

- [ ] **Colors**: Using only approved WCAG palette
- [ ] **Syntax**: Valid Mermaid `graph TD` syntax
- [ ] **Labels**: All relationships have action + protocol
- [ ] **Line breaks**: Using `<br/>` for multi-line labels
- [ ] **Class definitions**: Mermaid classDef declarations present
- [ ] **Contrast**: Text color appropriate for background (white on blue/teal, black on orange/purple)
- [ ] **Alt text**: Descriptive markdown text surrounding diagram
- [ ] **Protocol notation**: Using standardized protocol notation

## Related Standards

- **[Diagram Standards](./diagram-standards.md)** - When to create diagrams, required levels
- **[Diagram Convention](../../../../../governance/conventions/formatting/diagrams.md)** - Repository-wide diagram standards

## Principles Implemented

- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: All relationships must have explicit labels with protocols. Technology choices must be explicitly shown in container labels. No implicit relationships without labels.

- **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)**: Standardized WCAG color palette and Mermaid syntax ensures diagrams can be consistently reproduced across teams and time periods.
