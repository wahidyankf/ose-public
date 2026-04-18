---
title: Monorepo Structure Reference
description: Complete reference for the Nx monorepo structure, folder organization, and file formats
category: reference
tags:
  - nx
  - monorepo
  - architecture
  - structure
created: 2025-11-29
updated: 2026-03-31
---

# Monorepo Structure Reference

Complete reference for the Nx monorepo structure, folder organization, and file formats.

## Overview

This project uses **Nx** as a monorepo build system with a plugin-free "vanilla Nx" approach. The Nx monorepo consists of two main folders:

- `apps/` - Deployable applications
- `libs/` - Reusable libraries (flat structure with language prefixes)

**Note**: The repository also contains `apps-labs/` directory for experimental applications and POCs that are NOT part of the Nx monorepo. These experimental projects have independent build systems and no Nx workspace integration. See [Experimental Projects vs Monorepo Projects](#experimental-projects-vs-monorepo-projects) section for details.

## Root Structure

```
open-sharia-enterprise/
├── apps/                      # Deployable applications (Nx monorepo)
├── apps-labs/                 # Experimental apps and POCs (NOT in Nx monorepo)
│   └── README.md             # Labs directory documentation
├── libs/                      # Reusable libraries (Nx monorepo, flat structure)
├── docs/                      # Documentation (Diátaxis framework)
├── plans/                     # Project planning documents
├── .claude/                   # Claude Code configuration
├── infra/                     # Infrastructure configurations
│   ├── dev/                  # Local development Docker Compose files per service
│   │   └── [service]/        # docker-compose.yml for local dev environment
│   └── k8s/                  # Kubernetes deployments
├── specs/                     # Gherkin acceptance specs and OpenAPI contracts
│   ├── apps/                  # Per-app specs
│   │   └── [domain]/         # e.g. organiclever/, rhino/
│   │       ├── contracts/    # OpenAPI 3.1 contract spec
│   │       ├── be/gherkin/   # Backend acceptance specs
│   │       ├── fe/gherkin/   # Frontend acceptance specs
│   │       ├── fs/gherkin/   # Fullstack acceptance specs (if applicable)
│   │       └── c4/           # C4 architecture diagrams (if applicable)
│   └── libs/                  # Per-library specs
├── .husky/                    # Git hooks
├── .nx/                       # Nx cache (gitignored)
├── node_modules/              # Dependencies (gitignored)
├── nx.json                    # Nx workspace configuration
├── tsconfig.base.json         # Base TypeScript configuration
├── package.json               # Workspace manifest with npm workspaces
├── package-lock.json          # Dependency lock file
├── .dockerignore              # Docker build context exclusions (web app)
├── .nxignore                  # Files to exclude from Nx processing
├── .gitignore                 # Git ignore rules
├── commitlint.config.js       # Commit message validation
├── CLAUDE.md                  # Claude Code guidance
└── README.md                  # Project README
```

## Apps Folder (`apps/`)

### Purpose

Contains deployable application projects (executables).

### Location

`apps/` at repository root

### Organization

Flat structure - all apps at the same level, no subdirectories.

### Naming Convention

`[domain]-[type]`

**Current Apps**:

- `oseplatform-web` - OSE Platform website (Hugo static site)
- `ayokoding-web` - AyoKoding educational platform (Next.js 16 fullstack content platform)
- `ayokoding-cli` - AyoKoding CLI tool (Go application)
- `rhino-cli` - Repository management CLI, includes `java validate-annotations` (Go application)
- `oseplatform-cli` - OSE Platform site maintenance CLI (Go application)
- `organiclever-fe` - OrganicLever landing website (Next.js application)
- `organiclever-be` - OrganicLever REST API backend (F#/Giraffe application)
- `organiclever-fe-e2e` - Playwright FE E2E tests for organiclever-fe
- `organiclever-be-e2e` - Playwright BE E2E tests for organiclever-be

### App Structure (Hugo Static Site)

```
apps/oseplatform-web/
├── content/                   # Markdown content files
├── layouts/                   # Hugo templates
├── static/                    # Static assets (images, CSS, JS)
├── themes/                    # Hugo themes
├── data/                      # Data files
├── i18n/                      # Internationalization
├── assets/                    # Asset pipeline files
├── archetypes/                # Content templates
├── public/                    # Build output (gitignored)
├── hugo.yaml                  # Hugo configuration
├── project.json               # Nx project configuration
├── build.sh                   # Build script
├── vercel.json                # Deployment configuration
└── README.md                  # App documentation
```

### App Structure (Go CLI Application)

```
apps/ayokoding-cli/
├── cmd/                       # CLI commands
├── internal/                  # Internal packages
├── dist/                      # Build output (gitignored)
├── main.go                    # Entry point
├── go.mod                     # Go module definition
├── project.json               # Nx project configuration
└── README.md                  # App documentation
```

### App Structure (Next.js Application)

```
apps/organiclever-fe/
├── src/                       # Source code
├── public/                    # Static assets
├── .storybook/                # Storybook configuration
├── Dockerfile                 # Production multi-stage build (repo-root context)
├── next.config.mjs            # Next.js configuration
├── project.json               # Nx project configuration
└── README.md                  # App documentation
```

### App Structure (F#/Giraffe Application)

```
apps/organiclever-be/
├── src/                       # Source code
├── tests/                     # Test projects
├── Dockerfile                 # Production multi-stage build
├── .dockerignore              # Docker build context exclusions
├── organiclever-be.fsproj     # F# project file
├── project.json               # Nx project configuration
└── README.md                  # App documentation
```

### App Characteristics

- **Consumers** - Apps import and use libs, don't export for reuse
- **Isolated** - Apps should NOT import from other apps
- **Deployable** - Each app is independently deployable
- **Specific** - Contains app-specific logic and configuration
- **Entry Points** - Has clear entry point (index.ts, main.ts, etc.)

## Libs Folder (`libs/`)

### Purpose

Contains reusable library packages.

### Location

`libs/` at repository root

### Organization

**Flat structure** - All libraries at the same level, no nested scopes.

### Naming Convention

`[language-prefix]-[name]`

**Language Prefixes**:

- `ts-` - TypeScript (future)
- `go-` - Go (current — `golang-commons` uses full name for clarity)
- `java-` - Java (future)
- `kt-` - Kotlin (future)
- `py-` - Python (future)

**Current Libraries**:

- `golang-commons` - Shared Go utilities (links checker + output functions)
- `hugo-commons` - Shared Hugo utilities (Godog BDD testing)

**Examples** (planned):

- `ts-utils` - TypeScript utility functions
- `ts-components` - Reusable React components
- `ts-hooks` - Custom React hooks
- `ts-api` - API client libraries
- `ts-validators` - Data validation functions

### Library Structure (TypeScript)

```
libs/ts-utils/
├── src/
│   ├── index.ts               # Public API (barrel export)
│   └── lib/                   # Implementation
│       ├── greet.ts           # Feature implementation
│       └── greet.test.ts      # Unit tests
├── dist/                      # Build output (gitignored)
│   ├── index.js               # Compiled JavaScript
│   ├── index.d.ts             # Type definitions
│   └── lib/                   # Compiled lib files
├── project.json               # Nx project configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.build.json        # Build-specific TS config
├── package.json               # Library metadata and dependencies
└── README.md                  # Library documentation
```

### Library Characteristics

- **Polyglot-Ready** - Designed for multiple languages (TypeScript now, Java/Kotlin/Python future)
- **Flat Structure** - All libs at same level, no nested scopes
- **Reusable** - Designed to be imported by apps and other libs
- **Focused** - Each lib has single, clear purpose
- **Public API** - Exports controlled through `index.ts` (barrel export)
- **Testable** - Can be tested independently

### Current Scope

Go (`golang-commons`, `hugo-commons`) and future TypeScript, Java, Kotlin, Python libraries.

## Experimental Projects vs Monorepo Projects

The repository contains two distinct project structures with different purposes and characteristics:

### Nx Monorepo Projects (`apps/` and `libs/`)

**Purpose**: Integrated projects (TypeScript, Go, Java) that benefit from shared tooling and workspace integration.

**Characteristics**:

- Managed by Nx workspace configuration
- Integrated build system with task caching and orchestration
- Shared TypeScript configuration (`tsconfig.base.json`)
- Workspace path mappings (`@open-sharia-enterprise/*`)
- Cross-project dependencies supported
- Unified testing and linting commands
- Affected detection (`nx affected -t build`, `nx affected -t test:quick`)
- Dependency graph visualization (`nx graph`)

**When to use**:

- TypeScript applications and libraries
- Projects that share code with other monorepo projects
- Projects that benefit from task caching
- Projects that need unified build/test/lint workflows

**Examples**:

- Next.js frontend applications
- Spring Boot backend services
- Go CLI tools
- Hugo static sites
- Reusable TypeScript and Go libraries

### Experimental Projects (`apps-labs/`)

**Purpose**: Experimental applications and POCs with independent build systems that are NOT part of the Nx monorepo. Used for framework evaluation, language exploration, and temporary prototypes.

**Characteristics**:

- NOT managed by Nx workspace
- Independent build systems (Hugo, Go, Python, Rust, etc.)
- Self-contained configuration
- Separate deployment pipelines
- No access to workspace path mappings
- Not integrated with Nx task commands
- No cross-project dependencies with monorepo projects

**When to use**:

- Framework evaluation (Next.js vs Remix vs SvelteKit)
- Language exploration (Python, Go, Rust, etc.)
- Technology POCs (databases, authentication approaches, etc.)
- Quick prototypes without monorepo integration overhead
- Temporary experiments that might be deleted after evaluation

**Note on Nx integration**: Even projects with non-Node.js toolchains (like Hugo, Go, Python) can be integrated with Nx using the `nx:run-commands` executor to wrap their CLI commands. This provides benefits like task caching, unified command interface, and dependency graph visualization. See `apps/oseplatform-web/` as an example of a Hugo static site integrated with Nx monorepo.

### Key Differences

| Aspect                     | Nx Monorepo (`apps/`, `libs/`)    | Experimental (`apps-labs/`)          |
| -------------------------- | --------------------------------- | ------------------------------------ |
| Build System               | Nx workspace                      | Independent (Hugo, Go, Python, etc.) |
| Configuration              | Shared `tsconfig.base.json`       | Self-contained                       |
| Path Mappings              | Yes (`@open-sharia-enterprise/*`) | No                                   |
| Task Caching               | Yes (Nx cache)                    | No                                   |
| Cross-project Dependencies | Supported                         | Not supported                        |
| Deployment                 | Varies by app                     | Independent pipelines                |
| Language                   | TypeScript, Go, Java (current)    | Any language                         |

### Decision Guide

**Use Nx monorepo (`apps/` or `libs/`)** if:

- Project is TypeScript, Go, Java, or Spring Boot-based
- Project shares code with other monorepo projects
- Project benefits from task caching
- Project needs unified tooling

**Use experimental (`apps-labs/`)** if:

- Evaluating framework ergonomics before production decisions
- Exploring new programming languages
- Building temporary POCs that might be deleted
- Testing technology stacks without monorepo integration commitment
- Quick prototyping without Nx overhead

## File Format Reference

### `project.json` (Nx Configuration)

Location: `apps/[app-name]/project.json` or `libs/[lib-name]/project.json`

**Hugo App Example** (`oseplatform-web`):

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
  "tags": ["type:app", "platform:nextjs", "lang:ts", "domain:oseplatform"]
}
```

**TypeScript Library Example**:

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

**Target names follow [Nx Target Standards](../../governance/development/infra/nx-targets.md)**: Use `test:quick` for the mandatory pre-push gate, `test:unit` for isolated unit tests. Avoid generic `test` targets.

**Fields**:

- `name` - Project name (used by Nx CLI)
- `sourceRoot` - Source code location
- `projectType` - `"application"` or `"library"`
- `targets` - Nx tasks (build, test, lint, etc.)
- `executor` - Always `"nx:run-commands"` (no plugins)
- `command` - Shell command to execute
- `cwd` - Working directory for command
- `outputs` - Cache output locations
- `dependsOn` - Task dependencies
- `tags` - Project classification (see [Tag Convention](#tag-convention) below)

### Tag Convention

All projects use a standard four-dimension tag scheme:

| Dimension   | Values                                                | Required                 | Purpose                 |
| ----------- | ----------------------------------------------------- | ------------------------ | ----------------------- |
| `type:`     | `app`, `lib`, `e2e`                                   | Yes                      | Project kind            |
| `platform:` | `hugo`, `cli`, `nextjs`, `spring-boot`, `playwright`  | For apps/e2e             | Framework/runtime       |
| `lang:`     | `golang`, `ts`, `java`                                | Where source code exists | Primary language        |
| `domain:`   | `ayokoding`, `oseplatform`, `organiclever`, `tooling` | Yes                      | Business/product domain |

**Notes**:

- Hugo sites omit `lang:` — there is no application source code, only templates and markdown
- Go libs omit `platform:` — they have no framework, only `lang:golang`
- Use `domain:tooling` for generic dev utilities not tied to a product domain

### `tsconfig.json` (TypeScript Configuration)

**App Example**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Library Example**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Key Points**:

- Always extends `../../tsconfig.base.json`
- Workspace path mappings inherited from base config
- Project-specific options only

### App Configuration Files

**Hugo Apps** do not require `package.json` as they use Hugo's native configuration:

```yaml
# apps/oseplatform-web/hugo.yaml
baseURL: https://oseplatform.com/
languageCode: en-us
title: Open Sharia Enterprise Platform
theme: PaperMod
```

**Go Apps** use `go.mod` for dependency management:

```go
// apps/ayokoding-cli/go.mod
module github.com/wahidyankf/ose-public/apps/ayokoding-cli

go 1.26
```

**TypeScript/Next.js Apps** use `package.json`:

```json
{
  "name": "@open-sharia-enterprise/[app-name]",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**Library Example**:

```json
{
  "name": "@open-sharia-enterprise/ts-utils",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

**Naming**:

- Scope: `@open-sharia-enterprise`
- Apps: `@open-sharia-enterprise/[app-name]`
- Libs: `@open-sharia-enterprise/[lib-name]`

## Dependency Rules

### Import Patterns

**Note**: Hugo and Go apps do not use TypeScript path mappings. These patterns apply to TypeScript/Next.js apps.

**Apps importing libs** (TypeScript apps):

```typescript
// In apps/organiclever-fe/app/page.tsx
import { formatDate } from "@open-sharia-enterprise/ts-utils";
```

**Libs importing other libs**:

```typescript
// In libs/ts-components/src/index.ts
import { formatDate } from "@open-sharia-enterprise/ts-utils";
```

### Rules

1. **Apps can import from any lib**
2. **Libs can import from other libs**
3. **No circular dependencies** (A → B → A is prohibited)
4. **Apps should NOT import from other apps**
5. **Language boundaries exist** (TypeScript libs can't directly import Go/Python/Rust libs)

### Monitoring Dependencies

```bash
# View full dependency graph
nx graph

# View specific project dependencies
nx graph --focus=oseplatform-web

# View affected projects
nx affected:graph
```

## Path Mappings

Configured in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@open-sharia-enterprise/ts-*": ["libs/ts-*/src/index.ts"]
    }
  }
}
```

**Pattern**: `@open-sharia-enterprise/[language-prefix]-[name]`

**Examples**:

- `@open-sharia-enterprise/ts-utils`
- `@open-sharia-enterprise/ts-components`
- `@open-sharia-enterprise/ts-hooks`

## Build Outputs

### Apps

- **Hugo**: `apps/[app-name]/public/` (static site files)
- **Go**: `apps/[app-name]/dist/` (compiled binaries)
- **Next.js**: `apps/[app-name]/.next/`
- **Spring Boot**: `apps/[app-name]/target/`

### Libraries

- **TypeScript**: `libs/ts-[name]/dist/`

All build outputs are gitignored.

## Related Documentation

- [Nx Target Standards](../../governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and build output conventions
- [How to Add New App](../how-to/add-new-app.md)
- [How to Add New Library](../how-to/add-new-lib.md)
- [How to Run Nx Commands](../how-to/run-nx-commands.md)
- [Nx Configuration Reference](./nx-configuration.md)
