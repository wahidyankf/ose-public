# Behaviours — fsharp-crane-core

Gherkin feature files for [fsharp-crane-core](../../../../libs/fsharp-crane-core/project.json),
one folder per capability.

```
specs/libs/fsharp-crane-core/behaviours/
└── convert/
    └── pdf-to-markdown-routing.feature
```

## Adapters

`fsharp-crane-core:test:unit` consumes this corpus through the TickSpec bindings under
`libs/fsharp-crane-core/tests/unit/`. `fsharp-crane-core:test:integration` owns the library's real
local-file/environment boundary; both routing scenarios are exempt at that layer because their
collaborator-selection evidence requires injected recording ports, with the exact Unit scenario
named as alternative proof. `test:behaviour:coverage` runs RHINO's shared static check and validates
recursive corpus/binding closure without executing tests. See the corpus [README](../README.md#adapter-and-targets) for boundary rationale.
