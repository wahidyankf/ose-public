# In-Progress Plans

Active project plans currently being worked on.

## Choose the right route 🧭

Use this index to understand delivery work that is underway. For the product story or a first local
run, start with the [repository README](../../README.md) and [documentation hub](../../docs/README.md)
instead. Each plan README explains its outcome and boundaries; its `delivery.md` is the detailed
execution checklist.

## Active Plans

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
- Plan 04 (learning experience) is in progress:
  [ayokoding-learn-revamp-04-learning-experience](./ayokoding-learn-revamp-04-learning-experience/README.md).

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
