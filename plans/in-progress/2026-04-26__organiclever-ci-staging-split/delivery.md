# Delivery Checklist

---

## Environment Setup

- [ ] Confirm working directory is `ose-public/`
- [ ] Install dependencies: `npm install`
- [ ] Converge the polyglot toolchain: `npm run doctor -- --fix`
- [ ] Verify markdown linting is clean before changes: `npm run lint:md`
      (fix any pre-existing violations before touching anything)
- [ ] **Confirm `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in the
      `organiclever-web-development` GitHub Environment** before proceeding —
      `be-integration` and `e2e` jobs will fail loudly if absent

### Commit guidelines (applies to all phases)

- [ ] Follow Conventional Commits: `<type>(<scope>): <description>`
- [ ] Split by domain — code change in one commit, workflow files in one commit,
      doc updates in one commit
- [ ] Do NOT bundle unrelated changes

---

## Phase 1 — Code Change + Workflow File Operations

### 1.1 Update `playwright.config.ts`

- [ ] Read `apps/organiclever-web-e2e/playwright.config.ts` in full
- [ ] Change `process.env.BASE_URL` → `process.env.WEB_BASE_URL` in the `baseURL` field
- [ ] Verify the localhost fallback is preserved:
      `baseURL: process.env.WEB_BASE_URL || "http://localhost:3200"`
- [ ] Check for any other `BASE_URL` references in `apps/organiclever-web-e2e/`:
      `grep -rn "BASE_URL" apps/organiclever-web-e2e/ --include="*.ts" --include="*.js"`
      Update any additional occurrences to `WEB_BASE_URL`
- [ ] Commit: `fix(organiclever-web-e2e): rename BASE_URL to WEB_BASE_URL in playwright config`

### 1.2 Read the old workflow in full

- [ ] Read `.github/workflows/test-and-deploy-organiclever.yml` completely and confirm
      it matches the original documented in [tech-docs.md](./tech-docs.md) before deleting

### 1.3 Delete the old workflow

- [ ] Delete `.github/workflows/test-and-deploy-organiclever.yml`

### 1.4 Create workflow 1 — development deploy

- [ ] Create `.github/workflows/test-and-deploy-organiclever-web-development.yml`
      using the full YAML from [tech-docs.md — Workflow 1](./tech-docs.md).
      Verify each `# CHANGED` line:
  - [ ] `name:` is `Test and Deploy - OrganicLever Web Development`
  - [ ] Cron schedules are `0 20 * * *` (3 AM WIB) and `0 8 * * *` (3 PM WIB)
  - [ ] `be-integration` job uses `environment: organiclever-web-development`
  - [ ] `e2e` job uses `environment: organiclever-web-development`
  - [ ] `deploy` job `name:` is `Deploy to staging`
  - [ ] `deploy` job runs `git push origin HEAD:stag-organiclever-web --force`
  - [ ] FE E2E step uses `WEB_BASE_URL: http://localhost:3200`
  - [ ] BE E2E step still uses `BASE_URL: http://localhost:8202` (unchanged — different project)
  - [ ] No step pushes to `prod-organiclever-web`

### 1.5 Create workflow 2 — staging test

- [ ] Create `.github/workflows/test-organiclever-web-staging.yml`
      using the full YAML from [tech-docs.md — Workflow 2](./tech-docs.md).
      Verify each field:
  - [ ] `name:` is `Test - OrganicLever Web Staging`
  - [ ] Triggers on cron `0 22 * * *` (5 AM WIB) and `0 10 * * *` (5 PM WIB)
  - [ ] Triggers on `workflow_dispatch`
  - [ ] `permissions: contents: read`
  - [ ] Single job `e2e-staging` with `environment: organiclever-web-staging`
  - [ ] `WEB_BASE_URL: ${{ vars.WEB_BASE_URL }}` (vars, not secrets)
  - [ ] Runs `npx nx run organiclever-web-e2e:test:e2e`
  - [ ] Uploads artifact `playwright-report-organiclever-web-staging`
  - [ ] No `setup-golang` step
  - [ ] No codegen step
  - [ ] No `git push` step

### 1.6 Create workflow 3 — production deploy

