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
---

# Monorepo Structure Reference

Complete reference for the Nx monorepo structure, folder organization, and file formats.

## Overview

This project uses **Nx** as a monorepo build system with a plugin-free "vanilla Nx" approach. The Nx monorepo consists of two main folders:

- `apps/` - Deployable applications
- `libs/` - Reusable libraries (flat structure with language prefixes)

## Root Structure

```
open-sharia-enterprise/
├── apps/                      # Deployable applications (Nx monorepo)
├── libs/                      # Reusable libraries (Nx monorepo, flat structure)
├── docs/                      # Documentation (Diátaxis framework)
├── plans/                     # Project planning documents
├── .claude/                   # Claude Code configuration
├── infra/                     # Infrastructure configurations
│   ├── dev/                  # Local development Docker Compose files per service
│   │   └── [service]/        # docker-compose.yml for local dev environment
│   └── k8s/                  # Kubernetes deployments
├── specs/                     # Gherkin acceptance specs, C4 diagrams, and OpenAPI contracts
│   ├── apps/                  # Per-app specs (one logical owner corpus per surface)
│   │   └── [product]/        # e.g. organiclever/, crane/
│   │       ├── overview.md   # optional PM-first framing shared by the owners
│   │       └── [owner]/      # one per deployed surface (be/, www/, app-web/, cli/)
│   │           ├── architecture.md # C4 context → containers → components, one document
│   │           ├── contracts/      # OpenAPI, in the owner that serves it
│   │           └── behaviours/      # Gherkin feature files
│   │               └── [domain]/   # e.g. crane/cli/behaviours/system/
│   └── libs/                  # Per-library specs (the same three entries at the library root)
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
├── commitlint.config.js       # Commitlint config (on demand; no hook runs it)
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

- `ose-www` - OSE Platform public website (Next.js 16 content platform, port 3100)
- `ose-www-be-e2e` - Playwright BE E2E tests for ose-www tRPC API
- `ose-www-fe-e2e` - Playwright FE E2E tests for ose-www UI
- `ose-be` - OSE Application F#/Giraffe/ASP.NET REST API backend (port 8302)
- `ose-be-e2e` - Playwright BE E2E tests for ose-be
- `ose-lms-be` - OSE LMS Java 25/Spring Boot 4 REST API backend (port 8303)
- `ose-lms-be-e2e` - Playwright BE E2E tests for ose-lms-be
- `ayokoding-www` - AyoKoding educational platform (Next.js 16 fullstack content platform, port 3101)
- `ayokoding-www-be-e2e` - Playwright BE E2E tests for ayokoding-www tRPC API
- `ayokoding-www-fe-e2e` - Playwright FE E2E tests for ayokoding-www UI
- `crane-cli` - PDF-to-Markdown pipeline CLI (F# application)
- `ferret-cli` - Local metadata-only telemetry CLI for coding-agent harnesses (Python 3.14 zipapp, no runtime
  dependencies)
- `ferret-cli-e2e` - Process-level E2E tests for the built `ferret-cli` artifact (Python, pytest)
- `organiclever-www` - OrganicLever marketing website (Next.js 16, port 3200)
- `organiclever-www-fe-e2e` - Playwright FE E2E tests for organiclever-www
- `organiclever-app-web` - OrganicLever app frontend (Next.js 16 application, port 3202)
- `organiclever-app-web-e2e` - Playwright FE E2E tests for organiclever-app-web
- `organiclever-be` - OrganicLever F#/Giraffe/ASP.NET REST API backend (port 8202)
- `organiclever-be-e2e` - Playwright BE E2E tests for organiclever-be
- `roots-be` - Roots Islamic-practice tooling Go/Gin REST API backend (port 8402)
- `roots-be-e2e` - Playwright BE E2E tests for roots-be
- `ose-id-be` - OSE ID C#/ASP.NET Core REST API backend (port 8501)
- `ose-id-be-e2e` - Reqnroll/xUnit BE E2E tests for ose-id-be (C#, not Playwright — see
  [Mandatory Targets — CLI and E2E](../../repo-governance/development/infra/nx-targets/mandatory-targets-cli-e2e.md))
- `ose-id-web` - OSE ID web shell (Next.js 16 application, port 3500)
- `ose-id-web-e2e` - Playwright FE E2E tests for ose-id-web

### App Structure (Next.js Application — ose-www)

```
apps/ose-www/
├── src/                       # Source code (App Router)
├── public/                    # Static assets
├── next.config.mjs            # Next.js configuration
├── project.json               # Nx project configuration
├── vercel.json                # Deployment configuration
└── README.md                  # App documentation
```

### App Structure (Next.js Application)

```
apps/organiclever-app-web/
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
├── src/                       # Source code (F# modules)
├── tests/                     # Test suites (unit/, integration/)
├── Dockerfile                 # Production multi-stage build
├── .dockerignore              # Docker build context exclusions
├── *.fsproj                   # F# project file
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
- `rust-` - Rust (future)
- `fsharp-` - F# (e.g., `fsharp-crane-core`)
- `java-` - Java (future)
- `kt-` - Kotlin (future)
- `py-` - Python (future)

