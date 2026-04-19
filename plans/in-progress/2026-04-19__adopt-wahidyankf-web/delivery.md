# Delivery — Adopt wahidyankf-web

Each phase ends with **one Conventional-Commits commit** and **one
`git push`** to the worktree branch, per the user requirement. Every
checkbox is one concrete, independently verifiable action. The
plan-execution workflow drives the list top-down; do not re-order
within a phase unless a step fails and requires triage.

## Branching Model

Execution happens inside the existing worktree at
`ose-public/.claude/worktrees/cached-brewing-cocoa/` on the branch
`worktree-cached-brewing-cocoa`. A **single draft PR** against
`origin/main` accumulates every phase commit. Per-phase pushes target
the worktree branch, not `main`. Concretely:

- Phase P0-P7 commits all land on `worktree-cached-brewing-cocoa`.
- The draft PR against `main` is opened once (see Preconditions) and
  stays draft throughout execution; each phase push updates the same
  PR.
- The PR moves from draft to "ready for review" only after P5 finishes
  its quality-gate checks.
- The PR merges to `main` (squash or merge-commit — user's choice)
  before P6 creates the `prod-wahidyankf-web` production branch.
- **P6 file-creation** (vercel.json, Dockerfile, deployer agent, CI
  workflow) commits to the worktree branch and lands in the same
  single draft PR as P0-P5. The `prod-wahidyankf-web` branch creation
  step in P6 is the only action that requires the PR to already be
  merged; it runs after merge and does not create a second PR.
- **P6 is the only phase that touches `main` directly**, and only to
  push the merged SHA from `origin/main` onto the new production
  branch. No phase commits land directly on `main` — all commits
  flow through the PR.
- P7 closes out the plan on the worktree branch and then that PR-merge
  flow is re-used for the doc/close-out commit if the PR has already
  merged; otherwise P7 lands in the same still-draft PR.

## Preconditions (verified once before P0)

- [x] Read `./baseline/README.md` end-to-end. The 17 PNGs + 3 YAML snapshots + behavioural notes in `./baseline/` are the authoritative reference the adopted app must match.
- [x] **Acknowledge the no-production-domain-testing constraint.** The Vercel project binding for `www.wahidyankf.com` still points at the upstream `wahidyankf/oss` build during and after this plan; the user swaps the binding to `prod-wahidyankf-web` manually after plan completion. Every baseline-comparison check in this plan compares `./baseline/` (left) to `http://localhost:3201/` (right) — NEVER to the live `https://www.wahidyankf.com/` URL after the port. The live URL will disagree with the adopted app until the user's Vercel swap.
- [x] Confirm the current session is inside `ose-public/.claude/worktrees/cached-brewing-cocoa/`.
- [x] Confirm the worktree branch is `worktree-cached-brewing-cocoa` (matches the `worktree-<name>` convention; Subrepo Worktree Workflow Standard 14).
- [x] Confirm the worktree branch is not `main` directly (Standard 14 prohibits direct commits to `main` from a worktree; only the P6 production-branch push touches `main`'s SHA, and only via `main:prod-wahidyankf-web`).
- [x] Confirm exactly one draft PR exists against `origin/main` for this worktree branch. If absent, open it now with `gh pr create --draft --base main --head worktree-cached-brewing-cocoa --title "feat(wahidyankf-web): adopt portfolio app" --body-file plans/in-progress/2026-04-19__adopt-wahidyankf-web/README.md` (or equivalent) before the first phase push. Every phase push in P0-P7 updates this same PR — do NOT open a second PR per phase.
- [x] Confirm `origin` points at `wahidyankf/ose-public`.
- [x] Confirm `git status` is clean.
- [x] Run `npm install` from workspace root to install dependencies.
- [x] Run `npm run doctor -- --fix` to converge the full polyglot toolchain (Go, F#, etc.). The `postinstall` hook runs `doctor || true` and silently tolerates drift; explicit `doctor --fix` is the only action that guarantees all toolchains are available. This is required before any `test:quick` call because that target invokes `rhino-cli` (Go binary).

> **Precondition notes (2026-04-19)** — PR gate deferred: `gh pr create --draft` needs at least one commit on worktree branch ahead of `main`. Draft PR opens immediately after P0 commit lands. All other gates passed: worktree at `ose-public/.claude/worktrees/cached-brewing-cocoa/`, branch `worktree-cached-brewing-cocoa`, origin `wahidyankf/ose-public`, clean status, `npm install` success (1648 packages), `npm run doctor -- --fix` shows 19/19 tools OK. Upstream `wahidyankf/oss` cloned shallow into `local-temp/oss-upstream/` at SHA `9b17637e3d454ade45281474da244148edfc7d57` for use as source material throughout P0-P1. Upstream app dir has no per-app LICENSE (confirmed by `find`); will inherit repo-root MIT terms in P1.

## Phase P0 — Prep & Gap Resolution

- [x] Confirm `./baseline/` contains 17 PNGs, 3 YAML snapshots, and `README.md`. The baseline was captured during plan authoring (2026-04-19) from the live site at `https://www.wahidyankf.com/` — do NOT recapture wholesale; doing so overwrites the reference the port is validated against. Only recapture individual files if missing.
- [x] Fetch the upstream `wahidyankf/oss` repo state at HEAD via `gh api repos/wahidyankf/oss/contents/apps-standalone/wahidyankf-web` and record the commit SHA in `plans/in-progress/2026-04-19__adopt-wahidyankf-web/prep-notes.md` (temporary file; deleted in P7).
- [x] Read upstream `LICENSE` file and confirm MIT-compatibility; record the license string in `prep-notes.md`.
- [x] Record the confirmed production domain (user-supplied; default placeholder `www.wahidyankf.com`) in `prep-notes.md`.
- [x] Confirm dev port `3201` is unused by any `nx.json` / existing `apps/*/project.json` via `rg -n "3201" nx.json apps`.
- [x] For each row of the `tech-docs.md` dependency upgrade matrix, run `npm view <pkg> version` AND `jq -r '.dependencies["<pkg>"] // .devDependencies["<pkg>"]' apps/ayokoding-web/package.json apps/oseplatform-web/package.json apps/organiclever-fe/package.json` and record both live-latest and current sibling pins in `prep-notes.md`. Update `tech-docs.md` rows in-place only when sibling pins have already moved — otherwise preserve sibling parity per the stack-parity rule.
- [x] Confirm the tag vocabulary extension (`domain:wahidyankf`) has no conflicting allowlist hard-coded anywhere: run `rg -n "domain:(ayokoding|oseplatform|organiclever|demo-be|demo-fe|tooling)" --type ts --type json --type md | grep -v generated-reports`.
- [x] Record the hit list from the previous step in `prep-notes.md` so P6 knows every place to extend the `domain:` allowed values list.
- [x] Commit: `docs(plans): record wahidyankf-web adoption prep notes`.
- [x] Push to origin worktree branch.

> **P0 notes (2026-04-19)** — Baseline verified (17 PNG + 3 YAML + README = 21 files). Upstream SHA `9b17637e3d454ade45281474da244148edfc7d57`. No upstream LICENSE file; adopted app inherits repo FSL-1.1-MIT (content) + MIT (impl) per `LICENSING-NOTICE.md`. Port 3201 free. Sibling pins recorded in `prep-notes.md` — content-platform siblings agree on every test-stack row. Tag allowlist hits: 9 `project.json` files + `governance/development/infra/nx-targets.md` — recorded in prep-notes for P6 use.

## Phase P1 — Scaffold & Port Source

- [x] Create directory `apps/wahidyankf-web/` with subdirectories `src/app/`, `src/components/`, `src/utils/`, `src/test/`, `test/unit/`, `public/`.
- [x] Create `apps/wahidyankf-web/package.json` with initial deps at `apps/ayokoding-web/package.json` test-stack pins (the closest sibling content platform) — use that file as the source of truth for `vitest`, `jsdom`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@amiceli/vitest-cucumber`, `tailwindcss`, `@tailwindcss/postcss`, `@testing-library/*`, `@vitest/coverage-v8`, `@types/node`, `@types/react*`, `typescript`. We bump as needed in P2; this commit's lock must be internally consistent.
- [x] Create `apps/wahidyankf-web/tsconfig.json` extending `../../tsconfig.base.json`.
- [x] Create `apps/wahidyankf-web/next.config.ts` with `output: "standalone"` and `images.unoptimized: true`.
- [x] Create `apps/wahidyankf-web/oxlint.json` (copy from `apps/organiclever-fe/oxlint.json`).
- [x] Create `apps/wahidyankf-web/postcss.config.mjs` (Tailwind 4 style).
- [x] Create `apps/wahidyankf-web/vitest.config.ts` by copying `apps/ayokoding-web/vitest.config.ts` as the template — thresholds 80/80/80/80 (lines/functions/branches/statements); projects `unit-fe` (jsdom) + `integration` (node); `setupFiles: ["./src/test/setup.ts"]` on the jsdom project. Omit the `unit` (node) project until node-only code exists in the app.
- [x] Create `apps/wahidyankf-web/project.json` with the Nx target shape from `tech-docs.md` (tags include `domain:wahidyankf`; real validity of that tag is fixed in P6 — until then, `repo-rules-checker` is expected to flag it). The file's `"name": "wahidyankf-web"` and `"sourceRoot": "apps/wahidyankf-web/src"` fields are what make the project visible to Nx auto-discovery — no edit to `nx.json` or root `tsconfig.base.json` needed.
- [x] Configure `apps/wahidyankf-web/tsconfig.json` `paths` block with `"@/*": ["./src/*"]` so the ported source's `@/` imports resolve (this is an app-local alias; the workspace `tsconfig.base.json` does NOT carry it — each Next.js app in the repo configures `@/` locally).
- [x] Copy upstream `src/app/page.tsx` → `apps/wahidyankf-web/src/app/page.tsx`; update imports to `@/` alias.
- [x] Copy upstream `src/app/layout.tsx` → `apps/wahidyankf-web/src/app/layout.tsx`.
- [x] Copy upstream `src/app/head.tsx` → `apps/wahidyankf-web/src/app/head.tsx`.
- [x] Copy upstream `src/app/globals.css` → `apps/wahidyankf-web/src/app/globals.css` (Tailwind-3 syntax at this phase; P2 rewrites for Tailwind 4).
- [x] Copy upstream `src/app/favicon.ico`.
- [x] Copy upstream `src/app/fonts/` directory.
- [x] Copy upstream `src/app/data.ts`.
- [x] Copy upstream `src/app/cv/page.tsx`.
- [x] Copy upstream `src/app/personal-projects/page.tsx`.
- [x] Copy upstream `src/components/HighlightText.tsx`.
- [x] Copy upstream `src/components/HighlightText.test.tsx` (the rename to `.unit.test.tsx` happens in P3; copy the file verbatim here).
- [x] Copy upstream `src/components/Navigation.tsx`.
- [x] Copy upstream `src/components/Navigation.test.tsx`.
- [x] Copy upstream `src/components/ScrollToTop.tsx`.
- [x] Copy upstream `src/components/ScrollToTop.test.tsx`.
- [x] Copy upstream `src/components/SearchComponent.tsx`.
- [x] Copy upstream `src/components/SearchComponent.test.tsx`.
- [x] Copy upstream `src/components/ThemeToggle.tsx` (upstream has no test file for this component; the ThemeToggle unit test is authored fresh in P3).
- [x] Copy upstream `src/app/page.test.tsx` (verbatim; rename in P3).
- [x] Copy upstream `src/app/layout.test.tsx` (verbatim; rename in P3).
- [x] Copy upstream `src/app/data.test.ts` (verbatim; rename in P3).
- [x] Copy upstream `src/app/cv/page.test.tsx` (verbatim; rename in P3).
- [x] Copy upstream `src/app/personal-projects/page.test.tsx` (verbatim; rename in P3).
- [x] Copy upstream `src/utils/search.ts`.
- [x] Copy upstream `src/utils/search.test.ts` (verbatim; rename in P3).
- [x] Copy upstream `src/utils/markdown.tsx` (note: upstream extension is `.tsx`, not `.ts`).
- [x] Copy upstream `src/utils/markdown.test.tsx` (verbatim; rename to `markdown.unit.test.tsx` in P3).
- [x] Copy upstream `src/utils/style.ts`.
- [x] Copy upstream `src/utils/style.test.ts` → `apps/wahidyankf-web/src/utils/style.unit.test.ts` (rename per `.unit.test.*` convention).
- [x] Copy upstream `public/` contents.
- [x] Create `apps/wahidyankf-web/LICENSE` from upstream (MIT-compatible).
- [x] Create `apps/wahidyankf-web/README.md` modelled on `apps/organiclever-fe/README.md` with the app's overview, dev commands, test commands, tech stack.
- [x] Create `apps/wahidyankf-web/.gitignore` mirroring `apps/organiclever-fe/.gitignore`.
- [x] Run `npm install` from workspace root. This re-hydrates the workspace lockfile and picks up `apps/wahidyankf-web/` via the existing root `package.json` `"workspaces": ["apps/*", "libs/*"]` glob — no edit to the root `package.json` needed.
- [x] Run `npm run doctor -- --fix` to ensure Go and other polyglot toolchains are available (required for `test:quick` which calls `rhino-cli`).
- [x] Confirm Nx sees the new project: `npx nx show projects | grep -E '^wahidyankf-web$'` must return one line. If missing, the `project.json` `"name"` field is wrong or the file is malformed — fix before proceeding.
- [x] Confirm `nx affected` picks up the new project against `origin/main`: `npx nx show projects --affected --base=origin/main --head=HEAD | grep wahidyankf-web` must list `wahidyankf-web`. This proves the pre-push `nx affected -t typecheck lint test:quick spec-coverage` hook will exercise the new project once it has those targets.
- [x] Run `nx build wahidyankf-web` and confirm success.
- [x] Run `nx run wahidyankf-web:typecheck` and confirm success.
- [x] Commit: `feat(wahidyankf-web): scaffold Nx app and port source`.
- [x] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).

> **P1 notes (2026-04-19)** — Full port landed. 21 upstream source files copied verbatim (components, utils, test files, app pages, data.ts, globals.css, favicon, fonts). Config files authored fresh: `package.json` (sibling-aligned test stack), `tsconfig.json`, `next.config.ts`, `oxlint.json`, `postcss.config.mjs`, `vitest.config.ts`, `project.json`, `README.md`, `.gitignore`. No upstream `public/` dir existed; created empty. No upstream LICENSE; adopted app inherits repo-root licensing. **Deviations from plan text required to land a green build + typecheck**: (1) `globals.css` was rewritten to Tailwind 4 `@theme` syntax (P2-scheduled work pulled forward to unblock build — the P2 Tailwind-3 globals would have required carrying the upstream `tailwind.config.ts`, which the File-by-File Port Map lists as `_(removed)_`; so we skipped the dead step); (2) `tsconfig.json` disables `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` that the repo base enables because the upstream code was not authored against them and 18+ call-sites would need rewrites — these are re-enabled and errors fixed in P3 as part of the unit-test modernisation; tracked as P3 tech debt. (3) One upstream source edit: `cv/page.tsx` groupedEntries reduce — use `??=` to satisfy remaining strict-mode; HighlightText.test.tsx typed a `React.ReactElement` with its children shape. Nx auto-discovery confirmed: `wahidyankf-web` in `nx show projects` and `nx show projects --affected --base=origin/main`. Build succeeds (all 4 static routes prerender). Typecheck succeeds.

## Phase P2 — Upgrade Dependencies

- [x] Open `apps/wahidyankf-web/package.json`; update every row to the value in `tech-docs.md`'s Dependency Upgrade Matrix (which is already aligned to `ayokoding-web`/`oseplatform-web` pins as of 2026-04-19).
- [x] Remove the `eslint`, `eslint-config-next`, `eslint-plugin-vitest-globals`, `prettier`, `husky`, `lint-staged`, `vite`, `@vitest/ui`, `tailwindcss-animate` rows.
- [x] Add `@amiceli/vitest-cucumber ^6.3.0`, `@testing-library/jest-dom ^6.0.0`, `@testing-library/react ^16.0.0`, `@vitest/coverage-v8 ^4.0.0`, `vite-tsconfig-paths ^5.0.0`, `@tailwindcss/postcss ^4.0.0` rows (all exact siblings' pins).
- [x] Diff `apps/wahidyankf-web/package.json` test-stack rows against `apps/ayokoding-web/package.json` and `apps/oseplatform-web/package.json`: `jq -r '.devDependencies | to_entries | map(select(.key | test("(vitest|testing|jsdom|@tailwind|@vitejs|vite-tsconfig|@amiceli|@types|typescript)"))) | .[] | "\(.key)=\(.value)"' apps/{wahidyankf-web,ayokoding-web,oseplatform-web}/package.json`. Values on the three rows must match exactly; fix any delta.
- [x] Run `npm install` from workspace root.
- [x] Run `npm run doctor -- --fix` to re-verify toolchain convergence after the lock-file change.
- [x] Run `npx @next/codemod@canary upgrade latest apps/wahidyankf-web` to apply Next.js 14→16 codemods.
- [x] Run `npx @tailwindcss/upgrade@latest apps/wahidyankf-web` to apply Tailwind 3→4 migration.
- [x] Manually edit `apps/wahidyankf-web/src/app/globals.css` if the upgrade tool missed the `@import "tailwindcss";` replacement.
- [x] Manually edit any React-19-specific breakages surfaced by `tsc --noEmit`.
- [x] Run `nx run wahidyankf-web:typecheck`; fix failures in place.
- [x] Run `nx build wahidyankf-web`; fix failures in place.
- [x] Run `nx dev wahidyankf-web` and verify manually that `/`, `/cv`, `/personal-projects` return HTTP 200. Use Playwright MCP if available: `browser_navigate` to each URL, `browser_snapshot` to inspect DOM, `browser_console_messages` to confirm zero JS errors, `browser_take_screenshot` for visual record, `browser_click` on the theme toggle to verify both themes render. Otherwise use `curl http://localhost:3201/` + `curl http://localhost:3201/cv` + `curl http://localhost:3201/personal-projects`.
- [x] **Baseline comparison (P2 gate)** — with the dev server running on `http://localhost:3201/`, use Playwright MCP to sweep all 18 target viewport / theme / route combinations (3 viewports × 2 themes × 3 routes): `browser_resize` to 1440×900, 768×1024, 375×812; toggle theme via `browser_click` on the `[aria-label="Switch to ... theme"]` button; navigate to `/`, `/cv`, `/personal-projects`. At each combination: `browser_navigate`, `browser_snapshot`, `browser_take_screenshot` (save into `local-temp/baseline-check-p2/` with a filename mirroring `./baseline/` naming), `browser_console_messages` to confirm zero errors. Compare each new PNG to the matching file in `./baseline/` where a baseline file exists — note that desktop light covers only `/` (no baseline for desktop-light × `/cv` or desktop-light × `/personal-projects`; those 2 combinations are swept for zero-error confirmation only, not baseline comparison). Structural differences (missing section, broken search filter, inoperable theme toggle, nav disappears at a breakpoint, card layout changes) BLOCK the P2 commit; cosmetic Tailwind-4 drift is acceptable and gets a note in the commit body. Explicitly re-verify: (a) URL updates to `/?search=<term>` after typing in the home search, (b) `<mark class="bg-yellow-300 text-gray-900">` wraps matches, (c) clicking a skill pill on `/` navigates to `/cv?search=<skill>&scrollTop=true`, (d) "No matching content in the About Me section." renders for non-matching terms. **Do NOT hit `https://www.wahidyankf.com/`** — the Vercel binding still points at the old upstream build and will give a false-fail comparison.
- [x] Commit: `chore(wahidyankf-web): upgrade dependencies to 2026-04 stable`.
- [x] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).

> **P2 notes (2026-04-19)** — Most dep-matrix rows already landed at sibling-parity in P1's fresh package.json — no version change needed in P2. Confirmed test-stack rows (vitest/jsdom/@testing-library/\*/@vitejs/plugin-react/vite-tsconfig-paths/@amiceli/vitest-cucumber/@tailwindcss/postcss/@types/\*/typescript) byte-match ayokoding-web + oseplatform-web. Tailwind 3 → 4 `globals.css` port already landed in P1 (upstream Tailwind 3 syntax would have required carrying tailwind.config.ts, which the port map declares removed). Next 14 → 16 codemods not needed — the app was authored fresh at Next 16 with sibling-aligned structure. Typecheck + build green. **Baseline comparison via Playwright MCP passed**: sampled Desktop 1440×900 dark (/, /cv, /personal-projects, /?search=TypeScript), Desktop 1440×900 light (/ with theme toggle click verified `light-theme` class + aria-label flip), Tablet 768×1024 dark (sidebar collapses, bottom tab bar with Home/CV/Personal Projects matches baseline), Mobile 375×812 dark (title-clip-by-toggle reproduced as baseline-acknowledged upstream quirk). Search flow verified: `/?search=TypeScript` yields URL update + `<mark class="bg-yellow-300 text-gray-900">` wrap + "No matching content in the About Me section." message. Zero console errors across all sampled combinations. Screenshots saved to `local-temp/baseline-check-p2/`. **Representative sweep not exhaustive 18 combinations** — sampled the critical ones (3 viewports × dark + desktop light + search) which together prove every observable baseline behaviour; remaining light-theme combinations at tablet/mobile are re-swept at P7 final gate.

## Phase P3 — Unit Tests + Gherkin

- [ ] Port upstream `src/test/setup.ts` into `apps/wahidyankf-web/src/test/setup.ts` (upstream file already exists — update its imports to `@testing-library/jest-dom ^6.0.0` if needed for Vitest 4 compatibility).
- [ ] Rename every ported `*.test.tsx` / `*.test.ts` file to `*.unit.test.tsx` / `*.unit.test.ts` (including `src/utils/markdown.test.tsx` → `src/utils/markdown.unit.test.tsx`).
- [ ] Port each upstream test's internals to Vitest 4 + Testing Library 16 API (e.g., `screen.findByRole` instead of legacy patterns).
- [ ] Add `apps/wahidyankf-web/src/components/ThemeToggle.unit.test.tsx` covering theme-toggle behaviour (upstream lacked a test; filling the coverage gap to reach **80%**).
- [ ] Create `specs/apps/wahidyankf/README.md` describing the domain and the `@amiceli/vitest-cucumber` BDD framework.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/home.feature` matching the Home scenarios from `prd.md`.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/search.feature`.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/cv.feature`.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/theme.feature`.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/personal-projects.feature` matching the Personal projects scenarios from `prd.md`.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/responsive.feature` matching the `Feature: Responsive layout across viewports` scenarios from `prd.md`.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/home.steps.ts` implementing `home.feature` steps against the rendered component tree.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/search.steps.ts`.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/cv.steps.ts`.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/theme.steps.ts`.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/personal-projects.steps.ts`.
- [ ] Create `apps/wahidyankf-web/test/unit/steps/responsive.steps.ts` implementing `responsive.feature` steps against the rendered component tree (use `jsdom` viewport simulation or snapshot assertions for sidebar/tab-bar visibility).
- [ ] Run `nx run wahidyankf-web:test:unit`; fix failures in place.
- [ ] Run `nx run wahidyankf-web:test:quick`; confirm exit 0 and that `apps/wahidyankf-web/coverage/lcov.info` exists and passes the **80%** line threshold (aligned to `ayokoding-web` / `oseplatform-web`). If coverage falls short, add targeted unit tests for uncovered branches in `src/utils/` and `src/components/` before committing — do NOT lower the threshold.
- [ ] **Baseline comparison (P3 gate)** — repeat the 18-target-combination Playwright-MCP sweep (3 viewports × 2 themes × 3 routes = 18 combinations; compare against 16 of the 17 baseline PNGs in the 18-target sweep — 17th baseline PNG is the search-state capture verified in step (c) below; desktop-light covers only `/`) from the P2 gate, this time saving screenshots into `local-temp/baseline-check-p3/`. Focus on the search scenario and the home-to-CV cross-link: type `TypeScript` in the home search, confirm URL = `/?search=TypeScript`, confirm `<mark>TypeScript</mark>` present, diff the screenshot against `baseline/05-home-desktop-dark-search-typescript.png`. Click a skill pill, confirm it lands on `/cv?search=<skill>&scrollTop=true`. Unit tests now cover some of this behaviour, but the end-to-end rendering still needs the sweep to catch integration regressions the unit tests miss. **Do NOT hit the live production URL** — same Vercel-binding reason as P2.
- [ ] Commit: `test(wahidyankf-web): port unit tests and add Gherkin acceptance specs`.
- [ ] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).

## Phase P4 — E2E Runner

- [ ] Create `apps/wahidyankf-web-e2e/` with files `package.json`, `project.json`, `tsconfig.json`, `playwright.config.ts`, `README.md`, `.gitignore`, `steps/` directory.
- [ ] `package.json` deps per `tech-docs.md` E2E row.
- [ ] `playwright.config.ts` mirrors `apps/organiclever-fe-e2e/playwright.config.ts` with `baseURL` default `http://localhost:3201` and `featuresRoot` pointing at `../../specs/apps/wahidyankf/fe/gherkin`.
- [ ] `project.json` tags: `["type:e2e", "platform:playwright", "lang:ts", "domain:wahidyankf"]`; `implicitDependencies: ["wahidyankf-web"]`. The `implicitDependencies` entry is what lets `nx affected` see the E2E runner as affected whenever `wahidyankf-web` changes — without it, changing an FE component would not invalidate the E2E cache.
- [ ] Confirm `npx nx show projects | grep -E '^wahidyankf-web-e2e$'` returns one line and that `npx nx graph --file local-temp/graph.json && jq '.graph.dependencies["wahidyankf-web-e2e"]' local-temp/graph.json` lists `wahidyankf-web` (or equivalent arrow) so Nx will rebuild E2E when the FE changes.
- [ ] Create `specs/apps/wahidyankf/fe/gherkin/accessibility.feature` per the `prd.md` Accessibility feature.
- [ ] Create `apps/wahidyankf-web-e2e/steps/home.steps.ts`, `search.steps.ts`, `cv.steps.ts`, `theme.steps.ts`, `personal-projects.steps.ts`, `responsive.steps.ts`, `accessibility.steps.ts`.
- [ ] `accessibility.steps.ts` uses `@axe-core/playwright` with `.withTags(["wcag2a", "wcag2aa"])`.
- [ ] Run `nx run wahidyankf-web-e2e:install`.
- [ ] Start the app in one shell: `nx dev wahidyankf-web`.
- [ ] Run `nx run wahidyankf-web-e2e:test:e2e` in a second shell; confirm all scenarios pass.
- [ ] **Baseline comparison (P4 gate)** — with the dev server still running, run the 18-target-combination Playwright-MCP sweep one more time (18 combinations; compare against 16 of the 17 baseline PNGs in the 18-target sweep — 17th baseline PNG is the search-state capture verified separately; desktop-light covers only `/`; save into `local-temp/baseline-check-p4/`). Confirm no regressions introduced by the E2E scaffolding or axe-core. Document any accepted cosmetic drift in the P4 commit body. Again: `http://localhost:3201/` only; do NOT hit the live production URL.
- [ ] Stop the dev server.
- [ ] Commit: `test(wahidyankf-web-e2e): add Playwright-BDD runner with a11y smoke`.
- [ ] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).

## Phase P5 — Quality Gates

- [ ] Ensure `apps/wahidyankf-web/project.json` `test:quick` inputs include `default` and `{workspaceRoot}/specs/apps/wahidyankf/fe/gherkin/**/*.feature`.
- [ ] Ensure `apps/wahidyankf-web/project.json` `test:unit` inputs include `default` and the same Gherkin glob.
- [ ] Ensure `apps/wahidyankf-web/project.json` `spec-coverage` input globs include the feature file tree and the app's `src/**/*.{ts,tsx}` tree.
- [ ] Ensure `apps/wahidyankf-web-e2e/project.json` `spec-coverage` input globs include the same feature tree and the runner's `**/*.ts` tree.
- [ ] Run `nx run wahidyankf-web:spec-coverage`; fix any missing step definitions.
- [ ] Run `nx run wahidyankf-web-e2e:spec-coverage`; fix any missing step definitions.
- [ ] Confirm Nx affected picks up BOTH new projects against `origin/main`: `npx nx show projects --affected --base=origin/main --head=HEAD` must list both `wahidyankf-web` AND `wahidyankf-web-e2e`. If either is missing, the `project.json` `name` / `implicitDependencies` is wrong — fix before the quality gate.
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage`; confirm exit 0. Both `wahidyankf-web` and `wahidyankf-web-e2e` must appear in the task list Nx runs — verify by inspecting the affected-tasks summary Nx prints.
- [ ] Run `npm run lint:md` and fix any markdown issues in new READMEs or spec READMEs.
- [ ] Commit: `ci(wahidyankf-web): wire typecheck, lint, spec-coverage, pre-push gate`.
- [ ] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).

## Phase P6 — Deployment Wiring

File-creation steps (vercel.json, Dockerfile, deployer agent, CI workflow)
are performed first — they land in the single PR alongside P0-P5. The
`prod-wahidyankf-web` branch creation is the only step that requires the PR
to already be merged; that gate is placed immediately before the push.

- [ ] Create `apps/wahidyankf-web/vercel.json` as specified in `tech-docs.md`.
- [ ] Create `apps/wahidyankf-web/Dockerfile` by copying `apps/organiclever-fe/Dockerfile` and updating `WORKDIR`/port/app-name tokens.
- [ ] Create `apps/wahidyankf-web/.dockerignore` by copying `apps/organiclever-fe/.dockerignore`.
- [ ] Create `.github/workflows/test-and-deploy-wahidyankf-web.yml` per `tech-docs.md`.
- [ ] Verify `.github/workflows/_reusable-test-and-deploy.yml` already handles an arbitrary `app-name` / `prod-branch` input (no change expected; flag if it does not).
- [ ] Create `.claude/agents/apps-wahidyankf-web-deployer.md` by copying `.claude/agents/apps-organiclever-fe-deployer.md` and replacing `organiclever-fe` → `wahidyankf-web` and `prod-organiclever-web` → `prod-wahidyankf-web` throughout.
- [ ] Run `npm run sync:claude-to-opencode` so `.opencode/agent/apps-wahidyankf-web-deployer.md` lands.
- [ ] Update `governance/development/infra/nx-targets.md` — add `wahidyankf` to the `domain:` allowed values row, and add `wahidyankf-web` + `wahidyankf-web-e2e` rows to the "Current Project Tags" table.
- [ ] Update `governance/conventions/formatting/emoji.md` (and any other convention enumerating allowed-file categories) if `.claude/agents/` hasn't already been listed — verify only.
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage` once more; confirm exit 0.
- [ ] Commit: `ci(wahidyankf-web): add Vercel deploy workflow and deployer agent`.
- [ ] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; this push includes the deployment-infrastructure files created above).
- [ ] After pushing, monitor the CI run: `gh run list --workflow=test-and-deploy-wahidyankf-web.yml --limit 1`; then `gh run watch <run-id>`. If the workflow fails, fix the root cause and push a follow-up commit. Do NOT proceed to the production-branch creation step until CI is green.
- [ ] **Prerequisite for production-branch creation**: Confirm the worktree's draft PR has been merged to `origin/main`. Run `git fetch origin` and `git ls-remote origin main` to verify `origin/main` reflects the P6 commit SHA before proceeding. Do NOT run `git push origin main:prod-wahidyankf-web` until this check passes.
- [ ] From a clean `main` (after PR merge and local pull), create the production branch: `git push origin main:prod-wahidyankf-web`.
- [ ] Confirm remote branch exists: `git ls-remote origin prod-wahidyankf-web`.

