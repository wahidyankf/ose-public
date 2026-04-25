---
title: "F# Code Quality Standards"
description: Authoritative OSE Platform F# code quality standards — Fantomas formatter, FSharpLint, compiler warnings as errors
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - code-quality
  - fantomas
  - fsharplint
  - dotnet-format
  - warnings-as-errors
  - exhaustive-pattern-matching
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for F# development in OSE Platform. Fantomas is MANDATORY and non-negotiable. Compiler warnings are treated as errors. Incomplete pattern matches MUST be resolved, never suppressed.

**Target Audience**: OSE Platform F# developers, CI/CD pipeline configuration, code reviewers

**Scope**: Fantomas configuration, FSharpLint rules, `.editorconfig`, compiler settings, exhaustive pattern matching enforcement

## Software Engineering Principles

### 1. Automation Over Manual

**How F# Quality Tools Implement**:

- Fantomas runs automatically in pre-commit hooks — zero manual formatting
- FSharpLint runs in CI — naming violations caught before review
- `TreatWarningsAsErrors=true` in `.fsproj` — compiler enforces quality at build time
- `dotnet format` invokes Fantomas via the SDK integration

**PASS Example** (Automated Fantomas in pre-commit):

```bash
# .husky/pre-commit — Fantomas runs on all staged F# files
dotnet fantomas --check $(git diff --cached --name-only --diff-filter=ACM | grep '\.fs$')
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Fantomas configuration — no hidden defaults):

```json
// .fantomasrc — explicit configuration, committed to repo
{
  "indentSize": 4,
  "maxLineLength": 120,
  "multilineBlockBracketsOnSameColumn": false,
  "keepIfThenInSameLine": false,
  "alignFunctionSignatureToIndentation": true
}
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Pattern match exhaustiveness enforced by compiler — no runtime surprises):

```fsharp
// CORRECT: Exhaustive match — all ZakatOutcome cases handled
let describeZakatOutcome (outcome: ZakatOutcome) : string =
    match outcome with
    | ZakatDue amount -> $"Zakat of {amount} is due"
    | BelowNisab -> "Wealth is below the nisab threshold"
    | ExemptCategory reason -> $"Exempt: {reason}"
    // Compiler error if a new case is added to ZakatOutcome and not handled here
```

### 4. Reproducibility First

**PASS Example** (Pinned Fantomas version in `.config/dotnet-tools.json`):

```json
// .config/dotnet-tools.json — pinned tool versions for reproducible formatting
{
  "version": 1,
  "isRoot": true,
  "tools": {
    "fantomas": {
      "version": "6.3.0",
      "commands": ["fantomas"]
    },
    "fsharplint": {
      "version": "0.21.6",
      "commands": ["fsharplint"]
    }
  }
}
```

### 5. Immutability Over Mutability

**PASS Example** (Compiler warning for unused mutable treated as error):

```fsharp
// This produces a warning → error because mutable is unnecessary
// let mutable x = 5  // FS0026: unused mutable — FAILS build

// CORRECT: Immutable binding
let x = 5
```

## Fantomas Formatter (MANDATORY)

### Installation and Setup

**MUST** install Fantomas as a local dotnet tool and commit `.config/dotnet-tools.json`:

```bash
# Install as local tool
dotnet new tool-manifest   # Creates .config/dotnet-tools.json if not present
dotnet tool install fantomas

# Restore on any machine
dotnet tool restore
```

### Configuration

**MUST** provide a `.fantomasrc` file in every F# project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/fsprojects/fantomas/main/src/Fantomas.Core/schema.json",
  "indentSize": 4,
  "maxLineLength": 120,
  "multilineBlockBracketsOnSameColumn": false,
  "newlineBetweenTypeDefinitionAndMembers": true,
  "alignFunctionSignatureToIndentation": true,
  "alternativeLongMemberDefinitions": true,
  "keepIfThenInSameLine": false,
  "experimentalStroustrupStyle": false
}
```

### Usage

```bash
# Format all F# files in directory
dotnet fantomas .

# Check formatting without modifying (for CI)
dotnet fantomas --check .

