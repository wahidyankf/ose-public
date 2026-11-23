# Behaviours — web-ui-token

Gherkin feature files for [web-ui-token](../../../../libs/web-ui-token/README.md), one folder per
capability.

```
specs/libs/web-ui-token/behaviours/
└── tokens/
    └── tokens-export.feature
```

## Consumption

`web-ui-token:test:unit` consumes every scenario through Vitest and enforces the 99% Unit line
minimum. The static `test:behaviour:coverage` target validates exact binding ownership
without executing tests. See the corpus [README.md](../README.md#status).
