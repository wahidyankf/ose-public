# EWT: exploratory web pass, ayokoding-www (Mermaid keyboard focus and sidebar layout boundary)

Status: IN PROGRESS (record opened; findings are appended as they are confirmed; totals close the record).

- Charter: `exploratory`, first pass of the EWT -> UWT -> DWT triad of
  `repo-governance/workflows/quality/ux-review-fix-planning.md`, in its in-flight "delivery" variant. Findings are
  recorded as evidence only. No plan folder, no fixes, no server-state mutation. Judge: `swe-web-tester`.
- Subject: production build of `apps/ayokoding-www` already served at `http://127.0.0.1:3101` (fixture manifests,
  drafts shown). Branch `docker-to-podman`.
- Passive only: read, click, resize, probe, request interception inside the test browser. No server, build, podman, or
  repository file other than this record was changed.

## Tooling and versions

| Item                             | Value                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Browser driver                   | Playwright library 1.61.0 (repo `node_modules`), Node 24.16.0, scripts kept outside repo |
| Chromium                         | 149.0.7827.55 (headless)                                                                 |
| Firefox                          | 151.0 (headless)                                                                         |
| WebKit                           | 26.5 (headless, Linux build)                                                             |
| Playwright / Chrome DevTools MCP | not used; the repo Playwright library was reachable and healthy in all three engines     |
| Origin                           | `http://127.0.0.1:3101` (HTTP 200 on `/en` before the pass)                              |
| Viewports                        | 375x667 (m), 768x1024 (t), 1280x800 (d)                                                  |
| Locales                          | `en`, `id` (confirmed from the home page language switcher and routes; `/fr` is a 500)   |
| Themes                           | default (light) only; no theme toggle exercised (not in this charter)                    |
| State changes authorized         | none; only client-side `localStorage` of throwaway browser contexts                      |
| Compute                          | `rtk ./hippo run --class ephemeral --resource-tier standard` where admitted (see notes)  |

## Tooling causes (not product findings)

### TC-001: the served origin mixes two Next.js build IDs (stale/mismatched build)

- Evidence: the SSR payload of each route carries its build id (`"b":"<id>"`). Fetching 26 routes showed two ids on
  one running server: `eQkw6_Fd9Rhu7z7w30-1f` for `/en/learn`, `/en/learn/paths*`, `/id/learn/paths`, and the
  server-rendered 404/500 pages; `9JRoXny3bdQOD-PB5WNsZ` for `/en`, `/id`, `/en/browse`, `/en/tools*`,
  `/en/learn/courses*`, `/en/learn/legacy*`, `/id/belajar`, `/id/browse`. The on-disk build id of the app is
  `9JRoXny3bdQOD-PB5WNsZ` (written after the server process started); the process itself started earlier. Prerendered
  pages are read from the rebuilt files, runtime-rendered pages come from the older in-memory build.
- Effect on this pass: client code is identical in both builds (the 16 client chunk file names listed by
  `/en/learn` and `/en/learn/courses` are the same set, content-hashed), so behaviour of the two changed surfaces is
  valid. But a soft (client-side) navigation from a page of one build id to a page of the other is turned into a full
  page reload by Next.js (observed: course page to `/en/learn` via the sidebar "Learn" link reloads the document, a
  `window` marker set before the click is gone). That reload is a tooling artefact, not a product defect.
  Client-navigation experiments were therefore run only between pages of the same build id
  (`9JRoXny3bdQOD-PB5WNsZ`). Any 404/500 observation served by the runtime (older) build is tagged "possible tooling
  cause".
- Action requested of the orchestrator: restart the app server from the rebuilt output (or rebuild once more with the
  server stopped) before relying on this record for sign-off.

### TC-002: shared host load

The host was heavily loaded by other work (load average 10 to 30, HIPPO deferred or shed several runs with exit 124 and
`pressure-shed`; each was retried one at a time until admitted). WebKit renders Mermaid very slowly under that load
(first diagram swap took 15 to 28 s in the hold test, against about 1.5 s in Chromium), so WebKit timing numbers are
indicative only and no performance claim is made from them.

## Findings

Scope key: IN-A = the Mermaid tabindex change (`mermaid.tsx`); IN-B = the sidebar boundary change (`sidebar-host.tsx`,
`(content)/layout.tsx`); NEIGHBOUR = touches the changed surface or its stated goal but the cause is outside the diff;
PRE = pre-existing, independent of both changes.

### EWT-001 (MEDIUM, behavioural/performance, scope: NEIGHBOUR of IN-B, goal of the change not met)

The runtime course-path request still fires on every non-course `?path=` route.

- Reproduction: open `http://127.0.0.1:3101/en/learn?path=skills/e2e-fixture-alpha` (also `/en/browse?path=...`,
  `/en/learn/courses?path=...`, `/en/learn/legacy?path=...`, a legacy by-example page with `?path=bogus`, `/id/browse`,
  `/id/belajar`, `/id/learn/paths`, and `/en?path=...`, `/id?path=...`), any viewport, any engine. Record the network log.
- Observed: one `GET /api/trpc/coursePaths.getRouteData?batch=1&input=...` (locale `en` or `id`) on all of them, 1280,
  768 and 375 wide. Chromium: all 84 direct loads that carried a `path` query (course routes included) logged it and
  none of the loads without a query did. Firefox: 18 of 18 loads with the query. WebKit: 16 of 18 inside the 1.5 s
  window (two 1280 loads logged none, under host load, see TC-002). It also fires on 404 pages that carry `?path=` (`/en/nonexistent?path=x`,
  `/en/learn/courses-extra/git?path=...`, `/id/learn/courses/just-enough-python?path=...`) and on `/en?path=` and
  `/id?path=`, which have no `(content)` layout and no sidebar at all, so the sidebar host cannot be the caller there.
  Without `?path=` no request is made on these routes (drawer closed). Attribution by reading the served bundle: the
  header mobile navigation enables the same runtime fetch when `searchParams.has("path")` is true, and it is mounted on
  every page at every viewport.
