# P3 Manual Browser Verification — Findings

- Date (UTC): 2026-10-30
- Build under test: worktree `worktrees/ayokoding-app-web`, branch `ayokoding-app-web-p2`
- New app origin: `http://localhost:3102` (`go run ./cmd/ayokoding-web --port 3102` from `apps/ayokoding-web`)
- Old app origin: `http://localhost:3101` (Next.js dev, same worktree)
- Browser: headless Chromium (playwright-core 1.60.0) at 375 / 768 / 1280 px, locales en + id
- Scope run in one pass, reported per charter: exploratory, usability, design-fidelity
- No code, commit, or delivery file touched. No credentials used; all inputs synthetic.
- Evidence: this folder (`evidence/P3/manual-2026-10-30/`) — `*.png` screenshots named
  `feature-locale-breakpoint`, plus `wire-progress-notes.txt`,
  `wire-progress-requests.json`, `wire-b2-notes.txt`, `wire-b2-requests.json`,
  `wire-b3-notes.txt`, `wire-b4-notes.txt` (sanitized: request URLs/methods only, no bodies).

Reference screens compared: `evidence/P0/*.png` (styled product) and the pre-existing
`evidence/P3/*.png` (same unstyled state as this pass — no drift since that capture).

## Charter 1 — Exploratory (spec-aware)

Sources cited: `specs/apps/ayokoding/web/behaviours/learning-progress/browser-progress.feature`,
`specs/apps/ayokoding/web/behaviours/search/search.feature`,
`specs/apps/ayokoding/web/behaviours/shell/bilingual-shell.feature`,
tool codec `apps/ayokoding-web/internal/tools/benchmark/urlstate.go` (`EncodeState`).

### E1 — HIGH, defect: no completion control exists, so progress can never be recorded (fix required)

- Spec: `browser-progress.feature` — "marks a learning page complete", "completion control can
  undo", "course shows the same completed state", "Another tab receives completion changes".
- Repro: open `http://localhost:3102/en/learn/courses/go-basics/learning/hello-world`
  (also `setup`, id equivalents) at any viewport. Inspect every control: the only
  progress-related button anywhere in the served UI is `Reset progress` (`#reset-control`) on
  `/{locale}/learn`. Template grep confirms: no mark-complete/undo control in any template, and
  the browser bundle (`progress.js`) wires only the reset button — `markComplete`,
  `markIncomplete`, `subscribeCrossTab`, and the blocked-store notice are exported but never
  bound to the document.
- Expected: a reader can mark a lesson complete / undo it; course/path show completed state.
- Actual: visiting lessons leaves `localStorage` empty (`{}`); there is nothing to mark, undo,
  display, or sync. Consequences observed: cross-tab "sync" is vacuous (verified both tabs share
  the key but no UI reflects it), and the blocked-storage notice path is dead (see E6).
- Screenshot: `lesson-en-1280.png`, `lesson-id-375.png` (no completion affordance anywhere).

### E2 — HIGH, defect: htmx push-url exposes internal `/htmx/` fragment URLs in the address bar (fix required)

- Source: `urlstate.go` — "the query string is the single source of truth" for shareable state;
  `EncodeState` omits defaults and produces page-level query state.
- Repro (benchmark): open `http://localhost:3102/en/tools/ai-benchmark`, type `ultra` in Tier,
  fire change. Address bar becomes
  `http://localhost:3102/htmx/benchmark?locale=en&harness=&tier=ultra&sub=&sub-harness=`
  (count filters correctly to 9). Same for calculator (e.g. city `jakarta` pushes
  `http://localhost:3102/htmx/calculator?locale=en&tab=cost&...&city=jakarta...`).
- Expected: the pushed URL is the shareable page URL with codec-ordered, defaults-omitted query
  (e.g. `/en/tools/ai-benchmark?tier=ultra`).
- Actual: raw fragment request URL is pushed, including empty params. Reloading or sharing that
  URL renders a bare fragment with no shell (verified: full-page fragment responses contain no
  `<main>`/nav). Back/forward within the session works; outside entry is broken.
