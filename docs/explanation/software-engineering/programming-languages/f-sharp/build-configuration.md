---
title: "F# Build Configuration"
description: Authoritative OSE Platform F# build configuration — .fsproj structure, file ordering, Paket, FAKE, global.json
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - build-configuration
  - dotnet
  - fsproj
  - paket
  - fake
  - global-json
  - directory-build-props
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Build Configuration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for F# development in OSE Platform. F# has a unique compilation model where file order in `.fsproj` is semantically significant — this is the most common source of build errors for developers new to F#.

**Target Audience**: OSE Platform F# developers, CI/CD engineers

**Scope**: `.fsproj` structure, file ordering rules, `Directory.Build.props`, `global.json`, Paket, FAKE, Nx integration

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Nx target wrapping dotnet CLI):

```json
// project.json for an F# project in the Nx monorepo
{
  "name": "zakat-service",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet build apps/zakat-service/ZakatService.fsproj --configuration Release",
        "cwd": "."
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet test apps/zakat-service/ZakatService.Tests.fsproj --no-build",
        "cwd": "."
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet fantomas --check apps/zakat-service/",
        "cwd": "."
      }
    }
  }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit target framework and version):

```xml
<!-- CORRECT: Explicit TargetFramework — no ambiguity -->
<TargetFramework>net8.0</TargetFramework>

<!-- WRONG: Implicit or ambiguous -->
<!-- <TargetFramework>netstandard2.0</TargetFramework> -->
```

### 3. Reproducibility First

**PASS Example** (Locked dependencies for hermetic builds):

```xml
<!-- Directory.Build.props — enforces locked mode for all projects -->
<PropertyGroup>
    <RestoreLockedMode Condition="'$(ContinuousIntegrationBuild)' == 'true'">true</RestoreLockedMode>
</PropertyGroup>
```

## Critical Rule: F# File Order in .fsproj

**F# compiles files strictly in the order listed in `.fsproj`.** A file can only use types and functions from files listed ABOVE it in the `.fsproj`. This is the most important structural rule in F# development.

### Ordering Principle

**MUST** order files from most foundational to most dependent:

```xml
<ItemGroup>
    <!-- 1. Pure domain types (no dependencies) -->
    <Compile Include="Domain/Types.fs" />

    <!-- 2. Domain validation (depends on Types) -->
    <Compile Include="Domain/Validation.fs" />

    <!-- 3. Domain calculations (depends on Types + Validation) -->
    <Compile Include="Domain/Calculation.fs" />

    <!-- 4. Application layer (depends on all domain) -->
    <Compile Include="Application/ZakatService.fs" />

    <!-- 5. Infrastructure (depends on application) -->
    <Compile Include="Infrastructure/Database.fs" />

    <!-- 6. HTTP handlers (depends on application) -->
    <Compile Include="Api/Handlers.fs" />

    <!-- 7. Composition root — always last -->
    <Compile Include="Program.fs" />
</ItemGroup>
```

**WRONG: Forward reference (compiler error)**:

```xml
<!-- WRONG: Calculation.fs cannot reference Types.fs if Types.fs comes after it -->
<ItemGroup>
    <Compile Include="Domain/Calculation.fs" />  <!-- Tries to use types from below! -->
    <Compile Include="Domain/Types.fs" />
</ItemGroup>
```

### Mutual Recursion

When two modules genuinely need to reference each other, use `and` for mutual recursion. This is rare in well-structured F# code — it usually signals a design issue:

```fsharp
// RARE: Mutual recursion with 'and'
// Domain/MutualDependency.fs
module rec ZakatDomain

type ZakatClaim = {
    Payer: Payer
    Amount: decimal
}

and Payer = {
    PayerId: string
    Claims: ZakatClaim list
}
```

## .fsproj Structure

**MUST** use SDK-style project format:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <AssemblyName>ZakatService</AssemblyName>
    <RootNamespace>ZakatService</RootNamespace>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <Compile Include="Domain/Types.fs" />
    <Compile Include="Domain/Validation.fs" />
    <Compile Include="Domain/Calculation.fs" />
    <Compile Include="Application/ZakatService.fs" />
    <Compile Include="Api/Handlers.fs" />
    <Compile Include="Program.fs" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Giraffe" Version="7.0.0" />
    <PackageReference Include="FSharp.Core" Version="8.0.400" />
  </ItemGroup>

</Project>
```

