# Deployment Workflow

## Deployment Workflow

Deploy ayokoding-web to production using automated CI or the deployer agent.

### Production Branch

**Branch**: `prod-ayokoding-www`
**Purpose**: Deployment-only branch that Vercel monitors
**Build System**: Vercel (Next.js)

### Automated Deployment (Primary)

The `ayokoding-www-test-local-deploy-prod.yml` GitHub Actions workflow handles routine deployment:

- **Schedule**: Runs at 6 AM and 6 PM WIB (UTC+7) every day
- **Change detection**: Diffs `HEAD` vs `prod-ayokoding-www` scoped to `apps/ayokoding-www/` — skips build/deploy when nothing changed
- **Build**: Runs `nx build ayokoding-web` (Next.js build)
- **Deploy**: Force-pushes `main` to `prod-ayokoding-www`; Vercel auto-builds

**Manual trigger**: From the GitHub Actions UI, trigger `ayokoding-www-test-local-deploy-prod.yml` with `force_deploy=true` to deploy immediately regardless of changes.

### Emergency / On-Demand Deployment

For immediate deployment outside the scheduled window:

```bash
git push origin main:prod-ayokoding-www --force
```

Or use the `swe-releaser` (Deploy mode, `ayokoding-www` target) agent for a guided deployment.

### Why Force Push

**Safe for deployment branches**:

- prod-ayokoding-www is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth
