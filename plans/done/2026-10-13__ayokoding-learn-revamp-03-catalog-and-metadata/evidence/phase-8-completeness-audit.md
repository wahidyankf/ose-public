# Phase 8 — Preliminary Completeness Audit (plan 03)

Traces every PRD requirement and Gherkin scenario through as-built artifacts and proof.
Checked boxes alone are not proof; the proof column cites the evidence.

## Functional requirements

| Req   | Statement (short)                                                     | As-built                                         | Proof                                                                |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| FR-01 | Every course has valid `category` + `description`                     | 181 backfilled `_index.md`                       | Corpus guard green (unit 19/19, integration real-corpus)             |
| FR-02 | Non-outlines have `format` + `estimatedHours` 1–200                   | Same backfill                                    | Same guard                                                           |
| FR-03 | Outlines may omit, declared fields validated                          | Schema + guard early-return                      | Unit outline scenarios (both twins)                                  |
| FR-04 | `estimatedHours` equals computed estimate                             | Backfill from expected-hours table               | Guard prints expected on drift; demo `phase-6-guard-stale-hours.txt` |
| FR-05 | Catalog page: intro, 14 jump links, sections in order, cards by title | `course-catalog.tsx`, `course-catalog.ts`        | E2E catalog specs green (all browsers)                               |
| FR-06 | Card contents; outline badge; whole card one link                     | `course-catalog.tsx`, `course-meta-row.tsx`      | Same E2E + unit                                                      |
| FR-07 | Unknown category renders under Other; guard keeps it empty            | `groupByCourseCategory` + guard                  | Unit grouping tests + guard green                                    |
| FR-08 | Sidebar/drawer category groups; disclosure; only current open         | `course-category-groups.tsx`, `sidebar-tree.tsx` | E2E sidebar specs (4) incl. keyboard, all browsers                   |
| FR-09 | Course header: description, meta, Start, prerequisites, paths         | `course-header.tsx`, `course-header-data.ts`     | E2E header specs (7), all browsers                                   |
| FR-10 | Start target rule; no button when none qualifies                      | `course-start.ts` rules 1–4                      | Unit (5 incl. null rule) + E2E Start scenarios                       |
| FR-11 | Contents heading after header; no bottom-list repeat                  | `course-page-content.tsx`                        | E2E "page list stays below header"                                   |
| FR-12 | No header inside courses                                              | Same dispatch                                    | E2E "pages inside a course have no header"                           |
| FR-13 | Generator keeps catalog `_index.md` frontmatter-only                  | `index-generator.ts` special-case                | Index-generation scenario (unit+integration) + `validate-indexes`    |
| FR-14 | `content.getTree` gains optional `category` only                      | Nav schema + repository/tree-builder             | Navigation-api scenario + contract `010` + wire recipe               |
| FR-15 | Header `primaryAction`/`progress` slots for plan 04                   | `course-header.tsx` props                        | Unit "renders both plan-04 slots"                                    |

## Non-functional requirements

| Req                              | Proof                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| NFR-01 static generation         | Production build prerenders catalog/sidebar/header; E2E ran against it              |
| NFR-02 WCAG AA landmarks/names   | `aria-expanded`/`aria-controls` unit+E2E; region landmark unit; text-not-color meta |
| NFR-03 keyboard                  | E2E keyboard scenario green on all browsers (networkidle fix committed)             |
| NFR-04 no layout shift           | Initial open state from pathname (server/client match); unit-covered                |
| NFR-05 375px one card, no scroll | E2E phone scenario green                                                            |
| NFR-06 reduced motion            | `motion-safe:` chevron; no scroll animation (verification notes)                    |
| NFR-07 tolerant runtime parse    | Typo unit scenarios + E2E typo scenario; page stays visible                         |
| NFR-08 ≥99% unit line coverage   | `test:unit` exit 0 with `--coverage.thresholds.lines=99`                            |

## Gherkin (24 scenarios + appends)

`course-catalog` (6), `course-landing-header` (7), `sidebar-course-categories` (4),
`course-metadata` (5), index-generation append (1), navigation-api append (1) — every
scenario bound in Unit; non-exempt scenarios bound in Integration and E2E; all three
static coverage validators green; every runtime suite green.

## Gate reconciliation

- Phase 5 granular boxes: Playwright MCP was unavailable in this environment; each manual
  assertion maps to a green Playwright assertion over the same pages/breakpoints/locales
  (recorded at the Phase 5 Gate). Screenshots absent for the recorded reason.
- Phase 4 method sub-clauses (e.g. agent fan-out shape): superseded by outcome — 181 files
  backfilled, guard green, reconciliation in `phase-4-backfill.md`, re-verified in Phase 7.
- EWT/UWT/DWT/AET labels: the executed tester battery (UI static gate + backend probe gate
  - Playwright suites) closed every finding; no open boxes in either follow-ups section.
- Rollback: revert-the-merge (PR body). Knowledge capture: `learnings.md` triaged and routed.
- Remaining pending proof (post-delivery): merge commit, post-merge `origin/main` CI,
  production deploy run, live production visual check — registered below as the terminal
  audit task; the goal stays active until they are proven.
