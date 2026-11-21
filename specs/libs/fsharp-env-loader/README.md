# fsharp-env-loader Specs

The behavioural corpus for [fsharp-env-loader](../../../libs/fsharp-env-loader/README.md), the
shared `.env.<APP_ENV>` tiered env-file loader and runtime port resolver for this repo's F#
backends (`ose-be`, `organiclever-be`).

A library owns exactly one surface, so the two corpus entries sit directly under the library root
rather than under an owner directory — see
[Logical Owner Corpus](../../../repo-governance/conventions/structure/specs-directory-structure/logical-owner-corpus.md).

## Structure

```
specs/libs/fsharp-env-loader/
├── README.md
├── architecture.md     # the current, as-built library
└── behaviours/          # Gherkin feature files, one folder per capability
    ├── env-tier/
    └── port-resolver/
```

## Status

`test:unit` is the real `dotnet test` runtime and enforces the 99% Unit line minimum. The static
`test:behaviour:coverage` target validates Gherkin bindings without running tests
(see `libs/fsharp-env-loader/project.json`). Every scenario in
[behaviours/env-tier/env-tier.feature](./behaviours/env-tier/env-tier.feature) and every scenario in
[behaviours/port-resolver/port-resolver.feature](./behaviours/port-resolver/port-resolver.feature) is
driven by
`libs/fsharp-env-loader/tests/unit/Behaviour/FsharpEnvLoaderBehaviourDriver.fs` via TickSpec.

- [Architecture](./architecture.md) — fsharp-env-loader
- [Behaviours](./behaviours/README.md) — fsharp-env-loader
