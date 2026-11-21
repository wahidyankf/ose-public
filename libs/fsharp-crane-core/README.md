# fsharp-crane-core

Pure F# conversion and verification core shared by Crane CLI adapters.

## BDD and Testing

The canonical corpus is `specs/libs/fsharp-crane-core/behaviours/`. `test:unit` runs its in-process
TickSpec routing adapter from embedded feature resources. `test:integration` exercises the
ReportManager, SkiplistManager, and PDF extraction cache against isolated real files and environment
state. The two routing scenarios carry exact Integration exemptions because collaborator selection
is observable through injected recording ports, not independently through a local resource.

`test:behaviour:coverage` validates the corpus and bindings statically. E2E is omitted because this library
exposes no public browser/runtime boundary; Crane CLI owns the public process adapter.

Run `npm exec nx -- run fsharp-crane-core:test:quick` for the complete fast gate.
Run `npm exec nx -- run fsharp-crane-core:test:integration` manually for impacted local-resource
changes; scheduled full-quality CI runs the complete suite after quick.
