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
../../hippo run --class transactional --resource-tier standard --disk-path ../.. -- \
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
../../hippo run --class transactional --resource-tier standard --disk-path ../.. -- npm init -y
../../hippo run --class transactional --resource-tier standard --disk-path ../.. -- npm install express
../../hippo run --class transactional --resource-tier standard --disk-path ../.. -- \
  npm install -D typescript @types/express @types/node
```

Create basic structure:

```bash
mkdir -p src
touch src/index.ts
```

Return to the repository root before creating repository-relative configuration:

```bash
cd ../..
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
        "command": "node ../../scripts/next-with-port.mjs dev --env [APP_NAME]_PORT --default [port]",
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
        "command": "node ../../scripts/next-with-port.mjs start --env [APP_NAME]_PORT --default [port]",
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

> **Ports are not optional here.** Every Next.js app in this repository starts through
> `scripts/next-with-port.mjs`, which resolves the listener port as `--port` flag, then the app's own
> `[APP_NAME]_PORT` variable, then the `--default` baked into the target. Wiring `next dev`/`next start`
> directly would silently opt the new app out of that contract. The same wrapper belongs in the app's
> `Dockerfile` `CMD`, which must also `COPY` both `scripts/next-with-port.mjs` and
> `libs/ts-env-loader/src/port-resolver.ts`, preserving their relative layout. Pick a `[port]` that no
> other app claims — see [web-sites.md](../reference/web-sites.md).

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

**Tag values**: See [Tag Convention](../reference/nx-configuration.md#tag-convention) for valid `type:`, `platform:`, `lang:`, and `domain:` values.

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

./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [app-name]

# Build for production

./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build [app-name]

# Run fast quality gate (pre-push standard)

./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [app-name]:test:quick

# Run isolated unit tests

./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [app-name]:test:unit
\`\`\`

## Dependencies

This app imports from the following libraries:

- `@open-sharia-enterprise/ts-[lib-name]` - [Purpose]

## Configuration

[Any app-specific configuration notes]
```

### Step 8: Install Dependencies

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
```

### Step 9: Test App

```bash
# Test development server
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [app-name]

# Test build
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build [app-name]

# View dependency graph
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph
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
- [ ] `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [app-name]` starts the development server
- [ ] `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build [app-name]` builds successfully
- [ ] `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- graph` shows the app in the dependency graph
- [ ] Libraries import correctly (if applicable)

### Additional Checklist for Apps with OpenAPI Contracts

Apps that use a shared OpenAPI contract (e.g., `organiclever-be`, `organiclever-app-web`) must
satisfy these additional requirements:

**Required and applicable Nx targets**:

- [ ] `codegen` — generates types + encoders/decoders from the OpenAPI spec at `specs/apps/[domain]/[owner]/contracts/`
- [ ] `typecheck` — verifies types compile; must include `dependsOn: ["codegen"]`
- [ ] `lint` — static analysis / format check
- [ ] `build` — production build; must include `dependsOn: ["codegen"]`
- [ ] `test:unit` — in-process Unit tests with OS-facing dependencies replaced; collects native
      line coverage and hard-fails below 99%
- [ ] `test:coverage:*` plus `test:coverage` — static-only Gherkin/test mapping validation; never
      executes or depends on a runtime test target
- [ ] `test:quick` — typecheck, lint, mandatory Unit runtime, and applicable static coverage;
      never Integration or E2E runtime
- [ ] `test:integration` — only when the app owns a genuine deterministic local-resource boundary;
      no external network reach
- [ ] a dedicated `*-e2e:test:e2e` — only when the app exposes a real public browser, HTTP, API, or
      process boundary

Omit inapplicable Integration/E2E targets; never add an echo or no-op placeholder. Every active
Gherkin scenario still has Unit proof. An applicable higher layer may be exempt only with the
canonical explicit boundary reason and named alternative proof.

**Integration setup**: Apps with `test:integration` isolate real local resources such as temporary
files, embedded databases, process environment, or child-process standard streams. A loopback socket
the test starts and stops is allowed only when `repo-config.yml` allowlists the project. The target
must reach no external network and no Docker-hosted service, and must set `"cache": false` in
`project.json`.

**E2E stack setup**: Put Docker-hosted PostgreSQL, message brokers, and other networked services in
the app's E2E stack. The E2E target must enter through the app's public browser, HTTP/API, or process
boundary and use isolated synthetic data.

**Specs folder**: Create a `specs/apps/[domain]/` folder at the repository root holding one
logical owner corpus per deployed surface. Gherkin feature files must be placed here, not inside
the app:

```
specs/apps/[product]/
├── README.md               # Indexes the corpora and any product-level document
├── overview.md             # Optional — PM-first product framing
└── [owner]/                # One per deployed surface (be, app-web, www, cli, ...)
    ├── README.md
    ├── architecture.md     # As-built: context, containers, components, constraints
    ├── contracts/          # Optional — OpenAPI, in the owner that serves it
    └── behaviours/          # Gherkin feature files — domain subdirs required
        ├── README.md
        └── [domain]/
```

See [Specs Directory Structure Convention](../../repo-governance/conventions/structure/specs-directory-structure.md) for per-surface variants and full rules.

**Codegen dependency chain**: Both `typecheck` and `build` must declare `dependsOn: ["codegen"]`. This ensures contract violations surface during `nx affected -t typecheck` and the pre-push `test:quick` gate.

**Canonical inputs for cache invalidation**: define a project-level `"namedInputs": {"specs": [...]}`
block for the Gherkin glob, then reference it as `"specs"` in `test:unit` and `test:quick`'s `inputs`
array — do not inline the raw glob directly into a target's `inputs`:

```json
{
  "namedInputs": {
    "specs": ["{workspaceRoot}/specs/apps/[domain]/be/behaviours/**/*.feature"]
  },
  "targets": {
    "test:quick": {
      "inputs": ["default", "{projectRoot}/generated-contracts/**/*", "specs"]
    }
  }
}
```

- `namedInputs.specs` — the `{workspaceRoot}/specs/apps/[domain]/be/behaviours/**/*.feature` glob for backends
- `test:unit`/`test:quick` `inputs` — `"specs"` (the named-input reference) plus `{projectRoot}/generated-contracts/**/*` and language-specific source file globs (see `repo-governance/development/infra/nx-targets.md` for per-language patterns)

**See**: [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) for canonical target names, caching rules, and per-language input patterns.

## Common Issues

### Issue: TypeScript can't find library imports

**Solution**: Ensure `tsconfig.json` extends `../../tsconfig.base.json` which contains path mappings.

### Issue: Build fails with "command not found"

**Solution**: Ensure the framework is installed in the app's `package.json`, then run
`./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`.

### Issue: Nx doesn't recognize the app

**Solution**: Ensure `project.json` exists with valid JSON and `name` field matches folder name.

## Next Steps

- Add tests for your app
- Configure linting (ESLint)
- Set up environment variables
- Add to CI/CD pipeline

## Related Documentation

- [Add New Library](./add-new-lib.md)
- [Run Nx Commands](./run-nx-commands.md)
- [Monorepo Structure Reference](../reference/monorepo-structure.md)
- [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md)
- [Behaviour-Driven Development](../../repo-governance/development/behaviour-driven-development.md)
- [Specs README](../../specs/README.md) - Standard folder layout for Gherkin specs and contracts
