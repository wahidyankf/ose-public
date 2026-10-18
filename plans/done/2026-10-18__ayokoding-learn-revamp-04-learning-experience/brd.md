# Business Requirements — AyoKoding Learn Revamp 04: Learning Experience

## Business Goal

AyoKoding should feel like a place where a learner follows a path from start to finish, not a
folder of documents. A learner should always know three things: where they are, how far they have
come, and what to do next. The user said so on 2026-10-09:

> "tampilan uinya, kayaknya juga oke kalo mau dirubah, biar gak kayak cuman 'kumpulan dokumen', tapi
> emang 'learning path'" — the UI may change so it is a real learning path, not a pile of documents.
>
> "tampilan di https://www.ayokoding.com/en/learn kayaknya perlu diubah gitu kali yak?" — the
> `/en/learn` page probably needs to change too.
>
> "tapi tandai selesainya juga bisa di 'uncentang' ya" — marking something done must be reversible.

The site has no accounts and the user does not want any. Progress therefore lives in the reader's own
browser and is never sent anywhere.

## Problem and Impact

Evidence gathered on 2026-10-09 in the authoring worktree.

| Problem today                                                                                                                                                                                                                          | Impact on the learner                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/en/learn` renders the generated body of `content/en/learn/_index.md`: 201 lines, about 180 links (paths, careers, skills, then every course).                                                                                        | The front door is a long link list. A new learner cannot see where to start.              |
| A separate page, `/en/learn/overview` (`content/en/learn/overview.md`, weight 100), explains the "three buckets" in text.                                                                                                              | The useful explanation is one click away from the page that needs it.                     |
| A path page lists its courses as one numbered list (plan 02 adds phase headings, but no progress).                                                                                                                                     | A learner cannot see how far along they are or which course is next.                      |
| Inside a course, the only navigation is "previous / next sibling in the same folder" (`computePrevNext` in `content/core/tree-builder.ts`). There is no reading order across `learning/` and `drilling/`, and no way to mark progress. | A learner on the last page of a folder hits a dead end and must find the next page alone. |
| Path context (`?path=`) is lost on every inner lesson page: `courseIdFromSlug` returns `x/learning/overview` for those pages, which matches no manifest.                                                                               | Once a learner opens a lesson, the page no longer says which path or phase it belongs to. |
| The course landing header from plan 03 always says "Start course".                                                                                                                                                                     | A returning learner is sent back to the first page.                                       |

## Affected Roles

- **Learners on a path** (career or skills): need a roadmap, progress, and a single "continue" action.
- **Learners browsing single courses**: need course progress and in-course navigation, without a path.
- **Returning learners**: need a "Continue learning" entry on the Learn home.
- **Maintainers**: need the change to stay inside the existing app architecture, with tests at every
  layer and no new server state.

## Success Metrics

Observable at delivery, checked by tests and manual verification:

1. `/en/learn` shows no list of individual courses; it shows path cards and one "Browse all courses"
   entry (E2E).
2. On a path page, every core phase shows an outcome (when the manifest has one), "x of y done", and
   course cards with status in words (E2E, both with and without stored progress).
3. From any learning page, "Mark complete & continue" reaches the next page; from a course's last
   page in a path, it reaches the next course; at the end of the path, it reaches the path page (E2E).
4. Un-checking a page removes it from every progress count on every screen (E2E).
5. Blocking storage leaves every page usable and shows a one-line notice (E2E).
6. No network request carries progress data (E2E request log).
7. No hydration error in the console and no layout shift in the new slots between the server render
   and the hydrated render (E2E bounding-box comparison; CLS threshold 0.1 from web.dev, accessed
   2026-10-09).
8. axe WCAG 2 A/AA scans of the four changed screens report zero violations (E2E).

There is no analytics; adoption is not measured, by design.

## Business Non-Goals

- Accounts, sync, gamification (streaks, points, badges), certificates.
- Collecting any learner data.

## Business Risks

| Risk                                                                                     | Mitigation                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Learners expect progress to follow them to another device.                               | Every progress surface says "saved in this browser"; the Learn home explains it next to "Reset progress".                                                                                  |
| Private browsing or blocked storage loses progress.                                      | The UI keeps working in memory for the session and shows a notice; nothing breaks. MDN documents both cases (see [tech-docs/002](./tech-docs/002-progress-store-schema-and-migration.md)). |
| Content edits rename or remove pages, so stored progress points at pages that are gone.  | Counts include only pages that exist today; stale keys are ignored, never shown, and never break a page.                                                                                   |
| Plans 02 or 03 land with names that differ from this plan's assumptions.                 | Phase 0 reconciles every consumed contract on `main` and stops if a required contract is missing.                                                                                          |
| Replacing the careers arc chooser and the path cards changes pages readers already know. | The arc grouping stays (one section per arc, heading links to the arc page). Copy for skills paths does not change (decision 39).                                                          |
