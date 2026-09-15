---
description: Lists the decision guides, related conventions, and development guides that cross-reference the plans organization convention.
when_to_use: Use when looking for a related convention or guide that this plans convention builds on or links out to.
---

# Related Documentation

**Decision Guides**:

- [How to Organize Your Work](../../../../docs/how-to/organize-work.md) — Decision guide for choosing between plans/ and docs/

**Related Conventions**:

- [Acceptance Criteria Convention](../../../development/infra/acceptance-criteria.md) — Writing testable acceptance criteria using Gherkin format
- [Diátaxis Framework](../diataxis-framework.md) — Organization of `docs/` directory
- [File Naming Convention](../file-naming.md) — Naming files within `docs/` (not applicable to plans/)
- [Diagram and Schema Convention](../../formatting/diagrams.md) — Standards for Mermaid diagrams
- [Color Accessibility Convention](../../formatting/color-accessibility.md) — Verified accessible palette, WCAG AA requirements, and color-blindness coverage for all diagram fills
- [Worktree Path Convention](../worktree-path.md) — Worktree routing to `worktrees/<name>/` (referenced by the Worktree Specification rule)
- [Plan Anti-Hallucination Convention](../../../development/quality/plan-anti-hallucination.md) — Pre-write verification recipes, repo-grounding rule, refuse-on-uncertainty, anti-pattern catalog (AP-1 through AP-10), specialized-executor annotation; consumed by the Execution-Grade Clarity rule and by the four plan agents
- [Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md) — Every grill question during plan creation (pre-write, post-write) MUST present 2-4 concrete options with trade-off descriptions; open-ended questions without options are FORBIDDEN; consumed by plan-maker Steps 1 and 8
- [No Secrets in Git Convention](../../security/no-secrets-in-committed-files.md) — Hard iron rule prohibiting secret values in any committed file, including plans and their permanent `done/` history
- [Evidence Capture Convention](../../../development/quality/evidence-capture.md) — Standards for the plan `evidence/` subfolder: screenshot naming (phase/locale/breakpoint), HTTP or native API wire records, locale coverage requirements, and what `plan-execution-checker` validates

**Development Guides**:

- [AI Agents Convention](../../../development/agents/ai-agents.md) — Standards for AI agents (including `plan-maker`, `plan-checker`, `plan-execution-checker`)
