---
description: Checklists for adding a new libs/* dependency or shared library, plus the four most common Docker monorepo build pitfalls and their fixes.
when_to_use: Use when adding a new shared library dependency to an app's Dockerfile, creating a new shared library, or diagnosing a recurring Docker build failure.
---

# Checklists and Common Pitfalls

The Dockerfile and docker-compose items in the checklists below change declarative configuration, so `swe-developer`
makes them, per [SWE Delegation](../../agents/swe-delegation.md).

## Checklist: When an App Gains a New `libs/*` Dependency

When an app adds an import from a shared library (e.g., `@open-sharia-enterprise/ts-new-lib`):

- [ ] Add `COPY libs/ts-new-lib/src/ ./node_modules/@open-sharia-enterprise/ts-new-lib/src/` to the
      app's Dockerfile (after `npm ci`)
- [ ] Add `COPY libs/ts-new-lib/package.json ./node_modules/@open-sharia-enterprise/ts-new-lib/`
      to the app's Dockerfile
- [ ] Update all docker-compose CI overlays that build that app — check
      `infra/dev/<app>/docker-compose.ci.yml`
- [ ] Confirm the build context in every affected docker-compose file is repo root
- [ ] Run a local Docker build to verify: `docker compose -f infra/dev/<app>/docker-compose.yml build`
- [ ] Run the app's E2E CI workflow to confirm the Docker build succeeds end-to-end

## Checklist: When Creating a New Shared Library

When a new package is added under `libs/`:

- [ ] Identify every app that will import the new library
- [ ] Update each app's Dockerfile with the `COPY libs/<new-lib>/...` injection pattern
- [ ] Update every docker-compose CI overlay that builds those apps
- [ ] Confirm or set build context to repo root for each affected docker-compose file
- [ ] Test locally: `docker compose -f infra/dev/<app>/docker-compose.yml build`

## Common Pitfalls

### Pitfall 1: Build context scoped to the app directory

**Scenario**: `docker-compose.yml` sets `context: .` pointing at the app directory. The Dockerfile
`COPY libs/...` instruction fails because `libs/` is not inside the app directory.

**Fix**: Set `context: ../../..` (repo root) in every docker-compose file that builds an app with
shared library dependencies.

### Pitfall 2: Forgetting to update docker-compose CI overlays

**Scenario**: The main `docker-compose.yml` is updated with the correct context, but the CI
overlay (`docker-compose.ci.yml`) still has the old context or is missing the shared lib
injection. Builds pass locally but fail in CI.

**Fix**: Keep `docker-compose.ci.yml` in sync with `docker-compose.yml`. After every Dockerfile
change, check all CI overlays for that app.

### Pitfall 3: Injecting source but omitting `package.json`

**Scenario**: The Dockerfile copies `libs/web-ui-token/src/` but not
`libs/web-ui-token/package.json`. Node.js resolves files successfully, but tools that read
`package.json` (type declarations, `exports` field resolution) fail.

**Fix**: Always copy both `src/` and `package.json` for each injected library.

### Pitfall 4: Missing hoisted transitive dependency

**Scenario**: A Docker build fails on a module that is not a direct dependency of the app. The
package exists in the monorepo root `node_modules/` because npm hoisted it from a transitive
dependency.

**Fix**: Add the transitive dependency explicitly to the app's `package.json` so `npm ci` installs
it in the container.
