# BRD — OrganicLever Web Routes Under `/app`

## Business Goal

Make every screen in OrganicLever web addressable by URL so navigation, debugging, sharing, and browser primitives (back/forward, refresh, bookmark, deep link) all work the way users expect from a web app. Today the app is a single-route SPA — the URL never changes regardless of which tab or flow is on screen.

## Business Rationale

- **Bug investigation is harder than it should be**: when an issue is reported on the Progress screen, the bug report says "I was on Progress" but the URL is still `/app`. Engineers cannot jump straight to the screen via a URL; they have to reproduce the navigation manually each time. URL-as-state cuts the reproduction path to a single click.
- **Browser primitives are broken**: refresh on a sub-tab returns the user to Home (default tab). Browser back from Workout does not return to the home tab — it leaves the app entirely. Bookmarks resolve only to the shell. Each one is a small papercut; together they make the product feel un-webby on a web client.
- **Deep links cannot exist**: future surfaces such as a notification opening Progress, a routine edit link from a calendar reminder, or a "view your last workout" link in a digest email all require addressable routes. Today we cannot ship any of those without first doing this refactor.
- **State machine is over-scoped**: `appMachine` carries both navigation and overlay regions. Navigation belongs in the URL; XState should only own genuine in-shell parallel state (overlays, dark mode, breakpoint). Trimming the machine reduces the number of state combinations to test.

## Business Impact

**Pain points addressed**:

1. Bug reports cannot include a screen-specific URL; engineers reproduce by clicking through.
2. Refresh on a non-Home tab silently resets to Home.
3. Browser back is unusable inside the app shell.
4. No way to ship deep links or external link targets.
5. `appMachine` test surface includes navigation × overlay product space (~16 combinations) where only overlays need machine coverage.

**Expected benefits**:

1. **URL = screen**: every screen reachable by typing/pasting a URL. Bug reports, demos, and screenshots are reproducible by URL.
2. **Browser back/forward works**: native browser navigation respected within the app.
3. **Refresh stays put**: refreshing on `/app/history` keeps the user on History.
4. **Smaller state machine**: `appMachine` shrinks to overlays only. Roughly halves the unit-test combinatorics on the navigation/overlay surface.
5. **Deep linking unblocked**: future notification, email, and calendar deep links become trivial to add.

**Observable success metrics**:

- After refactor, navigating to `/app/history` then refreshing the page leaves the user on History (verifiable manual smoke + e2e scenario).
- After refactor, `appMachine` source no longer contains a `navigation` region; `grep -n 'navigation:' lib/app/app-machine.ts` returns no match (verifiable via grep).
- After refactor, `lib/hooks/use-hash.ts` is deleted; `find apps/organiclever-web/src -name 'use-hash*'` returns no match (verifiable via find).
- After refactor, every `localhost:3200/app` reference in `apps/organiclever-web-e2e/steps/` is gone; `grep -rn '/app"' apps/organiclever-web-e2e/steps/` returns no match (verifiable via grep).

_Judgment call:_ we expect bug-investigation time on UI issues to drop because engineers can deep-link to the reported screen instead of reproducing navigation. No baseline measurement; structural improvement only.

## Affected Roles

This is a solo-maintainer repo. The roles below describe which hats the maintainer wears and which AI agents consume the plan.

- **Frontend developer hat**: writes the new `app/` route segment, layout, per-tab pages, updates `TabBar`/`SideNav` to use `next/link`, trims `appMachine`.
- **E2E test maintainer hat**: updates step files in `apps/organiclever-web-e2e/steps/` to navigate to the new URLs.
- **Specs maintainer hat**: updates Gherkin features under `specs/apps/organiclever/fe/gherkin/` and adds the new `routing/app-routes.feature`.
- **Docs maintainer hat**: updates `apps/organiclever-web/README.md` and `apps/organiclever-web/docs/` (route table, navigation overview).
- **Agents that consume this plan**: `plan-checker` (validates structure), `plan-execution-checker` (verifies completion), `swe-typescript-dev` (implements the refactor), `swe-e2e-dev` (updates e2e steps), `specs-fixer` (re-aligns Gherkin specs).

## Business-Scope Non-Goals

- **No UX redesign**: tab order, icon set, colour palette, sheet behaviour, dark mode, language all remain identical from the user's point of view. The user should not perceive the URL change as a feature change.
- **No data migration**: PGlite schema, journal entries, routines, settings — all unchanged.
- **No backend touchpoints**: `organiclever-be`, `organiclever-contracts`, the F# REST API, and the `system/status/be` server route stay as-is.
- **No new framework**: we use Next.js App Router which is already the framework of record. No `react-router`, no custom router.
- **No internationalised URL segments**: `/app/home` stays in English even when the user picks Indonesian copy. URL segments are an internal contract; copy is the localisation surface.

## Risks and Mitigations

| Risk                                                                                      | Likelihood | Impact | Mitigation                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External bookmarks pointing at `/app` land on a redirect, not the shell, after refactor   | Medium     | Low    | Rewrite `app/app/page.tsx` to `permanentRedirect("/app/home")` from `next/navigation`. Existing bookmarks at `/app` continue to land on the home tab.     |
| E2E test churn touches 10 of 13 step files                                                | High       | Medium | One small helper in `e2e/steps/_app-shell.ts` exporting the base URL; step files import the helper. Keeps the diff to one path constant per file.         |
| Overlay regressions when extracting nav state from `appMachine`                           | Medium     | Medium | Delete the navigation region last (Phase 5), after all routes are live and verified. Keep the overlay region untouched.                                   |
| Coverage drops below the 70% threshold because the new layout file adds untested branches | Medium     | Low    | Add a unit test for `app/layout.tsx` covering desktop/mobile branch selection, and one route-test per `page.tsx` mounting the screen with a mock runtime. |
| `force-dynamic` on every route page increases server work                                 | Low        | Low    | Pages remain `'use client'` + `force-dynamic` (PGlite is browser-only); identical to current `/app/page.tsx`. No change to render strategy.               |
| New routes accidentally exposed to SEO and indexed                                        | Low        | Low    | Add `noindex` meta to the `app/` segment layout. Marketing landing page (`/`) keeps its existing SEO settings.                                            |

## References

- Existing `appMachine` (`apps/organiclever-web/src/lib/app/app-machine.ts`) — current navigation × overlay parallel state design.
- Existing e2e steps (`apps/organiclever-web-e2e/steps/*.steps.ts`) — 13 files; 10 use `localhost:3200/app` as baseline, 3 (`accessibility`, `landing`, `system-status-be`) target other routes and remain unchanged.
- Existing Gherkin features (`specs/apps/organiclever/fe/gherkin/`) — 15 feature files, `routing/disabled-routes.feature` and `app-shell/navigation.feature` are most directly affected.
- Next.js App Router `permanentRedirect` from `next/navigation` — used in `app/app/page.tsx` to send the bare `/app` URL to `/app/home` ([Next.js docs](https://nextjs.org/docs/app/api-reference/functions/permanentRedirect), accessed 2026-05-02).
