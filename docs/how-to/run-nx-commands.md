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

This guide covers common Nx workflows and commands for working with the monorepo. Run local
compute from the repository root through the checksum-pinned `./hippo` consumer. Each independent
command gets one outer HIPPO boundary; do not wrap a root npm script that already provides one.

Use `ephemeral` for restartable builds, tests, checks, and read-only reports whose complete target
DAG writes only ignored/cache output; `service` for long-running or interactive processes; and
`transactional` for resets, generators, and any command whose dependency closure writes tracked or
explicitly requested report output. See
[Resource-Aware Development](../../repo-governance/development/practice/resource-aware-development.md)
for the governing class, retry, and serialization rules.

## Basic Project Commands

> **Standard target names**: All target names follow
> [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md). Use `test:quick` for
> the pre-push gate, `test:unit` for isolated unit tests, `dev` for development servers, and `start`
> for production server mode. Avoid `nx test`, `nx serve`, and other non-standard names.

### Run a Single Project

```bash
# Build a specific project
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build [project-name]

# Run the fast pre-push quality gate
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:quick

# Run isolated unit tests
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run [project-name]:test:unit

# Lint a specific project
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- lint [project-name]

# Start a development server for an app
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [app-name]

# Start production server mode for an app
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- start [app-name]
```

**Examples**:

```bash
# Build the library
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader

# Run its fast quality gate
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run fsharp-env-loader:test:quick

# Run its isolated unit tests
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run fsharp-env-loader:test:unit

# Start the application development server
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-app-web

# Build the application
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web
```

### Run Multiple Projects

Use the guarded root scripts when they exactly match the requested all-project operation:

```bash
# Build all projects
npm run build

# Run the fast quality gate across all projects
npm test

# Lint all projects
npm run lint

# Run every build and lint target through one transactional boundary
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build lint
```

The three transactional root scripts above already invoke `./hippo` because their complete project
DAG may reach tracked-output generators. HIPPO safely reuses an inherited fixed allocation, but
adding another wrapper is redundant and nonconforming with OSE's one-outer-boundary policy.

### Run Specific Projects

```bash
# Build specific projects
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build -p fsharp-env-loader ose-www

# Run test:quick for specific projects
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:quick -p fsharp-env-loader ose-app-web
```

## Affected Commands

Affected commands only run tasks for projects that changed since the last commit or the specified
base. The transactional root aliases already provide the outer HIPPO boundary because the selected
set may include a tracked-output generator.

### Build Only What Changed

```bash
# Build affected projects using the configured default base
npm run affected:build

# Run the fast quality gate for affected projects
npm run affected:test

# Lint affected projects
npm run affected:lint

# Specify a different base when the root alias does not express it
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build --base=abc123
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:quick --base=origin/main
```

### Affected Graph

Graph commands are interactive services unless they write a file:

```bash
# View the affected-project graph
npm run graph -- --affected

# View the affected-project graph using a custom base
npm run graph -- --affected --base=origin/main
```

### Affected Detection in Hosted CI

Hosted CI runners own their resource controls, so their commands remain native and are not wrapped
with the repository's local HIPPO consumer:

```bash
# Hosted CI runner-owned execution
npm exec nx -- affected -t build --base=origin/main --head=HEAD
npm exec nx -- affected -t test:quick --base=origin/main --head=HEAD
npm exec nx -- affected -t lint --base=origin/main --head=HEAD
```

## Dependency Graph

### View Full Dependency Graph

```bash
# Open the dependency graph in a browser through the guarded service script
npm run graph
```

This opens an interactive visualization showing:

- All projects (apps and libraries)
- Dependencies between projects
- Dependency direction

### View Specific Project Dependencies

```bash
# Show dependencies of a specific project
npm run graph -- --focus=fsharp-env-loader

# Show what depends on a project
npm run graph -- --focus=fsharp-env-loader --groupByFolder
```

### Export Graph

Writing an exported graph is transactional even though inspecting the graph is read-only:

```bash
# Export the graph as HTML
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- graph --file=dependency-graph.html

# Export the graph as JSON
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- graph --file=dependency-graph.json
```

## Caching

Nx caches task outputs to speed up subsequent runs.

### Cache Behaviour

```bash
# First build executes the task
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader
# Output: Compiled successfully

# Second build may use the cache
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader
# Output: [existing outputs match the cache, left as is]
```

### Clear the Cache

Resetting Nx mutates workspace cache and daemon state, so use the guarded transactional Nx script:

```bash
npm run nx -- reset
```

### Disable Cache During Development

```bash
# Skip cache for a single build
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader --skip-nx-cache

# Skip cache for affected builds while protecting possible tracked generators
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build --skip-nx-cache
```

## Workspace Commands

### List All Projects

The `nx:show` root script is an ephemeral, already-guarded read-only entrypoint:

```bash
# List all projects in the workspace
npm run nx:show -- projects

# List only apps
npm run nx:show -- projects --type=app

# List only libraries
npm run nx:show -- projects --type=lib
```

### Show Project Details

```bash
# Show project configuration
npm run nx:show -- project fsharp-env-loader

# Show the project graph interactively
npm run graph -- --focus=fsharp-env-loader
```

### Workspace Information

```bash
# Show the repository-pinned Nx version
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- --version

# Show workspace information
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- report
```

## Common Workflows

### Development Workflow

**Starting a new feature**:

```bash
# 1. Pull the latest changes; this is not a compute-bearing Nx command
git pull origin main

# 2. Start the development server in a dedicated terminal
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-app-web
```

After making changes, use another terminal for restartable checks:

```bash
# 3. Test and build the changed surfaces
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run fsharp-env-loader:test:quick
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web

# 4. Inspect the affected graph interactively
npm run graph -- --affected
```

### Testing Workflow

