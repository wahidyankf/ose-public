# Syllabus — Capstone Courses Corpus

**Custodian**: ayokoding-learn-revamp-08-capstone-courses

This corpus specifies the eight skeleton capstone courses this plan writes from scratch and the one
career path it changes (the AI Engineer path, which gains its goal). It is learning-bearing because
the plan authors new course content, sets each course's teaching mode, revises course `prerequisites`,
and restructures a path's core.

| Part                            | What it holds                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [courses/](./courses/README.md) | One specification per capstone: mode and reason, targets, project brief, milestones, acceptance criteria, rubric, examples, drills |
| [paths/](./paths/README.md)     | The AI Engineer manifest specification: goal, `assumes`, phases, outcomes, page copy, and the exact JSON                           |

## Core Model

- A **capstone course** is an integration project. It adds no new theory; it joins the ideas of its
  prerequisite courses in one runnable project with a stated brief, five milestones, acceptance
  criteria that each name the run that proves them, and a rubric.
- Its **mode** is Annotated-Concept (standard or no-code), declared in `learning/overview.md`. The
  catalog label `format: capstone` (plan 03) says the course is a capstone; it does not name a
  teaching mode. The repository has no "capstone" mode and this plan adds none
  ([tech-docs/002](../tech-docs/002-capstone-course-contract-and-modes.md#mode-selection)).
- Every code example is a runnable unit with a `run.yaml` (plan 05), including the project itself,
  which is one capstone unit with named stage runs and a `tests` run.
- A **path goal** (plan 02) makes a path's core exactly the goal's prerequisite closure. The AI
  Engineer path gets `capstone-build-your-own-coding-agent` as its goal.

## How Executors Use This Corpus

- The maker for a course receives that course's file in [courses/](./courses/README.md) as its brief.
  The example list there is the **floor**: the maker writes every listed example and may add more up
  to the mode's ceiling.
- When execution shows that a listed example is wrong or unbuildable, the executor edits the course
  file in this corpus in the same branch and records the change in the plan's evidence. This plan is
  the custodian, so that edit is allowed.
- [paths/](./paths/README.md) holds the exact manifest JSON that the path phase writes.
- The prerequisite edits listed in each course file are applied to the course's `_index.md` in the
  course's own commit, and the path checks run after every such commit.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in
  [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- This plan reads plan 02's drafted AI Engineer manifest as handoff input, read-only. It never edits
  plan 02's corpus; its own path file records every change against that draft.
- The earlier capstone outlines (all dated 2026-08-15) are cited as lineage only; each course file
  has a "Lineage" section.

## Source of Truth

During execution, the course files and the path JSON block in this corpus are the target. After
merge, the course pages under `apps/ayokoding-www/content/en/learn/courses/` and the manifest at
`apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json`
are the source of truth, and this corpus is history.