# Format specific file
dotnet fantomas src/ZakatDomain/Calculation.fs
```

**PROHIBITED**: Manually reformatting code to override Fantomas. If Fantomas output is unexpected, adjust `.fantomasrc` — never fight the formatter manually.

## FSharpLint

**SHOULD** run FSharpLint in CI for style checking beyond Fantomas:

```bash
# Run linter on project
dotnet fsharplint lint MyProject.fsproj
```

**MUST** configure FSharpLint via `.fsharplint.json`:

```json
{
  "ignoreFiles": ["**/obj/**", "**/bin/**"],
  "analysers": {
    "Conventions": {
      "Naming": {
        "enabled": true,
        "rules": {
          "InterfaceNames": { "enabled": true, "naming": "PascalCase" },
          "ExceptionNames": { "enabled": true, "naming": "PascalCase" },
          "TypeNames": { "enabled": true, "naming": "PascalCase" },
          "RecordFieldNames": { "enabled": true, "naming": "PascalCase" },
          "UnionCasesNames": { "enabled": true, "naming": "PascalCase" },
          "ModuleNames": { "enabled": true, "naming": "PascalCase" },
          "LiteralNames": { "enabled": true, "naming": "PascalCase" },
          "NamespaceNames": { "enabled": true, "naming": "PascalCase" },
          "MemberNames": { "enabled": true, "naming": "PascalCase" },
          "ParameterNames": { "enabled": true, "naming": "CamelCase" },
          "MeasureTypeNames": { "enabled": true, "naming": "PascalCase" },
          "ActivePatternNames": { "enabled": true, "naming": "PascalCase" },
          "PublicValuesNames": { "enabled": true, "naming": "CamelCase" },
          "NonPublicValuesNames": { "enabled": true, "naming": "CamelCase" }
        }
      }
    }
  }
}
```

## Compiler Settings

### TreatWarningsAsErrors

**MUST** enable `TreatWarningsAsErrors` in every `.fsproj`:

```xml
<PropertyGroup>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

Or in `Directory.Build.props` for workspace-wide enforcement:

```xml
<Project>
  <PropertyGroup>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <Nullable>enable</Nullable>
    <LangVersion>preview</LangVersion>
  </PropertyGroup>
</Project>
```

### Exhaustive Pattern Matching

**MUST** never use `#nowarn` to suppress incomplete match warnings. Resolve them instead:

```fsharp
// WRONG: Suppressing the warning
// #nowarn "25"
// let getZakatAmount (ZakatDue amount) = amount  // Partial match!

// CORRECT: Handle all cases explicitly
let getZakatAmount (outcome: ZakatOutcome) : decimal option =
    match outcome with
    | ZakatDue amount -> Some amount
    | BelowNisab -> None
    | ExemptCategory _ -> None
```

**MUST** never use wildcard `_` as a catch-all in DU matches when new cases may be added:

```fsharp
// WRONG: Wildcard hides new unhandled cases when DU is extended
let describeOutcome outcome =
    match outcome with
    | ZakatDue amount -> $"Due: {amount}"
    | _ -> "Not due"   // WRONG: New cases silently fall through!

// CORRECT: Explicit handling of all cases
let describeOutcome outcome =
    match outcome with
    | ZakatDue amount -> $"Due: {amount}"
    | BelowNisab -> "Below nisab"
    | ExemptCategory reason -> $"Exempt: {reason}"
```

## .editorconfig for F

**MUST** include F#-specific `.editorconfig` rules:

```ini
[*.fs]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 120

[*.fsi]
indent_style = space
indent_size = 4

[*.fsproj]
indent_style = space
indent_size = 2
```

## IDE Support

**SHOULD** use fsautocomplete (FsAutoComplete) for IDE integration:

- **VS Code**: Ionide-fsharp extension (uses fsautocomplete)
- **JetBrains Rider**: Built-in F# support
- **Visual Studio**: Built-in F# support

**MUST** configure the editor to use the local Fantomas tool (not a globally installed version) to match CI behavior.

## Enforcement

- **Fantomas** - CI runs `dotnet fantomas --check .`; fails build if files are not formatted
- **FSharpLint** - CI runs linter; naming violations block merge
- **Compiler** - `TreatWarningsAsErrors=true` fails build on any warning
- **Code reviews** - Pattern match completeness and suppression-free code verified by reviewer

**Pre-commit checklist**:

- [ ] `dotnet fantomas .` applied (or `dotnet fantomas --check .` passes)
- [ ] No `#nowarn` directives added
- [ ] No wildcard `_` catch-alls in discriminated union matches
- [ ] `TreatWarningsAsErrors` enabled in `.fsproj` or `Directory.Build.props`
- [ ] `.fantomasrc` committed for all F# projects

## Related Standards

- [Coding Standards](coding-standards.md) - Naming conventions FSharpLint enforces
- [Build Configuration](build-configuration.md) - `.fsproj` and `Directory.Build.props` setup
- [Testing Standards](testing-standards.md) - Test files also subject to Fantomas

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
