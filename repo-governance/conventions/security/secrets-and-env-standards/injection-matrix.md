---
description: The hand-maintained table mapping each app type and deploy stage to its injection platform, injection home, and value owner, plus the two load-bearing boundaries it implies.
when_to_use: Use when you need to know exactly which platform and environment owns a given app's env values at a specific deploy stage.
---

# Injection Matrix

The table below maps each app type and stage to its injection platform and value owner. It is
hand-maintained: `repo-config.yml` declares no injection section and no gate or RHINO command reads
the table, so a change to an app's injection home updates it in the same change.

**Enforcement**: unenforced by decision; checked by review. `./rhino env validate` checks only
declared `.env.example` contracts and detectors, never this table or the values held in GitHub or
Vercel.

| App type         | Stage      | Platform / target                               | Injection home                                                         | Values owned by                                |
| ---------------- | ---------- | ----------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| www / app-web    | local      | dev machine                                     | `apps/<app>/.env.local` (gitignored), auto-loaded by Next.js           | developer                                      |
| www / app-web    | local (CI) | GitHub Actions + docker-compose                 | `infra/dev/<stack>/` compose env, sourced from app `.env.example` keys | this plan (refs only) / committed placeholders |
| www              | production | Vercel Production target (`prod-*-www` branch)  | Vercel project env, keys from `.env.example`                           | wire-vercel `[HUMAN]`                          |
| app-web          | staging    | Vercel Preview target (`stag-*-app-web` branch) | Vercel project env (Preview scope)                                     | wire-vercel `[HUMAN]`                          |
| app-web e2e gate | staging    | GitHub Env `{group}-app-staging`                | `vars.WEB_BASE_URL`, `secrets.VERCEL_AUTOMATION_BYPASS_SECRET`         | wire-vercel `[HUMAN]`                          |
| be (F#)          | local (CI) | GitHub Actions + docker-compose                 | `infra/dev/<group>/` compose env, sourced from app `.env.example` keys | this plan (refs only) / committed placeholders |
| be (F#)          | staging    | not run from this repository                    | none here; the key set comes from `.env.example`                       | outside this repository's scope                |

Two load-bearing boundaries follow from the matrix:

- **This plan writes only references** — the `environment:` names, the `vars.`/`secrets.` reads, and
  the compose env wiring sourced from committed placeholders. It creates no real values.
- **`wire-vercel` populates the values** — GitHub Environment secrets/vars and Vercel project env
  at each target. Values for a deployment not run from this repository are outside its scope. Whether
  the values exist is not machine-checkable from this repository, so `wire-vercel` checks them against
  this table by hand. The key set is defined by each app's `.env.example`, per the
  [Tiered Injection Standard](./tiered-injection-standard.md).
