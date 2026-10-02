---
description: Defines the mandatory Knowledge Capture pre-archival gate requiring every learnings.md entry to reach a terminal state.
when_to_use: Use when confirming every learnings.md entry reached a terminal state before archival.
---

# Finalization and Archival — Knowledge Capture Gate

**Continues** [Finalization and Archival — Rule-16 API Retest Gate](./037-finalization-rule16-api-retest.md).

If defects surface after archival, use the reopen path (rule 14) — move the folder back from
`done/` to `in-progress/`, strip the completion-date prefix, and note the defect in `README.md`.

**Knowledge Capture pre-archival gate (mandatory, before any archival step)**: Archival MUST NOT
proceed until the plan's Knowledge Capture phase is complete.

- Every entry in `learnings.md` (or the explicit "none" escape) reaches a terminal state: routed
  inline, filed as an explicitly authorized `plans/ideas/` two-pager (never a `plans/backlog/`
  artifact), reported without plan authorization with handoff evidence, or discarded with a
  one-line reason — zero entries left in an open, undecided state.
- Both the secret/sensitivity gate and the repo-relevance gate have been applied to every
  surviving entry before it was routed.
- See the [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) for the
  full triage rubric, the litmus test, and both safety gates — this gate references that
  convention rather than repeating its rubric.
- A plan with no Knowledge Capture phase and no explicit "none" record in `learnings.md` is
  incomplete for archival purposes.