### Library Projects

For F# libraries (no entry point):

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Library</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <Compile Include="Types.fs" />
    <Compile Include="Calculations.fs" />
    <Compile Include="Validation.fs" />
  </ItemGroup>

</Project>
```

## Directory.Build.props

**MUST** use `Directory.Build.props` for workspace-wide settings to prevent configuration drift:

```xml
<!-- Directory.Build.props in workspace root -->
<Project>
  <PropertyGroup>
    <!-- Quality enforcement -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <Nullable>enable</Nullable>
    <LangVersion>preview</LangVersion>

    <!-- Reproducibility -->
    <RestoreLockedMode Condition="'$(ContinuousIntegrationBuild)' == 'true'">true</RestoreLockedMode>

    <!-- Documentation -->
    <GenerateDocumentationFile>true</GenerateDocumentationFile>

    <!-- Deterministic builds -->
    <Deterministic>true</Deterministic>
    <ContinuousIntegrationBuild Condition="'$(CI)' != ''">true</ContinuousIntegrationBuild>
  </PropertyGroup>
</Project>
```

## global.json

**MUST** use `global.json` to pin the .NET SDK version:

```json
{
  "sdk": {
    "version": "8.0.400",
    "rollForward": "latestPatch",
    "allowPrerelease": false
  }
}
```

- `rollForward: "latestPatch"` allows patch updates (security fixes) automatically
- `allowPrerelease: false` prevents accidental use of preview SDKs on CI

## Paket (Optional Alternative)

**MAY** use Paket for projects requiring fine-grained transitive dependency control:

```
// paket.dependencies
source https://api.nuget.org/v3/index.json

nuget FSharp.Core 8.0.400
nuget Giraffe 7.0.0
nuget Expecto 10.1.0
nuget FsCheck 2.16.6
nuget Fantomas-tool 6.3.0
```

```
// paket.lock (committed to git — equivalent to packages.lock.json)
NUGET
  remote: https://api.nuget.org/v3/index.json
    FSharp.Core (8.0.400)
    Giraffe (7.0.0)
      ...
```

**When to use Paket**:

- Project requires `paket.lock` for strict transitive pinning
- Project uses GitHub source dependencies
- Team prefers Paket's dependency resolution algorithm

**When to use NuGet (default)**:

- Standard library or service projects
- Monorepo with primarily non-F# projects using NuGet

## FAKE Build Scripts (Optional)

**MAY** use FAKE for complex multi-step build pipelines:

```fsharp
// build.fsx
#r "nuget: Fake.Core.Target"
#r "nuget: Fake.DotNet.Cli"
#r "nuget: Fake.IO.FileSystem"

open Fake.Core
open Fake.DotNet

Target.initEnvironment()

Target.create "Clean" (fun _ ->
    Shell.cleanDir "bin"
    Shell.cleanDir "obj"
)

Target.create "Build" (fun _ ->
    DotNet.build (fun opts -> { opts with Configuration = DotNet.BuildConfiguration.Release }) "."
)

Target.create "Test" (fun _ ->
    DotNet.test (fun opts ->
        { opts with
            Configuration = DotNet.BuildConfiguration.Release
            Collect = Some "XPlat Code Coverage" }
    ) "."
)

Target.create "Format" (fun _ ->
    DotNet.exec id "fantomas" "." |> ignore
)

Target.runOrDefault "Test"
```

## dotnet publish for Deployment

**MUST** use `dotnet publish` for production deployments:

```bash
# Self-contained single-file binary
dotnet publish -c Release \
    -r linux-x64 \
    --self-contained true \
    -p:PublishSingleFile=true \
    -p:PublishTrimmed=true \
    -o ./dist

