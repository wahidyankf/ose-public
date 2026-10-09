# Business Requirements — Catalog and Metadata

## Problem

AyoKoding has 181 courses under `apps/ayokoding-www/content/en/learn/courses/`. A reader who wants
to pick one has three places to look, and none of them helps:

- **The courses page** (`/en/learn/courses`) is a generated list of 693 links: 181 course names, each
  followed by up to three sub-links (Overview, Learning, Drilling). There is no grouping, no summary,
  and no time estimate. The same course names still carry old catalogue numbers until plan 01 strips
  them.
- **The global sidebar** shows "Courses" as one flat list of 181 names. On a course page the reader
  scrolls a long list with no sense of where they are.
- **A course landing page** (for example `/en/learn/courses/sql-essentials`) shows the title, a
  generated list of the course's own pages, then a "Prerequisites" list and a "This course is part of"
  list at the bottom. It does not say what the course teaches, how long it takes, or where to begin.

The data to fix this does not exist in a usable form. Every course `_index.md` has exactly five
frontmatter keys today: `title`, `date`, `draft`, `weight`, and `prerequisites`. No course has a
description, a category, a format, or a time estimate.

## Who This Is For

- **New learners** who arrive at the courses page and need to choose a course without opening dozens
  of them.
- **Path followers** who land on a course from a path and want to know what it covers and how long it
  takes before they start.
- **Content maintainers and later plans (06–13)** who need one validated place to record a course's
  format and size, so tooling and quality gates can read it instead of guessing.

## User-Stated Requirements (verbatim intent)

- The user resolved decisions 20–23 for this plan on 2026-10-09 (listed below).
- "jangan kerjain/implement plan ini sebelum gw kasih perintah buat eksekusi ya" (user, 2026-10-09):
  do not implement this plan until the user gives the command to execute it.
- On the learning experience (user, 2026-10-09): "tampilan uinya, kayaknya juga oke kalo mau dirubah,
  biar gak kayak cuman 'kumpulan dokumen', tapi emang 'learning path'" — the UI may change so the site
  feels like a learning path rather than "a pile of documents". Plan 04 owns most of that; this plan's
  catalog and header are its first visible step.
- On tooling (user, 2026-10-09): deterministic tooling belongs in `apps/ayokoding-cli` (plan 05);
  plans 02 and 03 keep their validation inside the app's existing TypeScript core and tests, and may
  name a later `ayokoding-cli` subcommand as a follow-up, never ad-hoc scripts.

## Resolved Series Decisions This Plan Relies On

These were resolved by the user on 2026-10-09. They are copied here so this plan stands alone.

| #   | Decision (as resolved)                                                                                                                                                                       | How this plan uses it                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Strip `NN ·` from all course titles; the only visible order number is the position within the active path.                                                                                   | Catalog cards and the sidebar show stripped titles and no numbers.                 |
| 15  | Marker: explicit `status: outline` frontmatter (62 courses today), schema-validated, used by tests and UI. (Owned by plan 02.)                                                               | Read-only here: outline courses show the Outline badge and skip two fields.        |
| 19  | Sharia sources: cite AAOIFI and recognized fatwa bodies, show madhhab and jurisdiction differences, never issue rulings, flag points needing a Sharia board decision.                        | Sharia course descriptions describe system behaviour only and state no ruling.     |
| 20  | Courses landing = catalog grouped by category; a card shows title, one-line description, format, estimated time, and the paths that use the course; no Overview/Learning/Drilling sub-links. | The catalog page.                                                                  |
| 21  | Course metadata in each course `_index.md`: `category`, `description`, `estimatedHours`, `status`; schema-validated.                                                                         | The metadata schema and backfill; `status` comes from plan 02.                     |
| 22  | Global sidebar "Courses" grouped by category, collapsible.                                                                                                                                   | The grouped sidebar.                                                               |
| 23  | Course landing page: header (description, prerequisites, format, estimated time, paths) and a "Start" button to the first learning page; structure tree below.                               | The course header and the Start rule.                                              |
| 26  | Every course ends complete, pedagogically sound, with solid code.                                                                                                                            | Out of scope here; plans 06–13. The drift test keeps metadata honest as they work. |
| 27  | Course definition of done follows the course's mode: by-example, primer, annotated-concept (including the no-code sub-mode), or in-the-field.                                                | The `format` field names that mode.                                                |
| 35  | Courses are English only; `content/id/**` is untouched.                                                                                                                                      | No Indonesian content changes.                                                     |
| 37  | Deterministic tooling lives in `apps/ayokoding-cli` (plan 05); plans 02 and 03 keep validation in the app's TS core and tests.                                                               | Validation and the estimate formula live in `src/features/content/core/`.          |
| 38e | Progress and status are conveyed in text, not only color; keyboard operable; respects reduced motion; works at phone width.                                                                  | Applied to the catalog, sidebar groups, and header now.                            |