- Expected: the stated goal of change (b), "avoid the optional runtime course-path request on non-course `?path`
  routes", and the scenario outline in `specs/apps/ayokoding/www/behaviours/frontend/course-paths/canonical-fallback.feature`
  ("A page that is not a course in this locale keeps the generic sidebar when a path context query is present", step
  "And the path context query is not read", examples `/en/browse`, `/en/learn/courses`, `/en/learn/courses-extra/git`,
  `/id/learn/courses/just-enough-python`). At the page level the query is read and the request is made.
- Also seen: opening the mobile drawer on a non-course page without `?path=` (375 wide, `/en/learn`) sends the same
  request, batched with `content.getTree`.
- Independent of the change: the request on `/en?path=` and `/id?path=` is made on routes the diff does not touch.
- Note: the scenario is bound to a unit test of the sidebar host only (`@e2e-exempt`), which is why it passes while the
  page still makes the request; see SG-003.

### EWT-002 (LOW, behavioural consistency, scope: IN-B, regression of persisted sidebar state)

Sidebar state is lost when a client-side navigation crosses the course / non-course boundary.

- Reproduction (1280 wide, `/en/learn/courses/just-enough-python`, same build id for both pages, see TC-001):
  expand one more sidebar section with its chevron, scroll the sidebar 150 px, then click the sidebar "Courses" link
  (non-course catalog page).
- Observed (Chromium, Firefox, WebKit alike): the sidebar `<nav>` element is replaced (a marker property set on it before
  the click is gone), the open sections fall back to the default set (Chromium and Firefox 4 to 2, WebKit 3 to 2) and the
  sidebar scroll position goes from 150 px to 0. Back to the
  course page the sections are again the default set (3), not the reader's. Controls on the same build id: course to
  course (`just-enough-python` to `just-enough-elixir`) and non-course to non-course (`/en/learn/courses` to
  `/en/browse` and back) keep the same `<nav>` element and keep the expanded sections. The resizable `<aside>` and its
  scroll container are kept in every case, and the persisted width (310 px after 6 `ArrowRight`) survives soft
  navigation and reload.
