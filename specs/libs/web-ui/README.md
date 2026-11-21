# web-ui Specs

The behavioural corpus for [web-ui](../../../libs/web-ui/README.md), the shared React component
library.

A library owns exactly one surface, so the three corpus entries sit directly under the library
root rather than under an owner directory — see
[Logical Owner Corpus](../../../repo-governance/conventions/structure/specs-directory-structure/logical-owner-corpus.md).

## Structure

```
specs/libs/web-ui/
├── README.md
├── architecture.md     # the current, as-built library
└── behaviours/          # Gherkin feature files, one folder per component
```

## Adapters and Targets

```bash
nx run web-ui:test:unit
nx run web-ui:test:e2e
nx run web-ui:test:behaviour:coverage
```

The Unit adapter consumes every scenario through the matching `*.steps.tsx` files under
`libs/web-ui/src/`. The E2E adapter under `libs/web-ui/tests/e2e/` drives Chromium against
Storybook, the library's genuine public browser boundary. `test:behaviour:coverage` runs RHINO's
shared static check and validates both adapters without executing them. Integration is omitted because the
library owns no non-networked local-resource boundary.

- [Architecture — web-ui](./architecture.md) — The current, as-built shared React component library
- [Behaviours — web-ui](./behaviours/README.md) — Gherkin feature files, one folder per component
