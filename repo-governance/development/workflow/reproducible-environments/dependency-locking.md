---
description: Lockfile discipline — guarded npm ci, hosted-CI freshness checks, and lockfile PR review practices.
when_to_use: Use when installing dependencies, wiring CI lockfile checks, or reviewing a PR that changes package-lock.json.
---

# Dependency Locking

## Package Lockfiles

**package-lock.json ensures deterministic installs**:

- Locks exact versions of all dependencies
- Locks exact versions of sub-dependencies
- Ensures identical dependency tree across machines
- Must be committed to git

## Using npm ci

**Prefer npm ci over npm install**:

```bash
# PASS: Development: Install from lockfile
./hippo run --class transactional --resource-tier standard --disk-path . -- npm ci

# FAIL: Do not substitute npm install; it may update the lockfile.
```

**Why npm ci**:

- Installs exactly what's in package-lock.json
- Deletes node_modules before install (clean slate)
- Fails if package.json and lockfile don't match
- Faster than npm install
- Deterministic (same result every time)

## CI/CD Configuration

**Enforce lockfile freshness**:

These commands run natively inside the hosted workflow because the CI runner owns its capacity.

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

## Lockfile Best Practices

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
