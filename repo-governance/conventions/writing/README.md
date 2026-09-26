---
description: Reader-focused writing and validation rules for repository documentation
when_to_use: Use when writing or reviewing any markdown content and need the applicable content-quality, factual-validation, or documentation-writing rule.
---

# Writing Conventions

Use these conventions to write documentation that sounds like a capable teammate: clear about purpose, honest about limits, and useful on a first read.

## Purpose

This directory contains universal standards for writing documentation content that apply to ALL repository markdown contexts (docs/, apps/, plans/, root files). These are the foundational writing conventions that all other content builds upon.

## Documents

- [Content Quality Principles](./quality.md) — Universal markdown content quality standards applicable to all repository markdown contexts. Read this before writing or reviewing any markdown content in this repository.
- [Convention Writing Convention](./conventions.md) — Meta-convention defining how to write and organize convention documents in the conventions/ directory. Use when writing, restructuring, or reviewing a convention document under repo-governance/conventions/.
- [Dynamic Collection References Convention](./dynamic-collection-references.md) — Standards for referencing dynamic collections (agents, principles, conventions, practices, skills) in documentation without hardcoding counts that become stale. Use when writing a sentence, layer description, index summary, or directory-tree comment that mentions how many agents, skills, conventions, principles, practices, or workflows exist.
- [Factual Validation Convention](./factual-validation.md) — Universal methodology for validating factual correctness across all repository content using web verification. Use when verifying a technical claim, command, code example, version number, or external reference in any repository content before publishing it.
- [FP-Variant Multi-Language Convention](./fp-variant-multi-language.md) — Bidirectional idiomatic-language rule requiring F# AND Clojure tabs in FP-variant by-example tutorials in ayokoding-www, with each language kept idiomatically native rather than mechanically translated from the other. Use when writing or reviewing an FP-variant by-example tutorial page in ayokoding-www that presents F# and Clojure code side by side.
- [Indonesian Content Policy](./indonesian-content-policy.md) — Policy defining when and how to create Indonesian content in ayokoding-www bilingual platform. Use when deciding what language to write new ayokoding-www content in, or whether an Indonesian translation of existing content is warranted.
- [OSS Documentation Convention](./oss-documentation.md) — Standards for repository documentation files (README, CONTRIBUTING, ADRs, security). Read this before creating or reviewing a repository-level documentation file such as README, CONTRIBUTING, an ADR, or SECURITY.md.
- [README Quality Convention](./readme-quality.md) — Quality standards for README.md files ensuring engagement, accessibility, and scannability. Read this before writing or reviewing any README.md content in the repository.
- [Repository Working Language Convention](./repository-working-language.md) — English working-language rules and exceptions for repository-authored material. Use when choosing the natural language for repository-authored material or localized content.
- [Web Research Delegation Convention](./web-research-delegation.md) — Normative rule requiring AI agents to delegate public-web information gathering to the web-researcher delegated agent, with a narrow documented exception list. Read this before adding WebSearch or WebFetch to an agent, skill, or workflow, or before auditing one for compliance.
- [Why It Matters Content Convention](./why-it-matters-content.md) — Rule prohibiting corporate case studies and fabricated platform scenarios in Why It Matters sections of ayokoding-www tutorials; requires theoretical explanations only. Read this before writing or reviewing a Why It Matters section in an ayokoding-www tutorial.

## Related Documentation

- [Formatting Conventions](../formatting/README.md) — Markdown syntax, visual elements
- [Structure Conventions](../structure/README.md) — File organization and naming
- [Tutorials Conventions](../tutorials/README.md) — Tutorial creation standards

## Principles Implemented/Respected

This set of conventions implements/respects the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Content Quality Principles mandate alt text for all images, WCAG AA color contrast compliance, and semantic HTML usage. README Quality convention requires jargon elimination and acronym context to make content accessible to all audiences regardless of background.

- **[Documentation First](../../principles/content/documentation-first.md)**: The Conventions meta-convention establishes how all conventions are documented, making documentation standards self-referential and mandatory. Factual Validation convention ensures documented facts remain accurate and trustworthy.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Dynamic Collection References convention requires explicit links to authoritative index documents rather than hardcoded counts that can drift. Active voice requirement (Content Quality) makes agent and subject explicit in all writing.

- **[No Time Estimates](../../principles/content/no-time-estimates.md)**: Content Quality Principles permit labelled time estimates in documentation; the ban covers plan documents only.
