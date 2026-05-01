# Delivery — OrganicLever Web Routes Under `/app`

## How To Use This Checklist

- One checkbox = one concrete action.
- Phases land sequentially; CI must be green between phases.
- After every phase, run `nx affected -t typecheck lint test:quick spec-coverage` from the `ose-public/` workspace root and confirm green before moving on.
- Manual smoke checks at the end of each phase are listed under that phase, not bundled at the end.

## Phase 0 — Plan, Specs, Scaffolding, Dev Env

- [ ] Confirm plan documents (`README.md`, `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`) are present and pass `plan-checker`
- [ ] Run plan quality gate workflow (`plan-checker` → `plan-fixer` until double-zero pass)
- [ ] Verify dev environment: `npm install && npm run doctor -- --fix` from repo root; then `nx dev organiclever-web` boots on `localhost:3200` and `/app` renders the current AppRoot
- [ ] Create `specs/apps/organiclever/fe/gherkin/routing/app-routes.feature` with the URL-scheme + redirect scenarios from `prd.md` (AC-1, AC-2, AC-4, AC-5, AC-8, AC-12)
- [ ] Update `specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature` to add a "URL persists across refresh" scenario (AC-4)
- [ ] Update `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature` to add an "AC-8 redirect" scenario alongside the existing `/login` and `/profile` 404 rows
- [ ] Run `npm run lint:md` and confirm clean

## Phase 1 — `app/` Layout + Tab Pages + Index Redirect

Note: introducing `app/app/layout.tsx` causes the existing `app/app/page.tsx` (which renders `<AppRoot />` with its own chrome) to double-render shell chrome. Therefore the index-page rewrite to `permanentRedirect("/app/home")` lands in this same phase, not later.

- [ ] Create `apps/organiclever-web/src/components/app/app-runtime-context.tsx` exporting `<AppRuntimeProvider>` + `useAppRuntime()` hook (carries runtime, machine state, send, refreshHome callback)
- [ ] Create `apps/organiclever-web/src/components/app/overlay-tree.tsx` rendering `AddEntrySheet`, four loggers, custom logger — driven by `useAppRuntime()`
- [ ] Create `apps/organiclever-web/src/app/app/layout.tsx`: client layout, `force-dynamic`, mounts runtime, dark-mode + breakpoint + seed effects, renders `<SideNav>` / `<TabBar>` only when on a main tab path, wraps children in `<AppRuntimeProvider>`, includes `noindex` meta
- [ ] Rewrite `apps/organiclever-web/src/app/app/page.tsx` from rendering `<AppRoot />` to a server component calling `permanentRedirect("/app/home")` from `next/navigation`
- [ ] Create `apps/organiclever-web/src/app/app/home/page.tsx` rendering `<HomeScreen>` via `useAppRuntime()`
- [ ] Create `apps/organiclever-web/src/app/app/history/page.tsx` rendering `<HistoryScreen>`
- [ ] Create `apps/organiclever-web/src/app/app/progress/page.tsx` rendering `<ProgressScreen>`
- [ ] Create `apps/organiclever-web/src/app/app/settings/page.tsx` rendering `<SettingsScreen>` (passes `darkMode` + `onToggleDarkMode` from machine)
- [ ] Add `apps/organiclever-web/src/app/app/layout.unit.test.tsx` covering: chrome visible on main tab path, chrome hidden on workout path, overlay tree always rendered, breakpoint flip mounts SideNav vs TabBar
- [ ] `nx run organiclever-web:typecheck` green
- [ ] `nx run organiclever-web:test:quick` green and coverage ≥ 70%
- [ ] Manual smoke: visit `/app/home`, `/app/history`, `/app/progress`, `/app/settings` — each renders the right screen with shell chrome (old `/app` still works in parallel)

## Phase 2 — Link-Based Navigation Chrome

- [ ] Update `apps/organiclever-web/src/components/app/tab-bar.tsx` to use `next/link` with hard-coded `href` per tab; derive `active` from `usePathname()`; remove `onNavigate` prop, keep `onFabPress`
- [ ] Update `apps/organiclever-web/src/components/app/side-nav.tsx` similarly: `next/link`, `usePathname()`, drop `onNavigate`, keep `onLogEntry`
- [ ] Update unit tests `tab-bar.unit.test.tsx` and `side-nav.unit.test.tsx` (or add if missing) to assert: tab `<a>` elements render with correct `href`, active aria-current matches pathname, FAB still calls `onFabPress`
- [ ] Refactor `app-runtime-context.tsx` to expose `OPEN_ADD_ENTRY` send callback used by both chromes
- [ ] `nx run-many --projects organiclever-web -t typecheck lint test:quick` green
- [ ] Manual smoke: tab clicks change URL and active style; FAB opens AddEntry on every main tab

## Phase 3 — Workout / Finish / Edit-Routine Routes

