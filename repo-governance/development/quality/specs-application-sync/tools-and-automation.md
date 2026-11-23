---
description: "The validators and checks that enforce specs-application sync."
when_to_use: "Use when locating the automated check for a sync violation."
---

# Tools and Automation

- **Project-local `test:behaviour:coverage` target**: Statically enforces exact-one scenario bindings,
  mandatory Unit proof, applicable Integration/E2E proof or valid exemptions, and rejection of
  deferred scenarios. It runs in `test:quick` without executing tests.
- **Nx cache inputs**: `test:unit` and `test:quick` targets for API backends declare the project's Gherkin specs as inputs, so Nx invalidates cached results when Gherkin specs change.
- **Contract codegen target**: Generates types from the OpenAPI spec. Declared as a dependency of `typecheck` and `build`, so stale contracts are caught in CI before merge.
- **`test:behaviour:coverage`**: Runs RHINO's shared static check, `./rhino behaviour coverage validate`, which
  discovers the canonical corpus and statically rejects empty or
  malformed features and unused or ambiguous bindings. It is the only static coverage target.
- **`rules-checker`**: Audits the surrounding repository rules and documentation for drift.
