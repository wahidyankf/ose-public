---
description: Process guidance for applying core principles when creating conventions, making decisions, or reviewing changes
when_to_use: Use when creating a new convention or practice, resolving a conflict between principles, or reviewing a change for principle alignment.
---

# Using These Principles

## When Creating Conventions or Practices

Every new convention (documentation rule) or practice (software standard) must trace back to one or more core principles.

**Process**:

1. **Identify the need**: What problem are you solving?
2. **Choose the principle**: Which principle(s) does this implement?
3. **Document the connection**: In the convention/practice document, explicitly reference which principles it embodies
4. **Verify alignment**: Does the proposed rule conflict with any principles?
5. **Plan enforcement**: Which agents or automation will implement this rule?

**Template for new conventions/practices**:

```markdown
## Principles Implemented/Respected

This convention implements the following core principles:

- **Principle Name**: Explain how this rule embodies the principle
- **Another Principle**: Explain the connection
```

**Questions to ask**:

- Does this convention embody our core principles?
- Which principle does it support?
- Does an existing mechanism suffice? (applies Simplicity Over Complexity)
- Is it explicit and understandable? (violates Explicit Over Implicit)
- Is it accessible to all users? (violates Accessibility First)
- Can it be automated? (supports Automation Over Manual)

## When Making Decisions

Prioritize principles in order of importance:

1. **Deliberate Problem-Solving** - Think before acting; surface assumptions and tradeoffs first
2. **Root Cause Orientation** - Fix root causes, not symptoms; minimal impact; senior engineer standard
3. **Accessibility First** - Never compromise accessibility
4. **Explicit Over Implicit** - Clarity beats convenience
5. **Simplicity Over Complexity** - Simple solutions first
6. **Automation Over Manual** - Automate when proven repetitive
7. **Progressive Disclosure** - Support all skill levels
8. **No Time Estimates** - Plans schedule by dependency, not duration

> **Note**: This priority ordering applies when principles appear to conflict. All principles apply in normal circumstances - this list guides conflict resolution, not principle selection. Items 1-2 are general problem-solving principles that apply universally; items 3-8 are content, documentation, and software-engineering principles.

## When Adding New Conventions or Practices

After creating a new convention or practice document:

1. **Use docs-maker** to create the convention/practice document with principles section
2. **Use rules-maker** to make the change effective across repository:
   - Update AGENTS.md with brief summary
   - Update relevant README files (conventions/development index)
   - Update agents that should enforce the new rule
   - Add validation checks to appropriate checker agents
3. **Use rules-checker** to validate consistency after changes
4. **Use rules-propagation** if issues found (after user review)

**Workflow**: docs-maker (create) → rules-maker (propagate) → rules-checker (validate) → rules-propagation (write any fix)

## Vision Supported

Applying principles consistently keeps repository decisions aligned with the
[Open Sharia Enterprise Vision](../vision/open-sharia-enterprise.md) instead of treating that vision
as disconnected introductory prose.

## When Reviewing Changes

Check that changes:

- ✅ Respect accessibility standards
- ✅ Use explicit configuration
- ✅ Maintain simplicity
- ✅ Leverage automation appropriately
- ✅ Support progressive learning
- ✅ Avoid artificial time constraints
- ✅ Trace back to core principles (documented in convention/practice)
