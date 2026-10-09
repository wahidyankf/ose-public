# Syllabus — Accounting Courses Corpus

**Custodian**: ayokoding-learn-revamp-06-accounting-courses

This corpus specifies the 24 accounting courses this plan writes from scratch and the two accounting
skills paths it restructures. It is learning-bearing because the plan authors new course content,
sets each course's teaching mode, revises course prerequisites, and splits both accounting paths into
titled phases with per-phase outcomes.

| Part                            | What it holds                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [courses/](./courses/README.md) | One specification per course: mode and reason, targets, objectives, concepts, the full example list, drills |
| [paths/](./paths/README.md)     | One manifest specification per accounting path: phases, outcomes, `assumes`, page copy, and the exact JSON  |

## Core Model

- A **course** is a path-neutral building block. It has a slug, a title, a format (its teaching
  mode), a one-sentence description, an estimated time, and its true conceptual `prerequisites`.
- A course has three parts a reader opens: the course `overview.md`, the `learning/` pages (examples
  or worked examples, plus a capstone), and the `drilling/` page (practice).
- Every code example is a runnable unit with a `run.yaml`, checked by the code harness from plan 05.
- A **path** is an ordered list of titled **phases**. Both accounting paths are skills paths, so every
  phase is core and there is no extension (series decision 17).

## How Executors Use This Corpus

- The course maker for a course receives that course's file in [courses/](./courses/README.md) as
  its brief. The example list there is the **floor**: the maker writes every listed example and may
  add more up to the mode's ceiling.
- When execution shows that a listed example is wrong or unbuildable, the executor edits the course
  file in this corpus in the same branch and records the change in the plan's evidence. This plan is
  the custodian, so that edit is allowed.
- The path files in [paths/](./paths/README.md) hold the exact manifest JSON the restructure phase
  writes.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in
  [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- This plan reads the drafted skills phases of plan 02 (`ayokoding-learn-revamp-02-path-model`) as
  handoff input, read-only. It never edits plan 02's corpus; its own path files record every change
  against that draft.
- The archived corpora of the earlier accounting plans (2026-08-15 and 2026-08-16, listed in
  [tech-docs/001](../tech-docs/001-current-state-and-architecture.md#prior-art-in-the-repository)) are
  cited as lineage only.

## Source of Truth

During execution, the course files and the path JSON blocks in this corpus are the target. After
merge, the course pages under `apps/ayokoding-www/content/en/learn/courses/` and the manifests under
`apps/ayokoding-www/src/features/course-paths/manifests/skills/` are the source of truth, and this
corpus is history.
