---
title: Nx Configuration Reference
description: Complete reference for Nx workspace configuration files, options, and settings
category: reference
tags:
  - nx
  - configuration
  - build-system
created: 2025-11-29
---

# Nx Configuration Reference

Complete reference for Nx workspace configuration files, options, and settings.

## Configuration Files Overview

| File                 | Location    | Purpose                                          |
| -------------------- | ----------- | ------------------------------------------------ |
| `nx.json`            | Root        | Workspace-wide Nx configuration                  |
| `project.json`       | Per-project | Project-specific Nx configuration                |
| `tsconfig.base.json` | Root        | Base TypeScript configuration with path mappings |
| `package.json`       | Root        | Workspace manifest with npm workspaces           |
| `.nxignore`          | Root        | Files to exclude from Nx processing              |

## `nx.json` (Workspace Configuration)

### Location

`/nx.json` (repository root)

### Complete Example

> **Note**: `targetDefaults` uses the canonical target names defined in
> [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md). Runtime targets are
> `test:unit`, `test:integration`, and `test:e2e`; static coverage targets are `test:coverage` and
> `test:coverage:*`. `test:quick` composes Unit runtime with every applicable static validator. See
> the governance document for role-specific applicability and caching rules.

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "origin/main",
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
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/**/*.test.ts"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  },
  "generators": {},
  "plugins": []
}
```

### Field Reference

#### `$schema`

JSON schema for validation and autocomplete.

**Value**: `"./node_modules/nx/schemas/nx-schema.json"`

#### `defaultBase`

Configuration for affected detection.

**Value**: `"origin/main"`

Nx uses this base ref when an affected command does not receive an explicit base.

**Example**:

```json
{
  "defaultBase": "origin/main"
}
```

#### `tasksRunnerOptions`

Configuration for task runners and caching.

**Fields**:

- `default` (object): Default task runner configuration
  - `runner` (string): Task runner to use
    - Default: `"nx/tasks-runners/default"`
  - `options` (object): Runner options
    - `cacheableOperations` (string[]): Tasks to cache
      - Examples: `["build", "test:unit", "test:coverage", "lint"]`

**Example**:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test:unit", "test:coverage", "lint"]
      }
    }
  }
}
```

#### `targetDefaults`

Default configuration for targets across all projects.

**Common Fields**:

- `dependsOn` (string[]): Task dependencies
  - `"^build"` - Run build on dependencies first
  - `"build"` - Run own build first
- `outputs` (string[]): Output directories to cache
  - `"{projectRoot}/dist"` - Project dist folder
  - `"{projectRoot}/.next"` - Next.js build output
- `cache` (boolean): Enable caching for this target
  - Default: `false`

**Example**:

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

**Standard target names**: Use `test:quick`; the applicable runtime targets `test:unit`,
`test:integration`, and `test:e2e`; and static-only `test:coverage` / `test:coverage:*` targets. Do
not use a generic `test` target. See
[Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) for the complete
role-based standard.

**Codegen dependency chain** (demo apps): All demo app `typecheck` and `build` targets must declare `dependsOn: ["codegen"]`. This ensures generated types from the OpenAPI spec are always up to date before type checking or building. Example:

```json
{
  "typecheck": {
    "command": "go vet ./...",
    "dependsOn": ["codegen"],
    "cache": true
  },
  "build": {
    "command": "go build ./...",
    "dependsOn": ["codegen"],
    "outputs": ["{projectRoot}/dist"]
  }
}
```

**Dependency Patterns**:

- `["^build"]` - Build all dependencies first
- `["build"]` - Build self first
- `["codegen"]` - Run codegen (contract generation) first
- `["^build", "prebuild"]` - Build dependencies, then run prebuild

#### `namedInputs`

Define sets of files that affect cache invalidation.

**Common Inputs**:

- `default` - All project files + shared globals
- `production` - All files except tests
- `sharedGlobals` - Workspace-wide files that affect all projects