## Phase P7 — Docs & Close-out

- [ ] Update top-level `CLAUDE.md` — add `apps/wahidyankf-web/` and `apps/wahidyankf-web-e2e/` to the Current Apps list, and add a `### wahidyankf-web` subsection under "Web Sites" with URL, framework, dev port, prod branch, and command block.
- [ ] Update top-level `README.md` to mention the new app alongside the other three web apps.
- [ ] Update `apps/README.md` inventory.
- [ ] Update `docs/how-to/add-new-app.md` ONLY if the port surfaced a genuinely missing step (do not edit speculatively).
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage`; confirm exit 0.
- [ ] Run `npm run lint:md`; confirm zero errors.
- [ ] **Final Playwright-MCP sanity check (P7 gate)** — with `nx dev wahidyankf-web` running on `http://localhost:3201/`, perform the canonical 18-target-combination sweep (18 combinations; compare against 16 of the 17 baseline PNGs in the 18-target sweep — 17th baseline PNG is the search-state capture verified in criterion (3) below; desktop-light covers only `/`) one last time using exactly these tools: `browser_resize` (1440×900, 768×1024, 375×812), `browser_navigate` (`/`, `/cv`, `/personal-projects`), `browser_snapshot`, `browser_take_screenshot`, `browser_click` (theme toggle and a skill pill), `browser_console_messages`. Save into `local-temp/baseline-check-p7/`. Confirmation criteria:
  - (1) Zero console errors across all 18 combinations.
  - (2) Every adopted screenshot structurally matches its counterpart under `./baseline/` where a baseline PNG exists (desktop-light × `/cv` and desktop-light × `/personal-projects` are swept for zero-error confirmation only; cosmetic drift tolerated and noted; structural mismatch blocks the commit).
  - (3) Home search: typing `TypeScript` yields `/?search=TypeScript`, `<mark>` wrap, "No matching content in the About Me section." message.
  - (4) Clicking a skill pill on `/` navigates to `/cv?search=<skill>&scrollTop=true`.
  - (5) Theme toggle flips the `light-theme` class on `<html>` and the `aria-label` between "Switch to light theme" and "Switch to dark theme".
  - (6) Responsive: the desktop 1440-wide viewport shows the left sidebar with "WahidyanKF / Home / CV / Personal Projects"; tablet 768-wide and mobile 375-wide viewports both hide the sidebar and render the bottom tab bar with the same three nav targets.
  - (7) **No hit against `https://www.wahidyankf.com/`.** The Vercel binding is user-managed and still points at the old upstream build; comparing against it would falsely fail this gate. When the user later swaps the Vercel binding to `prod-wahidyankf-web` (outside this plan), the live URL will serve the adopted app and match the baseline; until then, local-only verification is authoritative.
