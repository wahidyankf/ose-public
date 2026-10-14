# 006 — Testing Strategy

## Layers

| Layer                | Runner and project                                                                      | What it proves                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit, pure core      | Vitest `unit` (Node): `apps/ayokoding-www/tests/unit/**/*.unit.test.ts`                 | Schema, state operations, lesson sequence, location, path context, derivations, next step, redirect rule                                       |
| Unit, corpus         | Vitest `unit` (Node), reading real `content/en/**`                                      | Every course has a lesson sequence that starts at plan 03's start page; ids match the schema; payload size bound                               |
| Unit, components     | Vitest `unit-fe` (jsdom): `tests/unit/features/**/*.test.tsx`                           | Every new component, placeholder vs ready rendering, hydration without mismatch, storage failure paths                                         |
| Unit, scenario steps | Vitest `unit-fe`: `tests/unit/fe-steps/*.steps.tsx` with `@amiceli/vitest-cucumber`     | Each Gherkin scenario's Unit binding                                                                                                           |
| Integration          | `ayokoding-www:test:integration`                                                        | Exempt for every new scenario (no separate local resource boundary); existing integration steps that opened `/en/learn/overview` are repointed |
| E2E                  | `ayokoding-www-fe-e2e:test:e2e`, playwright-bdd, Chromium, Firefox, WebKit              | Each Gherkin scenario's E2E binding against a production build with the fixture manifests                                                      |
| Behaviour coverage   | `ayokoding-www:test:coverage:behaviour`, `ayokoding-www-fe-e2e:test:coverage:behaviour` | Every scenario has its bindings                                                                                                                |
| Line coverage        | `ayokoding-www:test:coverage` (part of `test:quick`), 99% lines                         | New `core/` and `shell/` files are covered                                                                                                     |

Phase 0 confirms the Vitest include patterns. If a `.test.ts` file is not picked up by `unit-fe`, it is
named `.test.tsx`.

## New Unit Test Files

Under `apps/ayokoding-www/tests/unit/features/learning-progress/` unless noted:

