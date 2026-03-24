---
title: "Reproducibility First"
description: Development environments and builds should be reproducible from the start
category: explanation
subcategory: principles
tags:
  - principles
  - reproducibility
  - environment
  - determinism
  - version-pinning
created: 2025-12-28
updated: 2025-12-28
---

# Reproducibility First

**Development environments and builds should be reproducible from the start.** Anyone should be able to clone the repository and get a consistent, working environment without "works on my machine" problems. Reproducibility eliminates friction and enables global collaboration.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of democratizing Islamic enterprise by enabling global contributors to work consistently regardless of location or local system configuration.

**How this principle serves the vision:**

- **Global Collaboration**: Contributors from Jakarta, Cairo, Istanbul, or London get identical development environments. Geographic and system diversity doesn't create barriers. Islamic enterprise development becomes truly global
- **Lowers Contribution Barriers**: New contributors don't waste days fighting environment setup. Clone repository, follow automated setup, start contributing to Shariah-compliant systems within hours, not weeks
- **Consistent Builds**: Shariah-compliant applications build identically on developer machines, CI servers, and production. No "works on my machine but fails in CI" mysteries that discourage contributors
- **Onboarding Efficiency**: Islamic finance experts who are learning to code can focus on understanding business logic, not debugging Node.js version conflicts or npm installation issues
- **Reliable Automation**: Reproducible environments enable reliable CI/CD, automated testing, and deployment. Quality automation requires consistency

**Vision alignment**: Open-source Islamic enterprise thrives when contribution is frictionless. Reproducibility democratizes development - anyone, anywhere can participate without requiring deep DevOps expertise or specific system configurations.

## What

**Reproducibility** means:

- Same repository clone produces identical environment
- Same inputs produce identical builds
- Version-controlled environment configuration
- Explicit dependency versions (no "latest")
- Documented setup process
- Deterministic builds (same commit = same artifact)

**Non-reproducibility** means:

- "Works on my machine" problems
- Different builds from same code
- Implicit system dependencies
- Floating version numbers
- Undocumented setup steps
- Non-deterministic builds

## Why

### Benefits of Reproducibility

1. **Eliminates Environment Bugs**: No more debugging "works locally but fails in CI"
2. **Faster Onboarding**: New contributors get working environment quickly
3. **Consistent Collaboration**: All team members work with same tools/versions
4. **Reliable Automation**: CI/CD systems produce consistent results
5. **Audit Trail**: Can reproduce exact build from any historical commit
6. **Trust**: Stakeholders can verify builds independently

### Problems with Non-Reproducibility

1. **Lost Time**: Hours wasted debugging environment differences
2. **Contribution Friction**: Contributors give up during frustrating setup
3. **Hidden Bugs**: Environment differences mask or create bugs
4. **Unreliable Releases**: Builds differ between machines
5. **Knowledge Silos**: Only certain people can build/deploy
6. **Security Risks**: Can't reproduce builds to verify integrity

### When to Apply Reproducibility

**Apply from day one for**:

- PASS: Runtime versions (Node.js, npm, Python, Java)
- PASS: Dependency versions (package-lock.json, yarn.lock)
- PASS: Build tool versions (webpack, TypeScript)
- PASS: Development tools (linters, formatters)
- PASS: Environment configuration (env vars, config files)

**Acceptable variance for**:

- Operating system (macOS, Linux, Windows) - document any OS-specific quirks
- Editor choice (VS Code, Vim, IntelliJ) - but provide recommended config
- Local development preferences (ports, directories) - use .env.local

## How It Applies

### Version Pinning with Volta

**Context**: Ensuring consistent Node.js and npm versions.

PASS: **Reproducible (Our Approach)**:

```json
// package.json
{
  "name": "open-sharia-enterprise",
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}
```

**Why this works**:

- Volta automatically uses specified versions when entering directory
- All developers get Node.js 24.13.1 and npm 11.10.1
- CI/CD uses same versions
- No manual version management needed

FAIL: **Non-reproducible (Avoid)**:

```bash
# FAIL: Just use whatever Node.js you have installed
node --version  # Developer A: v20.x
node --version  # Developer B: v22.x
node --version  # CI: v23.x

# Different behavior across environments
```

**Why this fails**: Different Node.js versions have different APIs, bugs, performance characteristics. Code works differently on each system.

### Lockfiles for Deterministic Dependencies

**Context**: Ensuring identical dependency trees.

PASS: **Reproducible (Required)**:

```bash
# Install from lockfile - exact versions
npm ci

# Lockfile in git - committed
git add package-lock.json
git commit -m "chore: update dependencies"
```

**Why this works**: `package-lock.json` locks exact versions of all dependencies and sub-dependencies. `npm ci` installs exactly what's in lockfile.

FAIL: **Non-reproducible (Avoid)**:

