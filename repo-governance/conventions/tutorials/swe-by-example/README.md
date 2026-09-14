---
description: "Standards for creating code-first by-example tutorials with 95% coverage, self-contained examples, and educational annotations"
when_to_use: "Read this index to find the right By-Example Tutorial Convention child document."
---

# By-Example Tutorial Convention

- [Purpose and Structure Integration with General Tutorial Standards](./purpose-and-structure-integration.md) — The purpose of by-example tutorials and how their structure adapts and inherits from the general Tutorial Convention.
- [Purpose and Structure Integration](./inherited-and-specialized-requirements.md) — The general tutorial standards by-example tutorials inherit, and the specialized requirements by-example adds on top of them.
- [Core Characteristics](./core-characteristics.md) — The three core characteristics of by-example tutorials: code-first approach, 95% coverage target, and 75-85 total example count.
- [Core Features First](./core-features-first-why.md) — Why by-example tutorials must teach core/built-in features before external dependencies, and the production impact of that ordering.
- [Core Features First](./core-features-first-what-to-prioritize.md) — Which core/built-in features to prioritize for programming languages, frameworks, and platforms, with worked examples across React, Vue, Node.js, and Spring.
- [Core Features First](./core-features-first-what-to-avoid.md) — Catalogs premature abstraction/extension anti-patterns for languages, frameworks, and platforms, with paired FAIL/PASS code examples.
- [Core Features First](./core-features-first-when.md) — Deciding at which coverage level (beginner/intermediate/advanced) an external dependency is finally permitted and how to introduce it.
- [Core Features First](./core-features-first-implementation-by-level.md) — Shows how core-features-first applies concretely across beginner, intermediate, and advanced coverage levels.
- [Core Features First](./core-features-first-java-reference-and-validation.md) — Uses the Java by-example tutorial as a worked reference for core-features-first, and lists the checker agent's validation criteria.
- [Core Features First](./core-features-first-comparison-json-and-state.md) — You need worked PASS/FAIL comparison snippets for teaching JSON processing or React state management progressively.
- [Core Features First](./core-features-first-comparison-http-di-and-integration.md) — You need worked PASS/FAIL comparison snippets for teaching HTTP clients or dependency injection progressively, or how this principle relates to other conventions.
- [Example Structure](./example-structure-explanation-and-diagram.md) — Writing the brief explanation or diagram portion of an example, or when you need the annotation density requirement before writing annotated code.
- [Example Structure](./example-structure-annotated-code-reference.md) — A production-quality reference example of heavily annotated code with measured density, plus the required annotation and code-organization checklists.
- [Example Structure](./example-structure-takeaway-and-why-it-matters.md) — Writing the closing Key Takeaway or Why It Matters sections of an example, or checking their length and content requirements.
- [Complete Example Structure (Production Reference)](./complete-example-structure-reference.md) — You need a single complete worked example showing all five parts assembled together, to model a new example against.
- [Self-Containment Rules by Level](./self-containment-rules-by-level.md) — Deciding how much a given example may assume from earlier examples, or when checking whether a cross-reference is acceptable.
- [Self-Containment Rules](./per-example-annotation-density-measurement.md) — Validating or creating example content, to confirm density must be checked per example and not averaged across a file.
- [Self-Containment Rules](./where-to-place-extensive-explanations.md) — The split between what belongs inside code-block annotations (WHAT) versus markdown text sections (WHY), with anti-pattern and correct-pattern examples.
- [Annotation Patterns Reference](./annotation-patterns-reference.md) — Reference patterns for annotating output, state changes, collections, and concurrency using the `// =>` notation.
- [Mermaid Diagram Guidelines](./mermaid-diagram-guidelines.md) — Deciding whether an example needs a diagram, which diagram type to use, or which colors are permitted.
- [Coverage Progression by Level](./coverage-progression-by-level.md) — Deciding which topics belong in the beginner, intermediate, or advanced level of a by-example tutorial.
- [File Naming and Organization](./file-naming-and-directory-structure.md) — Scaffolding a new by-example tutorial's directory/files, or when writing the Examples by Level bullet list on overview.md.
- [Examples-by-Level Section](./examples-by-level-slug-algorithm-and-numbering.md) — Details the github-slugger algorithm for anchor generation, why the Examples by Level section is required, a worked snippet, and the example numbering scheme.
- [Frontmatter Requirements and Quality Checklist](./frontmatter-requirements-and-quality-checklist.md) — Publishing by-example content, to confirm frontmatter is complete and every quality checklist item is satisfied.
- [Quality Checklist](./quality-checklist-educational-value-diagrams-structure.md) — Continues the pre-publish quality checklist with the educational value, diagrams, and structure sections.
- [Validation and Enforcement, and Relationship to Other Tutorial Types](./validation-enforcement-and-relationship-to-other-types.md) — What the checker agent automatically validates and production validation results, the quality-gate workflow, and how by-example relates to other tutorial types.
- [Cross-Language Consistency, Standards Summary, and Principles](./cross-language-consistency-and-standards-summary.md) — What must stay consistent vs vary across languages, summarizes the production-validated numeric standards, and lists the principles this convention implements.
- [Scope and Related References](./scope-and-related-references.md) — What by-example convention covers and does not cover, and links to related documentation, agents, workflows, and agent skills.
- [Multiple Code Blocks Pattern](./multiple-code-blocks-pattern-structure-and-anti-pattern.md) — The multiple-code-blocks pattern for comparisons, its structure and benefits, and the anti-pattern of cramming comparisons into a single over-commented block.
- [Multiple Code Blocks Pattern](./multiple-code-blocks-correct-pattern.md) — You need a concrete worked example of the correct multiple-code-blocks pattern to model a comparison example against.
- [Multiple Code Blocks Pattern](./multiple-code-blocks-when-to-split.md) — Reviewing a single code block that mixes languages, alternatives, or excessive comparison comments, to decide whether it must be split.
- [Multiple Code Blocks Pattern](./multiple-code-blocks-usage-and-density-measurement.md) — Deciding whether an example needs multiple code blocks, how to slot them into the five-part format, or how to measure density across blocks.
