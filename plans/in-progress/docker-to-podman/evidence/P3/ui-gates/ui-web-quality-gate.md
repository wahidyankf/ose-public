# UI Web Quality Gate: spec-charter judge record (ayokoding-www, cycle 1)

Status: CLOSED for cycle 1 (totals and judge result at the end).

## Subject

- Running address: `http://127.0.0.1:3101` (production build of `apps/ayokoding-www`, fixture manifests, drafts shown).
- Charter: `spec` (judge of one cycle of `repo-governance/workflows/quality/ui-web-quality-gate.md`). Mode: `normal`
  (default; CRITICAL and HIGH are blocking).
- Changes in scope (reachable behaviour only; source not judged):
  (a) the Mermaid fallback source `<pre>` is keyboard-focusable while rendering is pending or failed, and not focusable
  once the SVG renders;
  (b) the sidebar renders the generic sidebar directly on routes with no course path and wraps the course-path host in
  Suspense only on course routes (so `?path=` on non-course routes causes no course-path behaviour).
- Specification judged against (read in full):
  `specs/apps/ayokoding/www/behaviours/frontend/content/content-rendering.feature` (Mermaid scenarios),
  `.../course-paths/canonical-fallback.feature`, `.../navigation/sidebar-course-categories.feature`,
  `.../navigation/navigation.feature`, `.../app-shell/responsive.feature`, `.../app-shell/accessibility.feature`.
- Locales: `en` and `id` confirmed from the app (`<html lang="en">` and `<html lang="id">`; skip link, drawer and
  navigation labels localize in `id`). Themes: light and dark (header "Toggle theme"; driven here through the stored
  `theme` value, `html` class confirmed `light` or `dark`). State-changing actions: none authorized, none run (browser
  `localStorage` only).

## Build provenance

- The orchestrator restored static assets after a mid-session rebuild. Observed on this origin: every page requested
  returned 200 except the intended 404 routes (below); no 500s, no missing script chunk, no hydration or React error in
  any console on any page or engine. Chunk requests for the Mermaid renderer resolved normally in the untouched runs.
  No stale or mismatched build was observed, so nothing is recorded as a tooling blocker.
