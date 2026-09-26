---
title: F#
description: OSE Platform Authoritative F# Coding Standards and Framework Stack (F# 8 / .NET 8 LTS)
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - f-sharp
  - programming-languages
  - coding-standards
  - framework-stack
  - fsharp-6
  - fsharp-8
  - fsharp-9
  - dotnet-8
  - dotnet-9
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F Sharp

**This is THE authoritative reference** for F# coding standards in OSE Platform.

All F# code written for the OSE Platform MUST comply with the standards documented here. These standards are mandatory, not optional. Non-compliance blocks code review and merge approval.

## Framework Stack

OSE Platform F# applications MUST use the following stack:

**Web Frameworks**:

- **Giraffe** - Functional ASP.NET Core wrapper; HttpHandler composition with the fish operator (`>=>`)
- **Saturn** - Opinionated layer on top of Giraffe; `controller {}` and `application {}` computation expressions
- **SAFE Stack** - Full-stack functional web stack (Saturn + Azure + Fable + Elmish) for rich client applications
- **Falco** - Lightweight alternative with minimal dependencies for simple HTTP services

**Testing Stack**:

- **Expecto** - F#-native test framework with `testList` / `testCase` / `testProperty`
- **FsCheck** - Property-based testing (port of Haskell's QuickCheck)
- **FsUnit** - F# DSL for NUnit / xUnit assertions
- **Unquote** - Quotation-based assertions with readable failure messages

**Quality Tools**:

- **Fantomas** - F# code formatter (MANDATORY — zero negotiation)
- **FSharpLint** - Style linter for F# conventions
- **dotnet format** - SDK-integrated formatter invoker
- **.editorconfig** - Editor-agnostic indentation and style rules

**Build Tools**:

- **dotnet CLI** (primary): `dotnet build`, `dotnet test`, `dotnet publish`
- **.fsproj** - SDK-style project file (FILE ORDER MATTERS — F# compiler processes files top-to-bottom)
- **FAKE** - F# Make; F#-native build scripting (optional, for complex pipelines)
- **Paket** - Alternative package manager with `paket.dependencies` + `paket.lock` (opt-in per project)

**Coverage**:

- **Coverlet** - Cross-platform coverage collection integrated with `dotnet test`
- **ReportGenerator** - HTML coverage reports from Coverlet output
- **AltCover** - Alternative coverage engine with fine-grained instrumentation

**F# Version Strategy**:

- **Legacy**: F# 6 / .NET 6 (retired; migration context only)
- **Supported**: F# 8 / .NET 8 LTS (existing projects only; upgrade before support ends)
- **Maintenance**: F# 9 / .NET 9 STS (existing projects only)
- **Current**: F# 10 / .NET 10 LTS (MUST use for new projects)

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md) for F#-specific release documentation location

## Prerequisite Knowledge

**REQUIRED**: This documentation assumes you have completed the AyoKoding F# learning path. These are **OSE Platform-specific style guides**, not educational tutorials.

**You MUST understand F# fundamentals before using these standards:**

- **[F# Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/f-sharp/)** - Complete language coverage from basics to advanced
- **[F# By Example](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/f-sharp/by-example/)** - Annotated code examples covering discriminated unions, computation expressions, and more

**What this documentation covers**: OSE Platform naming conventions, framework choices, repository-specific patterns, how to apply F# knowledge in THIS codebase.

**What this documentation does NOT cover**: F# syntax, language fundamentals, discriminated union semantics, computation expression mechanics (those are in ayokoding-www).

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Software Engineering Principles

F# development in OSE Platform enforces foundational software engineering principles. F# naturally enforces most of them — the language design makes compliance the path of least resistance:

1. **[Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)** - MUST automate through Fantomas formatting, FSharpLint, `dotnet test`, Coverlet coverage collection, and CI/CD integration. F# `dotnet` tooling integrates directly with Nx via project targets.

2. **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)** - MUST enforce explicitness through explicit type annotations on public APIs, explicit `Result` and `Option` return types (no null), explicit module qualification, and explicit Fantomas configuration in `.fantomasrc`.

3. **[Immutability Over Mutability](../../../../../repo-governance/principles/software-engineering/immutability.md)** - F# enforces this BY DEFAULT. All `let` bindings are immutable. Record types are immutable. MUST NOT use `mutable` except at proven hot paths with documented justification. The compiler is your enforcement mechanism.

4. **[Pure Functions Over Side Effects](../../../../../repo-governance/principles/software-engineering/pure-functions.md)** - MUST implement functional core / imperative shell. Domain logic (Zakat calculations, Murabaha pricing, Nisab thresholds) MUST be pure functions. I/O, database access, and HTTP calls live at the shell. F# `Result` and `Async` types make the boundary visible.

5. **[Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)** - MUST ensure reproducibility through `global.json` for SDK pinning, `.fsproj` with exact NuGet version constraints, `packages.lock.json` for lockfile enforcement (`RestoreLockedMode=true`), and `Directory.Build.props` for shared settings across the workspace.

## F# Version Strategy

OSE Platform follows a current-LTS strategy with documented compatibility lines:

**F# 6 / .NET 6 (Retired Legacy Baseline)**:

- Unsupported; no new or maintained projects should target F# 6 / .NET 6
- `task {}` computation expression (native Task interop without Async wrapping)
- Anonymous record type updates (`{ record with Field = newValue }`)
- `_` (underscore) discard pattern in `use` bindings
- Struct discriminated unions for performance-critical value types

**F# 8 / .NET 8 LTS (Supported Existing Projects)**:

- Existing projects may retain F# 8 / .NET 8 while .NET 8 remains supported through 2026-11-10
- `_.Property` shorthand for lambda expressions (`fun x -> x.Name` becomes `_.Name`)
- Improved type inference for generic functions
- Enhanced pattern matching exhaustiveness checking
- `[<TailCall>]` attribute for enforced tail recursion (compiler error if not tail-recursive)
- Nested record field update syntax

**F# 9 / .NET 9 (Supported Maintenance Line)**:

- Existing projects may retain F# 9 / .NET 9 during its STS maintenance window
- Nullable reference type integration (F# types interoperate cleanly with C# NRT APIs)
- `lock` expression as first-class expression (cleaner than `lock obj (fun () -> ...)`)
- Improved `use!` semantics in computation expressions
- Dictionary expression literals
- Partial active patterns returning `voption` for zero-allocation matching

**F# 10 / .NET 10 LTS (Current - REQUIRED for new projects)**:

- All new OSE Platform F# projects MUST target F# 10 / .NET 10
- Scoped warning control with `#warnon`
- Access modifiers on individual auto-property accessors
- Tail-call support and typed bindings in computation expressions
- Clearer sequence-expression and attribute-target diagnostics

**Unlike Go**: .NET follows an annual release cycle with LTS releases every two years. F# version numbers track .NET SDK versions. The platform strategy is: target the current LTS for stability, adopt latest features on new projects.

**See**: [F# Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/f-sharp/) for detailed feature documentation

### Version References

- [F# 6 / .NET 6](release-6.md) — retired legacy baseline
- [F# 8 / .NET 8](release-8.md) — supported LTS line
- [F# 9 / .NET 9](release-9.md) — supported STS line
- [F# 10 / .NET 10](release-10.md) — current LTS target

## OSE Platform Coding Standards (Authoritative)

**MUST follow these mandatory standards for all F# code in OSE Platform:**

1. **[Coding Standards](coding-standards.md) — Naming conventions, module organization, pipeline idioms, discriminated unions**
2. **[Testing Standards](testing-standards.md) — Expecto, FsCheck property-based testing, coverage requirements**
3. **[Code Quality Standards](code-quality-standards.md) — Fantomas (mandatory), FSharpLint, compiler warnings as errors**
4. **[Build Configuration](build-configuration.md) — .fsproj structure, file ordering, Paket, FAKE, global.json**
5. **[Error Handling Standards](error-handling-standards.md) — Railway-oriented programming, Result type, FsToolkit patterns**
6. **[Concurrency Standards](concurrency-standards.md) — Async workflows, MailboxProcessor actor model, Task interop**
7. **[Performance Standards](performance-standards.md) — Tail recursion, struct DUs, BenchmarkDotNet, AltCover**
8. **[Security Standards](security-standards.md) — Type-driven validation, Giraffe auth, parameterized queries**
9. **[API Standards](api-standards.md) — Giraffe HttpHandler composition, Saturn controllers, JSON serialization**
10. **[DDD Standards](ddd-standards.md) — Domain modeling with DUs, value objects as records, aggregate pattern**
11. **[Functional Programming Standards](functional-programming-standards.md) — Computation expressions, monadic composition, applicative validation**
12. **[Type Safety Standards](type-safety-standards.md) — Making illegal states unrepresentable, units of measure, single-case DUs**

## Documentation Structure

### Quick Reference

**Mandatory Standards (All F# Developers MUST follow)**:

1. [Coding Standards](coding-standards.md) — Naming, module structure, pipeline operator
2. [Testing Standards](testing-standards.md) — Expecto framework, FsCheck, Unit line coverage >=99%
3. [Code Quality Standards](code-quality-standards.md) — Fantomas formatting, exhaustive pattern matching

**Context-Specific Standards (Apply when relevant)**:

- **Error Handling**: [Error Handling Standards](error-handling-standards.md) — Result type, railway-oriented programming
- **Concurrency**: [Concurrency Standards](concurrency-standards.md) — Async workflows, MailboxProcessor for concurrent code
- **Domain Modeling**: [DDD Standards](ddd-standards.md) — DU-driven domain modeling for Sharia finance rules
- **APIs**: [API Standards](api-standards.md) — Giraffe/Saturn HTTP patterns for web services
- **Performance**: [Performance Standards](performance-standards.md) — Tail recursion, profiling when needed
- **Security**: [Security Standards](security-standards.md) — Type-driven validation, auth middleware
- **Type Safety**: [Type Safety Standards](type-safety-standards.md) — Units of measure, single-case DUs, type providers
- **Functional Patterns**: [Functional Programming Standards](functional-programming-standards.md) — CEs, composition, applicative validation
- **Build**: [Build Configuration](build-configuration.md) — .fsproj ordering, Paket, Directory.Build.props

### Documentation Organization

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph LR
    accTitle: Documentation Organization
    accDescr: F Standards Index OSE Platform leads to Core Standards; F Standards Index OSE Platform leads to Specialized Standards; F Standards Index OSE Platform leads to Learning Resources AyoKoding; Core Standards leads to Coding Standards; and 13 more links.
    A["F# Standards Index<br/>(OSE Platform)"]:::blue
    B["Core Standards"]:::orange
    C["Specialized<br/>Standards"]:::teal
    D["Learning Resources<br/>(AyoKoding)"]:::purple

    A --> B
    A --> C
    A --> D

    B --> E["Coding Standards"]:::orange
    B --> F["Testing Standards"]:::orange
    B --> G["Code Quality"]:::orange
    B --> H["Build Configuration"]:::orange

    C --> I["Error Handling<br/>(Railway-Oriented)"]:::teal
    C --> J["Concurrency<br/>Async /<br/>MailboxProcessor"]:::teal
    C --> K["DDD Standards<br/>(DU Domain Modeling)"]:::teal
    C --> L["API Standards<br/>(Giraffe / Saturn)"]:::teal
    C --> M["Performance<br/>Standards"]:::teal
    C --> N["Security Standards"]:::teal
    C --> O["Type Safety<br/>(Units of Measure)"]:::teal
    C --> P["Functional<br/>Programming<br/>Computation<br/>Expressions"]:::teal

    D --> Q["By Example<br/>(Annotated examples)"]:::purple
    D --> R["In the Field<br/>Production patterns"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Primary Use Cases in OSE Platform

**Financial Domain Computation**:

- Zakat calculation engines MUST use F# for type-safe, pure function arithmetic
- Nisab threshold evaluation SHOULD use discriminated unions to model all valid states
- Murabaha and Musharakah pricing rules SHOULD use F# units of measure to prevent currency confusion
- Audit trail computation MUST use immutable record chains — F# records are immutable by default

**DSLs for Sharia Finance Rules**:

- Sharia compliance rule engines SHOULD be modeled as discriminated union state machines
- Fatwa-derived computation rules SHOULD use computation expressions for readable, sequential logic
- Halal screening criteria SHOULD use active patterns for extensible, named matching logic
- Type providers SHOULD be used to integrate Sharia finance data feeds (JSON, XML, SQL) safely

**Functional Microservices**:

- HTTP microservices MUST use Giraffe or Saturn with HttpHandler composition
- Event-driven services SHOULD use MailboxProcessor actors for message processing
- CQRS read models SHOULD use F# record projections from domain events
- SAFE Stack applications SHOULD share domain DU types between server (Saturn) and client (Fable)

## Reproducible Builds and Automation

**Version Management (REQUIRED)**:

- MUST use `global.json` with `sdk.version` to pin the exact .NET SDK version
- MUST use `.fsproj` with explicit `<TargetFramework>net8.0</TargetFramework>` (or net9.0)
- MUST enable `RestoreLockedMode` in `Directory.Build.props` for `packages.lock.json` enforcement
- SHOULD NOT rely on system-installed SDK without version verification

**Dependency Management (REQUIRED)**:

- MUST use NuGet with explicit version constraints in `.fsproj` (`<PackageReference Include="..." Version="x.y.z" />`)
- MUST commit `packages.lock.json` and enable `RestoreLockedMode=true` for hermetic restores
- SHOULD use `dotnet list package --outdated` regularly to track dependency drift
- MAY use Paket (`paket.dependencies` + `paket.lock`) for projects requiring fine-grained transitive control

**Automated Quality (REQUIRED)**:

- MUST use Fantomas for code formatting — zero manual formatting debates
- MUST configure `.fantomasrc` in project root for consistent settings
- SHOULD use FSharpLint for additional style enforcement
- MUST set `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in `.fsproj`
- MUST enable exhaustive pattern match warnings (enabled by default — never suppress)
- MUST achieve >=99% line coverage measured with Coverlet and enforced during `test:unit`; static `test:coverage:*` targets never execute tests

**Testing Automation (REQUIRED)**:

- MUST write tests with Expecto (`testList` / `testCase` / `testProperty`)
- MUST use FsCheck for property-based testing of domain logic (Zakat calculation invariants, etc.)
- SHOULD use FsUnit DSL assertions when xUnit / NUnit integration is required
- SHOULD test pure functions directly without test doubles
- MUST avoid test doubles for pure domain functions — test them directly with inputs and expected outputs

**Build Automation (REQUIRED)**:

- MUST use `dotnet build`, `dotnet test`, `dotnet publish` as primary build commands
- SHOULD use FAKE build scripts for complex multi-step pipelines
- MUST integrate Nx project targets for monorepo cross-project dependency tracking
- SHOULD use pre-commit hooks for Fantomas formatting (this repository's `format-staged` registry gate)

**See**: [Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md), [Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)

## Integration with Repository Governance

**Development Practices**:

- [Functional Programming](../../../../../repo-governance/development/pattern/functional-programming.md) - F# naturally aligns; MUST follow functional core / imperative shell
- [Implementation Workflow](../../../../../repo-governance/development/workflow/implementation.md) - MUST follow "make it work → make it right → make it fast" process
- [Code Quality Standards](../../../../../repo-governance/development/quality/code.md) - MUST meet platform-wide quality requirements
- [Commit Messages](../../../../../repo-governance/development/workflow/commit-messages.md) - MUST use Conventional Commits format

**Code Review Requirements**:

- All F# code MUST pass automated checks (Fantomas, `test:unit` with Coverlet coverage >=99%, and applicable static coverage validators)
- Code reviewers MUST verify Fantomas formatting compliance (CI should enforce this automatically)
- Non-compliance with mandatory standards (Coding, Testing, Code Quality) blocks merge
- Incomplete pattern match warnings MUST be resolved before merge — never suppressed with `#nowarn`

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../repo-governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../repo-governance/principles/software-engineering/pure-functions.md)
- [Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)

**Development Practices**:

- [Functional Programming](../../../../../repo-governance/development/pattern/functional-programming.md)
- [Maker-Checker-Fixer Pattern](../../../../../repo-governance/development/pattern/maker-checker-fixer.md)

**Platform Documentation**:

- [Tech Stack Languages Index](../README.md)
- [Monorepo Structure](../../../../reference/monorepo-structure.md)
- [F# Documentation Templates](./templates/README.md) — Reusable templates for F# development patterns in OSE Platform
- [F# API Standards](./api-standards.md) — Authoritative OSE Platform F# API standards — Giraffe HttpHandler composition, Saturn controllers, JSON serialization
- [F# Build Configuration](./build-configuration.md) — Authoritative OSE Platform F# build configuration — .fsproj structure, file ordering, Paket, FAKE, global.json
- [F# Code Quality Standards](./code-quality-standards.md) — Authoritative OSE Platform F# code quality standards — Fantomas formatter, FSharpLint, compiler warnings as errors
- [F# Coding Standards](./coding-standards.md) — Authoritative OSE Platform F# coding standards — naming, module organization, pipeline idioms, discriminated unions
- [F# Concurrency Standards](./concurrency-standards.md) — Authoritative OSE Platform F# concurrency standards — async workflows, MailboxProcessor actor model, Task interop
- [F# DDD Standards](./ddd-standards.md) — Authoritative OSE Platform F# domain-driven design standards — discriminated unions, value objects, aggregate pattern
- [F# Error Handling Standards](./error-handling-standards.md) — Authoritative OSE Platform F# error handling standards — railway-oriented programming, Result type, Option, FsToolkit
- [F# Functional Programming Standards](./functional-programming-standards.md) — Authoritative OSE Platform F# functional programming standards — computation expressions, monadic composition, applicative validation
- [F# Performance Standards](./performance-standards.md) — Authoritative OSE Platform F# performance standards — tail recursion, struct DUs, BenchmarkDotNet, AltCover profiling
- [F# Security Standards](./security-standards.md) — Authoritative OSE Platform F# security standards — type-driven validation, Giraffe auth, parameterized queries
- [F# Testing Standards](./testing-standards.md) — Authoritative OSE Platform F# testing standards — Expecto, FsCheck property-based testing, coverage requirements
- [F# Type Safety Standards](./type-safety-standards.md) — Authoritative OSE Platform F# type safety standards — making illegal states unrepresentable, units of measure, single-case DUs, generics

---

**Status**: Authoritative Standard (Mandatory Compliance)

**F# Version**: F# 6 / .NET 6 (retired), F# 8 / .NET 8 LTS and F# 9 / .NET 9 STS
(supported maintenance), F# 10 / .NET 10 LTS (current and required for new projects)
**Framework Stack**: Giraffe, Saturn, Expecto, FsCheck, Fantomas, dotnet CLI
**Maintainers**: Platform Architecture Team
