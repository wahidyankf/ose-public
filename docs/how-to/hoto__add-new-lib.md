---
title: How to Add a New Library
description: Step-by-step guide for creating a new reusable library in the libs/ folder
category: how-to
tags:
  - nx
  - monorepo
  - libraries
  - typescript
created: 2025-11-29
updated: 2026-03-06
---

# How to Add a New Library

This guide shows you how to create a new reusable library in the `libs/` folder of the Nx monorepo.

## Prerequisites

- Node.js 24.13.1 and npm 11.10.1 (managed by Volta)
- Nx workspace initialized
- Understanding of the library's purpose and scope

## Steps

### Step 1: Choose Library Name

Follow the naming convention: `[language-prefix]-[name]`

**Language Prefixes**:

- `ts-` - TypeScript
- `golang-` - Go (e.g., `golang-commons`)
- `hugo-` - Hugo shared utilities (e.g., `hugo-commons`)
- `java-` - Java (future)
- `py-` - Python (future)

**Examples**:

- `ts-utils` - TypeScript utility functions
- `ts-components` - Reusable React components
- `golang-commons` - Shared Go utilities (links checker, output)
- `hugo-commons` - Shared Hugo test utilities (Godog BDD)

### Step 2: Create Library Directory

```bash
mkdir -p libs/ts-[name]/src/lib
cd libs/ts-[name]
```

### Step 3: Create Source Files

#### Create Public API (`src/index.ts`)

This is the barrel export file that controls what's publicly available:

```typescript
// Export all public functions/components
export { functionName } from "./lib/feature";
export type { TypeName } from "./lib/types";
```

#### Create Implementation (`src/lib/`)

Create implementation files in `src/lib/`:

**Example** (`src/lib/greet.ts`):

```typescript
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

#### Create Tests (`src/lib/[feature].test.ts`)

Use Node.js built-in test runner:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { greet } from "./greet";

test("greet returns greeting message", () => {
  assert.strictEqual(greet("World"), "Hello, World!");
});

test("greet with different name", () => {
  assert.strictEqual(greet("Alice"), "Hello, Alice!");
});
```

### Step 4: Create Nx Configuration (`project.json`)

Create `libs/ts-[name]/project.json`:

```json
{
  "name": "ts-[name]",
  "sourceRoot": "libs/ts-[name]/src",
  "projectType": "library",
  "tags": ["type:lib", "lang:ts"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p libs/ts-[name]/tsconfig.build.json",
        "cwd": "."
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node --import tsx --test libs/ts-[name]/src/**/*.test.ts",
        "cwd": "."
      },
      "dependsOn": ["build"]
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

### Step 5: Create TypeScript Configuration

#### Main Config (`tsconfig.json`)

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

#### Build Config (`tsconfig.build.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "node_modules", "dist"]
}
```

### Step 6: Create `package.json`

```json
{
  "name": "@open-sharia-enterprise/ts-[name]",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

### Step 7: Create README

Create `libs/ts-[name]/README.md`:

```markdown
# @open-sharia-enterprise/ts-[name]

[Brief description of the library]

## Purpose

[What this library provides]

## Installation

This library is part of the monorepo and doesn't need separate installation.

## Usage

\`\`\`typescript
import { functionName } from "@open-sharia-enterprise/ts-[name]";

const result = functionName(params);
\`\`\`

## API Reference

### `functionName(param: Type): ReturnType`

[Description of what the function does]

**Parameters**:

- `param` (Type): [Description]

**Returns**: [Description of return value]

**Example**:
\`\`\`typescript
const result = functionName("example");
// result: "expected output"
\`\`\`

## Development

\`\`\`bash

# Build library

nx build ts-[name]

# Run fast quality gate (pre-push standard)

nx run ts-[name]:test:quick

# Run isolated unit tests

nx run ts-[name]:test:unit
\`\`\`

## Dependencies

This library imports from:

- `@open-sharia-enterprise/ts-[other-lib]` - [Purpose] (if applicable)

## Testing

Tests use Node.js built-in test runner with tsx for TypeScript support.

## License

FSL-1.1-MIT
```

### Step 8: Install Dependencies

```bash
npm install
```

### Step 9: Test Library

```bash
# Build library
nx build ts-[name]

# Run fast quality gate (pre-push standard)
nx run ts-[name]:test:quick

# Run isolated unit tests
nx run ts-[name]:test:unit

# View dependency graph
nx graph
```

### Step 10: Use Library in Apps

To use the library in an app:

```typescript
import { functionName } from "@open-sharia-enterprise/ts-[name]";

export default function Component() {
 const result = functionName("example");
 return <div>{result}</div>;
}
```

## Verification Checklist

- [ ] Library directory created in `libs/` with language prefix
- [ ] Library name follows `ts-[name]` convention
- [ ] `src/index.ts` exists as public API (barrel export)
- [ ] `src/lib/` contains implementation files
- [ ] Test files created with `.test.ts` extension
- [ ] `project.json` created with Nx configuration
- [ ] `tags` field includes `type:lib`, `lang:` value (e.g., `lang:ts`, `lang:golang`)
- [ ] All targets use `nx:run-commands` executor
- [ ] `tsconfig.json` and `tsconfig.build.json` created
- [ ] `package.json` created with library metadata
- [ ] `README.md` created with API documentation
- [ ] `nx build ts-[name]` builds successfully
- [ ] `nx run ts-[name]:test:quick` passes (fast quality gate)
- [ ] `nx run ts-[name]:test:unit` runs tests successfully
- [ ] Build creates `dist/` directory with compiled JS
- [ ] Library can be imported using `@open-sharia-enterprise/ts-[name]`

## Dependency Management

### Importing Other Libraries

Libraries can import from other libraries:

```typescript
// In libs/ts-components/src/lib/Button.tsx
import { formatDate } from "@open-sharia-enterprise/ts-utils";
```

### Avoiding Circular Dependencies

**DO NOT create circular dependencies**:

```
ts-auth imports ts-users
ts-users imports ts-auth  ❌ CIRCULAR DEPENDENCY
```

**Use `nx graph` to monitor dependencies**:

```bash
nx graph  # View full dependency graph
```

### Language Boundaries

TypeScript libraries can only directly import other TypeScript libraries. To use libraries in other languages (Java, Python, etc.), use:

- HTTP APIs
- gRPC
- Message queues
- Shared data formats (JSON, Protobuf)

## Common Issues

### Issue: TypeScript can't find the library import

**Solution**:

1. Ensure `tsconfig.base.json` has the path mapping:

   ```json
   {
     "paths": {
       "@open-sharia-enterprise/ts-*": ["libs/ts-*/src/index.ts"]
     }
   }
   ```

2. Restart your IDE/TypeScript server

### Issue: Tests fail with "Cannot find module"

**Solution**: Ensure `tsx` is installed as devDependency:

```bash
npm install -D tsx
```

### Issue: Build creates no output

**Solution**: Check `tsconfig.build.json` has correct `outDir` and `rootDir`:

```json
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### Issue: Nx doesn't recognize the library

**Solution**: Ensure `project.json` exists with valid JSON and `name` field matches folder name (without `libs/` prefix).

## Next Steps

- Add comprehensive tests
- Configure linting
- Add type definitions for complex types
- Document all public APIs
- Consider breaking large libraries into smaller, focused libraries

## Related Documentation

- [Add New App](./hoto__add-new-app.md)
- [Run Nx Commands](./hoto__run-nx-commands.md)
- [Monorepo Structure Reference](../reference/re__monorepo-structure.md)
- [Nx Configuration Reference](../reference/re__nx-configuration.md) - Tag convention for `type:`, `lang:` values
