# ExBdd — Specification Corpus

`ex-bdd` is the planned local import of BeaverNest's Gherkin engine for Elixir and ExUnit.
Gherkin supplies the feature scenarios; ExUnit runs the generated Elixir tests. This corpus
describes the engine's required behavior and provenance without claiming the import exists yet.

## Status

**Planned; library source and bindings are not imported in this authoring change.** The intended
destination is `libs/ex-bdd`. The [rewrite plan](../../../plans/in-progress/ayokoding-app-web/README.md)
owns the import and its repository integration. The planned first consumer is
[AyoKoding Phoenix Web](../../apps/ayokoding/web/README.md).

The source is BeaverNest's tracked `libs/ex-bdd` subtree at commit
[`8ec64d79958f5c260101283ec16443f95376174d`](https://github.com/wahidyankf/beaver-nest/tree/8ec64d79958f5c260101283ec16443f95376174d/libs/ex-bdd).
Retain its source, tests, fixtures, lockfile, configuration, license, and upstream record.

## Contents

- [Architecture status](./architecture.md) — current absence, external source boundary, and the
  obligation to describe the actual imported implementation when it lands.
- [Behaviours](./behaviours/README.md) — compilation, matching, verification, and attribution
  contracts for the planned library.

## Provenance chain

- Immediate source and maintainer: [BeaverNest](https://github.com/wahidyankf/beaver-nest), owned by
  `wahidyankf`; its independent library uses application `ex_bdd` and namespace `ExBdd`.
- Original project: [`huddlz-hq/cucumber`](https://github.com/huddlz-hq/cucumber), version `1.0.0`,
  imported by BeaverNest at commit `114aceb7ed6a3e95eb496971e8a331a8a4b81a64`, copyright
  **2024 Micah Woods**, under the MIT License.
- Retained Cucumber Compatibility Kit fixtures: copyright **2020 Cucumber Ltd and contributors**,
  with their existing fixture notice preserved.

Keep the original license verbatim and append the OSE import record to `UPSTREAM.md`; do not
replace upstream ownership with OSE ownership. Resolve the import date when the source is actually
copied. Record local adaptations and a manual future-update procedure without implying ongoing
synchronization or upstream API compatibility.

## Planned proof ownership

Unit tests prove pure parsing decisions, expansion, matching, context flow, and verification
decisions with in-memory inputs or boundary doubles. Integration tests prove real file discovery,
code loading, generated tests, fixtures, and reports on the same machine. Retain the imported
engine's independent tests and compatibility fixtures in addition to binding this canonical corpus.

This library has no public browser or HTTP journey. E2E is inapplicable; the consumer's Playwright
suite proves its public journeys. Static verification is separate from executing scenarios.
The imported engine may retain its retry capability and capability tests; consumer acceptance
suites configure zero retries and do not use retry tags.

## Related

- [Library specification index](../README.md) — other shared library corpora.
- [Spec-to-test mapping](../../../repo-governance/development/infra/bdd-spec-test-mapping.md) —
  layer ownership and documented exemptions.
