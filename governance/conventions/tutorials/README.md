---
title: "Tutorial Conventions"
description: Standards for creating learning-oriented tutorial content
category: explanation
tags:
  - index
  - conventions
  - tutorials
  - education
created: 2026-01-30
---

# Tutorial Conventions

Standards for creating learning-oriented tutorial content. These conventions answer the question: **"How do I CREATE tutorials?"**

## Purpose

This directory contains standards for tutorial creation, structure, naming, and content that apply to **all tutorial content** across the repository (docs/, ayokoding-web, oseplatform-web, anywhere). These conventions **build upon and extend** the universal [writing conventions](../writing/README.md).

## Documents

### Core Tutorial Standards

- [Tutorial Convention](./general.md) - **Universal** standards for creating learning-oriented tutorials with narrative flow, progressive scaffolding, and hands-on elements. Covers all 7 tutorial types that combine into Full Set Tutorial Package
- [Tutorial Naming](./naming.md) - **Universal** Full Set Tutorial Package definition (5 mandatory components) and tutorial type standards (Initial Setup, Quick Start, Beginner, Intermediate, Advanced, Cookbook, By Example)

### Tutorial Types

- [By Concept Tutorial](./by-concept.md) - Standards for narrative-driven by-concept tutorials (Component 4 of Full Set Tutorial Package) achieving 95% coverage through comprehensive concept explanations
- [By Example Tutorial](./by-example.md) - Standards for code-first by-example tutorials (Component 3 of Full Set Tutorial Package - PRIORITY) with 75-85 heavily annotated, self-contained, runnable examples. Prioritized for fast learning
- [Cookbook Tutorial](./cookbook.md) - Standards for problem-focused cookbook tutorials (Component 5 of Full Set Tutorial Package) with 30+ practical, copy-paste ready recipes organized by problem type
- [In-the-Field Tutorial Convention](./in-the-field.md) - Standards for production-ready implementation guides building on by-example/by-concept foundations with frameworks, libraries, and enterprise patterns

### Programming Language Tutorials

- [Programming Language Content Standard](./programming-language-content.md) - **Universal** Full Set Tutorial Package architecture for programming language education. Defines 5 mandatory components with by-example prioritized first
- [Programming Language Tutorial Structure](./programming-language-structure.md) - **Universal** directory structure for Full Set Tutorial Package with 5 mandatory components

## Full Set Tutorial Package

The Full Set Tutorial Package consists of 5 mandatory components:

1. **Foundational Tutorials** (Initial Setup, Quick Start) - Getting started content
2. **By Example Track** (Component 3 - PRIORITY) - Code-first, 75-85 examples, "move fast"
3. **By Concept Track** (Component 4) - Narrative-driven, "learn deep"
4. **Cookbook** (Component 5) - Practical recipes, problem-focused
5. **In-the-Field Track** - Production-ready implementations with frameworks and enterprise patterns

## Related Documentation

- [Writing Conventions](../writing/README.md) - Universal content quality standards (foundation)
- [Structure Conventions](../structure/README.md) - File organization and Diataxis framework
- [Hugo Conventions](../hugo/README.md) - Hugo site content standards
- [How to Add a Programming Language](../../../docs/how-to/add-programming-language.md) - Step-by-step guide

## Principles Implemented/Respected

This set of conventions implements/respects the following core principles:

- **[Documentation First](../../principles/content/documentation-first.md)**: Tutorial conventions mandate structured, comprehensive learning content as a primary deliverable. The Full Set Tutorial Package architecture ensures systematic documentation of all facets of a programming language or topic rather than ad-hoc, incomplete coverage.

- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: The five-component Full Set Tutorial Package follows a deliberate progression from foundational (Initial Setup, Quick Start) through increasing depth (By Example, By Concept, Cookbook). Learners access complexity at their own pace following a structured path.

- **[Accessibility First](../../principles/content/accessibility-first.md)**: By Example tutorials require self-contained, runnable examples that work without additional setup, lowering barriers to entry. Hands-on learning elements (required in all tutorial types) ensure content is accessible to different learning styles, not only theoretical readers.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: By Example track is prioritized (Component 3 - PRIORITY) because code-first, annotated examples deliver maximum learning value with minimum cognitive overhead. The five-component package structure provides a complete, non-overlapping taxonomy of tutorial types.