- [ ] Create `.github/workflows/deploy-organiclever-web-to-production.yml`
      using the full YAML from [tech-docs.md — Workflow 3](./tech-docs.md).
      Verify each field:
  - [ ] `name:` is `Deploy - OrganicLever Web to Production`
  - [ ] Triggers on `workflow_dispatch` only — no schedule, no push
  - [ ] `permissions: contents: write`
  - [ ] Job `e2e-staging` with `environment: organiclever-web-staging`
  - [ ] `WEB_BASE_URL: ${{ vars.WEB_BASE_URL }}` on the E2E step
  - [ ] Uploads artifact `playwright-report-organiclever-web-staging-predeploy`
  - [ ] Job `promote-to-production` with `needs: [e2e-staging]`
  - [ ] `promote-to-production` uses `environment: organiclever-web-production`
  - [ ] `promote-to-production` checks out `ref: stag-organiclever-web` with `fetch-depth: 0`
  - [ ] `promote-to-production` runs `git push origin HEAD:prod-organiclever-web --force`
  - [ ] No `setup-golang` in either job
  - [ ] No codegen in either job

### 1.7 Commit workflow changes

- [ ] `ci(organiclever): replace test-and-deploy with development + staging + production workflows`

---

## Phase 2 — Update Referencing `.md` Files

Confirm current line numbers first:

```bash
grep -rn "test-and-deploy-organiclever\.yml" . \
  --include="*.md" \
  --exclude-dir=plans \
  --exclude-dir=generated-reports \
  --exclude-dir=node_modules
```

### 2.1 `README.md` (root) — CI badge

- [ ] Read the badge section
- [ ] Replace `test-and-deploy-organiclever.yml` → `test-and-deploy-organiclever-web-development.yml`
      in the badge `src` URL, `href` link, and alt text

### 2.2 `docs/reference/system-architecture/ci-cd.md`

- [ ] Read the file around the occurrence
- [ ] Replace `test-and-deploy-organiclever.yml` → `test-and-deploy-organiclever-web-development.yml`
- [ ] If inventory table: add rows for `test-organiclever-web-staging.yml` and
      `deploy-organiclever-web-to-production.yml`
- [ ] Update any prose implying the workflow deploys to production

### 2.3 `docs/reference/system-architecture/deployment.md`

- [ ] Read the file around the occurrence
- [ ] Replace `test-and-deploy-organiclever.yml` → `test-and-deploy-organiclever-web-development.yml`
- [ ] Update prose: this workflow deploys to **staging**; production is via
      `deploy-organiclever-web-to-production.yml`

### 2.4 `governance/development/infra/ci-conventions.md` — 2 occurrences

- [ ] Read the file around both occurrences
- [ ] Replace both → `test-and-deploy-organiclever-web-development.yml`
- [ ] If full inventory table: add rows for the two new workflows

### 2.5 `governance/development/infra/github-actions-workflow-naming.md` — 5 occurrences

- [ ] Read the full file
- [ ] **Codebase reference table**: replace the single old row with three new rows:

  | `name:` field                                    | Filename                                           |
  | ------------------------------------------------ | -------------------------------------------------- |
  | `Test and Deploy - OrganicLever Web Development` | `test-and-deploy-organiclever-web-development.yml` |
  | `Test - OrganicLever Web Staging`                | `test-organiclever-web-staging.yml`                |
  | `Deploy - OrganicLever Web to Production`        | `deploy-organiclever-web-to-production.yml`        |

- [ ] **PASS example comment** (`# File: ...`): update to
      `test-and-deploy-organiclever-web-development.yml`; update `name:` value;
      update the derivation walkthrough sentence
- [ ] **Version alignment table Go row**: replace →
      `test-and-deploy-organiclever-web-development.yml`
- [ ] **Version alignment table .NET row**: replace →
      `test-and-deploy-organiclever-web-development.yml`

### 2.6 `governance/development/workflow/ci-post-push-verification.md` — 5 occurrences

- [ ] Read the file around all five occurrences (~lines 53, 142, 145, 178, 190)
- [ ] Replace all five → `test-and-deploy-organiclever-web-development.yml`

### 2.7 Verify sweep is complete

```bash
grep -rn "test-and-deploy-organiclever\.yml" . \
  --include="*.md" \
  --exclude-dir=plans \
  --exclude-dir=generated-reports \
  --exclude-dir=node_modules
```

Expected: **no matches**.

### 2.8 Commit doc updates

- [ ] `docs(ci): update .md references for organiclever workflow rename and staging split`

---

## Phase 3 — Local Quality Gates

> Fix ALL failures found here, not just those caused by your changes. Commit
> preexisting fixes separately.

### 3.1 Markdown lint

