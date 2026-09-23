---
description: Why explicit inputs are required for correct cache invalidation, with canonical application, library, and executable examples.
when_to_use: Use when declaring or auditing the inputs array on a project's test:unit or test:quick target.
---

# Cache and Inputs Convention — Canonical Inputs

Declaring explicit `inputs` in `project.json` ensures Nx invalidates the cache when any relevant
file changes. Without explicit inputs, Nx uses a broad default (all project files) and misses
cross-project dependencies like shared Gherkin specs or generated contracts.

## Canonical Inputs by Project Role

Behaviour owners include their canonical Gherkin corpus and adapter sources in `test:unit` and
`test:quick` inputs. Backends with contract codegen also include generated contracts. The corpus
path points to the project's logical owner tree under `specs/apps/` or `specs/libs/`.

| Project role    | Source and adapter inputs                            | Cross-project inputs                                       |
| --------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Backend         | `{projectRoot}/src/**/*`, `{projectRoot}/tests/**/*` | Owner corpus plus generated contracts when applicable      |
| Library         | `{projectRoot}/src/**/*`, `{projectRoot}/tests/**/*` | Library owner corpus                                       |
| Executable tool | Implementation, test adapters, and build metadata    | Tool owner corpus                                          |
| Dedicated E2E   | E2E adapters and runner configuration                | The owning application's corpus and required test fixtures |

The F# `crane-cli` executable consumes its corpus from mandatory Unit adapters and applicable
higher-layer adapters. Its runtime and static coverage targets include the CLI's own spec files:

| CLI App     | Gherkin specs input                                            |
| ----------- | -------------------------------------------------------------- |
| `crane-cli` | `{workspaceRoot}/specs/apps/crane/cli/behaviours/**/*.feature` |

Example for an executable's `test:unit` inputs (from `apps/crane-cli/project.json`):

```json
"inputs": [
  "{projectRoot}/src/**/*.fs",
  "{projectRoot}/tests/unit/**/*.fs",
  "{projectRoot}/crane-cli.fsproj",
  "{workspaceRoot}/specs/apps/crane/cli/behaviours/**/*.feature"
]
```

**Why specs and contracts in inputs**: If a Gherkin feature file changes or the OpenAPI contract
spec changes (triggering `codegen`), `test:unit` and `test:quick` must re-run even if application
source files are unchanged. Without these paths in `inputs`, Nx incorrectly serves cached results.

**Static behaviour coverage**: every owner and dedicated E2E project declares its corpus and
binding/support sources as inputs of `test:coverage:behaviour`. The target is mandatory in
`test:quick`, never executes tests, and admits no deferred step gaps or `@wip` scenarios.
