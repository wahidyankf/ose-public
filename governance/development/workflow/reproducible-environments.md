---
title: Reproducible Environments
description: Practices for creating consistent, reproducible development and build environments
category: explanation
subcategory: development
tags:
  - development
  - reproducibility
  - volta
  - docker
  - environment
  - dependencies
created: 2025-12-28
updated: 2025-12-28
---

# Reproducible Environments

Practices for creating consistent, reproducible development and build environments. This document defines HOW to implement reproducibility across runtime versions, dependencies, configuration, and infrastructure.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: All environment configuration is explicit, version-controlled, and reproducible. Eliminates "works on my machine" problems through deterministic setup.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Environment setup automated through version managers (Volta), lockfiles, scripts, and containers. Manual setup steps eliminated or documented.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Runtime versions pinned explicitly (package.json volta field). Dependencies locked with exact versions (package-lock.json). No implicit system dependencies.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Use simple, proven tools (Volta, npm lockfiles, Docker) instead of complex custom solutions. Minimum configuration for maximum reproducibility.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](../quality/code.md)**: Reproducible environments enable consistent automated quality checks. Same Node.js/npm versions mean same Prettier, ESLint, and test results across machines.

- **[Trunk Based Development](./trunk-based-development.md)**: Reproducible CI/CD environments ensure consistent validation of commits to main branch. No environment-specific failures.

## Overview

Reproducible environments require:

1. **Runtime version management**: Volta for Node.js/npm pinning
2. **Dependency locking**: package-lock.json for deterministic installs
3. **Configuration management**: .env.example for required environment variables
4. **Container definitions**: Docker/docker-compose for complex setups
5. **Documentation**: Clear setup instructions for onboarding

## Runtime Version Management with Volta

### Why Volta

**Volta automatically manages Node.js and npm versions** per project:

- Versions specified in package.json
- Auto-switches when entering directory
- No manual version switching (nvm, asdf)
- Works on macOS, Linux, Windows
- Team members get same versions automatically

### Configuration

**package.json volta field**:

```json
{
  "name": "open-sharia-enterprise",
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  }
}
```

**What happens**:

```bash
cd open-sharia-enterprise
# Volta automatically activates Node.js 24.13.1 and npm 11.10.1

node --version  # v24.13.1 (same for everyone)
npm --version   # 11.10.1 (same for everyone)
```

### Installation

**One-time setup for contributors**:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Clone repository
git clone https://github.com/wahidyankf/open-sharia-enterprise.git
cd open-sharia-enterprise

# Volta auto-installs pinned Node.js/npm versions
# No manual version management needed
```

### CI/CD Integration

**GitHub Actions example**:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Install Volta
      - uses: volta-cli/action@v4

      # Volta uses versions from package.json
      - run: node --version # v24.13.1
      - run: npm --version # 11.10.1

      # Install dependencies
      - run: npm ci

      # Run tests with exact same environment as local
      - run: npm test
```

### When to Update Versions

**Update Node.js/npm when**:

- Security vulnerabilities in current versions
- New LTS release available
- Features needed from newer version
- Dependency requires newer runtime

**Update process**:

```bash
# Test with new version locally
volta pin node@24.12.0
npm test

# If tests pass, commit updated package.json
git add package.json
git commit -m "chore: update Node.js to 24.12.0"
```

## Dependency Locking

### Package Lockfiles

**package-lock.json ensures deterministic installs**:

- Locks exact versions of all dependencies
- Locks exact versions of sub-dependencies
- Ensures identical dependency tree across machines
- Must be committed to git

### Using npm ci

**Prefer npm ci over npm install**:

```bash
# PASS: Development: Install from lockfile
npm ci

# FAIL: Avoid in automated environments
npm install  # May update lockfile
```

**Why npm ci**:

- Installs exactly what's in package-lock.json
- Deletes node_modules before install (clean slate)
- Fails if package.json and lockfile don't match
- Faster than npm install
- Deterministic (same result every time)

### CI/CD Configuration

**Enforce lockfile freshness**:

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci

- name: Check lockfile is up-to-date
  run: |
    npm install --package-lock-only
    git diff --exit-code package-lock.json
```

**What this does**:

- npm ci installs from lockfile
- npm install --package-lock-only regenerates lockfile
- git diff fails if lockfile changed (package.json and lockfile out of sync)

### Lockfile Best Practices

**Always commit lockfiles**:

```bash
git add package-lock.json
git commit -m "chore: update dependencies"
```

**Never gitignore lockfiles**:

```bash
# FAIL: DO NOT add to .gitignore
# package-lock.json
```

**Review lockfile changes in PRs**:

- Large lockfile changes may indicate major dependency updates
- Check for unexpected version bumps
- Verify sub-dependency changes don't introduce vulnerabilities

## Environment Configuration

### .env Files

**Pattern**: Committed example, gitignored actual config.

**.env.example** (committed to git):

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/ose_dev
DATABASE_USER=developer
DATABASE_PASSWORD=dev_password

# API
API_PORT=3000
API_BASE_URL=http://localhost:3000

# External Services
PAYMENT_GATEWAY_URL=https://sandbox.payment.example.com
PAYMENT_API_KEY=your_api_key_here

# Feature Flags
ENABLE_EXPERIMENTAL_FEATURES=false
```