```bash
# 1. Run the fast quality gate for changed projects
npm run affected:test

# 2. Run test:quick for a specific project
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run fsharp-env-loader:test:quick

# 3. Run isolated unit tests for a specific project
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run fsharp-env-loader:test:unit

# 4. Run every test:quick target
npm test
```

### Build Workflow

```bash
# 1. Build affected projects
npm run affected:build

# 2. Build a specific project; Nx honors dependencies within this DAG
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web

# 3. Build all projects
npm run build

# 4. Verify build outputs; these reads do not need HIPPO admission
ls libs/fsharp-env-loader/bin
ls apps/ose-app-web/.next
```

### Pre-Commit Workflow

```bash
# 1. Inspect the affected graph interactively
npm run graph -- --affected

# 2. Build, test, and lint affected projects
npm run affected:build
npm run affected:test
npm run affected:lint

# 3. If all checks pass, stage and commit the intended paths
git add [paths]
git commit -m "feat: add new feature"
```

Independent guarded commands may overlap only when they have no dependency, shared-output, or
correctness edge. Wait for a producer before starting a consumer, and never overlap commands that
write the same output tree. Nx continues to enforce dependencies inside one admitted command.

## CI/CD Workflows

### GitHub Actions Example

This hosted workflow is runner-owned. Keep its native concurrency controls and do not wrap its
commands with the local `./hippo` consumer.

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Fetch all history for affected detection

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "24.13.1"

      - name: Install dependencies
        run: npm ci

      - name: Build affected
        run: npm exec nx -- affected -t build --base=origin/main --head=HEAD

      - name: Quick Tests (required status check before PR merge)
        run: npm exec nx -- affected -t test:quick --base=origin/main --head=HEAD

      - name: Lint affected
        run: npm exec nx -- affected -t lint --base=origin/main --head=HEAD
```

> **Note**: `test:quick` is the required GitHub Actions status check before PR merge. Run impacted
> Integration (`test:integration`) and E2E (`test:e2e`) targets manually during development or
> review; scheduled workflows run the complete suites. Neither runtime layer runs on every PR. See
> [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) for the full execution
> model.

### Optimize CI with Caching

This cache is also owned by the hosted runner:

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

### Use Affected Commands in Hosted CI

Avoid rebuilding everything on the runner:

```bash
# Slow: build everything on the hosted runner
npm exec nx -- run-many -t build

# Faster: build only affected projects on the hosted runner
npm exec nx -- affected -t build

# Fast quality gate on the hosted runner
npm exec nx -- affected -t test:quick
```

These examples remain native because hosted CI owns their capacity. Local equivalents use the
guarded `affected:*` npm scripts.

### Use Allocation-Driven Parallel Execution Locally

Nx automatically runs independent tasks in parallel when possible:

```bash
# The root script provides one transactional HIPPO boundary for the complete build DAG
npm run build
```

Do not hard-code a repository-wide worker count. HIPPO supplies the admitted CPU allocation through
`NX_PARALLEL`; a lower positive caller value survives, while a higher value is clamped to the
reservation. Allocation changes fan-out, not the Nx dependency graph or any documented
shared-output or correctness serialization.

### Use Watch Mode for Development

```bash
# Watch mode is a long-running service
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader --watch
```

## Troubleshooting

### Cache Issues

**Problem**: Cached results are stale or incorrect

**Solution**:

```bash
# Reset cache and daemon state transactionally
npm run nx -- reset

# Rebuild from scratch with a restartable ephemeral command
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader --skip-nx-cache
```

### Dependency Issues

**Problem**: Changes to a library do not trigger an app rebuild

**Solution**:

```bash
# Check whether the dependency exists in the interactive graph
npm run graph -- --focus=ose-app-web

# If manual builds are required, wait for the producer before starting the consumer
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build fsharp-env-loader
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web
```

The two builds above deliberately remain sequential because the application consumes the library
output. Prefer one Nx DAG command when the project graph already represents that edge.

### Affected Detection Issues

**Problem**: Affected detection does not identify changed projects

**Solution**:

```bash
# Inspect and stage the intended Git state
git status
git add [paths]

# Use a specific base for affected detection
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build --base=origin/main

# View the affected graph to debug interactively
npm run graph -- --affected --base=origin/main
```

## Advanced Commands

### Run Commands with Environment Variables

Set caller environment variables before the HIPPO boundary:

```bash
# Set one environment variable for the command
NODE_ENV=production ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web

# Set multiple environment variables
NODE_ENV=production DEBUG=true ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build ose-app-web
```

Do not manually raise `NX_PARALLEL`; the wrapper supplies or clamps it to the admitted allocation.

### Run Custom Targets and Generators

Classify a custom target by what it does rather than by its name:

```bash
# A restartable read-only custom check is ephemeral
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-app-web:custom-check

# A generator writes tracked output, so use the transactional root Nx script
npm run nx -- generate [plugin]:[generator] [name]
```

If a custom target writes tracked files, shared cache state, or an indivisible output, run it through
the transactional `npm run nx -- ...` entrypoint. Keep dependent or same-output targets serialized.

### Generate a Dependency Report

```bash
# Exporting the graph writes a report and is transactional
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- graph --file=graph.json

# Analyze the completed report without another HIPPO admission
jq '.dependencies' graph.json
```

## Related Documentation

- [Resource-Aware Development](../../repo-governance/development/practice/resource-aware-development.md) - Local HIPPO admission, workload classes, worker allocation, and correctness boundaries
- [Nx Target Standards](../../repo-governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules, and execution model
- [Add New App](./add-new-app.md)
- [Add New Library](./add-new-lib.md)
- [Monorepo Structure Reference](../reference/monorepo-structure.md)
- [Nx Configuration Reference](../reference/nx-configuration.md)
