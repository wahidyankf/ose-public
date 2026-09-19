---
description: What the syllabus convention covers (trigger, folder layout, tiering, disposition, custody, grandfathering) versus what it explicitly leaves to the authoring plan or other governance.
when_to_use: Read this to check whether a specific question — like course content quality or a deterministic validator — is covered by this convention or lies elsewhere.
---

# Learning-Plan Syllabus: Scope

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md).

## What This Convention Covers

- **The learning-bearing trigger** — the decidable test for whether a plan's delivery checklist
  authoring or restructuring course, tutorial, or curriculum content brings it into scope
- **Required folder layout** — `syllabus/README.md`, `syllabus/courses/`, `syllabus/paths/`, and
  their per-subfolder README requirements
- **Section tiering** — the measured REQUIRED / RECOMMENDED / OPTIONAL derivation for a course file's
  sections, and the copy-paste template built from it
- **Corpus Disposition** — the two-value declaration (`archive-with-plan`, `promote-to:<path>`) every
  learning-bearing plan that **owns** a corpus carries in its `tech-docs.md`
- **Custody** — single-custodian ownership, read-only consumers, the `custodied-by:<plan-id>` echo a
  **consumer** plan carries under its own `## Corpus Custody` heading, routed change requests, and the
  two archival hand-off branches
- **The grandfathered format cohort** — the pre-existing 17-file ordered-list divergence this
  convention does not retrofit

## What This Convention Does NOT Cover

- **The body content of any course or path manifest** — what a course teaches is a subject-matter
  decision made by the authoring plan, not a documentation-organization rule
- **A deterministic validator** — no `Rhino` subcommand enforces this convention today; a
  documented, runnable `grep` recipe stands in until one exists (tracked as a two-pager idea, not
  built here)
- **`docs/`, `apps/`, or `libs/` content** — this convention governs `plans/` artifacts only; shipped
  course content under `apps/ayokoding-www/content/` is out of scope