```bash
# FAIL: Install from package.json - floating versions
npm install  # Gets latest within semver range

# FAIL: Lockfile gitignored
echo "package-lock.json" >> .gitignore
```

**Why this fails**:

- `npm install` may install different versions on different machines
- Without lockfile in git, each developer gets different dependency tree
- "Works on my machine" because you have different versions

### Explicit Version Ranges

**Context**: Specifying dependency versions in package.json.

PASS: **Reproducible (Recommended)**:

```json
{
  "dependencies": {
    "@nrwl/react": "19.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "prettier": "3.1.0",
    "husky": "8.0.3"
  }
}
```

**Why this works**: Exact versions mean lockfile is more stable. Upgrades are deliberate, not accidental.

**Acceptable with lockfile**:

```json
{
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

**Why this is acceptable**: With `package-lock.json` committed, everyone gets same version. `^` allows patch updates when you run `npm update`.

FAIL: **Non-reproducible (Avoid)**:

```json
{
  "dependencies": {
    "react": "*",
    "express": "latest"
  }
}
```

**Why this fails**: `*` and `latest` mean "any version". Completely non-deterministic.

### Environment Configuration

**Context**: Managing environment variables.

PASS: **Reproducible (Best Practice)**:

```bash
# .env.example (committed to git)
DATABASE_URL=postgresql://localhost:5432/mydb
API_PORT=3000
NODE_ENV=development

# .env (gitignored, copied from .env.example)
DATABASE_URL=postgresql://localhost:5432/mydb
API_PORT=3000
NODE_ENV=development
JWT_SECRET=actual-secret-value
```

**Setup instructions**:

```bash
cp .env.example .env
# Edit .env with your local values
```

**Why this works**:

- `.env.example` documents required environment variables
- Developers copy and customize for local setup
- Secrets stay in gitignored `.env`
- Everyone knows what config is needed

FAIL: **Non-reproducible (Avoid)**:

```bash
# No example file
# Undocumented env vars
# Developer has to guess what's needed
```

**Why this fails**: New contributors don't know what environment variables to set. Trial and error.

### Containerization for Complex Environments

**Context**: Applications with multiple services (database, cache, queue).

PASS: **Reproducible (Excellent for complex setups)**:

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:16.1
    environment:
      POSTGRES_DB: ose_dev
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"

  redis:
    image: redis:7.2.4
    ports:
      - "6379:6379"

  app:
    build: .
    volumes:
      - .:/app
    environment:
      DATABASE_URL: postgresql://developer:dev_password@postgres:5432/ose_dev
      REDIS_URL: redis://redis:6379
```

**Setup**:

```bash
docker-compose up
# Identical environment for all developers
```

**Why this works**:

- Exact versions for all services (postgres:16.1, redis:7.2.4)
- Same configuration for everyone
- Works identically on macOS, Linux, Windows
- Easy to add new services

### Documentation of Setup Process

**Context**: Onboarding new contributors.

PASS: **Reproducible (Required)**:

```markdown
## Environment Setup

1. Install Volta: `curl https://get.volta.sh | bash`
2. Clone repository: `git clone https://github.com/org/repo.git`
3. Enter directory: `cd repo` (Volta auto-activates correct Node.js/npm)
4. Install dependencies: `npm ci`
5. Copy environment: `cp .env.example .env`
6. Start development: `npm run dev`

Expected result: Application running at http://localhost:3000
```

**Why this works**: Step-by-step instructions. Anyone can follow. Clear success criteria.

FAIL: **Non-reproducible (Avoid)**:

```markdown
## Setup

Install dependencies and run it.
```

**Why this fails**: No specifics. Assumes too much knowledge. Leaves room for errors.

## Anti-Patterns

### "Works on My Machine"

FAIL: **Problem**: Code works locally but fails in CI/production.

```bash
# Developer's machine
node --version  # v24.13.1 (local)
npm test        # PASS: All pass

# CI server
node --version  # v20.x (different)
npm test        # FAIL: Failures
```

**Why it's bad**: Different environments = different behavior. Wastes time debugging environment instead of code.

PASS: **Solution**: Use Volta to pin versions across all environments.

### Floating Dependencies

FAIL: **Problem**: Different dependency versions on each install.

```json
// package.json
{
  "dependencies": {
    "express": "^4.0.0"
  }
}
// No package-lock.json in git

// Monday: npm install gets express@4.18.0
// Friday: npm install gets express@4.19.0 (patch release)
// Different behavior
```

**Why it's bad**: Non-deterministic. Builds differ. Hard to debug.

PASS: **Solution**: Commit `package-lock.json`. Use `npm ci` in CI.

### Undocumented System Dependencies

FAIL: **Problem**: Code requires specific system packages but doesn't document them.

```typescript
// Uses native crypto library
import crypto from "crypto";

