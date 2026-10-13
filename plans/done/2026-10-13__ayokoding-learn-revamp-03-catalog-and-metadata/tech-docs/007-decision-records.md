# 007 — Decision Records

Each decision lists the selection, at least two alternatives, the evidence, prior art, trade-offs and
consequences, and when to revisit. The three UI layout choices are recorded in the design funnel in
[prd.md](../prd.md#ui-design-funnel) and are not repeated here.

## D1 — Order against plan 02

- **Selected:** plan 02 merges before plan 03 executes. Phase 0 checks that `frontmatterSchema` on
  `origin/main` has `status` and that `course-paths/shell/outline-badge.tsx` exists; if not, a
  `[HUMAN]` step stops execution until the user either waits or chooses an alternative.
- **Alternative A — either order; plan 03 adds `status` itself when it lands first.** Rejected: the
  series assigns the `status: outline` marker to plan 02 (decision 15), and this plan's brief says to
  reuse it, not redefine it. Two plans defining the same field invites a merge conflict and a silent
  contract drift.
- **Alternative B — ship without outline awareness.** Rejected: every course would need `format` and
  `estimatedHours`, so 62 unwritten courses would show "About 1 h" and an invented format, which is
  misleading to learners.
- **Evidence:** the series table runs "in this order" (02 before 03); plan 02's tech-docs 002 defines
  `status`, `OutlineBadge`, and `pathsOutlineBadge`, and says plan 03 "may widen `status`".
- **Prior art:** expand-then-consume ordering for shared schema fields; plan 02's own coordination
  section.
- **Trade-offs and consequences:** plan 03 cannot start until plan 02 lands, and plan 02 is waiting
  on its own user decision `UD-02-01`. Plan 02's "either order" note becomes one-sided; this plan's
  report to the user flags that so plan 02's text can be aligned.
- **Revisit when:** plan 02 is blocked long enough that the user wants plan 03 first; then the user
  must authorize Alternative A explicitly.

## D2 — `format` as a frontmatter field

- **Selected:** a new required-unless-outline field `format` with six values, backfilled by the rule
  in [003](./003-category-taxonomy-and-course-mapping.md#formats).
- **Alternative A — derive the format from the folder layout at build time.** Rejected: on
  2026-10-09 a layout-based rule disagreed with the recorded designation for 39 of 159 courses.
- **Alternative B — leave format off the cards and header.** Rejected: decisions 20 and 23 list the
  format on both.
- **Evidence:** 159 courses have a `**Format**` record in archived syllabi; 7 courses declare the
  no-code sub-mode in their overview; the gate adapter says "A topic's format designation declares
  its mode" but names no machine-readable home for it.
- **Prior art:** `repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`
  (format designation); the archived syllabus format records; Microsoft Learn's "At a glance" block
  lists the level and type of each learning path.
- **Trade-offs and consequences:** decision 21 lists four fields and this plan adds a fifth. It is an
  interpretation of decisions 20, 21, and 23 read together, and it is reported to the user. It gives
  the tutorial gates a single place to read the mode, so the adapter and two skills change
  ([009](./009-rule-and-docs-impact.md)).
- **Revisit when:** a course needs two formats, or plan 05's harness wants a different mode vocabulary.

## D3 — Category taxonomy

- **Selected:** 14 categories as a code constant, each course in exactly one (mapping in
  [003](./003-category-taxonomy-and-course-mapping.md)).
- **Alternative A — categories as folders** (`learn/courses/<category>/<course>/`). Rejected: changes
  181 URLs, needs 181 redirects, and breaks every path manifest and prerequisite id.
- **Alternative B — free tags, several per course.** Rejected: decision 22 needs one group per course
  in the sidebar, and multi-membership would list a course twice.
- **Alternative C — about 6 broad categories.** Rejected: groups of 30–50 courses bring back the
  long-list problem inside each group.
- **Evidence:** 181 courses; the largest group is ERP systems with 30, the smallest Interview
  preparation with 5.
- **Prior art:** MDN groups modules into named categories with a purpose line; Frontend Masters
  groups its catalog by topic sections.
- **Trade-offs and consequences:** the list is opinionated; ids are stable keys, while labels are
  translation strings that can change without touching content.
- **Revisit when:** a category grows past 35 courses or falls below 3, or plan 10 adds courses that fit
  none.

## D4 — Store `estimatedHours` and guard it with a drift test

- **Selected:** a stored integer in frontmatter, computed by `estimateCourseHours`, checked on every
  `test:unit` run.
- **Alternative A — compute at build time and never store.** Rejected: decision 21 places
  `estimatedHours` in the frontmatter, and a stored value can be read by people and by a later CLI
  without running the app.
- **Alternative B — authors estimate by hand.** Rejected: 181 hand estimates would be inconsistent
  and could not be checked.
- **Evidence:** the formula's 2026-10-09 output (median 3 h, range 1–20 h) in
  [004](./004-estimated-hours-and-start-target.md).
- **Prior art:** reading-rate research (238 words per minute for adult non-fiction, Brysbaert 2019);
  plan 02's real-manifest test, which prints the expected core when it drifts.
- **Trade-offs and consequences:** every course-body change may need an `estimatedHours` edit. The
  test prints the exact value, so the cost is one line per changed course.
- **Revisit when:** plans 06–13 find the edit too frequent; switching to build-time computation then
  needs the user's approval because it changes decision 21.

## D5 — Outline courses omit `format` and `estimatedHours`

- **Selected:** both are optional when `status: outline`; the UI shows the Outline badge instead.
- **Alternative A — require both for every course.** Rejected: an outline has no real content, so the
  formula gives 1 h and the format is not decided until a content plan writes it.
- **Alternative B — store the historical format for outlines.** Rejected: plans 06–08 choose each
  course's mode when they write it, and a stale value would look authoritative.
- **Evidence:** all 62 outline courses compute to 1 h on 2026-10-09.
- **Prior art:** GitHub's roadmap labels unfinished work "Preview" rather than presenting it as
  complete (cited by plan 02 for the Outline badge).
- **Consequences:** when a content plan removes `status: outline`, the schema forces it to add both
  fields in the same PR.
- **Revisit when:** outline courses are gone (after plans 06–08).

## D6 — How the catalog page is produced

- **Selected:** `page.tsx` dispatches the slug `learn/courses` to a `CourseCatalog` server component
  built from metadata; `generate-indexes` writes frontmatter only for that section.
- **Alternative A — let the generator write a richer Markdown catalog** (category headings and
  description lines). Rejected: Markdown cannot express cards, badges, or jump-link chips without
  custom shortcodes, and generated text would mix content with presentation.
- **Alternative B — a dedicated route file** `app/[locale]/(content)/learn/courses/page.tsx`.
  Rejected: it competes with the catch-all route and its `generateStaticParams`, and the catch-all
  already dispatches `learn/paths/**` the same way (`isLearnPathsSlug`).
- **Evidence:** `page.tsx` already has the `renderPathsRoute` dispatch; the index generator already
  leaves childless sections' bodies alone.
- **Prior art:** the `learn/paths/**` hub, category, and arc landings render from manifest data in the
  same file.
- **Consequences:** the adapter rule "`_index.md` files come from `generate-indexes.ts`" stays true;
  [009](./009-rule-and-docs-impact.md) adds that the catalog section's body is empty by design.
- **Revisit when:** plan 04 redesigns the Learn home and wants the catalog in more than one place.

## D7 — No filter box in the sidebar

- **Selected:** groups only (S3 option A).
- **Alternative A — a filter box** (S3 option B). Not now: it adds client state and a second search
  next to the site search, and no decision asks for it.
- **Alternative B — category links without course rows** (S3 option C). Rejected in the funnel.
- **Prior art:** the site already has a search dialog (`search` bounded context).
- **Revisit when:** the rule-15 usability retest or user feedback shows readers cannot find a course
  in the grouped sidebar.

## D8 — Group in the sidebar component, not in the API

- **Selected:** `content.getTree` adds an optional `category` per node; `SidebarTree` groups the
  children of `learn/courses` when it renders.
- **Alternative A — insert synthetic category nodes into the tree.** Rejected: it changes the API
  shape, breaks `tests/unit/be-steps/navigation-api.steps.ts` (which walks `learn/courses/<course>`),
  and would leak fake nodes into breadcrumbs and prev/next.
- **Alternative B — a separate tRPC procedure for course groups.** Rejected: an extra request in the
  mobile drawer for data the tree can carry in one field.
- **Prior art:** additive optional fields are the compatible change in tRPC/Zod output schemas.
- **Consequences:** the grouping logic is shared with the catalog through `groupByCourseCategory`.
- **Revisit when:** another section needs grouping; then generalize the `learn/courses` check.

## D9 — Header slots for plan 04

- **Selected:** `CourseHeader` takes optional `primaryAction` and `progress` React nodes.
- **Alternative A — plan 04 edits the header's internals.** Rejected: it would rewrite tested markup
  and re-open this plan's scenarios.
- **Alternative B — a React context that plan 04 provides.** Rejected: hidden coupling; props are
  explicit and testable.
- **Prior art:** slot props are the usual composition pattern in the shared kit (for example
  `Button asChild`).
- **Consequences:** this plan tests both slots with simple placeholder nodes so plan 04 starts green.
- **Revisit when:** plan 04 needs more than these two slots.

## D10 — Tolerant runtime parse, strict test

- **Selected:** the runtime schema uses `.catch(undefined)` for the new keys; the strict schema runs in
  tests.
- **Alternative A — strict enums in the runtime schema.** Rejected: today any parse failure silently
  drops the whole page (`repository-fs.ts` skips it), so a typo would make a course vanish.
- **Alternative B — fail `next build` on invalid metadata.** Rejected: the same check already fails
  `test:quick` before push, and a build-time failure adds a second, slower place to debug.
- **Prior art:** plan 02 keeps the manifest loader tolerant and validates strictly in tests.
- **Consequences:** an invalid value shows as "Other courses" or a missing badge locally until the
  test is run; it never reaches `main` because `test:quick` runs on pre-push and in CI.
- **Revisit when:** content is ever published without running `test:quick`.
