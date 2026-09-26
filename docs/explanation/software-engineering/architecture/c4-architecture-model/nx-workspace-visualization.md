---
title: "C4 Nx Workspace Visualization"
description: Standards for representing Nx monorepo structure in C4 container diagrams
category: explanation
subcategory: architecture
tags:
  - c4-model
  - nx
  - monorepo
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-09
---

# C4 Nx Workspace Visualization

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C4 fundamentals from [AyoKoding C4 Architecture Model](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/c4-model/) before using these standards.

**This document is OSE Platform-specific**, defining how to visualize Nx workspace structure in C4 diagrams for THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative standards** for visualizing Nx monorepo structure using C4 container diagrams in OSE Platform.

**Target Audience**: OSE Platform architects, Nx developers

**Scope**: Mapping Nx apps and libs to C4 containers, visualizing Nx project dependencies

## Mapping Nx Structure to C4

### Apps → Containers

**REQUIRED**: Each `apps/[app-name]` entry = One C4 Container.

**Nx Structure**:

```
apps/
├── ose-www/        # Next.js 16 fullstack platform
├── ayokoding-www/          # Next.js 16 fullstack platform
└── crane-cli/              # F# CLI tool
```

**C4 Container Diagram**:

```mermaid
graph TD
    accTitle: Apps → Containers
    accDescr: AyoKoding CLI Container: Rust Content link validation leads to AyoKoding Web Next.js 16, tRPC Educational content via Validates links File system; and 2 more links.
    OseWeb["OSE Platform Web<br/>[Next.js 16 App<br/>Router]<br/>Landing page"]:::blue
    AyoWeb["AyoKoding Web<br/>[Next.js 16, tRPC]<br/>Educational content"]:::blue
    AyoCLI["AyoKoding CLI<br/>[Container: Rust]<br/>Content link<br/>validation"]:::blue

    AyoCLI -->|"Validates links<br/>[File system]"| AyoWeb

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

### Libs → Supporting Components

**OPTIONAL**: Show `libs/` as supporting components when architecturally significant.

**When to show libs**:

- Shared domain models (e.g., `libs/ts-shared-domain/`)
- Reusable utilities used by multiple apps
- Infrastructure abstractions (e.g., `libs/ts-http-client/`)

**When NOT to show libs**:

- Internal implementation details
- Single-use utilities
- Test helpers

### Nx Project Dependencies → Relationships

**REQUIRED**: Nx project dependencies MUST be visualized as container relationships.

**Example**:

If `crane-cli` has an Nx dependency on `fsharp-crane-core` (builds it), show this as a relationship in the container diagram.

## Container Naming for Nx Apps

### Format

**REQUIRED**: Container names MUST match Nx app names and show technology.

**Format**: `"[App Display Name]<br/>[Container: Technology]<br/>Purpose"`

**Examples**:

- `"OSE Platform Web<br/>[Container: Next.js 16 (App Router)]<br/>Landing page and platform documentation"`
- `"AyoKoding Web<br/>[Container: Next.js 16 (App Router, TypeScript, tRPC)]<br/>Bilingual educational content"`
- `"AyoKoding CLI<br/>[Container: Rust]<br/>Content link validation"`
- `"Zakat API<br/>[Container: Spring Boot]<br/>Zakat calculation business logic"`

## Example: OSE Platform Container Diagram

### Full Platform View

**Current platform containers and deployment:**

```mermaid
graph LR
    accTitle: Full Platform View
    accDescr: AyoKoding CLI Container: Rust Content link validation leads to AyoKoding Web Next.js 16, tRPC Educational content; and 3 more links.
    OseWeb["OSE Platform Web<br/>[Next.js 16 App<br/>Router]<br/>Landing page"]:::blue
    AyoWeb["AyoKoding Web<br/>[Next.js 16, tRPC]<br/>Educational content"]:::blue
    AyoCLI["AyoKoding CLI<br/>[Container: Rust]<br/>Content link<br/>validation"]:::blue
    Vercel["Vercel<br/>[Platform]<br/>Next.js hosting"]:::teal

    AyoCLI --> AyoWeb
    OseWeb --> Vercel
    AyoWeb --> Vercel

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Future containers (planned):**

```mermaid
graph LR
    accTitle: Full Platform View 2
    accDescr: Zakat Web UI Container: Next.js User interface leads to Zakat API Container: Spring Boot Zakat calculations.
    ZakatWeb["Zakat Web UI<br/>[Container: Next.js]<br/>User interface"]:::purple
    ZakatAPI["Zakat API<br/>[Container: Spring<br/>Boot]<br/>Zakat calculations"]:::purple

    ZakatWeb -.-> ZakatAPI

    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Note**: Use purple for future/planned containers with dashed lines (`-.->`) for planned relationships.

## Nx Project Graph Integration

### OPTIONAL: Reference Nx Project Graph

C4 container diagrams can reference the Nx project graph for detailed dependency analysis.

**Add note in diagram documentation**:

> For detailed Nx project dependencies, run
> `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph` or visit the
> [Nx Project Graph documentation](../../../../reference/monorepo-structure.md).

### Visualization Strategy

**Simple projects** (1-5 apps):

- Show all apps as containers
- Show key libs as supporting components
- Show all Nx project dependencies

**Complex projects** (6+ apps):

- Group related apps by domain (Zakat, Donation, Beneficiary)
- Show only major Nx dependencies
- Create multiple focused container diagrams per domain

## Validation Checklist

Before committing an Nx workspace visualization, verify:

- [ ] **Apps mapped**: All Nx apps shown as C4 containers
- [ ] **Technology shown**: Each container specifies framework/language
- [ ] **Nx dependencies visualized**: Key project dependencies shown as relationships
- [ ] **Libs selectively shown**: Only architecturally significant libs included
- [ ] **Future apps distinguished**: Planned containers use purple with dashed lines
- [ ] **Deployment shown**: Infrastructure (Vercel, databases) included

## Related Standards

- **[Diagram Standards](./diagram-standards.md)** - When to create diagrams, required levels
- **[Nx Workspace Structure](../../../../reference/monorepo-structure.md)** - Monorepo organization reference

## Principles Implemented

- **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)**: By explicitly mapping Nx apps to C4 containers and showing project dependencies, the monorepo structure becomes visible in architecture documentation rather than hidden in `nx.json`.