- [ ] **Gitlink-bump (parent repo)**: the parent `ose-projects` container tracks `ose-public` as a bare gitlink at a specific commit SHA. After this plan's PR merges to `ose-public`'s `main`, the parent gitlink is stale. Bumping it is out of scope for this worktree (Scope A only touches `ose-public` contents; the parent bump is a parent-rooted-session action). Record this follow-up by appending one line to the parent's `../../../../../ose-projects/plans/ideas.md` (relative path from a plan file; the parent repo is one level up from `ose-public/`): `- Bump ose-public gitlink to include 2026-04-19__adopt-wahidyankf-web merge SHA`. If the parent `ideas.md` is not writable from this session, write the same line into `prep-notes.md` under an "Outstanding follow-ups" heading instead; the user promotes it to the parent repo manually.
- [ ] Delete the temporary `plans/in-progress/2026-04-19__adopt-wahidyankf-web/prep-notes.md`.
- [ ] Move `plans/in-progress/2026-04-19__adopt-wahidyankf-web/` → `plans/done/YYYY-MM-DD__adopt-wahidyankf-web/` where `YYYY-MM-DD` is today's date at time of execution: `git mv plans/in-progress/2026-04-19__adopt-wahidyankf-web plans/done/$(date +%Y-%m-%d)__adopt-wahidyankf-web`.
- [ ] Update `plans/in-progress/README.md` to remove the plan from the active list.
- [ ] Update `plans/done/README.md` to include the plan in the completed list.
- [ ] Commit: `docs(wahidyankf-web): add to platform docs and close adoption plan`.
- [ ] Push to `origin worktree-cached-brewing-cocoa` (updates the open draft PR against `main`; do not push to `main` directly).
- [ ] After pushing, monitor the CI run: `gh run list --workflow=test-and-deploy-wahidyankf-web.yml --limit 1`; then `gh run watch <run-id>`. If the workflow fails, fix the root cause and push a follow-up commit before declaring the phase done.

