# AyoKoding Data Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: These Gherkin scenarios describe the shared tool
> dataset's observable guarantees: a complete inventory, valid entries,
> recorded provenance, and reference vectors every runtime must reproduce.

## Status and interpretation

All scenarios are **bound** through the `ayokoding-data` Vitest unit adapter
(`tests/unit/dataset-behaviour.test.ts`), which reads the same JSON the
structural unit tests prove. No separate runtime or browser proof applies:
the library ships data, not behavior.
