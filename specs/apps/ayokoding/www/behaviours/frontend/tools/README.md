# Tools — AyoKoding Gherkin Specs

Interactive calculator tools at `/[locale]/tools/`.

## Feature files

- [cost-of-living-calculator.feature](./cost-of-living-calculator.feature) — Cost of living, savings,
  and minimum software-engineering role calculator at `/[locale]/tools/cost-of-living-calculator`.
- [ai-benchmark.feature](./ai-benchmark.feature) — AI model benchmark tool (one merged chart per
  band showing capability bands, composite index, and per-harness price together) at
  `/[locale]/tools/ai-benchmark`.

## Bounded context

The `tools/` context covers client-side interactive calculators that model financial information from
curated static datasets. Tools are fully CSR (`'use client'`) with no backend API calls.

## Conventions

Follows the [AyoKoding Web Gherkin conventions](../README.md).

## Related

- **Parent**: [gherkin specs index](../README.md)
- **Plan**: plans/done/2026-06-20\_\_ayokoding-www-cost-of-living-calc-test-fixing
