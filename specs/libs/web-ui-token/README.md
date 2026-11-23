# web-ui-token Specs

The behavioural corpus for [web-ui-token](../../../libs/web-ui-token/README.md), the shared
design-token package.

A library owns exactly one surface, so the three corpus entries sit directly under the library
root rather than under an owner directory — see
[Logical Owner Corpus](../../../repo-governance/conventions/structure/specs-directory-structure/logical-owner-corpus.md).

## Structure

```
specs/libs/web-ui-token/
├── README.md
├── architecture.md     # the current, as-built library
└── behaviours/          # Gherkin feature files, one folder per capability
    └── tokens/
```

## Status

`web-ui-token:test:unit` runs the Vitest Unit binding and enforces the 99% line-coverage hard
minimum. The static `test:behaviour:coverage` target validates the canonical corpus without running
tests and is included in `test:quick`. The library owns no separate local-resource or public runtime
boundary, so Integration and E2E are inapplicable and omitted.

- [Architecture](./architecture.md) — web-ui-token
- [Behaviours](./behaviours/README.md) — web-ui-token
