---
description: Reusable workflow structure and the staggered CRON tracks.
when_to_use: Use when writing a reusable workflow or scheduling a CRON job.
---

# GitHub Actions Conventions — Reusable Workflows and CRON Scheduling

## Reusable Workflows

Reusable workflows live in `.github/workflows/_reusable-{purpose}.yml` and are called via
`workflow_call`. They contain the actual job definitions (checkout, setup, test execution, artifact
upload). Per-variant test workflows stay thin (~40 lines) by calling these reusable workflows with
variant-specific inputs.

**Examples**:

```
.github/workflows/_reusable-www-test-local-deploy.yml
.github/workflows/_reusable-app-test-local-deploy-stag.yml
.github/workflows/_reusable-app-test-stag.yml
.github/workflows/_reusable-be-build-deploy.yml
```

## CRON Schedule

Scheduled full-quality workflows run twice daily aligned to WIB (UTC+7). The app tier uses a
**staggered** schedule — `*-app-test-local-deploy-stag` fires first to produce the staging deploy,
then `*-app-test-stag` fires **2.5 hours later** once Vercel and the backend rollout have settled. The
www tier is independent and runs after both app-tier passes.

`*-be-build-deploy-stag` is **not** scheduled — it fires on push to the `stag-*-be` branch, which
the `*-app-test-local-deploy-stag` deploy job force-pushes on success.

| Pipeline                       | WIB           | UTC           | Rationale                                                              |
| ------------------------------ | ------------- | ------------- | ---------------------------------------------------------------------- |
| `*-app-test-local-deploy-stag` | 03:00 / 15:00 | 20:00 / 08:00 | Earliest — produces the staging deploy the later stag-gate verifies    |
| `*-app-test-stag`              | 05:30 / 17:30 | 22:30 / 10:30 | **+2.5 h** after staging, so Vercel + the backend rollout have settled |
| `*-www-test-local-deploy-prod` | 06:00 / 18:00 | 23:00 / 11:00 | Independent of the app tier (direct www test → prod deploy)            |
| `non-product-full-quality`     | 08:00 / 20:00 | 01:00 / 13:00 | Full library and executable-tool layers outside deployment flows       |

## Full-Quality Test Order

Every scheduled or manually dispatched full-quality test path preserves this dependency order:

| Order | Nx target          | Obligation                                                                                 |
| ----- | ------------------ | ------------------------------------------------------------------------------------------ |
| 1     | `test:quick`       | Typecheck/lint where applicable, complete Unit runtime, and all applicable static coverage |
| 2     | `test:integration` | Complete applicable non-networked local-resource suites after Unit/static proof succeeds   |
| 3     | `test:e2e`         | Complete unfiltered public-boundary suites only after applicable Integration succeeds      |

Projects may run in parallel within one ordered layer, but no Integration job may bypass a failed
quick/static predecessor and no E2E job may bypass an applicable failed Integration predecessor.
The non-product workflow applies the same order to libraries and executable tools.
