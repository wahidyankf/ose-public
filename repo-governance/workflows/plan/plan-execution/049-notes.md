---
description: Summarizes the orchestrator model, automation posture, idempotency, and other operating characteristics of plan execution.
when_to_use: Use for a quick-reference summary of plan execution's operating characteristics and how it differs from plan-quality-gate.
---

# Notes

- **Orchestrator model**: calling context (top-level assistant session) coordinates specialized agents per the rules in this workflow, never implementing substantive changes directly
- **Semi-automated**: calling context may request user input for critical decisions, but execution continues autonomously otherwise
- **Idempotent**: Safe to re-run on partially completed plans, won't duplicate work
- **Progressive**: Each cycle builds on previous work, continuously updating checklists and task status
- **Observable**: Generates validation reports for every validation cycle; task status visible in real time
- **Bounded**: `max-cycles`, never above three, prevents runaway execution
- **Archival**: Automatically moves successfully completed plans to done/ folder
- **History-preserving**: Uses git mv to maintain commit history when archiving

**Key Differences from plan-quality-gate**:

1. **Execution-focused**: Orchestrated directly by the calling context (which delegates per-item work to specialized agents) instead of by `plan-quality-gate` (which edits plan documents)
2. **End-to-end**: Covers full plan lifecycle from execution through validation to archival
3. **Progressive delivery**: Continuously ticks delivery checklist items and updates task status throughout execution
4. **Archival automation**: Moves completed plans to plans/done/ automatically
5. **Bounded cycles**: At most three execute-validate cycles, the same ceiling every quality gate keeps
6. **Delegation model**: Routes each item to the domain-appropriate specialized agent

This workflow ensures complete plan execution with validated quality, making it ideal for systematically implementing project plans from start to archive.
