---
description: "The agents and checks that enforce feature-change completeness."
when_to_use: "Use when locating the automated check for a feature-completeness violation."
---

# Tools and Automation

- **Project-local `test:behaviour:coverage` target**: Statically enforces exact scenario-to-adapter
  mapping and exemption syntax. It is mandatory in `test:quick` and never executes tests.
- **`codegen` Nx target**: Generates types from OpenAPI specs. Stale contracts cause `typecheck` to fail.
- **Runtime coverage thresholds**: Each native `test:unit` target enforces its project's numeric
  coverage floor; the static `test:behaviour:coverage` target does not consume runtime reports.
- **Nx cache inputs**: Gherkin specs are declared as inputs for test targets, invalidating caches when specs change.
- **`rules-checker`**: Validates that specs folders exist for apps that require them.
