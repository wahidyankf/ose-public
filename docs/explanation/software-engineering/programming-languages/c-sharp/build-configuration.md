---
title: "C# Build Configuration Standards"
description: Authoritative OSE Platform C# build configuration standards (.csproj, Directory.Build.props, NuGet Central Package Management)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - build-configuration
  - dotnet
  - msbuild
  - nuget
  - csproj
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Build Configuration Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for C# projects in the OSE Platform.

**Target Audience**: OSE Platform C# developers and DevOps engineers

**Scope**: .csproj SDK-style format, Directory.Build.props, NuGet Central Package Management, global.json, dotnet CLI commands, multi-targeting, single-file publish

## Software Engineering Principles

### 1. Reproducibility First

**PASS Example** (Pinned, lockfile-enforced build):

```bash
# CI reproducible restore - fails if lock file is out of date
dotnet restore --locked-mode

# Verify no package tampering
dotnet nuget verify --all
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit project properties):

```xml
<!-- All important properties are explicit, not relying on defaults -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <Optimize>false</Optimize>
    <DebugType>portable</DebugType>
  </PropertyGroup>
</Project>
```

## SDK-Style Project Format

**MUST** use SDK-style project format for all C# projects. **MUST NOT** use the legacy non-SDK format.

### Application Project (.csproj)

```xml
<!-- src/OsePlatform.Zakat/OsePlatform.Zakat.csproj -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <OutputType>Library</OutputType>
    <!-- Nullable and ImplicitUsings inherited from Directory.Build.props -->
  </PropertyGroup>

  <ItemGroup>
    <!-- Package versions come from Directory.Packages.props -->
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" />
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" />
  </ItemGroup>

</Project>
```

### ASP.NET Core Web API Project

```xml
<!-- src/OsePlatform.Api/OsePlatform.Api.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <!-- Nullable, ImplicitUsings, analyzers from Directory.Build.props -->
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" />
    <PackageReference Include="Swashbuckle.AspNetCore" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../OsePlatform.Zakat/OsePlatform.Zakat.csproj" />
  </ItemGroup>

</Project>
```

### Test Project

```xml
<!-- tests/OsePlatform.Zakat.Tests/OsePlatform.Zakat.Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="FluentAssertions" />
    <PackageReference Include="Moq" />
    <PackageReference Include="Bogus" />
    <PackageReference Include="coverlet.collector">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../../src/OsePlatform.Zakat/OsePlatform.Zakat.csproj" />
  </ItemGroup>

</Project>
```

## Directory.Build.props

**MUST** use `Directory.Build.props` at solution root to share common settings across all projects. This eliminates property duplication across `.csproj` files.

```xml
<!-- Directory.Build.props (at solution root) -->
<Project>

  <PropertyGroup>
    <!-- Language settings -->
    <LangVersion>12</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- Quality enforcement -->
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>

    <!-- CI-only: treat warnings as errors in Release builds -->
    <TreatWarningsAsErrors Condition="'$(Configuration)' == 'Release'">true</TreatWarningsAsErrors>

    <!-- Build metadata -->
    <Authors>OSE Platform Team</Authors>
    <Company>Open Sharia Enterprise</Company>
    <Copyright>Copyright © Open Sharia Enterprise 2026</Copyright>
  </PropertyGroup>

  <!-- Analyzers for all projects -->
  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="SonarAnalyzer.CSharp">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
  </ItemGroup>

</Project>
```

## NuGet Central Package Management

**MUST** use NuGet Central Package Management via `Directory.Packages.props`. All package versions are declared once at solution level.

```xml
<!-- Directory.Packages.props (at solution root) -->
<Project>

  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>

  <!-- ASP.NET Core / EF Core (aligned with .NET 8 LTS) -->
  <ItemGroup>
    <PackageVersion Include="Microsoft.AspNetCore.OpenApi" Version="8.0.12" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="8.0.12" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.12" />
    <PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.11" />
    <PackageVersion Include="Swashbuckle.AspNetCore" Version="6.9.0" />
    <PackageVersion Include="MediatR" Version="12.5.0" />
  </ItemGroup>

  <!-- Testing -->
  <ItemGroup>
    <PackageVersion Include="xunit" Version="2.9.3" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageVersion Include="FluentAssertions" Version="6.12.2" />
    <PackageVersion Include="Moq" Version="4.20.72" />
    <PackageVersion Include="Bogus" Version="35.6.1" />
    <PackageVersion Include="coverlet.collector" Version="6.0.2" />
    <PackageVersion Include="Testcontainers.PostgreSql" Version="3.10.0" />
    <PackageVersion Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.12" />
  </ItemGroup>

  <!-- Analyzers -->
  <ItemGroup>
    <PackageVersion Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="8.0.0" />
    <PackageVersion Include="SonarAnalyzer.CSharp" Version="9.32.0.97167" />
  </ItemGroup>

