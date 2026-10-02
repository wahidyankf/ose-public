---
description: Three-stage content quality workflow used across multiple agent families
when_to_use: "Use when designing or invoking a maker/checker/fixer agent trio."
---

# Maker-Checker-Fixer Pattern Convention

A three-stage content quality workflow: a **maker** creates or updates content, a **checker** validates it
non-destructively, and a **fixer** applies only validated, high-confidence fixes.

## Contents

- [Principles and Conventions](./maker-checker-fixer/principles-and-conventions.md) — Principles and conventions this pattern implements. Use to trace a rule back to its principle.
- [Overview](./maker-checker-fixer/overview.md) — What the pattern is and why it exists. Use when orienting to the pattern.
- [Stage 1: Maker (Comprehensive Content Management)](./maker-checker-fixer/stage-1-maker-comprehensive-content-management.md) — The maker stage - creates or updates content and dependencies. Use when a request calls for the maker stage.
- [Stage 2: Checker — Role and Examples](./maker-checker-fixer/stage-2-checker-role-and-examples.md) — The checker's role, tool pattern, color, and example agents. Use to identify which checker agent to use.
- [Stage 2: Checker — Responsibilities and Workflow](./maker-checker-fixer/stage-2-checker-responsibilities-and-workflow.md) — The checker's responsibilities and criticality categorization. Use when implementing checker responsibilities.
- [Stage 3: Fixer — Role and Examples](./maker-checker-fixer/stage-3-fixer-role-and-examples.md) — The fixer's role, tool pattern, color, and example agents. Use to identify which fixer agent to use.
- [Stage 3: Fixer — Responsibilities and Workflow](./maker-checker-fixer/stage-3-fixer-responsibilities-and-workflow.md) — The fixer's responsibilities and priority-based execution. Use when determining fix priority.
- [Common Workflows](./maker-checker-fixer/common-workflows.md) — The three common maker-checker-fixer workflows. Use when choosing a workflow for a task.
- [Agent Categorization by Color](./maker-checker-fixer/agent-categorization-by-color.md) — How the three stages map to agent colors. Use when verifying an agent's color.
- [Agent Families — repo-rules and ayokoding-www](./maker-checker-fixer/agent-families-repo-rules-and-ayokoding-www.md) — Two agent families using this pattern. Use for repo-wide rules or ayokoding-www content.
- [Agent Families — docs-tutorial, ose-www-content, and readme](./maker-checker-fixer/agent-families-docs-tutorial-ose-www-content-and-readme.md) — Three agent families using this pattern. Use for tutorials, ose-www content, or READMEs.
- [Agent Families — docs and plan](./maker-checker-fixer/agent-families-docs-and-plan.md) — Two agent families using this pattern. Use for documentation accuracy or plan completeness.
- [Agent Families — se-separation and repo-workflow](./maker-checker-fixer/agent-families-se-separation-and-repo-workflow.md) — The remaining two agent families using this pattern. Use for SE-doc separation or workflow docs.
- [When to Use Each Stage](./maker-checker-fixer/when-to-use-each-stage.md) — Decision guidance for maker vs. fixer. Use when unsure which stage applies.
- [Benefits of the Pattern](./maker-checker-fixer/benefits-of-the-pattern.md) — The five benefits of this pattern. Use to justify adopting this pattern.
- [Integration with Conventions](./maker-checker-fixer/integration-with-conventions.md) — How this pattern integrates with other conventions. Use to trace a convention into this workflow.
- [Preventing Iteration Loops — False-Positive Persistence and Changed-Files Record](./maker-checker-fixer/preventing-iteration-loops-false-positive-persistence-and-scoped-revalidation.md) — The first two safeguards against iteration loops. Use when a checker re-flags a false positive.
- [Preventing Iteration Loops — Self-Verification and Escalation](./maker-checker-fixer/preventing-iteration-loops-self-verification-and-escalation.md) — The remaining two safeguards. Use when a bash/sed fix may have failed.
- [Related Documentation](./maker-checker-fixer/related-documentation.md) — Links to related conventions and agent files. Use to find the doc backing this pattern.
