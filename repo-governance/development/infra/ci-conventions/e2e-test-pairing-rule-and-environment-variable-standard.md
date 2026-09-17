---
description: E2E runner pairing and required env-variable rules.
when_to_use: Use when wiring an E2E runner or env variable.
---

# E2E Test Pairing Rule and Environment Variable Standard

## E2E Test Pairing Rule

Each app pairs with dedicated E2E runner projects for end-to-end testing.

| App Type                                           | E2E Pairing                                    |
| -------------------------------------------------- | ---------------------------------------------- |
| Backend (`organiclever-be`, `ayokoding-www`, etc.) | Dedicated `*-be-e2e` Playwright runner project |
| Frontend (`organiclever-app-web`, etc.)            | Dedicated `*-fe-e2e` Playwright runner project |
| Content platforms                                  | Both `*-be-e2e` and `*-fe-e2e` runners         |

Each product app has its own dedicated E2E runner (`*-be-e2e`, `*-fe-e2e`) scoped to that product's
scenarios.

## Server Fixture Standard

A Playwright `webServer` fixture must serve a built artifact — the app's `start` target or its
standalone `server.js` — and must never invoke a `dev` target. The E2E project declares the build it
needs through `dependsOn`, so the fixture never races an absent or stale output.

Two reasons, either sufficient. A dev server compiles on first request and fans its compiler out
across workers that no Nx concurrency setting bounds; one such fixture was measured at 417 node
processes, which exhausted memory and swap and was shed before the fixture's deadline. And E2E
exists to exercise the artifact that ships, which a dev server is not.

A scenario that genuinely needs dev-only behaviour spawns its own process inside the scenario rather
than changing the shared fixture.

## Environment Variable Standard

Every app with runtime configuration must satisfy these requirements:

- **`.env.example` in `infra/dev/{app}/`**: Documents all required and optional environment
  variables with placeholder values and inline comments explaining each variable.
- **`env_file` directive in docker-compose**: Compose services load environment variables via
  `env_file: .env` rather than hardcoding values in the `environment:` block.
- **`.env*.local` in `.gitignore`**: Local override files (`.env.local`, `.env.development.local`,
  etc.) must never be committed. The root `.gitignore` must include `**/.env*.local`.
- **No hardcoded secrets in CI workflows**: GitHub Actions workflows must reference secrets via
  `${{ secrets.SECRET_NAME }}`. Plain-text credentials must never appear in workflow YAML files,
  even in non-production environments. This is one enforcement point of the broader
  [No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md), which is the
  hard iron rule governing all git-tracked files in this repository.

When a new variable is added to an app, the developer must update `.env.example` in the same
commit. CI will fail if the app starts without the variable, surfacing the omission early.
