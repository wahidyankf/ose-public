---
description: The nx.json targetDefaults block, the per-target caching-rules table, and the build output directory conventions.
when_to_use: Use when deciding whether a target should be cached, or where a project's build output directory should live.
---

# Workspace Defaults, Caching, and Build Output

## Workspace-Level Defaults

`nx.json` `targetDefaults` provide inherited behaviour for standard targets. Individual `project.json` files override these when the project differs.

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "typecheck": {
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "test:quick": {
      "cache": true
    },
    "test:unit": {
      "cache": true
    },
    "test:coverage": {
      "cache": true
    },
    "test:coverage:unit": {
      "cache": true
    },
    "test:coverage:integration": {
      "cache": true
    },
    "test:coverage:e2e": {
      "cache": true
    },
    "test:coverage:behaviour": {
      "cache": true
    },
    "test:integration": {
      "cache": false
    },
    "test:e2e": {
      "cache": false
    }
  }
}
```

### Caching Rules

| Target             | Cached      | Notes                                                                                                    |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------------- |
| `build`            | Yes         | Declare `outputs` in `project.json` for cache restoration                                                |
| `typecheck`        | Yes         | Pure analysis; safe to cache against source changes                                                      |
| `lint`             | Yes         | Pure static analysis; safe to cache                                                                      |
| `test:quick`       | Yes         | Cache hit skips redundant local and PR runs                                                              |
| `test:unit`        | Yes         | Deterministic; safe to cache against source changes                                                      |
| `test:coverage`    | Yes         | Aggregate of applicable static coverage validators                                                       |
| `test:coverage:*`  | Yes         | Deterministic static test/corpus coverage; never executes runtime tests                                  |
| `test:integration` | Conditional | Cache only when every real local resource is deterministic, isolated, and represented by declared inputs |
| `dev`              | No          | Long-running process                                                                                     |
| `start`            | No          | Long-running process                                                                                     |
| `run`              | No          | Side-effectful execution                                                                                 |
| `test:e2e`         | No          | Requires a live public boundary; manual impacted and scheduled full only                                 |
| `test:e2e:ui`      | No          | Interactive process                                                                                      |
| `test:e2e:report`  | No          | Reads filesystem state at invocation time                                                                |
| `install`          | No          | Must always run to ensure dep state                                                                      |
| `clean`            | No          | Destructive operation                                                                                    |

## Build Output Conventions

Declare the output directory in `project.json` `outputs` to enable Nx cache restoration.

| Project Type | Output Directory        |
| ------------ | ----------------------- |
| Rust CLI     | `{projectRoot}/dist/`   |
| Next.js      | `{projectRoot}/.next/`  |
| Spring Boot  | `{projectRoot}/target/` |

Example override for a Next.js app with custom output:

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/.next"],
      "options": { "command": "next build" }
    }
  }
}
```