Decision 38 (the learning experience) belongs to plan 04. Its item 38d asks the Learn home for a
"Browse all courses" entry to this plan's catalog, and its closing note says "the course landing
header from plan 03 shows course progress and turns 'Start' into 'Continue' when started". This plan
therefore builds the header with slots plan 04 can fill.

## Evidence (measured 2026-10-09 in the authoring worktree at `bb7f90137`)

| Fact                                                                 | Value                                                                | Source                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Course directories                                                   | 181                                                                  | `apps/ayokoding-www/content/en/learn/courses/*/`                     |
| Frontmatter keys on every course `_index.md`                         | `title`, `date`, `draft`, `weight`, `prerequisites` (181 each)       | each `courses/<slug>/_index.md`                                      |
| Links in the courses page source                                     | 693 (181 courses + 512 sub-links) in 701 lines                       | `content/en/learn/courses/_index.md`                                 |
| Course depth (words in all `.md` files)                              | 62 under 1,000; 46 from 1,000 to 9,999; 73 at 10,000 or more         | word count per course directory                                      |
| Courses with `learning/overview.md`                                  | 169                                                                  | per-course file check                                                |
| Courses without `learning/overview.md` but with `learning/capstone/` | 8 (all skeleton capstones)                                           | per-course file check                                                |
| Courses with no `learning/` folder (top-level `overview.md` only)    | 4 capstones                                                          | per-course file check                                                |
| Courses used by at least one path manifest                           | 181 of 181                                                           | `src/features/course-paths/manifests/**/*.json`                      |
| Historical format records (`**Format**` in done-plan syllabi)        | 159 courses: By Example 93, Annotated-concept 31, Primer 16, none 19 | `plans/done/*/syllabus/courses/*.md`                                 |
| Courses that call themselves "leadership no-code sub-mode"           | 7                                                                    | each course's `learning/overview.md` first paragraph                 |
| Non-outline estimate with the selected formula                       | 119 courses; median 3 h; range 1–20 h; total 529 h                   | [tech-docs/004](./tech-docs/004-estimated-hours-and-start-target.md) |

The series brief said the courses page had "about 880" links; the measured count on 2026-10-09 is 693.
This plan uses the measured number.

## Business Goals and Success Measures

| Goal                                           | Measure (checked at execution)                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| A reader can choose a course from one page.    | `/en/learn/courses` shows 14 category sections and 181 cards; each card has the five facts from decision 20.              |
| The catalog is lighter than today's link dump. | The catalog has exactly 181 course links in `main` (down from 693) plus 14 jump links.                                    |
| The sidebar stops being a 181-row list.        | On `/en/learn/courses`, the Courses section shows 14 closed group buttons; on a course page, one group is open.           |
| A reader knows where to begin.                 | Every course landing page has a "Start course" link that resolves to an existing page (checked for all 181).              |
| Metadata stays true as content changes.        | `ayokoding-www:test:unit` fails when any course lacks a field or when a stored `estimatedHours` differs from the formula. |

## Business Risks

| Risk                                                              | Mitigation                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estimated hours look too precise or too low for a beginner.       | Show "About N h"; the catalog intro says estimates count reading and working through examples; the formula is documented and tested.             |
| Plans 06–13 forget to update metadata when they rewrite a course. | The drift test fails in `test:quick` and prints the expected values; [README](./README.md#what-later-plans-must-keep-true) names the obligation. |
| Category names become a debate that never ends.                   | A small fixed list in code, with a revisit trigger in [tech-docs/007 D3](./tech-docs/007-decision-records.md#d3--category-taxonomy).             |
| Plan 02 slips and this plan waits.                                | D1 makes the wait explicit at Phase 0 instead of silently diverging the `status` contract.                                                       |
| Sharia accounting and ERP descriptions read as rulings.           | Descriptions are neutral and describe system behaviour only; none states what is permitted (decision 19 is respected).                           |
