# P3 Recheck — Targeted Verification of Repaired Findings (2026-10-30)

- Date (UTC): 2026-10-30
- Build under test: worktree `worktrees/ayokoding-app-web`, branch `ayokoding-app-web-p2`
  (repairs present as uncommitted changes; nothing committed by this pass)
- New app origin: `http://localhost:3102` (owned server,
  `go run ./cmd/ayokoding-web --port 3102` from `apps/ayokoding-web`; stopped after the pass)
- Old app origin (3101): not needed — no comparison cited below requires it; never started.
- Browser: headless Chromium via the repo's own `playwright-core` (ms-playwright cache),
  real browser contexts (the Playwright MCP server had no Chrome binary, so probes ran
  through `/tmp/recheck-p*.mjs` against the served origin; scripts are throwaway probes,
  not repo artifacts). Breakpoints 375 / 768 / 1280, locales en + id.
- Original findings: `evidence/P3/manual-2026-10-30/p3-findings.md` (E-ids below refer to it).
- Scope: findings-only re-check of the repair claims named in the charter
  (E1, E2, E3, E4, E10, E9, E5, E7, E8, D1, U1, U4, privacy regression).
  No code, `delivery.md`, or learnings touched. No commit, no push.
- Evidence in this folder: this file + 8 screenshots named `feature-locale-breakpoint`
  (only D1 changed visibly, so only D1 captures were kept).

## Verdicts

### E1 — FIXED: completion loop, course state, cross-tab sync, blocked-storage notice

- Lesson `…/go-basics/learning/hello-world` renders `Mark as complete`
  (`[data-progress-control='complete-trigger']`, `aria-pressed="false"` initially).
- Click → `aria-pressed="true"`, `localStorage["ayokoding-learn-progress-v1"]`
  = `{"version":1,"completed":["go-basics/hello-world"],"lastPath":"","lastCourse":""}`.
- Reload persists (`aria-pressed` stays `true`).
- Course page shows completed state: `1 of 2 pages done` (`[data-course-count]`,
  live `role="status"`).
- Second click undoes: `aria-pressed="false"`, record back to `"completed":[]`.
- Cross-tab: a second page in the same origin reads `aria-pressed="true"` after the
  first tab marks (fresh load; storage-backed).
- Blocked storage (localStorage stubbed to throw): `[data-progress-blocked]` is present
  AND visible on both the lesson page and `/en/learn`; pages stay usable.
- Residual note (not a verdict-changer): under fully-blocked storage one uncaught
  `QuotaExceededError: blocked` surfaces as a pageerror from a non-critical read path.
  The notice still renders and the page stays usable; E6's corrupt-record path was not
  re-probed beyond this.

### E2 — FIXED: pushed URL is the canonical shareable page URL

- On `/en/tools/ai-benchmark`, Tier is now a `<select>`; choosing `ultra` pushes
  `http://localhost:3102/en/tools/ai-benchmark?tier=ultra` — no `/htmx/` prefix,
  no empty params (`harness=&…` gone), codec-ordered, defaults omitted.
- Reloading the pushed URL renders the full page (`main` + nav present), Tier retains
  `ultra`. Calculator path uses the same fragment/push mechanism (templates
  `benchmark-fragment.html` / `calculator-fragment.html` added server-side).

### E3 — FIXED: `/{locale}/search` is a shell-wrapped results page, escaping intact

- `GET /en/search?q=go` → 200, `<!doctype html>`, shell + `<main>` + nav present,
  2 results in the page (not only the dialog live-region).
- Hostile `q=<script>alert(1)</script>` → zero `<script>` elements in `main`,
  payload escaped; page still shell-wrapped.

### E4 — FIXED: copy buttons give feedback

- `button[data-copy]` → click changes label `Copy` → `Copied`; clipboard then holds
  the code block (`package main // source…`). Verified with clipboard permissions granted.

### E10 — FIXED: skip link moves focus to `#main`

- Tab from top focuses `Skip to content`; Enter moves `activeElement` to `MAIN#main`;
  `#main` carries `tabindex="-1"` on all sampled pages (landing, lesson, benchmark).

### E9 — FIXED: favicon no longer 404s

- `GET /favicon.ico` → 200 `image/svg+xml` (served from embedded `assets/favicon.svg`).
- Clean load of `/en/`: zero pageerrors, zero console errors (no `Failed to load
resource` anywhere in the pass).

### E5 — FIXED: mermaid/math render, tabs have semantics

- On the hook-bearing lesson: `main svg` = 1, leftover `pre.mermaid` = 0 (diagram
  rendered, vendored `mermaid.min.js` served on demand), `.katex*` = 4
  (`math-inline`/`math-display` typeset via vendored KaTeX), `role="tablist"` = 1
  with `tab` + `tabpanel`. Panels previously read as stacked plain content.

