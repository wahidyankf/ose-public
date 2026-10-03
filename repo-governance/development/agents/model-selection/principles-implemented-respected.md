---
description: "Lists the core repository principles this convention implements and respects."
when_to_use: Use when checking which principles justify a model-tier choice.
---

# Principles Implemented/Respected

This practice implements the following core principles:

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Select the simplest model that can accomplish the task. Avoid using planning-grade reasoning for tasks that follow fixed patterns or templates. Simpler models reduce latency and resource consumption without sacrificing quality on structured work.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Every agent MUST declare its model tier in frontmatter and include a `Model Selection Justification` comment explaining why that grade was chosen. No implicit defaults, and no grade spelled as an absent field -- the reasoning is transparent and auditable.

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Model selection requires deliberate analysis of what cognitive capabilities the task demands. Agents should not default to the highest grade "just in case" -- each selection reflects a considered judgment about the task's actual requirements.