- Screenshot: `benchmark-ultra-en-1280.png`, `benchmark-filtered-en-1280.png`.
- Note: direct deep-links with valid values DO work
  (`/en/tools/ai-benchmark?tier=ultra` retains `ultra`, count 9; invalid values correctly recover
  to unset with count 93; unexpected keys correctly yield `invalid_filters`) — only the pushed URL
  is wrong.

### E3 — MEDIUM, defect: `/{locale}/search` returns a bare fragment, so there is no search results page (fix required)

- Repro: navigate to `http://localhost:3102/en/search?q=go` (or hostile `%3Cscript%3E...`, empty,
  or any query) → HTTP 200 whose entire body is `<ul data-search-results …>` or
  `<p data-search-empty …>`; no doctype, shell, or `<main>`. `handleSearch` renders the `search`
  template, which is fragment-only. Consequence: the search form's non-JS `action="/{locale}/search`
  lands on a shell-less page, and dialog Enter-submit never navigates (URL stays put; results only
  in the live region — verified on landing and tool pages).
- Expected: a shareable, shell-wrapped results page (the route exists and the form points at it).
- Hostile input is safely escaped (`&lt;script&gt;`, no execution) — that part passes.
- Screenshot: `search-en-1280.png` (fragment-as-page), `search-open-id-1280.png` (dialog works).
- Parity note: the old app also has no usable `?q=` page (`/en/search?q=go` → 404 there), so
  dialog-only search matches the old product; triage stays defect only for the misleading route +
  form action, or downgrade to spec-gap if dialog-only is the intended design.

### E4 — MEDIUM, defect: Copy buttons are dead (fix required)

- Repro: open `http://localhost:3102/en/learn/courses/go-basics/learning/hello-world`, click
  `Copy` (`button[data-copy]` next to the `package main` block) → clipboard stays empty, no
  feedback, no error. No script binds `[data-copy]` (verified in `assets/js` + templates).
- Expected: code copies to clipboard (or the button does not render).
- Screenshot: `lesson-en-1280.png` (button visible mid-page).

### E5 — MEDIUM, defect: Mermaid and math render as raw source text (fix required)

- Repro: same lesson — `<pre class="mermaid" role="img" aria-label="diagram">` never becomes an
  SVG (0 `svg` in `main`), and `span.math-inline` / `span.math-display` show literal text
  ("inline mathematical notation"). No renderer is loaded.
- Expected: rendered diagram / typeset math (content contract implies rendered output; the
  `role="img"` label on unrendered source is additionally misleading for AT).
- Tabs (`div.tabs` / `tab-panel`) are class-only with no tablist semantics or keyboard support;
  panels read as plain stacked content — usable but not interactive tabs (LOW within this item).

### E6 — MEDIUM, defect: blocked-storage notice never surfaces (fix required)

- Spec: `browser-progress.feature` — "a notice explains that progress cannot be saved".
- Repro: stub `localStorage` to throw, load `http://localhost:3102/en/learn` → page renders and
  stays usable with zero pageerrors (good), but the mandated notice
  ("Progress cannot be saved in this browser…") appears nowhere; `createBlockedStore().notice()`
  is never called by the bootstrap.
- Corrupt-record recovery partially passes: corrupt value does not break reading, and reset
  clears it — but "a valid v1 record replaces it" is untestable with no completion control (see E1).

### E7 — MEDIUM, defect: no theme control; no resizable sidebar (fix required)

- Spec: `bilingual-shell.feature` — "A selected theme survives a reload", "A resized sidebar
  retains its width". Old app header has a theme toggle (see `oldapp-landing-en-1280.png`).
- Actual: no theme toggle exists (`data-theme="light"` is static); no sidebar resize handle
  exists. Untestable scenarios, no persistence keys written.

### E8 — MEDIUM, defect: orphan `web` course routes — lessons 200 while the course 404s and the catalog omits it (fix required)

