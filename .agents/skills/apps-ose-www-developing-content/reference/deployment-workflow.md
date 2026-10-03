# OSE Web Content — Deployment Workflow

Deploy ose-web to production using automated CI or the deployer agent.

## Production Branch

**Branch**: `prod-ose-www`
**Purpose**: Deployment-only branch that Vercel monitors
**Build System**: Vercel (Next.js SSG with Next.js 16 theme)

## Automated Deployment (Primary)

The `ose-www-test-local-deploy-prod.yml` GitHub Actions workflow handles routine deployment:

- **Schedule**: Runs at 6 AM and 6 PM WIB (UTC+7) every day
- **Change detection**: Diffs `HEAD` vs `prod-ose-www` scoped to `apps/ose-www/` — skips build/deploy when nothing changed
- **Build**: Runs `nx build ose-web` (Next.js extended build with Next.js 16 theme)
- **Deploy**: Force-pushes `main` to `prod-ose-www`; Vercel auto-builds

**Manual trigger**: From the GitHub Actions UI, trigger `ose-www-test-local-deploy-prod.yml` with `force_deploy=true` to deploy immediately regardless of changes.

## Emergency / On-Demand Deployment

For immediate deployment outside the scheduled window:

```bash
git push origin main:prod-ose-www --force
```

Or use the `swe-releaser` (Deploy mode, `ose-www` target) agent for a guided deployment.

## Why Force Push

**Safe for deployment branches**:

- prod-ose-www is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth
