# Behaviours — fsharp-env-loader

Gherkin feature files for [fsharp-env-loader](../../../../libs/fsharp-env-loader/README.md), one
folder per capability.

```
specs/libs/fsharp-env-loader/behaviours/
├── env-tier/
│   └── env-tier.feature
└── port-resolver/
    └── port-resolver.feature
```

## Adapters and Targets

The Unit adapter uses injected environment and filesystem doubles under
`libs/fsharp-env-loader/tests/unit/Behaviour/`; the Integration adapter under
`libs/fsharp-env-loader/tests/integration/Behaviour/` exercises isolated real local resources.
Run them with `fsharp-env-loader:test:unit` and `fsharp-env-loader:test:integration`. Static
`test:coverage:unit`, `test:coverage:integration`, and aggregate `test:coverage` validate
corpus/binding closure without executing either adapter. `test:behaviour:coverage` runs RHINO's
shared static check. E2E is omitted because this library exposes no public browser, HTTP, or
process boundary.
