---
title: "Writing Conventions"
description: Content quality standards, validation methodology, and writing guidelines
category: explanation
tags:
  - index
  - conventions
  - writing
  - quality
created: 2026-01-30
---

# Writing Conventions

Content quality standards, validation methodology, and writing guidelines for documentation. These conventions answer the question: **"How do I WRITE documentation content?"**

## Purpose

This directory contains universal standards for writing documentation content that apply to ALL repository markdown contexts (docs/, Hugo sites, plans/, root files). These are the foundational writing conventions that all other content builds upon.

## Documents

- [Content Quality Principles](./quality.md) - Universal markdown content quality standards. Covers writing style and tone (active voice, professional, concise), heading hierarchy (single H1, proper nesting), accessibility (alt text, semantic HTML, color contrast, screen readers), and formatting
- [Conventions](./conventions.md) - **Meta-convention** defining how to write and organize convention documents. Covers document structure, scope boundaries, quality checklist, when to create new vs update existing, length guidelines, and integration with agents. Essential reading for creating or updating conventions
- [Dynamic Collection References](./dynamic-collection-references.md) - Standards for referencing dynamic collections (agents, principles, conventions, practices, skills) without hardcoding counts. Prevents documentation drift by requiring count-free references with links to authoritative index documents
- [Factual Validation](./factual-validation.md) - Universal methodology for validating factual correctness across all repository content using web verification (WebSearch + WebFetch). Defines core validation methodology, web verification workflow, confidence classification (Verified, Unverified, Error, Outdated)
- [OSS Documentation](./oss-documentation.md) - Standards for repository documentation files (README, CONTRIBUTING, ADRs, security) following open source best practices
- [Indonesian Content Policy](./indonesian-content-policy.md) - Policy defining when and how to create Indonesian content in ayokoding-web bilingual platform. Establishes English-first policy, defines Indonesian content categories (unique content, strategic translations, discouraged mirrors), and provides decision tree for language selection
- [README Quality](./readme-quality.md) - Quality standards for README.md files ensuring engagement, accessibility, and scannability. Defines problem-solution hooks, jargon elimination, acronym context requirements, benefits-focused language, navigation structure, and paragraph length limits
- [Web Research Delegation](./web-research-delegation.md) - Normative rule requiring AI agents to delegate public-web information gathering to the `web-research-maker` subagent when research exceeds the delegation threshold (2+ searches or 3+ fetches per claim). Enumerates three exceptions (single-shot known URL; fixer re-validation; link-reachability checkers)

## Related Documentation

- [Formatting Conventions](../formatting/README.md) - Markdown syntax, visual elements
- [Structure Conventions](../structure/README.md) - File organization and naming
- [Tutorials Conventions](../tutorials/README.md) - Tutorial creation standards
- [Hugo Conventions](../hugo/README.md) - Hugo site content standards

## Principles Implemented/Respected

This set of conventions implements/respects the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Content Quality Principles mandate alt text for all images, WCAG AA color contrast compliance, and semantic HTML usage. README Quality convention requires jargon elimination and acronym context to make content accessible to all audiences regardless of background.

- **[Documentation First](../../principles/content/documentation-first.md)**: The Conventions meta-convention establishes how all conventions are documented, making documentation standards self-referential and mandatory. Factual Validation convention ensures documented facts remain accurate and trustworthy.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Dynamic Collection References convention requires explicit links to authoritative index documents rather than hardcoded counts that can drift. Active voice requirement (Content Quality) makes agent and subject explicit in all writing.

- **[No Time Estimates](../../principles/content/no-time-estimates.md)**: Content Quality Principles explicitly prohibit time-based framing (e.g., "this takes 30 minutes"), ensuring documentation describes what will be accomplished rather than imposing artificial time pressure.