**.env** (gitignored, created by developers):

```bash
# Copy from .env.example
cp .env.example .env

# Edit with actual values
DATABASE_PASSWORD=actual_secure_password
PAYMENT_API_KEY=actual_api_key
```

**.gitignore**:

```
.env
.env.local
.env.*.local
```

### Loading Environment Variables

**Using dotenv**:

```typescript
// src/config/environment.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  },
  api: {
    port: parseInt(process.env.API_PORT || "3000", 10),
    baseUrl: process.env.API_BASE_URL,
  },
};
```

### Validation

**Validate required environment variables at startup**:

```typescript
// src/config/validate.ts
const requiredEnvVars = ["DATABASE_URL", "DATABASE_USER", "DATABASE_PASSWORD", "API_PORT", "PAYMENT_GATEWAY_URL"];

export function validateEnvironment(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Call at application startup
validateEnvironment();
```

## Containerization for Complex Environments

### Docker Compose for Local Development

**docker-compose.yml** (committed to git):

```yaml
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
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2.4
    ports:
      - "6379:6379"

  app:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://developer:dev_password@postgres:5432/ose_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**Starting local environment**:

```bash
docker-compose up
# All services start with exact same configuration
```

### Development Dockerfile

**Dockerfile.be.dev**:

```dockerfile
# Use specific version
FROM node:24.13.1-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies from lockfile
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

**Why this works**:

- Exact Node.js version (24.13.1)
- npm ci installs from lockfile (deterministic)
- Same environment for all developers
- Works identically on macOS, Linux, Windows

## Documentation

### README Setup Instructions

**Clear, step-by-step setup**:

````markdown
## Environment Setup

### Prerequisites

