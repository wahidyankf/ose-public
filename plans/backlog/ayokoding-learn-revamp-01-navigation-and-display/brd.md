# Business Requirements — AyoKoding Learn Revamp 01: Navigation and Display

## Business Goal

AyoKoding's Learn section must feel usable and trustworthy to a learner on day one. The user asked
for Learn to be "usable and reasonable: no confusing numbering, clear structure, clear entry
points". This plan removes the most visible confusion in the existing UI before the larger series
work (path model, catalog, learning experience, course rewrites) starts.

## Problem and Impact

| Problem (measured 2026-10-09)                                                                               | Impact on learners                                                             |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 73 course titles carry old catalogue numbers (`46 · Distributed Systems`) and 3 carry old "Pass N" ordinals | Three numbering systems on one page; the number contradicts "course 85 of 116" |
| The path syllabus and sidebar show no position number                                                       | Learners cannot see where a course sits in a 116-course path                   |
| The desktop path sidebar does not scroll to the current course (about 4150 px down at course 85)            | Learners lose their place and must scroll the sidebar by hand on every page    |
| Overview is listed last in the Learn sidebar                                                                | The introduction is the hardest entry to find                                  |
| Section headings look like links; inline code shows bold text with literal backticks                        | Pages are harder to scan and look broken                                       |
| 153 course files (42 courses) expose internal "Accuracy notes" and tags such as `[Unverified]`              | Readers see internal process notes and jargon, which lowers trust              |

## Affected Roles

- **Learners** following career or skills paths, or reading single courses.
- **The maintainer**, who edits course content and must not reintroduce these problems.

## Business-Level Success Metrics

- Every published English course title has no leading number (observable: the hygiene unit test and
  the `/en/learn/courses` page).
- On a path page and a course page in path context, the only course order number shown is the
  position in that path (observable: manual browser check on the four verification URLs).
- A learner opening course 85 of 116 sees it in the sidebar without scrolling (observable: manual
  check and the S5 browser test).
- No published course page contains "Accuracy notes" or an internal confidence tag (observable: the
  hygiene unit test reports zero hits).

We expect these changes to reduce confusion for new learners; no baseline survey was measured, so
the metrics above are pass/fail observations, not percentages.

## Business-Scope Non-Goals

- No new learning features (progress, roadmap, catalog) in this plan; plans 02–04 own them.
- No change to what a course teaches; course rewrites are plans 06–13.
- No Indonesian (`id`) content change.

## Business Risks

| Risk                                                                 | Mitigation                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Removing "Accuracy notes" hides that some facts were never confirmed | Every unconfirmed claim keeps a plain-language caveat; the repository rule forbids presenting it as confirmed |
| Learners who memorised old catalogue numbers no longer find them     | The numbers had no meaning outside an old list; titles stay unchanged otherwise, and search uses titles       |
| Interim fixes (Overview order) are redone by plan 04                 | The fix is a three-line weight change, so the throwaway cost is small                                         |
