# Delivery — OrganicLever Web Routes Under `/apps`

## How To Use This Checklist

- One checkbox = one concrete action.
- Phases land sequentially; CI must be green between phases.
- After every phase, run `nx affected -t typecheck lint test:quick spec-coverage` from `apps/organiclever-web` and confirm green before moving on.
- Manual smoke checks at the end of each phase are listed under that phase, not bundled at the end.

## Phase 0 — Plan, Specs, Scaffolding

- [ ] Confirm plan documents (`README.md`, `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`) are present and pass `plan-checker`
- [ ] Run plan quality gate workflow (`plan-checker` → `plan-fixer` until double-zero pass)
- [ ] Create `specs/apps/organiclever/fe/gherkin/routing/apps-routes.feature` with the URL-scheme + redirect scenarios from `prd.md` (AC-1, AC-2, AC-4, AC-5, AC-8, AC-12)
- [ ] Update `specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature` to add a "URL persists across refresh" scenario (AC-4)
- [ ] Update `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature` to add an "AC-8 redirect" scenario alongside the existing `/login` and `/profile` 404 rows
- [ ] Run `npm run lint:md` and confirm clean

## Phase 1 — `apps/` Layout + Tab Pages (Parallel To `/app`)

- [ ] Create `apps/organiclever-web/src/components/app/app-runtime-context.tsx` exporting `<AppRuntimeProvider>` + `useAppRuntime()` hook (carries runtime, machine state, send, refreshHome callback)
- [ ] Create `apps/organiclever-web/src/components/app/overlay-tree.tsx` rendering `AddEntrySheet`, four loggers, custom logger — driven by `useAppRuntime()`
- [ ] Create `apps/organiclever-web/src/app/apps/layout.tsx`: client layout, `force-dynamic`, mounts runtime, dark-mode + breakpoint + seed effects, renders `<SideNav>` / `<TabBar>` only when on a main tab path, wraps children in `<AppRuntimeProvider>`, includes `noindex` meta
- [ ] Create `apps/organiclever-web/src/app/apps/page.tsx` with `redirect("/apps/home")`
- [ ] Create `apps/organiclever-web/src/app/apps/home/page.tsx` rendering `<HomeScreen>` via `useAppRuntime()`
- [ ] Create `apps/organiclever-web/src/app/apps/history/page.tsx` rendering `<HistoryScreen>`
- [ ] Create `apps/organiclever-web/src/app/apps/progress/page.tsx` rendering `<ProgressScreen>`
- [ ] Create `apps/organiclever-web/src/app/apps/settings/page.tsx` rendering `<SettingsScreen>` (passes `darkMode` + `onToggleDarkMode` from machine)
- [ ] Add `apps/organiclever-web/src/app/apps/layout.unit.test.tsx` covering: chrome visible on main tab path, chrome hidden on workout path, overlay tree always rendered, breakpoint flip mounts SideNav vs TabBar
- [ ] `nx run organiclever-web:typecheck` green
- [ ] `nx run organiclever-web:test:quick` green and coverage ≥ 70%
- [ ] Manual smoke: visit `/apps/home`, `/apps/history`, `/apps/progress`, `/apps/settings` — each renders the right screen with shell chrome (old `/app` still works in parallel)

## Phase 2 — Link-Based Navigation Chrome

- [ ] Update `apps/organiclever-web/src/components/app/tab-bar.tsx` to use `next/link` with hard-coded `href` per tab; derive `active` from `usePathname()`; remove `onNavigate` prop, keep `onFabPress`
- [ ] Update `apps/organiclever-web/src/components/app/side-nav.tsx` similarly: `next/link`, `usePathname()`, drop `onNavigate`, keep `onLogEntry`
- [ ] Update unit tests `tab-bar.unit.test.tsx` and `side-nav.unit.test.tsx` (or add if missing) to assert: tab `<a>` elements render with correct `href`, active aria-current matches pathname, FAB still calls `onFabPress`
- [ ] Refactor `app-runtime-context.tsx` to expose `OPEN_ADD_ENTRY` send callback used by both chromes
- [ ] `nx run organiclever-web:typecheck lint test:quick` green
- [ ] Manual smoke: tab clicks change URL and active style; FAB opens AddEntry on every main tab

## Phase 3 — Workout / Finish / Edit-Routine Routes

- [ ] Create `apps/organiclever-web/src/app/apps/workout/page.tsx` rendering `<WorkoutScreen>`; if no active routine in `AppRuntimeProvider` context, `redirect("/apps/home")`
- [ ] Create `apps/organiclever-web/src/app/apps/workout/finish/page.tsx` rendering `<FinishScreen>`; if no completed session in context (or fetched via `useJournal` last session), `redirect("/apps/home")`
- [ ] Create `apps/organiclever-web/src/app/apps/routines/edit/page.tsx` rendering `<EditRoutineScreen>`; if no routine in context, `redirect("/apps/home")`
- [ ] Extend `AppRuntimeProvider` to hold `activeRoutine` and `completedSession` in React state, with setters callable from Home and WorkoutScreen
- [ ] Update `HomeScreen` callsite to call `setActiveRoutine(routine)` then `useRouter().push("/apps/workout")` instead of dispatching `START_WORKOUT`
- [ ] Update `HomeScreen` callsite for `onEditRoutine` to set context routine then `useRouter().push("/apps/routines/edit")`
- [ ] Update `WorkoutScreen.onFinishWorkout` callsite in the workout page wrapper to `setCompletedSession(session)` then `useRouter().push("/apps/workout/finish")`
- [ ] Update `FinishScreen.onBack` and `EditRoutineScreen.onBack` to `useRouter().back()` (or `push("/apps/home")` as fallback when no history)
- [ ] Layout reads `pathname` and hides TabBar/SideNav when path starts with `/apps/workout` or `/apps/routines`
- [ ] Add unit tests for the three new pages: redirect-when-context-empty, render-when-context-present
- [ ] `nx run organiclever-web:typecheck lint test:quick` green
- [ ] Manual smoke: start workout from Home → URL `/apps/workout`; finish → `/apps/workout/finish`; edit routine → `/apps/routines/edit`; type `/apps/workout` fresh in URL bar → redirects to `/apps/home`