- [ ] Create `apps/organiclever-web/src/app/app/workout/page.tsx` rendering `<WorkoutScreen>`; if no active routine in `AppRuntimeProvider` context, `redirect("/app/home")`
- [ ] Create `apps/organiclever-web/src/app/app/workout/finish/page.tsx` rendering `<FinishScreen>`; if no completed session in context (or fetched via `useJournal` last session), `redirect("/app/home")`
- [ ] Create `apps/organiclever-web/src/app/app/routines/edit/page.tsx` rendering `<EditRoutineScreen>`; if no routine in context, `redirect("/app/home")`
- [ ] Extend `AppRuntimeProvider` to hold `activeRoutine` and `completedSession` in React state, with setters callable from Home and WorkoutScreen
- [ ] Update `HomeScreen` callsite to call `setActiveRoutine(routine)` then `useRouter().push("/app/workout")` instead of dispatching `START_WORKOUT`
- [ ] Update `HomeScreen` callsite for `onEditRoutine` to set context routine then `useRouter().push("/app/routines/edit")`
- [ ] Update `WorkoutScreen.onFinishWorkout` callsite in the workout page wrapper to `setCompletedSession(session)` then `useRouter().push("/app/workout/finish")`
- [ ] Update `FinishScreen.onBack` and `EditRoutineScreen.onBack` to `useRouter().back()` (or `push("/app/home")` as fallback when no history)
- [ ] Layout reads `pathname` and hides TabBar/SideNav when path starts with `/app/workout` or `/app/routines`
- [ ] Add unit tests for the three new pages: redirect-when-context-empty, render-when-context-present
- [ ] `nx run-many --projects organiclever-web -t typecheck lint test:quick` green
- [ ] Manual smoke: start workout from Home → URL `/app/workout`; finish → `/app/workout/finish`; edit routine → `/app/routines/edit`; type `/app/workout` fresh in URL bar → redirects to `/app/home`

## Phase 4 — Landing CTA + Cross-Reference Cleanup

- [ ] Update `apps/organiclever-web/src/components/landing/landing-page.tsx` to push `/app/home` instead of `/app`
- [ ] Grep `apps/organiclever-web` and `apps/organiclever-web-e2e` for `"/app"` and inspect each match — update any source references that should now point at `/app/home` (skip the redirect site at `app/app/page.tsx` itself, and skip e2e files that will be migrated in Phase 6)
- [ ] `nx run-many --projects organiclever-web -t typecheck lint test:quick` green
- [ ] Manual smoke: visit `http://localhost:3200/app` → 308 → `/app/home`; landing CTA opens `/app/home`

## Phase 5 — Trim `appMachine`, Delete `use-hash`

- [ ] Rewrite `apps/organiclever-web/src/lib/app/app-machine.ts` to drop the `navigation` parallel region; keep an overlay-only machine (or two parallel regions limited to `overlay` + a context-only carrier for darkMode + isDesktop)
- [ ] Remove these from `AppMachineEvent` and `AppMachineContext`: `tab`, `routine`, `completedSession`, `START_WORKOUT`, `EDIT_ROUTINE`, `FINISH_WORKOUT`, `BACK_TO_MAIN`, `NAVIGATE_TAB`, `CompletedSession` interface
- [ ] Update `app-machine.unit.test.ts` to remove navigation-region cases; add coverage for the trimmed event set (overlay transitions + darkMode toggle + breakpoint set)
- [ ] Delete `apps/organiclever-web/src/lib/hooks/use-hash.ts`
- [ ] Verify `grep -rn "use-hash\|useHash\|navigation: \"\\(main\\|workout\\|finish\\|editRoutine\\)\"" apps/organiclever-web/src` returns no match
- [ ] Rename `apps/organiclever-web/src/components/app/app-root.tsx` → `app-shell.tsx` if it survives as a helper, or delete it entirely if `app/layout.tsx` fully replaces it
- [ ] Remove `localStorage.ol_tab` write/read code (now vestigial)
- [ ] `nx run-many --projects organiclever-web -t typecheck lint test:quick` green
- [ ] Coverage still ≥ 70% (add tests if dropped below)

## Phase 6 — E2E + Specs + Docs

- [ ] Create `apps/organiclever-web-e2e/steps/_app-shell.ts` exporting `APP_BASE_URL = "http://localhost:3200"` and helper `appPath(tab)` returning `${APP_BASE_URL}/app/${tab}`
- [ ] Update `apps/organiclever-web-e2e/steps/app-shell.steps.ts` — replace every `goto("http://localhost:3200/app")` with the appropriate `appPath` call
- [ ] Update `apps/organiclever-web-e2e/steps/home-screen.steps.ts` similarly
- [ ] Update `apps/organiclever-web-e2e/steps/history-screen.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/progress-screen.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/settings.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/workout-session.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/routine-management.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/entry-loggers.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/journal-mechanism.steps.ts`
- [ ] Update `apps/organiclever-web-e2e/steps/disabled-routes.steps.ts` to add the `/app` 308 redirect assertion
- [ ] Confirm `accessibility.steps.ts`, `landing.steps.ts`, `system-status-be.steps.ts` need no URL changes (they target `/` and `/system/status/be`)
- [ ] Update Gherkin specs touched in Phase 0 if scenario wording drifted (verify with `specs-checker` if available)
- [ ] Update `apps/organiclever-web/README.md` route table and any architecture diagram referring to `/app`
- [ ] Verify `apps/organiclever-web/docs/` contains no route documentation requiring updates (currently only `screenshots/`); if any new route refs appear during the refactor, update them
- [ ] `nx run organiclever-web-e2e:test:e2e` green (full Playwright run)
- [ ] `npm run lint:md` clean

