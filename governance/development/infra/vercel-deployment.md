---
title: "Vercel Deployment Convention"
description: Rules for configuring vercel.json when Nx build targets must run before the framework build
category: explanation
subcategory: development
tags:
  - vercel
  - deployment
  - nx
  - build
  - monorepo
created: 2026-03-26
updated: 2026-03-26
---

# Vercel Deployment Convention

Rules for configuring `vercel.json` when an app has Nx build-time targets that must run before the
framework build command.

## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Build-time prerequisites must be declared explicitly in `vercel.json`. Relying on Nx
  orchestration to handle them during a Vercel deployment is implicit and will fail silently at
  runtime.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**:
  The build on Vercel must produce the same outputs as a local `nx build`. All steps that `nx
build` depends on must also run during the Vercel build.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Nx Target Standards](./nx-targets.md)**: The `build` target in `project.json` remains the
  source of truth for what must run. `vercel.json` replicates the `dependsOn` chain — it does not
  replace it.

## The Core Rule

**If the `build` target in `project.json` has a `dependsOn` list, every target in that list MUST
also be replicated in `vercel.json`'s `buildCommand`.**

Vercel runs the framework's default build command directly (e.g., `next build`). It does NOT
invoke `nx build` and does NOT resolve Nx `dependsOn` chains. Any target declared in `dependsOn`
is invisible to Vercel unless it is explicitly added to `buildCommand`.

## Why This Matters

Nx `dependsOn` is an orchestration instruction for the Nx task runner. When you run `nx build
ayokoding-web` locally, Nx resolves the dependency graph and runs `generate-indexes` and
`generate-search-data` first, then `next build`.

Vercel bypasses Nx entirely. It calls `next build` (or the configured `buildCommand`) in the app
directory. No Nx, no dependency graph, no `dependsOn` resolution.

If a build-time step is missing, the app still deploys — but runtime behavior is broken. The
generated files that `next build` expected to find are absent, and the runtime fallback (if any)
runs in a constrained serverless environment where it may exceed function timeout limits.

## The Pattern

### `project.json` (source of truth)

```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "next build",
    "cwd": "{projectRoot}"
  },
  "dependsOn": ["generate-indexes", "generate-search-data"]
}
```

### `vercel.json` (must mirror the `dependsOn` chain)

```json
{
  "buildCommand": "npx tsx src/scripts/generate-indexes.ts && npx tsx src/scripts/generate-search-data.ts && next build"
}
```

The `buildCommand` must execute all `dependsOn` targets (in dependency order) followed by the
framework build command.

## Next.js Standalone Output: `outputFileTracingIncludes`

For Next.js apps using `output: "standalone"`, generated files are only included in the Vercel
deployment bundle if they are declared in `outputFileTracingIncludes` inside `next.config.ts`.

Next.js standalone output traces file dependencies statically. Generated files (e.g., content
indexes, search data) created at build time are not automatically detected as runtime dependencies
unless explicitly listed.

**Pattern** (`next.config.ts`):

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./generated/**/*"],
  },
};
```

Include any directory that contains build-time generated files the runtime depends on.

## Current State of Vercel Apps

| App               | `vercel.json` location             | `buildCommand` status                             | Notes                                                    |
| ----------------- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| `ayokoding-web`   | `apps/ayokoding-web/vercel.json`   | Set (fixed after incident)                        | Runs `generate-indexes` and `generate-search-data` first |
| `organiclever-fe` | `apps/organiclever-fe/vercel.json` | Not set (no build-time targets at present)        | At risk if build-time targets are added                  |
| `oseplatform-web` | `apps/oseplatform-web/vercel.json` | Uses custom `build.sh` via `@vercel/static-build` | Hugo static build; no Nx involvement                     |

## When to Check

Check and update `vercel.json` whenever:

1. **Adding a new Nx target** to a Vercel-deployed app that feeds into `build` via `dependsOn`
2. **Reordering `dependsOn` targets** — order matters; `buildCommand` must match
3. **Adding a new Vercel-deployed app** to the monorepo — audit `project.json` for `dependsOn`
   before writing `vercel.json`
4. **Removing a `dependsOn` target** — remove the corresponding step from `buildCommand` to avoid
   running unnecessary work

## Common Pitfalls

### Pitfall 1: Adding a `dependsOn` target without updating `vercel.json`

**Scenario**: A developer adds a new code generation step to the `build` target's `dependsOn` in
`project.json`. Local builds work. The Vercel deployment succeeds but the generated files are
absent at runtime.

**Fix**: Immediately add the new step to `buildCommand` in `vercel.json` in the same commit.

### Pitfall 2: Assuming Nx orchestration applies to Vercel builds

**Scenario**: A developer runs `nx build ayokoding-web` and confirms the full pipeline works, then
assumes Vercel will do the same.

**Fix**: `nx build` and Vercel's build are independent pipelines. `vercel.json`'s `buildCommand`
is the only mechanism for controlling what Vercel runs.

### Pitfall 3: Generated files absent from standalone bundle

**Scenario**: A Next.js app with `output: "standalone"` generates files at build time and reads
them at runtime. The Vercel deployment includes the generated files, but the deployed function
cannot find them because they were not traced as dependencies.

**Fix**: Declare the generated directories in `outputFileTracingIncludes` in `next.config.ts`.

### Pitfall 4: Wrong working directory in `buildCommand`

**Scenario**: A `buildCommand` script path is written as if the working directory is the
repository root, but Vercel runs `buildCommand` from the app's directory (as configured in the
Vercel project settings).

**Fix**: Confirm the Vercel project's root directory setting. Scripts in `buildCommand` run
relative to that directory. In this monorepo, `buildCommand` runs from the app directory (e.g.,
`apps/ayokoding-web/`).

## Examples

### PASS: `ayokoding-web` — `buildCommand` mirrors `dependsOn`

`apps/ayokoding-web/project.json`:

```json
"build": {
  "dependsOn": ["generate-indexes", "generate-search-data"]
}
```

`apps/ayokoding-web/vercel.json`:

```json
{
  "buildCommand": "npx tsx src/scripts/generate-indexes.ts && npx tsx src/scripts/generate-search-data.ts && next build"
}
```

Both entries are present and in the same order.

### FAIL: `dependsOn` target added but `vercel.json` not updated

`apps/ayokoding-web/project.json`:

```json
"build": {
  "dependsOn": ["generate-indexes", "generate-search-data", "generate-sitemaps"]
}
```

`apps/ayokoding-web/vercel.json`:

```json
{
  "buildCommand": "npx tsx src/scripts/generate-indexes.ts && npx tsx src/scripts/generate-search-data.ts && next build"
}
```

`generate-sitemaps` runs locally via Nx but is absent from `buildCommand`. Vercel deployments
produce an app without the generated sitemaps.

## Validation

The `repo-governance-checker` agent validates that:

- Any `build` target with a non-empty `dependsOn` list in `project.json` has a `buildCommand` in
  `vercel.json` that includes equivalent steps
- Next.js apps using `output: "standalone"` with a `generated/` directory declare it in
  `outputFileTracingIncludes`

## References

**Related Development Standards:**

- [Nx Target Standards](./nx-targets.md) - Canonical target names and `dependsOn` patterns
- [GitHub Actions Workflow Naming Convention](./github-actions-workflow-naming.md) - Related CI/CD
  naming convention

**Agents:**

- `repo-governance-checker` - Validates `vercel.json` build command alignment
- `repo-governance-fixer` - Corrects misaligned `buildCommand` entries
