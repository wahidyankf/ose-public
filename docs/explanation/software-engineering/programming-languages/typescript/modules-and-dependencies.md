---
title: "TypeScript Modules and Dependencies"
description: Module systems and dependency management in TypeScript
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - modules
  - esm
  - npm
  - pnpm
  - bun
related:
  - ./best-practices.md
  - ../../../../../governance/principles/software-engineering/reproducibility.md
principles:
  - reproducibility
  - explicit-over-implicit
---

# TypeScript Modules and Dependencies

**Quick Reference**: [Overview](#overview) | [ES Modules](#es-modules) | [Package Managers](#package-managers) | [Module Resolution](#module-resolution) | [Monorepos](#workspaces-and-monorepos) | [Related Documentation](#related-documentation)

## Overview

TypeScript uses ES modules as its primary module system. Understanding module resolution, package managers, and dependency management is essential for reproducible builds.

## ES Modules

### Module Dependency Graph

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    App["app.ts<br/>#40;Entry Point#41;"]:::blue
    ZakatService["zakat-service.ts"]:::orange
    ZakatCalc["zakat-calculator.ts"]:::teal
    Money["money.ts<br/>#40;Value Object#41;"]:::brown
    DonRepo["donation-repository.ts"]:::purple

    App --> ZakatService
    ZakatService --> ZakatCalc
    ZakatService --> DonRepo
    ZakatCalc --> Money
    DonRepo --> Money

    Note1["Dependencies flow<br/>from high-level<br/>to low-level<br/>modules"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```typescript
// Exporting
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export function createMoney(amount: number, currency: string): Money {
  return Object.freeze({ amount, currency });
}

export default class ZakatCalculator {
  calculate(wealth: Money, nisab: Money): Money {
    if (wealth.amount < nisab.amount) {
      return createMoney(0, wealth.currency);
    }
    return createMoney(wealth.amount * 0.025, wealth.currency);
  }
}

// Importing
import ZakatCalculator, { Money, createMoney } from "./zakat";

const calculator = new ZakatCalculator();
const wealth = createMoney(100000, "USD");
```

### ESM Import/Export Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Module["Module<br/>zakat.ts"]:::blue
    Export1["export default<br/>ZakatCalculator"]:::orange
    Export2["export interface<br/>Money"]:::orange
    Export3["export function<br/>createMoney"]:::orange

    Import["Importing Module<br/>app.ts"]:::teal
    Default["Default Import<br/>ZakatCalculator"]:::purple
    Named["Named Imports<br/>Money, createMoney"]:::purple

    Module --> Export1
    Module --> Export2
    Module --> Export3

    Export1 -.-> Default
    Export2 -.-> Named
    Export3 -.-> Named

    Default --> Import
    Named --> Import

    Note1["ESM is static:<br/>imports resolved<br/>at compile time"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Barrel Export Pattern

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Barrel["index.ts<br/>#40;Barrel#41;"]:::blue
    Module1["money.ts"]:::orange
    Module2["zakat-calculator.ts"]:::orange
    Module3["donation.ts"]:::orange
    Consumer["app.ts<br/>#40;Consumer#41;"]:::teal

    Module1 --> Barrel
    Module2 --> Barrel
    Module3 --> Barrel
    Barrel --> Consumer

    Note1["Barrel pattern:<br/>Single import point<br/>for related modules"]
    Note2["import { Money,<br/>ZakatCalculator }<br/>from './domain'"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Package Managers

### Tree-Shaking Optimization Flow

Modern bundlers eliminate unused code through tree-shaking. Understanding this process helps optimize bundle sizes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Source["Source Code<br/>#40;ES Modules#41;"]:::blue
    Parse["Parse AST<br/>Dependency Graph"]:::orange
    MarkUsed["Mark Used Exports"]:::teal
    MarkUnused["Identify Unused Code"]:::brown
    Eliminate["Remove Dead Code"]:::purple
    Bundle["Optimized Bundle"]:::teal

    Source --> Parse
    Parse --> MarkUsed
    MarkUsed --> MarkUnused
    MarkUnused --> Eliminate
    Eliminate --> Bundle

    Note1["ESM static imports<br/>enable tree-shaking"]
    Note2["Side effects prevent<br/>elimination"]

    subgraph Example["Example: Lodash"]
        Import["import {map} from 'lodash-es'"]
        Used["map function"]
        Unused["filter, reduce, etc."]
        Result["Bundle includes<br/>only map"]

        Import --> Used
        Import -.-> Unused
        Used --> Result
    end

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```json
// package.json with Volta
{
  "name": "ose-platform",
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  },
  "dependencies": {
    "typescript": "5.9.3",
    "express": "5.2.1"
  },
  "devDependencies": {
    "@types/node": "24.13.1",
    "vitest": "4.0.18"
  }
}
```

### npm (11.8.0)

```bash
npm ci              # Install exact versions from lockfile
npm install pkg     # Add dependency
npm update          # Update within semver range
npm audit           # Check for vulnerabilities
```

### pnpm (10.28.1)

```bash
pnpm install        # Fast, disk-efficient installs
pnpm add pkg        # Add dependency
pnpm update         # Update dependencies
```

### bun (1.3.6)

```bash
bun install         # Ultra-fast installs
bun add pkg         # Add dependency
bun update          # Update dependencies
```

## Module Resolution

### Circular Dependency Detection

Circular dependencies create initialization issues and should be detected early.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Start["Build Module Graph"]:::blue
    Analyze["Analyze Import Paths"]:::orange
    DetectCycle{"Circular<br/>dependency?"}:::orange
    NoCircular["Valid Dependency Tree"]:::teal
    Circular["Circular Dependency Found"]:::purple

    Strategy1["Strategy 1:<br/>Extract Shared Types"]:::brown
    Strategy2["Strategy 2:<br/>Dependency Injection"]:::brown
    Strategy3["Strategy 3:<br/>Event-Based Decoupling"]:::brown

    Start --> Analyze
    Analyze --> DetectCycle
    DetectCycle -->|No| NoCircular
    DetectCycle -->|Yes| Circular
    Circular --> Strategy1
    Circular --> Strategy2
    Circular --> Strategy3

    Example["Example Circular:<br/>A imports B<br/>B imports C<br/>C imports A"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Node.js Module Resolution Algorithm

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Import["import { X } from 'module'"]:::blue
    Relative{"Relative path<br/>#40;./ or ../#41;?"}:::orange
    Builtin{"Built-in<br/>module?"}:::orange
    LocalFile["Resolve relative to<br/>current file"]:::teal
    NodeModules["Search node_modules<br/>up directory tree"]:::purple
    PackageJson["Read package.json<br/>exports/main field"]:::brown
    IndexFile["Try index.js/ts"]:::brown
    Success["Module Resolved"]:::teal
    Error["Module Not Found Error"]:::purple

    Import --> Relative
    Relative -->|Yes| LocalFile
    Relative -->|No| Builtin
    Builtin -->|Yes| Success
    Builtin -->|No| NodeModules
    LocalFile --> Success
    NodeModules --> PackageJson
    PackageJson --> IndexFile
    IndexFile --> Success
    IndexFile -.->|Not Found| Error

    Note1["Resolution order:<br/>1. Relative paths<br/>2. Built-in modules<br/>3. node_modules"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "Bundler", // or "Node16", "NodeNext"
    "module": "ESNext",
    "target": "ES2023",
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@infrastructure/*": ["infrastructure/*"]
    }
  }
}
```

## Workspaces and Monorepos

### Nx Workspace

```json
// nx.json
{
  "affected": {
    "defaultBase": "main"
  },
  "targetDefaults": {
    "build": {
      "cache": true
    }
  }
}
```

### pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "libs/*"
```

## Related Documentation

- **[TypeScript Best Practices](best-practices.md)** - Coding standards
- **[Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)** - Reproducible builds

---

**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Maintainers**: OSE Documentation Team

## Module System

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart LR
    A[TS Module System] --> B[ES Modules<br/>import/export]
    A --> C[CommonJS<br/>require/module.exports]
    A --> D[AMD/UMD<br/>Legacy]
    A --> E[Module Resolution<br/>Node/Classic]

    B --> B1[Named Export<br/>export const]
    B --> B2[Default Export<br/>export default]
    B --> B3[Re-exports<br/>export * from]

    C --> C1[Node.js Compat<br/>CJS Output]
    C --> C2[Interop<br/>esModuleInterop]

    D --> D1[Browser Compat<br/>RequireJS]
    D --> D2[UMD Bundles<br/>Universal]

    E --> E1[node_modules<br/>Package Lookup]
    E --> E2[Path Mapping<br/>tsconfig paths]
    E --> E3[Barrel Files<br/>index.ts]

    B1 --> F[Zakat Module<br/>Named Exports]
    E2 --> G[@app/zakat<br/>Path Alias]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CC78BC,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#DE8F05,color:#fff
    style G fill:#0173B2,color:#fff
```

## Dependency Management

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#000','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart LR
    A[package.json] --> B[npm install]
    B --> C[Resolve Dependencies]
    C --> D{Conflicts?}

    D -->|Yes| E[Version Resolution]
    D -->|No| F[Download Packages]

    E --> F
    F --> G[node_modules]
    G --> H[Type Definitions]

    H -->|@types| I[DefinitelyTyped]
    H -->|Built-in| J[Package Types]

    I --> K[Type Checking]
    J --> K

    K --> L[Compilation]

    style A fill:#0173B2,color:#fff
    style C fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
    style K fill:#CC78BC,color:#fff
```
