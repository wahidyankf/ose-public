---
description: Defines the purpose of tech-docs.md, delivery.md, learnings.md, and the evidence/ folder within a multi-file plan.
when_to_use: Use when clarifying what belongs in tech-docs.md, delivery.md, learnings.md, or evidence/.
---

# Multi-File Structure — Additional File Purposes

Continues the file-purpose list from [Mature Formal-Plan Structure](./multi-file-structure-layout-and-core-files.md) for the remaining core files.

- **tech-docs.md**: architecture, design decisions with rationale, file-impact analysis, mechanics,
  dependencies, risks, rollback. For every new lasting mechanism, name the concrete need it addresses
  and why existing mechanisms are insufficient. No step-by-step checklist.
- **delivery.md**: sequential, ticked checklist of executable steps (`- [ ]`), organized by phase if needed. Plan-execution workflow reads this file to drive execution; `plan-execution-checker` reads it to verify completion. Opens with the `[AI]`/`[HUMAN]` executor legend; each phase ends with a `### Phase N Gate` (must-pass verification) followed by a Pause Safety note. For substantive plans, the final phase before archival is the **Knowledge Capture** phase (see [The Knowledge Capture Phase](./the-knowledge-capture-phase.md)).
- **`learnings.md`** (transient): a running log of generalizable learnings accrued while executing `delivery.md` — appended to in the moment an executor notices something worth keeping, not reconstructed from memory afterward. It is committed and moves with the plan folder through the lifecycle, but it is **never the system of record** — it is drained by the Knowledge Capture phase before archival and MAY be deleted from `plans/done/` at any later date. See the [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) for the full running-log format, the open-ended triage matrix, and the two mandatory safety gates.
- **`evidence/`** (optional): committed folder for testing evidence produced during plan execution — screenshots (one per breakpoint per locale), saved HTTP or native API wire results, Lighthouse reports, and other file-based artifacts referenced from `delivery.md` implementation notes. Created when the plan's first manual verification step runs. Moves with the plan folder on archival to `done/`. Binary files (PNG/JPG) are committed alongside the text files. See [Evidence Capture Convention](../../../development/quality/evidence-capture.md).
