---
description: States that this workflow uses Direct Orchestration — the calling context runs the phases, delegating research to web-researcher and invoking plan-planning.
when_to_use: Use when determining who runs this workflow's phases and how research and plan authoring are delegated.
---

# Execution Mode

**Direct Orchestration** — the calling context (top-level assistant session) orchestrates the
phases, delegating external version/CVE/yank research to `web-researcher` via the Agent tool,
running the human checkpoint inline (so the user's conversation is preserved), and invoking the
[plan-planning workflow](../../plan/plan-planning.md) for plan
authoring.
