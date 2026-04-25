---
title: "C# Code Quality Standards"
description: Authoritative OSE Platform C# code quality standards (Roslyn analyzers, dotnet format, editorconfig, nullable reference types)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - code-quality
  - roslyn
  - analyzers
  - editorconfig
  - dotnet-format
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for C# in the OSE Platform, covering tooling configuration, enforcement rules, and automated quality gates.

**Target Audience**: OSE Platform C# developers, CI/CD pipeline engineers, code reviewers

**Scope**: .editorconfig rules, dotnet format, Roslyn analyzers, nullable reference types, SonarAnalyzer

## Software Engineering Principles

### 1. Automation Over Manual

**How C# Implements**:

- `dotnet format` auto-formats code to `.editorconfig` rules on every commit
- Roslyn analyzers run at compile time, not during code review
- `TreatWarningsAsErrors` turns analyzer findings into build failures — no manual tracking

**PASS Example** (CI quality gate):

```bash
# CI pipeline quality gate - fails fast on any violation
dotnet restore --locked-mode
dotnet build /p:TreatWarningsAsErrors=true
dotnet format --verify-no-changes
dotnet test --collect:"XPlat Code Coverage"
rhino-cli test-coverage validate ./coverage/*/coverage.cobertura.xml 95
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit nullable intent):

```csharp
// CORRECT: nullable reference types make intent explicit
public ZakatTransaction? FindTransaction(Guid id)  // ? means "may return null"
{
    return _transactions.FirstOrDefault(t => t.TransactionId == id);
}

// Caller is forced to handle null explicitly
var transaction = service.FindTransaction(id);
if (transaction is null)
{
    return NotFound();
}
ProcessTransaction(transaction); // compiler knows non-null here
```

## .editorconfig Configuration

**MUST** include `.editorconfig` at solution root committed to git.

```ini
# .editorconfig - committed to git for reproducible formatting
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
trim_trailing_whitespace = true
insert_final_newline = true

[*.{cs,csx}]
indent_size = 4

# Naming rules
dotnet_naming_rule.private_fields_should_be_camel_case.symbols = private_fields
dotnet_naming_rule.private_fields_should_be_camel_case.style = camel_case_underscore_style
dotnet_naming_rule.private_fields_should_be_camel_case.severity = warning

dotnet_naming_symbols.private_fields.applicable_kinds = field
dotnet_naming_symbols.private_fields.applicable_accessibilities = private

dotnet_naming_style.camel_case_underscore_style.required_prefix = _
dotnet_naming_style.camel_case_underscore_style.capitalization = camel_case

# Expression bodies
csharp_style_expression_bodied_methods = when_on_single_line
csharp_style_expression_bodied_properties = true

# Null checks
csharp_style_prefer_null_check_over_type_check = true

# Pattern matching
csharp_style_prefer_pattern_matching = true
csharp_style_prefer_switch_expression = true

# var usage
csharp_style_var_for_built_in_types = false
csharp_style_var_when_type_is_apparent = true
csharp_style_var_elsewhere = false