- [Volta](https://volta.sh/) - JavaScript tool manager (auto-installs Node.js/npm)
- [Docker](https://www.docker.com/) - For local services (PostgreSQL, Redis)
- Git - Version control

### Installation

1. **Install Volta**:

   ```bash
   curl https://get.volta.sh | bash
   ```
````

1. **Clone Repository**:

   ```bash
   git clone https://github.com/wahidyankf/open-sharia-enterprise.git
   cd open-sharia-enterprise
   ```

2. **Install Dependencies**:

   ```bash
   npm ci
   ```

   Volta automatically uses Node.js 24.13.1 and npm 11.10.1 (pinned in package.json).

3. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start Services**:

   ```bash
   docker-compose up -d
   ```

5. **Run Development Server**:

   ```bash
   npm run dev
   ```

6. **Verify Setup**:
   - Application: <http://localhost:3000>
   - API health: <http://localhost:3000/health>

### Troubleshooting

**Issue**: "node: command not found"

- **Solution**: Install Volta, then restart terminal

**Issue**: "Cannot connect to database"

- **Solution**: Ensure Docker is running and services started with `docker-compose up`

**Issue**: "Port 3000 already in use"

- **Solution**: Change API_PORT in .env file

````

### Development Workflow Documentation

**Document common tasks**:

```markdown
## Common Development Tasks

### Running Tests

```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
````

### Database Migrations

```bash
npm run db:migrate         # Run migrations
npm run db:rollback        # Rollback last migration
npm run db:seed            # Seed test data
```

### Code Quality

```bash
npm run lint               # Check code style
npm run format             # Auto-format with Prettier
npm run type-check         # TypeScript type checking
```

````

## Automated Setup Scripts

### setup.sh

**Automate repetitive setup steps**:

```bash
#!/bin/bash
set -e

echo "Setting up Open Sharia Enterprise development environment..."

# Check Volta installed
if ! command -v volta &> /dev/null; then
    echo " Volta not found. Installing..."
    curl https://get.volta.sh | bash
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"
fi

echo " Volta installed"

# Install dependencies
echo " Installing dependencies..."
npm ci

echo " Dependencies installed"

# Setup environment
if [ ! -f .env ]; then
    echo "️  Creating .env file..."
    cp .env.example .env
    echo " .env created (please update with your values)"
else
    echo " .env already exists"
fi

# Start Docker services
echo " Starting Docker services..."
docker-compose up -d

echo " Services started"

# Wait for database
echo " Waiting for database..."
sleep 5

# Run migrations
echo "️  Running database migrations..."
npm run db:migrate

echo " Migrations complete"

echo ""
echo "PASS: Setup complete!"
echo ""
echo "To start development server:"
echo "  npm run dev"
echo ""
echo "Application will be available at:"
echo "  http://localhost:3000"
````

**Usage**:

```bash
./scripts/setup.sh
```

## Testing Reproducibility

### Verification Script

**Verify environment matches expectations**:

```typescript
// scripts/verify-environment.ts
import { execSync } from "child_process";
import pkg from "../package.json";

function getVersion(command: string): string {
  return execSync(command, { encoding: "utf-8" }).trim();
}

function verify() {
  console.log("Verifying environment...\n");

  // Check Node.js version
  const nodeVersion = getVersion("node --version");
  const expectedNode = `v${pkg.volta.node}`;
  if (nodeVersion === expectedNode) {
    console.log(`PASS: Node.js: ${nodeVersion}`);
  } else {
    console.error(`FAIL: Node.js: Expected ${expectedNode}, got ${nodeVersion}`);
    process.exit(1);
  }

  // Check npm version
  const npmVersion = getVersion("npm --version");
  const expectedNpm = pkg.volta.npm;
  if (npmVersion === expectedNpm) {
    console.log(`PASS: npm: ${npmVersion}`);
  } else {
    console.error(`FAIL: npm: Expected ${expectedNpm}, got ${npmVersion}`);
    process.exit(1);
  }

  // Check lockfile exists
  const fs = require("fs");
  if (fs.existsSync("package-lock.json")) {
    console.log("PASS: package-lock.json exists");
  } else {
    console.error("FAIL: package-lock.json missing");
    process.exit(1);
  }

  console.log("\nPASS: Environment verification passed!");
}

verify();
```

**Run in CI**:

```yaml
- name: Verify environment
  run: npx ts-node scripts/verify-environment.ts
```

## Monorepo Considerations

### Nx Cache Configuration

**nx.json** (committed to git):

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

**Why this matters**:

- Nx caching is deterministic (same inputs = cache hit)
- Reproducible builds enable reliable caching
- Cache hits speed up CI/CD

### Workspace Dependencies

**Ensure consistent workspace configuration**:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@open-sharia-enterprise/ts-validation": ["libs/ts-validation/src/index.ts"],
      "@open-sharia-enterprise/ts-auth": ["libs/ts-auth/src/index.ts"]
    }
  }
}
```

**Reproducibility benefit**:

- Path mappings explicit in tsconfig
- All developers resolve imports identically
- TypeScript compilation deterministic

## Troubleshooting

### Common Issues

**"Different behavior locally vs CI"**:

- Check Node.js/npm versions match
- Verify using npm ci (not npm install)
- Check environment variables (.env vs CI secrets)
- Review lockfile is committed and up-to-date

**"Dependencies install differently on different machines"**:

- Ensure package-lock.json committed
- Use npm ci instead of npm install
- Check npm version matches (Volta should handle this)

**"Works on my machine but fails for others"**:

- Document system dependencies (OpenSSL, Python for node-gyp)
- Use Docker to eliminate system dependency variance
- Check for hardcoded paths (use relative paths)
- Review .env.example is up-to-date

## Migration Guide

### Adding Volta to Existing Project

1. **Install Volta** (team members):

   ```bash
   curl https://get.volta.sh | bash
   ```

2. **Pin versions** (project maintainer):

   ```bash
   volta pin node@24.13.1
   volta pin npm@11.10.1
   ```

   This updates package.json with volta field.

3. **Commit changes**:

   ```bash
   git add package.json
   git commit -m "chore: pin Node.js and npm versions with Volta"
   ```

4. **Update documentation** (README.md):
   - Add Volta to prerequisites
   - Update setup instructions
   - Document how Volta auto-manages versions

### Adding Docker to Existing Project

1. **Create docker-compose.yml**:

   ```yaml
   version: "3.8"
   services:
     postgres:
       image: postgres:16.1
       # ... configuration
   ```

2. **Create Dockerfile.be.dev**:

   ```dockerfile
   FROM node:24.13.1-alpine
   # ... configuration
   ```

3. **Update .gitignore**:

   ```
   # Docker volumes
   .docker/
   docker-volumes/
   ```

4. **Document Docker usage**:
   - Add Docker to prerequisites
   - Provide docker-compose up instructions
   - Document how to access services

## Related Documentation

- [Reproducibility First](../../principles/software-engineering/reproducibility.md) - WHY reproducibility matters
- [Code Quality Convention](../quality/code.md) - Automated quality in reproducible environments
- [No Machine-Specific Information in Commits](../quality/no-machine-specific-commits.md) - Preventing machine-specific paths and credentials from entering the repository
- [Trunk Based Development](./trunk-based-development.md) - Reproducible CI/CD for main branch
- [Hugo Development](../hugo/development.md) - Reproducible builds for Hugo sites

## References

**Version Management**:

- [Volta](https://volta.sh/) - Hassle-free JavaScript tool manager
- [volta-cli/action](https://github.com/volta-cli/action) - GitHub Action for Volta

**Dependency Management**:

- [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci) - Clean install from lockfile
- [package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json) - Lockfile format

**Containerization**:

- [Docker](https://www.docker.com/) - Container platform
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container orchestration

**Build Reproducibility**:

- [Nx Caching](https://nx.dev/concepts/how-caching-works) - Deterministic build caching
- [Reproducible Builds](https://reproducible-builds.org/) - Best practices

---

**Last Updated**: 2025-12-28
