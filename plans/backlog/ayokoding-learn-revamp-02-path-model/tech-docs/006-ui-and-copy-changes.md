# 006 — UI and Copy Changes

The UI change is deliberately minimal: phase headings, core outcomes, an Outline badge, and a
"Before you start" note. Plan 04 replaces the syllabus with a phase roadmap later, so nothing here
adds interaction state. Paths are relative to `apps/ayokoding-www/src/features/course-paths/shell/`
unless stated.

## Component Changes

| Component                                       | Change                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path-landing.tsx`                              | Renders `AssumedCourses` (when `assumes` is non-empty), then a "Core" label, then one `PhaseSection` per core phase, then an "Optional extensions" heading with a short note and one `PhaseSection` per extension phase. Position numbers continue across phases (plan 01's numbering). The `<nav aria-label="… syllabus">` wrapper stays, so existing E2E locators still find it. |
| `phase-section.tsx` (new)                       | `h2` with a "Phase n" badge (core only), the phase title, and the course count; the outcome line for core phases; an `<ol>` of course links with `OutlineBadge` where needed.                                                                                                                                                                                                      |
| `assumed-courses.tsx` (new)                     | A bordered note titled "Before you start" listing every assumed course as a link to its canonical course URL (no `?path=`).                                                                                                                                                                                                                                                        |
| `outline-badge.tsx` (new)                       | `<Badge variant="secondary" size="sm">` from `@open-sharia-enterprise/web-ui` with the translated "Outline" text.                                                                                                                                                                                                                                                                  |
| `path-rail.tsx` + `phase-group.tsx` (new)       | Wraps each phase's courses in a labelled `PhaseGroup`: a small uppercase phase label ("Phase n · Title" for core, the title for extensions), an "Optional extensions" divider before the first extension phase, and `OutlineBadge` on outline rows. The readout "Course k of N", the current-row marker, and the footer links do not change.                                       |
| `path-banner.tsx`                               | No visible change. Position and total still come from the derived `courseOrder`.                                                                                                                                                                                                                                                                                                   |
| `syllabus-preview.tsx`                          | Takes the first phase instead of the first three courses: "Starts with Phase 1 · <title>:" followed by that phase's course titles. `FIRST_PHASE_PREVIEW_COUNT` is removed. Only `arc-landing.tsx` (careers) uses it.                                                                                                                                                               |
| `arc-landing.tsx`                               | Passes the first phase to `SyllabusPreview`.                                                                                                                                                                                                                                                                                                                                       |
| `course-library.ts`                             | Adds `outlineCourseIds`, derived locale-independently from `ContentMeta.status`.                                                                                                                                                                                                                                                                                                   |
| `course-path-nav.ts`                            | Adds `outlineCourseIds` to `CoursePathData` and `CoursePathClientData`, and to `EMPTY_COURSE_PATH_CLIENT_DATA`.                                                                                                                                                                                                                                                                    |
| `src/app/[locale]/(content)/[...slug]/page.tsx` | Careers hub strapline changes: "Converging within your role" → "A focused core for your goal, then optional depth". The skills hub strapline does not change.                                                                                                                                                                                                                      |

The hard-coded English strapline stays hard-coded, matching how the page renders it today.

### Marked Skills Paths Render as Today

When `isPendingSkillsRestructure(manifest)` is true, `path-landing.tsx`, `path-rail.tsx`, and the
drawer take today's flat branch: one ordered list of the path's courses with plan 01's position
numbers, and no "Core" label, phase heading, outcome line, "Optional extensions" heading, "Before you
start" note, or Outline badge. There is no reader-visible label for the marker. The branch is one
`if` in each of the three components, each covered by a unit test, and plan 07 deletes it.

### Not Changed by This Plan

- `category-landing.tsx` (the skills category landing, its statement, and `RampMilestoneStrip`),
  `ramp-milestone-strip.tsx`, and `path-card.tsx`.
- The skills hub strapline in `page.tsx`.
- Every page under `content/en/learn/paths/skills/**`.

Plans 06 and 07 own those changes; the proposed copy is at the end of this document.

## New i18n Keys (`src/features/i18n/core/translations.ts`)

| Key                       | `en`                                                                    | `id`                                                                                   |
| ------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pathsBeforeYouStart`     | Before you start                                                        | Sebelum memulai                                                                        |
| `pathsAssumesIntro`       | This path assumes you already know:                                     | Jalur ini mengasumsikan Anda sudah menguasai:                                          |
| `pathsCoreLabel`          | Core                                                                    | Inti                                                                                   |
| `pathsPhaseLabel`         | Phase                                                                   | Fase                                                                                   |
| `pathsOptionalExtensions` | Optional extensions                                                     | Pendalaman opsional                                                                    |
| `pathsExtensionsNote`     | Take these after the core, in any order, or when a topic interests you. | Ambil setelah bagian inti, dalam urutan apa pun, atau saat topiknya menarik bagi Anda. |
| `pathsAfterPhaseCan`      | After this phase you can                                                | Setelah fase ini Anda bisa                                                             |
| `pathsCannotYet`          | You cannot yet                                                          | Anda belum bisa                                                                        |
| `pathsOutlineBadge`       | Outline                                                                 | Kerangka                                                                               |
| `pathsStartsWith`         | Starts with                                                             | Dimulai dengan                                                                         |

Phase titles and outcomes are English course data on both locales, like all course content
(decision 35).

## Copy: Manifest Descriptions

Manifest `description` is shown on path cards. The exact strings for the 4 career manifests are in
each JSON block in [syllabus/paths/](../syllabus/paths/README.md); the 4 skills manifests keep
today's description. The AI Engineer manifest becomes "For developers who
already code: build, evaluate, deploy, and operate AI systems."

## Copy: Path Pages (`apps/ayokoding-www/content/en/learn/paths/**/_index.md`)

This plan edits 8 pages: the hub `paths/_index.md`, the three career arc pages, and the four career
path pages. Frontmatter keys other than `description` do not change. Each body below replaces the
whole current body. Each frontmatter `description` equals the manifest description of the same path.

### `paths/_index.md`

- `description`: "Choose a learning path: an ordered route through the course library toward a goal."
- Body: unchanged link list.

### Arc pages (`careers/<arc>/_index.md`)

Only the `description` changes; each drops the trailing "Path content publishes as its manifest
ships." sentence:

| Page                                      | New `description`                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `careers/interview-ready/_index.md`       | "The Interview-Ready path — a focused route through the courses that prepare you for technical interviews." |
| `careers/immediately-effective/_index.md` | "The Immediately-Effective path — a route to becoming productive fast in a new role or stack."              |
| `careers/fundamentally-strong/_index.md`  | "The Fundamentally-Strong path — a deep route through the foundations of software engineering."             |

`careers/_index.md` does not change.

### `careers/interview-ready/software-engineer/_index.md`

> Start here when you already build software and need to get ready for interviews. The core is
> short: Python and the command line, the data structures and backend basics that interviews test,
> the interview skills themselves, and a capstone that runs a full mock interview loop.
>
> Everything after the core is optional. Use the extensions to deepen production skills once your
> interviews are on track, and skip what you already know.
>
> Course pages you open from this path keep the path context, so Previous and Next follow this path.

### `careers/immediately-effective/software-engineer/_index.md`

> Start here when you want to build real software soon. You first set up a fast editor, then learn
> Python, SQL, and a backend, then a typed frontend with tests and baseline security, and finish by
> shipping a full-stack app.
>
> The optional extensions start with the shell and Git, then go deeper into languages, systems, data,
> architecture, security, AI, and leadership. Take them in any order once the core is done.
>
> Course pages you open from this path keep the path context, so Previous and Next follow this path.

### `careers/fundamentally-strong/software-engineer/_index.md`

> Choose this path when you want a strong base before you specialise. You start with Python, the
> shell, data structures, and object-oriented programming, build a first working app, then study
> computer science in depth and the practices of running a team. A solid-core capstone ties it all
> together.
>
> If you already have a computer science degree, skim the phases you know and use the outcome under
> each phase to decide where to slow down. The optional extensions cover every specialisation after
> the core.
>
> Course pages you open from this path keep the path context, so Previous and Next follow this path.

### `careers/immediately-effective/ai-engineer/_index.md`

> This path is for developers who already write software. The "Before you start" list shows the
> courses it assumes; take any you have not covered first. The path then moves from computing basics
> and shipping software to building with models, agents, evaluation, and serving and adapting models.
>
> The sequence is practical: learn to observe and test a system before relying on it, and treat
> deployment, evaluation, and adaptation as one engineering discipline.
>
> Course pages you open from this path keep the path context, so Previous and Next follow this path.

### E2E fixture pages

`skills/e2e-fixture-alpha/_index.md` and `skills/e2e-fixture-beta/_index.md` stay unchanged. Their
"runway" bodies are fixture data that `skills-path-landing-body.feature` asserts; they are draft pages
and never published.

## Proposed for Plans 06 and 07 (Not Applied by This Plan)

> **Not applied here.** Decision 39 keeps the skills pages exactly as they are until their content
> plan fills the courses. The copy below is input for plan 06 (accounting) and plan 07 (ERP). They
> may rewrite it to match the finished courses. They also own the matching changes: the skills hub
> strapline ("Up and running fast, then deeper and deeper" → "Accounting and ERP for software
> engineers"), the `paths/skills/_index.md` description ("Skills paths for software engineers who
> build accounting and ERP systems."), removing `RampMilestoneStrip`, and widening the path-copy test
> to `content/en/learn/paths/skills/**`.

### `skills/conventional-accounting/_index.md`

> This path is for software engineers who build accounting systems. Each phase states what you can
> model after it, from a balancing ledger to controlled, reportable accounts. The path assumes SQL
> Essentials and Backend Essentials and links to them instead of repeating them.

### `skills/sharia-accounting/_index.md`

> This path is for software engineers who build accounting systems that must follow Sharia standards
> such as AAOIFI. It shares the conventional-accounting foundation, then adds Sharia-specific
> modelling: Islamic contracts, zakah, sukuk, and a Sharia ledger. The courses explain standards and
> design choices; they do not issue Sharia rulings.
>
> Choose the Conventional Accounting path when you need only the general route.

### `skills/conventional-erp/_index.md`

> This path is for software engineers who build ERP systems. It moves from the ERP data model through
> documents and postings, business process cycles, and inventory and manufacturing, to extending and
> operating the ERP. The accounting and architecture courses it builds on are listed under "Before you
> start".

### `skills/sharia-erp/_index.md`

> This path is for software engineers who build Sharia-compliant ERP systems. It includes the full
> ERP route first, then adds Sharia-specific design: contract-based transaction flows and zakat and
> compliance modules. You do not need to take the Conventional ERP path first.

### Skills category statement (`category-landing.tsx`)

> For software engineers who build accounting and ERP systems. Each path is a short run of phases;
> work through them in order.
