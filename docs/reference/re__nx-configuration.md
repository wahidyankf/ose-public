---
title: Nx Configuration Reference
description: Complete reference for Nx workspace configuration files, options, and settings
category: reference
tags:
  - nx
  - configuration
  - build-system
created: 2025-11-29
updated: 2026-03-06
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

> **Note**: `targetDefaults` uses the canonical target names defined in [Nx Target Standards](../../governance/development/infra/nx-targets.md). The standard targets are `test:quick`, `test:unit`, `test:integration`, and `test:e2e` — not a generic `test` target. See the governance document for caching rules and mandatory targets per project type.

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "typecheck", "lint", "test:quick", "test:unit", "test:integration"]
      }
    }
  },
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
    "test:integration": {
      "cache": true
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

#### `affected`

Configuration for affected detection.

**Fields**:

- `defaultBase` (string): Base branch for comparing changes
  - Default: `"main"`
  - Used by: `nx affected:*` commands

**Example**:

```json
{
  "affected": {
    "defaultBase": "main"
  }
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
      - Examples: `["build", "test", "lint"]`

**Example**:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
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
    "test:integration": {
      "cache": true
    },
    "test:e2e": {
      "cache": false
    }
  }
}
```

**Standard target names**: Use `test:quick`, `test:unit`, `test:integration`, `test:e2e` — not a generic `test` target. See [Nx Target Standards](../../governance/development/infra/nx-targets.md) for the complete target naming standard.

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

### Complete Example (Hugo App)

```json
{
  "name": "oseplatform-web",
  "sourceRoot": "apps/oseplatform-web",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "hugo server --buildDrafts --buildFuture",
        "cwd": "apps/oseplatform-web"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "bash build.sh",
        "cwd": "apps/oseplatform-web"
      },
      "outputs": ["{projectRoot}/public"]
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "rm -rf public resources",
        "cwd": "apps/oseplatform-web"
      }
    }
  },
  "tags": ["type:app", "platform:hugo", "domain:oseplatform"]
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
        "command": "tsc --noEmit -p libs/ts-utils/tsconfig.json && node --import tsx --test libs/ts-utils/src/**/*.test.ts",
        "cwd": "."
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node --import tsx --test libs/ts-utils/src/**/*.test.ts",
        "cwd": "."
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo 'Linting not configured yet'",
        "cwd": "."
      }
    }
  }
}
```

**Target names follow [Nx Target Standards](../../governance/development/infra/nx-targets.md)**: `test:quick` is the mandatory pre-push gate; `test:unit` runs isolated unit tests. Avoid generic `test` targets.

### Tag Convention

All projects use a standard four-dimension tag scheme:

| Dimension   | Values                                                          | Required                 | Purpose                 |
| ----------- | --------------------------------------------------------------- | ------------------------ | ----------------------- |
| `type:`     | `app`, `lib`, `e2e`                                             | Yes                      | Project kind            |
| `platform:` | `hugo`, `cli`, `nextjs`, `flutter`, `spring-boot`, `playwright` | For apps/e2e             | Framework/runtime       |
| `lang:`     | `golang`, `ts`, `java`, `dart`                                  | Where source code exists | Primary language        |
| `domain:`   | `ayokoding`, `oseplatform`, `organiclever`, `tooling`           | Yes                      | Business/product domain |

**Notes**:

- Hugo sites omit `lang:` — no application source code, only templates and markdown
- Go libs omit `platform:` — no framework, only `lang:golang`
- Use `domain:tooling` for generic dev utilities not tied to a product domain

### Field Reference

#### `name`

Project name used by Nx CLI.

**Type**: string

**Format**: For apps/libs, typically matches folder name

**Examples**:

- `"oseplatform-web"` (app)
- `"ts-utils"` (lib)

#### `sourceRoot`

Location of source code.

**Type**: string

**Format**: Relative path from workspace root

**Examples**:

- `"apps/oseplatform-web"` (app root)
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
  - Examples: `"apps/oseplatform-web"`, `"."`

**Example**:

```json
{
  "options": {
    "command": "next build",
    "cwd": "apps/oseplatform-web"
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
    "build": "nx run-many -t build",
    "lint": "nx run-many -t lint",
    "affected:build": "nx affected -t build",
    "affected:test:quick": "nx affected -t test:quick",
    "affected:lint": "nx affected -t lint",
    "graph": "nx graph",
    "nx": "nx"
  }
}
```

**Note**: Use `test:quick` (not `test`) as the standard pre-push quality gate target. See [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names.

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
NX_SKIP_NX_CACHE=true nx build oseplatform-web
```

#### `NX_DAEMON`

Enable/disable Nx daemon.

**Usage**:

```bash
NX_DAEMON=false nx build oseplatform-web
```

## Related Documentation

- [Nx Target Standards](../../governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and build output conventions
- [How to Add New App](../how-to/hoto__add-new-app.md)
- [How to Add New Library](../how-to/hoto__add-new-lib.md)
- [How to Run Nx Commands](../how-to/hoto__run-nx-commands.md)
- [Monorepo Structure Reference](./re__monorepo-structure.md)
