# Best Practices for AI Agents Development

> **Companion Document**: For common mistakes to avoid, see [Anti-Patterns](./anti-patterns.md)

## Overview

This document outlines best practices for developing AI agents in the `.claude/agents/` directory. Following these practices ensures agents are maintainable, secure, and effective at automating repository tasks.

## Purpose

Provide actionable guidance for:

- Agent design and architecture
- Tool permission management
- Model selection
- Testing and validation
- Documentation standards

## Best Practices

### Practice 1: Single Responsibility Per Agent

**Principle**: Each agent should have one clear, focused purpose.

**Good Example:**

```yaml
---
name: docs-checker
description: Validates factual correctness of documentation
tools: [Read, Glob, Grep, WebFetch, WebSearch, Write, Bash]
model: sonnet
---
```

**Bad Example:**

```yaml
---
name: super-agent
description: Checks docs, writes content, deploys apps, manages files
tools: [*]  # Too many responsibilities
---
```

**Rationale:**

- Easier to test and debug
- Clear ownership and accountability
- Reusable across different workflows
- Simpler tool permission model

### Practice 2: Request Minimum Necessary Tool Permissions

**Principle**: Only request tools the agent actually needs.

**Good Example:**

```yaml
---
name: readme-checker
description: Validates README quality standards
tools: [Read, Glob, Grep, Write] # Only what is needed
---
```

**Bad Example:**

```yaml
---
name: readme-checker
description: Validates README quality standards
tools: [Read, Write, Edit, Bash, WebFetch, WebSearch] # Excessive
---
```

**Rationale:**

- Reduces security risk
- Clear what the agent can do
- Faster user approval
- Easier auditing

### Practice 3: Use Appropriate Model for Task Complexity

**Principle**: Match model to task complexity - use Haiku for simple tasks, Sonnet for complex reasoning.

**Good Example:**

```yaml
# Simple validation task
---
name: link-checker
model: haiku
---
# Complex reasoning task
---
name: plan-maker
model: sonnet
---
```

**Rationale:**

- Cost optimization
- Performance optimization
- Clear expectations

### Practice 4: Provide Clear, Actionable Descriptions

**Principle**: Agent description should clearly state WHAT the agent does and WHEN to use it.

**Good Example:**

```yaml
---
description: >
  Validates tutorial quality focusing on pedagogical structure,
  narrative flow, visual completeness, and hands-on elements.
  Use when reviewing tutorial documentation.
---
```

**Bad Example:**

```yaml
---
description: Checks stuff
---
```

**Rationale:**

- Users know when to invoke agent
- Clear purpose and scope
- Better discoverability

### Practice 5: Document Tool Usage in Agent Body

**Principle**: Explain HOW the agent uses its tools in the agent body content.

**Good Example:**

```markdown
## Tool Usage

- **Read/Glob/Grep**: Scan documentation files for validation
- **WebFetch/WebSearch**: Verify external references and links
- **Write**: Generate audit reports in generated-reports/
- **Bash**: Execute git commands for file operations
```

**Rationale:**

- Transparent behavior
- Easier troubleshooting
- Clear security model

### Practice 6: Test Agents with Edge Cases

**Principle**: Test agents with both valid and invalid inputs before deployment.

**Good Example:**

```markdown
## Test Scenarios

1. Valid markdown file - should pass
2. File with broken links - should report errors
3. Empty file - should handle gracefully
4. Non-existent file - should report error
5. Very large file - should handle pagination
```

**Rationale:**

- Robust error handling
- Graceful degradation
- Production readiness

### Practice 7: Provide Context in Agent Frontmatter

**Principle**: Include enough context in frontmatter for the agent to work autonomously.

**Good Example:**

```yaml
---
context: |
  This agent validates tutorial documentation following Diátaxis framework.
  Tutorials are learning-oriented, hands-on, and beginner-friendly.
  Reports written to generated-reports/ with UUID chains.
---
```

**Rationale:**

- Self-contained agents
- Reduced need for external documentation
- Consistent behavior

### Practice 8: Follow Naming Conventions

**Principle**: Use descriptive kebab-case names following agent naming patterns.

**Good Example:**

```
docs-checker.md
apps-ayokoding-web-general-maker.md
plan-executor.md
```

**Bad Example:**

```
checker.md
app1.md
my_agent.md
```

**Rationale:**

- Clear categorization
- Easy discovery
- Consistent organization

### Practice 9: Document Agent Dependencies

**Principle**: Clearly document what files, tools, or external services the agent depends on.

**Good Example:**

```yaml
---
dependencies:
  - generated-reports/ directory must exist
  - WebSearch tool requires US region
  - Expects Diátaxis framework structure
---
```

**Rationale:**

- Clear requirements
- Easier troubleshooting
- Better onboarding

## Related Documentation

- [AI Agents Convention](./ai-agents.md) - Complete agent development standards
- [Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid
- [Skill Context Architecture](./skill-context-architecture.md) - Skill integration patterns
- [Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md) - How agents plan, verify, and self-improve during multi-step tasks
- [Agents Index](../../../.claude/agents/README.md) - All available agents

## Summary

Following these best practices ensures:

1. Single responsibility per agent
2. Minimum necessary tool permissions
3. Appropriate model selection
4. Clear, actionable descriptions
5. Documented tool usage
6. Edge case testing
7. Sufficient context in frontmatter
8. Consistent naming conventions
9. Documented dependencies

Agents built following these practices are maintainable, secure, and effective at automating repository tasks.

## Principles Implemented/Respected

- **Automation Over Manual**: Agents automate repetitive tasks
- **Explicit Over Implicit**: Clear permissions and behavior
- **Security First**: Minimum necessary permissions
- **Simplicity Over Complexity**: Single responsibility, focused agents

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Agent files follow kebab-case naming
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, clear headings
- **[Dynamic Collection References Convention](../../conventions/writing/dynamic-collection-references.md)**: Avoid hardcoded counts in agent descriptions
