---
description: Defines the priority-ordered heuristics the orchestrator uses to pick a specialized agent for each delivery checklist item.
when_to_use: Use when deciding which agent should execute a given delivery checklist item.
---

# Agent Selection

The orchestrator selects the best agent for each delivery checklist item using these rules, applied in priority order:

0. **Suggested-executor annotation (HIGHEST priority)**: If the checkbox carries a `_Suggested executor: <agent-name>_` annotation per [Plan Anti-Hallucination Convention §Specialized-Agent Delegation](../../../development/quality/plan-anti-hallucination/specialized-agent-delegation-and-validation-rituals.md#specialized-agent-delegation-hallucination-reduction), verify the agent file resolves via `test -f .agents/agents/<name>.md` — definitions live flat in the canonical agent directory — and use that agent. The annotation is the plan author's explicit choice — it overrides heuristics 1–4 below. If the annotated agent does not exist, terminate the item with status `fail` and surface the missing-agent error to the user (do not silently fall back).

1. **Match by project/app name**: If the checklist item names a specific app (e.g., `organiclever-be`), use the agent for that app's language (e.g., `swe-rust-dev`). Refer to [CLAUDE.md](../../../../CLAUDE.md) for the full app list and their tech stacks.

2. **Match by file extension**: If the item references files with a recognizable extension (`.ts`, `.java`, `.py`, `.go`, `.kt`, `.fs`, `.cs`, `.clj`, `.ex`, `.rs`, `.dart`), use the corresponding `swe-{language}-dev` agent.

3. **Match by content type**: If the item involves documentation (`docs/`, `README.md`), governance (`repo-governance/`), specs (`specs/`), or E2E tests (`*-e2e`, Playwright), use the appropriate content agent (`docs-maker`, `rules-maker`, `readme-maker`, `specs-maker`, `swe-e2e-dev`).

4. **Match by framework/tool keywords**: If the item mentions a framework (Spring Boot, Ktor, FastAPI, Gin, Phoenix, Giraffe, Axum, Pedestal, Next.js, Flutter), use the agent for that framework's language.

5. **Fallback (direct execution)**: If no specialized agent cleanly matches — e.g., a one-line edit to a governance doc, a grep or file-move operation, an `npm` command — the orchestrator executes the item directly via `Edit` / `Bash` without delegating. Direct execution is only for trivial, context-bounded work; substantive changes always route through an agent.

**Rationale**: Domain-specialized agents hallucinate less than generic orchestration because they carry deeper language and framework context. The Suggested-executor annotation is the plan author's hallucination-reduction lever; respect it before falling back to heuristics.

**The above are heuristics, not a closed list.** As new agents or apps are added to the repository, the orchestrator adapts automatically by reading the available agent list from the agent definition directory and matching based on the agent's description and the checklist item's content. The orchestrator should always check what agents are currently available rather than relying on a static table.

**Multi-concern items**: When a delivery checklist item spans multiple task types (e.g., a
TypeScript backend change that also requires a README update), delegate each concern separately
to its appropriate agent. Execute the implementation agent first, then the documentation agent.
