# Phase 8 · Rule-15 Triad — Design-Charter Findings Record (`swe-web-tester`)

> **Status**: complete. **Findings totals**: 5 (0 Blocker/Critical/Major, 3 Minor, 2 Trivial).
> Charter: design fidelity of the rendered UI against the plan's selected hi-fi mockups
> (`assets/path-syllabus-option-a-number-gutter.excalidraw.png`, `assets/course-in-path-option-a-numbered-rail-autoscroll.excalidraw.png`,
> `assets/course-content-option-a-plain-headings-references.excalidraw.png`) plus the broader
> AyoKoding design language on unchanged surfaces and general design practice.
> The pass is read-only; no source, design, or state was modified.

## Pass parameters

| Parameter     | Value                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Origin        | `http://localhost:3101` (production build of the navigation-and-display change, served locally — reproduction only on this server)                                                                                                                                                                                                                                                                                      |
| Routes (en)   | `/en/learn/paths/careers/interview-ready/software-engineer`, `/en/learn/courses/distributed-systems?path=…/software-engineer`, `/en/learn/paths/careers/interview-ready` (arc-card preview), `/en/learn/courses/just-enough-nvim/learning/overview`, `/en/learn/courses/search-and-information-retrieval/overview`                                                                                                      |
| Routes (id)   | `/id/belajar/manusia/peralatan/cliftonstrengths/tema/membangun-hubungan/relator`, `/id/celoteh/2023/06/menyiapkan-c-typescript-f-dan-dart-untuk-pengembangan-lokal-dalam-vs-code-pengalaman-liburan-saya`, `/id/belajar/ikhtisar` (link-tree discovery: **no id surfaces exist for the path syllabus, course rail, or numbered courses** — verified against every `/id/belajar…` link reachable from the id learn tree) |
| Breakpoints   | 375 / 768 / 1280 px × 800 px (measured on all four en routes; screenshots at the cited ones)                                                                                                                                                                                                                                                                                                                            |
| Locales       | `en`, `id` — `html[lang]` verified `en` / `id` respectively on every loaded page                                                                                                                                                                                                                                                                                                                                        |
| Tool          | Headless Chromium 148.0.7778.96 (Playwright) — isolated session; computed-style + geometry readings and screenshots; MCP shared browser also spot-checked                                                                                                                                                                                                                                                               |
| Console       | **Zero console errors or page errors on every page measured** (both locales)                                                                                                                                                                                                                                                                                                                                            |
| Date observed | 2026-10-12 (00:04–00:22 local)                                                                                                                                                                                                                                                                                                                                                                                          |

## Mandatory systematic checks

- **Check A — raw native-element audit**: PASS. Interactive native controls on the judged
  surfaces: desktop header search input (styled chip, kbd hint ⌘K), `View path` button (token
  styling: underline offset, `focus-visible:ring-2`, hover `text-primary`), drawer controls, and
  the copy button inside fenced blocks. No bare UA-default control observed at any
  route × breakpoint.
- **Check B — styling-consistency matrix**: PASS for repeated control kinds: rail rows, drawer
  rows, and the syllabus rows all share the exact number-gutter tuple (`w-8` 32 px, `text-right`,
  `text-sm` 14 px, `tabular-nums`, `text-muted-foreground` ≈ #635D52) at 375/768/1280 — the
  plan's core consistency requirement holds everywhere. Rail footer links (`View full path`,
  `Browse all courses`) share one styling tuple; previous/next controls share one tuple (the
  next control adds only the documented `sm:text-right`). Syllabus rows vs rail rows are
  intentionally different surfaces per the two mockups (see DWT-001 for the one colour divergence).

## Findings

### DWT-001 · Syllabus row titles render near-black instead of the mockup's primary-blue link colour

- **Violated ground truth**: Screen 1 hi-fi `assets/path-syllabus-option-a-number-gutter.excalidraw.png`
  (each row is "the blue underlined course title"; prd.md grounding note names `text-primary`
  — blue `hsl(221.2 83.2% 53.3%)` — as the link token). Corroborated by the page's own prose
  link language: `prose-a:text-primary` renders `rgb(37, 99, 235)` on content pages, and the
  breadcrumb's course-name link renders `rgb(37, 99, 235)`.
- **Severity / Priority**: Minor / Medium (proposed) — contained colour drift; hierarchy and
  underline affordance intact, but it is the repeated primary element of Screen 1 (116 rows) and
  weakens the mockup's grey-number ⇔ blue-title contrast to grey ⇔ near-black.
