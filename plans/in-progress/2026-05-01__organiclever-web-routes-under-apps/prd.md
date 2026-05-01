# PRD — OrganicLever Web Routes Under `/apps`

## Product Overview

Reshape the OrganicLever web client so every visible screen has a stable URL under the `/apps/` prefix. Tabs, the workout flow, the finish summary, and the routine editor all become real Next.js App Router routes. The shell (TabBar / SideNav, Add Entry FAB, runtime, dark-mode sync, modals) lives in a shared `apps/` segment layout and persists across route changes.

The marketing landing page (`/`), the backend status probe (`/system/status/be`), and the in-app modals (Add Entry sheet, four Logger sheets, Custom Entry Logger) keep their current shape. The `appMachine` shrinks to its overlay region only.

## Personas

Solo-maintainer repo — personas describe which hats the maintainer wears and which agents consume this PRD.

- **End user (web)**: opens OrganicLever on phone or laptop, navigates between Home / History / Progress / Settings, starts a workout, edits a routine. Expects URLs to reflect the current screen, refresh to stay put, browser back to behave.
- **Maintainer (frontend)**: implements the route migration, keeps `appMachine` aligned with the new shape.
- **Maintainer (e2e)**: keeps Playwright steps in sync with new URLs.
- **`swe-typescript-dev` agent**: consumes acceptance criteria when implementing route pages and chrome.
- **`swe-e2e-dev` agent**: consumes acceptance criteria when updating step definitions.
- **`specs-fixer` agent**: consumes scope when re-aligning Gherkin features.

## User Stories

### US-1 — Stable URL per screen

> As an **end user**, I want **the URL bar to reflect which screen I'm on**, so that **I can bookmark, share, or refresh without losing my place**.

### US-2 — Browser back/forward works inside the app

> As an **end user**, I want **browser back to take me to the previous screen**, so that **navigation feels like a normal web app**.

### US-3 — Refresh stays put

> As an **end user**, I want **page refresh on a non-Home tab to keep me on that tab**, so that **a F5 / Cmd-R does not silently reset my position**.

### US-4 — Deep links work

> As an **end user**, I want **to open a URL like `/apps/progress` directly**, so that **a notification, email link, or pasted URL takes me straight to the screen**.

### US-5 — Old `/app` bookmarks still work

> As an **end user**, I want **my old `/app` bookmark to keep working**, so that **the rename does not break what I had saved before**.

### US-6 — Easier debugging via URL = state

> As a **maintainer**, I want **every UI state to be a URL**, so that **a bug report tells me which screen to open with one click instead of clicking through to reproduce**.

### US-7 — Smaller state machine

> As a **maintainer**, I want **`appMachine` to drop the navigation region**, so that **the unit-test combinatorial space halves and overlays remain the only machine-tracked state**.

### US-8 — Sibling product surfaces unblocked

> As a **maintainer**, I want **routes nested under `/apps/`**, so that **future surfaces such as `/apps/admin` or `/apps/coach` can land without renaming the URL prefix**.

## Acceptance Criteria (Gherkin)

### AC-1 — Default route shows Home

```gherkin
Feature: Default app route shows Home

  Scenario: Visiting /apps redirects to /apps/home
    Given the app is freshly loaded
    When the user navigates to "/apps"
    Then the URL becomes "/apps/home"
    And the Home screen is visible

  Scenario: Visiting /apps/home renders the Home screen
    Given the app is freshly loaded
    When the user navigates to "/apps/home"
    Then the Home screen is visible
    And the Home tab is marked active in the navigation
```

### AC-2 — Each tab has a route

```gherkin
Feature: Tab routes

  Scenario Outline: Each tab is reachable by URL
    Given the app shell is visible
    When the user navigates to "<path>"
    Then the "<screen>" screen is visible
    And the "<tab>" tab is marked active

    Examples:
      | path             | screen   | tab      |
      | /apps/home       | Home     | Home     |
      | /apps/history    | History  | History  |
      | /apps/progress   | Progress | Progress |
      | /apps/settings   | Settings | Settings |
```

### AC-3 — Tab clicks update the URL

```gherkin
Feature: Clicking a tab navigates the URL

  Scenario: Click History tab from Home
    Given the user is on "/apps/home"
    When the user taps the History tab
    Then the URL becomes "/apps/history"
    And the History screen is visible
```

### AC-4 — Refresh stays on current tab

```gherkin
Feature: Refresh preserves the current tab

  Scenario Outline: Refreshing a tab URL keeps the user on that tab
    Given the user is on "<path>"
    When the user refreshes the page
    Then the URL is still "<path>"
    And the "<screen>" screen is visible

    Examples:
      | path           | screen   |
      | /apps/history  | History  |
      | /apps/progress | Progress |
      | /apps/settings | Settings |
```

### AC-5 — Browser back returns to previous screen

```gherkin
Feature: Browser back inside the app

  Scenario: Back from Progress returns to Home
    Given the user navigated from "/apps/home" to "/apps/progress"
    When the user presses the browser back button
    Then the URL becomes "/apps/home"
    And the Home screen is visible
```

