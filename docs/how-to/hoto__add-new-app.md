---
title: How to Add a New App
description: Step-by-step guide for creating a new application in the apps/ folder
category: how-to
tags:
  - nx
  - monorepo
  - apps
  - typescript
  - nextjs
created: 2025-11-29
updated: 2026-03-06
---

# How to Add a New App

This guide shows you how to create a new application in the `apps/` folder of the Nx monorepo.

## Prerequisites

- Node.js 24.13.1 and npm 11.10.1 (managed by Volta)
- Nx workspace initialized
- Understanding of the app you want to create (Next.js, Express API, etc.)

## Steps

### Step 1: Choose App Name

Follow the naming convention: `[domain]-[type]`

**Examples**:

- `api-gateway` - API gateway service
- `admin-dashboard` - Admin web application
- `customer-portal` - Customer-facing portal
- `payment-processor` - Payment processing service

### Step 2: Create App Directory

```bash
mkdir -p apps/[app-name]
cd apps/[app-name]
```

### Step 3: Initialize App Framework

#### For Next.js App

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir
```

This creates:

- `app/` - Next.js 16+ app directory
- `public/` - Static assets
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

#### For Express API

```bash
npm init -y
npm install express
npm install -D typescript @types/express @types/node
```

Create basic structure:

```bash
mkdir -p src
touch src/index.ts
```

### Step 4: Create Nx Configuration (`project.json`)

Create `apps/[app-name]/project.json`:

**Next.js Example**:

```json
{
  "name": "[app-name]",
  "sourceRoot": "apps/[app-name]",
  "projectType": "application",
  "tags": ["type:app", "platform:nextjs", "lang:ts", "domain:[domain]"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next dev",
        "cwd": "apps/[app-name]"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next build",
        "cwd": "apps/[app-name]"
      },
      "outputs": ["{projectRoot}/.next"]
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next start",
        "cwd": "apps/[app-name]"
      },
      "dependsOn": ["build"]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next lint",
        "cwd": "apps/[app-name]"
      }
    }
  }
}
```

**Express API Example**:

```json
{
  "name": "[app-name]",
  "sourceRoot": "apps/[app-name]/src",
  "projectType": "application",
  "tags": ["type:app", "platform:express", "lang:ts", "domain:[domain]"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p apps/[app-name]/tsconfig.json",
        "cwd": "."
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/index.js",
        "cwd": "apps/[app-name]"
      },
      "dependsOn": ["build"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "ts-node src/index.ts",
        "cwd": "apps/[app-name]"
      }
    }
  }
}
```

**Tag values**: See [Tag Convention](../reference/re__nx-configuration.md#tag-convention) for valid `type:`, `platform:`, `lang:`, and `domain:` values.

### Step 5: Configure TypeScript

Update `apps/[app-name]/tsconfig.json` to extend workspace config:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // App-specific compiler options
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["**/*"],
  "exclude": ["node_modules", "dist", ".next"]
}
```

### Step 6: Create App-Specific `package.json`

```json
{
  "name": "@open-sharia-enterprise/[app-name]",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    // App-specific dependencies
  },
  "devDependencies": {
    // App-specific dev dependencies
  }
}
```

### Step 7: Create README

Create `apps/[app-name]/README.md`:

```markdown
# [App Name]

[Brief description of the app]

## Purpose

[What this app does]

## Tech Stack

- Framework: [Next.js / Express / etc.]
- Language: TypeScript
- [Other key technologies]

## Development

\`\`\`bash

# Start development server

nx dev [app-name]

# Build for production

nx build [app-name]

# Run fast quality gate (pre-push standard)

nx run [app-name]:test:quick

# Run isolated unit tests

nx run [app-name]:test:unit
\`\`\`

## Dependencies

This app imports from the following libraries:

- `@open-sharia-enterprise/ts-[lib-name]` - [Purpose]

## Configuration

[Any app-specific configuration notes]
```

### Step 8: Install Dependencies

```bash
npm install
```

### Step 9: Test App

```bash
# Test development server
nx dev [app-name]

# Test build
nx build [app-name]

# View dependency graph
nx graph
```

### Step 10: Import Libraries (If Needed)

To use a library from `libs/`:

```typescript
import { functionName } from "@open-sharia-enterprise/ts-[lib-name]";
```

TypeScript path mappings are configured in `tsconfig.base.json`.

## Verification Checklist

- [ ] App directory created in `apps/`
- [ ] App name follows `[domain]-[type]` convention
- [ ] `project.json` created with Nx configuration
- [ ] `tags` field includes `type:`, `platform:`, `lang:` (if applicable), and `domain:` values
- [ ] All targets use `nx:run-commands` executor (no plugins)
- [ ] `tsconfig.json` extends `../../tsconfig.base.json`
- [ ] `package.json` created with app dependencies
- [ ] `README.md` created with app documentation
- [ ] `nx dev [app-name]` starts development server
- [ ] `nx build [app-name]` builds successfully
- [ ] `nx graph` shows app in dependency graph
- [ ] Libraries import correctly (if applicable)

### Additional Checklist for New Demo Apps

New `demo-be-*` and `demo-fe-*` apps must satisfy these additional requirements:

**Mandatory Nx targets** (all 7 required):

- [ ] `codegen` — generates types + encoders/decoders from the OpenAPI spec at `specs/apps/demo/contracts/`
- [ ] `typecheck` — verifies types compile; must include `dependsOn: ["codegen"]`
- [ ] `lint` — static analysis / format check
- [ ] `build` — production build; must include `dependsOn: ["codegen"]`
- [ ] `test:unit` — unit tests with mocked dependencies; cacheable
- [ ] `test:quick` — unit tests + coverage validation (≥90% for backends, ≥70% for frontends); cacheable
- [ ] `test:integration` — real PostgreSQL via docker-compose; must set `cache: false`

**Note**: `rhino-cli spec-coverage validate` in `test:quick` is deferred pending tool enhancement for demo-be naming conventions.

**Codegen dependency chain**: Both `typecheck` and `build` must declare `dependsOn: ["codegen"]`. This ensures contract violations surface during `nx affected -t typecheck` and the pre-push `test:quick` gate.

**Canonical inputs for cache invalidation** (add to `test:unit` and `test:quick`):

- Include `{projectRoot}/generated-contracts/**/*` (or `generated_contracts` for Python/Clojure)
- Include `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` for backends
- Include language-specific source file globs (see `governance/development/infra/nx-targets.md` for per-language patterns)

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names, caching rules, and per-language input patterns.

## Common Issues

### Issue: TypeScript can't find library imports

**Solution**: Ensure `tsconfig.json` extends `../../tsconfig.base.json` which contains path mappings.

### Issue: Build fails with "command not found"

**Solution**: Ensure framework is installed in app's `package.json` and run `npm install`.

### Issue: Nx doesn't recognize the app

**Solution**: Ensure `project.json` exists with valid JSON and `name` field matches folder name.

## Next Steps

- Add tests for your app
- Configure linting (ESLint)
- Set up environment variables
- Add to CI/CD pipeline

## Related Documentation

- [Add New Library](./hoto__add-new-lib.md)
- [Run Nx Commands](./hoto__run-nx-commands.md)
- [Monorepo Structure Reference](../reference/re__monorepo-structure.md)
