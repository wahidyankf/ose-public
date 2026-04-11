# Anti-Patterns in AI Agents Development

> **Companion Document**: For positive guidance on what to do, see [Best Practices](./best-practices.md)

## Overview

Understanding common mistakes in AI agent development helps teams build more maintainable, secure, and effective automation. These anti-patterns cause complexity, security risks, and maintenance burden.

## Purpose

This document provides:

- Common anti-patterns in agent development
- Examples of problematic implementations
- Solutions and corrections for each anti-pattern
- Security and maintenance considerations

## Principles Implemented/Respected

This companion document respects:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Provides practical examples of simple vs complex approaches
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Makes patterns and anti-patterns explicit through clear examples

## Conventions Implemented/Respected

This companion document supports the conventions in this directory by providing practical examples and guidance.

## Common Anti-Patterns

### Anti-Pattern 1: God Agent

**Problem**: Single agent tries to handle too many responsibilities.

**Bad Example:**

```yaml
---
name: super-agent
description: Validates docs, creates content, deploys apps, manages files, runs tests
tools: [Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task]
---
```

**Solution**: Decompose into focused agents:

```yaml
---
name: docs-checker
description: Validates documentation quality
tools: [Read, Glob, Grep, Write]
---
---
name: docs-maker
description: Creates documentation content
tools: [Read, Write, Glob]
---
---
name: apps-deployer
description: Deploys applications to production
tools: [Bash, Grep]
---
```

**Rationale:**

- Easier to test and maintain
- Clear responsibility boundaries
- Simpler permission model
- Better reusability

### Anti-Pattern 2: Requesting Excessive Tool Permissions

**Problem**: Agent requests tools it does not actually use.

**Bad Example:**

```yaml
---
name: link-checker
description: Validates links in markdown files
tools: [Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task]
# Only needs: Read, Glob, Grep, WebFetch, Write
---
```

**Solution:**

```yaml
---
name: link-checker
description: Validates links in markdown files
tools: [Read, Glob, Grep, WebFetch, Write] # Only what is needed
---
```

**Rationale:**

- Reduces security risk
- Faster user approval
- Clear capability boundaries
- Easier auditing

### Anti-Pattern 3: Vague or Generic Descriptions

**Problem**: Agent description does not clearly communicate what it does or when to use it.

**Bad Example:**

```yaml
---
name: checker
description: Checks things
---
```

**Solution:**

```yaml
---
name: docs-tutorial-checker
description: >
  Validates tutorial quality focusing on pedagogical structure,
  narrative flow, visual completeness, and hands-on elements.
  Use when reviewing tutorial documentation.
---
```

**Rationale:**

- Clear purpose and scope
- Better discoverability
- Users know when to invoke

### Anti-Pattern 4: Hardcoded Paths and Values

**Problem**: Agent has hardcoded paths or values that break when structure changes.

**Bad Example:**

```yaml
---
context: |
  Always write reports to /home/user/repos/project/generated-reports/
  Check files in /home/user/repos/project/docs/
---
```

**Solution:**

```yaml
---
context: |
  Write reports to generated-reports/ (relative to repo root)
  Check files in docs/ directory
  Use Glob to find files dynamically
---
```

**Rationale:**

- Portable across environments
- Works on different machines
- Resilient to restructuring

### Anti-Pattern 5: No Error Handling Guidance

**Problem**: Agent does not document how to handle errors or edge cases.

**Bad Example:**

```yaml
---
description: Processes files and generates reports
# No mention of error handling
---
```

**Solution:**

```yaml
---
description: >
  Processes markdown files and generates reports.
  Handles missing files gracefully with warnings.
  Skips binary files. Creates output directory if missing.
---
```

**Rationale:**

- Clear error behavior
- Graceful degradation
- Better user experience

### Anti-Pattern 6: Missing Tool Usage Documentation

**Problem**: Agent frontmatter does not explain how tools are used.

**Bad Example:**

```yaml
---
name: validator
tools: [Read, Write, Bash, WebFetch]
# No explanation of tool usage
---
```

**Solution:**

```markdown
## Tool Usage

- **Read**: Scan files for validation
- **Write**: Generate audit reports
- **Bash**: Execute git commands for file operations
- **WebFetch**: Verify external references
```

**Rationale:**

- Transparent behavior
- Security clarity
- Easier troubleshooting

### Anti-Pattern 7: Using Wrong Model for Task

**Problem**: Using expensive Sonnet model for simple tasks or Haiku for complex reasoning.

**Bad Example:**

```yaml
---
name: simple-link-checker
model: sonnet # Overkill for simple link validation
---
---
name: complex-architectural-analyzer
model: haiku # Insufficient for deep reasoning
---
```

**Solution:**

```yaml
---
name: simple-link-checker
model: haiku # Sufficient for validation
---
---
name: complex-architectural-analyzer
model: sonnet # Needed for deep reasoning
---
```

**Rationale:**

- Cost optimization
- Performance optimization
- Appropriate capability match

### Anti-Pattern 8: No Testing Before Deployment

**Problem**: Deploying agents without testing edge cases and error scenarios.

**Bad Example:**

```markdown
Created new agent, deploying immediately

# No testing performed
```

**Solution:**

```markdown
## Testing Checklist

- [ ] Valid input - passes
- [ ] Invalid input - reports error
- [ ] Empty file - handles gracefully
- [ ] Missing file - reports error
- [ ] Large file - handles pagination
- [ ] Permission denied - reports error clearly
```

**Rationale:**

- Production readiness
- Robust error handling
- Confident deployments

### Anti-Pattern 9: Generic Agent Names

**Problem**: Using non-descriptive agent names that do not indicate purpose.

**Bad Example:**

```
agent1.md
checker.md
validator.md
tool.md
```

**Solution:**

```
docs-tutorial-checker.md
apps-ayokoding-web-deployer.md
plan-execution-checker.md
readme-maker.md
```

**Rationale:**

- Clear categorization
- Easy discovery
- Self-documenting

## Summary of Anti-Patterns

| Anti-Pattern                   | Problem                          | Solution                           |
| ------------------------------ | -------------------------------- | ---------------------------------- |
| **God Agent**                  | Too many responsibilities        | Decompose into focused agents      |
| **Excessive Tool Permissions** | Requesting unused tools          | Request only necessary tools       |
| **Vague Descriptions**         | Unclear purpose                  | Clear, actionable descriptions     |
| **Hardcoded Paths**            | Breaks in different environments | Use relative paths                 |
| **No Error Handling Guidance** | Unclear error behavior           | Document error handling            |
| **Missing Tool Usage Docs**    | Unclear how tools are used       | Document tool usage                |
| **Wrong Model Selection**      | Cost/performance mismatch        | Match model to task complexity     |
| **No Testing**                 | Production issues                | Test edge cases before deployment  |
| **Generic Names**              | Hard to discover and categorize  | Use descriptive, categorized names |

## Related Documentation

- [AI Agents Convention](./ai-agents.md) - Complete agent development standards
- [Best Practices](./best-practices.md) - Recommended patterns
- [Skill Context Architecture](./skill-context-architecture.md) - Skill integration patterns
- [Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md) - How agents plan, verify, and self-improve during multi-step tasks
- [Agents Index](../../../.claude/agents/README.md) - All available agents

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

When implementing agents, ask: **Am I adding clarity or complexity?** If complexity, refactor to follow agent development best practices.
