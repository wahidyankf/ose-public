---
name: docs-creating-by-example-tutorials
description: Guide for creating by-example tutorials - code-first learning path with 75-85 heavily annotated examples achieving 95% language coverage. Covers five-part example structure, annotation density standards (1.0-2.25 comments per code line PER EXAMPLE), self-containment rules, and multiple code blocks for comparisons. Essential for creating by-example tutorials for programming languages on educational platforms
---

# By-Example Tutorial Creation Skill

## Purpose

This Skill provides comprehensive guidance for creating **by-example tutorials** - a code-first learning path designed for experienced developers who want rapid language pickup through heavily annotated working code examples.

**When to use this Skill:** creating by-example tutorials for programming languages, writing
heavily annotated code examples, designing code-first learning paths achieving 95% language
coverage, or meeting annotation density standards (1.0-2.25 comments per code line).

## Core Concepts

### What is By-Example?

**By-example tutorials** are a code-first learning path that achieves 95% language coverage through 75-85 heavily annotated, self-contained code examples.

**NOT a replacement for**:

- Beginner tutorials (which provide deep explanations for complete beginners)
- Quick Start (which is 5-30% coverage touchpoints)
- Cookbook (which is problem-solving oriented, not learning-oriented)

**Target Audience**: Experienced developers who already know at least one programming language
well, want quick pickup through working code rather than extensive narrative, and need ~90%
coverage efficiently.

### Five-Part Example Structure

Each example follows a consistent five-part structure:

```markdown
### Example N: Concept Name

**Brief explanation** (1-3 sentences describing what this example demonstrates)

**Optional diagram** (Mermaid diagram if concept relationships complex)

**Heavily commented code** (self-contained, runnable example with educational annotations)

**Key takeaway** (1-2 sentences summarizing the lesson)
```

## Annotation Density Standards

See [Annotation Density Standards](./reference/annotation-density.md) for the 1.0-2.25 rule, the
density calculation formula, the `// =>` annotation pattern with worked Java/Python examples, and
the quality-over-quantity guidance.

## Self-Containment Rules and Comparisons

See [Self-Containment Rules and Comparisons](./reference/self-containment-and-comparisons.md) for
what makes an example self-contained, how to achieve it, and the multiple-code-blocks pattern for
comparison examples.

## Coverage Progression and Diagram Usage

See [Coverage Progression and Diagram Usage](./reference/coverage-and-diagrams.md) for the three
tutorial difficulty levels (beginner/intermediate/advanced), the 75-85 example / 95% coverage
target, and when to use Mermaid diagrams with the accessible color palette.

## Common Patterns

See [Common Patterns](./reference/common-patterns.md) for three worked patterns — basic syntax,
complex operation with diagram, and multi-block comparison — each showing the exact markdown
source an example entry should follow.

## Best Practices and Common Mistakes

See [Best Practices and Common Mistakes](./reference/best-practices-and-mistakes.md) for the
example creation workflow, annotation guidelines, the pre-publish quality checklist, and the five
most common by-example mistakes with corrections.

## Checker Validation Checklist

See [Checking By-Example Format — Count, Density, Structure, Self-Containment](./reference/checking-density-structure-containment.md)
and [Checking By-Example Format — Grouping, Compliance, Diagrams, Examples-by-Level](./reference/checking-grouping-compliance-and-diagrams.md)
for the full `tutorial-by-example-checker` validation checklist and step-by-step
validation order.

## References

**Primary Convention**: [By Example Tutorial Convention](../../../repo-governance/conventions/tutorials/swe-by-example.md)

**Related Skills**: `apps-ayokoding-www-developing-content`, `docs-creating-accessible-diagrams`

---

This Skill packages critical by-example tutorial creation knowledge for rapid language pickup. For comprehensive details, consult the primary convention document.
