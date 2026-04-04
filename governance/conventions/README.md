---
title: "Conventions"
description: Documentation conventions and standards for open-sharia-enterprise
category: explanation
subcategory: conventions
tags:
  - index
  - conventions
  - standards
created: 2025-11-22
updated: 2026-04-04
---

# Conventions

Documentation conventions and standards for the open-sharia-enterprise project. These documents define how documentation should be organized, named, written, and formatted.

**Governance**: All conventions in this directory serve the [Vision](../vision/open-sharia-enterprise.md) (Layer 0) and implement the [Core Principles](../principles/README.md) (Layer 1) as part of the six-layer architecture. Each convention MUST include a "Principles Implemented/Respected" section that explicitly traces back to foundational principles. See [Repository Governance Architecture](../repository-governance-architecture.md) for complete governance model and [Convention Writing Convention](./writing/conventions.md) for structure requirements.

## Scope

**This directory contains conventions for DOCUMENTATION:**

**Belongs Here:**

- How to write and format markdown content
- Documentation organization and structure (Diataxis)
- File naming, linking, and cross-referencing
- Visual elements in docs (diagrams, colors, emojis, math notation)
- Content quality and accessibility standards
- Documentation file formats (tutorials, plans)
- Hugo **content** writing conventions (historical - no active Hugo sites remain)
- Repository documentation standards (README, CONTRIBUTING)

**Does NOT Belong Here (use [Development](../development/README.md) instead):**

- Software development methodologies (BDD, testing, agile)
- Build processes and tooling workflows
- Hugo **theme/layout development** (historical - no active Hugo sites remain)
- Development infrastructure (temporary files, build artifacts)
- Git workflows and commit practices
- AI agent development standards
- Code quality and testing practices

## The Layer Test for Conventions

**Question**: Does this document answer "**WHAT are the documentation rules?**"