**Example**:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/**/*.test.ts"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  }
}
```

**Glob Patterns**:

- `{projectRoot}/**/*` - All files in project
- `!{projectRoot}/**/*.test.ts` - Exclude test files
- `{workspaceRoot}/tsconfig.base.json` - Workspace config file

#### `generators`

Configuration for Nx generators (not used in this project).

**Value**: `{}`

#### `plugins`

Configuration for Nx plugins (not used in this project).

**Value**: `[]`

## `project.json` (Project Configuration)

### Location

Per-project:

- `apps/[app-name]/project.json`
- `libs/[lib-name]/project.json`

### Complete Example (Next.js App)

```json
{
  "name": "ose-www",
  "sourceRoot": "apps/ose-www",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node ../../scripts/next-with-port.mjs dev --env OSE_WWW_PORT --default 3100",
        "cwd": "apps/ose-www"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next build",
        "cwd": "apps/ose-www"
      },
      "outputs": ["{projectRoot}/.next"]
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "rm -rf .next",
        "cwd": "apps/ose-www"
      }
    }
  },
  "tags": ["type:app", "platform:nextjs", "lang:ts", "domain:ose"]
}
```

### Complete Example (TypeScript Library)

```json
{
  "name": "ts-utils",
  "sourceRoot": "libs/ts-utils/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p libs/ts-utils/tsconfig.build.json",
        "cwd": "."
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/ts-utils/tsconfig.json",
        "cwd": "."
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "npx nx run ts-utils:typecheck",
          "npx nx run ts-utils:lint",
          "npx nx run ts-utils:test:unit",
          "npx nx run ts-utils:test:coverage"
        ],
        "parallel": false
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --config libs/ts-utils/vitest.config.ts --coverage",
        "cwd": "."
      }
    },
    "test:coverage:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node scripts/behaviour-coverage.mjs --config libs/ts-utils/behaviour-coverage.json --adapter unit"
      }
    },
    "test:coverage:behaviour": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node scripts/behaviour-coverage.mjs --config libs/ts-utils/behaviour-coverage.json --adapter behaviour"
      }
    },
    "test:coverage": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["npx nx run ts-utils:test:coverage:unit", "npx nx run ts-utils:test:coverage:behaviour"],
        "parallel": false
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "eslint libs/ts-utils/src",
        "cwd": "."
      }
    }
  }
}
```

**Target names follow [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md)**:
`test:quick` is the mandatory pre-push gate, `test:unit` runs isolated Unit tests with a 99% line
threshold configured in `vitest.config.ts`, and `test:coverage` aggregates the applicable static
validators. Avoid generic `test` targets and no-op placeholders.

### Tag Convention

All projects use a standard four-dimension tag scheme:

| Dimension   | Values                                                  | Required                 | Purpose                 |
| ----------- | ------------------------------------------------------- | ------------------------ | ----------------------- |
| `type:`     | `app`, `lib`, `e2e`                                     | Yes                      | Project kind            |
| `platform:` | `cli`, `nextjs`, `flutter`, `spring-boot`, `playwright` | For apps/e2e             | Framework/runtime       |
| `lang:`     | `rust`, `ts`, `dotnet`                                  | Where source code exists | Primary language        |
| `domain:`   | `ayokoding`, `ose`, `organiclever`, `tooling`           | Yes                      | Business/product domain |

**Notes**:

- Rust libs omit `platform:` — no framework, only `lang:rust`
- Use `domain:tooling` for generic dev utilities not tied to a product domain

### Field Reference

#### `name`

Project name used by Nx CLI.

**Type**: string

**Format**: For apps/libs, typically matches folder name

**Examples**:

- `"ose-www"` (app)
- `"ts-utils"` (lib)

#### `sourceRoot`

Location of source code.

**Type**: string

**Format**: Relative path from workspace root

**Examples**:

- `"apps/ose-www"` (app root)
- `"libs/ts-utils/src"` (lib source)

#### `projectType`

Type of project.

**Type**: string

**Values**:

- `"application"` - Deployable app
- `"library"` - Reusable lib

#### `targets`

Available Nx tasks for this project.

**Type**: object

**Structure**:

```json
{
 "[target-name]": {
  "executor": "nx:run-commands",
  "options": { ... },
  "outputs": [ ... ],
  "dependsOn": [ ... ]
 }
}
```

### Target Configuration

#### `executor`

Executor to run the target.

**Type**: string

**Value**: `"nx:run-commands"` (always - no plugins)

#### `options`

Executor options.

**Fields**:

- `command` (string): Shell command to execute
  - Required
  - Examples: `"next build"`, `"tsc -p tsconfig.json"`
- `cwd` (string): Working directory
  - Optional (defaults to workspace root)
  - Examples: `"apps/ose-www"`, `"."`

**Example**:

```json
{
  "options": {
    "command": "next build",
    "cwd": "apps/ose-www"
  }
}
```

#### `outputs`

Output directories to cache.

**Type**: string[]

**Format**: Glob patterns relative to workspace root

**Examples**:

- `["{projectRoot}/dist"]` - Library build output
- `["{projectRoot}/.next"]` - Next.js build output
- `["{projectRoot}/build"]` - Custom build output

**Tokens**:

- `{projectRoot}` - Project directory
- `{workspaceRoot}` - Workspace root

#### `dependsOn`

Task dependencies.

**Type**: string[]

**Format**: Array of target names

**Patterns**:

- `["^build"]` - Run `build` on all dependencies first
- `["build"]` - Run own `build` target first
- `["lint", "test"]` - Run multiple targets first

**Example**:

```json
{
  "dev": {
    "dependsOn": ["build"]
  }
}
```

## `tsconfig.base.json` (TypeScript Base Configuration)

### Location

`/tsconfig.base.json` (repository root)

### Complete Example

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@open-sharia-enterprise/ts-*": ["libs/ts-*/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp", "dist"]
}
```