| File                                                                     | Cases (minimum)                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `progress-schema.unit.test.ts`                                           | Valid record parses; wrong version, extra key, bad course id, bad page path, bad path id, 501 pages, 501 courses each fail.                                                                                                                                                                                                                                                      |
| `progress-schema.corpus.unit.test.ts`                                    | Every real course directory name, every lesson-sequence page path, and every path id in `src/features/course-paths/manifests/**` matches its pattern.                                                                                                                                                                                                                            |
| `progress-state.unit.test.ts`                                            | `parseProgress(null)` empty, not recovered; bad JSON and schema failure → empty, recovered; `serializeProgress` sorts keys and pages and is stable; `setPageComplete` add, add twice, remove, remove last page drops the course key; inputs never mutated; `recordVisit` with path, without path same course (keeps), without path other course (clears).                        |
| `lesson-sequence.unit.test.ts`                                           | Synthetic trees: weight then slug order; weight tie; synthetic section and its children skipped; pages before the start slug dropped; `startSlug` null or missing → `[]`; nested capstone section included.                                                                                                                                                                      |
| `lesson-sequence.corpus.unit.test.ts`                                    | Every course: non-empty, `[0]` equals plan 03's start slug, no duplicates. Prints course count, page count, and skipped synthetic pages.                                                                                                                                                                                                                                         |
| `sequence-payload-size.corpus.unit.test.ts`                              | `JSON.stringify(await loadLessonPagePaths("en"))` is under 65,536 bytes; prints the size.                                                                                                                                                                                                                                                                                        |
| `course-location.unit.test.ts`                                           | Course root, inner page, nested page, `learn/courses`, other sections, trailing slash.                                                                                                                                                                                                                                                                                           |
| `lesson-path-context.unit.test.ts`                                       | URL valid; URL with unknown path; URL with path not containing the course (null, no memory fallback); remembered valid; remembered other course; remembered unknown path; nothing.                                                                                                                                                                                               |
| `progress-derivations.unit.test.ts`                                      | Stale pages ignored; empty sequence never done; statuses; phase counts courses; path headline counts core only; flat mode counts all.                                                                                                                                                                                                                                            |
| `next-step.unit.test.ts`                                                 | `courseNextTarget` cases; `resolvePathNextStep`: fresh start, lastPath course unfinished, lastPath course done, lastPath other path, extension-only progress, core complete.                                                                                                                                                                                                     |
| `../../redirects/learn-home.unit.test.ts`                                | Rule exists, permanent, exact source, no `:path*`; position in `next.config.ts` redirect order.                                                                                                                                                                                                                                                                                  |
| `../course-paths/shell/route-data-shape.unit.test.ts`                    | Output keys of `toCoursePathClientData` (retained contract, [005](./005-api-contract-delta.md#op-2--trpc-coursepathsgetroutedata)).                                                                                                                                                                                                                                              |
| `progress-storage.test.ts` (`unit-fe`)                                   | First read lazy and cached; same object until change; storage getter throws → memory mode; `getItem` throws; `setItem` throws `QuotaExceededError` → state kept, `persisted: false`; invalid stored value → recovered; read-modify-write keeps another tab's change; `storage` event with the key, with `null`, with another key; reset removes the key; server snapshot frozen. |
| `use-learning-progress.test.tsx`                                         | `renderToString` gives the placeholder markup; `hydrateRoot` on that markup with stored progress logs no hydration error (spy on `console.error`) and then renders the ready state.                                                                                                                                                                                              |
| one `*.test.tsx` per component in [004](./004-ui-components-and-copy.md) | Placeholder render, each mode, link targets with `?path=`, labels from both locales, `aria-pressed`, status messages, dialog focus.                                                                                                                                                                                                                                              |

Edited component tests: `path-landing.test.tsx`, `category-landing.test.tsx`, `arc-landing.test.tsx`,
`route-paths-hub.test.tsx`, `course-page-content` tests, plus any test asserting the removed
`PathCard` usage on hubs.

## Scenario-to-Binding Map

Unit bindings live in `apps/ayokoding-www/tests/unit/fe-steps/<feature>.steps.tsx`. E2E bindings live
in `apps/ayokoding-www-fe-e2e/tests/e2e/steps/<feature>.steps.ts`. The feature files are under
`specs/apps/ayokoding/www/behaviours/frontend/`.

| Feature file (IDs)                                                    | Unit step file                              | E2E step file                              | E2E pages and fixtures                                                                                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `learning-progress/progress-store.feature` (S1–S9)                    | `progress-store.steps.tsx`                  | `progress-store.steps.ts`                  | Lesson pages of `just-enough-bash`; path pages of `careers/immediately-effective/backend-track` and `skills/e2e-fixture-alpha` (both contain `just-enough-bash`, for S3); Learn home |
| `learning-progress/lesson-navigation.feature` (S10–S18)               | `lesson-navigation.steps.tsx`               | `lesson-navigation.steps.ts`               | `careers/immediately-effective/backend-track` (`just-enough-bash` → `backend-essentials` → `sql-essentials`)                                                                         |
| `course-paths/path-roadmap.feature` (S19–S26)                         | `path-roadmap.steps.tsx`                    | `path-roadmap.steps.ts`                    | A fixture with a core and an extension phase and an outcome; a pending-restructure skills fixture (see Fixtures)                                                                     |
| `learning-progress/learn-home.feature` (S27–S32, S31a)                | `learn-home.steps.tsx`                      | `learn-home.steps.ts`                      | `/en/learn`, `/en/learn/overview`, hubs                                                                                                                                              |
| `learning-progress/course-landing-progress.feature` (S33–S34)         | `course-landing-progress.steps.tsx`         | `course-landing-progress.steps.ts`         | `/en/learn/courses/just-enough-bash`                                                                                                                                                 |
| `learning-progress/learning-progress-accessibility.feature` (S35–S39) | `learning-progress-accessibility.steps.tsx` | `learning-progress-accessibility.steps.ts` | All four screens                                                                                                                                                                     |
| Changed scenarios U1–U6                                               | existing step files                         | existing step files                        | See [prd.md](../prd.md#changes-to-existing-scenarios)                                                                                                                                |

## E2E Techniques

- **Completing courses through the UI.** A helper `completeCourseThroughUi(page, courseId, pathId)`
  opens the course landing page with `?path=`, clicks the header's primary button, then clicks "Mark
  complete & continue" until the URL leaves `/learn/courses/<courseId>/` (at most 60 clicks; more
  fails the test). This keeps tests correct when plans 06–13 add or rename pages.
- **Seeding bad data (S5):** `page.addInitScript` sets the key to `not json` before load.
- **Blocking storage (S4):** `page.addInitScript` replaces `Storage.prototype.getItem`, `setItem`, and
  `removeItem` with functions that throw `new DOMException("blocked", "SecurityError")`. The unit test
  covers a throwing `window.localStorage` getter.
- **No network (S1):** record `page.on("request")` from just before the click until the page shows
  "Completed"; assert every request method is `GET` and no URL, header value, or post body contains
  `ayokoding-learn-progress` or the serialized record.
- **Cross-tab (S9):** two pages in one browser context plus a third page that marks completion; the
  first two must update through the `storage` event without reload.
- **No layout shift (S8):** for each of the four screens, open it in a context with
  `javaScriptEnabled: false` and in a normal context with progress seeded through the UI helper; read
  the `boundingBox()` of every `[data-progress-slot]` element and of the next element after it; assert
  equal `y` and `height` within 1 px. Also collect `console` messages and assert none contains
  "Hydration" or "did not match".
- **Reduced motion (S37):** `page.emulateMedia({ reducedMotion: "reduce" })`; after a completion, every
  `[data-progress-slot] *` element has computed `transition-duration` of `0s` and `animation-name` of
  `none`.
- **Phone width (S38):** viewport 375 × 800; `document.documentElement.scrollWidth <= 375`; every button
  and primary link in progress slots and `LessonNav` has a bounding box at least 44 × 44.
- **Axe (S39):** `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()` on each screen with
  seeded progress; zero violations.
- **Keyboard (S36):** press `Tab` until `document.activeElement` is the toggle (at most 80 presses),
  press `Space`, assert `aria-pressed="true"` and the `role="status"` text.

## Fixtures

The E2E build uses `apps/ayokoding-www-fe-e2e/fixtures/manifests/` (six manifests on 2026-10-09; plan 02
reshapes them to phases). Phase 0 records their merged shape. Then:

- If no fixture has both a core phase with an outcome and an extension phase, Phase 4 gives
  `careers/fundamentally-strong/generalist-track.json` two phases with the same course order: core
  `foundations` (`computer-science-foundations`, with an outcome) and extension `practice`
  (`software-engineering-practices`). Its `description` changes to say it now also proves the roadmap.
- If no fixture is marked as pending restructure, Phase 4 adds one fixture whose `pathId` is on plan
  02's closed allowlist, in the exact mechanical shape, with two real courses, and updates any skills
  count assertion it changes (recorded in the phase evidence).
- The fixtures README lists each fixture's purpose; Phase 9 updates it.

## Static and Manual Proof

- `ayokoding-www:test:quick` (typecheck, lint, unit, coverage) at every phase gate.
- Manual Playwright MCP checks in Phase 10 at 375, 768, and 1280 px against the selected mockups, with
  console checks, plus a production-build sign-off.
- `rtk curl` recipes for the redirect ([003](./003-active-path-and-navigation.md#overview-removal-and-redirect)).
