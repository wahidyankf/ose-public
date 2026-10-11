# Phase 8 Evidence — Manual Verification and Tester Gates

## Environment (recorded deviation)

The host's dev server proved unusable for long interactive sessions (compiled `5.0min` per route,
then wedged every request at `000` under memory pressure). All Phase 8 verification therefore ran
against the **same branch's plain production build, served locally by `ayokoding-www:start`**
(nx service class, plain `nx run ayokoding-www:build` without the e2e fixture env, 3270 static
pages, BUILD_ID `mAmU94kB0ExKNcDj32-80`). What a production visitor gets and what was verified are
byte-identical bundles; the deviation is recorded here and in the delivery checklist notes.

## Manual matrix (Playwright script `phase8-manual.mjs`, headless chromium, 1280×800 heights)

24 of 25 checks passed on their first corrected run; the failing probe was a test-artifact (the
hidden desktop rail node matched `.first()` for the "Course 85 of 116" readout at 375px) — the
drawer behaviour was then verified live with the interactive browser and the resulting screenshot
is the evidence below. **Zero console errors on every page in both locales** (hydration warnings
counted — none fired).

| Check                                                                                                                                                        | en/id | px           | Result                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------ | ----------------------------------- |
| Path syllabus rows 1…116, no number inside any title, `html[lang]`                                                                                           | en    | 375/768/1280 | PASS ×3                             |
| Course-in-path readout "Course 85 of 116", row 85 visible + ▸ highlighted without scrolling, h1 "Distributed Systems", page top, no numbered titles in links | en    | 768/1280     | PASS ×2                             |
| 375: banner "on path · course 85 of 116"; View-path drawer open with row 85 visible/highlighted                                                              | en    | 375          | PASS (MCP-verified; probe artifact) |
| Courses index: no title starts with a number                                                                                                                 | en    | 375/768/1280 | PASS ×3                             |
| Headings in heading colour, no underline; inline code without backticks (all inline `<code>` elements checked); fenced block present                         | en    | 375/768/1280 | PASS ×3                             |
| Learn sidebar order Overview → Paths → Courses → Legacy                                                                                                      | en    | 1280         | PASS                                |
| References section + working source links; no "Accuracy notes"/tags                                                                                          | en    | 375/768/1280 | PASS ×3                             |
| `html[lang="id"]`, headings not link-styled, inline code without backticks                                                                                   | id    | 375/768/1280 | PASS ×3                             |
| Id blog content page language                                                                                                                                | id    | 1280         | PASS                                |
| Indonesian sidebar present with unchanged order (Ikhtisar first)                                                                                             | id    | 1280         | PASS                                |

## Screenshots (referenced per the checklist item)

Path syllabus (en): ![375](./phase-8-path-syllabus-en-375px.png) ![768](./phase-8-path-syllabus-en-768px.png) ![1280](./phase-8-path-syllabus-en-1280px.png)

Course in path (en): ![375](./phase-8-course-in-path-en-375px.png) ![768](./phase-8-course-in-path-en-768px.png) ![1280](./phase-8-course-in-path-en-1280px.png)
— the 375 capture shows the open pocket drawer with row 85 highlighted (▸ Distributed Systems) and
the numbered rows beside titles.

Courses index (en): ![375](./phase-8-courses-en-375px.png) ![768](./phase-8-courses-en-768px.png) ![1280](./phase-8-courses-en-1280px.png)

Content typography (en, just-enough-nvim): ![375](./phase-8-content-en-375px.png) ![768](./phase-8-content-en-768px.png) ![1280](./phase-8-content-en-1280px.png)

Learn order (en): ![1280](./phase-8-learn-order-en-1280px.png)

References (en): ![375](./phase-8-references-en-375px.png) ![768](./phase-8-references-en-768px.png) ![1280](./phase-8-references-en-1280px.png)

Content (id, relator): ![375](./phase-8-content-id-375px.png) ![768](./phase-8-content-id-768px.png) ![1280](./phase-8-content-id-1280px.png)
Id blog page: ![1280](./phase-8-content-id-2-1280px.png)
Learn order (id): ![1280](./phase-8-learn-order-id-1280px.png)

## Rendered production sign-off (server = the plain production build above)

The manual matrix and these six subset captures come from the same server that serves the plain
production build, so the "rendered production sign-off" and the matrix share one server pass:

Course in path: ![prodbuild en 375](./phase-8-prodbuild-course-in-path-en-375px.png) ![prodbuild en 1280](./phase-8-prodbuild-course-in-path-en-1280px.png) ![prodbuild id 375](./phase-8-prodbuild-content-id-375px.png) ![prodbuild id 1280](./phase-8-prodbuild-content-id-1280px.png)
Content: ![prodbuild en 375](./phase-8-prodbuild-content-en-375px.png) ![prodbuild en 1280](./phase-8-prodbuild-content-en-1280px.png)

Matches the selected designs in prd.md (number gutter syllabus, numbered rail with auto-scroll,
backtick-free inline code, un-link-styled headings, References section).

## Tester gates

(append findings below as they land)

| Gate                | Agent                                                                  | Cycle | Findings                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI Web Quality Gate | swe-web-tester (spec charter judge role, `ui-web-quality-gate.md`)     | 1     | judged via the EWT exploratory sat run: EWT-003 (fixed in `mobile-nav.tsx`), EWT-004 (id-course 404 spec-gap, routed to follow-ups)                                                 |
| EWT                 | swe-web-tester (exploratory charter, `ses_ed4144077ffevsbI9j1erA5n8O`) | 1     | 2 findings (0 BLOCKER); zero-finding surfaces per prd S1–S10 except the two above                                                                                                   |
| UWT                 | swe-usability-tester (`ses_ed4144076ffeyjX6h03krY2YNC`)                | 1     | 10 findings: UWT-005 + UWT-008 fixed with Gherkin/unit/e2e regressions; the rest triaged as pre-existing/out-of-plan (recorded with reasons); USS-001 recorded as a spec-suggestion |
| DWT                 | swe-web-tester (design charter, `ses_ed4144076ffdGATIHyqRLV1y4T`)      | 1     | 5 findings (no Major+; isolated browser): DWT-001 + DWT-003 fixed; DWT-002/004/005 triaged (pre-existing layout, mockup/dispute, rule-prescribed form)                              |

Fix summary (with regression tests): inline-code chip `overflow-wrap:anywhere` + bounded rail scroll
region (pinned readout) + syllabus `text-primary` + drawer close-on-pick + `aria-describedby=null`.
New Gherkin: "Course content never scrolls the document horizontally at 375" (unit structural +
e2e measured) and "Picking a course in the pocket drawer closes the drawer" (unit click binding +
e2e real-browser flow), both bound in all three browsers. The S5 e2e fixture viewport was re-derived
(200 → 320) for the new fixed rail geometry; arithmetic documented in the step comment.

Post-fix reruns: unit tier 80/80 (fe-steps) + 21/21 path-order-nav; tsc clean; targeted chromium
runs green; full `E2E` + `QUICK` reruns recorded in the subsequent checklist items.
