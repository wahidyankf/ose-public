---
description: "Common mistakes to avoid when developing AI agents, with problem, cause, and solution for each anti-pattern."
when_to_use: "Read this index to find the right Anti-Patterns in AI Agents Development child document."
---

# Anti-Patterns in AI Agents Development

- [Common Anti-Patterns — God Agent, Excessive Tools, Vague Descriptions, and Hardcoded Values](./common-anti-patterns-1-to-4.md) — Covers Anti-Patterns 1-4: the God Agent, requesting excessive tool permissions, vague or generic descriptions, and hardcoded paths and values. Use when reviewing an agent for an overly broad responsibility, over-requested tools, a vague description, or a hardcoded path.
- [Common Anti-Patterns — Error Handling, Tool Documentation, Model Choice, Testing, and Naming](./common-anti-patterns-5-to-9.md) — Covers Anti-Patterns 5-9: missing error-handling guidance, missing tool usage documentation, using the wrong model, skipping testing before deployment, and generic agent names. Use when reviewing an agent for missing error handling, undocumented tool usage, a mismatched model tier, no test scenarios, or a non-descriptive name.
- [Anti-Pattern 10: Enumeration-Based Guards (Denylist Guards That Fail Open)](./anti-pattern-10-enumeration-based-guards.md) — Describes the enumeration-based (denylist) guard anti-pattern, where a guard silently fails open on an unenumerated input. Use when reviewing a guard, validator, or permission check that enumerates disallowed values instead of allowed ones.
- [Anti-Pattern 10: Enumeration-Based Guards (Continued)](./anti-pattern-10-confidence-assessment.md) — Continues Anti-Pattern 10 with the confidence-assessment recipe for applying a denylist-guard finding. Use when writing up a finding about a denylist guard that fails open.
- [Anti-Pattern 11: Verification Prompts That Presuppose Their Conclusion](./anti-pattern-11-presupposing-verification.md) — Describes the anti-pattern of a verification prompt whose wording presupposes the answer it should be checking. Use when writing or reviewing a verification prompt that a checker or fixer agent will run.
- [Summary of Anti-Patterns](./summary-of-anti-patterns.md) — Summarizes all eleven anti-patterns in one table for quick reference. Use when you need a quick-reference list of every anti-pattern instead of reading each section.
