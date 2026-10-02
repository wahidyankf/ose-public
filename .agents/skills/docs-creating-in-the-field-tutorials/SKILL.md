---
name: docs-creating-in-the-field-tutorials
description: Guide for creating in-the-field production implementation guides - production-ready code with 20-40 guides following standard library first principle, framework integration, and enterprise patterns. Essential for creating production tutorials for programming languages on educational platforms
---

# In-the-Field Tutorial Creation Skill

## Purpose

This Skill provides comprehensive guidance for creating **in-the-field tutorials** - production implementation guides designed for developers with foundational knowledge ready to apply concepts in production environments using industry-standard frameworks and enterprise patterns.

**When to use this Skill:**

- Creating in-the-field tutorials for programming languages
- Writing production-ready code with framework integration
- Designing standard library→framework progression guides
- Teaching enterprise patterns and production practices
- Targeting experienced developers with by-example/by-concept foundation

## Core Concepts

See [Core Concepts](./reference/core-concepts.md) for what in-the-field tutorials are (and are not a replacement for), the target audience, and the standard-library-first principle with a worked progression example.

## Guide Structure

See [Guide Structure](./reference/guide-structure.md) for the six-part structure every in-the-field guide follows (why it matters, standard library first, framework introduction, diagrams, production patterns, trade-offs).

## Annotation Density Standards

See [Annotation Density Standards](./reference/annotation-density.md) for the 1.0-2.25 rule, what annotations should focus on, and a worked JUnit example.

## Production Code Quality Standards

**CRITICAL**: In-the-field code is production-ready, not educational simplifications.

### Code Completeness Requirements

- **Error handling**: try-with-resources, proper exceptions
- **Resource management**: Always close connections, streams
- **Logging**: Production logging at appropriate levels (SLF4J)
- **Security**: Input validation, secret management, secure defaults
- **Configuration**: Externalized configuration, no hardcoded values
- **Testing**: Integration tests demonstrating framework usage

## Guide Count and Diagram Standards

See [Guide Count and Diagram Standards](./reference/guide-count-and-diagrams.md) for the 20-40 guide target range with topic categories, and the 10-20 diagram frequency target with the mandatory accessible color palette.

## Common Mistakes

### ❌ Mistake 1: Framework without standard library first

**Wrong**: Jump directly to Spring Boot without showing HttpClient first

**Right**: Show java.net.http.HttpClient, explain limitations, then introduce Spring Boot

### ❌ Mistake 2: Simplified tutorial code instead of production code

**Wrong**: Omit error handling to keep example simple

**Right**: Include full try-with-resources, proper exception handling, logging

### ❌ Mistake 3: Generic framework justifications

**Wrong**: "JUnit is industry standard, everyone uses it"

**Right**: "JUnit provides test organization (no main method), reporting (pass/fail), automation (Maven integration)"

### ❌ Mistake 4: Missing trade-off discussion

**Wrong**: Only show framework approach

**Right**: Compare standard library vs framework with when to use each

## Checker Validation Checklist

See [Checking In-the-Field Format](./reference/checking-in-the-field-format.md) for the
`tutorial-in-the-field-checker` validation checklist and step-by-step validation order.

## References

**Primary Convention**: [In-the-Field Tutorial Convention](../../../repo-governance/conventions/tutorials/in-the-field.md)

**Related Conventions**:

- [Tutorial Naming Convention](../../../repo-governance/conventions/tutorials/naming.md) - In-the-field type definition
- [Content Quality Principles](../../../repo-governance/conventions/writing/quality.md) - Code annotation standards

**Related Skills**:

- `apps-ayokoding-www-developing-content` - ayokoding-web specific patterns
- `docs-creating-accessible-diagrams` - Accessible diagram creation

---

This Skill packages critical in-the-field tutorial creation knowledge for production implementation guides. For comprehensive details, consult the primary convention document.
