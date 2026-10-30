# AyoKoding Data — Architecture Status

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: The shared tool dataset is implemented as
> checked-in JSON with a provenance record. This document records that
> boundary so readers know what the library does and does not do.

## Current implemented boundary

`libs/ayokoding-data` ships three dataset files (`data/ai-benchmark.json`,
`data/cost-of-living.json`, `data/fx.json`), a provenance record
(`provenance.md`), and reference vectors (`test-vectors/`) pinning the
accepted results. There is no runtime, service, or migration machinery: the
Go server and the TypeScript adapters decode the same JSON directly, and the
vectors are fixed expectations for every runtime.

## Related

- [Behaviours](./behaviours/README.md) — the dataset guarantees the unit adapter proves.
- [Library README](../../../libs/ayokoding-data/README.md) — refresh policy and consumer contracts.
