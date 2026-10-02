---
description: Conforming every surviving idea to the eight-section template, appending provenance lines, and applying the urgency/importance rubrics.
when_to_use: Use when normalizing an idea's structure, recording its move history, or filing it into an Eisenhower quadrant.
---

# Steps 6-8 — Two-Pager Reshape, Provenance, and Classification

## 6. Two-pager reshape

Bring every surviving, merged, or relocated file into exact conformance with the
[Two-Pager Template](../../../conventions/structure/plans/two-pager-template.md#two-pager-template)'s eight sections:
title + one-line summary, Problem/context, Why now, Prior art, Proposed direction, Rough scope &
non-goals, Risks & open questions, and What success looks like. A file with an extra or missing
section, or a missing provenance blockquote in its first ten lines, is reshaped to match — content
is preserved and reorganized into the template's structure, never discarded.

## 7. Provenance

For a file the Step 5 relocation moved, append a line to its existing provenance blockquote —
preserving every line already there, never overwriting it —
`> Relocated from <source-repo>/plans/ideas/<file> on YYYY-MM-DD by plan-ideas-grooming.` For a
file Step 9 renames without relocating it, append the analogous line instead:
`> Renamed from <old-file> on YYYY-MM-DD by plan-ideas-grooming.` Both lines make the file's history
recoverable even though git history does not follow a file across independent repositories, and even
though a same-repo rename's git history, while technically followable via `git log --follow`, still
benefits from an explicit human-readable note at the point of read.

Record every relocation and rename this run performs — including the ones deferred by an
interrupted relocation (Step 5) or a filename collision (Step 9) — as an append-only entry under a
`## Grooming Log` section in that repo's own `plans/ideas/README.md`. Because every repo this
workflow touches, whether as a relocation source or destination, gets its own log entry in its own
tree, the audit trail travels with the repo rather than living in one external file unreachable from
a sibling repo.

## 8. Classification

Apply both of the following rubrics — stated exactly as they must be checked, so classification is
repeatable and auditable rather than a per-run judgment call — to every surviving idea, and file it
into `plans/ideas/q1-urgent-important/`, `plans/ideas/q2-not-urgent-important/`,
`plans/ideas/q3-urgent-not-important/`, or `plans/ideas/q4-not-urgent-not-important/` within its
Step 4 resolved-residency repo:

- **Urgency rubric**: read the idea's Why now section. The idea is classified **urgent** only if it
  names or blocks an active in-progress or backlog plan, or documents an already-observed live
  defect. An idea with no such reference is classified **not-urgent**.
- **Importance rubric**: read the idea's full content. The idea is classified **important** only if
  it affects two or more repos, a security or secrets concern, a data-integrity or data-loss risk, a
  currently-blocking CI gate, or a rule an existing checker enforces. An idea matching none of those
  signals is classified **not-important**.
