---
description: "Lists common mistakes made when selecting a model grade for an agent."
when_to_use: Use when reviewing an agent's model-grade choice for a common mistake.
---

# Common Mistakes

| Mistake                                               | Problem                                                                           | Correction                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Using planning-grade for validation tasks             | Wastes resources; it may over-interpret instead of checking                       | Use execution-grade for checkers and fixers                         |
| Using fast for content creation                       | Fast lacks the reasoning depth for original content                               | Use planning-grade for makers and developers                        |
| Using execution-grade for link checks                 | Execution-grade is overqualified for deterministic command sequences              | Use fast for link checkers and file operations                      |
| Omitting model justification                          | Future maintainers cannot assess whether the grade is appropriate                 | Always include a Model Selection Justification block                |
| Defaulting to a higher grade "just in case"           | Violates Simplicity Over Complexity                                               | Analyze task requirements; use the simplest adequate grade          |
| Using fast for tasks with error handling              | Fast cannot reason about unexpected states                                        | Use execution-grade or planning-grade depending on error complexity |
| Leaving `tier` blank to mean planning-grade           | An absent field is unreadable — a deliberate grade looks like an omission         | Declare `tier: plan`; see Model Tiers — Planning-Grade              |
| Promoting to ultra on anticipated difficulty          | Doubles cost with no evidence the planning grade was the constraint               | Supply the three-part admission evidence, or stay at planning-grade |
| Assuming a grade means the same cost across harnesses | Grades map to different vendors' models with different prices and context windows | Check the per-harness table in Platform Binding Examples            |
