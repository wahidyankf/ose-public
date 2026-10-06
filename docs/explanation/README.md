---
title: Explanation
description: Conceptual documentation for open-sharia-enterprise
category: explanation
tags:
  - index
  - explanation
  - concepts
created: 2025-11-22
---

# Explanation

This is the place to understand the thinking behind open-sharia-enterprise: the problems it is trying to solve, the principles that shape it, and the reasons for important technical choices.

Start here when you are deciding whether an approach fits the product, orienting yourself to the repository, or looking for the context behind an existing practice. You do not need to know every implementation detail before reading these pages.

## Is explanation the right kind of documentation?

Explanation is for the **why** behind the work. It complements the other documentation types in the [Diátaxis framework](../../repo-governance/conventions/structure/diataxis-framework.md):

- **Tutorials** help you learn by doing.
- **How-to guides** help you complete a specific task.
- **Reference** documents state exact facts, interfaces, and rules.
- **Explanation** connects the context, alternatives, trade-offs, and decisions.

For a first view of how the repository is organized and governed, begin with [Rules](../../repo-governance/README.md). For the reasoning behind its layers and how they fit together, continue to [Repository Governance Architecture](../../repo-governance/repository-governance-architecture.md).

## Explore by question

### How does the repository make decisions and keep work consistent?

The governance material explains the shared foundation for product, engineering, and automation work. It covers the six-layer architecture—Vision, Principles, Conventions, Development, Agents, and Workflows—and the relationship between those layers.

- [Rules](../../repo-governance/README.md) — Orientation to the governance system, its layers, and its decision aids.
- [Repository Governance Architecture](../../repo-governance/repository-governance-architecture.md) — A deeper account of the architecture, including traceability, use, and verification.

### How is the software designed and built?

These guides introduce the engineering ideas used across the project. They are useful when you want a shared vocabulary before following implementation-focused documentation.

- [Software Engineering](./software-engineering/) — Entry point for programming languages, frameworks, architecture patterns, and development practices.
- [C4 Architecture Model](./software-engineering/architecture/c4-architecture-model/README.md) — A way to describe software architecture at progressively more detailed levels.
- [Domain-Driven Design (DDD)](./software-engineering/architecture/domain-driven-design-ddd/README.md) — Strategic and tactical patterns for representing complex business domains in software.

### Why did a cross-repository standard or convention take its current form?

Decision logs record the context, options, and conclusions behind past changes that touched multiple OSE repositories; they are historical and bind no repository to another. Read them when a rule feels surprising or when you need the rationale before extending related work.

- [Plan Domain Parity — Design Decisions (2026-06-06)](./plan-domain-parity-decisions.md) — Decisions from the cross-repository parity effort, including resolved and rejected approaches.
- [Gherkin Step-Keyword Cardinality — Parity Decisions (2026-06-07)](./gherkin-step-keyword-cardinality-parity-decisions.md) — Historical record of the superseded one-primary-keyword decision.
- [Standardize App Spec Trees — Parity Decisions (2026-06-11)](./standardize-app-spec-trees-parity-decisions.md) — Decisions on app-spec naming, merges, renames, and backend suffixes.
- [Lint & Safety Parity — Decisions (2026-06-12)](./lint-safety-parity-decisions.md) — Decisions on cross-language quality gates, configuration cleanup, and intentional exemptions.

### What can we learn from a problem after it has been resolved?

- [Post-Mortems](./post-mortems/) — Blameless retrospectives for incidents and regressions, plus the writing template and [Post-Mortem Convention](../../repo-governance/conventions/structure/post-mortems.md).
- [Standardize Secrets and Env — Parity Decisions (2026-06-10)](./standardize-secrets-and-env-parity-decisions.md) — >-

## Growing areas

As the platform evolves, this section will also collect explanations of Shariah-compliant enterprise principles, Islamic business foundations, and the technical background needed to understand the systems built here. Until then, the pages above are the best starting points for the project’s current reasoning and design history.
