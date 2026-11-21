# fsharp-env-loader

Shared `.env.<APP_ENV>` tiered env-file loader for the open-sharia-enterprise monorepo's F#
backends.

## What's Shared

The pure loader logic behind the repo-wide `APP_ENV` tier convention — tier resolution
(`resolveTier`) and `loadEnvTierFrom`, which applies a tier file's values to the process
environment with process-env-always-wins semantics. Mirrors the sibling TypeScript loader at
`libs/ts-env-loader/src/index.ts` (same four rules, same process-env-wins / missing-file-is-not-an-
error semantics), adapted for F#.

Every F# backend that consumes this library still calls `loadEnvTierFrom` itself, explicitly, as
the first statement of its own composition root (`Program.fs`'s `main`) — this library never calls
it on load.

## Usage

```fsharp
// Program.fs
[<EntryPoint>]
let main args =
    loadEnvTier ()  // app-local thin wrapper delegating to FsharpEnvLoader.EnvTier.loadEnvTierFrom
    // ...
```

Each consuming app keeps a thin app-local wrapper (e.g. `OseBe.Contexts.Config.Infrastructure.
loadEnvTier`) that calls `FsharpEnvLoader.EnvTier.loadEnvTierFrom` with its own composition-root
search directories — see `tech-docs.md`'s "The APP_ENV loader contract" in the
`restrict-env-access-to-prod-and-stag` plan for the full rationale.

## Consumers

`ose-be`, `organiclever-be`.

## BDD and Testing

The canonical corpus is `specs/libs/fsharp-env-loader/behaviours/`. `test:unit` proves decisions
with injected environment/filesystem doubles, while `test:integration` exercises isolated real
local resources. Matching `test:coverage:unit`, `test:coverage:integration`,
`test:behaviour:coverage`, and aggregate `test:coverage` validate both adapters statically. E2E is
omitted because the library exposes no public browser, HTTP, or process boundary.
