# ExBdd — Architecture Status

## Current implemented boundary

There is no `libs/ex-bdd` source package, local Mix project, or registered OSE consumer in this
authoring change. Mix is Elixir's build and dependency tool. The library exists externally in
[BeaverNest's source snapshot](https://github.com/wahidyankf/beaver-nest/tree/8ec64d79958f5c260101283ec16443f95376174d/libs/ex-bdd).
It has not yet been copied into this repository.

The [rewrite plan](../../../plans/in-progress/ayokoding-app-web/README.md) carries the intended import,
dependency integration, adapter design, and local verification commands. Its proposed components
do not constitute an as-built OSE architecture.

## Implementation update obligation

When the import lands, replace the absence record with the actual library boundary, modules,
consumers, and paths. Show discovery, parsing, scenario expansion, binding verification,
compilation, execution, and reporting as their implemented relationships. Describe actual Unit
and Integration resource boundaries and the static-verification entry point.

Keep provenance and retained compatibility fixtures visible. Treat those upstream fixtures as
engine input data, including deliberately failing examples; they must not accidentally join the
consumer's live acceptance corpus. Keep application-specific feature files and drivers outside
the reusable engine.

## Related

- [Owner index](./README.md) — import status and attribution chain.
- [Behaviours](./behaviours/README.md) — acceptance contracts to bind during import.
