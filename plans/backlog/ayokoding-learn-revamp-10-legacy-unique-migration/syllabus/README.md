# Syllabus — Legacy Unique Migration Corpus

**Custodian**: ayokoding-learn-revamp-10-legacy-unique-migration

This corpus specifies the inventory of `apps/ayokoding-www/content/en/learn/legacy/` against the course
library, and the 48 new courses this plan writes for the legacy topics that have no existing equivalent.
It is learning-bearing because the plan authors new course content; it is also the single artifact plan 14
(`legacy-removal`) consumes mechanically to build its redirect set and repoint the 94 `docs/` files that
still link into `learn/legacy/`.

| Part                                                         | What it holds                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [legacy-to-course-mapping.md](./legacy-to-course-mapping.md) | One row per legacy topic (105 rows covering all 1,150 files): covered, new, or obsolete, with evidence and target  |
| [courses/](./courses/README.md)                              | One specification per new course: mode and reason, targets, concepts, worked examples, capstone, drilling, lineage |

## Core Model

- A **legacy topic** is a directory under `learn/legacy/` that directly holds Markdown teaching pages
  (an "overview" plus a "by-example", "in-the-field", or similar track), or in three cases a single
  standalone page. The mapping table is built at this granularity, which matches how the legacy content
  is itself organized and how the by-example/in-the-field dumps used as evidence were produced.
- Every topic gets exactly one of three dispositions, each requiring evidence (plan-maker contract):
  **covered** (an existing, filled course already teaches the same subject at comparable or superseding
  depth — named, with the specific comparison that proves it), **new** (no existing course does, so this
  plan writes one), or **obsolete** (a stated legal, taxonomy, or navigation-page reason, not a silent
  drop).
- **This plan deletes nothing under `learn/legacy/`.** Every legacy file, including every `covered` and
  `obsolete` one, is untouched by this plan's own commits. Deleting `learn/legacy/`, adding the 308
  redirects, and repointing the 94 `docs/` files is plan 14's job, using this corpus's mapping table as
  its only input.
- A **new course** meets the same series definition of done as plans 06 to 09 (decision 27): it meets its
  mode's tutorial convention (By Example or Annotated-Concept, chosen per course with a reason) plus
  drilling; it passes its mode quality gate and the Content Quality Gate with no blocking finding; and
  every code example is green in the harness (plan 05).
- **Fast-changing tools** (the four AI coding-agent courses) carry an explicit accuracy policy: the maker
  re-verifies every version-specific or current-behaviour claim against the vendor's own documentation on
  the day the lesson is written, dates it, and drives every runnable example against a deterministic
  fixture shim rather than the live product. See
  [tech-docs/005](../tech-docs/005-fast-changing-tool-sourcing-policy.md).

## How Executors Use This Corpus

- The maker for a course receives that course's file in [courses/](./courses/README.md) as its brief. The
  example list there is the floor: the maker writes every listed example and may add more up to the
  mode's ceiling.
- A maker auditing or rewriting a `covered` target course in plans 11 to 13 may treat that legacy topic's
  pages as source material (the Lineage section of the nearest related new course, or the mapping table's
  Evidence column, names the legacy path), but must re-verify every fact rather than copy it as already
  correct, because the legacy pages predate this plan and are not maintained.
- When execution shows that a listed example is wrong or unbuildable, the executor edits the course file
  in this corpus in the same branch and records the change in the plan's evidence. This plan is the
  custodian, so that edit is allowed.
- Plan 14 reads [legacy-to-course-mapping.md](./legacy-to-course-mapping.md) directly; it does not re-derive
  the classification. A later edit to a `new` course's slug (for example, during its own quality-gate
  cycle) must be mirrored in the mapping table in the same commit, or plan 14's redirects will point at a
  course that no longer exists.

## Related

- [Plan overview](../README.md)
- [Business requirements](../brd.md)
- [Product requirements](../prd.md)
- [Technical design](../tech-docs/README.md)
- [Delivery checklist](../delivery.md)