# Framework-dependent (smaller, requires .NET runtime on target)
dotnet publish -c Release \
    -o ./dist
```

**SHOULD** use multi-stage Docker builds for containerized F# services:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY global.json .
COPY Directory.Build.props .
COPY apps/zakat-service/ZakatService.fsproj apps/zakat-service/
RUN dotnet restore apps/zakat-service/ZakatService.fsproj --locked-mode
COPY apps/zakat-service/ apps/zakat-service/
RUN dotnet publish apps/zakat-service/ZakatService.fsproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["./ZakatService"]
```

### NativeAOT and Trimming Considerations

**The self-contained example above sets `-p:PublishTrimmed=true`. Trimming and NativeAOT
(`-p:PublishAot=true`) share the same reflection-hostile failure mode**, discovered and measured
during the `rewrite-Rhino-to-fsharp` migration's Phase 1 publish-mode spike
(`local-tmp/publish-spike/`, `net10.0`, `osx-arm64`/`linux-x64`). Before enabling either flag on a
new F# project, verify against these three constructs, in order of how often this repo's F# code
uses them:

1. **`sprintf`/`printfn` crash at runtime** with `System.NotSupportedException:
MethodInfo.MakeGenericMethod() is not compatible with AOT compilation`. F#'s printf engine parses
   format strings via reflection at first use, which trimming/AOT's static analysis cannot resolve.
   **Fix**: use string interpolation (`$"...{expr}..."`) and `Console.WriteLine`/`.ToString()`
   instead — neither goes through `Microsoft.FSharp.Core.PrintfImpl`.
2. **`Argu` fails at runtime** with `Argu.ArguParseException: ERROR: unrecognized argument: ...` even
   though it publishes with only warnings (`IL2104`/`IL3053`). `Argu` builds its argument spec by
   reflecting over discriminated-union case metadata, which trimming removes by default.
   **Fix**: `System.CommandLine` (proven AOT-clean in the same spike — zero trim/AOT warnings, correct
   runtime behaviour) is the safe alternative if a trimmed or AOT publish is required.
3. **`System.Text.Json`'s default reflection-based serializer is disabled**, crashing with
   `System.InvalidOperationException: Reflection-based serialization has been disabled for this
application`. **Fix**: a source-generated `JsonSerializerContext` per serialized type (the
   standard .NET mitigation) — there is no drop-in library substitute the way there is for Argu.

None of these three is caught by `dotnet build`; they only surface at **publish time** (as
warnings) or **runtime** (as crashes), so a green `dotnet build` proves nothing about
trim/AOT-safety. `rewrite-Rhino-to-fsharp` selected **self-contained, non-trimmed** publishing for
this exact reason — the JSON-serialization mitigation was judged disproportionate scope for that
migration. A future project may reach a different conclusion once the JSON mitigation is worth
building, but must re-verify all three constructs (and any other reflection-based library it
depends on) before shipping a trimmed or NativeAOT publish, not just the two Argu/JSON constructs
this note names.

## Enforcement

- **Nx targets** - All build, test, lint commands run through Nx for monorepo consistency
- **CI** - `dotnet build --no-incremental` on every PR to catch ordering issues
- **Code reviews** - File order in `.fsproj` reviewed for correctness
- **`RestoreLockedMode`** - Enforced in CI to prevent dependency drift

**Pre-commit checklist**:

- [ ] `.fsproj` file order is dependency-correct (foundational first)
- [ ] `global.json` committed with pinned SDK version
- [ ] `packages.lock.json` committed (or `paket.lock` for Paket projects)
- [ ] `Directory.Build.props` includes `TreatWarningsAsErrors`
- [ ] `dotnet build` succeeds before committing

## Related Standards

- [Coding Standards](coding-standards.md) - Module structure that drives file ordering
- [Code Quality Standards](code-quality-standards.md) - Fantomas pinned in `.config/dotnet-tools.json`
- [Testing Standards](testing-standards.md) - Test project also follows ordering rules

## Related Documentation

- [Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility](../../../../../repo-governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
