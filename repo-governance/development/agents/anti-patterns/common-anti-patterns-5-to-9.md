---
description: "Covers Anti-Patterns 5-9: missing error-handling guidance, missing tool usage documentation, using the wrong model, skipping testing before deployment, and generic agent names."
when_to_use: Use when reviewing an agent for missing error handling, undocumented tool usage, a mismatched model tier, no test scenarios, or a non-descriptive name.
---

# Common Anti-Patterns — Error Handling, Tool Documentation, Model Choice, Testing, and Naming

## Anti-Pattern 5: No Error Handling Guidance

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

- Clear error behaviour
- Graceful degradation
- Better user experience

## Anti-Pattern 6: Missing Tool Usage Documentation

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

- Transparent behaviour
- Security clarity
- Easier troubleshooting

## Anti-Pattern 7: Using Wrong Model for Task

**Problem**: Using an execution-grade model for simple tasks, or a fast model for complex reasoning.

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

## Anti-Pattern 8: No Testing Before Deployment

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

## Anti-Pattern 9: Generic Agent Names

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
swe-releaser.md
plan-execution-checker.md
readme-maker.md
```

**Rationale:**

- Clear categorization
- Easy discovery
- Self-documenting
