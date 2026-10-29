# DWT: design-fidelity web pass, ayokoding-www (Mermaid fallback source and sidebar boundary)

Status: CLOSED (every route, viewport class, locale, theme and state in scope has run or is listed as a gap; totals at the end).

- Charter: `design`, third and last pass of the EWT -> UWT -> DWT triad of
  `repo-governance/workflows/quality/ux-review-fix-planning.md`, in its in-flight variant. Findings are evidence only: no plan
  folder, no fixes, no staging, no server, build or podman action. Judge: `swe-web-tester`.
- Subject: production build of `apps/ayokoding-www` served at `http://127.0.0.1:3101` (fixture manifests, drafts shown),
  branch `docker-to-podman`. Passive only: navigate, click, hover, focus, resize, intercept requests inside the test browser,
  read computed styles, sample screenshot pixels. Only the browser's own `localStorage` (theme) changed.
- Judged changes (read for targeting only, from `git diff main...HEAD`): (a) `mermaid.tsx`, the fallback `<pre>` gains
  `tabIndex={svg === "" ? 0 : -1}`; (b) `sidebar-host.tsx` and `(content)/layout.tsx`, the sidebar host returns its children
  directly off course routes and wraps the course variant in `<Suspense fallback={children}>`.

## Tooling and versions

| Item                          | Value                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver                        | Playwright library 1.61.0 (repo `node_modules`), Node 24.16.0, throwaway scripts kept outside the repository                                                                                                                                                                                                                                                                  |
| Chromium (primary)            | 149.0.7827.55, headless                                                                                                                                                                                                                                                                                                                                                       |
| Firefox / WebKit              | 151.0 / 26.5 (Playwright WebKit build, not Safari); used for the fallback focus ring and Tab reach only                                                                                                                                                                                                                                                                       |
| Playwright MCP / DevTools MCP | not used; the repo Playwright library was healthy in all three engines (browser-driving integration confirmed)                                                                                                                                                                                                                                                                |
| Pixel analysis                | screenshots decoded with the repo's `sharp`; contrast computed with the WCAG 2 relative-luminance formula                                                                                                                                                                                                                                                                     |
| Compute                       | `rtk ./hippo run --class ephemeral --resource-tier standard`, one run at a time, no exit-124 retries needed                                                                                                                                                                                                                                                                   |
| Origin                        | `http://127.0.0.1:3101`, HTTP 200 on `/en` before the pass                                                                                                                                                                                                                                                                                                                    |
| Viewports                     | 375x667, 768x1024, 1280x800                                                                                                                                                                                                                                                                                                                                                   |
| Locales                       | `en`, `id`; `id` has no course or Mermaid pages (the `/id` equivalents of both Mermaid pages and of every course are 404), so Mermaid is `en` only                                                                                                                                                                                                                            |
| Themes                        | Light and Dark. The header "Toggle theme" menu offers Light, Dark, System and writes `localStorage.theme`; the root element then carries class `dark`. Default is Light, and colour-scheme emulation alone does not switch the theme. Runs set `localStorage.theme="dark"` through an init script; the menu path was confirmed once by clicking it and reloading (stays dark) |
| State changes authorised      | none beyond the browser's own storage                                                                                                                                                                                                                                                                                                                                         |
| Video / traces                | not recorded (disk nearly full); 29 small JPEG captures under `captures/dwt-*`                                                                                                                                                                                                                                                                                                |
| Design-practice research      | no `web-researcher` delegation and no web fetch was made; principles cited are the standard WCAG 2.2 success criteria and Nielsen heuristics, named but not re-fetched                                                                                                                                                                                                        |

## Design sources of truth (found first)

| #   | Source                                                                                                                                                                                                                                                                                                                                                                                                                                      | Used for                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Approved mockup, sidebar category groups: `plans/done/2026-10-13__ayokoding-learn-revamp-03-catalog-and-metadata/assets/sidebar-option-a-collapsed-category-groups.png` (prd Screen S3, "Selected: Option A")                                                                                                                                                                                                                               | generic sidebar group rows, counts, active pill, drawer |
| 2   | Approved mockup, path rail: `plans/done/2026-10-12__ayokoding-learn-revamp-01-navigation-and-display/assets/course-in-path-option-a-numbered-rail-autoscroll.excalidraw.png` ("Selected"); earlier `plans/done/2026-07-25__ayokoding-learning-path-03-navigation-ui/assets/course-path-option-b-desktop.png` (Screen 3, rail chosen, DL-17)                                                                                                 | path rail, active row, footer links                     |
| 3   | Runtime tokens: `libs/web-ui-token/src/tokens.css`, `libs/web-ui-token/src/ayokoding.css`, `apps/ayokoding-www/src/app/globals.css`                                                                                                                                                                                                                                                                                                         | colours, radii, dark palette                            |
| 4   | Primitives: `libs/web-ui/src/primitives/button`, `code-block`, `resizable-panel`, `sheet`                                                                                                                                                                                                                                                                                                                                                   | focus ring, code surface, sidebar shell                 |
| 5   | Conventions: `repo-governance/development/frontend/accessibility/contrast-and-focus.md` (3:1 for focus rings and graphical objects, 4.5:1 text, `focus-visible` pattern), `.../styling/responsive-design-and-touch-targets.md` and `.../accessibility/form-inputs-and-hit-targets.md` (44x44 px on viewports up to 768 px), `repo-governance/development/frontend/design-tokens.md` (every token has a dark counterpart that meets WCAG AA) | contrast, target size, token fidelity                   |
| 6   | External design source                                                                                                                                                                                                                                                                                                                                                                                                                      | none passed; its absence is not a finding               |
| -   | **No approved design asset exists for the Mermaid fallback source or for the rendered diagram's colours** (the revamp-04 assets cover header, learn home, lesson page and roadmap). Those surfaces are judged against runtime tokens, the app's other code blocks (consistency) and the conventions above.                                                                                                                                  |                                                         |