- **Area**: Path landing syllabus (`PathLanding` course rows).
- **Environment**: `http://localhost:3101/en/learn/paths/careers/interview-ready/software-engineer`,
  headless Chromium 148, 375/768/1280 px, en. Same classes at all three breakpoints (width-independent).
- **Steps to reproduce**: (1) open the URL at any of 375/768/1280; (2) inspect any syllabus row's
  course link (e.g. "Just Enough Nvim").
- **Expected (designed)**: title link in the primary blue (~`#2563EB` region) with underline, per
  the selected hi-fi.
- **Actual**: computed colour `lab(5.26078 1.68304 3.85763)` (≈ near-black warm foreground, not
  `text-primary`), decoration `underline`, `underline-offset: 2px`, 14 px. The link class list
  carries no colour token (`hover:text-foreground` only). Number span is unaffected (muted grey,
  correct).
- **Evidence**: `./phase-8-dwt-path-syllabus-en-1280px.png`, `./phase-8-dwt-path-syllabus-en-375px.png`;
  class list `"rounded-md px-2 py-1 text-sm underline underline-offset-2 hover:bg-accent hover:text-foreground"`.
- **Reproducibility**: Always.
- **Defect type**: Mockup-fidelity / Colour.
- **Suggested fix locus (hypothesis)**: the syllabus row link classes in `path-landing.tsx`
  (add the `text-primary`-token treatment per the mockup); confirm intended hover token at the same time.

### DWT-002 · Arc-card "Starts with" preview renders below the role card instead of inside it (numbered-preview behaviour is correct post-replacement)

- **Violated ground truth**: Screen 1 hi-fi `assets/path-syllabus-option-a-number-gutter.excalidraw.png`
  — the arc card is drawn as one bordered card whose body contains the "Starts with: 1 … · 2 … →"
  numbered preview line (Gestalt proximity: the preview belongs to the card).
- **Severity / Priority**: Minor / Low (proposed).
- **Area**: Single-role arc landing card preview (`SyllabusPreview`).
- **Environment**: `http://localhost:3101/en/learn/paths/careers/interview-ready`, headless
  Chromium 148, 375/768/1280 px, en. `insideAnyCard: false` at all three breakpoints; no
  horizontal overflow.
- **Steps to reproduce**: (1) open the URL at 375, 768, or 1280; (2) compare the bordered role
  card with the "Starts with: …" line rendered underneath, outside the card border.
