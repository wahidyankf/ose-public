---
description: The agents that enforce this convention and the related conventions and principles it builds on
when_to_use: Read this to find which checker or fixer agent enforces this convention, or to trace its related conventions.
---

# Tools, Automation, and References

## Tools and Automation

- **`tutorial-by-example-checker`** — Validates by-example tutorial content,
  including scanning `**Why It Matters**:` sections for prohibited patterns
- **`tutorial-in-the-field-checker`** — Validates in-the-field tutorial content
  using the same Why It Matters rules
- **`tutorial-by-example-fixer`** — Applies fixes to by-example tutorial content,
  rewriting prohibited Why It Matters patterns as theoretical explanations
- **`tutorial-in-the-field-fixer`** — Applies fixes to in-the-field tutorial content

## References

**Related Conventions:**

- [Factual Validation Convention](../factual-validation.md) — Universal methodology for
  verifying factual correctness; the Fabricated Corporate Case Study Rule section in that
  document provides the foundational detection and fix patterns that this convention
  specializes for Why It Matters sections
- [Content Quality Principles](../quality.md) — Universal markdown quality standards
  (active voice, heading hierarchy, accessibility) that apply alongside this convention

**Related Principles:**

- [Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)
- [Root Cause Orientation](../../../principles/general/root-cause-orientation.md)
- [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)
- [Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)

**Agents:**

- `apps-ayokoding-www-by-example-maker` — Creates by-example tutorials; must follow this convention
- `apps-ayokoding-www-in-the-field-maker` — Creates in-the-field guides; must follow this convention
- `tutorial-by-example-checker` — Validates Why It Matters sections in by-example tutorials
- `tutorial-in-the-field-checker` — Validates Why It Matters sections in in-the-field guides
- `tutorial-by-example-fixer` — Fixes prohibited patterns in by-example tutorials
- `tutorial-in-the-field-fixer` — Fixes prohibited patterns in in-the-field guides
