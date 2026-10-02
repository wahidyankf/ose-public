---
description: Establishes the relationship between docs/explanation/programming-languages/ repository-specific style guides and ayokoding-www educational content
when_to_use: Read this when deciding whether new programming-language content belongs in a docs/explanation/ style guide or in ayokoding-www educational content.
---

# Programming Language Documentation Separation Convention

This convention establishes the clear separation between **repository-specific programming language style guides** in `docs/explanation/software-engineering/programming-languages/` and **educational programming language content** in ayokoding-www. It prevents duplication, defines scope boundaries, and ensures prerequisite knowledge relationships.

## In This Convention

- [Principles, Purpose, and Scope](./programming-language-docs-separation/principles-purpose-and-scope.md) — why this convention exists and what it covers versus excludes
- [Style Guides vs. Educational Content](./programming-language-docs-separation/content-separation-rules-style-guides-vs-educational-content.md) — Rule 1 and Rule 2: what belongs where
- [Rule 3: Explicit Prerequisite Knowledge Statements](./programming-language-docs-separation/rule-3-prerequisite-knowledge-statements.md) — the required README prerequisite template
- [No Duplication and Cross-Referencing](./programming-language-docs-separation/content-separation-rules-no-duplication-and-cross-referencing.md) — Rule 4 and Rule 5: avoiding duplication and required linking
- [Scope for All Languages and Alignment with SE Principles](./programming-language-docs-separation/scope-for-all-languages-and-alignment-with-se-principles.md) — applies to every language; how style guides align with the five SE principles
- [Example 1: Rust — Correct Separation](./programming-language-docs-separation/example-rust.md) — A worked example contrasting an ayokoding-www By Example variables lesson with the corresponding docs/explanation/ OSE Platform...
- [Example 2: TypeScript — Correct Separation](./programming-language-docs-separation/example-typescript.md) — A worked example contrasting an ayokoding-www generic error-handling lesson with the corresponding docs/explanation/ OSE Platform domain...
- [Example 3: F# — Correct Separation](./programming-language-docs-separation/example-fsharp.md) — A worked example contrasting an ayokoding-www Option-for-null-safety lesson with the corresponding docs/explanation/ OSE Platform mandatory-Option-usage rule
- [Common Mistakes to Avoid](./programming-language-docs-separation/common-mistakes-to-avoid.md) — three worked FAIL/PASS pairs
- [Validation Checklist, Related Conventions, and References](./programming-language-docs-separation/validation-checklist-related-conventions-and-references.md) — Pre-publish checklists for both docs/explanation/ style guides and ayokoding-www educational content, plus related-convention and platform-documentation references

## Agents

**Makers**:

- `docs-maker` - Creates style guide content in docs/explanation/ following this convention
- `apps-ayokoding-www-general-maker` - Creates educational content in ayokoding-www following this convention
- `apps-ayokoding-www-by-example-maker` - Creates by-example tutorials following separation rules

**Checkers**:

- `docs-checker` - Validates style guides follow this convention (prerequisite statements, no duplication)
- `content-checker` - Validates educational content scope (no OSE Platform-specific content)
- `content-checker` - Validates factual correctness of educational content

**Fixers**:

- `docs-fixer` - Fixes style guide violations (adds missing prerequisite statements, removes duplicated content)
- `content-fixer` - Fixes educational content violations (removes OSE Platform-specific content)

---

**Scope**: Every language with a style guide under `docs/explanation/software-engineering/programming-languages/` (today TypeScript, Rust, F#) and every language AyoKoding teaches. Read those two indexes rather than a fixed list here.
**Maintainers**: Repository Governance Team