## Phase 7 — Quality Gate + Manual Verify + Dev CI Workflow

- [ ] `nx affected -t typecheck lint test:quick spec-coverage` green from repo root (fix ALL failures including any preexisting issues found during the run; root-cause orientation)
- [ ] `nx run organiclever-web-e2e:test:e2e` green
- [ ] Manual UI Verification (Playwright MCP) — all 12 items from `tech-docs.md` Verification section pass:
  - [ ] Start dev server: `nx dev organiclever-web`
  - [ ] **Home tab** — `browser_navigate` to `http://localhost:3200/app/home`; `browser_snapshot` confirms Home screen visible and Home tab active; `browser_console_messages` returns zero errors; `browser_take_screenshot` for record
  - [ ] **History tab** — `browser_navigate` to `http://localhost:3200/app/history`; `browser_snapshot` confirms History screen + History tab active; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Progress tab** — `browser_navigate` to `http://localhost:3200/app/progress`; `browser_snapshot` confirms Progress screen + Progress tab active; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Settings tab** — `browser_navigate` to `http://localhost:3200/app/settings`; `browser_snapshot` confirms Settings screen + Settings tab active; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Workout flow** — from Home tab, `browser_click` a routine card's start button; `browser_snapshot` confirms URL is `/app/workout` and TabBar is hidden; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Finish flow** — from `/app/workout`, `browser_click` finish workout; `browser_snapshot` confirms URL is `/app/workout/finish` and Finish screen is visible; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Edit-Routine flow** — from Home tab, `browser_click` a routine's edit action; `browser_snapshot` confirms URL is `/app/routines/edit` and TabBar is hidden; `browser_console_messages` zero errors; `browser_take_screenshot`
  - [ ] **Redirect** — `browser_navigate` to `http://localhost:3200/app`; `browser_snapshot` confirms URL resolves to `/app/home` (308 redirect followed); `browser_console_messages` zero errors
  - [ ] Confirm zero console errors across all routes above
- [ ] `git status` clean
- [ ] Commit thematically using Conventional Commits (`feat(organiclever-web): ...`, `test(organiclever-web-e2e): ...`, `docs(organiclever-web): ...`, etc.) — split frontend, e2e, and docs concerns into separate commits
- [ ] Push to `origin main`
- [ ] Trigger `.github/workflows/test-and-deploy-organiclever-web-development.yml` via `gh workflow run test-and-deploy-organiclever-web-development.yml --ref main` (workflow already declares `workflow_dispatch`)
- [ ] Monitor the dispatched run via `gh run list --workflow=test-and-deploy-organiclever-web-development.yml --limit 1` and `gh run view <run-id>`; poll on a 3–5 min cadence using `ScheduleWakeup(delaySeconds=180)` per the CI monitoring convention — never tight-loop polling, never `gh run watch` for jobs longer than 5 min
- [ ] If the dev workflow fails, investigate the root cause and fix; re-trigger and re-monitor until green; do not declare done while red
- [ ] Run `plan-execution-checker` and confirm all requirements + acceptance criteria pass
- [ ] Move plan folder to `plans/done/` and update both `in-progress/README.md` and `done/README.md`

## Acceptance Verification Checklist

Each acceptance criterion in `prd.md` must be satisfied at the end of Phase 7:

- [ ] AC-1 — `/app` redirect to `/app/home` (Phase 1 + Phase 7 manual)
- [ ] AC-2 — every tab path renders the right screen (Phase 1 + Phase 6 e2e)
- [ ] AC-3 — tab clicks change URL (Phase 2 + Phase 6 e2e)
- [ ] AC-4 — refresh stays put (Phase 6 e2e)
- [ ] AC-5 — browser back works (Phase 6 e2e)
- [ ] AC-6 — workout/finish routes (Phase 3 + Phase 6 e2e)
- [ ] AC-7 — routine editor route (Phase 3 + Phase 6 e2e)
- [ ] AC-8 — `/app` 308 (Phase 1 + Phase 6 e2e)
- [ ] AC-9 — `/login` and `/profile` still 404 (Phase 6 e2e — no regression)
- [ ] AC-10 — chrome persists (Phase 1 manual + Phase 7 manual)
- [ ] AC-11 — Add Entry FAB still works on every tab (Phase 2 + Phase 6 e2e)
- [ ] AC-12 — unknown sub-paths 404 (Phase 7 manual)
- [ ] AC-13 — appMachine has no navigation region (Phase 5 grep verification)