Scope key (as in `ewt.md`): IN-A = the Mermaid `tabIndex` change; IN-B = the sidebar boundary change; NEIGHBOUR = touches the
changed surface but the cause is outside the diff; PRE = pre-existing and independent of both changes.

## Tooling causes (not product findings)

### TC-001 (re-confirmed): two Next.js build ids on one server

Fetched at the start of the pass, the SSR payload build id was `eQkw6_Fd9Rhu7z7w30-1f` for `/en/learn` and `/id/learn/paths`
and `9JRoXny3bdQOD-PB5WNsZ` for `/en/learn/courses`, the course page, both Mermaid pages and `/id/belajar`, as `ewt.md` TC-001
recorded. Effect on this record: none seen. The client chunks are the same content-hashed set in both builds, every
measurement here is a direct page load, and no soft navigation across the two ids was made, so the reload artefact of
TC-001 did not occur. Layout and colour values come from CSS shared by both builds. The `/en/learn` and `/id/learn/paths`
numbers come from the older in-memory build; they equal the other routes' values, so no build-specific difference was seen.

## Findings

Rating: criticality from `repo-governance/development/quality/criticality-levels.md` (WCAG AA failures and convention
violations are HIGH, cosmetic and consistency issues MEDIUM or LOW; CRITICAL means broken functionality). The design skill's
Major / Minor / Trivial severities map to HIGH / MEDIUM / LOW. Confidence is HIGH unless stated.

### DWT-001 (HIGH, colour/contrast, scope: PRE, on the rendered state of the changed Mermaid surface)

In the dark theme every diagram's connectors, arrowheads and sequence-message text are near invisible (about 1.5:1).

- Source: `repo-governance/development/frontend/accessibility/contrast-and-focus.md` (graphical objects that convey meaning
  3:1, text 4.5:1) and `design-tokens.md` (every visual token meets WCAG AA in both modes); WCAG 2.2 SC 1.4.11 and 1.4.3.
- Route, viewport, locale, theme, state: `/en/learn/courses/concurrency-and-parallelism/learning/beginner` and
  `/en/learn/legacy/software-engineering/automation-testing/tools/vitest/by-example/beginner`; 1280 (colours are viewport
  independent, also audited at 375 and 768 through the same runs); `en`; Dark; rendered.
- Reproduction: 1. `localStorage.theme="dark"` (or Toggle theme, Dark). 2. Load the page, wait until the SVGs appear. 3. Read the
  computed `stroke`, `fill` and `color` of `path.flowchart-link`, `marker path`, `.messageLine0/1`, `text.messageText`. 4. Compare with
  the page background `rgb(2, 8, 23)`.
- Measured, dark (concurrency beginner, 9 diagrams): flowchart edges `stroke: rgb(51, 51, 51)` 20 of them, arrowhead markers 42,
  sequence message lines 4 and lifelines, message text `fill: rgb(51, 51, 51)`; all 1.58:1 against the background. Pixel
  check of the sequence message labels ("read 5", "write 6"): darkest to lightest sample 1.53 to 1.57:1. Vitest page: 35 edges and
  56 markers at 1.58:1. Light theme for comparison: the same `#333` is 12.32:1.
- Expected: 3:1 for the connectors and 4.5:1 for message text in both themes. Actual colours are identical in the two themes
  (the SVG colours do not change with the theme; `mermaid.initialize` sets `theme: "default"` for both), so the diagram does not
  read the page tokens at all. Pale `#ECECFF` nodes and `#ffffde` clusters stay light on the dark page (17:1 to 20:1 against it,
  readable, but a bright island), while the lines that join them disappear.
- Also seen, light theme (LOW sub-note): subgraph boundary stroke `#aaaa33` is 2.41:1 against the page.
- Evidence: `captures/dwt-mermaid-rendered-sequence-1280-dark.jpg` (messages invisible, only "should be 7" note and the
  boxes show), `captures/dwt-mermaid-rendered-edgelabels-1280-dark.jpg` (arrows between nodes vanish),
  `captures/dwt-mermaid-rendered-conc-1280-dark.jpg` versus `...-light.jpg`.
- Disagrees with `uwt.md` Probe "Dark theme" ("diagrams keep pale backgrounds (still readable). Contrast was not measured"):
  nodes and labels are readable, connectors and message text are not. Kept as measured here.
- Scope evidence: the `theme: "default"` line is unchanged by the diff (`git diff` of `mermaid.tsx` shows only the `tabIndex`
  lines); the same colours render on every Mermaid page, so the defect exists independent of both changes.
- Reproducibility: Always. Suggested fix locus (hypothesis): choose the Mermaid theme from the active theme, or pin connector
  and text colours to tokens.

### DWT-002 (HIGH, token/contrast, scope: PRE, design-system token and primitive; matters to both changes)

The dark-theme focus-ring token and the Button primitive's ring are below 3:1 against the surfaces they sit on.

