# Delivery: Adopt Portless for Local Development

## Phase 0: Verify Prerequisites

- [ ] **0.1** Confirm Node.js version ≥ 20 (`node --version` → 24.x ✓)
- [ ] **0.2** Confirm portless v0.10.3 exists on npm (`npm info portless version`)
- [ ] **0.3** Confirm all 4 Next.js apps have `next.config.ts` (not `.js`)
- [ ] **0.4** Read current `project.json` for each app to capture exact existing
      `dev` target command before editing

## Phase 1: Install portless

- [ ] **1.1** Add `"portless": "^0.10.3"` to `devDependencies` in root `package.json`
- [ ] **1.2** Run `npm install` — verify exit code 0
- [ ] **1.3** Verify `node_modules/.bin/portless` exists
- [ ] **1.4** Run `npx portless --version` — verify output matches `0.10.x`
- [ ] **1.5** Commit: `chore(deps): add portless as dev dependency for named localhost URLs`

## Phase 2: Update project.json dev targets

- [ ] **2.1** Edit `apps/oseplatform-web/project.json`:
  - Replace `"next dev --port 3100"` → `"portless oseplatform-web next dev"`
  - Keep `start` target unchanged
- [ ] **2.2** Edit `apps/ayokoding-web/project.json`:
  - Replace `"next dev --port 3101"` → `"portless ayokoding-web next dev"`
  - Keep `start` target unchanged
- [ ] **2.3** Edit `apps/organiclever-web/project.json`:
  - Replace `"next dev --port 3200"` → `"portless organiclever-web next dev"`
  - Keep `start` target unchanged
- [ ] **2.4** Edit `apps/wahidyankf-web/project.json`:
  - Replace `"next dev --port 3201"` → `"portless wahidyankf-web next dev"`
  - Keep `start` target unchanged
- [ ] **2.5** Commit: `feat(nx): replace hardcoded dev ports with portless named URLs`

## Phase 3: Update next.config.ts — allowedDevOrigins

- [ ] **3.1** Edit `apps/oseplatform-web/next.config.ts`:
  - Add `allowedDevOrigins: ["oseplatform-web.localhost", "*.oseplatform-web.localhost"]`
  - to the `nextConfig` object
- [ ] **3.2** Edit `apps/ayokoding-web/next.config.ts`:
  - Add `allowedDevOrigins: ["ayokoding-web.localhost", "*.ayokoding-web.localhost"]`
- [ ] **3.3** Edit `apps/organiclever-web/next.config.ts`:
  - Add `allowedDevOrigins: ["organiclever-web.localhost", "*.organiclever-web.localhost"]`
- [ ] **3.4** Edit `apps/wahidyankf-web/next.config.ts`:
  - Add `allowedDevOrigins: ["wahidyankf-web.localhost", "*.wahidyankf-web.localhost"]`
- [ ] **3.5** Commit: `feat(next): add allowedDevOrigins for portless proxy compatibility`

## Phase 4: Document organiclever-be alias

- [ ] **4.1** Add to `governance/development/workflow/worktree-setup.md` (one-time
      setup section): `npx portless alias organiclever-be 8202`
- [ ] **4.2** Verify the alias command syntax is correct for portless v0.10.x
- [ ] **4.3** Commit: `docs(worktree-setup): add portless alias step for organiclever-be`

## Phase 5: Update documentation

- [ ] **5.1** Update `CLAUDE.md` — "Web Sites" section:
  - Replace each `- **Dev port**: XXXX` line with `- **Dev URL**: https://<name>.localhost`
  - Add new "Local Development with Portless" subsection with:
    - One-time setup commands (`portless trust`, `portless proxy start`)
    - Safari workaround (`portless hosts sync`)
    - Escape hatch (`PORTLESS=0 nx dev <app>`)
    - Link to `worktree-setup.md`
- [ ] **5.2** Update `governance/development/workflow/worktree-setup.md`:
  - Add "Portless Setup" step to the initial setup procedure:
    1. `npx portless trust` (one-time per machine, requires sudo on macOS)
    2. `npx portless proxy start` (once per dev session or add to shell login)
    3. `npx portless alias organiclever-be 8202` (one-time per machine)
  - Add Safari note: run `npx portless hosts sync` if using Safari
  - Add escape hatch note: `PORTLESS=0` prefix to bypass for any command
- [ ] **5.3** Update `apps/oseplatform-web/README.md`:
  - Replace `localhost:3100` → `https://oseplatform-web.localhost`
- [ ] **5.4** Update `apps/ayokoding-web/README.md`:
  - Replace `localhost:3101` → `https://ayokoding-web.localhost`
- [ ] **5.5** Update `apps/organiclever-web/README.md`:
  - Replace `localhost:3200` → `https://organiclever-web.localhost`
- [ ] **5.6** Update `apps/wahidyankf-web/README.md`:
  - Replace `localhost:3201` → `https://wahidyankf-web.localhost`
- [ ] **5.7** Commit: `docs: update dev URLs to portless named localhost addresses`

## Phase 6: Local verification

- [ ] **6.1** Run `npx portless trust` (if not already done)
- [ ] **6.2** Run `npx portless proxy start`
- [ ] **6.3** Run `nx dev wahidyankf-web` — verify it starts without error
- [ ] **6.4** Open `https://wahidyankf-web.localhost` in Chrome — verify HTTP 200 and
      no console cross-origin errors
- [ ] **6.5** Run `nx dev wahidyankf-web` from this worktree (branch `worktree-adopt-portless`)
      — open `https://worktree-adopt-portless.wahidyankf-web.localhost` — verify
      it serves this worktree's version
- [ ] **6.6** Confirm both instances run simultaneously without port conflict
- [ ] **6.7** Run `nx run wahidyankf-web:test:quick` — all tests pass
- [ ] **6.8** Run `nx build wahidyankf-web` — build succeeds
- [ ] **6.9** Run `PORTLESS=0 nx dev wahidyankf-web` — verify escape hatch works
      (starts on default Next.js port 3000)
- [ ] **6.10** Repeat 6.3–6.8 for `oseplatform-web` (spot-check)

## Phase 7: Quality gate

- [ ] **7.1** Run `npx nx affected -t typecheck lint test:quick` for all changed apps
- [ ] **7.2** Run `npm run lint:md` — no markdown violations
- [ ] **7.3** Run `npm run format:md:check` — no formatting violations
- [ ] **7.4** Stage all changes and run pre-commit hooks — no failures
- [ ] **7.5** Run pre-push hooks (`npx nx affected -t typecheck lint test:quick spec-coverage`)
      — all pass

## Phase 8: PR + merge

- [ ] **8.1** Push branch `worktree-adopt-portless` to origin
- [ ] **8.2** Open draft PR: `feat(dx): adopt portless for named localhost dev URLs`
- [ ] **8.3** PR description documents:
  - What changed (named URLs replace hardcoded ports)
  - One-time setup steps each contributor must run
  - URL mapping table
- [ ] **8.4** Convert draft → ready for review
- [ ] **8.5** Merge PR after CI passes
- [ ] **8.6** Move this plan folder to `plans/done/2026-04-24__adopt-portless/`

## Rollback

If portless causes regressions (proxy instability, cert trust issues):

1. Revert `project.json` dev commands to `next dev --port XXXX`
2. Remove `allowedDevOrigins` from `next.config.ts` files
3. Remove portless from `package.json` devDependencies
4. Update docs back to hardcoded ports

The `start` target is never changed, so production builds are unaffected.