// Developer A: Has OpenSSL 3.x - works
// Developer B: Has OpenSSL 1.1 - fails
// No documentation of requirement
```

**Why it's bad**: Contributors waste time discovering hidden dependencies.

PASS: **Solution**: Document system dependencies in README.

```markdown
## System Requirements

- OpenSSL 3.x or higher
- Python 3.11 (for node-gyp native builds)
```

### Manual Environment Setup

FAIL: **Problem**: Complex manual steps required.

```bash
# Undocumented tribal knowledge
# 1. Install Node.js 24.x
# 2. Install specific version of Python for node-gyp
# 3. Set environment variable XYZ
# 4. Download file from internal server
# 5. Configure obscure setting

# Only senior developers know all steps
```

**Why it's bad**: High barrier to contribution. Knowledge silos.

PASS: **Solution**: Automate with scripts or containers.

```bash
# setup.sh
./scripts/install-dependencies.sh
./scripts/configure-environment.sh
./scripts/seed-database.sh
```

## PASS: Best Practices

### 1. Pin Runtime Versions

**Use version managers**:

```json
// package.json
{
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}
```

**Alternative tools**: nvm, asdf, mise

### 2. Commit Lockfiles

**Always commit dependency locks**:

```bash
git add package-lock.json yarn.lock pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### 3. Use CI to Enforce Reproducibility

**Check lockfile is up-to-date**:

```yaml
# .github/workflows/ci.yml
- name: Check lockfile
  run: |
    npm ci
    git diff --exit-code package-lock.json
```

### 4. Document System Dependencies

**Clear requirements**:

```markdown
## Prerequisites

- Node.js 24.13.1 (Volta managed)
- npm 11.10.1 (Volta managed)
- Docker 24.x (for local services)
- PostgreSQL 16.x (Docker or local)
```

### 5. Provide Example Configuration

**Committed example files**:

```bash
.env.example          # Environment variables
docker-compose.yml    # Local services
.vscode/settings.json # Editor config (optional)
```

### 6. Automate Setup

**Setup script**:

```bash
#!/bin/bash
# setup.sh

echo "Setting up Open Sharia Enterprise..."

# Check Volta installed
if ! command -v volta &> /dev/null; then
    echo "Installing Volta..."
    curl https://get.volta.sh | bash
fi

# Install dependencies
npm ci

# Copy environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env - please update with your values"
fi

# Start services
docker-compose up -d

echo "Setup complete! Run 'npm run dev' to start"
```

### 7. Use Deterministic Build Tools

**Nx for monorepo builds**:

```bash
# Nx caches builds deterministically
nx build my-app
# Same inputs = same output = cache hit
```

## Example from This Repository

**Evidence of Reproducibility First**:

### 1. Volta Configuration

```json
// package.json
{
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}
```

**Result**: All developers and CI use identical Node.js and npm versions.

### 2. Lockfile Committed

```bash
git ls-files | grep lock
package-lock.json
```

**Result**: Deterministic dependency installation with `npm ci`.

### 3. Documented Setup

```markdown
## Environment Setup (from AGENTS.md)

The project uses **Volta** for Node.js and npm version management:

- Node.js: 24.13.1 (LTS)
- npm: 11.10.1

These versions are pinned in package.json under the volta field.
```

**Result**: Clear instructions for new contributors.

### 4. Automated Git Hooks

```bash
# Husky hooks install automatically
npm install
# Hooks configured consistently for all developers
```

**Result**: Same git hooks for everyone after `npm install`.

## Relationship to Other Principles

- [Automation Over Manual](./automation-over-manual.md) - Automate environment setup
- [Explicit Over Implicit](./explicit-over-implicit.md) - Explicit version pinning
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Simple, consistent environments

## Related Conventions

- [Reproducible Environments](../../development/workflow/reproducible-environments.md) - Implementation practices
- [Code Quality Convention](../../development/quality/code.md) - Automated consistency
- [Hugo Development](../../development/hugo/development.md) - Reproducible builds

## References

**Version Management**:

- [Volta](https://volta.sh/) - Hassle-free JavaScript tool manager
- [nvm](https://github.com/nvm-sh/nvm) - Node Version Manager
- [asdf](https://asdf-vm.com/) - Multi-language version manager

**Dependency Locking**:

- [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci) - Clean install from lockfile
- [Why lockfiles matter](https://snyk.io/blog/what-is-package-lock-json/)
- [Deterministic Builds](https://reproducible-builds.org/)

**Containerization**:

- [Docker](https://www.docker.com/) - Containerization platform
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container orchestration
- [Dev Containers](https://containers.dev/) - Development containers for VS Code

**Build Reproducibility**:

- [Nx Build Caching](https://nx.dev/concepts/how-caching-works) - Deterministic builds
- [Reproducible Builds](https://reproducible-builds.org/docs/) - Best practices

---

**Last Updated**: 2025-12-28
