# Syllabus — Path Model Corpus

**Custodian**: ayokoding-learn-revamp-02-path-model

This corpus specifies how the 4 AyoKoding career paths are restructured, and holds the drafted
restructure of the 4 skills paths as input for plans 06 and 07 (decision 39). It is learning-bearing
because the plan restructures curriculum: it splits each career path into titled core and extension
phases, changes which courses form each core, and revises course prerequisites. It authors no new
course content.

| Part                            | What it holds                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [courses/](./courses/README.md) | The course-level changes: `status: outline` markers and revised prerequisites, indexed to the evidence |
| [paths/](./paths/README.md)     | One manifest specification per path; skills files mark their drafted phases as plan 06/07 input        |

## Core Model

- A **course** is a path-neutral building block with a slug, a title, optional `status: outline`, and
  conceptual `prerequisites`.
- A **path** is an ordered list of **phases**. Core phases come first and lead to the path's goals;
  extension phases follow and are optional.
- A path's **core** is self-sufficient: every prerequisite of a core course is either earlier in the
  path or named in the path's `assumes` list.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in
  [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- Consumers are read-only. Later plans that change a path (for example plan 06 restructuring the
  accounting paths, or plan 08 completing the AI capstone) edit the live manifests under
  `apps/ayokoding-www/`, not this corpus. Plans 06 and 07 read the drafted skills phases in
  [paths/](./paths/README.md#skills-paths-input-for-plans-06-and-07) as **handoff input** and own
  any change to them.

## Source of Truth

During execution, the career JSON blocks and the skills "What Plan 02 Writes" blocks in
[paths/](./paths/README.md) are the target content; the drafted skills JSON is not. After merge,
the live manifests under `apps/ayokoding-www/src/features/course-paths/manifests/` are the source of
truth, and this corpus is history.
