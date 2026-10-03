---
description: >-
  Records each environment the SWE releaser may deploy, with the branch, project, workflow, and check that prove each
  deploy, carried over from the retired per-app deployer agents.
when_to_use: >-
  Use before deploying an app or Storybook here, or when adding, retiring, or changing a deploy target.
---

# Deploy Targets

`swe-releaser` Deploy mode reaches only the targets below, following
[Apps Deploying Vercel Branches](../../../../../.agents/skills/apps-deploying-vercel-branches/SKILL.md). Each target was
one deployer agent; its parameters moved here unchanged. Every Vercel project belongs to the team
`wahidyan-kresna-fridayokas-projects`, and every deploy ends with the skill's Vercel post-deploy check (reference `04`).

| Target                 | Environment                                            | Workflow                                                                                                                                                           | Verification                                                                          |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `ayokoding-www`        | production, branch `prod-ayokoding-www`                | direct force-push of `main` (reference `01`); Vercel builds Next.js                                                                                                | Vercel build of project `ayokoding-www`                                               |
| `organiclever-www`     | production, branch `prod-organiclever-www`             | direct force-push of `main` (reference `01`) for emergency or on-demand deploys; `organiclever-www-test-local-deploy-prod.yml` runs the scheduled ones             | Vercel build of project `organiclever-www`                                            |
| `ose-www`              | production, branch `prod-ose-www`                      | direct force-push of `main` (reference `01`); Vercel builds Next.js                                                                                                | Vercel build of project `ose-www`                                                     |
| `web-ui-storybook`     | production, branch `prod-web-ui`                       | direct force-push of `main` (reference `01`); Vercel runs `npx nx run web-ui:build-storybook` and serves `libs/web-ui/storybook-static`                            | Vercel build of project `web-ui`                                                      |
| `organiclever-app-web` | staging, GitHub Environment `organiclever-app-staging` | dispatch `organiclever-app-test-local-deploy-stag.yml` (reference `02`), which force-pushes `stag-organiclever-app-web` (Vercel) and `stag-organiclever-be` (GHCR) | its test gate and deploy job, then the Vercel build of project `organiclever-app-web` |
| `ose-app-web`          | staging, GitHub Environment `ose-app-staging`          | dispatch `ose-app-test-local-deploy-stag.yml` (reference `02`), which force-pushes `stag-ose-app-web` (Vercel) and `stag-ose-be` (GHCR)                            | its test gate and deploy job, then the Vercel build of project `ose-app-web`          |

Production promotion of the two app groups is deferred: no production deploy workflow exists, and their staging test
workflows (`organiclever-app-test-stag.yml`, `ose-app-test-stag.yml`) stop on pass. Deploy mode never invents one. The
`ose-app-web` production branch `prod-ose-app-web` will serve `app.oseplatform.com` once that promotion exists.

Parent: [Repository Adapter](../repository-adapter.md).