### E7 — FIXED: theme toggle persists across reload, sidebar resize persists

- `[data-theme-toggle]` present (header shows `Light`/`Dark`); click `light → dark`,
  `documentElement[data-theme]` + `localStorage["theme"]` both `dark`; reload keeps
  `dark|dark`.
- `[data-sidebar-resize]` present on the lesson; focusing the handle + `ArrowRight`
  persists `localStorage["ayokoding-sidebar-width"]` = `260` across reload
  (was `null` before interaction). Resize is keyboard-operable.

### E8 — PARTIALLY FIXED: `web` orphan resolved in en; residue in legacy/id-empty lists

Fixed (the reported defect):

- `/en/learn/courses/web` → 200 (was 404); lists `/learning/leaf` +
  `/learning/section-index`, both 200 and both in `sitemap.xml`.
- Catalogs `/en/learn/courses` and `/id/learn/courses` both list 4 courses
  (`go-basics`, `go-web`, `outline-only`, `web`) — `web` no longer omitted.
- Locale switch no longer lands on a 404 for the reported `web` path in en.

What remains:

1. `legacy` lesson is reachable AND sitemapped (loc appears **twice**, exact
   duplicate) at `/en/learn/courses/legacy/learning/software-engineering` → 200,
   but there is no `/en/learn/courses/legacy` course page (→ 404) and no `legacy`
   entry in either catalog. Orphan-in-reverse: sitemap advertises a lesson whose
   course does not exist (a second shape, `/en/learn/legacy/software-engineering`,
   also 200s).
2. `/id/learn/courses/web` → 200 but renders an **empty** lesson `<ol>`
   (`data-total="0"`); `/id/learn/courses/web/learning/leaf` → 404. Nothing links
   to the 404 and the sitemap correctly omits id `web` lessons, so agreement holds
   by omission — but an id reader choosing `web` meets an empty lesson list.
3. `go-web` and `outline-only` courses → 200 in both locales yet list zero lessons
   (may be intentional fixtures; agreement is vacuous, not broken).

### D1 — PARTIALLY FIXED: styled base shipped; P0 parity not reached

- Every sampled page emits `<link rel="stylesheet" href="/assets/css/site.css">`;
  `/assets/css/site.css` → 200 `text/css`, ~8.5 kB. Body computes to
  `ui-sans-serif, system-ui…` (no longer browser-default Times); header buttons,
  rules, footer, cards, and the dark theme all render (eyeballed in the captures:
  `landing-en/id-375/768/1280.png`, `lesson-en/id-1280.png` in this folder).
- Gap vs `evidence/P0/landing-en-1280.png` (old-app rich landing with hero, path
  cards, search field): the new `/en/` is a sparse `Learn` index, and lesson layout
  is narrower/plainer. The HIGH "no CSS at all" defect is closed; full design
  parity remains open work.
- Note: captures show the landing in the light theme and the lesson in the dark
  theme (toggle active); both render fully styled. Fresh contexts default to light.

### U1 — FIXED: closed-vocabulary options + reset; calculator guides empty state

- Benchmark Tier renders `SELECT(,ultra,planning,execution,fast,insufficient)`;
  Harness renders a `SELECT` of the fixed roster (no more free-text boxes).
- A `Reset` control exists inside `[data-tool-filters]`.
- Calculator (`/en/tools/cost-of-living-calculator`; `/en/tools/calculator` is 404
  and was never the route) with no city selected shows explicit guidance:
  `Select a city to see your estimated cost and savings.` (U5's blank-money
  complaint is addressed by this guidance).

### U4 — FIXED: lesson embed uses `youtube-nocookie`

- Lesson iframes: `https://www.youtube-nocookie.com/embed/abc` (was `youtube.com`).

### Privacy regression — PASS

- 32 tracked requests across mark → undo → course navigation → reload → second tab:
  zero carry `ayokoding-learn-progress-v1` or `"completed"` (no key, no
  `completed=` param, no encoded record in any URL/method pair). No websocket
  frames observed on these routes. Origins remain separated per the original pass
  (not re-probed; untouched by the repairs).

## Totals

- FIXED: E1, E2, E3, E4, E5, E7, E9, E10, U1, U4 (10), plus privacy regression PASS.
- PARTIALLY FIXED: E8 (legacy-orphan + empty id/go-web/outline-only lesson lists
  remain), D1 (styled base shipped; P0 parity open).
- STILL BROKEN: none among the re-checked claims.
- Residual observations (no verdict, for triage): duplicate `legacy` loc in
  `sitemap.xml`; one uncaught `QuotaExceededError` pageerror path under
  fully-blocked storage (notice still shows).
