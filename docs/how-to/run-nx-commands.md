---
title: How to Run Nx Commands
description: Common Nx workflows and commands for working with the monorepo
category: how-to
tags:
  - nx
  - monorepo
  - commands
  - workflows
created: 2025-11-29
---

# How to Run Nx Commands

This guide covers common Nx workflows and commands for working with the monorepo.

## Basic Project Commands

> **Standard target names**: All target names follow [Nx Target Standards](../../governance/development/infra/nx-targets.md). Use `test:quick` for the pre-push gate, `test:unit` for isolated unit tests, `dev` for development servers, `start` for production server mode. Avoid `nx test`, `nx serve`, and other non-standard names.

### Run a Single Project

```bash
# Build a specific project
nx build [project-name]

# Run the fast pre-push quality gate
nx run [project-name]:test:quick

# Run isolated unit tests
nx run [project-name]:test:unit

# Lint a specific project
nx lint [project-name]

# Start development server for an app
nx dev [app-name]

# Start production server for an app
nx start [app-name]
```

**Examples**:

```bash
nx build ts-utils                    # Build library
nx run ts-utils:test:quick           # Fast quality gate (pre-push)
nx run ts-utils:test:unit            # Isolated unit tests
nx dev customer-portal               # Start Next.js dev server
nx build customer-portal             # Build Next.js app
```

### Run Multiple Projects

```bash
# Build all projects
nx run-many -t build

# Run fast quality gate across all projects
nx run-many -t test:quick

# Lint all projects
nx run-many -t lint

# Run multiple targets
nx run-many -t build lint
```

**Using npm scripts**:

```bash
npm run build    # Same as: nx run-many -t build
npm run lint     # Same as: nx run-many -t lint
```

### Run Specific Projects

```bash
# Build specific projects
nx run-many -t build -p ts-utils ts-components

# Run test:quick for specific projects
nx run-many -t test:quick -p ts-utils customer-portal
```

## Affected Commands

Affected commands only run tasks for projects that changed since the last commit (or specified base).

### Build Only What Changed

```bash
# Build affected projects (since main branch)
nx affected -t build

# Run fast quality gate for affected projects (pre-push standard)
nx affected -t test:quick

# Lint affected projects
nx affected -t lint

# Specify a different base
nx affected -t build --base=abc123
nx affected -t test:quick --base=origin/main
```

**Using npm scripts**:

```bash
npm run affected:build         # Same as: nx affected -t build
npm run affected:test:quick    # Same as: nx affected -t test:quick
npm run affected:lint          # Same as: nx affected -t lint
```

### Affected Graph

```bash
# View affected projects graph
nx affected:graph

# View affected projects graph (custom base)
nx affected:graph --base=origin/main
```

### Affected Detection in CI/CD

```bash
# In CI pipeline (GitHub Actions example)
nx affected -t build --base=origin/main --head=HEAD
nx affected -t test:quick --base=origin/main --head=HEAD
nx affected -t lint --base=origin/main --head=HEAD
```

## Dependency Graph

### View Full Dependency Graph

```bash
# Open dependency graph in browser
nx graph

# Using npm script
npm run graph
```

This opens an interactive visualization showing:

- All projects (apps and libs)
- Dependencies between projects
- Direction of dependencies

### View Specific Project Dependencies

```bash
# Show dependencies of a specific project
nx graph --focus=ts-utils

# Show what depends on a project
nx graph --focus=ts-utils --groupByFolder
```

### Export Graph

```bash
# Export graph as HTML
nx graph --file=dependency-graph.html

# Export graph as JSON
nx graph --file=dependency-graph.json
```

## Caching

Nx caches task outputs to speed up subsequent runs.

### Cache Behavior

```bash
# First build (executes task)
nx build ts-utils
# Output: Compiled successfully

# Second build (uses cache)
nx build ts-utils
# Output: [existing outputs match the cache, left as is]
```

### Clear Cache

```bash
# Clear all Nx cache
rm -rf .nx/cache

# Or clear specific project cache
nx reset
```

### Disable Cache (Development)

```bash
# Skip cache for a single run
nx build ts-utils --skip-nx-cache

# Skip cache for affected
nx affected -t build --skip-nx-cache
```

## Workspace Commands

### List All Projects

```bash
# List all projects in workspace
nx show projects

# List only apps
nx show projects --type=app

# List only libs
nx show projects --type=lib
```

### Show Project Details

```bash
# Show project configuration
nx show project ts-utils

# Show project graph
nx graph --focus=ts-utils
```

### Workspace Information

```bash
# Show Nx version
npx nx --version

# Show workspace information
nx report
```

## Common Workflows

