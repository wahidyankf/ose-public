---
description: "Common mistakes to avoid when developing AI agents, with problem, cause, and solution for each anti-pattern."
when_to_use: Use when reviewing an agent definition for a common authoring mistake, or naming which anti-pattern a finding matches.
---

# Anti-Patterns in AI Agents Development

> **Companion Document**: For positive guidance on what to do, see [Best Practices](../agents/best-practices.md)

Understanding common mistakes in AI agent development helps teams build more maintainable, secure, and effective automation. These anti-patterns cause complexity, security risks, and maintenance burden.

## Overview and Foundations

## Common Anti-Patterns

- [God Agent, Excessive Tools, Vague Descriptions, and Hardcoded Values](./anti-patterns/common-anti-patterns-1-to-4.md) — patterns 1-4.
- [Error Handling, Tool Documentation, Model Choice, Testing, and Naming](./anti-patterns/common-anti-patterns-5-to-9.md) — patterns 5-9.
- [Anti-Pattern 10: Enumeration-Based Guards](./anti-patterns/anti-pattern-10-enumeration-based-guards.md) — denylist guards that fail open.
- [Anti-Pattern 10 (Continued)](./anti-patterns/anti-pattern-10-confidence-assessment.md) — confidence-assessment recipe.
- [Anti-Pattern 11: Verification Prompts That Presuppose Their Conclusion](./anti-patterns/anti-pattern-11-presupposing-verification.md) — leading prompts.

## Summary and Reference

- [Summary of Anti-Patterns](./anti-patterns/summary-of-anti-patterns.md) — quick-reference table.

## Conclusion

Avoiding these anti-patterns ensures:

- Focused, single-responsibility agents
- Appropriate tool permissions
- Clear communication of purpose
- Autonomous operation patterns
- Portable, resilient implementations
- Robust error handling
- Transparent tool usage
- Cost-effective model selection
- Production-ready agents
- Discoverable agent library

## Conventions Implemented/Respected

This companion document supports the conventions in this directory by providing practical examples and guidance.

## Overview

Understanding common mistakes in AI agent development helps teams build more maintainable, secure, and effective automation. These anti-patterns cause complexity, security risks, and maintenance burden.

## Principles Implemented/Respected

This companion document respects:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Provides practical examples of simple vs complex approaches
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Makes patterns and anti-patterns explicit through clear examples

## Purpose

This document provides:

- Common anti-patterns in agent development
- Examples of problematic implementations
- Solutions and corrections for each anti-pattern
- Security and maintenance considerations

## Related Documentation

- [AI Agents Convention](./ai-agents.md) - Complete agent development standards
- [Best Practices](./best-practices.md) - Recommended patterns
- [Skill Context Architecture](./skill-context-architecture.md) - Skill integration patterns
- [Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md) - How agents plan, verify, and self-improve during multi-step tasks
- [Agents Index](../../../.agents/agents/README.md) - All available agents
