# 007 — Decision Records

Each record names the selected option, two viable alternatives, prior art, trade-offs, consequences,
and the trigger to revisit it. Screen layout selections are recorded in the
[UI design funnel](../prd.md#ui-design-funnel). External sources were accessed on 2026-10-09.

## D1 — One Versioned `localStorage` Record

- **Selected:** one key, `ayokoding-learn-progress-v1`, holding one strict-schema JSON record.
- **Alternative A — IndexedDB:** async API, larger quota. Rejected: the data is small (about 40 KB at
  most), async reads make a synchronous `getSnapshot` impossible, and the code grows.
- **Alternative B — one key per course:** smaller writes. Rejected: reset and cross-tab sync must
  touch many keys, and versioning is spread over many records.
- **Prior art:** the app already keeps `ayokoding-sidebar-width` and `ayokoding-mobilenav-width` in
  `localStorage`; freeCodeCamp keeps in-editor work in `localStorage` per device.
- **Trade-offs:** synchronous and simple, per-device only, quota shared with the two width keys.
- **Consequences:** progress never syncs; every surface says "saved in this browser".
- **Revisit when:** readers ask for sync or export, or the record nears 1 MB.

## D2 — Completion Unit Is a Page in the Lesson Sequence

- **Selected:** a page counts when it is in the course's lesson sequence: real pages in weight-then-slug
  depth-first order, without synthetic sections, starting at plan 03's Start page
  ([003](./003-active-path-and-navigation.md#lesson-sequence)).
- **Alternative A — every real page in the course:** includes the course-root `overview` and 264
  artifact pages in 11 courses. Rejected: Start would skip the first counted page, and a course could
  need 30+ clicks for worked-example attachments.
- **Alternative B — course-level completion only:** one checkbox per course. Rejected: decision 38a
  fixes the unit as the learning page.
- **Prior art:** Udemy and The Odin Project track completion per lecture or lesson.
- **Trade-offs:** consistent with "Start course"; course-root overviews are not counted.
- **Consequences:** a corpus test guards the rule against content changes in plans 06–13.
- **Revisit when:** a course plan adds a page shape the walk does not cover.

## D3 — URL First, With a Per-Course Memory Fallback

- **Selected:** `?path=` decides path context. On lesson pages only, when `?path=` is absent and the
  stored `lastPath` is for this course, that path is used. An invalid `?path=` never falls back.
- **Alternative A — URL only:** simplest. Rejected: today context is lost after any sidebar, body, or
  table-of-contents link, which is the problem decision 38c addresses.
- **Alternative B — one global stored path for the whole site:** Rejected: a course opened from the
  catalog would suddenly show a path the reader did not choose, and shared links would render
  differently per reader.
- **Prior art:** the existing `CoursePagePathContent` keeps the URL as the single source; this extends
  it narrowly.
- **Trade-offs:** a reader who opens the same course from the catalog later still sees the remembered
  path until they open another course without one.
- **Consequences:** landing pages, rail, banner, and drawer keep URL-only behaviour; every new link
  carries `?path=`.
- **Revisit when:** readers report a surprising path on a lesson page.

## D4 — `useSyncExternalStore` With a Fixed Server Snapshot and Fixed-Size Slots

- **Selected:** a small external store; components read it through `useSyncExternalStore` with
  `getServerSnapshot = { status: "unknown" }`, and progress UI lives in fixed-size slots with
  placeholders.
- **Alternative A — `useEffect` + `useState` mounted flag per component:** works, but every component
  repeats storage logic and cross-tab handling.
- **Alternative B — `next/dynamic` with `ssr: false`:** no server HTML for progress parts, so slot
  sizes must still be reserved and links (Start, Continue) vanish without JavaScript.
- **Prior art:** React's `useSyncExternalStore` documentation (server snapshot used during server
  rendering and hydration); web.dev CLS guidance (good ≤ 0.1; resizing counts only when others move).
- **Trade-offs:** placeholders are visible for one render; text inside slots changes after hydration.
- **Consequences:** S8 compares element positions with and without scripts.
- **Revisit when:** React or Next.js adds a first-class client-storage hydration primitive.

## D5 — Next-Step Rule

- **Selected:** the last path course the reader worked in, if unfinished; else the first unfinished
  core course; untouched courses open at their landing page, started ones at their first unfinished
  page ([003](./003-active-path-and-navigation.md#next-step-rule)).
- **Alternative A — always the first unfinished course in path order:** predictable, but ignores a
  reader who deliberately jumped ahead.
- **Alternative B — the most recently visited page:** needs timestamps and page history in storage, and
  a skimmed page would hijack "Continue".
- **Prior art:** course platforms resume at the next incomplete lecture (Udemy "Continue" behaviour).
- **Trade-offs:** two simple rules instead of a history model.
- **Consequences:** `lastPath` stores a course id, never a page or time.
- **Revisit when:** readers report Continue pointing at the wrong course.

## D6 — Lesson Sequences as Server Props, No New tRPC Operation

- **Selected:** server components compute lesson sequences and pass them as props (one course with
  titles on course pages; page paths only for every course on the roadmap, hubs, and home).
- **Alternative A — new tRPC query:** runtime-fresh, but adds an API operation and a client request.
- **Alternative B — extend `getRouteData`:** changes a retained contract and loads sequences on every
  page that already uses the hook.
- **Prior art:** plan 03 passes course header data as props from `page.tsx`.
- **Trade-offs:** statically generated lesson pages carry their own sequence from build time, which
  matches their own static content.
- **Consequences:** a payload-size test caps the all-course map at 64 KiB.
- **Revisit when:** the cap is reached.

## D7 — The Path Headline Counts Core Courses Only

- **Selected:** "x of N core courses done"; each extension phase shows its own count; flat skills
  paths count all their courses.
- **Alternative A — all courses:** "3 of 114" for Immediately Effective SE, which reads as hopeless and
  contradicts "extensions are optional".
- **Alternative B — weighted by estimated hours:** more precise, but outline courses have no estimate
  and the number is harder to explain.
- **Prior art:** decision 38b and plan 02's "Optional extensions" note.
- **Trade-offs:** extension work is visible only per extension phase, not in the headline.
- **Consequences:** finishing the core shows "Core path complete" and removes the primary button.
- **Revisit when:** paths drop the core/extension split.

## D8 — Toggle Plus Combined "Mark Complete & Continue" Link

- **Selected:** a toggle button (`aria-pressed`, "Mark as complete" / "Completed ✓") and a primary link
  that marks the page and navigates; the link becomes "Continue →" when already complete.
- **Alternative A — a checkbox input:** native semantics, but a checkbox inside a navigation row reads
  as a form field and is harder to size to 44 px with a clear label.
- **Alternative B — completion only through the primary link:** fewer controls, but un-checking would
  need a separate place, against the user's "bisa di 'uncentang'".
- **Prior art:** Udemy's click-to-unmark checkmark; WAI-ARIA toggle buttons.
- **Trade-offs:** two controls that both mark completion; the primary one also navigates.
- **Consequences:** both controls write through the store; a status region announces each change.
- **Revisit when:** usability testing shows readers miss the toggle.

## D9 — Delete Overview and Redirect It

- **Selected:** delete `content/en/learn/overview.md`, add a 308 redirect to `/en/learn`, and move its
  useful sentence into the Learn home intro.
- **Alternative A — keep the page and link it from the home:** two pages saying the same thing.
- **Alternative B — render Overview's body on the home:** its "three buckets" text describes Legacy,
  which plan 14 removes, and its links duplicate the cards.
- **Prior art:** the app already redirects moved Learn URLs with 308 (`learn-three-bucket.ts`,
  `course-rehome.ts`).
- **Trade-offs:** one more redirect module; old links take one extra hop.
- **Consequences:** plan 01's interim "Overview first" scenario is replaced; tests that opened the page
  move to a stable course page.
- **Revisit when:** never expected; the redirect stays.

## D10 — Learn Home Renders at Request Time With Its Own Renderer

- **Selected:** skip `learn` in `generateStaticParams` and render `LearnHome` from `page.tsx`, like the
  paths routes; the generated `_index.md` body is left to the generator and not rendered.
- **Alternative A — keep it static:** the home would capture build-time manifests, unlike the paths
  pages that read the same manifests at request time.
- **Alternative B — change the index generator to skip `learn/_index.md`:** touches a shared generator
  and its validator for no reader-visible gain.
- **Prior art:** `renderPathsRoute` and plan 03's catalog dispatch already render custom pages from
  `page.tsx` and ignore generated bodies.
- **Trade-offs:** one request-time page more; the unused generated body stays in the file.
- **Consequences:** `generate-indexes` and `validate-indexes` keep working unchanged.
- **Revisit when:** the paths routes become static.

## D11 — Careers Landing Shows Path Cards Grouped by Arc

- **Selected:** one section per arc (heading links to the arc page) with that arc's path cards; skills
  landing swaps `PathCard` for `LearnPathCard` but keeps its statement and `RampMilestoneStrip`.
- **Alternative A — keep the arc chooser:** fewer changes, but the page still lists arcs, not paths,
  against decision 38d.
- **Alternative B — one flat grid of all career paths:** loses the arc grouping readers use to choose.
- **Prior art:** the paths hub already groups career path cards by arc (`paths-hub-category-grouping.feature`).
- **Trade-offs:** a longer careers page; arc pages stay for readers who want one arc.
- **Consequences:** `category-landing-arc-chooser.feature` changes (U3).
- **Revisit when:** the number of arcs or roles grows enough to need a chooser again.

## D12 — Pending-Restructure Skills Paths Get a Flat Roadmap With Progress

- **Selected:** for paths where plan 02's `isPendingSkillsRestructure` is true, the roadmap shows one
  flat list in today's order with progress, without phase headings or extensions.
- **Alternative A — plan 02's flat list without progress:** inconsistent: progress would appear on
  every path but these four.
- **Alternative B — a single "Phase 1" milestone:** invents a phase title the content plans have not
  written, against decision 39.
- **Prior art:** plan 02 keeps the same four paths on a flat branch in the path list, rail, and drawer.
- **Trade-offs:** one more branch in `PathRoadmap`, covered by S26.
- **Consequences:** plans 06 and 07 remove the branch when they restructure the paths.
- **Revisit when:** plans 06 and 07 land.

## D13 — Reset Lives on the Learn Home, Behind a Confirmation

- **Selected:** one "Reset progress…" button on the Learn home with a web-ui `Dialog` (Cancel focused).
- **Alternative A — reset on every progress surface:** easy to hit by accident.
- **Alternative B — no confirmation:** irreversible loss on one click.
- **Prior art:** destructive actions behind a confirm dialog with the safe choice focused (WAI-ARIA
  alert dialog pattern).
- **Trade-offs:** one extra click; a reader must go to the Learn home to reset.
- **Consequences:** the roadmap and course header say "saved in this browser" but do not reset.
- **Revisit when:** per-course reset is requested.

## D14 — New `ProgressMeter`, Bars Hidden From Assistive Technology

- **Selected:** a plain bar with `aria-hidden="true"` next to visible text that states the value.
- **Alternative A — web-ui `ProgressRing`:** 1 s transition without a reduced-motion opt-out and no text.
- **Alternative B — `role="progressbar"` on each bar:** screen readers would announce the value twice
  (bar and text).
- **Prior art:** WCAG 1.4.1 Use of Color (text carries the value).
- **Trade-offs:** a new small component instead of reuse.
- **Consequences:** every bar must sit next to its text; component tests assert both.
- **Revisit when:** web-ui ships an accessible bar with a text label.

## D15 — One PR, No Feature Flag

- **Selected:** deliver everything in one PR; each screen is complete at merge.
- **Alternative A — a flag:** adds code paths and tests for a site without accounts or staged rollout.
- **Alternative B — several PRs:** the series rule is one plan, one PR.
- **Prior art:** plans 01–03 of this series each ship as one PR without a flag.
- **Trade-offs:** a large PR; phases inside the branch keep each step reviewable.
- **Consequences:** rollback is a revert of the merge commit.
- **Revisit when:** a part of this plan must ship before the rest.
