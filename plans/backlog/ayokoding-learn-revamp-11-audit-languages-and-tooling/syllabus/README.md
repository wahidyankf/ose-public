# Syllabus — Audit of Language and Tooling Courses

**Custodian**: ayokoding-learn-revamp-11-audit-languages-and-tooling

This corpus specifies the audit of 32 existing courses: 10 in tools and practices, 14 programming-language
primers, and 8 in infrastructure and operations. It is learning-bearing because the plan changes course
content, adds lessons and drilling, and may revise a course's prerequisites. Unlike the corpora of plans
06 and 07, it does not specify new courses: each brief describes an existing course, what is wrong with it
today (measured on 2026-10-09), and what the audit must change.

| Part                            | What it holds                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [courses/](./courses/README.md) | One brief per course: mode and reason, measured targets, expected defect classes, harness mode, size class, the per-course checklist, and concepts |
| [paths/](./paths/README.md)     | A note, not manifests: this plan changes no path; it lists each course's baseline path positions and the rule for the AI Engineer path             |

## Core Model

- A **course** is a path-neutral building block with a slug, a title, a format (its teaching mode), a
  one-sentence description, an estimated time, and its conceptual `prerequisites`. Its three parts are the
  course `overview.md`, the `learning/` pages, and the `drilling/` page. This plan does not change what a
  course is; it changes whether each one meets the series definition of done.
- A **brief** is the plan's specification of one audit. Its measured numbers are facts about the repository on
  2026-10-09; its targets are the definition of done in
  [tech-docs/002](../tech-docs/002-definition-of-done-and-targets.md).
- A **unit** is a folder with a `run.yaml` that the code harness runs twice
  ([tech-docs/003](../tech-docs/003-harness-conversion-design.md)).

## How Executors Use This Corpus

- The packet owners of a course (makers, `swe-developer`, fixers) receive that course's brief as their input,
  together with the tech-docs it links. The table of today's numbers and the expected defect classes are the
  starting point; CP-1 confirms or corrects them.
- When CP-1 or a later step shows that a brief is wrong (a number, a class, a mode reason, a fallback), the
  coordinator edits the brief in the same branch and records the change in the ledger. This plan is the
  custodian, so that edit is allowed. A change to a target in
  [tech-docs/002](../tech-docs/002-definition-of-done-and-targets.md) is not made in a brief; it is made in
  002 and recorded as a decision.
- A brief never changes a course's slug, mode, category, or place in a path. A needed change to one of those
  is a question for the user.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in
  [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- This corpus reads plan 02's revised prerequisite lists and plan 08's AI Engineer path specification as
  handoff input, read-only and as text (the plans are archived before this one runs). It never edits them;
  [paths/README.md](./paths/README.md) records every difference found.

## Source of Truth

During execution, the briefs in this corpus are the target. After merge, the course pages under
`apps/ayokoding-www/content/en/learn/courses/` and the completion test under
`apps/ayokoding-www/tests/unit/be-steps/` are the source of truth, and this corpus is history.