- **Expected (designed)**: the numbered preview inside the card body.
- **Actual**: preview line sits fully below the card's rounded border (screenshot at 1280:
  card ends at `~406px` y, preview at y≈425). **Note on the numbering itself (current behaviour,
  superseding the 2026-07-25 plan's DWT-002 preview workaround): items render numbered in path
  order — `"Starts with: 1 Just Enough Nvim · 2 Just Enough Lua · 3 Extending Neovim →"`, number
  spans `tabular-nums` muted, and no item carries a second number inside the course title.** Only
  the containment placement deviates; the replaced workaround behaviour is not present.
- **Evidence**: `./phase-8-dwt-arc-preview-en-1280px.png`.
- **Reproducibility**: Always.
- **Defect type**: Mockup-fidelity / Layout containment.
- **Suggested fix locus (hypothesis)**: where `SyllabusPreview` is mounted relative to the arc
  card container on the arc landing (move inside the card body) — `syllabus-preview.tsx` usage site.

### DWT-003 · Rail/drawer header readout ("COURSE 85 OF 116" + path title) is scrolled out of view by the auto-scroll, while the mockup shows it pinned above the rows

- **Violated ground truth**: Screen 2 hi-fi `assets/course-in-path-option-a-numbered-rail-autoscroll.excalidraw.png`
  — desktop rail shows "COURSE 85 OF 116" visible at the top with the scrolled rows 80–89 (and the
  ↑/↓ scroll-context hints); the mobile drawer mockup shows path title "Interview-Ready Software
  Engineer" + "COURSE 85 OF 116" visible above the rows with row 85 highlighted below.
- **Severity / Priority**: Minor / Medium (proposed).
- **Area**: `PathRail` (desktop sidebar) and the mobile drawer rail.
- **Environment**: 1280 and 768 px rail (en, `…distributed-systems?path=…`), and the 375 px drawer
  opened via "View path"; headless Chromium 148.
- **Steps to reproduce**: (1) open the URL at 1280 (rail, no interaction): the rail is
  auto-scrolled (`scrollTop 3730` of 5741) so row 85 is visible near centre, but the
  "Course 85 of 116" readout sits at viewport y = −3649 (scrolled out); (2) at 375, click
  "View path" — on open the drawer shows rows from ~77 upward; the path title (y = −3884) and the
  readout (y = −3682) are above the drawer viewport; row 85 is visible (y = 378).
- **Expected (designed)**: readout visible together with the centred current row (pinned or kept
  in view per the mockup).
- **Actual**: readout and path title scroll away with the content; the "↑/↓ courses above/below"
  context hints drawn in the desktop mockup are not rendered either. Row numbering, highlight,
  and scroll targeting are otherwise correct.
- **Evidence**: `./phase-8-dwt-course-in-path-precise-en-1280px.png` (drawn from the scrolled
  state — readout absent), `./phase-8-dwt-course-in-path-drawer-en-375px.png` (drawer top row is
  77; no title/readout visible).
- **Reproducibility**: Always.
- **Defect type**: Mockup-fidelity / Hierarchy (position readout lost at the exact moment the
  reader is dropped into the middle of a 116-row list).
- **Suggested fix locus (hypothesis)**: make the rail header block sticky (or outside) the
  `overflow-y-auto` container in `path-rail.tsx`, and the same block in the drawer variant.

### DWT-004 · Banner capitalization: rendered "on path · course 85 of 116" vs mockup "On path · course 85 of 116"

- **Violated ground truth**: Screen 2 mockup, mobile frame banner ("On path · course 85 of 116").
- **Severity / Priority**: Trivial / Low (proposed). **Note**: prd.md's responsive-strategy prose
  writes the banner in lowercase ("on path · course k of N") — the plan is internally
  inconsistent; owner resolves. Recorded because the charter says to record deviations against
  the selected mockup.
- **Area**: `PathBanner`.
- **Environment**: 375 px (banner hidden ≥md as designed), en; text rendered verbatim, no
  `text-transform` (`transform: none`), 14 px.
- **Steps to reproduce**: at 375 open `…/distributed-systems?path=…/software-engineer` and read
  the banner text.
- **Expected**: "On path · course 85 of 116" (mockup). **Actual**: "on path · course 85 of 116".
- **Evidence**: `./phase-8-dwt-course-in-path-drawer-en-375px.png` (banner visible behind drawer).
- **Reproducibility**: Always. · **Defect type**: Typography.
- **Suggested fix locus (hypothesis)**: banner string or `text-transform` in `path-banner.tsx`
  (also settles the prd-text-vs-mockup inconsistency).

### DWT-005 · References hedge renders as an italic bordered blockquote; mockup Option A shows the plain-language hedge as a plain bullet in the list

- **Violated ground truth**: Screen 3 hi-fi `assets/course-content-option-a-plain-headings-references.excalidraw.png`
  (hedge "Version numbers move quickly; check the release page…" drawn as a plain bullet inside
  the bulleted References list, annotated "hedge in plain words, no [Unverified] tag").
- **Severity / Priority**: Trivial / Low (proposed) — the hedge content itself is correct
  (plain words, no internal tags); only its typographic container differs. Content-layer authors
  chose `>` blockquote markdown; the design may accept this as a legitimate quotation treatment.
- **Area**: References section of `/en/learn/courses/search-and-information-retrieval/overview`.
- **Environment**: 1280 and 375 px, en.
- **Steps to reproduce**: open the URL, scroll to `#references` (y≈5046): an italic blockquote
  with a left border ("Fast-moving facts -- …") precedes the disc bulleted list.
- **Expected**: plain hedge bullet (or match the author's chosen container with a documented
  decision). **Actual**: `blockquote` > em paragraph.
- **Evidence**: `./phase-8-dwt-references-en-1280px.png`, `./phase-8-dwt-references-en-375px.png`.
- **Reproducibility**: Always. · **Defect type**: Typography / Mockup-fidelity.
- **Suggested fix locus (hypothesis)**: content conversion choice; if the design wants the mockup
  form exactly, a MarkdownRenderer blockquote style decision (not the references heading itself).

## Zero-finding surfaces (explicit)

1. **Number gutter alignment & numbering (Screen 1, all three breakpoints)** — 116 rows,
   positions 1…116 sequential with no gaps; every row's number in a fixed 32 px (`w-8`)
   right-aligned `tabular-nums` muted (`lab(39.7237 …)` ≈ #635D52) gutter, 8 px gap to the title;
   2-digit numbers right-align to the same edge as 1-digit numbers (rects identical: x 413/424
   constant at 1280/375 respectively); long titles (e.g. row 96) wrap under the title column
   (second-line x = 64 ≫ number right edge 56 minus padding), never under the number; no
   horizontal scroll;
   no catalogue/pass numbers inside any title (post-strip).
2. **Rail/drawer highlight treatment & auto-scroll (Screen 2, minus DWT-003/DWT-004)** —
   numbering 1…116 with the same fixed gutter at 375/768/1280; at 768 titles truncate with
   `…` while the gutter stays fixed; the current row is highlighted `bg-accent`
   (`lab(93.8639 11.7722 7.83559)` ≈ #FFE5DF rose — closely matching the mockup's rose tint),
   semibold 600 vs neighbours' 400, with the `▸` marker immediately before the title (neighbours
   have no marker, transparent background); auto-scroll leaves row 85 visible near centre at
   every width with `window.scrollY === 0` (container-only scroll, `scrollTop` 3730);
   heading "Distributed Systems" carries no number (36 px/800); prerequisites render without
   numbers; rail footer links present; previous/next read like the mockup (muted label above,
   dark title below).
3. **Current-row distinguishability beyond colour (charter item 5)** — PASS. The current state is
   signalled by (a) the `▸` glyph rendered inline, (b) font-weight 600 (vs 400 on all other
   rows), (c) the row's own position number, and — textually for assistive tech —
   (d) `aria-current="page"` on the row link (the `▸` span is `aria-hidden="true"`). Colour is
   never the sole channel.
4. **Nvim overview typography (Screen 3A, 1280 + 375)** — heading "Install and open your first
   file" (and all h2s) render 24 px/600 in the foreground heading colour with **no underline**
   (`text-decoration-line: none`) while still anchoring to their own ids via inner
   `<a href="#…">` (S6 intent); on hover the underline applies (`prose-headings:[&>a:hover]:underline`).
   Inline code (`nvim --version`, `mechanism-vs-policy`) renders as a rounded chip: radius 12 px,
   background `lab(93.0876 …)` ≈ #EFEBE2 (`bg-muted`), mono family, weight 400 equal to the
   surrounding paragraph (mockup: "no backticks, normal weight" — PASS), **no backtick
   characters**, inline display, no horizontal scroll. The fenced block.keep its distinct
   treatment (bg `rgb(246,248,250)`, radius 8 px, mono, copy button) — no chip style leaks into
   `pre` (the `:not(pre)>code` boundary holds visually).
5. **References typographic treatment (Screen 3A option A, apart from DWT-005)** — "References"
   is a plain h2 identical to every other section h2 (24 px/600, heading colour, no transform,
   anchored `#references`), a standard disc `ul` (padding 26 px), source/citation bullets, links
   in the site prose-blue `rgb(37, 99, 235)` underlined; no "Accuracy notes" section, no
   `Accuracy note` label, no `[Unverified]`/confidence tags anywhere on the page (S10 styling
   intent), and the volatility hedge is present in plain language.
6. **id locale** — headings (`Pengantar`, `Ciri Kunci`, …) and inline-code chips on
   `/id/belajar/.../relator` and the celoteh post render with the same post-change typography,
   `html[lang="id"]` correct, no backtick characters in chips, no untranslated English UI strings
   observed (banner/readout strings that this plan touches simply do not exist in id). No id
   equivalents exist for the two path-bearing routes — recorded, not a defect (id course-path
   content is out of the plan's scope; `content/id/**` explicitly out of scope).
7. **Console** — zero console/page errors across every measured page in both locales.

## Notes for the orchestrator

- DWT numbering here starts fresh for this plan's triad pass (precedent: delivery-mode
  disambiguation note in `plans/done/2026-07-25__ayokoding-learning-path-03-navigation-ui/delivery.md`).
- Raw measured tuples are preserved in
  `local-tmp/swe-web-tester/phase8-design-charter/out/results.json` (repo-relative).
- Findings are recorded observations; fixes and any deferral belong to the Phase 8 delivery
  checkboxes. Nothing was changed in the app or the plan.