- [ ] `npm run lint:md`
- [ ] If violations: `npm run lint:md:fix`, re-run until clean
- [ ] Final run must exit 0 with zero errors

### 3.2 YAML syntax validation

```bash
npx js-yaml .github/workflows/test-and-deploy-organiclever-web-development.yml
npx js-yaml .github/workflows/test-organiclever-web-staging.yml
npx js-yaml .github/workflows/deploy-organiclever-web-to-production.yml
```

All three must produce no output (valid YAML).

### 3.3 Smoke checks

- [ ] Old workflow gone:
      `ls .github/workflows/test-and-deploy-organiclever.yml` → "No such file"
- [ ] No automated prod-push (only in WF3 `promote-to-production`):
      `grep -rn "prod-organiclever-web" .github/workflows/`
      → matches only `deploy-organiclever-web-to-production.yml`
- [ ] `WEB_BASE_URL` in playwright config:
      `grep "WEB_BASE_URL" apps/organiclever-web-e2e/playwright.config.ts` → match
- [ ] No stale `"Development - Organic Lever"` or `"Staging - OrganicLever Web"` env
      references in any new workflow file:
      `grep -rn "Development - Organic Lever\|Staging - OrganicLever Web" .github/workflows/`
      → no matches

---

## Phase 4 — Post-Push CI Verification

- [ ] Push all commits to `main`: `git push origin main`
- [ ] Open GitHub Actions and monitor all triggered workflows
- [ ] Confirm `test-and-deploy-organiclever.yml` no longer appears
- [ ] Confirm `Test and Deploy - OrganicLever Web Development` appears
- [ ] Confirm `Test - OrganicLever Web Staging` appears (will not auto-trigger — just listed)
- [ ] Confirm `Deploy - OrganicLever Web to Production` appears (dispatch-only — just listed)
- [ ] Fix any failing CI check immediately; push follow-up commit
- [ ] Do NOT proceed to archival until all triggered checks are green

---

## Verification Gates

Before archiving, all of the following must hold:

- [ ] `.github/workflows/test-and-deploy-organiclever.yml` does not exist
- [ ] `.github/workflows/test-and-deploy-organiclever-web-development.yml` exists,
      YAML-valid, cron `0 20 * * *` / `0 8 * * *`, `be-integration` and `e2e` jobs
      use `organiclever-web-development`, `deploy` pushes to `stag-organiclever-web`,
      FE E2E step uses `WEB_BASE_URL: http://localhost:3200`
- [ ] `.github/workflows/test-organiclever-web-staging.yml` exists, YAML-valid,
      cron `0 22 * * *` / `0 10 * * *` + `workflow_dispatch`, `organiclever-web-staging`
      env, `WEB_BASE_URL` from `vars`, no push step
- [ ] `.github/workflows/deploy-organiclever-web-to-production.yml` exists, YAML-valid,
      `workflow_dispatch` only, `e2e-staging` uses `organiclever-web-staging`,
      `promote-to-production needs e2e-staging`, `promote-to-production` uses
      `organiclever-web-production`, checks out `stag-organiclever-web`, pushes to
      `prod-organiclever-web`
- [ ] `grep -rn "prod-organiclever-web" .github/workflows/` matches only
      `deploy-organiclever-web-to-production.yml`
- [ ] `grep -rn "Development - Organic Lever\|Staging - OrganicLever Web" .github/workflows/`
      → no matches
- [ ] `apps/organiclever-web-e2e/playwright.config.ts` uses `process.env.WEB_BASE_URL`
- [ ] `grep -rn "test-and-deploy-organiclever\.yml" . --include="*.md" --exclude-dir=plans --exclude-dir=generated-reports --exclude-dir=node_modules` → no matches
- [ ] `npm run lint:md` exits 0
- [ ] All GitHub Actions triggered by the push to `main` are green

---

## Emergency Bypass (informational)

If the `e2e-staging` gate in WF3 is broken and production must ship urgently:

```bash
git push origin stag-organiclever-web:prod-organiclever-web --force
```

Bypasses the workflow entirely. Use only in genuine emergencies; document the bypass.

---

## Plan Archival

- [ ] Verify ALL verification gates above are satisfied
- [ ] `git mv plans/in-progress/2026-04-26__organiclever-ci-staging-split plans/done/2026-04-26__organiclever-ci-staging-split`
- [ ] Remove entry from `plans/in-progress/README.md`
- [ ] Add entry to `plans/done/README.md` with completion date
- [ ] `chore(plans): archive organiclever-ci-staging-split to done`
