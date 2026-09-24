---
description: Worked examples tracing a principle through convention/practice into concrete implementation
when_to_use: Use when you need a concrete worked example of how a principle should trace through a convention or practice into enforced implementation.
---

# Traceability: From Principles to Implementation

Every principle should be traceable through three layers:

1. **Principle** (WHY) - The foundational value
2. **Convention or Practice** (WHAT/HOW) - The concrete rule implementing the principle
3. **Implementation** (ENFORCE) - Agents, code, or automation enforcing the rule

When documenting a new convention or practice, ALWAYS reference which principles it implements. When creating an agent, ALWAYS reference which conventions/practices it enforces.

## Complete Traceability Examples

### Example 1: Color Accessibility Principle

**Core Principle**: Accessibility First

**Convention**: [Color Accessibility Convention](../conventions/formatting/color-accessibility.md)

- Verified accessible palette (Blue, Orange, Teal, Purple, Brown)
- WCAG AA compliance required
- Color-blind testing mandatory

**Development**: [AI Agents Convention](../development/agents/ai-agents.md)

- Agent color categorization uses accessible palette
- Colored square emojis (🟦 🟩 🟨 🟪)
- Color is supplementary, not sole identifier

**Implementation**: Actual agent files

- Frontmatter `color` field uses accessible colors
- README displays colored emojis
- Text labels primary, color secondary

### Example 2: Explicit Over Implicit Principle

**Principle**: Explicit Over Implicit (software engineering)

**Practice**: [AI Agents Convention](../development/agents/ai-agents.md)

- Explicit `tools` field listing allowed tools
- No default tool access
- Security through explicit whitelisting

**Implementation**: Multiple agents enforce this

- **agent-maker**: Validates new agents have explicit `tools` field in frontmatter
- **rules-checker**: Audits agents for missing or incomplete tool declarations
- **rules-propagation**: Can add missing frontmatter fields

**Result**: All agent files contain explicit tool lists:

```yaml
---
tools: Read, Glob, Grep
---
```

### Example 3: Automation Over Manual Principle

**Principle**: Automation Over Manual (software engineering)

**Practice**: [Code Quality Convention](../development/quality/code.md)

- Automated formatting via Prettier
- Automated validation via git hooks
- Automated commit message checking

**Implementation**: Multiple systems enforce this

- **Husky + Rhino gate registry**: Pre-commit hook runs the `format-staged` gate, which formats staged code automatically
- **Commitlint**: Commit-msg hook validates message format
- **Various checker agents**: Automated quality validation (docs-checker, rules-checker, etc.)

**Result**: Code quality maintained automatically without manual intervention

## Related Documentation

- [Core Principles Index](./README.md) - All foundational principles
- [Using These Principles](./using-principles.md) - How to apply principles when creating conventions or making decisions

## Vision Supported

These examples make the [Open Sharia Enterprise Vision](../vision/open-sharia-enterprise.md)
auditable by showing how vision-aligned principles reach concrete repository mechanisms.
