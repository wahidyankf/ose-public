---
description: "Links to the agents and workflows this workflow composes with, and the principles and conventions it implements — including the systematic-coverage convention it defines canonically."
when_to_use: "Use when tracing which agent or convention backs a specific behaviour in this workflow, or when auditing its principle/convention compliance."
---

# Related Documents, Principles, and Conventions

## Related Documents

- [web-exploratory-tester Agent](../../../../.agents/agents/web-exploratory-tester.md) — Phase 1 spec-aware pass.
- [web-usability-tester Agent](../../../../.agents/agents/web-usability-tester.md) — Phase 2 spec-blind pass.
- [web-design-tester Agent](../../../../.agents/agents/web-design-tester.md) — Phase 3 design-aware pass.
- [plan-maker Agent](../../../../.agents/agents/plan-maker.md) — Phase 4 solidification + tech-docs/delivery/UI-assets authoring.
- [Plan Quality Gate workflow](../../plan/plan-quality-gate.md) — Phase 4 nested gate.
- [Plan Execution workflow](../../plan/plan-execution.md) — runs the plan later, after human review.
- [UI Mockups in Plan Docs](../../../conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope) — the both-tiers `assets/` mockup rule a UI-bearing plan must honour.
- [Feature Change Completeness](../../../development/quality/feature-change-completeness.md) — the specs+Gherkin rule the delivery checklist must honour.
- [Plans Organization Convention](../../../conventions/structure/plans.md) — in-progress plans use the date-free `<identifier>/` folder form.

## Principles Implemented/Respected

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Three independent perspectives are gathered and reconciled before any fix is proposed; the plan-maker grill forces explicit scope decisions.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Findings stay attributed to their source (EWT vs UWT vs DWT); the fix approach and delivery steps are written down before execution.
- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: One plan, one delivery checklist — shared root causes are fixed once via the cross-reference note.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Testing and authoring are delegated to specialized agents; the gate iterates automatically.
- **[No Time Estimates](../../../principles/content/no-time-estimates.md)**: Outcomes, not durations.

## Conventions Implemented/Respected

- **[Live-Tester Systematic Coverage](../../../development/quality/live-tester-systematic-coverage.md)**: the cross-tester forcing-functions (enumerate-don't-sample matrices, declared-invariant conformance), the recurrence + diff-since-last-run memory, and the cross-tester completeness critic this workflow enforces are defined canonically here.
- **[Plans Organization Convention](../../../conventions/structure/plans.md)**: The plan lands at `plans/in-progress/<identifier>/` with no date prefix.
- **[Feature Change Completeness](../../../development/quality/feature-change-completeness.md)**: The delivery checklist carries the specs+Gherkin coverage steps for the exploratory spec-gap proposals.
- **[UI Mockups in Plan Docs](../../../conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope)**: A UI-bearing plan carries an `assets/` folder with both-tier (lo-fi ASCII + hi-fi `.excalidraw.png`) mobile/tablet/desktop mockups, design-funnel alternatives, grounding rule, and token-only colors.
- **[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)**: Every material decision is grilled via `AskUserQuestion` with multiple-choice options plus the standing blank-state and "chat about this" options.
- **[Subagent Orchestration Convention](../../../development/agents/subagent-orchestration.md)**: The three testers run sequentially (one at a time), well within the concurrency cap.
- **[Linking Convention](../../../conventions/formatting/linking.md)**: Cross-references use GitHub-compatible markdown links with `.md` extensions.
