---
description: Automate repetitive tasks to ensure consistency and reduce human error - humans for creative work, machines for repetition
when_to_use: Use when deciding whether a repetitive task should be automated, or when looking for this repository's automation examples.
---

# Automation Over Manual

**Automate repetitive tasks** to ensure consistency and reduce human error. Humans should focus on creative and strategic work, machines should handle repetitive, mechanical tasks.

- [Vision Supported](./automation-over-manual/vision-supported.md) — How this principle serves the Open Sharia Enterprise Vision. Use when explaining why an automation matters to the project's mission.
- [Why](./automation-over-manual/why.md) — Benefits of automation, problems with manual work, and when to automate. Use when deciding whether a repetitive task is worth automating.
- [How It Applies](./automation-over-manual/how-it-applies.md) — Pre-commit hook and commit message validation examples, with manual alternatives. Use when implementing or reviewing a pre-commit hook or commit message check.
- [How It Applies — AI Agents, Link Caching, and Code Formatting](./automation-over-manual/how-it-applies-ai-agents-link-caching-and-code-formatting.md) — AI agent validation, cached link verification, and Prettier formatting examples. Use when implementing an AI validation agent, link cache, or code formatter.
- [Anti-Patterns](./automation-over-manual/anti-patterns.md) — Four automation anti-patterns and why each is bad. Use when reviewing a workflow for automation gaps.
- [PASS: Best Practices](./automation-over-manual/best-practices.md) — Five best practices for effective automation. Use when designing a new automation.
- [Examples from This Repository](./automation-over-manual/examples-from-this-repository.md) — This repository's concrete automations and their benefits. Use to find an existing automation to reuse or extend.
- [References](./automation-over-manual/references.md) — External references on automation, git hooks, and code quality. Use to find further reading behind a claim in this document.

## Related Conventions

- [Code Quality Convention](../../development/quality/code.md) - Git hooks and Prettier
- [AI Agents Convention](../../development/agents/ai-agents.md) - Validation agents
- [Commit Message Convention](../../development/workflow/commit-messages.md) - Format checked by review; Commitlint on demand
- [Repository Validation](../../development/quality/repository-validation.md) - Standard validation patterns

## Relationship to Other Principles

- [Explicit Over Implicit](./explicit-over-implicit.md) - Automation makes behaviour explicit
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Automate demonstrated
  repetitive work or recurring risk with the smallest sufficient mechanism; do not build automation
  when an existing mechanism already satisfies the need
- [Accessibility First](../content/accessibility-first.md) - Automated accessibility checks

## What

**Automation** means:

- Repetitive tasks run automatically
- Consistency enforced by machines
- Human intervention only when needed
- Errors caught before they cause problems
- Time spent on creative work, not mechanical tasks

**Manual processes** mean:

- Humans perform repetitive tasks
- Inconsistency due to human error
- Fatigue from repetitive work
- Errors discovered late
- Time wasted on mechanical tasks
