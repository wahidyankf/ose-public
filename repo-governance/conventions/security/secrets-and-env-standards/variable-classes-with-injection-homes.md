---
description: The four variable classes (app-runtime server, app-runtime public build, CI test-harness, platform-injected) and where each is injected, including why VERCEL_AUTOMATION_BYPASS_SECRET is load-bearing.
when_to_use: Use when classifying a new env var to decide whether it belongs in .env.example or in the CI test-harness registry instead.
---

# Variable Classes with Injection Homes

The table below extends the naming standard's variable classes with the injection home for each class:

| Class                      | Example                                                                     | `.env.example`?    | Injection home                                                                                 |
| -------------------------- | --------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| App-runtime (server)       | `DATABASE_URL`, `ORGANICLEVER_BE_NATS_URL`                                  | **yes**            | local `.env.local` · GitHub Env (CI) · Vercel encrypted env · backend container secret         |
| App-runtime (public build) | `NEXT_PUBLIC_*`                                                             | **yes**            | same homes as server class, but **build-time** bundled by Next.js (never a secret)             |
| CI test-harness            | `WEB_BASE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`, `PLAYWRIGHT_GREP_INVERT` | **no** (test-only) | GitHub Environment `vars.`/`secrets.` only; registered in `env-injection:` (`repo-config.yml`) |
| Platform-injected          | `VERCEL_GIT_COMMIT_REF`, `PORT`, `HOSTNAME`                                 | allowlisted        | supplied by the platform or framework; never declared by us, never set by us                   |

The CI test-harness class is new and important. `WEB_BASE_URL` and
`VERCEL_AUTOMATION_BYPASS_SECRET` are not app config — they describe the deployed staging target
that the e2e job probes. They must never appear in `apps/<app>/.env.example`. If they did, the
drift guard would flag them `declared-but-unread` (the app source code never reads them), producing
false findings. These keys belong exclusively in their own registry (see the `env-injection:` section).

`VERCEL_AUTOMATION_BYPASS_SECRET` is **load-bearing, not optional**. Every app-web Vercel deployment
has Deployment Protection enabled, which returns `401` to unauthenticated requests to the staging or
preview URL. The staging e2e job runs Playwright against that protected URL, so it must send Vercel's
Protection Bypass for Automation token. Without it, every staging run returns `401`. The real token
value is created by the `wire-vercel-www-app-cutover` plan (enable Protection Bypass per project,
then set the GitHub Environment secret); this standard only declares the key in the manifest and
reads it in the reusable workflow.
