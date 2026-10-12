# Phase 8 Manual Verification — AyoKoding Learn Revamp 02: Path Model

Worktree: `worktrees/ayokoding-learn-revamp-02-path-model/`, branch
`ayokoding-learn-revamp-02-path-model` @ `d6e4a1f3c` (clean, no commits by this pass).
`SUPPORTED_LOCALES` in `apps/ayokoding-www/src/features/i18n/core/config.ts` is `["en","id"]` (read-only check).

Server notes (substitutions recorded; no product files touched):

- DEV attempt 1 served `GET /en/.../software-engineer 200` after ~13 min
  (`application-code: 12.9min`, Turbopack cold compile under host memory pressure)
  but the requesting curl had already timed out; the server was then killed before
  further routes compiled. Attempt 2 (warm `.next/dev` cache) served fast.
- All manual UI checks below ran against DEV on `http://localhost:3101` via Playwright
  (resize / navigate / snapshot / console-messages / screenshot).
  Zero console errors on every page/breakpoint (hydration warnings count as errors;
  none seen).

## Manual UI verification (DEV)

### IR path — `/en/learn/paths/careers/interview-ready/software-engineer`

Acceptance: "Core" label; four core phase headings Phase 1–4 (Programming and the
command line; Data structures and backend basics; Interview skills; Interview capstone)
with outcome lines; course 13 is Capstone · Interview Loop; "Optional extensions"
heading; first extension "Editor and shell workflow" starts at 14; no "Phase 1
prioritizes" text. Verdict: PASS at 375/768/1280. `html[lang="en"]`, 0 console errors
at each breakpoint. 4× "After this phase you can" + 4× "You cannot yet" lines present.

![IR path en 375](./phase-8-ir-path-en-375px.png)
![IR path en 768](./phase-8-ir-path-en-768px.png)
![IR path en 1280](./phase-8-ir-path-en-1280px.png)

### IE path — `/en/learn/paths/careers/immediately-effective/software-engineer`

Acceptance: core 13 (4+4+4+1), first phase "Set up your editor"; phases and counts
match tech-docs/004 (extensions 2/2/9/7/10/4/9/8/14/9/7/6/9/5); Outline badges only on
outline rows (8 badges at positions 78/87/94/108/109/111/113/114, all in extension
phases, none in core). Verdict: PASS at 375/768/1280. `lang="en"`, 0 console errors.

![IE path en 375](./phase-8-ie-path-en-375px.png)
![IE path en 768](./phase-8-ie-path-en-768px.png)
![IE path en 1280](./phase-8-ie-path-en-1280px.png)

### FS path — `/en/learn/paths/careers/fundamentally-strong/software-engineer`

Acceptance: core 24 in five phases (4+8+7+4+1); extension counts match tech-docs/004
(5/9/8/10/4/8/8/9/9/7/2/9/5/4); 8 Outline badges, none on positions ≤ 24.
Verdict: PASS at 375/768/1280. `lang="en"`, 0 console errors.

![FS path en 375](./phase-8-fs-path-en-375px.png)
![FS path en 768](./phase-8-fs-path-en-768px.png)
![FS path en 1280](./phase-8-fs-path-en-1280px.png)

### AI path — `/en/learn/paths/careers/immediately-effective/ai-engineer`

