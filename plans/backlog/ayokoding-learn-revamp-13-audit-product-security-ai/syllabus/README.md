# Syllabus — Audit of Product, Security, and AI Courses

**Custodian**: ayokoding-learn-revamp-13-audit-product-security-ai

This corpus specifies the audit of 45 existing courses: 16 in application development, 14 in AI engineering, 5 in
product and leadership, 5 in interview preparation, and 5 in security. It is learning-bearing because the plan changes
course content, adds lessons and drilling, and may revise a course's prerequisites. Unlike the corpora of plans 06 and
07, it does not specify new courses: each brief describes an existing course, what is wrong with it today (measured on
2026-10-09), and what the audit must change.

| Part                            | What it holds                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [courses/](./courses/README.md) | One brief per course: mode and reason, measured targets, expected defect classes, harness mode, size class, the per-course checklist, and concepts       |
| [paths/](./paths/README.md)     | A note, not manifests: this plan changes no path; it lists each course's baseline path positions, the AI Engineer path roles, and the rule for that path |

## Core Model

- A **course** is a path-neutral building block with a slug, a title, a format (its teaching mode), a one-sentence
  description, an estimated time, and its conceptual `prerequisites`. Its three parts are the course `overview.md`, the
  `learning/` pages, and the `drilling/` page. This plan does not change what a course is; it changes whether each one
  meets the series definition of done.
- A **brief** is the plan's specification of one audit. Its measured numbers are facts about the repository on
  2026-10-09; its targets are the definition of done in
  [tech-docs/002](../tech-docs/002-definition-of-done-and-targets.md).
- A **unit** is a folder with a `run.yaml` that the code harness runs twice
  ([tech-docs/003](../tech-docs/003-harness-conversion-design.md)).
- A **no-code course** teaches by scenarios, diagrams, and design exercises, and has no code folder. Eight of the 45 are
  no-code; they are "not applicable" in the harness coverage report.

## How Executors Use This Corpus

- The packet owners of a course (makers, `swe-developer`, fixers) receive that course's brief as their input, together
  with the tech-docs it links. For an AI course they also receive
  [tech-docs/011](../tech-docs/011-ai-fixtures-and-sourcing-policy.md), and for a safety-scanned course
  [tech-docs/012](../tech-docs/012-safe-lab-and-content-safety-rules.md). The table of today's numbers and the expected
  defect classes are the starting point; CP-1 confirms or corrects them.
- When CP-1 or a later step shows that a brief is wrong (a number, a class, a mode reason, a fallback), the coordinator
  edits the brief in the same branch and records the change in the ledger. This plan is the custodian, so that edit is
  allowed. A change to a target in [tech-docs/002](../tech-docs/002-definition-of-done-and-targets.md) is not made in a
  brief; it is made in 002 and recorded as a decision.
- A brief never changes a course's slug, mode, category, or place in a path. The two named exceptions are the `format`
  correction of two interview courses (decision D3) and the new `learning/` folder of two capstones (decision D15). Any
  other needed change is a question for the user.

## Disposition and Custody

- Disposition: `archive-with-plan` (declared in [tech-docs/README.md](../tech-docs/README.md#corpus-disposition)).
- This corpus reads plan 02's revised prerequisite lists, plan 08's AI Engineer path specification and capstone briefs,
  and the harness conversion design of plans 11 and 12 as handoff input, read-only and as text (the plans are archived
  before this one runs). It never edits them; [paths/README.md](./paths/README.md) records every difference found.

## Source of Truth

During execution, the briefs in this corpus are the target. After merge, the course pages under
`apps/ayokoding-www/content/en/learn/courses/`, the completion and content-safety tests under
`apps/ayokoding-www/tests/unit/be-steps/`, and the four rules in the skill modules are the source of truth, and this
corpus is history.