## Phase 4 — `/app` Redirect, Old Route Removed

- [ ] Add `redirects()` block to `apps/organiclever-web/next.config.ts` returning `[{ source: "/app", destination: "/apps/home", permanent: true }]`
- [ ] Delete `apps/organiclever-web/src/app/app/page.tsx`
- [ ] Update `apps/organiclever-web/src/components/landing/landing-page.tsx` to push `/apps/home` instead of `/app`
- [ ] Update any markdown/code references to `/app` that should now be `/apps/home` (grep `apps/organiclever-web` and `apps/organiclever-web-e2e` for `"/app"` excluding the redirect source)
- [ ] `nx run organiclever-web:typecheck lint test:quick` green
- [ ] Manual smoke: visit `http://localhost:3200/app` → 308 → `/apps/home`; landing CTA opens `/apps/home`

## Phase 5 — Trim `appMachine`, Delete `use-hash`

- [ ] Rewrite `apps/organiclever-web/src/lib/app/app-machine.ts` to drop the `navigation` parallel region; keep an overlay-only machine (or two parallel regions limited to `overlay` + a context-only carrier for darkMode + isDesktop)
- [ ] Remove these from `AppMachineEvent` and `AppMachineContext`: `tab`, `routine`, `completedSession`, `START_WORKOUT`, `EDIT_ROUTINE`, `FINISH_WORKOUT`, `BACK_TO_MAIN`, `NAVIGATE_TAB`, `CompletedSession` interface
- [ ] Update `app-machine.unit.test.ts` to remove navigation-region cases; add coverage for the trimmed event set (overlay transitions + darkMode toggle + breakpoint set)
- [ ] Delete `apps/organiclever-web/src/lib/hooks/use-hash.ts`
- [ ] Verify `grep -rn "use-hash\|useHash\|navigation: \"\\(main\\|workout\\|finish\\|editRoutine\\)\"" apps/organiclever-web/src` returns no match
- [ ] Rename `apps/organiclever-web/src/components/app/app-root.tsx` → `app-shell.tsx` if it survives as a helper, or delete it entirely if `apps/layout.tsx` fully replaces it
- [ ] Remove `localStorage.ol_tab` write/read code (now vestigial)
- [ ] `nx run organiclever-web:typecheck lint test:quick` green
- [ ] Coverage still ≥ 70% (add tests if dropped below)

## Phase 6 — E2E + Specs + Docs

- [ ] Create `apps/organiclever-web-e2e/steps/_app-shell.ts` exporting `APP_BASE_URL = "http://localhost:3200"` and helper `appPath(tab)` returning `${APP_BASE_URL}/apps/${tab}`
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

## Phase 7 — Quality Gate + Manual Verify

- [ ] `nx affected -t typecheck lint test:quick spec-coverage` green from repo root
- [ ] `nx run organiclever-web-e2e:test:e2e` green
- [ ] Manual checklist (from `tech-docs.md` Verification section), all 12 items pass
- [ ] `git status` clean
- [ ] Commit using the standard `feat(organiclever-web): ...` Conventional Commits prefix; split into per-phase commits if not already split
- [ ] Run `plan-execution-checker` and confirm requirements + acceptance criteria all pass
- [ ] Move plan folder to `plans/done/` and update both `in-progress/README.md` and `done/README.md`

## Acceptance Verification Checklist

Each acceptance criterion in `prd.md` must be satisfied at the end of Phase 7:

- [ ] AC-1 — `/apps` redirect to `/apps/home` (Phase 1 + Phase 7 manual)
- [ ] AC-2 — every tab path renders the right screen (Phase 1 + Phase 6 e2e)
- [ ] AC-3 — tab clicks change URL (Phase 2 + Phase 6 e2e)
- [ ] AC-4 — refresh stays put (Phase 6 e2e)
- [ ] AC-5 — browser back works (Phase 6 e2e)
- [ ] AC-6 — workout/finish routes (Phase 3 + Phase 6 e2e)
- [ ] AC-7 — routine editor route (Phase 3 + Phase 6 e2e)
- [ ] AC-8 — `/app` 308 (Phase 4 + Phase 6 e2e)
- [ ] AC-9 — `/login` and `/profile` still 404 (Phase 6 e2e — no regression)
- [ ] AC-10 — chrome persists (Phase 1 manual + Phase 7 manual)
- [ ] AC-11 — Add Entry FAB still works on every tab (Phase 2 + Phase 6 e2e)
- [ ] AC-12 — unknown sub-paths 404 (Phase 7 manual)
- [ ] AC-13 — appMachine has no navigation region (Phase 5 grep verification)
