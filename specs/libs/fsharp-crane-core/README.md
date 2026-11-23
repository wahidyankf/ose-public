# fsharp-crane-core Specs

The behavioural corpus for
[fsharp-crane-core](../../../libs/fsharp-crane-core/project.json), the shared F# domain core for
PDF-to-Markdown conversion and verification.

A library owns exactly one surface, so the corpus sits directly under the library
root rather than under an owner directory — see
[Logical Owner Corpus](../../../repo-governance/conventions/structure/specs-directory-structure/logical-owner-corpus.md).

## Structure

```
specs/libs/fsharp-crane-core/
├── README.md
├── architecture.md     # the current, as-built library
└── behaviours/          # Gherkin feature files, one folder per capability
    └── convert/
```

## Adapter and Targets

`fsharp-crane-core:test:unit` exercises pure routing through TickSpec bindings under
`libs/fsharp-crane-core/tests/unit/`. `fsharp-crane-core:test:integration` exercises the library's
real ReportManager, SkiplistManager, and PDF-cache local-resource boundary under
`libs/fsharp-crane-core/tests/integration/`. `test:behaviour:coverage` runs RHINO's shared static
check and validates corpus/binding closure without running tests. The routing scenarios are
Integration-exempt with
named Unit alternative proof because injected collaborator-call selection is an in-process concern.
E2E is omitted because the library exposes no public browser/runtime boundary; public process
behaviour belongs to Crane CLI.

- [Architecture](./architecture.md) — fsharp-crane-core
- [Behaviours](./behaviours/README.md) — fsharp-crane-core
