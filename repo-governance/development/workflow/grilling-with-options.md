---
description: Agents and workflows MUST resolve open design decisions using structured multiple-choice questions, not open-ended prose prompts.
when_to_use: Use whenever an agent or workflow must resolve an open design decision with the user, instead of asking an open-ended prose question.
---

# Grilling-With-Options Convention

When an agent or workflow must resolve open design decisions with the user — during plan
creation, design review, stress-testing, or requirements clarification — it MUST present
structured multiple-choice questions, not open-ended prose prompts. This convention defines
the required format, mechanism, and scope for all such interactions.

## Contents

- [Principles and Conventions Implemented](./grilling-with-options/principles-and-conventions-implemented.md) — Why this convention exists.
- [Purpose and Scope](./grilling-with-options/purpose-and-scope.md) — Why grilling replaces prose questions; what is covered.
- [Rule 1 and Rule 2](./grilling-with-options/rule-1-and-rule-2.md) — Explore before asking; 2-4 structured options.
- [Rule 3 and Rule 4](./grilling-with-options/rule-3-and-rule-4.md) — Trade-off per option; exactly one Recommended.
- [Rule 5 and Rule 6](./grilling-with-options/rule-5-and-rule-6.md) — One decision per question; the native-tool mechanism.
- [User Decisions Required Envelope](./grilling-with-options/user-decisions-required-envelope.md) — The outbound subagent-to-root envelope.
- [Resolved User Decisions Envelope](./grilling-with-options/resolved-user-decisions-envelope.md) — The inbound root-to-subagent payload.
- [Staged Native Rendering](./grilling-with-options/staged-native-rendering.md) — Rendering 3-4 leaves through a 2-3-option native tool.
- [Markdown Fallback Format](./grilling-with-options/markdown-fallback-format.md) — The inline format for non-interactive roots.
- [Rule 7 and Rule 8](./grilling-with-options/rule-7-and-rule-8.md) — Unlisted answers; the two standing options.
- [When This Convention Applies](./grilling-with-options/when-this-convention-applies.md) — The six triggering contexts.
- [Examples](./grilling-with-options/examples.md) — PASS and FAIL grilling questions.
- [Validation](./grilling-with-options/validation.md) — The valid/invalid checklist.
- [Special Considerations and Tools and Automation](./grilling-with-options/special-considerations-and-tools-and-automation.md) — Grilling inside plan-maker; enforcement tools.
- [Platform Binding Examples — Primary and Secondary Harnesses](./grilling-with-options/platform-binding-examples-claude-code-and-opencode.md) — `AskUserQuestion` and `question` bindings.
- [Platform Binding Examples — Codex and All Other Harnesses](./grilling-with-options/platform-binding-examples-codex-and-all-other-harnesses.md) — `request_user_input` and the markdown fallback.

## Related Documentation

- [grill-me Skill](../../../.agents/skills/grill-me/SKILL.md) — Canonical implementation.
- [plan-maker Agent](../../../.claude/agents/plan/plan-maker.md) — Invokes grill-me in Steps 1 and 8.
- [plan-planning Workflow](../../workflows/plan/plan-planning.md) — Invokes grill-me in Steps 1 and 3.
- [plan-execution Workflow](../../workflows/plan/plan-execution.md) — Invokes grill-me before execution.
- [Plans Organization Convention](../../conventions/structure/plans.md) — Plan structure this process serves.
- [Multi-Harness Binding Convention](../../conventions/structure/multi-harness-binding.md) — The two-tier binding model.
- [Agent Workflow Orchestration Convention](../agents/agent-workflow-orchestration.md) — Grilling as the pre-execution decision gate.
- [Implementation Workflow Convention](../workflow/implementation.md) — Grilling resolves what "work" means.
