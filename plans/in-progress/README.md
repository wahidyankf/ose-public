# In-Progress Plans

Active project plans currently being worked on.

## Choose the right route 🧭

Use this index to understand delivery work that is underway. For the product story or a first local
run, start with the [repository README](../../README.md) and [documentation hub](../../docs/README.md)
instead. Each plan README explains its outcome and boundaries; its `delivery.md` is the detailed
execution checklist.

## Active Plans

### AyoKoding Phoenix LiveView rewrite

- [AyoKoding Web](./ayokoding-app-web/README.md) — full local feature and UI parity in
  `apps/ayokoding-web`, using Phoenix LiveView, imported BeaverNest ExBdd, Unit/Integration tests,
  and Playwright E2E with Gherkin BDD. The existing Next.js app remains on port 3101; Phoenix
  uses 3102, with a separate E2E server on 3191. The Podman migration it followed is archived. It must
  finish before the live Learn Revamp plans; it consumes their content read-only and excludes
  deployment and cutover.

### AyoKoding Learn Revamp series

- Plan 01 (navigation and display) moved to
  [plans/done/2026-10-12\_\_ayokoding-learn-revamp-01-navigation-and-display](../done/2026-10-12__ayokoding-learn-revamp-01-navigation-and-display/README.md)
  on 2026-10-12.
- Plan 02 (path model, phases 0–10) moved to
  [plans/done/2026-10-12\_\_ayokoding-learn-revamp-02-path-model](../done/2026-10-12__ayokoding-learn-revamp-02-path-model/README.md)
  on 2026-10-12. The series continues with plan 03 (`catalog-and-metadata`), which depends on 01
  and 02.
- Plan 03 (catalog and metadata) moved to
  [plans/done/2026-10-13\_\_ayokoding-learn-revamp-03-catalog-and-metadata](../done/2026-10-13__ayokoding-learn-revamp-03-catalog-and-metadata/README.md)
  on 2026-10-13. The series continues with plan 04 (`learning-experience`).
- Plan 04 (learning experience) moved to
  [plans/done/2026-10-18\_\_ayokoding-learn-revamp-04-learning-experience](../done/2026-10-18__ayokoding-learn-revamp-04-learning-experience/README.md)
  on 2026-10-18 (merged #715, E2E-stability follow-ups #716 and #717, deployed to prod).
  The series continues with plan 05 (`code-harness`).
- Plan 05 (code harness) moved to
  [plans/done/2026-10-19\_\_ayokoding-learn-revamp-05-code-harness](../done/2026-10-19__ayokoding-learn-revamp-05-code-harness/README.md)
  on 2026-10-19.
  Live plans 06–13 proceed after Phoenix, retaining the 06 → 07 edge. Plans 06–13 all precede plan
  14's terminal gate; the other AyoKoding plans may proceed in parallel when the DAG permits.
- Plan 10 (legacy unique migration) is in progress at
  [plans/in-progress/ayokoding-learn-revamp-10-legacy-unique-migration](./ayokoding-learn-revamp-10-legacy-unique-migration/README.md).

## Instructions

**Idea Capture**: For ideas not ready for formal planning, write a two-pager in `../ideas/`.

**Naming**: Plans in `in-progress/` use NO date prefix — just the slug (e.g., `organiclever-web-responsive-breakpoints/`). `backlog/` also uses no date prefix, so moving from `backlog/` is a pure move.

When starting work on a plan:

1. Move the plan folder: `git mv backlog/[identifier]/ in-progress/[identifier]/` (no rename — neither stage carries a date prefix)
2. Update the plan's README.md status to "In Progress"
3. Add the plan to this list

When completing a plan:

1. Rename and move: `git mv in-progress/[identifier]/ done/YYYY-MM-DD__[identifier]/` using today's completion date
2. Update this list
