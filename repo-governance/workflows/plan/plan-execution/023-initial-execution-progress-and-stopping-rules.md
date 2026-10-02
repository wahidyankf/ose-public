---
description: Defines execution-loop step 9, progress-streaming cadence, success/failure criteria, and the sanctioned stopping rules.
when_to_use: Use when deciding whether the orchestrator may pause between items, or confirming a phase's success criteria.
---

# Initial Execution — Progress, Output, and Stopping Rules

**Continues** [Initial Execution — Verify, Capture, and Atomic Sync](./022-initial-execution-items-5-8.md).

**Progress streaming**: keep the live Task list fresh by executing the ritual after every item. Never queue up two or three item's worth of `completed` updates. After each phase boundary, emit a one-line user-visible status (phase, items ticked / total, files changed, preexisting fixes).

**Output**: `{execution-started}` — all delivery checklist items completed, checklist updated, Task list shows disk truth.

**Success criteria**: Every `- [ ]` that started the phase is now `- [x]` with implementation notes; every matching task is `completed`.

**On failure**: If a delegated agent fails and cannot resolve the issue, terminate with status `fail`. If the failure is recoverable, retry once before escalating. If the ritual partially lands (checkbox ticked but notes missing, or task marked completed but checkbox still `- [ ]`), roll back and treat the item as incomplete.

**Stopping rules**:

- Stop ONLY if a task fails and CANNOT be resolved after retry.
- Stop ONLY if a critical decision requires user input that cannot be inferred.
- Stop at a `[HUMAN]` step (sanctioned) — surface the action to the user and resume on confirmation per the Execution-marker check above. This is the one routine non-technical stop and does NOT violate "never stop between phases."
- Stop ONLY when ALL items are complete.
- NEVER stop between phases for approval — but DO verify the phase's `### Phase N Gate` is green before starting the next phase (a self-run verification checkpoint, not a wait-for-user pause); fix any failing gate check within the current phase first.
- NEVER batch-tick checkboxes, batch-complete tasks, or defer implementation notes.
- NEVER skip an item — if genuinely not applicable, add a note explaining why and tick it.
