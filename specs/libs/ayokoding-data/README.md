# AyoKoding Data — Specification Corpus

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: These specifications describe the shared JSON
> dataset behind the bilingual site's tools: which files exist, the rules
> every entry obeys, how each snapshot's provenance is recorded, and the
> reference vectors every runtime must reproduce.

## Status

**Implemented and bound to tests.** The implementation lives in
`libs/ayokoding-data`; the Vitest unit adapter binds every scenario in
[behaviours](./behaviours/README.md).

## Proof ownership

| Layer | Proof                                                                            |
| ----- | -------------------------------------------------------------------------------- |
| Unit  | Vitest over the checked-in JSON, plus the Gherkin unit scope binding this corpus |

Unit proof is mandatory for every scenario. The library ships data, not
behavior, so no integration or browser proof applies.
