---
description: "Project-role applicability for runtime and static test-coverage targets"
when_to_use: "Use to determine which real testing targets a project role must expose."
---

# Applicable Testing Targets — Summary Matrix

Projects declare only real, applicable targets. Never use echo/no-op targets for symmetry.

| Project role          | Runtime targets                                                                                         | Static coverage targets                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Application           | `test:unit`; `test:integration` for an owned local boundary                                             | `test:coverage:unit`, applicable `test:coverage:integration`, `test:coverage`, `test:behaviour:coverage` |
| Library               | `test:unit`; Integration for an owned local boundary; E2E for a genuine public browser/runtime boundary | Matching coverage for every applicable layer, `test:coverage`, `test:behaviour:coverage`                 |
| Executable tool       | `test:unit`; Integration for local resources; E2E for a public process boundary                         | Matching layer coverage, `test:coverage`, `test:behaviour:coverage`                                      |
| Dedicated E2E project | `test:e2e` for its owner                                                                                | `test:coverage:e2e`, `test:coverage`, `test:behaviour:coverage`                                          |

Every owner project exposes `test:quick`. It runs type checking and linting where applicable,
Unit runtime, and every applicable static coverage validator. A dedicated E2E project omits Unit
runtime from quick. Integration and E2E runtime remain manual-impacted and scheduled-full only.
Every owner `test:unit` enforces a hard minimum of 99% line coverage.

See the [BDD standard](../../behaviour-driven-development.md) for boundary and exemption rules.
