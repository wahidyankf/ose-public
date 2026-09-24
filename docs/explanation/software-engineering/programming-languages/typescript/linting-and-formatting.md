---
title: "TypeScript Linting and Formatting"
description: Code quality with ESLint and Prettier for TypeScript
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - eslint
  - prettier
  - code-quality
  - formatting
  - linting
related:
  - ./best-practices.md
  - ./test-driven-development.md
principles:
  - automation-over-manual
  - explicit-over-implicit
---

# TypeScript Linting and Formatting

**Quick Reference**: [Overview](#overview) | [ESLint](#eslint-9x10x) | [Prettier](#prettier-3x) | [TSConfig](#tsconfig-strict-mode) | [Pre-commit Hooks](#pre-commit-hooks) | [Related Documentation](#related-documentation)

## Overview

Automated linting and formatting ensure code quality and consistency. ESLint catches errors, Prettier formats code, and Git hooks enforce standards.

### Quality Principles

- **Automated Enforcement**: Hooks prevent bad code from committing
- **Consistent Style**: Prettier removes style debates
- **Catch Errors Early**: ESLint finds bugs before runtime
- **TypeScript Strict**: Strict mode catches more errors

### ESLint → Prettier → TypeScript Pipeline

Understanding the tool integration workflow helps optimize your development setup.

**Pre-commit hook runs all three tools in sequence:**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: ESLint → Prettier → TypeScript Pipeline
    accDescr: Source Code TypeScript leads to ESLint Code Quality Rules; ESLint Code Quality Rules leads to Lint errors found?; Lint errors found? leads to Auto-fix Issues via Auto-fixable; Auto-fix Issues leads to fix flag; and 4 more links.
    Code["Source Code<br/>#40;TypeScript#41;"]:::blue --> ESLint["ESLint<br/>Code Quality Rules"]:::orange
    ESLint --> ESLintErrors{"Lint errors<br/>found?"}:::orange
    ESLintErrors -->|"Auto-fixable"| AutoFix["Auto-fix Issues<br/>--fix flag"]:::teal
    ESLintErrors -->|"Manual"| ManualFix["Manual Fixes<br/>Required"]:::purple
    ESLintErrors -->|No| Prettier["Prettier<br/>Code Formatting"]:::brown
    AutoFix --> Prettier
    ManualFix --> Code

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: ESLint → Prettier → TypeScript Pipeline 2
    accDescr: Prettier Code Formatting leads to Format Code Consistent Style; Format Code Consistent Style leads to TypeScript Compiler tsc; TypeScript Compiler tsc leads to noEmit; TypeScript Compiler tsc leads to Type errors found?; and 2 more links.
    Prettier["Prettier<br/>Code Formatting"]:::brown --> PrettierFormat["Format Code<br/>Consistent Style"]:::teal
    PrettierFormat --> TSC["TypeScript Compiler<br/>tsc --noEmit"]:::blue
    TSC --> TypeErrors{"Type errors<br/>found?"}:::orange
    TypeErrors -->|Yes| Fail["Commit Blocked"]:::purple
    TypeErrors -->|No| Success["Code Ready to Commit"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
```

## ESLint 9.x/10.x

### ESLint Configuration Hierarchy

ESLint resolves configuration files following a specific hierarchy. Understanding this helps debug config issues.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: ESLint Configuration Hierarchy
    accDescr: eslint src/file.ts leads to Check src/ for config; Check src/ for config leads to Check parent directories; Check parent directories leads to Find eslint.config.js at project root; and 5 more links.
    Start["eslint src/file.ts"]:::blue
    FileDir["Check src/<br/>for config"]:::orange
    ParentDir["Check parent<br/>directories"]:::orange
    RootConfig["Find<br/>eslint.config.js<br/>at project root"]:::teal
    UserConfig["Check ~/.eslintrc"]:::brown
    DefaultConfig["Use ESLint defaults"]:::purple

    Merge["Merge Configurations<br/>closer = higher<br/>priority"]:::teal
    ApplyRules["Apply Rules to File"]:::blue
    Result["Lint Results"]:::teal

    Start --> FileDir
    FileDir --> ParentDir
    ParentDir --> RootConfig
    RootConfig --> UserConfig
    UserConfig --> DefaultConfig
    DefaultConfig --> Merge
    Merge --> ApplyRules
    ApplyRules --> Result

    Note1["Priority (high to<br/>low):<br/>1. Inline comments<br/>2. File-level config<br/>3. Project config<br/>4. User config<br/>5. Defaults"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
```

### Flat Config Setup (9.x)

```typescript
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
      },
      {
        selector: "typeAlias",
        format: ["PascalCase"],
      },
    ],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
});
```

### Custom Rules for Financial Code

```typescript
// eslint.config.js
export default [
  {
    files: ["**/*.ts"],
    rules: {
      // Require explicit types for money
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowedNames: ["createMoney", "calculateZakat"],
        },
      ],

      // Ban unsafe type assertions
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],

      // Require validation for external data
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",

      // Prevent floating promises
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
];
```

### Auto-fix vs Manual Fix Decision

When should you use `eslint --fix` vs manual fixes? This decision tree helps optimize your workflow.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    accTitle: Auto-fix vs Manual Fix Decision
    accDescr: Use leads to fix Flag Auto-apply fixes; Review Change Then leads to fix; ESLint Error Found leads to Safe to auto-fix?; Safe to auto-fix? leads to Style-only change? via Yes; and 3 more links.
    Start["ESLint Error Found"]:::blue
    SafeRule{"Safe to<br/>auto-fix?"}:::orange
    StyleOnly{"Style-only<br/>change?"}:::orange
    UseAutoFix["Use --fix Flag<br/>Auto-apply fixes"]:::teal
    ReviewChange["Review Change<br/>Then --fix"]:::brown
    ManualFix["Manual Fix Required<br/>Logic change needed"]:::purple

    Start --> SafeRule
    SafeRule -->|Yes| StyleOnly
    SafeRule -->|No| ManualFix
    StyleOnly -->|Yes| UseAutoFix
    StyleOnly -->|No| ReviewChange

    Examples["Auto-fixable:<br/>- Missing semicolons<br/>- Unused imports<br/>- Spacing issues<br/><br/>Manual fixes:<br/>- Type errors<br/>- Logic errors<br/>- Security issues"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
```

## Prettier 3.x

### Import Sorting Strategies

Different strategies for organizing imports affect readability and maintainability.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    accTitle: Import Sorting Strategies
    accDescr: Import Statements leads to By Type Built-in, External, Internal; Import Statements leads to Alphabetical A-Z; Import Statements leads to By Usage Frequency Most used first; and 1 more links.
    Imports["Import Statements"]:::blue

    ByType["By Type<br/>Built-in, External,<br/>Internal"]:::orange
    ByAlpha["Alphabetical<br/>#40;A-Z#41;"]:::teal
    ByUsage["By Usage Frequency<br/>Most used first"]:::purple
    ByLayer["By Architecture<br/>Layer<br/>Domain, App, Infra"]:::brown

    Imports --> ByType
    Imports --> ByAlpha
    Imports --> ByUsage
    Imports --> ByLayer

    TypeExample["1. Built-in: fs,<br/>path<br/>2. External:<br/>express, zod<br/>3. Internal:<br/>@domain/*"]
    AlphaExample["import { a } from<br/>'a'<br/>import { b } from<br/>'b'<br/>import { z } from<br/>'z'"]
    LayerExample["1. Domain entities<br/>2. Application<br/>services<br/>3. Infrastructure"]

    Note1["ESLint plugin:<br/>eslint-plugin-import<br/>or<br/>prettier-plugin-<br/>sort-imports"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
```

### Configuration

```javascript
// prettier.config.js
export default {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  endOfLine: "lf",
};
```

### Integration with ESLint

```typescript
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier, // Disables ESLint rules that conflict with Prettier
);
```

## TSConfig Strict Mode

### Strict Configuration

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "outDir": "./dist",
    "rootDir": "./src",

    // Strict type checking
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Emit configuration
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,

    // Module resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

## Pre-commit Hooks

In this repository, TypeScript files are formatted at commit time by a registry gate, not by a
per-project hook or a `lint-staged` configuration. `.husky/pre-commit` is a thin shim that runs
every gate `repo-config.yml` declares on the `pre-commit` surface:

```bash
# .husky/pre-commit
export RHINO_GATE_SURFACE=pre-commit
exec ./hippo run --class transactional --resource-tier standard --disk-path . -- \
  ./rhino gate run --surface pre-commit
```

### Formatting Staged Files

The `format-staged` gate hands the staged paths to `scripts/format-staged`, which runs
`prettier --write` on `*.{ts,tsx,js,jsx,mjs,cjs}` and the other Prettier-owned extensions, then
applies the result to the index. On a pull request the same gate replays Prettier over the changed
paths and fails if any byte would change.

### Where Linting and Type Checks Run

ESLint and `tsc` are project-scoped, so they are Nx targets (`lint`, `typecheck`), not pre-commit
gates. The PR quality gate's TypeScript job runs them for affected projects together with
`test:quick`.

### Example Workflow

```bash
# Stage files
git add src/donation-service.ts

# Commit triggers the pre-commit gates:
# 1. The public-safety screen checks the staged tree
# 2. format-staged formats the staged TypeScript with Prettier and re-stages it
# 3. The remaining declared checks run
# 4. The commit proceeds if every gate passes
git commit -m "feat: add donation validation"
```

## Related Documentation

- **[TypeScript Best Practices](best-practices.md)** - Coding standards
- **[TypeScript TDD](test-driven-development.md)** - Testing practices

---

**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Tools**: ESLint 9.39.0/10.0.0, Prettier 3.8.0, Husky 9.x
**Maintainers**: OSE Documentation Team

## TypeScript Quality Tools

```mermaid
flowchart TD
    accTitle: TypeScript Quality Tools
    accDescr: TS Quality leads to ESLint Linting; TS Quality leads to Prettier Formatting; TS Quality leads to TypeScript Type Checking; ESLint Linting leads to @typescript-eslint TS Rules; Prettier Formatting leads to Opinionated No Config Needed; and 1 more links.
    A[TS Quality] --> B[ESLint<br/>Linting]
    A --> C[Prettier<br/>Formatting]
    A --> D[TypeScript<br/>Type Checking]

    B --> E[@typescript-eslint<br/>TS Rules]
    C --> F[Opinionated<br/>No Config Needed]
    D --> G[strict: true<br/>Maximum Safety]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class A blue
    class B orange
    class C teal
    class D purple
```