**Belongs in conventions/** if it defines:

- HOW to write markdown content (formatting, syntax, structure)
- WHAT files should be named or organized
- WHAT visual standards to follow in docs (colors, diagrams, emojis)
- WHAT content quality standards apply to documentation

**Does NOT belong** if it defines:

- WHY we value something (that's a principle)
- HOW to develop software/themes (that's a development practice)
- HOW to solve a specific problem (that's a how-to guide)

**Examples**:

- "File naming must use `prefix__identifier.md` format" - Convention (documentation rule)
- "Use 2-space indentation for nested lists" - Convention (documentation formatting)
- "Web app themes use Tailwind CSS" - Development (software practice)
- "Why we avoid time estimates in tutorials" - Principle (foundational value)

## Directory Structure

Conventions are organized into 6 semantic categories:

- **[formatting/](#formatting)** - Markdown formatting, syntax, visual elements
- **[linking/](#linking)** - Cross-reference and internal linking standards
- **[writing/](#writing)** - Content quality, validation, writing standards
- **[structure/](#structure)** - Documentation organization, file naming, plans
- **[tutorials/](#tutorials)** - Tutorial creation and structure conventions
- **[hugo/](#hugo)** - Hugo site content conventions (mostly deprecated — all active sites now use Next.js 16)

---

## Formatting

Standards for markdown formatting, syntax, and visual elements.

- [Color Accessibility](./formatting/color-accessibility.md) - MASTER REFERENCE for all color decisions. Verified accessible color palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161) supporting all color blindness types, WCAG AA standards, with complete implementation guidance for Mermaid diagrams and AI agent categorization
- [Diagrams and Schemas](./formatting/diagrams.md) - Standards for Mermaid diagrams (primary) and ASCII art (optional) with color-blind friendly colors for accessibility
- [Emoji Usage](./formatting/emoji.md) - Semantic emoji usage to enhance document scannability and engagement with accessible colored emojis
- [Indentation](./formatting/indentation.md) - Standard markdown indentation using 2 spaces per indentation level. YAML frontmatter uses 2 spaces. Code blocks use language-specific conventions
- [Linking Convention](./formatting/linking.md) - Standards for linking between documentation files using GitHub-compatible markdown. Defines two-tier formatting for rule references (first mention = markdown link, subsequent mentions = inline code)
- [Mathematical Notation](./formatting/mathematical-notation.md) - Standards for LaTeX notation for mathematical equations and formulas. Defines inline (`$...$`) vs display (`$$...$$`) delimiters, forbidden contexts (code blocks, Mermaid), Obsidian/GitHub dual compatibility
- [Nested Code Fences](./formatting/nested-code-fences.md) - Standards for properly nesting code fences when documenting markdown structure within markdown content. Defines fence depth rules (outer = 4 backticks, inner = 3 backticks), orphaned fence detection, and validation checklist
- [Timestamp Format](./formatting/timestamp.md) - Standard timestamp format using UTC+7 (Indonesian WIB Time)

## Linking

Standards for cross-referencing and internal linking between repository content.

- [Internal AyoKoding Reference Links](./linking/internal-ayokoding-references.md) - Standards for linking from docs/ to apps/ayokoding-web/ content using relative paths instead of public web URLs. Ensures links work during local development, testing, and remain portable across environments. Defines path calculation method, common patterns, and enforcement mechanisms for repository-internal references

## Writing

Content quality standards, validation methodology, and writing guidelines.

- [Content Quality Principles](./writing/quality.md) - Universal markdown content quality standards applicable to ALL repository markdown contexts (docs/, Next.js web content, plans/, root files). Covers writing style and tone (active voice, professional, concise), heading hierarchy (single H1, proper nesting), accessibility (alt text, semantic HTML, color contrast, screen readers), and formatting
- [Conventions](./writing/conventions.md) - **Meta-convention** defining how to write and organize convention documents. Covers document structure, scope boundaries, quality checklist, when to create new vs update existing, length guidelines, and integration with agents. Essential reading for creating or updating conventions
- [Dynamic Collection References](./writing/dynamic-collection-references.md) - Standards for referencing dynamic collections (agents, principles, conventions, practices, skills) without hardcoding counts. Prevents documentation drift by requiring count-free references with links to authoritative index documents. **Agents**: repo-governance-checker, repo-governance-fixer
- [Factual Validation](./writing/factual-validation.md) - Universal methodology for validating factual correctness across all repository content using web verification (WebSearch + WebFetch). Defines core validation methodology (command syntax, features, versions, code examples, external refs, mathematical notation, diagram colors), web verification workflow, confidence classification (Verified, Unverified, Error, Outdated)
- [Indonesian Content Policy](./writing/indonesian-content-policy.md) - Policy defining when and how to create Indonesian content in ayokoding-web. Establishes English-first policy for technical tutorials, defines Indonesian content categories (unique content, strategic translations, discouraged mirrors), provides decision tree for language selection, and specifies agent behavior for content creation
- [OSS Documentation](./writing/oss-documentation.md) - Standards for repository documentation files (README, CONTRIBUTING, ADRs, security) following open source best practices
- [README Quality](./writing/readme-quality.md) - Quality standards for README.md files ensuring engagement, accessibility, and scannability. Defines problem-solution hooks, jargon elimination (plain language over corporate speak), acronym context requirements, benefits-focused language, navigation structure, and paragraph length limits. **Agents**: readme-maker, readme-checker

## Structure

Documentation organization frameworks, file naming, and project planning structure.

- [Diataxis Framework](./structure/diataxis-framework.md) - Understanding the four-category documentation organization framework we use (Tutorials, How-To, Reference, Explanation)
- [File Naming Convention](./structure/file-naming.md) - Systematic approach to naming files with hierarchical prefixes encoding directory structure
- [Per-Directory Licensing](./structure/licensing.md) - Standards for the per-directory licensing strategy using FSL-1.1-MIT for product apps, behavioral specifications (specs, E2E tests), and their supporting CLI tools, and MIT for shared libraries and reference implementations. Guiding principle: implementation code (HOW) can be MIT; behavioral specifications (WHAT) must be FSL to prevent clean-room engineering of competing products. Defines LICENSE file placement rules, template requirements, copyright notice format, and rules for new directories
- [Plans Organization](./structure/plans.md) - Standards for organizing project planning documents in plans/ folder including structure (ideas.md, backlog/, in-progress/, done/), naming patterns (YYYY-MM-DD\_\_identifier/), lifecycle stages, and project identifiers. Defines how plans move from ideas - backlog - in-progress - done
- [Programming Language Documentation Separation](./structure/programming-language-docs-separation.md) - Establishes clear separation between repository-specific programming language style guides (docs/explanation/) and educational programming language content (ayokoding-web). Defines scope boundaries, prerequisite knowledge requirements, cross-referencing patterns, and DRY principle application. Applies to all programming languages (Java, Python, Golang, TypeScript, Elixir, Kotlin, Dart, Rust, Clojure, F#, C#)
- [Specs Directory Structure](./structure/specs-directory-structure.md) - Canonical directory structure for Gherkin feature files, C4 architecture diagrams, and OpenAPI contracts in the specs/ directory. Defines path patterns, domain subdirectory rules (required for BE/FE, flat for CLI), and lib spec organization

## Tutorials

Tutorial creation, structure, naming, and content standards applying to **all tutorial content** (docs/, ayokoding-web, oseplatform-web, anywhere). These conventions **build upon and extend** the writing conventions above.

- [By Concept Tutorial](./tutorials/by-concept.md) - **Universal** standards for narrative-driven by-concept tutorials (Component 4 of Full Set Tutorial Package) achieving 95% coverage through comprehensive concept explanations. Applies to all programming language tutorials across the repository
- [By Example Tutorial](./tutorials/by-example.md) - **Universal** standards for code-first by-example tutorials (Component 3 of Full Set Tutorial Package - PRIORITY) with 75-85 heavily annotated, self-contained, runnable examples achieving 95% coverage. Defines five-part example structure (brief explanation, optional Mermaid diagram, heavily annotated code with `// =>` notation, key takeaway), self-containment rules across beginner/intermediate/advanced levels, educational comment standards (1-2.25 ratio), and coverage progression (0-40%, 40-75%, 75-95%). Prioritized for fast learning ("move fast"). Applies to all programming language tutorials across the repository
- [Cookbook Tutorial](./tutorials/cookbook.md) - **Universal** standards for problem-focused cookbook tutorials (Component 5 of Full Set Tutorial Package) with 30+ practical, copy-paste ready recipes organized by problem type. Defines recipe structure (Problem - Solution - Explanation - Pitfalls - Related), lighter annotation density (0.5-1.5 vs 1-2.25), recipe independence (no required reading order), and cross-level applicability (useful for all skill levels). Complements both by-example and by-concept tracks. Applies to all programming language tutorials across the repository
- [Programming Language Content Standard](./tutorials/programming-language-content.md) - **Universal** Full Set Tutorial Package architecture for programming language education. Defines 5 mandatory components with by-example prioritized first (Component 3: code-first 75-85 examples for fast learning), by-concept second (Component 4: narrative-driven for deep learning), plus foundational tutorials, cookbook in tutorials/, and supporting docs. Coverage philosophy (0-30% foundational, 95% learning tracks), quality metrics, and completeness criteria. Applies to all programming language tutorials (docs/, ayokoding-web, anywhere). **See also**: [How to Add a Programming Language](../../docs/how-to/hoto__add-programming-language.md)
- [Programming Language Tutorial Structure](./tutorials/programming-language-structure.md) - **Universal** directory structure for Full Set Tutorial Package with 5 mandatory components: foundational tutorials (initial-setup, quick-start), by-example track (Component 3 - PRIORITY: code-first with 75-85 examples, 95% coverage, "move fast"), by-concept track (Component 4: narrative-driven, 95% coverage, "learn deep"), and cookbook (Component 5: practical recipes in tutorials/cookbook/). Defines navigation pattern (by-example first), weight values, and creation order. All 5 components required for complete language content. Applies to all programming language tutorials across the repository
- [Tutorial Convention](./tutorials/general.md) - **Universal** standards for creating learning-oriented tutorials with narrative flow, progressive scaffolding, and hands-on elements. Covers all 7 tutorial types that combine into Full Set Tutorial Package. Applies to all tutorial content (docs/, ayokoding-web, oseplatform-web, anywhere)
- [Tutorial Naming](./tutorials/naming.md) - **Universal** Full Set Tutorial Package definition (5 mandatory components) and tutorial type standards (Initial Setup, Quick Start, Beginner, Intermediate, Advanced, Cookbook, By Example). Replaces old "Full Set" concept (5 sequential levels) with new architecture emphasizing component completeness. Applies to all tutorial content across the repository
- [In-the-Field Tutorial Convention](./tutorials/in-the-field.md) - **Universal** standards for production-ready implementation guides that build on by-example and by-concept foundations by introducing frameworks, libraries, and enterprise patterns used in real-world systems. Targets developers ready to apply concepts in production environments. Applies to all in-the-field tutorial content across the repository

## Hugo (Historical)

Hugo site-specific content conventions. **All Hugo sites have migrated to Next.js 16.** These conventions are preserved for historical reference only.

- [Hugo Content - ayokoding](./hugo/ayokoding.md) - **DEPRECATED** — Historical Hugo conventions for ayokoding-web (Hextra theme). ayokoding-web has migrated to Next.js 16. Preserved for reference only
- [Hugo Content - OSE Platform](./hugo/ose-platform.md) - **DEPRECATED** -- Historical Hugo conventions for oseplatform-web (PaperMod theme). oseplatform-web has migrated to Next.js 16. Preserved for reference only
- [Hugo Content - Shared](./hugo/shared.md) - **DEPRECATED** -- Historical shared Hugo content conventions. No active Hugo sites remain. Preserved for reference only

## Related Documentation

- [Repository Governance Architecture](../repository-governance-architecture.md) - Complete six-layer architecture (Layer 2: Conventions)
- [Core Principles](../principles/README.md) - Layer 1: Foundational values that govern conventions
- [Development](../development/README.md) - Layer 3: Software practices (parallel governance with conventions)
- [Software Design Reference](../../docs/explanation/software-engineering/ex-soen__software-design-reference.md) - Cross-reference to authoritative software design and coding standards

---

**Last Updated**: 2026-04-04
