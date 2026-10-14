# 004 — UI Components and Copy

All paths are under `apps/ayokoding-www/src/`. "Selected" options refer to the design funnel in
[prd.md](../prd.md#ui-design-funnel). Strings use `t(locale, key)` or plan 03's `tf(locale, key,
values)` for `{placeholder}` keys.

## Shared Rules

- **Fixed-size slots.** Every element whose content depends on stored progress sits in a box with a
  fixed height per breakpoint (`h-*` in `rem`, never content-sized). While the snapshot is `unknown`
  the box shows `ProgressPlaceholder` blocks. After hydration only the inside changes, so nothing
  below moves (S8).
- **Status in words.** Every status uses `CourseStatusLabel`: an icon with `aria-hidden="true"`
  (✓, ◐, ○ drawn with lucide `CircleCheck`, `CircleDashed`-style half icon, `Circle`) followed by the
  word. Colour (green-700 done, amber-700 in progress, muted not started) is only a second signal.
- **Bars are decoration.** `ProgressMeter` is `aria-hidden="true"`; the visible text next to it
  ("3 of 13 core courses done") carries the value (S35).
- **Motion.** Width changes use `motion-safe:transition-[width] motion-safe:duration-300`; nothing
  else animates; placeholders do not pulse (S37).
- **Targets.** Buttons and primary links are at least `min-h-11` (44 px) and full width below `sm`
  (S38).
- **Links in path context** always carry `?path=` through `contentUrl(locale, slug, pathId)`.

## Learning-Progress Components (`features/learning-progress/shell/`)

| Component               | Kind   | Props                                                                                                    | Renders                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProgressMeter`         | server | `value: number; max: number; tone: "primary" \| "progress" \| "done"`                                    | Track `h-2 rounded-full bg-muted` with a fill whose width is `value / max`; `aria-hidden`. `max = 0` renders an empty track.                                                                                                                                                                                                                                                                   |
| `CourseStatusLabel`     | server | `status: CourseStatus; locale; size?: "sm" \| "md"`                                                      | Icon plus `statusDone` / `statusInProgress` / `statusNotStarted`.                                                                                                                                                                                                                                                                                                                              |
| `ProgressPlaceholder`   | server | `className` (width and height)                                                                           | `<span aria-hidden="true" class="inline-block rounded bg-muted">`.                                                                                                                                                                                                                                                                                                                             |
| `StorageNotice`         | client | `locale`                                                                                                 | `progressStorageUnavailable` in `text-sm text-muted-foreground` when the snapshot has `persisted: false`; otherwise nothing, inside a fixed `h-5` slot.                                                                                                                                                                                                                                        |
| `LessonContextProvider` | client | `locale; courseId; courseTitle; pagePath; sequence: LessonPage[]; initialPathData: CoursePathClientData` | Reads `useSearchParams`, `useRuntimeCoursePathData`, and `useLearningProgress`; resolves the path context ([003](./003-active-path-and-navigation.md#active-path-rule)); records the visit; shares the result through React context.                                                                                                                                                           |
| `ContextBar`            | client | none (reads the provider)                                                                                | `<nav aria-label={contextBarLabel}>`, fixed `h-[4.75rem] sm:h-14`. Path mode row 1: path title link › "Phase n · title" link (`#phase-<id>` on the path page; extension phases show the title only) › `contextCourseOf` link. Canonical mode row 1: course title link. Row 2: `contextPageOf` · `progressPagesDone` and a `ProgressMeter`. Below `sm` the path title is its own truncated row. |
| `LessonNav`             | client | none (reads the provider)                                                                                | `<nav aria-label="Page navigation">` with the Previous link, the toggle, the primary link and its second line, and the `role="status"` region ([003](./003-active-path-and-navigation.md#lesson-navigation)). Stacks full width below `sm` in the order primary, toggle, Previous.                                                                                                             |
| `CourseProgressSummary` | client | `locale; courseId; sequence: readonly string[]`                                                          | Plan 03 `progress` slot: `CourseStatusLabel`, `progressPagesDone`, `ProgressMeter`, `progressSavedInBrowser`. Fixed `h-16`.                                                                                                                                                                                                                                                                    |
| `CourseProgressAction`  | client | `locale; courseId; sequence: LessonPage[]; startSlug: string \| null; pathId: string \| null`            | Plan 03 `primaryAction` slot: "Start course" (server and nothing done), `courseContinueCourse` with the next page title, or `courseReviewCourse`. One line, `truncate`.                                                                                                                                                                                                                        |
| `ContinueLearningCard`  | client | `locale; manifests; courseTitles; sequences: SequenceIndex`                                              | Learn home card, fixed `h-44 sm:h-32`, three modes ([003](./003-active-path-and-navigation.md#learn-home-card)). Server render: start mode.                                                                                                                                                                                                                                                    |
| `ResetProgressControl`  | client | `locale`                                                                                                 | "Reset progress…" button opening web-ui `Dialog`: title `resetDialogTitle`, body `resetDialogBody`, buttons `resetCancel` (initial focus) and `resetConfirm`. On confirm: `store.reset()`, close, status message `resetDone`, focus back on the button.                                                                                                                                        |
| `LearnHome`             | server | `locale; title; description; manifests; contentMap; sequences; catalogCounts`                            | Screen 3 option A ([prd.md](../prd.md#screen-3--learn-home)).                                                                                                                                                                                                                                                                                                                                  |

## Course-Paths Components (`features/course-paths/shell/`)

| Component              | Kind   | Change | Notes                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PathRoadmap`          | server | new    | Screen 1 option A. Props: `locale; manifest; courseCards: Record<courseId, RoadmapCourseData>; sequences; bodyHtml?`. Keeps the `<nav aria-label="… syllabus">` wrapper name plan 02 relies on. For a pending-restructure skills path, renders one flat course list with no phase heading, outcome, or extensions block (S26), keeping plan 01 numbering and plan 02 copy. |
| `RoadmapProgressCard`  | client | new    | `progressYourProgress`, the headline (`progressCoreCoursesDone`, `progressCoursesDone` in flat mode, or `progressCoreComplete`), a meter, and the primary button (`roadmapStart` / `roadmapContinue`, absent when core is complete). Fixed `h-40 sm:h-36`. Server render: start button to the first core course.                                                           |
| `RoadmapPhase`         | server | new    | Core: `<section aria-labelledby id="phase-<id>">`, `h3` "{pathsPhaseLabel} n · title", outcome lines with plan 02's keys, client `PhaseProgress` (status label, `progressPhaseDone`, meter), and an `<ol>` of `RoadmapCourseCard`. Extension: `<details>` with `<summary>` (title, course count, client `PhaseProgress`) and the same `<ol>`.                              |
| `RoadmapCourseCard`    | server | new    | Plan 01 `PathPositionNumber`, `h4` title link (the only link; `after:absolute after:inset-0` overlay), plan 03 `CourseMetaRow` (format and "About N h", or `OutlineBadge`), client `CourseCardStatus` (status label or placeholder).                                                                                                                                       |
| `LearnPathCard`        | server | new    | Title link, the manifest `description` (already a "who it is for" sentence), "Goal:" with goal course titles when `goals` exists, `pathCardPhases` · `pathCardOptional` (or `roadmapCoursesCount` in flat mode) · "About H h" (plus `roadmapHoursPlusOutline` when some core course has no estimate), client `PathCardProgress`, and "View path →".                        |
| `path-landing.tsx`     | server | edit   | Renders `PathRoadmap` in place of the list. Plan 02's `PhaseSection` is no longer used here (kept if other callers remain; Phase 4 removes it when unused).                                                                                                                                                                                                                |
| `path-card.tsx` hub    | server | edit   | `CategorySection` and `ArcGroup` render `LearnPathCard`. The `hero` variant used by the site home stays `PathCard`.                                                                                                                                                                                                                                                        |
| `category-landing.tsx` | server | edit   | Careers: `ArcCard` chooser replaced by `CareersArcSections` (one `section` per arc: `h2` arc title linking to the arc page, then that arc's `LearnPathCard`s). Skills: `PathCard` replaced by `LearnPathCard`; the statement text and `RampMilestoneStrip` stay unchanged (decision 39).                                                                                   |
| `arc-landing.tsx`      | server | edit   | `PathCard` replaced by `LearnPathCard`; the single-role `SyllabusPreview` stays below the card.                                                                                                                                                                                                                                                                            |

### Path Hours

`About H h` = sum of `estimatedHours` over core courses (all courses in flat mode). Outline courses
have no estimate (plan 03); when `k > 0` core courses lack one, append `roadmapHoursPlusOutline` with
`{count} = k`. Hours are computed on the server.

## Changes to Existing App Files

- `features/content/shell/course-page-content.tsx`: new optional prop `lesson?: LessonProps`. When
  present: render `LessonContextProvider` around `ContextBar` (above the `h1`, below the breadcrumb)
  and `LessonNav` (in place of `PrevNext`), plus `StorageNotice` under the bar. When absent: unchanged.
- `features/course-paths/shell/course-page-path-content.tsx`: forwards `lesson` like other props.
- `app/[locale]/(content)/[...slug]/page.tsx`: dispatch changes in
  [001](./001-current-state-and-architecture.md#route-dispatch-changes-pagetsx).
- `features/course-paths/shell/course-header.tsx` (plan 03): no change; it already accepts
  `progress` and `primaryAction`.

## Translation Keys

Added to both dictionaries in `features/i18n/core/translations.ts`. `{…}` placeholders are filled with
`tf`. Indonesian strings follow plan 02's terms ("Fase", "Kerangka") and are reviewed in the PR.

| Key                          | en                                                                          | id                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `statusDone`                 | Done                                                                        | Selesai                                                                                            |
| `statusInProgress`           | In progress                                                                 | Sedang berjalan                                                                                    |
| `statusNotStarted`           | Not started                                                                 | Belum dimulai                                                                                      |
| `progressSavedInBrowser`     | Saved in this browser                                                       | Tersimpan di browser ini                                                                           |
| `progressYourProgress`       | Your progress (saved in this browser)                                       | Progres Anda (tersimpan di browser ini)                                                            |
| `progressCoreCoursesDone`    | {done} of {total} core courses done                                         | {done} dari {total} kursus inti selesai                                                            |
| `progressCoursesDone`        | {done} of {total} courses done                                              | {done} dari {total} kursus selesai                                                                 |
| `progressCoreComplete`       | Core path complete. The optional extensions are below.                      | Jalur inti selesai. Pendalaman opsional ada di bawah.                                              |
| `progressPhaseDone`          | {done} of {total} done                                                      | {done} dari {total} selesai                                                                        |
| `progressPagesDone`          | {done} of {total} pages done                                                | {done} dari {total} halaman selesai                                                                |
| `progressStorageUnavailable` | Progress can't be saved in this browser. It lasts until you close this tab. | Progres tidak bisa disimpan di browser ini. Progres hanya bertahan sampai tab ini ditutup.         |
| `roadmapStart`               | Start: {title}                                                              | Mulai: {title}                                                                                     |
| `roadmapContinue`            | Continue: {title}                                                           | Lanjutkan: {title}                                                                                 |
| `roadmapCoreHeading`         | Core path · {count} phases                                                  | Jalur inti · {count} fase                                                                          |
| `roadmapCoursesCount`        | {count} courses                                                             | {count} kursus                                                                                     |
| `roadmapHoursPlusOutline`    | plus {count} outline courses                                                | ditambah {count} kursus kerangka                                                                   |
| `roadmapGoal`                | Goal:                                                                       | Tujuan:                                                                                            |
| `contextBarLabel`            | Lesson location                                                             | Lokasi pelajaran                                                                                   |
| `contextCourseOf`            | Course {position} of {total}                                                | Kursus {position} dari {total}                                                                     |
| `contextPageOf`              | Page {position} of {total}                                                  | Halaman {position} dari {total}                                                                    |
| `lessonPrevious`             | Previous: {title}                                                           | Sebelumnya: {title}                                                                                |
| `lessonMarkComplete`         | Mark as complete                                                            | Tandai selesai                                                                                     |
| `lessonCompleted`            | Completed                                                                   | Sudah selesai                                                                                      |
| `lessonMarkCompleteContinue` | Mark complete & continue                                                    | Tandai selesai & lanjutkan                                                                         |
| `lessonContinue`             | Continue                                                                    | Lanjutkan                                                                                          |
| `lessonNextPage`             | Next: {title}                                                               | Berikutnya: {title}                                                                                |
| `lessonNextCourse`           | Next course: {title}                                                        | Kursus berikutnya: {title}                                                                         |
| `lessonBackToPath`           | Back to the path                                                            | Kembali ke jalur                                                                                   |
| `lessonBackToCourse`         | Back to the course                                                          | Kembali ke kursus                                                                                  |
| `lessonAnnounceComplete`     | {title} marked as complete. {done} of {total} pages done.                   | {title} ditandai selesai. {done} dari {total} halaman selesai.                                     |
| `lessonAnnounceIncomplete`   | {title} marked as not complete. {done} of {total} pages done.               | {title} ditandai belum selesai. {done} dari {total} halaman selesai.                               |
| `courseContinueCourse`       | Continue course: {title}                                                    | Lanjutkan kursus: {title}                                                                          |
| `courseReviewCourse`         | Review course                                                               | Ulas kursus                                                                                        |
| `homeContinueLearning`       | Continue learning                                                           | Lanjutkan belajar                                                                                  |
| `homeFinishedCore`           | You finished the core of {title}.                                           | Anda telah menyelesaikan inti {title}.                                                             |
| `homeStartLearning`          | Start learning                                                              | Mulai belajar                                                                                      |
| `homeStartHint`              | Pick a path below, or browse all courses.                                   | Pilih jalur di bawah, atau jelajahi semua kursus.                                                  |
| `homeChoosePath`             | Choose a path                                                               | Pilih jalur                                                                                        |
| `homeCareerPaths`            | Career paths                                                                | Jalur karier                                                                                       |
| `homeSkillPaths`             | Skill paths                                                                 | Jalur keterampilan                                                                                 |
| `homeBrowseAll`              | Browse all courses                                                          | Jelajahi semua kursus                                                                              |
| `homeOpenCatalog`            | Open catalog                                                                | Buka katalog                                                                                       |
| `homePrivacyNote`            | Your progress is saved in this browser only. It is never sent anywhere.     | Progres Anda hanya tersimpan di browser ini dan tidak pernah dikirim ke mana pun.                  |
| `homeLegacyPrompt`           | Looking for older material?                                                 | Mencari materi lama?                                                                               |
| `homeViewPath`               | View path                                                                   | Lihat jalur                                                                                        |
| `pathCardPhases`             | {count} core phases                                                         | {count} fase inti                                                                                  |
| `pathCardOptional`           | {count} optional                                                            | {count} opsional                                                                                   |
| `resetButton`                | Reset progress…                                                             | Atur ulang progres…                                                                                |
| `resetDialogTitle`           | Reset all progress?                                                         | Atur ulang semua progres?                                                                          |
| `resetDialogBody`            | This clears every completed page in this browser. It cannot be undone.      | Ini menghapus semua halaman yang sudah selesai di browser ini. Tindakan ini tidak bisa dibatalkan. |
| `resetCancel`                | Cancel                                                                      | Batal                                                                                              |
| `resetConfirm`               | Reset progress                                                              | Atur ulang progres                                                                                 |
| `resetDone`                  | Progress reset.                                                             | Progres diatur ulang.                                                                              |

Reused keys from earlier plans: `courseStart` and `courseEstimatedHours` (plan 03); `pathsPhaseLabel`,
`pathsAfterPhaseCan`, `pathsCannotYet`, `pathsOptionalExtensions`, `pathsExtensionsNote`,
`pathsBeforeYouStart`, `pathsOutlineBadge` (plan 02).

## Content Edits

- `content/en/learn/_index.md` frontmatter: add
  `description: "Follow a path from your first course to a finished project, or pick single courses from the catalog. Every path is split into phases, and each phase says what you can do after it."`.
  `title: "Learn"` and `weight: 10` stay. The body stays generator-owned and is not rendered.
- `content/en/learn/overview.md`: deleted (redirected, see [003](./003-active-path-and-navigation.md#overview-removal-and-redirect)).