- Expected: before the change the host kept one element type at that position for every route, so the sidebar kept its
  state. `specs/apps/ayokoding/www/behaviours/frontend/navigation/sidebar-course-categories.feature` ("An open group
  stays open when course path context loads on the courses page") expresses the same intent, and
  `resizable-sidebar.feature` expects the reader's sidebar choices to persist. No scenario covers state across the
  boundary, see SG-002.
- Not independent of the change: it follows from the host now returning the children directly on non-course routes and
  wrapping them in a Suspense boundary only on course routes, which changes the element type across the boundary.
- Impact: small (a reader who opened sections or scrolled the rail finds it reset), no data loss.

### EWT-003 (LOW, accessibility/focus, scope: IN-A)

Focus falls to the document body when the focused Mermaid source is hidden by the render.

- Reproduction: hold the Mermaid chunks (request interception inside the test browser), open
  `/en/learn/courses/concurrency-and-parallelism/learning/beginner`, focus the first diagram source (it is a tab stop,
  `tabindex="0"`), release the chunks.
- Observed (Chromium: the four course Mermaid pages at 375, 768 and 1280, 12 runs; Firefox and WebKit: beginner at
  1280 only; the vitest page's swap was not run): while the SVG appears the source turns `tabindex="-1"` and
  `visibility: hidden`, and `document.activeElement` becomes `<body>` (first seen 0.4 to 2.2 s after release in
  Chromium, 2.4 s in Firefox, 16 s in WebKit under host load). The scroll position and the block box do not change (same top and height). The next Tab goes to the next
  tabbable element after the block and Shift+Tab to the heading link before it in all three engines, so keyboard order is
  preserved, but a screen-reader user hears focus return to the document and a sighted keyboard user sees the focus ring
  vanish.
- Expected: `content-rendering.feature` "Mermaid source stays keyboard reachable while its diagram is pending" and "The
  Mermaid source leaves keyboard focus order once the diagram renders" are both met. The moment of the swap is not
  specified, see SG-001. WCAG 2.4.3 (focus order) is not violated; this is a rough edge, not a failure.

### EWT-004 (MEDIUM, content/functional, scope: PRE, in scope of the Mermaid scenarios but unrelated to the diff)

Three Mermaid diagrams in the course content have invalid syntax and never render.

- Reproduction: open `/en/learn/courses/concurrency-and-parallelism/learning/beginner` and
  `/en/learn/courses/concurrency-and-parallelism/learning/intermediate`, wait 5 s.
- Observed: beginner has 9 diagrams, 7 render (the failing ones are "Example 19: Condition -- wait and notify" and
  "Example 28: asyncio.gather Runs asyncio.sleep Tasks Concurrently"); intermediate has 9, 8 render (the failing one is
  "Example 50: asyncio.create_task Schedules Work CONCURRENTLY, Not Sequentially"). Console shows `[mermaid] Failed to
render diagram: Parse error on line 9 / 11 / 7`. The raw diagram source stays on the page as the block, visible and
  focusable. Causes visible in the console messages: a `;` inside a message text of a `sequenceDiagram`, and a
  participant alias `Loop` that collides with the `loop` keyword. Same result in all three engines and all viewports.
  `advanced` (15), `learning/capstone/overview` (1) and the vitest by-example page (8) render all their diagrams.
- Expected: `content-rendering.feature` "Mermaid diagram renders as an SVG" (the diagram should render; the raw source
  should not be visible). The fallback itself is correct per the "fails to render" scenario.
- Independent of the changes: parse errors are a property of the authored chart text.
- Open gap: only the five requested Mermaid pages were checked; the other 785 Mermaid-bearing English pages were not
  parsed, so more failing charts may exist.

### EWT-005 (LOW, robustness, scope: PRE, same file as IN-A but on unchanged lines)

When the Mermaid chunk cannot be loaded, every diagram raises an uncaught `ChunkLoadError`.

- Reproduction: abort the Mermaid chunk requests (interception), open any Mermaid page.
- Observed: page errors `ChunkLoadError: Failed to load chunk /_next/static/chunks/<hash>.js` (one per diagram: 8 on the
  vitest page; the other pages produced at least the 4 listed by the harness cap, 1 on the capstone overview). No
  `[mermaid] Failed to render diagram` warning on this path, unlike the parse-error path. The source stays visible and a
  tab stop (correct per "fails to render").
- Expected: the failure path is specified only as keyboard reachability; the unhandled rejection is not covered. Noise in
  error monitoring, no reader-visible effect.

### EWT-006 (MEDIUM, performance/layout stability, scope: PRE, independent of both changes)

The right-hand table of contents is inserted late and narrows the article, a large layout shift on long pages at 1280.

- Reproduction: load any long course page at 1280x800 (`concurrency-and-parallelism/learning/beginner`, `.../advanced`,
  `.../capstone/overview`, `.../intermediate`, the vitest by-example page) and read the `layout-shift` entries.
- Observed (Chromium, headless, local server): CLS 0.184 (beginner), 0.175 (intermediate), 0.104 (advanced), 0.231
  (capstone overview), 0.309 (vitest, also 0.309 with `?path=bogus`). No shift at 375 or 768 (CLS about 0.001), and none
  at 1280 on short pages (`just-enough-bash` 0.0007). Frame timeline on `beginner`: the article is 1030 px wide until the
  200 px `aside` with the table of contents joins the document (about 0.3 to 0.7 s, while the HTML of a 70,000 px page is
  still streaming), then the article is 830 px wide and the whole first screen reflows (the Mermaid source box is the
  first listed shift source only because it is the first moved block). The diagram swap itself adds nothing: the source
  box and the diagram box keep the same top and height, and the document grows by under 70 px in total.
- Expected source: repo explanation doc `docs/explanation/software-engineering/platform-web/tools/fe-nextjs/performance.md`
  checklist "CLS < 0.1" (non-binding); `responsive.feature` "Desktop viewport shows sidebar, content, and table of
  contents" is met. No governing scenario for stability of the table of contents, see SG-006.
- Independence: the shifting element is the table of contents, not touched by the diff; the same shift appears on the
  vitest legacy page, which has no course context.

### EWT-007 (MEDIUM, functional/URL-IA, scope: PRE, independent of both changes)

The language switcher offers a language for which the current page does not exist, and lands on a 404.

- Reproduction: `/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`, open "Switch language", choose
  "Bahasa Indonesia". Also from `/en/learn?path=...`, from a legacy by-example page, and from `/id/belajar` to English.
- Observed (Chromium 1280 and 375, same at both): the router goes to `/id/learn/courses/just-enough-bash?path=...`,
  `/id/learn?path=...`, `/id/learn/legacy/...`, and `/en/belajar`, all HTTP 404 with the not-found page inside the
  sidebar layout. The query is preserved (re-encoded as `skills%2Fe2e-fixture-alpha`). Where a counterpart exists
  (`/en/learn/paths` and `/id/learn/paths`, in both directions) the switch works. The Indonesian tree has 125 URLs in the
  sitemap against 3,157 for English, so most English pages have no counterpart.
- Expected: `specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature` user story "I want to switch between
  available languages / So that I can read content in my preferred language"; the scenario "Switching language redirects
  to the locale-specific URL" is met literally (the URL is rewritten) but never says what happens when the target does
  not exist. Intent is unclear, so this is recorded with a question: is a 404 the intended landing? See SG-004.

### EWT-008 (MEDIUM, functional/HTTP, scope: PRE, independent of both changes; possible tooling contribution ruled out)

An unsupported locale prefix returns HTTP 500 with a "404" page body.

- Reproduction: `curl -i http://127.0.0.1:3101/fr` or open `/fr`, `/xx/learn`, `/zz/learn/courses`.
- Observed: status 500; the rendered page shows title "404: This page could not be found." and the browser logs the 500.
  `/en/nonexistent` and `/id/nonexistent`, served by the same older runtime build, answer a correct 404, so this is not an
  artefact of TC-001. `/EN`, `/ID`, `/en/` redirect with 308 to the lowercase canonical URL as
  `locale-redirects.feature` requires.
- Expected: the page body and a reader's expectation say "not found"; a 500 pollutes monitoring and crawlers. No scenario
  covers an unsupported locale, see SG-005.
- Independence: the route has no `(content)` layout; neither diff touches it.

### EWT-009 (MEDIUM, performance/layout stability, scope: PRE, OUTSIDE the charter)

`/en/tools/ai-benchmark` shifts its footer and a button after load.

- Observed: CLS 0.571 at 375, 0.327 at 1280, 0.425 at 768, identical with and without `?path=`. Sources: `FOOTER` and a
  `BUTTON`. Recorded because it was seen while enumerating routes; not investigated further (not in the charter).

### EWT-010 (MEDIUM, behavioural consistency, scope: IN-B route test; behaviour is the same before the diff, so not a regression)

A not-found page for a course URL shows the path rail when the course is in the path in `?path=`.

- Reproduction: open `http://127.0.0.1:3101/id/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha` (also
  `/id/learn/courses/version-control-and-git?path=skills/e2e-fixture-alpha`), 375, 768 and 1280. The Indonesian tree has no
  course pages, so each is a 404. Also reachable by switching language from the English course page (Matrix 3, flow 1).
- Observed (Chromium; the language-switch route also in the same engine): HTTP 404, and the sidebar shows the path rail
  with the course marked as the current item ("Just Enough Bash", "Version Control And Git"). Without `?path=` the same
  URL shows the generic sidebar; with a path that does not contain the course
  (`/id/learn/courses/just-enough-python?path=skills/e2e-fixture-alpha`) it shows the generic sidebar. So the host decides
  "this is a course" from the URL text alone, not from the page existing in the locale.
- Expected: `canonical-fallback.feature` Outline "A page that is not a course in this locale keeps the generic sidebar when
  a path context query is present", example `/id/learn/courses/just-enough-python`, steps "Then the generic sidebar is shown
  / And the path context query is not read". The example passes here only because that course is not in the fixture path;
  a course that is in the path breaks the stated rule. The change's boundary (decide course by URL prefix) is the
  mechanism, and the same prefix test existed in the location resolver before the diff.
- Impact: a reader on a missing page is told, by the rail, that they are on a real course of the path.

## Open questions (no governing source, therefore not defects)

- OQ-001 Mermaid legibility on a phone. Rendered diagrams are fitted into the reserved source box, so wide diagrams shrink:
  scale (rendered width over viewBox width) is 0.26 (beginner, one diagram), 0.28 (advanced), 0.30 (intermediate), 0.33
  (vitest) and 0.51 (capstone overview) at 375; at 768 the minimum is 0.39; at 1280 it is 0.60. With the 16 px diagram font
  that is roughly 4 to 5 px text at the smallest. The box is sized by the source line count, so the diagram can also sit in
  a mostly empty box (capture `captures/ewt-mermaid-smallest-scale-beg-m.jpeg`). No scenario sets a legibility floor, so
  the owner decides whether this is acceptable (PRE, unrelated to the two changes).
- OQ-002 Clipped node labels in rendered diagrams. In `beginner` (Example 2, "counter = 0 (parent process memory)") the last
  line of two node labels is cut off at the box edge in Chromium on Linux (captures `captures/ewt-mermaid-rendered-d.jpeg`
  and `-m.jpeg`). Programmatic check on every label (label content taller than its box): beginner 47 of 53 labels, intermediate 29
  of 46, advanced 88 of 137, capstone overview 4 of 7, vitest 46 of 79 (labels are 4 px taller than their box
  where the font is 16 px with 24 px line height; only some cut visible text). The host fonts may differ from a reader's,
  so whether readers see it is unconfirmed (PRE).
- OQ-003 Is a 404 the intended landing after switching language to a page that has no counterpart (EWT-007)?
- OQ-004 The sidebar shows a transitional state on course routes with `?path=`: the generic tree is visible for about 0.6 s
  in Chromium (1.3 to 2.3 s in Firefox and WebKit on the loaded host), then the path rail replaces it in the same 250x736
  box (no layout shift). With the runtime request delayed 3 s the generic tree stays about 4 s; with it failed the generic
  tree stays and no error is shown; with scripting disabled the generic tree is served. This is the existing design (the
  static page cannot know the manifests) and no scenario describes it, see SG-007; whether the 0.6 s flash is acceptable is
  a design question for the DWT pass.

## Spec-gap proposals (correct or intended behaviour with no protecting scenario; for the owner to confirm, not written into any spec)

### SG-001: focus when a pending Mermaid source is replaced (from EWT-003)

```gherkin
Scenario: Keyboard position survives the diagram replacing a focused Mermaid source
  Given a visitor opens a content page with a Mermaid code block between two controls
  And the diagram is still rendering
  And the Mermaid source has keyboard focus
  When the diagram finishes rendering
  Then focus does not return to the start of the document
  And pressing Tab moves focus to the control after the diagram
  And pressing Shift+Tab moves focus to the control before the diagram
```

### SG-002: sidebar state across the course boundary (from EWT-002)

```gherkin
Scenario Outline: Sections the reader opened stay open when moving between a course page and another page
  Given the reader is on <from_page> and has opened an extra sidebar section
  When the reader follows a sidebar link to <to_page> without leaving the site
  Then the extra section is still open
  And the sidebar keeps its scroll position

  Examples:
    | from_page                           | to_page                             |
    | /en/learn/courses/just-enough-python | /en/learn/courses                  |
    | /en/learn/courses                   | /en/learn/courses/just-enough-python |
```

### SG-003: no course-path data request on a non-course page, observable at the browser (from EWT-001)

```gherkin
Scenario Outline: A page that is not a course sends no course-path data request when a path context query is present
  Given a reader opens the page <page> with a path context query parameter
  When the page has finished loading
  Then the browser has sent no request for course-path data
  And the generic sidebar is shown

  Examples:
    | page                  |
    | /en/browse            |
    | /en/learn/courses     |
    | /en                   |
    | /id/belajar           |
```

### SG-004: language switch to a page with no counterpart (from EWT-007; intent to be confirmed, see OQ-003)

```gherkin
Scenario: Switching language on a page that has no translation
  Given a visitor is on the English page /en/learn/courses/just-enough-bash
  And no Indonesian page exists at the same path
  When the visitor selects Indonesian from the language switcher
  Then the visitor lands on a page that explains the page is not available in Indonesian
  And the visitor can continue to the nearest available Indonesian page or back to English
```

### SG-005: unsupported locale (from EWT-008)

```gherkin
Scenario Outline: An unsupported locale prefix is not found
  When a visitor requests "<url>"
  Then the response status is 404
  And the not-found page is shown

  Examples:
    | url             |
    | /fr             |
    | /xx/learn       |
```

### SG-006: the table of contents does not move the article after load (from EWT-006)

```gherkin
Scenario: The table of contents does not reflow the article after the page loads
  Given the viewport is set to "desktop" (1280x800)
  When a visitor opens a long content page
  Then the article keeps the same width from first paint to the end of loading
```

### SG-007: sidebar when course-path data is slow or unavailable (from OQ-004; behaviour observed correct in three engines)

```gherkin
Scenario Outline: A course opened with a path context keeps a usable sidebar while path data loads or fails
  Given a reader opens a course URL with a valid path context query parameter
  When the course-path data request is <condition>
  Then the generic sidebar stays shown without an error
  And the path rail replaces it only once the data arrives

  Examples:
    | condition       |
    | delayed 3 s     |
    | refused         |
```

## Coverage matrices

### Matrix 1: sidebar boundary, route x viewport x engine (direct load)

Cell = HTTP status, sidebar kind in the DOM (`G` generic tree, `R` path rail, `-` none), runtime course-path request seen
(`Q`) or not (`.`), and a trailing `S` where CLS exceeded 0.1. `n/r` = not run. 53 distinct routes. Chromium: 157 direct
loads (51 rows at 375, 768 and 1280; `/en/tools/ai-benchmark` without a query at 375 and 1280 only; the vitest `?path=bogus`
row not run in Chromium). Firefox and WebKit: 24 loads each over 12 routes at 375 and 1280 (no tablet in those two engines,
gap). Locales `en` and `id` are both present. The sidebar is hidden (`display: none`) at 375 by design; the DOM kind is
still reported. Every load ended with no page error; the only console messages are the 404/500 resource lines of the error
rows, the `[mermaid] Failed to render diagram` warnings on the pages of EWT-004, and in Firefox an analytics cookie
warning on most loads.

| Route                                                                                                                     | Ch 375 | Ch 768 | Ch 1280 | Fx 375 | Fx 1280 | WK 375 | WK 1280 |
| ------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ------- | ------ | ------- | ------ | ------- |
| `/en/learn`                                                                                                               | 200G.  | 200G.  | 200G.   | 200G.  | 200G.   | 200G.  | 200G.   |
| `/en/learn?path=skills/e2e-fixture-alpha`                                                                                 | 200GQ  | 200GQ  | 200GQ   | 200GQ  | 200GQ   | 200GQ  | 200GQ   |
| `/en/learn?path=bogus`                                                                                                    | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/browse?path=skills/e2e-fixture-alpha`                                                                                | 200GQ  | 200GQ  | 200GQ   | 200GQ  | 200GQ   | 200GQ  | 200GQ   |
| `/en/learn/courses?path=skills/e2e-fixture-alpha`                                                                         | 200GQ  | 200GQ  | 200GQ   | 200GQ  | 200GQ   | 200GQ  | 200GQ   |
| `/en/learn/courses`                                                                                                       | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-bash`                                                                                      | 200G.  | 200G.  | 200G.   | 200G.  | 200G.   | 200G.  | 200G.   |
| `/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`                                                        | 200RQ  | 200RQ  | 200RQ   | 200RQ  | 200RQ   | 200RQ  | 200RQ   |
| `/en?path=skills/e2e-fixture-alpha`                                                                                       | 200-Q  | 200-Q  | 200-Q   | n/r    | n/r     | n/r    | n/r     |
| `/en`                                                                                                                     | 200-.  | 200-.  | 200-.   | n/r    | n/r     | n/r    | n/r     |
| `/id?path=skills/e2e-fixture-alpha`                                                                                       | 200-Q  | 200-Q  | 200-Q   | n/r    | n/r     | n/r    | n/r     |
| `/id`                                                                                                                     | 200-.  | 200-.  | 200-.   | n/r    | n/r     | n/r    | n/r     |
| `/en/tools/ai-benchmark?path=skills/e2e-fixture-alpha`                                                                    | 200-QS | 200-QS | 200-QS  | n/r    | n/r     | n/r    | n/r     |
| `/en/nonexistent?path=skills/e2e-fixture-alpha`                                                                           | 404GQ  | 404GQ  | 404GQ   | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/paths?path=skills/e2e-fixture-alpha`                                                                           | 200GQ  | 200GQ  | 200GQ   | 200GQ  | 200GQ   | 200GQ  | 200G.   |
| `/id/belajar?path=skills/e2e-fixture-alpha`                                                                               | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/legacy?path=skills/e2e-fixture-alpha`                                                                          | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/legacy/software-engineering/automation-testing/tools/vitest/by-example/beginner?path=skills/e2e-fixture-alpha` | 200GQ  | 200GQ  | 200GQS  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/paths/skills/e2e-fixture-alpha?path=skills/e2e-fixture-alpha`                                                  | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-beta`                                                         | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-bash?path=bogus`                                                                           | 200GQ  | 200GQ  | 200GQ   | 200GQ  | 200GQ   | 200GQ  | 200GQ   |
| `/en/learn/courses/just-enough-bash?path=`                                                                                | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha&path=bogus`                                             | 200RQ  | 200RQ  | 200RQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-bash?foo=bar`                                                                              | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/version-control-and-git?path=skills/e2e-fixture-alpha`                                                 | 200RQ  | 200RQ  | 200RQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-python`                                                                                    | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/just-enough-python?path=skills/e2e-fixture-alpha`                                                      | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism`                                                                           | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism?path=skills/e2e-fixture-alpha`                                             | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism/learning/beginner`                                                         | 200G.  | 200G.  | 200G.S  | 200G.  | 200G.   | 200G.  | 200G.   |
| `/en/learn/courses/concurrency-and-parallelism/learning/beginner?path=skills/e2e-fixture-alpha`                           | 200GQ  | 200GQ  | 200GQS  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism/learning/beginner?path=bogus`                                              | 200GQ  | 200GQ  | 200GQS  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism/learning/advanced`                                                         | 200G.  | 200G.  | 200G.S  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/concurrency-and-parallelism/learning/capstone/overview`                                                | 200G.  | 200G.  | 200G.S  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/legacy/software-engineering/automation-testing/tools/vitest/by-example/beginner`                               | 200G.  | 200G.  | 200G.S  | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses-extra/git`                                                                                             | 404G.  | 404G.  | 404G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses-extra/git?path=skills/e2e-fixture-alpha`                                                               | 404GQ  | 404GQ  | 404GQ   | 404GQ  | 404GQ   | 404GQ  | 404GQ   |
| `/id/learn/courses/just-enough-python`                                                                                    | 404G.  | 404G.  | 404G.   | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/courses/just-enough-python?path=skills/e2e-fixture-alpha`                                                      | 404GQ  | 404GQ  | 404GQ   | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/paths`                                                                                                         | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/id/browse?path=bogus`                                                                                                   | 200GQ  | 200GQ  | 200GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/paths/skills/e2e-fixture-alpha`                                                                                | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/paths`                                                                                                         | 200G.  | 200G.  | 200G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/nonexistent`                                                                                                         | 404G.  | 404G.  | 404G.   | n/r    | n/r     | n/r    | n/r     |
| `/id/nonexistent?path=x`                                                                                                  | 404GQ  | 404GQ  | 404GQ   | 404GQ  | 404GQ   | 404GQ  | 404GQ   |
| `/en/learn/courses/does-not-exist?path=skills/e2e-fixture-alpha`                                                          | 404GQ  | 404GQ  | 404GQ   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/courses/does-not-exist`                                                                                        | 404G.  | 404G.  | 404G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/tools/ai-benchmark`                                                                                                  | 200-.S | n/r    | 200-.S  | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`                                                        | 404RQ  | 404RQ  | 404RQ   | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/courses/version-control-and-git?path=skills/e2e-fixture-alpha`                                                 | 404RQ  | 404RQ  | 404RQ   | n/r    | n/r     | n/r    | n/r     |
| `/id/learn/courses/just-enough-bash`                                                                                      | 404G.  | 404G.  | 404G.   | n/r    | n/r     | n/r    | n/r     |
| `/en/learn/legacy/software-engineering/automation-testing/tools/vitest/by-example/beginner?path=bogus`                    | n/r    | n/r    | n/r     | 200GQ  | 200GQ   | 200GQ  | 200G.   |

### Matrix 2: Mermaid, page x state x viewport x engine

Diagram counts come from the served HTML and were re-counted in the browser. "Walk" = a real keyboard Tab walk from the top of
the page, counting stops on a diagram source. "Swap" = focus the first source while pending, release the held chunks,
trace `document.activeElement`, scroll position and box.

| Page (diagrams)                                                              | Rendered (no interference)                                                                                                                                                         | Pending (chunks held)                                                                                                                                                         | Failed (chunks aborted)                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `.../concurrency-and-parallelism/learning/beginner` (9; 2 fail on their own) | Ch 375/768/1280: 7 SVG, 7 sources `tabindex=-1` + hidden, 2 failing sources `tabindex=0` visible, 2 walk stops; Fx 1280: same (walk 2); WK 1280: same after a long render (walk 2) | Ch 375/768/1280: 9 of 9 sources `tabindex=0`, walk 9 stops (each between a heading link and a code block); swap Ch 375/768/1280; Fx 1280 walk 9 + swap; WK 1280 walk 9 + swap | Ch 375/768/1280: 9 stops, 0 SVG, page errors; Fx 1280: 9 stops; WK 1280: 9 stops |
| `.../learning/intermediate` (9; 1 fails on its own)                          | Ch 375/768/1280: 8 SVG, 1 failing source `tabindex=0`                                                                                                                              | Ch 375/768/1280: 9 stops, swap                                                                                                                                                | Ch 375/768/1280: 9 stops                                                         |
| `.../learning/advanced` (15)                                                 | Ch 375/768/1280: 15 SVG, all sources `-1` + hidden                                                                                                                                 | Ch 375/768/1280: 15 stops, swap                                                                                                                                               | Ch 375/768/1280: 15 stops                                                        |
| `.../learning/capstone/overview` (1)                                         | Ch 375/768/1280: 1 SVG                                                                                                                                                             | Ch 375/768/1280: 1 stop, swap                                                                                                                                                 | Ch 375/768/1280: 1 stop                                                          |
| `/en/learn/legacy/.../vitest/by-example/beginner` (8)                        | Ch 375/768/1280: 8 SVG                                                                                                                                                             | Ch 375 and 1280: 8 stops (no swap run; tablet not run)                                                                                                                        | Ch 375/768/1280: 8 stops (walk); 8 page errors at 375 and 1280                   |
| `id` tree                                                                    | 125 sitemap URLs fetched over HTTP, 0 Mermaid blocks in any of them; source tree has 0 `mermaid` fences                                                                            | n/a                                                                                                                                                                           | n/a                                                                              |

Further checks on the diagram pages: every rendered SVG sits inside its source box (all 5 pages x 3 viewports); no horizontal
document scroll at 375 or 768 in any state (`scrollWidth` equals `innerWidth`); every source overflows horizontally in the
pending and failed states (`scrollWidth` 1,401 to 5,157 px against a 766 px box) and has computed `overflow-x: auto`, so the
keyboard focus is useful; with the source focused, `ArrowRight` scrolls it 40 px per press (8 presses reached 320 px) and
`ArrowLeft` goes back, with no document scroll, in Chromium at 1280; client-side navigation from `beginner` to `intermediate`
and back and forward (Chromium, Firefox, WebKit) re-renders each page correctly: for every rendered SVG its `<title>`
equals the chart's `accTitle` (0 mismatches), state is consistent (rendered means `tabindex=-1` and hidden), and Back
restores the exact scroll offset (72,877 px in Chromium, 73,118 in Firefox, 72,885 in WebKit); a hash link to a heading above
failing diagrams lands with the heading 80 px from the top.

### Matrix 3: navigation, state, locale and drawer flows

| Flow                                                                                                                                                              | Engines / viewports             | Result                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course to catalog (non-course) by sidebar link, then Back, Forward (same build id)                                                                                | Ch, Fx, WK at 1280              | URL, active item and title correct each step; sidebar `<nav>` replaced, open sections and scroll reset (EWT-002); no request, no console error                                                              |
| Catalog to `/en/browse` and back (non-course to non-course)                                                                                                       | Ch, Fx, WK at 1280              | `<nav>` and open sections kept                                                                                                                                                                              |
| Course to another course by sidebar link                                                                                                                          | Ch, Fx, WK at 1280              | `<nav>` and open sections kept                                                                                                                                                                              |
| Legacy by-example page to catalog                                                                                                                                 | Ch, Fx, WK at 1280              | `<nav>` and open sections kept                                                                                                                                                                              |
| Path landing to a course with `?path=` (and Back, Forward)                                                                                                        | Ch at 1280                      | cross-build navigation reloads the document (TC-001); not judged. Direct loads of the same URLs are judged in Matrix 1                                                                                      |
| Resize handle: 6 x `ArrowRight` (250 to 310 px), soft navigation, reload, path-rail route                                                                         | Ch, Fx, WK at 1280              | width 310 kept in all three; `role=separator`, `aria-valuenow` 250 at start, min 192, max 448 (Ch, Fx, WK); Indonesian label "Ubah ukuran panel"                                                            |
| Language switch, 6 flows (course `?path`, `/en/learn?path`, `/en/learn/paths?path`, `/id/learn/paths?path`, legacy `?path=bogus`, `/id/belajar`), query preserved | Ch at 375 and 1280              | locale prefix swapped and query kept; 404 where no counterpart (EWT-007); `<html lang>` and switcher label follow the locale                                                                                |
| Mobile drawer: non-course with `?path`; course with valid `?path`; course without; non-course then follow "Courses"; `id` with `?path`                            | Ch at 375                       | opens at 280 px; title "AyoKoding" on non-course pages, the path title on a course with a valid path (rail inside the drawer); active item shown; following a drawer link navigates; request log in EWT-001 |
| Courses sidebar groups (Matrix 4, scenarios 1 to 5)                                                                                                               | Ch, Fx, WK at 1280/768/375      | all pass                                                                                                                                                                                                    |
| Course with `?path=` swap timeline: normal, request delayed 3 s, request refused, scripting off                                                                   | Ch 375 and 1280; Fx, WK at 1280 | see OQ-004; same box, CLS about 0.0008 at 1280; at 375 CLS 0.056 from the article header block that appears with path data, not from the sidebar                                                            |
| Unsupported locale and 404 pages                                                                                                                                  | Ch at 1280                      | EWT-008; 404 pages keep the generic sidebar and answer 404 (Matrix 1)                                                                                                                                       |

### Matrix 4: scenario conformance (each scenario run or marked not run)

| Scenario (file)                                                                                                             | Verdict                                                                           | How observed                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mermaid diagram renders as an SVG (`content-rendering.feature`)                                                             | PASS, except 3 diagrams that fail on their own (EWT-004)                          | SVG present, source hidden (visibility), screenshot, Ch/Fx/WK                                                                                                                                                                                                                    |
| Mermaid source stays keyboard reachable while pending                                                                       | PASS                                                                              | chunks held; real Tab walk; Ch 12 runs, Fx, WK; the stops sit between the control before and the code block after                                                                                                                                                                |
| Mermaid source stays keyboard reachable when rendering fails                                                                | PASS                                                                              | chunks aborted (Ch 15 runs, Fx, WK) and 3 naturally failing diagrams (Ch, Fx, WK)                                                                                                                                                                                                |
| The Mermaid source leaves keyboard focus order once the diagram renders                                                     | PASS                                                                              | rendered pages: sources `tabindex=-1` and hidden; Tab walk stops only on the failed ones                                                                                                                                                                                         |
| A course deep-linked without path context renders the canonical view (`canonical-fallback.feature`)                         | PARTIAL                                                                           | sidebar generic, no rail, "part of" path affordance present in the HTML (2 paths on `just-enough-bash`, 1 on `version-control-and-git`, none on `concurrency-and-parallelism`); breadcrumb and prerequisite list not inspected                                                   |
| A course opened without path context renders the generic sidebar unchanged                                                  | PASS                                                                              | Matrix 1, 3 engines                                                                                                                                                                                                                                                              |
| A page that is not a course keeps the generic sidebar when a path query is present (Outline)                                | PARTIAL: the first half passes, the second half fails at page level               | generic sidebar on all four example pages (the `courses-extra` and `id` examples are 404 pages and keep the generic sidebar); "the path context query is not read" is not true at the page level (EWT-001); a course in the path on a missing `id` page shows the rail (EWT-010) |
| An invalid path context falls back to the canonical view (`invalid-path-fallback.feature`)                                  | PASS                                                                              | `?path=bogus`, empty, valid-but-not-containing-course (beta), duplicate `path`: generic sidebar, no error; with `path=alpha&path=bogus` the first value wins and the rail shows                                                                                                  |
| Sidebar Courses section lists category groups; every group starts closed (`sidebar-course-categories.feature`)              | PASS                                                                              | 14 groups, all `aria-expanded=false`, counts sum 182 = number of course links, Ch, Fx, WK                                                                                                                                                                                        |
| The current course's group starts open                                                                                      | PASS                                                                              | `sql-essentials`: only "Data and databases" open, "SQL Essentials" current                                                                                                                                                                                                       |
| A group opens and closes from the keyboard                                                                                  | PASS                                                                              | focus a closed group, Enter then Space; `aria-expanded` true then false, focus stays; Ch, Fx, WK                                                                                                                                                                                 |
| The mobile drawer shows the same groups                                                                                     | PASS                                                                              | 375, `sql-essentials`: 14 groups, "Data and databases" open                                                                                                                                                                                                                      |
| An open group stays open when path context loads on the courses page                                                        | PASS                                                                              | opened "Tools and practices" before the data request completed, still open afterwards at 1280 and 768, one sidebar region, no rail, Space closes it (Ch, Fx, WK); the page still made the request (EWT-001)                                                                      |
| Sidebar shows section tree with collapsible nodes; active page highlighted (`navigation.feature`)                           | PASS                                                                              | every route in Matrix 1 has exactly one highlighted item; chevrons expand and collapse                                                                                                                                                                                           |
| The Learn sidebar lists Paths, Courses, Legacy in that order                                                                | PASS                                                                              | DOM order Learn, Paths, Courses, Legacy                                                                                                                                                                                                                                          |
| Persist the chosen width across a reload (`resizable-sidebar.feature`)                                                      | PASS                                                                              | 310 px kept across reload (Ch, Fx, WK)                                                                                                                                                                                                                                           |
| Hide the resizable rail below md; navigation by drawer                                                                      | PASS                                                                              | at 375 the `aside` is `display: none` and the drawer opens                                                                                                                                                                                                                       |
| Resize handle label localized                                                                                               | PASS                                                                              | `id`: "Ubah ukuran panel" (Ch, Fx, WK)                                                                                                                                                                                                                                           |
| Horizontal scroll with narrowed label; overflow cue; vertical scroll; drawer preset width; corrupted preset; drawer caption | NOT RUN (vertical scroll partly: setting the rail scroll position to 150 px held) | outside the two changes                                                                                                                                                                                                                                                          |
| Desktop, mobile hamburger and drawer (`responsive.feature`)                                                                 | PASS (desktop, mobile, drawer); laptop 1024x768 NOT RUN                           | `aside` 250 px and table-of-contents `aside` 200 px at 1280; hamburger and sidebar hidden at 375; drawer opens with links                                                                                                                                                        |
| Switching language redirects to the locale-specific URL (`i18n.feature`)                                                    | PASS for mechanics; dead end when no counterpart (EWT-007)                        | Matrix 3                                                                                                                                                                                                                                                                         |
| Root and uppercase URLs redirect (`locale-redirects.feature`)                                                               | PASS (4 probes)                                                                   | `/EN`, `/ID`, `/EN/learn/courses` 308 to lowercase; `/en/` 308 to `/en`                                                                                                                                                                                                          |
| Keyboard navigation moves through all interactive elements (`accessibility.feature`)                                        | PARTIAL                                                                           | Tab walks of 51 to 403 stops end at the page end in Chromium and WebKit with no trap; Firefox walk hit the 1,400 press cap without returning to `<body>`; logical order not judged beyond the Mermaid stops                                                                      |

### Recurrence re-check (Phase 0 list)

- `plans/**` contains no findings-only plan for `ayokoding-www` UX; searched slugs with `ayokoding`, `ux`, `test-fixing`, and
  grepped `EWT-`/`UWT-`/`DWT-`. Prior findings exist only as in-flight retest ledgers inside delivered plans
  (`plans/done/2026-07-25__ayokoding-learning-path-03-navigation-ui`: EWT-001 card name vs visible text, EWT-002 prerequisite
  links carrying `?path=`, UWT-002 rail label truncation, UWT-004 mobile banner position, UWT-005 mobile drawer width
  control; `plans/done/2026-10-18__ayokoding-learn-revamp-04-learning-experience`: serve setup, UWT copy items).
- Classes re-checked here: path query carried where it should not be (course page without path: no prerequisite or other
  link carries `?path=`; the only `?path=` links are the "part of" path landings, as designed); truncated labels (generic
  sidebar links carry `title`; the path rail links were not inspected); mobile banner position (CLS 0.056 at 375 from the
  article header block, below 0.1); mobile drawer width control (default 280 px seen; caption not inspected, NOT RUN).
  No recurrence of the listed classes was found; the two unchecked ones are in the completeness gaps below.

## What passed, and how it was observed

- Sidebar on routes with no course path renders directly and never shows the path rail, including non-course routes that
  carry `?path=`: 205 direct loads (Matrix 1), HTML check: course routes carry a client-render Suspense marker at the
  sidebar position, non-course routes do not.
- Hydration shows no console error and no mismatch on any of those loads (0 page errors in 205 loads).
- The sidebar swap on course routes with a valid `?path=` changes no layout (same 250x736 box), degrades to the generic tree
  when the request is slow or refused, and serves the generic tree without scripting (Chromium, Firefox, WebKit).
- Course-path fallbacks (invalid, empty, other path, repeated key) show the canonical sidebar without error.
- Course category groups, keyboard operation, drawer groups, courses-page group persistence (Matrix 4).
- Resizable width persists across soft navigation, reload and the rail route; the handle is a keyboard-operable
  `separator` with a localized label.
- Mermaid pending, failed, rendered and swap states in three engines; diagrams keep their box; no layout shift from the
  swap; no horizontal page scroll at 375; SVGs carry `role=graphics-document`, an `aria-roledescription`, and a `<title>`
  equal to the chart's `accTitle` line (checked on every rendered diagram) and a `<desc>` element; the hidden source leaves the accessibility tree and the tab order.
- One reflective probe: `?path="><img src=x onerror=1>` is not reflected in the HTML (200, no echo). Response headers on
  `/en/learn` carry `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a CSP.

## Completeness check

Categories of the exploratory sweep (functional, behavioural consistency, edge and boundary, UI/UX, responsive,
accessibility, URL and IA, passive security) and the sweeps the workflow requires (shared controls, state round-trips,
declared invariants):

| Category or sweep                                                                                                                                                                 | Enumerated                                                                            | Gap recorded                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Shared controls: sidebar tree, group buttons, resize handle, language switcher, hamburger and drawer, chevrons                                                                    | yes, each exercised in Chromium; group buttons and handle also in Firefox and WebKit  | drawer preset width, caption, corrupted preset (NOT RUN)                                                                    |
| State round-trips: sidebar open sections, width, scroll, `?path=` query through locale switch, back/forward, reload                                                               | yes                                                                                   | the drawer's open state across navigation not run                                                                           |
| Declared invariants: Cycle 2.10 "generic sidebar unchanged when no path context"; hydration never resizes the Mermaid block; Mermaid source removed from focus order after render | yes                                                                                   | none                                                                                                                        |
| Routes x locales x viewports                                                                                                                                                      | 53 routes, `en` and `id`, 375/768/1280 in Chromium; Firefox and WebKit at 375/1280    | tablet in Firefox and WebKit; laptop 1024; no `id` pages beyond `/id`, `/id/belajar`, `/id/browse`, `/id/learn/paths`, 404s |
| Themes                                                                                                                                                                            | not enumerated (light only); dark theme, focus-ring contrast on the source not judged | open gap for the DWT pass                                                                                                   |
| Mermaid pages                                                                                                                                                                     | 5 pages, 33 diagrams, 3 states                                                        | the other 785 English Mermaid pages (EWT-004 may recur); vitest page swap and tablet hold not run                           |
| Passive security                                                                                                                                                                  | one reflective probe, headers                                                         | no cookie or CSP review beyond headers                                                                                      |
| Performance                                                                                                                                                                       | CLS and request logs only                                                             | no throttled-network run; WebKit numbers unreliable (TC-002)                                                                |
| Spec-aware vs spec-blind                                                                                                                                                          | this pass is spec-aware; usability lens belongs to the next pass                      | n/a                                                                                                                         |

## Totals

- Findings: 10 (CRITICAL 0, HIGH 0, MEDIUM 7: EWT-001, 004, 006, 007, 008, 009, 010; LOW 3: EWT-002, 003, 005).
- By scope: IN-A 1 (EWT-003); IN-B 2 (EWT-002 a regression; EWT-010 same behaviour before the diff); NEIGHBOUR 1 (EWT-001,
  the goal of change (b) is not met because another consumer remains); PRE 6 (EWT-004, 005, 006, 007, 008, 009; 009 is
  outside the charter).
- Spec-gap proposals: 7 (SG-001 to SG-007). Open questions: 4 (OQ-001 to OQ-004). Tooling causes: 2 (TC-001 mixed build ids,
  TC-002 host load).
- Not run (recorded above): laptop 1024 viewport, Firefox/WebKit tablet, dark theme, drawer preset/caption/corrupted-value
  scenarios, rail overflow-cue scenarios, vitest page focus swap, the unchecked 785 Mermaid pages.
- Re-run advice: after the server is restarted on a single build id, re-run EWT-002 (client navigation between the course
  and non-course pages, including path landing to course) without the cross-build reload, and confirm EWT-001 again.

Status: COMPLETE (all enumerations in scope have run; gaps listed above).