[*.{json,xml,yaml,yml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

## dotnet format

**MUST** run `dotnet format` in pre-commit hooks. **MUST** run `dotnet format --verify-no-changes` in CI to fail on unformatted code.

```bash
# Local: auto-fix formatting
dotnet format

# CI: verify no formatting changes needed (fails if changes exist)
dotnet format --verify-no-changes --verbosity diagnostic

# Format specific files only
dotnet format --include ./src/OsePlatform.Zakat
```

## Roslyn Analyzers

### Required Analyzers

**MUST** include the following analyzer packages in `Directory.Build.props`:

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors Condition="'$(Configuration)' == 'Release'">true</TreatWarningsAsErrors>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="8.0.0">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="SonarAnalyzer.CSharp" Version="9.32.0.97167">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
  </ItemGroup>
</Project>
```

### Analyzer Rules

**MUST** treat these as errors (not warnings) in CI:

| Rule   | Category      | Description                                                                  |
| ------ | ------------- | ---------------------------------------------------------------------------- |
| CA1062 | Design        | Validate arguments before using them                                         |
| CA1305 | Globalization | Specify IFormatProvider                                                      |
| CA1822 | Performance   | Mark members as static where possible                                        |
| CA2007 | Reliability   | Consider using ConfigureAwait                                                |
| CA2016 | Reliability   | Forward CancellationToken parameter                                          |
| CS8600 | Nullable      | Converting null literal or possible null value to non-nullable type          |
| CS8602 | Nullable      | Dereference of a possibly null reference                                     |
| CS8603 | Nullable      | Possible null reference return                                               |
| CS8618 | Nullable      | Non-nullable property must contain a non-null value when exiting constructor |

### Suppressions (When Allowed)

**MUST** document all suppressed analyzer warnings with a justification comment.

```csharp
// CORRECT: suppression with justification
#pragma warning disable CA1822 // Mark members as static
// Justification: This method is part of a DI-registered interface that must be instance method
public ZakatTransaction Process(decimal wealth) { }
#pragma warning restore CA1822

// WRONG: suppression without justification
#pragma warning disable CA1822
public ZakatTransaction Process(decimal wealth) { }
#pragma warning restore CA1822
```

## Nullable Reference Types

**MUST** enable nullable reference types for all projects via `Directory.Build.props`.

```xml
<PropertyGroup>
    <Nullable>enable</Nullable>
</PropertyGroup>
```

### Nullable Annotations

**MUST** annotate all reference type return values and parameters with nullability.

```csharp
// CORRECT: explicit nullable annotations
public ZakatTransaction? FindById(Guid id)  // may return null
    => _transactions.FirstOrDefault(t => t.TransactionId == id);

public void Process(ZakatTransaction transaction) // non-null required
{
    ArgumentNullException.ThrowIfNull(transaction);
}

// CORRECT: null-forgiving operator only when you have proven non-null
// (compiler cannot infer it, but you have domain knowledge)
var transaction = FindById(id);
if (IsValidId(id)) // logic guarantees non-null when IsValidId is true
{
    var amount = transaction!.ZakatAmount; // justified use of !
}
```

### Constructor Initialization

**MUST** initialize all non-nullable properties in constructor or with field initializers. Never use `null!` to silence nullable warnings without proper initialization.

```csharp
// CORRECT: required keyword forces initialization at construction site
public sealed class ZakatService
{
    public required IZakatRepository Repository { get; init; }
}

// CORRECT: constructor injection guarantees non-null
public sealed class ZakatService(IZakatRepository repository)
{
    private readonly IZakatRepository _repository = repository
        ?? throw new ArgumentNullException(nameof(repository));
}

// WRONG: null! suppresses warning without actual initialization
public sealed class ZakatService
{
    private IZakatRepository _repository = null!; // dangerous pattern
}
```

## Code Coverage Enforcement

**MUST** achieve >=95% line coverage using Coverlet with enforcement via `rhino-cli test-coverage validate`.

```xml
<!-- Directory.Build.props - add for test projects -->
<ItemGroup Condition="$(MSBuildProjectName.EndsWith('.Tests'))">
  <PackageReference Include="coverlet.collector" Version="6.0.2">
    <PrivateAssets>all</PrivateAssets>
  </PackageReference>
</ItemGroup>
```

```bash
# Run tests with coverage collection
dotnet test --collect:"XPlat Code Coverage" \
    --results-directory ./coverage \
    --configuration Release

# Enforce threshold
rhino-cli test-coverage validate ./coverage/*/coverage.cobertura.xml 95
```

## SonarAnalyzer Rules

SonarAnalyzer.CSharp provides additional rules beyond the built-in Roslyn analyzers. Key rules enabled by default:

- **S1135** - Track uses of "TODO" tags
- **S2068** - Credentials should not be hardcoded
- **S2094** - Classes should not be empty
- **S2190** - Recursion should not be infinite
- **S3776** - Cognitive Complexity should not be too high
- **S4018** - Generic type parameters should be on declarations

## Enforcement

- **dotnet format** - Auto-formats code (pre-commit hook)
- **Roslyn analyzers** - Compile-time static analysis
- **TreatWarningsAsErrors** - CI build fails on any analyzer warning
- **Coverlet + rhino-cli** - Coverage threshold enforcement

**Pre-commit checklist**:

- [ ] Code formatted with `dotnet format`
- [ ] No Roslyn analyzer warnings in IDE
- [ ] All nullable warnings resolved (no unjustified `!` operators)
- [ ] Non-nullable properties initialized in constructor or with `required`
- [ ] Coverage >=95% maintained

## Related Standards

- [Coding Standards](coding-standards.md) - Naming, idioms
- [Testing Standards](testing-standards.md) - xUnit, coverage collection
- [Build Configuration](build-configuration.md) - Directory.Build.props, csproj setup
- [Type Safety Standards](type-safety-standards.md) - Nullable reference types deep dive

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
