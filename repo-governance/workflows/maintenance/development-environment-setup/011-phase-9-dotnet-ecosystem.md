---
description: "Phase 9 (full scope only): install the .NET SDK pinned by the .NET projects' global.json files, plus the Fantomas and CSharpier global tools."
when_to_use: "Use when setting up .NET for the F# and C# projects, or when doctor reports dotnet, fantomas, or csharpier missing."
---

# Phase 9: .NET Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: the F# projects `organiclever-be`, `ose-be`, `crane-cli`, `fsharp-crane-core`, and
`fsharp-env-loader`, the C# project `ose-id-be`, and the F# and C# formatting in `scripts/format-staged`. `dotnet`, `fantomas`, and `csharpier` are
declared under `toolchains` in `repo-config.yml`.

## 9.1 Install .NET SDK

```bash
# macOS
brew install dotnet

# Linux — https://learn.microsoft.com/en-us/dotnet/core/install/linux
```

Each .NET project pins its SDK in its own `global.json` (for example `apps/ose-be/global.json`).
Doctor proves only that `dotnet --version` runs, so install the major version those files name.

**Success criteria**: `dotnet --version` shows the same major version as `apps/ose-be/global.json`.

## 9.2 Install Fantomas and CSharpier

`scripts/format-staged` calls both as global tools. Install the versions `.config/dotnet-tools.json`
pins, as CI's `setup-dotnet` action does:

```bash
dotnet tool install -g fantomas --version "$(jq -er '.tools.fantomas.version' .config/dotnet-tools.json)"
dotnet tool install -g csharpier --version "$(jq -er '.tools.csharpier.version' .config/dotnet-tools.json)"
```

Run these from the repository root after Phase 11 clones it; use `dotnet tool update -g` in place of
`install` when an older copy exists.

**Success criteria**: `fantomas --version` and `csharpier --version` report the pinned versions.
