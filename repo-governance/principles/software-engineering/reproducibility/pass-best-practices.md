---
description: Summarizes seven concrete best practices for reproducible environments, from pinning runtimes to using deterministic build tools.
when_to_use: Use as a quick checklist when setting up or auditing a project's environment and build reproducibility.
---

# PASS: Best Practices

## 1. Pin Runtime Versions

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

## 2. Commit Lockfiles

**Always commit dependency locks**:

```bash
git add package-lock.json yarn.lock pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

## 3. Use CI to Enforce Reproducibility

**Check lockfile is up-to-date**:

```yaml
# .github/workflows/ci.yml
- name: Check lockfile
  run: |
    npm ci
    git diff --exit-code package-lock.json
```

## 4. Document System Dependencies

**Clear requirements**:

```markdown
## Prerequisites

- Node.js 24.13.1 (Volta managed)
- npm 11.10.1 (Volta managed)
- Podman, rootless (for local services)
- PostgreSQL 16.x (Podman or local)
```

## 5. Provide Example Configuration

**Committed example files**:

```bash
.env.example          # Environment variables
docker-compose.yml    # Local services
.vscode/settings.json # Editor config (optional)
```

## 6. Automate Setup

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

# Start services with the explicitly selected Compose provider
export PODMAN_COMPOSE_PROVIDER=podman-compose
podman compose up -d

echo "Setup complete! Run 'npm run dev' to start"
```

## 7. Use Deterministic Build Tools

**Nx for monorepo builds**:

```bash
# Nx caches builds deterministically
nx build my-app
# Same inputs = same output = cache hit
```