</Project>
```

## global.json

**MUST** include `global.json` at solution root to pin the .NET SDK version.

```json
{
  "sdk": {
    "version": "8.0.404",
    "rollForward": "disable",
    "allowPrerelease": false
  }
}
```

- `"rollForward": "disable"` - fail if exact version is not installed (maximum reproducibility)
- `"allowPrerelease": false` - never use preview SDK in production builds

## dotnet CLI Commands

**MUST** use these commands for standard development workflows:

```bash
# Restore packages (enforces lockfile in CI)
dotnet restore --locked-mode

# Build (debug by default)
dotnet build

# Build release with all warnings as errors
dotnet build --configuration Release

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# Publish for deployment
dotnet publish --configuration Release --output ./publish

# Format code
dotnet format

# Verify formatting (CI)
dotnet format --verify-no-changes

# Add EF Core migration
dotnet ef migrations add AddZakatTransactionTable --project src/OsePlatform.Infrastructure

# Apply migrations
dotnet ef database update --project src/OsePlatform.Infrastructure
```

## Solution Structure

**MUST** follow this standard solution structure:

```
OsePlatform.Zakat/
├── global.json                              # SDK version pin
├── Directory.Build.props                    # Shared MSBuild properties
├── Directory.Packages.props                 # NuGet Central Package Management
├── .editorconfig                            # Formatting rules
├── OsePlatform.Zakat.sln                   # Solution file
├── src/
│   ├── OsePlatform.Zakat.Domain/           # Pure domain logic
│   ├── OsePlatform.Zakat.Application/      # Application services
│   ├── OsePlatform.Zakat.Infrastructure/   # EF Core, external services
│   └── OsePlatform.Zakat.Api/              # ASP.NET Core project
└── tests/
    ├── OsePlatform.Zakat.Domain.Tests/
    ├── OsePlatform.Zakat.Application.Tests/
    ├── OsePlatform.Zakat.Infrastructure.Tests/
    └── OsePlatform.Zakat.Api.Tests/
```

## Multi-Targeting

**SHOULD** use multi-targeting for library projects that need to support multiple .NET versions.

```xml
<!-- Library supporting .NET 8 and .NET 9 -->
<PropertyGroup>
    <TargetFrameworks>net8.0;net9.0</TargetFrameworks>
</PropertyGroup>

<!-- Conditional compilation for version-specific APIs -->
<ItemGroup Condition="'$(TargetFramework)' == 'net9.0'">
    <PackageReference Include="SomeNet9OnlyPackage" />
</ItemGroup>
```

## PublishSingleFile for CLI Tools

**MUST** use `PublishSingleFile` for CLI tool projects to produce distributable single binaries.

```xml
<!-- CLI tool project -->
<PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <PublishSingleFile>true</PublishSingleFile>
    <SelfContained>true</SelfContained>
    <RuntimeIdentifier>linux-x64</RuntimeIdentifier>
    <PublishReadyToRun>true</PublishReadyToRun>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
</PropertyGroup>
```

```bash
# Publish self-contained single file for Linux x64
dotnet publish --configuration Release \
    --runtime linux-x64 \
    --self-contained true \
    -p:PublishSingleFile=true \
    --output ./publish/linux-x64
```

## Enforcement

- **global.json** - SDK version pinned in git
- **Directory.Packages.props** - All versions centralized
- **packages.lock.json** - Committed lockfile enforced in CI with `--locked-mode`
- **CI pipeline** - `dotnet restore --locked-mode` on every build

**Pre-commit checklist**:

- [ ] `global.json` at solution root with `"rollForward": "disable"`
- [ ] All package versions in `Directory.Packages.props` (not individual `.csproj` files)
- [ ] `packages.lock.json` committed and up to date
- [ ] No floating package versions (`*` or `1.0.*`)
- [ ] Test projects have `IsTestProject>true</IsTestProject>`

## Related Standards

- [Code Quality Standards](code-quality-standards.md) - Roslyn analyzers in Directory.Build.props
- [Testing Standards](testing-standards.md) - Test project configuration
- [Framework Integration](framework-integration.md) - EF Core migration commands

## Related Documentation

- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
