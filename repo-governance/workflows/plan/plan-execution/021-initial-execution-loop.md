---
description: "Bounded-parallel execution loop: task update, repo-grounding, analysis, AI/HUMAN marker check."
when_to_use: Use when walking through how each delivery checklist item is picked up, repo-grounded, and routed for execution.
---

# 2. Initial Execution (Bounded-Parallel, Continuous)

Execute all delivery checklist items concurrently up to the plan's declared concurrency cap,
delegating each to the appropriate specialized agent.

**Orchestrator**: calling context (top-level assistant session)

**Execution loop** — bounded-parallel over ready items. Rule 1 (granularity) and Rule 4 (atomic
sync ritual) are enforced in this loop:

Dispatch every action checkbox whose dependencies are terminal, up to the concurrency cap (the
plan's declared N, default 3), reusing the plan's one worktree per repository; a failure blocks
only its downstream items. An item blocked by something outside the plan is recorded as blocked,
with what would unblock it, never skipped silently. A more optimal order found mid-run revises
`delivery.md` first, keeping acceptance criteria and the end result; a material change re-passes
the quality gate. Outcome-section Input/Outcome/Proof stays as shared context:

1. **`TaskUpdate in_progress`** on the matching task. At most N `in_progress` at a time (the
   concurrency cap).
2. **Pre-Item Repo-Grounding (HARD GATE — Anti-Hallucination)**: before delegating, repo-ground every claim in the checkbox per the [Plan Anti-Hallucination Convention §Repo-Grounding Rule](../../../development/quality/plan-anti-hallucination/repo-grounding-rule-hard.md#repo-grounding-rule-hard):
   - For each cited file path: `Bash test -f <path>`. If missing AND not marked `_New file_`: HALT the item, escalate to user with the failing path (do not invent a substitute).
   - For each cited Nx target: `jq -r '.targets | keys[]' apps/<project>/project.json | grep -qx '<target>'`. If missing AND not marked `_New target_`: HALT the item.
   - For each cited agent: `test -f .agents/agents/<name>.md` succeeds (agent definitions live
     flat in `.agents/agents/`, e.g. `.agents/agents/swe-developer.md`). If missing: HALT (no
     fabricating).
   - For each cited symbol: `Grep` for evidence. Missing AND not marked `_New symbol_`: HALT.
   - **Refuse-on-uncertainty**: if a cited fact cannot be grounded and the checkbox does not mark it as new, the orchestrator MUST escalate rather than guess. Surface the failure to the user with the specific claim and the missing artifact.
3. **Analyze the item** to determine whether to delegate to a specialized agent (see Agent Selection) or execute directly. If the checkbox carries a `_Suggested executor:_` annotation, use that agent (Priority 0). If the checklist text is otherwise ambiguous, consult the plan's `brd.md`, `prd.md`, and selected technical form for additional context.
4. **Execution-marker check (`[AI]`/`[HUMAN]`)** — read the checkbox's execution marker (per [Plans Organization Convention §Executor Tagging](../../../conventions/structure/plans/executor-tagging-tags-and-bias.md#executor-tagging--ai-vs-human-hard-rule)). `[AI]` or unmarked → execute normally (next bullet). `[HUMAN]` (or the human portion of an `[AI+HUMAN]` item) → the orchestrator MUST NOT attempt it: surface the item to the user verbatim with its acceptance criterion and any context they need, then STOP and wait for the user to confirm it is done before ticking the checkbox and continuing. For `[AI+HUMAN]`, perform the agent-preparable portion first, then hand off the human portion. This is a sanctioned stop (see Stopping rules) — not a violation of "never stop between phases."
5. **Execute the item** — delegate to that agent via the Agent tool, or perform the edit/command directly. Only for THIS one checkbox.