**Current Libraries**:

- `fsharp-crane-core` - Shared F# PDF-to-Markdown core (PdfPig + Tesseract)
- `web-ui` - Shared React component library (shadcn/ui patterns, Radix UI primitives, Tailwind CSS)

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

F# (`fsharp-crane-core`, `fsharp-env-loader`) and TypeScript (`web-ui`, `web-ui-token`,
`ts-env-loader`) libraries. No Rust library exists today.

## Nx Monorepo Projects (`apps/` and `libs/`)

**Purpose**: Integrated projects (TypeScript, Rust, F#) that benefit from shared tooling and workspace integration.

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
- F#/Giraffe backend services
- Rust CLI tools
- Reusable Rust, F#, and TypeScript libraries

## File Format Reference

### `project.json` (Nx Configuration)

Location: `apps/[app-name]/project.json` or `libs/[lib-name]/project.json`

**Next.js App Example** (`ose-www`):

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
    }
  },
  "tags": ["type:app", "platform:nextjs", "lang:ts", "domain:ose"]
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

**Target names follow [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md)**: Use `test:quick` for the mandatory pre-push gate, `test:unit` for isolated unit tests. Avoid generic `test` targets.

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

| Dimension   | Values                                        | Required                 | Purpose                 |
| ----------- | --------------------------------------------- | ------------------------ | ----------------------- |
| `type:`     | `app`, `lib`, `e2e`                           | Yes                      | Project kind            |
| `platform:` | `cli`, `nextjs`, `spring-boot`, `playwright`  | For apps/e2e             | Framework/runtime       |
| `lang:`     | `rust`, `ts`, `dotnet`                        | Where source code exists | Primary language        |
| `domain:`   | `ayokoding`, `ose`, `organiclever`, `tooling` | Yes                      | Business/product domain |

**Notes**:

- Rust libs omit `platform:` — they have no framework, only `lang:rust`
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

**Note**: Rust/F# apps do not use TypeScript path mappings. These patterns apply to TypeScript/Next.js apps.

**Apps importing libs** (TypeScript apps):

```typescript
// In apps/organiclever-app-web/app/page.tsx
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
5. **Language boundaries exist** (TypeScript libs can't directly import Rust/F# libs)

### Monitoring Dependencies

```bash
# View full dependency graph
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph

# View specific project dependencies
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph --focus=ose-www

# View affected projects
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph --affected
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

- **Rust**: `apps/[app-name]/target/` (compiled binaries)
- **Next.js**: `apps/[app-name]/.next/`
- **F#/.NET**: `apps/[app-name]/bin/`

### Libraries

- **TypeScript**: `libs/ts-[name]/dist/`

All build outputs are gitignored.

## Related Documentation

- [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and build output conventions
- [How to Add New App](../how-to/add-new-app.md)
- [How to Add New Library](../how-to/add-new-lib.md)
- [How to Run Nx Commands](../how-to/run-nx-commands.md)
- [Nx Configuration Reference](./nx-configuration.md)
