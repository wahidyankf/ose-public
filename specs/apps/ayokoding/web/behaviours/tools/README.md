# Interactive Tool Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: Both existing tools retain their data, calculations, and shareable
> URLs. Shared JSON data keeps the old site and the rewrite aligned without refreshing values.

## Contents

- [AI benchmark](./ai-benchmark.feature) — filters, result ordering, shared reference results,
  query strings, and preserved provenance.
- [Cost-of-living calculator](./cost-of-living-calculator.feature) — inputs, costs, savings,
  minimum-role results, query strings, and source dates.

Bindings are implemented. Shared expected-result vectors prove the TypeScript and Go calculations;
Playwright proves the actual forms, links, and results in each supported locale.