### AC-6 — Workout and finish are routed

```gherkin
Feature: Workout flow has dedicated routes

  Scenario: Starting a workout navigates to /apps/workout
    Given the user is on "/apps/home"
    When the user starts a workout from a routine card
    Then the URL becomes "/apps/workout"
    And the Workout screen is visible
    And the TabBar is hidden

  Scenario: Finishing a workout navigates to /apps/workout/finish
    Given the user is on "/apps/workout"
    When the user finishes the workout
    Then the URL becomes "/apps/workout/finish"
    And the Finish screen is visible
```

### AC-7 — Routine editor is routed

```gherkin
Feature: Routine editor has a dedicated route

  Scenario: Editing a routine from Home
    Given the user is on "/apps/home"
    When the user opens a routine for editing
    Then the URL becomes "/apps/routines/edit"
    And the Edit Routine screen is visible
    And the TabBar is hidden
```

### AC-8 — Old `/app` bookmark still works

```gherkin
Feature: /app permanent redirect

  Scenario: Visiting the old /app URL
    Given the application is running
    When a visitor requests GET "/app"
    Then the response is a 308 redirect to "/apps/home"
```

### AC-9 — Disabled-route guards remain 404

```gherkin
Feature: Disabled routes still return 404

  Scenario Outline: /login and /profile remain 404 in local-first mode
    Given the application is running in local-first mode
    When a visitor requests <method> <path>
    Then the response status is 404

    Examples:
      | method | path     |
      | GET    | /login   |
      | GET    | /profile |
```

### AC-10 — Shell chrome persists across route changes

```gherkin
Feature: Shell chrome persists

  Scenario: Switching tabs does not remount the shell
    Given the user is on "/apps/home" with the SideNav visible at desktop width
    When the user clicks the History tab
    Then the SideNav remains visible
    And the Home content is replaced by History content
    And no full page reload occurs
```

### AC-11 — Add Entry FAB still works on every tab

```gherkin
Feature: Add Entry overlay is route-orthogonal

  Scenario Outline: Tapping FAB opens Add Entry on any tab
    Given the user is on "<path>"
    When the user taps the FAB button
    Then the Add Entry sheet is open
    When the user closes the Add Entry sheet
    Then the Add Entry sheet is closed
    And the URL is still "<path>"

    Examples:
      | path           |
      | /apps/home     |
      | /apps/history  |
      | /apps/progress |
      | /apps/settings |
```

### AC-12 — Unknown sub-paths return 404

```gherkin
Feature: Unknown app routes return 404

  Scenario: Unknown segment under /apps
    Given the application is running
    When a visitor requests GET "/apps/does-not-exist"
    Then the response status is 404
```

### AC-13 — appMachine has no navigation region

```gherkin
Feature: appMachine post-refactor shape

  Scenario: appMachine source no longer declares a navigation region
    Given the refactor is complete
    When the maintainer greps "navigation:" in "lib/app/app-machine.ts"
    Then no match is found
    And the file declares only an "overlay" region under "states:"
```

## Product Scope

### In scope (product surface)

- New `/apps/...` route tree.
- TabBar / SideNav switch to `next/link`; active state derived from `usePathname()`.
- Workout, Finish, Edit Routine flows hide the TabBar via route group or conditional render in the layout.
- `/app` redirect to `/apps/home`.
- `appMachine` keeps overlay region only.
- All existing in-app behaviour (dark mode, language, seeding, persistence of dark-mode and settings) preserved.

### Out of scope (product surface)

- Visual / copy redesign on any screen.
- Add Entry sheet and Logger sheets becoming URL-addressable (deferred; tracked under `plans/ideas.md` as a follow-up).
- Localised URL segments.
- New analytics on route transitions.
- Any change to `/system/status/be` or backend.

## Product-Level Risks

| Risk                                                                            | Likelihood | Impact | Mitigation                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell chrome remounts on tab change, causing flicker or losing local state      | Medium     | Medium | Place runtime + breakpoint detection + overlay machine in the `apps/` segment layout, not in each `page.tsx`. Verify with manual smoke that the SideNav is not remounted.     |
| Workout in-progress state is lost when user manually edits the URL bar          | Low        | Medium | Document that direct URL edits during a workout reset the workout. The workout flow stores progress in PGlite; reload restores it. Captured as known limitation in tech-docs. |
| Overlay sheets behave oddly when the underlying route changes                   | Low        | Low    | Overlays remain in `appMachine`. Their state is independent of route. Existing unit tests for overlay transitions continue to apply.                                          |
| Users on slow connections see a brief flash of nothing during route transitions | Low        | Low    | Each `page.tsx` is `'use client'` + `force-dynamic`; data fetching is in-browser PGlite. No server round-trip, so the transition is effectively instant.                      |
| Tab persistence (`ol_tab` localStorage key) becomes vestigial                   | High       | Low    | Remove the localStorage write/read logic in the layout; the URL is the source of truth. Old keys remain harmless if present in user storage.                                  |
