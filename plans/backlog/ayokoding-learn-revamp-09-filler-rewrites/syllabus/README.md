# Syllabus — Filler Course Rewrites Corpus

**Custodian**: ayokoding-learn-revamp-09-filler-rewrites

This corpus specifies the eight templated filler courses this plan writes from scratch. It is
learning-bearing because the plan authors new course content, sets each course's teaching mode, revises three
course prerequisites, and fixes each course's learning objectives, example list, drilling katas, and capstone.

| Part                            | What it holds                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [courses/](./courses/README.md) | One specification per course: mode and reason, targets, defects found, accuracy notes, concepts, the full example list, katas, capstone |
| [paths/](./paths/README.md)     | A short index only: this plan changes no manifest, so it records where the eight courses sit today and the prerequisite edges it adds   |

## Core Model

- A **course** is a path-neutral building block. It has a slug, a title, a format (its teaching mode), a
  one-sentence description, an estimated time, and its true conceptual `prerequisites`.
- A course has three parts a reader opens: the course `overview.md`, the `learning/` pages (examples plus a
  capstone), and the `drilling/` page (practice).
- Every code example is a runnable unit with a `run.yaml`, checked by the code harness from plan 05. A few
  examples may be marked as illustrations where a brief says so.
- A course is **done** when it meets the eleven checks C1 to C11 in
  [tech-docs/002](../tech-docs/002-course-modes-and-definition-of-done.md), including the filler guard of
  [tech-docs/003](../tech-docs/003-filler-guard.md).

## How Executors Use This Corpus

- The course maker for a course receives that course's file in [courses/](./courses/README.md) as its brief. The
  example list there is the **floor**: the maker writes every listed example and may add more up to the mode's
  ceiling (85).
- Every fact in a brief's **Accuracy notes** is a probe, not a given. The maker re-verifies it at execution
  (tech-docs/005, rule A3) and corrects the brief and the course where the world differs.
- When execution shows that a listed example is wrong or unbuildable, the executor edits the course file in this
  corpus in the same branch and records the change in the plan's evidence. This plan is the custodian, so that
  edit is allowed. A change that moves an example named in tech-docs/005's capstone handoff changes that list in
  the same edit.
- The example counts in each brief were checked with a counting script when the brief was written (78 examples,
  or 80 for vulnerability management; 32 or more marked `[D]` as diagram examples). A maker who adds or moves
  examples keeps the three level pages at the numbers each brief states.
- `[D]` marks an example that carries a Mermaid diagram. `[S]` marks an example whose unit uses the `shell`
  toolchain (the Git course's oracle). `[I]` marks an illustration that is shown but not run, with the reason in
  the brief.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- This plan reads the drafted software-engineer career manifests of plan 02
  (`ayokoding-learn-revamp-02-path-model`) as placement input, read-only. It never edits plan 02's corpus;
  [paths/README.md](./paths/README.md) records what it observed.
- The archived corpora of the 2026-07-19 and 2026-08-15 course-authoring plans (listed in
  [tech-docs/001](../tech-docs/001-current-state.md#prior-art-in-the-repository)) are cited as lineage only.

## Source of Truth

During execution, the course files in this corpus are the target. After merge, the course pages under
`apps/ayokoding-www/content/en/learn/courses/` are the source of truth, and this corpus is history.