- Source: `contrast-and-focus.md` ("Focus rings must meet 3:1 contrast against the adjacent background"); WCAG 2.2 SC 1.4.11 and
  2.4.7; token `--color-ring` in `apps/ayokoding-www/src/app/globals.css` (`.dark`: `hsl(224.3 76.3% 48%)` = `#1d4ed8`).
- Reproduction: Dark, 1280. Tab to a path rail row link (`/en/learn/courses/just-enough-bash?path=skills%2Fe2e-fixture-alpha`, the
  `focus-visible:ring-2 focus-visible:ring-ring` pattern the convention shows) and to the `Copy` button of a code block (the
  `libs/web-ui` Button ring `ring-[3px] ring-ring/50` plus `border-ring`). Read `box-shadow` and sample pixels.
- Measured: rail row and footer link ring `rgb(29, 78, 216)` 2px against the dark page `#020817`: pixel 2.99:1 and token
  arithmetic 2.996:1 (below 3 by a hair); against `--color-muted`/`--color-accent` `#1e293b` 2.18:1; against the dark code surface
  `#24292e` 2.19:1. The Copy button's 3px halo (`ring/50`) against its adjacent code surface: 2.11:1 light, 1.56:1 dark (pixel
  sample of the outer halo; its solid `border-ring` companion is the dark 2.19:1 token). Light theme: `--color-ring` `#2563eb`
  is 5.04:1 on the page and 4.85:1 on the code surface (passes); the light halo alone is 2.08:1 but the solid border passes.
- Expected: 3:1 in both themes. Actual: the dark token is at the limit on the page and clearly under on elevated surfaces.
- Why it matters to this pass: it is the colour the design system would give the Mermaid fallback (see DWT-006), and it draws
  the focus ring of the path rail on the changed sidebar surface.
- Evidence: `captures/dwt-ref-ring-copybutton-dark.jpg`, `captures/dwt-ref-ring-copybutton-light.jpg`; computed values in this
  record. `uwt.md` "Focus visibility" saw the blue ring but did not measure it.
- Independence: `globals.css`, `button.tsx` and `path-rail.tsx` are untouched by the diff.
- Reproducibility: Always. Caveat: the exact Button halo contrast depends on the pixel sampled; the token ratios are exact.

### DWT-003 (MEDIUM, mockup fidelity/clipping, scope: PRE, neighbour of IN-B)

At the default 250 px sidebar width every category group's course count is pushed out of view and the group rows' right edge,
focus ring and the active "Courses" pill are clipped.

- Source: approved mockup `.../2026-10-13__ayokoding-learn-revamp-03-catalog-and-metadata/assets/sidebar-option-a-collapsed-category-groups.png`
  (counts right-aligned and visible at desktop 1280 and mobile 375); `contrast-and-focus.md` (focus ring not obscured).
- Route, viewport, locale, theme, state: `/en/learn/courses` (also `/en/learn/courses/just-enough-bash` and the concurrency
  lesson, which carry the same tree); 768, 1280 and the 375 drawer; `en`; Light and Dark; groups closed.
- Reproduction: 1. Open `/en/learn/courses` at 1280x800. 2. Read the sidebar scroller (`div.overflow-x-auto`). 3. Read each group
  button's count `span`. 4. Tab to a group button.
- Measured: scroller `clientWidth` 214, `scrollWidth` 313; `nCountClipped` 14 of 14 groups (count right edge 91 px beyond the
  visible edge on every keyboard stop); the longest label "ARCHITECTURE AND DISTRIBUTED SYSTEMS" is 247 px wide, which drives the
  `min-w-max` tree to 313 px and pushes every count to x = 305. Drawer at 375: 247 visible of 313, 14 of 14 clipped, also dark. The
  trailing 10 px fade cue is on, so labels such as "ARCHITECTURE AND DISTRIBU" end in a fade, but the count is never seen. Focus
  ring of a focused group button: right edge outside the scroller, so the vertical right edge of the ring is not drawn (capture).
  The active "Courses" pill on `/en/learn/courses` and the active course pill on course pages are cut at the right edge in the
  same way (`activeRightClipped: true`, `/en/learn/courses/just-enough-bash`, the concurrency lesson and the vitest page).
- Expected: counts visible as in the mockup ("TOOLS AND PRACTICES 11", "ERP SYSTEMS 30" right-aligned inside the rail).
  Real keyboard Tab did not scroll the tree sideways (scrollLeft stayed 0), so a focused group button stays half hidden.
- Evidence: `captures/dwt-sidebar-courses-1280-light.jpg`, `...-dark.jpg` (no counts, truncated labels, clipped pill),
  `captures/dwt-sidebar-group-focus-1280-light.jpg`, `...-dark.jpg` (ring cut on the right), `captures/dwt-drawer-course-generic-375-dark.jpg`.
- Independence: present on `/en/learn/courses` and the legacy by-example page, which the sidebar-host diff routes straight to
  its children; the group component is not in the diff. Not covered by `ewt.md` or `uwt.md` (UWT-023 records cut course names only).
- Reproducibility: Always. Not run: whether dragging the sidebar wider than about 345 px, or the drawer "Wide" preset, shows the counts.

### DWT-004 (MEDIUM, spacing/target size and cross-variant consistency, scope: PRE, neighbour of IN-B)

The generic sidebar and the generic drawer tree use rows and controls under 44 px on viewports up to 768 px, while the path rail
that replaces them in the same slot meets 44 px.