- Expected 404 routes in this build (these are the spec's "not a course in this locale" examples):
  `/en/learn/courses-extra/git`, `/id/learn/courses/just-enough-python`. The `id` content tree has no `learn/courses`
  tree (`/id/learn` and `/id/learn/courses` are 404 too); its learn section is `/id/belajar`.
- Console noise that is not a product finding: Chromium reports "Failed to load resource" only for those 404 routes and
  for the Google Analytics request (external host, not reachable from this sandbox); Firefox adds a `_ga` cookie
  "expires" warning from that same third-party script.

## Tools and versions

- Playwright 1.61.0 (the repository's `playwright` package) driven from Node 24.16.0 scripts kept outside the
  repository (scratchpad, not committed). Compute went through `./hippo run --class ephemeral --resource-tier standard`.
- Browsers: Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (the Playwright builds). Real keyboard events
  (`keyboard.press` Tab, Shift+Tab, Enter, Space, Escape, arrows), computed styles, and small JPEG captures.
- Fallback states were produced with Playwright `route`: the lazily loaded Mermaid script chunks (every
  `/_next/static` script not named in the page's initial HTML; 16 chunks on the concurrency page) were aborted
  ("failed") or held unanswered ("pending"), then released in the pending probe. "Rendered" runs left the network
  untouched.
- Mermaid pages: `/en/learn/courses/concurrency-and-parallelism/learning/beginner` (9 Mermaid blocks) and
  `/en/learn/legacy/software-engineering/automation-testing/tools/vitest/by-example/beginner` (8 blocks).
- `id` locale Mermaid: confirmed none. The `id` content tree has 0 files with a fenced `mermaid` block (the `en` tree
  has 790 files with one), and no Mermaid wrapper appeared on any `id` page loaded.
- Path ids discovered under `/en/learn/paths/skills`: `e2e-fixture-alpha` (courses `just-enough-bash`,
  `version-control-and-git`), `e2e-fixture-beta` (courses `backend-essentials`, `sql-essentials`), plus
  `conventional-accounting`, `conventional-erp`, `sharia-accounting`, `sharia-erp`. Query form used:
  `?path=skills/e2e-fixture-alpha`.

## Viewports, locales, themes

Desktop 1280x800 and mobile 375x667; `en` and `id`; light and dark. Laptop 1024x768 was not run.

## Coverage matrix

Key: R = run, N = not run. "Pending" = Mermaid chunks held, "failed" = chunks aborted, "rendered" = untouched.

### Mermaid pages (Tab walk of the whole page, Shift+Tab, focus ring, console, network)

| Route (locale en)          | Viewport        | Theme | Engine            | Rendered                    | Pending | Failed |
| -------------------------- | --------------- | ----- | ----------------- | --------------------------- | ------- | ------ |
| concurrency beginner       | desktop         | light | Chromium          | R                           | R       | R      |
| concurrency beginner       | desktop         | dark  | Chromium          | R                           | R       | R      |
| concurrency beginner       | mobile          | light | Chromium          | R                           | R       | R      |
| concurrency beginner       | mobile          | dark  | Chromium          | R                           | R       | R      |
| vitest by-example beginner | desktop         | light | Chromium          | R                           | R       | R      |
| vitest by-example beginner | desktop         | dark  | Chromium          | R                           | R       | R      |
| vitest by-example beginner | mobile          | light | Chromium          | R                           | R       | R      |
| vitest by-example beginner | mobile          | dark  | Chromium          | R                           | R       | R      |
| both pages                 | desktop         | light | Firefox           | R                           | N       | R      |
| both pages                 | mobile          | light | Firefox           | N                           | N       | R      |
| both pages                 | desktop         | light | WebKit            | R                           | N       | R      |
| both pages                 | mobile          | light | WebKit            | N                           | N       | R      |
| both pages                 | desktop, mobile | dark  | Firefox, WebKit   | N                           | N       | N      |
| any Mermaid page           | any             | any   | any (`id` locale) | N (no Mermaid blocks exist) | N       | N      |

Pending-then-release probe (focus held on the first source while the renderer completes): concurrency, desktop, light,
Chromium, Firefox and WebKit: R. Natural failure state (2 of 9 blocks on the concurrency page fail to parse): seen in
every rendered run on every engine.

### Sidebar, course-path, navigation (30 URLs per run, each pair with and without `?path=`)

URLs: course with path, course without path, course with unknown path id, course not in the path with path, lesson with
and without path, `/en/learn`, `/en/browse`, `/en/learn/courses`, a legacy page, `/en`, `/en/tools`, the path landing
page, the 404 route `/en/learn/courses-extra/git` (each with and without `?path=`), and the `id` routes `/id`,
`/id/belajar`, `/id/learn/courses/just-enough-python` (404), `/id/learn/paths/skills/e2e-fixture-alpha`.

| Check set                                                                              | Desktop light                                       | Desktop dark   | Mobile light            | Mobile dark    |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------- | ----------------------- | -------------- |
| Sidebar structure, network and console (30 URLs), Chromium                             | R                                                   | R              | R                       | N              |
| Same (30 URLs), Firefox                                                                | R                                                   | N              | N                       | N              |
| Same (30 URLs), WebKit                                                                 | R                                                   | N              | N                       | N              |
| Keyboard: skip link, 45-stop Tab order, focus-visible (8 URLs), Chromium               | R                                                   | R              | R                       | R              |
| Same, Firefox / WebKit                                                                 | R / R                                               | N              | N                       | N              |
| Group buttons by keyboard on `/en/learn/courses` with and without `?path=`             | R (Chromium, Firefox, WebKit, light; Chromium dark) | R              | not applicable (drawer) | not applicable |
| Mobile drawer: open, labelled dialog, focus containment, Escape, focus return (8 URLs) | not applicable                                      | not applicable | R                       | R              |

## Passed checks (what was observed, and how)

Change (a), Mermaid source focus:

- P-01 Pending: with chunks held, every Mermaid `<pre>` had `tabindex="0"`, none hidden, no SVG (concurrency: 9 of 9
  focusable). Tab from the control before reached the source, the next Tab reached the next control (Chromium,
  Firefox, WebKit; the control after a Mermaid block here is the next code block's `<pre>`). Shift+Tab went back to the
  source and then to the control before. Matches "Mermaid source stays keyboard reachable while its diagram is pending".
- P-02 Failed: with chunks aborted, 9 of 9 (concurrency) and 8 of 8 (vitest) sources were Tab stops in document order
  with the same before/after neighbours, desktop and mobile, light and dark, on all three engines. Natural parse
  failures (two blocks on the concurrency page) behaved the same while their siblings had rendered. Matches the
  "fails to render" scenario.
- P-03 Rendered: with the network untouched, every rendered block had an inline `<svg>`, its source `<pre>` had
  `tabindex="-1"` and `visibility: hidden` (so the raw source is not visible and not focusable), and the Tab walk
  visited zero rendered sources (vitest: 8 rendered, 0 stops; concurrency: 7 rendered, stops only on the 2 failed
  blocks). Matches "The Mermaid source leaves keyboard focus order once the diagram renders" and "Mermaid diagram
  renders as an SVG".
- P-04 Focus indicator: on the focused source `:focus-visible` matched, with the UA `auto` ring (1px reported in
  Chromium, 3px in Firefox and WebKit); the Chromium captures show a clearly visible two-tone ring in light and dark on desktop
  and mobile. Keyboard scrolling works (ArrowRight moved `scrollLeft` from 0 to 80, 84 or 166 px) and the focused
  source is exposed as a `code` element whose content is its text.
- P-05 No keyboard trap: Tab from the top walked the whole page and left it (Chromium and WebKit end on the body, 370
  and 377 stops; Firefox in this headless run stays on the last footer link because there is no browser chrome to hand
  focus to, a tool artefact, not a page trap). The number of stops equals the count of expected tabbable elements
  within 1.
- P-06 Mobile (375): the same neighbours and order, 276 stops on the concurrency page (the desktop sidebar is hidden).

Change (b), sidebar and course path:

- P-07 Course without path context: `/en/learn/courses/just-enough-bash` shows `nav "Sidebar navigation"` (23 links), no
  path rail, no path breadcrumb segment, no `?path=` on any sidebar link. Chromium, Firefox, WebKit.
- P-08 Course with path: with `?path=skills/e2e-fixture-alpha` the sidebar is replaced by the path rail
  (`nav "E2E Fixture Alpha Skills Path course list"`, "Course 1 of 2", phase label, "View full path", "Browse all
  courses"), the breadcrumb gains the path segment, and the rail links carry the query. In the 375 drawer the same rail
  appears. Light and dark, all three engines (mobile Chromium only).
- P-09 Not a course in this locale: `/en/learn/courses-extra/git` and `/id/learn/courses/just-enough-python`, each with
  `?path=`, render the 404 page inside the generic sidebar (5 and 3 sidebar links, identical to the same URL without the
  query). Matches "keeps the generic sidebar".
- P-10 Non-course routes with `?path=` (`/en/browse`, `/en/learn`, `/en/learn/courses`, a legacy page, `/en/learn/paths/...`,
  `/id/belajar`): the sidebar region count, group buttons and link set are identical to the same route without the query,
  zero sidebar links gain `?path=`, no path rail, no path breadcrumb, no console error, and no extra script chunk
  (13 route pairs that are not course landing pages, on each of five engine, viewport and theme sets; one Firefox
  legacy-page run loaded 5 more lazy chunks with the query, which looks like Mermaid chunk timing and was not
  re-checked). The `/en` and `/en/tools` routes have no sidebar and stay
  unchanged. See UWQ-002 for the one network difference.
- P-11 Open group stays open: on `/en/learn/courses` with and without `?path=`, Enter on the "Tools and practices" button
  set `aria-expanded="true"` and showed its courses, the group was still open 3 seconds later with focus kept on the
  button, exactly one `Sidebar navigation` region existed, and Space closed it (Chromium light and dark, Firefox,
  WebKit). The suspended-reader moment itself cannot be held in a browser (the scenario is unit-tier, `@e2e-exempt`);
  only its observable end state was judged.
- P-12 Course-page group opens: on the course landing page `just-enough-bash` without `?path=` the course's own group ("Programming languages")
  is expanded and "Tools and practices" is collapsed (accessibility snapshot; the other groups were not all
  inspected).
- P-13 Skip link: first Tab on every page (8 URLs, 6 engine, viewport and theme combinations) lands on "Skip to content" (`id`:
  "Langsung ke konten"), visible in the viewport with a 2px solid outline (black in light, white in dark); Enter sets
  the hash `#main-content` and focus lands on `main#main-content`; the next Tab goes to the first control in the main
  region (the sidebar or rail on pages that have one, the page content otherwise). Re-checked for `id` separately.
- P-14 Sidebar tab order follows reading order (header, sidebar links and section buttons, the "Resize panel"
  separator, then main, then footer); every stop matched `:focus-visible`.
- P-15 Mobile drawer: hamburger "Open navigation menu" visible, sidebar not visible before opening, drawer is a labelled
  `dialog`, focus moves into it, Tab cycles inside the drawer (expected for a modal), Escape closes it and returns focus
  to the hamburger. With and without `?path=`, light and dark, all 8 URLs.
- P-16 Console: no hydration or React error on any page on any engine; no `>= 400` response other than the intended 404
  routes and the `id` course prefetches listed under UWQ-004.

## Ledger (cycle 1)

Columns follow `repo-governance/development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md`.
`confidence` is left empty (the judge does not rate it). `blocking` is under mode `normal`.

| id      | path                                                                                                                                                                              | finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | criticality | confidence | blocking | cycle | status | evidence                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- | -------- | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UWQ-001 | `/en/learn/courses/concurrency-and-parallelism/learning/beginner` and the vitest by-example page, dark theme, rendered state                                                      | Rendered Mermaid diagrams keep the light "default" theme in dark mode. Message labels and arrows in the sequence diagram, and the arrows between flowchart nodes, draw `#333` directly on the page background (`rgb(2, 8, 23)`): contrast about 1.58 to 1. This departs from `app-shell/accessibility.feature` "Text color contrast meets WCAG AA standard" (text 4.5:1, large text 3:1). The same diagrams are legible in light.                                                                                                                                                                                                                                                                                                                                                                                 | HIGH        |            | yes      | 1     | open   | `captures/mermaid-conc-sequence-dark-chromium.jpg`, `captures/mermaid-vitest-flowchart-dark-chromium.jpg`, light counterparts for comparison; computed fill `rgb(51, 51, 51)` on 5 of 11 text elements of the sequence diagram |
| UWQ-002 | every non-course route with `?path=` (`/en/tools`, `/en/learn`, `/en/browse`, `/en/learn/courses`, a legacy page, `/en`, the 404 route, `/id`, `/id/belajar`, the `id` path page) | A request for course-path data fires whenever the URL has a `path` parameter, even where no course path applies: `GET /api/trpc/coursePaths.getRouteData?batch=1&input={"0":{"json":"en"}}` (`"id"` for `id`). It does not fire without the parameter, and it fires on `/en/tools` and `/en`, which have no sidebar, so it does not come from the sidebar. No visible behaviour changes (sidebar, links and counts identical). This departs from change (b)'s stated outcome that `?path=` on non-course routes causes no course-path behaviour and from `canonical-fallback.feature` "And the path context query is not read" (the scenario is unit-tier; this is the same intent seen at the browser boundary). Whether this belongs to the sidebar or to another consumer is a source question for the writer. | MEDIUM      |            | no       | 1     | open   | Network list per URL, 14 pairs, Chromium desktop and mobile, light and dark, Firefox, WebKit; `?path=` empty, a valid id, and an unknown id each fire it, `?foo=bar` does not                                                  |
| UWQ-003 | `/en/learn/courses` at 1280 and in the 375 drawer (all pages that list category groups)                                                                                           | Category group buttons are 292px wide inside a sidebar scroll area that shows 214px (desktop) or 247px (drawer). The visible course count (for example "11", at x 306 to 321 while the area ends at 230 or 263) is clipped out of view, and the focus ring on a focused group button is cut off on its right edge. Departs from `sidebar-course-categories.feature` "The Courses section lists category groups: one group button per category with its course count" (the count exists in the markup and for assistive technology, but a sighted reader cannot see it without scrolling the sidebar sideways) and from the "Focus indicators are visible" intent.                                                                                                                                                 | MEDIUM      |            | no       | 1     | open   | `captures/sidebar-courses-path-open-group-desktop-light-chromium.jpg`, `captures/drawer-courses-mobile-light-chromium.jpg`; measured container right edge 230 and 263 against count right edge 321 and button right edge 329   |
| UWQ-004 | `/id/learn/paths/skills/e2e-fixture-alpha`, `/id/learn/paths/careers/immediately-effective/backend-track`                                                                         | The `id` path pages link to `id` course URLs that return 404 (`/id/learn/courses/just-enough-bash`, `.../version-control-and-git`, `.../just-enough-python`, `.../backend-essentials`). The primary call to action "Mulai: Just Enough Bash" lands on a 404 page. `canonical-fallback.feature` itself lists `/id/learn/courses/just-enough-python` as "not a course in this locale". Outside the two changes under judgement (route and content availability, likely older).                                                                                                                                                                                                                                                                                                                                      | MEDIUM      |            | no       | 1     | open   | Status 404 for each linked URL (curl and the browser's prefetch responses); the sidebar network log lists `404 /id/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`                                               |
| UWQ-005 | `/en/learn/courses/concurrency-and-parallelism/learning/beginner`, Examples 19 and 28                                                                                             | Two of 9 Mermaid blocks fail to parse in the browser (console warning "[mermaid] Failed to render diagram: Error: Parse error on line 9 ... Expecting 'SOLID_OPEN_ARROW' ..." and "... on line 11 ... got 'loop'"). The reader sees the raw Mermaid source in place of the diagram, so "the diagram should render as an inline SVG" in `content-rendering.feature` "Mermaid diagram renders as an SVG" does not hold for those blocks. This is a content defect, outside the two changes, and it is also the live proof that the failed-state focus behaviour works (P-02).                                                                                                                                                                                                                                       | MEDIUM      |            | no       | 1     | open   | Console warnings in every rendered run, all engines; the two sources stay as focusable `<pre>` (pre index 6 and 8)                                                                                                             |
| UWQ-006 | both Mermaid pages, rendered state, light and dark                                                                                                                                | Rendered diagram text is clipped or overlapped in places: node labels lose their last line ("\*.spec.ts" in "Discover Test Files", "ESM)" in "Vite Transform (TypeScript, ESM)" on the vitest page) and the second line of a subgraph title is hidden behind nodes ("(interleaved)" shows as "nterleaved" on the concurrency page's first diagram). Theme independent. Part of the information the diagram carries is not visible.                                                                                                                                                                                                                                                                                                                                                                                | MEDIUM      |            | no       | 1     | open   | `captures/mermaid-vitest-flowchart-light-chromium.jpg`, `captures/mermaid-vitest-flowchart-dark-chromium.jpg`, `captures/mermaid-conc-diagram0-light-chromium.jpg`                                                             |
| UWQ-007 | every sidebar category group button (for example "Tools and practices")                                                                                                           | The button's accessible name reads the count twice: "Tools and practices 11 11 courses" (a visible "11" plus a screen-reader-only "11 courses" inside the same button). The name does not make sense when read aloud. Departs from `accessibility.feature` "Buttons and interactive elements have ARIA labels: each button should have an accessible name" in intent (names that make sense is a gate judgement).                                                                                                                                                                                                                                                                                                                                                                                                 | LOW         |            | no       | 1     | open   | Accessibility snapshot of the button on `/en/learn/courses`; DOM shows the `tabular-nums` count span and the `sr-only` span                                                                                                    |

## Scenario proposals and open questions (not ledger rows)

These are correct or unspecified behaviours that no cited scenario protects. They are proposals for the owner to confirm,
and nothing is written into a specification.

- GP-1 Focus when the diagram replaces the focused source. Observed on Chromium, Firefox and WebKit: if the visitor has
  focus on the Mermaid source when rendering finishes, the source becomes hidden and `document.activeElement` becomes the
  body; the next Tab continues correctly to the control after the block. The existing scenario only says the source
  "should be removed from keyboard focus order". Proposal:

  ```gherkin
  Scenario: Keyboard position survives a diagram rendering under the focused source
    Given a visitor has keyboard focus on the Mermaid source while its diagram is still rendering
    When the diagram finishes rendering
    Then the next Tab moves focus to the control after the code block
    And focus is not returned to the start of the page
  ```

  Whether focus should move to the diagram (or stay announced) is a design question for the owner.

- GP-2 The 404 page (`/en/learn/courses-extra/git`, `/id/learn/courses/just-enough-python`) has no `h1` (its title text
  "Page Not Found" is an `h2`) and a generic document title "Not Found | AyoKoding". No scenario covers the not-found
  page. Proposal: a scenario stating the not-found page exposes one level-1 heading and a title that names the state.
- OQ-1 Mermaid diagram legibility at 375px. Because the diagram is fitted into the box the source reserved, effective
  text size on a phone is small: concurrency page 4.2 to 10.3px (all 7 diagrams under 11px), vitest page 5.2 to 13.1px
  (4 of 8 under 9px), against 10 to 16px at 1280. Several diagrams also sit in tall boxes with large empty bands above
  and below. No scenario states a legibility expectation, so this is an open question (is pinch-zoom the intended
  answer?), not a defect.
- OQ-2 `lesson+path`: on a lesson page inside a course, with `?path=`, the generic sidebar is shown and a path-context
  data request fires. The specification names course landing pages and non-course pages only; whether lessons should
  show the path rail is unspecified.

## Observations (not findings)

- Rendering speed differs by engine on this machine: seven concurrency-page diagrams rendered at about 3.1s (Chromium),
  2.7s (Firefox) and 12.7s (WebKit) after navigation, so the pending state lasts longest in WebKit. The machine was also
  running other work, so timing is indicative only.
- The sidebar scroll area, the "Resize panel" separator and the drawer's "Drawer width: Default / Wide" buttons are all
  keyboard reachable and named; the drawer's first focus lands on its width control, which has an explanatory
  description.

## Completeness critic

Categories judged with at least one run: structure (both pages, all states), function (focus order, group toggles, drawer,
skip link), data at its limits (unknown, empty and valid `path` ids; 404 routes), interfaces (the course-path request),
platform (three engines, two viewports, two themes), time (pending, failed, release while focused).

Open gaps (never enumerated): laptop 1024px layout and the table of contents; browser zoom and text-only resize; reduced
motion; Firefox and WebKit dark and mobile for the sidebar and Mermaid rendered runs; the pending state on the vitest
page in Firefox and WebKit; screen-reader output (the accessible names were read from the browser's accessibility
snapshot, not a screen reader); other pages containing Mermaid blocks (788 more `en` files); Mermaid on pages reached
only through path context; and the real network behaviour of the course-path request on slow links.

## Closing block

- Subject: `http://127.0.0.1:3101`, production build of `apps/ayokoding-www`; charter `spec`; mode `normal`; cycle 1 of
  at most 3.
- Findings: 7 ledger rows. CRITICAL 0, HIGH 1 (UWQ-001), MEDIUM 5 (UWQ-002 to UWQ-006), LOW 1 (UWQ-007). Blocking under
  `normal`: 1 open (UWQ-001). Scenario proposals 2, open questions 2.
- Both changes under judgement behaved as specified on every check run: (a) fallback source focusable while pending or
  failed and out of the focus order once rendered, with a visible focus ring and no trap; (b) generic sidebar on
  non-course routes, path rail only on a course with a valid path, open group preserved. The one cross-cutting
  difference is UWQ-002 (a course-path data request on non-course `?path=` routes, no visible effect). The blocking row
  is a pre-existing dark-theme rendering defect outside both changes.
- Judge result handed to the gate (the judge does not rate confidence or give the verdict): one open blocking row under
  mode `normal`, which maps to `FAIL` in the workflow's verdict table; the gate decides.
- Entry and exit tooling: the Deterministic Boundary owners (`test:quick`, each `*-fe-e2e` `test:e2e`, `typecheck`,
  `lint`, `format-staged`) were not run by the judge and none of their properties are reported as findings.
- Tooling blockers: none. Build provenance showed no stale or mismatched build.
- Captures: 17 small JPEGs under `plans/in-progress/docker-to-podman/evidence/P3/ui-gates/captures/` (about 250 KB), no
  video, no traces, no credentials or personal data.

## Propagation outcome and gate verdict

This section records the propagation outcome for the ledger rows above and the cycle 1 gate verdict. It changes no row
and does not alter the closing block. Statuses use the `ui-web-propagation` vocabulary (`resolved`, `not-resolved`,
`not-applicable`, `needs-decision`). The scope column says whether a row belongs to one of the two judged changes, (a)
or (b), or is pre-existing and out of scope.

The propagation writer, `swe-developer` in Apply Findings mode, repaired no row in this ledger. The Mermaid focus
repair made in this delivery answers triad rows from `ewt.md`, `uwt.md` and `dwt.md` (DWT-006), so it is not a row here.

### Propagation outcome per row

| Row     | Criticality | Scope                                                                                                | Status         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UWQ-001 | HIGH        | Out of scope (pre-existing). The Mermaid `theme: "default"` line is unchanged from main.             | not-resolved   | Not repaired in this delivery. The row stays open and blocking under mode `normal`. It needs an owner (see the verdict below). The same dark-theme defect is recorded as DWT-001 in `dwt.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| UWQ-002 | MEDIUM      | Not in change (b) code. The request comes from the header mobile navigation.                         | not-applicable | `apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx` line 75 enables the runtime fetch when `open \|\| searchParams.has("path")`. That file is unchanged from main and is mounted on every locale page. Change (b) removed the sidebar host's own call on non-course routes. The writer's probe test showed: (1) mobile navigation closed on `/en/tools` with `?path=foo` calls the request; (2) it does not without the query; (3) the same holds on `/en`; (4) the sidebar host on `/en/tools` with `?path=foo` does not call it; (5) the sidebar host on a course page with `?path=foo` does. The request still fires on the judged build, so the row stays open. Status is `not-applicable` because the writer classed the source as outside change (b); the owner should confirm that status. The plan wording at `plans/in-progress/docker-to-podman/tech-docs.md` lines 386 to 394 ("avoids the optional runtime request on non-course `?path` routes") overclaims. It holds for the sidebar's own request only. |
| UWQ-003 | MEDIUM      | Out of scope (pre-existing). The category group component is unchanged from main.                    | not-resolved   | Not repaired. Needs an owner. The group count sits outside the visible sidebar area at 1280 and in the 375 drawer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| UWQ-004 | MEDIUM      | Out of scope (pre-existing). Routes and content on the `id` locale; neither change touches them.     | not-resolved   | Not repaired. Needs an owner. The `id` path pages link to course URLs that return 404.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| UWQ-005 | MEDIUM      | Out of scope (pre-existing). A content defect in two authored Mermaid blocks.                        | not-resolved   | Not repaired. Needs an owner, probably the content owner. The failing blocks are Examples 19 and 28 on the concurrency beginner page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| UWQ-006 | MEDIUM      | Out of scope (pre-existing). Mermaid rendering output, theme independent; neither change touches it. | not-resolved   | Not repaired. Needs an owner. Node labels and subgraph titles are clipped or overlapped in the rendered diagrams.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| UWQ-007 | LOW         | Out of scope (pre-existing). The sidebar group button component is unchanged from main.              | not-resolved   | Not repaired. Needs an owner. The accessible name of each group button reads the count twice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Scope caveat. The branch changes four files under `apps/ayokoding-www/src` (diff against main): change (a) is
`src/features/content/shell/mermaid.tsx`, and change (b) is `src/app/[locale]/(content)/layout.tsx` and
`src/features/course-paths/shell/sidebar-host.tsx`. The fourth file, `src/build-workers.ts`, is outside both judged
changes and the judge did not review it. The "out of scope" claims for the rows above rest on the unchanged
components named in the table. They do not cover `build-workers.ts`.

### Gate verdict, cycle 1

- Verdict: `FAIL` under the workflow's verdict table. The cause is one open blocking row, UWQ-001 (HIGH, mode `normal`).
- Owner: the `FAIL` rule requires each open blocking row to have an owner (idea brief, plan item, or issue). No owner is
  named in this record. The caller names one.
- Advisory: the verdict is advisory and does not stop the caller.
- Cycle 2: not run. Re-judging needs the rebuilt interface. Rebuild and server restart were not permitted in this run.
  No clean second cycle is claimed.
- Change (a): every check the judge ran passed (passed checks P-01 to P-06).
- Change (b): every sidebar and course-path check the judge ran passed (passed checks P-07 to P-16). The one exception is
  the course-path request that the page still sends on non-course `?path` routes (UWQ-002, P-10). It has no visible
  effect, and it comes from outside change (b). Change (b)'s stated outcome of no course-path behaviour on those routes
  is therefore met for the sidebar only.
- Build provenance conflict: the Build provenance section above records no stale or mismatched build. The EWT pass
  recorded two Next.js build ids on the same origin at its start (TC-001 in `ewt.md`), and the DWT pass recorded the same
  condition at its start (TC-001 in `dwt.md`), with no measured effect. This record does not give the timing of either
  observation. Read cycle 1 with that caveat.

## Cycle 2 re-check (clean rebuild)

Scope: one repaired row, DWT-006 (the Mermaid fallback source focus indicator). Judge: `swe-web-tester`, passive browser
checks only. No source, build, server or podman action. Not a full second cycle: no other row was re-judged and no gate
verdict is given here.

- Repair under test: `apps/ayokoding-www/src/features/content/shell/mermaid.tsx`, the focusable fallback `<pre>` carries
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground`.
- Origin and page: `http://127.0.0.1:3101/en/learn/courses/just-enough-bash/learning/beginner` (two Mermaid blocks),
  1280 wide, locale `en`, headless Playwright from the repo `node_modules`: Chromium 149.0.7827.55, Firefox 151.0,
  WebKit 26.5.
- Method: theme set through `localStorage` (`theme`) plus the matching colour scheme. For the fallback state the two
  dynamic chunks that carry Mermaid code were aborted with `route.abort()` (chunk set found by a calibration load: dynamic
  chunks whose body mentions mermaid). Focus was placed on the tab stop before the block, then one real `Tab` key press.
  Colours were read from computed style, resolved to sRGB through a canvas, and cross-checked from screenshot pixels on
  the left edge of the ring at device pixel ratio 1.

### Fallback state, Tab to the source (chunks aborted)

In every run: 0 SVGs drawn, both Mermaid `<pre>` elements still `tabindex="0"`, the first one is `document.activeElement`
and matches `:focus-visible`.

| Engine   | Theme | Outline (computed)     | Outline colour (sRGB) | vs code surface (`246,248,250` light, `36,41,46` dark) | vs page (`254,252,247` light, `2,8,23` dark) | Strongest ring pixel vs page | Result |
| -------- | ----- | ---------------------- | --------------------- | ------------------------------------------------------ | -------------------------------------------- | ---------------------------- | ------ |
| Chromium | light | solid, 2px, offset 2px | `22,16,10`            | 17.73:1                                                | 18.41:1                                      | 18.41:1                      | pass   |
| Chromium | dark  | solid, 2px, offset 2px | `248,250,252`         | 14.02:1                                                | 19.12:1                                      | 19.12:1                      | pass   |
| Firefox  | light | solid, 2px, offset 2px | `22,16,10`            | 17.73:1                                                | 18.41:1                                      | 18.41:1                      | pass   |
| Firefox  | dark  | solid, 2px, offset 2px | `248,250,252`         | 14.02:1                                                | 19.12:1                                      | 19.12:1                      | pass   |
| WebKit   | light | solid, 2px, offset 2px | `22,16,10`            | 17.73:1                                                | 18.41:1                                      | 18.41:1                      | pass   |
| WebKit   | dark  | solid, 2px, offset 2px | `248,250,252`         | 14.02:1                                                | 19.12:1                                      | 19.12:1                      | pass   |

The light colour is computed as `lab(5.26 1.68 3.86)` (the `foreground` token); the dark one is `rgb(248, 250, 252)`. The
ring is 2 px wide in the screenshot pixels, with the 2 px gap visible between ring and source. All six runs meet the 3:1
requirement by a wide margin. In cycle 1, WebKit measured 2.70:1 light and 2.74:1 dark against the code surface; both
are gone because the outline is now explicit and identical in all three engines.

### Rendered state (chunks not aborted)

In all six engine and theme runs the diagram rendered (2 SVGs), and each Mermaid `<pre>` had `tabindex="-1"`, computed
`visibility: hidden` and the `invisible` class. Tab presses from the stop before the block never landed on it. A walk of
250 Tab presses from the top of the page reached the Mermaid source 0 times when rendered, and 2 times (both blocks) when
the chunks were aborted, in Chromium, Firefox and WebKit.

### Build-id consistency

All 31 `/_next/static` responses of the page returned 200 in every engine and theme run (0 non-200, 0 failed). The page
HTML and three other pages (`/en`, `/en/learn`, the intermediate lesson) all carry one build id, which equals the
`.next/BUILD_ID` of the served build. Single clean build, no mixed ids.

### Outcome

- DWT-006: PASS. Row status in `dwt.md` updated to repaired and re-checked.
- New findings: none. Unexpected: none. The calibration found three Mermaid-bearing dynamic chunks, of which two were
  requested on this page; the abort held (0 SVGs) in every run.
- Not re-measured: 375 and 768 widths, the vitest page, real Safari (the Playwright WebKit build is not Safari), and the
  other cycle 1 rows.
- Captures (small JPEGs, `captures/cycle2-dwt006-*`): `fallback-focus-1280-light-chromium`,
  `fallback-focus-1280-dark-chromium`, `fallback-focus-1280-dark-firefox`, `fallback-focus-1280-light-webkit`,
  `fallback-focus-1280-dark-webkit`, `rendered-1280-dark-chromium`.