### Development Workflow

**Starting a new feature**:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Start development server
nx dev customer-portal

# 3. Make changes to app or libs

# 4. Test changes
nx run ts-utils:test:quick
nx build customer-portal

# 5. View affected projects
nx affected:graph
```

### Testing Workflow

```bash
# 1. Run fast quality gate for changed projects (pre-push standard)
nx affected -t test:quick

# 2. Run test:quick for a specific project
nx run ts-utils:test:quick

# 3. Run isolated unit tests for a specific project
nx run ts-utils:test:unit

# 4. Run all test:quick targets
nx run-many -t test:quick
```

### Build Workflow

```bash
# 1. Build affected projects
nx affected -t build

# 2. Build specific project and its dependencies
nx build customer-portal
# (Automatically builds ts-utils first)

# 3. Build all projects
nx run-many -t build

# 4. Verify build outputs
ls libs/ts-utils/dist
ls apps/customer-portal/.next
```

### Pre-Commit Workflow

```bash
# 1. Check affected projects
nx affected:graph

# 2. Build affected
nx affected -t build

# 3. Run fast quality gate for affected (same as pre-push hook)
nx affected -t test:quick

# 4. Lint affected
nx affected -t lint

# 5. If all pass, commit changes
git add .
git commit -m "feat: add new feature"
```

## CI/CD Workflows

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
 build:
  runs-on: ubuntu-latest
  steps:
   - uses: actions/checkout@v3
    with:
     fetch-depth: 0  # Fetch all history for affected detection

   - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
     node-version: '24.13.1'

   - name: Install dependencies
    run: npm ci

   - name: Build affected
    run: nx affected -t build --base=origin/main --head=HEAD

   - name: Quick Tests (required status check before PR merge)
    run: nx affected -t test:quick --base=origin/main --head=HEAD

   - name: Lint affected
    run: nx affected -t lint --base=origin/main --head=HEAD
```

> **Note**: `test:quick` is the required GitHub Actions status check before PR merge. E2E tests (`test:e2e`) run separately on a scheduled cron job, not on every PR. See [Nx Target Standards](../../governance/development/infra/nx-targets.md) for the full execution model.

### Optimize CI with Caching

```yaml
- name: Cache Nx
 uses: actions/cache@v3
 with:
  path: .nx/cache
  key: nx-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
  restore-keys: |
   nx-${{ runner.os }}-
```

## Performance Tips

### Use Affected Commands in CI

Instead of rebuilding everything:

```bash
# ❌ Slow: Build everything
nx run-many -t build

# ✅ Fast: Build only affected
nx affected -t build

# ✅ Fast quality gate (pre-push and CI)
nx affected -t test:quick
```

### Use Parallel Execution

Nx automatically runs tasks in parallel when possible:

```bash
# Runs builds in parallel (respects dependency order)
nx run-many -t build --parallel=3
```

### Use Watch Mode for Development

```bash
# Watch mode for builds (if configured)
nx build ts-utils --watch
```

## Troubleshooting

### Cache Issues

**Problem**: Cached results are stale or incorrect

**Solution**:

```bash
# Clear Nx cache
nx reset

# Rebuild from scratch
nx build ts-utils --skip-nx-cache
```

### Dependency Issues

**Problem**: Changes to library don't trigger app rebuild

**Solution**:

```bash
# Check if dependency exists in graph
nx graph --focus=customer-portal

# Ensure library is built first
nx build ts-utils
nx build customer-portal
```

### Affected Detection Issues

**Problem**: Affected detection doesn't identify changed projects

**Solution**:

```bash
# Check git status
git status

# Ensure changes are committed or staged
git add .

# Use specific base
nx affected -t build --base=origin/main

# View affected graph to debug
nx affected:graph
```

## Advanced Commands

### Run Commands with Environment Variables

```bash
# Set environment variable for command
NODE_ENV=production nx build customer-portal

# Multiple environment variables
NODE_ENV=production DEBUG=true nx build customer-portal
```

### Run Custom Commands

```bash
# Run arbitrary command for all projects
nx run-many -t custom-script

# Run command for specific projects
nx run custom-target -p customer-portal
```

### Generate Dependency Report

```bash
# Export dependency graph as JSON
nx graph --file=graph.json

# Use jq to analyze dependencies
nx graph --file=graph.json | jq '.dependencies'
```

## Related Documentation

- [Nx Target Standards](../../governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and execution model
- [Add New App](./add-new-app.md)
- [Add New Library](./add-new-lib.md)
- [Monorepo Structure Reference](../reference/monorepo-structure.md)
- [Nx Configuration Reference](../reference/nx-configuration.md)