- Repro: `http://localhost:3102/en/learn/courses/web` → 404, yet
  `/en/learn/courses/web/learning/section-index` and `/leaf` → 200 and are in `sitemap.xml`;
  catalogs (en + id) list only `go-basics` and `go-web`. `/{id}/learn/courses/web/...` → 404,
  so id readers hitting a locale-switched `web` URL land on a 404 (locale switch preserves the
  path blindly).
- Expected: listed course ↔ reachable lessons agree per locale, or legacy routes redirect.

### E9 — LOW, defect: `/favicon.ico` 404s, the only console error on clean loads (fix required)

- Repro: any page → console `Failed to load resource: 404`; `curl /favicon.ico` → 404.
  No other console errors; zero pageerrors across all passes. (Third-party `youtube` iframe warnings
  `No available adapters` come from the fixture's `youtube.com/embed/abc`, see U4.)

### E10 — LOW, defect: skip link scrolls but focus stays on `body` (fix required)

- Spec: `bilingual-shell.feature` — "focus moves to the main content".
- Repro: Tab from top focuses `Skip to content`, Enter scrolls to `#main` but `activeElement`
  remains `body` (`#main` has no `tabindex="-1"`).

### Exploratory passes (no finding)

- Progress privacy: 147 tracked requests + 0 websocket frames across marking (seeded),
  undo-equivalent, reset accept/cancel, navigation, reload, second tab — zero carry the progress
  key or `"completed"`; visits write nothing; reset clears only the progress key while the
  `unrelated-keep-me` key survives reset, reload, and corrupt+reset. Origins fully separated
  (3101⇄3102 keys mutually invisible). Reset cancel preserves state AND restores focus with
  `Reset progress.` announcement on confirm.
- Search: shortcut Ctrl+K opens with focus; Escape restores focus to opener; dialog results are
  locale-scoped (`/id` search returns only `/id/...` links); whitespace clears to the empty
  state; tool pages appear (`benchmark` → AI Benchmark, `calculator` → Cost of Living
  Calculator); choosing a result opens its route.
- Navigation: breadcrumbs, prev/next (setup→hello-world), TOC anchor (`#setup`), locale switch
  preserves path to the translated lesson, mobile nav opens/closes/restores focus via Escape and
  toggles `aria-expanded`, no horizontal overflow at any viewport, 404s localized with correct
  `lang` (`Not found` / `Tidak ditemukan`), `hreflang` alternates + canonical present.

## Charter 2 — Usability (spec-blind lens)

Method: first-click/information-scent read, Nielsen heuristics, mandatory systematic probes
(conditional controls, jargon, cross-view redundancy, units), responsive check.

### U1 — MEDIUM, defect: tool filters are undiscoverable free-text inputs for closed vocabularies

- Heuristic: recognition rather than recall; error prevention. Tiers are exactly
  `ultra/planning/execution/fast/insufficient`, harnesses a fixed roster — but the UI offers blank
  text boxes. Typing a near-miss (`frontier`) silently recovers to "all" with no message (the page
  does disclose "Invalid values fall back to codec defaults", which softens this to MEDIUM).
  Usability fix direction (suggestion, not a patch): selects/radios with visible options plus a
  one-click reset — the `invalid_filters` state says "Reset the filters" but renders no reset
  control (LOW within this item; recovery today = clearing boxes by hand).

### U2 — MEDIUM: dialog-only search strands complex queries (spec-gap)

- First-click read: a reader pressing Enter after typing reasonably expects a results page they
  can scan, share, and return to. Instead Enter keeps them on the same page with an in-dialog
  list, and no full results page exists (see E3). As pure usability this is a gap to decide, not a
  functional break: either provide the results page or make Enter's in-place behavior explicit.
  Triaged spec-gap (overlaps E3's route/form defect, which stands on its own).

### U3 — LOW, defect: dead Copy buttons violate affordance

- A bordered `Copy` button that silently does nothing (see E4) teaches readers that controls lie.
  Either wire it with confirmation feedback or remove it from fixture content.

### U4 — LOW, suggestion: lesson embeds `youtube.com` (not `youtube-nocookie`) with ad tracking

- The fixture iframe pulls `pagead`, `youtubei/log_event`, and multiple `googlevideo`-adjacent
  beacons on a learning page (observed in the request inventory). Prefer privacy-enhanced embeds
  for learning content.

### U5 — LOW, suggestion: calculator defaults show empty money values

- With no city selected the estimate block shows blank `Monthly cost/saving` definitions. Either
  hide the block until inputs suffice or show explicit guidance ("Select a city to estimate").

### Usability passes

- Dialog focus management is exemplary (open→focus in, Escape→focus restored, shortcut parity).
- Language consistency holds per locale (Beranda/Kursus/Cari/Atur ulang progres vs
  Home/Courses/Search/Reset progress); 404s and empty states are translated.
- No overflow, single predictable column, generous tap targets even unstyled; contrast of the
  unstyled baseline passes (body 21:1, links 9.4:1 — see design charter).

## Charter 3 — Design fidelity (vs P0 references + live old app)

### D1 — HIGH, defect: the new app ships no CSS at all — total fidelity miss vs P0 (fix required)

- Ground truth: `evidence/P0/landing-en-1280.png` and live old-app `oldapp-landing-en-1280.png`
  (styled header, hero, path cards, footer) vs new `landing-en-1280.png` (browser-default Times,
  blue links, stacked text). No `<link rel="stylesheet">` is emitted by any page; this is not a
  missing build artifact (`build:assets` only produces `progress.js`, which exists) — styling is
  absent by construction.
- Every captured page (landing, browse, catalog, paths, course, lesson, tools, search, missing —
  en+id × 375/768/1280) renders unstyled; the pre-existing `evidence/P3/*.png` captures show the
  identical state, so no drift, but also no progress toward parity. Responsive behavior is
  trivially "correct" only because there is no layout to break.
- Screenshot pairs: `landing-en-1280.png` vs `oldapp-landing-en-1280.png`;
  `catalog-en-1280.png` (plain list) vs `oldapp-catalog-en-1280.png` (styled grid).

### D2 — covered by E7 (theme toggle present in old-app header, absent new) — no separate rating

### Design passes

- Text contrast of the unstyled baseline: body 21.00:1, h1 21.00:1, links 9.40:1 (opaque-equivalent
  vs white) — passes WCAG AA wherever UA defaults apply.
- Accessible names: 0 images without alt (no content images ship), 0 unnamed buttons, 0 unlabeled
  inputs across landing/browse/catalog/lesson/benchmark; exactly one `h1` per page; `lang`
  correct per locale; `:focus-visible` outline and skip link exist in the inline `<style>`.

## Totals

- Exploratory: 10 findings (3 HIGH defect, 4 MEDIUM defect, 2 LOW defect, 1 suggestion-grade gap E8-note folded as defect per above — recount: E1 HIGH, E2 HIGH, E3 MEDIUM, E4 MEDIUM, E5 MEDIUM, E6 MEDIUM, E7 MEDIUM, E8 MEDIUM, E9 LOW, E10 LOW) + 3 pass clusters.
- Usability: 5 findings (2 MEDIUM, 2 LOW, 1 LOW suggestion) + 1 pass cluster.
- Design fidelity: 1 finding (HIGH) + 1 pass cluster.
- Cross-charter must-fix for parity: E1 (completion loop), E2 (shareable tool URLs), D1 (styling),
  E7 (theme/sidebar), E4+E5 (code-copy/math/mermaid content features).

## Open questions (not findings)

- Is dialog-only search the intended design (old app behaves the same)? If yes, E3 downgrades to
  removing/making the vestigial `/{locale}/search` route + form action consistent with it.
- Is the `web` course legacy content pending removal (E8), or a listing bug in the catalog?
- Are math/Mermaid/tab interactivity and copy planned as client features or server-rendered
  output in a later phase? The content already ships the hooks (`mermaid`, `math-*`, `tabs`,
  `data-copy`).
