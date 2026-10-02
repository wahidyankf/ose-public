---
description: The hard-gated grilling protocol that resolves every deviation-matrix row to a recorded decision and establishes the research-needed flag.
when_to_use: Use when resolving cross-repo deviations before any plan authoring — this grill is a hard gate on Step 6.
---

# Step 3 — First Grill (Iterative, Blocking, Hard Gate)

Present the deviation matrix to the invoker. Grill every matrix row to a recorded decision.

**Grilling protocol** (per the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)):

- Each question presents **2-4 concrete options** with trade-off descriptions. One option is
  marked **(Recommended)**.
- Options are grounded in the inventories from Step 1. No invented options.
- One question per message. Fully resolve each before the next.
- Use an interactive multiple-choice tool (e.g., `AskUserQuestion`) when available; fall back
  to the markdown format only when the tool is unavailable.

**For each matrix row, record**:

- The chosen resolution (align-to-X / per-repo-deviation / drop)
- For deviations: the justification (why this repo differs from the others)
- For alignment: which repo's approach becomes the standard and why

**Iterative**: Answers in round N may open new rows. Grill again. Continue until every row is
resolved and no new rows remain.

**Hard gate**: The workflow MUST NOT proceed to Step 6 while any matrix cell lacks a recorded
decision. "We didn't discuss it" is a workflow failure.

**Research-needed flag**: Before closing this grill, establish whether external research is
required before authoring. Ask explicitly: are there harness or vendor conventions, library or
tool behaviour claims, or cross-repo prior art that need verification? Record the invoker's answer
as the research-needed flag (yes / no). This flag governs whether Step 4 runs or is skipped.

**Continues in** [Step 3 — First Grill (Mandatory Meta-Questions)](./010-step-3-first-grill-meta-questions.md).
