---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Object-Oriented Design & Patterns](../object-oriented-design-and-patterns/learning/overview.md)
  supplies encapsulation and invariants; [Software Architecture](../software-architecture/overview.md)
  supplies boundaries and ports.
- **Tools and environment**: Python 3 and a terminal. Every runnable artifact uses only the
  standard library and has explicit type annotations.
- **Assumed knowledge**: classes, immutable data, unit tests, and the difference between a domain
  rule and an infrastructure detail.

## Why this exists

Database-shaped code makes business rules hard to find and easy to bypass. Domain-Driven Design
(DDD) gives the business a precise language in code, places each invariant inside one aggregate,
and limits a model to the bounded context in which its words have one meaning.

**Keep this if you forget everything else**: put a business invariant in the aggregate that owns
the data needed to protect it; refer to other aggregates by identity and reconcile cross-aggregate
work with events. DDD earns its ceremony in a complex core domain, not in a simple CRUD screen.

## Course map

The 80 runnable examples progress from ubiquitous language, entities, and value objects; through
aggregates, repositories, and domain events; to bounded contexts, context maps, and an
anti-corruption layer (ACL). [Event-Driven Architecture](../event-driven-architecture/overview.md)
continues the delivery, replay, and distributed-system concerns introduced here.

- [Learning](./learning/overview.md) teaches the tactical and strategic patterns through Python.
- [Drilling](./drilling/overview.md) turns the concepts into recall, judgment, coding, transfer,
  and self-check practice.

Next: [Learning Overview](./learning/overview.md) →