### Field Reference

#### `compilerOptions.paths`

Path mappings for TypeScript imports.

**Format**: Wildcard pattern matching library names

**Pattern**: `"@open-sharia-enterprise/ts-*": ["libs/ts-*/src/index.ts"]`

**How it works**:

- Import: `import { greet } from "@open-sharia-enterprise/ts-utils"`
- Resolves to: `libs/ts-utils/src/index.ts`

**Future languages** (not yet implemented):

```json
{
  "paths": {
    "@open-sharia-enterprise/ts-*": ["libs/ts-*/src/index.ts"],
    "@open-sharia-enterprise/java-*": ["libs/java-*/src/main/java"],
    "@open-sharia-enterprise/kt-*": ["libs/kt-*/src/main/kotlin"],
    "@open-sharia-enterprise/py-*": ["libs/py-*/src"]
  }
}
```

#### `compilerOptions.target`

ECMAScript target version.

**Value**: `"ES2022"`

**Why ES2022**: Modern features, widely supported in Node.js 24.x

#### `compilerOptions.strict`

Enable all strict type checking.

**Value**: `true`

**Enables**:

- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitAny`
- `noImplicitThis`
- `alwaysStrict`

## `package.json` (Workspace Manifest)

### Location

`/package.json` (repository root)

### Relevant Fields

#### `workspaces`

npm workspaces configuration.

**Type**: string[]

**Value**: `["apps/*", "libs/*"]`

**Purpose**: Enables dependency hoisting and workspace features

#### `scripts`

Nx wrapper scripts.

**Common Scripts**:

```json
{
  "scripts": {
    "build": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx run-many -t build",
    "test": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx run-many -t test:quick",
    "lint": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx run-many -t lint",
    "affected:build": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx affected -t build",
    "affected:test": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx affected -t test:quick",
    "affected:lint": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx affected -t lint",
    "graph": "./hippo run --class service --resource-tier standard --disk-path . -- nx graph",
    "nx": "./hippo run --class transactional --resource-tier standard --disk-path . -- nx"
  }
}
```

**Note**: Use `test:quick` (not `test`) as the standard pre-push quality gate target. See [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) for canonical target names.

#### `volta`

Node.js and npm version pinning.

**Type**: object

**Fields**:

- `node` (string): Node.js version
- `npm` (string): npm version

**Example**:

```json
{
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}
```

## `.nxignore` (Nx Ignore File)

### Location

`/.nxignore` (repository root)

### Purpose

Exclude files and directories from Nx processing.

### Complete Example

```
# Documentation
docs/
plans/
*.md

# Git files
.git/
.github/

# IDE
.vscode/
.idea/

# Temporary
tmp/
temp/
.cache/

# CI artifacts
coverage/
.nyc_output/
```

### Format

- One pattern per line
- Glob patterns supported
- Comments start with `#`

## Environment Variables

### Nx Environment Variables

#### `NX_SKIP_NX_CACHE`

Skip Nx cache.

**Usage**:

```bash
NX_SKIP_NX_CACHE=true ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build ose-www
```

#### `NX_DAEMON`

Enable/disable Nx daemon.

**Usage**:

```bash
NX_DAEMON=false ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build ose-www
```

## Related Documentation

- [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and build output conventions
- [How to Add New App](../how-to/add-new-app.md)
- [How to Add New Library](../how-to/add-new-lib.md)
- [How to Run Nx Commands](../how-to/run-nx-commands.md)
- [Monorepo Structure Reference](./monorepo-structure.md)
