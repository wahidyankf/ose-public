---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Backend Essentials](../backend-essentials/learning/overview.md) supplies a
  running service whose boundaries can be inspected, while [Object-Oriented Design & Patterns](../object-oriented-design-and-patterns/learning/overview.md) supplies coupling,
  cohesion, and dependency inversion.
- **Tools and environment**: a Python 3 interpreter, a terminal, and a Mermaid-capable Markdown
  renderer. The runnable examples use only the standard library.
- **Assumed knowledge**: functions, modules, interfaces, and the difference between an application
  rule and an infrastructure detail.

## Why this exists

Architecture decides where change can safely occur. A useful boundary keeps things that change
together close and keeps unrelated changes apart; every boundary also costs an indirection that a
small system may not need. This course teaches that judgment through styles, quality attributes,
decision records, diagrams, and small executable boundary checks.

**Scope boundary**: this course explains how to choose and protect system boundaries. It introduces
DDD bounded contexts only as an architectural seam; [Domain-Driven Design](../domain-driven-design/overview.md)
teaches the model-discovery techniques inside that seam. It names event-driven architecture as a
style but leaves broker, delivery, and saga mechanics to [Event-Driven Architecture](../event-driven-architecture/overview.md).

## How the course is organized

- **[Learning](./learning/overview.md)** progresses from coupling and dependency direction, through
  quality-attribute trade-offs and architecture documentation, to evolutionary-architecture checks
  and a strangler migration.
- **[Drilling](./drilling/overview.md)** uses recall, scenario judgment, a boundary exercise, and a
  transfer checklist to make the trade-offs retrievable under pressure.

The source syllabus defines 52 annotated worked examples. Some use runnable, type-annotated Python;
others use a diagram or decision artifact because the learning goal is a relationship rather than an
API call. Each worked example names the concept it exercises and ends with a design consequence.

Next: [Learning Overview](./learning/overview.md) →
