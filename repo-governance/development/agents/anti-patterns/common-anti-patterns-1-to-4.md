---
description: "Covers Anti-Patterns 1-4: the God Agent, requesting excessive tool permissions, vague or generic descriptions, and hardcoded paths and values."
when_to_use: Use when reviewing an agent for an overly broad responsibility, over-requested tools, a vague description, or a hardcoded path.
---

# Common Anti-Patterns — God Agent, Excessive Tools, Vague Descriptions, and Hardcoded Values

## Anti-Pattern 1: God Agent

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

## Anti-Pattern 2: Requesting Excessive Tool Permissions

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

## Anti-Pattern 3: Vague or Generic Descriptions

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

## Anti-Pattern 4: Hardcoded Paths and Values

**Problem**: Agent has hardcoded paths or values that break when structure changes.

**Bad Example:**

```yaml
---
context: |
  Always write reports to /home/<user>/repos/project/local-tmp/<agent-family>/
  Check files in /home/<user>/repos/project/docs/
---
```

**Solution:**

```yaml
---
context: |
  Write reports to local-tmp/<agent-family>/ (relative to repo root)
  Check files in docs/ directory
  Use Glob to find files dynamically
---
```

**Rationale:**

- Portable across environments
- Works on different machines
- Resilient to restructuring