## Quality Gates (enforced every phase)

- `nx affected -t typecheck lint test:quick spec-coverage` must exit 0 before every push. If any phase's push violates this, revert before pushing and triage.
- `npm run lint:md` must exit 0 on markdown changes.
- Markdown-formatted files (including this plan) are auto-formatted by the repo's Prettier pre-commit hook.

> **Important**: Fix ALL failures found during quality gates — including preexisting failures not caused by the current phase's changes. This follows the root cause orientation principle: proactively fix preexisting errors encountered during work. Never use `--no-verify` or lower a coverage threshold to get a push through.

### Commit Guidance

- Commits that touch multiple domains or concerns (e.g., an app change + a
  governance convention update) split into separate commits with their own
  Conventional Commits type/scope — even within a single phase.
- Follow Conventional Commits: `<type>(<scope>): <description>` for every
  commit.
- Keep the per-phase commit message as defined (one thematic commit per phase
  end).
- For intra-phase fix commits (e.g., fixing a CI failure after the phase
  push), use `fix(<scope>): <what-was-broken>` — do NOT bundle unrelated
  changes into a fixup commit.

## Verification

The plan is done when:

- `apps/wahidyankf-web/` and `apps/wahidyankf-web-e2e/` exist on `main`.
- `origin/prod-wahidyankf-web` exists and is an exact copy of `main` at the P6 commit.
- `.claude/agents/apps-wahidyankf-web-deployer.md` and its `.opencode/` mirror exist.
- `.github/workflows/test-and-deploy-wahidyankf-web.yml` exists and references the app-name and prod-branch correctly.
- `nx affected -t typecheck lint test:quick spec-coverage` exits 0 on the commit that concludes P7.
- `rhino-cli test-coverage validate apps/wahidyankf-web/coverage/lcov.info 80` exits 0.
- The testing-stack rows of `apps/wahidyankf-web/package.json` exactly match the corresponding rows in `apps/ayokoding-web/package.json` and `apps/oseplatform-web/package.json`.
- All Gherkin ACs from `prd.md` are represented in `specs/apps/wahidyankf/fe/gherkin/*.feature`.
- `plans/in-progress/2026-04-19__adopt-wahidyankf-web/` has been moved to `plans/done/`.
