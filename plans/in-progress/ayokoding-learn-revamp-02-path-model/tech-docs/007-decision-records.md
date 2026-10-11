# 007 — Decision Records

Each record names the selected option, two rejected alternatives, prior art, evidence, trade-offs,
consequences, and what would make us revisit it. "Series decision n" refers to the resolved series
decisions listed in [brd.md](../brd.md#resolved-series-decisions-this-plan-relies-on). D12 records the user's
answer to `UD-02-01` (series decision 39); D15 records the mechanism this plan uses to carry it out.

## D1 — Manifests group courses into titled phases

- **Selected:** a manifest file holds `phases[]`; each phase has `id`, `title`, `kind`
  (`core` | `extension`), an `outcome` (required for core), and ordered `courses`. Core phases come
  first.
- **Alternative 1 — a flat `courseOrder` with a `core: true` flag per course.** Rejected: it has no
  place for phase titles or outcomes (series decisions 3 and 18), and plan 04's roadmap needs groups.
- **Alternative 2 — keep `courseOrder` and add a separate `phases` index of position ranges.**
  Rejected: two sources of order can drift, and every edit must update both.
- **Prior art:** Codecademy career paths group Modules into Tracks, each opening with how it serves
  the goal, and keep optional content outside the required sequence
  ([curriculum standards](https://curriculum-documentation.codecademy.com/containers/career-path-standards/)).
  The previous in-repo schema plan
  (`plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/`) introduced the
  flat order this plan replaces.
- **Evidence:** no manifest uses the optional `framing` object; every walking consumer reads only the
  flattened order (`path-nav.ts`, `path-banner.tsx`, `course-path-nav.ts`, E2E
  `loadPublishedManifests`).
- **Trade-offs:** manifests become longer and nested; one more schema level to validate.
- **Consequences:** plan 04 reads phases directly; phase `id` becomes a stable key.
- **Revisit when:** a path needs a course in two phases, or plan 04 needs nested sub-phases.

## D2 — `courseOrder` is derived, never stored

- **Selected:** the zod transform adds `courseOrder = phases.flatMap(p => p.courses)` to the domain
  object; files never contain it.
- **Alternative 1 — rewrite every consumer to read phases.** Rejected: touches Next/Prev, the banner,
  the tRPC payload, and E2E helpers for no reader-visible gain, and widens the PR.
- **Alternative 2 — store both keys in the file.** Rejected: duplicated truth (see D1 alternative 2).
- **Prior art:** derived fields over a single stored source are the normal zod `transform` pattern;
  the existing schema already derives nothing from files, so this adds one well-tested transform.
- **Evidence:** `courseOrder` readers listed in [001](./001-architecture-and-data-flow.md).
- **Trade-offs:** the file shape and the domain shape differ, so the plan keeps two exported types
  (`PathManifestFileSchema` and `PathManifestSchema`).
- **Consequences:** an old browser tab keeps working against the new payload.
- **Revisit when:** no consumer reads `courseOrder` any more (plan 04 may remove it).

## D3 — Expand, migrate, verify, and contract in one PR

- **Selected:** four commit groups in one PR; `main` never sees the dual-shape schema.
- **Alternative 1 — two PRs (expand first, contract later).** Rejected: the dual-shape window would
  sit on `main` with no reader benefit, and nothing outside this repository reads the files.
- **Alternative 2 — a big-bang rewrite without an expand step.** Rejected: the tests would be red for
  most of the work, so a pause would leave the branch broken (Pause Safety).
- **Prior art:** parallel change, also called expand and contract
  ([Martin Fowler](https://martinfowler.com/bliki/ParallelChange.html)): support both versions, move
  the users, then remove the old version.
- **Evidence:** all 14 manifest files (8 real, 6 fixtures) live in this repository; there are no
  external readers.
- **Trade-offs:** one larger PR to review.
- **Consequences:** rollback is a single revert ([002](./002-manifest-schema-and-migration.md#rollback)).
- **Revisit when:** another repository starts reading the manifest files.

## D4 — Strict rules run in unit tests, not in the runtime loader

- **Selected:** the zod schema and R1 run at load time (skip with `console.warn`, as today). Closure,
  goals, outline, `assumes`, skills, and marker rules (R3–R9) run in unit tests over synthetic and
  real manifests.
- **Alternative 1 — fail the build when a rule breaks.** Rejected: a content edit could take the whole
  site down; the tests already block the PR.
- **Alternative 2 — skip a manifest at runtime when a rule breaks.** Rejected: a reader would silently
  lose a whole path over a prerequisite edit.
- **Prior art:** the existing `checkPrerequisiteConsistency` is already test-only, and
  `loadManifests` already tolerates bad files with a warning.
- **Evidence:** `shell/manifest-repository.ts`; `tests/unit/features/course-paths/manifests/`.
- **Trade-offs:** a rule break that bypasses CI would render instead of failing; `worktree-to-pr`
  with required gates makes that unlikely.
- **Consequences:** the integrity function is pure and fully unit-testable.
- **Revisit when:** content starts arriving outside the PR flow (for example, a CMS).

## D5 — Core = goals + prerequisite closure; IE uses two goals

- **Selected:** each career SE path declares `goals`; its core is exactly
  `computeCore(goals, prerequisites, assumes)`. Immediately-Effective declares two goals,
  `capstone-full-stack-app` and `capstone-forge-ready`, so the Neovim trio is core there (series
  decision 5) and nowhere else.
- **Alternative 1 — hand-pick each core.** Rejected: nothing would stop a core from missing a
  prerequisite or growing without reason.
- **Alternative 2 — IE with one goal and a manual exception for the Neovim trio.** Rejected: the
  exception would break the "core equals closure" test, and series decision 5 is a goal in practice.
- **Prior art:** package managers install a package together with its transitive dependencies and
  let peers be declared instead of installed
  ([npm `peerDependencies`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies));
  `assumes` plays the peer role.
- **Evidence:** cores computed from the revised graph: IR 13, IE 13, FS 24
  ([004](./004-path-composition.md)).
- **Trade-offs:** core size follows the graph, not a target number (series decision 4).
- **Consequences:** a prerequisite edit can change a core; the real-manifest test prints the expected
  core, and the author moves courses between phases.
- **Revisit when:** a path needs a core course that is not a prerequisite of any goal.

## D6 — Prerequisite rubric without transitive reduction

- **Selected:** keep an edge only when it is a true conceptual dependency (rubric T1–T4, L1, C1 in
  [003](./003-prerequisite-rubric-and-evidence.md)); keep redundant transitive edges.
- **Alternative 1 — keep today's edges.** Rejected: journey-chain edges (for example a full-stack
  capstone requiring an unrelated first-app course) pull extra courses into every core.
- **Alternative 2 — transitive reduction (drop every edge implied by others).** Rejected: the course
  page lists direct prerequisites, and a reader landing there should see each one the prose depends on.
- **Prior art:** the 2026-07-24 schema plan built the first DAG from course prose; this plan applies
  the same "the prose names it" test with reason codes.
- **Evidence:** 361 → 400 edges: 325 kept, 36 removed, 75 added; 43 courses change; acyclic.
- **Trade-offs:** more edges to maintain; closure results do not change either way.
- **Consequences:** later plans that edit a course also own its prerequisite row.
- **Revisit when:** course pages start showing an inferred prerequisite chain.

## D7 — `status: outline` frontmatter plus a word-count guard

- **Selected:** an explicit, schema-validated `status: outline` on 62 courses, and a unit test that
  fails when a course under 1,000 words lacks it.
- **Alternative 1 — compute "outline" from word count at build time.** Rejected: a heuristic in the
  product hides intent; authors cannot mark a long but unfinished course.
- **Alternative 2 — a list of outline IDs in a separate file.** Rejected: drifts from the course
  folder; plan 03 already puts course metadata in `_index.md` (series decision 21).
- **Prior art:** GitHub labels mostly-complete features "Preview" instead of hiding them
  ([github/roadmap](https://github.com/github/roadmap)).
- **Evidence:** largest outline 508 words; smallest complete course 1,403 words; clear gap.
- **Trade-offs:** the 1,000 threshold is arbitrary inside that gap.
- **Consequences:** plans 06, 07, and 08 remove the marker as they write courses.
- **Revisit when:** a real course falls under 1,000 words, or plan 03 widens `status`.

## D8 — Phase outcomes live in the manifest

- **Selected:** `outcome.can` (required for core) and `outcome.cannotYet` (optional) are manifest
  fields, shown under each core phase heading.
- **Alternative 1 — outcomes in the path's markdown page.** Rejected: the rail and plan 04's roadmap
  cannot read markdown prose per phase.
- **Alternative 2 — outcomes as i18n keys.** Rejected: they are course data, English only (series
  decision 35), and would scatter path content across code.
- **Prior art:** Codecademy track introductions state what the track enables (see D1).
- **Evidence:** the skills jargon ("Dangerous N", "OI-2") existed because the pages had no structured
  place for outcomes.
- **Trade-offs:** English outcome text shows on `/id/` pages, like all course content.
- **Consequences:** the path-copy test can check outcomes exist; plan 04 reuses them.
- **Revisit when:** courses get Indonesian translations.

## D9 — `assumes` is exact

- **Selected:** `assumes` equals the set of outside prerequisites of core courses — no extras, no gaps
  (R4 + R7).
- **Alternative 1 — free-form `assumes`.** Rejected: it would drift into a reading list.
- **Alternative 2 — no `assumes`; put outside prerequisites into the core.** Rejected: the AI path
  would absorb the whole SE foundation, against series decision 10.
- **Prior art:** npm peer dependencies (see D5).
- **Evidence:** AI path assumes 11 courses ([004](./004-path-composition.md)). The drafted skills
  phases assume the accounting and architecture courses their cores build on; plans 06 and 07 apply
  them.
- **Trade-offs:** any prerequisite edit may require an `assumes` edit; the test names it.
- **Consequences:** "Before you start" always lists exactly what the reader needs.
- **Revisit when:** a path wants to recommend background that is not a strict prerequisite.

## D10 — The AI Engineer path declares no goals

- **Selected:** the AI path has phases, outcomes, and `assumes`, but no `goals`, so R6 does not apply.
- **Alternative 1 — goal = the coding-agent capstone.** Rejected: it is an outline course and cannot
  be core (series decision 6).
- **Alternative 2 — goal = the last complete course.** Rejected: an arbitrary goal would make the
  "core equals closure" check meaningless.
- **Prior art:** the IE SE path uses its capstone as goal; the AI path will follow once plan 08 writes
  its capstone.
- **Evidence:** `capstone-build-your-own-coding-agent` is outline; it sits in the extension phase
  `capstone`.
- **Trade-offs:** the AI core is curated, not computed; closure (R4) still holds.
- **Consequences:** plan 08 adds `goals` and moves the capstone into core when it completes it.
- **Revisit when:** the AI capstone loses `status: outline`.

## D11 — Minimal UI: phase sections, grouped rail, first-phase preview

- **Selected:** S1 option A, S2 option A, S3 option A from the [prd.md UI funnel](../prd.md).
- **Alternative 1 — accordions (S1 C, S2 B).** Rejected: hides outcomes and adds open/closed state.
- **Alternative 2 — tabs (S1 B).** Rejected: hides extensions behind a click.
- **Prior art:** Codecademy's syllabus redesign shows units before courses
  ([career path redesign](https://www.codecademy.com/resources/blog/career-path-redesign)).
- **Evidence:** existing E2E link-order checks keep working when every course stays visible.
- **Trade-offs:** long extension lists on the landing page.
- **Consequences:** plan 04 replaces this view with a roadmap; nothing here needs unwinding.
- **Revisit when:** plan 04 starts.

## D12 — Skills paths ship with their content plans (user decision, 2026-10-09)

- **Selected (by the user):** each skills path is restructured in the same PR that writes its
  courses: plan 06 for both accounting paths, plan 07 for both ERP paths. Until then this plan gives
  the four skills manifests only a mechanical shape (D15) and changes nothing readers see. The user's
  words: "bikin sekalian. semua yang kerangka harus diisi" ("do it together; every outline must be
  filled"), then "Skills path ikut plan konten" ("skills paths go with the content plans").
- **Alternative 1 — a manifest-level Preview status** that allows outline courses in core and shows a
  Preview badge and notice. Rejected by the user: it narrows decision 6 for four paths and labels them
  unfinished in public instead of finishing them.
- **Alternative 2 — unpublish the skills paths until plans 06 and 07.** Rejected by the user: it
  removes four paths readers use today.
- **Alternative 3 — apply the outline rule to career paths only.** Rejected by the user: it quietly
  narrows decision 6 with no end date.
- **Prior art:** GitHub labels unfinished features "Preview"
  ([github/roadmap](https://github.com/github/roadmap)); this was considered and rejected for the
  reason in alternative 1. Shipping a restructure together with the content it organises is the
  "one shippable slice" rule of this repository's delivery units.
- **Evidence:** all 100 course slots in the four skills manifests (19 + 24 + 27 + 30) point at outline
  courses. None of the 43 courses whose prerequisites change is an accounting or ERP course, so the
  skills order stays valid under R10.
- **Trade-offs:** skills readers keep meeting outline courses and today's planning jargon until plans
  06 and 07 merge (accepted in [brd.md](../brd.md)).
- **Consequences:** plan 02 scope is the career paths plus the schema and validation; the drafted
  skills phases become input for plans 06 and 07 ([README](./README.md#cross-plan-handoffs)).
- **Revisit when:** plan 06 or 07 is cancelled or split so that a skills path would keep the marker
  with no owning plan.

## D13 — Tooling lives in the app's TypeScript core; a CLI is a follow-up

- **Selected:** `computeCore` and `checkPathModelIntegrity` are pure functions in
  `src/features/course-paths/core/`, covered by unit tests. Maintainers recompute a core by running
  the real-manifest unit test, which prints the expected core (see [004](./004-path-composition.md)).
- **Alternative 1 — a script under `scripts/` or `local-tmp/`.** Rejected: untested, unowned, and
  against series decision 37.
- **Alternative 2 — build the `ayokoding-cli` subcommand now.** Rejected: plan 05 revives
  `apps/ayokoding-cli` (Go, Cobra); building it here would pre-empt that plan.
- **Prior art:** the existing `prerequisites.ts` and `manifest-integrity.ts` follow the same pure-core
  pattern.
- **Evidence:** `apps/ayokoding-cli` holds only a LICENSE today.
- **Trade-offs:** no one-line command for maintainers until plan 05.
- **Consequences:** plan 05 may wrap the same logic in `ayokoding-cli paths core`.
- **Revisit when:** plan 05 merges.

## D14 — Shared extension themes across the three SE paths

- **Selected:** 15 named extension themes (editor and shell through integrative capstones) used in
  the same order by all three SE paths, each path keeping only its own non-core courses
  ([004](./004-path-composition.md)).
- **Alternative 1 — one "Everything else" extension phase.** Rejected: 100+ unlabelled courses give no
  guidance (series decision 13).
- **Alternative 2 — per-path bespoke themes.** Rejected: the three paths share 111 courses, so
  readers comparing paths would see the same course under different headings.
- **Prior art:** Codecademy keeps optional content in labelled review sections (see D1).
- **Evidence:** set intersection of the three manifests: 111 shared courses.
- **Trade-offs:** some themes are small in one path.
- **Consequences:** a new course needs only one theme choice for all three paths.
- **Revisit when:** a path's extensions diverge enough that a shared theme is empty in it.

## D15 — A closed, explicit marker for skills paths awaiting restructure

- **Selected:** an optional manifest field `restructurePendingIn: "plan-06" | "plan-07"`, accepted only
  when `SKILLS_RESTRUCTURE_ALLOWLIST` in `core/skills-restructure-allowlist.ts` maps that exact path ID
  to that exact value, and only on the mechanical one-phase shape. A marked manifest skips R4–R8 and
  renders flat; R1, R2, R3, R9, and R10 still apply. A set-level check fails when an allowlist entry
  is unused ([002](./002-manifest-schema-and-migration.md#skills-paths-pending-restructure)).
- **Alternative 1 — an implicit allowlist in code only, with no field in the file.** Rejected: the
  file would not show why its rules are relaxed, and removing the code entry alone would not show up
  in the manifest diff that plans 06 and 07 review.
- **Alternative 2 — keep the legacy `courseOrder` shape for the skills files.** Rejected: the contract
  step would stay incomplete, the schema would keep two shapes on `main`, and D3 would no longer hold.
- **Alternative 3 — an open, generic flag such as `relaxRules: true`.** Rejected: any manifest,
  including a career path, could set it, and nothing would force its removal.
- **Prior art:** feature flags with an owner and an expiry, removed by the work that ends them
  ([Martin Fowler, Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)).
- **Evidence:** the allowlist has four entries, each naming the plan that removes it.
- **Trade-offs:** one temporary field, one module, and one render branch to delete later.
- **Consequences:** plan 06 deletes two entries; plan 07 deletes the rest, the module, the field, the
  marker scenarios, and the flat-render branch.
- **Revisit when:** plan 07 merges; the field must be gone by then.