- Source: `repo-governance/development/frontend/styling/responsive-design-and-touch-targets.md` and
  `.../accessibility/form-inputs-and-hit-targets.md` ("Mobile viewports (<=768px): 44 x 44 px minimum"); WCAG 2.5.8 (24 px)
  is met. The class was rated LOW in `uwt.md` UWT-026 (standalone links); this instance is the primary navigation of the changed
  surface, so MEDIUM.
- Measured: 768 sidebar and 375 drawer, generic tree: link rows 32 px high (25 of 27 links under 44 in the course drawer), the
  chevron `Expand section` buttons 24x24, group buttons 28 px high, the drawer `Close` button 16x16. Path rail and its drawer
  variant: rows 44 px, footer links 44 px (`min-h-11`), nothing under 44 except `Close`.
- Expected: 44 x 44 on those viewports, and one control size across the two variants that occupy the same slot.
- Evidence: measurements for 6 pages x 2 themes; `captures/dwt-drawer-course-generic-375-dark.jpg` against
  `captures/dwt-drawer-course-with-path-375-light.jpg`.
- Independence: same values on `/en/learn`, `/id/belajar` and `/id/learn/paths` (non-course, untouched by the diff).
- Reproducibility: Always.

### DWT-005 (MEDIUM, token fidelity, scope: PRE; confidence MEDIUM because no source says which file is authoritative)

The dark theme does not use the AyoKoding warm dark palette that `ayokoding.css` declares; it renders the generic slate
palette of `globals.css`.

- Source: `libs/web-ui-token/src/ayokoding.css` (`[data-theme="dark"], .dark` redefines the warm scale `--warm-0` ... `--warm-900`
  and hue washes "darker in dark mode") against `apps/ayokoding-www/src/app/globals.css` (`.dark` sets `--color-background`,
  `--color-muted`, `--color-accent`, `--color-primary`, `--color-ring` to slate hsl values); `design-tokens.md` (per-app brand
  override through the cascade).
- Measured, `/en/learn/courses`: Light: `--color-background` = `--warm-0` `lab(98.86 0.16 2.28)` (cream), `--color-muted`
  `lab(93.09 ...)`, `--color-accent` `lab(93.86 11.77 7.84)` (terracotta wash). Dark: `--warm-0` resolves to the warm dark
  `lab(7.22 1.46 3.71)` but `--color-background` is `#020817`, `--color-muted` and `--color-accent` are `#1e293b`, muted text
  `#94a3b8`, primary `#3b82f6`. The warm dark values are defined and unused for those tokens.
- Visible effect: light is warm cream with terracotta washes, dark is cold slate; the path rail's current-row wash
  (mockup 2: pink wash with a `▸` marker) is slate `#1e293b` in dark (`captures/dwt-sidebar-pathrail-1280-dark.jpg`).
- Expected: owner decision. If the warm dark scale is the design, dark pages depart from it; if slate is intended, the
  warm dark block in `ayokoding.css` is dead. No approved dark mockup exists.
- Independence: whole app, both changes irrelevant. Reproducibility: Always.

### DWT-006 (MEDIUM, focus indicator, scope: IN-A; confidence MEDIUM for the Safari case)

The Mermaid fallback source takes its focus indicator from the browser, not from the design system's `focus-visible` ring, and
that indicator is below 3:1 in WebKit.

