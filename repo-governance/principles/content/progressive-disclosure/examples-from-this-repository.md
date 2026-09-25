---
description: Real examples from this repository of tutorial levels, documentation structure, and agent tool permissions.
when_to_use: Use when looking for worked examples of progressive disclosure applied in this repository.
---

# Examples from This Repository

## Tutorial Naming Convention

**Location**: `repo-governance/conventions/tutorials/naming.md`

**Six progressive levels**:

1. **Initial Setup (0-5%)**: Run "Hello World"
2. **Quick Start (5-30%)**: Explore independently
3. **Beginner (0-60%)**: Comprehensive foundation
4. **Intermediate (60-85%)**: Production systems
5. **Advanced (85-95%)**: Expert mastery
6. **Cookbook**: Practical recipes (any level)

**Progressive disclosure features**:

- PASS: Clear percentage ranges (depth, not time)
- PASS: Each level complete and useful
- PASS: Linear progression
- PASS: Cookbook as parallel practical track

## Documentation Structure

**Location**: `docs/` directory

```
docs/
  tutorials/        # Start here (learning-oriented)
  how-to/           # Next (problem-solving)
  reference/        # Later (information lookup)
  explanation/      # Deep dives (understanding)
```

**Progressive disclosure features**:

- PASS: Clear starting point (tutorials)
- PASS: Progression path visible
- PASS: Each category serves different need
- PASS: Beginners and experts both served

## Agent Tool Permissions

**Location**: `.agents/agents/` frontmatter

**Progressive tool access**:

```yaml
# Simple reader agent - minimal tools
tools: Read, Glob, Grep

# Writer agent - adds Write
tools: Read, Write, Glob, Grep

# Advanced agent - adds Edit
tools: Read, Write, Edit, Glob, Grep

# System agent - adds Bash
tools: Read, Write, Edit, Glob, Grep, Bash
```

**Progressive disclosure features**:

- PASS: Start with minimal tools
- PASS: Add tools as needed
- PASS: Explicit at each level
- PASS: Security through progressive access

## File Naming

**Location**: File naming convention

**Kebab-case simplicity**:

```
docs/tutorials/getting-started.md
docs/explanation/conventions/file-naming.md
docs/explanation/infrastructure/security/security-basics.md
```

**Progressive disclosure features**:

- PASS: Single rule for every file — kebab-case describing the content
- PASS: Category is conveyed by the directory path, which deepens as context grows
- PASS: Filename meaning is obvious without a prefix lookup table
- PASS: Easy for new contributors to follow on day one
