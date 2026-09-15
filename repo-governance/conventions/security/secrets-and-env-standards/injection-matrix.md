---
description: The full table mapping each app type and deploy stage to its injection platform, injection home, and value owner, plus the two load-bearing boundaries it implies.
when_to_use: Use when you need to know exactly which platform and environment owns a given app's env values at a specific deploy stage.
---

# Injection Matrix

The table below maps each app type and stage to its injection platform and value owner:

| App type         | Stage      | Platform / target                               | Injection home                                                                | Values owned by                                |
| ---------------- | ---------- | ----------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| www / app-web    | local      | dev machine                                     | `apps/<app>/.env.local` (gitignored), auto-loaded by Next.js                  | developer                                      |
| www / app-web    | local (CI) | GitHub Actions + docker-compose                 | `infra/dev/<stack>/` compose env, sourced from app `.env.example` keys        | this plan (refs only) / committed placeholders |
| www              | production | Vercel Production target (`prod-*-www` branch)  | Vercel project env, keys from `.env.example`                                  | wire-vercel `[HUMAN]`                          |
| app-web          | staging    | Vercel Preview target (`stag-*-app-web` branch) | Vercel project env (Preview scope)                                            | wire-vercel `[HUMAN]`                          |
| app-web e2e gate | staging    | GitHub Env `{group}-app-staging`                | `vars.WEB_BASE_URL`, `secrets.VERCEL_AUTOMATION_BYPASS_SECRET`                | wire-vercel `[HUMAN]`                          |
| be (F#)          | local (CI) | GitHub Actions + docker-compose                 | `infra/dev/<group>/` compose env, sourced from app `.env.example` keys        | this plan (refs only) / committed placeholders |
| be (F#)          | staging    | k3s via the private sibling's `coralpolyp`      | container env from the private-sibling secret store, keys from `.env.example` | The private sibling (cross-repo)               |

Two load-bearing boundaries follow from the matrix:

- **This plan writes only references** — the `environment:` names, the `vars.`/`secrets.` reads,
  the compose env wiring sourced from committed placeholders, and the value-less `env-injection:`
  manifest (in `repo-config.yml`). It creates no real values.
- **`wire-vercel` populates the values** — GitHub Environment secrets/vars and Vercel project env
  at each target. **coralpolyp (the private sibling)** owns the backend k3s secret values. The contract (key
  set) is defined here; the cutover plan and the private sibling fill it in.