- Source: `contrast-and-focus.md` (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`, ring 3:1 against
  the adjacent background); `libs/web-ui/src/primitives/button/button.tsx` and `path-rail.tsx` for the app's own ring pattern.
- Route, viewport, locale, theme, state: concurrency beginner and vitest by-example beginner; 375, 768, 1280; `en`; Light and
  Dark; fallback state (Mermaid chunks aborted, so the diagram never renders), keyboard focus (`:focus-visible` true).
- Measured, Chromium 149, 12 runs: `outline: auto 1px rgb(16, 16, 16)`, `box-shadow: none`, `outline-offset: 0`; no
  `ring` classes on the element. The ring draws as a dark/white two-tone line about 2 px wide; strongest ring pixel against the
  code surface 17.87:1 light and 14.67:1 dark, against the page 18.56:1 and 20.01:1. Not clipped at any viewport (no scrolling
  or `overflow` ancestor, all four sides present at 768 and 1280; at 375 the bottom edge is below the fold in the shot only).
  Firefox 151: `auto 3px` blue `rgb(0, 96, 223)`, strongest ring pixel 5.28:1 light, 14.67:1 dark. WebKit 26.5: `auto 3px` accent
  blue `rgb(92, 155, 231)` light and `rgb(42, 107, 187)` dark, strongest ring pixel **2.70:1 light and 2.74:1 dark against
  the code surface** (3.73:1 against the dark page).
- Why IN-A: with the `tabindex` attribute removed in the test browser, Chromium and Firefox still reach all 9 Mermaid sources
  with Tab (9 of 9) and draw the same ring; the Playwright WebKit build reaches 0 of 9. So in WebKit the fallback is focus-visible
  for the first time through this change, with the browser's own ring, which fails 3:1 against the code surface.
- Expected: the app's ring (or any ring with an explicit offset and a 3:1 colour). Note the design-system ring itself is not
  ready to reuse in dark (DWT-002), so a fix needs a token that meets 3:1 on `#24292e`.
- Consistency: the real code blocks on the page (96 reached within the first 300 Tab stops; 112 `pre` elements in all) are also tab stops (`tabindex="0"` from the highlighter) with the same UA
  ring, and sidebar links, group buttons and chevrons use it too, so the fallback is consistent with its neighbours; only the
  Button, path rail and mobile-nav links use the token ring (coverage matrix below).
- Evidence: `captures/dwt-mermaid-fallback-focus-conc-1280-light.jpg`, `...-1280-dark.jpg`, `...-375-light.jpg`,
  `captures/dwt-mermaid-fallback-focus-conc-1280-light-webkit.jpg`, `captures/dwt-ref-ring-codepre-light.jpg`.
- Reproducibility: Always. Limitation: the Playwright WebKit build is not Safari; the real Safari ring colour follows the system
  accent and was not measured.
- Status after cycle 2 (clean rebuild): REPAIRED AND RE-CHECKED. The fallback `<pre>` now draws `outline: solid 2px`, offset
  2px, colour `foreground`, in Chromium 149, Firefox 151 and WebKit 26.5, light and dark, at 1280. Outline colour against the
  code surface is 17.73:1 light and 14.02:1 dark (3:1 required), the same in all three engines, so the WebKit 2.70:1 and
  2.74:1 values are gone. See "Cycle 2 re-check (clean rebuild)" in `ui-web-quality-gate.md`. Not re-measured: 375 and 768
  widths, real Safari.

### DWT-007 (LOW, overflow affordance, scope: IN-A for the cue, scrolling itself PRE)

The fallback source scrolls horizontally with no visible cue that it does, although the app already has a cue pattern for the
same situation.

- Source: Nielsen heuristic 1 (visibility of system status) for scroll affordance; the app's own pattern in
  `sidebar-tree.tsx` (a trailing fade mask while content overflows).
- Measured: fallback `<pre>` `overflow-x: auto`, `scrollWidth` 1401 against `clientWidth` 327 (375), 470 (768), 766 (1280); vitest 3485. The first lines are cut at the box edge with no fade or shadow ("...Nodes: A0, B0, A1, B1, Process A:" ends at the border,
  capture). Classic scrollbars measure 15 px when headless scrollbar hiding is turned off, so desktop users with persistent
  scrollbars have the platform cue; overlay-scrollbar and touch users have none. The real code blocks behave the same.
- Evidence: `captures/dwt-mermaid-fallback-focus-conc-1280-light.jpg`. Reproducibility: Always.

### DWT-008 (LOW, loading transition, scope: IN-B surface; behaviour identical before the diff)

On a course page opened with `?path=`, the generic catalogue tree is shown first and is then replaced by the two-row path rail.

- Source: Nielsen heuristic 1 and the visual-stability practice of not painting content that is about to be replaced; mockups 1
  and 2 show only the final states; `ewt.md` OQ-004 asked this pass to judge it.
- Reproduction: 1280, Light, `/en/learn/courses/just-enough-bash?path=skills%2Fe2e-fixture-alpha`; observe the sidebar `<nav>`
  `aria-label` over time (MutationObserver), once as served and once with the `coursePaths.getRouteData` request delayed 1.5 s.
- Measured: generic `Sidebar navigation` painted at 41 to 52 ms; path rail `E2E Fixture Alpha Skills Path course list`
  at 474 ms (local, no delay) and 1889 ms (1.5 s delay). The swap happens in the same 250x736 box (layout shift in the sidebar
  0), but changes row height 32 to 44 px, the active treatment (blue 5% tint to terracotta wash with `▸`), and the content (23 rows
  to 2). Without `?path=`, on course routes the Suspense fallback and the final tree are identical: SSR rows and hydrated rows
  compare equal at 768 and 1280 (same left, top, width, height of the first 12 links) and the sidebar `<nav>` element is replaced
  at about 290 ms with no visible change. On non-course routes the `<nav>` element is never replaced.
- Expected: fallback identical to final where possible. The diff keeps `fallback={props.children}`, so the generic fallback on
  `?path=` is the intended design that the static page cannot know the manifests; the cost is a visible content swap that
  lasts as long as the request.
- Evidence: `captures/dwt-sidebar-flash-generic-before-rail-1280-light.jpg`, `captures/dwt-sidebar-flash-rail-after-1280-light.jpg`.
- Reproducibility: Always. Not exercised: slow real networks beyond the 1.5 s delay; mobile drawer (it opens straight on the rail).

### DWT-009 (LOW, state semantics, scope: PRE)

One colour token means "hover" in the generic sidebar and "you are here" in the path rail.

- Source: Nielsen heuristic 4 (consistency and standards); mockup 2 (rail current row = pink wash), mockup 1 (generic active =
  blue tint).
- Measured: generic tree link and group button hover background `lab(93.8639 11.7722 7.83559)` (light) / `rgb(30, 41, 59)` (dark);
  path rail current row background `lab(93.8639 11.7722 7.83559)` / `rgb(30, 41, 59)`: the same `--color-accent`. The generic active
  item is blue text on a 5% blue tint (4.70:1 light, 5.23:1 dark, passes), so within one tree the hovered row is pink and the
  current row blue, and across the two variants pink flips from hover to current.
- Evidence: values above; `captures/dwt-sidebar-group-open-1280-light.jpg` (pink hovered group header beside the blue active
  "Courses"). Reproducibility: Always.

### DWT-010 (LOW, alignment/polish, scope: PRE)

The chevron button in the generic tree is opaque (`bg-background`) and punches a page-coloured square into a highlighted row.

- Measured: active "Courses" row link background `oklab(0.546 -0.027 -0.214 / 0.05)`; its chevron button (24x24)
  background `lab(98.86 0.16 2.28)` (page colour), dark `rgb(2, 8, 23)`. The square is visible inside the pill and inside the
  hover wash.
- Evidence: `captures/dwt-sidebar-courses-1280-light.jpg` (white square at the right end of the "Courses" pill).
- Reproducibility: Always.

## Spec-gap proposals (design behaviours worth protecting; not written into any spec)

Numbered `DSG-` so they do not collide with `ewt.md` SG-001 to SG-007.

### DSG-001: diagram connectors stay legible in the dark theme (from DWT-001)

```gherkin
Scenario Outline: A rendered diagram's connectors and text meet contrast in both themes
  Given the "<theme>" theme is active
  And a page with a rendered Mermaid diagram is open
  Then every connector and arrowhead has at least 3:1 contrast against the page background
  And every message label has at least 4.5:1 contrast against its background
  Examples:
    | theme |
    | light |
    | dark  |
```

### DSG-002: sidebar group counts remain visible at the default width (from DWT-003)

```gherkin
Scenario: Every category group shows its course count without horizontal scrolling
  Given the sidebar is at its default width
  When the Courses section lists its category groups
  Then each group's course count is fully inside the visible sidebar
  And the focus ring of a focused group button is not cut by the sidebar edge
```

### DSG-003: the Mermaid source focus indicator meets contrast in every theme (from DWT-006, DWT-002)

```gherkin
Scenario Outline: The focused Mermaid source has a visible indicator
  Given the "<theme>" theme is active
  And a Mermaid source is shown while its diagram is pending
  When the source receives keyboard focus
  Then its focus indicator has at least 3:1 contrast against the code surface
  Examples:
    | theme |
    | light |
    | dark  |
```

### DSG-004: touch targets in the sidebar and drawer (from DWT-004)

```gherkin
Scenario: Sidebar and drawer controls are at least 44 px on small viewports
  Given the viewport is 768 px wide or narrower
  When the sidebar or the navigation drawer is shown
  Then every link, disclosure button and close button is at least 44 by 44 px
```

## What passed and how it was observed

- **No layout shift on the pending, failed and rendered transitions of the Mermaid block.** Chromium, hold-then-release of
  the four Mermaid chunk files. All 9 blocks of the concurrency beginner page at 1280 Light: top delta 0 and height delta 0 for each
  (block heights 285 to 523 px); first block at 375, 768 and 1280, Light and Dark, and the
  vitest page's first block at the same six combinations: box and `<pre>` rectangles identical before and after, SVG box inset 16 px
  inside the reserved box (`inset-4`), no `layout-shift` entry for the on-screen block. The two diagrams that fail to parse keep the
  fallback (`tabindex="0"` at positions 7 and 9 after the others render) in the same box. The page's total height grows by 159 to 218 px
  outside the article after the release (article height unchanged, 74,275 px); not traced further.
- **Fallback source surface is consistent with the app's other code blocks.** Computed tuple of the fallback and a real code block
  at 375 and 1280, Light and Dark: background `rgb(246, 248, 250)` / `rgb(36, 41, 46)`, padding 16 px, radius 8 px, 14 px mono, line
  height 23.8 px, same left edge and width; only the text colour (highlighter) and top margin (figure margin) differ. The classes the
  component names (`bg-muted`, `rounded`, `p-4`, `text-sm`, `my-4`) are overridden by the app's `.prose pre` rules, so the rendered
  background is the code-surface constant, not `--color-muted`; this matches the documented decision in `globals.css` and is not
  raised as a finding.
- **No flash of the wrong theme.** Dark with stored theme: the root class is `dark` and the body is `rgb(2, 8, 23)` at
  `readystatechange`, first paint and first contentful paint on the sidebar, course and Mermaid pages.
- **Sidebar hydration.** Non-course routes (`/en/learn`, `/en/learn?path=...`, `/en/learn/courses`, `/en/learn/courses?path=...`):
  one `<nav>` element, no replacement, no layout shift in the sidebar (aside shift 0, page CLS 0.0007 to 0.0125 at most), SSR row
  rectangles equal hydrated ones. Course route without `?path=`: fallback equals final, no visible change.
- **Path rail against mockup 2 (Light, Dark, 768, 1280, drawer 375).** "COURSE 1 OF 2" readout, "PHASE 1 · FIXTURE CORE", numbered rows,
  current row with `▸` marker and wash, footer links with underline, rows 44 px, aside 250 px at 768 and 1280, drawer 280 px.
- **Generic tree against mockup 1** (apart from DWT-003): uppercase 12 px semibold tracked group labels with chevron, 14 px rows,
  nested indent 21 px with a 1 px border, active blue pill 4.70:1 light and 5.23:1 dark, muted labels 7.8:1 dark, chevron rotates
  (`transform` transition 0.15 s) and `aria-expanded` flips on open, group panel items 32 px.
- **Locale `id`.** `/id/belajar` (with and without `?path=`) and `/id/learn/paths` render the generic sidebar with the same
  metrics (250 px, rows 32 px, no groups); drawer on `/id/belajar` same. No `id` course or Mermaid page exists.
- **Focus rings not clipped** on the Mermaid fallback (DWT-006) and on the rail rows and footer links (ring present on all four
  sides, 2 px); they are clipped on sidebar group buttons and tree links (DWT-003).

## Mandatory systematic checks

**A. Raw / unstyled native-element audit (enumerated, not sampled).** Every interactive native element on the two changed
surfaces: 300 consecutive Tab stops on the concurrency page (links, header buttons, sidebar links and chevrons and group
buttons, 96 code-block `pre` stops, 96 Copy buttons, 8 Mermaid sources (the ninth lies beyond stop 300), the resize handle), plus the drawer's buttons and links
on six pages x two themes. None renders with bare UA chrome (all carry token classes). The only elements with no authored focus
style are the ones in the matrix below.

**B. Styling-consistency matrix: focus indicator by control kind** (computed `outline` and `box-shadow` on keyboard focus,
Chromium, Light unless noted):

| Control kind (surface)                     | Focus treatment                                         | Ring contrast vs adjacent surface |
| ------------------------------------------ | ------------------------------------------------------- | --------------------------------- |
| Mermaid fallback source (changed surface)  | UA `auto 1px`, dual tone                                | 17.9 light, 14.7 dark             |
| Code-block `pre` (96 on the page)          | UA `auto 1px`                                           | same                              |
| Sidebar tree link, chevron, group button   | UA `auto 1px`, clipped at the scroller edge             | 17.3 to 20.0 (visible sides)      |
| Header text links ("Learn", "Tools", logo) | UA `auto 1px`                                           | same                              |
| Skip link                                  | `solid 2px` black outline                               | high                              |
| Button primitive, Copy button              | `ring-[3px] ring-ring/50` + `border-ring`, outline none | 2.11 light, 1.56 dark (halo)      |
| Path rail rows and footer links            | `ring-2 ring-ring`, outline none                        | 5.04 light, 2.99 dark             |
| Mobile-nav primary links                   | `ring-2 ring-ring` (source class list; not re-measured) | not measured                      |

Result: three focus styles coexist; the token ring is the weakest in dark (DWT-002), the UA ring is engine dependent (DWT-006).

## Coverage matrix (R = run and judged, P = partial, N = not run, n/a = not applicable)

| Surface and state                                             | 375                                            | 768               | 1280 | Light              | Dark             | `en` | `id`                                             |
| ------------------------------------------------------------- | ---------------------------------------------- | ----------------- | ---- | ------------------ | ---------------- | ---- | ------------------------------------------------ |
| Mermaid fallback, pending/failed (chunks aborted), 2 pages    | R                                              | R                 | R    | R                  | R                | R    | n/a (no page)                                    |
| Mermaid fallback focus ring (Chromium)                        | R                                              | R                 | R    | R                  | R                | R    | n/a                                              |
| Mermaid fallback focus ring (Firefox, WebKit)                 | N                                              | N                 | R    | R                  | R                | R    | n/a                                              |
| Pending to rendered transition (hold/release), 2 pages        | R                                              | R                 | R    | R                  | R                | R    | n/a                                              |
| Rendered colour audit (concurrency 9 diagrams; vitest 8)      | P (audited in the same runs, analysed at 1280) | P                 | R    | R                  | R                | R    | n/a                                              |
| Rendered diagram pixel check of text and edge labels          | N                                              | N                 | R    | R (script limited) | R                | R    | n/a                                              |
| Generic sidebar, non-course routes, with and without `?path=` | R (drawer)                                     | R                 | R    | R                  | R                | R    | R                                                |
| Generic sidebar, course route without `?path=`                | R (drawer)                                     | R                 | R    | R                  | R                | R    | n/a (404)                                        |
| Path rail, course route with `?path=`                         | R (drawer)                                     | R                 | R    | R                  | R                | R    | N (only a 404 page reaches it, `ewt.md` EWT-010) |
| Group open and closed state                                   | N                                              | N                 | R    | R                  | R                | R    | n/a (no groups)                                  |
| Active item, hover, chevron state                             | P (drawer metrics)                             | R                 | R    | R                  | R                | R    | R                                                |
| Focus ring probes (group, link, chevron, rail)                | N                                              | R                 | R    | R                  | R                | R    | N                                                |
| Hydration and Suspense behaviour (5 routes)                   | N                                              | R                 | R    | R                  | theme flash only | R    | N                                                |
| Mobile drawer (6 pages)                                       | R                                              | n/a (aside shows) | n/a  | R                  | R                | R    | R (`/id/belajar`)                                |

Not covered (never run, so not passes): 320 and 1440 viewports; Firefox and WebKit for the sidebar and the rendered diagram;
real Safari and real touch devices; forced-colours and high-contrast modes; reduced-motion (chevron uses `motion-safe`);
sidebar widths other than the default (dragged or persisted), the drawer "Wide" preset; the `id` path rail (not reachable
except through a 404); the other 785 English Mermaid pages and sequence or other diagram types beyond the two pages; print;
real network slowness for DWT-008; pressed and disabled states; the 15 px classic scrollbar look (measured only as a size).

## Completeness check against `ewt.md` and `uwt.md`

Finding classes recorded by the earlier passes:

- `ewt.md`: runtime `?path` request on non-course routes (EWT-001); sidebar state lost across the boundary (EWT-002); focus
  falls to body when the focused source is hidden (EWT-003); invalid Mermaid syntax (EWT-004); unhandled `ChunkLoadError`
  (EWT-005); late table of contents layout shift (EWT-006); language switch to a 404 (EWT-007); unsupported locale returns 500
  (EWT-008); layout shift on another tool page (EWT-009); rail on a 404 course page (EWT-010); open questions on diagram
  legibility, clipped labels and the sidebar transitional state (OQ-001, OQ-002, OQ-004).
- `uwt.md`: diagram failure and its stray error graphics, small diagram text, cut labels (UWT-001 to 004); skip link, Tab
  load, sticky jump list, label wording, navigation and language findings (UWT-005 to 025); target sizes (UWT-026); one
  sideways scroll (UWT-028); diagram captions and redundancy (UWT-029, UWT-030); probe results including dark theme "text
  stays readable" and focus visibility.

Design-related classes they did not cover (now covered above, or open): dark-theme colour contrast of diagrams (DWT-001; `uwt.md`
did not measure it and called diagrams readable) and of the focus-ring token (DWT-002); approved-mockup fidelity of the sidebar
(DWT-003; neither pass compared to a mockup, `uwt.md` being spec-blind and `ewt.md` spec-aware but not design-aware); target size
and cross-variant consistency of the sidebar (DWT-004; `uwt.md` UWT-026 covers standalone links only); token and palette
fidelity across themes (DWT-005); focus-indicator design and its engine-dependent contrast (DWT-006; `ewt.md` explicitly handed
"dark theme, focus-ring contrast on the source" to this pass); scroll affordance (DWT-007); transitional content swap
(DWT-008, handed over as OQ-004); state-colour semantics and polish of the highlight states (DWT-009, DWT-010); flash of the wrong
theme (checked, passed). Still uncovered by all three: hover and pressed states beyond one hover read, forced colours,
typography and measure of the lesson body, spacing of the lesson header, and visual regression of the whole page across locales.

Re-verified before keeping (those touching visual design), all in Chromium:

| Earlier id                                                                                | Re-check here                                                                                                                   | Result                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UWT-002 (two "Syntax error in text" graphics below the footer)                            | 2 `div#dmermaid-*` elements directly after the footer, 80 px (375) or 109 px (768, 1280) high each, on every viewport and theme | **Kept.** Design addendum: in dark the dark-red graphic is 1.56:1 on the page (ghost icon, `captures/dwt-mermaid-failed-stray-error-graphic-1280-dark.jpg`); in light it is 12.5:1, a large red icon below the footer       |
| UWT-003 (diagram text 4 to 10 px at 375)                                                  | effective text size = 16 px x rendered scale, 7 diagrams of the beginner page                                                   | **Kept.** Reproduced exactly at 375: 7.4, 10.3, 4.2, 7.3, 9.4, 6.8, 8.7 px; at 768 the minimum is 6.2 px; at 1280 10.3 px                                                                                                   |
| UWT-004 (labels cut)                                                                      | rendered captures                                                                                                               | **Kept.** "nterleaved" of "Concurrency (interleaved)" is overlapped in the light and dark rendered captures, and "counter = 0 (parent process memory)" is cut at the node edge in the dark capture; same as `ewt.md` OQ-002 |
| UWT-023 (4 px dark resize bar, cut names)                                                 | visible in every sidebar capture                                                                                                | **Kept** (bar is `rgb(99, 93, 82)` in light, a light bar in dark; cut names in DWT-003 captures)                                                                                                                            |
| EWT-006 (late table of contents shifts the article)                                       | page CLS on load of the concurrency beginner page                                                                               | **Kept.** 0.184 at 1280 (shift sources a paragraph text node and a button), 0.001 at 375 and 768, equal to `ewt.md`                                                                                                         |
| EWT-004 (3 invalid diagrams)                                                              | beginner page: 9 blocks, 7 SVGs, 2 sources remain focusable                                                                     | **Kept** for the beginner page; the intermediate page was not re-run                                                                                                                                                        |
| UWT "Dark theme" probe ("diagrams ... still readable")                                    | contrast measured                                                                                                               | **Not kept as stated**; see DWT-001                                                                                                                                                                                         |
| EWT-009 (another tool page), EWT-007/008, EWT-001/002/003/005/010, UWT behaviour findings | not visual design                                                                                                               | not re-verified here                                                                                                                                                                                                        |

## Open questions (no governing design source, therefore not defects)

- OQ-D1: which dark palette is intended, the warm scale in `ayokoding.css` or the slate in `globals.css` (DWT-005)?
- OQ-D2: is a visible content swap from the generic tree to the path rail acceptable for the duration of the runtime request (DWT-008)?
- OQ-D3: should the Mermaid fallback source and the code blocks share one design-system focus ring, and if so which token (DWT-006)?

## Totals

- Findings: 10 (CRITICAL 0, HIGH 2: DWT-001, DWT-002; MEDIUM 4: DWT-003, DWT-004, DWT-005, DWT-006; LOW 4: DWT-007, DWT-008,
  DWT-009, DWT-010).
- By scope: IN-A 2 (DWT-006, DWT-007); IN-B 1 (DWT-008, behaviour identical before the diff); PRE 7 (DWT-001 to DWT-005, DWT-009,
  DWT-010), of which DWT-001 sits on the rendered state of the changed Mermaid surface and DWT-003, DWT-004 on the sidebar the
  host wraps. Neither diff worsens a visual property that was measurable: no layout shift, no flash of wrong theme, and the
  fallback surface is unchanged.
- Design spec-gap proposals: 4 (DSG-001 to DSG-004). Open questions: 3. Tooling causes: 1 (TC-001 re-confirmed, no effect).
- Earlier findings re-verified and kept: UWT-002, UWT-003, UWT-004, UWT-023, EWT-006, EWT-004 (beginner page); one earlier
  statement not kept (UWT dark-theme probe).
- Captures: 29 files, about 0.4 MB, under `captures/` named `dwt-*`.
- Not run: see "Not covered" in the coverage matrix.

Status: COMPLETE (all enumerations in scope have run; gaps listed above).
