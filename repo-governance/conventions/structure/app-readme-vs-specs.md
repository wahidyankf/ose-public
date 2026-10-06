---
description: Defines what content lives in app/infra READMEs vs specs/, the logical-owner-corpus spec tree shape, and the PM-readability contract for specs/.
when_to_use: Use when deciding whether content belongs in an app README or in its specs/ tree, or when shaping a specs/apps/ tree.
---

# App README vs Specs Convention

App READMEs drift. They accumulate routes tables, architecture diagrams, bounded-context narratives, and API endpoint listings — content that describes what a system does rather than how to run it locally. This drift makes READMEs long, makes specifications hard to find, and forces engineers to maintain the same information in two places.

This convention draws a hard boundary. App and infra READMEs contain only dev-runtime content. Everything describing system behaviour, architecture, contracts, or design intent lives in `specs/apps/<app-family>/` as one logical owner corpus per deployed surface. Both audiences — engineers and Technical Product/Project Managers — benefit from knowing exactly where to look.

**Status**: Pilot — initial issue. Refinements are recorded in the Validation and Refinement
Log, indexed below.

## Children

- [Principles Implemented/Respected](./app-readme-vs-specs/principles.md) — the core principles this convention implements.
- [Purpose and Scope](./app-readme-vs-specs/purpose-and-scope.md) — the three decisions this convention governs and what it does/does not cover.
- [Standard 1 — Content Split Rule: Category A (Dev-Runtime)](./app-readme-vs-specs/standard-1-category-a-dev-runtime.md) — content that stays in the README.
- [Standard 1 — Content Split Rule: Category B, and Applying the Rule](./app-readme-vs-specs/standard-1-category-b-and-applying-the-rule.md) — content that moves to specs/, and the three-question classification test.
- [Standard 2 and 3 — Required/Forbidden Sections, and Line-Count Caps](./app-readme-vs-specs/standard-2-and-3.md) — required and forbidden README headings, plus hard line-count caps.
- [Standard 4 — Spec Tree Shape: Canonical Layout and Folder Purposes](./app-readme-vs-specs/standard-4-canonical-layout-and-folder-purposes.md) — the corpus tree diagram and why each entry sits where it does.
- [Standard 4 — Spec Tree Shape: Per-Surface Variants, Creation Rules, and Migration](./app-readme-vs-specs/standard-4-variants-creation-rules-and-migration.md) — how the tree varies by surface profile, plus the five-folder migration path.
- [Standard 5 — PM-Readability Contract (Glossary)](./app-readme-vs-specs/standard-5-pm-readability-glossary.md) — which terms need glossing on first use.
- [Standard 5 — PM-Readability Contract (Rules 1-6)](./app-readme-vs-specs/standard-5-pm-readability-rules.md) — the six authoring rules for PM-readable specs files.
- [Standard 6 and 7 — BDD/Contracts Adoption, and Cross-Link Integrity](./app-readme-vs-specs/standard-6-and-7.md) — adoption expectations by surface profile and app, plus README-to-specs navigation requirements.
- [Examples: README Trim and PM-Readable Header](./app-readme-vs-specs/examples-readme-trim-and-pm-readable-header.md) — worked before/after examples of a README trim and a PM-readable spec header.
- [Example: Spec Tree Migration](./app-readme-vs-specs/examples-spec-tree-migration.md) — a worked five-folder-to-corpus migration example and checklist.
- [Validation and Refinement Log](./app-readme-vs-specs/validation-and-refinement-log.md) — review-owned structural and semantic enforcement checks, and the convention's change history.

## Related

- [Specs Directory Structure Convention](../structure/specs-directory-structure.md) — canonical path patterns and domain subdirectory rules within the `behaviour/` tree
- [README Quality Convention](../writing/readme-quality.md) — README writing quality: voice, scannability, and engagement standards
- [Acceptance Criteria Convention](../../development/infra/acceptance-criteria.md) — Gherkin writing standards for feature files
- [Behaviour-Driven Development](../../development/behaviour-driven-development.md) — mandatory Unit proof and boundary-applicable Integration/E2E adapters consuming Gherkin specs
- [Repository Governance Architecture](../../repository-governance-architecture.md) — six-layer governance hierarchy
