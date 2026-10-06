# Pattern 2: Scheduled Staging Workflow

Used by agents whose Target Parameters name a `$WORKFLOW_FILE` (a `*-test-local-deploy-stag.yml`)
that runs the full local-stack test suite and then force-pushes `stag-*` branches itself. This agent
never force-pushes directly under normal operation — it dispatches and watches the workflow.

## Step 1: Trigger the Staging Workflow

```bash
gh workflow run $WORKFLOW_FILE --repo wahidyankf/ose-public
```

## Step 2: Locate the Run

```bash
gh run list --repo wahidyankf/ose-public --workflow=$WORKFLOW_FILE --limit=3
```

## Step 3: Watch the Run to Completion

```bash
gh run view <run-id> --repo wahidyankf/ose-public
```

On a passing run, the workflow force-pushes `HEAD` to the app-web `stag-*` branch (Vercel rebuilds)
and the paired backend `stag-*` branch (GHCR image build fires).

## Staging Protection Bypass and Secrets

The staging branch sits behind Vercel Deployment Protection. The staging E2E gate authenticates using
GitHub Environment values — never literals committed to the repo:

- **Var** `WEB_BASE_URL`: the private staging URL (Environment variable, not committed)
- **Secret** `VERCEL_AUTOMATION_BYPASS_SECRET`: the Vercel Protection Bypass for Automation token;
  without it the staging E2E gate 401s on the protected URL

Per [Secrets and Env Standards](../../../../repo-governance/conventions/security/secrets-and-env-standards.md),
these live only in Vercel + the GitHub Environment, never in a tracked file.

## Emergency Bypass

Use only when the workflow's test gate is broken and staging must ship urgently. Document the bypass
when used.

```bash
git push origin main:$STAG_BRANCH --force
```

This skips the GitHub Actions workflow entirely. It does not skip Vercel — Vercel still builds from
`$STAG_BRANCH` on push.

## Safety Checks

The workflow itself enforces the gate: the full local-stack test suite must pass before the deploy
step runs. This agent does not need to validate local branch state — the workflow tests `main`
directly inside the GitHub Actions runner before pushing the stag branches.

## Common Issues

### Issue 1: Workflow run not found by `gh run list`

The dispatch can lag a few seconds — re-run the Step 2 command.

### Issue 2: Test gate fails

The local stack is broken. Investigate the failing job's logs and fix the root cause before
re-dispatching the workflow.

### Issue 3: Deploy job fails on push

The stag branches may have diverged unexpectedly, or branch protection may be misconfigured. Inspect
the run logs.

After a passing run, proceed to
[Post-Deploy Verification](./post-deploy-verification-vercel-mcp.md).