Acceptance: description reads "For developers who already code: build, evaluate,
deploy, and operate AI systems."; "Before you start" lists 11 linked courses, every
link canonical (no `?path=`); six core phases (3+8+2+7+3+2 = 25 core); extension
"Capstone" with an Outline badge on course 26 ("26 Capstone · Build Your Own Coding
Agent Outline"). Verdict: PASS at 375/768/1280. `lang="en"`, 0 console errors.

![AI path en 375](./phase-8-ai-path-en-375px.png)
![AI path en 768](./phase-8-ai-path-en-768px.png)
![AI path en 1280](./phase-8-ai-path-en-1280px.png)

### Skills unchanged (decision 39)

Pages: `/en/learn/paths/skills`, the four skills paths, and
`/en/learn/courses/accounting-foundations?path=skills/conventional-accounting`,
at 375 and 1280. Compared against `phase-0-baseline.md`,
`phase-0-before-skills-*-en-{375,1280}px.png`, and `phase-0-before-skills-lists-en.txt`.

- Syllabus lists equal the current manifest `courseOrder` exactly (19/24/27/30);
  manifest order is frozen to the pre-change order by `skills-order.unit.test.ts`
  (green). Set comparison vs the Phase 0 text: identical except (a) the
  `sql-essentials` prerequisite link on `conventional-accounting` (still present,
  noted in the Phase 0 baseline itself) and (b) the truncated `inventory-and-wareh`
  artifact in the Phase 0 extraction for `conventional-erp` (Phase 0 regex cut;
  the full slug is present and ordered correctly today). The Phase 0 text is
  alphabetically sorted; page order is manifest order — unchanged from before
  (the marked manifests keep today's order by construction).
- No phase heading, outcome line, Outline badge, "Before you start" note,
  "Optional extensions" heading, or Preview label in visible text on any of the six
  pages (browser `main` innerText checks + curl HTML visible-text checks).
- Skills course rail: flat list of 19 in manifest order, current row marked with
  `▸`, "COURSE 1 OF 19" readout, Next link present — pixel-matches the Phase 0
  screenshot (same layout, courses, order).
- Category statement and milestone strip: unchanged (screenshots below match the
  Phase 0 files side by side; hub still lists the four skills cards in order).
- Verdict: PASS (unchanged). `lang="en"`, 0 console errors on all six pages at both
  breakpoints.

![Skills hub en 375](./phase-8-skills-skills-en-375px.png)
![Skills hub en 1280](./phase-8-skills-skills-en-1280px.png)
![Skills conventional-accounting en 375](./phase-8-skills-skills-conventional-accounting-en-375px.png)
![Skills conventional-accounting en 1280](./phase-8-skills-skills-conventional-accounting-en-1280px.png)
![Skills sharia-accounting en 375](./phase-8-skills-skills-sharia-accounting-en-375px.png)
![Skills sharia-accounting en 1280](./phase-8-skills-skills-sharia-accounting-en-1280px.png)
![Skills conventional-erp en 375](./phase-8-skills-skills-conventional-erp-en-375px.png)
![Skills conventional-erp en 1280](./phase-8-skills-skills-conventional-erp-en-1280px.png)
![Skills sharia-erp en 375](./phase-8-skills-skills-sharia-erp-en-375px.png)
![Skills sharia-erp en 1280](./phase-8-skills-skills-sharia-erp-en-1280px.png)
![Skills course en 375](./phase-8-skills-course-en-375px.png)
![Skills course en 1280](./phase-8-skills-course-en-1280px.png)

### Arc landing and hub

- `/en/learn/paths/careers/interview-ready`: "Starts with Phase 1 · Programming and
  the command line: 1 Just Enough Python · 2 Just Enough Bash · 3 Version Control &
  Git →" (all three first-phase courses). Verdict: PASS at 375/768/1280,
  `lang="en"`, 0 console errors.
- `/en/learn/paths`: careers strapline "A focused core for your goal, then optional
  depth" (new per tech-docs/006); skills strapline "Up and running fast, then deeper
  and deeper" (unchanged per tech-docs/006). Verdict: PASS at 375/768/1280,
  `lang="en"`, 0 console errors.

![Arc en 375](./phase-8-arc-en-375px.png)
![Arc en 768](./phase-8-arc-en-768px.png)
![Arc en 1280](./phase-8-arc-en-1280px.png)
![Hub en 375](./phase-8-hub-en-375px.png)
![Hub en 768](./phase-8-hub-en-768px.png)
![Hub en 1280](./phase-8-hub-en-1280px.png)

### Course in path — `/en/learn/courses/capstone-interview-loop?path=careers/interview-ready/software-engineer`

- At 1280: rail grouped by phase ("Phase 1 · Programming and the command line" …
  "Phase 4 · Interview capstone", "Optional extensions" divider), "COURSE 13 OF 116",
  current row `▸Capstone · Interview Loop` with `aria-current`; Next goes to
  `/en/learn/courses/just-enough-nvim?path=careers/interview-ready/software-engineer`
  (`?path=` kept). Verdict: PASS, 0 console errors.
- At 768: no persistent rail below the `lg` breakpoint (by the responsive strategy:
  rail is desktop-only, drawer otherwise); the "View path" banner
  ("on path · course 13 of 116") opens the drawer with the same phase grouping and
  current marking (verified via click). Screenshot shows the banner state.
  Verdict: PASS (grouping holds in drawer), 0 console errors.
- At 375: banner opens the drawer via click with the same grouping; screenshot with
  drawer open. Verdict: PASS, 0 console errors.

![Course in path en 375 (drawer open)](./phase-8-course-in-path-en-375px.png)
![Course in path en 768](./phase-8-course-in-path-en-768px.png)
![Course in path en 1280](./phase-8-course-in-path-en-1280px.png)

### Outline in rail — `/en/learn/courses/capstone-secure-service?path=careers/fundamentally-strong/software-engineer`

Acceptance: "COURSE 101 OF 121" (position 101 sits in the Security extension phase
95–101 per tech-docs/004); current row "▸Capstone · Secure Service" carries the
Outline badge (`101▸Capstone · Secure ServiceOutline`); 8 rail badges total, all on
outline rows. Verdict: PASS at 375/768/1280, `lang="en"`, 0 console errors.

![Outline in rail en 375](./phase-8-outline-in-rail-en-375px.png)
![Outline in rail en 768](./phase-8-outline-in-rail-en-768px.png)
![Outline in rail en 1280](./phase-8-outline-in-rail-en-1280px.png)

### Indonesian

- `/id/learn/paths/careers/interview-ready/software-engineer`: HTTP 200 (all three
  breakpoints), `html[lang="id"]`, title "Interview-Ready Software Engineer"
  (identical to baseline). The page mirrors the en content tree (the id site has no
  paths tree; this plan adds none) with Indonesian UI chrome: "SILABUS", "INTI",
  "FASE 1–4", "PENDALAMAN OPSIONAL", "Setelah fase ini Anda bisa", "Anda belum bisa".
  Expected rendering change vs Phase 0: the mirrored list went from the old flat
  order to the new phase grouping (same change as the en page it mirrors), and the
  description to the new copy. No id paths tree added. 0 console errors.
  Verdict: PASS.
- `/id`: `html[lang="id"]`, Indonesian h1, 0 console errors. Verdict: PASS.
- `/id/belajar/ikhtisar`: `html[lang="id"]`, h1 "Ikhtisar", none of this plan's
  English UI strings ("Phase", "Before you start", "Optional extensions",
  "After this phase", "Outline"), 0 console errors. Verdict: PASS.
  (Phase titles/outcomes stay English per series decision 35; proven by the unit
  tests rendering each new component with `locale="id"`.)

![ID path id 375](./phase-8-id-paths-id-375px.png)
![ID path id 768](./phase-8-id-paths-id-768px.png)
![ID path id 1280](./phase-8-id-paths-id-1280px.png)
![ID home id 375](./phase-8-id-home-id-375px.png)
![ID home id 768](./phase-8-id-home-id-768px.png)
![ID home id 1280](./phase-8-id-home-id-1280px.png)

## Rendered production sign-off (BUILD + start)

- `BUILD` (`rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . --
npm exec nx -- run ayokoding-www:build`): exit 0, canonical command, no shed, no
  substitution. No `.env.local` needed (every key in `.env.example` is OPTIONAL).
- Production server (`rtk ./hippo run --class service --resource-tier standard
--disk-path . -- npm exec nx -- run ayokoding-www:start`): first request 200
  immediately. Repeated the IR path and course-in-path checks at 375 and 1280
  against the selected prd.md hi-fi images (S1-A phase sections, S2-A grouped full
  list):
  - IR path: "Core" label, 4 core phase headings, "Optional extensions" heading,
    course 13 Capstone · Interview Loop — matches S1-A at both breakpoints, 0
    console errors. Verdict: PASS.
  - Course-in-path: rail grouped (4 phase labels + "Optional extensions"),
    "COURSE 13 OF 116", current marked, Next keeps `?path=`; 375 drawer opened via
    click with the same 5 group labels — matches S2-A at both breakpoints, 0
    console errors. Verdict: PASS.
- Server stopped after the checks.

![Prod IR path en 375](./phase-8-prodbuild-ir-path-en-375px.png)
![Prod IR path en 1280](./phase-8-prodbuild-ir-path-en-1280px.png)
![Prod course in path en 375 (drawer open)](./phase-8-prodbuild-course-in-path-en-375px.png)
![Prod course in path en 1280](./phase-8-prodbuild-course-in-path-en-1280px.png)

## Manual API wire verification (tRPC over HTTP, DEV)

Commands from tech-docs/005 "Manual API Wire Checks (tRPC)" (output files renamed
`trpc-en.*` / `trpc-id.*` / `trpc-bad.*` under `local-tmp/ayokoding-learn/plan-02/`,
gitignored scratch; raw bodies kept there, never pasted here). One sanitized row
per case:

| Case                             | Status line                | Headers asserted                 | Fields asserted                                                                                                                                                                                                                                                                                                                         | Verdict |
| -------------------------------- | -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Success `en`                     | `HTTP/1.1 200 OK`          | `content-type: application/json` | `[0].result.data.json.manifests` has 8 entries; every entry has non-empty `phases` (each with `id`, `title`, `kind`, `courses`), `courseOrder` equal to the flattened phases, and `assumes`; 4 skills entries have one `all-courses` phase + `restructurePendingIn`; 4 career entries have no marker; `outlineCourseIds` has 62 entries | PASS    |
| Success `id` (input locale `id`) | `HTTP/1.1 200 OK`          | `content-type: application/json` | same 8 manifests with the same shape; `outlineCourseIds` has 62 entries                                                                                                                                                                                                                                                                 | PASS    |
| Failure (locale `xx`)            | `HTTP/1.1 400 Bad Request` | `content-type: application/json` | `[0].error.json.data.code` is `BAD_REQUEST`                                                                                                                                                                                                                                                                                             | PASS    |

No mismatch, so no route to Phase 4.

## Defects

Zero defects. Every acceptance above holds; every required screenshot is taken and
referenced in this file (46 total: 42 DEV + 4 production). No `MAN-###` findings.
`delivery.md` Phase 8 checkboxes left UNTIckED per instructions.

## Tester gates — UI Web Quality Gate + UX charters (tester subagent, 2026-10-12)

Gate: `ui-web-quality-gate`, mode `normal`, max-cycles 2. Ledger (uncommitted):
`local-tmp/quality/ui-web/ayokoding-learn-path-model-ui__20261012T1011Z.md`.
Charters (in order): exploratory (`swe-web-tester`, EWT), usability
(`swe-usability-tester`, UWT), design (`swe-web-tester`, DWT) — each in `en` and `id`.

Server substitution (recorded, no product files touched): DEV via hippo was pressure-shed
(`host pressure shed this work after the payload ran` + shedding the service child after a
memory warning); a direct DEV restart rendered the first route for 36+ min CPU without answering
under host load 5–10 (trace: Turbopack compile-path 5.7 s, then the application-code render
starved). The gates ran against the current production build (BUILD_ID 15:14, no tracked change
since) served by direct `npm exec nx -- run ayokoding-www:start` on port 3101 — the same server
shape as this file's production sign-off. First request 200 in 0.035 s.

Charter method: 15 live URLs fetched sequentially (all 200; `/id/learn/courses/...` for a course
with no `id` translation correctly 404s to the standard not-found page), structural assertions on
the HTML (116 continuous positions; 8 Outline badges all in extensions; 11 canonical assumes
links; arc preview; both hub straplines; skills pages flat with no phase chrome; `html[lang]`
correct), the 46 screenshots above at every breakpoint/locale, the prd.md hi-fi PNGs, and a live
tRPC success call (200, 8 manifests, phases flatten to `courseOrder`, 4 marked skills + 4
unmarked careers, 62 `outlineCourseIds`: ALL-OK). Rail/drawer/banner PrevNext behaviour is
client-rendered (SSR carries the unpathed fallback by architecture); it stands proven by the
screenshots above plus the E2E browser suite (rerun after the fixes).

### UI gate + charter defects (each repaired with a reproducing test, then ticked)

- [x] EWT-001 / G1 (exploratory + UI gate cycle 1, MEDIUM): phase `h2` accessible name runs the
      badge and title together ("Phase 1Programming and the command line") — live HTML
      `>Phase<!-- --> <!-- -->1</span>Programming`, no whitespace node; visual gap is `mr-2` only.
      Fixed: explicit `{" "}` after the badge span in `phase-section.tsx`; reproducing test asserts the
      full heading name "Phase 1 Fixture core (2 courses)". Targeted unit run 17/17 green.
- [x] UWT-001 / G2 (usability `id` + UI gate cycle 1, MEDIUM): phase course count hard-coded
      English on `id` pages — 18 `(N courses)`, 0 `(N kursus)` live; screenshot shows
      "FASE 1 ... (3 courses)". Every other chrome string on the component localizes.
      Fixed: new `pathsCourseCountOne/Other` keys (`1 course`/`{count} courses`;
      `1 kursus`/`{count} kursus`) + `format-template.ts` filler; reproducing test asserts
      "(2 kursus)" and no "courses" for `locale="id"`. Targeted unit run green.
- [x] UWT-002 / G3 (usability `id` + UI gate cycle 1, MEDIUM, preexisting): drawer-trigger
      `aria-label` hard-coded English on `id` pages (`path-banner.tsx:48`); visible text localizes.
      Plan 01's DWT-003 test pins the English name for `locale="id"`. Fixed here at root cause:
      new `pathsViewPathLabel` key in both locales (visible-label-first per WCAG 2.5.3); stale pin
      updated, new test asserts the Indonesian name. Targeted unit run green.

### Charter suggestions (triaged, not defects — no repair; owner decision)

- SG-001 (design): Core / Optional-extensions labels omit the course counts the S1-A hi-fi shows
  ("CORE · 25 COURSES"). The ratified build contract (tech-docs/006) settles the copy as 'a "Core"
  label' / 'an "Optional extensions" heading with a short note'; adding counts is a design-owner
  call (also touches E2E exact-text locators). Deferred with rationale.
- SG-002 (design): outcome lead-ins lack the hi-fi's bold weight. Same disposition as SG-001.

### Charter observations (not defects, no repair in scope)

- Every course link on the mirrored `id` path pages targets `/id/learn/courses/...`, but no `id`
  course translation exists, so each resolves to the standard not-found page. Targets are inherited
  unchanged from plan 01 (same `contentUrl` helper); missing translations are a content gap, not a
  defect in this delivery unit. The `id` not-found page renders English copy (preexisting app-shell
  surface outside this plan's file-impact tree).
- Addendum (post-fix prod spot-check, browser console): the `id` IR path page logs resource-404
  console errors for RSC-prefetched links to six untranslated courses
  (`sql-essentials`, `backend-essentials`, `data-structures-and-algorithms-essentials`,
  `version-control-and-git`, `just-enough-bash`, `just-enough-python`, each with `?path=` and
  `_rsc=`); same root cause as above — preexisting content gap, identical link targets before and
  after this plan, no in-scope repair (translating content or prefetch surgery are owner
  decisions). The DEV manual acceptance (zero console errors as measured) stands; `en` pages show
  zero console errors on prod too (landing, AI landing, course-in-path at 375 with drawer open).
  `webpack-hmr` WebSocket errors in the same log are playwright-harness noise (HMR client against
  a production server), not site errors.

## Cycle-2 re-audit (post-fix, rebuilt production server)

`BUILD` exit 0 (direct; tree changed by the three fixes), server restarted, all rows re-audited
live: G1 heading name "Phase 1 Programming and the command line (3 courses)"; G2 zero `(N
courses)` / 18 `(N kursus)` on the `id` page, hydrated heading "Fase 1 ... (3 kursus)"; G3 banner
name intact in `en`, drawer opens grouped with "Course 13 of 116". Regression sweep (arc, hub,
skills, AI, IE/FS) holds. Gate verdict: `PASS` (2 cycles, 0 open). Full ledger:
`local-tmp/quality/ui-web/ayokoding-learn-path-model-ui__20261012T1011Z.md` (uncommitted).
